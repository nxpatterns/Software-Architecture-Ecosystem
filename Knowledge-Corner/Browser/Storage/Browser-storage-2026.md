# Browser Storage in 2026: The Complete Field Guide

*Status: 6 August 2026. English. Opinions included at no extra charge.*

Your browser is a database engine, a filesystem, a key-value store, and a small legal minefield, all shipped for free to every user you have. Most developers use ten percent of it. Usually the wrong ten percent.

This document covers everything that exists today: the classics, the new machinery, the experimental stuff, the sync layer on top, and the things that will silently delete your data while you sleep. Not every chapter goes deep. Every chapter tells you enough to know whether *you* need to go deep.

One rule upfront, because it decides half of your architecture questions before they're asked: **everything below the sync layer is a native browser API. Free. No license. No vendor. Forever.** The moment you add a third-party sync framework, you're back in license-reading territory. We'll get there in chapter 12.

## 1. The Graveyard

Two corpses worth a short visit, because both died for instructive reasons.

**AppCache** (Application Cache, the `manifest` attribute). Designed for offline web apps, delivered mostly pain. The API was so hostile that its own creators wrote apology posts. Removed from all browsers around 2020/21. Service Workers are the replacement, and this time the replacement is actually better.

**WebSQL.** SQLite in the browser, ten years too early. It died a standards death: the spec was effectively "whatever SQLite does", and a standard that says "see this one C library" is not a standard, it's a dependency with a W3C letterhead. Firefox never shipped it, Chromium removed it in 2024.

The lesson from both graves: single-implementation APIs die, and "offline" is a feature you build from primitives, not a checkbox. Keep that in mind when we reach the Chromium-only chapters later.

## 2. Cookies

The accountant of browser storage. Tiny, pedantic, and involved in every single transaction whether you want it or not.

Facts that matter:

Roughly 4 KB per cookie, a few hundred per domain. Sent to your server with **every request**. That last part is the point and the problem: cookies are the only storage the *server* can read and write (via `Set-Cookie`), which makes them the correct tool for exactly one job: session and authentication state, ideally as `HttpOnly; Secure; SameSite` server-side cookies that JavaScript can't touch.

Using cookies for application data in 2026 is like storing your furniture in the mailbox because the postman passes by anyway.

New-ish development: **CHIPS** (Cookies Having Independent Partitioned State, the `Partitioned` attribute). Third-party cookies in embedded contexts now get one separate cookie jar per top-level site. If you embed anything cross-site, this concerns you. More on partitioning in chapter 10, because it hits *all* storage, not just cookies.

## 3. Web Storage: localStorage and sessionStorage

The API everyone learns first and should use least.

- **localStorage**: ~5 MB per origin, string-only, survives restarts.
- **sessionStorage**: same API, per-tab, dies with the tab (survives a reload, though).

The dirty secret: both are **synchronous**. Every read and write blocks the main thread. For a 40-byte flag, nobody notices. For a 2 MB JSON blob, your users notice, they just don't know it's you.

Legitimate uses in 2026:

A random anonymous ID (`crypto.randomUUID()`), a theme preference, a "has seen onboarding" flag, a consent state. Small, hot, boring values.

Everything else belongs one floor up.

## 4. IndexedDB

The workhorse. Also, and I want to be precise here because the internet keeps getting this wrong: **not deprecated, not legacy, not "old school".** IndexedDB is the foundation that most of the shiny new libraries are standing on while calling it old.

What it is: an asynchronous, transactional object database. Object stores instead of tables, indexes for querying, versioned schemas via `onupgradeneeded`. It stores anything the structured-clone algorithm can carry, which includes Blobs, Files, TypedArrays and, notably, non-extractable `CryptoKey` objects (relevant in chapter 11).

What it is not: pleasant. The raw API was designed by people who apparently bill by the callback. Nobody writes raw IndexedDB in production. You use a wrapper:

| Wrapper | License | Character |
|---|---|---|
| `idb` (Jake Archibald) | MIT | Thin promise layer, zero magic, ~1 KB |
| Dexie.js | Apache-2.0 | Full query API, live queries, mature |
| localForage | MIT | The 2014 classic, maintenance mode, skip for new projects |

Capacity: browser-dependent, but think **gigabytes**, not megabytes. Ask `navigator.storage.estimate()` instead of trusting blog posts (including this one).

**When IndexedDB is the answer:** structured application data, offline queues, anything that outgrows a string flag but doesn't need byte-level file I/O or SQL. Which is, statistically, almost everything.

## 5. Cache API and Service Workers

