# Use Case 61: Web MIDI for Browser Control in Audio and Show Systems

MIDI hardware is old, reliable, and everywhere in music/production workflows.
Web MIDI brings it into browser tooling.

This use case covers browser-based MIDI input/output integration for creative and operational control.

## Why this is hard

Timing matters.
Device behavior differs.
And users expect desktop DAW reliability from a browser tab.

## User Story (Abstracted)

A user can:

- connect MIDI controllers/devices,
- trigger app actions or sound events,
- maintain low-latency control during sessions.

## Core Browser Technologies

- Web MIDI API input/output ports.
- Mapping layer (device -> command abstraction).
- Real-time scheduling and jitter tolerance strategy.

## Browser Reality Check

- not universally supported across all engines
- permission and device access behavior differs
- fallback to keyboard/mouse mapping is required

## What breaks first

- hard-coding one vendor's message layout
- no handling for hot-plug/disconnect
- processing everything on main thread
- missing rate limits on high-frequency controller streams

## Minimal Blueprint

1. Discover ports dynamically and map by capability.
2. Use profile-based mapping with user override.
3. Move heavy processing off critical UI path.
4. Handle connect/disconnect and port rename events.
5. Persist mappings per workspace/profile.

## Test Matrix

- multiple controller vendors
- rapid control-change floods
- unplug/replug mid-performance
- browser restart with device state restore

## Decision Summary

Web MIDI is powerful in specialist domains.
It should ship with explicit compatibility boundaries and robust fallback controls.
