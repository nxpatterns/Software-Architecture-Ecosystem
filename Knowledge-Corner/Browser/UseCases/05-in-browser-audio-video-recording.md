# Use Case 05: In-Browser Audio/Video Recording

Most teams hear “record a quick clip” and picture a red button, a timer, and one blob at the end. That fantasy
survives exactly until the clip was recorded on Safari, your backend only accepts WebM, or the user expects trimming
to happen before anything leaves the laptop.

This use case makes the browser the recorder, the rough-cut desk, and the first processing stage. No native wrapper.
No plugin. Just camera, microphone, media formats, and several opportunities to learn what a container actually is.

## Why this is a good next "hard topic"

Because camera capture is easy to demo and media engineering is not easy to ship. The moment capture, encoding, local
processing, and cross-browser playback meet, one API turns into an actual pipeline.

## User Story (Abstracted)

A user can:

- grant access to a camera and/or microphone,
- see a local preview before recording,
- start, pause, resume, and stop a recording,
- listen to or watch the result locally,
- trim the useful section or apply simple audio processing,
- discard a bad take,
- and upload or save only the final media asset.

We do not care which recording. Could be a voice note, video response, evidence clip, training submission, or product
demo. Same pipeline shape.

## Core Browser Technologies

- `MediaDevices.getUserMedia()`: requests the camera and microphone as a `MediaStream`.
- `MediaRecorder`: encodes a stream into timed media chunks and final `Blob` output.
- `MediaRecorder.isTypeSupported()` / `mimeType`: probes a recorder format before asking it to produce files your
  server cannot use.
- `MediaStream` / `MediaStreamTrack`: own the live tracks, stop them deliberately, and react when the device or user
  ends capture.
- `Web Audio API`: routes microphone audio through gain, mute, analyser, filtering, or an `AudioWorklet` before
  recording.
- `AudioContext` / `OfflineAudioContext`: process or render a selected audio segment locally without first shipping
  raw audio to a server.
- `WebCodecs` (optional): low-level frame and audio-sample decode/encode for a real local video export path when the
  runtime supports the required codec.
- `URL.createObjectURL()` / `Blob`: preview, retain, and upload the captured recording.

## Browser Reality Check

### Desktop

