# Use Case 16: The Offline Dino Game Pattern — Playable Content With No Network

Most web games are "offline" right up until a sound file, a sprite sheet, a font, or an analytics tag asks the network for one tiny favor. Chrome's dinosaur game takes the stricter route: the game is already in the browser, so a dead connection isn't an error state. It's the premise the whole thing was built on.

## Why the One-Button Game Isn't a Beginner Exercise

It looks trivial until it has to run smoothly at any refresh rate, accept a space bar and a thumb equally, make sound without violating autoplay policy, and do all four of those things with genuinely zero network available.

## The User Story, Stripped of Domain

- open a small game completely offline,
- start a run with a keyboard or an on-screen control,
- jump or duck around obstacles,
- watch animation and score update smoothly,
- hear short local sound effects after choosing to start,
- background the page, return, resume without a giant physics jump,
- play with no account, no backend, no loading spinner pretending to be progress.

A runner, a reaction game, a puzzle — same browser loop underneath, however the art looks.

## Core Browser Technologies

| API | Job | Reference |
|---|---|---|
| Canvas 2D | Draws player, obstacles, ground, score, game-over — no DOM node per pixel | [MDN](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API) |
| `requestAnimationFrame()` | Drives the render/update loop right before repaint | [MDN](https://developer.mozilla.org/en-US/docs/Web/API/Window/requestAnimationFrame) |
| `keydown`/`keyup` | Pressed-state for jump, duck, restart, desktop accessibility | [keydown (MDN)](https://developer.mozilla.org/en-US/docs/Web/API/Element/keydown_event), [keyup (MDN)](https://developer.mozilla.org/en-US/docs/Web/API/Element/keyup_event) |
| Pointer Events | One input model covering mouse, pen, and touch | [MDN](https://developer.mozilla.org/en-US/docs/Web/API/Pointer_events) |
| Web Audio API | Sample-accurate, low-latency effects — the correct tool over `<audio>` for short sounds | [MDN](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API) |
| `visibilitychange` | Pauses or discards frame timing when hidden | [MDN](https://developer.mozilla.org/en-US/docs/Web/API/Document/visibilitychange_event) |
| Service Worker + Cache Storage (web-app clone only) | Precaches everything so a real website can open offline | [MDN](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Offline_and_background_operation) |

An `<audio>` element is fine for one long music track. For short effects, Web Audio wins on sample-accurate timing and a reusable mixing graph.<sup>[1]</sup> After the first explicit gesture creates or resumes the context, every subsequent effect uses that unlocked graph instead of each one gambling on a fresh autoplay request.<sup>[2]</sup>

## The Browser Reality Check

The render loop is portable everywhere. Sound needs explicit permission, and phones famously don't come with a space bar.

Canvas 2D, `requestAnimationFrame()`, Pointer Events, and Web Audio are all established platform features in Chromium — audio still sits behind Chrome's audible-autoplay policy until genuine user interaction happens.<sup>[2]</sup> Firefox needs the same explicit "Start with sound" gate; browsers generally block programmatically initiated audible playback pre-interaction, Web Audio source playback included.<sup>[3]</sup>

Safari's Canvas and animation loop are not the problem. Creating or resuming the `AudioContext` from the start control is the boring, entirely portable answer — MDN is explicit that contexts created outside a gesture may simply begin suspended and stay that way.<sup>[4]</sup>

**On iOS, the audio-unlock path is mandatory, not decorative.** Create or resume the `AudioContext` directly from the first deliberate tap — a Start button, a `pointerup`. WebKit's own bug tracker documents the iOS Web Audio gesture restriction in detail, including that `touchend` can lift it where `touchstart` cannot.<sup>[5]</sup> A keyboard-only runner is simply unusable on a touch device — ship a real on-screen button or a tap-to-jump fallback, not an afterthought.

## What Breaks First

- Creating an `AudioContext` at module load, then wondering why the first jump is silent.
- Binding only `keydown`/`keyup` and shipping a game nobody can start on a phone.
- Assuming every animation frame is 16.67ms. High-refresh displays and throttled tabs both disagree, loudly.
- Letting a hidden tab accrue ten seconds of elapsed time, then launching the dinosaur through every obstacle the instant it comes back.
- Calling the game "offline" while sprites, fonts, sounds, or score logic still come from a CDN somewhere.
- Using one `<audio>` tag per effect and accepting audible overlap and timing chaos as somebody else's problem to solve later.
- Treating a Service Worker as optional for a website clone that has to load with the network already gone. The native browser game skips this entirely because it was never fetched over the network in the first place — a web clone has no such luxury.<sup>[6]</sup>

## Minimal Technical Blueprint

```javascript
let audioContext, jumpBuffer;

startButton.addEventListener('pointerup', async () => {
  audioContext ??= new AudioContext();
  await audioContext.resume(); // must happen inside this gesture, every time
  jumpBuffer = await decodeAudioData(await (await fetch('jump.wav')).arrayBuffer());
  startGame();
});

function loop(timestamp) {
  const dt = Math.min(timestamp - lastFrame, 100); // clamp absurd gaps from a backgrounded tab
  if (running) { updatePhysics(dt); render(); requestAnimationFrame(loop); }
  lastFrame = timestamp;
}
```

1. Keep game state entirely local: position, velocity, obstacle list, score, speed, random seed, `running` flag, last-frame timestamp.
2. Size one Canvas to its CSS box times `devicePixelRatio`, scale the drawing context so it stays sharp without touching world coordinates.
3. Register `keydown`/`keyup` against a small input state object, using `event.code` for physical keys, preventing scroll only on keys the game genuinely owns.
4. Render a real on-screen Jump button bound to `pointerdown`/`pointerup` on the same input state — a second input path, never a hidden afterthought.
5. Route the first Start click, keypress, or pointer release through `startGame()`. Inside that gesture: create or resume the `AudioContext`, decode local effect bytes into `AudioBuffer`s or build simple beeps with `OscillatorNode`.
6. One `requestAnimationFrame()` loop. Compute delta time from its timestamp, clamp absurd gaps, update physics/collisions/score, render, request the next frame only while the run is active.
7. On jump, collision, and score events, spin up short `AudioBufferSourceNode`s from the decoded buffers into a shared gain node — buffer sources are disposable, the context is the durable mixer.
8. On `visibilitychange`, pause the run or discard the next delta-time gap. Most browsers already pause animation-frame callbacks in background tabs — pretending otherwise is how physics becomes accidental performance art.
9. For a web-app clone, install a Service Worker precaching every initial asset into Cache Storage, then test an actual cold offline launch. For a native browser feature, skip the network story entirely — it ships with the browser.

## Compatibility Strategy

**Baseline:** Canvas 2D rendering, a delta-time `requestAnimationFrame()` loop, keyboard plus a visible pointer/touch jump control, sound as an enhancement activated only from an explicit Start gesture.

**Enhanced:** predecoded `AudioBuffer` effects, shared gain control, oscillator-generated sounds, crisp high-DPI Canvas scaling, optional local best-score persistence, Service Worker precaching for a deployed web-app version.

Don't call a page "offline" because it has a Canvas element. Call it offline only after every required byte survives an actual airplane-mode test.

## Test Matrix You Actually Need

- Desktop Chrome/Edge, Firefox, Safari with Space, Arrow, and restart controls.
- A high-refresh desktop display and a low-power laptop — confirm speed comes from elapsed time, never frame count.
- Android real phone: no hardware keyboard, repeated on-screen jumps, first-tap audio unlock, rotation, background/foreground cycle.
- iPhone real device: cold tab start, tap the visual control, confirm the first effect actually plays, then a silent-device path with no broken UI.
- A tab hidden for thirty seconds, restored — confirm no giant simulation delta or audio burst on return.
- Full network block before launch for the native version, or after precache install for the web clone — inspect that nothing falls back to the network silently.
- Fresh profile / cleared site data for the web clone: offline first visit fails honestly, offline repeat launch works after precaching succeeded.

A mobile test done with a Bluetooth keyboard attached is a laptop test with extra steps.

## Decision Summary

Use this when content is small, self-contained, and genuinely useful with zero connectivity, when controls reduce to a few local input actions, and when the experience benefits from immediate rendering and short, low-latency effects.

Skip it when core levels, art, identity, or rules must be fetched live, when the experience needs authoritative multiplayer or server-owned progression, or when nobody's maintaining an offline asset manifest for the website version.

A browser can entertain someone with zero network. A sprite sheet pulled from a CDN is not "basically local," no matter how convincing the demo looked with Wi-Fi on.

---

[1]: Web Audio API design rationale for short effects, [MDN – Web Audio API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API).
[2]: Autoplay policy and gesture-unlocked audio graph, [MDN – Web Audio Best Practices](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API/Best_practices), [Chrome for Developers](https://developer.chrome.com/blog/autoplay).
[3]: General browser autoplay blocking, [MDN – Autoplay guide](https://developer.mozilla.org/en-US/docs/Web/Media/Guides/Autoplay).
[4]: Contexts created outside a gesture starting suspended, [MDN – Web Audio Best Practices](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API/Best_practices).
[5]: iOS Web Audio gesture restriction detail, [WebKit Bugzilla #149367](https://bugs.webkit.org/show_bug.cgi?id=149367).
[6]: Service worker precaching for offline web apps, [MDN – Offline and background operation](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Offline_and_background_operation).
