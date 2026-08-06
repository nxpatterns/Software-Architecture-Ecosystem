# Use Case 46: Compute Pressure API for Adaptive Workload Control

If your app burns CPU like a space heater, users notice.
Usually before your monitoring does.

This use case explains how to adapt browser workload in real time based on device pressure signals.

## Why this is hard

Modern apps do heavy things in the browser: rendering, encoding, AI inference, large-table transforms.
The same code path behaves very differently on a gaming desktop and a thin laptop in battery-save mode.

Without adaptation, you either:

- over-deliver quality and fry low-end devices, or
- under-deliver quality and waste high-end hardware.

## User Story (Abstracted)

A user gets:

- responsive UI under load,
- stable battery and thermal behavior,
- quality scaling that feels intentional, not broken.

## Core Browser Technologies

- Compute Pressure API: coarse pressure state from CPU/GPU domains.
- Scheduler hints: defer non-critical work under pressure.
- App-level quality ladder: frame rate, resolution, model size, worker count.

## Browser Reality Check

- Chromium-first feature.
- Treat as enhancement, never as baseline requirement.
- Missing support must fall back to inferred load signals (long tasks, dropped frames, queue lag).

## What breaks first

- assuming pressure signals are available everywhere
- reacting too aggressively and causing quality flicker
- forgetting hysteresis and cooldown windows
- coupling all quality knobs to one binary switch

## Minimal Blueprint

1. Define quality tiers (Q0..Q3) with explicit tradeoffs.
2. Map pressure states to tier transitions with hysteresis.
3. Protect interaction-critical tasks first.
4. Degrade expensive background work before core UX.
5. Recover slowly after pressure drops.

## Test Matrix

- thermal throttling on laptops
- battery saver mode
- background tabs competing for CPU
- mixed workloads (video + search + sync)

## Decision Summary

Use this when client-side compute is business-critical.
Do not build correctness on it; build resilience on top of it.
