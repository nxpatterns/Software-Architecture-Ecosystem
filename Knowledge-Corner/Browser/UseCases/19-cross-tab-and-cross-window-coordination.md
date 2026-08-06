# Use Case 08: Cross-Tab and Cross-Window Coordination

One user.
Five open tabs.
Zero coordination.

That is how perfectly good web apps turn into race-condition factories.

This use case covers browser coordination across multiple tabs/windows of the same app:
state sync, lock ownership, leader election, background task ownership, and conflict containment.

## Why this is a proper "hard topic"

Because frontend teams often design as if one tab equals one user session.
Reality is messier.

Users open duplicates from bookmarks, deep links, CRM shortcuts, notification clicks, and panic-refresh behavior.
Now your app has concurrent actors sharing storage, network tokens, and business workflows.
Congratulations, you have distributed systems now. Just with more CSS.

## User Story (Abstracted)

A user can:

- open multiple tabs/windows of the same app,
- see coherent shared state,
- avoid duplicate background jobs,
- avoid contradictory edits/actions,
- and recover safely when a tab crashes or is closed.

Could be admin consoles, workflow tools, chat systems, monitoring dashboards, form-heavy business apps.
Same pattern.
Different failure signatures.

## Core Browser Technologies

- BroadcastChannel API: low-latency same-origin messaging between tabs.
- storage events (`localStorage`): broad fallback signaling channel.
- SharedWorker (where supported): single shared execution context for multiple tabs.
- Service Worker (coordination support role): central event handling and cache/queue mediation.
- Web Locks API (where supported): cooperative lock management for critical sections.
- IndexedDB: durable shared state and lease metadata.
- Page Visibility API: detect active/inactive tabs for leadership hints.
- beforeunload/visibilitychange (carefully): graceful lease release attempts.

## Browser Reality Check

### Desktop

- Chromium: strongest support mix for advanced coordination tools.
- Firefox: generally strong fundamentals; some advanced APIs may differ in support maturity.
- Safari: core techniques possible, but advanced coordination APIs can be limited; fallback paths matter.

### Mobile

- Android Chromium: workable for moderate patterns.
- iOS Safari/WebKit: aggressive lifecycle behavior changes assumptions.
  - Tabs can be suspended or killed more eagerly.
  - "This tab is alive" can become false without ceremony.
  - Timing-sensitive coordination logic is less predictable.

Short version:
On desktop, your algorithm looks elegant.
On mobile, your algorithm meets entropy.

## What Usually Breaks First

- Running the same background sync in every open tab.
- Concurrent token refresh calls racing each other.
- Duplicate notification toasts from each tab instance.
- Naive last-write-wins state replication without conflict semantics.
- Leader election without heartbeat timeout handling.
- Assuming `beforeunload` always fires cleanly.

If five tabs can each "own" the same job, none of them owns it.

## Minimal Technical Blueprint

1. Define coordination domains explicitly:
   - UI state sync,
   - network job ownership,
   - critical write sections,
   - notification ownership.
2. Implement deterministic tab identity:
   - random tab id,
   - startup timestamp,
   - persisted lease metadata in IndexedDB.
3. Add leader election with leases:
   - lease TTL,
   - periodic heartbeat,
   - takeover on expiry.
4. Use messaging channel hierarchy:
   - BroadcastChannel primary,
   - storage-event fallback.
5. Guard critical operations:
   - Web Locks where available,
   - optimistic lock + lease fallback where not.
6. Make all shared jobs idempotent server-side.
7. Reconcile state on tab resume/focus:
   - detect missed events,
   - reload authoritative slices,
   - resolve divergences.
8. Emit coordination telemetry:
   - lock contention,
   - lease flaps,
   - duplicate job suppression counts.

## Compatibility Strategy (Pragmatic)

- Baseline mode (all modern browsers):
  - storage-event signaling,
  - lease-based leader election in IndexedDB,
  - idempotent server operations.
- Enhanced mode (supporting browsers):
  - BroadcastChannel for fast sync,
  - Web Locks for cleaner critical-section semantics,
  - SharedWorker for centralized coordination logic.

Do not require enhanced mode for correctness.
Correctness belongs in baseline.

## Security and Compliance Notes

- Treat cross-tab messages as internal but still validate payload shape.
- Never put sensitive plaintext secrets into shared signaling channels.
- Enforce server-side authorization on every action regardless of local leader state.
- Protect against stale-tab actions with version checks and token freshness validation.

A leader tab is not a trust boundary.
It is just a convenience boundary.

## Test Matrix You Actually Need

- Multi-tab scenarios (2, 5, 10 tabs) on Chrome, Firefox, Safari.
- Forced close/crash of leader tab during critical workflow.
- Sleep/wake cycles and resumed tabs after long inactivity.
- Token refresh storms with simultaneous API retries.
- Background/foreground transitions on mobile devices.
- Offline/online transitions while multiple tabs hold pending queues.
- Duplicate notification suppression checks.
- Long-run soak tests for lease stability and memory growth.

If your test case is one tab and one happy click path,
you tested a postcard version of your app.

## Decision Summary

Use this pattern when:

- users commonly open multiple tabs,
- duplicated work causes real business damage,
- app complexity justifies explicit coordination design.

Avoid over-engineering when:

- workflows are read-mostly and low-risk,
- duplicate actions are harmless,
- product cannot fund proper multi-context QA.

Because yes, browser coordination can be made reliable.
But only if you admit early that one user can behave like a small cluster.
