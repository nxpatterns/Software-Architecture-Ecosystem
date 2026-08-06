# Observer Trio

## MutationObserver

### The Problem It Already Solved

This one's ancient history at this point, and that's the good news. Before `MutationObserver`, watching the DOM meant Mutation Events — `DOMNodeInserted`, `DOMSubtreeModified`, `DOMAttrModified`, and friends. They fired synchronously, for every single node, during the mutation itself. Browsers had to check for listeners on *every DOM operation*, which measurably degraded performance even when nobody was listening.[^mutevents]

Mutation Events were deprecated from the spec in 2011. `MutationObserver` replaced them in 2012. Chrome finally ripped Mutation Events out entirely in version 127, July 2024. If your codebase still has a `DOMNodeInserted` listener anywhere, it has been quietly dead in Chrome for two years, and you should go check right now — I'll wait.

### What It Does, Still

Batched, asynchronous, opt-in. You tell it what to watch and what to watch *for*, and it hands you a list of changes on the microtask queue instead of interrupting every single DOM write:

```js
const observer = new MutationObserver((mutations) => {
  for (const m of mutations) {
    if (m.type === "childList") {
      m.addedNodes.forEach((node) => console.log("New arrival:", node));
    }
  }
});

observer.observe(document.body, { childList: true, subtree: true });
```

Nothing about this API has meaningfully changed in years, and that's the correct amount of excitement to have about it. It's not exotic anymore. It's plumbing.

### Use Case

Watching for content that a third-party script injects after your code has already run — analytics banners, cookie consent widgets, chat launchers that arrive two seconds late and shove your layout sideways. Rich text editors detecting when the browser's own contenteditable behavior mutates the DOM in ways you need to normalize. Detecting DOM changes made by browser extensions your app doesn't control and never asked for.

### Where This Goes

Nowhere dramatic, and that's a compliment. `MutationObserver` is Baseline, has been for over a decade, and the interesting evolution already happened — it's the removal of the legacy alternative, not an upgrade to the observer itself. If you're still polling the DOM with `setInterval` to detect changes in 2026, that's not a browser support problem. That's a you problem.

## ResizeObserver

### The Problem

For years, "tell me when this element's size changes" meant either `window.onresize` (which only fires for the *viewport*, not your div) or a polling loop checking `getBoundingClientRect()` on a timer, burning CPU to answer a question the browser already knew the answer to.

### What It Does

Reports size changes per element, batched, without you asking twice a second whether anything moved:

```js
const ro = new ResizeObserver((entries) => {
  for (const entry of entries) {
    const width = entry.contentBoxSize[0].inlineSize;
    console.log(`Element is now ${width}px wide`);
  }
});

ro.observe(document.querySelector(".card"));
```

Three box models are on offer: `content-box` (default), `border-box`, and `device-pixel-content-box`. That last one exists specifically for canvas and WebGL rendering, where you need the *exact* device-pixel size to avoid blurry or misaligned output — subpixel rounding is not your friend when you're rasterizing.

### Where It Gets Interesting (Badly)

`content-box` and `border-box` are Baseline, solid, boring in the good way — Chrome, Firefox, and Safari have all supported them for years. `device-pixel-content-box` is where the interoperability story gets embarrassing.

Chrome implements it correctly. Firefox *claims* to support it, but there's a long-standing, still-open bug report showing its numbers don't actually add up when child elements split a pixel between them — meaning the API technically exists but returns wrong data in exactly the scenario it was built for.[^dpc] Safari never implemented it at all for high-DPI rendering purposes; the relevant WebKit bug has been open since 2020 and was still being discussed as recently as December 2025.

So: if you're building a canvas or WebGL renderer that needs pixel-perfect output across browsers, `device-pixel-content-box` is currently a Chrome-only promise. Feature-detect and fall back to `devicePixelRatio` math for everyone else.

```js
const supportsDPCB = "devicePixelContentBoxSize" in ResizeObserverEntry.prototype;
```

Support existing in the object doesn't mean the numbers are trustworthy — that's the specific trap here. Test the actual output, not just the property's presence.

### Use Case

Charts and data visualizations that need to redraw at their exact container size instead of guessing from CSS. Canvas or WebGL surfaces that must match device pixels 1:1 to avoid moiré artifacts. Component libraries offering container-relative responsive behavior before CSS Container Queries existed — and still useful today for logic that CSS alone can't express, like swapping out JavaScript behavior, not just styles, based on available space.

### Where This Goes

CSS Container Queries have taken over a good chunk of what `ResizeObserver` used to be the *only* tool for — pure layout responsiveness doesn't need JavaScript anymore. `ResizeObserver` isn't going away, though; it's retreating to the jobs CSS genuinely can't do: canvas/WebGL sizing, JS-driven behavioral changes, and anything that needs the actual resize *event*, not just a media-query-style breakpoint. The `device-pixel-content-box` gap will probably take another year or two to close, given it's sat unresolved for five already.

