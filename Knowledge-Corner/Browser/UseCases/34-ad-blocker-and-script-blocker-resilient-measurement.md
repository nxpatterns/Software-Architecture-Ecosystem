# Use Case 19: Ad-Blocker and Script-Blocker Resilient Measurement

If your measurement stack collapses when a blocker is enabled, you do not have observability.
You have best-case telemetry.

## Why this is hard

Blockers can block endpoints, script domains, request patterns, and even runtime behavior.
Data loss is selective, not uniform, which makes bias worse.

## User Story (Abstracted)

A telemetry system can:

- detect likely measurement degradation,
- preserve essential first-party technical telemetry,
- quantify blind spots,
- and avoid false confidence in dashboards.

## Core Browser Technologies

- first-party telemetry endpoints
- graceful SDK fallback layers
- blocked-request heuristics
- local counters for unsent event classes
- delivery health metrics by browser cohort

## What breaks first

- third-party analytics script never loads
- beacon endpoints blocked by pattern lists
- dashboards show "healthy" because failed emission is invisible
- product events missing but error telemetry still present

## Minimal Blueprint

1. Separate critical telemetry from optional analytics.
2. Prefer first-party collection paths for critical signals.
3. Measure delivery health as a first-class metric.
4. Emit blocker-impact diagnostics (privacy-safe aggregate form).
5. Mark dashboards with data-quality confidence bands.
6. Design decisions around confidence, not raw counts.

## Privacy and Compliance Notes

- do not escalate tracking behavior to bypass user intent
- respect explicit user tooling choices
- focus on resilience, not circumvention

## Test Matrix

- major blocker setups on desktop browsers
- strict privacy browser modes
- endpoint block simulations
- script load failure chaos tests

## Decision Summary

Use this when decision-making depends on telemetry reliability.
Avoid any strategy that treats blocker-induced blind spots as negligible.
