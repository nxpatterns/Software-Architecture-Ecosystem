# Use Case 05: In-Browser Audio/Video Recording

"Record a quick clip" conjures a red button, a timer, one blob at the end. That fantasy survives exactly until the clip was recorded on Safari, your backend only accepts WebM, and the user expected trimming to happen before anything left the laptop.

This use case makes the browser the recorder, the rough-cut desk, and the first processing stage. No native wrapper, no plugin. Just camera, microphone, media formats, and several opportunities to learn what a container actually is versus what you assumed it was.

## Why Capture Is Easy and Media Engineering Isn't

Camera capture demos beautifully. The moment capture, encoding, local processing, and cross-browser playback have to cooperate, one API call turns into an actual pipeline with actual failure modes.

## The User Story, Stripped of Domain

- grant camera and/or microphone access,
- see a local preview before recording starts,
- start, pause, resume, stop,
- play back the result locally,
- trim the useful part or apply light audio processing,
- discard a bad take,
- upload only the final asset.

Voice note, video response, evidence clip, training submission — same pipeline shape, different stakes.

## Core Browser Technologies

| API | Job | Reference |
|---|---|---|
| [`getUserMedia()`](https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia) | Requests camera/mic as a `MediaStream` | MDN |
| [`MediaRecorder`](https://caniuse.com/mediarecorder) | Encodes a stream into timed chunks and a final `Blob` | caniuse |
| [`isTypeSupported()`](https://developer.mozilla.org/en-US/docs/Web/API/MediaRecorder/isTypeSupported_static) | Probes a format before you promise your server can ingest it | MDN |
| `MediaStream` / `MediaStreamTrack` | Own the live tracks, stop them deliberately | — |
| Web Audio API | Gain, mute, analysis, filtering before recording | — |
| `AudioContext` / `OfflineAudioContext` | Local audio processing without a server round-trip | — |
| WebCodecs (optional) | Frame-accurate local video export, capability-gated | MDN |
| `URL.createObjectURL()` / `Blob` | Preview, retain, upload | — |

## The Browser Reality Check

Capture is broadly available everywhere. **Recording formats are where the browser personalities show up.** Chromium treats WebM/Opus as a candidate, not a contract — always ask `isTypeSupported()` before committing to an encoder.<sup>[1]</sup> Firefox supports the same capture and recording APIs, with its own accepted MIME set — don't assume Chrome's winning format choice transfers.<sup>[1]</sup> Safari's `MediaRecorder` output is documented by WebKit as MP4 with H.264 video and AAC audio.<sup>[2]</sup> That's the Safari-shaped hole in any "we always get WebM" architecture, and it's not a bug — it's WebKit telling you exactly what it does.

Mobile follows the same split: Android Chromium supports capture and recording, constrained by memory, thermals, and backgrounding. iOS Safari supports both too, on the same MP4/H.264/AAC path as desktop Safari.<sup>[2]</sup> Ship a WebM-only upload contract and iPhones will file the bug report for you.

## What Breaks First

- Hardcoding `video/webm;codecs=vp8,opus` before asking the recorder what it can actually produce.
- Naming every blob `.webm` because that's what Chrome made in dev, then receiving Safari's MP4.
- Treating a MIME string as cosmetic instead of a container-plus-codec contract that determines whether the file plays at all.
- Calling "trim" a UI range selection when users expect a smaller exported file with the unwanted frames actually gone.
- Running waveform rendering and encoding on the main thread, then blaming the camera when the controls freeze.
- Leaving camera tracks running after cancel or error because nobody owns `stream.getTracks()` at a single lifecycle boundary.
- Reading `isTypeSupported() === true` as a guarantee. It says the browser *should* be able to record that format — not that it will survive resource pressure.<sup>[3]</sup>

## Minimal Technical Blueprint

```javascript
const candidates = ['video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/mp4'];
const mimeType = candidates.find(t => MediaRecorder.isTypeSupported(t));
if (!mimeType) return showUnsupportedState();

const recorder = new MediaRecorder(processedStream, { mimeType });
const chunks = [];
recorder.ondataavailable = (e) => e.data.size && chunks.push(e.data);
recorder.onstop = () => {
  const blob = new Blob(chunks, { type: recorder.mimeType }); // trust what it actually produced
  attachPreview(URL.createObjectURL(blob));
};
```

1. Feature-detect `mediaDevices`, `getUserMedia`, `MediaRecorder` before the user reaches a broken red button.
2. On a clear user action, request only the tracks this take needs. Keep the stream in one capture controller.
3. Route the microphone track through a Web Audio graph if processing is needed, and record the graph's output — not the untouched input.
4. Build an ordered MIME candidate list, probe with `isTypeSupported()`, store the selected type as metadata, and read back the recorder's actual `mimeType` — the browser may still choose its own.
5. Start with bounded chunk intervals, append `dataavailable` blobs, track duration independently of event timing.
6. On stop, join chunks into a `Blob`, create an object URL, let the user reject the take before it ever uploads.
7. For honest trimming, keep in/out points for preview and render audio-only exports through `OfflineAudioContext`. Frame-accurate video trimming needs a feature-detected WebCodecs path or a server-side transcode.
8. Stop every track, close the audio context, revoke discarded object URLs, persist only what you intentionally need.

## Compatibility Strategy

**Baseline:** capture, a runtime-probed `MediaRecorder` format, local original-blob preview, trim markers, upload or server-side transcode.

**Enhanced:** Web Audio processing, local audio-only trimmed export, WebCodecs gated behind explicit capability checks — codec support is a per-browser, per-device question, never a wish.

Store the recorded MIME type with the asset. Future-you shouldn't have to guess a container from a file extension and a bad feeling.

## Security and Compliance

`getUserMedia()` is HTTPS-only and permission-gated by design. Request the minimum surface — audio-only shouldn't wake the camera just because a shared component knows how to render video. Make the recording state visibly obvious, stop tracks on every exit path, never leave an invisible mic session alive between takes.

Treat recordings as personal data by default: local retention, deletion, access controls, an explicit upload/consent boundary. "Local first" doesn't mean "not sensitive" — it means the sensitive bytes just landed on a user's device before your server ever met them.

## Test Matrix You Actually Need

- Desktop Chrome/Edge and Firefox: record both modes, inspect the actual selected MIME type, play the output outside the app.
- Safari macOS: verify the MP4/H.264/AAC path against your upload validation, not just the local preview.
- Android real device: longer take, rotation, brief backgrounding, clean recovery.
- iOS real device: deny, allow, cancel, record, confirm the server actually accepts Safari's output.
- Low-storage, low-memory scenarios with multiple takes and a slow upload.

One WebM blob recorded on a developer MacBook is a demo, not a recorder.

## Decision Summary

Use this when users need to create short audio or video without a native app, when local preview or light processing adds real value, and when the backend can ingest — or transcode — more than one recording format.

Skip it when you need one guaranteed codec from every browser with zero server-side normalization, when frame-perfect editing is core but nobody's funding a real encode pipeline, or when capture must survive a backgrounded, locked phone.

It's a record button. The file it produces is not a universal object, no matter how the demo looked.

---

[1]: `getUserMedia`/`MediaRecorder` support and MIME probing, [caniuse – getUserMedia](https://caniuse.com/mdn-api_mediadevices_getusermedia), [caniuse – MediaRecorder](https://caniuse.com/mediarecorder), [MDN – isTypeSupported](https://developer.mozilla.org/en-US/docs/Web/API/MediaRecorder/isTypeSupported_static).
[2]: Safari `MediaRecorder` output format, [WebKit Blog](https://webkit.org/blog/11353/mediarecorder-api/).
[3]: `isTypeSupported()` semantics, [MDN](https://developer.mozilla.org/en-US/docs/Web/API/MediaRecorder/isTypeSupported_static).
