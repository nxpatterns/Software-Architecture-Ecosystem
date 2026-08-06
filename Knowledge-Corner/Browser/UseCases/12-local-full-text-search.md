# Use Case 12: Local Full-Text Search Over Large Datasets

Most teams hear "search" and immediately draw a server, an API, and a bill that grows with every keystroke.
That is the lazy default. For notes, logs, catalogs, manuals, and field datasets already on the device, the
browser can index and search locally with no request leaving the machine.

The hard part is not matching words. The hard part is moving a large index off the main thread, persisting it
safely, staying inside opaque browser quotas, and not mistaking a WASM demo for a cross-browser storage
architecture.

## Why this is a good next "hard topic"

Because a 500-row filter is a `.filter()` call and a 500,000-document offline search engine is not. Once the
index is large, startup cost, tokenization, worker messaging, durable storage, quota failures, multi-tab
locking, and browser-specific file I/O decide whether the feature feels native or freezes while the user types
three letters.

## User Story (Abstracted)

A user can:

- download or create a sizeable local collection of documents or records,
- search its text without a server round trip,
- keep searching while offline or on a poor connection,
- see results ranked and highlighted as they type,
- close and reopen the browser without rebuilding everything from zero,
- update or remove local content,
- and understand when the device no longer has room for the dataset.

We do not care which corpus. Could be personal notes, product catalogues, diagnostic logs, documentation,
incident history, or an offline reference library. Same architecture: data, index, worker, durable local
backing store.

## Core Browser Technologies

- `IndexedDB`: durable, transactional browser storage for documents, metadata, index segments, import
  checkpoints, and a baseline persistence option.
- `Origin Private File System` (OPFS): origin-scoped private file storage for larger database files and
  byte-oriented indexes.
- `FileSystemSyncAccessHandle`: synchronous read/write handle for an OPFS file inside a Dedicated Worker; a
  useful fit for SQLite-style file I/O.
- `Web Workers`: isolate tokenization, indexing, ranking, snippets, and WASM execution from the UI thread.
- `WebAssembly` (optional): runs a compiled search engine or SQLite with FTS, rather than reimplementing a
  database in JavaScript out of optimism.
- `SQLite compiled to WASM` (optional): provides transactions, query planning, and full-text search when its
  database file is backed by a compatible VFS.
- `StorageManager` (`navigator.storage.estimate()` / `.persist()`): measure space, request persistence where
  justified, and handle quota failure.
- `BroadcastChannel` or `Web Locks API` (recommended): coordinate imports, re-indexing, and a single writer
  across tabs.

## Browser Reality Check

### Desktop

