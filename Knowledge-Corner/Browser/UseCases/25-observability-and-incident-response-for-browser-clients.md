# Use Case 25: Observability and Incident Response for Browser Clients

Most browser incidents get diagnosed with three artifacts: a screenshot, a shrug, and a sentence that starts with "works on my machine."

This replaces that ritual with actual operational discipline: client-side observability, an error taxonomy, privacy-safe diagnostics, and incident response playbooks that don't depend on luck or whoever happened to be on call.

## Why Server Logs Alone Can't Explain Client Reality

Browser failures are distributed and heavy on context: engine differences, extension interference, network volatility, device constraints, permission states, storage edge cases, race conditions. Server logs never see any of that. Client logs with no structure just become expensive noise nobody reads until an incident forces them to.

## The User Story, Stripped of Domain

- encounter an issue,
- continue the core workflow or fail gracefully instead of silently,
- trigger actionable diagnostics with no private content exposed,
- benefit from faster incident resolution as a direct result.

Any advanced web app with meaningful client logic — same observability pattern, different domain vocabulary layered on top.

## Core Browser Technologies

| API | Job | Reference |
|---|---|---|
| `PerformanceObserver` + marks/measures | Latency and rendering timing signals | [MDN](https://developer.mozilla.org/en-US/docs/Web/API/PerformanceObserver) |
| `error`/`unhandledrejection` (global) | Runtime failure collection | [MDN](https://developer.mozilla.org/en-US/docs/Web/API/Window/error_event) |
| Network instrumentation (fetch/XHR wrappers) | Request outcomes and retry-chain visibility | [fetch (MDN)](https://developer.mozilla.org/en-US/docs/Web/API/Window/fetch), [XMLHttpRequest (MDN)](https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest) |
| Service worker telemetry hooks | Offline/queue/sync event tracing | [Service Worker API (MDN)](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API), [Background Sync API (MDN)](https://developer.mozilla.org/en-US/docs/Web/API/Background_Synchronization_API) |
| `navigator.storage.estimate()` | Local durability context alongside every incident | [MDN](https://developer.mozilla.org/en-US/docs/Web/API/StorageManager/estimate) |
| Page Visibility / lifecycle signals | Foreground/background correlation for every event | [MDN](https://developer.mozilla.org/en-US/docs/Web/API/Page_Visibility_API) |
| `navigator.sendBeacon()` | Reliable diagnostic delivery on page unload | [MDN](https://developer.mozilla.org/en-US/docs/Web/API/Navigator/sendBeacon) |

## The Browser Reality Check

If telemetry assumes long-lived client sessions, it fails exactly where you need it most.

Chromium generally offers the richest diagnostics surface and DevTools tooling to match. Firefox and Safari provide sufficient primitives — `PerformanceObserver`, error events, the rest of the table above are all broadly available — but tooling ergonomics genuinely differ, and debugging a Safari-only incident without Chromium's DevTools depth is a different experience worth planning for.

Android Chromium is generally workable with a constrained payload design. iOS Safari is where telemetry continuity gets genuinely hard: sessions can terminate abruptly with no warning, buffered logs can be lost outright if the flush strategy is naive about *when* it flushes, and background periods reduce delivery certainty in ways that make "we'll batch and send later" a risky default rather than a safe one. `sendBeacon()` exists precisely for this — a request that survives page teardown, guaranteed to be sent even as the page unloads, unlike a regular `fetch()` racing the browser's cleanup.<sup>[1]</sup>

## What Breaks First

- Logging everything with no taxonomy, then finding nothing useful in the resulting flood.
- Capturing stack traces with no release/source-map coherence, so every trace reads like it's from a different, unrelated build.
- Ignoring correlation IDs between browser and backend events, turning every incident into manual detective work across two systems that don't talk to each other.
- Treating privacy redaction as optional cleanup to handle "later" — later is usually the day of an incident, which is the worst possible time to discover it was never built.
- Shipping monitoring with no alert ownership, so the dashboard exists and nobody's actually watching it.
- Running incident response from chat screenshots instead of structured evidence, reconstructing what happened from memory and vibes.

Observability without ownership is expensive optimism with a dashboard attached.

## Minimal Technical Blueprint

```javascript
window.addEventListener('unhandledrejection', (event) => {
  const diagnostic = {
    category: classifyError(event.reason),
    sessionId, releaseVersion, browserCohort,
    correlationId: currentTraceId(), // links back to the backend request
    timestamp: Date.now(),
  };
  eventBuffer.push(redactPII(diagnostic)); // redaction is not optional, ever
});

window.addEventListener('pagehide', () => {
  navigator.sendBeacon('/diagnostics', JSON.stringify(eventBuffer)); // survives teardown
});
```

1. Define client-side SLOs explicitly: startup readiness, interaction latency, an error budget per feature tier, sync success ratio.
2. Design a strict error taxonomy: category, severity, recoverability, user-impact class. Every captured event gets classified, not just collected.
3. Attach correlation metadata to every single event: session ID, tab ID, release version, browser cohort, trace/request ID — without this, cross-referencing a client error to a backend trace is guesswork.
4. Build a privacy-first event schema: an explicit allowlist of fields, PII stripping applied before anything leaves the device, hard payload size caps.
5. Buffer and flush with resilience: batch transport, retry with backoff, and an unload-safe fallback via `sendBeacon()` for the moment the page is closing regardless of what your buffer wanted to do.
6. Link frontend errors to backend traces and feature flags — an error that can't be tied to what was actually deployed at that moment is much harder to root-cause.
7. Build real incident runbooks: detection, a named triage owner, concrete mitigation options, communication templates ready before they're needed under pressure.
8. Run observability fire drills on a schedule, before production reminds you why they matter.

## Compatibility Strategy

**Baseline:** critical error capture, minimal performance timing, reliable low-volume event export that works on every supported browser.

**Enhanced:** richer performance traces, granular client lifecycle metrics, deeper correlation links.

Core incident visibility has to exist in baseline. Enhanced diagnostics are acceleration for a fast root-cause — they were never meant to be the difference between "we saw the incident" and "we didn't."

## Security and Compliance

Redact aggressively by default, not as a secondary pass someone might get to. Never log raw personal inputs, tokens, or secrets — a diagnostic payload that accidentally contains a password field's value is not a diagnostic feature, it's a breach with good intentions. Respect regional data retention and transfer constraints for wherever the telemetry pipeline actually lives. Document exactly what's captured, why, and for how long, and enforce real access control on diagnostic data and any session-replay tooling — replay tools in particular are powerful enough to need their own access review, not an afterthought bolted onto the general observability rollout.

Privacy-safe observability is harder to build. It's also the only kind that survives an audit intact.

## Test Matrix You Actually Need

- Browser cohort testing: Chrome, Firefox, Safari desktop, iOS Safari, Android Chrome.
- Synthetic fault injection: network drops, storage quota errors, permission denials, service-worker failures — all deliberately triggered, not waited for.
- Release/source-map validation in staging, confirmed before it's needed in production.
- Event-loss and backpressure stress tests under real volume.
- Redaction verification against adversarial payloads specifically designed to slip PII through.
- Alert routing tests with actual on-call acknowledgment checks, not just "the alert fired."
- Incident simulation drills measuring time-to-detection and time-to-mitigation, with real numbers attached.

If the first incident drill is a real outage, the drill plan was fiction.

## Decision Summary

Use this when client behavior materially affects reliability, when cross-browser complexity is genuinely non-trivial, and when support and engineering both need shared, structured evidence instead of competing narratives.

Don't fool yourself when telemetry has no taxonomy behind it, when there's no privacy model governing what gets captured, or when incident ownership is simply undefined and everyone assumes someone else has it covered.

Browser incidents can absolutely be managed professionally. Only when observability is designed as a real product capability — not bolted on after launch because an outage made it urgent.

---

[1]: `navigator.sendBeacon()` for unload-safe delivery, [MDN](https://developer.mozilla.org/en-US/docs/Web/API/Navigator/sendBeacon).
