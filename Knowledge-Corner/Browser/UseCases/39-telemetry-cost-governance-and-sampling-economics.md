# Use Case 39: Telemetry Cost Governance and Sampling Economics

Telemetry systems don't only fail technically. They fail financially too, and the financial failure mode is quieter — nobody gets paged when a telemetry bill triples, they just eventually get asked why.

With no cost governance, a team ends up in one of two equally bad places: overspending on noisy data nobody queries, or undersampling exactly the signals that actually mattered, because sampling was applied uniformly instead of by value.

## Why Event Volume Always Outgrows the Plan

Event volume scales faster than anyone budgets for. High-cardinality dimensions — a raw user ID, a full URL with query params, a free-text field — quietly explode storage and query cost far beyond what the event count alone would suggest. And teams keep adding events because adding one is easy and removing one is political; nobody wants to be the person who deleted the metric someone might need someday.

## The User Story, Stripped of Domain

A team can:

- control telemetry spend predictably, not discover it after the invoice,
- preserve decision-critical signal quality even under cost pressure,
- align sampling with actual business value instead of whatever was convenient to implement first.

## Core Browser Technologies

| Practice | Job | Reference |
|---|---|---|
| Client-side sampling by event class | Not every event needs 100% capture | [Sampling (statistics)](https://en.wikipedia.org/wiki/Sampling_(statistics)) |
| Dynamic sampling via remote config/feature flags | Sampling rates adjustable without a redeploy | [OpenFeature](https://openfeature.dev/docs/reference/intro/) |
| Payload budget enforcement | A hard cap preventing one event from ballooning silently | [MDN – CompressionStream](https://developer.mozilla.org/en-US/docs/Web/API/CompressionStream), [MDN – Blob.size](https://developer.mozilla.org/en-US/docs/Web/API/Blob/size) |
| Rate limiting and burst controls | Protects both cost and the ingest pipeline from a runaway producer | [Token bucket](https://en.wikipedia.org/wiki/Token_bucket) |
| Retention class tags at the event level | Not every event deserves the same storage lifetime | [Storage quotas and eviction criteria (MDN)](https://developer.mozilla.org/en-US/docs/Web/API/Storage_API/Storage_quotas_and_eviction_criteria) |

## The Browser Reality Check

This is an economics and governance problem, not a compatibility one — every browser can send an event at whatever sampling rate the client logic decides. The actual risk is that sampling logic, once shipped, tends to be forgotten: a flat sampling rate set once at launch rarely gets revisited as event volume and business priorities shift underneath it, quietly drifting out of alignment with what actually matters six months later.

## What Breaks First

- A flat sampling rate applied across all event types, treating a high-value conversion event and a low-value hover event identically.
- No cost ownership assigned to any producer team, so nobody notices — or feels responsible for — a new event class that quietly becomes the largest line item in the bill.
- Oversized payloads carrying redundant context fields nobody actually queries, paid for on every single event regardless.
- No TTL strategy for low-value raw data, which just accumulates indefinitely because deleting it was never anyone's job.

## Minimal Technical Blueprint

```javascript
const SAMPLING_CONFIG = {
  'checkout.completed': 1.0,   // business-critical — always captured
  'button.hover': 0.01,        // low value, aggressively sampled
};

function shouldSample(eventName) {
  const rate = remoteConfig.get(`sampling.${eventName}`) ?? SAMPLING_CONFIG[eventName] ?? 0.1;
  return Math.random() < rate; // adjustable at runtime, no redeploy needed
}

function enforcePayloadBudget(fields) {
  const size = JSON.stringify(fields).length;
  if (size > MAX_PAYLOAD_BYTES) return stripToAllowlist(fields); // hard cap, not a suggestion
  return fields;
}
```

1. Classify telemetry by business value tier explicitly — a conversion event and a hover event were never the same category, and treating them as one is how budget gets misallocated.
2. Set per-tier sampling and retention policies, decided deliberately rather than inherited from whatever the first implementation happened to do.
3. Enforce payload size budgets and field allowlists, so an event can't silently grow to carry redundant context nobody's actually using downstream.
4. Add per-team cost attribution dashboards, so the team generating a cost is the team that sees it, rather than one central bill nobody can trace back to a cause.
5. Define an actual event deprecation lifecycle — a formal process for retiring an event, rather than letting it accumulate forever because removing it feels politically risky.
6. Run quarterly telemetry portfolio reviews, treating the event catalog as something that needs active maintenance, not a write-once artifact.

## Privacy and Compliance

Cost optimization must never bypass privacy controls — a sampled event still contains real user data, and "we only kept 1%" is not an exemption from the same governance the other 99% would have needed. Sampled data requires the full governance treatment regardless of sampling rate; the privacy risk of a single captured record doesn't shrink just because fewer records were captured overall.

## Test Matrix You Actually Need

- Cost simulation by traffic tier, projecting what a sampling change actually does to spend before it ships.
- Sampling quality impact on key metrics, confirming a lower sampling rate doesn't quietly corrupt the statistics built on top of it.
- Dynamic sampling rollout safety tests, confirming a remote config change can't accidentally sample a critical event down to near-zero.
- Event suppression failure scenarios, confirming a sampling bug fails toward capturing too much rather than silently capturing too little.

## Decision Summary

Use this when telemetry operates at real scale and cost genuinely matters to the business running it.

Avoid unlimited data capture strategies that degrade both budget and clarity at the same time — a telemetry pipeline that captures everything indiscriminately isn't more informative than one with deliberate sampling, it's just more expensive to be equally confused by.
