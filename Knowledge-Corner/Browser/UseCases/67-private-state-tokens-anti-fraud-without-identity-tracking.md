# Use Case 67: Private State Tokens for Anti-Fraud Without Identity Tracking

Fraud controls need trust signals — some way to distinguish a legitimate user from an automated abuser. Privacy requirements increasingly reject persistent identity stitching as the mechanism for getting there. Private State Tokens address that exact tension: a trust signal with deliberately low linkability.

## Why Fraud Teams Overcollect by Default

Fraud teams routinely overcollect identity-like data, because more signal has traditionally meant better detection, and the incentive to gather everything available is strong. Private State Tokens require more disciplined signal design in exchange — trust without the identity graph, which is a genuinely harder engineering problem than "just log everything."

## The User Story, Stripped of Domain

A system can:

- evaluate trustworthiness using low-linkability signals,
- reduce abuse pressure without building a persistent identity profile to do it,
- avoid user-level tracking surfaces as the mechanism for fraud prevention.

## Core Browser Technologies

| API | Job | Reference |
|---|---|---|
| Private State Tokens | Cryptographic issuance/redemption flow proving trust without identity | [Chrome for Developers – Private State Tokens](https://developer.chrome.com/docs/privacy-sandbox/private-state-tokens/) |
| Fraud-decision scoring pipeline | Accepts non-identity trust signals as scoring input | [NIST AI Risk Management Framework (risk scoring concepts)](https://www.nist.gov/itl/ai-risk-management-framework), [ROC curve (Wikipedia)](https://en.wikipedia.org/wiki/Receiver_operating_characteristic) |
| Auditable policy controls | Governs where token-based decisions are actually allowed to apply | [NIST SP 800-53 AU (Audit and Accountability)](https://csrc.nist.gov/projects/risk-management/sp800-53-controls/release-search#!/family/AU), [Open Policy Agent](https://www.openpolicyagent.org/docs/latest/) |

## The Browser Reality Check

This is a Privacy Sandbox mechanism in the same family as Topics, Protected Audience, and Attribution Reporting (Use Cases 64–66) — a Chromium-native effort to solve a real business problem (fraud signal) without the cross-site identity tracking the old approach relied on.<sup>[1]</sup> As with the other Privacy Sandbox APIs, this is not currently a universal cross-browser mechanism, and a fraud pipeline depending on it exclusively needs a real fallback for browsers where it isn't present.

## What Breaks First

- Trying to map token outcomes back to a stable identity graph after the fact, defeating the entire privacy premise the tokens were designed around.
- No abuse fallback when the token flow is unavailable, leaving the fraud system blind exactly where a bad actor might deliberately choose to operate.
- A lack of controls around where token-based decisions are actually allowed to apply, letting a low-linkability trust signal quietly get used for a higher-stakes decision than it was ever validated for.

## Minimal Technical Blueprint

```javascript
// Redemption: present a previously issued token as a trust signal
const response = await fetch('/api/action', {
  headers: { 'Sec-Private-State-Token': token }, // proves trust, reveals no identity
});
// The fraud pipeline scores the redemption outcome, not a user profile
```

1. Define explicitly which fraud decisions Private State Tokens are actually allowed to influence — this is a signal input, not a sole determinant for a high-stakes decision.
2. Keep the identity channel and the Private State Token trust channel architecturally separated, so a well-intentioned optimization doesn't quietly rejoin them.
3. Implement fallback risk controls for when the token path is unavailable, so fraud detection doesn't have an obvious, browser-shaped blind spot.
4. Continuously audit false-positive and false-negative outcomes, since a low-linkability signal genuinely behaves differently from the identity-heavy signals most fraud scoring was originally tuned against.

## Decision Summary

Private State Tokens help reduce dependency on identity-heavy anti-fraud infrastructure. They are not a universal fraud silver bullet — treating a deliberately low-linkability signal as a complete replacement for a mature fraud stack is how a genuinely useful privacy-preserving tool gets blamed for gaps it was never designed to cover alone.

---

[1]: Private State Tokens design and purpose, [Chrome for Developers](https://developer.chrome.com/docs/privacy-sandbox/private-state-tokens/).
