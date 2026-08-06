# Use Case 34: Ad-Blocker and Script-Blocker Resilient Measurement

If the measurement stack collapses the moment a blocker is enabled, that isn't observability. It's best-case telemetry, and best-case telemetry is a polite way of saying "telemetry that only works for the users who didn't try to protect their privacy."

## Why Blocked Data Loss Is Worse Than Random Data Loss

Blockers block endpoints, script domains, request patterns, and sometimes runtime behavior directly. The resulting data loss is selective, not uniform — it's concentrated exactly among privacy-conscious users, which means the bias it introduces isn't random noise. It's a systematic skew in whatever the dashboard is telling leadership.

## The User Story, Stripped of Domain

A telemetry system can:

- detect likely measurement degradation as it's happening,
- preserve essential first-party technical telemetry regardless of third-party blocking,
- quantify its own blind spots honestly,
- avoid false confidence in a dashboard that looks complete but isn't.

## Core Browser Technologies

| Practice | Job | Reference |
|---|---|---|
| First-party telemetry endpoints | Avoid third-party domains that block lists target first | [MDN – Same-origin policy](https://developer.mozilla.org/en-US/docs/Web/Security/Same-origin_policy) |
| Graceful SDK fallback layers | Degrade instead of silently failing when a script never loads | [MDN – HTMLScriptElement](https://developer.mozilla.org/en-US/docs/Web/API/HTMLScriptElement), [SRI (MDN)](https://developer.mozilla.org/en-US/docs/Web/Security/Subresource_Integrity) |
| Blocked-request heuristics | Detect the failure pattern, don't just absorb it silently | [MDN – Fetch API](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API), [MDN – navigator.onLine](https://developer.mozilla.org/en-US/docs/Web/API/Navigator/onLine) |
| Local counters for unsent event classes | Know what didn't ship, not just what did | [MDN – IndexedDB API](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API) |
| Delivery health metrics by browser cohort | Blind spots vary by cohort — measure them as such | [MDN – User-Agent Client Hints](https://developer.mozilla.org/en-US/docs/Web/API/User-Agent_Client_Hints_API) |

## The Browser Reality Check

This isn't a browser-support question — it's a request-pattern question. Popular block lists (EasyList and its derivatives, which power most ad and tracker blockers regardless of which extension a user installed) target known third-party analytics domains, common SDK filenames, and recognizable request patterns. A telemetry request that looks like every other analytics beacon on the web is exactly the request most likely to be silently dropped, on any browser, by any blocker following those lists.

Browsers with built-in tracking protection compound this: Safari's Intelligent Tracking Prevention and Firefox's Enhanced Tracking Protection both restrict third-party request patterns by default, with zero extension required — meaning "resilient to ad blockers" and "resilient to default browser privacy settings" are now overlapping requirements, not two separate problems.

## What Breaks First

- The third-party analytics script simply never loads, and nothing in the pipeline notices.
- Beacon endpoints get blocked by pattern lists that recognize the URL shape, independent of what domain it's actually hosted on.
- Dashboards show "healthy" because a failed emission is invisible by default — no error is thrown, the event just never existed as far as the pipeline can tell.
- Product events go missing while error telemetry still comes through fine, because the error-reporting path happened to use a domain or pattern the blockers don't recognize yet.

## Minimal Technical Blueprint

```javascript
async function sendCriticalEvent(event) {
  try {
    const res = await fetch('/first-party-collect', { // same-origin, not a recognizable SDK path
      method: 'POST', body: JSON.stringify(event), keepalive: true,
    });
    if (!res.ok) recordDeliveryFailure(event.name);
  } catch {
    recordDeliveryFailure(event.name); // network-level block looks identical — count it anyway
    incrementUnsentCounter(event.name);
  }
}

function reportBlockerImpact() {
  const unsentRate = unsentCounters.total / (unsentCounters.total + deliveredCount);
  if (unsentRate > 0.05) flagDashboardConfidence('degraded'); // honest, not silent
}
```

1. Separate critical telemetry from optional analytics explicitly — the two categories deserve different resilience investment, and conflating them means critical signals inherit optional-analytics fragility.
2. Prefer first-party collection paths for critical signals — same-origin requests aren't immune to blocking, but they dodge the most common third-party domain and SDK-pattern lists.
3. Measure delivery health as a first-class metric in its own right, not an afterthought nobody dashboards.
4. Emit blocker-impact diagnostics in privacy-safe, aggregate form — the goal is understanding the blind spot's size, not identifying which individual users have a blocker installed.
5. Mark dashboards with explicit data-quality confidence bands, so a viewer can tell "this number is solid" from "this number has a known blind spot."
6. Design decisions around confidence, not raw counts — a raw count with an unmeasured, unevenly distributed blind spot is worse than an honest range.

## Privacy and Compliance

Don't escalate tracking behavior to bypass user intent — the goal here is resilience against silent, invisible failure, never circumvention of a blocker a user deliberately installed. Respect explicit user tooling choices as a real signal about what that user wants, not an obstacle to route around cleverly. The entire point of this use case is honesty about blind spots, not eliminating them by any means available.

## Test Matrix You Actually Need

- Major blocker setups on desktop browsers — uBlock Origin, AdGuard, and at minimum one browser's built-in blocking, tested separately.
- Strict privacy browser modes (Safari ITP, Firefox ETP strict mode) tested as their own category, not lumped in with extension-based blocking.
- Endpoint block simulations, deliberately triggered to confirm the failure is actually detected rather than silently absorbed.
- Script load failure chaos tests — kill the third-party SDK load entirely and confirm the fallback path still captures what it can.

## Decision Summary

Use this when decision-making genuinely depends on telemetry reliability, and the team is willing to build honest confidence bands rather than pretend the dashboard is complete.

Avoid any strategy that treats blocker-induced blind spots as negligible — they aren't randomly distributed, and treating a systematically biased sample as representative is how a dashboard quietly starts lying to the people making decisions from it.
