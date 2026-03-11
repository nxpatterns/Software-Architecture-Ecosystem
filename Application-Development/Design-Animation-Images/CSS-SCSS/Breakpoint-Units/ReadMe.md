# Responsiveness

## Breakpoints

> Start with the small screen first, then expand until it looks like shit. Time for a breakpoint! –Stephen Hay

## Material Design Viewport Breakpoints

<pre>
phone_iphone      Extra small     xs	small to large handset	      < 600px
tablet            Small           sm	small to medium tablet	      600px > < 960px
laptop            Medium          md	large tablet to laptop	      960px > < 1264*
desktop_windows   Large           lg	desktop	                      1264 > < 1904px*
tv                Extra large     xl	4k and ultra-wides            > 1904px*

* -16px on Desktop
</pre>

## CSS units

See original Post here: https://gist.github.com/basham/2175a16ab7c60ce8e001#file-css-units-best-practices-md

### Further Reading

- Browser Support: https://www.quirksmode.org/css/units-values/
- Can I use Viewpoint units: https://caniuse.com/#feat=viewport-units
- https://www.w3.org/Style/Examples/007/units.de.html
- https://webdesign.tutsplus.com/articles/7-css-units-you-might-not-know-about--cms-22573
- Font related: http://meyerweb.com/eric/thoughts/2012/05/15/defining-ch/
- Web Typography: https://webdesign.tutsplus.com/articles/the-anatomy-of-web-typography--webdesign-10533

| Media  | Recommended | Mostly in use      | Seldom                     | Not recommended        |
| :----- | :---------- | :----------------- | :------------------------- | :--------------------- |
| Screen | em, rem, %  | px                 | ch, ex, vw, vh, vmin, vmax | cm, mm, in, pt, pc     |
| Print  | em, rem, %  | cm, mm, in, pt, pc | ch, ex                     | px, vw, vh, vmin, vmax |

### Relative units

