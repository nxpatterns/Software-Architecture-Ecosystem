# Use Case 07: Browser Background Execution and Scheduling Limits

Everyone says they want background processing.
Then they discover that "background" means ten different things across ten browser/platform combinations.

This use case covers browser-side background behavior:
push-triggered work, delayed sync, periodic updates, and what really happens when tabs are hidden, suspended, or killed.

## Why this is a proper "hard topic"

Because teams design background logic like they are writing a server daemon.
A browser is not a daemon.
It is a guest process with strict budget, lifecycle constraints, and platform-specific throttling rules.

Desktop gives you false confidence.
Mobile gives you the bill.

## User Story (Abstracted)

A user can:

- close or background the app,
- still receive relevant updates or notifications,
- have pending client work synchronized when possible,
- and reopen the app without data loss or weird state divergence.

Could be messaging, workflow approvals, field data sync, reminders, queue processing, incident response dashboards.
Same architecture pattern.
Different lifecycle traps.

## Core Browser Technologies

- Service Worker: event-driven background execution entry point.
- Push API: delivery trigger from server to browser client.
- Notifications API: user-visible notification surface.
- Background Sync API: deferred one-off synchronization where supported.
- Periodic Background Sync API (limited support): scheduled sync attempts.
- IndexedDB: persistent queue/state for resumable work.
- Cache Storage API: offline shell and deterministic startup assets.
- Page Visibility API: adapt behavior on foreground/background transitions.

## Browser Reality Check

### Desktop

- Chromium: strongest practical support for service-worker-based background workflows.
- Firefox: solid service worker fundamentals, with differences in specific background features.
- Safari (macOS): supports key pieces but with stricter behavior and more conservative assumptions required.

### Mobile

- Android Chromium: workable for selected background patterns.
- iOS Safari/WebKit: hard constraints.
  - Background execution windows are limited.
  - Task timing is less predictable.
  - Some APIs are partial, version-dependent, or effectively unavailable for your expected pattern.

Short version:
If your architecture assumes guaranteed periodic background jobs on every mobile browser,
your architecture is fan fiction.

## What Usually Breaks First

- Assuming background sync exists everywhere.
- Assuming push arrival implies immediate heavy processing opportunity.
- Relying on frequent periodic tasks in restricted mobile environments.
- Keeping volatile in-memory queue state instead of durable persistence.
- Ignoring idempotency and replay safety for retried background jobs.
- Designing notification flows without permission-denied fallback UX.

Background reliability is earned with defensive design, not with optimism.

## Minimal Technical Blueprint

1. Model all background tasks as resumable jobs:
   - unique job id,
   - payload reference,
   - retry metadata,
   - idempotency key.
2. Persist job queue and state transitions in IndexedDB.
3. Use service worker events only as triggers, not guaranteed compute windows.
4. Keep background handlers short and deterministic.
5. Defer heavy operations to foreground continuation when needed.
6. Implement robust retry strategy:
   - exponential backoff,
   - max retry budget,
   - poison-job handling.
7. Build permission-aware notification UX:
   - granted path,
   - denied path,
   - quiet mode path.
8. Reconcile queue and server state on next foreground launch.

## Compatibility Strategy (Pragmatic)

- Baseline mode (all modern browsers):
  - offline queue persistence,
  - foreground resume sync,
  - optional notifications where permitted.
- Enhanced mode (supporting environments):
  - push-triggered sync acceleration,
  - background sync optimizations,
  - richer task orchestration.

Never make business correctness depend on enhanced mode.
Correctness belongs to baseline.

## Security and Compliance Notes

- Push payloads should avoid sensitive raw data where possible.
- Validate all queued actions server-side regardless of client state.
- Enforce strict origin integrity for service worker scope.
- Provide user controls for notification preferences and local data retention.
- Document background behavior clearly for privacy and compliance review.

A silent background feature without governance becomes a loud audit finding.

## Test Matrix You Actually Need

- Desktop Chrome, Firefox, Safari with real push endpoints.
- Android device tests for suspend/resume and network transitions.
- iOS Safari tests on real devices across at least two major versions.
- Notification permission paths: granted, denied, default.
- Airplane mode / reconnect sequences.
- Browser restart and crash-recovery queue reconciliation.
- Time-skew and delayed-delivery simulations.
- Long-run retry storm scenarios to validate idempotency and backoff.

If your tests only run in one always-open desktop tab,
you tested a fantasy environment.

## Decision Summary

Use this pattern when:

- users expect asynchronous continuity,
- delayed sync and alerts have real operational value,
- team can engineer for lifecycle unpredictability.

Avoid overpromising when:

- mobile Safari parity is mandatory for all background capabilities,
- strict reliability SLAs require daemon-like guarantees,
- team cannot invest in queue correctness and replay safety.

Because yes, browsers can do meaningful background work.
But they do it on negotiated terms, not your sprint plan.
