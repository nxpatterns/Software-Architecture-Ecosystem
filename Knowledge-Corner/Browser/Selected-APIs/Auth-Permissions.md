# Special Web APIs Today: The Login-and-Permission Stack (August 2026)

Five APIs, one theme: the browser is done pretending it doesn't know who you are or what you've allowed. WebAuthn kills the password. The Signal API cleans up after WebAuthn's mess. Credential Management is the API family both of them live inside. Permissions API tells your code what the user already decided. Permissions Policy tells the browser what your code is even allowed to ask for.

Five APIs. One supply chain of trust, from "who are you" to "what can you touch."

---

## 1. Web Authentication API (WebAuthn) — the password's replacement, now legally an adult

WebAuthn lets a site register and verify public-key credentials instead of passwords. The private key never leaves the authenticator — a security key, your phone, the OS keychain. The browser signs a challenge, the server checks the signature, nobody typed "Passw0rt!" into a phishing page shaped like your bank.

**Where it stands:** WebAuthn Level 3 was published as a Candidate Recommendation Snapshot on 26 May 2026 and is now on the path to full W3C Recommendation<cite index="45-1">, defining an API enabling the creation and use of strong, attested, scoped, public key-based credentials by web applications, for the purpose of strongly authenticating users</cite>. This isn't a new API landing — it's the existing one getting its final signature on the paperwork. Support across Chrome, Edge, Safari, and Firefox has been solid for years; the frontier has moved to the details.

### The moving parts worth knowing

**Discoverable vs. non-discoverable credentials.** A discoverable (resident) credential lives on the authenticator and can be offered by autofill without the site typing a username first. A non-discoverable credential leaves the private material — <cite index="43-1">username and relying party ID</cite> — on the server, encrypted, and the credential ID has to be sent back before anything happens. Passkeys are the discoverable flavor. If you're building "sign in with no username field," discoverable is the one you want.

**Conditional mediation (autofill UI).** Tag the username field `autocomplete="username webauthn"`, call `get()` with `mediation: 'conditional'`, and passkeys show up in the browser's native autofill dropdown next to saved passwords<cite index="43-2">, inviting the user to sign in with an autocomplete value of "webauthn" on the username field</cite>. This is the bridge feature — it lets a passkey and a password coexist on the same login form without you building two separate UIs and hoping the user picks the sane one.

**Immediate mediation (`uiMode: 'immediate'`).** The newest addition, and genuinely useful. The spec's field name changed from the original proposal — worth knowing if you're reading an article written before November 2025, because it'll be wrong. The idea: one "Sign In" button, and the browser tells you *before* any prompt whether a usable credential exists locally<cite index="39-1,39-2">, checking for local passkeys before showing any UI, with a native modal appearing only if a passkey exists</cite>. No usable credential, no modal — you fall through to whatever else you offer. Chrome shipped this as "Immediate UI Mode" starting from Chrome 149<cite index="42-2">, letting a website check for credentials the moment a user navigates to the site, with the browser mediating a sign-in dialog immediately if a passkey or password is available</cite>. This is the end of the "three login buttons and a prayer" era of sign-in page design.

**`getClientCapabilities()`.** Feature detection used to mean testing five different things and hoping the browser wasn't lying. Now there's one call: <cite index="3-2">`PublicKeyCredential.getClientCapabilities()` lets relying parties determine which WebAuthn features are supported by the browser, returning a promise that resolves to an object with a boolean for each capability</cite>. Query once, branch your UI once. This shipped specifically because the alternative — a pile of nested `if` statements testing for methods that may or may not exist — was making everyone's authentication code look like a crime scene.

### What's deprecated

Nothing in WebAuthn core itself is deprecated — it's additive. What's dying around it: `FederatedCredential` (see section 3) and the assumption that passwords are the default and passkeys are the experiment. That assumption is now backwards, and your login form's visual hierarchy should reflect it.

### Use case: the "smart button" pattern

```javascript
// Immediate mediation: ask before showing UI
try {
  const cred = await navigator.credentials.get({
    publicKey: { challenge, rpId: "example.com" },
    mediation: "conditional", // or check uiMode support via getClientCapabilities()
  });
  // credential found silently — sign in
} catch (err) {
  // NotFoundError-equivalent — fall back to password or registration
}
```

The point isn't the code. The point is that your login page no longer has to guess, in advance, whether the visitor is a passkey user or a password holdout. The browser tells you. Use that.

