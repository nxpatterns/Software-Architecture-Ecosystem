# Use Case 97: Camera Torch Control — When Mobile Can Do Something Desktop Can't

Most of this deck is about desktop capability that mobile lacks — WebHID, WebUSB, multi-monitor orchestration, none of it reaching a phone. This one runs the other way. A web page can turn on a phone's camera flash as a torch — steady light, not a photo flash — through the same `getUserMedia()` stream already covered in Use Case 05. A desktop, lacking a camera flash, structurally cannot do this at all.

## Why This Isn't Really a "Flashlight API"

There's no dedicated flashlight API. Torch control rides inside the MediaStream Image Capture API, as one of several hardware constraints — alongside zoom, focus, and white balance — that can be applied to an active video track from `getUserMedia()`. The page has to already be holding a live camera stream; turning on the torch is a side effect of controlling that stream's hardware, not a standalone permission or capability.

## The User Story, Stripped of Domain

A user can:

- turn their phone's camera flash into a steady torch from within a web page — for scanning a barcode in low light, illuminating a document for a photo, or a dedicated "flashlight" utility page,
- turn it back off cleanly when done, with no lingering camera session left running,
- get an honest "not available" state on devices or browsers that don't support it, rather than a button that silently does nothing.

## Core Browser Technologies

| API | Job | Reference |
|---|---|---|
| `getUserMedia()` | Establishes the video stream the torch constraint rides on | [MDN – getUserMedia](https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia) |
| `MediaStreamTrack.getCapabilities()` | Reports whether the current track supports `torch` at all | [MDN – MediaStreamTrack.getCapabilities()](https://developer.mozilla.org/en-US/docs/Web/API/MediaStreamTrack/getCapabilities) |
| `MediaStreamTrack.applyConstraints({ advanced: [{ torch: true }] })` | Turns the torch on or off | [MDN – applyConstraints()](https://developer.mozilla.org/en-US/docs/Web/API/MediaStreamTrack/applyConstraints) |
| ImageCapture API | The broader spec family torch control belongs to | [MDN – MediaStream Image Capture API](https://developer.mozilla.org/en-US/docs/Web/API/MediaStream_Image_Capture_API) |

## The Browser Reality Check

This is narrower than it looks. Torch control works reliably on Chrome for Android — Chromium desktop and Android browsers ship the underlying ImageCapture API by default.<sup>[1]</sup> iOS Safari does not expose this capability at all, a long-standing, deliberate Apple restriction with no signal it's changing — this is not a version gap to wait out.<sup>[2]</sup> Firefox for Android explicitly reports `torch: false` in its capabilities object even on devices that physically have torch hardware — the browser, not the phone, is the limiting factor there.<sup>[2]</sup> Desktop, by definition, has no camera flash hardware to control regardless of browser.

## What Breaks First

- Assuming "the device has a camera flash" means the browser will expose torch control — Firefox for Android proves that assumption wrong even on capable hardware.
- Requesting a full camera stream just to access the torch, then displaying that video feed to the user when the actual goal was only the light — the video is unnecessary and confusing if a flashlight utility is all that's needed.
- Leaving the camera stream open after the torch is turned off, keeping the camera's hardware LED indicator lit and draining battery for no reason.
- Not checking `getCapabilities().torch` before attempting `applyConstraints()`, producing a caught exception instead of a clean "unsupported" UI state.

## Minimal Technical Blueprint

```javascript
let track = null;

async function enableTorch() {
  const stream = await navigator.mediaDevices.getUserMedia({
    video: { facingMode: 'environment' }, // rear camera
  });
  track = stream.getVideoTracks()[0];

  const capabilities = track.getCapabilities();
  if (!capabilities.torch) {
    stream.getTracks().forEach(t => t.stop()); // release immediately, no torch available
    return showUnsupportedState();
  }

  await track.applyConstraints({ advanced: [{ torch: true }] });
}

function disableTorch() {
  track?.stop(); // releases the camera entirely, torch off, LED indicator clears
  track = null;
}
```

1. Feature-detect via `getCapabilities().torch` after acquiring the stream — a missing `torch` key means this device/browser combination can't do it, regardless of physical hardware.
2. Request only the rear (`environment`) camera, and avoid displaying the video feed at all if the actual goal is just the light — no `<video>` element needed for a pure flashlight use case.
3. Stop every track explicitly when the torch is no longer needed — this both turns the light off and releases the camera, clearing the OS-level "camera in use" indicator.
4. Show an honest unsupported state on iOS Safari and any Firefox device reporting `torch: false`, rather than a button that appears functional but does nothing.
5. Never request torch access silently in the background — the camera permission prompt this requires is exactly the kind of access a user should consciously grant.

## Decision Summary

Use this for genuinely useful in-context lighting — illuminating a barcode scan, a document capture, a low-light form — where Chrome-for-Android coverage is acceptable and every other combination gets an honest fallback.

Don't build a dedicated "flashlight app" web page expecting broad reach — the iOS gap alone rules out roughly half of mobile users, and Firefox for Android's blanket `false` response removes another slice even on the platform that theoretically supports it.

---

[1]: ImageCapture API default support in Chromium desktop and Android, [TestMu AI – ImageCapture API: Browser Support](https://www.testmuai.com/learning-hub/image-capture-api-browser-support/).
[2]: iOS Safari's lack of torch exposure and Firefox for Android's `torch: false` behavior even on capable hardware, [Absolutool – Free Online Flashlight](https://absolutool.com/tools/flashlight).
