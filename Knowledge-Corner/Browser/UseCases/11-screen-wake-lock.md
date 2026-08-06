# Use Case 11: Keeping the Screen Awake During a Task

Most teams assume a visible timer, recipe, workout, or checklist is enough to
keep the screen awake. It is not. The operating system sees an idle screen,
not your very important countdown, and does exactly what it was built to do.

This use case is about asking the browser for a real screen wake lock while a
user is actively in a task, then surviving the moment that request is refused,
revoked, or lost with the tab's visibility.

## Why this is a good next "hard topic"

Because `navigator.wakeLock.request('screen')` looks like one line of code.
The production version is a small lifecycle manager with user intent, battery
behavior, visibility changes, release events, and an honest fallback when the
platform says no.

## User Story (Abstracted)

A user can:

- start a task that needs the screen to stay readable without constant taps,
- keep following instructions, watching a timer, or checking a live status,
- switch briefly to another app or tab,
- come back without having accidentally left a permanent lock behind,
- see whether the screen is currently being kept awake,
- and explicitly stop the task and return to normal device behavior.

We do not care which task. Could be a cooking flow, exercise interval, lab
procedure, navigation aid, inspection checklist, or presentation remote. Same
contract: awake while it is useful, normal again when it is not.

## Core Browser Technologies

- `Screen Wake Lock API` (`navigator.wakeLock.request('screen')`): asks the
  operating system to prevent the screen from dimming or locking while the
  document is visible.
- `WakeLockSentinel`: holds the granted lock and emits `release` when the
  browser or system takes it back.
- `Page Visibility API` (`visibilitychange`): stops acquisition while hidden
  and gives the app a reliable moment to request a fresh lock when visible.
- `Permissions Policy` (`screen-wake-lock`): allows or blocks use of the API,
  especially when the application is framed.
- `HTMLMediaElement` / `Web Audio` (last-resort fallback): old silent-video or
  silent-audio tricks can keep a media session active on some platforms, but
  they are media playback, not a wake-lock contract.
- `BroadcastChannel` (optional): keeps task state and awake/not-awake UI
  coherent when the same task is open in more than one tab.

## Browser Reality Check

### Desktop

