# Use Case 61: Web MIDI for Browser Control in Audio and Show Systems

MIDI hardware is old, reliable, and everywhere in music and production workflows. Web MIDI brings that same hardware directly into browser tooling — no driver install, no native app, just a permission prompt and a device list.

This covers browser-based MIDI input/output integration for creative and operational control.

## Why a Browser Tab Has to Behave Like a DAW

Timing matters in a way most web features never have to think about. Device behavior differs across manufacturers. And users bring desktop-DAW expectations of reliability to something running in a browser tab, which is a genuinely higher bar than most web apps are held to.

## The User Story, Stripped of Domain

A user can:

- connect MIDI controllers and devices directly,
- trigger app actions or sound events from physical hardware,
- maintain low-latency control throughout a live session.

## Core Browser Technologies

| API | Job | Reference |
|---|---|---|
| Web MIDI API | Input/output port access to connected MIDI devices | [MDN – Web MIDI API](https://developer.mozilla.org/en-US/docs/Web/API/Web_MIDI_API) |
| Device-to-command mapping layer | Abstracts raw MIDI messages into app-level actions | [MIDI 1.0 Detailed Specification overview](https://midi.org/midi-1-0-detailed-specification), [MDN - MIDIMessageEvent.data](https://developer.mozilla.org/en-US/docs/Web/API/MIDIMessageEvent/data) |
| Real-time scheduling with jitter tolerance | Keeps timing usable despite JS event-loop scheduling limits | [MDN - Web Audio API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API), [MDN - AudioContext.currentTime](https://developer.mozilla.org/en-US/docs/Web/API/BaseAudioContext/currentTime) |

## The Browser Reality Check

Web MIDI is not universally supported across all engines — it's solid in Chromium but has a much thinner history in Firefox and Safari, and permission and device-access behavior differs meaningfully where it is implemented. A fallback to keyboard or mouse mapping isn't optional here; it's the only way the product functions at all outside the browsers where MIDI access actually works.

## What Breaks First

- Hard-coding one vendor's message layout, then discovering a different controller sends slightly different byte patterns for the same logical action.
- No handling at all for hot-plug or disconnect events, leaving the app confused the moment a performer unplugs a controller mid-set.
- Processing every incoming MIDI message on the main thread, introducing exactly the kind of jitter a live performance can't tolerate.
- Missing rate limits on high-frequency controller streams — a modulation wheel or continuous controller can flood messages fast enough to overwhelm naive handling.

## Minimal Technical Blueprint

```javascript
const access = await navigator.requestMIDIAccess();

access.inputs.forEach(input => {
  input.onmidimessage = (event) => {
    const command = mapToCommand(event.data, deviceProfile); // profile-based, never hard-coded
    if (command) scheduleAction(command); // off critical path, jitter-tolerant queue
  };
});

access.onstatechange = (event) => handleDeviceChange(event.port); // hot-plug/disconnect, not an afterthought
```

1. Discover ports dynamically and map by capability rather than assuming a fixed device is always present.
2. Use profile-based mapping with an explicit user override, since no single hard-coded layout survives contact with a second controller brand.
3. Move heavy processing off the critical UI path, keeping message handling as close to real-time as the platform allows.
4. Handle connect, disconnect, and port-rename events directly — a live performance is exactly where a controller gets unplugged without warning.
5. Persist mappings per workspace or profile, so a performer's setup survives between sessions instead of being reconfigured from scratch every time.

## Test Matrix You Actually Need

- Multiple controller vendors, since message layouts and quirks genuinely differ across manufacturers.
- Rapid control-change floods, deliberately stress-testing the message handling path.
- Unplug and replug mid-performance, the exact scenario the hot-plug handling exists for.
- Browser restart with device state restoration, confirming mappings survive a reload.

## Decision Summary

Web MIDI is powerful in specialist domains — live performance tools, browser-based DAWs, show control systems.

It should ship with explicit compatibility boundaries and a robust fallback control scheme, since the audience for this feature is small, technically demanding, and completely unforgiving of jitter or dropped input.
