# Use Case 10: Installable PWA With Push Notifications

Most teams assume a PWA can be installed, ask for permission, and then somehow notify people from JavaScript. It can do the first two. The actual push send is the exception: an application server must send to the browser's push service. This is a client-heavy feature, not a client-only feature.

## Why this is a good next "hard topic"

Because the happy path is a manifest, a service worker, and a permission prompt. The real path includes an install journey, an operating-system permission model, subscription churn, a server-side VAPID key, and iOS rules that make a normal Safari tab the wrong product surface.

## User Story (Abstracted)

A user can:

- open a web app in a browser,
- add it to their device or desktop,
- choose whether to receive notifications after seeing their value,
- receive a notification while the app is not open,
- tap it and arrive at the relevant screen,
- and turn notifications off without deleting the app.

We do not care which notification.
Could be a task reminder, a delivery update, a price alert, or a workflow event.
Same pattern: a web app needs to wake up politely when something changes elsewhere.

## Core Browser Technologies

- `Web App Manifest`: declares the app's identity, icons, start URL, and preferred
  display mode; `standalone` requests an app-like surface ([MDN](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Manifest/Reference/display)).
- `Service Worker`: receives push events away from the page and can show a
  persistent notification; service workers require HTTPS ([MDN](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)).
- `Push API` / `PushManager`: creates a `PushSubscription` for an active service
  worker and receives messages sent from a server ([MDN](https://developer.mozilla.org/en-US/docs/Web/API/Push_API)).
- `Notifications API`: requests the user's permission and displays the actual
  system notification. Permission must be earned, not sprayed at first load
  ([MDN](https://developer.mozilla.org/en-US/docs/Web/API/Notifications_API/Using_the_Notifications_API)).
- `VAPID` keys: identify the application server to the push service; VAPID uses
  signed tokens so the push service can attribute requests ([RFC 8292](https://datatracker.ietf.org/doc/html/rfc8292)).
- `Application server`: stores subscriptions and sends encrypted Web Push requests
  to each subscription endpoint. This is the non-browser part people try to omit
  ([Apple Developer](https://developer.apple.com/documentation/usernotifications/sending-web-push-notifications-in-web-apps-and-browsers)).
- `Cache Storage API` (recommended): cache the app shell so a launched installed
  app has something useful to render while it reconnects.

## Browser Reality Check

### Desktop

- Chromium (Chrome, Edge, Arc): this is the least surprising route. Push API is
  supported in current Chromium lines, and the Web App Manifest is supported in
  Chrome and Edge ([Push API](https://caniuse.com/push-api), [Manifest](https://caniuse.com/wf-manifest)).
- Firefox: Push API is supported, but Web App Manifest support is not a reason to
  promise the same install experience as Chromium; Caniuse lists the manifest as
  unsupported in Firefox ([Push API](https://caniuse.com/push-api), [Manifest](https://caniuse.com/wf-manifest)).
  Build the app as a good website first and treat "install" as a browser-specific
  entry point, not a contract.
- Safari (macOS): standards-based Web Push arrived in Safari 16.1 on macOS Ventura
  ([WebKit](https://webkit.org/blog/13878/web-push-for-web-apps-on-ios-and-ipados/)).
  Use the same feature-detected Push API path; do not revive the old proprietary
  Safari push stack just because old blog posts still exist.

### Mobile

- Android Chromium: Push API and Web App Manifest support make the conventional
  install-plus-push flow viable ([Push API](https://caniuse.com/push-api), [Manifest](https://caniuse.com/wf-manifest)).
  The work is still permission timing, battery reality, and notification quality.
- iOS Safari / WebKit-based browsers: this is the constraint that decides the
  product. **Web Push became available in iOS and iPadOS 16.4, and only for web
  apps added to the Home Screen** ([WebKit](https://webkit.org/blog/13966/webkit-features-in-safari-16-4/)).
  A normal browser tab cannot be your iOS push surface. The user must add the app
  to the Home Screen first, launch that installed web app, and tap an explicit
  subscribe control; WebKit requires the permission request to follow direct
  user interaction ([WebKit](https://webkit.org/blog/13878/web-push-for-web-apps-on-ios-and-ipados/)).

Short version: the desktop flow is an API integration.
iOS is an onboarding flow with an API integration attached.

## What Usually Breaks First

- Treating browser installation as an automatic prompt instead of a user decision.
- Asking for notification permission on first page view, before the user knows
  why this app deserves to interrupt them ([MDN](https://developer.mozilla.org/en-US/docs/Web/API/Notifications_API/Using_the_Notifications_API)).
- Assuming `Notification.permission === 'granted'` means a PushSubscription exists.
- Sending the subscription to a server without associating it with the right user,
  device, consent state, and notification preferences.
- Treating a push endpoint as stable forever. Browsers and users unsubscribe,
  reinstall, clear data, and change their minds.
- Building iOS push around a Safari tab. iOS/iPadOS 16.4 requires the app to be
  added to the Home Screen ([WebKit](https://webkit.org/blog/13878/web-push-for-web-apps-on-ios-and-ipados/)).
- Calling this client-only because `pushManager.subscribe()` ran in the client.
  The server still sends the notification ([Apple Developer](https://developer.apple.com/documentation/usernotifications/sending-web-push-notifications-in-web-apps-and-browsers)).

The browser registers interest. Something else still has to have news.

## Minimal Technical Blueprint

1. Serve the app over HTTPS, publish a manifest with stable `id`, `name`, icons,
   `start_url`, and `display: "standalone"`, then register a versioned service worker.
2. Make the ordinary website excellent first; add a contextual install explanation
   instead of relying on a magical cross-browser install button.
3. In the service worker, cache the app shell and implement `push` plus
   `notificationclick` handlers; make click routing idempotent.
4. After an explicit "Enable alerts" tap, check capability and permission, then
   call `registration.pushManager.subscribe()` with `userVisibleOnly: true` and
   the VAPID public `applicationServerKey` ([MDN](https://developer.mozilla.org/en-US/docs/Web/API/PushManager/subscribe)).
5. POST the full subscription object, the authenticated user/device identifier,
   consent timestamp, and preference topics to the application server over HTTPS.
6. Keep the VAPID private key only on that server. When an event occurs, the
   server sends a standards-based Web Push request to the stored endpoint; this
   is the required server-side send ([Apple Developer](https://developer.apple.com/documentation/usernotifications/sending-web-push-notifications-in-web-apps-and-browsers)).
7. In the `push` handler, validate the payload shape, update local state if needed,
   and call `showNotification()` with a minimal, non-secret title and body.
8. In `notificationclick`, focus an existing client or open the in-scope route;
   clean up failed subscriptions and provide a visible unsubscribe control.

## Compatibility Strategy (Pragmatic)

- Baseline mode (all browsers): responsive website, in-app notification center,
  email/SMS or manual refresh where the user explicitly chooses it. No push
  permission request merely because the page loaded.
- Enhanced desktop/Android mode: feature-detect service workers, `PushManager`,
  and notification permission; then offer install and opt-in push where supported
  ([MDN: Service Worker](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API), [MDN: Push API](https://developer.mozilla.org/en-US/docs/Web/API/Push_API)).
- Enhanced iOS mode: show Home Screen installation guidance first. Only after the
  installed app is running on iOS/iPadOS 16.4 or later should the app expose the
  notification opt-in route ([WebKit](https://webkit.org/blog/13878/web-push-for-web-apps-on-ios-and-ipados/)).

This is progressive enhancement, not permission-prompt performance art.

## Security and Compliance Notes

- Treat a PushSubscription endpoint and its encryption keys as personal device
  identifiers. Store them with the same access controls and retention policy as
  other contact channels.
- Keep the VAPID private key on the server, rotate it deliberately, and never
  ship it in the bundle. The public key is for `subscribe()`; the private key is
  for the send path.
- Put no sensitive account data, one-time links, health data, or secrets in a
  notification title/body. Lock screens have excellent shoulder-surfing support.
- Authenticate the subscription-registration request and make unsubscribe,
  account deletion, preference changes, and failed-endpoint cleanup idempotent.
- Separate "user accepted notifications" from "we are allowed to market to this
  person." Those are not automatically the same consent.

A push service delivers attention. Treat it like a production dependency, not a
free `alert()` that escaped the tab.

## Test Matrix You Actually Need

- Desktop Chrome/Edge: fresh install, denied permission, granted permission,
  subscription renewal, notification click, and uninstall/reinstall.
- Firefox latest: push opt-in and foreground/background click behavior; verify
  the non-install fallback is still useful.
- Safari macOS 16.1 or later: subscribe, close the site, send a server push, and
  test notification click routing ([WebKit](https://webkit.org/blog/13878/web-push-for-web-apps-on-ios-and-ipados/)).
- Android Chrome on a real phone: install, opt in, lock the device, send a push,
  change network state, and revoke notification permission in system settings.
- iPhone or iPad on iOS/iPadOS 16.4 or later: first add the web app to the Home
  Screen, launch it from there, then request permission from a tap and send a
  real server push ([WebKit](https://webkit.org/blog/13878/web-push-for-web-apps-on-ios-and-ipados/)).
- Server drill: expire or remove a subscription, simulate an invalid endpoint,
  and prove the sender deletes or retries records without spamming users.

If your iOS test never involved Home Screen installation, you did not test iOS
web push. You tested a different product.

## Decision Summary

Use this pattern when:

- a timely event genuinely benefits from interrupting the user,
- the product can explain the benefit before asking permission,
- the team can operate the small but real subscription and push-send service.

Avoid this pattern when:

- a live tab, inbox, or ordinary polling is enough,
- alerts would carry sensitive content or create alert fatigue,
- the project cannot own server-side VAPID keys, endpoint cleanup, and consent
  records.

Because yes, it is a web app on the home screen.
And yes, the push sender still lives on a server.

## Next Logical Topic

After this, the best follow-up is:
**Browser credential and passkey flows for local-first apps**
(WebAuthn ceremony, device-bound credentials, recovery, and why "passwordless"
does not mean "state-less").
