# Media APIs Today — The Complete Stack (August 2026)

Twenty years ago, "playing a video on a website" meant Flash, a plugin crash, and a support ticket. Today the browser is a fully licensed media production studio: it captures your camera, encodes the footage on your GPU, streams it to three continents in real time, applies DRM so Hollywood doesn't sue anyone, and then — while you weren't looking — it started reading barcodes off your webcam feed too.

This is the inventory. Not a tutorial for any single API — each of those already got its own document¹ — but the map that shows how the pieces fit, which ones are load-bearing, which ones are Chrome cosplaying as a standard, and which ones you can finally stop supporting.

---

## 1. The Foundation: HTMLMediaElement

`<video>` and `<audio>` are the ground floor. Nobody gets excited about them anymore, which is the highest compliment a web API can receive — invisible reliability.

What's still worth knowing in 2026:

- **`requestVideoFrameCallback()`** — frame-accurate callbacks synced to the compositor, the correct way to do per-frame video processing (canvas overlays, ML inference on video) instead of polling `currentTime` in a `requestAnimationFrame` loop and hoping. Shipped everywhere except it took Firefox until 2024 to catch up. It has now.
- **`HTMLVideoElement.requestPictureInPicture()`** — covered in section 8, because Picture-in-Picture grew a second, weirder sibling.
- **Media Session integration** (section 8) turns a plain `<video>` into something that responds to hardware media keys and lock-screen controls, for free.

Nothing here is new. That's fine. Foundations aren't supposed to be exciting.

---

## 2. Getting Media In: Capture & Streams

### `getUserMedia()` / MediaStream

The API that turns "may this website use your camera" into a permission prompt everyone reflexively clicks "Allow" on. Stable since forever, `MediaStreamConstraints` lets you request specific resolutions, frame rates, facing modes, and — the constraint people forget exists — `echoCancellation`, `noiseSuppression`, and `autoGainControl` for audio.

```js
const stream = await navigator.mediaDevices.getUserMedia({
  video: { width: 1280, height: 720, facingMode: "user" },
  audio: { echoCancellation: true, noiseSuppression: true },
});
videoEl.srcObject = stream;
```

Use case that still surprises people: you don't need WebRTC to use this. A local face filter, a QR-scanning kiosk app, an in-browser photo booth — all just `getUserMedia` plus a `<canvas>`. No network involved.

### Screen Capture API family — this got a lot bigger

`getDisplayMedia()` used to be "share your screen, get a MediaStream, done." As of 2026 it's grown three extensions, all Chrome-originated, all in various stages of standardization:

| Extension | What it does | Status (Aug 2026) |
|---|---|---|
| **Element Capture** | Restricts capture to one DOM element and its descendants — no more accidentally leaking your other browser tabs during a demo | Chrome/Edge shipped; not in Safari or Firefox |
| **Region Capture** | Crops an existing tab-capture stream to the bounding box of a specific element | Chrome/Edge shipped, spec stable in WICG |
| **Captured Surface Control** | Lets the *capturing* app forward wheel events and adjust zoom on the *captured* surface — so a video-conferencing app can let you scroll the shared tab without alt-tabbing to it | Chrome/Edge behind a Permissions-Policy gate (`captured-surface-control`); WebRTC WG standardizing, but this is a one-vendor show for now |

Every one of these three requires transient user activation and a fresh permission prompt even when the site's Permissions-Policy allows it — the spec authors clearly remembered that "let a website control your screen" is the kind of sentence that ends careers.

```js
const controller = new CaptureController();
const stream = await navigator.mediaDevices.getDisplayMedia({
  video: true,
  controller,
});
// Later, with the user's blessing:
await controller.increaseZoomLevel();
```

Use case: screen-share apps that let the presenter zoom into a captured window without switching focus away from the call — the entire reason Captured Surface Control exists.

---

## 3. Getting Media Out: The Playback Plumbing

### Media Source Extensions (MSE)

