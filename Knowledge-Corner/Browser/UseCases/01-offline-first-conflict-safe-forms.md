# Use Case 01: Offline-First Forms With Conflict-Safe Sync

Most teams still build forms like it is 2012:
if the network dies, your user dies with it.

This use case flips that model.
The browser keeps working offline, stores user input locally, and syncs later when the connection comes back.
No app install required. No native wrapper. Just a web app with discipline.

## Why this is a good first "hard topic"

Because people underestimate what browsers can do when you combine the right primitives.
And because this pattern looks easy on slides, then breaks in six different ways on real devices.

## User Story (Abstracted)

A user can:

- open a web form,
- enter or edit data,
- close the laptop,
- lose internet,
- come back later,
- continue editing,
- and eventually sync changes without losing work.

We do not care which form.
Could be CRM notes, inspection reports, field service checklists, incident logs.
Same pattern.

## Core Browser Technologies

- `IndexedDB`: durable local data storage for drafts, pending operations, and sync metadata.
- `Service Worker`: request interception, asset caching, offline shell, sync orchestration entry point.
- `Cache Storage API`: static asset caching for the app shell.
- `Background Sync API` (where available): deferred sync when connectivity returns.
- `Navigator.onLine` plus fetch probes: connectivity hints, not truth.
- `BroadcastChannel` (optional): keep multiple tabs in sync.
- `Web Crypto API` (recommended): encrypt sensitive local payloads.

## Browser Reality Check

### Desktop

- Chromium (Chrome, Edge, Arc): strongest support for full pattern, including useful service worker behavior.
- Firefox: solid offline support, but some background behaviors differ.
- Safari (macOS): works for core offline features, but lifecycle quirks require stricter defensive coding.

### Mobile

- Android Chromium: generally usable for this architecture.
- iOS Safari / WebKit-based browsers: the hard part.
  - Background execution is restricted.
  - Storage eviction is more aggressive than people expect.
  - "Works on desktop" means very little here.

Short version:
Desktop gives you confidence.
iOS gives you humility.

## What Usually Breaks First

- Assuming `navigator.onLine` means "internet is available".
- Assuming background sync exists everywhere.
- Assuming local storage survives forever on mobile.
- Assuming single-tab usage while users open five tabs and create conflicts themselves.
- Assuming server conflict handling can be postponed "to phase 2".

Phase 2 is where projects go to die.

## Minimal Technical Blueprint

1. Store all form writes as local operations first.
2. Mark each operation with:
   - client timestamp,
   - entity id,
   - field-level patch,
   - idempotency key.
3. Apply optimistic UI updates from local state.
4. Maintain a sync queue in IndexedDB.
5. Trigger sync via:
   - explicit user action ("Sync now"),
   - reconnect detection,
   - background sync if supported.
6. Server validates and returns authoritative state.
7. Client resolves conflicts using a clear strategy:
   - last-write-wins (simple, risky), or
   - field-level merge with conflict markers (safer).
8. Surface unresolved conflicts in UI, not in logs nobody reads.

## Compatibility Strategy (Pragmatic)

- Baseline mode (all modern browsers):
  - offline read/write drafts,
  - manual sync button,
  - reconnect-triggered sync.
- Enhanced mode (supporting browsers):
  - background sync,
  - smarter retry windows,
  - silent queue processing.

This is progressive enhancement, not wishful thinking.

## Security and Compliance Notes

- Do not keep plain PII locally if you can avoid it.
- Encrypt sensitive payloads before writing to IndexedDB.
- Define local retention windows and purge strategy.
- Provide "clear local data" controls for shared devices.

Offline capability without data governance is just a future incident report.

## Test Matrix You Actually Need

- Desktop Chrome/Edge + throttled network + forced offline.
- Firefox latest.
- Safari macOS latest.
- iOS Safari on real device (not only simulator).
- Multi-tab conflict scenario.
- Storage pressure scenario (simulate quota pressure and eviction).

If iOS real-device testing is missing, your confidence is fictional.

## Decision Summary

Use this pattern when:

- users work in unstable network conditions,
- data loss is unacceptable,
- form completion time is long enough to justify offline resilience.

Avoid this pattern when:

- data is ultra-sensitive and cannot be stored client-side at all,
- project cannot fund proper sync/conflict engineering.

Because yes, this is "just browser code".
And no, it is not the cheap version.
