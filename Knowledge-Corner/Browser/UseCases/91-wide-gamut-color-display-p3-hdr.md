# Use Case 91: Wide Gamut Color (Display P3) and HDR in CSS

`#ff0000` isn't the reddest red a modern screen can show. Every iPhone since the 7, every MacBook since 2016, and most flagship Android devices support Display P3 — a color space covering roughly 50% more colors than sRGB. Specify colors in plain sRGB and the app is voluntarily leaving vivid greens, deep reds, and saturated cyans on the table on hardware that could render them.

## Why sRGB Was Always a Compromise, Not a Ceiling

sRGB became the web's default color space because it matched what monitors could display decades ago. Modern displays moved past that ceiling years ago. The web platform's color model didn't catch up until CSS Color Module 4 gave developers a way to actually reach the wider gamut those screens support.

## The User Story, Stripped of Domain

A user can:

- see genuinely more vivid, saturated colors on a P3-capable display — a product photo, a brand color, a data visualization,
- get a sensible, correctly gamut-mapped color on an older sRGB-only screen instead of a broken or clipped result,
- experience HDR video or imagery rendered with real dynamic range on capable hardware.

## Core Browser Technologies

| CSS Feature | Job | Reference |
|---|---|---|
| `color(display-p3 r g b)` | Specifies a color directly in the Display P3 gamut | [MDN – color()](https://developer.mozilla.org/en-US/docs/Web/CSS/color_value/color) |
| `@media (color-gamut: p3)` | Detects P3-capable displays for progressive enhancement | [MDN – color-gamut](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/color-gamut) |
| `@media (dynamic-range: high)` | Detects HDR-capable displays | [MDN – dynamic-range](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/dynamic-range) |
| `oklch()`/`oklab()` (Use Case 92) | Color spaces that can express P3-gamut colors with perceptual uniformity | [MDN - oklch()](https://developer.mozilla.org/en-US/docs/Web/CSS/color_value/oklch), [MDN - oklab()](https://developer.mozilla.org/en-US/docs/Web/CSS/color_value/oklab) |

## The Browser Reality Check

Wide-gamut CSS color support is broad across evergreen browsers as of 2026 — Display P3 color specification and the `color-gamut` media query both ship in Chrome, Edge, Safari, and Firefox.<sup>[1]</sup> Safari and the broader Apple ecosystem have supported P3 the longest, unsurprising given how long Apple's own hardware has shipped P3 displays; Chromium and Firefox have closed that gap.

The practical caveat isn't support, it's gamut mapping: not every screen the app runs on is P3-capable, and browsers automatically map an out-of-gamut color down to what a narrower display can actually show. That automatic mapping is reasonable but not always what a design intended — a color authored to look vivid on P3 can render duller than expected once clamped to sRGB, and the only way to know is to actually test on both.

## What Breaks First

- Specifying every brand color in `display-p3` with no sRGB fallback, leaving older or non-Apple displays with an unpredictable clamped result instead of an intentional fallback color.
- Assuming `color-gamut: p3` support means the *content* — a photo, a video — is actually encoded in P3; the display capability and the asset's own color profile are two separate things.
- Pushing chroma values high enough that the color is physically undisplayable on any current hardware, relying on the browser's automatic clamping instead of choosing an intentional, testable value.
- Treating HDR support as a simple on/off switch — `dynamic-range: high` tells you the display *can* show HDR, not that the current content, video codec, and OS-level tone mapping are all actually cooperating.

## Minimal Technical Blueprint

```css
.brand-accent {
  background: #d4145a; /* sRGB-safe fallback, always declared first */
}

@media (color-gamut: p3) {
  .brand-accent {
    background: color(display-p3 0.83 0.08 0.35); /* richer on capable displays */
  }
}
```

1. Always declare an sRGB fallback color first, letting the browser simply ignore the P3-enhanced rule on screens that can't use it — the cascade handles this without any JavaScript.
2. Use `@media (color-gamut: p3)` for progressive enhancement of specifically high-value, brand-critical colors — not as a wholesale palette replacement.
3. Test any wide-gamut color choice on both a P3 display and a standard sRGB monitor before treating it as final; the clamped fallback result needs to look intentional, not accidentally muted.
4. For photography or video content, verify the asset itself is actually authored in a wide-gamut color profile — displaying a P3-tagged container around sRGB-sourced content gains nothing.

## Decision Summary

Use wide-gamut color for brand-critical visuals, photography-heavy interfaces, and any product where color fidelity is part of the value proposition — most modern hardware in the wild can already render it.

Skip it, or keep it strictly as a progressive enhancement, where color accuracy isn't a differentiator — the sRGB baseline still looks correct everywhere, and the P3 layer is a bonus for the hardware that can use it, never a requirement.

---

[1]: Wide-gamut CSS color support across evergreen browsers in 2026, [Modern CSS Tools – Modern CSS Color](https://moderncsstools.com/guides/modern-colors/).
