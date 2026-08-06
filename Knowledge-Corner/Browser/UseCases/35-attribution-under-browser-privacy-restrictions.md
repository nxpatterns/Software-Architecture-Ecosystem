# Use Case 20: Attribution Under Browser Privacy Restrictions

Attribution models built for 2018 tracking assumptions fail quietly in modern browsers.
Quiet failure is the dangerous kind.

## Why this is hard

Referrer policies, link decoration limits, storage partitioning, and anti-tracking controls reduce cross-context identity continuity.
Attribution confidence drops long before teams admit it.

## User Story (Abstracted)

A team can:

- estimate channel influence with realistic confidence,
- avoid over-claiming precision,
- and align attribution with modern privacy constraints.

## Core Browser Technologies

- first-party event stitching with bounded identity windows
- campaign parameter normalization and expiration
- consent-aware attribution metadata collection
- probabilistic/aggregate attribution layers where deterministic links fail

## What breaks first

- last-click overfitting from partial data
- hidden channel bias from blocked/stripped signals
- inconsistent campaign parsing across landing routes
- inflated attribution certainty in executive reports

## Minimal Blueprint

1. Define attribution confidence levels.
2. Separate deterministic and inferred attribution paths.
3. Limit identity windows and document assumptions.
4. Record attribution provenance per conversion event.
5. Report confidence alongside conversion figures.
6. Reconcile with backend sources where possible.

## Privacy and Compliance Notes

- strict minimization of campaign-linked personal data
- short retention for sensitive attribution joins
- transparent policy language on attribution logic

## Test Matrix

- privacy mode browser cohorts
- parameter stripping and redirect chains
- cross-tab and delayed conversion flows
- consent deny/grant transitions

## Decision Summary

Use this when marketing/resource allocation depends on attribution.
Avoid deterministic claims where runtime evidence is probabilistic.