- Chromium (Chrome, Edge, Arc): the strongest path for a Worker-backed OPFS database. A sync access handle is
  deliberately limited to Dedicated Workers and is intended for large file updates such as SQLite
  modifications ([MDN](https://developer.mozilla.org/en-US/docs/Web/API/FileSystemSyncAccessHandle)).
  Chromium's per-origin storage ceiling can be up to 60% of total disk, but that is a quota calculation, not a
  promise of free space
  ([MDN](https://developer.mozilla.org/en-US/docs/Web/API/Storage_API/Storage_quotas_and_eviction_criteria)).
- Firefox: OPFS has been available since Firefox 111 ([Mozilla developer
  platform](https://groups.google.com/a/mozilla.org/g/dev-platform/c/dsRxP4liTek)). Its best-effort quota is
  capped by the smaller of 10% of disk or 10 GiB for the eTLD+1 group; persistent storage has different limits
  ([MDN](https://developer.mozilla.org/en-US/docs/Web/API/Storage_API/Storage_quotas_and_eviction_criteria)).
- Safari (macOS): WebKit made OPFS available from macOS 12.2, including the Worker-only synchronous access
  handle
  ([WebKit](https://webkit.org/blog/12257/the-file-system-access-api-with-origin-private-file-system/)). The
  async API is still the main-thread path. Put the search engine in a Dedicated Worker and make its
  initialization/progress UI unglamorous but real.

### Mobile

- Android Chromium: feature-detect the same Worker + OPFS route, then reduce default corpus size and batch
  length for weaker CPUs and tighter free disk. Chrome for Android is listed as supporting OPFS
  ([caniuse](https://caniuse.com/wf-origin-private-file-system)); a large import can still run into quota or
  process death on an actual phone.
- iOS Safari / WebKit-based browsers: OPFS has been available from iOS 15.2 according to WebKit
  ([WebKit](https://webkit.org/blog/12257/the-file-system-access-api-with-origin-private-file-system/)), but
  storage is not an entitlement.
  - WebKit's implementation documentation specifically flags OPFS as unavailable in Safari Private Browsing
    mode
    ([WebKit](https://webkit.org/blog/12257/the-file-system-access-api-with-origin-private-file-system/)).
    Treat private mode as a separate capability test, not a smaller quota tier.
  - Safari's quota varies by context; from macOS 14/iOS 17, a browser origin is generally allocated about 20%
    of disk, while a Home Screen/Dock web app can receive about 60%, with overall limits too
    ([MDN](https://developer.mozilla.org/en-US/docs/Web/API/Storage_API/Storage_quotas_and_eviction_criteria)).

Short version: IndexedDB gets you durable local data. OPFS plus a Worker gets you database-shaped performance.
Quotas get to veto both.

## What Usually Breaks First

- Building the full-text index on the main thread and calling the resulting freeze "initialization."
- Storing a 2 GB corpus because `navigator.storage.estimate()` looked generous on one developer laptop.
- Treating best-effort storage as a backup strategy. It is not.
- Opening the same OPFS-backed SQLite database from two tabs and discovering the exclusive file lock during a
  customer demo.
- Sending every document body across `postMessage()` for every keystroke instead of retaining the index inside
  the Worker.
- Re-indexing the whole corpus after a one-document edit because incremental deletion was left for later.
- Assuming WebAssembly means identical speed everywhere. WebAssembly is portable, but startup, Worker
  scheduling, disk I/O, quota headroom, and CPU still belong to the browser and device.
- Supporting old Safari with the same SQLite OPFS VFS: SQLite's own current documentation calls Safari
  versions below 17 incompatible with that VFS ([SQLite](https://sqlite.org/wasm/doc/trunk/persistence.md)).

The index is local. The performance budget is still painfully physical.

## Minimal Technical Blueprint

1. Define the offline corpus boundary and a storage budget before importing: document count, raw bytes, index
   bytes, preview cache, and a reserve for updates.
2. On startup, call `navigator.storage.estimate()` and record actual usage; request
   `navigator.storage.persist()` only when the collection is important enough to justify it.
3. Store source documents and import metadata in IndexedDB so every import is resumable, inspectable, and
   independently versioned.
4. Start a Dedicated Worker that owns tokenization, index construction, query execution, ranking, and
   snippets. The UI sends a query and gets compact result records back, not an entire corpus boomerang.
5. Use an IndexedDB-backed inverted index for the broadly compatible path, or put an SQLite/WASM database or
   binary index in OPFS for the enhanced path.
6. If using OPFS sync I/O, open `createSyncAccessHandle()` only inside that Dedicated Worker, flush
   predictable checkpoints, and close/release it when the worker or task stops.
7. Serialize writers across tabs with a lock or coordinator; let readers use a versioned snapshot rather than
   racing an index rebuild.
8. Index in batches, persist a checkpoint after each batch, and expose import progress plus a cancel/retry
   path.
9. Benchmark cold start, first query, repeated query, bulk import, update, and deletion on each target browser
   and real mobile device before choosing the default backend.

## Compatibility Strategy (Pragmatic)

- Baseline mode (all modern browsers): IndexedDB stores the corpus and a compact JavaScript/Worker inverted
  index; cap corpus size, search in batches, and allow the user to remove downloaded data.
- Enhanced mode (supporting browsers): a Dedicated Worker uses OPFS and a synchronous access handle for
  SQLite/WASM or another byte-oriented index. WebAssembly itself is established across browsers, but test the
  exact engine and VFS rather than assuming the native-looking demo carries over
  ([MDN](https://developer.mozilla.org/en-US/docs/WebAssembly)).

The baseline is not a toy. It is the answer for datasets that do not deserve a portable database engine.

## Security and Compliance Notes

- Local does not mean harmless. Notes, logs, search terms, and snippets can be sensitive even when they never
  leave the origin.
- Encrypt application payloads before writing them if the threat model requires protection from another user
  of the same unlocked device; browser storage is not a substitute for device security.
- Provide clear "remove offline data" and logout behavior, including index files, raw documents, previews, and
  worker caches.
- Do not present persistence as a retention guarantee. Browser quota and user clearing controls can still
  remove stored data
  ([MDN](https://developer.mozilla.org/en-US/docs/Web/API/Storage_API/Storage_quotas_and_eviction_criteria)).
- Keep imports and search local by default; make any cloud sync or telemetry a separately explained choice.

## Test Matrix You Actually Need

- Desktop Chrome/Edge: large import, cold reload, repeated query, update, and second-tab-open test against the
  real OPFS database.
- Firefox latest: IndexedDB baseline and OPFS-enhanced path, including a quota failure rather than just the
  roomy developer profile.
- Safari macOS latest: Worker startup, OPFS initialization, long import, and index recovery after closing the
  tab mid-batch.
- Android Chrome on a mid-range physical device: no network, low free storage, app switch during index
  construction, and a corpus large enough to hurt.
- iOS Safari on a physical phone: regular browsing and Private Browsing as separate tests, then a Home Screen
  web app if the product supports it.
- Storage pressure: fill available quota deliberately, verify `QuotaExceededError` handling, and prove that
  source documents and index checkpoints remain consistent.
- Performance: record cold start, first query, p95 query, bulk import, and incremental update separately for
  Chromium, Firefox, and Safari.

If the benchmark runs once on a plugged-in desktop with an empty profile, you measured optimism, not offline search.

## Decision Summary

Use this pattern when:
- users repeatedly search a sizeable local corpus and server latency or connectivity is unacceptable,
- the dataset can be downloaded, created, or retained safely on the device,
- the product can fund storage lifecycle, worker, and multi-tab engineering.

Avoid this pattern when:
- the corpus is small enough for an in-memory filter,
- the search result must use fresh server-only data or organization-wide access controls on every query,
- locally retained content is too sensitive for the device and deployment model.

Because yes, this is search without a server request. No, it is not serverless operations. You moved some of them into the browser.

## Next Logical Topic

After this, the best follow-up is: **Local AI-assisted retrieval without sending the corpus away**
(embeddings, vector indexes, model downloads, and why "offline AI" starts with storage, not demos).
