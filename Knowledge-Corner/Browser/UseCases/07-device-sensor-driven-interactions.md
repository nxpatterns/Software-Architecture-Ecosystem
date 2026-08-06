# Use Case 07: Device-Sensor-Driven Interactions

A phone-tilt demo looks like a CSS transform and three lines of JavaScript. That holds right up until the browser demands consent, the device has no usable sensor, or the "AR-like" effect starts looking like a drunk compass.

This is physical motion as input — tilt-controlled UI, parallax, steering, aim, a lightweight spatial effect. No native app, no camera stack. Just sensor events, calibration, and a very visible permission branch that iOS insists on and Android doesn't.

## Why This Looks Like a Toy Until It's the Whole Control Scheme

The gap between "the event exists" and "the user perceives anything moving smoothly" is where this project actually lives.

## The User Story, Stripped of Domain

- open an interaction that reacts to how the device is held,
- opt in to motion input,
- grant access when asked,
- tilt or rotate to control something visual,
- re-center when the resting position is inconvenient,
- fall back to touch or pointer when sensors aren't available or aren't granted.

Product viewer, dashboard parallax, museum guide, game control — same input problem, wildly different amounts of unnecessary drama depending on the platform.

## Core Browser Technologies

| API | Job | Reference |
|---|---|---|
| `DeviceOrientationEvent` | Tilt and rotation angles | MDN |
| `DeviceMotionEvent` | Acceleration and rotation-rate for shake/impulse effects | MDN |
| `DeviceOrientationEvent.requestPermission()` | The iOS-only, user-gesture-gated consent path | MDN |
| Secure context (HTTPS) | Required by every browser that supports these APIs | [MDN](https://developer.mozilla.org/en-US/docs/Web/API/DeviceOrientationEvent) |
| `requestAnimationFrame()` | Apply the latest sample once per frame, not per sensor callback | — |
| CSS `transform`/`perspective` | Compositor-friendly rendering of the result | — |
| Pointer/touch events | The unglamorous, always-works baseline | — |

## The Browser Reality Check

Android Chromium exposes `deviceorientation`/`devicemotion` in secure contexts with no permission gate at all — current Chrome for Android has no web-exposed `requestPermission()` method.<sup>[1]</sup> Feature-detect it; don't call it unconditionally and assume it exists everywhere it doesn't.

iOS Safari is the real branch. It implements `DeviceOrientationEvent.requestPermission()`, and desktop Safari and Chromium simply don't expose that method.<sup>[1]</sup> Call it directly inside a user gesture — an actual "Enable Motion" button click, not something that fires after an `await` or a modal transition has already consumed the activation window.<sup>[2]</sup> Don't sniff the user agent to detect iOS; feature-detect the method's existence instead, request it in the click handler, and only attach listeners once the result comes back `"granted"`.

Firefox and Chrome don't even agree on motion coordinate handling — MDN says so explicitly.<sup>[3]</sup> Calibrate on the actual device. A desktop can render the page but can't prove a phone's prompt flow or its axes.

Android lets you start. iOS makes the user say so first.

## What Breaks First

- Attaching a listener on page load, seeing nothing on iOS, and blaming the sensor instead of the missing permission request.
- Calling `requestPermission()` after an `await`, an animation, or a modal has already burned the user activation.
- Using raw `beta`/`gamma` as universal left-right controls with no screen-orientation adjustment and no re-center action.
- Applying every single event straight to DOM styles, manufacturing jitter, battery drain, and a mild motion-sickness machine.
- Testing only in desktop DevTools, where simulated sensor values conveniently skip the real permission and hardware path entirely.
- Making sensor input mandatory when touch, mouse, or a `prefers-reduced-motion` respecting fallback would serve part of the audience better.

The browser gives you numbers. It does not give you a control system — that part is yours to build.

## Minimal Technical Blueprint

```javascript
enableMotionButton.addEventListener('click', async () => {
  if (typeof DeviceOrientationEvent?.requestPermission === 'function') {
    const result = await DeviceOrientationEvent.requestPermission(); // must run inside this handler
    if (result !== 'granted') return showFallbackControls();
  }
  window.addEventListener('deviceorientation', onOrientation);
});

let target = { x: 0, y: 0 };
function onOrientation(e) {
  target = normalize(e.beta, e.gamma, referencePose); // dead zone + clamp happens here
}
function tick() {
  current = lerp(current, target, 0.15); // smoothing, not raw event-to-pixel
  applyTransform(current);
  requestAnimationFrame(tick);
}
```

1. Serve over HTTPS, make touch/pointer controls fully functional before layering sensors on top.
2. Feature-detect both event constructors; show "Enable Motion" only when sensor input is plausible on this device.
3. Inside that button's direct click handler, check for `requestPermission` on both orientation and motion.
4. Request there if present; treat `"denied"` and errors as a normal fallback outcome, not an exception screen.
5. Register the smallest useful listener set, retain only the latest normalized reading.
6. Establish a neutral reference pose from the first stable reading or an explicit re-center action.
7. Run values through a dead zone, clamp, and low-pass filter before they become a UI target.
8. Interpolate toward that target inside `requestAnimationFrame()` — never repaint directly on the sensor event.
9. Pause listeners when the page is hidden; keep a visible switch back to pointer controls at all times.

## Compatibility Strategy

**Baseline:** pointer/touch controls, an optional decorative parallax that never blocks task completion, zero dependency on sensor availability.

**Enhanced:** calibrated tilt/motion, explicit consent where the platform requires it, a re-center control.

Never make "Grant Motion Access" the only door into a basic task.

## Security and Compliance

Explain what motion input changes *before* asking. "Enable tilt control" is a legitimate consent request; a bare "Allow" with no context is not. Keep raw samples in memory only — long-running motion data can reveal behavioral characteristics like gait, which is a genuinely documented privacy concern, not a hypothetical one.<sup>[4]</sup> Don't silently reframe a decorative effect into behavioral analytics after consent was granted for something else entirely. Respect `prefers-reduced-motion` for rendered movement even when sensor access itself remains available.

## Test Matrix You Actually Need

- Real Android phone: interaction starts with no `requestPermission()` branch involved.
- Real iPhone/iPad: tap Enable Motion, accept, deny, retry from a fresh load.
- iOS: confirm a page-load permission call fails by design while the same call inside the button handler succeeds.
- The actual intended iframe/embed configuration with its real `Permissions-Policy`.
- Portrait and landscape, including rotation mid-session.
- A noisy low-end Android device, deliberately testing re-center.
- Keyboard, pointer, and reduced-motion paths with sensor access declined outright.

A successful run only in DevTools is a tested drawing, not a tested sensor feature.

## Decision Summary

Use this when physical movement genuinely clarifies or speeds up an interaction, when sensor input can stay optional, and when the team can test real Android and iOS hardware — not simulators standing in for judgment.

Skip it when the primary task must behave identically on laptops, kiosks, and phones, when the value is a gimmick a CSS animation could deliver on its own, or when declining consent would leave the user stuck.

The phone can steer the interface. It can also politely refuse, and your fallback needs to be just as polite.

---

[1]: `requestPermission()` platform differences, [caniuse](https://caniuse.com/mdn-api_deviceorientationevent_requestpermission_static).
[2]: User-activation requirement for orientation/motion permission, [MDN – requestPermission](https://developer.mozilla.org/en-US/docs/Web/API/DeviceOrientationEvent/requestPermission_static).
[3]: Firefox/Chrome motion coordinate discrepancies, [MDN – DeviceMotionEvent](https://developer.mozilla.org/en-US/docs/Web/API/DeviceMotionEvent).
[4]: Behavioral inference risk from motion data, [W3C Device Orientation security & privacy self-assessment](https://github.com/w3c/deviceorientation/blob/main/security-privacy-self-assessment.md).
