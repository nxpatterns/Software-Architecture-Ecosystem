# Use Case 15: Single-Tab Enforcement and Multi-Tab Coordination

Most teams treat a browser tab as if it were the user.
It is not. It is one of several optimistic copies of the same UI, each fully
capable of submitting the same order, transfer, approval, or destructive action.
This pattern makes the tabs coordinate before the backend has to explain why it charged someone twice.

## Why this is a good next "hard topic"

Because disabling one button solves exactly one tab. The minute a user duplicates
the tab, restores a session, or clicks at the same time in two windows, this becomes
distributed systems wearing a form component.

## User Story (Abstracted)

A user can:

- open the same application in more than one tab or window,
- begin an action that must happen only once,
- see another tab already owns or completed that action,
- wait for the result instead of sending a second request,
- recover cleanly if the owning tab is closed or crashes,
- and continue using every tab without stale status pretending to be truth.

We do not care which action.
Could be an order submission, a payment confirmation, an approval, a record
migration, or "delete everything." Same coordination problem.

## Core Browser Technologies

- `BroadcastChannel`: sends lightweight status and result messages to same-origin tabs.
- `Web Locks API` (`navigator.locks`): grants one tab or worker exclusive ownership of a named client-side critical section.
- `SharedWorker` (optional): one same-origin worker that keeps connected tabs on one message bus and can act as a coordinator.
- `IndexedDB`: persists operation state and known results across a reload or tab replacement.
- `fetch()` plus server idempotency keys: makes the server, not tab timing, the final authority on exactly-once effects.
- `AbortController`: lets the UI cancel a request that has not yet reached a meaningful server-side commit point.
- `visibilitychange` / `pagehide`: records state early; a disappearing tab owes nobody a graceful shutdown.

## Browser Reality Check

### Desktop

