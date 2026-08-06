# Use Case 52: Web NFC for Physical Tag Workflows

When users tap a tag and something useful happens, people call it magic.
When it fails on the wrong phone, support calls it Tuesday.

This use case covers NFC tag read/write flows directly in the browser.

## Why this is hard

Platform support is highly constrained.
Tag formats vary.
And error handling is often ignored in happy-path demos.

## User Story (Abstracted)

A user can:

- tap an NFC tag,
- read context payload,
- trigger the right in-app action quickly.

## Core Browser Technologies

- Web NFC API read/write sessions.
- NDEF payload parsing and validation.
- Offline-safe action queue for intermittent connectivity.

## Browser Reality Check

- Mostly Chrome on Android.
- No reliable iOS/desktop baseline.
- Fallback must exist (QR code, manual code entry, deep link).

## What breaks first

- no fallback path for unsupported devices
- unvalidated NDEF payload causing bad routing
- race conditions from repeated scans
- assumptions about always-online backend validation

## Minimal Blueprint

1. Capability gate and fallback routing.
2. Parse NDEF defensively and validate schema/version.
3. Make scan actions idempotent.
4. Show immediate feedback for success/failure.
5. Log coarse scan diagnostics without sensitive payload leakage.

## Test Matrix

- multiple Android hardware models
- malformed and outdated tag payloads
- rapid repeated scans
- offline then reconnect reconciliation

## Decision Summary

Web NFC is excellent for constrained field workflows.
Treat it as specialized capability, not universal input primitive.
