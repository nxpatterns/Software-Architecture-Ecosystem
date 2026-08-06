# Use Case 55: Badging API for Glanceable State in Installed PWAs

People do not open apps to check if nothing happened.
Badges exist to avoid pointless app opens.

This use case covers lightweight status signaling via app-icon badging.

## Why this is hard

Badge semantics are easy to overdo.
Cross-platform behavior differs.
And stale counts destroy trust fast.

## User Story (Abstracted)

A user can:

- see pending items at a glance,
- decide if opening the app is worth it,
- trust that badge state is current.

## Core Browser Technologies

- Badging API (`setAppBadge`, `clearAppBadge`).
- Service worker update hooks.
- Durable local state reconciliation.

## Browser Reality Check

- Works best for installed PWA contexts.
- Browser/OS support varies.
- Must degrade to in-app indicators and notifications.

## What breaks first

- badge count drifts from actual backend state
- no clear rules for when to clear badge
- badge spam for low-value events
- no offline reconciliation strategy

## Minimal Blueprint

1. Define strict badge semantics (what counts, what does not).
2. Update badge only on authoritative state changes.
3. Reconcile count on app open and periodic sync.
4. Clear aggressively when user has consumed items.
5. Keep fallback indicators equivalent.

## Test Matrix

- fresh install and re-install behavior
- offline increments and later reconciliation
- multi-device state divergence
- permission and unsupported-mode fallbacks

## Decision Summary

Badges are a precision tool.
If everything deserves a badge, nothing deserves a badge.
