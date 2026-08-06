# Use Case 18: Browser Background Execution and Scheduling Limits

Everyone wants "background processing." Then they discover background means ten different things across ten browser/platform combinations, and roughly six of those combinations mean "no."

This covers browser-side background behavior: push-triggered work, deferred sync, periodic updates, and what genuinely happens when a tab is hidden, suspended, or killed outright by an operating system that has better things to do with its battery budget.

## Why Teams Design This Like a Server Daemon and Regret It

A browser is not a daemon. It's a guest process running under a strict budget, real lifecycle constraints, and platform-specific throttling rules nobody asked your product manager's permission to enforce.

Desktop gives you false confidence. Mobile gives you the bill.

## The User Story, Stripped of Domain

- close or background the app,
- still receive relevant updates or notifications,
- have pending client work sync when the platform allows it,
- reopen the app with no data loss and no weird state divergence.

Messaging, workflow approvals, field data sync, reminders, incident dashboards — same architecture, different lifecycle traps waiting in each one.

## Core Browser Technologies

| API | Job | Reference |
|---|---|---|
| Service Worker | Event-driven background execution entry point | — |
| Push API | Server-to-browser delivery trigger | — |
| Notifications API | The user-visible surface for that trigger | — |
| Background Sync API | Deferred one-off sync — Chromium only | [caniuse](https://caniuse.com/background-sync) |
| Periodic Background Sync | Scheduled sync attempts, narrower support still | — |
| IndexedDB | Persistent queue/state for resumable work | — |
| Cache Storage API | Offline shell, deterministic startup assets | — |
| Page Visibility API | Behavior changes on foreground/background transitions | — |

## The Browser Reality Check

If your architecture assumes guaranteed periodic background jobs on every mobile browser, your architecture is fan fiction.

Background Sync is the clearest example of the whole problem: Chromium supports it — Chrome, Edge, Opera, Samsung Internet — and Firefox and Safari, desktop and iOS both, do not support it at all.<sup>[1]</sup> Not "support it partially." Not "behind a flag." Absent. Mozilla has it filed as worth prototyping, which in standards-speak means don't wait for it.

Chromium has the strongest practical support for service-worker-based background workflows generally. Firefox has solid service worker fundamentals with real gaps in specific background features — Background Sync chief among them. Safari supports the core pieces with the most conservative lifecycle assumptions of the three, and expects your code to match that conservatism rather than fight it.

Android Chromium is workable for selected background patterns, still subject to OS-level battery and process-management decisions your JavaScript has no visibility into. iOS Safari has hard constraints across the board: background execution windows are short, task timing is unpredictable, and several of these APIs are partial, version-gated, or simply not there for the pattern you had in mind.

## What Breaks First

- Assuming background sync exists everywhere. It exists in one browser family.<sup>[1]</sup>
- Assuming push arrival implies an immediate window for heavy processing. It implies an event fired — nothing about its duration or resources is guaranteed.
- Relying on frequent periodic tasks in a restricted mobile environment that was never going to honor the interval you asked for.
- Keeping volatile in-memory queue state instead of durable persistence — the process backing that memory can simply end.
- Ignoring idempotency and replay safety for retried background jobs, then being surprised when a flaky connection double-processes something expensive.
- Designing a notification flow with no permission-denied fallback UX, as if "denied" were a hypothetical outcome instead of the common one.

Background reliability is earned through defensive design. It is never earned through optimism, no matter how confident the architecture diagram looked in the planning meeting.

## Minimal Technical Blueprint

```javascript
// Service worker: triggers are opportunities, not compute guarantees
self.addEventListener('sync', (event) => {
  if (event.tag === 'queue-flush') {
    event.waitUntil(flushQueueWithBackoff()); // short, deterministic, resumable
  }
});

async function flushQueueWithBackoff() {
  const jobs = await readPendingJobs(); // from IndexedDB, never from memory
  for (const job of jobs) {
    if (job.retryCount > MAX_RETRIES) { await markPoisoned(job); continue; }
    try { await sendJob(job); await markComplete(job); }
    catch { await scheduleRetry(job, exponentialDelay(job.retryCount)); }
  }
}
```

1. Model every background task as a resumable job: unique job ID, payload reference, retry metadata, idempotency key.
2. Persist the job queue and every state transition in IndexedDB — never trust memory to survive between events.
3. Treat service worker events strictly as triggers, not guaranteed compute windows. The browser can end the process the moment the handler returns.
4. Keep background handlers short and deterministic. Long-running logic belongs in foreground continuation, not a background event handler hoping for extra time.
5. Build a real retry strategy: exponential backoff, a maximum retry budget, explicit poison-job handling instead of an infinite retry loop nobody notices until it's expensive.
6. Build permission-aware notification UX with three real paths: granted, denied, and a quiet mode for users who granted permission but don't want every event to interrupt them.
7. Reconcile queue and server state on every foreground launch — the queue's local view is a guess until it's checked against the source of truth.

## Compatibility Strategy

**Baseline:** offline queue persistence, foreground-resume sync, notifications where explicitly permitted. This is the layer business correctness lives on.

**Enhanced:** push-triggered sync acceleration, Background Sync optimizations where the browser actually supports it, richer task orchestration.

Never make business correctness depend on the enhanced layer. Correctness belongs to baseline, full stop — the enhanced layer only ever makes baseline feel faster.

## Security and Compliance

Keep push payloads free of sensitive raw data wherever possible — a payload sitting in a push service is not your access-controlled infrastructure. Validate every queued action server-side regardless of what the client believes its own state to be. Enforce strict origin integrity for service worker scope; a service worker with too broad a scope is a persistent problem, not a convenience. Give users real controls over notification preferences and local data retention, and document background behavior clearly for whoever runs the privacy and compliance review — a silent background feature with no documentation is exactly the kind of thing that becomes a loud audit finding.

## Test Matrix You Actually Need

- Desktop Chrome, Firefox, Safari against real push endpoints, not a mocked service.
- Android device: suspend/resume cycles and network transitions, deliberately triggered.
- iOS Safari on real devices, across at least two major iOS versions.
- Notification permission paths: granted, denied, default — all three, not just the happy one.
- Airplane mode and reconnect sequences.
- Browser restart and crash-recovery queue reconciliation.
- Time-skew and delayed-delivery simulations.
- A long-run retry storm to actually validate idempotency and backoff under load, not just in theory.

Tests that only run in one always-open desktop tab tested a fantasy environment, not the product.

## Decision Summary

Use this when users genuinely expect asynchronous continuity, when delayed sync and alerts carry real operational value, and when the team can engineer for lifecycle unpredictability as a first-class constraint rather than an afterthought.

Don't overpromise when mobile Safari parity is mandatory for every background capability on the list, when strict reliability SLAs demand daemon-like guarantees a browser was never built to provide, or when nobody's investing in queue correctness and replay safety as real engineering work.

Browsers can do meaningful background work. They do it on their own negotiated terms — not your sprint plan's.

---

[1]: Background Sync API browser support, [caniuse](https://caniuse.com/background-sync).
