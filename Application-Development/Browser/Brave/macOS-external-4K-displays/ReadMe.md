# Brave / Chromium:

Pages Appear Larger Than in Other Browsers (macOS + External 4K Display)

## Summary

On macOS with external 4K monitors set to a scaled resolution (e.g. "Larger Text" / 1920x1080),
Brave (and Chromium-based browsers in general) render web pages visibly larger than Firefox or
Safari at the same nominal zoom level (100%).

## Environment

- **Browser:** Brave 1.90.128, Chromium 148.0.7778.217 (arm64 / Apple Silicon)
- **Display setup:** Two external 4K monitors (32"), macOS resolution set to "Larger Text" (scaled 1920x1080)
- **OS:** macOS (Apple Silicon)

## Root Cause

When a 4K display is set to a scaled resolution in macOS Display Settings, macOS renders
internally at a higher resolution and scales down. This produces a non-native HiDPI path that
results in a `devicePixelRatio` that Chromium interprets differently than Gecko (Firefox) or
WebKit (Safari).

Chromium has its own DPI scaling logic that does not follow the macOS scaling path natively,
causing CSS pixels to be mapped slightly differently — resulting in pages appearing zoomed in
compared to other browsers.

**Confirmed:** Setting the display to "Default for Display" makes Brave and Firefox render
pages at the same size, confirming the issue is tied to the scaled resolution mode.

## What Does NOT Help

- Brave default page zoom already at 100% — not the cause
- `#enable-pixel-canvas-recording` flag — no visible effect in this case

## Workaround

Set a global page zoom below 100% in Brave to compensate:

`brave://settings/appearance` → Page zoom → try 90% or 95%

Adjust until pages match Firefox visually on the same site.

## Proper Fix

This is a long-standing Chromium bug. It will not be fixed in Brave independently — it requires
a fix upstream in Chromium.

## Search Terms (for Chromium Bug Tracker)

- `chromium external monitor HiDPI scaling macOS "larger text" zoom`
- `chromium apple silicon external 4K display DPI scaling wrong`
- `chromium macOS devicePixelRatio external monitor wrong`
- Bug tracker: https://bugs.chromium.org — search for "HiDPI external display macOS"
