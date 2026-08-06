# Use Case 50: Storage Access API for Embedded Auth Continuity

Embedded apps in iframes meet modern cookie restrictions and suddenly "login state" becomes theoretical.
This use case covers controlled storage access in embedded contexts.

## Why this is hard

Browser privacy controls intentionally break old third-party tracking behavior.
Unfortunately they also break legitimate embedded SSO patterns if you design lazily.

## User Story (Abstracted)

A user can:

- stay signed in within embedded experiences,
- grant storage access explicitly when needed,
- and understand why the prompt exists.

## Core Browser Technologies

- Storage Access API request flow.
- First-party bootstrap and fallback redirects.
- Consent-aware embedded session orchestration.

## Browser Reality Check

- Broad conceptual support, different browser semantics.
- Safari/WebKit behavior is stricter in many flows.
- Test the exact interaction model per engine, not only API presence.

## What breaks first

- assuming third-party cookies still work by default
- requesting access too early without user gesture
- no fallback path when request is denied
- hidden auth loops between iframe and parent

## Minimal Blueprint

1. Detect embedded context and storage state.
2. Ask for access only at a user-meaningful step.
3. Explain the prompt in plain language.
4. Implement denial fallback (open top-level auth flow).
5. Persist post-grant state and avoid repeated prompts.

## Test Matrix

- Safari + iOS Safari real-device runs
- Chromium privacy modes and tracking settings
- denied and dismissed prompt branches
- fresh profile vs returning profile

## Decision Summary

Use this when embedded auth continuity is required.
Design for denial from day one; it is not an edge case.
