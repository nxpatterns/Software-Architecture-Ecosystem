# Use Case 65: Attribution Reporting API for Privacy-Safe Conversion Measurement

Legacy attribution expected user-level cross-site traceability.
Modern browsers increasingly reject that model.

## Why this is hard

Teams want precision.
Browsers enforce privacy boundaries.
Attribution Reporting forces aggregate and delayed measurement thinking.

## User Story (Abstracted)

A team can:

- measure campaign effectiveness,
- preserve privacy constraints,
- and avoid overclaiming deterministic conversion paths.

## Core Browser Technologies

- Attribution Reporting API source/trigger registration.
- Aggregated reporting pipelines.
- Consent-aware measurement orchestration.

## What breaks first

- expecting user-level path reconstruction
- no data quality envelope for delayed/aggregated reports
- mixing incompatible legacy and privacy-safe metrics in one KPI

## Minimal Blueprint

1. Define which decisions need aggregate attribution only.
2. Instrument source and trigger flows with clear schema contracts.
3. Build report ingestion and reconciliation against first-party conversions.
4. Publish confidence bounds with every attribution dashboard.

## Decision Summary

Use this where privacy-safe attribution is required.
Do not present it as deterministic individual-user tracking.
