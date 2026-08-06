# Web Graphics Today — Chapter 2: SVG

*Part of the series "Canvas, SVG, 3D — from the browser's point of view." Status: August 2026.*

---

Chapter 1 was about a technology that refuses to remember anything. This one is about its opposite: a graphics format that *is* the DOM, that the browser parses, styles, lays out, and accessibility-trees exactly like it does a `<div>`. If Canvas is a whiteboard, SVG is a filing cabinet that happens to draw pictures. Every shape is a folder. The browser knows what's in every folder, forever, until you delete it.

That single decision — "a shape is a node, not a pixel" — explains everything SVG is good at and everything it costs you.

---

## 1. What SVG Actually Is (From the Browser's Chair)

SVG is XML. When it's inline in an HTML document, the HTML5 parser reads `<svg>` and everything inside it, and produces real DOM nodes in the `http://www.w3.org/2000/svg` namespace — `SVGCircleElement`, `SVGPathElement`, `SVGRectElement`, all first-class citizens next to your `<div>`s and `<button>`s in the same tree. This is retained-mode rendering: you describe *what exists*, the browser figures out *how to draw it*, and — this is the part Canvas can't do — it keeps figuring that out every time something changes, automatically.

Move a `<circle>`'s `cx` attribute, and the browser re-renders it. You didn't call a redraw function. You didn't clear a buffer. The rendering pipeline — style resolution, then SVG-specific layout (geometry properties resolve into actual coordinates), then paint — runs the same way it would for a CSS `top` change on a positioned `<div>`. Every shape is watched. That's the whole value proposition, and it's also where the performance bill eventually comes due: a browser tracking 200,000 candlestick nodes as live, stylable, event-emitting DOM objects is doing dramatically more bookkeeping than a Canvas surface that forgot each candlestick the instant it was painted. Chapter 1's finance-terminal example wasn't a throwaway line — that's the actual line in the sand between these two APIs.

### A standard that's been "under development" since your kid started school

Worth knowing before anything else, because it explains a lot of confusing caniuse.com entries: **SVG 1.1 is still, technically, the last full W3C Recommendation.** SVG 2 became a Candidate Recommendation back in 2016, and as of today it's still sitting at Editor's Draft status on svgwg.org — "under development," the same words that have described it for most of a decade. It's not stalled out of neglect. Browsers have simply gone ahead and implemented SVG 2 features piecemeal anyway, and the HTML Living Standard just points at "SVG 2 and other applicable specifications" as the actual normative source of truth. The formal SVG 2 REC may never get its stamp; the features shipped years ago regardless. Standards process and shipped reality parted ways a long time back here, and everyone's made peace with it except the people who still cite SVG 1.1 as "the spec."

---

## 2. Two Ways In, and Why the Choice Matters More Than It Looks

You can put SVG in a page three ways, and they are *not* interchangeable, whatever the copy-paste tutorial you're reading implies:

**Inline (`<svg>` directly in the HTML).** Full DOM access. You can select any shape with `querySelector`, attach event listeners, animate individual paths, style them with your page's CSS, and reference gradients or filters defined once and reused across the document. Downsides: it's not a separately cacheable resource — it's baked into the HTML payload and re-downloaded (or re-transmitted) with every page load unless you fetch-and-inject it yourself, and a large inline SVG blob sits in the critical parsing path of the document.

**External reference (`<img src="icon.svg">`, CSS `background-image`, or `<object>`).** Cacheable like any other asset, isolated from the page's CSS and JavaScript (a security boundary as much as a convenience one), but frozen: no script execution, no interactivity, no reaching in from the parent page to recolor a path. `currentColor` tricks don't work across this boundary because there is no "current" — the SVG has no inherited context from its host page. This is why every icon system eventually gives up on `<img>` tags and switches to inline `<svg>` or a `<use>`-based sprite sheet the moment a designer asks for "just make the icon match the button's text color on hover."

**`<use>` referencing a sprite sheet.** The pragmatic middle ground: define your icons once in a hidden `<svg>` block (or an external file), then `<use href="#icon-name">` them everywhere. Each `<use>` produces a *clone* of the referenced content in a shadow-tree-like construct — you get instancing without duplicating markup. The catch that burns people once and then never again: referencing an SVG in a *different origin* file via `<use>` is subject to CORS and same-origin restrictions in most browsers, specifically to stop SVG from becoming a cross-origin data-exfiltration vector via `fetch()`-style tricks disguised as image loading.

---

## 3. Styling: The Part Where SVG Quietly Became CSS's Best Friend

Since SVG 2, most of what used to be XML presentation attributes — `x`, `y`, `width`, `height`, `cx`, `cy`, `r`, `rx`, `ry` — are also legitimate **CSS properties**, with normal specificity and cascade rules. You can put `cx: 50%` in a stylesheet and animate it with a `@keyframes` block like you would `left`. This mattered enormously for one specific reason: it let path shapes join the CSS transition/animation system without SMIL.

