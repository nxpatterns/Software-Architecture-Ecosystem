# Colors

## Generating colors programmatically

```javascript
for (let i = 0; i <= 23; i++) {
  const darkness = i / 23;
  let newColor = tinycolor(baseColor)
    .darken(darkness * 100)
    .toString();
  colors.push(newColor);
}
```

## Detecting light and dark colors

To programmatically detect if a color is bright or dark given the hex codes, you can convert the color to the HSL (Hue, Saturation, Lightness) format. In
this format, the 'L' (Lightness) value can tell you whether a color is light or dark.

Chroma.js offers very easy conversion from one color space to another. You can use the chroma.luminance() function, which will return the relative luminance
(perceived brightness) of a color. It returns a value between 0 (black) and 1 (white).

```javascript
let color = chroma('#005C88');
let luminance = color.luminance();
if (luminance < 0.5) {
  console.log('dark color');
} else {
  console.log('light color');
}
```

You can use this luminance value to adjust your darkening factor dynamically. For example, if luminance is less than a certain threshold (say, 0.5), you can
skip the darkening. If it's higher, you can decide how much to darken depending on how much above the threshold it is.
