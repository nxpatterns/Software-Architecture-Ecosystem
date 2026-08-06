# Use Case 07: Device-Sensor-Driven Interactions

Most teams see a phone tilt demo and assume it is a CSS transform plus three
lines of JavaScript. That is true right up to the point where the browser asks
for consent, the device has no useful sensor, or the “AR-like” effect starts
looking like a drunk compass.

This use case is about using physical motion as input: tilt-controlled UI,
parallax, steering, aim controls, or a lightweight spatial effect. No native
app. No camera stack. Just browser sensor events, calibration, and a very
visible permission branch.

## Why this is a good next "hard topic"

Because it looks like a toy feature until it becomes the primary control
scheme. Then the distinction between “the event exists” and “the user sees
anything move” becomes the whole project.

## User Story (Abstracted)

A user can:

- open an interaction that reacts to how they hold a device,
- choose to enable motion input,
- grant access when the browser asks,
- tilt, rotate, or move the device to control a visual element,
- re-center the control when their resting position is inconvenient,
- and continue with touch or pointer controls when sensors are unavailable.

We do not care which interaction. Could be a product viewer, a dashboard
parallax, a museum guide, a game control, or an AR-adjacent visual layer.
Same input problem. Different amount of unnecessary drama.

## Core Browser Technologies

- `DeviceOrientationEvent`: delivers orientation angles for tilt and rotation.
- `DeviceMotionEvent`: delivers acceleration and rotation-rate changes for
  shake, impulse, and movement-driven effects.
