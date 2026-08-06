# Use Case 60: Payment Request API for Checkout Friction Reduction

Checkout abandonment is expensive.
Form friction is one of the most reliable causes.

This use case covers Payment Request API as a browser-native checkout accelerator.

## Why this is hard

Payment flows are business-critical and compliance-heavy.
Browser wallet UX differs by platform.
And fallback behavior must be flawless.

## User Story (Abstracted)

A user can:

- complete payment with fewer manual fields,
- use trusted browser/device payment surfaces,
- recover cleanly if payment flow is canceled.

## Core Browser Technologies

- Payment Request API.
- Merchant backend confirmation and idempotency.
- Checkout state machine with cancel/retry paths.

## Browser Reality Check

- support and wallet options vary by browser/OS/payment method
- requires robust traditional checkout fallback
- never treat API availability as guaranteed conversion win

## What breaks first

- no idempotency key for repeated payment attempts
- optimistic success UI before backend confirmation
- poor handling of cancel/timeout flows
- shipping wallet-only path without card-form fallback

## Minimal Blueprint

1. Keep payment initiation explicit and user-triggered.
2. Build strict state machine: initiated, pending, confirmed, failed, canceled.
3. Confirm payment server-side before success view.
4. Use idempotency keys for every payment attempt.
5. Provide resilient fallback checkout.

## Test Matrix

- cancel and retry loops
- network loss after authorization
- duplicate submit protection
- cross-browser wallet availability differences

## Decision Summary

Payment Request can reduce friction.
Only if backend correctness is stronger than frontend optimism.
