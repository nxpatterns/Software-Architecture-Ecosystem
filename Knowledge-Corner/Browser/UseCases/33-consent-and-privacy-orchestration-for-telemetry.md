# Use Case 33: Consent and Privacy Orchestration for Browser Telemetry

Telemetry without consent orchestration is not analytics maturity. It's future legal trouble with charts attached, and the charts don't help the case.

## Why Consent Is Harder to Enforce Than It Sounds

Consent can change at runtime, mid-session, while events are already sitting in a buffer waiting to send. Third-party scripts can load and start their own collection before your policy state has even finished resolving. "Check consent once at startup" was never going to be enough.

## The User Story, Stripped of Domain

A system can:

- enforce consent categories in real time, not just at page load,
- block or purge telemetry that consent doesn't allow,
- keep compliant behavior consistent across tabs and sessions,
- prove policy execution when an audit actually asks for evidence.

## Core Browser Technologies

| API / Practice | Job | Reference |
|---|---|---|
| Consent state store with explicit categories | The single source of truth every producer checks against | — |
| Runtime gate in front of every telemetry producer | No producer fires without checking first | — |
| Queue filtering and purge controls | Already-buffered events get filtered, not just future ones | — |
| Cross-tab consent sync | One consent decision, every open tab, immediately | [MDN – Broadcast Channel API](https://developer.mozilla.org/en-US/docs/Web/API/Broadcast_Channel_API) |
| Auditable policy version tagging | Every event carries the policy version it was collected under | — |

## The Browser Reality Check

This is less a browser-compatibility problem than a timing and coordination one, but the timing problem is genuinely worse on mobile: a backgrounded iOS Safari tab can be suspended mid-flush with a consent-relevant purge only partially applied, and resume later with stale state unless the purge logic is idempotent and re-checked on wake. Every browser here supports `BroadcastChannel` for cross-tab sync, but the actual risk is architectural, not a support gap — a second tab that opened before a consent change propagated is a second tab operating on outdated policy until it explicitly checks again.

## What Breaks First

- Events emitted before consent resolution has actually completed, because the producer didn't wait for a real answer and defaulted to "allowed."
- A partial opt-out that was never mapped cleanly to specific event categories, so "opt out of marketing" accidentally also silences reliability telemetry, or worse, doesn't silence marketing at all.
- Stale consent state sitting in a secondary tab that never received the update from the tab where the user actually changed their preference.
- No purge flow at all for data that was already buffered under the old consent state before a downgrade happened.

## Minimal Technical Blueprint

```javascript
let consentState = null; // never assume a default — resolve explicitly

async function resolveConsent() {
  consentState = await loadConsentState();
  broadcastChannel.onmessage = ({ data }) => {
    consentState = data.consentState;
    purgeDisallowedFromQueue(consentState); // downgrade triggers purge, immediately
  };
}

function emitEvent(name, category, fields) {
  if (!consentState) return bufferUntilResolved(name, category, fields); // wait, don't guess
  if (!consentState.allows(category)) return; // silently blocked, by design
  sendEvent(name, { ...fields, policyVersion: consentState.version });
}
```

1. Classify every event by consent class up front — there is no such thing as an unclassified event in a compliant pipeline.
2. Resolve consent before enabling any non-essential producer. If resolution hasn't finished, buffer — don't guess "allowed" as the default.
3. Gate both emission and transport by consent class, at two separate checkpoints, so a bug in one doesn't silently bypass the other.
4. On any consent downgrade: stop the relevant producers immediately and purge already-buffered disallowed events, not just block future ones.
5. Propagate every consent update across tabs the moment it happens — a stale second tab is a compliance gap with a timestamp on it.
6. Attach the policy version to every emitted telemetry record, so an audit can reconstruct exactly what rules were in effect when any given event was collected.

## Privacy and Compliance

Data minimization by default, not as a target to work toward eventually. Map policy to region explicitly rather than applying one global consent model everywhere and hoping it happens to satisfy every jurisdiction. Maintain an immutable audit trail for every policy change — who changed what, when, and what the new rule actually was — because "we changed the consent logic" is exactly the kind of statement a regulator will ask for evidence of.

## Related APIs to Map in Policy Rules

- Attribution Reporting API
- Topics API / Protected Audience
- Private State Tokens
- FedCM

Each of these interacts with consent and privacy policy differently — map them explicitly into the same governance model rather than treating them as separate, unrelated integrations.

## Test Matrix You Actually Need

- First-load race conditions between page render and consent resolution.
- Consent changes triggered mid-session, with active producers running.
- Multi-tab consent propagation, deliberately tested with tabs opened at different times.
- Offline buffered events followed by a later opt-out — confirm the purge actually reaches the offline queue.
- Jurisdiction-switch scenarios where the product operates across regions with different rules.

## Decision Summary

Use this when telemetry is business-critical and the regulatory exposure is real, not hypothetical.

Avoid any architecture where consent is a UI checkbox with no runtime control system actually enforcing it — a checkbox that doesn't gate anything downstream is a liability with a friendly interface.
