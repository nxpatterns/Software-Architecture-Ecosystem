# Use Case 08: Passwordless Login With Passkeys

Most teams hear “passkeys” and assume the password field can be deleted by Friday. That is true only if Friday includes account recovery, credential storage, browser autofill, cross-device handoff, and every user who still expects a password to work.

This use case covers WebAuthn-based sign-in with public-key credentials.
The browser can create and use a passkey with Face ID, Touch ID, Windows Hello, a device PIN, or another authenticator. The server still has to do its job. It just stops receiving a reusable password.

## Why this is a good next "hard topic"

Because `navigator.credentials.create()` and `navigator.credentials.get()`
look pleasantly small. The hard part is everything around them: which
credential manager owns the passkey, where it syncs, what UI appears, and how
a user gets back in after losing every device.

## User Story (Abstracted)

A user can:

- create an account or add a passkey to an existing account,
- approve the action with the device's normal local unlock,
- return later and sign in without typing a password,
- see a passkey alongside saved passwords in a compatible sign-in form,
- use another device or security key when their preferred one is unavailable,
- and recover access through a deliberate fallback path.

We do not care which account. Could be a customer portal, internal tool, commerce site, or admin console. Same cryptographic ceremony. Very different blast radius when recovery is sloppy.

## Core Browser Technologies

