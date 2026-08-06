# Use Case 94: Adaptive Color and Accessibility — Dark Mode, Forced Colors, and Accent Color

Most teams implement dark mode as a hand-built theme toggle and stop there — a `data-theme` attribute, a second set of custom properties, a JavaScript preference read from `localStorage`. That covers the visible page content. It quietly misses form controls, scrollbars, and the entire high-contrast accessibility mode a real share of users depend on, none of which a custom theme system touches automatically.

## Why Half-Implemented Dark Mode Is So Common

Dark mode looks finished the moment the background and text colors flip. What's actually still unfinished: native form controls (checkboxes, date pickers, select dropdowns) keep rendering with light-mode chrome unless the browser is explicitly told otherwise, and users running Windows High Contrast Mode or an equivalent forced-colors setting get an experience most teams have never once tested against.

## The User Story, Stripped of Domain

A user can:

- get a dark or light theme that matches their OS preference automatically, with no toggle required for the default case,
- see native form controls — checkboxes, selects, date pickers — actually themed to match, not stuck in the opposite mode,
- use Windows High Contrast Mode or an equivalent forced-colors setting and still have a fully legible, correctly prioritized interface,
- see interactive elements pick up the app's brand color automatically, without every checkbox and radio button needing custom styling.

## Core Browser Technologies

| CSS Feature | Job | Reference |
|---|---|---|
| `prefers-color-scheme` | Media query reading the user's OS-level light/dark preference | [MDN – prefers-color-scheme](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-color-scheme) |
| `color-scheme` | Tells the browser which theme(s) the page supports, so native controls theme correctly | [MDN – color-scheme](https://developer.mozilla.org/en-US/docs/Web/CSS/color-scheme) |
| `forced-colors` | Detects Windows High Contrast Mode and equivalent forced-color settings | [MDN – forced-colors](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/forced-colors) |
| `accent-color` | Sets the brand color for native checkboxes, radios, sliders, and progress bars | [MDN – accent-color](https://developer.mozilla.org/en-US/docs/Web/CSS/accent-color) |

## The Browser Reality Check

All four of these are broadly supported, Baseline-stable features across Chrome, Edge, Firefox, and Safari — this section isn't a compatibility problem, it's an awareness gap. Most teams simply don't know `color-scheme` and `accent-color` exist, so they hand-roll solutions to problems the platform already solved.

`forced-colors` deserves particular attention because it inverts the usual CSS relationship: when a user has forced colors active, the browser overrides most custom colors with a small, user-controlled palette, and `background-image` and custom `box-shadow`-based visual cues can simply vanish. Code that was never tested under `forced-colors: active` frequently turns invisible or loses critical distinctions — a colored border indicating an error state, for instance, may not render at all once the user's forced palette takes over.

## What Breaks First

- Implementing dark mode with custom properties alone and never setting `color-scheme`, leaving native form controls stuck rendering in the opposite theme from the rest of the page.
- Building every checkbox and radio button with custom styling to match the brand color, when `accent-color` does the same job with one CSS declaration and zero markup changes.
- Never testing under `forced-colors: active`, then discovering a critical visual cue — a border, a background-only status indicator — disappears entirely for high-contrast-mode users.
- Reading only `prefers-color-scheme` and ignoring `forced-colors`, treating them as the same concern when they're governed by entirely different user settings and need separate handling.

## Minimal Technical Blueprint

```css
:root {
  color-scheme: light dark; /* native controls theme automatically */
  accent-color: #4f46e5; /* one line replaces custom checkbox/radio styling */
}

@media (prefers-color-scheme: dark) {
  :root { --bg: #111; --text: #eee; }
}

@media (forced-colors: active) {
  .status-badge {
    border: 2px solid; /* explicit border, since background-only cues can vanish */
    forced-color-adjust: none; /* only where truly necessary — most elements should NOT opt out */
  }
}
```

1. Set `color-scheme: light dark` (or the appropriate single value) on the root element so native form controls, scrollbars, and default UI chrome theme correctly alongside custom-styled content.
2. Use `accent-color` for checkboxes, radios, range sliders, and progress bars instead of building custom-styled replacements from scratch — this alone eliminates a meaningful category of dark-mode bugs.
3. Test the interface directly under `forced-colors: active` (Windows High Contrast Mode, or the OS equivalent), not just `prefers-color-scheme: dark` — these are different settings serving different users.
4. Use `forced-color-adjust: none` sparingly and deliberately, only where the forced palette would genuinely break comprehension — opting most of the page out of forced colors defeats the purpose of the accessibility feature entirely.
5. Never rely on a background color alone to convey meaning; pair it with a border, icon, or text label so the information survives a forced-colors context where background differentiation may vanish.

## Decision Summary

Use all four together as the actual complete implementation of adaptive, accessible color — a dark mode toggle alone was never the whole feature, just the visible third of it.

Skipping `color-scheme`, `accent-color`, and `forced-colors` testing doesn't make dark mode simpler, it just means the gaps show up later, on someone else's screen, usually a user who was already relying on an accessibility setting your team never tested against.
