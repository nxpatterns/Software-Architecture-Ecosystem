# Use Case 08: Passwordless Login With Passkeys

"Passkeys" sounds like the password field can be deleted by Friday. True, if Friday also includes account recovery, credential storage, browser autofill, cross-device handoff, and every user who still very much expects a password to work because nobody told them otherwise.

This covers WebAuthn-based sign-in with public-key credentials. The browser creates and uses a passkey via Face ID, Touch ID, Windows Hello, a device PIN, or another authenticator. The server still has to do its job. It just stops receiving a reusable secret it can leak.

## Why the Small API Hides the Large Problem

`navigator.credentials.create()` and `.get()` look pleasantly compact. The hard part is everything around them: which credential manager owns the passkey, where it syncs, what UI appears, and how a user gets back in after losing every device they own simultaneously — which happens more often than any roadmap wants to admit.

## The User Story, Stripped of Domain

- create an account or add a passkey to an existing one,
- approve with the device's normal local unlock,
- return later, sign in with no password typed,
- see the passkey alongside saved passwords in a compatible sign-in form,
- fall back to another device or a security key when the preferred one isn't there,
- recover access through a deliberate, scrutinized fallback path.

Customer portal, internal tool, commerce site, admin console — same cryptographic ceremony, wildly different blast radius when recovery is sloppy.

## Core Browser Technologies

