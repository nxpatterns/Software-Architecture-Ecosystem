# Use Case 04: In-Browser Media Capture and Recording Pipelines

"Just open camera and record" is one of those sentences that sounds cheap.
Like "just migrate to microservices" or "just upgrade Kubernetes on Friday afternoon."

This use case covers media capture directly in the browser:
camera, microphone, recording, preview, lightweight processing, and upload handoff.
All without native app packaging.

## Why this is a proper "hard topic"

Because media capture is where browser APIs meet real-world hardware, permissions, and user panic.

Laptop webcams, mobile sensors, Bluetooth headsets, enterprise privacy settings, battery constraints, format compatibility, and tab lifecycle behavior all enter the room.
Usually at the same time.

## User Story (Abstracted)

A user can:

- grant camera/microphone access,
- preview live input,
- record audio/video,
- stop and review the result,
- upload or retry,
- and recover from common failure states without restarting the whole app.

Could be customer support evidence, insurance claims, field inspections, onboarding KYC, telehealth intake, training clips.
Same architecture.
Different legal department mood.

## Core Browser Technologies

- `MediaDevices.getUserMedia`: request audio/video streams.
- `MediaDevices.enumerateDevices`: list available input devices.
- `MediaStreamTrack` controls: mute, stop, constraints updates.
- `MediaRecorder`: browser-native recording pipeline.
- `HTMLMediaElement` (`video`, `audio`): live preview and playback.
- `URL.createObjectURL` / `Blob`: temporary local recording handles.
- `Permissions API` (limited reliability): preflight hints, not guarantees.
- `Canvas API` (optional): frame snapshots and lightweight overlays.
- `Web Audio API` (optional): level metering, noise indicators, pre-check UX.
- `AbortController`: cancel pending uploads after capture.

## Browser Reality Check

### Desktop

- Chromium: strongest general path for capture + recording workflows.
- Firefox: usually solid for core capture; recording behavior can differ in codec details.
- Safari (macOS): usable but stricter assumptions required for constraints and lifecycle edges.

### Mobile

- Android Chromium: often workable for mainstream capture flows.
- iOS Safari / WebKit: the reality checkpoint.
  - Permission and gesture coupling can be stricter.
  - Backgrounding can interrupt active capture or playback assumptions.
  - Codec/container outcomes may not match desktop expectations.

Short version:
If it works on desktop, you have a prototype.
If it works on iOS real devices, you might have a product.

## What Usually Breaks First

- Assuming permission prompts behave identically across browsers.
- Assuming selected devices remain stable during the session.
- Recording long clips without memory and upload strategy.
- Ignoring codec/container mismatch for downstream processing.
- Forgetting to stop tracks, leaving camera LED on and user trust off.
- Not handling tab visibility changes during recording.

Users forgive one prompt.
They do not forgive "camera still active" paranoia.

## Minimal Technical Blueprint

1. Preflight checks:
   - HTTPS secure context,
   - feature detection,
   - capability flags for capture and recording.
2. Request minimal permissions first:
   - start with required tracks only,
   - escalate constraints later when needed.
3. Show live preview and device status indicators.
4. Start recording with bounded session rules:
   - max duration,
   - size guardrails,
   - visible timer.
5. Handle chunk events incrementally where supported.
6. Stop recording cleanly:
   - stop recorder,
   - stop media tracks,
   - finalize blob,
   - release streams.
7. Provide immediate review UI:
   - play back,
   - discard,
   - retry,
   - upload.
8. Upload with resilient strategy:
   - direct for small clips,
   - chunked/resumable for larger clips.

## Compatibility Strategy (Pragmatic)

- Baseline mode (all modern browsers):
  - capture permissions,
  - live preview,
  - simple record/stop,
  - upload final blob.
- Enhanced mode (supporting browsers):
  - richer constraints handling,
  - chunk-aware upload,
  - audio-level diagnostics,
  - advanced device switching UX.

Treat enhanced features as acceleration, not entitlement.

## Security and Compliance Notes

- Capture must run in secure contexts (`https`).
- Be explicit about what is recorded and when.
- Never keep streams alive longer than necessary.
- Minimize local retention of raw recordings.
- Apply server-side validation and malware scanning on upload.
- Consider regional/legal requirements for audio consent and biometric data.

The legal risk is rarely in the API call.
It is in the assumptions around it.

## Test Matrix You Actually Need

- Chrome, Firefox, Safari desktop with multiple webcams/mics.
- iOS Safari on physical devices across at least two major versions.
- Android Chrome on mid-range hardware.
- Permission deny/revoke/retry scenarios.
- Device unplug/replug during session.
- Long recording with low battery and network interruption.
- Background/foreground tab transitions mid-capture.
- Accessibility checks for keyboard flows and screen-reader prompts.

If your test plan says "works on my MacBook," that is not a test plan.
That is autobiography.

## Decision Summary

Use this pattern when:

- media evidence increases workflow quality,
- native app distribution is too heavy,
- browser-only rollout speed matters.

Avoid or limit this pattern when:

- strict device control is mandatory,
- offline long-form capture is central and must be bulletproof,
- regulatory requirements exceed what browser UX can safely communicate.

Because yes, browser media APIs are powerful.
But power without guardrails is just a faster path to support tickets.
