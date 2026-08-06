# Use Case 84: Gamepad API for Controller-Driven Browser Experiences

A browser tab can read a physical game controller directly — Xbox pad, PlayStation controller, generic USB gamepad — with no plugin, no native wrapper, just a polling loop and a permission model quieter than almost anything else in this deck.

## Why This One Is Simpler Than It Looks, and Still Gets Missed

Unlike most of the niche APIs in this set, the Gamepad API isn't held back by browser support — it's Baseline, broadly available across every major engine, and has been for years. What actually trips teams up is the input model: it's poll-based, not event-driven, which is an unusual pattern for web developers used to everything else firing a callback.

## The User Story, Stripped of Domain

A user can:

- connect a physical controller and have it recognized automatically,
- control a browser-based game or interactive experience with familiar hardware,
- unplug or switch controllers mid-session without breaking the experience.

Browser-based games, accessibility-driven alternative input schemes, kiosk and installation control — same polling loop underneath, different purpose layered on top.

## Core Browser Technologies

| API | Job | Reference |
|---|---|---|
| Gamepad API (`navigator.getGamepads()`) | Polls connected controller state each frame | [MDN – Gamepad API](https://developer.mozilla.org/en-US/docs/Web/API/Gamepad_API) |
| `gamepadconnected`/`gamepaddisconnected` events | Signals a controller's presence changing, without polling for it | [MDN – Gamepad events](https://developer.mozilla.org/en-US/docs/Web/API/Window/gamepadconnected_event) |
| `requestAnimationFrame()` | The natural loop to poll gamepad state inside | [MDN – requestAnimationFrame](https://developer.mozilla.org/en-US/docs/Web/API/Window/requestAnimationFrame) |

## The Browser Reality Check

This is genuinely well-supported everywhere — Chrome, Firefox, Safari, and Edge all implement it consistently, and it requires no special permission prompt beyond a page needing focus and, in most implementations, a button press on the controller to first register it. The actual friction here isn't cross-browser compatibility; it's that `navigator.getGamepads()` returns a live snapshot only when called — there's no `ongamepadinput` event firing per button press the way `keydown` fires per key. Every button and axis has to be read by polling the array on each animation frame.

## What Breaks First

- Expecting an event-driven model and never actually polling `getGamepads()`, so a connected controller appears to do nothing.
- Reading gamepad state outside a `requestAnimationFrame()` loop, producing inconsistent polling intervals that feel laggy or erratic.
- Assuming a fixed button/axis mapping across controller brands — a PlayStation controller and an Xbox controller don't guarantee identical index-to-button mapping, and generic USB controllers are worse.
- Not handling `gamepaddisconnected` at all, leaving stale input state referencing a controller that's no longer there.

## Minimal Technical Blueprint

```javascript
window.addEventListener('gamepadconnected', (e) => {
  console.log(`Controller connected: ${e.gamepad.id}`);
  startPolling();
});

window.addEventListener('gamepaddisconnected', () => {
  clearInputState(); // don't leave stale state referencing a gone controller
});

function pollGamepad() {
  const [gamepad] = navigator.getGamepads(); // live snapshot, not a cached reference
  if (gamepad) {
    if (gamepad.buttons[0].pressed) handleAction();
    const xAxis = gamepad.axes[0]; // -1 to 1, deadzone handling is on you
  }
  requestAnimationFrame(pollGamepad);
}
```

1. Listen for `gamepadconnected` to know when a controller becomes available, but poll `navigator.getGamepads()` inside a `requestAnimationFrame()` loop for actual input state — the two mechanisms serve different purposes.
2. Apply a dead zone to analog stick axes; raw axis values rarely rest exactly at zero and will otherwise register phantom drift.
3. Build a mapping layer per controller type rather than hard-coding button indices, since layouts genuinely differ across brands.
4. Handle `gamepaddisconnected` explicitly, clearing any input state tied to that controller instead of leaving it stale.
5. Always provide keyboard and pointer alternatives — a controller-only interaction path excludes anyone without one connected.

## Decision Summary

Use this for browser-based games, accessible alternative input schemes, or any kiosk-style installation where a physical controller is the natural interface.

This is one of the rare APIs in this deck where cross-browser support was never the obstacle — the actual work is building a solid polling loop and per-controller mapping layer, not chasing compatibility gaps.
