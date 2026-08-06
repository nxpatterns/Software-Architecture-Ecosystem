# Use Case 71: Geolocation API for Context-Aware Location Workflows

Location is useful.
Location is sensitive.
Both statements must be true in your architecture.

## Why this is hard

Permission friction is high.
Precision and reliability vary.
And legal/privacy expectations are stricter than most teams plan for.

## User Story (Abstracted)

A user can:

- share location intentionally,
- receive context-aware functionality,
- and understand what is collected and for how long.

## Core Browser Technologies

- Geolocation API.
- Permission status and runtime handling.
- Coarse vs precise location policy.

## What breaks first

- requesting location too early with no user context
- no fallback workflow when denied
- over-retaining precise coordinates

## Minimal Blueprint

1. Request location only in user-meaningful flow steps.
2. Support coarse-location mode where possible.
3. Provide manual location fallback entry.
4. Minimize retention and downstream propagation.

## Decision Summary

Location features should be explicit, optional, and privacy-scoped by design.
