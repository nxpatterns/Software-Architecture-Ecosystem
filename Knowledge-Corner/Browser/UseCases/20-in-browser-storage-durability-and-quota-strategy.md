# Use Case 09: In-Browser Storage Durability and Quota Strategy

Offline-first ideas are easy.
Offline-first data survival is not.

This use case covers how browser storage actually behaves under pressure:
what survives, what gets evicted, what breaks in private mode, and how to recover without blaming users for "unexpected cache clear events."

## Why this is a proper "hard topic"

Because most teams treat browser storage like a tiny local database with infinite trust.
It is not.

Storage quotas are browser-dependent.
Eviction policies are implementation-specific.
Private modes can behave like polite amnesia.
Mobile devices can reclaim your data the moment the OS gets hungry.

## User Story (Abstracted)

A user can:

- create data offline,
- leave and return later,
- keep critical state intact,
- recover safely if partial data loss occurs,
- and continue work with minimal friction.

Could be drafts, task queues, media staging, field notes, analytics buffers, cached app state.
Same architecture pattern.
Different failure triggers.

## Core Browser Technologies

- IndexedDB: primary structured client persistence.
- Cache Storage API: app shell and request/response caching.
- localStorage/sessionStorage: lightweight signaling and tiny state only.
- StorageManager API (`navigator.storage.estimate`, `persist`): quota insight and persistence request where supported.
- Service Worker: deterministic boot path and offline routing.
- File System Access API / OPFS (where available): heavier local file workflows.

## Browser Reality Check

### Desktop

- Chromium: strongest tools for quota introspection and persistence requests.
- Firefox: solid IndexedDB/Cache behavior, different quota heuristics.
- Safari: works, but historically more conservative and less transparent in storage behavior.

### Mobile

- Android Chromium: usable with care, still subject to OS pressure.
- iOS Safari/WebKit: strict reality.
  - Storage may be reclaimed more aggressively.
  - Background lifecycle and private mode behavior can reduce durability assumptions.
  - "It was there yesterday" can be true and useless.

Short version:
If your storage model has no recovery path,
you do not have a storage model.
You have hope.

## What Usually Breaks First

- Storing everything in one huge IndexedDB object store with no compaction.
- Assuming local data is durable forever unless user clears browser data manually.
- Mixing critical and disposable data without priority classes.
- Caching large blobs blindly until quota wall hits.
- No detection for partial corruption or missing chunks.
- No user-facing recovery UX when data is gone.

"Works offline" without eviction strategy is a temporary illusion.

## Minimal Technical Blueprint

1. Classify local data by criticality:
   - Tier 1: must survive if possible (drafts, unsynced mutations),
   - Tier 2: rebuildable state (derived views),
   - Tier 3: disposable cache.
2. Split storage by purpose:
   - IndexedDB for state/queues,
   - Cache Storage for network artifacts,
   - avoid large blobs in wrong layer.
3. Track quota and usage periodically:
   - `storage.estimate()` snapshot,
   - threshold alarms before hard failure.
4. Implement proactive cleanup:
   - LRU for disposable cache,
   - TTL for stale artifacts,
   - compaction jobs for growing stores.
5. Build write guards:
   - chunk large writes,
   - transactional boundaries,
   - retry/backoff on quota errors.
6. Add integrity metadata:
   - version stamps,
   - checksums for critical payload groups,
   - migration markers.
7. On startup, run consistency check and recovery flow:
   - detect missing critical entities,
   - reconcile with server where possible,
   - surface clear user action paths.

## Compatibility Strategy (Pragmatic)

- Baseline mode (all modern browsers):
  - IndexedDB + Cache Storage,
  - quota-aware cleanup,
  - startup consistency checks,
  - graceful degraded behavior.
- Enhanced mode (supporting browsers):
  - persistence requests,
  - finer-grained storage telemetry,
  - advanced local file pipelines.

Do not tie correctness to enhanced features.
Tie correctness to resilient baseline behavior.

## Security and Compliance Notes

- Do not store sensitive plaintext unless policy explicitly allows it.
- Encrypt high-risk client data where feasible.
- Apply retention windows and explicit purge controls.
- Separate user identities strictly in shared-device scenarios.
- Document local persistence behavior for compliance review.

Local storage is part of your data architecture, not a frontend side quest.

## Test Matrix You Actually Need

- Chrome, Firefox, Safari desktop with forced low-quota simulations.
- iOS Safari and Android Chrome on physical devices.
- Private/incognito mode behavior checks.
- Large payload stress tests until quota exhaustion.
- App restart/crash during write transaction scenarios.
- Partial data deletion simulation and recovery validation.
- Long idle periods with OS/browser updates in between.

If your only test is "reload page, data still there," you tested luck.

## Decision Summary

Use this pattern when:

- offline continuity matters to business outcomes,
- local staging reduces latency/cost,
- team can maintain recovery and compaction logic.

Avoid over-reliance when:

- regulatory constraints restrict client persistence,
- user environment is highly unmanaged and unpredictable,
- product cannot support durability QA across browsers/devices.

Because yes, browser storage is powerful.
But durability is an engineering choice, not a default setting.
