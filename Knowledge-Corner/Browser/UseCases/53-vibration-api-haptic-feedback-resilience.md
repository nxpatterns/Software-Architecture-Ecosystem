# Use Case 53: Vibration API for Haptic Feedback Resilience

A short vibration can improve perceived responsiveness.
Relying on vibration for correctness is a design bug.

This use case covers haptic feedback as optional UX signal in browser apps.

## Why this is hard

Support is inconsistent and shrinking in some engines.
Silent failure is common.
And teams often overestimate what haptics can communicate reliably.

## User Story (Abstracted)

A user gets:

- subtle tactile confirmation for actions,
- no functional dependency on haptics,
- accessible alternatives when vibration is unavailable.

## Core Browser Technologies

- Vibration API (`navigator.vibrate`).
- Input and state-based feedback mapping.
- Accessibility-compatible visual/audio equivalents.

## Browser Reality Check

- Not universally supported.
- Safari historically unsupported; Firefox support reduced/removed.
- Must behave correctly with zero haptic capability.

## What breaks first

- using vibration as only confirmation signal
- firing long or frequent patterns that annoy users
- no user setting to disable haptics
- assuming desktop hardware behaves like phones

## Minimal Blueprint

1. Map only high-value events to short vibration patterns.
2. Provide user-level haptics toggle.
3. Always pair with visual feedback.
4. Keep patterns brief and sparse.
5. Treat API no-op as normal path.

## Test Matrix

- supported Android devices
- unsupported browsers and silent-fail behavior
- accessibility modes and reduced-motion preferences
- rapid action bursts and battery impact checks

## Decision Summary

Haptics can polish UX.
They cannot carry business-critical semantics.
