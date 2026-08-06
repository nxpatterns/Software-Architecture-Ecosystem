# Use Case 47: Idle Detection Driven Background Orchestration

Sometimes the best time to do heavy work is when the user is not there.
Not because we are sneaky.
Because we are polite.

This use case shows how to schedule non-urgent client tasks based on user-idle and screen-lock signals.

## Why this is hard

Idle is not universal.
Support differs by browser and policy.
And a bad implementation quickly looks creepy.

## User Story (Abstracted)

A user experiences:

- smoother foreground interaction,
- fewer visible slowdowns,
- predictable privacy controls for idle-aware behavior.

## Core Browser Technologies

- Idle Detection API (where available).
- Visibility lifecycle (`visibilitychange`, `pagehide`).
- Local task queue with priority classes.

## Browser Reality Check

- Chromium support with permission model.
- Not reliable cross-browser baseline.
- Must function normally without idle signals.

## What breaks first

- treating idle as guaranteed signal
- running sensitive actions without explicit user expectation
- no clear user-facing explanation or control
- scheduling huge jobs that still hurt battery and thermals

## Minimal Blueprint

1. Split jobs into urgent vs deferrable.
2. Gate only deferrable jobs behind idle hints.
3. Add explicit settings toggle for users.
4. Enforce runtime and energy budget per idle window.
5. Fall back to conservative periodic checks when unsupported.

## Privacy Notes

- document why idle state is observed
- avoid combining idle events with high-entropy fingerprint data
- keep retention short for idle-related diagnostics

## Test Matrix

- idle transitions and lock/unlock cycles
- permission denied/default/granted paths
- unsupported browser fallback behavior
- long-running sessions with mixed activity

## Decision Summary

Idle detection is useful as a scheduling hint, not as a control tower for critical workflows.
