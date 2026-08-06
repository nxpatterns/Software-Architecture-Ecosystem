# Use Case 73: Screen Orientation API for Rotation-Aware Workflows

Orientation often gets treated as visual polish — does the layout look right in portrait versus landscape. In capture, gaming, and kiosk flows, it's operational behavior: the wrong orientation can mean a barcode scanner that can't see the code, or a kiosk that a user physically can't interact with correctly.

## Why Locking Orientation Isn't Free

Lock capability is constrained by context and requires a user gesture in most implementations. Platform behavior differs meaningfully between engines. And forced orientation can genuinely hurt accessibility — a user who's mounted their device at a fixed angle for a reason doesn't want the app overriding that choice.

## The User Story, Stripped of Domain

A user can:

- get orientation-aware UI behavior where it actually matters,
- avoid accidental layout breakage the moment the device rotates,
- keep control of orientation wherever locking isn't supported or isn't appropriate.

## Core Browser Technologies

| API | Job | Reference |
|---|---|---|
| Screen Orientation API | Reads and, where permitted, locks device orientation | [MDN – Screen Orientation API](https://developer.mozilla.org/en-US/docs/Web/API/Screen_Orientation_API) |
| Responsive layout + orientation events | Handles rotation gracefully as the default, not the exception | [MDN - orientation change event](https://developer.mozilla.org/en-US/docs/Web/API/ScreenOrientation/change_event), [MDN - CSS media orientation](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/orientation) |
| Accessibility-aware fallback | Respects user control where locking isn't appropriate | [WCAG 2.2 - Orientation](https://www.w3.org/WAI/WCAG22/Understanding/orientation.html), [MDN - prefers-reduced-motion](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion) |

## The Browser Reality Check

The orientation-read side of this API is broadly supported. The lock side is more constrained — orientation locking generally requires fullscreen mode and a user gesture, and exact behavior (what's lockable, what silently no-ops) varies by browser and OS. Treat locking as a conditional enhancement available under specific circumstances, not a guaranteed control the app can rely on.

## What Breaks First

- Forcing an orientation lock in a context where the platform doesn't actually allow it, producing a silent failure with no visible feedback to the user.
- No graceful rotate fallback, so the layout genuinely breaks the moment a lock attempt fails or isn't available.
- Interaction state lost during an orientation transition — a form half-filled or a scroll position lost the instant the device rotates.

## Minimal Technical Blueprint

```javascript
async function lockForScanning() {
  try {
    await document.documentElement.requestFullscreen(); // often a prerequisite
    await screen.orientation.lock('landscape');
  } catch {
    showRotateDeviceHint(); // graceful, not a broken layout
  }
}

screen.orientation.addEventListener('change', () => preserveInteractionState());
```

1. Use orientation lock only where it's functionally necessary — a barcode scanner or a game, not a general content page.
2. Keep a fully responsive fallback for every screen, since a lock attempt can silently fail depending on context.
3. Persist transient interaction state across rotation events, so a form or a scroll position survives the transition.
4. Test orientation flows specifically with assistive-tech scenarios, since forced orientation can conflict with how some users have configured their device.

## Decision Summary

Orientation APIs should improve task completion, not fight user control — the moment a lock attempt starts working against what the user actually wants from their device, the feature has stopped helping.