- Chromium (Chrome, Edge, Arc): `getUserMedia()` and `MediaRecorder` are supported; treat WebM/Opus as a candidate,
  not a contract, and ask `isTypeSupported()` before choosing an encoder
  ([caniuse–getUserMedia](https://caniuse.com/mdn-api_mediadevices_getusermedia),
  [caniuse–MediaRecorder](https://caniuse.com/mediarecorder),
  [MDN](https://developer.mozilla.org/en-US/docs/Web/API/MediaRecorder/isTypeSupported_static)).
- Firefox: supports camera/microphone capture and `MediaRecorder`, but that still does not make its accepted
  recording formats identical to Chromium or Safari; probe the exact MIME type on the current browser
  ([caniuse–getUserMedia](https://caniuse.com/mdn-api_mediadevices_getusermedia),
  [caniuse–MediaRecorder](https://caniuse.com/mediarecorder),
  [MDN](https://developer.mozilla.org/en-US/docs/Web/API/MediaRecorder/mimeType)).
- Safari (macOS): current Safari supports `MediaRecorder`, but WebKit documents its recorder output as MP4 with
  H.264 video and AAC audio. That is the Safari-shaped hole in any “we always send WebM/Opus” plan
  ([caniuse](https://caniuse.com/mediarecorder), [WebKit](https://webkit.org/blog/11353/mediarecorder-api/)).

### Mobile

- Android Chromium: camera/microphone capture and `MediaRecorder` are available, but memory, thermal limits, and a
  backgrounded tab make long, high-bitrate takes a bad product promise
  ([caniuse–getUserMedia](https://caniuse.com/mdn-api_mediadevices_getusermedia),
  [caniuse–MediaRecorder](https://caniuse.com/mediarecorder)).
- iOS Safari / WebKit-based browsers: camera/microphone access and `MediaRecorder` are available in current iOS
  Safari, but the Safari recorder format is the MP4/H.264/AAC path WebKit documents. Do not ship a WebM-only upload
  contract and then act surprised by phones
  ([caniuse–getUserMedia](https://caniuse.com/mdn-api_mediadevices_getusermedia),
  [caniuse–MediaRecorder](https://caniuse.com/mediarecorder),
  [WebKit](https://webkit.org/blog/11353/mediarecorder-api/)).

Short version: capture is broadly available. Recording formats are where the browser personalities start showing.

## What Usually Breaks First

- Hardcoding `video/webm;codecs=vp8,opus` or `audio/mp4` before asking what the recorder can actually make.
  `isTypeSupported()` exists because format support is not a universal promise
  ([MDN](https://developer.mozilla.org/en-US/docs/Web/API/MediaRecorder/isTypeSupported_static)).
- Naming every recorded blob `.webm` because that is what Chrome produced in development, then receiving Safari MP4.
- Treating a MIME type as a cosmetic string instead of a container-plus-codec compatibility decision. A mismatched
  codec and container may not play reliably
  ([MDN](https://developer.mozilla.org/en-US/docs/Web/API/MediaRecorder/mimeType)).
- Calling “trim” a UI range selection when users expect a smaller exported file with the unwanted frames physically
  removed.
- Doing audio analysis, waveform rendering, and encoding on the main thread, then blaming the camera when the
  controls freeze.
- Leaving camera tracks running after cancel, navigation, or an error because nobody gave ownership of
  `stream.getTracks()` to one lifecycle boundary.
- Assuming `isTypeSupported()` means the encoder cannot still fail under resource pressure. It only says the user
  agent should be able to record that format
  ([MDN](https://developer.mozilla.org/en-US/docs/Web/API/MediaRecorder/isTypeSupported_static)).

## Minimal Technical Blueprint

1. Serve the recording page over HTTPS, feature-detect `navigator.mediaDevices`, `getUserMedia`, and
   `MediaRecorder`, and show an explicit unsupported state before the user reaches a broken red button.
2. On a clear user action, request only the tracks required for this take: audio, video, or both. Keep the returned
   `MediaStream` in one capture controller, not spread across component state like confetti.
3. Attach the original stream to a muted local preview. If audio processing is needed, send the microphone track
   through a `Web Audio` graph and record the graph's destination stream instead of the untouched input.
4. Build an ordered list of acceptable MIME candidates, call `MediaRecorder.isTypeSupported()` for each, and store
   the selected type with the recording metadata. Read the recorder's resulting `mimeType`; the browser is allowed
   to choose its own format when none is requested
   ([MDN](https://developer.mozilla.org/en-US/docs/Web/API/MediaRecorder/mimeType)).
5. Start `MediaRecorder` with bounded chunk intervals, append `dataavailable` blobs as they arrive, and keep a
   duration counter independent of the browser's event timing.
6. On stop, join the chunks into a `Blob`, create a local object URL, and let the user replay or reject the take
   before upload.
7. Make baseline trimming honest: retain in/out points for preview, and render selected audio through
   `OfflineAudioContext` when an audio-only export is required. For a frame-accurate video export, use a
   feature-detected `WebCodecs` path or a server-side transcode; `WebCodecs` codec support is device- and
   browser-specific ([MDN](https://developer.mozilla.org/en-US/docs/Web/API/WebCodecs_API)).
8. Stop every input track, close the audio context if appropriate, revoke discarded object URLs, and persist only
   the blobs or resumable-upload state you intentionally need.

## Compatibility Strategy (Pragmatic)

- Baseline mode (all modern recording browsers): camera/microphone capture, a runtime-probed `MediaRecorder` MIME
  type, local original-blob preview, trim markers, and upload or server-side transcode.
- Enhanced mode (supporting browsers): `Web Audio` processing, a local audio-only trimmed export, and `WebCodecs`
  only after capability checks confirm the chosen decoder and encoder. The API deliberately exposes codec support
  as a per-browser/per-device question, not a wish
  ([MDN](https://developer.mozilla.org/en-US/docs/Web/API/WebCodecs_API)).

Store the recorded MIME type with the asset. Future-you should not have to infer a container from a filename extension
and a bad feeling.

## Security and Compliance Notes

- `getUserMedia()` is HTTPS-only and requires user permission for camera or microphone input
  ([MDN](https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia)).
- Request the minimum capture surface: audio-only should not wake the camera just because a shared component knows
  how to render video.
- Make the live/recording state visible, stop tracks on every exit path, and do not keep an invisible microphone
  session alive between takes.
- Treat recordings as personal data by default. Define local retention, deletion, access controls, and an explicit
  upload/consent boundary.
- If the recorder lives in an iframe, configure Permissions Policy and top-level permission ownership deliberately;
  an unapproved embedded context cannot simply ask for camera or microphone access
  ([MDN](https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia)).

“Local first” does not mean “not sensitive.” It means the sensitive bytes are now sitting on a user device before your
server has even met them.

## Test Matrix You Actually Need

- Desktop Chrome/Edge: record audio-only and camera-plus-mic, then inspect the selected MIME type and play the
  output outside the app.
- Firefox latest: repeat the same candidates; do not assume the Chrome choice won the format negotiation.
- Safari macOS latest: verify the MP4/H.264/AAC intake path and your upload service's validation, not merely the
  local preview.
- Android Chromium on a mid-range real device: record a longer take, rotate the device, background the app briefly,
  then recover cleanly.
- iOS Safari on a real iPhone: deny permission, allow permission, cancel a take, record a take, and confirm the
  server accepts the Safari output.
- Low-storage and low-memory scenarios with multiple takes, discarded blobs, and a slow upload.
- Audio processing enabled: confirm latency, levels, mute, interruption, and the stop path all release the original
  microphone tracks.

If your acceptance test is one WebM blob recorded on a developer MacBook, you tested a demo, not a recorder.

## Decision Summary

Use this pattern when:

- users need to create short audio or video without installing a native app,
- immediate local preview or simple processing is valuable,
- your backend can ingest multiple tested recording formats or transcode them.

Avoid this pattern when:

- you require one guaranteed codec/container from every browser with no server-side normalization,
- frame-perfect video editing is the core product but you cannot fund a real encode/mux pipeline,
- capture must continue reliably while the phone is backgrounded or locked.

Because yes, it is a record button. And no, the file it produces is not a universal object.

## Next Logical Topic

After this, the best follow-up is:
**Screen sharing and screen recording from the browser**
(picker-controlled display capture, desktop-only reality, and the part where mobile politely declines the entire
feature).
