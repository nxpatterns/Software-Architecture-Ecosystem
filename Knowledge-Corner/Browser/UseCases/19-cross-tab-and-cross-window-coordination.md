# Use Case 19: Cross-Tab and Cross-Window Coordination

One user. Five open tabs. Zero coordination.

That's how a perfectly good web app turns into a race-condition factory, and it happens without anyone doing anything unusual — bookmarks, deep links, CRM shortcuts, notification clicks, a panic-refresh under pressure. Now the app has several concurrent actors sharing storage, network tokens, and business workflows. Congratulations, distributed systems, just with more CSS.

This is Use Case 15's bigger sibling: 15 stops one specific action from firing twice. This one covers the general problem underneath it — state sync, lock ownership, leader election, and who actually owns a background job when five tabs all think they might.

## Why "One Tab, One Session" Was Never True

Frontend teams design as if one tab equals one user session. Reality opens duplicates constantly, and every one of those duplicates is a fully capable actor with its own idea of what's happening.

## The User Story, Stripped of Domain

- open multiple tabs or windows of the same app,
- see coherent shared state across all of them,
- avoid duplicate background jobs firing from each one independently,
- avoid contradictory edits or actions landing from different tabs,
- recover safely when a tab crashes or simply gets closed.

Admin consoles, workflow tools, chat systems, monitoring dashboards — same pattern, different failure signature depending on what's actually at stake.

## Core Browser Technologies

| API | Job | Reference |
|---|---|---|
| `BroadcastChannel` | Low-latency same-origin messaging between tabs | — |
| `storage` events (`localStorage`) | The broad, ugly, universally-supported fallback signaling channel | — |
| `SharedWorker` (where supported) | Single shared execution context across tabs | — |
| Service Worker (coordination role) | Central event handling, cache/queue mediation | — |
| `navigator.locks` (Web Locks) | Cooperative lock management for critical sections | — |
| IndexedDB | Durable shared state and lease metadata | — |
| Page Visibility API | Active/inactive hints feeding leadership decisions | — |
| `beforeunload`/`visibilitychange` | Best-effort lease release — never a guarantee | — |

## The Browser Reality Check

On desktop, your leader-election algorithm looks elegant. On mobile, it meets entropy.

Web Locks and `BroadcastChannel` are practical baseline primitives across current Chromium and Firefox, with Firefox's Web Locks support starting at version 96 — a real gap for long-lived enterprise installs still running older versions.<sup>[1]</sup> Safari's `SharedWorker` has a genuinely rough history: supported in 5–6.1, dropped entirely from 7 through 15.6, restored in 16.0.<sup>[2]</sup> Treat it as an enhancement, never a load-bearing coordination mechanism — a browser that removed an API for eight major versions once will not earn your architecture's trust back that easily.

Android Chromium is workable for moderate coordination patterns. iOS Safari changes the assumptions outright: tabs get suspended or killed more eagerly than desktop teams expect, "this tab is alive" can silently become false with no ceremony at all, and timing-sensitive coordination logic becomes meaningfully less predictable the moment a phone user switches apps.

## What Breaks First

- Running the same background sync independently in every open tab, because nobody designated an owner.
- Concurrent token-refresh calls racing each other from different tabs, occasionally producing two valid tokens and one very confused auth server.
- Duplicate notification toasts firing from each tab instance for the same underlying event.
- Naive last-write-wins state replication with zero conflict semantics behind it.
- Leader election with no heartbeat timeout handling — a leader that silently dies leaves the group leaderless forever, not gracefully.
- Assuming `beforeunload` always fires cleanly. It doesn't, especially on mobile, and a coordination design that depends on it is a design that fails exactly when a tab closes the fastest.

If five tabs can each "own" the same job, none of them actually owns it.

## Minimal Technical Blueprint