Speaking of which, the **`d` CSS property** deserves its own paragraph, because it quietly solved something developers had been faking with JavaScript libraries for a decade: shape morphing.

```css
path {
  d: path("M10,30 A20,20 0,0,1 50,30 z");
  transition: d 0.4s ease;
}
path:hover {
  d: path("M10,80 L90,10 L90,90 z");
}
```

Two path strings, a CSS transition, done — no GSAP required for the simple cases (complex morphs with mismatched point counts still need help, but the primitive is now native). Pair it with `offset-path: path(...)` and you get motion-path animation — an element traveling along an arbitrary SVG curve — as a CSS feature, no JavaScript per-frame math.

---

## 4. Interactivity and Hit-Testing: The Thing Canvas Owes You an Apology For

Every SVG element is a DOM node, which means every SVG element gets hit-testing, hover states, focus, and event bubbling **for free**. `circle.addEventListener('click', ...)` just works, the same way it would on a `<button>`. This is Chapter 1's Section 1 complaint about Canvas, mirrored and solved: SVG never had to invent a hit-region API because the DOM already was one.

The exception, and it's a real one: `getIntersectionList()` and `checkIntersection()` — methods for asking "which shapes overlap this rectangle" — remain unimplemented in Safari/WebKit as of this writing, despite being part of the spec for over a decade. If your interaction model depends on programmatic intersection queries rather than plain event listeners, budget testing time for Safari specifically. It is, unglamorously, still the browser you test last and trust least for SVG edge cases.

---

## 5. Filters: SVG's Most Underrated Weapon

CSS `filter: blur(4px)` is convenient, but it's a thin wrapper around a small slice of what SVG filters can actually do. The full filter primitive set — `feGaussianBlur`, `feColorMatrix`, `feTurbulence`, `feDisplacementMap`, `feComposite`, `feMorphology` — lets you build effects that neither Canvas nor plain CSS reach without a shader:

```xml
<filter id="noisy-displace">
  <feTurbulence type="fractalNoise" baseFrequency="0.02" numOctaves="3" result="noise"/>
  <feDisplacementMap in="SourceGraphic" in2="noise" scale="20"/>
</filter>
```

That's procedural noise-based distortion — the "old photograph," "heat shimmer," "hand-drawn wobble" family of effects — declared entirely in markup, GPU-composited in every modern engine, no canvas pixel loop, no shader you have to write yourself. It's the closest thing the declarative web has to a shader language, and most developers never open the filter spec because `blur()` covers the 80% case well enough to hide the other 400 primitives sitting right behind it.

---

## 6. Accessibility: The Chapter 1 Apology, Continued

Because SVG content lives in the real DOM, it's exposed to the accessibility tree by default — not perfectly, not automatically meaningful, but *present*, which is already further than Canvas gets before any extra work. A `<title>` element as the first child of an `<svg>` or a shape gives assistive tech a name. `role="img"` plus `aria-label` marks a decorative graphic as a single describable unit instead of a pile of unlabeled paths a screen reader announces one by one — which, if you skip this step, is exactly what happens, and it's miserable to sit through.

The honest caveat: "in the DOM" is a starting point, not a finish line. A complex data visualization with two hundred interactive `<circle>` elements still needs deliberate `aria-label`s, keyboard navigation via `tabindex`, and `aria-live` regions for dynamic updates — SVG gives you the scaffolding, not the accessible experience itself. But scaffolding you can build on beats a bitmap you have to X-ray.

---

## 7. What's Actually Deprecated

**SVG fonts** — genuinely, formally gone. The `<font>`, `<glyph>`, `<font-face>`, and related elements were removed outright from the SVG 2 specification, and browser support has been dropping out from under them for years. If you're maintaining an old codebase with `<font-face-uri>` references, that's not "legacy but working," that's "actively being deleted under you" — migrate to WOFF2 via `@font-face`, there's no reason to still be here.

