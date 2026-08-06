# Use Case 60: Payment Request API for Checkout Friction Reduction

Checkout abandonment is expensive. Form friction — re-typing a card number and address for the tenth site this month — is one of the most reliable causes.

This covers the Payment Request API as a browser-native checkout accelerator, and where its own history should make you cautious about betting the whole checkout flow on it.

## Why Payment Flows Punish Optimism

Payment flows are business-critical and compliance-heavy by nature. Browser wallet UX differs by platform, and fallback behavior has to be flawless — a failed payment flow with no graceful recovery isn't a UX nitpick, it's lost revenue and a support ticket in the same moment.

## The User Story, Stripped of Domain

A user can:

- complete payment with fewer manual fields,
- use a trusted browser or device payment surface instead of retyping everything,
- recover cleanly if the payment flow gets canceled partway through.

## Core Browser Technologies

| API | Job | Reference |
|---|---|---|
| Payment Request API | Browser-mediated payment method selection and collection | [MDN – PaymentRequest](https://developer.mozilla.org/en-US/docs/Web/API/PaymentRequest) |
| Merchant backend confirmation + idempotency | The server, not the client, confirms a payment actually succeeded | [HTTP Idempotency-Key (IETF draft)](https://datatracker.ietf.org/doc/draft-ietf-httpapi-idempotency-key-header/), [MDN - PaymentResponse.complete()](https://developer.mozilla.org/en-US/docs/Web/API/PaymentResponse/complete) |
| Checkout state machine | Explicit states: initiated, pending, confirmed, failed, canceled | [State pattern](https://en.wikipedia.org/wiki/State_pattern) |

## The Browser Reality Check

This API has already been through one significant contraction worth knowing about: Chrome's built-in "basic-card" payment handler — the one that let the browser collect card details directly — was deprecated and fully removed starting in Chrome 100 (March 2022).<sup>[1]</sup> Today, payment methods are identified by URL instead (`https://google.com/pay`, `https://apple.com/apple-pay`), meaning the API now functions primarily as a router to wallet providers like Google Pay and Apple Pay rather than a generic card-collection tool.

Support and wallet options vary meaningfully by browser, OS, and payment method, and this is not a universal cross-browser feature the way a basic DOM API might be. Never treat its availability as a guaranteed conversion win — it's an accelerator layered on top of a checkout flow that has to work completely without it too.

## What Breaks First

- No idempotency key on repeated payment attempts, risking a double-charge if a request gets retried after an ambiguous network failure.
- Optimistic success UI shown before the backend has actually confirmed the payment — the client cannot be the authority on whether money actually moved.
- Poor handling of cancel and timeout flows, leaving a user stuck in an ambiguous state after backing out of the payment sheet.
- Shipping a wallet-only path with no traditional card-form fallback, locking out anyone without a supported wallet configured.

## Minimal Technical Blueprint

```javascript
checkoutButton.addEventListener('click', async () => {
  if (!window.PaymentRequest) return renderTraditionalCheckout(); // real fallback, always available

  const request = new PaymentRequest(supportedMethods, paymentDetails);
  try {
    const response = await request.show();
    const idempotencyKey = crypto.randomUUID();
    const confirmed = await confirmPaymentServerSide(response, idempotencyKey); // server is the authority
    confirmed ? showSuccess() : showFailureWithRetry();
  } catch {
    renderTraditionalCheckout(); // cancel is a normal outcome, route to the fallback cleanly
  }
});
```

1. Keep payment initiation explicit and user-triggered — never fire the payment sheet automatically.
2. Build a strict state machine: initiated, pending, confirmed, failed, canceled — five distinct states, not a binary success/failure.
3. Confirm payment server-side before rendering any success view — the client's belief that a payment succeeded is not the same thing as it having succeeded.
4. Use idempotency keys on every payment attempt, so a retried request after a network hiccup can't double-charge.
5. Provide a resilient, fully-featured fallback checkout — for the users this API doesn't reach, it needs to be a complete experience, not a degraded one.

## Test Matrix You Actually Need

- Cancel and retry loops, deliberately triggered.
- Network loss immediately after authorization but before confirmation — the exact window where ambiguity is most dangerous.
- Duplicate submit protection, forced under a retried request.
- Cross-browser wallet availability differences, tested directly rather than assumed uniform.

## Decision Summary

Payment Request can genuinely reduce friction. Only when backend correctness is stronger than frontend optimism — a fast checkout that occasionally double-charges or loses a confirmation is worse than a slower one that never does.

---

[1]: Chrome's removal of the "basic-card" payment handler starting in version 100, [Chris Boakes – Working with the Payment Request API](https://chrisboakes.com/working-with-the-payment-request-api/).
