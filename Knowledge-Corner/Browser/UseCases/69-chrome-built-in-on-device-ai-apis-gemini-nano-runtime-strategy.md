# Use Case 69: Chrome Built-In On-Device AI APIs (Gemini Nano) Runtime Strategy

Bring-your-own model inference and browser-provided on-device AI are different products.
This use case covers Chrome's built-in local AI API family.

## Why this is hard

Single-vendor support today.
Model download and local availability lifecycle.
Quality envelope differs from large cloud models.

## User Story (Abstracted)

A user can:

- run supported local AI tasks quickly,
- keep sensitive short-form processing on device,
- and fall back gracefully when unavailable.

## Core Browser Technologies

- Chrome built-in on-device AI APIs (Prompt/Summarizer/Translator/Language Detector/Writer/Rewriter families).
- Runtime capability detection and model-readiness checks.
- Fallback orchestration to BYOM or server-side AI.

## What breaks first

- assuming equivalent quality to cloud LLMs
- no download/readiness state handling
- no fallback outside Chromium/Chrome

## Minimal Blueprint

1. Define task classes suitable for local model quality.
2. Detect API + model availability at runtime.
3. Surface readiness and fallback path transparently.
4. Keep strict privacy and retention boundaries for prompts/results.

## Decision Summary

Treat built-in local AI as a targeted acceleration layer with explicit quality and support boundaries.
