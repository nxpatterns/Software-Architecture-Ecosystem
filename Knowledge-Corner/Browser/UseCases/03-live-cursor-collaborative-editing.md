# Use Case 03: Live Cursor Presence & Collaborative Editing

Most teams think "real-time collaboration" means a WebSocket, a broadcast of every keystroke, and a demo where two laptops on the same conference Wi-Fi look like Google Docs.

Then someone closes a laptop. Someone else opens a second tab. A phone locks itself in someone's pocket for ninety seconds. And the demo, which worked beautifully in the room, now has three copies of the same paragraph fighting for the same six words.

This is the less cute version: several people edit the same document, see who else is there, see where they're typing, and the result doesn't corrupt itself when messages arrive late, arrive twice, or arrive after a tab that was clinically dead for two minutes wakes back up.

## Why This Is Distributed Systems Wearing a Cursor Hat

The UI is a colored dot with a name tag. Nobody in a design review has ever flagged "convergence guarantees" as a visual bug. That's exactly the problem — the invoice for this feature doesn't arrive in the UI layer, it arrives in reconnection logic, presence expiry, and what happens to a tab when iOS decides it's done with your JavaScript for a while.

## The User Story, Stripped of Domain

- open a shared document,
- see who else is active right now,
- see their cursors and selections, live,
- type, delete, and format simultaneously with other people,
- lose connectivity for a moment,
- reconnect without stomping on work that happened while you were gone,
- open a second tab without the system deciding you're now two different people,
- know when someone actually left, instead of staring at a cursor that's been abandoned for twenty minutes.

Swap "document" for a spec, a checklist, a design brief, an incident timeline. Same concurrency problem wearing a different hat.

## Core Browser Technologies

