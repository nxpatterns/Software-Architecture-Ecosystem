# Use Case 17: Canvas-Relevant Use Cases — A Working Matrix

`<canvas>` looks like one API. It's actually ten different products wearing the same tag, and each one breaks in its own specific, well-documented way the instant it leaves Chrome on your laptop. This is the reference matrix: one row per real use case, the APIs it actually needs, and the cross-browser landmine that will find your team eventually.

Not a single deep-dive — a map. Use it to know which of the other use cases in this deck to open next.

## 1. Image Upload + Analysis (Color Extraction, Pixel Inspection)

**Stack:** File API, `FileReader`/`createImageBitmap()`, Canvas 2D, `ctx.drawImage()`, `ctx.getImageData()` for pixel reads. For on-image markup, either a hand-built brush layer over Pointer Events, or the native `EyeDropper` API.

**Where it breaks:**

- `EyeDropper` exists only in Chromium (Chrome/Edge/Opera, v95+). Safari and Firefox still don't support it as of 2026 — the fallback everywhere else is a Canvas crosshair cursor you build yourself.<sup>[1]</sup>
- `getImageData()` throws `SecurityError` — "tainted canvas" — the instant an image loads from a foreign origin without matching CORS headers. Identical across every browser, and the classic "runs locally, breaks in production" bug.<sup>[2]</sup>
- iOS Safari caps canvas area at roughly 16,777,216 pixels (about 4096×4096). A photo straight off a modern 12+ MP phone camera has to be downscaled *before* drawing, or the canvas fails silently — no error, just nothing.<sup>[3]</sup>
- Safari Private Mode (WebKit 17+) and browsers like Brave deliberately inject noise into canvas output as anti-fingerprinting. Pixel-accurate color analysis can see slightly different RGB values across identical calls.<sup>[4]</sup>

## 2. Freehand Drawing / Signature Pad / Whiteboard

**Stack:** Canvas 2D context, Pointer Events (`pointerdown`/`move`/`up`) instead of separate mouse and touch handlers, CSS `touch-action: none` against scroll conflicts.

**Where it breaks:**

- `PointerEvent.pressure` returns unreliable or constant values in Safari while Chrome and Firefox pass real pressure data through — pressure-sensitive stroke width is not guaranteed identical across browsers, full stop.<sup>[5]</sup>
- Without `touch-action: none`, the page scrolls and pinch-zooms right along with the drawing gesture on mobile — and the interaction with pinch-zoom differs noticeably between iOS and Android.

## 3. In-Browser Image Editing (Crop, Filter, Compression, Watermark)

**Stack:** Canvas 2D plus `ctx.filter` (CSS filter syntax — `blur()`, `grayscale()`), `OffscreenCanvas` for Worker-side computation, `canvas.toBlob()`/`toDataURL()` for export.

```javascript
ctx.filter = 'blur(4px) grayscale(1)'; // Safari: silently ignored, not an error
```

**Where it breaks:**

- `ctx.filter` is unsupported in Safari, desktop and iOS both — effects there need manual pixel manipulation or a polyfill, and Safari won't tell you it skipped the filter.<sup>[6]</sup>
- `toBlob()`/`toDataURL()` with `image/webp` on iOS (every browser there runs WebKit) frequently returns PNG silently instead of WebP, with no error thrown.<sup>[7]</sup>
- `OffscreenCanvas` only arrived in Safari 16.4 — older iOS devices still in the field need a synchronous main-thread fallback.<sup>[8]</sup>

## 4. Canvas Export (Save, Share, Copy to Clipboard)

**Stack:** `canvas.toBlob()`, `<a download>`, Clipboard API (`navigator.clipboard.write()` with `ClipboardItem`), Web Share API for mobile share sheets.

**Where it breaks:**

- Image support in the Clipboard API is newer than plain text support, and accepted MIME types are still restricted on older Safari/Firefox — see Use Case 22 for the full clipboard story.
- `navigator.share()` with files is unsupported or experimental on desktop Chrome/Firefox while mobile browsers handle it well — one of the rare cases where the phone can do something the desktop can't.

## 5. Capturing a Still Frame From Video/Webcam

**Stack:** `<video>` plus `getUserMedia()` for live camera, or a plain video element; `ctx.drawImage(videoElement, ...)` to paint a frame onto canvas.

**Where it breaks:**

- iOS Safari requires the `playsinline` attribute and a genuine user interaction before video/camera frames draw reliably.
- Skipping a `video.readyState` check means `drawImage` returns delayed or empty frames on some browsers until the video is actually ready to play.

## 6. QR/Barcode Generation and Scanning

**Stack:** Canvas rendering for generation (usually via a library), the native `BarcodeDetector` API for scanning from video or image streams.

**Where it breaks:**

