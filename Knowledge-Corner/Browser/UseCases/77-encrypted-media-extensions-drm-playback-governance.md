# Use Case 77: Encrypted Media Extensions for DRM Playback Governance

Licensed video playback is not "just play video".
It is DRM, key systems, license flows, and policy enforcement.

## Why this is hard

Browser + OS + DRM key system combinations differ.
Playback success depends on license service behavior, CDM availability, and device policy constraints.

## User Story (Abstracted)

A user can:

- play licensed protected media reliably,
- recover from license/session interruptions,
- and receive clear failure reasons when playback is blocked.

## Core Browser Technologies

- Encrypted Media Extensions (EME).
- Media Source Extensions (where pipeline requires adaptive streaming).
- DRM license acquisition and renewal service.

## What breaks first

- key-system assumptions hard-coded to one environment
- vague playback errors with no operational diagnostics
- no fallback for unsupported device/browser combinations

## Minimal Blueprint

1. Detect supported key systems and robustness levels at runtime.
2. Keep playback/DRM session state machine explicit.
3. Implement license retry/renewal with bounded backoff.
4. Map technical failures to user-meaningful recovery messaging.

## Decision Summary

EME playback requires strict compatibility governance and operational observability, not just a player UI.
