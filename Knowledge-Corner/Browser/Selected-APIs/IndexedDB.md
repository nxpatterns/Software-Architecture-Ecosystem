# IndexedDB Today (06.08.2026): The Database Nobody Asked For, Everybody Needs

Every browser has shipped a fully transactional, index-capable, asynchronous NoSQL database since roughly the Obama administration, and most web developers still reach for `localStorage` first, hit the 5 MB wall, panic, and only then remember IndexedDB exists. It's the database equivalent of the fire extinguisher behind glass in the office kitchen. Nobody looks at it until the toast is on fire.

Let's fix that. This is the state of IndexedDB as it stands today, not the state of IndexedDB as it stood when you last opened that one MDN tab in 2019 and never closed it.

---

## The Mental Model

IndexedDB is not a key-value store with delusions of grandeur. It's a proper transactional database, scoped per origin, that lives inside the browser and survives page reloads, tab closures, and (mostly) your users' rage-quitting.

The building blocks:

- **Database** — one per name, versioned. You bump the version number to run schema migrations.
- **Object store** — think "table," except records are JavaScript values (structured-clone-able ones: objects, arrays, `Blob`, `File`, `ArrayBuffer`, `Map`, `Set` — not functions, not DOM nodes).
- **Index** — a secondary lookup path into an object store, auto-maintained whenever the underlying record changes.
- **Transaction** — every read and write happens inside one. Transactions auto-commit when their microtask queue drains; you don't call `.commit()` unless you want to (more on that below).
- **Cursor** — how you walk a range of records without loading all of them into memory at once.

Everything is asynchronous by design, dispatched through `IDBRequest` objects firing `success` and `error` events, or wrapped in Promises if you're not into events from 2009[^events2009].

[^events2009]: The API predates Promises. It shows. `request.onsuccess = (event) => {...}` is technically correct and aesthetically a war crime. Everyone wraps it. More on that later.

---

## What's New

### `getAllRecords()` — finally, a sane batch read

