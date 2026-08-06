# Use Case 10: Installable PWA With Push Notifications

Most teams assume a PWA can install itself, ask permission, and notify people straight from JavaScript. It can do the first two. The actual send is the exception to the "just client-side" story: an application server has to push to the browser's push service. This is a client-heavy feature. It was never a client-only one.

## Why the Happy Path Lies

The happy path is a manifest, a service worker, a permission prompt. The real path adds an install journey, an OS-level permission model, subscription churn, a server-side VAPID key, and iOS rules that quietly disqualify a normal Safari tab as the product surface entirely.

## The User Story, Stripped of Domain

- open the web app in a browser,
- add it to the device or desktop,
- decide whether to enable notifications after seeing the app's value, not before,
- receive a notification while the app isn't even open,
- tap it, land on the relevant screen,
- turn notifications off without uninstalling anything.

Task reminder, delivery update, price alert — same pattern: a web app needs to wake up politely when something changes somewhere else entirely.

## Core Browser Technologies

| API | Job | Reference |
|---|---|---|
| Web App Manifest | Identity, icons, start URL, `display: "standalone"` | [MDN](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Manifest/Reference/display) |
| Service Worker | Receives push events away from the page, shows persistent notifications, HTTPS-only | [MDN](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API) |
| Push API / `PushManager` | Creates a `PushSubscription`, receives server-sent messages | [MDN](https://developer.mozilla.org/en-US/docs/Web/API/Push_API) |
| Notifications API | Permission request and the actual system notification — earned, never sprayed on load | MDN |
| VAPID keys | Identify the app server to the push service via signed tokens | [RFC 8292](https://datatracker.ietf.org/doc/html/rfc8292) |
| Application server | Stores subscriptions, sends encrypted Web Push — the part people try to skip | [Apple Developer](https://developer.apple.com/documentation/usernotifications/sending-web-push-notifications-in-web-apps-and-browsers) |
| Cache Storage API | App shell caching so a launched install has something to render while reconnecting | [MDN](https://developer.mozilla.org/en-US/docs/Web/API/CacheStorage) |

## The Browser Reality Check

The desktop flow is an API integration. iOS is an onboarding flow with an API integration reluctantly attached.

Chromium has Push API and Web App Manifest support across the board — the least surprising route available.<sup>[1]</sup> Firefox supports the Push API but not the Web App Manifest per caniuse, so don't promise Firefox the same install ceremony Chromium offers.<sup>[1]</sup> Build the app as a genuinely good website first; treat "install" as a browser-specific bonus, never a load-bearing contract.

Safari got standards-based Web Push in 16.1 on macOS Ventura.<sup>[2]</sup> Use the feature-detected Push API path — don't resurrect the old proprietary Safari push stack because a five-year-old blog post is still indexed somewhere.

**iOS is the constraint that decides the whole product.** Web Push arrived in iOS/iPadOS 16.4, and only for web apps added to the Home Screen.<sup>[3]</sup> A normal browser tab cannot be your iOS push surface, full stop. The user adds the app to the Home Screen, launches that installed instance, taps an explicit subscribe control — and WebKit requires the permission request to follow direct user interaction, no exceptions.<sup>[2]</sup>

## What Breaks First

- Treating browser installation as an automatic prompt instead of the user's decision it actually is.
- Requesting notification permission on first page view, before the user has any reason to think this app deserves the interruption.
- Assuming `Notification.permission === 'granted'` means a `PushSubscription` already exists. It doesn't — permission and subscription are two separate steps.
- Sending a subscription to the server with no link to the right user, device, consent state, and preference set.
- Treating a push endpoint as permanent. Browsers and users unsubscribe, reinstall, clear data, change their minds — constantly.
- Building the iOS flow around a Safari tab, when 16.4 flatly requires Home Screen installation first.<sup>[3]</sup>
- Calling this "client-only" because `subscribe()` ran in the client. The server still has to send the notification — that part never moved.<sup>[4]</sup>

The browser registers interest. Something else still has to have actual news.

## Minimal Technical Blueprint

```javascript
enableAlertsButton.addEventListener('click', async () => {
  const registration = await navigator.serviceWorker.ready;
  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,               // required: every push must show a notification
    applicationServerKey: VAPID_PUBLIC_KEY,
  });
  await fetch('/api/subscriptions', {
    method: 'POST',
    body: JSON.stringify({ subscription, userId, consentTimestamp: Date.now() }),
  });
});

// In the service worker:
self.addEventListener('push', (event) => {
  const { title, body, url } = event.data.json(); // never secrets, ever
  event.waitUntil(self.registration.showNotification(title, { body, data: { url } }));
});
```

1. Serve over HTTPS, publish a manifest with a stable `id`, `name`, icons, `start_url`, `display: "standalone"`, register a versioned service worker.
2. Make the ordinary website excellent on its own first. Add a contextual install explanation instead of relying on a magic cross-browser install button — because there isn't one.
3. In the service worker, cache the app shell and implement `push` and `notificationclick` handlers; make click routing idempotent.
4. After an explicit "Enable alerts" tap, check capability and permission, then call `subscribe()` with `userVisibleOnly: true` and the VAPID public key.
5. POST the full subscription, authenticated user/device identifier, consent timestamp, and preference topics to the server, over HTTPS.
6. Keep the VAPID private key server-side, always. On an event, the server sends a standards-based Web Push request to the stored endpoint — this is the send that has to happen, no shortcut around it.<sup>[4]</sup>
7. In the `push` handler, validate the payload shape, update local state if relevant, call `showNotification()` with a minimal, non-secret title and body.
8. In `notificationclick`, focus an existing client or open the in-scope route, clean up failed subscriptions, provide a visible unsubscribe control.

## Compatibility Strategy

**Baseline:** responsive website, in-app notification center, email/SMS or manual refresh as an explicit user choice. No push permission request just because the page loaded.

**Enhanced desktop/Android:** feature-detect service workers, `PushManager`, notification permission; offer install and opt-in push where supported.

**Enhanced iOS:** show Home Screen installation guidance first. Only once the installed app is actually running on 16.4+ does the notification opt-in route appear.<sup>[2]</sup>

Progressive enhancement. Not permission-prompt performance art.

## Security and Compliance

Treat a subscription endpoint and its encryption keys as personal device identifiers — same access controls and retention policy as any other contact channel. Keep the VAPID private key server-side, rotate it deliberately, never ship it in the client bundle. The public key is for `subscribe()`. The private key is for sending, and it never crosses that line.

No sensitive account data, one-time links, health information, or secrets in a notification title or body — lock screens have excellent shoulder-surfing support and zero access control. Authenticate the subscription-registration request; make unsubscribe, account deletion, preference changes, and failed-endpoint cleanup idempotent. Separate "user accepted notifications" from "we're allowed to market to this person" — those are not automatically the same consent, and treating them as one is the kind of assumption that ends up in a compliance review.

A push service delivers attention. Treat it like a production dependency, not a free `alert()` that escaped the tab.

## Test Matrix You Actually Need

- Desktop Chrome/Edge: fresh install, denied permission, granted permission, subscription renewal, notification click, uninstall/reinstall.
- Firefox: push opt-in and click behavior in foreground and background; confirm the non-install fallback still works on its own.
- Safari macOS 16.1+: subscribe, close the site, send a real server push, test click routing.
- Android real device: install, opt in, lock the device, send a push, change network state, revoke permission in system settings.
- iPhone/iPad on 16.4+: add to Home Screen first, launch from there, request permission from a tap, send a real server push.
- Server drill: expire or remove a subscription, simulate an invalid endpoint, confirm the sender deletes or retries without spamming anyone.

If the iOS test never involved Home Screen installation, that wasn't iOS web push. It was a different product wearing the same name.

## Decision Summary

Use this when a timely event genuinely benefits from interrupting the user, when the product can explain the benefit before asking permission, and when the team can actually operate the subscription and push-send service on the backend.

Skip it when a live tab, an inbox, or ordinary polling already covers the need, when alerts would carry sensitive content or create fatigue, or when nobody's signed up to own VAPID keys, endpoint cleanup, and consent records long-term.

It's a web app on the home screen. The push sender still lives on a server, no matter how the pitch deck phrased it.

---

[1]: Push API and Web App Manifest support, [caniuse – Push API](https://caniuse.com/push-api), [caniuse – Manifest](https://caniuse.com/wf-manifest).
[2]: Safari 16.1 Web Push and interaction requirement, [WebKit Blog](https://webkit.org/blog/13878/web-push-for-web-apps-on-ios-and-ipados/).
[3]: iOS/iPadOS 16.4 Home Screen requirement, [WebKit Blog](https://webkit.org/blog/13966/webkit-features-in-safari-16-4/).
[4]: Server-side Web Push send requirement, [Apple Developer](https://developer.apple.com/documentation/usernotifications/sending-web-push-notifications-in-web-apps-and-browsers).
