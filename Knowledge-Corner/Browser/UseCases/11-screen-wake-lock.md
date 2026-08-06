# Use Case 11: Keeping the Screen Awake During a Task

A visible timer, recipe, or checklist feels like enough to keep a screen awake. It isn't. The operating system sees an idle screen, not your very important countdown, and does exactly what it was built to do — dim it, then lock it.

This is about asking the browser for a real screen wake lock while a user is actively mid-task, and surviving the moment that request gets refused, revoked, or quietly lost the instant the tab's visibility changes.

## Why One Line of Code Isn't the Feature

`navigator.wakeLock.request('screen')` reads like a single call. The production version is a small lifecycle manager juggling user intent, battery behavior, visibility changes, release events, and an honest fallback for the moment the platform just says no.

## The User Story, Stripped of Domain

- start a task that needs the screen readable without constant taps,
- keep following instructions, a timer, a live status,
- switch briefly to another app or tab,
- come back without an orphaned lock left running in the background,
- see whether the screen is currently being held awake,
- explicitly stop and return to normal device behavior.

Cooking flow, exercise interval, lab procedure, inspection checklist — same contract: awake while useful, normal the moment it isn't.

## Core Browser Technologies

| API | Job | Reference |
|---|---|---|
| `navigator.wakeLock.request('screen')` | Asks the OS not to dim or lock while the document is visible | [MDN](https://developer.mozilla.org/en-US/docs/Web/API/WakeLock/request) |
| `WakeLockSentinel` | Holds the granted lock, fires `release` when it's taken back | [MDN](https://developer.mozilla.org/en-US/docs/Web/API/WakeLockSentinel) |
| Page Visibility API | Stops acquisition while hidden, reliable reacquire signal on return | [MDN](https://developer.mozilla.org/en-US/docs/Web/API/Page_Visibility_API) |
| `Permissions-Policy: screen-wake-lock` | Allows or blocks the API, especially when framed | [MDN](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Permissions-Policy/screen-wake-lock) |
| Silent media (last resort) | Old-school fallback trick — media playback, not an actual wake-lock contract | [MDN Autoplay guide](https://developer.mozilla.org/en-US/docs/Web/Media/Guides/Autoplay) |

## The Browser Reality Check

The API is finally normal everywhere. The document lifecycle is still the part that gets to say no.

Chrome has supported it since version 85, Chromium Edge since 90.<sup>[1]</sup> Firefox — long the missing engine here — added support in Firefox 126, May 2024; current Firefox is on the normal path now, not a fallback branch.<sup>[2]</sup> Safari has had it since 16.4.<sup>[1]</sup>

**iOS has an extra wrinkle worth knowing before it surprises you in a demo:** Home Screen web apps didn't get working Wake Lock until iOS/iPadOS 18.4 — a separate milestone from the Safari-tab support that arrived in 16.4.<sup>[3]</sup> Test the browser tab and the installed-web-app version separately; assuming they behave the same because they share an engine is exactly the kind of assumption that fails in front of a live audience.

A hidden document cannot acquire a lock, and a granted one can be revoked the moment the document stops being active.<sup>[4]</sup> Switching apps, locking the phone, opening another tab — all of it means "pause and reacquire on return." None of it means "continue indefinitely in the background," no matter how the feature name sounds.

## What Breaks First

- Calling `request()` once at task start and never listening for `release` — the lock can vanish out from under you with zero warning otherwise.
- Treating a wake lock as background-execution permission. It isn't, was never advertised as one, and the API name is not an invitation to pretend otherwise.
- Trying to reacquire while `document.visibilityState === 'hidden'`, which rejects with `NotAllowedError` by design.<sup>[4]</sup>
- Holding the lock after the timer ends because nobody wired the stop button to `sentinel.release()`.
- Hiding a looping silent video in the DOM and calling that compatibility. Muted media generally dodges autoplay blocking, but audible media can still require user interaction — and either way, it's a workaround, not the feature.<sup>[5]</sup>
- Assuming an embedded task can request a lock when the host page's `Permissions-Policy` blocks `screen-wake-lock` outright.<sup>[6]</sup>

A sleep-prevention hack that only works until the next browser update isn't a feature. It's a support ticket wearing a `<video>` tag.

## Minimal Technical Blueprint

```javascript
let sentinel = null;

async function acquireLock() {
  if (!('wakeLock' in navigator) || document.visibilityState !== 'visible') return;
  try {
    sentinel = await navigator.wakeLock.request('screen');
    sentinel.addEventListener('release', () => { sentinel = null; scheduleRetryIfStillActive(); });
  } catch { /* denial is a normal lifecycle outcome, not an error state */ }
}

document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible' && taskIsActive) acquireLock();
});
```

1. Make "keep screen awake" an explicit part of task state, with a visible toggle and a clear stop action.
2. Feature-detect `navigator.wakeLock`. Never infer support from browser name, OS, or a spreadsheet someone made in 2021.
3. Request only when the task is active *and* the document is visible, wrapped in `try/catch`.
4. Store the returned sentinel, render an honest "screen kept awake" indicator, attach the `release` listener.
5. On `release`, clear local state and revert to normal UI; if the task is still active and visible, schedule one controlled retry — not an infinite loop.
6. On `visibilitychange`, drop the local reference when hidden; request fresh on return if the task still needs it.
7. Release the sentinel when the task ends, the user toggles it off, or the component unmounts.
8. If the API is absent or denied, keep the task fully functional anyway, show a conspicuous "keep this screen on" hint, and only offer a muted-media fallback where its cost is genuinely worth it.

## Compatibility Strategy

**Baseline:** the timer/task works normally regardless, shows remaining time, hints at avoiding screen lock manually. Never let correctness depend on hidden media or background tricks.

**Enhanced:** Screen Wake Lock while active and visible, current state surfaced honestly, reacquire after visibility return or `release`.

The enhancement protects convenience. The baseline protects the actual task.

## Security and Compliance

HTTPS only — this API is secure-context-restricted by design. Make the awake state visible and trivially easy to turn off; keeping a display lit is real battery cost, not free infrastructure the app gets to spend on the user's behalf without asking. In an iframe, set `allow="screen-wake-lock"` only for trusted content, and keep the site's `Permissions-Policy` deliberate rather than defaulted. Never use a silent-media fallback to quietly conceal a tracking or playback action — if media is running, the user-facing reason needs to be obvious.

## Test Matrix You Actually Need

- Desktop Chrome/Edge: start, switch tabs, return, confirm exactly one fresh lock is held — not zero, not two.
- Firefox: confirm the normal API path fires, not a legacy fallback branch left over from before 126.
- Safari macOS: request, manual stop, actual system sleep/display settings — not just the happy-path load.
- Android real device: low-battery or battery-saver mode where testable, then lock and unlock the device mid-task.
- iOS real device: Safari tab and, if the product supports it, the installed Home Screen app, tested separately.
- Blocked path: disable or Permissions-Policy-block the API, confirm the task stays fully usable with no fake "awake" badge lying to the user.
- The exact production iframe and host headers, if embedded anywhere.

A test that never leaves the foreground tab tested the easy line of code. Not the behavior your user actually hits.

## Decision Summary

Use this when a visible, hands-off task is materially worse if the screen sleeps mid-way through, the task has a clear start and stop boundary, and user convenience genuinely outweighs pretending battery isn't a real, finite resource.

Skip it when the work needs to continue unattended after the user switches apps or locks the device — this API flatly does not provide that — when an ordinary screen timeout is harmless, or when the only proposed implementation is a hidden looping media file dressed up as a solution.

The page is active. The operating system is still allowed to have opinions about that, and it will act on them regardless of what your feature is called.

---

[1]: Chrome/Edge/Safari Screen Wake Lock support, [caniuse](https://caniuse.com/wake-lock).
[2]: Firefox 126 Wake Lock support, [MDN Firefox release notes](https://developer.mozilla.org/en-US/docs/Mozilla/Firefox/Releases/126).
[3]: Home Screen web app Wake Lock support, [WebKit Blog – Safari 18.4](https://webkit.org/blog/16574/webkit-features-in-safari-18-4/).
[4]: Visibility requirement and revocation behavior, [MDN – WakeLock.request()](https://developer.mozilla.org/en-US/docs/Web/API/WakeLock/request).
[5]: Autoplay and muted-media behavior, [MDN Autoplay guide](https://developer.mozilla.org/en-US/docs/Web/Media/Guides/Autoplay).
[6]: `Permissions-Policy: screen-wake-lock`, [MDN](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Permissions-Policy/screen-wake-lock).
