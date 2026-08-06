# Use Case 06: Screen Sharing and Screen Recording

Most teams build screen sharing as though the browser is a polite operating system API with a small permission dialog.
It is not. The browser owns the picker, the user chooses the surface, the audio story changes by browser, and phones
mostly decline to participate.

This use case covers sharing or recording the user's own display, window, or tab from a web app. It is a serious
desktop feature wearing a deceptively small button.

## Why this is a good next "hard topic"

Because “share your screen” sounds like one call until product requirements mention tab audio, recording, switching
surfaces, sensitive windows, and mobile. Then the browser reminds everyone that it is protecting a display, not
fulfilling a design mockup.

## User Story (Abstracted)

A user can:

- click a visible control to start sharing,
- choose a screen, window, or browser tab in the browser-owned picker,
- see what is being captured,
- share the stream live or record it locally,
- stop sharing from the app or the browser controls,
- and recover cleanly when the user cancels or the shared surface disappears.

We do not care who receives the stream. Could be a support operator, meeting participant, reviewer, trainer, or the
same user saving a walkthrough. Same capture boundary.

## Core Browser Technologies

- `MediaDevices.getDisplayMedia()`: asks the browser to let the user select a display surface and returns it as a
  `MediaStream`.
- `Screen Capture API`: defines the display-capture model, user selection, constraints, and display-surface
  metadata.
- `MediaStream` / `MediaStreamTrack`: preview the selected surface, observe when capture ends, and release tracks
  deterministically.
- `MediaRecorder`: records the display stream into timed chunks and a final `Blob`.
- `MediaRecorder.isTypeSupported()` / `mimeType`: chooses a supported output format instead of assuming screen
  recordings are universally WebM.
- `WebRTC` (optional): sends the selected stream to another participant instead of, or in addition to, local
  recording.

## Browser Reality Check

### Desktop

