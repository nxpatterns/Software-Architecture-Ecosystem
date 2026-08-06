# Use Case 64: FedCM for Federated Login Without Third-Party Cookies

Federated login used to lean heavily on third-party cookie behavior — an iframe quietly checking whether the user was already signed into Google or Facebook elsewhere. That path is actively collapsing as browsers restrict third-party cookies by default. FedCM (Federated Credential Management) is the browser-native replacement.

## Why This Isn't a Drop-In Button Swap

Identity, privacy, and UX collide here in a way a simple button replacement can't paper over. Treat FedCM as a drop-in swap for the old "Sign in with X" button and the account-linking logic, consent text, and fallback behavior all get missed — three things the old iframe-based flow handled implicitly that FedCM requires handling explicitly.

## The User Story, Stripped of Domain

A user can:

- sign in via an identity provider,
- avoid the cross-site tracking-style plumbing the old approach depended on,
- complete auth through predictable, browser-mediated UI rather than an opaque iframe.

## Core Browser Technologies

| API | Job | Reference |
|---|---|---|
| FedCM API | Browser-mediated federated identity flow | [MDN – FedCM API](https://developer.mozilla.org/en-US/docs/Web/API/FedCM_API) |
| First-party session establishment | The actual session created after the federated assertion | [MDN - Set-Cookie header](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Set-Cookie), [MDN - Secure cookie configuration](https://developer.mozilla.org/en-US/docs/Web/Security/Practical_implementation_guides/Cookies) |
| Cross-tab auth state sync | Same discipline as Use Case 21, applied to a federated login | [MDN – Broadcast Channel API](https://developer.mozilla.org/en-US/docs/Web/API/Broadcast_Channel_API) |

## The Browser Reality Check

FedCM is a genuinely new mechanism, shipped as browsers moved to restrict third-party cookies — it exists specifically to give federated login a path forward that doesn't depend on the cookie behavior being phased out.<sup>[1]</sup> Support and exact UI presentation vary across browsers as the spec and implementations continue to mature; feature-detect and design for graceful absence rather than assuming universal, identical behavior.

## What Breaks First

- Assuming old iframe-and-cookie behavior still applies underneath, when FedCM's entire premise is replacing that mechanism.
- No fallback at all when FedCM is unavailable, leaving users on unsupported browsers with no way to sign in through the federated path.
- A weak account-linking strategy for returning users, so someone who previously signed in via the old flow can't cleanly reconcile with their FedCM-based identity on return.

## Minimal Technical Blueprint

```javascript
async function signInWithFedCM() {
  if (!('IdentityCredential' in window)) return renderFallbackLogin(); // real fallback, not a dead button

  const credential = await navigator.credentials.get({
    identity: { providers: [{ configURL: IDP_CONFIG_URL, clientId: CLIENT_ID }] },
  });
  const session = await establishFirstPartySession(credential); // server verifies the assertion
  broadcastChannel.postMessage({ type: 'login-success', session }); // sync across tabs
}
```

1. Keep the auth backend's IdP/OIDC logic cleanly separated from the browser-mediation layer — FedCM changes how the credential is obtained, not what the server does with it.
2. Feature-detect FedCM and choose the flow at runtime rather than assuming universal availability.
3. Keep a genuine first-party fallback login path for browsers or configurations where FedCM isn't available.
4. Log auth outcomes by mechanism — FedCM versus fallback — so adoption and any mechanism-specific failure pattern is actually visible.

## Decision Summary

FedCM should be treated as a strategic identity migration path, not optional polish — it's the direction federated login is heading as third-party cookies phase out, and a login system still purely dependent on the old mechanism has a shrinking window before it quietly stops working for a growing share of users.

---

[1]: FedCM API overview and purpose, [MDN](https://developer.mozilla.org/en-US/docs/Web/API/FedCM_API).