For over a decade your options for bulk reading were: iterate a cursor one record at a time (correct, slow, chatty), or call `getAll()` / `getAllKeys()` separately and reconcile two arrays yourself (fast, but you lose the primary key when reading by index, and you can't page in descending order).

`getAllRecords()` fixes both problems in one method. It returns primary key, value, and — when called on an index — the index key, all in one pass, and it supports a `direction` option so you can finally paginate backwards without cursor gymnastics.

```javascript
const store = transaction.objectStore("photoTours");
const index = store.index("createdAt");

const { entries } = await index.getAllRecords({
  count: 50,
  direction: "prev", // newest first, no cursor required
});
```

The same `direction` option was retrofitted onto the older `getAll()` and `getAllKeys()`, so even code that doesn't adopt `getAllRecords()` gets a small upgrade for free — where it's supported.

**Where it's supported** is the catch: Chrome and Edge shipped it from version 141 (autumn 2025). Firefox has landed the implementation but hadn't marked it released as of this writing. Safari has committed to it as one of four flagship focus areas for Interop 2026, which in WebKit-speak means "we know, we know, it's coming, stop asking." Feature-detect with `'getAllRecords' in objectStore` and fall back to cursors. Don't ship it bare.

### Relaxed durability is now the default, everywhere

Every `readwrite` transaction has always had a durability trade-off nobody told you about: `strict` mode blocks the `complete` event until the OS confirms the write hit disk; `relaxed` mode fires `complete` as soon as the write is handed to the OS buffer, sacrificing a sliver of crash-safety for a genuinely large performance win — Chrome measured over 10x on small, frequent writes.

Firefox and Safari defaulted to `relaxed` from the start. Chrome stubbornly defaulted to `strict` until version 121 (early 2024), which is why "IndexedDB is slow" was conventional wisdom for years — it was slow, in one specific browser, for one specific configurable reason. All three engines now agree on `relaxed` as the default. You can still opt back into `strict` explicitly for the rare case where you genuinely cannot afford to lose the last write on a power failure — a migration routine deleting the old data store, for instance:

```javascript
const tx = db.transaction("criticalMigration", "readwrite", {
  durability: "strict",
});
```

For everything else — UI state, drafts, caches — leave it on the default and enjoy the speed you were already supposed to have.

### Storage Buckets — IndexedDB gets neighborhoods

The Storage Standard now defines **buckets**: named, independently governable slices of an origin's storage, each with its own persistence and eviction policy, each carrying its own `IDBFactory`. Instead of one shared IndexedDB instance per origin fighting for the same eviction priority, you can open a dedicated bucket for data that matters and a separate one for data that's cache-grade disposable.

```javascript
if ("storageBuckets" in navigator) {
  const renders = await navigator.storageBuckets.open("render-cache", {
    persisted: false,
    durability: "relaxed",
  });
  const idb = renders.indexedDB;
  const request = idb.open("thumbnails", 1);
}
```

There's a real performance angle too, not just tidiness: Chrome moved each IDB instance's backing store to its own sequence, so sharding heavy write workloads across buckets genuinely parallelizes instead of contending on one lock. This is Chrome/Edge territory for now. Firefox and Safari haven't committed to Storage Buckets, so treat this as a progressive enhancement, not a foundation.

---

## What's Deprecated, and What's Just Old

Nothing about IndexedDB is going away — no sunset notices, no "removal in 2027" panic. But there's baggage worth knowing so you can stop cargo-culting it into new code:

- **Vendor-prefixed globals** (`webkitIndexedDB`, `mozIndexedDB`, `msIndexedDB`) are dead. If you still have a feature-detection block checking for these, delete it — it's been unreachable code since roughly 2015 and it's not making anyone nostalgic.
- **The synchronous IndexedDB API** was specced once, implemented nowhere outside of experimental Worker builds, and formally removed from the spec years ago. If you find a tutorial mentioning it, it's older than most bootcamp graduates.
- **`IDBFactory.open()` without a version number** still technically works but is considered obsolete practice — the spec keeps it around "for some browsers" rather than recommending it. Always pass an explicit version.
- **The IndexedDB Observers proposal** — a native way to subscribe to database changes across tabs and workers — was prototyped, discussed for years, and never shipped anywhere. It's effectively abandoned. This is exactly the gap that libraries like Dexie and RxDB fill with their own cross-tab sync layers, and why "just add native observers" keeps not happening[^observers].
- **Safari's old private-browsing landmines** — IndexedDB used to throw or silently fail in Safari's private mode, and origins got evicted after a week of inactivity in ways that surprised everyone. Both issues are substantially better behaved in current Safari, but the eviction-after-inactivity behavior is a policy, not a bug, and it's still tighter than Chrome or Firefox. Don't treat IndexedDB as guaranteed long-term storage on Safari without checking `navigator.storage.persist()`.

[^observers]: I've watched this proposal get reopened, re-discussed, and re-shelved for the better part of a decade. At this point I suspect the IndexedDB Observers GitHub issue has more historical continuity than some nation-states.

---

## Where the Cracks Show: Support Matrix

| Feature | Chrome / Edge | Firefox | Safari |
|---|---|---|---|
| Core IndexedDB (stores, indexes, cursors, transactions) | Full | Full | Full |
| `getAllRecords()` + `direction` on `getAll`/`getAllKeys` | Yes (141+) | Landed, not yet released | Committed for Interop 2026, not shipped |
| Relaxed durability as default | Yes (121+) | Yes (always was) | Yes (always was) |
| Storage Buckets API | Yes | No | No |
| `IDBFactory.databases()` | Yes | Yes | Yes |

Treat this table as a photograph, not a promise. Feature-detect everything in the "new" section above; none of it is safe to assume.

---

## Use Case Examples

**1. Offline-first draft state for a heavy editing UI.** Picture something like a blur-region editor for photo tours: users drag ovals and rectangles around faces and license plates before a panorama goes live. Autosaving that draft state to a server on every mouse move is insane; losing it on an accidental tab close is worse. Stash the in-progress `BlurRegion[]` array in an IndexedDB object store keyed by session ID on every drag-end, and sync to the server on an interval or on explicit save. The browser crash becomes a non-event instead of a support ticket.

**2. Local cache for large binary media.** Panorama tiles, rendered thumbnails, video segments — anything that's expensive to refetch and safe to evict. This is exactly the case for a dedicated Storage Bucket with `persisted: false`: let the browser reclaim it under pressure without touching your "real" data, and use `relaxed` durability since losing a cached thumbnail costs you a re-render, not a user's work.

**3. Paginated history or activity log.** A render queue, an audit trail, a list of recent tours — anything the user scrolls through newest-first. `getAllRecords()` with `direction: "prev"` on a `createdAt` index gets you a page of results, primary keys included, in one round trip, where it's supported; a cursor-based fallback covers Firefox and Safari in the meantime.

**4. Structured querying without a server round trip.** Multi-field filtering — tours by status *and* customer, sorted by last-modified — is what compound indexes are for. Define the index across the fields you actually filter on, and let IndexedDB do the sorting and range-scanning natively instead of pulling everything into memory and filtering in JavaScript.

---

## Where This Is Going

IndexedDB isn't being replaced. It's being specialized around. The **Origin Private File System (OPFS)** has taken over the "I need to write large binary blobs fast, synchronously, from a Worker" niche — think WASM-backed SQLite databases, video editing buffers, anything closer to a filesystem than a document store. IndexedDB remains the better fit for structured, queryable, indexed application data. Expect to see the two used side by side rather than one displacing the other: OPFS for the raw bytes, IndexedDB for the metadata that describes them.

Storage Buckets are the direction of travel for storage policy generally — the Storage Standard is explicitly positioning buckets as the unit for quota, persistence, and eviction decisions across IndexedDB, Cache API, and whatever gets invented next. Once Firefox and Safari commit, expect "just open a bucket" to become as unremarkable as opening a database is today.

And the wrapper libraries — Dexie, `idb`, RxDB — aren't going anywhere either, cross-tab observers or not. The raw API's callback-and-event ergonomics haven't fundamentally changed since 2010, and nothing on the standards track is proposing to change that. If anything, the new methods are being designed *for* library authors to build cleaner abstractions on top of, not to make the raw API pleasant on its own.

**Bottom line:** IndexedDB in 2026 is faster by default, gained a genuinely useful batch-read method that half the browser market can't use yet, and is quietly growing a neighborhood system nobody outside Chrome has moved into. Feature-detect, keep your cursor fallbacks warm, and stop checking for `webkitIndexedDB`. It's not coming back.