[Relative units](http://www.w3.org/TR/css3-values/#font-relative-lengths)
play nicely with both screen and print media types and should be
the most frequently used CSS units.

| Unit                                              | Description                                                             |
| :------------------------------------------------ | :---------------------------------------------------------------------- |
| %                                                 | percentage, relative to the same property of the parent element         |
| [em](http://www.w3.org/TR/css3-values/#em-unit)   | relative to font size of the element                                    |
| [rem](http://www.w3.org/TR/css3-values/#rem-unit) | relative to font size of the root element                               |
| [ch](http://www.w3.org/TR/css3-values/#ch-unit)   | relative to width of the "0" (ZERO, U+0030) glyph in the element's font |
| [ex](http://www.w3.org/TR/css3-values/#ex-unit)   | relative to x-height of the font                                        |

### Absolute units

Physical units (e.g. cm, mm, in, pc, and pt)
should only be used for print style sheets,
while pixels (px) should only be used for the screen.

### Viewport units

[Viewport-percentage length units](http://www.w3.org/TR/css3-values/#viewport-relative-lengths)
should be used with caution, as there is still some
[lingering bugs with their implementation](http://caniuse.com/#feat=viewport-units).

| Unit                                                | Description                                    |
| :-------------------------------------------------- | :--------------------------------------------- |
| [vw](http://www.w3.org/TR/css3-values/#vw-unit)     | relative to 1% of viewport's width             |
| [vh](http://www.w3.org/TR/css3-values/#vh-unit)     | relative to 1% of viewport's height            |
| [vmin](http://www.w3.org/TR/css3-values/#vmin-unit) | relative to 1% of viewport's smaller dimension |
| [vmax](http://www.w3.org/TR/css3-values/#vmax-unit) | relative to 1% of viewport's larger dimension  |

## Use cases

### Document-level

Assume the root font size is `16px` but don't require it to be so. Either declare the font size as `100%` or don't declare the `font-size` property at all.

```css
html {
  font-size: 100%;
}
```

### Borders

Most likely use `px`, as most of the time, the border shouldn't need to scale.

### Font-size

Font-size should only be applied at the lowest possible child elements,
in order to minimize its cascading impact on relative units.
While both of the following two examples are **essentially equivalent**,
only the first is recommended.

**DO**:

```css
.Component {
}
.Component-heading {
  font-size: 1.2em;
}
.Component-body {
  font-size: 0.9em;
}
```

**DO NOT**:

```css
.Component {
  font-size: 1.2em;
}
.Component-heading {
  font-size: 1em;
}
.Component-body {
  font-size: 0.75em;
}
```

### Padding and margin

In order to ensure consistent use of whitespace throughout the application,
given a component could be used in a variety of contexts,
it may be best to use `rem` for margin and padding than `em`.

```css
.Component {
  margin: 1rem 0;
  padding: 1rem;
}
```

### Media queries

[Only use `em` within media query definitions, never pixels](http://blog.cloudfour.com/the-ems-have-it-proportional-media-queries-ftw/).
Until there's wider [`rem` support within media queries](http://fvsch.com/code/bugs/rem-mediaquery/),
[`rem` should be avoided in media queries as well](http://codeboxers.com/em-vs-px-vs-rem-in-media-queries/).

```css
@media (min-width: 20em) {
  .Component {
    background-color: blue;
  }
}
```

#### Common Values (Some of them)

```css
/* Smartphones (portrait and landscape) ----------- */
@media only screen and (min-device-width: 320px) and (max-device-width: 480px) {
  /* Styles */
}

/* Smartphones (landscape) ----------- */
@media only screen and (min-width: 321px) {
  /* Styles */
}

/* Smartphones (portrait) ----------- */
@media only screen and (max-width: 320px) {
  /* Styles */
}

/* iPads (portrait and landscape) ----------- */
@media only screen and (min-device-width: 768px) and (max-device-width: 1024px) {
  /* Styles */
}

/* iPads (landscape) ----------- */
@media only screen and (min-device-width: 768px) and (max-device-width: 1024px) and (orientation: landscape) {
  /* Styles */
}

/* iPads (portrait) ----------- */
@media only screen and (min-device-width: 768px) and (max-device-width: 1024px) and (orientation: portrait) {
  /* Styles */
}
/**********
iPad 3
**********/
@media only screen and (min-device-width: 768px) and (max-device-width: 1024px) and (orientation: landscape) and (-webkit-min-device-pixel-ratio: 2) {
  /* Styles */
}

@media only screen and (min-device-width: 768px) and (max-device-width: 1024px) and (orientation: portrait) and (-webkit-min-device-pixel-ratio: 2) {
  /* Styles */
}

/* Desktops and laptops ----------- */
@media only screen and (min-width: 1224px) {
  /* Styles */
}

/* Large screens ----------- */
@media only screen and (min-width: 1824px) {
  /* Styles */
}

/* iPhone 4 ----------- */
@media only screen and (min-device-width: 320px) and (max-device-width: 480px) and (orientation: landscape) and (-webkit-min-device-pixel-ratio: 2) {
  /* Styles */
}

@media only screen and (min-device-width: 320px) and (max-device-width: 480px) and (orientation: portrait) and (-webkit-min-device-pixel-ratio: 2) {
  /* Styles */
}

/* iPhone 5 ----------- */
@media only screen and (min-device-width: 320px) and (max-device-height: 568px) and (orientation: landscape) and (-webkit-device-pixel-ratio: 2) {
  /* Styles */
}

@media only screen and (min-device-width: 320px) and (max-device-height: 568px) and (orientation: portrait) and (-webkit-device-pixel-ratio: 2) {
  /* Styles */
}

/* iPhone 6 ----------- */
@media only screen and (min-device-width: 375px) and (max-device-height: 667px) and (orientation: landscape) and (-webkit-device-pixel-ratio: 2) {
  /* Styles */
}

@media only screen and (min-device-width: 375px) and (max-device-height: 667px) and (orientation: portrait) and (-webkit-device-pixel-ratio: 2) {
  /* Styles */
}

/* iPhone 6+ ----------- */
@media only screen and (min-device-width: 414px) and (max-device-height: 736px) and (orientation: landscape) and (-webkit-device-pixel-ratio: 2) {
  /* Styles */
}

@media only screen and (min-device-width: 414px) and (max-device-height: 736px) and (orientation: portrait) and (-webkit-device-pixel-ratio: 2) {
  /* Styles */
}

/* Samsung Galaxy S3 ----------- */
@media only screen and (min-device-width: 320px) and (max-device-height: 640px) and (orientation: landscape) and (-webkit-device-pixel-ratio: 2) {
  /* Styles */
}

@media only screen and (min-device-width: 320px) and (max-device-height: 640px) and (orientation: portrait) and (-webkit-device-pixel-ratio: 2) {
  /* Styles */
}

/* Samsung Galaxy S4 ----------- */
@media only screen and (min-device-width: 320px) and (max-device-height: 640px) and (orientation: landscape) and (-webkit-device-pixel-ratio: 3) {
  /* Styles */
}

@media only screen and (min-device-width: 320px) and (max-device-height: 640px) and (orientation: portrait) and (-webkit-device-pixel-ratio: 3) {
  /* Styles */
}

/* Samsung Galaxy S5 ----------- */
@media only screen and (min-device-width: 360px) and (max-device-height: 640px) and (orientation: landscape) and (-webkit-device-pixel-ratio: 3) {
  /* Styles */
}

@media only screen and (min-device-width: 360px) and (max-device-height: 640px) and (orientation: portrait) and (-webkit-device-pixel-ratio: 3) {
  /* Styles */
}
```

#### Further Reading

- https://medium.freecodecamp.org/the-100-correct-way-to-do-css-breakpoints-88d6a5ba1862