| API / Concept | Job | Reference |
|---|---|---|
| [WebSocket](https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API) | Durable client-server transport for operations, presence, acks, resync requests | MDN |
| [RTCDataChannel](https://caniuse.com/mdn-api_rtcdatachannel) (optional) | Peer-to-peer low-latency transport for small, disposable presence signals | caniuse |
| CRDT / Operational Transformation | The deterministic merge model that makes "simultaneous" mean something instead of "whoever's packet arrived last wins" | — |
| Presence / awareness protocol | Short-lived state — identity, cursor, selection, color, last-seen — kept explicitly separate from document content | — |
| [BroadcastChannel](https://caniuse.com/mdn-api_broadcastchannel_broadcastchannel) | Same-origin tab coordination so one human doesn't accidentally become three collaborators | caniuse |
| [IndexedDB](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API) | Local replica, unsent operation queue, last known server checkpoint | MDN |
| [Page Visibility API](https://developer.mozilla.org/en-US/docs/Web/API/Page_Visibility_API) | Treats hidden/resumed pages as lifecycle events, not mysterious silence | MDN |
| [Web Crypto API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Crypto_API) | Protects the locally persisted replica where the product needs it | MDN |

For the PMs: row three, the CRDT, is the whole feature. Everything else is plumbing around it. For the specialists: yes, we know OT exists too — pick one, this deck isn't the place to relitigate that argument.

## The Browser Reality Check

**Desktop.** Chromium, Firefox, and Safari all support the core transport pair — WebSocket and RTCDataChannel.<sup>[1]</sup> A green support square is not an end-to-end delivery guarantee, and for data channels specifically, MDN documents that user agents disagree on message-size behavior, including between Chrome and Firefox.<sup>[2]</sup> Don't assume a peer connection is a free reliability upgrade over your server path — it's an optimization, and the server-authoritative sync path stays the source of truth regardless of what the P2P layer is doing.

**Mobile.** Android Chromium exempts real-time pages using WebSocket or WebRTC from the budget-based background timer throttle, but the once-per-second background timer alignment still applies.<sup>[3]</sup> A heartbeat written to assume foreground-tab timing is still a bad heartbeat, exemption or not.

iOS Safari — and everything on iOS, because it's all WebKit — has explicit, documented suspension behavior for background, non-visible tabs.<sup>[4]</sup> Treat backgrounding, locking the phone, and app-switching as a hard disconnect horizon. Persist state before it happens. Reconnect and reconcile when the tab comes back, because "when" is the operative word — "if" was never on the table.

WebSocket gives you a pipe. A CRDT gives you a story to tell when the pipe disappears mid-sentence.

## What Breaks First

- Broadcasting raw editor HTML and calling that a merge algorithm. It isn't. It's a race condition with a font.
- Treating cursor position as a character offset — which becomes fiction the instant a concurrent edit shifts every character underneath it.
- Writing presence into durable document history, then discovering every saved document contains an archaeological record of where everyone's cursor sat in 2024.
- Treating a WebSocket `open` event as proof that missed operations were recovered. It's proof the pipe exists. Nothing more.
- Sending large CRDT updates over a data channel and discovering message-size limits are an interoperability problem, not a vibes problem.<sup>[2]</sup>
- Letting every open tab run its own transport, quietly duplicating every operation the user makes.
- Running a timer-only heartbeat on a page the browser is fully entitled to throttle or suspend without asking.

## Minimal Technical Blueprint

```javascript
// Awareness state: ephemeral, never written to document history.
// Broadcast separately from CRDT operations, expires on its own.
function broadcastPresence(channel, state) {
  channel.postMessage({
    type: 'awareness',
    userId: state.userId,
    selection: state.selectionAnchors,   // CRDT-relative, never a raw offset
    color: state.color,
    expiresAt: Date.now() + 10_000,
  });
}

// On resume: never trust local state alone. Ask the server what actually happened.
async function reconcile(socket, localCheckpoint, pendingOps) {
  socket.send(JSON.stringify({ type: 'resync', since: localCheckpoint }));
  const missed = await waitForServerCheckpoint(socket);
  applyOperations(missed);             // server's version of events, first
  replayUnacknowledged(pendingOps);    // then only what genuinely never arrived
}
```

1. Pick a document model with stable item identifiers, then bring in a CRDT (or OT) implementation that can transform and merge against that model. Don't write your own from scratch for a conference deadline.
2. Keep an in-memory local replica, and persist its checkpoint plus unsent, idempotent operations to IndexedDB — the queue survives a crashed tab even if nothing else does.
3. Send operations over a server-authoritative WebSocket with operation IDs, a document revision/checkpoint ID, and explicit acknowledgements. The server is the referee, same as every other use case in this deck where two clients might disagree.
4. Keep presence in its own awareness channel, entirely separate from document content: participant ID, display metadata, selection anchors, focus state, expiry timestamp.
5. Represent cursors and selections with CRDT-relative positions. A naked integer offset is a lie the moment someone else's insert lands upstream of it.
6. Use BroadcastChannel to coordinate a single per-browser connection across tabs. Tabs relay local work and awareness through it — they don't each impersonate a separate collaborator.
7. On `visibilitychange`, snapshot local state and drop your optimistic heartbeat assumptions. On resume or socket close: reconnect with backoff, request the server checkpoint, apply what was missed, then replay only what genuinely never got acknowledged.
8. If you use RTCDataChannel at all, reserve it for small, disposable presence pings. WebSocket stays the fallback and the source of truth. Chunk or reject oversize payloads rather than discovering the interop cliff in production.

## Compatibility Strategy

**Baseline:** WebSocket-backed sync, CRDT/OT merge, IndexedDB recovery, explicit reconnection, remote cursors rendered from server-relayed awareness. This works everywhere, no asterisks, no browser roulette.

**Enhanced:** BroadcastChannel tab coordination, optional RTCDataChannel acceleration for ephemeral presence only. The document stays correct with zero degradation if either enhancement vanishes — that's the test for whether it's actually an enhancement or a load-bearing dependency wearing a disguise.

This is progressive enhancement. It is not peer-to-peer cosplay.

## Security and Compliance

Presence is personal data, full stop — display name, avatar reference, selection state, a short expiry is usually plenty, and "usually plenty" means resist the urge to add more just because the payload has room.

Authorize every document subscription server-side. A room ID is not an access-control system, it's a string someone can guess or share.

Treat every CRDT update and every awareness payload as untrusted input. Enforce size, schema, rate, and membership limits before fan-out — the fact that it came from an authenticated socket doesn't make the payload trustworthy, it makes the sender identifiable when something goes wrong.

RTCDataChannel traffic is protected by DTLS by default, which is worth knowing and not worth relaxing on.<sup>[2]</sup> Transport encryption is not the same thing as product-level authorization, and nobody's audit checklist accepts the substitution.

Define a clear policy for locally persisted document replicas on shared devices — logout cleanup, retention, the works. Real-time collaboration without authorization isn't a feature. It's a very efficient leak with a nice cursor animation.

## Test Matrix You Actually Need

- Desktop Chrome/Edge, two users editing the same paragraph at the same instant, on purpose.
- Firefox paired against Chromium, including deliberately oversize RTCDataChannel payloads and fragmented operation batches.
- Safari macOS, WebSocket-only mode and optional data-channel mode, separately.
- Two tabs, one browser: edit in both, close one, reload the other, confirm identity, queue, and presence all stay sane.
- Android Chromium: background the tab long enough to see timer drift, return, verify a real resync happens instead of a blind replay of stale operations.
- iOS Safari on a real device: lock the phone, switch apps, come back through a bad network, confirm stale cursors expire and the replica heals itself without help.
- Server restart and a network handoff — Wi-Fi to cellular — while two people are mid-edit.

If your test plan never closes a laptop or locks a phone, you tested a chat demo. Not collaboration.

## Decision Summary

Use this when several people genuinely need to edit the same thing at the same time, losing or silently overwriting work is unacceptable, and visible presence actually reduces confusion instead of adding decoration to the UI.

Skip it when an occasional comment thread or a plain record lock solves the real problem, or when the budget doesn't cover a genuine merge model, reconnection logic, and cross-device testing. Half of this feature — the cursor without the CRDT underneath it — is worse than none of it, because it looks finished right up until the first concurrent edit corrupts something quietly.

It's "just a cursor." The cursor was never the hard part.

---

[1]: WebSocket and RTCDataChannel support, [MDN – WebSockets API](https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API), [caniuse – RTCDataChannel](https://caniuse.com/mdn-api_rtcdatachannel).
[2]: Data channel message-size and encryption behavior, [MDN – Using WebRTC data channels](https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API/Using_data_channels).
[3]: Background tab timer throttling and WebSocket/WebRTC exemption, [Chrome for Developers – Background Tabs](https://developer.chrome.com/blog/background_tabs).
[4]: WebKit background tab suspension, [WebKit Bug 150515](https://bugs.webkit.org/show_bug.cgi?id=150515).
