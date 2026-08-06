# Use Case 66: Topics and Protected Audience for Ad Relevance Without Third-Party Cookies

Ad relevance is still needed as a business function. Cross-site personal tracking is increasingly blocked as a mechanism for delivering it. The Topics API and Protected Audience are the browser-native replacement landscape — deliberately less precise than what they're replacing, by design rather than by accident.

## Why Old Targeting Precision Isn't Coming Back

Business teams expect the old targeting precision — a detailed cross-site identity graph informing exactly what ad someone sees. Browser-native privacy models intentionally reduce that precision as their whole point, not as an unfortunate side effect to be engineered around.

## The User Story, Stripped of Domain

A team can:

- run interest- or audience-based campaign logic,
- align that logic with modern browser privacy constraints rather than fighting them,
- model performance with honest uncertainty instead of borrowed precision from a mechanism that no longer exists.

## Core Browser Technologies

| API | Job | Reference |
|---|---|---|
| Topics API | Coarse, browser-computed interest signals shared with sites | [Chrome for Developers – Topics API](https://developer.chrome.com/docs/privacy-sandbox/topics/) |
| Protected Audience | On-device audience ad selection, replacing third-party remarketing lists | [Chrome for Developers – Protected Audience](https://developer.chrome.com/docs/privacy-sandbox/protected-audience/) |
| Consent and policy controls | Governs where and how these signals may be activated | [MDN - Permissions Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/Permissions_Policy), [Privacy Sandbox - User controls](https://privacysandbox.google.com/overview/user-controls) |

## The Browser Reality Check

Both of these are Privacy Sandbox mechanisms, part of the same broader effort as FedCM and Attribution Reporting (Use Cases 64 and 65) to replace third-party-cookie-based advertising infrastructure with browser-mediated alternatives that preserve more user privacy.<sup>[1][2]</sup> They are Chromium-native initiatives; Firefox and Safari have taken different approaches to the same underlying problem, so a campaign strategy built purely around Topics/Protected Audience is again a Chromium-specific strategy, not a universal one.

## What Breaks First

- Treating topics or audiences as a one-to-one replacement for the old identity graph, when the entire design intent is to be coarser and less individually identifying than what came before.
- Weak governance around who inside the organization can actually activate these signals, letting a well-intentioned team quietly build something closer to the old tracking model than the API was ever meant to support.
- No fallback at all for unsupported environments — a campaign that only works in Chromium needs an honest plan for the rest of the browser landscape.

## Minimal Technical Blueprint

```javascript
// Topics API: request coarse interest signals for this context
const { topics } = await document.browsingTopics();
// topics is a small, coarse set — never a detailed profile

// Protected Audience: on-device ad selection against an interest group
navigator.joinAdInterestGroup(interestGroupConfig, durationSeconds);
```

1. Define explicitly which campaign classes are actually allowed to use Privacy Sandbox paths — not every campaign needs or should reach for these mechanisms.
2. Gate activation by region, policy, and consent, the same governance discipline as any other consent-sensitive telemetry.
3. Keep an explicit fallback for unsupported browsers, rather than letting the campaign silently underperform there with no one noticing why.
4. Evaluate lift using aggregate metrics, never individual-user assumptions the underlying mechanism was specifically designed not to support.

## Decision Summary

Use these APIs as constrained relevance tools, not as identity reconstruction channels — treating them as a clever workaround back to the old precision defeats the purpose they were built for and risks exactly the kind of governance failure that erodes trust in Privacy Sandbox mechanisms generally.

---

[1]: Topics API design and purpose, [Chrome for Developers](https://developer.chrome.com/docs/privacy-sandbox/topics/).
[2]: Protected Audience design and purpose, [Chrome for Developers](https://developer.chrome.com/docs/privacy-sandbox/protected-audience/).