- Chromium (Chrome, Edge, Arc): `BroadcastChannel` and `navigator.locks` are practical baseline coordination primitives in current Chromium browsers; the Locks API has been supported in Chrome since 69 and Chromium Edge since 79 ([caniuse](https://caniuse.com/mdn-api_lock)).
- Firefox: current Firefox supports both `BroadcastChannel` and Web Locks; Web Locks support starts at Firefox 96, so a long-lived enterprise install can still need the no-lock fallback ([caniuse](https://caniuse.com/mdn-api_broadcastchannel_broadcastchannel), [caniuse](https://caniuse.com/mdn-api_lock)).
- Safari (macOS): `SharedWorker` is the historical trap: Safari supported it in 5–6.1, dropped it from 7 through 15.6, then restored it in 16.0; treat it as an enhancement, not the thing preventing double submission ([caniuse](https://caniuse.com/mdn-api_sharedworker)). Web Locks and `BroadcastChannel` both begin in Safari 15.4 ([caniuse](https://caniuse.com/mdn-api_lock), [caniuse](https://caniuse.com/mdn-api_broadcastchannel_broadcastchannel)).

### Mobile

- Android Chromium: current Chrome for Android supports `BroadcastChannel`, Web Locks, and SharedWorker, but a tab can still be suspended or discarded while the user is elsewhere; the server idempotency key remains the real seat belt ([caniuse](https://caniuse.com/mdn-api_broadcastchannel_broadcastchannel), [caniuse](https://caniuse.com/mdn-api_lock), [caniuse](https://caniuse.com/mdn-api_sharedworker)).
- iOS Safari / WebKit-based browsers: current releases have all three primitives, but iOS Safari before 15.4 lacks both `BroadcastChannel` and Web Locks, and versions before 16 lack SharedWorker ([caniuse](https://caniuse.com/mdn-api_broadcastchannel_broadcastchannel), [caniuse](https://caniuse.com/mdn-api_lock), [caniuse](https://caniuse.com/mdn-api_sharedworker)). Feature-detect every layer and never make client-side exclusion your only duplicate-action control.

Short version: a modern desktop can coordinate.
An old Safari tab can still make your backend earn its salary.

## What Usually Breaks First

- Assuming a disabled submit button applies to the other tab sitting next to it.
- Treating `BroadcastChannel` as a mutex. It announces intent; it does not grant exclusive ownership.
- Treating a `SharedWorker` as universally available because it worked on Chrome.
- Forgetting that two tabs can race before either receives the other tab's message.
- Holding a client-side lock while waiting for an unrelated modal, payment redirect, or user decision.
- Broadcasting an entire order or token when a tiny operation id and status would do.
- Calling the feature "exactly once" without a server idempotency key.

A lock can prevent a polite duplicate.
The backend must survive an impolite one.

## Minimal Technical Blueprint

1. Define a stable business operation key, for example `submit-order:<draft-id>`.
2. Generate one opaque idempotency key per intended operation and store its local
   state in IndexedDB: `idle`, `claiming`, `in-flight`, `succeeded`, or `failed`.
3. Open a named `BroadcastChannel`, such as `operation-coordination`, and publish
   only operation id, owner tab id, status, and result reference.
4. On submit, feature-detect `navigator.locks` and request an exclusive lock named
   after the business operation key. If the lock is unavailable, show that another
   tab is working and subscribe for its result instead of racing it.
5. Once the lock holder is inside the callback, write `in-flight` to IndexedDB and
   broadcast that claim before sending the request.
6. Send the request with the idempotency key. The server records that key atomically,
   returns the original result for repeats, and decides whether the business action
   may happen at all.
7. Persist the result, broadcast `succeeded` or `failed`, then update every open
   tab from the durable record rather than from whichever response arrived last.
8. Use a SharedWorker only as an optional coordinator for richer tab presence and
   message routing. It can improve the experience; it cannot replace the lock plus
   server-side idempotency contract.
9. On restart, read IndexedDB and query the server for unresolved `in-flight`
   operations. A tab that vanished halfway through is not evidence that nothing happened.

## Compatibility Strategy (Pragmatic)

- Baseline mode (all modern browsers):
  - prevent repeated clicks within the current page,
  - generate and reuse a server idempotency key,
  - persist enough local state to reconcile after reload,
  - and let the server reject or replay duplicate operations.
- Enhanced mode (supporting browsers):
  - coordinate same-origin tabs with `BroadcastChannel`,
  - take an exclusive `navigator.locks` lock around the short client-side claim,
  - use a SharedWorker for a single coordinator only after feature detection.

The graceful client path is a convenience.
The idempotent server path is the guarantee.

## Security and Compliance Notes

- Treat channel messages as same-origin but not secret. Send identifiers and state,
  not card data, access tokens, or the submitted payload.
- Make idempotency keys high-entropy, scoped to the authenticated actor and action,
  and expire them according to the business process.
- Re-check authorization and transaction state on the server for every repeat. A
  browser lock is coordination, not authorization.
- Keep an auditable server record of the original request, final outcome, and
  idempotency-key reuse where regulated actions or payments are involved.

Client coordination without server enforcement is just an attractive race condition.

## Test Matrix You Actually Need

- Two desktop tabs click the same submit control within a few milliseconds.
- One tab claims the operation, then is reloaded before the HTTP response returns.
- One tab claims the operation, then is closed or crashes during submission.
- A slow response in tab A while tab B opens from a restored session.
- Desktop Chrome/Edge, Firefox latest, and Safari macOS latest.
- An iPhone or iPad on current iOS Safari, plus a legacy iOS Safari 15.3 device or
  simulator to exercise the no-`BroadcastChannel` / no-Web-Locks fallback ([caniuse](https://caniuse.com/mdn-api_broadcastchannel_broadcastchannel), [caniuse](https://caniuse.com/mdn-api_lock)).
- A request replay against the backend with the same idempotency key and then a
  different payload using that same key.
- A malicious or merely confused second request after every client-side guard has failed.

If the test ends when the second button becomes disabled, you tested cosmetics.

## Decision Summary

Use this pattern when:

- duplicate effects are expensive, irreversible, or embarrassing,
- users naturally open multiple tabs or windows,
- the client can provide useful early coordination while the server remains authoritative.

Avoid this pattern when:

- the action is genuinely harmless to repeat,
- the backend cannot implement idempotency and reconciliation correctly,
- a single client-side tab is being used as a substitute for a transaction boundary.

Because yes, the browser can make duplicate submission much less likely.
And no, two tabs do not get to rewrite the laws of distributed systems.

## Next Logical Topic

After this, the best follow-up is:
**Cross-tab authentication and token refresh coordination**
(one refresh request, expiry races, logout propagation, and why shared browser state is never as shared as the diagram says).
