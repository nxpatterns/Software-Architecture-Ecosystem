# Use Case 95: Fullscreen API — Desktop, Android, and the iPhone Gap

`element.requestFullscreen()` looks like one universal call: hide the browser chrome, present an element edge-to-edge, done. On desktop and Android, that's exactly what happens. On an iPhone, it silently doesn't — and has silently not worked for years, on any browser, because every browser on iOS runs WebKit underneath.

## Why "Just Call requestFullscreen()" Breaks on the One Device Everyone Tests Last

Teams build and test fullscreen features on a laptop, confirm it works on an Android phone, ship it, and only discover the iPhone gap when a support ticket arrives. This isn't a bug that's about to be fixed — it's a long-standing, deliberate WebKit position with an open, years-old Apple Developer Forums thread full of frustrated developers and no committed timeline for arbitrary-element fullscreen on iPhone.

## The User Story, Stripped of Domain

A user can:

- expand a video, game, presentation, or image viewer to fill the entire screen,
- exit fullscreen predictably, whether by a button, the Escape key, or a system gesture,
- get a genuinely usable experience on their specific device — including the iPhone, where the mechanism has to be different.

## Core Browser Technologies

| API | Job | Reference |
|---|---|---|
| `Element.requestFullscreen()` | Requests fullscreen presentation for an arbitrary element | [MDN – Fullscreen API](https://developer.mozilla.org/en-US/docs/Web/API/Fullscreen_API) |
| `Document.exitFullscreen()` | Exits fullscreen mode | [MDN – Fullscreen API](https://developer.mozilla.org/en-US/docs/Web/API/Fullscreen_API) |
| `document.fullscreenElement` | Reports which element, if any, is currently fullscreen | [MDN – Fullscreen API](https://developer.mozilla.org/en-US/docs/Web/API/Fullscreen_API) |
| `HTMLVideoElement.webkitEnterFullScreen()` | The separate, video-only fullscreen path that actually works on iPhone | [WebKit standards-positions discussion](https://github.com/WebKit/standards-positions/issues/306) |

## The Browser Reality Check

Desktop is the easy case: Chrome, Edge, Firefox, and Safari macOS all support standard, unprefixed `requestFullscreen()` on arbitrary elements — Safari unprefixed this on macOS and iPadOS starting in Safari 16.4. Android Chromium matches desktop behavior.

**iPadOS supports arbitrary-element fullscreen. iPhone does not.** Calling the fullscreen API on a `<div>` in Safari — or any other browser on iOS, since they all share WebKit — simply does nothing, with no error thrown to explain why. Developers have been requesting this on Apple's own forums for years, with Apple staff acknowledging the request but no arbitrary-element fullscreen shipping for iPhone specifically.<sup>[1]</sup>

The one thing that *does* work on iPhone is video-specific fullscreen through `webkitEnterFullScreen()` — a separate, older, video-only API distinct from the standard Fullscreen API entirely. This is why video players routinely work in fullscreen on an iPhone while a custom game or presentation built on the standard API does not: they're using two completely different mechanisms, and only one of them reaches the iPhone.

## What Breaks First

- Testing a fullscreen feature on a laptop and an Android phone, calling it cross-platform, and never testing an actual iPhone before shipping.
- Calling `requestFullscreen()` on a non-video element and getting no visible error on iPhone — the failure is silent, which makes it easy to miss in casual testing.
- Building a custom video player UI on the standard Fullscreen API instead of `webkitEnterFullScreen()`, losing iPhone fullscreen entirely for something that should have worked.
- Not handling the fullscreen change event (`fullscreenchange`) for cases where the OS forces an exit — an iPad, for instance, exits fullscreen automatically when a text input gains focus, and code that assumes fullscreen state is stable will desync from reality.

## Minimal Technical Blueprint

```javascript
async function enterFullscreen(element, videoElement) {
  if (element.requestFullscreen) {
    await element.requestFullscreen(); // desktop, Android, iPadOS
  } else if (videoElement?.webkitEnterFullScreen) {
    videoElement.webkitEnterFullScreen(); // iPhone: video-only fallback
  } else {
    renderInPageFullscreenApproximation(); // CSS-only fake fullscreen, last resort
  }
}

document.addEventListener('fullscreenchange', () => {
  syncUIToFullscreenState(document.fullscreenElement); // OS can force-exit without warning
});
```

1. Feature-detect `requestFullscreen` explicitly rather than assuming it exists because the app runs in a browser.
2. For anything video-centric, prefer `webkitEnterFullScreen()` as the iPhone path — this is the one mechanism that actually reaches that device.
3. For non-video fullscreen needs on iPhone specifically, build a CSS-only in-page approximation — fixed positioning, `100dvh`, hidden chrome via viewport meta tricks — since the real API simply isn't available there.
4. Listen for `fullscreenchange` and treat it as the source of truth for current state, since the OS can force an exit (an iPad losing fullscreen when a text field is focused) without the app initiating it.
5. Never assume Android and iOS mobile behavior are equivalent just because both are "mobile" — this is exactly the kind of platform split that a generic "mobile" test pass misses entirely.

## Decision Summary

Use the standard Fullscreen API freely on desktop and Android, and specifically for video content everywhere including iPhone via `webkitEnterFullScreen()`.

For non-video fullscreen experiences that must work on iPhone specifically, plan for a CSS-based approximation from the start — this isn't a gap that testing harder will fix, it's a platform limitation with years of history and no signal it's closing soon.

---

[1]: iPadOS supporting arbitrary-element fullscreen while iPhone does not, ongoing Apple Developer Forums discussion, [Apple Developer Forums – Fullscreen API on a non-video element](https://developer.apple.com/forums/thread/133248).