- Chromium (Chrome, Edge, Arc): the real API is established; Chrome has
  supported it since 85 and Chromium Edge since 90
  ([caniuse](https://caniuse.com/wake-lock)). Treat a rejected request or a
  later `release` event as normal lifecycle, not as a browser failure.
- Firefox: this used to be the missing major engine. Firefox 126 added Screen
  Wake Lock support in May 2024
  ([Firefox release notes](https://developer.mozilla.org/en-US/docs/Mozilla/Firefox/Releases/126)); current Firefox is part of the normal API path, not the fallback path.
- Safari (macOS): Safari has supported Screen Wake Lock from 16.4
  ([caniuse](https://caniuse.com/wake-lock)). Good. Still request only while
  the task is actually visible; a lock is not a license to ignore lifecycle.

### Mobile

- Android Chromium: Chrome for Android supports Screen Wake Lock, so use the
  same feature-detected path as desktop Chromium
  ([caniuse](https://caniuse.com/wake-lock)). Battery saver, low battery, and
  operating-system policy can still deny or revoke a request.
- iOS Safari / WebKit-based browsers: Safari on iOS gained the API in 16.4
  ([caniuse](https://caniuse.com/wake-lock)). Home Screen web apps were a
  separate wrinkle: WebKit says Wake Lock began working there in iOS and
  iPadOS 18.4 ([WebKit](https://webkit.org/blog/16574/webkit-features-in-safari-18-4/)). Test the browser tab and the installed-web-app version separately.
  - A hidden document cannot acquire a lock, and a granted lock may be revoked
    when the document is no longer active
    ([MDN](https://developer.mozilla.org/en-US/docs/Web/API/WakeLock/request)).
  - Switching apps, locking the phone, or opening another tab is therefore
    "pause and reacquire on return," never "continue indefinitely in the
    background."

Short version: the API is finally normal. The document lifecycle is still the
part that gets to say no.

## What Usually Breaks First

- Calling `request()` once at task start and never listening for `release`.
- Treating a wake lock as a background-execution permission. It is not.
- Trying to reacquire while `document.visibilityState === 'hidden'`, which can
  reject with `NotAllowedError` ([MDN](https://developer.mozilla.org/en-US/docs/Web/API/WakeLock/request)).
- Holding the lock after the timer ends because nobody wired the stop button
  to `sentinel.release()`.
- Hiding a looping silent video somewhere in the DOM and calling that
  compatibility. Muted/no-audio media generally avoids autoplay blocking, but
  audible media can require user interaction
  ([MDN autoplay guide](https://developer.mozilla.org/en-US/docs/Web/Media/Guides/Autoplay)).
- Assuming an embedded task can request a lock when the host page's
  `Permissions-Policy` blocks `screen-wake-lock`
  ([MDN](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Permissions-Policy/screen-wake-lock)).

A sleep-prevention hack that works only until the browser updates is not a
feature. It is a future support ticket wearing a `<video>` tag.

## Minimal Technical Blueprint

1. Make "Keep screen awake" part of an explicit task state, with a visible
   toggle and a clear stop/end action.
2. Feature-detect `navigator.wakeLock`; do not infer support from browser
   name, operating system, or somebody's 2021 compatibility spreadsheet.
3. When the task is active **and** the document is visible, call
   `await navigator.wakeLock.request('screen')` inside `try/catch`.
4. Store the returned `WakeLockSentinel`, render an honest "screen kept awake"
   status, and attach its `release` listener.
5. On `release`, clear local state and show the normal task UI; if the task is
   still active and the document is visible, schedule one controlled retry.
6. On `visibilitychange`, release any local reference when hidden; when the
   document returns to `visible`, request a new lock if the task still needs it.
7. Release the sentinel when the task ends, the user toggles it off, or the
   route/component is destroyed.
8. If the API is absent or denied, keep the timer/task functional, offer a
   conspicuous "keep this screen on" instruction, and optionally offer a
   user-started muted-media fallback only where its cost is worth it.

## Compatibility Strategy (Pragmatic)

- Baseline mode (all modern browsers): task timer/instructions work normally,
  show remaining time and an "avoid locking the screen" hint, and never rely
  on hidden media or background code for correctness.
- Enhanced mode (supporting browsers): use Screen Wake Lock while the task is
  active and visible, surface its current state, and reacquire after a
  visibility return or `release` event.

The enhancement protects convenience. The baseline protects the task.

## Security and Compliance Notes

- Use HTTPS. The API is restricted to secure contexts
  ([MDN](https://developer.mozilla.org/en-US/docs/Web/API/Screen_Wake_Lock_API)).
- Make the state visible and easy to turn off. Keeping a display lit consumes
  battery, which is user cost rather than your free infrastructure.
- In an iframe, set `allow="screen-wake-lock"` only for trusted content and
  keep the site's `Permissions-Policy` intentional
  ([MDN](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Permissions-Policy/screen-wake-lock)).
- Do not use a silent media fallback to conceal a tracking or playback action.
  If media is running, make the user-facing reason clear.

## Test Matrix You Actually Need

- Desktop Chrome/Edge: start a task, change tabs, return, and verify exactly
  one fresh lock is held.
- Firefox latest: verify the normal API path, not an old fallback branch.
- Safari macOS latest: test request, manual stop, and system sleep/display
  settings rather than only the happy-path page load.
- Android Chrome on a physical phone: test low battery or battery-saver mode
  where available, then lock and unlock the device.
- iOS Safari on a physical phone: test in Safari and, if supported by the
  product, the Home Screen web app separately.
- Unsupported/blocked path: disable the API or block it with Permissions
  Policy and verify that the task remains usable with no fake "awake" badge.
- Embedded path: test the exact production iframe and host headers.

If the test never leaves the foreground tab, you tested the easy line of code.
Not the behavior your user will actually hit.

## Decision Summary

Use this pattern when:

- a visible, hands-off task is materially worse if the screen sleeps,
- the task can express a clear start and stop boundary,
- user convenience matters more than pretending that device battery is not a
  real resource.

Avoid this pattern when:

- the work must continue unattended after the user switches apps or locks the
  device — this API does not provide background execution,
- a brief, ordinary screen timeout is harmless,
- the only proposed implementation is a hidden looping media file.

Because yes, the page is active. The operating system is still allowed to have
opinions about that.

## Next Logical Topic

After this, the best follow-up is:
**Reliable timers and task state across tab suspension**
(monotonic clocks, missed intervals, notifications, and why `setInterval()` is
not a scheduler just because it has a number in its name).
