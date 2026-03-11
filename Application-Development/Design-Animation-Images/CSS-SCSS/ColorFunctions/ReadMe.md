# SCSS Color Functions

> <https://sass-lang.com/documentation/modules/color>
> <https://www.w3schools.com/sass/sass_functions_color.asp>
>

<!-- @import "[TOC]" {cmd="toc" depthFrom=2 depthTo=6 orderedList=false} -->

<!-- code_chunk_output -->

- [Setting Colors](#setting-colors)
- [Getting Color Components](#getting-color-components)
- [Manipulating Colors](#manipulating-colors)
- [List of Common Color Functions](#list-of-common-color-functions)

<!-- /code_chunk_output -->

SCSS offers a variety of color functions that can be broadly categorized into functions for setting colors, getting color components, and manipulating colors. Here's an overview based on information from W3Schools and TutorialsTeacher:

## Setting Colors

- **rgb() / rgba()**: Creates a color based on the Red-Green-Blue (RGB) model, with an optional alpha channel for opacity.
- **hsl() / hsla()**: Similar to RGB but uses the Hue-Saturation-Lightness (HSL) model, again with an optional alpha channel.
- **grayscale()**: Generates a grayscale color.
- **complement()**: Produces the complementary color.
- **invert()**: Inverts the colors.

## Getting Color Components

- **red() / green() / blue()**: Returns the respective color component of a color.
- **hue() / saturation() / lightness() / alpha()**: Returns the respective HSL or opacity component of a color.

## Manipulating Colors

- **mix()**: Blends two colors.
- **adjust-hue()**: Changes the hue of a color.
- **lighten() / darken()**: Adjusts the lightness of a color.
- **saturate() / desaturate()**: Adjusts the saturation of a color.
- **opacify() / transparentize()**: Adjusts the opacity of a color.
- **adjust-color() / scale-color()**: Allows for more complex adjustments by changing one or more color properties.

These functions enable significant flexibility and control over color manipulation directly within your SCSS code. For a detailed explanation of each function, including syntax and examples, you can refer to the comprehensive guides on [W3Schools](https://www.w3schools.com/sass/sass_functions_color.asp) and [TutorialsTeacher](https://www.tutorialsteacher.com/sass/sass-color-functions).

## List of Common Color Functions

A list of the most common color functions in SCSS:

- `adjust-hue($color, $degrees)`: Changes the hue of a color.
- `lighten($color, $amount)`: Makes a color lighter by a certain percentage.
- `darken($color, $amount)`: Makes a color darker by a certain percentage.
- `saturate($color, $amount)`: Increases the saturation of a color.
- `desaturate($color, $amount)`: Decreases the saturation of a color.
- `grayscale($color)`: Converts a color to grayscale.
- `complement($color)`: Returns the complementary color.
- `invert($color)`: Inverts a color.
- `alpha($color) / opacity($color)`: Returns the alpha value (transparency) of a color.
- `rgba($color, $alpha)`: Adds or changes alpha transparency to a color value.
- `opacify($color, $amount) / fade-in($color, $amount)`: Makes a color less transparent.
- `transparentize($color, $amount) / fade-out($color, $amount)`: Makes a color more transparent.
- `mix($color1, $color2, [$weight])`: Blends two colors.
- `adjust-color($color, [$red], [$green], [$blue], [$hue], [$saturation], [$lightness], [$alpha])`: Adjusts multiple properties of a color.
- `scale-color($color, [$red], [$green], [$blue], [$saturation], [$lightness],  [$alpha])`: Scales multiple properties of a color relative to their current values.
- `change-color($color, [$red], [$green], [$blue], [$hue], [$saturation],[$lightness], [$alpha])`: Changes one or more properties of a color.
