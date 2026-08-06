# Use Case 64: FedCM for Federated Login Without Third-Party Cookies

Federated login used to depend heavily on third-party cookie behavior.
That path is collapsing.
FedCM is the browser-native replacement.

## Why this is hard

Identity, privacy, and UX collide.
If you treat FedCM as a drop-in button swap, you will miss account-linking, consent text, and fallback behavior.

## User Story (Abstracted)

A user can:

- sign in via an identity provider,
- avoid cross-site tracking-style login plumbing,
- and complete auth with predictable browser mediation.

## Core Browser Technologies

- FedCM API flow for federated identity.
- First-party session establishment after federated assertion.
- Cross-tab auth state synchronization.

## What breaks first

- assuming old iframe/cookie behavior still applies
- no fallback when FedCM is unavailable
- weak account-linking strategy for returning users

## Minimal Blueprint

1. Keep auth backend IdP/OIDC logic cleanly separated from browser mediation.
2. Feature-detect FedCM and choose flow at runtime.
3. Keep a first-party fallback login path.
4. Log auth outcomes by mechanism (FedCM vs fallback).

## Decision Summary

FedCM should be treated as a strategic identity migration path, not optional polish.
