# Web Graphics Today — Chapter 1: Canvas

*Part of the series "Canvas, SVG, 3D — from the browser's point of view." Status: August 2026.*

---

Every graphics API on the web is a compromise between "the browser understands what you drew" and "the browser doesn't care what you drew, just paint the pixels." Canvas sits firmly at the second extreme, and it has stayed there for twenty years by refusing every attempt to make it smarter than it needs to be.

That stubbornness is the whole story. Let's go through why.

---

## 1. What Canvas Actually Is (From the Browser's Chair)

The `<canvas>` element is, structurally, nothing. It's a rectangle in the layout tree with no children the browser cares about[^1]. Everything interesting happens through a context object you pull out of it with `getContext()`. Once you have that context, you're not describing a picture, you're issuing commands: draw this rectangle, fill this path, blit this image. The browser executes each command immediately and forgets you ever gave it. There is no retained scene graph. If you want the rectangle to still be there next frame, you draw it again.

This is called immediate-mode rendering, and it's the opposite of what SVG does (retained-mode, an actual DOM you can query and mutate — that's Chapter 2's problem). Immediate mode means:

- **No accessibility tree, by default.** The screen reader sees a rectangle full of pixels. It has no idea you drew a chart, a button, or your nephew's face. This has been Canvas's original sin since 2004, and Section 5 of this chapter covers the one API that's finally doing something about it.
- **No hit-testing.** The browser will not tell you which shape the mouse is over. You compute that yourself, or you use the `canvas.addHitRegion()` API's ghost — it never shipped, was removed from the spec, rest in peace.
- **You own repainting.** Resize the window, and nothing redraws unless your code redraws it. Compare that to SVG, where the browser's own layout engine handles it for free.

None of this is a design flaw. It's the trade the browser makes so that Canvas can be fast: pushing a million pixels through `fillRect()` calls doesn't require the browser to maintain a DOM node, run layout, or recompute styles for a million rectangles. It requires a rasterizer and a buffer.

### How the pixels actually get to the screen

Under the hood, most browsers today rasterize Canvas 2D operations on a **GPU-accelerated backend** (Skia in Chromium, similar setups in Firefox and Safari), then composite the resulting bitmap into the page like any other layer. The canvas gets promoted to its own compositor layer when the browser thinks that's cheaper than repainting it as part of the surrounding page — the same layer-promotion heuristics that apply to `will-change` and video elements apply here.

There's a catch, and it's the single most common canvas performance bug in the wild: calling `getImageData()` to read pixels back **breaks the GPU pipeline**. Pulling pixel data off the GPU and into JavaScript-accessible memory is a synchronous round trip that stalls the pipeline every single time you do it. If your code calls `getImageData()` in a hot loop — a lot of image-processing code does exactly this — you've turned a GPU-accelerated surface into the slowest thing on the page.

The browser gives you an escape hatch: pass `willReadFrequently: true` when you create the context.

```js
const ctx = canvas.getContext('2d', { willReadFrequently: true });
```

This tells the browser "I know I'm going to hammer `getImageData()`, don't even bother with GPU acceleration, just keep this canvas in a plain CPU-backed buffer." Counterintuitively, that flag makes frequent readback *faster*, because you stop paying the GPU-round-trip tax on every call. It's a rare case of "disable the accelerator to go faster," and it trips up almost everyone who builds an image editor for the first time.

---

## 2. The 2D Context: State, Paths, and the Things Nobody Reads the Spec For

`CanvasRenderingContext2D` is a state machine wearing a drawing API as a costume. Every property you set — `fillStyle`, `strokeStyle`, `globalAlpha`, `lineWidth`, the current transform — lives on a state stack you manage explicitly:

```js
ctx.save();          // push current state
ctx.translate(50, 50);
ctx.rotate(Math.PI / 4);
ctx.fillRect(0, 0, 100, 100);
ctx.restore();        // pop back to before the transform
```

Forget the `restore()` and every subsequent drawing operation inherits your rotation. This is the source of approximately forty percent of all Canvas bugs ever filed. The other sixty percent is coordinate math.

**Paths** are the vocabulary for anything that isn't a plain rectangle: `moveTo`, `lineTo`, `arc`, `bezierCurveTo`, `roundRect` (finally native since 2023, no more hand-rolled corner-radius helper functions copy-pasted from Stack Overflow). A `Path2D` object lets you build a path once and reuse it — which also happens to be the only way to get anything resembling retained-mode behavior out of Canvas, since a `Path2D` instance persists between frames even though the pixels it produced don't.

**Compositing** is where Canvas quietly does something SVG can't do nearly as cheaply: `globalCompositeOperation` gives you all the classic Porter-Duff blend modes — `source-over`, `destination-out`, `multiply`, `screen`, `xor` — as a single property flip. Masking an image to a shape, punching holes for a "scratch card" effect, building a flashlight-reveal mechanic: all one line of code.