MSE is the reason adaptive bitrate streaming (YouTube, Netflix, every video platform that isn't serving a static MP4) works without a plugin. You feed it byte ranges of encoded video via a `SourceBuffer`, and it stitches them into something `<video>` can play, switching quality on the fly as your bandwidth changes.

Boring, load-bearing, universally supported. If you're building a streaming player from scratch in 2026 you're probably reaching for a library (hls.js, dash.js, Shaka Player) that wraps MSE rather than touching `SourceBuffer.appendBuffer()` directly — and that's the correct call. MSE's API surface is unforgiving about buffer state and timing; get it wrong and you get silent stalls, not helpful errors.

### Encrypted Media Extensions (EME)

The DRM layer. `requestMediaKeySystemAccess()` negotiates with a Content Decryption Module (Widevine on Chrome/Android, PlayReady on Edge/Windows, FairPlay on Safari) so licensed video can be decrypted without the decrypted bytes ever being exposed to JavaScript. Nobody *likes* EME. Everybody who ships premium video content needs it, because the alternative was every streaming service running actual native plugins, which was worse in every measurable way.

Status: universally shipped, universally stable, universally invisible to end users when it works and universally infuriating when a CDM update breaks it. Nothing new here in 2026 — it's mature infrastructure now, not a frontier.

---

## 4. Recording What You've Got: MediaRecorder

Takes any `MediaStream` — camera, microphone, or a canvas via `canvas.captureStream()` — and encodes it to a container format in real time, in the browser, no server round-trip.

```js
const recorder = new MediaRecorder(stream, { mimeType: "video/webm;codecs=vp9,opus" });
const chunks = [];
recorder.ondataavailable = (e) => chunks.push(e.data);
recorder.onstop = () => {
  const blob = new Blob(chunks, { type: "video/webm" });
  // upload, download, or hand off to WebCodecs for re-encoding
};
recorder.start();
```

Use case: browser-based screen recorders, voice-memo widgets, "record a video testimonial" forms — anywhere you want output you can save or upload without a transcoding server.

The catch that still bites people: `mimeType` support is inconsistent. Chrome favors WebM/VP9, Safari favors MP4/H.264, and there's no universal container-plus-codec string. Always feature-detect with `MediaRecorder.isTypeSupported()` before you commit to a mime type, or you'll ship a recorder that silently fails on exactly the browser your QA team wasn't using.

MediaRecorder gives you a finished file. It does not give you control over individual frames, bitrate ladders, or codec parameters beyond a rough hint. For that, keep reading.

---

## 5. Real-Time: WebRTC

`RTCPeerConnection` is its own universe — NAT traversal, SDP negotiation, ICE candidates, TURN servers, a standards process that took a decade — and one document at "mittlere Tiefe" isn't going to do it justice. The short version for August 2026:

- **Core WebRTC 1.0** (`RTCPeerConnection`, `RTCDataChannel`) is stable, universally supported, and has been for years. If you're building it from scratch instead of using a library (mediasoup, LiveKit, Twilio), you already know what you're doing and don't need this document.
- **Insertable Streams** (`RTCRtpScriptTransform` / `createEncodedStreams()`) lets you hook into the encode/decode pipeline of a WebRTC call to do end-to-end encryption or apply per-frame transforms (background blur, watermarking) *before* frames hit the network. This is the piece that made E2E-encrypted group video calls possible without every participant running native code.
- The trend worth watching: WebRTC and WebCodecs increasingly overlap. Insertable Streams hands you raw `VideoFrame`/`EncodedVideoChunk` objects — the exact same types WebCodecs uses. The two specs were designed to interlock, which means skills transfer between "real-time call" and "local video processing" work in a way they didn't five years ago.

---

## 6. The Low-Level Escape Hatch: WebCodecs

If MediaRecorder is "give me a finished video, I don't care how," WebCodecs is "give me direct access to the hardware encoder, I'll handle the rest myself." Five classes: `VideoEncoder`, `VideoDecoder`, `AudioEncoder`, `AudioDecoder`, `ImageDecoder`. No container format, no muxing — WebCodecs deliberately stops at raw encoded chunks and leaves packaging them into an MP4 or WebM to you (or a small WASM muxing library).

This is the API that made client-side video editing a real product category instead of a tech demo. Trim, crop, re-encode, apply filters — all on your GPU, nothing uploaded.

**Browser support, August 2026:** this is now solidly mainstream. Chrome, Edge, and Opera since 2021 (v94). Firefox desktop shipped in 2024 and has been stabilizing since; mobile Firefox is still catching up. Safari shipped full support (audio and video) as of Safari 26 in 2026 — before that, Safari 16.4 through 18.7 only supported the video half of the API, which tripped up a lot of people who tested video encoding, called it done, and shipped an app whose audio pipeline quietly didn't work on iPhones.

**Codec reality check** — support for the *API* doesn't mean support for a given *codec*:

| Codec | Decode | Encode | Notes |
|---|---|---|---|
| H.264 (AVC) | Universal | Universal | Still the safe default |
| VP9 | Universal | Broad | Google's workhorse |
| AV1 | Broad | Limited | Hardware encoders are still rolling out; software fallback is slow |
| HEVC (H.265) | Apple platforms, growing elsewhere | Gaps outside Apple | Licensing baggage keeps some vendors cautious |
| Opus | Universal | Recommended default for audio | Low-latency, open |
| AAC | Universal | Broad | |
| MP3 / FLAC | Universal | **No encoder support** — decode only | Need MP3/FLAC output? Bring your own WASM encoder |

Codec strings are fussy on purpose — `"avc1.4d0034"`, not `"h264"` — because the API wants you to specify the exact profile and level, not vibes.

```js
const encoder = new VideoEncoder({
  output: (chunk, meta) => muxer.addVideoChunk(chunk, meta),
  error: (e) => console.error(e),
});
encoder.configure({ codec: "avc1.4d0034", width: 1280, height: 720, bitrate: 2_000_000 });
```

WebCodecs handles encode/decode. It does *not* give you a timeline, transitions, compositing, or audio mixing — that's your job, typically built on top with WebGPU or Canvas for the visual side and Web Audio for the audio side.

---

## 7. Detecting Things In Pictures: Shape Detection API

Three detectors, one interface pattern, wildly different fates:

- **`BarcodeDetector`** — the success story. Detects linear and 2D barcodes (QR codes included) directly from an image, video frame, or canvas, using the OS's native decoder. Shipped in Chrome and Edge. This is the one worth actually using — QR check-in flows, product scanning, no third-party JS library needed.
- **`FaceDetector`** — Chrome-only, and even there it's had a rough few years: broke entirely on iOS Safari after the iOS 18 update (still unresolved as of this writing) and was never picked up by Firefox. Treat it as an enhancement, not a dependency — feature-detect and fall back to a library (MediaPipe, face-api.js) if you need cross-browser face detection.
- **`TextDetector`** — quietly removed from the standardization track. OCR turned out to be too inconsistent across platforms and character sets to specify sanely, so it was split off into a separate, informative (non-normative) document. If you need OCR in the browser today, you're using Tesseract.js or a server call, not this.

```js
if ("BarcodeDetector" in window) {
  const detector = new BarcodeDetector({ formats: ["qr_code"] });
  const codes = await detector.detect(videoFrame);
}
```

Feature-detect everything in this family. Assume Chrome/Edge only, and be pleasantly surprised on the rare occasion something else supports it.

---

## 8. Session & Capability APIs

### Media Session API

Lets your page describe *what* is playing (title, artist, artwork) and *how to control it* (play, pause, seek, skip) to the OS. This is why a website playing audio can show up on your phone's lock screen with proper metadata and hardware-key support, instead of a generic "tab is playing sound" notice.

```js
navigator.mediaSession.metadata = new MediaMetadata({
  title: "Episode 42",
  artist: "Some Podcast",
  artwork: [{ src: "cover.jpg", sizes: "512x512", type: "image/jpeg" }],
});
navigator.mediaSession.setActionHandler("play", () => audioEl.play());
navigator.mediaSession.setActionHandler("pause", () => audioEl.pause());
```

Mature, widely supported, criminally underused. Any web-based podcast or music player that doesn't set this up is leaving a native-app-quality feature on the table for a few lines of code.

### Media Capabilities API

Answers "can this device play this specific codec/resolution/framerate combination *efficiently*" before you commit to it — as opposed to just trying and finding out via a stutter. `navigator.mediaCapabilities.decodingInfo()` returns whether playback will be smooth, power-efficient, and supported, based on real hardware capability, not just "does the browser recognize this mime type."

Use case: adaptive streaming players picking an initial quality tier without the usual few seconds of guesswork and rebuffering.

### Audio Session API — new, and still finding its feet

`navigator.audioSession.type` lets a page declare the *nature* of its audio — `"playback"`, `"transient"` (a notification ding), `"play-and-record"` (a video call), `"ambient"` — so the OS can make sensible decisions about ducking, routing (earpiece vs. speaker on mobile), and interrupting other apps' audio.

Marked explicitly as **not Baseline** — experimental, limited availability — as of mid-2026. Worth knowing about, not worth depending on yet. This is the API you reach for on the day it graduates, not before.

### Picture-in-Picture

Two flavors now, and they solve different problems:

- **Video PiP** (`video.requestPictureInPicture()`) — the classic floating video window, mature and universal.
- **Document Picture-in-Picture** (`documentPictureInPicture.requestWindow()`) — a whole floating *window* with arbitrary DOM content, not just a video element. This is what lets a video-call app keep a floating window with video *plus* custom controls (mute button, participant list) rather than just a bare `<video>` tag. Chrome/Edge shipped it; Safari and Firefox haven't yet, so treat it as progressive enhancement.

---

## 9. Voice In, Voice Out: Web Speech API

`SpeechRecognition` (speech-to-text) and `SpeechSynthesis` (text-to-speech), bundled under one banner despite having almost nothing to do with each other implementation-wise.

`SpeechSynthesis` is old, boring, and fine — every major browser has shipped it for years, voice quality depends entirely on the OS's installed voices, and it's a perfectly reasonable choice for accessibility features and read-aloud tools.

`SpeechRecognition` is the messier one. Chrome's implementation has historically shipped speech data to Google's servers for processing — worth knowing if privacy is a concern for your use case. On-device recognition is the direction things are heading (mirroring the broader on-device-AI push across the platform), but as of 2026 it's inconsistent across vendors and not something to architect around yet. Safari's implementation exists but has narrower language support. Firefox's support remains the weak link.

```js
const recognition = new SpeechRecognition();
recognition.lang = "en-US";
recognition.onresult = (e) => console.log(e.results[0][0].transcript);
recognition.start();
```

Feature-detect (`window.SpeechRecognition || window.webkitSpeechRecognition`), and don't build anything mission-critical that assumes a specific vendor's recognition quality or latency — you're at the mercy of whatever's running behind the API on each device.

---

## 10. The Deprecated Graveyard

Short section, because a good graveyard tour doesn't linger.

- **`ScriptProcessorNode`** — the original way to run custom audio processing JS in the main thread. Deprecated in favor of `AudioWorkletNode`, which runs off-thread and doesn't glitch your audio every time the main thread does something rude.² Still works everywhere for backward compatibility. Don't write new code against it.
- **Prefixed `getUserMedia`** (`navigator.webkitGetUserMedia`, `navigator.mozGetUserMedia`) — the pre-Promise, callback-based, vendor-prefixed originals. Dead. If you see this in a codebase, it's either legacy cruft from 2015 or a very confused polyfill.
- **`TextDetector`** — not deprecated exactly, but pulled off the standards track before it ever shipped broadly. Functionally dead on arrival; see section 7.
- **Old `MediaStream` "Recording API" drafts** — before `MediaRecorder` stabilized, there were competing early proposals with different event models. If you find code referencing them, it predates the current spec by close to a decade.

---

## 11. Vendor Süppchen — the Chrome-only tasting menu

Cooking your own soup, in German engineering parlance, means going off and doing your own thing regardless of what everyone else agreed on. A fair amount of the media platform in 2026 is still exactly that — Google shipping something in Chrome, writing a WICG explainer, and hoping the rest of the pack follows eventually. Currently simmering:

- **Element Capture / Region Capture / Captured Surface Control** — all Chrome/Edge, all Google-funded standardization efforts, none yet in Safari or Firefox.
- **`FaceDetector`** — Chrome-only, arguably going nowhere given the lack of other-vendor interest.
- **Audio Session API** — technically a W3C spec with a real working group, but currently a one-implementation reality.

None of this is a criticism of Chrome shipping ahead of spec — that's how a lot of good platform features get proven out before anyone commits to them permanently. It's a reminder that "it's in the spec" and "it works for your users" are different claims, and the gap between them is exactly the browser-support table you should be checking before you architect around any API in this section.

---

## 12. Where This Is Going

- **WebGPU × video interop.** `importExternalTexture()` lets you hand a `VideoFrame` straight to a WebGPU shader without a CPU round-trip — real-time video effects at native-app speed, in the browser. This is the piece that turns "WebCodecs decodes the frame" into "and now you can apply a GPU shader to every frame in real time," which is the actual foundation under the current wave of browser-based video editors.
- **HDR, finally reaching the whole pipeline.** HDR video playback has existed for a while; what's new is HDR support creeping into `<canvas>` and WebGPU rendering targets, so effects and overlays applied to HDR content don't get silently tone-mapped down to SDR and look wrong. Still early, still patchy across vendors.
- **On-device AI meeting the media stack.** Background blur, noise suppression, live captioning, real-time translation — increasingly these run as on-device ML models feeding into or reading from WebCodecs/WebRTC pipelines, rather than round-tripping to a server. Expect the boundary between "media API" and "on-device AI API" to keep dissolving.
- **WebTransport as the streaming-protocol contender.** Lower latency than WebSocket, better suited to media delivery than classic HTTP-based streaming for some real-time use cases. Not a media API itself, but increasingly the transport layer under low-latency media applications.

The overall direction is consistent: less "browser plays media," more "browser is a full production environment for media," with the heavy lifting — encode, decode, GPU compositing, on-device inference — happening locally instead of on someone else's server. Which is good news for privacy and bad news for anyone whose business model was "upload your video to us so we can process it."

---

¹ Web Workers/Worklets, IndexedDB, File System APIs, Broadcast Channel, Privacy Sandbox, Observer trio — see the earlier installments in this series.

² Yes, this is the same AudioWorklet from the Workers/Worklets document. Media APIs don't respect document boundaries any more than they respect your rendering budget.
