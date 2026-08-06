# Use Case 27: In-Browser Live Streaming and Real-Time Media Transport

Not the same problem as Use Case 05. That one is capture plus local recording and export. This one is live transport: real-time audio and video moving between two endpoints while both sides are still talking.

## Why Live Media Is Distributed Systems With Cameras Attached

Latency, jitter, packet loss, NAT traversal, codec negotiation, and reconnection behavior decide call quality far more than UI polish ever will. A beautiful video-call interface sitting on top of broken ICE negotiation is still a broken video call.

## The User Story, Stripped of Domain

- join a live session quickly,
- send and receive audio/video at stable quality,
- recover from temporary network degradation without the call dying,
- switch devices mid-session,
- end the session cleanly, with no ghost connection left running.

Telehealth, support calls, virtual classrooms, remote inspections — same transport architecture, different compliance pressure riding on top of it.

## Core Browser Technologies

| API | Job | Reference |
|---|---|---|
| `getUserMedia()` | Local audio/video capture | [MDN](https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia) |
| `RTCPeerConnection` (WebRTC) | Media transport and connection management | [MDN](https://developer.mozilla.org/en-US/docs/Web/API/RTCPeerConnection) |
| ICE/STUN/TURN | Network traversal and relay fallback | [MDN – WebRTC connectivity](https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API/Connectivity) |
| SDP negotiation | Codec and media capability agreement between peers | [MDN – Session lifetime](https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API/Session_lifetime) |
| `RTCDataChannel` (optional) | Low-latency side-channel data alongside the media | [MDN](https://developer.mozilla.org/en-US/docs/Web/API/RTCDataChannel) |
| `RTCPeerConnection.getStats()` | Runtime quality metrics for adaptation and troubleshooting | [MDN](https://developer.mozilla.org/en-US/docs/Web/API/RTCPeerConnection/getStats) |
| `HTMLMediaElement` | Local and remote stream rendering | — |

## The Browser Reality Check

If recording works, that's capture. If live transport survives real network conditions, that's a product.

Chromium, Firefox, and Safari all provide mainstream WebRTC support — the core connection machinery works across all three. The behavioral differences show up in codec defaults, device-switching UX, and edge-case reconnect behavior, which is exactly the part that only surfaces under real network stress, not in a clean office demo.

Android Chromium is generally workable with proper adaptation logic in place. iOS Safari has stricter lifecycle behavior — backgrounding and audio-route changes (a phone call interrupting the session, headphones connecting mid-call) can interrupt assumptions your reconnect logic quietly depended on holding steady.

## What Breaks First

- No TURN capacity planning, so users behind symmetric NAT fail to connect seemingly at random, with no obvious pattern visible from the client side.
- Poor congestion adaptation under variable mobile networks — a call that looked fine on office Wi-Fi degrades badly on a train and nobody built a path for that.
- No renegotiation strategy for device switches, so swapping from a laptop mic to a Bluetooth headset mid-call either breaks the session or silently does nothing.
- Reconnect logic that creates ghost sessions — the old connection never really dies, the new one starts anyway, and now there are two.
- Missing media-state synchronization between the peer connection and backend session state, so the server's idea of "who's in this call" drifts from reality.

## Minimal Technical Blueprint

```javascript
const pc = new RTCPeerConnection({ iceServers: [STUN_SERVER, TURN_SERVER] });

pc.oniceconnectionstatechange = () => {
  if (pc.iceConnectionState === 'disconnected') {
    scheduleReconnect(pc); // don't wait for 'failed' — degraded starts here
  }
};

setInterval(async () => {
  const stats = await pc.getStats();
  const { packetsLost, roundTripTime } = extractQualityMetrics(stats);
  if (packetsLost > THRESHOLD) downgradeVideoQuality(pc); // adapt, don't just log it
}, 2000);
```

1. Separate signaling from media transport cleanly — the signaling channel is your own infrastructure, the media path is WebRTC's, and conflating the two makes debugging either one much harder.
2. Implement ICE with a reliable TURN fallback. STUN alone fails for a meaningful share of real-world network topologies, symmetric NAT chief among them.
3. Track an explicit session state machine: connecting, connected, degraded, reconnecting, ended. "It's either on or off" is not a state machine, it's a guess.
4. Drive quality adaptation policy off real `getStats()` metrics — packet loss, RTT, bitrate — not a fixed quality tier chosen once at connection start and never revisited.
5. Implement deterministic reconnect and peer-replacement paths, tested directly, not assumed to work because the happy path does.
6. Support runtime device switching with proper renegotiation, not a silent stream swap that leaves the far end confused about what changed.
7. Emit quality telemetry for packet loss, RTT, bitrate, and reconnect frequency — this is what turns "calls feel bad sometimes" into an actual, fixable pattern.

## Compatibility Strategy

**Baseline:** audio-first session continuity, conservative video defaults, robust reconnect logic that holds regardless of network quality.

**Enhanced:** higher resolution/framerate tiers, advanced adaptation, data-channel enhancements layered on top.

Correctness belongs to baseline. Enhancement is throughput, not trust — a call that only works well on a great connection was never actually finished.

## Security and Compliance

Enforce authenticated session signaling — an unauthenticated signaling channel is an open door to joining calls that were never meant for the joiner. Protect TURN credentials and rotate them; a leaked TURN credential is a standing relay anyone can abuse. Define retention and access policy for session metadata and diagnostics, and treat call-quality telemetry as potentially sensitive operational data — packet loss and RTT patterns can reveal more about a user's location and network than the number looks like it should.

## Test Matrix You Actually Need

- Desktop and mobile browser matrix under both good and deliberately poor network conditions.
- NAT diversity tests: full cone, restricted, symmetric — all three, not just whatever the office network happens to be.
- Forced reconnect and temporary network loss, triggered on purpose.
- Device switching mid-session — camera, mic, headset — exercised directly.
- Long-call soak tests with memory and resource monitoring, since WebRTC sessions that run for hours surface leaks a five-minute test never will.

Testing on one office Wi-Fi tested a demo. Not live media transport.

## Decision Summary

Use this when real-time interaction is genuinely product-critical. Don't confuse it with local recording architecture — that's Use Case 05, a different problem with a different failure surface, even though both start with the same `getUserMedia()` call.
