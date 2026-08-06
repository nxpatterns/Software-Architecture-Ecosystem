# Use Case 03: Live Cursor Presence & Collaborative Editing

Most teams think live collaboration means saving faster.
Put a WebSocket behind the editor, broadcast each keystroke, and call it
Google Docs.

This use case is the less cute version: several people edit the same document,
see who is there, see where everyone is typing, and do not corrupt the result
when messages arrive late, twice, or after a tab wakes up from the dead.

## Why this is a good next "hard topic"

Because real-time editing is distributed systems wearing a tiny cursor hat.
The UI looks obvious; convergence, reconnection, presence expiry, and mobile lifecycle behavior are where the invoice arrives.

## User Story (Abstracted)

A user can:

- open a shared document,
- see other active participants,
- see their cursors and current selections,
- type, delete, and format at the same time as other people,
- briefly lose connectivity,
- reconnect without overwriting newer work,
- open a second tab without becoming two different collaborators,
- and know when another person has left instead of staring at a ghost cursor.

We do not care which document.
Could be a note, a specification, a checklist, a design brief, or a shared
incident timeline. Same concurrency problem.

## Core Browser Technologies

- `WebSocket`: durable client-to-server transport for document operations,
  presence, acknowledgements, and resync requests.
- `WebRTC` / `RTCDataChannel` (optional): peer-to-peer low-latency transport
  for small, ephemeral presence signals when the topology justifies it.
- `CRDT` or Operational Transformation (OT): deterministic merge model for
  concurrent document changes; this is the part that makes "simultaneous"
  mean something.
- `Presence / Awareness protocol`: short-lived state for user identity,
  cursor, selection, colour, and last-seen time; not document content.
- `BroadcastChannel`: same-origin coordination between tabs so one browser
  identity is not blindly duplicated.
- `IndexedDB`: persist the local replica, unsent operations, and last known
  server checkpoint.
- `Page Visibility API`: treat hidden and resumed pages as lifecycle events,
  not as a surprising absence of heartbeats.
- `Web Crypto API` (recommended): protect locally persisted document data and
  authenticate encrypted payloads where the product requires it.

## Browser Reality Check

### Desktop

