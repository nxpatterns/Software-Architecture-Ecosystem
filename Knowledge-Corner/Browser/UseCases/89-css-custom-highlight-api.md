# Use Case 89: CSS Custom Highlight API for Text Highlighting Without DOM Wrapping

Highlighting search results, spelling errors, or syntax in a code editor traditionally means wrapping the matched text in a `<span>` — which mutates the DOM, complicates undo/redo, and gets genuinely messy the moment two highlights overlap. The CSS Custom Highlight API skips the DOM entirely: define a text range in JavaScript, style it in CSS, and the underlying document structure never changes.

## Why Wrapping Text in Spans Was Always a Compromise

A `<span>`-based highlight approach means every highlight is a DOM mutation — insert elements, track them, remove them cleanly on update, and somehow handle two overlapping ranges without producing invalid nested markup. None of that is simple, and all of it is unnecessary work the browser can now do natively.

## The User Story, Stripped of Domain

A user can:

- see search results highlighted directly in the text they're reading, with no visible DOM restructuring,
- see multiple overlapping highlights — spelling errors, grammar errors, custom annotations — rendered correctly at once,
- get all of this from a lightweight JavaScript/CSS pairing instead of a heavier text-editing framework.

Search-result highlighting, code editor syntax highlighting, collaborative-annotation markers, spelling/grammar-style underlines — the same mechanism handles all of it.

## Core Browser Technologies

| API | Job | Reference |
|---|---|---|
| `Range` (existing DOM API) | Defines the start and end of the text to highlight | [MDN – CSS Custom Highlight API guide](https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Custom_highlight_API) |
| `Highlight` | A collection of `Range` objects grouped as one named highlight | [MDN – Highlight](https://developer.mozilla.org/en-US/docs/Web/API/Highlight) |
| `CSS.highlights` (`HighlightRegistry`) | Registers a `Highlight` under a name for CSS to reference | [MDN – HighlightRegistry](https://developer.mozilla.org/en-US/docs/Web/API/HighlightRegistry) |
| `::highlight()` pseudo-element | Styles a registered highlight by name | [MDN – ::highlight()](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Selectors/::highlight) |

## The Browser Reality Check

This is one of the rare entries in this deck that's already fully cross-browser and has been for over a year. It reached Baseline "Newly available" status in June 2025.<sup>[1]</sup> Chrome and Edge shipped it first, in version 105 (August 2022). Safari followed in 17.2 (December 2023). Firefox completed cross-browser coverage in Firefox 140 (June 2025).<sup>[2][3]</sup>

Two practical rough edges are worth knowing before relying on it for anything pixel-sensitive: only a limited set of CSS properties can actually be applied through `::highlight()` — `background-image` is explicitly ignored, for instance — and Safari has a documented rendering quirk where a background color applied to a highlight doesn't render correctly in the whitespace created when a highlighted line wraps with extra line spacing.<sup>[4][5]</sup>

## What Breaks First

- Assuming any CSS property works inside `::highlight()` — the styleable property set is deliberately limited, and `background-image` is a common one that silently gets ignored.
- Not feature-detecting `CSS.highlights` before use, breaking entirely on any browser predating each engine's rollout rather than degrading to plain, unhighlighted text.
- Building overlapping highlights with no priority handling — when two highlights overlap, the browser needs a priority value to decide how to resolve the conflict, and skipping that produces inconsistent results.
- Hitting the Safari line-wrap background rendering quirk and assuming it's an application bug rather than a known engine-specific edge case.

## Minimal Technical Blueprint

```javascript
if (!CSS.highlights) {
  return; // graceful degradation — plain text, still fully readable
}

function highlightSearchResults(textNode, query) {
  const highlight = new Highlight();
  const text = textNode.textContent;
  let index = text.indexOf(query);

  while (index !== -1) {
    const range = new Range();
    range.setStart(textNode, index);
    range.setEnd(textNode, index + query.length);
    highlight.add(range);
    index = text.indexOf(query, index + query.length);
  }

  CSS.highlights.set('search-result', highlight); // no DOM mutation at all
}
```
```css
::highlight(search-result) {
  background-color: yellow;
  color: black; /* only a limited property set is supported here */
}
```

1. Feature-detect `CSS.highlights` before use and degrade gracefully to plain text on unsupported browsers — the failure mode here is invisible, not broken.
2. Keep styling within the supported property subset; don't assume general CSS capability inside `::highlight()`.
3. Assign explicit priority values to `Highlight` objects when overlaps are expected, so the browser has a deterministic way to resolve them.
4. Test rendering specifically on Safari when highlights span wrapped lines with extra line-height — this is a documented, known quirk, not a bug in the implementation code.
5. Prefer this over DOM-wrapping approaches whenever the highlight is transient or overlapping — the DOM-mutation cost that approach carries simply doesn't exist here.

## Decision Summary

Use this for any text-highlighting need — search results, spelling/grammar-style markers, code syntax, collaborative annotations — where DOM structure should stay untouched and multiple overlapping highlights need clean rendering.

This is one of the few APIs in the entire deck where "check current browser support" isn't really the caveat anymore — it's genuinely safe to build on as a baseline today, with only the Safari line-wrap quirk worth specifically testing for.

---

[1]: CSS Custom Highlight API Baseline status since June 2025, [MDN](https://developer.mozilla.org/en-US/docs/Web/API/CSS_Custom_Highlight_API).
[2]: Cross-browser version support history (Chrome/Edge 105, Safari 17.2, Firefox 140), [ICS MEDIA](https://ics.media/en/entry/260427/).
[3]: Firefox 140 shipping the API, [MDN – Firefox 140 release notes](https://developer.mozilla.org/en-US/docs/Mozilla/Firefox/Releases/140).
[4]: Limited styleable property set for `::highlight()`, [MDN – ::highlight()](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Selectors/::highlight).
[5]: Safari line-wrap background rendering quirk, [Frontend Masters Blog – Using the Custom Highlight API](https://frontendmasters.com/blog/using-the-custom-highlight-api/).
