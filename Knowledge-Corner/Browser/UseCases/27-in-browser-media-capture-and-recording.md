# Use Case 27: In-Browser Live Streaming and Real-Time Media Transport

This is not the same as local recording.
Use Case 05 is capture plus local recording/export.
This use case is live transport: real-time audio/video sessions between endpoints.

## Why this is a proper "hard topic"

Live media is a distributed systems problem with cameras attached.
Latency, jitter, packet loss, NAT traversal, codec negotiation, and reconnection behavior decide quality far more than UI polish.

## User Story (Abstracted)

A user can:

- join a live session quickly,
- send/receive audio and video with stable quality,
- recover from temporary network degradation,
- switch devices during a session,
- and end the session cleanly.

Could be telehealth, support calls, interview platforms, virtual classrooms, remote inspections.
Same transport architecture.
Different compliance pressure.

## Core Browser Technologies

- `MediaDevices.getUserMedia`: local audio/video capture.
- WebRTC (`RTCPeerConnection`): media transport and connection management.
- ICE/STUN/TURN: network traversal and relay fallback.
- SDP negotiation: codec and media capability agreement.
- `RTCDataChannel` (optional): low-latency side-channel data.
- `getStats()`: runtime quality metrics for adaptation and troubleshooting.
- `HTMLMediaElement`: local and remote stream rendering.

## Browser Reality Check

### Desktop

- Chromium/Firefox/Safari all provide mainstream WebRTC support.
- Behavioral details differ in codec defaults, device switching UX, and edge-case reconnect behavior.

### Mobile

- Android Chromium is generally workable with proper adaptation.
- iOS Safari/WebKit has stricter lifecycle behavior; backgrounding and route changes can interrupt assumptions.

Short version:
If recording works, you have capture.
If live transport survives real network conditions, you have a product.

## What Usually Breaks First

- no TURN capacity planning, then symmetric NAT users fail randomly
- poor congestion adaptation under variable mobile networks
- no renegotiation strategy for device switches
- reconnect logic that creates ghost sessions
- missing media-state synchronization between peers and backend session state

## Minimal Technical Blueprint

1. Separate signaling from media transport cleanly.
2. Implement ICE with reliable TURN fallback.
3. Track session state machine explicitly (connecting, connected, degraded, reconnecting, ended).
4. Use quality adaptation policies based on `getStats()` metrics.
5. Implement deterministic reconnect and peer replacement paths.
6. Support runtime device switching and renegotiation.
7. Emit quality telemetry for packet loss, RTT, bitrate, and reconnect frequency.

## Compatibility Strategy (Pragmatic)

- Baseline mode:
   - audio-first session continuity,
   - conservative video defaults,
   - robust reconnect logic.
- Enhanced mode:
   - higher resolution/framerate tiers,
   - advanced adaptation,
   - data-channel enhancements.

Correctness belongs to baseline.
Enhancement is throughput, not trust.

## Security and Compliance Notes

- enforce authenticated session signaling
- protect TURN credentials and rotation
- define retention and access policy for session metadata/diagnostics
- treat call-quality telemetry as potentially sensitive operational data

## Test Matrix You Actually Need

- desktop and mobile browser matrix under good and poor networks
- NAT diversity tests (full cone, restricted, symmetric)
- forced reconnect and temporary network loss
- device switch mid-session (camera/mic/headset)
- long-call soak tests with memory/resource monitoring

If you only tested on one office Wi-Fi, you tested a demo.
Not live media transport.

## Decision Summary

Use this pattern when real-time interaction is product-critical.
Do not confuse it with local recording architecture.
That is Use Case 05.

## Next Logical Topic

WebCodecs-focused media processing pipeline:
frame-accurate transform/encode workflows beyond `MediaRecorder` defaults.
