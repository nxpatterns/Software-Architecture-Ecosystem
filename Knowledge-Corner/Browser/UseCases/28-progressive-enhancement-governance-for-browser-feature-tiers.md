# Use Case 28: Progressive Enhancement Governance for Browser Feature Tiers

Most teams say they do progressive enhancement. What they usually mean is "we hope unsupported browsers fail politely" — hope being the operative word, not a strategy.

This turns that hope into governance: feature tiers, capability contracts, rollout controls, fallback economics, and kill-switch discipline that actually exists before it's needed at 2 a.m.

## Why Browser Diversity Is a Risk Problem, Not a Detail

Without governance, one new API rollout can produce invisible breakage in a single browser family, support overload concentrated in one region, and a rollback panic because nobody defined who actually owns the feature. Yes, this is still "frontend." No, it is not small.

## The User Story, Stripped of Domain

- access core workflows on any supported baseline browser,
- get enhanced capabilities on stronger environments,
- receive clear guidance the moment a feature isn't available,
- never hit a dead end caused by a silent capability assumption nobody tested.

Media, offline, background sync, device APIs, rich clipboard — any modern app with optional advanced features hits the same governance pattern, just wearing different feature modules.

## Core Browser Technologies

| API / Practice | Job | Reference |
|---|---|---|
| Runtime capability detection (`in` checks, API probing) | Feature presence verification | — |
| Permission probing + guarded execution | Check before you leap, every time | [MDN – Permissions API](https://developer.mozilla.org/en-US/docs/Web/API/Permissions_API) |
| Feature flags / remote config | Controlled rollout, fast rollback | — |
| Telemetry instrumentation | Capability distribution and error-rate correlation | — |
| Cohort/A-B rollout controls | Staged exposure by browser/version cohort | — |
| Fallback UX components | Explicit degraded-mode flows, not a blank space | — |
| Service worker versioning | Safe, progressive rollout of client behavior | [MDN – Service Worker API](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API) |

## The Browser Reality Check

The feature matrix is not a static spreadsheet. It's a moving target with release notes attached, and the moving parts are the whole reason this needs governance rather than a one-time decision.

Chromium often exposes newer APIs first — genuinely useful, and also the exact temptation that gets teams to overfit their architecture to whatever Chrome shipped last month. Firefox and Safari usually catch up enough for a solid baseline, but not always in time for the newest enhancement layer, and "not always" is doing real work in that sentence.

Android Chromium can support advanced features noticeably earlier than iOS Safari. WebKit's policy defaults and lifecycle constraints create hard ceilings for certain enhancements on iOS that no amount of clever client code works around — some gaps are policy, not a bug waiting for a fix.

## What Breaks First

- Browser sniffing instead of capability testing — a user agent string tells you what the browser claims to be, not what it can actually do right now.
- Treating the baseline fallback as an afterthought bolted on after the enhanced path shipped.
- Shipping enhancement logic with zero telemetry hooks, so nobody can tell whether it's actually working in the field.
- One global kill switch covering ten unrelated features, so disabling the one that's broken takes down nine that weren't.
- Rolling out without per-tier support documentation, leaving the support team improvising answers live.
- Product promises written for Tier 2 while the actual user base largely lives in Tier 0.

If support hears about a compatibility issue before telemetry does, the governance was decorative.

## Minimal Technical Blueprint

```javascript
const featureRegistry = {
  richClipboard: {
    tier: 1,
    check: () => 'clipboard' in navigator && 'write' in navigator.clipboard,
    killSwitch: 'feature.richClipboard.enabled',
  },
};

function isEnabled(featureName) {
  const feature = featureRegistry[featureName];
  const enabled = feature.check() && remoteConfig.get(feature.killSwitch);
  logGateDecision(featureName, enabled, feature.tier); // every decision, every time
  return enabled;
}
```

1. Define explicit feature tiers: Tier 0 the baseline must-work path, Tier 1 moderate enhancement, Tier 2 advanced enhancement — named tiers, not a vague sense of "nice to have."
2. For every feature, define a contract table: capability requirements, permission requirements, fallback behavior, and the exact user-facing messaging for when it's unavailable.
3. Build a runtime capability registry at app startup, checked once and reused rather than probed ad hoc across the codebase.
4. Gate every enhancement behind three things together: a capability check, a feature flag, and a named kill-switch identifier.
5. Instrument every gate decision — enabled or disabled, the reason, the browser/version cohort, any failure code — so the data exists before someone needs to ask for it.
6. Roll out in cohorts: internal first, then a small external slice, then staged expansion — never everyone at once for anything new.
7. Maintain a per-feature rollback plan with a named owner and an actual SLA attached.
8. Review the whole matrix quarterly, or on every major browser release cycle, whichever comes first.

## Compatibility Strategy

**Baseline:** core business workflows fully operational, zero dependency on cutting-edge APIs, explicit degraded-mode UX that looks intentional rather than broken.

**Enhanced:** optional accelerators and richer experiences, enabled only where verified safe, immediately reversible through a scoped kill switch that doesn't take anything else down with it.

Baseline is the product. Enhancement is the advantage layered on top. Confusing the two is how a Tier 2 outage becomes a Tier 0 incident.

## Security and Compliance

Capability detection data can become fingerprinting-adjacent if over-collected — a detailed enough feature-support fingerprint is itself an identifying signal, so minimize and aggregate telemetry rather than logging every probe in full detail. Document feature-flag governance and change controls for whoever runs the audit. Make kill-switch authority and incident procedures explicit — "who's allowed to flip this switch" should never be a question asked for the first time during an actual incident. Avoid exposing internal policy logic in client-visible error messages; a fallback message should explain the situation to the user, not narrate the architecture to anyone watching network traffic.

Governance without auditability is just a fancy dashboard.

## Test Matrix You Actually Need

- Browser/version cohort coverage for every tier, desktop and mobile both.
- Forced no-capability tests that simulate missing APIs directly, rather than waiting for a real unsupported browser to surface the gap.
- Feature-flag rollback drills run in staging and a production-like environment, not just discussed in a design doc.
- Permission denied, default, and granted paths, all three.
- Partial rollout monitoring with real error-budget thresholds attached.
- UX validation of fallback copy and actual task completion rates, not just "does it render."
- Support playbook dry-runs specifically for degraded-tier incidents.

If the rollout plan is "ship and monitor Twitter," that isn't governance. That's adrenaline.

## Decision Summary

Use this when the product spans multiple browser capability classes, when advanced features are optional but genuinely valuable, and when reliability and support cost actually matter to the business.

Don't pretend it's handled when the baseline path isn't fully implemented, when telemetry is missing, or when rollback controls are coarse, undefined, or exist only as an intention.

Progressive enhancement can absolutely scale. Only when it's managed like a system — not improvised like a demo that happened to work once.