---

## 2. WebAuthn Signal API — telling the password manager it's wrong

Here's a problem nobody solved for years: a passkey exists in two places, your server's database and the user's password manager (iCloud Keychain, Google Password Manager, 1Password). Revoke it server-side, and the password manager doesn't get the memo. The user taps a passkey that looks perfectly healthy and gets a cryptic failure with no way to self-diagnose<cite index="2-3">, a quiet tax on every passwordless rollout — no crash, no alert, just a user who cannot sign in with a credential that looks valid to them</cite>.

The Signal API is your server's way of reaching back into the credential store and saying "that one's dead, drop it."

### The three signals

- **`signalUnknownCredential()`** — call this after a failed login. It tells the authenticator the credential ID that was just tried is unrecognized by your server and should be removed<cite index="7-1">. It can safely be called while the user is unauthenticated, since it passes only the credential ID the client just tried — no user information required</cite>.
- **`signalAllAcceptedCredentials()`** — tell the provider the full current list of valid credential IDs for a user; anything not on the list gets cleaned up.
- **`signalCurrentUserDetails()`** — sync display name / username changes back to the stored passkey metadata.

### Support, and this is the part that matters

<cite index="2-2">Chrome and Edge have shipped the Signal API on by default since Chrome 132 in January 2025, and Chrome for Android added it in version 144 on December 5, 2025.</cite> <cite index="2-1">Safari and Firefox had not shipped it as of July 2026.</cite> Safari's status is murkier than a flat "no" — <cite index="1-1">Safari 26+ on iOS and macOS is now counted as supporting the Signal API in some benchmarks, even though Safari's own capability-detection flag doesn't reliably report it</cite>, which is a special kind of annoying: the feature might work, but you can't reliably ask the browser whether it does.

Firefox: nothing. Silence. Not even a stated opinion<cite index="9-1">, as Chrome supports the Signal API on all desktop platforms and Android, Safari is supportive but not yet implemented, and Firefox hasn't shared its position</cite>.

**Contract you must respect:** this is best-effort, not a guarantee. <cite index="2-4">The methods return a promise that resolves without reporting whether the provider actually acted on it, and providers decide individually whether to honor a signal</cite>. Treat every call as a polite nudge. Your database stays the source of truth regardless of what the Signal API does or doesn't do on the other end. Never flip a bit in your own system based on the resolution of a signal call — that's not what it tells you.

### Use case

After a failed authentication attempt where the credential ID doesn't match anything in your database:

```javascript
if (PublicKeyCredential.signalUnknownCredential) {
  await PublicKeyCredential.signalUnknownCredential({
    rpId: "example.com",
    credentialId: failedCredentialId,
  });
}
```

Feature-detect first. Half your users' browsers don't have this yet, and the API is explicitly designed to be safely skippable — that's not a workaround, that's the intended failure mode.

---

## 3. Credential Management API — the family WebAuthn grew up in

This is the umbrella spec. `navigator.credentials` is the entry point; `PublicKeyCredential`, `PasswordCredential`, `FederatedCredential`, and `OTPCredential` are the four credential types that hang off it<cite index="15-2">, each represented as a subclass of the base `Credential` interface</cite>.

### What's alive

- **`PasswordCredential`** — lets the browser store and retrieve username/password pairs programmatically, so `navigator.credentials.get()` can hand your login form a saved password without the user typing it. Real, but narrow: <cite index="15-3">most browsers don't actually support this credential type and it isn't widely used on the web</cite>. Treat it as a nice-to-have, not a plan.
- **`PublicKeyCredential`** — this is WebAuthn. Same family, different section of this document.
- **`OTPCredential`** (WebOTP) — solves the "switch to SMS app, copy code, switch back" dance for one-time-password verification.
- **`create()`** — the modern async factory for credential objects, added specifically so you're not stuck constructing `PasswordCredential` and `FederatedCredential` synchronously via constructors<cite index="13-2">, resolving to a Credential object on success</cite>.

### What's dead: `FederatedCredential`

`FederatedCredential` was the original "log in with your Google/Facebook account" mechanism inside this API. It's now explicitly marked deprecated in the spec tables<cite index="11-1">, alongside its living replacement `IdentityCredential`</cite>. The reason is structural, not cosmetic: <cite index="14-1,18-1">the Federated Credential Management API — FedCM — provides a standard mechanism for identity providers to make identity federation available without third-party cookies and redirects</cite>, because third-party cookies, which `FederatedCredential` implicitly leaned on, are the thing the entire browser industry spent the last five years killing.

