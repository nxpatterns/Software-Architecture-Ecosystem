# Use Case 41: Extension Interference Detection and Mitigation in Browser Apps

Sooner or later, a browser extension modifies your page. Sometimes harmlessly. Sometimes by breaking business-critical behavior in ways your standard test suite has no way of ever seeing, because the test suite never had that extension installed.

This explains how to detect likely extension interference and what's realistically possible to do about it — which is less than "fix it" and more than "shrug."

## Why You Can't Control This and Can Still Prepare For It

Extensions can inject scripts, rewrite the DOM, block or alter requests, modify CSP behavior through user-level privileges, and introduce race conditions no amount of careful architecture anticipated. You cannot control user-installed extensions. You can detect the symptoms and harden the architecture against the most common categories of damage.

## The User Story, Stripped of Domain

A team can:

- identify probable extension-induced breakage,
- degrade gracefully instead of failing in a way that looks like a mystery,
- provide actionable diagnostics for support and engineering instead of a shrug.

## Core Browser Technologies

| Practice / API | Job | Reference |
|---|---|---|
| DOM integrity sentinels on critical UI anchors | Detect when a key element has been altered or removed | [MDN - querySelector()](https://developer.mozilla.org/en-US/docs/Web/API/Document/querySelector), [MDN - Node.isConnected](https://developer.mozilla.org/en-US/docs/Web/API/Node/isConnected) |
| Network request health checks | Anomaly counters on request success/failure patterns | [MDN - Fetch API](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API), [MDN - PerformanceResourceTiming](https://developer.mozilla.org/en-US/docs/Web/API/PerformanceResourceTiming) |
| `MutationObserver` on protected regions | Detect unexpected DOM mutation in real time | [MDN](https://developer.mozilla.org/en-US/docs/Web/API/MutationObserver) |
| Runtime feature self-checks | Confirm critical workflows still function as expected | [MDN - Feature detection](https://developer.mozilla.org/en-US/docs/Learn_web_development/Extensions/Testing/Feature_detection) |
| Client diagnostics payload with interference signals | Structured evidence, not a screenshot | [MDN - Navigator.sendBeacon()](https://developer.mozilla.org/en-US/docs/Web/API/Navigator/sendBeacon), [MDN - Reporting API](https://developer.mozilla.org/en-US/docs/Web/API/Reporting_API) |
| Strict CSP + Trusted Types | Reduce the injection surface where policy allows | [MDN – Trusted Types](https://developer.mozilla.org/en-US/docs/Web/API/Trusted_Types_API) |

## The Browser Reality Check

This isn't a per-browser compatibility question — extension interference is possible on any browser with an extension ecosystem, and Chromium's dominant extension marketplace share means it sees the widest variety of interference patterns in practice. `MutationObserver` and CSP/Trusted Types support are broadly consistent across engines; the actual variable is which extensions a given user population has installed, which is fundamentally unobservable from the server side and only partially observable from the client.

## What Breaks First

- Form fields overwritten or hidden by an extension's injected UI, silently corrupting what the user believes they submitted.
- Click handlers blocked by an overlay another extension injected on top of the page.
- Telemetry endpoints blocked outright by privacy or ad-blocking extensions, producing exactly the invisible data loss covered in Use Case 34.
- Altered prototypes or monkey-patched browser APIs from an extension causing nondeterministic behavior that looks like your own bug.
- CSS injection that breaks layout and focus flow, especially damaging for accessibility since it can silently defeat carefully built keyboard navigation.

## Minimal Technical Blueprint

```javascript
function checkCriticalInvariants() {
  const checks = {
    submitButtonPresent: !!document.querySelector('#checkout-submit'),
    handlerBound: hasListener(document.querySelector('#checkout-submit'), 'click'),
    telemetryReachable: lastTelemetryDeliverySucceeded(),
  };
  const failed = Object.entries(checks).filter(([, ok]) => !ok);
  if (failed.length) reportProbableInterference(failed); // symptom-based, not extension-name-based
}

const sentinelObserver = new MutationObserver((mutations) => {
  if (mutations.some(m => affectsProtectedRegion(m))) checkCriticalInvariants();
});
sentinelObserver.observe(criticalRegion, { childList: true, subtree: true });
```

1. Define critical-path invariants explicitly: key DOM nodes present, essential handlers bound, required network calls functional.
2. Add lightweight runtime checks around those specific invariants, not a general-purpose DOM integrity scanner that's expensive and noisy.
3. Detect anomaly *patterns*, not specific extension names — enumerating extensions is neither reliable nor, frankly, the team's business.
4. On probable interference: switch to a resilient fallback UX, show user-facing guidance, log diagnostic evidence for support and engineering to actually use.
5. Keep a support playbook with reproducible extension profiles, so a reported issue can be tested against a known configuration instead of guessed at.
6. Harden the app surface generally: strict CSP, dependency integrity controls, defensive coding against global namespace pollution that an extension might have caused.

## What You Can Do vs. What You Cannot

**Can do:** detect symptoms with high confidence, isolate critical workflows from the blast radius, provide recovery guidance, harden against common injection side effects.

**Cannot do:** reliably enumerate all installed extensions, fully prevent user-authorized extensions from changing page behavior, or guarantee perfect compatibility with an arbitrary, unbounded extension ecosystem.

## Privacy and Compliance

Avoid collecting extension-identifying fingerprints — that crosses from "diagnosing interference" into "profiling the user's installed software," which is a different and much more sensitive category of data. Collect only interference symptoms and their technical impact. Disclose diagnostic collection in the privacy documentation the same way any other client-side diagnostic gets disclosed.

## Test Matrix You Actually Need

- Baseline no-extension runs, as the reference point everything else compares against.
- Curated extension sets: ad blockers, privacy blockers, password managers, accessibility helpers — the categories most likely to interact with page behavior.
- The full desktop browser matrix run against the same extension profiles, since interference patterns aren't identical across engines.
- Critical-flow integrity checks specifically under extension load, not just a general smoke test.

## Decision Summary

Use this when the app is operationally sensitive and support volume actually matters to the business.

Avoid pretending extension interference is rare noise — at scale, across a real user population, it becomes a recurring, identifiable production issue class, not a one-off anomaly to shrug off each time it's reported.