- `Web Authentication API` / `navigator.credentials.create()`: registers a public-key credential after the server supplies a one-time challenge.
- `Web Authentication API` / `navigator.credentials.get()`: asks an authenticator to sign a server challenge during sign-in.
- `PublicKeyCredential`: the WebAuthn credential type, including capability checks and authenticator metadata.
- Platform authenticators: the device-managed credential path, such as Face ID, Touch ID, Android screen lock, or Windows Hello.
- Discoverable credentials: passkeys that an authenticator can offer before the site knows the account identifier.
- Conditional mediation / Autofill UI: a pending `navigator.credentials.get({ mediation: "conditional" })` request lets a compatible browser offer a passkey from the sign-in form's autofill surface ([MDN: Web Authentication API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Authentication_API)).
- `autocomplete="username webauthn"`: marks the account field as eligible for a passkey suggestion in conditional UI.
- HTTPS / secure context: required for the Web Authentication API ([MDN](https://developer.mozilla.org/en-US/docs/Web/API/Web_Authentication_API)).
- Server-side challenge generation, signature verification, credential storage, session management, and recovery controls: the pieces JavaScript cannot wish into existence.

## Browser Reality Check

### Desktop

- Chromium (Chrome, Edge, Arc): Chrome users signed into the same Google Account can save passkeys in Google Password Manager and use them across devices; Google documents availability across platforms where Chrome is available ([Google Chrome Help](https://support.google.com/chrome/answer/13168025?hl=en&co=GENIE.Platform=Desktop)). Chrome also supports passkey autofill / conditional UI in the familiar form-autofill flow ([Chrome for Developers](https://developer.chrome.com/docs/identity/webauthn-conditional-ui)).
- Firefox: Firefox can use Windows Hello as a WebAuthn platform authenticator on Windows ([FIDO Alliance](https://fidoalliance.org/venturebeat-firefox-66-brings-web-authentication-api-support-for-windows-hello/)). Its user-facing path is more explicit: Firefox documents a **Use a Passkey** option from a sign-in field, followed by the system passkey dialog ([Mozilla Support](https://support.mozilla.org/en-US/kb/autofill-logins-firefox)). Windows Hello credentials can be device-bound in the local Windows Hello container, so that dialog is not a cross-device-sync promise ([Microsoft Learn](https://learn.microsoft.com/en-us/entra/identity/authentication/how-to-authentication-entra-passkeys-on-windows)).
- Safari (macOS): Safari normally follows iCloud Keychain / Passwords. Apple says iCloud Keychain keeps passkeys updated across approved devices and autofills Safari and app credentials ([Apple Support](https://support.apple.com/en-us/109016)). That is excellent inside an Apple account estate, and not a magic bridge to a Windows Hello credential.

### Mobile

- Android Chromium: Google Password Manager saves passkeys to the Google Account and makes them available when the user signs into Chrome or Android on another device with that account ([Google Chrome Help](https://support.google.com/chrome/answer/13168025?hl=en&co=GENIE.Platform=Desktop)).
- iOS Safari / WebKit-based browsers: the native-looking passkey path is iCloud Keychain with Password AutoFill, which Apple says autofills passkeys on approved devices ([Apple Support](https://support.apple.com/en-us/109016)). Test it as an Apple credential-manager flow, not as a smaller Chrome.

Conditional mediation is not one browser switch: Chrome documents passkey autofill; Safari's path is iCloud Keychain AutoFill; and Firefox integrates passkeys into Autofill ([Chrome for Developers](https://developer.chrome.com/docs/identity/webauthn-conditional-ui), [Apple Support](https://support.apple.com/en-us/109016), [Mozilla Support](https://support.mozilla.org/en-US/kb/autofill-logins-firefox)). On every platform, check `PublicKeyCredential.isConditionalMediationAvailable()` rather than assuming an engine name guarantees an in-field suggestion ([MDN](https://developer.mozilla.org/en-US/docs/Web/API/PublicKeyCredential/isConditionalMediationAvailable_static)).

The current Conditional Get matrix covers Chrome on Android, ChromeOS, macOS,
and Windows; Safari on iOS/iPadOS and macOS; and Firefox on Android, macOS,
and Windows. The authenticator and credential manager still decide whether a
useful credential is actually there ([passkeys.dev](https://passkeys.dev/device-support/)).

Short version: the WebAuthn ceremony is portable. Credential storage and
autofill theatre are not.

## What Usually Breaks First

- Treating “passkey supported” as proof that the passkey will sync to the
  user's next device.
- Assuming Firefox Sync, a browser profile, iCloud Keychain, Google Password
  Manager, and Windows Hello are interchangeable storage systems.
- Registering non-discoverable credentials, then expecting them to appear in
  conditional UI.
- Starting a conditional `get()` request without the `autocomplete="username webauthn"` field annotation and wondering where the suggestion went.
- Removing passwords before testing recovery, support escalation, and a
  cross-device fallback.
- Treating a successful client-side credential response as authentication before the server verifies challenge, origin, RP ID, signature, and counter-related policy.

The biometric prompt is the easy scene. Account recovery is the sequel.

## Minimal Technical Blueprint

1. Serve the relying party over HTTPS on its final domain and choose a stable RP ID before credentials are created.
2. Keep the password flow available while passkeys are introduced; offer Add a passkey from a signed-in security screen.
3. On the server, create a fresh, short-lived registration challenge bound to the account and session.
4. Call `navigator.credentials.create()` with a public-key request, platform-friendly authenticator selection, and discoverable credentials when you want account-less autofill.
5. Send the credential response to the server; verify it and store credential ID, public key, user handle, transports, and useful backup state.
6. For a normal sign-in, issue a fresh challenge and call `navigator.credentials.get()` through an explicit **Use a passkey** action.
7. For the enhanced form path, check `PublicKeyCredential.isConditionalMediationAvailable()`, start one conditional `get()`, and mark the account field `autocomplete="username webauthn"`.
8. Verify the assertion server-side, consume the challenge exactly once, and create the normal session only after success.
9. Provide credential management, cross-device/security-key options, and recovery slower and more scrutinized than the login it can override.

## Compatibility Strategy (Pragmatic)

- Baseline mode (all modern WebAuthn browsers): a visible **Use a passkey** button that starts `navigator.credentials.get()`, plus password and recovery fallback. The core API is widely available in current browsers ([MDN](https://developer.mozilla.org/en-US/docs/Web/API/Web_Authentication_API)).
- Enhanced mode (where the runtime probe returns true): one conditional request on the sign-in page, a correctly annotated username field, and passkeys offered beside saved passwords in Autofill.

Use feature detection. User-agent tables are a bad authentication protocol.

## Security and Compliance Notes

- Generate challenges on the server with cryptographically strong randomness, bind them to the intended ceremony, expire them quickly, and reject replay.
- Verify `challenge`, `origin`, `rpIdHash`, signature, user-verification policy, and credential-to-account binding on the server. The client is a courier, not an authority.
- Do not ask browsers to send biometric data. Platform authenticators use local unlock; the relying party receives a signed assertion, not a fingerprint.
- Make credential deletion, recovery, and help-desk override flows auditable. A strong WebAuthn login with a weak recovery hotline is decorative cryptography.
- Give users a non-passkey route until support data says it is safe not to. Accessibility, managed devices, and lost-device cases do not disappear because the demo was elegant.

## Test Matrix You Actually Need

- Chrome with Google Password Manager signed in, then on a second device with the same Google Account.
- Chrome with no signed-in sync profile and a passkey stored only on the local platform authenticator.
- Safari on macOS and iOS with iCloud Keychain enabled, then on a second approved Apple device.
- Firefox on Windows with Windows Hello: create, authenticate, cancel the system dialog, and use the documented **Use a Passkey** Autofill path.
- Firefox/Windows with a credential provider or phone-based cross-device option, rather than assuming Windows Hello storage has already travelled.
- A conditional-UI-capable runtime: focus the username field, choose password, choose passkey, and reload while a request is pending.
- A runtime where `isConditionalMediationAvailable()` is false: verify the explicit passkey button and password fallback remain clean.
- Lost device, deleted credential, account recovery, changed email, and suspicious recovery attempt.

If the test plan ends at “Face ID worked once,” the authentication plan has
not started.

## Decision Summary

Use this pattern when:

- password reuse and phishing resistance are meaningful problems,
- the service can operate a real WebAuthn verification and recovery backend,
- the product can keep a pragmatic fallback while adoption grows.

Avoid this pattern when:

- the team wants a client-only login trick with no server ceremony,
- no one owns account recovery or credential-support operations,
- deleting the password is more important than keeping users able to sign in.

Because yes, there is no password to steal. There is still an account to recover at 2 a.m.

## Next Logical Topic

After this, the best follow-up is:
**Cross-device credential handoff and digital identity presentation**
(QR-based hybrid transport, wallet credentials, and the part where the browser has to negotiate with a device it does not own).
