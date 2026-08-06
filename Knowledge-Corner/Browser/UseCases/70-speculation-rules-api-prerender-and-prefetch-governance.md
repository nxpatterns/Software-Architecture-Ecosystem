# Use Case 70: Speculation Rules API for Prerender and Prefetch Governance

Performance wins are easy to fake in a lab test — a controlled network, a predictable click path, a graph that looks great in the sprint demo. Speculation Rules can deliver real wins in production, or real waste, entirely depending on governance.

## Why Wrong Predictions Cost More Than They Save

Prerendering and prefetching consume real bandwidth and cache budget. A wrong prediction doesn't just fail to help — it actively costs the user data and the server load, for a navigation that never happened. Speculation without governance is a bet the team keeps making even when it's losing.

## The User Story, Stripped of Domain

A user can:

- navigate faster to a likely next route,
- avoid a jarring loading wait on a predictable next click,
- do all of that without paying a hidden performance penalty elsewhere from wasted speculation.

## Core Browser Technologies

| API | Job | Reference |
|---|---|---|
| Speculation Rules API | Declares which routes to prefetch or prerender speculatively | [MDN – Speculation Rules API](https://developer.mozilla.org/en-US/docs/Web/API/Speculation_Rules_API) |
| Route prediction inputs | The actual signal deciding which routes are worth speculating on | [MDN - Speculation Rules API eagerness and where conditions](https://developer.mozilla.org/en-US/docs/Web/API/Speculation_Rules_API#speculation_rules), [MDN - Network Information API](https://developer.mozilla.org/en-US/docs/Web/API/Network_Information_API) |
| Performance + guardrail telemetry | Measures hit rate and wasted-fetch cost, not just perceived speed | [MDN - PerformanceNavigationTiming](https://developer.mozilla.org/en-US/docs/Web/API/PerformanceNavigationTiming), [MDN - PerformanceResourceTiming](https://developer.mozilla.org/en-US/docs/Web/API/PerformanceResourceTiming) |

## The Browser Reality Check

This is a Chromium feature, part of the broader push toward faster perceived navigation covered in the 2026 Baseline roundup of newly shipped platform capabilities — it isn't yet a universal cross-browser mechanism, so treat it as a Chromium-specific enhancement layered on top of a navigation experience that has to work fully without it.

## What Breaks First

- Over-broad rule scopes that speculate on far more routes than any real user actually follows, burning bandwidth on predictions that rarely pay off.
- No kill switch for a misprediction pattern that turns out to be expensive in production, leaving the team stuck shipping a fix instead of flipping a switch.
- Missing segmentation for constrained users — speculating aggressively on someone's limited mobile data plan is a cost decision made on their behalf without asking.

## Minimal Technical Blueprint

```html
<script type="speculationrules">
{
  "prerender": [{
    "where": { "href_matches": "/product/*" },
    "eagerness": "moderate"
  }]
}
</script>
```

```javascript
if (isConstrainedNetwork() || saveDataEnabled()) {
  disableSpeculationRules(); // gate by device/network class, not a blanket global rule
}
```

1. Start with tight, high-confidence route candidates — the checkout button on a product page, not every link on the site.
2. Gate speculation by device and network class explicitly; a user on `Save-Data` or a slow connection shouldn't pay for a bet the app is making on their behalf.
3. Measure hit rate, wasted-fetch cost, and actual UX impact together — a high hit rate with a low real-world benefit is still not a win worth the bandwidth spent.
4. Add a runtime kill switch, so an expensive misprediction pattern discovered in production can be turned off in minutes, not a release cycle.

## Decision Summary

Speculation should be treated like an optimization portfolio, not a global on/off flag — some routes are worth speculating on, some users are worth speculating for, and the governance around which combinations of the two are worth the cost is the actual feature, not the API call itself.
