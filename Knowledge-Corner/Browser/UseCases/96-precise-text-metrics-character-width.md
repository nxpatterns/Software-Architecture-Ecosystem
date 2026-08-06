# Use Case 96: Precise Text Metrics — Knowing Exactly How Wide a Character Is

For most of the web's history, "how wide is this text going to render" was a guess: create a hidden `<span>`, set the font, read `offsetWidth`, hope the browser's actual rendering matches. `CanvasRenderingContext2D.measureText()` has quietly become something much more precise — real, pixel-accurate bounding boxes for exactly how a specific string renders in a specific font, ascent and descent included, not just an approximate width.

## Why `width` Alone Was Never Enough

The basic `TextMetrics.width` property answers "how wide is the text's advance," which is a typographic concept, not a visual one — it's how far the cursor moves, not the actual pixel extent of the rendered glyphs. Italic text, decorative fonts, and glyphs that overhang their nominal advance width can render narrower or wider than `width` alone suggests. Anyone who's shipped text that overflowed its container despite `width` saying it should fit has hit this gap directly.

## The User Story, Stripped of Domain

A user can:

- see text laid out with genuinely correct spacing and no unexpected clipping or overflow,
- get accurately fitted text in a canvas-based UI — a chart label, a game HUD, a generative design tool,
- experience text truncation or wrapping logic that actually matches what renders, not an approximation that occasionally guesses wrong.

## Core Browser Technologies

| API | Job | Reference |
|---|---|---|
| `CanvasRenderingContext2D.measureText()` | Returns a `TextMetrics` object for a given string and font | [MDN – measureText()](https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/measureText) |
| `TextMetrics.width` | The typographic advance width — not the same as visual extent | [MDN – TextMetrics](https://developer.mozilla.org/en-US/docs/Web/API/TextMetrics) |
| `TextMetrics.actualBoundingBox{Left,Right,Ascent,Descent}` | Pixel-precise bounding box that hugs the actual rendered glyphs | [MDN – TextMetrics](https://developer.mozilla.org/en-US/docs/Web/API/TextMetrics) |
| `TextMetrics.fontBoundingBox{Ascent,Descent}` | The font's own defined ascent/descent, independent of the specific string | [MDN – TextMetrics](https://developer.mozilla.org/en-US/docs/Web/API/TextMetrics) |

## The Browser Reality Check

The core `measureText()` API and its basic `width` property are Baseline, widely available, and have been since July 2015 — this part is safe to depend on unconditionally.<sup>[1]</sup> The extended metrics — `actualBoundingBox*` and `fontBoundingBox*` — are newer additions layered on top, and MDN specifically flags that some parts of this extended feature set carry varying levels of support across engines and versions.<sup>[1]</sup> Feature-detect the specific properties needed (`'actualBoundingBoxLeft' in metrics`) rather than assuming the full extended set is present just because basic `measureText()` works.

## What Breaks First

- Using `TextMetrics.width` alone to decide whether text fits a container, then watching italic or decorative fonts overflow anyway because their glyphs extend past the advance width.
- Forgetting that canvas text is positioned from the baseline, not the top-left corner — a height calculation that doesn't account for `actualBoundingBoxAscent` and `actualBoundingBoxDescent` produces vertically misaligned text.
- Assuming the extended bounding-box properties are universally present without a feature check, then hitting `undefined` on an older or less-complete implementation.
- Recomputing `measureText()` on every animation frame for static text instead of caching the result — it's a real computation cost that adds up quickly in a render loop.

## Minimal Technical Blueprint

```javascript
function getAccurateTextBounds(ctx, text, font) {
  ctx.font = font;
  const metrics = ctx.measureText(text);

  const hasExtendedMetrics = 'actualBoundingBoxLeft' in metrics;
  const width = hasExtendedMetrics
    ? Math.abs(metrics.actualBoundingBoxLeft) + Math.abs(metrics.actualBoundingBoxRight)
    : metrics.width; // fall back to the basic advance width

  const height = hasExtendedMetrics
    ? Math.abs(metrics.actualBoundingBoxAscent) + Math.abs(metrics.actualBoundingBoxDescent)
    : null; // no reliable height without the extended metrics

  return { width, height };
}
```

1. Use `TextMetrics.width` for typographic layout decisions — cursor positioning, kerning-aware spacing — where the advance width is genuinely the right question.
2. Use `actualBoundingBoxLeft`/`Right`/`Ascent`/`Descent` specifically when the question is "will this text visually fit" or "where exactly does this glyph start and end" — a game HUD, a tightly bounded label, a hit-testing region.
3. Feature-detect the extended properties before relying on them, falling back to the basic `width` (and an estimated height from `font` size) where they're unavailable.
4. Remember canvas text draws from the baseline — subtract `actualBoundingBoxAscent` from the intended top position when computing a bounding rectangle for the rendered text.
5. Cache `measureText()` results for static or infrequently-changing text rather than recomputing every frame in an animation loop.

## Decision Summary

Use the extended bounding-box metrics wherever pixel-accurate text placement matters — canvas-based UI, generative design tools, precise hit-testing around rendered glyphs — and fall back to the basic `width` property everywhere else, since it's been reliable for a decade.

This is a genuinely underused capability: most teams still eyeball padding around canvas text or over-allocate space defensively, when the platform has offered exact, per-glyph measurement for years.

---

[1]: `TextMetrics` Baseline status since 2015 and varying support for extended bounding-box properties, [MDN – TextMetrics](https://developer.mozilla.org/en-US/docs/Web/API/TextMetrics).