- `BarcodeDetector` is practically Chromium-only. Firefox and Safari don't support it, so any production app ends up on a JS/WASM library instead of the native API anyway.<sup>[9]</sup>

## 7. Compute-Heavy Canvas Work Without Blocking the UI

**Stack:** `OffscreenCanvas`, `canvas.transferControlToOffscreen()`, Web Workers.

**Where it breaks:**

- Full cross-platform support, including the 2D context inside a Worker, only exists from Safari 16.4/17 onward. Older iOS devices in the field need synchronous main-thread code, which stutters visibly on low-end hardware.<sup>[8]</sup>

## 8. Simple 2D Games in Canvas (See: the Chrome Dino Pattern)

**Stack:** Canvas 2D plus `requestAnimationFrame()` for the game loop, keyboard events for desktop, touch/pointer events for mobile, Web Audio or `<audio>` for effects, optionally the Gamepad API for controllers. Full treatment in Use Case 16.

**Where it breaks:**

- Web Audio requires a prior user gesture in practically every browser — plain autoplay fails especially consistently on iOS Safari.
- A game built purely on `keydown` is unplayable on touch-only devices without deliberate fallback buttons.
- `requestAnimationFrame` throttles or pauses in a backgrounded tab — the exact throttling intervals differ between Chrome, Firefox, and Safari.

## 9. Accessibility of Canvas Content

**Stack:** ARIA fallback content nested inside the `<canvas>` tag, `role="img"` plus `aria-label`, or a parallel hidden DOM structure for screen readers.

**Where it breaks:**

- No browser reads canvas pixels to a screen reader — that's architecture, not a bug to file. The variance is only in how reliably VoiceOver (Safari) honors fallback content compared to NVDA/JAWS (Chrome/Firefox/Edge) when it isn't built exactly to spec.

## 10. Canvas Fingerprinting and Privacy Noise (Cross-Cutting)

**Stack:** The same read APIs as above (`toDataURL`, `getImageData`) double as the tools trackers use for device fingerprinting.

**Where it breaks:**

- Safari Private Mode (WebKit 17+) and Brave deliberately inject noise into canvas, WebGL, and Web Audio output specifically to frustrate fingerprinting — which means every use case above (color extraction, image comparison, export) can return marginally different pixel values between identical calls, on the exact same page.<sup>[4]</sup>

## Decision Summary

This is a routing document, not a build plan. Use it to identify which specific canvas capability your feature actually needs, then open the matching deep-dive use case for the real architecture, test matrix, and security notes — starting with Use Case 16 for games and Use Case 02 for anything file-processing-adjacent.

The pattern repeats across all ten rows: Chromium ships the capability first, Safari ships it eventually and differently, and the fingerprinting-resistant browsers quietly corrupt your pixel-perfect assumptions on purpose. Design for that from row one, not as a patch after the conference demo breaks on someone's iPhone.

---

[1]: `EyeDropper` API browser support, [MDN](https://developer.mozilla.org/en-US/docs/Web/API/EyeDropper_API), [caniuse](https://caniuse.com/mdn-api_eyedropper).
[2]: Tainted canvas / CORS requirements, [MDN](https://developer.mozilla.org/en-US/docs/Web/HTML/How_to/CORS_enabled_image), [corsfix](https://corsfix.com/blog/tainted-canvas).
[3]: iOS Safari canvas area limit, [lionpuro.com](https://lionpuro.com/posts/canvas-is-finally-usable-on-safari), [pqina.nl](https://pqina.nl/blog/canvas-area-exceeds-the-maximum-limit/).
[4]: Anti-fingerprinting canvas noise in Safari Private Mode and Brave, [Brave Community](https://community.brave.app/t/improve-fingerprinting-protections-in-brave-ios-to-better-match-safari/641499).
[5]: `PointerEvent.pressure` inconsistency in Safari, [Stack Overflow](https://stackoverflow.com/questions/76644456/pointer-pressure-is-0-in-safari-in-pointer-events-despite-button-being-pressed).
[6]: `ctx.filter` unsupported in Safari, [MDN](https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/filter), [Stack Overflow](https://stackoverflow.com/questions/74334371/canvasrenderingcontext2d-filter-not-working-on-safari).
[7]: Silent WebP-to-PNG fallback on iOS, [Stack Overflow](https://stackoverflow.com/questions/79186306/canvas-todataurl-with-webp-not-working-on-ipad-chrome-and-safari).
[8]: `OffscreenCanvas` Safari version support, [caniuse](https://caniuse.com/offscreencanvas), [testmuai.com](https://www.testmuai.com/learning-hub/offscreencanvas-browser-support/).
[9]: `BarcodeDetector` Chromium-only support, [MDN](https://developer.mozilla.org/en-US/docs/Web/API/BarcodeDetector), [caniuse](https://caniuse.com/mdn-api_barcodedetector).