## IntersectionObserver

### The Problem

"Is this element visible on screen" used to mean scroll listeners plus `getBoundingClientRect()` math, running on every scroll event, on the main thread, fighting your actual rendering work for CPU time. Infinite scroll and lazy-loaded images ran on code that was, structurally, a performance problem waiting to happen.

### What It Does (v1 — the one everyone already uses)

```js
const io = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.src = entry.target.dataset.src;
      io.unobserve(entry.target);
    }
  });
}, { rootMargin: "200px" });

document.querySelectorAll("img[data-src]").forEach((img) => io.observe(img));
```

Lazy loading, infinite scroll, scroll-triggered animations, ad viewability tracking. This part of the API has been Baseline and rock-solid across all major engines for years. If you're doing manual scroll-position math for any of this in 2026, you're solving a solved problem the hard way.

### What It Does (v2 — the one almost nobody uses yet)

v1 tells you an element's bounding box *intersects* the viewport. It does not tell you whether that element is actually *visible to a human* — covered by another element, rotated into invisibility with CSS, or hidden under an opacity trick, and v1 would happily report it as intersecting anyway. That gap is exactly how click-fraud and ad-stacking scams have worked for years: overlay an invisible click target on top of something real.

v2 adds two constructor options and one new entry field:

```js
const io = new IntersectionObserver(callback, {
  trackVisibility: true,
  delay: 100, // mandatory minimum when trackVisibility is true
});
```

`entry.isVisible` then becomes a *strong* guarantee: the browser confirms the element is genuinely unoccluded and undistorted, using compositor-level information a bounding-box check can't see. The spec deliberately allows false negatives (reporting "not sure" as invisible) but never false positives — it will not lie and say something's visible when it isn't.[^iov2]

The catch: only Chromium-based engines (Chrome, Edge, Opera, Samsung Internet) implement v2. Firefox and Safari do not, and there's no public signal either is close. Feature-detect with `"isVisible" in IntersectionObserverEntry.prototype` and treat its absence as "trust the v1 geometry and move on."

### Use Case

v1: lazy-loaded images and video, infinite scroll feeds, triggering CSS animations only when a section scrolls into view, pausing expensive work (video playback, canvas animation) for off-screen elements. v2: ad-viewability measurement that can't be spoofed by an overlay, anti-click-fraud verification before firing a conversion event.

### Where This Goes

v1 isn't evolving because it doesn't need to — it does its one job well and everyone agrees on it. v2 has real commercial pressure behind it (nobody likes paying for ad impressions nobody actually saw), which usually gets features implemented faster than academic interest alone would. Don't hold your breath for Safari specifically; Apple has historically deprioritized ad-tech-adjacent APIs on privacy grounds, and v2's entire use case is ad measurement. It's also worth pairing this API conceptually with the CSS `content-visibility` property, which handles a related but distinct problem: skipping layout and paint work for off-screen content declaratively, without any JavaScript observer at all.

## The Pattern Underneath All Four

Every one of these APIs follows the same shape: something used to require either synchronous events firing constantly, or a polling loop guessing at state. The fix, every time, was the same idea — batch it, make it asynchronous, make it opt-in, let the browser tell you only what changed instead of you asking it to check.

Mutation Events got replaced outright. Resize and Intersection never had a bad predecessor to kill, they just filled a gap nobody had solved cleanly. Scoped registries are the newest member of the family, solving a coordination problem that only became painful once component libraries got popular enough to collide with each other.

**Bottom line:** three of these four you can use today without blinking. The fourth (scoped registries) needs a feature-detect and a fallback until Firefox catches up, and `ResizeObserver`'s device-pixel mode needs a healthy dose of "trust but verify" no matter which browser you're in.

[^mutevents]: Mutation Events could slow down further DOM modifications on the same document by a factor of 1.5 to 7 — and removing the listeners afterward didn't undo the damage. A performance tax that outlived the code that caused it. Very on-brand for early-2000s web APIs.

[^dpc]: The bug report is refreshingly blunt about it: the numbers Firefox returns don't sum correctly across sibling elements, which is precisely the scenario `devicePixelContentBoxSize` exists to solve. Supported in name, not in practice — the most annoying kind of "supported."

[^iov2]: The spec permits false negatives on purpose — reporting `isVisible: false` even when a human would say the element is clearly visible — because pixel-perfect occlusion detection is expensive and browsers are allowed to punt rather than guarantee something they can't cheaply verify. It's a strong "yes," a soft "not sure," never a lying "yes."
