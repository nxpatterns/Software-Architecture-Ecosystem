# Scoped Registries

## The Problem

`window.customElements` is global. One registry, one page, first come first served. Register `<ds-button>` twice and the second registration throws. Doesn't matter if it's your design system fighting a vendor widget, or two versions of your *own* design system fighting each other after a half-finished migration — collision is collision.

This is the kind of problem that stays invisible until you're running a micro-frontend architecture with five teams shipping independently, and someone updates the shared component library with a breaking change. Suddenly coordinating a tag name becomes a cross-team meeting. Nobody signed up for that when they discovered Web Components.

## What It Does

`CustomElementRegistry()` is now a constructor, not just something the browser hands you once. You can make your own:

```js
const myRegistry = new CustomElementRegistry();
myRegistry.define(
  "ds-button",
  class extends HTMLElement {
    connectedCallback() {
      this.textContent = "Hello from a registry nobody else can touch";
    }
  },
);
```

Attach that registry to a `ShadowRoot`, and every custom element created inside that subtree resolves through *your* registry instead of the global one. Two different `<ds-button>` implementations, same tag name, same page, zero conflict — because they live in different shadow trees with different registries. Elements even gained a `customElementRegistry` property so you can introspect which registry an element belongs to.[^scoped]

## Where It Actually Runs

Safari shipped first — 26.0, which is a genuinely rare sentence to type about a web components feature. Chrome and Edge followed at version 146. Firefox has it behind a flag in version 150 and has not shipped it as of this writing.

That gap is the whole story right now: the feature is in **Interop 2026**, meaning all major vendors have committed to closing it, but "committed" and "shipped" are different words for a reason. Until Firefox ships, this isn't Baseline-safe for anything you can't afford to feature-detect around.

```js
if ("CustomElementRegistry" in window && typeof CustomElementRegistry === "function") {
  // proceed with a scoped registry
} else {
  // fall back to the global registry, accept the collision risk, sigh
}
```

**Deprecated-adjacent note:** this doesn't deprecate anything, but it quietly makes the old advice — "just prefix everything with your company name to avoid tag collisions" — look as dated as it always secretly was.

## Use Case

Third-party embeds (maps, share widgets, chat bubbles) that ship their own custom elements without squatting on your global namespace. Design systems that need to run two major versions side by side during a migration window, instead of a flag day everyone dreads. Browser extensions injecting UI into arbitrary pages without praying nobody else picked the same tag name.

## Where This Goes

Once Firefox ships, this becomes the default advice for any component library aiming at more than one team. The current spec is explicitly an MVP — narrow scope, encapsulation only — with room to extend if real-world usage demands more. Expect library authors (Lit, Shoelace, the usual suspects) to adopt scoped registries as an opt-in isolation layer well before it's Baseline, because the pain it solves is already being felt today, not in some hypothetical future.