Storage for HTTP itself. The Cache API stores `Request`/`Response` pairs; a Service Worker intercepts network calls and answers from that cache. Together they are the reason a web app can open in airplane mode.

Important distinction people blur constantly: this is for **assets and responses** (your JS bundles, images, API GET responses), not for application state. Your undo history does not belong in the Cache API. Your app shell does.

Service Workers can also use IndexedDB, which is how background sync patterns work: page writes to an outbox store, worker flushes it when the network returns.

## 6. OPFS: Origin Private File System

The genuinely new thing of this decade, and since it's been Baseline across all major engines since 2023, it now qualifies as boring. Boring is the highest compliment infrastructure can receive.

OPFS is a real, private, sandboxed filesystem per origin. Not the user's Documents folder: the user never sees these files, there is no permission prompt, they live inside the browser profile.

```js
const root = await navigator.storage.getDirectory();
const handle = await root.getFileHandle('history.bin', { create: true });
```

Why it exists: **byte-level random-access I/O**. Inside a dedicated Web Worker you get `createSyncAccessHandle()`, synchronous reads and writes straight into a file, no structured-clone tax, no transaction ceremony. Benchmarks put it around 3 to 4 times faster than IndexedDB for large binary data.

Use it when your data looks like *files*: large binaries, image caches, database files (next chapter), append-only logs. Don't use it when your data looks like *records*; that's IndexedDB's job, and the ergonomics will remind you of that quickly.

## 7. SQL in the Browser

Once WebSQL was buried, SQLite came back through the front door: compiled to WebAssembly, storing its database file in OPFS. This time without a standards committee in the blast radius.

The options, all free:

**Official SQLite Wasm** (Public Domain). The real SQLite, maintained by the SQLite team, OPFS persistence via sync access handles in a worker. If you want actual SQL with actual persistence, this is the reference answer.

**wa-sqlite** (MIT). Community build, pluggable VFS backends (OPFS or IndexedDB), popular as the engine underneath sync frameworks.

**sql.js** (MIT). The old in-memory build. Fine for "load a .sqlite file, query it, throw it away". No persistence story of its own.

**PGlite** (Apache-2.0). Postgres, not SQLite, compiled to Wasm, persists to IndexedDB or OPFS. Yes, a full Postgres in a browser tab. We live in remarkable times, most of them billable.

**DuckDB-Wasm** (MIT). Analytical column store in the browser. If you need to run aggregations over a million rows client-side, this is the tool, and also a sign your architecture meeting will be interesting.

Honest guidance: most apps do **not** need SQL in the browser. IndexedDB with an index or two covers the usual query patterns. Reach for Wasm-SQL when you have genuinely relational queries, existing SQL you want to reuse, or a sync engine that requires it.

## 8. File System Access API

Not to be confused with OPFS, although the spec authors did their best to guarantee the confusion by putting both in the same spec family.

This one is about the **user's real files**: `showOpenFilePicker()`, `showSaveFilePicker()`, `showDirectoryPicker()`. The user explicitly grants access, your web app reads and writes actual files on their disk. This is how browser-based editors (VS Code for the Web, Photoshop Web) open real project folders.

Support reality: the picker APIs are **Chromium-only**. Firefox and Safari ship the OPFS half of the spec but not the pickers, and neither has signaled intent to change that. If your feature depends on picking real files, you're building a Chromium feature with a fallback (`<input type="file">` plus download links), not a web feature.

## 9. Quota, Persistence, and the Storage Manager

The chapter nobody reads until production data disappears.

Default storage is **"best effort"**. Under disk pressure the browser evicts origins, typically least-recently-used first, without asking you or the user. Everything in this document lives under that sword unless you act.

The API:

```js
const { usage, quota } = await navigator.storage.estimate();
const granted = await navigator.storage.persist();
```

`persist()` asks the browser to move your origin from "best effort" to "persistent". Chromium decides via heuristics (installed PWA, engagement, notification permission), Firefox may ask the user, Safari implements the API surface but marches to its own drummer (next chapter). `persist()` returning `true` is a strong signal, not a notarized contract.

Quotas are generous these days, typically a percentage of free disk per origin, measured in gigabytes. But quotas are the ceiling; eviction is the floor, and the floor moves.

**Rule: if losing the data would hurt, call `persist()` at startup, check `estimate()` before large writes, and treat local storage as a cache of server truth wherever the product allows it.**

## 10. Storage Buckets API

The newest organ in the body, still growing. Instead of one storage pool per origin, you create named buckets, each with its own IndexedDB databases, Cache storage, and OPFS, each evictable **independently**:

