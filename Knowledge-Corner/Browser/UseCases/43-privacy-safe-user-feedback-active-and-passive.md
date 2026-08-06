# Use Case 43: Privacy-Safe User Feedback Collection (Active and Passive)

You want feedback.
You do not want legal drama.
Completely reasonable.

This use case covers how to collect useful user feedback while minimizing privacy risk and compliance burden.

## Why this is hard

Feedback data often starts "harmless" and becomes identifying through combination.
Browser properties, device hints, timestamps, text input, and workflow context can create fingerprint-level uniqueness fast.

Consent helps.
Consent alone does not magically erase all obligations.

## User Story (Abstracted)

A team can:

- collect actionable feedback,
- keep users in control,
- minimize personal data exposure,
- and maintain defensible compliance posture.

## Feedback Channels

### Active feedback

- explicit feedback form (user chooses to send)
- in-app rating prompts with optional text
- structured issue category forms (bug/performance/UX)

### Passive feedback (privacy-safe)

- aggregated, consent-aware technical telemetry
- crash/error counters without personal free-text payloads
- coarse environment capability statistics

## What breaks first

- collecting too many browser/device fields by default
- storing raw user text indefinitely
- mixing diagnostics and marketing analytics without clear separation
- "optional send" with unclear data explanation

## Minimal Blueprint

1. Data minimization first:
   - ask only what helps triage or product decisions
2. Split feedback payload into blocks:
   - user message (optional)
   - technical context (minimal, structured)
   - consent metadata
3. Use coarse-grained environment fields:
   - browser family/version major
   - viewport bucket
   - feature support flags
4. Avoid high-entropy fields unless absolutely required.
5. Set strict retention and access rules.
6. Offer user copy preview before submit.
7. Provide deletion/contact path in privacy notice.

## About "Browser properties + customer decides to send"

Good instinct, but not automatically "safe side".

What is good:

- user-initiated send is strong
- explicit choice improves transparency

What still needs control:

- capability sets can become fingerprint-like identifiers
- lawful basis, purpose limitation, and retention still apply
- third-party processors and transfer regions still matter

Better pattern:

- collect only coarse diagnostics
- explain every field in plain language
- allow opt-out of technical appendix separately from message text

## "A user sends the form by email and can remove fields

This is a strong baseline.
It reduces hidden collection risk because the user sees the payload before sending.

Why this is better than silent background capture:

- user has direct control over outbound data
- no automatic passive capture of high-entropy fields
- support context quality is usually still good enough for triage

What is still required:

- keep the field set minimal and purpose-bound
- avoid unique fingerprint ingredients (full UA string, full plugin lists, canvas hashes)
- avoid asking for account IDs, names, emails inside form fields unless operationally required
- publish short retention policy for incoming support mails and extracted diagnostics

Practical safe template:

- include only coarse technical fields (browser family + major version, OS family, viewport bucket)
- keep free-text optional
- add one visible note: "Delete any details you do not want to share before sending"
- process reports in a restricted support inbox with limited access

Bottom line:

If the payload is coarse and user-editable before send, your approach is usually low-risk and privacy-friendly.
It is not "no obligations", but it is one of the cleanest real-world patterns.

## Privacy and Compliance Notes

- keep diagnostics and marketing data strictly separated
- no hidden enrichment with other identifiers
- document legal basis and retention windows
- use EU-hosted processing where possible if EU user base is primary
- apply role-based access to feedback payloads

## Test Matrix

- consent/off-consent submission paths
- payload redaction validation
- retention deletion workflow checks
- support access-control audits

## Decision Summary

Use this when you need real user voice plus technical context.
Avoid "collect everything now, filter later" designs. They are expensive, risky, and usually unnecessary.
