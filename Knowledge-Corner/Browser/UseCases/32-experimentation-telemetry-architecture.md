# Use Case 17: Experimentation Telemetry Architecture in Browser Apps

A/B testing is easy to start and very easy to do wrong.
If exposure tracking is weak, you are not running experiments. You are generating random stories.

## Why this is hard

Browser lifecycles, multi-tab behavior, late-loading features, and cached state can all corrupt assignment and exposure signals.
Without strict telemetry design, variant effect sizes become fiction.

## User Story (Abstracted)

A product team can:

- assign users deterministically to variants,
- log trustworthy exposure moments,
- avoid cross-variant contamination,
- and produce statistically usable results.

## Core Browser Technologies

- deterministic client assignment checks (or server-issued assignment)
- exposure event hooks at actual render/interaction boundaries
- local assignment cache with versioning
- cross-tab coordination for assignment consistency
- batched event delivery with idempotency keys

## What breaks first

- exposure logged on page load even if feature never rendered
- reassignment after refresh due to unstable bucketing inputs
- multiple exposure events per user/session without dedupe
- variant contamination in multi-tab sessions
- missing holdout/control telemetry metadata

## Minimal Blueprint

1. Define assignment contract:
   - experiment id
   - variant id
   - assignment version
2. Define exposure contract:
   - when exposure is valid
   - where it is emitted
   - dedupe rules
3. Persist assignment with expiry and migration rules.
4. Emit exposure only when variant UI is truly visible/usable.
5. Use idempotency keys per user-experiment-window.
6. Tag every outcome event with experiment context.
7. Add contamination detection metrics.

## Privacy and Compliance Notes

- avoid high-entropy identity joins when not needed
- treat experimentation metadata as governed data
- ensure consent state can disable non-essential experiment tracking

## Test Matrix

- reload and hard-refresh assignment stability
- multi-tab simultaneous usage
- offline/online delayed event delivery
- feature-flag rollback mid-experiment
- exposure dedupe under retries

## Decision Summary

Use this when experimentation drives roadmap decisions.
Avoid pseudo-experiments where exposure quality is unverified.