FedCM is worth its own document. For this one: if you see `FederatedCredential` in a tutorial, the tutorial is old. Use `IdentityCredential` via FedCM instead.

**Also quietly gone:** the custom `fetch()` credential-passing pattern, where you handed a `PasswordCredential` straight into `fetch()`'s `RequestInit`. <cite index="13-1">The attributes `idName`, `passwordName`, and `additionalData` on `PasswordCredential` are deprecated and being removed</cite> in favor of just reading the `password` property and building your form data normally. If your code still does the fancy `fetch(url, { credentials: passwordCredential })` trick — stop, it's on the way out.

A proposed `Credential.revoke()` method never made it past the proposal stage in most browsers and has been withdrawn from the ones that briefly had it<cite index="24-2">, so revocation still isn't part of the API surface — users clear credentials through browser settings, not through your JavaScript</cite>.

### Use case

```javascript
if (window.PasswordCredential) {
  const cred = await navigator.credentials.get({ password: true, mediation: "optional" });
  if (cred) autoFillLoginForm(cred.id, cred.password);
}
```

Skip the exotic fetch-integration pattern entirely. Read the credential, populate your form, submit normally.

---

## 4. Permissions API — asking the browser what the user already decided

Before this API existed, the only way to know if you had camera access was to call `getUserMedia()` and see if it exploded in the user's face with a prompt they didn't expect. The Permissions API lets you ask first: <cite index="24-1">`navigator.permissions.query()` returns a promise that resolves with a `PermissionStatus` for a given feature</cite>, so you can tailor your UI — show an explanation, hide a button, whatever — before triggering anything.

### The shape of it

Three states, always: `granted`, `denied`, `prompt`<cite index="25-1">, with `PermissionStatus` also exposing an `onchange` event for live updates when the state shifts</cite>. `PermissionStatus` itself is <cite index="27-1">Baseline widely available, well established, working across many devices and browser versions since September 2022</cite>. The interface is old and boring. Good — boring means reliable.

**Permission granting isn't always a prompt.** <cite index="24-3">Permission can arrive via a Permission Policy, implicitly through transient activation, or through other mechanisms — not every feature requires the user to see a dialog at all</cite>. This is the seam where the Permissions API and Permissions Policy (next section) actually touch each other: a Permissions-Policy header can pre-grant or pre-deny before the Permissions API is ever queried.

### The Safari gap, still there

<cite index="23-1">Safari has historically had limited support for `navigator.permissions`, and some permission descriptors return inaccurate or intentionally coarse values for privacy reasons</cite>. This isn't a bug you can code around. Feature-detect `navigator.permissions` before use, and don't build UI logic that assumes a specific descriptor resolves correctly everywhere — <cite index="20-1">Chrome supports the most permission types, Safari supports the fewest</cite>, and the gap is deliberate, not an oversight.

**The uncomfortable footnote:** this API is a fingerprinting surface. <cite index="20-2">With sixteen queryable permissions across three possible states each, the theoretical entropy is over 43 million unique combinations</cite>, and <cite index="20-3">the pattern of permission decisions over time — who always denies notifications, who always grants camera access — forms a behavioral signature that's consistent across sites</cite>. That's not a reason to avoid the API. It's a reason browsers keep some descriptors deliberately coarse, and a reason you shouldn't build tracking logic on top of "permission personality" even if the data is sitting right there.

### Use case: don't ask, check first

```javascript
const status = await navigator.permissions.query({ name: "geolocation" });
if (status.state === "granted") {
  showLocalNews();
} else if (status.state === "prompt") {
  showExplainerThenRequest();
} else {
  showManualLocationFallback();
}
status.onchange = () => updateUIFor(status.state);
```

The explainer-before-prompt step is not optional politeness. A permission prompt with no context is the single fastest way to train a user to reflexively click "Block" on everything you ever ask for again.

---

## 5. Permissions Policy — the header that decides what your code is allowed to want

Where the Permissions API reports the user's decision, Permissions Policy is the site operator's decision, enforced before the user is ever asked. It's an HTTP response header (and an `allow` attribute on `<iframe>`) that switches browser features on or off per origin<cite index="29-1">, providing a mechanism to allow and deny the use of browser features in a document or within any iframes it contains</cite>.

### The rename you need to know about

