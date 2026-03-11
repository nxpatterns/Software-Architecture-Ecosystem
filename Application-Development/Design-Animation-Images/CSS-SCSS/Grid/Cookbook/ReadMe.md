# Grid Example Codes

Those I forget more easly:

<!-- @import "[TOC]" {cmd="toc" depthFrom=2 depthTo=6 orderedList=false} -->

<!-- code_chunk_output -->

- [`minmax` `min-content`, `max-content`](#minmax-min-content-max-content)
- [`grid-template-areas`](#grid-template-areas)
- [`auto-flow`](#auto-flow)
- [`repeat`](#repeat)
- [`repeat -> auto-fit`](#repeat-auto-fit)
- [named columns](#named-columns)
- [auto-fill & auto-fit](#auto-fill-auto-fit)
- [dense](#dense)
- [auto-rows](#auto-rows)
- [order rows](#order-rows)
- [short hand `start/end`](#short-hand-startend)
- [short hand `grid`](#short-hand-grid)
- [Fluid Columns](#fluid-columns)
- [Animation (currently poor supported)](#animation-currently-poor-supported)

<!-- /code_chunk_output -->

## `minmax` `min-content`, `max-content`

<!-- prettier-ignore-start -->
```css
.container {
  display: grid;
  grid-gap: 10px;
  grid-template-columns:
    minmax (min-content, 1fr)
    minmax (max-content, 1fr);
}
```
<!-- prettier-ignore-end -->

## `grid-template-areas`

<!-- prettier-ignore-start -->
```css
.container {
  display: grid;
  grid-template-columns: 1fr 1fr;
  grid-template-rows: auto 1fr auto;
  grid-gap: 10px;
  grid-template-areas:
    'header header'
    'navigation content'
    'footer footer';
}

.header {
  grid-area: header;
}

.navigation {
  grid-area: navigation;
}

.content {
  grid-area: content;
}

.footer {
  grid-area: footer;
}

@media (max-width: 600px) {
  .grid-level-0 {
    grid-template-columns: 1fr;
    grid-template-areas:
      'header'
      'navigation'
      'content'
      'footer';
    grid-template-rows: auto;
  }

  .grid-level-1 {
    grid-template-rows: 1fr;
  }

  .box {
    background-color: yellowgreen !important;
    color: blueviolet;
  }
}
```
<!-- prettier-ignore-end -->

## `auto-flow`

```css
.container {
  display: grid;
  grid-auto-flow: column;
  grid-template-columns: 1fr;
  grid-gap: 10px;
}
```

## `repeat`

```css
.container {
  display: grid;
  grid-template-columns: repeat(
    1,
    minmax(120px, 1fr) minmax(240px, 1fr)
  );
  grid-gap: 10px;
}
```

## `repeat -> auto-fit`

<!-- prettier-ignore-start -->
```css
.container {
  display: grid;
  grid-template-columns:
    repeat(auto-fit, minmax(480px, 1fr));
  grid-gap: 10px;
}
```
<!-- prettier-ignore-end -->

## named columns

<!-- prettier-ignore-start -->

```css
.container {
  display: grid;
  grid-gap: 10px;
  height: 100vh;
  grid-template-columns:
    [start]
    repeat(2,
      [col-sml-start] minmax(20px, auto)
      [col-sml-end col-lrg-start] minmax(90px, auto)
      [col-lrg-end]
    ) [end]
}
```
<!-- prettier-ignore-end -->

## auto-fill & auto-fit

`auto-fit` fills empty space

<!-- prettier-ignore-start -->
```css
.container {
  display: grid;
  grid-gap: 10px;
  grid-template-columns:
    repeat(auto-fit, minmax(288px, 1fr));
}


.container {
  display: grid;
  grid-gap: 10px;
  grid-template-columns:
    repeat(auto-fill, minmax(288px, 1fr));
}

```

<!-- prettier-ignore-end -->

## dense

`dense` (dicht) fills the emtpy space with a grid box, if available.

```css
grid-auto-flow: column dense;
```

## auto-rows

Example: First two rows have the dimensions: `1fr` and `2fr` and all
others `1fr`:

<!-- prettier-ignore-start -->
```css
.container {
  display: grid;
  grid-gap: 20px;
  grid-template-rows: 1fr 2fr;
  grid-auto-rows: 1fr;
  grid-template-columns:
    repeat(auto-fill, minmax(288px, auto));
}
```
<!-- prettier-ignore-end -->

## order rows

Third element at the top:

```css
.grid-box:nth-of-type(3) {
  /* standard order of all boxes in HTML-DOM is 0 */
  order: -1  /* OR */
  grid-row: 1  /* NOT BOTH , order OR grid-row */
}
```

## short hand `start/end`

Short hand for `grid-column-start` and `grid-column-end`. (The samle
applies `grid-row` too.)

```css
grid-column: 4 / span 2;
```

## short hand `grid`

Equivalent blocks:

```css
.container {
  grid: 100px 200px / 2fr 1fr;
}

.container {
  grid-template-rows: 100px 200px;
  grid-template-columns: 2fr 1fr;
}
```

```css
.container {
  grid: auto-flow / 280px 1fr;
}

.container {
  grid-auto-flow: row;
  grid-template-columns: 280px 1fr;
}
```

```css
.container {
  grid: auto-flow dense 120px / 1fr 2fr;
}

.container {
  grid-auto-flow: row dense;
  grid-auto-rows: 120px;
  grid-template-columns: 1fr 2fr;
}
```

```css
.container {
  grid: 120px 280px / auto-flow 300px;
}

.container {
  grid-template-rows: 120px 280px;
  grid-auto-flow: column;
  grid-auto-columns: 300px;
}
```

A more complex example:

```css
.container {
  grid:
    [row1-start] 'header header header' 1fr [row1-end]
    [row2-start] 'footer footer footer' 30px [row2-end]
    / auto 60px auto;
}

.container {
  grid-template-areas:
    'header header header'
    'footer footer footer';
  grid-template-rows: [row1-start] 1fr [row1-end row2-start] 30px [row2-end];
  grid-template-columns: auto 60px auto;
}
```

## Fluid Columns

Source and Explanation here:
<https://css-tricks.com/snippets/css/complete-guide-grid/#grid>

```css
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  /* This is better for small screens, once min() is better supported */
  /* grid-template-columns: repeat(auto-fill, minmax(min(200px, 100%), 1fr)); */
  gap: 1rem;
}
```

## Animation (currently poor supported)

Source and Explanation here:
<https://css-tricks.com/snippets/css/complete-guide-grid/#animation>

According to the CSS Grid Layout Module Level 1 specification, there
are 5 animatable grid properties:

- `grid-gap`, `grid-row-gap`, `grid-column-gap` as length,
  percentage, or calc.
- `grid-template-columns`, `grid-template-rows` as a simple list of
  length, percentage, or calc, provided the only differences are the
  values of the length, percentage, or calc components in the list.

As of this writing, only the animation of (grid-)gap,
(grid-)row-gap, (grid-)column-gap is implemented in any of the
tested browsers.