- `DeviceOrientationEvent.requestPermission()` / `DeviceMotionEvent.requestPermission()`: the non-portable, user-triggered consent path needed where the browser gates sensor data.
- `Permissions API` / `Permissions-Policy`: inspect permission state where an engine exposes it, and explicitly control whether embedded documents may use sensor-related capabilities.
- `HTTPS` / secure context: required for these sensor APIs in supporting browsers ([MDN: DeviceOrientationEvent](https://developer.mozilla.org/en-US/docs/Web/API/DeviceOrientationEvent)).
- `requestAnimationFrame()`: apply the latest sampled sensor state once per
  frame instead of turning every sensor callback into a layout event.
- CSS `transform` / `perspective`: render parallax, tilt, and pseudo-3D
  feedback on the compositor where possible.
- Pointer Events / touch events: the unglamorous baseline control path.
- `ScreenOrientation` API (optional): account for screen rotation when mapping
  sensor axes to visual axes.

## Browser Reality Check

### Desktop

- Chromium (Chrome, Edge, Arc): the orientation and motion events are exposed
  in secure contexts, but a desktop without usable physical sensors is not a
  meaningful sensor test ([MDN: DeviceOrientationEvent](https://developer.mozilla.org/en-US/docs/Web/API/DeviceOrientationEvent)).
- Firefox: treat the event model as available, then calibrate on the actual
  device; MDN explicitly warns that Firefox and Chrome do not handle motion
  coordinates the same way ([MDN: DeviceMotionEvent](https://developer.mozilla.org/en-US/docs/Web/API/DeviceMotionEvent)).
- Safari (macOS): implement the same fallback-first UI. A Mac can demonstrate the page, but not prove a phone’s orientation flow, prompt, and axes.

### Mobile

- Android Chromium: `deviceorientation` and `devicemotion` are usable in secure contexts, and current Chrome for Android has no web-exposed `DeviceOrientationEvent.requestPermission()` permission gate; feature-detect the method instead of calling it unconditionally
  ([MDN](https://developer.mozilla.org/en-US/docs/Web/API/DeviceOrientationEvent),
  [caniuse](https://caniuse.com/mdn-api_deviceorientationevent_requestpermission_static)).
- iOS Safari / WebKit-based browsers: this is the real branch. iOS Safari implements `DeviceOrientationEvent.requestPermission()`, while desktop Safari and Chromium do not expose that method in the compatibility data
  ([caniuse](https://caniuse.com/mdn-api_deviceorientationevent_requestpermission_static)).
  - Call `DeviceOrientationEvent.requestPermission()` — and
    `DeviceMotionEvent.requestPermission()` if motion is needed — directly
    from a user gesture such as an Enable Motion button. The methods require
    transient user activation; calling them on page load is a denial-shaped
    waste of everybody’s time
    ([MDN: orientation permission](https://developer.mozilla.org/en-US/docs/Web/API/DeviceOrientationEvent/requestPermission_static),
    [MDN: motion permission](https://developer.mozilla.org/en-US/docs/Web/API/DeviceMotionEvent/requestPermission_static)).
  - Do not use user-agent detection to find iOS. Check whether the static
    permission method exists, request it inside the click handler, then attach
    listeners only after the result is `"granted"`.
  - An embedded experience may also be constrained by a
    `Permissions-Policy`; an iframe needs deliberate policy design, not a
    hopeful `addEventListener()`
    ([MDN: Permissions-Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Permissions-Policy)).

Short version: Android lets you start. iOS makes the user say so first.

## What Usually Breaks First

- Attaching a listener on page load, seeing no iOS events, and blaming the
  sensor instead of the missing permission request.
- Calling `requestPermission()` after an `await`, animation, or modal
  transition has consumed the user activation.
- Using raw `beta`/`gamma` values as universal left/right controls without
  screen-orientation adjustment or a re-center control.
- Applying every event directly to DOM styles and manufacturing jitter,
  battery use, and a motion-sickness machine.
- Testing only in desktop DevTools, where simulated values conveniently skip
  the real permission and hardware path.
- Treating sensor input as mandatory when touch, mouse, keyboard, or reduced
  motion would be better for part of the audience.

The browser gives you numbers. It does not give you a control system.

## Minimal Technical Blueprint

1. Serve the interaction over HTTPS and make touch/pointer controls fully
   usable before adding sensor input.
2. Feature-detect `DeviceOrientationEvent` and `DeviceMotionEvent`; show an
   Enable Motion affordance only when sensor input is plausible.
3. In that button's direct click handler, check for
   `DeviceOrientationEvent.requestPermission` and
   `DeviceMotionEvent.requestPermission`.
4. If either method exists, request the needed permissions there; treat
   `"denied"` and errors as a normal fallback outcome, not as an exception
   screen.
5. After access is available, register the smallest useful set of event
   listeners and retain only the latest normalized reading.
6. Establish a neutral reference pose from the first stable reading or an
   explicit Re-center action.
7. Map normalized values through a dead zone, clamp, and low-pass filter
   before turning them into a UI target.
8. In `requestAnimationFrame()`, interpolate the rendered CSS transform
   toward that target rather than repainting on every sensor event.
9. Pause listeners when the page is hidden and provide a visible switch back
   to pointer controls.

## Compatibility Strategy (Pragmatic)

- Baseline mode (all modern browsers): pointer/touch controls, an optional
  decorative parallax that never blocks completion, and no dependency on
  sensor availability.
- Enhanced mode (sensor-capable browsers): calibrated tilt or motion control,
  explicit Enable Motion consent where the feature-detected API requires it,
  and a re-center control.

Do not make “Grant Motion Access” the only door into a basic task.

## Security and Compliance Notes

- Explain what motion input changes before asking. “Enable tilt control” is a
  useful consent request; “Allow” with no context is not.
- Keep raw sensor samples in memory unless there is a real product reason to
  retain them. Long-running motion data can reveal behavioural characteristics
  such as gait ([W3C security and privacy assessment](https://github.com/w3c/deviceorientation/blob/main/security-privacy-self-assessment.md)).
- Do not silently reframe a decorative effect into behavioural analytics after
  consent. That is how a nice parallax becomes a compliance meeting.
- Respect `prefers-reduced-motion` for rendered movement even when sensor
  input remains available.

## Test Matrix You Actually Need

- Chrome on a real Android phone: enable the interaction and verify it starts
  without a `requestPermission()` branch.
- iOS Safari on a real iPhone and iPad: tap Enable Motion, accept, deny, and
  retry from a fresh page load.
- iOS Safari: verify that a page-load permission call fails the design while
  the same call in the button handler works.
- Safari and Chrome with the page loaded inside the intended iframe/embed configuration and its actual `Permissions-Policy`.
- Firefox and Chrome on the same sensor-equipped device or hardware setup: compare the normalized control outcome, not just raw angles.
- Portrait and landscape orientation, including rotation after the experience has already started.
- A noisy, low-end Android device and a deliberate re-center test.
- Keyboard, pointer, and reduced-motion paths with sensor access declined.

If the only successful run happened in DevTools, you have tested a drawing,
not a sensor feature.

## Decision Summary

Use this pattern when:

- physical movement makes an interaction clearer, faster, or genuinely more
  engaging,
- sensor input can remain optional,
- the team can test actual Android and iOS hardware.

Avoid this pattern when:

- the primary task must work identically on laptops, kiosks, and phones,
- the value is a decorative gimmick that a CSS animation can deliver,
- consent rejection would leave the user unable to finish.

Because yes, the phone can steer the interface. It can also politely refuse.

## Next Logical Topic

After this, the best follow-up is:
**Camera-assisted browser experiences with WebRTC and media permissions**
(live preview, device selection, permission timing, and why “just open the camera” is a sentence written by someone else).
