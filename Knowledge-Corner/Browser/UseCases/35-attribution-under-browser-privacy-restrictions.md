# Use Case 35: Attribution Under Browser Privacy Restrictions

Attribution models built on 2018 tracking assumptions fail quietly in modern browsers. Quiet failure is the dangerous kind — the dashboard keeps producing numbers, they just stop meaning what everyone assumes they mean.

## Why Attribution Confidence Erodes Before Anyone Admits It

Referrer policies, link-decoration limits, storage partitioning, and anti-tracking controls all chip away at cross-context identity continuity. Attribution confidence drops well before a team is willing to say so out loud in a planning meeting.

## The User Story, Stripped of Domain

A team can:

- estimate channel influence with realistic confidence, not manufactured precision,
- avoid over-claiming certainty the data doesn't actually support,
- align attribution methodology with the privacy constraints browsers now enforce by default.

## Core Browser Technologies

| Practice / API | Job | Reference |
|---|---|---|
| First-party event stitching with bounded identity windows | Deterministic attribution where it's actually still possible | [MDN – First-party cookies](https://developer.mozilla.org/en-US/docs/Web/Privacy/Guides/Third-party_cookies#what_is_the_problem_with_third-party_cookies) |
| Campaign parameter normalization and expiration | UTM-style params handled consistently, never trusted indefinitely | [UTM parameters (Wikipedia)](https://en.wikipedia.org/wiki/UTM_parameters) |
| Consent-aware attribution metadata collection | Attribution data follows the same consent rules as everything else | [MDN – Permissions API](https://developer.mozilla.org/en-US/docs/Web/API/Permissions_API) |
| Probabilistic/aggregate attribution layers | The honest fallback where deterministic links genuinely fail | [Attribution Reporting API (MDN)](https://developer.mozilla.org/en-US/docs/Web/API/Attribution_Reporting_API) |

## Browser-Native Replacement APIs (Must Include)

- **Attribution Reporting API:** conversion measurement without cross-site user tracking — the actual browser-native mechanism replacing the third-party-cookie-based attribution most legacy stacks still assume.
- **Topics API / Protected Audience:** ad-relevance and audience workflows under third-party-cookie restrictions.
- **Private State Tokens:** anti-fraud confidence signals with no persistent identity join required.

These exist precisely because the old model — a third-party cookie following a user across every site to stitch together a journey — is what browsers are actively dismantling. An attribution architecture that doesn't name these APIs is an architecture still designed for a web that's already gone in the browsers enforcing this hardest.

## What Breaks First

- Last-click overfitting from partial data, confidently attributing 100% of a conversion to the one touchpoint that happened to survive the identity restrictions, while every earlier touchpoint silently vanished from the record.
- Hidden channel bias from blocked or stripped signals — the channels most aggressively blocked aren't randomly distributed, so the resulting bias favors whichever channels happen to survive the restrictions best, not whichever channels actually work best.
- Inconsistent campaign parameter parsing across different landing routes, quietly fragmenting what should be one campaign into several undercounted pieces.
- Inflated attribution certainty in executive reports, where a genuinely probabilistic estimate gets presented with the confidence of a deterministic count.

## Minimal Technical Blueprint

```javascript
function recordConversion(event) {
  const attribution = resolveAttribution(event); // may be deterministic OR inferred — know which
  logConversion({
    ...event,
    attributionPath: attribution.type,      // 'deterministic' | 'probabilistic' | 'unknown'
    confidence: attribution.confidence,     // never omit this field
    identityWindowDays: attribution.windowUsed,
  });
}
```

1. Define explicit attribution confidence levels — deterministic, probabilistic, unknown — and require every conversion record to declare which one it is.
2. Separate deterministic and inferred attribution paths entirely rather than blending them into one number that hides which kind of evidence it's actually built on.
3. Limit identity windows deliberately and document the assumption behind the chosen length — a 30-day window is a decision, not a default that arrived on its own.
4. Record attribution provenance per conversion event, so a report built six months later can still explain how each number was actually derived.
5. Report confidence alongside every conversion figure — a number with no confidence attached invites exactly the overclaiming this whole use case exists to prevent.
6. Reconcile against backend sources wherever possible, since a backend order record is a stronger source of truth than any client-side attribution guess.

## Privacy and Compliance

Strict minimization of any campaign-linked personal data — attribution doesn't need a full identity, it needs enough signal to reasonably credit a channel. Keep short retention windows for sensitive attribution joins specifically, since these are exactly the kind of cross-context data that regulators and browser vendors alike are actively restricting. Use transparent policy language describing the attribution logic itself, not just the general privacy policy boilerplate — marketing teams and legal teams both need to actually understand what the numbers do and don't represent.

## Test Matrix You Actually Need

- Privacy-mode browser cohorts, tested as their own category against the standard-mode baseline.
- Parameter stripping and redirect chains, deliberately exercised to see where campaign context gets lost.
- Cross-tab and delayed-conversion flows, since a conversion minutes or days after the original click is exactly where identity continuity is weakest.
- Consent deny/grant transitions, confirming attribution collection actually respects the current consent state in real time.

## Decision Summary

Use this when marketing or resource allocation genuinely depends on attribution data, and the team is willing to report confidence honestly rather than paper over the gaps.

Avoid deterministic-sounding claims where the underlying runtime evidence is actually probabilistic — a false sense of precision is worse for resource allocation than an honest range, because it gets acted on with more confidence than it deserves.
