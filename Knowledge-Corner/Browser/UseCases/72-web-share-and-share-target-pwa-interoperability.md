# Use Case 72: Web Share and Share Target for PWA Interoperability

Users expect sharing to native apps and from native apps into your app.
Web Share and Share Target close that loop.

## Why this is hard

Support differs by platform/context.
Payload types vary.
And fallback UX is often neglected.

## User Story (Abstracted)

A user can:

- share content out of the app via native share sheet,
- send shared content into the PWA,
- and complete the flow without clipboard gymnastics.

## Core Browser Technologies

- Web Share API.
- Web Share Target manifest integration.
- Payload validation and routing.

## What breaks first

- unsupported environment with no fallback
- weak validation of inbound shared payloads
- poor routing of shared content into app state

## Minimal Blueprint

1. Feature-detect out-share support and keep copy-link fallback.
2. Define strict inbound payload schema for share target.
3. Route inbound data to explicit intake flows.
4. Measure completion and drop-off per share path.

## Decision Summary

Treat sharing as workflow infrastructure, not a decorative button.
