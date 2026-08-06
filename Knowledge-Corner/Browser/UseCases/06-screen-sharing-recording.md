# Use Case 06: Screen Sharing and Screen Recording

Most teams build screen sharing as if the browser is a polite OS API with a small permission dialog. It isn't. The browser owns the picker, the user chooses the surface, the audio story changes by browser, and phones mostly decline to participate at all.

This covers sharing or recording the user's own display, window, or tab from a web app. A serious desktop feature wearing a deceptively small button.

## Why "Share Your Screen" Is Never One Call

It sounds like one call until product requirements mention tab audio, recording, surface switching, sensitive windows, and mobile. Then the browser reminds everyone it's protecting a display, not fulfilling a mockup.

## The User Story, Stripped of Domain

- click a visible control to start sharing,
- choose a screen, window, or tab in the browser-owned picker,
- see exactly what's being captured,
- share live or record locally,
- stop from the app or from the browser's own controls,
- recover cleanly when the user cancels or the shared surface vanishes mid-session.

Support operator, meeting participant, reviewer, trainer, or the same user recording their own walkthrough — same capture boundary either way.

## Core Browser Technologies

| API | Job | Reference |
|---|---|---|
| [`getDisplayMedia()`](https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getDisplayMedia) | Browser-mediated display-surface selection, returned as `MediaStream` | MDN |
| Screen Capture API | Defines the selection model, constraints, surface metadata | — |
| `MediaStream` / `MediaStreamTrack` | Preview, observe `ended`, release deterministically | — |
| `MediaRecorder` | Records the display stream to a `Blob` | — |
| WebRTC (optional) | Sends the stream to another participant live | — |

## The Browser Reality Check

Desktop Chromium, Firefox, and Safari all support `getDisplayMedia()`.<sup>[1]</sup> None of them guarantee what the picker offers or whether audio comes with it — screen audio is not a cross-browser entitlement, it's a per-browser decision you test, not assume. If you add recording on Safari, remember WebKit documents its `MediaRecorder` output as MP4/H.264/AAC — same constraint as Use Case 05, same fix.<sup>[2]</sup>

**Mobile gets none of this.** `getDisplayMedia()` is not supported in Chrome for Android or iOS Safari.<sup>[1]</sup> That's not a gap to work around with a clever polyfill — it doesn't exist at the platform level. Build the fallback before launch, not as a hotfix after the first support ticket from a phone user.

Desktop gets screen sharing. Mobile gets the fallback you planned before pretending a phone was a laptop.

## What Breaks First

- Calling `getDisplayMedia()` on page load or after an async detour instead of directly inside a user gesture — it requires transient user activation, no exceptions.<sup>[3]</sup>
- Assuming constraints can quietly restrict the picker to "current tab only." The picker is the user's decision; your constraints are a request, not a command.<sup>[3]</sup>
- Treating display-capture permission like camera permission and expecting it to persist. It doesn't — the user is prompted every single time.<sup>[3]</sup>
- Promising "share with sound" without testing which audio sources the browser actually offers — this varies by browser, not by your intentions.<sup>[3]</sup>
- Assuming screen share works on mobile because camera capture does. It doesn't, full stop, on either major mobile platform.
- Treating the `ended` event as an edge case, then leaving a "sharing" indicator alive after the user stops from browser chrome instead of your UI.
- Letting the local preview play back captured audio and building an instant feedback loop into the one feature meant to help people communicate.

## Minimal Technical Blueprint

```javascript
shareButton.addEventListener('click', async () => {
  if (!navigator.mediaDevices?.getDisplayMedia) return showFallback();

  try {
    const stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
    const [track] = stream.getVideoTracks();
    track.addEventListener('ended', () => stopEverything()); // browser can end this, not just your UI
    attachPreview(stream);
  } catch {
    // user cancelled the picker — this is a normal outcome, not an error state
  }
});
```

1. Put "Share screen" behind a direct click handler in a secure top-level context. Feature-detect before enabling it.
2. If absent, show the real fallback: native recording upload, join without sharing, desktop-only messaging. Never show a physically impossible button on a phone.
3. Request only the audio/video your experience can use — the browser decides what the user is offered, not your constraints object.
4. Attach the stream to a muted preview, inspect the track's settings for honest UI copy, register `ended` before the stream reaches the rest of the app.
5. For live sessions, add the track to the WebRTC peer connection. For recording, probe MIME candidates and instantiate `MediaRecorder`.
6. Keep all capture state — surface, audio presence, recorder state, timer, preview URL, cleanup callbacks — in one controller. The browser can end this stream from outside your code at any time.
7. On stop, `ended`, or failure: stop every track, stop the recorder once, finalize or discard the blob, detach the preview.
8. Upload with the recorder's actual MIME type, validate server-side, transcode after upload if a normalized format is required.

## Compatibility Strategy

**Baseline (desktop):** user-selected capture, muted preview, live share or probed recording, explicit stop plus `ended` handling.

**Enhanced:** surface-switch hints, audio controls only when a track is actually returned.

**Fallback (iOS Safari, Chrome Android, unsupported desktop):** device-made recording upload, remote-support instructions without browser capture, or a stated desktop prerequisite.<sup>[1]</sup>

Progressive enhancement, not a referendum on whether phones should have desktop operating systems.

## Security and Compliance

HTTPS-only, transient-activation-gated, non-persistent permission by design.<sup>[3]</sup> Never imply the app controls the picker — the user seeing and choosing the surface *is* the safety property, not an inconvenient implementation detail.

Every captured frame is potentially sensitive: email, chats, credentials, notifications all love appearing mid-demo. Clear preview, labeled surface, visible stop control. Use a restrictive `Permissions-Policy` for `display-capture` if embedded documents should never initiate sharing on their own. Apply retention and access rules to recordings as seriously as to uploaded documents.

Screen capture without a clear consent and retention story is a privacy incident with unusually good visual evidence.

## Test Matrix You Actually Need

- Desktop Chrome/Edge: tab, window, full display; cancel the picker; stop from browser chrome; verify every cleanup path.
- Firefox: same selection and cancellation paths, audio and no-audio.
- Safari macOS: share, record, confirm the MP4/H.264/AAC output reaches and plays from the backend.
- Android and iOS real devices: confirm the deliberate unsupported fallback fires, not a failed promise dangling in the console.
- A shared window that closes mid-session, a shared tab that navigates, a laptop that sleeps during capture.

If mobile gets tested only after the feature was sold as universal, the fallback isn't engineering — it's an apology with CSS.

## Decision Summary

Use this when the workflow is explicitly desktop-first and users need to show their own screen with browser-mediated consent, and you can give unsupported mobile browsers something useful instead of a dead button.

Skip it when mobile screen sharing is a hard requirement, when the product needs to silently choose a capture source, or when persisted screen permission across sessions is assumed anywhere in the design.

Browsers can capture screens. That doesn't make every browser on every device a screen-sharing client.

---

[1]: `getDisplayMedia()` desktop/mobile support, [caniuse](https://caniuse.com/mdn-api_mediadevices_getdisplaymedia).
[2]: Safari `MediaRecorder` output format, [WebKit Blog](https://webkit.org/blog/11353/mediarecorder-api/).
[3]: `getDisplayMedia()` activation, permission, and constraint semantics, [MDN](https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getDisplayMedia).
