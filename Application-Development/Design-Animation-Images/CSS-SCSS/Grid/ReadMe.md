# Grid

<!-- @import "[TOC]" {cmd="toc" depthFrom=2 depthTo=6 orderedList=false} -->

<!-- code_chunk_output -->

- [Further Reading](#further-reading)
- [Basic Principles](#basic-principles)
  - [Properties for the Grid Container (Parent)](#properties-for-the-grid-container-parent)
  - [Properties for Grid Items (Children)](#properties-for-grid-items-children)
- [Parent Container](#parent-container)
  - [Grid template](#grid-template)
    - [Columns/rows](#columnsrows)
      - [repeat](#repeat)
    - [Areas](#areas)
      - [Example](#example)
  - [Gaps](#gaps)
  - [`justify-items` - row axis](#justify-items-row-axis)
  - [`align-items` - column axis](#align-items-column-axis)
  - [`place-items` shorthand](#place-items-shorthand)
  - [`justify-content` - Within the grid container](#justify-content-within-the-grid-container)
  - [`align-content` - Within the grid container](#align-content-within-the-grid-container)
  - [`place-content` shorthand](#place-content-shorthand)
  - [Auto Columns/Rows](#auto-columnsrows)
    - [grid-auto-columns](#grid-auto-columns)
    - [grid-auto-rows](#grid-auto-rows)
  - [`grid-auto-flow`](#grid-auto-flow)
  - [`grid` a great shorthand](#grid-a-great-shorthand)
- [Items (Children)](#items-children)
  - [Start/End](#startend)
  - [Column/Row](#columnrow)
  - [Grid Area](#grid-area)
  - [Justify self (inside a cell - x axis)](#justify-self-inside-a-cell-x-axis)
  - [Align self (inside a cell - y axis)](#align-self-inside-a-cell-y-axis)
  - [Place self](#place-self)
  - [Sizing Keywords](#sizing-keywords)
    - [min-content (min word-length)](#min-content-min-word-length)
    - [max-content (max line-length)](#max-content-max-line-length)
    - [auto (like 1fr but fills the remaining space if available)](#auto-like-1fr-but-fills-the-remaining-space-if-available)
    - [fit-content (between min and max)](#fit-content-between-min-and-max)
    - [franctional units](#franctional-units)
  - [Functions](#functions)
    - [`minmax (100px, 1fr)`](#minmax-100px-1fr)
    - [`repeat(4, 1fr)`, `repeat(4, minmax (100px, 1fr))`](#repeat4-1fr-repeat4-minmax-100px-1fr)
      - [`auto-fill`, `auto-fit` &rarr; `repeat(auto-fit, minmax (100px, 1fr))`](#auto-fill-auto-fit-rarr-repeatauto-fit-minmax-100px-1fr)
  - [Subgrid (supported only in Firefox at the time of writing)](#subgrid-supported-only-in-firefox-at-the-time-of-writing)
    - [Interesting Topic: `display: content`within grids](#interesting-topic-display-contentwithin-grids)
  - [Masonry (Hot topic)](#masonry-hot-topic)

<!-- /code_chunk_output -->

## Further Reading

See Cookbook [here](./Cookbook/ReadMe.md)

Complete Guide Grid:
<https://css-tricks.com/snippets/css/complete-guide-grid/>

Complete Guide Flex:
<https://css-tricks.com/snippets/css/a-guide-to-flexbox/>

## Basic Principles

- Container Element

  - `display: grid`
  - grid-template-columns and/or
  - grid-template-rows
  - grid-template-areas
  - ..

- Child Element
  - grid-area -..

### Properties for the Grid Container (Parent)

- display
  - grid | inline-grid
  - sub-grid -> see <https://www.w3.org/TR/css-grid-2/#subgrids>
- grid-template-columns
- grid-template-rows
- grid-template-areas
- grid-template, a shorthand for
  - grid-template-rows
  - grid-template-columns
  - grid-template-areas
- grid-column-gap
- grid-row-gap
- grid-gap
- justify-items
- align-items
- place-items
- justify-content
- align-content
- place-content
- grid-auto-columns
- grid-auto-rows
- grid-auto-flow
- grid

### Properties for Grid Items (Children)

- grid-column-start
- grid-column-end
- grid-row-start
- grid-row-end
- grid-column
- grid-row
- grid-area
- justify-self
- align-self
- place-self

## Parent Container

### Grid template

Please notice `grid-template` is a shorthand for

- grid-template-rows
- grid-template-columns
- grid-template-areas

and since it **does not reset** the implicit grid properties like

- grid-auto-columns
- grid-auto-rows
- grid-auto-flow

better use the `grid` instead of `grid-template`.

#### Columns/rows

```css
grid-template-columns:
grid template-rows:
  // for both, note the bracket syntax
  [row-or-columm1-name] track1-size [row-or-columm-n-name] track-n-size
```

##### repeat

```css
grid-template-columns: repeat(3, 1f); // = 1f 1f 1f
```

#### Areas

```css
/* CONTAINER */
grid-template-areas:
  '<grid-area-name> | . | none | ...'
  '...';

/* ITEM X */

grid-area: <grid-area-name>;
```

##### Example

```css
.grid-level-0 {
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
```

### Gaps

- `grid-gap` = `gap` = is a shorthand for:
  - `grid-row-gap` (OLD) = `row-gap` (NEW)
  - `grid-column-gap` (OLD) = `column-gap` (NEW)

### `justify-items` - row axis

`stretch` is default

```css
/* CONTAINER */
justify-items: start | end | center | stretch;
```

### `align-items` - column axis

`stretch` is default. See `baseline` example here:
<https://codepen.io/chriscoyier/pen/NWvvPRj>

```css
/* CONTAINER */
align-items: start | end | center | baseline | stretch;
```

### `place-items` shorthand

is a shorthand for `<align-items>` / `<justify-items>`

### `justify-content` - Within the grid container

<!-- prettier-ignore-start -->
```css
/* CONTAINER */
justify-content:
  start |
  end |
  center |
  stretch |
  space-around |
  space-between |
  space-evenly;
```
<!-- prettier-ignore-end -->

### `align-content` - Within the grid container

<!-- prettier-ignore-start -->
```css
/* CONTAINER */
 align-content:
   start |
   end |
   center |
   stretch |
   pace-around |
   space-between |
   space-evenly;
```
<!-- prettier-ignore-end -->

### `place-content` shorthand

is a shorthand for `align-content` and `justify-content`.

### Auto Columns/Rows

It Specifies the size of any auto-generated grid item (tracks or
better said `implicit grid tracks`). These are automatically created
tracks if there are more grid tracks than within the initial
configuration/definition.

See this article first:
<https://css-tricks.com/difference-explicit-implicit-grids/>

#### grid-auto-columns

```css
.container {
  grid-auto-columns: <track-size>...;
}
```

#### grid-auto-rows

```css
.container {
  grid-auto-rows: <track-size>...;
}
```

### `grid-auto-flow`

excerpt from the source:
<https://css-tricks.com/snippets/css/complete-guide-grid/#grid-auto-flow>
(I could not describe it better)

- row – tells the auto-placement algorithm to fill in each row in
  turn, adding new rows as necessary (default)
- column – tells the auto-placement algorithm to fill in each column
  in turn, adding new columns as necessary
- dense – tells the auto-placement algorithm to attempt to fill in
  holes earlier in the grid if smaller items come up later

> Note that **dense** only changes the visual order of your items
> and might cause them to appear out of order, which is **bad for
> accessibility**.

```css
.container {
  grid-auto-flow: row | column | row dense | column dense;
}
```

### `grid` a great shorthand

See more about it here:
<https://css-tricks.com/snippets/css/complete-guide-grid/#grid>

## Items (Children)

### Start/End

See overlapping example
[here](../Flex-and-Grid/examples/grid/overlapping.html).

```css
.item {
  /* Properties */
  grid-column-start:
  grid-column-end:
  grid-row-start:
  grid-row-end:
  /* Values */
  <line-number> | <name> | span <number> | span <name> | auto;
}
```

### Column/Row

`grid-column` and `grid-row` sind a shorthand for Start/End (see
above).

```css
.item {
  /* Properties */
  grid-column:
  grid-row:
  /* Values */
  <start-line> / <end-line> OR <start-line> / span <value>;
}
```

### Grid Area

A reference to grid-template-areas in Parent Container or given
values:

```css
.item-xy {
  /*
   * grid-area-name defined within parent container:
   * grid-template-areas
   */
  grid-area: header;
}

/* OR */

.item-xy {
  grid-area: <row-start> / <column-start> / <row-end> / <column-end>;
  /* 5 columns and 3 rows -> last entire colum */
  grid-area: 1/4/4/6;
}
```

### Justify self (inside a cell - x axis)

default: stretch

```css
.item-xy {
  justify-self: start | end | center | stretch;
}
```

### Align self (inside a cell - y axis)

```css
.item-xy {
  align-self: start | end | center | stretch;
}
```

### Place self

shorhand for `align-self` and `justify-self` (see above):

```css
.item-xy {
  place-self: center stretch;
}
```

**Important:** All major browsers except **Edge** support the
place-self shorthand property.

### Sizing Keywords

#### min-content (min word-length)

#### max-content (max line-length)

#### auto (like 1fr but fills the remaining space if available)

#### fit-content (between min and max)

#### franctional units

### Functions

Further reading:
[Flexible Grids](https://css-tricks.com/books/greatest-css-tricks/flexible-grids/),
[auto fit vs fill](https://css-tricks.com/auto-sizing-columns-css-grid-auto-fill-vs-auto-fit/)

#### `minmax (100px, 1fr)`

#### `repeat(4, 1fr)`, `repeat(4, minmax (100px, 1fr))`

##### `auto-fill`, `auto-fit` &rarr; `repeat(auto-fit, minmax (100px, 1fr))`

### Subgrid (supported only in Firefox at the time of writing)

&rarr; see here:
<https://css-tricks.com/snippets/css/complete-guide-grid/#subgrid>

#### Interesting Topic: `display: content`within grids

&rarr; see here: Section further below
<https://css-tricks.com/snippets/css/complete-guide-grid/#subgrid>

### Masonry (Hot topic)

Experimental but interesting:

Further reading:

- <https://css-tricks.com/piecing-together-approaches-for-a-css-masonry-layout/>
- <https://drafts.csswg.org/css-grid-3/#masonry-layout>
- <https://www.smashingmagazine.com/native-css-masonry-layout-css-grid/>

```css
.container {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  grid-template-rows: masonry;
}
``
```
