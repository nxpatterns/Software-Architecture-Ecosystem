# Use Case 74: Shape Detection API for Barcode/Face/Text Pipelines

Computer-vision-lite directly in the browser is genuinely useful — scan a barcode, detect a face for framing, pull text out of a frame, with no server round-trip. The support constraints are just as real as the usefulness.

## Why Fallback Design Gets Skipped Here Specifically

API support is limited to begin with, input quality from a live camera varies wildly by device and lighting, and teams routinely skip fallback design for unsupported engines because the happy-path demo — one clean barcode, good lighting, a Chromium browser — never surfaces the gap.

## The User Story, Stripped of Domain

A user can:

- scan barcode, shape, or text candidates quickly,
- get near-real-time guidance while doing it,
- still complete the task when detection simply isn't available on their device.

## Core Browser Technologies

| API | Job | Reference |
|---|---|---|
| Shape Detection API (Barcode/Face/Text Detector) | On-device detection from a camera or image frame | [MDN – Shape Detection API](https://developer.mozilla.org/en-US/docs/Web/API/Shape_Detection_API) |
| Camera capture pipeline with frame throttling | Keeps detection from overwhelming the main thread | [MDN - MediaDevices.getUserMedia()](https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia), [MDN - requestAnimationFrame()](https://developer.mozilla.org/en-US/docs/Web/API/Window/requestAnimationFrame) |
| Fallback detection path | Server-side detection or manual input, for everywhere the API isn't | [ZXing](https://github.com/zxing-js/library), [Tesseract.js](https://github.com/naptha/tesseract.js) |

## The Browser Reality Check

This is a Chromium-only API family — Firefox and Safari don't implement it, so a real production pipeline that needs barcode or text scanning outside Chromium ends up on a JS/WASM library instead of the native API regardless.<sup>[1]</sup> Even inside Chromium, treat this as experimental-tier: individual detector types (barcode, face, text) have shipped and evolved on different timelines, so check each one specifically rather than assuming the whole family behaves identically.

## What Breaks First

- No fallback at all outside supported browsers, breaking the entire scanning feature for Firefox and Safari users with no warning.
- Unbounded frame processing running on the main thread, freezing the UI the moment the camera starts streaming frames faster than detection can keep up.
- Missing handling for false positives in the UX flow, letting a misdetected barcode or face silently drive an incorrect action with no confirmation step.

## Minimal Technical Blueprint

```javascript
async function scanBarcode(videoElement) {
  if (!('BarcodeDetector' in window)) return startServerSideOrManualFallback();

  const detector = new BarcodeDetector();
  const interval = setInterval(async () => {
    const barcodes = await detector.detect(videoElement); // throttled, not per-frame
    if (barcodes.length && barcodes[0].rawValue) {
      clearInterval(interval);
      confirmDetection(barcodes[0]); // human confirms before acting
    }
  }, 200);
}
```

1. Capability-detect each specific detector class individually — barcode, face, and text support don't necessarily arrive or behave identically.
2. Throttle frame processing deliberately and keep the UI thread responsive; detecting on every single frame is rarely necessary and reliably freezes the interface.
3. Add confidence thresholds and a manual confirmation step before any detected result drives an action.
4. Provide a genuine fallback path — server-side detection or manual entry — for unsupported browsers and low-confidence cases alike.

## Decision Summary

Shape detection is a powerful enhancement where it's available. Baseline workflows have to survive completely without it, since the Chromium-only ceiling here isn't a temporary gap, it's the current state of the platform.

---

[1]: Shape Detection API Chromium-only support, [MDN](https://developer.mozilla.org/en-US/docs/Web/API/Shape_Detection_API).
