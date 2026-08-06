# Use Case 98: Designing for the Absence of Hover — `hover` and `pointer` Media Features

A dropdown menu that opens on `:hover`. A tooltip that appears when the cursor lingers. A button whose "important" state only shows on mouse-over. All of it assumes a cursor that can rest somewhere without committing to a click — an assumption that's simply false on a touchscreen, where every interaction is a discrete tap with no "hovering" gesture available at all.

## Why Touch Isn't "Mouse Without a Cursor"

A touchscreen doesn't lack a mouse. It lacks the entire *concept* `:hover` depends on — a pointer that can occupy a position without triggering an action. Treating touch as "mouse input, just imprecise" is exactly the assumption that produces menus nobody can open and tooltips nobody can read, because the interaction they depend on structurally doesn't exist on the device.

## The User Story, Stripped of Domain

A user can:

- access every piece of hover-revealed content or functionality through touch, not just through a mouse,
- avoid the "sticky hover" trap where tapping an element on a touchscreen leaves it visually stuck in its hover state until the user taps elsewhere,
- get an interface that adapts its interaction model to the actual input device in use, not a single assumed pointer type.

## Core Browser Technologies

| CSS Feature | Job | Reference |
|---|---|---|
| `@media (hover: hover)` | True only when the primary input can genuinely hover | [MDN – hover](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/hover) |
| `@media (pointer: fine)` | True when the primary input is precise — a mouse or trackpad | [MDN – pointer](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/pointer) |
| `@media (any-hover)`/`(any-pointer)` | Checks *any* available input mechanism, not just the primary one | [MDN – any-hover](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/any-hover) |
| `:hover`/`:focus-visible` | The actual interaction states being gated by device capability | [MDN - :hover](https://developer.mozilla.org/en-US/docs/Web/CSS/:hover), [MDN - :focus-visible](https://developer.mozilla.org/en-US/docs/Web/CSS/:focus-visible) |

## The Browser Reality Check

This is a solved compatibility problem — `hover` and `pointer` media features are broadly supported, stable, and have been for years across every major browser, mobile and desktop alike. The difficulty here isn't support, it's that most teams never actually query these features and instead write `:hover` styles as if every visitor has a mouse.

A genuinely underestimated nuance: `hover`/`pointer` describe the *primary* input mechanism, while `any-hover`/`any-pointer` check whether *any* connected input supports it. A touchscreen laptop with a trackpad reports `(hover: hover)` as true, because the trackpad is the primary input — but a 2-in-1 device currently in tablet mode, or a phone with an attached Bluetooth mouse, produces genuinely different, less obvious combinations worth testing directly rather than assuming.

## What Breaks First

- Hiding critical functionality entirely behind `:hover` with no alternative, making it permanently unreachable on touch devices.
- The "sticky hover" bug: a user taps a link styled with `:hover`, the hover style applies and never clears because there's no genuine mouse-out event to reverse it, and the element looks visually "stuck" until the user taps something else.
- Assuming `pointer: coarse` means "this is a phone" — a large touchscreen kiosk or an interactive display reports the same value, and design assumptions built around "small screen" don't hold.
- Testing only on a mouse-driven desktop and a finger-driven phone, missing the genuinely different in-between cases like a touchscreen laptop or a tablet with a stylus.

## Minimal Technical Blueprint

```css
/* Default: assume touch-safe. Hover is an enhancement, not the only path. */
.menu-trigger .dropdown {
  display: block; /* tap-to-toggle via JS on touch devices */
}

@media (hover: hover) and (pointer: fine) {
  .menu-trigger .dropdown {
    display: none; /* only hidden-until-hover on genuinely mouse-driven devices */
  }
  .menu-trigger:hover .dropdown {
    display: block;
  }
}
```

```javascript
// Prevent sticky hover: only bind hover-dependent JS behavior where hover is real
if (window.matchMedia('(hover: hover)').matches) {
  bindHoverPreview(element);
} else {
  bindTapToReveal(element); // explicit touch-appropriate interaction instead
}
```

1. Treat every hover-revealed piece of content or functionality as needing a tap-accessible equivalent — never hide something behind `:hover` alone with no fallback path.
2. Use `@media (hover: hover) and (pointer: fine)` to scope hover-dependent interaction patterns specifically to devices where hovering is a genuine, intentional gesture.
3. Avoid the sticky-hover trap by not relying on `:hover` alone for toggled UI state on touch-reachable elements — use an explicit tap handler with its own open/close state instead.
4. Test the actual in-between device categories — a touchscreen laptop, a 2-in-1 in tablet mode, a stylus-equipped tablet — rather than assuming the world splits cleanly into "mouse desktop" and "touch phone."
5. Use `any-hover`/`any-pointer` when the question is genuinely "does this user have *some* way to hover," such as deciding whether to show a hover-triggered hint at all, versus `hover`/`pointer` when the question is about the primary, default interaction mode.

## Decision Summary

Design hover-dependent interactions as an enhancement layered on top of a fully tap-accessible baseline, gated by `@media (hover: hover) and (pointer: fine)` — never as the only path to reach content or functionality.

This is one of the cheapest fixes in the entire deck relative to its impact: two CSS media features, well-supported for years, prevent an entire category of "I can't tap this menu open" bug reports that touch users file constantly against interfaces built mouse-first.
