# Use Case 15: Single-Tab Enforcement and Multi-Tab Coordination

Most teams treat a browser tab as if it were the user. It isn't. It's one of several optimistic copies of the same UI, each one fully capable of submitting the same order, transfer, approval, or destructive action — completely unaware the other copy exists. This pattern makes the tabs coordinate before the backend has to explain why it charged someone twice.

## Why Disabling One Button Solves Exactly One Tab

The minute a user duplicates the tab, restores a session, or clicks in two windows at once, this stops being a UI problem and becomes distributed systems wearing a form component.

## The User Story, Stripped of Domain

- open the same app in more than one tab or window,
- start an action that must happen exactly once,
- see that another tab already owns or completed it,
- wait for the result instead of firing a second request,
- recover cleanly if the owning tab closes or crashes mid-flight,
- keep using every open tab without stale status pretending to be current truth.

Order submission, payment confirmation, approval, "delete everything" — same coordination problem regardless of the button's label.

## Core Browser Technologies

| API | Job | Reference |
|---|---|---|
| `BroadcastChannel` | Lightweight status/result messages to same-origin tabs | — |
| `navigator.locks` (Web Locks API) | Grants one tab exclusive ownership of a named client-side critical section | — |
| `SharedWorker` (optional) | One same-origin worker as a shared message bus / coordinator | — |
| IndexedDB | Persists operation state and known results across reload | — |
| `fetch()` + server idempotency keys | The server, not tab timing, is the real authority on exactly-once effects | — |
| `AbortController` | Cancel a request before it reaches a meaningful commit point | — |
| `visibilitychange`/`pagehide` | Record state early — a disappearing tab owes nobody a graceful shutdown | — |

## The Browser Reality Check

A modern desktop can coordinate cleanly. An old Safari tab can still make your backend earn its salary.

`BroadcastChannel` and `navigator.locks` are practical baseline primitives in current Chromium — Web Locks has been in Chrome since 69, Chromium Edge since 79.<sup>[1]</sup> Firefox supports both too, with Web Locks starting at Firefox 96 — a long-lived enterprise install can genuinely still need the no-lock fallback path, not as a theoretical edge case but as a real deployed browser.<sup>[1]</sup>

Safari's `SharedWorker` is the historical trap worth knowing by heart: supported in 5–6.1, dropped entirely from 7 through 15.6, restored in 16.0.<sup>[2]</sup> Treat it as an enhancement layer, never the thing actually preventing double submission. Web Locks and `BroadcastChannel` both begin at Safari 15.4.<sup>[1]</sup>

Mobile mirrors desktop capability-wise, with one twist: a tab can be suspended or discarded by the OS while the user is elsewhere entirely, regardless of what your JavaScript intended. The server idempotency key remains the real seat belt through all of it — not the client coordination, which is a courtesy on top.

## What Breaks First

- Assuming a disabled submit button applies to the other tab sitting right next to it.
- Treating `BroadcastChannel` as a mutex. It announces intent. It grants nothing.
- Treating `SharedWorker` as universally available because it worked once, on Chrome, on your laptop.
- Forgetting two tabs can race before either one has even received the other's message — the window between "click" and "broadcast" is real and non-zero.
- Holding a client-side lock open while waiting on an unrelated modal, payment redirect, or user decision that could take minutes.
- Broadcasting an entire order payload or auth token across the channel when a tiny operation ID and status would do the whole job.
- Calling the feature "exactly once" with no server idempotency key backing it up.

A lock can prevent a polite duplicate. The backend has to survive an impolite one regardless.

## Minimal Technical Blueprint

```javascript
async function submitOnce(operationKey, idempotencyKey, payload) {
  if (!('locks' in navigator)) return submitDirect(idempotencyKey, payload); // baseline fallback

  return navigator.locks.request(operationKey, { ifAvailable: true }, async (lock) => {
    if (!lock) {
      subscribeToResult(operationKey); // another tab already owns this
      return;
    }
    await writeState(operationKey, 'in-flight');
    broadcastChannel.postMessage({ operationKey, status: 'in-flight' });
    const result = await fetch('/api/submit', {
      headers: { 'Idempotency-Key': idempotencyKey }, // server is the real authority
      body: JSON.stringify(payload),
    });
    await writeState(operationKey, result.ok ? 'succeeded' : 'failed');
    broadcastChannel.postMessage({ operationKey, status: result.ok ? 'succeeded' : 'failed' });
  });
}
```