| API / Concept | Job | Reference |
|---|---|---|
| `navigator.credentials.create()` | Registers a public-key credential against a server challenge | — |
| `navigator.credentials.get()` | Asks an authenticator to sign a server challenge at sign-in | — |
| `PublicKeyCredential` | The WebAuthn credential type and its capability checks | — |
| Platform authenticators | Face ID, Touch ID, Android screen lock, Windows Hello | — |
| Discoverable credentials | Passkeys an authenticator can offer before the site even knows who's asking | — |
| Conditional mediation | `get({ mediation: "conditional" })` offers a passkey right from the autofill surface | [MDN](https://developer.mozilla.org/en-US/docs/Web/API/Web_Authentication_API) |
| `autocomplete="username webauthn"` | Marks the field eligible for that conditional suggestion | — |
| Server-side verification, storage, sessions, recovery | The parts JavaScript cannot wish into existence, ever | — |

## The Browser Reality Check

The WebAuthn ceremony itself is portable. Credential storage and autofill theatre are not — and that distinction is where most passkey rollouts quietly break.

Chrome users signed into a Google Account get passkeys saved to Google Password Manager, synced across devices signed into that account, with conditional-UI autofill support built into the standard form-autofill flow.<sup>[1]</sup> Firefox can use Windows Hello as a platform authenticator, but with a more explicit UX: a "Use a Passkey" option from the sign-in field, then the system dialog — and Windows Hello credentials can be device-bound to the local container, so that dialog is not automatically a cross-device-sync promise.<sup>[2]</sup> Safari follows iCloud Keychain, which Apple documents as keeping passkeys current across approved Apple devices and autofilling both Safari and app credentials.<sup>[3]</sup> Excellent inside an Apple estate. Not a bridge to a Windows Hello credential, no matter how the demo looked.

Mobile mirrors this exactly: Android Chromium through Google Password Manager, iOS Safari through iCloud Keychain.<sup>[1][3]</sup> Neither one is "a smaller Chrome" or "a smaller Safari" — they're their platform's own credential-manager flow, full stop.

Conditional mediation isn't one browser switch. Check `PublicKeyCredential.isConditionalMediationAvailable()` on every platform rather than trusting an engine name to guarantee an in-field suggestion.<sup>[4]</sup> The current conditional-get matrix spans Chrome (Android, ChromeOS, macOS, Windows), Safari (iOS/iPadOS, macOS), and Firefox (Android, macOS, Windows) — and even inside that matrix, the authenticator still decides whether a usable credential actually shows up.<sup>[5]</sup>

## What Breaks First

- Treating "passkey supported" as proof the passkey will sync to the user's next device. Support and sync are two different promises.
- Assuming Firefox Sync, iCloud Keychain, Google Password Manager, and Windows Hello are interchangeable storage systems. They are not, they were never designed to be, and nobody's roadmap should pretend otherwise.
- Registering non-discoverable credentials, then wondering why they never show up in conditional UI.
- Starting a conditional `get()` with no `autocomplete="username webauthn"` annotation and staring at a sign-in form with no suggestion in sight.
- Removing the password option before recovery, support escalation, and cross-device fallback have actually been tested.
- Treating a client-side credential response as authentication before the server has verified challenge, origin, RP ID, signature, and counter policy.

The biometric prompt is the easy scene. Account recovery is the sequel nobody storyboards.

## Minimal Technical Blueprint

```javascript
// Conditional UI: offer a passkey suggestion right in the username field
if (await PublicKeyCredential.isConditionalMediationAvailable?.()) {
  navigator.credentials.get({
    mediation: 'conditional',
    publicKey: await fetchChallenge(), // fresh, server-issued, single-use
  }).then(assertion => verifyOnServer(assertion))
    .catch(() => {}); // user picked password instead — not an error
}
```

1. Serve the relying party over HTTPS on its final domain, and pick a stable RP ID before any credential is created — changing it later orphans existing passkeys.
2. Keep the password flow alive while passkeys roll out. Offer "Add a passkey" from a signed-in security screen, not as a forced migration.
3. Server issues a fresh, short-lived registration challenge bound to the account and session.
4. Call `navigator.credentials.create()` with platform-friendly authenticator selection, discoverable credentials on if you want account-less autofill later.
5. Send the credential response server-side, verify it, store credential ID, public key, user handle, transports, backup-eligibility state.
6. For sign-in, issue a fresh challenge and call `.get()` through an explicit "Use a passkey" action.
7. For the enhanced path, check `isConditionalMediationAvailable()`, start one conditional `get()`, and correctly annotate the username field.
8. Verify the assertion server-side, consume the challenge exactly once, only then create the session.
9. Build credential management, cross-device/security-key options, and recovery that is deliberately slower and more scrutinized than the login it can override — that asymmetry is the whole point.

## Compatibility Strategy

**Baseline:** a visible "Use a passkey" button driving `navigator.credentials.get()`, plus password and recovery fallback. The core API is broadly available in current browsers.

**Enhanced:** one conditional request on the sign-in page, a correctly annotated username field, passkeys offered beside saved passwords in autofill.

Feature detection, always. User-agent tables are a bad authentication protocol dressed up as a compatibility strategy.

## Security and Compliance

Generate challenges server-side with cryptographically strong randomness, bind them to the exact ceremony, expire them fast, reject replay outright. Verify challenge, origin, `rpIdHash`, signature, user-verification policy, and credential-to-account binding — all server-side. The client is a courier. It is never the authority, no matter how convincing the local biometric prompt felt.

No biometric data ever crosses the wire — platform authenticators use local unlock, and the relying party only ever receives a signed assertion. Make credential deletion, recovery, and help-desk override flows fully auditable. A strong WebAuthn login sitting on top of a weak recovery hotline is decorative cryptography with a nice logo.

Keep a non-passkey route available until support data actually says it's safe to remove. Accessibility needs, managed devices, and lost-device scenarios don't evaporate because the demo looked elegant on one iPhone.

## Test Matrix You Actually Need

- Chrome with Google Password Manager signed in, then on a second device with the same Google Account.
- Chrome with no signed-in sync profile, passkey stored only on the local platform authenticator.
- Safari macOS and iOS with iCloud Keychain on, then a second approved Apple device.
- Firefox on Windows with Windows Hello: create, authenticate, cancel the system dialog, exercise the documented Autofill path.
- Firefox/Windows with a phone-based cross-device option rather than assuming Windows Hello storage has already traveled somewhere it hasn't.
- Conditional-UI runtime: focus the field, choose password, choose passkey, reload mid-request.
- A runtime where `isConditionalMediationAvailable()` is false: confirm the explicit button and password fallback still work cleanly.
- Lost device, deleted credential, account recovery, changed email, a suspicious recovery attempt deliberately provoked.

If the test plan ends at "Face ID worked once," the authentication plan hasn't started yet.

## Decision Summary

Use this when password reuse and phishing resistance are real, quantifiable problems, when the service can run genuine WebAuthn verification and recovery infrastructure, and when a pragmatic fallback stays in place while adoption climbs.

Skip it when the goal is a client-only login trick with no server ceremony behind it, when nobody actually owns account recovery operations, or when deleting the password matters more to the roadmap than keeping users able to sign in at all.

There's no password left to steal. There's still an account to recover at 2 a.m., and that call comes regardless.

---

[1]: Chrome/Android passkey storage via Google Password Manager, [Google Chrome Help](https://support.google.com/chrome/answer/13168025?hl=en&co=GENIE.Platform=Desktop), [Chrome for Developers](https://developer.chrome.com/docs/identity/webauthn-conditional-ui).
[2]: Firefox/Windows Hello platform authenticator and Autofill path, [FIDO Alliance](https://fidoalliance.org/venturebeat-firefox-66-brings-web-authentication-api-support-for-windows-hello/), [Mozilla Support](https://support.mozilla.org/en-US/kb/autofill-logins-firefox), [Microsoft Learn](https://learn.microsoft.com/en-us/entra/identity/authentication/how-to-authentication-entra-passkeys-on-windows).
[3]: iCloud Keychain passkey sync and AutoFill, [Apple Support](https://support.apple.com/en-us/109016).
[4]: Conditional mediation capability check, [MDN – isConditionalMediationAvailable](https://developer.mozilla.org/en-US/docs/Web/API/PublicKeyCredential/isConditionalMediationAvailable_static).
[5]: Conditional Get platform support matrix, [passkeys.dev](https://passkeys.dev/device-support/).
