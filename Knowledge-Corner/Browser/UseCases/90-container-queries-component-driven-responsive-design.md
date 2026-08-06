# Use Case 90: Container Queries for Component-Driven Responsive Design

For as long as responsive design has existed, "responsive" has meant one thing: react to the viewport. A card component styled with a media query has no idea whether it's rendered full-width on a phone or squeezed into a 240px sidebar column on a 4K monitor — both look identical to `@media (max-width: 600px)`, and neither is what the component actually needs to know. Container Queries fix the actual question: how much space does *this component* have, regardless of the viewport around it.

## Why Viewport-Based Responsiveness Was Always the Wrong Question for Components

A media query answers "how big is the browser window." A reusable component dropped into a dashboard, a sidebar, a modal, and a full-page layout doesn't care about the window — it cares about its own container. Media queries structurally can't answer that question, which is why component libraries spent years working around it with JavaScript-based `ResizeObserver` polyfills before the platform gave them a native answer.

## The User Story, Stripped of Domain

A user can:

- see a component render its wide layout when it has room and its narrow layout when it doesn't, regardless of the overall page size,
- get a genuinely reusable component that looks correct in every context it's dropped into, with no per-placement override needed,
- experience layout that adapts to actual available space, not an assumption about device class.

## Core Browser Technologies

| CSS Feature | Job | Reference |
|---|---|---|
| `container-type` | Declares an element as a query container | [MDN – CSS containment](https://developer.mozilla.org/en-US/docs/Web/CSS/container-type) |
| `container-name` | Names a container for targeted queries in nested scenarios | [MDN – container-name](https://developer.mozilla.org/en-US/docs/Web/CSS/container-name) |
| `@container` | The query itself, styled against the named container's size | [MDN – @container](https://developer.mozilla.org/en-US/docs/Web/CSS/@container) |
| Container query length units (`cqw`, `cqh`, `cqi`, `cqb`) | Size values relative to the container instead of the viewport | [MDN – CSS container query length units](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_containment/Container_size_and_style_queries) |

## The Browser Reality Check

This is, refreshingly, a solved problem. Container Queries reached Baseline "widely available" status across Chrome, Edge, Firefox, and Safari back in early 2023, and the whole feature set — including container query length units — has had years to mature since.<sup>[1]</sup> This is exactly the kind of feature that belongs in a "safe everywhere" bucket alongside `:has()`, in sharp contrast to the still-maturing CSS features covered in Use Cases 87 and 88.

The one real design decision left is `container-type` selection: `inline-size` (the common case, querying width only) versus `size` (querying both dimensions, which comes with a real layout-containment cost since the browser can no longer let the container's size depend on its own content).

## What Breaks First

- Declaring `container-type: size` by habit when `inline-size` is all that's actually needed, taking on unnecessary layout containment cost.
- Forgetting a container needs an explicit `container-type` declared on an ancestor before any `@container` query targeting it will do anything at all.
- Nesting containers without `container-name`, so an `@container` query inadvertently matches the wrong ancestor container in a deeply nested component tree.
- Treating this as a viewport media query replacement everywhere, when some genuinely global, page-level breakpoints are still better expressed with `@media`.

## Minimal Technical Blueprint

```css
.card-wrapper {
  container-type: inline-size;
  container-name: card;
}

.card {
  display: flex;
  flex-direction: column; /* narrow default */
}

@container card (min-width: 400px) {
  .card {
    flex-direction: row; /* wide layout, triggered by container space, not viewport */
  }
}
```

1. Declare `container-type: inline-size` on the component's wrapper element — this is the common case and avoids the layout-containment cost of full `size` containment.
2. Name containers explicitly with `container-name` the moment components nest, so a query unambiguously targets the intended ancestor.
3. Use container query length units (`cqw`, `cqi`) for sizing values that should scale with the container rather than the viewport.
4. Keep genuinely page-level, global breakpoints on `@media` — Container Queries solve the component-reuse problem, not every responsive design problem.
5. No fallback strategy is actually needed here — this is safely baseline across every browser this deck cares about.

## Decision Summary

Use this for any reusable component that needs to adapt to the space it's actually given, rather than the size of the browser window around it — which describes most component libraries and design systems built after roughly 2023.

Unlike nearly everything else in this deck's CSS section, there's no caveat to attach here. This is production-safe, has been for a while, and any component library still working around this with a `ResizeObserver` polyfill is carrying complexity the platform has already solved.

---

[1]: Container Queries Baseline "widely available" status since early 2023, [MDN – CSS containment: Container size and style queries](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_containment/Container_size_and_style_queries).
