# Use Case 21: Session Replay Governance and Privacy-Safe Diagnostics

Session replay can be a debugging superpower.
It can also become a compliance nightmare in one careless sprint.

## Why this is hard

Replay systems can capture sensitive content, user behavior patterns, and contextual metadata at scale.
Governance quality determines whether replay is operationally valuable or legally dangerous.

## User Story (Abstracted)

A team can:

- diagnose UX and error flows faster,
- protect sensitive user data by design,
- and control replay scope with auditable policy.

## Core Browser Technologies

- DOM/event capture with strict masking controls
- field-level redaction rules
- sampling engine by route/risk class
- consent-gated replay activation
- secure replay transport and retention controls

## What breaks first

- accidental capture of PII or secrets in forms
- all-session replay with no cost or risk boundaries
- replay access without role-based restrictions
- masking rules that fail after UI refactors

## Minimal Blueprint

1. Define replay eligibility by feature/risk class.
2. Default to masked capture; explicit allowlist for safe fields.
3. Gate replay by consent and jurisdiction.
4. Apply aggressive sampling for non-critical flows.
5. Restrict replay access by role and audit every access.
6. Define short retention and deletion automation.

## Privacy and Compliance Notes

- treat replay as sensitive data class
- prohibit secret/token capture categorically
- document legal basis and user notice behavior

## Test Matrix

- redaction regression tests on critical forms
- consent deny/withdraw scenarios
- role-based access audits
- replay payload inspection under UI changes

## Decision Summary

Use this when incident triage speed matters and governance maturity exists.
Avoid this when masking and access control are not operationally enforced.
