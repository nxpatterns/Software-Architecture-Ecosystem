# Use Case 74: Shape Detection API for Barcode/Face/Text Pipelines

Computer-vision-lite in the browser is useful.
Support constraints are real.

## Why this is hard

API support is limited.
Input quality varies wildly.
And teams often skip fallback design for unsupported engines.

## User Story (Abstracted)

A user can:

- scan barcode/shape/text candidates quickly,
- get near-real-time guidance,
- and still complete tasks when detection is unavailable.

## Core Browser Technologies

- Shape Detection API family.
- Camera capture pipeline and frame throttling.
- Fallback detection path (server-side or manual input).

## What breaks first

- no fallback outside supported browsers
- unbounded frame processing on main thread
- false positive handling missing from UX flow

## Minimal Blueprint

1. Capability-detect detector classes.
2. Throttle frame processing and keep UI thread responsive.
3. Add confidence thresholds and manual confirmation.
4. Provide fallback path for unsupported/low-confidence cases.

## Decision Summary

Shape detection is a powerful enhancement.
Baseline workflows must survive without it.
