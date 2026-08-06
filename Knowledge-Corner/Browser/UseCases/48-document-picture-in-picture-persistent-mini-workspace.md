# Use Case 48: Document Picture-in-Picture for Persistent Mini Workspaces

Video PiP is old news.
Document PiP is where things get interesting: a full interactive mini-window that stays on top.

This use case covers persistent control panels and compact workflows using Document Picture-in-Picture.

## Why this is hard

You now have multi-window state in a browser app.
That means lifecycle edges, focus logic, and synchronization bugs waiting politely in the hallway.

## User Story (Abstracted)

A user can:

- keep key controls always visible,
- continue primary work in another tab/window,
- and avoid context-switch tax.

## Core Browser Technologies

- Document Picture-in-Picture API.
- Cross-window state sync (`BroadcastChannel` or shared store).
- Focus and lifecycle coordination.

## Browser Reality Check

- Chrome-first capability.
- Not a baseline feature for all users.
- Must offer normal in-page fallback panel.

## What breaks first

- duplicated state authority between PiP and main view
- broken keyboard focus and accessibility flow
- stale controls after reconnect/navigation
- assuming fixed window size and stable layout

## Minimal Blueprint

1. Define one source of truth for state.
2. Render PiP as thin client, not independent logic silo.
3. Implement reconnect/rebind path after reload.
4. Provide explicit close/restore actions.
5. Mirror essential accessibility labels and shortcuts.

## Test Matrix

- open/close PiP repeatedly
- navigate main tab while PiP stays open
- resize PiP and verify responsive controls
- keyboard-only and screen-reader checks

## Decision Summary

Use Document PiP for high-value, compact control surfaces.
Avoid it for workflows that require dense, complex layouts.
