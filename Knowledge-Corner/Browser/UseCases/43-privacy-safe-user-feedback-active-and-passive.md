# Use Case 43: Privacy-Safe User Feedback Collection (Active and Passive)

You want feedback. You do not want legal drama. Completely reasonable, and also harder to achieve than it sounds, because "harmless" feedback data has a well-documented habit of becoming identifying the moment enough of it gets combined.

This covers collecting useful user feedback while minimizing privacy risk and compliance burden — for both the feedback someone chooses to send and the technical context collected passively alongside it.

## Why "Harmless" Feedback Becomes Identifying Fast

Browser properties, device hints, timestamps, free-text input, and workflow context can combine into fingerprint-level uniqueness surprisingly quickly. Consent helps, genuinely. Consent alone doesn't erase the underlying obligations — a user agreeing to send feedback doesn't automatically mean every field collected alongside it was necessary or proportionate.

## The User Story, Stripped of Domain

A team can:

- collect actionable feedback,
- keep users genuinely in control of what they share,
- minimize personal data exposure by default,
- maintain a defensible compliance posture without over-engineering it.

## Feedback Channels

**Active feedback:** an explicit feedback form the user chooses to submit, in-app rating prompts with optional text, structured issue category forms (bug/performance/UX).

**Passive feedback (privacy-safe):** aggregated, consent-aware technical telemetry, crash/error counters with no personal free-text payload attached, coarse environment capability statistics.

## Core Browser Technologies

| Practice | Job | Reference |
|---|---|---|
| Structured, minimal-field feedback payload | User message and technical context kept in separate blocks | [JSON Schema](https://json-schema.org/) |
| Coarse-grained environment fields | Browser family + major version, not a full UA string | [MDN – User-Agent](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/User-Agent) |
| Consent metadata attached per submission | Ties every payload to the consent state it was collected under | [MDN – Permissions API](https://developer.mozilla.org/en-US/docs/Web/API/Permissions_API) |
| Copy preview before submit | User sees the exact payload before it leaves the device | [MDN – `<dialog>` element](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/dialog) |

## The Browser Reality Check

This is a data-minimization and consent problem, not a browser-compatibility one — every browser can send a coarse or a detailed payload equally easily. The risk lives entirely in what the code chooses to collect, not in what any given browser makes possible. A detailed `navigator.userAgent` string, a full plugin list, or a canvas-based hash are all technically available in every modern browser and are exactly the ingredients that turn a feedback form into an accidental fingerprinting mechanism.

## What Breaks First

- Collecting too many browser or device fields by default, "just in case they're useful for triage."
- Storing raw user text indefinitely with no retention policy attached.
- Mixing diagnostic telemetry and marketing analytics with no clear separation, so a support-triage payload ends up feeding a completely different, less appropriate downstream use.
- An "optional send" button with no clear explanation of what's actually included in that send.

## Minimal Technical Blueprint

```javascript
function buildFeedbackPayload(userMessage, includeTechnicalContext) {
  const payload = {
    message: userMessage || null, // optional, always
    consentTimestamp: Date.now(),
  };
  if (includeTechnicalContext) {
    payload.technical = {
      browserFamily: coarseUserAgent(),   // "Chrome 128", never the full UA string
      viewportBucket: bucketViewport(),   // "desktop-wide", not exact pixels
      featureFlags: relevantFeatureSupport(),
    };
  }
  return payload; // shown to the user as a preview before send
}
```

1. Data minimization first — ask only what actually helps triage or a real product decision, not everything that's technically available to collect.
2. Split the feedback payload into clear blocks: the user's message (optional), technical context (minimal, structured), and consent metadata.
3. Use coarse-grained environment fields: browser family and major version, a viewport bucket, feature-support flags — never a full UA string, full plugin list, or canvas hash.
4. Avoid high-entropy fields entirely unless there's a genuinely specific, documented need for one.
5. Set strict retention and access rules for whatever does get collected.
6. Offer the user a copy preview before submit, so nothing leaves the device that they haven't actually seen.
7. Provide a clear deletion and contact path in the privacy notice.

## The "User-Reviewed Payload" Pattern

A strong baseline pattern: the user sees the exact payload — including technical fields — before choosing to send it, whether through a form preview or literally sending it as an editable email draft. This reduces hidden-collection risk meaningfully, because there's no automatic passive capture of high-entropy fields happening behind the scenes.

This is good, but it isn't automatically "no obligations." What still applies regardless: capability sets can still become fingerprint-like identifiers even when user-reviewed. Lawful basis, purpose limitation, and retention rules still apply to whatever data actually gets sent. Third-party processors and data-transfer regions still matter for wherever the feedback ends up stored.

The better version of this pattern: collect only coarse diagnostics by default, explain every field in plain language the user can actually parse, and allow opting out of the technical appendix separately from the message text — a user might want to report a bug without also sharing their exact viewport size, and the interface should let them make that choice explicitly.

**A practical safe template:** coarse technical fields only (browser family + major version, OS family, viewport bucket), free text always optional, one visible note reading something like "delete any details you don't want to share before sending," and processing through a restricted support inbox with genuinely limited access — not a shared team inbox everyone can browse.

If the payload is coarse and user-editable before send, the approach is generally low-risk and privacy-friendly. Not zero-obligation — but one of the cleanest real-world patterns available for this problem.

## Privacy and Compliance

Keep diagnostic and marketing data strictly separated — a support-triage field should never quietly feed a marketing analytics pipeline, and vice versa. No hidden enrichment with other identifiers after the fact; whatever was collected at submission is what exists, not a starting point for later joins. Document the legal basis and retention windows explicitly. Use EU-hosted processing where the primary user base is EU-based, and apply role-based access to feedback payloads the same way any other sensitive data gets access-controlled.

## Test Matrix You Actually Need

- Consent and off-consent submission paths, both tested directly.
- Payload redaction validation, confirming the preview genuinely matches what's sent.
- Retention deletion workflow checks, confirming data actually ages out on schedule.
- Support access-control audits, confirming the restricted inbox is actually restricted.

## Decision Summary

Use this when real user voice plus technical context is genuinely needed for triage or product decisions.

Avoid "collect everything now, filter later" designs. They're expensive to maintain, genuinely risky from a compliance standpoint, and in most cases entirely unnecessary — the coarse, user-reviewed pattern above covers the vast majority of real triage needs without the exposure.
