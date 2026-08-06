# Use Case 46: Compute Pressure API for Adaptive Workload Control

If an app burns CPU like a space heater, users notice. Usually before the monitoring does, because a fan spinning up is a faster signal than any dashboard alert.

This explains how to adapt browser workload in real time based on device pressure signals, instead of assuming every visitor has the same silent, cool laptop the demo ran on.

## Why One Code Path Behaves Like Two Different Products

Modern apps do genuinely heavy things in the browser: rendering, encoding, AI inference, large-table transforms. The same code path behaves completely differently on a gaming desktop and a thin laptop in battery-save mode. Without adaptation, the app either over-delivers quality and cooks low-end devices, or under-delivers and leaves high-end hardware sitting idle for no reason.

## The User Story, Stripped of Domain

A user gets:

- responsive UI even under real load,
- stable battery and thermal behavior instead of a fan spinning up mid-session,
- quality scaling that feels intentional, not like the app just quietly broke.

## Core Browser Technologies

| API | Job | Reference |
|---|---|---|
| Compute Pressure API | Coarse pressure state from CPU/GPU domains | [Chrome for Developers](https://developer.chrome.com/docs/web-platform/compute-pressure) |
| Scheduler hints | Defer non-critical work under detected pressure | [MDN – Prioritized Task Scheduling API](https://developer.mozilla.org/en-US/docs/Web/API/Prioritized_Task_Scheduling_API) |
| App-level quality ladder | Frame rate, resolution, model size, worker count as adjustable knobs | [Adaptive bitrate streaming overview](https://developer.mozilla.org/en-US/docs/Web/Media/Guides/Audio_and_video_delivery/Setting_up_adaptive_streaming_media_sources) |

## The Browser Reality Check

This is a Chromium-first feature — it launched in Chrome 125 and, as of this writing, remains without Firefox or Safari implementation.<sup>[1]</sup> Treat it strictly as an enhancement, never a baseline requirement. Where it's missing, fall back to inferred load signals instead: long tasks, dropped animation frames, and growing queue lag are all observable everywhere and, combined, approximate what the Compute Pressure API reports directly on the browsers that have it.

## What Breaks First

- Assuming pressure signals are available everywhere, when this is currently a single-browser-family API.
- Reacting too aggressively to pressure changes, causing visible quality flicker as the app oscillates between tiers.
- Forgetting hysteresis and cooldown windows, so a momentary pressure spike triggers a full downgrade the app never recovers gracefully from.
- Coupling every quality knob to one binary switch, when frame rate, resolution, and worker count all deserve independent tuning.

## Minimal Technical Blueprint

```javascript
if ('PressureObserver' in self) {
  const observer = new PressureObserver((records) => {
    const state = records.at(-1).state; // 'nominal' | 'fair' | 'serious' | 'critical'
    transitionQualityTier(state); // hysteresis handled inside, not here
  });
  observer.observe('cpu', { sampleInterval: 1000 });
} else {
  monitorInferredLoadSignals(); // long tasks + dropped frames, the universal fallback
}
```

1. Define explicit quality tiers (Q0 through Q3) with clear tradeoffs stated for each — what drops first, what's protected longest.
2. Map pressure states to tier transitions with real hysteresis, so a brief spike doesn't cause a jarring downgrade the user actually notices.
3. Protect interaction-critical tasks first — the UI staying responsive matters more than a background render finishing on schedule.
4. Degrade expensive background work before touching core UX, always in that order.
5. Recover slowly after pressure drops, rather than snapping straight back to maximum quality and risking another spike immediately.

## Test Matrix You Actually Need

- Thermal throttling deliberately induced on a laptop.
- Battery-saver mode, tested as its own condition.
- Background tabs competing for CPU simultaneously.
- Mixed real workloads — video plus search plus sync — running together, not tested in isolation.

## Decision Summary

Use this when client-side compute is genuinely business-critical to the product experience.

Don't build correctness on top of it — build resilience on top of it instead. The API is a Chromium-only signal today; a product that only works when it's present isn't resilient, it's accidentally Chrome-only.

---

[1]: Compute Pressure API availability and browser support, [Chrome for Developers](https://developer.chrome.com/docs/web-platform/compute-pressure).
