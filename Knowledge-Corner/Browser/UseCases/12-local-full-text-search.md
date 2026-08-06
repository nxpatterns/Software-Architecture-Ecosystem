# Use Case 12: Local Full-Text Search Over Large Datasets

"Search" makes most teams draw a server, an API, and a bill that grows with every keystroke. That's the lazy default. For notes, logs, catalogs, and manuals already on the device, the browser can index and search locally with nothing leaving the machine at all.

The hard part was never matching words. It's moving a large index off the main thread, persisting it safely, staying inside opaque quotas, and not mistaking a WASM demo on your own laptop for a cross-browser storage architecture.

## Why 500 Rows and 500,000 Documents Are Different Species

A 500-row filter is a `.filter()` call. A 500,000-document offline search engine is not, and the difference shows up exactly where startup cost, tokenization, worker messaging, durable storage, quota failures, and multi-tab locking decide whether the feature feels native or freezes after the user types three letters.

## The User Story, Stripped of Domain

- download or build a sizeable local collection,
- search its text with zero server round trip,
- keep searching offline or on a bad connection,
- see ranked, highlighted results as they type,
- close and reopen the browser without rebuilding from zero,
- update or remove local content,
- know when the device is genuinely out of room.

Personal notes, product catalogs, diagnostic logs, an offline reference library — same architecture: data, index, worker, durable local store.

## Core Browser Technologies