```javascript
async function tryBecomeLeader(leaseKey, tabId) {
  return navigator.locks.request(leaseKey, { ifAvailable: true }, async (lock) => {
    if (!lock) return false;
    await writeLease(leaseKey, { tabId, expiresAt: Date.now() + 10_000 });
    setInterval(() => renewLease(leaseKey, tabId), 4_000); // heartbeat, or the lease expires
    return true;
  });
}

// Every tab listens regardless of leadership
broadcastChannel.onmessage = ({ data }) => reconcileSharedState(data);
```

1. Define coordination domains explicitly and separately: UI state sync, network job ownership, critical write sections, notification ownership. Don't solve all four with one mechanism.
2. Give every tab a deterministic identity: random tab ID, startup timestamp, lease metadata persisted in IndexedDB.
3. Build leader election around leases, not permanence: a TTL, a periodic heartbeat, automatic takeover on expiry.
4. Layer the messaging channel: `BroadcastChannel` as primary, `storage` events as the fallback that reaches everywhere else.
5. Guard critical operations with Web Locks where available, an optimistic-lock-plus-lease fallback where not.
6. Make every shared job idempotent server-side — client coordination reduces duplicate attempts, it does not eliminate the need for the server to survive one anyway.
7. Reconcile state on every tab resume or focus event: detect missed messages, reload authoritative slices, resolve divergence explicitly rather than trusting whichever local copy is loudest.
8. Emit coordination telemetry — lock contention, lease flaps, duplicate-job suppression counts — so a coordination bug shows up as a graph, not a support ticket three weeks later.

## Compatibility Strategy

**Baseline:** `storage`-event signaling, lease-based leader election backed by IndexedDB, idempotent server operations underneath all of it.

**Enhanced:** `BroadcastChannel` for fast sync, Web Locks for cleaner critical-section semantics, `SharedWorker` for centralized coordination logic where it's actually reliable.

Never require the enhanced layer for correctness. Correctness lives in baseline — the same rule as every other coordination-shaped use case in this deck, because it's the only rule that survives contact with Safari's `SharedWorker` history.

## Security and Compliance

Treat cross-tab messages as internal, not automatically trustworthy — validate payload shape regardless of the same-origin guarantee. Never put plaintext secrets into a shared signaling channel; `BroadcastChannel` and `localStorage` are convenient, not confidential. Enforce server-side authorization on every action regardless of local leader state — a leader tab is a convenience boundary, never a trust boundary, and treating it as one is exactly the kind of assumption a security review exists to catch. Protect against stale-tab actions with version checks and token freshness validation, since a tab that's been asleep for twenty minutes has no reliable idea what's changed since.

## Test Matrix You Actually Need

- Multi-tab scenarios — 2, 5, 10 tabs — on Chrome, Firefox, and Safari, not just the number that fit comfortably in a demo.
- Forced close or crash of the leader tab mid-critical-workflow.
- Sleep/wake cycles and tabs resumed after long inactivity.
- Token-refresh storms with simultaneous API retries deliberately triggered.
- Background/foreground transitions on real mobile devices.
- Offline/online transitions while multiple tabs are holding pending queues.
- Duplicate-notification suppression, checked directly, not assumed.
- A long-run soak test for lease stability and memory growth — coordination bugs love to show up after the hour mark, not the first minute.

A test case with one tab and one happy-path click tested a postcard version of the app.

## Decision Summary

Use this when users commonly open multiple tabs, when duplicated work causes real business damage, and when the app's complexity actually justifies explicit coordination design rather than a quick patch.

Don't over-engineer it when workflows are read-mostly and genuinely low-risk, when duplicate actions are harmless, or when the product can't fund proper multi-context QA to back up whatever coordination logic gets built.

Browser coordination can absolutely be made reliable. Only once the team admits, early, that one user can behave like a small cluster all on their own.

---

[1]: Web Locks and BroadcastChannel version support, [caniuse – Web Locks](https://caniuse.com/mdn-api_lock), [caniuse – BroadcastChannel](https://caniuse.com/mdn-api_broadcastchannel_broadcastchannel).
[2]: Safari SharedWorker support history, [caniuse – SharedWorker](https://caniuse.com/mdn-api_sharedworker).