**Filters** (`ctx.filter = 'blur(4px) contrast(1.2)'`) reuse the exact CSS filter syntax, run on the GPU, and are the fastest way to blur a canvas region — faster, generally, than doing it yourself with a convolution kernel in JavaScript, because you're handing the work to the same compositor that already handles CSS filters on the rest of the page.

**Text** is the chapter's weakest link. `fillText()` and `measureText()` exist, `TextMetrics` gives you font bounding boxes, but Canvas text has no line wrapping, no bidi handling, no font-feature-settings shortcuts. You reimplement a tiny, buggy layout engine every time you need multi-line canvas text. Section 5 is about the API that finally makes this unnecessary.

---

## 3. OffscreenCanvas: Getting Off the Main Thread

For most of Canvas's life, every drawing command ran on the main thread — the same thread handling scroll, input, and layout. Heavy canvas work (path-tracing renderers, big image filters, physics-driven particle systems) competed directly with the user's ability to click anything.

`OffscreenCanvas` fixes that by decoupling the drawing surface from the DOM entirely. You can create one directly, or `transferControlToOffscreen()` an existing `<canvas>` element, hand the resulting object to a Web Worker via `postMessage`, and draw there — main thread never touches it again.

```js
// main thread
const offscreen = canvas.transferControlToOffscreen();
worker.postMessage({ canvas: offscreen }, [offscreen]);

// worker.js
self.onmessage = (e) => {
  const ctx = e.data.canvas.getContext('2d');
  // draw here, main thread stays free to handle input
};
```

**Support status, August 2026: this is no longer a bet, it's a foundation.** Chrome (69+), Firefox (105+), Safari (16.4+), Edge, Opera, and Samsung Internet all ship it, worker context included — global coverage sits around 95%, and the holdouts are legacy browsers nobody's shipping new code for anyway. If you're still feature-detecting `OffscreenCanvas` before using it, that defensive code is dead weight at this point; keep the fallback only if you genuinely support IE-class environments.

The other underrated detail: `OffscreenCanvas` also exposes `getContext('webgl')` and, on browsers with WebGPU, `getContext('webgpu')` — so the "move rendering off the main thread" trick isn't limited to 2D work. A WebGPU compute-heavy visualization can run entirely inside a worker, main thread free to stay buttery.

---

## 4. What's Actually Deprecated (Briefly, As Promised)

Canvas has aged unusually gracefully — there isn't much of a graveyard here compared to, say, Web Components v0. The short list:

- **`mozImageSmoothingEnabled` and other vendor-prefixed smoothing flags** — dead, use the standard `imageSmoothingEnabled` / `imageSmoothingQuality`.
- **`CanvasRenderingContext2D.clearShadow()`** — never shipped anywhere real, ignore any tutorial that mentions it.
- **`addHitRegion()`** — proposed for accessibility, implemented briefly behind a flag in Chrome, formally removed from the spec. The problem it was trying to solve is now being solved differently (see Section 5).
- **Canvas-based fingerprinting as a "free" identifier** — not deprecated technically, but increasingly *neutered*. Because `toDataURL()` and `getImageData()` expose enough rendering-pipeline noise (font hinting, GPU driver quirks, anti-aliasing) to fingerprint a device, Brave, Firefox in strict mode, and Safari's ITP all inject subtle per-session noise into canvas readback specifically to break this use case. If your legitimate image-processing code depends on pixel-perfect `getImageData()` output being identical across page loads on privacy-hardened browsers, it might not be anymore. Worth knowing before you debug a "random" off-by-one on a stakeholder's laptop for three hours.

That's genuinely most of it. Canvas's stability is a feature: code from 2010 mostly still runs.

---

## 5. The Interesting Part: HTML-in-Canvas

Now for the thing that makes this chapter worth writing in 2026 instead of 2016.

Every canvas-heavy application has hit the same wall eventually: you need real text layout, real form inputs, or real accessibility inside a canvas or WebGL scene, and Canvas gives you none of it natively. The industry's answer for two decades has been "fake it" — draw text manually, hide an invisible `<input>` somewhere off-screen to catch keystrokes, hand-roll focus management. Every game HUD, every chart tooltip, every in-canvas dashboard control has paid this tax.

Chrome shipped an origin trial in 2026 for an API that removes the tax: **`drawElementImage()`** for the 2D context, and **`texElementImage2D()`** for WebGL/WebGPU. The idea: mark a DOM subtree with a `layoutsubtree` attribute, let the browser's own layout engine lay it out as normal DOM (invisible on the page), and then draw a live rasterized image of that subtree directly into your canvas or use it as a GPU texture.

```js
canvas.onpaint = () => {
  ctx.reset();
  const transform = ctx.drawElementImage(formElement, 0, 0);
  // sync the (still-real, still-focusable) DOM element's CSS transform
  // so hit-testing and focus rings land in the right place
  formElement.style.transform = transform.toString();
};
```

