# Use Case 67: Private State Tokens for Anti-Fraud Without Identity Tracking

Fraud controls need trust signals.
Privacy requirements reject persistent identity stitching everywhere.
Private State Tokens address this tension.

## Why this is hard

Fraud teams often overcollect identity-like data.
PST requires more disciplined signal design.

## User Story (Abstracted)

A system can:

- evaluate trustworthiness with low-linkability signals,
- reduce abuse pressure,
- and avoid user-level tracking surfaces.

## Core Browser Technologies

- Private State Tokens issuance/redemption flow.
- Fraud-decision scoring pipeline that accepts non-identity trust signals.
- Auditable policy controls for token usage.

## What breaks first

- trying to map token outcomes back to stable identity graphs
- no abuse fallback when token flow unavailable
- lack of controls around where token-based decisions are allowed

## Minimal Blueprint

1. Define fraud decisions where PST can influence score.
2. Keep identity and PST trust channels separated.
3. Implement fallback risk controls when token path is unavailable.
4. Audit false-positive/false-negative outcomes continuously.

## Decision Summary

PST helps reduce identity-heavy anti-fraud dependencies.
It is not a universal fraud silver bullet.
