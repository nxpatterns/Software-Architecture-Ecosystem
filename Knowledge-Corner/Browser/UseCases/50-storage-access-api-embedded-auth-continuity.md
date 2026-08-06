# Use Case 50: Storage Access API for Embedded Auth Continuity

Embed an app in an iframe, meet modern cookie restrictions, and suddenly "login state" becomes theoretical. This covers controlled storage access in embedded contexts — the actual mechanism browsers offer for legitimate embedded SSO to keep working under third-party cookie restrictions.

## Why Privacy Controls Break Legitimate Patterns Too

Browser privacy controls intentionally break old third-party tracking behavior. Unfortunately, that same restriction breaks legitimate embedded single-sign-on patterns just as thoroughly if the design doesn't account for it deliberately.

## The User Story, Stripped of Domain

A user can:

- stay signed in inside an embedded experience,
- grant storage access explicitly when it's actually needed,
- understand why the access prompt exists rather than being confused by it.

## Core Browser Technologies

| API | Job | Reference |
|---|---|---|
| Storage Access API | Request flow for embedded storage access | [WebKit Blog](https://webkit.org/blog/11545/updates-to-the-storage-access-api/) |
| First-party bootstrap / fallback redirect | A path that works when embedded access is denied | [Privacy Sandbox docs](https://privacysandbox.google.com/cookies/storage-access-api) |
| Consent-aware embedded session orchestration | Session logic that expects denial as a normal outcome | [MDN - Storage Access API](https://developer.mozilla.org/en-US/docs/Web/API/Storage_Access_API), [MDN - Permissions API](https://developer.mozilla.org/en-US/docs/Web/API/Permissions_API) |

## The Browser Reality Check

The concept is broadly supported across engines, but the exact semantics differ meaningfully per browser, and Safari/WebKit is consistently the strictest of the three.<sup>[1]</sup> Test the actual interaction model per engine — the request flow, the prompt behavior, what counts as sufficient user interaction beforehand — rather than treating "the API exists" as equivalent to "the flow works the same everywhere."

## What Breaks First

- Assuming third-party cookies still work by default, when the entire premise of this API is that they no longer reliably do.
- Requesting storage access too early, before a real user gesture, and getting an automatic denial that looks like a bug instead of expected behavior.
- No fallback path at all when the request is denied, leaving the embedded experience simply broken instead of gracefully degraded.
- Hidden auth loops between the iframe and the parent page, where each redirects to the other under slightly different conditions and the user gets stuck bouncing between them.

## Minimal Technical Blueprint

```javascript
async function ensureEmbeddedAuth() {
  if (await document.hasStorageAccess()) return; // already granted, nothing to do

  continueButton.addEventListener('click', async () => {
    try {
      await document.requestStorageAccess(); // must follow a real user gesture
      reloadEmbeddedSession();
    } catch {
      redirectToTopLevelAuthFlow(); // denial is the expected fallback path, not a dead end
    }
  });
}
```

1. Detect the embedded context and current storage state before doing anything else.
2. Ask for access only at a user-meaningful step — a deliberate "Continue" click, never an automatic request fired on load.
3. Explain the prompt in plain language before it appears, so the user understands what they're being asked and why.
4. Implement a real denial fallback — typically opening a top-level auth flow outside the iframe — rather than leaving the embedded experience stuck.
5. Persist the post-grant state and avoid repeated prompting; asking again every session is how users learn to reflexively dismiss the prompt without reading it.

## Test Matrix You Actually Need

- Safari and iOS Safari on real devices — the strictest implementation, and the one most likely to surface an issue no other browser would.
- Chromium privacy modes and tracking-protection settings, tested as their own category.
- Denied and dismissed prompt branches, both handled explicitly.
- A fresh profile versus a returning profile, since prior grants change the flow meaningfully.

## Decision Summary

Use this when embedded auth continuity is a genuine requirement for the product.

Design for denial from day one — it is not an edge case here, it's an expected, common outcome that the entire flow needs a real answer for, not an afterthought bolted on when the first user hits it in production.

---

[1]: Storage Access API cross-browser semantics, [WebKit Blog](https://webkit.org/blog/11545/updates-to-the-storage-access-api/), [Privacy Sandbox](https://privacysandbox.google.com/cookies/storage-access-api).
