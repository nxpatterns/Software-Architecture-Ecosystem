# Use Case 23: Time Synchronization and Event Ordering Resilience

If event time is wrong, causality is wrong.
If causality is wrong, every funnel and incident timeline is suspect.

## Why this is hard

Client clocks drift.
Offline queues reorder delivery.
Retries duplicate events.
Multi-tab sessions interleave sequences.

## User Story (Abstracted)

A telemetry system can:

- reconstruct event order with high confidence,
- survive offline and retry behavior,
- and separate event occurrence time from ingest time.

## Core Browser Technologies

- monotonic local sequence counters
- event ids plus idempotency keys
- client-occurrence timestamp + enqueue timestamp
- server-receive timestamp enrichment
- queue persistence with deterministic replay order

## What breaks first

- relying only on wall-clock timestamps
- assuming ingest order equals occurrence order
- no dedupe under retry storms
- no strategy for clock skew

## Minimal Blueprint

1. Include three time dimensions:
   - event occurrence
   - local enqueue
   - server receive
2. Add monotonic sequence per session/tab.
3. Use stable event ids and dedupe windows.
4. Reorder offline batches by sequence before ingest.
5. Track clock skew indicators where possible.
6. Build analytics queries that respect uncertainty bounds.

## Privacy and Compliance Notes

- avoid over-collecting high-precision timing signals without purpose
- document retention for raw ordering metadata

## Test Matrix

- manual clock skew simulation
- offline batch replay scenarios
- duplicate delivery chaos tests
- multi-tab interleaving timelines

## Decision Summary

Use this when telemetry supports causality-sensitive decisions.
Avoid naive timestamp-only ordering in distributed client environments.
