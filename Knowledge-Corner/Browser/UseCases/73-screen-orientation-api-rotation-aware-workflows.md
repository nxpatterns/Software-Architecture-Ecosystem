# Use Case 73: Screen Orientation API for Rotation-Aware Workflows

Orientation is often treated like visual polish.
In capture, gaming, and kiosk flows, it is operational behavior.

## Why this is hard

Lock capability is constrained by context and user gesture.
Platform behavior differs.
And forced orientation can hurt accessibility.

## User Story (Abstracted)

A user can:

- receive orientation-aware UI behavior,
- avoid accidental layout breakage on rotate,
- and keep control where lock is unsupported.

## Core Browser Technologies

- Screen Orientation API.
- Responsive layout + orientation event handling.
- Accessibility-aware orientation fallback.

## What breaks first

- forcing lock where not allowed
- no graceful rotate fallback
- interaction loss during orientation transitions

## Minimal Blueprint

1. Use orientation lock only where functionally necessary.
2. Keep responsive fallback for all screens.
3. Persist transient interaction state across rotate events.
4. Test orientation flows with assistive-tech scenarios.

## Decision Summary

Orientation APIs should improve task completion, not fight user control.