1. Define a stable business operation key — `submit-order:<draft-id>`, nothing cleverer needed.
2. Generate one opaque idempotency key per intended operation, persist its local state in IndexedDB: `idle`, `claiming`, `in-flight`, `succeeded`, `failed`.
3. Open a named `BroadcastChannel` and publish only the operation ID, owner tab ID, status, and a result reference — never the payload itself.
4. On submit, feature-detect `navigator.locks` and request an exclusive lock named after the business key. If unavailable, show that another tab is working and subscribe for its result instead of racing it.
5. Once inside the lock callback, write `in-flight` to IndexedDB and broadcast the claim *before* the request goes out, not after.
6. Send the request with the idempotency key. The server records it atomically, replays the original result on repeats, and decides whether the action happens at all — this is the actual guarantee, everything above is convenience.
7. Persist the result, broadcast `succeeded` or `failed`, update every open tab from the durable record — never from whichever response happened to land last.
8. Use `SharedWorker` only as an optional richer coordinator, gated behind feature detection. It improves the experience. It cannot replace the lock-plus-server-idempotency contract underneath it.
9. On restart, read IndexedDB and query the server for unresolved `in-flight` operations. A tab that vanished halfway through is not evidence nothing happened — it's evidence you don't know yet.

## Compatibility Strategy

**Baseline:** prevent repeated clicks on the current page, generate and reuse a server idempotency key, persist enough local state to reconcile after reload, let the server reject or replay duplicates.

**Enhanced:** coordinate same-origin tabs via `BroadcastChannel`, take an exclusive `navigator.locks` lock around the short client-side claim, use `SharedWorker` as a single coordinator only after real feature detection.

The graceful client path is a convenience. The idempotent server path is the actual guarantee, and conflating the two is how "exactly once" quietly becomes "usually once."

## Security and Compliance

Treat channel messages as same-origin but not secret — send identifiers and status, never card data, access tokens, or the submitted payload itself. Make idempotency keys high-entropy, scoped to the authenticated actor and specific action, expired according to the business process rather than left to live forever. Re-check authorization and transaction state server-side on every repeat — a browser lock is coordination, never authorization, and treating it as one is a security review finding waiting to happen. Keep an auditable server record of the original request, final outcome, and idempotency-key reuse wherever regulated actions or payments are involved.

Client coordination without server enforcement is an attractive race condition with a nice UI on top.

## Test Matrix You Actually Need

- Two desktop tabs clicking the same submit control within a few milliseconds of each other.
- One tab claims the operation, then gets reloaded before the HTTP response returns.
- One tab claims the operation, then closes or crashes mid-submission.
- A slow response in tab A while tab B opens from a restored browser session.
- Desktop Chrome/Edge, Firefox, Safari macOS — all three, not just the one that was open during development.
- Current iOS Safari plus a legacy iOS Safari 15.3 device or simulator, deliberately exercising the no-`BroadcastChannel`/no-Web-Locks fallback.
- A request replay against the backend with the same idempotency key, then a different payload reusing that same key — confirm the server actually rejects it.
- A malicious or merely confused second request after every client-side guard has already failed.

If the test ends the moment the second button becomes disabled, you tested cosmetics.

## Decision Summary

Use this when duplicate effects are expensive, irreversible, or embarrassing, when users naturally end up with multiple tabs or windows open, and when the client can offer useful early coordination while the server stays the actual authority underneath it.

Skip it when the action is genuinely harmless to repeat, when the backend can't implement idempotency and reconciliation correctly, or when a single client-side tab is quietly being used as a substitute for a real transaction boundary.

The browser can make duplicate submission much less likely. Two tabs don't get to rewrite the laws of distributed systems just because the UI looked confident.

---

[1]: Web Locks and BroadcastChannel version support, [caniuse – Web Locks](https://caniuse.com/mdn-api_lock), [caniuse – BroadcastChannel](https://caniuse.com/mdn-api_broadcastchannel_broadcastchannel).
[2]: Safari SharedWorker support history, [caniuse – SharedWorker](https://caniuse.com/mdn-api_sharedworker).
