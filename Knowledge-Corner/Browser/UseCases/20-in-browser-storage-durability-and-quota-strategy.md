# Use Case 20: In-Browser Storage Durability and Quota Strategy

Offline-first ideas are easy to pitch. Offline-first data survival is not, and the gap between the two is exactly where this use case lives.

This covers how browser storage actually behaves under pressure: what survives, what gets evicted, what breaks in private mode, and how to recover without quietly blaming users for "unexpected cache clear events" that were entirely predictable from the spec.

## Why Teams Treat Storage Like a Tiny Trusted Database

It isn't one. Storage quotas are browser-dependent, eviction policies are implementation-specific, private modes can behave like polite amnesia, and mobile devices reclaim your data the instant the OS gets hungry for space — with zero obligation to ask first.

## The User Story, Stripped of Domain

- create data offline,
- leave, return later,
- find critical state intact,
- recover safely if partial data loss occurred,
- keep working with minimal friction either way.

Drafts, task queues, media staging, field notes — same architecture, different failure triggers depending on what the browser decided to evict that day.

## Core Browser Technologies

| API | Job | Reference |
|---|---|---|
| IndexedDB | Primary structured client persistence | [MDN](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API) |
| Cache Storage API | App shell and request/response caching | [MDN](https://developer.mozilla.org/en-US/docs/Web/API/Cache) |
| `localStorage`/`sessionStorage` | Lightweight signaling and tiny state only — never a database | [MDN](https://developer.mozilla.org/en-US/docs/Web/API/Web_Storage_API) |
| `StorageManager` (`estimate()`, `persist()`) | Quota insight and a persistence request, where supported | [MDN](https://developer.mozilla.org/en-US/docs/Web/API/StorageManager/persist) |
| Service Worker | Deterministic boot path and offline routing | [MDN – Service Worker API](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API) |
| File System Access API / OPFS | Heavier local file workflows where available | [MDN](https://developer.mozilla.org/en-US/docs/Web/API/File_System_API) |

## The Browser Reality Check

If your storage model has no recovery path, you don't have a storage model. You have hope, and hope doesn't survive a `QuotaExceededError`.

Chromium gives the strongest quota introspection and persistence-request tooling, with a per-origin ceiling that can reach up to 60% of total disk — a quota calculation, not a promise of actual free space on the device.<sup>[1]</sup> Firefox has solid IndexedDB/Cache behavior with genuinely different quota heuristics: best-effort storage caps at the smaller of 10% of disk or 10 GiB per eTLD+1 group, with persistent storage on a separate limit entirely.<sup>[1]</sup> Safari works, but historically with more conservative defaults and less transparency about what's actually happening — WebKit's own storage policy defaults origins to best-effort and can evict an entire origin under quota pressure, system pressure, or plain inactivity, generally in least-recently-used order.<sup>[2]</sup>

**iOS is where "it was there yesterday" becomes true and useless simultaneously.** Storage can be reclaimed more aggressively than desktop teams expect, and from macOS 14/iOS 17, a regular browser origin gets roughly 20% of disk while a Home Screen/Dock web app can get roughly 60% — two very different budgets for what looks like the same product to the user.<sup>[1]</sup> Background lifecycle and Private Browsing both further reduce durability assumptions that held fine in every desktop test.

## What Breaks First

- Storing everything in one huge IndexedDB object store with no compaction plan, ever.
- Assuming local data is durable forever unless the user manually clears browser data. It isn't — the browser can do that itself, unprompted, per its own eviction policy.
- Mixing critical and disposable data with no priority classes, so an eviction sweep takes the unsynced draft along with the throwaway thumbnail cache.
- Caching large blobs blindly until the quota wall arrives, then discovering the failure mode in production instead of in a test.
- No detection at all for partial corruption or missing chunks — a half-evicted dataset looks exactly like a healthy one until someone reads the wrong field.
- No user-facing recovery UX when data is genuinely gone. Silence is not a recovery flow.

"Works offline" with no eviction strategy behind it is a temporary illusion with a demo-shaped shelf life.

## Minimal Technical Blueprint

```javascript
async function checkStorageHealth() {
  const { usage, quota } = await navigator.storage.estimate();
  if (usage / quota > 0.8) {
    await runCompaction();          // proactive, before the wall, not after
    await notifyIfStillTight();
  }
  const granted = await navigator.storage.persisted() || await navigator.storage.persist();
  recordPersistenceState(granted); // never assume — always record the actual result
}
```

1. Classify local data by criticality: Tier 1 must survive if at all possible (drafts, unsynced mutations), Tier 2 is rebuildable state (derived views), Tier 3 is genuinely disposable cache.
2. Split storage by purpose — IndexedDB for state and queues, Cache Storage for network artifacts. Don't let a large blob wander into the wrong layer just because the API was convenient.
3. Track quota and usage periodically with `estimate()` snapshots, and set threshold alarms well before hard failure, not at it.
4. Implement proactive cleanup: LRU for disposable cache, TTL for stale artifacts, real compaction jobs for stores that only ever grow.
5. Build write guards: chunk large writes, use real transactional boundaries, retry with backoff specifically on quota errors rather than treating them like any other failure.
6. Add integrity metadata — version stamps, checksums for critical payload groups, migration markers — so a corrupted or partially evicted dataset is detectable, not just eventually confusing.
7. On startup, run a consistency check and recovery flow: detect missing critical entities, reconcile with the server where possible, surface a clear user action instead of a silent gap.

## Compatibility Strategy

**Baseline:** IndexedDB plus Cache Storage, quota-aware cleanup, startup consistency checks, graceful degraded behavior when storage comes up short.

**Enhanced:** persistence requests, finer-grained storage telemetry, advanced local file pipelines via OPFS where the browser actually supports them.

Don't tie correctness to the enhanced layer. Tie it to a baseline that survives eviction, because eviction is not a hypothetical — it's the documented, intended behavior of every browser on this list.

## Security and Compliance

Never store sensitive plaintext unless policy explicitly allows it, and encrypt high-risk client data where feasible — browser storage is not a security boundary on its own. Apply real retention windows and explicit purge controls, not a vague intention to "clean it up sometime." Separate user identities strictly in shared-device scenarios; storage that doesn't scope cleanly per user is a data leak waiting for the next person to sit down at that laptop. Document local persistence behavior for whoever runs the compliance review — "the browser might delete it, we're not sure when" is an honest answer, but only if it's written down somewhere instead of discovered during an incident.

Local storage is part of the data architecture. It was never a frontend side quest.

## Test Matrix You Actually Need

- Chrome, Firefox, Safari desktop with forced low-quota simulations, not the roomy default developer profile.
- iOS Safari and Android Chrome on physical devices — simulators do not reproduce real eviction behavior.
- Private/incognito mode checks, specifically, as their own test category.
- Large payload stress tests run all the way to quota exhaustion.
- App restart or crash during a write transaction, deliberately triggered.
- Partial data deletion simulation with recovery flow validation.
- Long idle periods with OS or browser updates happening in between, since that's exactly when eviction policy tends to act.

If the only test performed was "reload the page, data's still there," that tested luck. Not durability.

## Decision Summary

Use this when offline continuity genuinely matters to business outcomes, when local staging meaningfully reduces latency or cost, and when the team can actually maintain recovery and compaction logic as ongoing work, not a one-time feature.

Don't over-rely on it when regulatory constraints restrict client-side persistence outright, when the user environment is highly unmanaged and unpredictable, or when the product can't support durability QA across the real matrix of browsers and devices this list implies.

Browser storage is genuinely powerful. Durability is an engineering choice built on top of it — never a default setting that arrives for free.

---

[1]: Storage quota and eviction criteria across browsers, [MDN](https://developer.mozilla.org/en-US/docs/Web/API/Storage_API/Storage_quotas_and_eviction_criteria).
[2]: WebKit storage eviction policy, [WebKit Blog](https://webkit.org/blog/14403/updates-to-storage-policy/).
