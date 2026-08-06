# Use Case 01: Offline-First Forms With Conflict-Safe Sync

A user closes their laptop mid-form, gets on a train, loses signal for forty minutes, opens the laptop again, keeps typing. Nothing breaks. Nothing gets lost. When the train re-enters civilization, the data syncs itself and nobody notices it happened.

That's the whole pitch. No native app. No install. A web form that simply refuses to care whether the network is there.

Most teams don't build this. They build 2012: no connection, no mercy. The browser has had the primitives to do better for over a decade. Almost nobody uses all of them together, which is exactly why this is worth forty minutes of a conference room's attention.

## Why This Belongs in the "Hard" Bucket

Every individual API here is well documented. Combine five of them into one architecture and the failure modes stop being individual and start being systemic: two tabs editing the same record, a phone that evicts your storage without asking, a service worker that update-installs itself out from under a sync queue mid-flight. None of that shows up in a demo. All of it shows up in production, usually during a customer's worst week.

## The User Story, Stripped of Domain

- open a form,
- type,
- close the device,
- lose connectivity,
- come back hours or days later,
- keep editing,
- reconnect,
- sync without losing a single field.

Swap "form" for CRM notes, field-service checklists, incident logs, inspection reports. Same architecture underneath. If your product has a human typing structured data in a place with bad Wi-Fi, this is your use case.

## Core Browser Technologies