```js
const drafts = await navigator.storageBuckets.open('drafts', { persisted: true });
const inbox  = await navigator.storageBuckets.open('inbox');
const db = await drafts.indexedDB.open('notes');
```

The pitch: mark your unsent drafts precious and your synced inbox cache expendable, and the browser evicts the cheap bucket first instead of nuking the origin wholesale.

The catch, and it's the WebSQL lesson knocking: **Chromium-only** (Chrome/Edge 122+), no implementation signal from Firefox or Safari, WICG draft status, and every policy you set (quota, persistence, expiration) is explicitly *advisory*. Roughly 70 percent global support means it can be an optimization layer, never your only strategy.

File under: worth watching, not worth betting the architecture on.

## 11. Partitioning: One User, Many Storage Universes

The single most underestimated change of recent years, and the one most likely to produce a bug report that reads like a ghost story.

All major browsers now partition storage by **top-level site**, not just by origin. Concretely: your page served from `app.example.com`, embedded as an iframe on `customer-a.com` and again on `customer-b.com`, gets **three completely separate storage buckets** (the two embeds plus direct visits). Same origin, same code, same user, three universes that never meet. localStorage, IndexedDB, OPFS, Cache, cookies (via CHIPS): all of it, partitioned.

Consequences:

If your product gets embedded (widgets, tours, players, anything iframe-shaped), a locally stored user ID or history will **not** follow the user across embedding sites. No storage API fixes this, because it isn't a bug, it's the anti-tracking design. If cross-context identity matters, the answer is an account and server-side truth, with local storage demoted to cache.

**The Safari extra: ITP.** Safari's Intelligent Tracking Prevention deletes *all* script-writable storage (localStorage, sessionStorage, IndexedDB, Service Worker registrations and caches) after **seven days of Safari use without user interaction** with your site. Home-screen web apps are exempt; `persist()` does not buy you a pardon. If your users are on iOS and visit monthly, plan as if local data has a seven-day shelf life, because it does.

The strategic summary of this chapter: **the browser is a cache with delusions of permanence. Architect accordingly.**

## 12. Encryption at Rest

First, the question before the tool: **against whom?** Encryption without a threat model is a ritual, not a control.

The tool itself is native and free: **Web Crypto (`SubtleCrypto`)**. AES-GCM for encryption, PBKDF2 or HKDF for key derivation (Argon2 is *not* built in; that needs a Wasm library). The ciphertext goes into IndexedDB or OPFS like any other bytes.

The entire difficulty is the key:

**Option A: passphrase-derived.** Key is derived from something the user knows, never stored. Real security, real UX cost: forgotten passphrase equals lost data, full stop, and now you're building recovery flows.

**Option B: non-extractable `CryptoKey` in IndexedDB.** The browser stores the key object marked `extractable: false`; it can be *used* but never exported. Protects against someone copying the browser profile off disk and reading it elsewhere. Protects against **nothing** running inside your own origin: XSS can simply call your own decrypt function, same as your app does.

**Option C: WebAuthn PRF.** Key material derived from a passkey, hardware-backed. Strongest story, newest support, most engineering. For most apps this is a flex, not a requirement.

And the unfashionable truth: data that never leaves the user's device is already isolated by the same-origin policy. If no concrete attacker survives contact with your threat model, skip the ceremony and spend the effort on not having XSS.

## 13. The Sync Layer: Local-First Frameworks

Everything above was plumbing. This is the floor where the money lives, in both senses: it's where products get their offline magic, and where licenses start having paragraphs.

The honest decision tree first, because the framework industry won't draw it for you:

1. **Append-only data, single user** (event logs, history lists): you need no framework. Each record has an ID, sync is "merge by ID". A fetch call and 100 lines of your own code.
2. **Mutable data, single user, rare conflicts**: last-write-wins over your own REST endpoint. Still no framework required.
3. **Multiple actors editing the same data concurrently** (collaboration, multi-device real-time): *now* you have the problem CRDTs and sync engines were built for. Now the machinery earns its complexity.

Most products live on floors 1 and 2 while shopping on floor 3. Resist.

The landscape, with the license column you should read twice:

| Tool | What it is | License |
|---|---|---|
| Dexie.js | IndexedDB wrapper + your own sync | Apache-2.0 (Dexie **Cloud** is the paid product; not required) |
| PouchDB | CouchDB-protocol replication | Apache-2.0, fully free, no paid tier exists |
| RxDB | Reactive local DB + replication | Core Apache-2.0; **OPFS adapter and premium storages are paid** for commercial use |
| Yjs | CRDT library | MIT, no paid tier |
| Automerge | CRDT library | MIT |
| ElectricSQL | Postgres sync engine | Apache-2.0 |
| PowerSync | Postgres/SQLite sync service | Client SDKs Apache-2.0; the **service** is source-available (FSL). Verify current terms before committing |
| Zero (Rocicorp) | Query-driven sync engine, successor to the sunset Replicache | Verify current license before committing |
| Triplit, InstantDB | Full-stack local-first databases | Open source, but **verify current server-side license terms** yourself |

The "verify" entries are deliberate. Sync-engine startups change licenses the way frontend frameworks change state managers, and a document dated today is historical fiction by next quarter. The four with boring, stable licensing stories: Dexie, PouchDB, Yjs, Automerge.[^disclosure]

## 14. Supporting Cast

Not storage, but you'll meet them the moment storage gets serious:

**Web Locks API.** Multiple tabs writing the same IndexedDB store is a race condition with a UI. `navigator.locks.request('outbox', fn)` gives you cross-tab mutual exclusion. Baseline everywhere.

**BroadcastChannel.** Tab A wrote something, tab B should update its view. One-line pub/sub between same-origin tabs. Also the standard way to announce "I am the leader tab now".

**Compression Streams.** Native gzip/deflate (`new CompressionStream('gzip')`). Storing large JSON histories? Compress before writing; 5:1 ratios on text are normal, and quota is finite.

**Shared Storage API.** Chromium's Privacy Sandbox construct: write from anywhere, read only inside restricted worklets. Built for ad-tech use cases (frequency capping, A/B assignment) under anti-tracking constraints. Listed here for completeness; if you need it, you already have a compliance department.

## 15. The Decision Table

| You are storing... | Use | Why |
|---|---|---|
| Session / auth | Server-set `HttpOnly` cookie | Only thing the server controls; XSS can't read it |
| A flag, an ID, a theme | localStorage | Small, hot, synchronous is fine |
| Per-tab wizard state | sessionStorage | Dies with the tab, by design |
| Structured app data, offline queues, drafts | IndexedDB (via `idb` or Dexie) | The default answer |
| Large binaries, DB files, append-logs | OPFS | Byte-level speed, real files |
| Relational queries client-side | SQLite Wasm on OPFS | Actual SQL, actually persisted |
| Offline assets / responses | Cache API + Service Worker | That's literally its job |
| User's real files on disk | File System Access API | Chromium-only; plan the fallback |
| Anything that must survive | ...plus `navigator.storage.persist()` | Best-effort is a polite word for disposable |
| Anything embedded cross-site | Server-side truth, local as cache | Partitioning makes local identity a mirage |

## 16. Three Patterns That Cover 90% of Real Apps

**The Outbox.** Events (feedback, errors, usage pings) go into one IndexedDB store with a `type` field. A flush job ships batches to the server and deletes on acknowledgment. Web Lock around the flush so ten tabs don't ship ten copies. This one pattern replaces three separate "we should track X" projects.

**The Undo Stack.** Lives in memory (array of states or commands). Persist to IndexedDB only if undo must survive a reload; persist to OPFS if the snapshots are heavy (canvas, images). No CRDTs: one user's own history has no concurrent editors, whatever the framework marketing implies.

**The Synced History.** Local IndexedDB as cache, server as truth, records immutable with client-generated IDs, sync = merge by ID. Free tier: local only. Paid tier: same code plus the endpoint. The upgrade path is a feature flag, not a rewrite.

## 17. The Gotcha Checklist

Before shipping anything from this document, answer these out loud:

1. Did you call `persist()` and check what it returned?
2. Do you handle `onupgradeneeded`, or will schema v2 greet old users with an exception?
3. Does anything break when storage is **empty again** (eviction, ITP, user clearing site data)? It will be, eventually.
4. Private/incognito mode: quotas shrink and everything vanishes at session end. Tested?
5. Embedded in an iframe anywhere? Then re-read chapter 11 and lower your expectations accordingly.
6. Are you writing multi-megabyte values to localStorage? Stop. That's a cry for help, and IndexedDB is the therapist.
7. Any third-party sync dependency: did you read the license *this quarter*, not last year?

## Closing Note

The platform quietly became excellent. A private filesystem, a transactional database, real SQLite, native crypto, cross-tab locking: all standard, all free, all shipped to every user already.

The browser will hold your data generously and delete it without sentiment. Build for both moods, and it's the best free infrastructure you'll ever get.

[^disclosure]: No business relationship with any project or company named in this document. They don't know I exist, which is the healthiest possible arrangement between an architect and a dependency.