- Chromium (Chrome, Edge, Arc): `WebSocket`, `RTCDataChannel`, and the
  `BroadcastChannel` coordination path are available, so the full transport
  menu exists ([MDN](https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API), [caniuse](https://caniuse.com/mdn-api_rtcdatachannel), [caniuse](https://caniuse.com/mdn-api_broadcastchannel_broadcastchannel)).
  That does not make a peer connection a free reliability upgrade. Keep the
  server-backed sync path authoritative.
- Firefox: supports the same core transports ([MDN](https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API), [caniuse](https://caniuse.com/mdn-api_rtcdatachannel)).
  For data channels, do not guess at a universal large-message limit: MDN
  documents that user agents can behave differently, including Chrome/Firefox
  combinations ([MDN](https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API/Using_data_channels)).
- Safari (macOS): has the core `RTCDataChannel` capability too
  ([caniuse](https://caniuse.com/mdn-api_rtcdatachannel)). Use the same small,
  idempotent operation envelopes as everywhere else; a green support square
  is not an end-to-end delivery guarantee.

### Mobile

- Android Chromium: real-time pages with WebSocket or WebRTC connections are
  exempt from Chrome's budget-based background timer throttle, but Chrome's
  once-per-second background timer alignment still applies
  ([Chrome for Developers](https://developer.chrome.com/blog/background_tabs)).
  A heartbeat that expects foreground timing is still a bad heartbeat.
- iOS Safari / WebKit-based browsers: WebKit has explicitly implemented
  suspension of background, non-visible tabs where possible
  ([WebKit bug 150515](https://bugs.webkit.org/show_bug.cgi?id=150515)). Treat
  backgrounding, locking the phone, and app switching as a disconnect horizon:
  persist before it happens, then reconnect and reconcile on return.

Short version: WebSocket gives you a pipe.
A CRDT gives you a story when the pipe disappears.

## What Usually Breaks First

- Broadcasting raw editor HTML and pretending that is a merge algorithm.
- Treating cursor position as a character offset after concurrent edits move
  every character underneath it.
- Putting presence into durable document history, then wondering why every
  saved document contains an archaeological record of cursors.
- Treating a WebSocket `open` event as proof that missed operations were
  recovered.
- Sending huge CRDT updates over a data channel and discovering that message
  limits are an interoperability problem, not a vibes problem
  ([MDN](https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API/Using_data_channels)).
- Letting every tab open its own transport and duplicate every operation.
- Using a timer-only heartbeat while the browser is allowed to throttle or
  suspend the page.

## Minimal Technical Blueprint

1. Choose a document model with stable item identifiers, then use a CRDT or
   OT implementation that can transform/merge operations against that model.
2. Keep a local replica in memory and store its checkpoint plus unsent,
   idempotent operations in IndexedDB.
3. Send document operations over a server-authoritative WebSocket connection,
   with operation IDs, document revision/checkpoint IDs, and acknowledgements.
4. Keep presence in a separate awareness channel: participant ID, display
   metadata, selection anchors, focus state, and expiry timestamp.
5. Represent a cursor or selection with CRDT/OT-relative positions, never a
   naked integer offset that becomes fiction after the next remote insert.
6. Use `BroadcastChannel` to elect or coordinate a per-browser connection;
   tabs relay local work and awareness without impersonating separate users.
7. On `visibilitychange`, snapshot local state and reduce optimistic
   heartbeat assumptions. On resume or socket close, reconnect with backoff,
   request the server checkpoint, apply missed operations, then replay only
   unacknowledged local work.
8. If using `RTCDataChannel`, reserve it for small, disposable presence
   messages. Use the WebSocket path as fallback and source of truth, and
   chunk or reject oversize payloads.

## Compatibility Strategy (Pragmatic)

- Baseline mode (all modern browsers): WebSocket-backed sync, CRDT/OT merge,
  IndexedDB recovery, explicit reconnection, and remote cursors rendered from
  server-relayed awareness.
- Enhanced mode (supporting browsers): `BroadcastChannel` tab coordination
  and optional `RTCDataChannel` acceleration for ephemeral presence. The core
  document must remain correct when either enhancement vanishes.

This is progressive enhancement, not peer-to-peer cosplay.

## Security and Compliance Notes

- Presence is personal data. Keep it minimal: display name, avatar reference,
  selection state, and a short expiry are usually enough.
- Authorize every document subscription server-side. A room ID is not an
  access-control system.
- Treat CRDT updates and awareness payloads as untrusted input; enforce size,
  schema, rate, and membership limits before fan-out.
- `RTCDataChannel` traffic is protected with DTLS, but that does not remove
  the need for product-level authorization or retention rules
  ([MDN](https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API/Using_data_channels)).
- Provide a clear policy for locally stored document replicas on shared
  devices, including logout cleanup and retention.

Real-time collaboration without authorization is just a very efficient leak.

## Test Matrix You Actually Need

- Desktop Chrome/Edge with two users editing the same paragraph at once.
- Firefox latest paired with Chromium, including deliberately oversize
  `RTCDataChannel` payloads and fragmented operation batches.
- Safari macOS latest with WebSocket-only mode and optional data-channel mode.
- Two tabs in one browser: edit in both, close one, reload one, then verify
  identity, queue, and presence stay sane.
- Android Chromium: background the tab long enough to observe timer drift,
  then return and verify resync rather than blind replay.
- iOS Safari on a real device: lock the phone, switch apps, return through a
  poor network, and verify that stale cursors expire and the replica heals.
- Server restart and network handoff (Wi-Fi to cellular) while two users edit.

If your test plan never closes a laptop or locks a phone, it is testing a
chat demo, not collaboration.

## Decision Summary

Use this pattern when:

- several people genuinely need to edit the same thing at the same time,
- losing or overwriting edits is unacceptable,
- presence and visible coordination reduce real user confusion.

Avoid this pattern when:

- occasional comments or a record lock would solve the actual problem,
- the product cannot fund a real merge model, reconnection logic, and
  cross-device testing.

Because yes, it is "just a cursor." And no, the cursor is not the hard part.

## Next Logical Topic

After this, the best follow-up is:
**Rich-text editor with reliable undo/redo**
(selection mapping, `beforeinput`, composition events, and why browser editing
commands are not a document model).