The element you draw is still a real DOM node. It's still keyboard-navigable, still visible to the accessibility tree, still gets browser autofill, spellcheck, `find-in-page`, and dark-mode color adjustments — the browser is just also painting a picture of it into your canvas or texture. For a WebGL scene, that means an in-world computer terminal can be an actual `<textarea>`. For a chart library, axis labels and tooltips can be real, wrappable, bidi-correct HTML instead of a hand-rolled text-measurement routine that breaks on Arabic.

**Reality check, because this is exactly the kind of thing that gets breathlessly overhyped:** as of today this lives behind `chrome://flags/#canvas-draw-element` in Chrome Canary, shipping as an origin trial across Chrome 148–150. It is Chromium-only. Firefox and Safari have made no public commitment. There's real integration pain — UV coordinates are flipped relative to WebGL's convention, canvas CSS size has to exactly match its backing buffer or everything drifts, you must wait for the first `onpaint` event before calling it or you get an `InvalidStateError`, and the spec deliberately blocks drawing anything that could leak sensitive rendered content (password fields, cross-origin iframes) into a texture a shader could read back.

Put it on your radar, don't put it in production. This is the "watch this space" entry of the chapter, and the fact that it exists at all tells you where the platform wants Canvas to go: less "isolated bitmap," more "first-class citizen that can borrow the DOM's layout engine when it needs to."

---

## 6. Use Cases, With the Boring Honesty About Why

**Charts and dashboards.** Thousands of data points redrawn sixty times a second beats what SVG can comfortably do, because SVG pays a DOM-node cost per element and Canvas doesn't. If your chart has 200 bars, use SVG (Chapter 2) and get free accessibility and easy hover states. If it has 200,000 candlesticks in a financial terminal, use Canvas and build hit-testing yourself.

**Image editors.** `getImageData()` / `putImageData()` gives raw pixel access — crop, filter, color-correct, all client-side, all without a server round trip. This is genuinely one of Canvas's killer use cases; the entire category of "browser-based Photoshop-lite" tools exists because of this pair of methods.

**Games.** 2D games historically lived here before WebGL ate the higher-end of the market. Canvas is still the right call for a lot of casual/hyper-casual 2D games precisely because the immediate-mode model maps directly onto a game loop: clear, draw entities, next frame.

**Generative art and creative coding.** p5.js exists because Canvas gives you a blank, obedient pixel surface and gets entirely out of your way. No DOM ceremony, no scene graph to fight — just coordinates and color.

**Real-time video processing.** Draw a `<video>` element's current frame into a canvas every animation frame, run a filter, feed it back out — background blur in a video call, a barcode scanner reading from a camera feed, style transfer on a webcam stream. Pairs increasingly well with WebCodecs for frame-accurate, off-main-thread pipelines.

---

## 7. Pros and Cons, Said Plainly

**What Canvas gets you:** raw speed at high element counts, pixel-level control, a tiny and stable API surface that hasn't broken your code in a decade, and a genuinely obedient rendering model — it does exactly what you tell it, no more, no less.

**What it costs you:** accessibility is opt-in and mostly manual (until HTML-in-Canvas matures, if it does), there's no free hit-testing, no free responsive layout, no free DOM inspection in devtools beyond "here's a bitmap." Every convenience SVG gives you for free, Canvas makes you build.

The decision test that actually works: if you're drawing things a user needs to *interact with individually* — click this bar, tab to this node, screen-read this label — you're fighting Canvas's nature. If you're drawing things a user needs to *look at fast*, Canvas is the right tool and SVG will eventually choke.

---

## 8. Where This Is Going

Three threads worth watching, roughly in order of how soon they'll matter:

1. **WebGPU convergence.** The `canvas2D` community group's proposal list includes letting a single canvas switch between the 2D context and WebGPU, and using WebGPU shaders as Canvas 2D filters. The historical wall between "2D canvas" and "3D canvas" is getting thinner on purpose — see Chapter 3.
2. **Layers.** A proposed Layers API for Canvas 2D (`ctx.beginLayer()` / `endLayer()`) would let you composite groups of drawing operations the way you currently need an auxiliary off-screen canvas to fake. Currently a proposal incorporated into the WHATWG spec discussion, implementation status varies by browser — check before you rely on it.
3. **HTML-in-Canvas**, if it survives origin trial and standardizes across engines, quietly closes Canvas's oldest wound. That's a bigger deal than the modest press coverage suggests — it's the first credible path to making canvas content genuinely accessible without a developer manually maintaining a parallel accessibility tree by hand.

Canvas isn't trying to become SVG. It's trying to stop making you choose between "fast" and "not a black box to everyone but sighted mouse users." Whether it gets there is a 2027 question, not a 2026 one.

---

**Next: Chapter 2 — SVG.** Same territory, opposite philosophy: what happens when the browser *does* know what you drew.

[^1]: Fallback content between the opening and closing `<canvas>` tags exists and is exposed to assistive tech and non-supporting browsers, but the moment JavaScript successfully draws into the context, that fallback content is simply never rendered. It's a nice gesture from 2004 that almost nobody wires up correctly.
