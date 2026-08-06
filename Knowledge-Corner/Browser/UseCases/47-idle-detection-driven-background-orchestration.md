# Use Case 47: Idle Detection Driven Background Orchestration

Sometimes the best time to do heavy work is when the user isn't there. Not because the app is being sneaky. Because it's being polite — deferring the expensive stuff to a moment nobody's waiting on it.

This covers scheduling non-urgent client tasks based on user-idle and screen-lock signals, without accidentally building something that feels like it's watching the user a little too closely.

## Why "Idle" Isn't a Universal Signal

Support for detecting idle state differs by browser and by policy, and a careless implementation of "we know you're not there" reads as creepy far faster than most teams expect — the line between "helpful background scheduling" and "uncomfortable surveillance" is thinner than the feature name suggests.

## The User Story, Stripped of Domain

A user experiences:

- smoother foreground interaction because heavy work waited for a better moment,
- fewer visible slowdowns during active use,
- predictable, understandable privacy controls over any idle-aware behavior.

## Core Browser Technologies

| API | Job | Reference |
|---|---|---|
| Idle Detection API | Reports user idle state and screen-lock status, where available | [caniuse](https://caniuse.com/mdn-api_idledetector_start) |
| Page Visibility API (`visibilitychange`, `pagehide`) | The universal fallback lifecycle signal | [MDN](https://developer.mozilla.org/en-US/docs/Web/API/Page_Visibility_API) |
| Local task queue with priority classes | Deferrable work waits for the right moment, urgent work never does | [MDN - Prioritized Task Scheduling API](https://developer.mozilla.org/en-US/docs/Web/API/Prioritized_Task_Scheduling_API) |

## The Browser Reality Check

Idle Detection is a Chromium feature gated behind its own permission model — it is not a reliable cross-browser baseline, and treating it as one means the feature simply doesn't fire for a meaningful share of visitors.<sup>[1]</sup> The product has to function entirely normally with zero idle signal present, because for a large slice of the real audience, that's exactly the situation.

## What Breaks First

- Treating idle as a guaranteed signal instead of an occasional enhancement that may never fire.
- Running sensitive actions during detected idle time with no explicit user expectation set beforehand — "the app did something while I wasn't looking" is a bad headline regardless of intent.
- No clear user-facing explanation or control over idle-aware behavior, leaving users to discover it by accident and read it as invasive.
- Scheduling jobs large enough to still hurt battery and thermals even when deferred — idle scheduling reduces interruption, it doesn't eliminate resource cost.

## Minimal Technical Blueprint

```javascript
async function scheduleDeferrableWork(jobs) {
  if ('IdleDetector' in window && await IdleDetector.requestPermission() === 'granted') {
    const detector = new IdleDetector();
    detector.addEventListener('change', () => {
      if (detector.userState === 'idle') runBoundedBatch(jobs, ENERGY_BUDGET);
    });
    await detector.start({ threshold: 60_000 });
  } else {
    schedulePeriodicConservativeCheck(jobs); // universal fallback, no permission needed
  }
}
```

1. Split jobs explicitly into urgent versus deferrable — only deferrable work is ever a candidate for idle gating.
2. Gate only the deferrable class behind idle hints; urgent work runs on its own schedule regardless of idle state.
3. Add an explicit settings toggle so users can see and control idle-aware behavior directly, not discover it by accident.
4. Enforce a runtime and energy budget per idle window, so a long idle period doesn't become an excuse to run something unbounded.
5. Fall back to conservative periodic checks entirely when the API is unsupported — the feature degrades to "less optimal timing," never to "broken."

## Privacy

Document clearly why idle state is being observed and what it changes. Avoid combining idle events with other high-entropy fingerprint data — idle state plus enough other signals starts approaching a behavioral profile, which was never the goal. Keep retention short for any idle-related diagnostics collected along the way.

## Test Matrix You Actually Need

- Idle transitions and lock/unlock cycles, tested directly on a real device.
- Permission denied, default, and granted paths, all three.
- Unsupported-browser fallback behavior, confirmed to degrade gracefully rather than silently do nothing.
- Long-running sessions with mixed activity, checking that urgent work never gets accidentally deferred alongside the background jobs.

## Decision Summary

Idle detection is useful as a scheduling hint. It was never meant to be a control tower for anything critical, and treating a Chromium-only, permission-gated signal as load-bearing infrastructure is how a feature quietly stops working for everyone else.

---

[1]: Idle Detection API browser support, [caniuse](https://caniuse.com/mdn-api_idledetector_start).
