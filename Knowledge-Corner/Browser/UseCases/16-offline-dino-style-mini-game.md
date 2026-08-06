# Use Case 16: The Offline Dino Game Pattern — Playable Content With No Network

Most web games are "offline" right up until a sound file, sprite sheet, font, or
analytics tag asks the network for one tiny favor. Chrome's dinosaur game takes
the stricter route: the game is already in the browser, so a dead connection is
not an error state. It is the premise.

## Why this is a good next "hard topic"

Because a one-button obstacle game looks like a beginner exercise until it has to
run smoothly at any refresh rate, accept both a space bar and a thumb, make sound
without violating autoplay policy, and keep doing all of that with zero network.

## User Story (Abstracted)

A user can:

- open a small game while completely offline,
- start a run with a keyboard or an on-screen control,
- jump or duck around obstacles,
- see animation and score update smoothly,
- hear short local sound effects after choosing to start,
- background the page, return, and resume without a giant physics jump,
- and play without an account, backend, or loading spinner pretending to be progress.

We do not care which game.
Could be a runner, a reaction game, a puzzle, a training simulation, or a tiny
bit of useful waiting-room entertainment. Same browser loop.

## Core Browser Technologies

- `Canvas` 2D: draws the player, obstacles, ground, score, and game-over state without a DOM node for every pixel.
- `requestAnimationFrame()`: drives the render/update loop immediately before repaint.
- `keydown` / `keyup` keyboard events: maintain pressed state for jump, duck, restart, and accessibility-friendly desktop controls.
- `Pointer Events` (`pointerdown` / `pointerup`): provide tap/click controls and one input model for mouse, pen, and touch.
- `Web Audio API` (`AudioContext`, `decodeAudioData()`, `AudioBufferSourceNode`, or `OscillatorNode`): this is the technology that plays game sound effects.
- `visibilitychange`: pauses or resets frame timing when the game is hidden.
- `Service Worker` plus `Cache Storage API` (web-app clone only): precaches the HTML, code, art, and sounds so an actual website can open offline after installation.

