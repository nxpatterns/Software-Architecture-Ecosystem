# Use Case 57: Popover API and Native Dialog Overlay Governance

Custom overlay stacks were a rite of passage.
Mostly because everyone reimplemented them badly.

This use case covers native Popover and dialog primitives for reliable overlays.

## Why this is hard

Overlays touch focus, keyboard handling, stacking, scrolling, and accessibility.
Tiny mistakes become production-level frustration.

## User Story (Abstracted)

A user can:

- open and dismiss overlays predictably,
- navigate by keyboard and assistive tech,
- avoid focus traps and scroll glitches.

## Core Browser Technologies

- Popover API.
- Native `dialog` element.
- Focus management and inert background behavior.

## Browser Reality Check

- Baseline support has improved significantly.
- Still validate behavior differences in real engines.
- Keep defensive fallback for legacy environments where required.

## What breaks first

- custom ESC/backdrop logic conflicting with platform behavior
- hidden focusable elements behind modal
- scroll lock bugs on mobile browsers
- nested overlays with undefined close order

## Minimal Blueprint

1. Define overlay taxonomy (tooltip, non-modal popover, modal dialog).
2. Use native primitives first, custom only for missing behavior.
3. Enforce focus entry/exit rules and ESC semantics.
4. Avoid deep nesting; enforce stack policy.
5. Add accessibility checks into CI flow.

## Test Matrix

- keyboard-only navigation
- screen-reader traversal
- mobile scroll and viewport resize behavior
- nested overlay open/close race conditions

## Decision Summary

Native overlay primitives reduce custom bug surface dramatically.
Use them before inventing Overlay Framework Number 12.
