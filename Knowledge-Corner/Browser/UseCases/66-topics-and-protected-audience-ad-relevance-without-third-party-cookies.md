# Use Case 66: Topics and Protected Audience for Ad Relevance Without Third-Party Cookies

Ad relevance is still needed.
Cross-site personal tracking is increasingly blocked.
This is the replacement landscape.

## Why this is hard

Business teams expect old targeting precision.
Browser-native privacy models intentionally reduce that precision.

## User Story (Abstracted)

A team can:

- run interest/audience-based campaign logic,
- align with modern browser privacy constraints,
- and model performance with honest uncertainty.

## Core Browser Technologies

- Topics API for coarse interest signals.
- Protected Audience for on-device audience ad selection patterns.
- Consent and policy controls around ad-measurement operations.

## What breaks first

- treating topics/audiences as one-to-one replacement for legacy identity graphs
- weak governance around who can activate these signals
- no fallback for unsupported environments

## Minimal Blueprint

1. Define allowed campaign classes for privacy-sandbox paths.
2. Gate activation by region/policy/consent.
3. Keep unsupported-browser fallback explicit.
4. Evaluate lift with aggregate metrics, not individual-user assumptions.

## Decision Summary

Use these APIs as constrained relevance tools, not as identity reconstruction channels.