An `<audio>` element is fine for a long music track. For short effects, Web Audio
is usually the better game primitive: it offers sample-accurate, low-latency
timing and a reusable mixing graph ([MDN](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API)).
After the first explicit gesture creates or resumes that context, individual
effects use the unlocked graph rather than each attempting a fresh media autoplay
request ([MDN](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API/Best_practices), [Chrome Developers](https://developer.chrome.com/blog/autoplay)).

## Browser Reality Check

### Desktop

- Chromium (Chrome, Edge, Arc): Canvas 2D, `requestAnimationFrame()`, Pointer Events, and Web Audio are established platform features; audio is still subject to Chrome's audible-autoplay policy until the user interacts with the site ([MDN](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API), [MDN](https://developer.mozilla.org/en-US/docs/Web/API/Window/requestAnimationFrame), [MDN](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API), [Chrome Developers](https://developer.chrome.com/blog/autoplay)).
- Firefox: use the same explicit "Start with sound" or "Tap to play" gate. Browsers generally block programmatically initiated audible playback before user interaction, including Web Audio source playback ([MDN](https://developer.mozilla.org/en-US/docs/Web/Media/Guides/Autoplay)).
- Safari (macOS): Canvas and the animation loop are not the problem. Creating or resuming the `AudioContext` from the start control is the boring, portable answer; MDN's Web Audio guidance is explicit that contexts created outside a gesture may begin suspended ([MDN](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API/Best_practices)).

### Mobile

- Android Chromium: render the same Canvas loop, but do not assume a hardware keyboard exists. A visible Jump control using Pointer Events makes the game usable with a thumb; Pointer Events are designed to cover mouse, pen, and touch input ([MDN](https://developer.mozilla.org/en-US/docs/Web/API/Pointer_events)).
- iOS Safari / WebKit-based browsers: the audio-unlock path is mandatory, not decorative. Create or resume the `AudioContext` directly from the first deliberate tap such as a Start button or `pointerup`; WebKit documents iOS Web Audio's user-gesture restriction, including that `touchend` can lift it where `touchstart` does not ([WebKit Bugzilla](https://bugs.webkit.org/show_bug.cgi?id=149367)). A keyboard-only runner is unusable on a normal touch device, so ship an on-screen button or tap-to-jump fallback; MDN's game guidance demonstrates handling touch input on the canvas ([MDN](https://developer.mozilla.org/en-US/docs/Games/Techniques/Control_mechanisms/Mobile_touch)).

Short version: the render loop is portable.
Sound needs permission, and phones do not come with a space bar.

## What Usually Breaks First

- Creating an `AudioContext` at module load, then wondering why the first jump is silent.
- Binding only `keydown` and `keyup`, then shipping a game nobody can start on a phone.
- Assuming every animation frame is 16.67 ms. High-refresh displays and throttled tabs both disagree.
- Letting a hidden tab accrue ten seconds of elapsed time, then launching the dinosaur through every obstacle on return.
- Calling the game offline while sprites, fonts, sounds, or score code still come from a CDN.
- Using an `<audio>` tag per effect and accepting audible overlap, timing, and playback-state complexity as somebody else's problem.
- Treating a Service Worker as optional for a website clone that must load with the network already gone.

The native browser game needs no Service Worker because it is not fetched from the
network at all. A website clone absolutely does: offline web apps work by having a
service worker cache the resources they later serve without a network ([MDN](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Offline_and_background_operation)).

## Minimal Technical Blueprint

1. Make the game state entirely local: player position and velocity, obstacle list,
   score, speed, random seed, `running` flag, and a timestamp for the last frame.
2. Size a single Canvas for its CSS box times `devicePixelRatio`, then scale the
   drawing context so the game remains sharp without changing world coordinates.
3. Register `keydown` and `keyup` handlers that update a small input state object;
   use `event.code` for physical controls such as Space and ArrowDown, and prevent
   scrolling only for keys the focused game actually owns.
4. Render a large on-screen Jump button and bind `pointerdown` / `pointerup` to the
   same input state. A canvas tap is a useful second path, not an excuse to hide the control.
5. Route the first Start click, key press, or pointer release through `startGame()`.
   Inside that user gesture, create or `resume()` one `AudioContext`, then preload
   and `decodeAudioData()` local effect bytes into `AudioBuffer`s, or create simple
   beeps with `OscillatorNode`.
6. Start one `requestAnimationFrame()` loop. Calculate delta time from its timestamp,
   clamp absurd gaps, update physics/collisions/score, render, then request the next
   frame only while the run is active.
7. On jump, collision, and score events, create short `AudioBufferSourceNode`s from
   the decoded buffers and connect them to a shared gain node. Buffer source nodes
   are disposable; the `AudioContext` is the durable mixer.
8. On `visibilitychange`, pause the run or discard the next delta-time gap. Most
   browsers pause animation-frame callbacks in background tabs, so pretending the
   game kept running is how physics becomes performance art ([MDN](https://developer.mozilla.org/en-US/docs/Web/API/Window/requestAnimationFrame)).
9. For a web-app clone, install a Service Worker that precaches every initial asset
   into Cache Storage, then test an actual cold offline launch. For a native browser
   feature, package the code and assets with the browser instead and skip the network entirely.

## Compatibility Strategy (Pragmatic)

- Baseline mode (all modern browsers):
  - Canvas 2D rendering and a delta-time `requestAnimationFrame()` loop,
  - keyboard controls plus a visible pointer/touch jump control,
  - sound as an optional enhancement activated only from an explicit Start gesture
    ([MDN](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API), [MDN](https://developer.mozilla.org/en-US/docs/Web/API/Window/requestAnimationFrame), [MDN](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API/Best_practices)).
- Enhanced mode (supporting browsers):
  - predecoded `AudioBuffer` effects, shared gain controls, oscillator-generated effects,
  - crisp high-DPI Canvas scaling, and optional local best-score persistence,
  - Service Worker precaching when the pattern is deployed as a real web application.

Do not call a page offline because it has a Canvas.
Call it offline only after every required byte survives airplane mode.

## Test Matrix You Actually Need

- Desktop Chrome/Edge, Firefox latest, and Safari macOS latest with Space, Arrow,
  and restart controls.
- A high-refresh desktop display and a low-power laptop; verify speed comes from
  elapsed time, not frame count.
- Android Chrome on a physical phone: no hardware keyboard, repeated on-screen jumps,
  first-tap audio unlock, rotation, and a background/foreground cycle.
- iPhone Safari on a physical phone: start from a cold tab, tap the visual control,
  confirm the first effect plays, then test a silent-device path with no broken UI.
- A tab hidden for thirty seconds, then restored; confirm no giant simulation delta
  or audio burst appears on return.
- A full network block before launch for the native feature, or for a web clone after
  its precache install; inspect that no required asset falls back to the network.
- A fresh profile or cleared site data for the web clone; offline first visit should
  fail honestly, while offline repeat launch should work after successful precaching.

If the mobile test was done with a Bluetooth keyboard attached, you tested a laptop
with extra steps.

## Decision Summary

Use this pattern when:

- the content is small, self-contained, and useful even when connectivity is absent,
- controls can be expressed as a few local input actions,
- the experience benefits from immediate rendering and short, low-latency effects.

Avoid this pattern when:

- core levels, art, identity, or rules must be fetched live,
- the experience needs authoritative multiplayer or server-owned progression,
- the project cannot maintain an offline asset manifest for the website version.

Because yes, a browser can entertain someone with no network.
And no, a sprite sheet from a CDN is not "basically local."

## Next Logical Topic

After this, the best follow-up is:
**Offline media capture and local review workflows**
(camera input, local encoding, storage pressure, and the awkward moment a user records video with no network at all).