| API | Job | Spec / Reference |
|---|---|---|
| [IndexedDB](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API) | Durable local store for drafts, the operation log, sync metadata | [W3C IndexedDB](https://www.w3.org/TR/IndexedDB/) |
| [Service Worker](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API) | Request interception, offline app shell, sync orchestration entry point | [W3C Service Workers](https://w3c.github.io/ServiceWorker/) |
| [Cache Storage API](https://developer.mozilla.org/en-US/docs/Web/API/Cache) | Static asset caching for the offline shell | MDN above |
| [Background Sync API](https://developer.mozilla.org/en-US/docs/Web/API/Background_Synchronization_API) | Deferred sync when connectivity returns, without the user in the loop | [caniuse](https://caniuse.com/background-sync) — Chromium only |
| `navigator.onLine` + fetch probes | A hint, not a fact | — |
| [BroadcastChannel](https://developer.mozilla.org/en-US/docs/Web/API/Broadcast_Channel_API) | Keep multiple open tabs from fighting each other | — |
| [Web Crypto API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Crypto_API) | Encrypt sensitive payloads before they touch disk | — |

For the room's product managers: read the left column as "what," skip the right column. For the specialists in row three of the audience who already know the SyncManager interface by heart — that reference table is for you, and yes, we're about to explain exactly why it only says "Chromium."

## The Browser Reality Check

Background Sync is a Chromium feature. Full stop. As of early 2026 it works in Chrome, Edge, Opera, and Samsung Internet — and it does not exist in Firefox or in Safari, on desktop or iOS.<sup>[1]</sup> This is not a gap that's about to close; Mozilla has it filed as worth prototyping, which in standards-speak means "check back never."

That means "Background Sync" cannot be your architecture. It can only be your *enhancement*.

**Desktop**

- Chromium: the full pattern works, including genuinely useful service worker lifecycle behavior.
- Firefox: solid offline support for everything except Background Sync itself.
- Safari macOS: core offline features work, but the lifecycle has opinions you'll need to code defensively around.

**Mobile**

- Android Chromium: usable for the full pattern.
- iOS Safari, and every browser on iOS because they're all Safari underneath: background execution is restricted, storage eviction is more aggressive than the demo led you to believe, and "it worked on desktop" is not evidence of anything.

Desktop gives you confidence. iOS gives you humility. Budget for the humility.

## What Breaks First

- Treating `navigator.onLine` as ground truth. It reports link-layer connectivity, not "can I reach my API." A device connected to a hotel Wi-Fi captive portal is "online" and functionally offline.
- Assuming Background Sync exists everywhere. It doesn't. See above.
- Assuming local storage survives indefinitely on mobile. It doesn't, especially under storage pressure.
- Assuming one tab open at a time. Users open five. Users create their own conflicts before your server ever sees a race condition.
- Deferring conflict handling to "phase two." Phase two is a graveyard. Nobody visits.

## Minimal Technical Blueprint

Every write goes local first. No exceptions, no "just this once, direct to server" shortcut for the field that seemed urgent.

```javascript
// One operation, one queue entry. Never partial writes.
async function queueOperation(db, op) {
  const tx = db.transaction('sync_queue', 'readwrite');
  await tx.store.add({
    id: crypto.randomUUID(),        // idempotency key
    entityId: op.entityId,
    patch: op.patch,                // field-level, not whole-document
    clientTimestamp: Date.now(),
    status: 'pending',
  });
  await tx.done;
}
```

1. Local write first, UI updates optimistically from local state.
2. Every queued operation carries a client timestamp, an entity ID, a field-level patch (not a full-document snapshot — that's how you turn a two-field edit into a merge conflict on twenty fields), and an idempotency key so a retried sync never double-applies.
3. Sync triggers on three separate signals, because trusting any single one is how you end up with a support ticket titled "my data vanished": explicit user action, reconnect detection, and Background Sync where the browser actually offers it.
4. The server is the referee, not a rubber stamp. It validates and returns authoritative state — never trust the client's version of "what happened while I was offline."
5. Conflict strategy is a decision, not an accident: last-write-wins is simple and occasionally catastrophic; field-level merge with visible conflict markers is more work and rarely loses data silently.
6. Unresolved conflicts surface in the UI. A conflict logged to a server nobody tails is a conflict that didn't get resolved, it just got hidden.

```javascript
self.addEventListener('sync', (event) => {
  if (event.tag === 'form-sync') {
    event.waitUntil(flushQueue());
  }
});
```

That handler only fires in Chromium. Your manual "Sync now" button and your reconnect listener are what fire everywhere else — they are not the fallback, they are the baseline, and Background Sync is the bonus round.

## Compatibility Strategy

**Baseline (every modern browser):** offline read/write of drafts, a visible "Sync now" control, reconnect-triggered sync.

**Enhanced (Chromium):** silent background sync, smarter retry windows, queue processing the user never has to think about.

This is progressive enhancement in the literal sense of the term, not the version of the phrase people use to justify shipping something that only works in one browser and calling the rest "future work."

## Security and Compliance

Local storage is still storage. IndexedDB on a shared kiosk laptop is a data-protection question, not a technical footnote.

- Don't keep raw PII on disk if the architecture can avoid it.
- Encrypt sensitive payloads with Web Crypto before they hit IndexedDB — encryption at rest, not encryption as an afterthought when someone in legal asks.
- Define a retention window and an actual purge job. "We'll clean it up later" is not a retention policy, it's a breach waiting for a slow news day.
- Give shared-device users a visible "clear local data" control. If they can't see it, they can't trust it, and neither can your auditor.

## Test Matrix You Actually Need

- Desktop Chrome/Edge, throttled and then fully offline.
- Firefox, latest.
- Safari macOS, latest.
- iOS Safari on a **real device**. The simulator lies about background behavior and storage eviction; it always has.
- Multi-tab conflict scenario, deliberately provoked.
- Storage-pressure scenario — fill the quota, force eviction, watch what actually survives.

Skip the real iOS device and every number in your test report is a number you made up.

## Decision Summary

Use this pattern when the network is unreliable, data loss is not an acceptable outcome, and the form takes long enough to fill out that offline resilience earns its complexity budget.

Skip it when the data is sensitive enough that it shouldn't touch client storage at all, or when nobody's willing to fund the sync-and-conflict engineering properly. Half of this pattern, built by a team in a hurry, is worse than none of it — a queue with no conflict strategy is just a more sophisticated way to lose data.

"Just browser code," people say. Sure. The cheap version of browser code and the correct version of browser code cost about the same in engineering hours. Only one of them survives contact with an iPhone on a train.

---

[1]: Background Sync API browser support, [caniuse.com/background-sync](https://caniuse.com/background-sync); confirmed unsupported in Firefox and Safari/iOS as of early 2026.