This used to be called `Feature-Policy`. That header is now dead — genuinely dead, not "legacy but supported" dead: <cite index="31-1">the Feature-Policy response header is deprecated, and its W3C specification was abandoned in favor of Permissions-Policy</cite>. The syntax changed along with the name: <cite index="30-1">Feature-Policy used a space-separated list format, while Permissions-Policy uses a structured header format with parentheses and equals signs</cite>. Concretely:

```
# Old — dead spec, don't write new code against this
Feature-Policy: geolocation 'self'

# Current
Permissions-Policy: geolocation=(self)
```

<cite index="32-1">Browsers that support Permissions-Policy ignore Feature-Policy entirely when both headers are present</cite> — so there's no harm in leaving a legacy `Feature-Policy` header around for archaeology purposes, but it's doing nothing for any browser that matters to you in 2026.

A chunk of what Feature-Policy originally tried to cover got split off into a separate `Document-Policy` header, because it turned out feature-availability controls and security-posture controls don't actually want the same syntax or semantics<cite index="35-1">, with many proposed additions not meshing with the existing Feature-Policy behaviour, so those were redefined under Document-Policy instead, focused on configuration rather than security</cite>. Two headers now, not one. If you only remember one thing from this paragraph: `Permissions-Policy` is for feature gating, `Document-Policy` is a different animal with a similar name.

### What it's actually good for

The obvious use is a security baseline — lock down everything you don't use:

```
Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=(), usb=(), bluetooth=()
```

<cite index="34-1">Think of it as a whitelist for browser capabilities</cite> — if you don't use the camera API anywhere on your site, disabling it at the header level means a supply-chain-compromised third-party script can't quietly turn it on either. This is not theoretical hardening. This is the actual attack surface that gets exploited when someone's analytics dependency gets popped.

The less obvious, more current use is bfcache eligibility. Chrome is deprecating `unload` event handlers because they block the back-forward cache, and <cite index="32-2">setting `Permissions-Policy: unload=()` opts a site into that deprecation immediately, guaranteeing bfcache eligibility regardless of the rollout schedule</cite> rather than waiting for Chrome's gradual site-by-site cutover to reach you.

### Debugging it

<cite index="32-3">In Chromium-based browsers, `document.featurePolicy.allowsFeature('camera')` in DevTools console returns true or false for the current context</cite> — the method name still says `featurePolicy` for historical reasons even though you're checking a Permissions-Policy header. Chrome DevTools also has a dedicated Application panel section for viewing the active policy on the current page.

### Iframe inheritance — the part everyone gets wrong

<cite index="37-1">For an iframe to have a feature enabled, its allowed origin must also be in the allowlist of the parent page's header</cite> — permission is an intersection, not an override. An `allow="camera"` attribute on the iframe tag cannot grant a permission the parent page's header already revoked. <cite index="37-2">Because of this inheritance, best practice is to specify the widest acceptable support in the HTTP header, then narrow it per-iframe with the `allow` attribute</cite>. Get this backwards — restrictive header, permissive iframe attribute — and you'll spend an afternoon debugging a feature that "should work" and silently doesn't, because the iframe attribute was never going to win that argument.

---

## Where This Is Going

The five APIs above aren't converging by accident. The direction is: passwords become a fallback, not a default (WebAuthn); credential drift between server and device gets self-healing instead of silently broken (Signal API); federated login sheds its dependency on third-party cookies entirely (FedCM replacing `FederatedCredential`); and permission decisions — both the user's and the site operator's — become queryable and enforceable *before* anything happens rather than discovered by triggering it and seeing what breaks.

The next layer above all of this is the **Digital Credentials API** — <cite index="42-1">a way to request verified data from a user's digital wallet through browser mediation using selective disclosure, so a site can verify a user is over a certain age without ever receiving their full date of birth or legal name</cite>. That's the government-ID-in-your-phone use case (mobile driver's licenses, age verification) landing as a first-class browser primitive, using the same mediation and consent machinery WebAuthn already trained users on. It's the credential family's next member, and it's arriving with the same "browser as trust broker" philosophy running through everything above.

None of this is subtle anymore. The browser wants to be the identity layer. Whether that's a good idea is a different document — this one's just telling you where the APIs currently stand.

---

*Compiled 06 August 2026. Signal API, Immediate Mediation, and WebAuthn L3 status move fast — verify current browser support tables before shipping anything that depends on them.*
