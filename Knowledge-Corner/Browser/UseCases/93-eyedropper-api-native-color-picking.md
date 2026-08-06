# Use Case 93: EyeDropper API for Native Color Picking

Every design tool eventually needs the same feature: let the user pick a color from anywhere on their screen, not just from inside the app's own canvas. Before the EyeDropper API, that meant either a canvas-based crosshair limited to content the page itself rendered, or a native app entirely. The EyeDropper API gives a web page the actual OS-level color-picking cursor — sampling any pixel on the screen, including content outside the browser window.

## Why This One's Small Enough to Underestimate

A single-method API — `new EyeDropper().open()` — looks trivial enough to skip documenting properly. The trap isn't the API surface, which really is that small. It's that this is a Chromium-only capability with no counterpart anywhere else, and a design tool built assuming it's universal will quietly leave a real share of designers with a broken "pick a color" button.

## The User Story, Stripped of Domain

A user can:

- click a color-pick tool and get the native OS crosshair cursor,
- sample a color from literally anywhere on screen — another app, a browser tab, the desktop wallpaper — not just the current page,
- see the picked color returned immediately as a usable hex value.

## Core Browser Technologies

| API | Job | Reference |
|---|---|---|
| `EyeDropper` (`new EyeDropper().open()`) | Opens the native OS color-picking cursor, resolves to a sampled color | [MDN – EyeDropper API](https://developer.mozilla.org/en-US/docs/Web/API/EyeDropper_API) |
| Canvas-based fallback (`getImageData()`) | The manual crosshair-over-canvas approach for unsupported browsers | [MDN – CanvasRenderingContext2D.getImageData()](https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/getImageData) |

## The Browser Reality Check

This is a Chromium-only feature — Chrome, Edge, and Opera support it from Chrome 95 onward, and Safari and Firefox have not implemented it as of this writing.<sup>[1]</sup> This isn't a gradual rollout in progress; it's been Chromium-exclusive since launch, with no public signal from Apple or Mozilla that a native implementation is coming. Treat the gap as durable, not temporary.

The genuine advantage over a canvas-based picker is real and worth the fallback investment: `EyeDropper` samples the actual screen, including content the page never rendered — another application window, a different browser tab, the OS desktop. A canvas-based crosshair can only ever sample pixels the page itself drew.

## What Breaks First

- Shipping the color picker as EyeDropper-only, breaking the feature entirely for every Firefox and Safari user with no fallback at all.
- Assuming the returned color format needs conversion — `EyeDropper` resolves with a plain hex string (`{ sRGBHex: '#ff0000' }`), already in a directly usable format.
- Not handling the user canceling the pick (pressing Escape) as a normal outcome, instead of an error state.
- Building the fallback canvas picker to only sample the page's own canvas content, then marketing it with the same "pick any color on screen" copy the native API actually delivers — the fallback is a genuinely narrower capability and the UI should say so.

## Minimal Technical Blueprint

```javascript
async function pickColor() {
  if (!('EyeDropper' in window)) {
    return openCanvasFallbackPicker(); // narrower capability — page content only
  }
  try {
    const eyeDropper = new EyeDropper();
    const { sRGBHex } = await eyeDropper.open();
    applyPickedColor(sRGBHex); // already a usable hex string
  } catch {
    // user pressed Escape — a normal cancellation, not an error
  }
}
```

1. Feature-detect with `'EyeDropper' in window` and route to a genuine canvas-based fallback for Firefox and Safari — not a disabled button.
2. Treat a canceled pick (the promise rejecting on Escape) as a normal UX outcome, not something to log as an error.
3. Communicate the actual capability difference in the UI copy — the native picker samples the whole screen, the fallback only samples the page's own canvas, and pretending otherwise sets a false expectation.
4. Keep the picked-color format handling simple; the native API already returns a directly usable hex value with no conversion step needed.

## Decision Summary

Use this as a genuine capability upgrade for design and color-selection tools on Chromium, layered over a real canvas-based fallback everywhere else.

Don't build a color-picking feature that only works in Chromium and calls it done — the Safari and Firefox gap here isn't closing, and a professional design tool needs the fallback to be a complete feature in its own right, not an apology screen.

---

[1]: EyeDropper API Chromium-only support since Chrome 95, [MDN – EyeDropper API](https://developer.mozilla.org/en-US/docs/Web/API/EyeDropper_API).
