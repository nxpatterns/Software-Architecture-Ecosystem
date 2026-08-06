# Use Case 62: Presentation API and Remote Playback for Second-Screen Orchestration

"Cast to screen" sounds trivial. Until reliable control, fallback, and state continuity are actually required, and it turns out one tap hides a genuinely complicated handoff between two separate devices that don't share a process.

This covers browser-driven handoff of media or presentation context to external playback devices.

## Why Ecosystem Fragmentation Is the Real Problem

Discovery, pairing, and control capabilities differ meaningfully by ecosystem — Chromecast and AirPlay are not the same protocol wearing different branding, they're genuinely different systems with different capabilities exposed to the browser. Network topology matters more here than in almost any other browser feature. And users expect it to just work in one tap, often during a live presentation where there's no time to debug.

## The User Story, Stripped of Domain

A user can:

- send playback or presentation output to an external screen,
- keep control from the originating browser throughout,
- recover gracefully from a connection drop instead of losing the session entirely.

## Core Browser Technologies

| API | Job | Reference |
|---|---|---|
| Presentation API | Discovers and connects to presentation displays, where supported | [MDN – Presentation API](https://developer.mozilla.org/en-US/docs/Web/API/Presentation_API) |
| Remote Playback API | Media handoff to a remote playback device | [MDN – Remote Playback API](https://developer.mozilla.org/en-US/docs/Web/API/Remote_Playback_API) |
| Session-state synchronization | Keeps local controller and remote endpoint in agreement | [MDN - PresentationConnection](https://developer.mozilla.org/en-US/docs/Web/API/PresentationConnection), [MDN - RemotePlayback events](https://developer.mozilla.org/en-US/docs/Web/API/RemotePlayback#events) |

## The Browser Reality Check

Support here is fragmented and genuinely scenario-dependent. Some platforms lean on ecosystem-specific paths entirely — Chromecast behavior on Chromium, AirPlay behavior on Safari — rather than a single unified API surface working identically everywhere. Local playback fallback isn't a nice-to-have; it's the thing that keeps the presentation running when casting simply doesn't work on whatever device is in the room that day.

## What Breaks First

- No reconnect strategy after a network hiccup, dropping the remote session with no automatic recovery attempted.
- Local UI drifting out of sync with actual remote playback state, so the controller shows "playing" while the remote screen has stalled.
- Assuming every target device exposes identical controls, when capability actually varies meaningfully by device and ecosystem.
- No preflight check before the "cast" action fires, discovering a target is unavailable only after the user has already committed to it.

## Minimal Technical Blueprint

```javascript
async function castToDevice() {
  const availability = await navigator.presentation.defaultRequest.getAvailability();
  if (!availability.value) return keepLocalPlaybackOnly(); // preflight, not a hopeful attempt

  const connection = await navigator.presentation.defaultRequest.start();
  connection.onclose = () => {
    reconcileState(); // don't assume — check what the remote actually did before it dropped
    fallBackToLocal();
  };
}
```

1. Discover target availability and capabilities before offering the cast action at all, not as an afterthought once the user has already clicked it.
2. Start the remote session with an explicit state handshake, so both ends agree on what's actually playing before control begins.
3. Keep the local controller as the source of truth for intent, with the remote device treated as a display following it, not an independent decision-maker.
4. Reconcile state periodically and on key events, since a silent drift between local and remote is worse than a visible one.
5. Fall back to local playback instantly on failure — the presentation should never simply stop because the cast connection dropped.

## Test Matrix You Actually Need

- Mixed network conditions: good, congested, unstable — all three, deliberately induced.
- Target device sleep and wake cycles mid-session.
- Session interruption and takeover, including a second device attempting to connect mid-cast.
- The unsupported browser/device fallback path, tested as thoroughly as the happy path.

## Decision Summary

Second-screen workflows are high-visibility features — when they work, they're impressive, and when they fail, it's usually in front of an audience. Treat reliability and fallback as first-order requirements from the start, not polish added after the demo already looked good once.
