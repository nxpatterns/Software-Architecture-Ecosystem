# Use Case 36: Session Replay Governance and Privacy-Safe Diagnostics

Session replay can be a genuine debugging superpower — watching exactly what a user did instead of reconstructing it from a support ticket. It can also become a compliance nightmare in one careless sprint, the moment a form field with a password or a health question gets captured because nobody added it to the masking list.

## Why Governance Quality Decides Whether Replay Is an Asset or a Liability

Replay systems capture sensitive content, user behavior patterns, and contextual metadata at real scale, by design — that's what makes them useful for debugging and exactly what makes them dangerous without deliberate limits. The technology doesn't decide which side of that line the product ends up on. Governance does.

## The User Story, Stripped of Domain

A team can:

- diagnose UX and error flows faster with real session context,
- protect sensitive user data by design, not by after-the-fact scrubbing,
- control replay scope with an auditable, enforced policy.

## Core Browser Technologies

| Practice | Job | Reference |
|---|---|---|
| DOM/event capture with strict masking | Records interaction without recording everything by default | [MutationObserver (MDN)](https://developer.mozilla.org/en-US/docs/Web/API/MutationObserver), [InputEvent (MDN)](https://developer.mozilla.org/en-US/docs/Web/API/InputEvent) |
| Field-level redaction rules | Sensitive fields excluded at the point of capture, not after | [HTML input password (MDN)](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/input/password), [Autocomplete guide (MDN)](https://developer.mozilla.org/en-US/docs/Web/Security/Practical_implementation_guides/Turning_off_form_autocompletion) |
| Sampling engine by route/risk class | Not every session needs to be recorded, and some never should be | [Sampling (statistics)](https://en.wikipedia.org/wiki/Sampling_(statistics)) |
| Consent-gated replay activation | Replay only runs where consent actually permits it | [Permissions API (MDN)](https://developer.mozilla.org/en-US/docs/Web/API/Permissions_API) |
| Secure transport + retention controls | Replay data handled with the rigor its sensitivity demands | [Secure Contexts (MDN)](https://developer.mozilla.org/en-US/docs/Web/Security/Secure_Contexts), [Storage quotas and eviction criteria (MDN)](https://developer.mozilla.org/en-US/docs/Web/API/Storage_API/Storage_quotas_and_eviction_criteria) |

## The Browser Reality Check

This isn't a browser-compatibility question — DOM capture and masking work consistently across engines. The real risk surface is architectural: a masking rule written against today's form markup breaks silently the moment a UI refactor changes the DOM structure it was targeting, and unlike a broken button, a broken mask fails invisibly. Nobody notices until an audit — or worse, an incident — surfaces a recording that captured exactly the field it was supposed to hide.

## What Breaks First

- Accidental capture of PII or secrets sitting in form fields nobody explicitly excluded.
- All-session replay running with no cost or risk boundary, recording everything because turning it off for low-value flows was never prioritized.
- Replay access with no role-based restriction, so anyone with a login can browse recordings that should have been limited to a specific incident-response team.
- Masking rules that quietly stop working after a UI refactor, with nobody re-verifying them until something sensitive shows up in a recording review.

## Minimal Technical Blueprint

```javascript
const REDACTED_SELECTORS = ['input[type=password]', '[data-sensitive]', '.ssn-field'];

function shouldCaptureNode(node) {
  return !REDACTED_SELECTORS.some(sel => node.matches?.(sel)); // deny-by-default posture
}

function startReplaySession(routeRiskClass) {
  if (!consentAllowsReplay() || !isEligibleRoute(routeRiskClass)) return;
  if (!shouldSample(routeRiskClass)) return; // aggressive sampling on non-critical routes
  initRecorder({ maskSelector: REDACTED_SELECTORS.join(',') });
}
```

1. Define replay eligibility explicitly by feature or risk class — not every route deserves the same recording posture.
2. Default to masked capture, with an explicit allowlist for fields confirmed safe — deny-by-default, not the reverse.
3. Gate replay activation by both consent and jurisdiction, checked at runtime, not assumed from a config file that hasn't been revisited.
4. Apply aggressive sampling on non-critical flows — recording every session of a low-risk page is cost and exposure with little debugging value to show for it.
5. Restrict replay access by role, and audit every single access — a replay viewer log is not optional infrastructure, it's the thing that makes "who looked at this" answerable.
6. Define short retention with actual deletion automation, not a retention policy that exists only as a document.

## Privacy and Compliance

Treat replay as its own sensitive data class, distinct from general analytics — it deserves stricter handling than an aggregate event count ever will. Categorically prohibit secret or token capture; this is not a field to redact after the fact, it's a category to exclude before recording starts. Document the legal basis for replay and exactly what notice users receive about it — "we record sessions" buried in a general privacy policy is a much weaker position than an explicit, specific disclosure.

## Test Matrix You Actually Need

- Redaction regression tests run against every critical form, on a schedule, not just at launch.
- Consent deny and consent-withdrawal scenarios, confirming replay actually stops.
- Role-based access audits, confirming the access list matches who should actually have it.
- Replay payload inspection specifically after UI changes — this is the test most teams skip and the one that catches the masking rule that silently broke.

## Decision Summary

Use this when incident triage speed genuinely matters and the governance maturity to support it already exists.

Avoid it when masking and access control aren't operationally enforced — a replay system with good intentions and no enforcement is a recording of your users' most sensitive moments, sitting somewhere, waiting for the wrong person to find it.