**SMIL animation** (`<animate>`, `<animateTransform>`, `<animateMotion>`) is the more interesting story, because it's a deprecation that *didn't stick*. Chrome filed a formal intent to deprecate SMIL years ago, citing maintenance cost and overlap with the Web Animations API. Developers pushed back hard — path morphing and animations embedded directly inside `<img>`-tag SVGs (which can't run CSS or JavaScript) have no equivalent without SMIL — and Chrome suspended the deprecation. SMIL is still shipping, in every major engine, today. The official recommendation is still "prefer CSS animations or the Web Animations API for new work," but SMIL isn't going anywhere on any visible timeline. File this one under "the deprecation that got walked back after the internet yelled loud enough," which happens less often than people assume and is worth remembering next time a deprecation notice shows up in your console.

**`hasFeature()`** and a handful of other DOM4-era relics were formally dropped from SVG 2's DOM interface. Nobody's used them since feature detection got sane. No eulogy needed.

---

## 8. Performance: Where the DOM Tax Comes Due

The retained-mode model that gives you free hit-testing and free accessibility isn't free in the literal sense — every SVG element is a DOM node with the full weight that implies: style resolution, layout participation, memory for the node object itself, garbage collector visibility. A handful of icons, a dozen chart axes, a hundred map regions: no problem, the browser eats that without noticing. A financial chart redrawing sixty thousand data points a second, or a generative-art piece spawning ten thousand short-lived particles: that's a browser doing sixty thousand style recalculations a second, and it will show you a frame-rate graph you won't enjoy.

The CSS `contain` property (`contain: layout paint` or `contain: strict`) helps by telling the browser "don't let anything inside this subtree affect layout outside it," which lets the rendering engine skip a chunk of recalculation work it would otherwise do defensively. It's a mitigation, not a cure. Past a certain element count, this chapter's technology stops being the right tool, and Chapter 1's technology starts being the right tool. Recognizing that crossover point before your chart library grinds to a halt in front of a client is a skill, not a formula — but "a few hundred to a couple thousand live nodes" is roughly where the conversation should start.

---

## 9. Use Cases, Honestly

**Icons and logos.** The textbook case, and rightly so: resolution-independent by construction, tiny file size, styleable with `currentColor` so a single icon file adapts to every theme and dark-mode toggle a designer throws at it without shipping five PNG variants.

**Data visualization with real interactivity.** d3.js exists in this space because chart elements need to be individually addressable, hoverable, and accessible — tooltips that are real DOM elements positioned relative to a real `<circle>`, not a manually tracked coordinate on a bitmap. This is SVG's strongest, least-contested use case: interactive charts under a few thousand elements.

**Illustrations and crisp scaling.** Logos, diagrams, marketing graphics that need to look identical on a phone and a 4K monitor without a raster-doubling strategy.

**Diagrams with embedded rich content.** `foreignObject` lets you drop actual HTML — forms, wrapped multi-line text, styled cards — inside an SVG canvas, positioned by the SVG coordinate system. Org charts with real editable name fields inside each box, flowcharts with genuinely interactive nodes. It's been broadly supported for years now (the old "Edge/IE `foreignObject` gap" that used to show up in every SVG compatibility article is a dead concern at this point).

**Maps and vector cartography.** Simplified administrative-boundary maps, transit diagrams, seating charts — anywhere a shape needs to be both visually crisp and individually clickable ("select your seat," "click your region").

---

## 10. Pros and Cons, Said Plainly

**What SVG gets you:** free accessibility scaffolding, free hit-testing, free CSS integration, resolution independence, and a filter pipeline that quietly outclasses what CSS alone offers. Every shape is inspectable in devtools exactly like any other DOM node — no black box.

**What it costs you:** per-element overhead that becomes the whole story past a few thousand nodes, a standards situation where the "real" spec has been "under development" long enough that most developers have never read it and rely on caniuse instead, and cross-browser gaps that are smaller than they used to be but not zero — Safari specifically still lags on a handful of interaction APIs.

The test that actually works, restated from Chapter 1 with the mirror flipped: if each shape needs to be individually meaningful — clickable, labeled, styled independently, screen-readable — SVG is doing what it was built for. If you just need a lot of pixels to move fast, you're paying DOM tax for a benefit you're not using, and Canvas was the right call.

---

## 11. Where This Is Going

Fewer dramatic proposals than Canvas's chapter, because SVG's core model has been stable for two decades and most current work is convergence rather than reinvention:

1. **SVG 2's decade-long "under development" status probably never fully resolves as a single dated Recommendation** — the working group and browser vendors seem to have quietly agreed that "shipped and documented via caniuse + MDN" is functionally the spec now. Don't hold your breath for a press release.
2. **Deeper CSS Houdini overlap.** The CSS Paint API (`registerPaint`) already lets you write a JavaScript-driven paint worklet that produces output usable anywhere `background-image` accepts a value — including places SVG patterns and gradients traditionally covered. Expect the line between "SVG filter/pattern" and "CSS Houdini paint source" to keep blurring rather than one replacing the other.
3. **`feImage` sourcing live canvas or video content** into an SVG filter pipeline is a small, quiet convergence point with Chapter 1 and Chapter 3's material — SVG filters increasingly can composite with rendering surfaces that aren't SVG at all.
4. **Path morphing beyond same-point-count shapes** remains a rough edge; expect continued incremental work here rather than a single dramatic fix, since automatic morphing between structurally different paths is a genuinely hard interpolation problem, not a missing checkbox.

SVG isn't trying to get faster than Canvas. It's trying to stay the format where "the browser already knows what this is" keeps paying off in accessibility, tooling, and CSS integration — quietly, without a keynote slot, the way it has since 2001.

---

**Next: Chapter 3 — 3D.** This is where "what's deprecated" stops being a footnote and starts being the headline: WebGL, WebGPU, and the platform's least subtle changing-of-the-guard.

[^1]: If you're wondering why this chapter didn't dwell on `<canvas>`-vs-`<svg>` benchmarks with hard numbers: the honest answer is that the crossover point depends entirely on element complexity, redraw frequency, and target device, and any single number quoted here would be stale or misleading within a year. Test your actual workload. Everyone who's given you a specific number was measuring their workload, not yours.
