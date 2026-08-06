# Use Case 62: Presentation API and Remote Playback for Second-Screen Orchestration

"Cast to screen" sounds trivial.
Until you need reliable control, fallback, and state continuity.

This use case covers browser-driven handoff of media/presentation context to external playback devices.

## Why this is hard

Discovery, pairing, and control capabilities differ by ecosystem.
Network topology matters.
And users expect it to work in one tap during live situations.

## User Story (Abstracted)

A user can:

- send playback/presentation output to external screens,
- keep control from the originating browser,
- recover gracefully from connection drops.

## Core Browser Technologies

- Presentation API (where supported).
- Remote Playback API for media handoff.
- Session-state synchronization between local and remote endpoints.

## Browser Reality Check

- support is fragmented and scenario-dependent
- some platforms rely on ecosystem-specific paths (Chromecast/AirPlay behaviors)
- always keep local playback fallback

## What breaks first

- no reconnect strategy after network hiccup
- local UI out of sync with remote playback state
- assuming all devices expose identical controls
- no preflight checks before "cast" action

## Minimal Blueprint

1. Discover target availability and capabilities.
2. Start remote session with explicit state handshake.
3. Keep local controller as source of truth.
4. Reconcile state periodically and on key events.
5. Fall back to local playback instantly on failure.

## Test Matrix

- mixed network conditions (good, congested, unstable)
- target device sleep/wake cycles
- session interruption and takeover
- unsupported browser/device fallback path

## Decision Summary

Second-screen workflows are high-visibility features.
Treat reliability and fallback as first-order requirements, not polish.
