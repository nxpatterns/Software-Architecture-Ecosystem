# Use Case 88: Scroll-Driven Animations Without a Scroll Event Listener

A reading-progress bar that fills as the user scrolls. A parallax effect. An element that fades in as it enters the viewport. All of it has traditionally meant a `scroll` event listener, throttled or debounced, running on the main thread, recalculating on every fired event. Scroll-driven animations replace that entire pattern with a CSS `animation-timeline` — the animation's progress is driven directly by scroll position, no JavaScript listener involved at all.

## Why Scroll Listeners Were Always a Performance Trap

Scroll listeners fire constantly. They run on the main thread. The naive version — recalculating layout or style on every event — causes jank on exactly the low-end devices that need it least. Scroll-driven animations move that entire relationship into the browser's own compositor, off the main thread, which is both faster and structurally immune to the jank a hand-rolled listener tends to introduce.

## The User Story, Stripped of Domain

A user can:

- see an element's animation progress tied directly to how far they've scrolled, not to elapsed time,
- experience smooth parallax, reveal, or progress-bar effects with no visible stutter,
- get `prefers-reduced-motion` respected the same way any other CSS animation would be, since this is still just an animation underneath.

## Core Browser Technologies

| CSS Feature | Job | Reference |
|---|---|---|
| `animation-timeline: scroll()` | Ties animation progress to a scrollable container's position | [MDN – CSS scroll-driven animations](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_scroll-driven_animations) |
| `animation-timeline: view()` | Ties animation progress to an element's position within the viewport | [MDN – CSS scroll-driven animations](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_scroll-driven_animations) |
| `@keyframes` | The existing animation definition mechanism, unchanged — only the timeline source is new | [MDN – @keyframes](https://developer.mozilla.org/en-US/docs/Web/CSS/@keyframes) |
| `prefers-reduced-motion` | Still applies, since this remains a standard CSS animation underneath | [MDN – prefers-reduced-motion](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion) |

## The Browser Reality Check

Chrome and Edge shipped this unflagged all the way back in Chrome 115, July 2023 — two years of runway by the time most teams are evaluating it in 2026.<sup>[1]</sup> Safari landed the feature in Safari 26 (September 2025), added threaded scroll-driven animations in 26.4, and cleaned up a batch of progress-accuracy and playback-state bugs in Safari 26.5 in mid-2026 — two of the three major engines, Blink and WebKit, now genuinely agree.<sup>[1]</sup>

Firefox is the asterisk. As of Firefox 152 (June 2026), the feature still sits behind the `layout.css.scroll-driven-animations.enabled` flag in stable — on by default in Nightly, and a named Interop 2026 priority, so Mozilla's direction is clear, but it isn't shipped in stable yet.<sup>[1]</sup> Global support as measured by caniuse sits around 82.6 percent — close to universal, not quite there, and specifically not technically "Baseline" precisely because Firefox stable hasn't flipped the switch.<sup>[1]</sup>

Framework note: GSAP's ScrollTrigger still covers real gaps CSS scroll-driven animations can't touch — scrub animations, pin behaviors, and complex choreographed timelines. For simple enter/exit and progress effects, CSS is genuinely sufficient; for complex sequenced animation work, GSAP remains the better tool.<sup>[2]</sup>

## What Breaks First

- Assuming this is fully cross-browser today because Chrome and Safari both ship it — Firefox stable is still behind a flag, and "82 percent global support" is a real, present gap, not a rounding error.
- Ignoring `prefers-reduced-motion` because the animation is "just scroll-linked" rather than time-based — it's still an animation, and the same accessibility rule from Use Case 56 applies here without exception.
- Reaching for scroll-driven animations to replicate GSAP-level scrub and pin behavior, then discovering the CSS primitive genuinely doesn't cover that complexity yet.
- Treating this as a drop-in replacement for a scroll listener everywhere, when some interactions still need the precise, arbitrary logic only JavaScript provides.

## Minimal Technical Blueprint

```css
@keyframes fade-in {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

.reveal-on-scroll {
  animation: fade-in linear;
  animation-timeline: view(); /* progress tied to entering the viewport */
  animation-range: entry 0% cover 40%;
}

@media (prefers-reduced-motion: reduce) {
  .reveal-on-scroll { animation: none; } /* same rule as any other CSS animation */
}
```
```javascript
if (!CSS.supports('animation-timeline', 'scroll()')) {
  loadJSScrollFallback(); // Firefox stable, until it ships
}
```

1. Feature-detect with `CSS.supports('animation-timeline', 'scroll()')` before relying on it as the sole implementation — Firefox stable users need a real fallback, not a missing effect.
2. Use `scroll()` for container-relative progress (a reading bar) and `view()` for viewport-relative progress (an element revealing as it enters view) — they answer different questions.
3. Always pair with `prefers-reduced-motion` handling, exactly as any other CSS animation requires.
4. Reach for GSAP or an equivalent JS library specifically for scrub, pin, or complex multi-stage choreography — CSS scroll-driven animations aren't trying to replace that tier of complexity.
5. Treat this as progressive enhancement in production: it degrades safely when unsupported, since an element simply keeps its default styling rather than breaking anything.

## Compatibility Strategy

**Baseline:** static styling with no scroll-linked effect, or a lightweight JS fallback where the effect is genuinely important to the design.

**Enhanced:** native `animation-timeline`-driven effects in Chrome, Edge, and Safari today, with Firefox catching up under Interop 2026 — a strong progressive-enhancement candidate precisely because failure mode is "no effect," not "broken layout."

## Decision Summary

Use this for simple, scroll-linked visual effects — reveal-on-scroll, progress indicators, basic parallax — where graceful degradation on Firefox stable is acceptable.

Reach for GSAP or another JS animation library when the choreography is genuinely complex — scrubbing, pinning, multi-element sequenced timelines — since that's real, current territory CSS scroll-driven animations don't yet cover.

---

[1]: Cross-browser support timeline, Firefox flag status, and global support percentage, [BuildMVPFast – CSS Scroll-Driven Animations: Ditch Scroll JS](https://www.buildmvpfast.com/blog/css-scroll-driven-animations-replace-js-2026).
[2]: GSAP ScrollTrigger vs. CSS scroll-driven animations capability gap, [Locally Lost – CSS Innovations 2026](https://locallylost.com/guides/css-innovations-2026-features-that-replace-javascript/).
