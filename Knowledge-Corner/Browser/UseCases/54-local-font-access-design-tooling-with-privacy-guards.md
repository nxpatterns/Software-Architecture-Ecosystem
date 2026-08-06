# Use Case 54: Local Font Access for Browser Design Tooling with Privacy Guards

Design users want "use my installed fonts".
Security and privacy teams hear "new fingerprint surface".
Both are correct.

This use case covers responsible usage of Local Font Access in web-based creative tools.

## Why this is hard

Font inventories are high-entropy.
Support is browser-limited.
And users expect desktop-tool behavior from a sandboxed web app.

## User Story (Abstracted)

A user can:

- browse local fonts they explicitly grant,
- preview typography accurately,
- and keep control over what is exposed.

## Core Browser Technologies

- Local Font Access API.
- Font preview pipeline with fallback web fonts.
- Permission-scoped font selection cache.

## Browser Reality Check

- Chromium-first feature.
- Unsupported browsers need graceful fallback to uploaded or bundled fonts.
- Never make project loading depend on local font access.

## What breaks first

- treating full font list as harmless telemetry
- storing persistent raw font fingerprints
- no fallback in unsupported browsers
- assuming identical rendering metrics across systems

## Minimal Blueprint

1. Request access only at explicit "Add local font" step.
2. Keep font handling local where possible.
3. Persist only chosen font references, not full inventory.
4. Provide robust fallback substitution map.
5. Document privacy boundaries clearly.

## Privacy Notes

- do not export full installed-font catalog to analytics
- avoid cross-session fingerprint joins via font sets
- keep access optional and revocable

## Test Matrix

- supported Chromium versions
- unsupported engine fallback quality
- mixed-script typography and missing-glyph behavior
- permission revoke and cache invalidation

## Decision Summary

Use Local Font Access for professional typography workflows.
Treat it like a privileged capability with strict minimization.