- Chromium (Chrome, Edge, Arc): supports `getDisplayMedia()` on desktop. The browser still owns what the picker
  offers and whether audio is included; screen audio is not a cross-browser entitlement
  ([caniuse](https://caniuse.com/mdn-api_mediadevices_getdisplaymedia),
  [MDN](https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getDisplayMedia)).
- Firefox: supports `getDisplayMedia()` on desktop, but test the exact surfaces, cancellation, and audio behavior
  you plan to ship rather than promoting a Chromium screenshot as a web standard
  ([caniuse](https://caniuse.com/mdn-api_mediadevices_getdisplaymedia),
  [MDN](https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getDisplayMedia)).
- Safari (macOS): supports `getDisplayMedia()` on desktop. If recording is added, remember that WebKit documents
  Safari `MediaRecorder` output as MP4 with H.264/AAC, so a WebM-only recording backend is still a Safari bug in
  your architecture ([caniuse](https://caniuse.com/mdn-api_mediadevices_getdisplaymedia),
  [WebKit](https://webkit.org/blog/11353/mediarecorder-api/)).

### Mobile

- Android Chromium: `getDisplayMedia()` is not supported in Chrome for Android, so a browser screen-share button
  needs an explicit mobile fallback rather than an optimistic spinner
  ([caniuse](https://caniuse.com/mdn-api_mediadevices_getdisplaymedia)).
- iOS Safari / WebKit-based browsers: `getDisplayMedia()` is not supported in iOS Safari. Installing another iOS
  browser does not turn this web-platform gap into a feature
  ([caniuse](https://caniuse.com/mdn-api_mediadevices_getdisplaymedia)).

Short version: desktop gets screen sharing. Mobile gets the fallback you planned before pretending the phone was a
laptop.

## What Usually Breaks First

- Calling `getDisplayMedia()` on page load or after an async detour instead of directly from a user gesture.
  Transient user activation is required
  ([MDN](https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getDisplayMedia)).
- Assuming constraints can secretly force “current tab only” or stop the user from seeing other shareable surfaces.
  The picker remains the user's decision
  ([MDN](https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getDisplayMedia)).
- Treating screen-capture permission like camera permission and expecting it to persist. Display-capture permission
  cannot be reused; the user must be prompted for each request
  ([MDN](https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getDisplayMedia)).
- Promising “share with sound” without testing which audio sources the browser offers. Audio tracks and supported
  audio sources vary by browser
  ([MDN](https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getDisplayMedia)).
- Assuming the browser screen-share flow works on mobile because camera capture works there. It does not on iOS
  Safari or Chrome for Android ([caniuse](https://caniuse.com/mdn-api_mediadevices_getdisplaymedia)).
- Treating the `ended` event as an edge case, then leaving call state and a red “sharing” indicator alive after the
  user stops from browser chrome.
- Letting a local preview play captured audio and creating an instant feedback loop in the one feature meant to help
  people communicate.

## Minimal Technical Blueprint

1. Put “Share screen” behind a visible, direct click handler in a secure top-level context. Feature-detect
   `navigator.mediaDevices.getDisplayMedia` before enabling the control.
2. If the method is absent, show the real fallback: upload a native recording, join without screen sharing, or
   continue from desktop. Do not show a technically impossible button on a phone.
3. In the click handler, call `getDisplayMedia()` with `video: true` and only the audio preferences your experience
   can actually use. Treat preferences such as surface and audio hints as requests to the browser, not command
   authority; the user selects the source
   ([MDN](https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getDisplayMedia)).
4. Attach the returned stream to a muted preview and inspect the video track's settings so the UI can describe the
   selected surface honestly. Register `ended` handlers before the stream reaches the rest of the app.
5. For a live session, add the display track to the existing WebRTC peer connection. For recording, probe recorder
   MIME candidates, instantiate `MediaRecorder`, and append `dataavailable` chunks to bounded storage.
6. Keep capture state in one controller: selected surface, audio present, recorder state, timer, local preview URL,
   and every cleanup callback. The browser can end this stream from outside your UI.
7. On app stop, `ended`, or failure, stop every track, stop the recorder once, finalize or discard the blob, detach
   the preview, and make the UI boring again.
8. Upload the recording with the recorder's actual MIME type and validate it server-side. If a normalized playback
   format is required, transcode after upload instead of asking all browsers to become the same browser.

## Compatibility Strategy (Pragmatic)

- Baseline mode (desktop browsers that expose `getDisplayMedia()`): user-selected capture, muted preview, live
  share or a runtime-probed `MediaRecorder` recording, and explicit manual-stop plus `ended` handling.
- Enhanced mode (where browser hints are implemented): suggest the current tab or surface switching, expose audio
  controls only when an audio track is returned, and pair WebRTC share with local recording.
- Fallback mode (iOS Safari, Chrome for Android, and unsupported desktop contexts): upload a device-made recording,
  give remote-control/support instructions without browser capture, or make desktop a stated prerequisite
  ([caniuse](https://caniuse.com/mdn-api_mediadevices_getdisplaymedia)).

This is progressive enhancement, not a referendum on whether phones should have desktop operating systems.

## Security and Compliance Notes

- `getDisplayMedia()` is HTTPS-only and asks the user to choose and grant display capture through the browser's
  picker ([MDN](https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getDisplayMedia)).
- It requires transient user activation, and display-capture permission cannot be persisted for later reuse
  ([MDN](https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getDisplayMedia)).
- Never imply that the app controls the picker. The user must see and choose the capture surface; that boundary is
  the safety property, not an annoying implementation detail
  ([MDN](https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getDisplayMedia)).
- Treat every captured frame as potentially sensitive: email, chats, credentials, customer data, and notifications
  all enjoy appearing during demos. Give users a clear preview, selected-surface label, and stop control.
- Use a restrictive `Permissions-Policy` for `display-capture` if embedded documents should never initiate sharing.
  An iframe should not gain display access by accident.
- Apply retention, access controls, and deletion semantics to recordings as seriously as you would to uploaded
  documents.

Screen capture without a clear consent and retention story is just a privacy incident with unusually good visual
evidence.

## Test Matrix You Actually Need

- Desktop Chrome/Edge: share a tab, window, and full display; cancel the picker; stop from browser chrome; and
  verify every cleanup route.
- Firefox latest: repeat the same selection and cancellation paths, including the no-audio and audio-returned paths.
- Safari macOS latest: share a surface, record it, and verify the resulting MP4/H.264/AAC file reaches the backend
  and plays after upload ([WebKit](https://webkit.org/blog/11353/mediarecorder-api/)).
- Android Chrome on a real device: verify the deliberate unsupported fallback, not a failed promise call
  ([caniuse](https://caniuse.com/mdn-api_mediadevices_getdisplaymedia)).
- iOS Safari on a real device: verify the same deliberate unsupported fallback
  ([caniuse](https://caniuse.com/mdn-api_mediadevices_getdisplaymedia)).
- A user who chooses the wrong surface, changes their mind, and cancels.
- A shared window that closes, a selected tab that navigates, and a laptop that sleeps during capture.
- A sensitive-notification drill: prove the product warns correctly without pretending it can sanitize a user's
  whole desktop.

If mobile gets tested only after the feature was sold as universal, the fallback is no longer engineering. It is an
apology with CSS.

## Decision Summary

Use this pattern when:

- the workflow is explicitly desktop-first,
- users need to show their own screen, tab, or window with browser-mediated consent,
- you can give unsupported mobile browsers a useful non-capture path.

Avoid this pattern when:

- mobile browser screen sharing is a core requirement,
- the product must silently choose a capture source or retain screen permission across sessions,
- you cannot accept that users may expose sensitive material from their own selected display surface.

Because yes, browsers can capture screens. No, that does not make every browser on every device a screen-sharing
client.

## Next Logical Topic

After this, the best follow-up is:
**Real-time browser collaboration with WebRTC**
(track replacement, signaling, audio-device management, and why “just add a peer connection” is the next delightful
understatement).
