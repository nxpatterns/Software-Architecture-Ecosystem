# Use Case 70: Speculation Rules API for Prerender and Prefetch Governance

Performance wins are easy to fake in lab tests.
Speculation Rules can deliver real wins, or real waste, depending on governance.

## Why this is hard

Prerender/prefetch can consume bandwidth and cache budget.
Wrong predictions amplify cost without UX gain.

## User Story (Abstracted)

A user can:

- navigate faster on likely next routes,
- avoid jarring loading waits,
- while not paying hidden performance penalties elsewhere.

## Core Browser Technologies

- Speculation Rules API.
- Route prediction inputs.
- Performance telemetry and guardrail metrics.

## What breaks first

- over-broad rule scopes
- no kill switch for expensive misprediction behavior
- missing segmentation (mobile constrained users)

## Minimal Blueprint

1. Start with tight, high-confidence route candidates.
2. Gate by device/network class.
3. Measure hit rate, wasted fetch cost, and UX impact.
4. Add runtime kill switch.

## Decision Summary

Speculation should be treated like an optimization portfolio, not a global on/off flag.