| API | Job | Reference |
|---|---|---|
| IndexedDB | Durable, transactional storage for documents and index segments | [MDN](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API) |
| Origin Private File System (OPFS) | Origin-scoped private file storage for larger database files | [MDN](https://developer.mozilla.org/en-US/docs/Web/API/File_System_API/Origin_private_file_system) |
| `FileSystemSyncAccessHandle` | Synchronous OPFS I/O inside a Dedicated Worker — SQLite's natural fit | [MDN](https://developer.mozilla.org/en-US/docs/Web/API/FileSystemSyncAccessHandle) |
| Web Workers | Isolate tokenization, indexing, ranking, WASM from the UI thread | [MDN](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API) |
| WebAssembly | A compiled search engine or SQLite+FTS instead of reinventing a database in JS out of optimism | [MDN](https://developer.mozilla.org/en-US/docs/WebAssembly) |
| `StorageManager` | `estimate()`, `persist()`, and handling the quota failure that eventually arrives | [MDN](https://developer.mozilla.org/en-US/docs/Web/API/StorageManager) |
| BroadcastChannel / Web Locks | Coordinate imports and a single writer across tabs | [BroadcastChannel (MDN)](https://developer.mozilla.org/en-US/docs/Web/API/BroadcastChannel), [Web Locks API (MDN)](https://developer.mozilla.org/en-US/docs/Web/API/Web_Locks_API) |

## The Browser Reality Check

IndexedDB gets you durable local data. OPFS plus a Worker gets you database-shaped performance. Quotas get to veto both, on every platform.

Chromium is the strongest path for a Worker-backed OPFS database — the sync access handle is deliberately scoped to Dedicated Workers, built for exactly this kind of large file update.<sup>[1]</sup> Its per-origin ceiling can reach up to 60% of total disk, which is a quota calculation, not a promise of actual free space.<sup>[2]</sup>

Firefox has had OPFS since version 111.<sup>[3]</sup> Its best-effort quota caps at the smaller of 10% of disk or 10 GiB per eTLD+1 group — persistent storage has its own separate limits.<sup>[2]</sup>

Safari made OPFS available from macOS 12.2, including the Worker-only sync access handle.<sup>[4]</sup> The async API is still the main-thread path — put the engine in a Dedicated Worker and make the init/progress UI unglamorous but honest.

**iOS has two traps stacked on top of each other.** OPFS has existed since iOS 15.2, but WebKit's own documentation flags it as unavailable in Safari Private Browsing mode — treat private mode as a separate capability test, not a smaller quota tier of the same thing.<sup>[4]</sup> And from macOS 14/iOS 17, a regular browser origin gets roughly 20% of disk while a Home Screen/Dock web app can get roughly 60%, with its own overall ceiling on top.<sup>[2]</sup> Two different apps, two different storage budgets, same origin.

## What Breaks First

- Building the index on the main thread and calling the resulting freeze "initialization."
- Storing a 2 GB corpus because `estimate()` looked generous on one developer laptop.
- Treating best-effort storage as a backup strategy. It was never that, and it says so in the name.
- Opening the same OPFS-backed SQLite database from two tabs and discovering the exclusive file lock live, during a customer demo.
- Sending every document body across `postMessage()` on every keystroke instead of keeping the index resident inside the Worker where it belongs.
- Re-indexing the entire corpus after a single document edit because incremental deletion got left for "later."
- Assuming WebAssembly means identical speed everywhere. WASM is portable — startup, Worker scheduling, disk I/O, quota headroom, and raw CPU still belong to the specific browser and device.
- Shipping the SQLite OPFS VFS to older Safari — SQLite's own documentation calls Safari versions below 17 incompatible with it.<sup>[5]</sup>

The index is local. The performance budget is still painfully, physically real.

## Minimal Technical Blueprint

```javascript
// Inside the Dedicated Worker — the index never leaves this scope
let syncHandle;

async function openIndex() {
  const root = await navigator.storage.getDirectory();
  const fileHandle = await root.getFileHandle('search.db', { create: true });
  syncHandle = await fileHandle.createSyncAccessHandle(); // Worker-only, sync
}

self.onmessage = ({ data }) => {
  const results = queryIndex(syncHandle, data.query); // compact records back
  self.postMessage({ results }); // never the whole corpus, ever
};
```

1. Define the offline corpus boundary and storage budget before importing anything: document count, raw bytes, index bytes, preview cache, and a reserve for updates.
2. On startup, call `estimate()` and log actual usage; request `persist()` only when the collection genuinely earns it.
3. Store source documents and import metadata in IndexedDB so every import is resumable, inspectable, independently versioned.
4. Start a Dedicated Worker owning tokenization, index construction, query execution, ranking, and snippets. The UI sends a query and gets back compact results — never a corpus boomerang.
5. IndexedDB-backed inverted index for the broadly compatible baseline; SQLite/WASM or a binary index in OPFS for the enhanced path.
6. If using OPFS sync I/O, open `createSyncAccessHandle()` only inside that Dedicated Worker, flush predictable checkpoints, close it when the task ends.
7. Serialize writers across tabs with a lock or coordinator; let readers use a versioned snapshot instead of racing an index rebuild.
8. Index in batches, checkpoint after each, expose import progress with a real cancel/retry path.
9. Benchmark cold start, first query, repeated query, bulk import, update, and deletion on every target browser *and* a real mobile device before picking a default backend.

## Compatibility Strategy

**Baseline:** IndexedDB storing the corpus and a compact JS/Worker inverted index; cap corpus size, search in batches, let users remove downloaded data. Not a toy — the correct answer for datasets that don't deserve a portable database engine.

**Enhanced:** a Dedicated Worker running OPFS plus a sync access handle for SQLite/WASM or another byte-oriented index. WebAssembly itself is well-established, but test the exact engine and VFS — a demo carrying over cleanly is not a guarantee.

## Security and Compliance

Local doesn't mean harmless. Notes, logs, search terms, and snippets can be sensitive even when they never leave the origin. Encrypt payloads before writing if the threat model includes another user on the same unlocked device — browser storage is not device security. Provide a real "remove offline data" and logout path covering index files, raw documents, previews, and worker caches, all of it. Never present persistence as a retention guarantee — browser quota policy and the user's own "clear data" button can both remove stored data at any time.<sup>[2]</sup> Keep imports and search local by default; make any cloud sync a separately explained, separately consented choice.

## Test Matrix You Actually Need

- Desktop Chrome/Edge: large import, cold reload, repeated query, update, second-tab-open against the real OPFS database.
- Firefox: IndexedDB baseline and OPFS-enhanced path, including an actual quota failure, not just the roomy developer profile.
- Safari macOS: Worker startup, OPFS init, a long import, index recovery after closing the tab mid-batch.
- Android real device, mid-range: no network, low free storage, app-switch mid-index, a corpus large enough to actually hurt.
- iOS real device: regular browsing and Private Browsing as genuinely separate tests, plus a Home Screen web app if the product supports one.
- Storage pressure: fill quota deliberately, verify `QuotaExceededError` handling, confirm source documents and checkpoints stay consistent through it.
- Performance: cold start, first query, p95 query, bulk import, incremental update — recorded separately for Chromium, Firefox, and Safari, not averaged into one comforting number.

A benchmark that runs once on a plugged-in desktop with an empty profile measured optimism. Not offline search.

## Decision Summary

Use this when users repeatedly search a sizeable local corpus and server latency or connectivity genuinely isn't acceptable, when the dataset can be safely downloaded or created on-device, and when the product can fund storage lifecycle, worker, and multi-tab engineering as real line items.

Skip it when the corpus is small enough for an in-memory filter, when results must reflect fresh server-only data or org-wide access control on every query, or when locally retained content is simply too sensitive for the device and deployment model in play.

Search without a server request, yes. Serverless operations, no — you just moved some of them into the browser, and they still need owning.

---

[1]: `FileSystemSyncAccessHandle` scope, [MDN](https://developer.mozilla.org/en-US/docs/Web/API/FileSystemSyncAccessHandle).
[2]: Storage quota and eviction criteria across browsers, [MDN](https://developer.mozilla.org/en-US/docs/Web/API/Storage_API/Storage_quotas_and_eviction_criteria).
[3]: Firefox 111 OPFS availability, [Mozilla dev-platform](https://groups.google.com/a/mozilla.org/g/dev-platform/c/dsRxP4liTek).
[4]: Safari OPFS availability and Private Browsing limitation, [WebKit Blog](https://webkit.org/blog/12257/the-file-system-access-api-with-origin-private-file-system/).
[5]: SQLite OPFS VFS Safari version requirement, [SQLite WASM docs](https://sqlite.org/wasm/doc/trunk/persistence.md).
