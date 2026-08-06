# Use Case 87: CSS Anchor Positioning for Tooltips and Popovers Without JavaScript

Positioning a tooltip relative to its trigger element, keeping it inside the viewport, and flipping it to the other side when it would overflow — this has required JavaScript for the entire history of the web. Popper.js, then Floating UI, exist entirely because the platform never gave developers a native way to say "put this element next to that one." CSS Anchor Positioning finally does.

## Why a Positioning Library Was Never a Small Dependency

Floating UI, the current standard-bearer, is genuinely well-engineered — and it still runs on every scroll event, every resize, and every DOM mutation to keep a tooltip glued to its trigger. That's real, continuous main-thread work to solve a problem the rendering engine could handle natively, at zero JavaScript cost, if the platform offered a primitive for it.

## The User Story, Stripped of Domain

A user can:

- see a tooltip or popover positioned correctly next to its trigger, automatically,
- watch it flip to the other side near a viewport edge, with no visible flash of incorrect positioning first,
- get all of that even as the page scrolls, with no JavaScript scroll listener running to keep up.

## Core Browser Technologies

| CSS Feature | Job | Reference |
|---|---|---|
| `anchor-name` | Names an element as a positioning anchor | [MDN – CSS anchor positioning](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_anchor_positioning) |
| `position-anchor` + `inset-area`/`anchor()` | Positions an element relative to its named anchor | [MDN – CSS anchor positioning](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_anchor_positioning) |
| `position-try-fallbacks` | Declares fallback positions for viewport-edge overflow | [MDN – CSS anchor positioning](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_anchor_positioning) |
| Popover API (Use Case 57) | Frequently paired with anchor positioning for full tooltip/popover systems | [MDN - Popover API](https://developer.mozilla.org/en-US/docs/Web/API/Popover_API) |

## The Browser Reality Check

This is explicitly not yet at the "safe everywhere" level of `:has()` or Container Queries — it's the feature most likely to bite a team that assumes universal support without checking current numbers first.<sup>[1]</sup>

Chrome and Edge shipped stable, feature-complete support starting at version 125 (mid-2024), with Opera following immediately on the same Chromium base.<sup>[2]</sup> Firefox has the spec implemented and was, as of mid-2026, working through final polish toward a stable release — genuinely close, not yet shipped in stable.<sup>[2][3]</sup> Safari has partial support since Safari 18.x, expanding through the 26.x line, but full parity with Chromium's implementation isn't there yet.<sup>[2]</sup> This is officially an Interop 2026 priority — Blink, WebKit, and Mozilla are jointly committed to bringing it to full, consistent support, which signals real direction but doesn't change what's usable in production today.<sup>[4]</sup>

Tooling lags behind the spec too: component libraries like Radix UI and Headless UI still hard-code Floating UI internally, so adopting native anchor positioning in a project built on either currently means building custom components rather than flipping a config flag.<sup>[2]</sup>

## What Breaks First

- Shipping anchor positioning with no fallback, assuming Chromium's dominant traffic share makes that acceptable, then breaking every tooltip for the entire Firefox and Safari audience.
- Not feature-detecting at all — `@supports (anchor-name: --x)` exists specifically so a JavaScript-based fallback can be served to unsupported browsers instead of a broken layout.
- Assuming `position-try-fallbacks` behaves identically to Floating UI's flip logic — the semantics are related but not a drop-in match, and edge cases differ.
- Relying on component libraries that hard-code Floating UI internally, then being surprised anchor positioning isn't actually engaged anywhere in the app.

## Minimal Technical Blueprint

```css
.trigger {
  anchor-name: --tooltip-anchor;
}

.tooltip {
  position: absolute;
  position-anchor: --tooltip-anchor;
  top: anchor(bottom);
  left: anchor(center);
  position-try-fallbacks: flip-block, flip-inline; /* automatic overflow handling */
}
```

```javascript
if (!CSS.supports('anchor-name: --x')) {
  loadFloatingUIFallback(); // real fallback, not an unstyled tooltip
}
```

1. Feature-detect with `@supports (anchor-name: --x)` before relying on native positioning anywhere in production.
2. Provide a genuine JavaScript-based fallback — Floating UI or equivalent — for unsupported browsers, not a degraded or unstyled tooltip.
3. Use `position-try-fallbacks` to handle viewport-edge overflow natively where supported, rather than reimplementing flip logic in JS on top of it.
4. Audit any component library dependencies for hard-coded Floating UI usage before assuming anchor positioning is actually active anywhere in the app.
5. Revisit the current browser support numbers close to shipping — this is explicitly called out as moving fast, and a decision made months ago may already be stale.

## Compatibility Strategy

**Baseline:** JavaScript-based positioning (Floating UI or equivalent) as the universal fallback, functionally complete on its own.

**Enhanced:** native CSS anchor positioning in Chromium today, with Firefox and Safari catching up through 2026 under the Interop 2026 initiative — genuinely worth adopting now behind a feature check, not worth depending on unconditionally yet.

## Decision Summary

Use this for new projects with Chrome-dominant traffic, where the performance and simplicity win is worth building the feature-detected fallback path.

For legacy or Safari-heavy audiences, Floating UI remains necessary in 2026 — not because anchor positioning is a bad bet long-term, but because "long-term" here is still measured in the current release cycle, not the last one.

---

[1]: Anchor positioning's uneven 2026 support relative to `:has()`/Container Queries, [Alex Cloudstar – Modern CSS in 2026](https://www.alexcloudstar.com/blog/modern-css-2026-features/).
[2]: Cross-browser support timeline and component-library dependency on Floating UI, [Bytee – HTML Anchor Positioning CSS: Should You Use It in 2026?](https://bytee.org/html-anchor-positioning-css-review-2026/).
[3]: Firefox implementation status as of mid-2026, [Locally Lost – CSS Innovations 2026](https://locallylost.com/guides/css-innovations-2026-features-that-replace-javascript/).
[4]: Interop 2026 commitment to full cross-browser Anchor Positioning support, [CSS-Tricks – Interop 2026](https://css-tricks.com/interop-2026/).
