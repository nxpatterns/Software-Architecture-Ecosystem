# News++

<!-- @import "[TOC]" {cmd="toc" depthFrom=2 depthTo=6 orderedList=false} -->

<!-- code_chunk_output -->

- [aspect-ratio](#aspect-ratio)
- [Media Queries Range Contexts](#media-queries-range-contexts)
- [Anchor Positioning](#anchor-positioning)
- [@container size queries](#container-size-queries)
- [@container style queries](#container-style-queries)
- [Colors](#colors)
- [Filters Effects](#filters-effects)
- [backdrop-filter](#backdrop-filter)
- [Animation](#animation)
- [Intrinsic Sizing](#intrinsic-sizing)
- [conic-gradient()](#conic-gradient)
- [offset-path](#offset-path)
- [color()](#color)
- [accent-color](#accent-color)
- [color-mix()](#color-mix)
- [Wide Gamut Colors](#wide-gamut-colors)
- [Relative Colors](#relative-colors)
- [Scroll Snap](#scroll-snap)
- [overscroll-behavior](#overscroll-behavior)
- [scroll-behavior](#scroll-behavior)
- [scrollbar-gutter](#scrollbar-gutter)
- [ViewTransition API](#viewtransition-api)
- [scroll-timeline](#scroll-timeline)
- [view-timeline](#view-timeline)
- [font-display](#font-display)
- [line-clamp](#line-clamp)
- [Variable Fonts](#variable-fonts)
- [text-wrap: balance](#text-wrap-balance)
- [text-wrap: pretty](#text-wrap-pretty)
- [hanging-punctuation](#hanging-punctuation)
- [prefers-reduced-motion](#prefers-reduced-motion)
- [prefers-color-scheme](#prefers-color-scheme)
- [prefers-reduced-data](#prefers-reduced-data)
- [color-scheme](#color-scheme)
- [prefers-contrast](#prefers-contrast)
- [forced-colors](#forced-colors)
- [:focus-visible](#focus-visible)
- [light-dark()](#light-dark)
- [Comparison Functions](#comparison-functions)
- [Trigonometric Functions](#trigonometric-functions)
- [Stepped Value Functions](#stepped-value-functions)
- [Sign-related Functions](#sign-related-functions)
- [Exponential Functions](#exponential-functions)
- [@supports](#supports)
- [@property](#property)
- [:has()](#has)
- [:where()](#where)
- [@layer](#layer)
- [CSS Nesting](#css-nesting)
- [CSS Nesting (developer.chrome.com)](#css-nesting-developerchromecom)
- [image-set()](#image-set)
- [image()](#image)
- [@scope](#scope)

<!-- /code_chunk_output -->


## aspect-ratio

The aspect-ratio CSS property allows you to define the desired width-to-height ratio of an element's box. This means that even if the parent container or viewport size changes, the browser will adjust the element's dimensions to maintain the specified width-to-height ratio. The specified aspect ratio is used in the calculation of auto sizes and some other layout functions.

https://developer.mozilla.org/en-US/docs/Web/CSS/aspect-ratio

## Media Queries Range Contexts

## Anchor Positioning

Future CSS: Anchor Positioning (kizu.dev)
Tether elements to each other with CSS anchor positioning (developer.chrome.com)

## @container size queries

Container queries enable you to apply styles to an element based on the size of the element's container. If, for example, a container has less space available in the surrounding context, you can hide certain elements or use smaller fonts.

https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_containment/Container_queries

## @container style queries

Container queries enable you to apply styles to elements nested within a specific container based on the features of that container. The query returns true or false depending on whether the query condition is true for the container.

https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_containment/Container_size_and_style_queries

## Colors

mix-blend-mode, background-blend-mode, isolation

The CSS data type describes how colors should appear when elements overlap. It is used in the background-blend-mode and mix-blend-mode properties.

https://developer.mozilla.org/en-US/docs/Web/CSS/blend-mode

## Filters Effects

blur(), brightness(), contrast()…

The filter CSS property applies graphical effects like blur or color shift to an element. Filters are commonly used to adjust the rendering of images, backgrounds, and borders.

https://developer.mozilla.org/en-US/docs/Web/CSS/filter

## backdrop-filter

The backdrop-filter CSS property lets you apply graphical effects such as blurring or color shifting to the area behind an element. Because it applies to everything behind the element, to see the effect the element or its background needs to be transparent or partially transparent.

https://developer.mozilla.org/en-US/docs/Web/CSS/backdrop-filter

## Animation

The CSS data type represents a mathematical function that describes the rate at which a value changes.

https://developer.mozilla.org/en-US/docs/Web/CSS/easing-function
Using linear() for better animation (fullystacked.net)
Linear() Generator (linear-easing-generator.netlify.app)

## Intrinsic Sizing

min-content, max-content, fit-content

The min-content sizing keyword represents the minimum intrinsic size of the content. For text content this means that the content will take all soft-wrapping opportunities, becoming as small as the longest word.

https://developer.mozilla.org/en-US/docs/Web/CSS/min-content

## conic-gradient()

The conic-gradient() CSS function creates an image consisting of a gradient with color transitions rotated around a center point (rather than radiating from the center). Example conic gradients include pie charts and color wheels. The result of the conic-gradient() function is an object of the data type, which is a special kind of .

https://developer.mozilla.org/en-US/docs/Web/CSS/gradient/conic-gradient

## offset-path

The offset-path CSS property specifies a path for an element to follow and determines the element's positioning within the path's parent container or the SVG coordinate system. The path is a line, a curve, or a geometrical shape along which the element gets positioned or moves.

https://developer.mozilla.org/en-US/docs/Web/CSS/offset-path

## color()

The color() functional notation allows a color to be specified in a particular, specified color space rather than the implicit sRGB color space that most of the other color functions operate in.

https://developer.mozilla.org/en-US/docs/Web/CSS/color_value/color

## accent-color

The accent-color CSS property sets the accent color for user-interface controls generated by some elements.

https://developer.mozilla.org/en-US/docs/Web/CSS/accent-color

## color-mix()

The color-mix() functional notation takes two values and returns the result of mixing them in a given colorspace by a given amount.

https://developer.mozilla.org/en-US/docs/Web/CSS/color_value/color-mix

## Wide Gamut Colors

lch(), lab(), oklch(), oklab()

The lch() functional notation expresses a given color using the LCH color space, which represents lightness, chroma, and hue. It uses the same L axis as the lab() color function of the CIELab color space, but it uses the polar coordinates C (Chroma) and H (Hue).

https://developer.mozilla.org/en-US/docs/Web/CSS/color_value/lch

## Relative Colors

Create a color theme with CSS Relative Color Syntax, CSS color-mix(), and CSS color-contrast() (bram.us)

## Scroll Snap

scroll-snap-type, scroll-snap-align, scroll-padding…

The CSS scroll snap module provides properties that let you control the panning and scrolling behavior by defining snap positions. Content can be snapped into position as the user scrolls overflowing content within a scroll container, providing paging and scroll positioning.

https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_scroll_snap

## overscroll-behavior

The overscroll-behavior CSS property sets what a browser does when reaching the boundary of a scrolling area.

https://developer.mozilla.org/en-US/docs/Web/CSS/overscroll-behavior

## scroll-behavior

The scroll-behavior CSS property sets the behavior for a scrolling box when scrolling is triggered by the navigation or CSSOM scrolling APIs.

https://developer.mozilla.org/en-US/docs/Web/CSS/scroll-behavior

## scrollbar-gutter

The scrollbar-gutter CSS property allows authors to reserve space for the scrollbar, preventing unwanted layout changes as the content grows while also avoiding unnecessary visuals when scrolling isn't needed.

https://developer.mozilla.org/en-US/docs/Web/CSS/scrollbar-gutter

## ViewTransition API

The View Transitions API provides a mechanism for easily creating animated transitions between different website views. This includes animating between DOM states in a single-page app (SPA), and animating the navigation between documents in a multi-page app (MPA).

https://developer.mozilla.org/en-US/docs/Web/API/View_Transitions_API
Smooth and simple transitions with the View Transitions API (developer.chrome.com)

## scroll-timeline

The scroll-timeline CSS shorthand property is used to define a named scroll progress timeline, which is progressed through by scrolling a scrollable element (scroller) between top and bottom (or left and right). scroll-timeline is set on the scroller that will provide the timeline. The starting scroll position represents 0% progress and the ending scroll position represents 100% progress. If the 0% position and 100% position coincide (i.e., the scroll container has no overflow to scroll), the timeline is inactive.

https://developer.mozilla.org/en-US/docs/Web/CSS/scroll-timeline

## view-timeline

The view-timeline CSS shorthand property is used to define a named view progress timeline, which is progressed through based on the change in visibility of an element (known as the subject) inside a scrollable element (scroller). view-timeline is set on the subject.

https://developer.mozilla.org/en-US/docs/Web/CSS/view-timeline

Discrete Properties Animations

Animate to and from properties such as display: none

## font-display

The font-display descriptor for the @font-face at-rule determines how a font face is displayed based on whether and when it is downloaded and ready to use.

https://developer.mozilla.org/en-US/docs/Web/CSS/@font-face/font-display

## line-clamp

The -webkit-line-clamp CSS property allows limiting of the contents of a block to the specified number of lines.

https://developer.mozilla.org/en-US/docs/Web/CSS/-webkit-line-clamp

## Variable Fonts

Variable fonts are an evolution of the OpenType font specification that enables many different variations of a typeface to be incorporated into a single file, rather than having a separate font file for every width, weight, or style. They let you access all the variations contained in a given font file via CSS and a single @font-face reference. This article will give you all you need to know to get you started using variable fonts.

https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_fonts/Variable_fonts_guide

## text-wrap: balance

The text-wrap CSS shorthand property controls how text inside an element is wrapped. The different values provide:

https://developer.mozilla.org/en-US/docs/Web/CSS/text-wrap
CSS text-wrap: balance (developer.chrome.com)

## text-wrap: pretty

The text-wrap CSS shorthand property controls how text inside an element is wrapped. The different values provide:

https://developer.mozilla.org/en-US/docs/Web/CSS/text-wrap
CSS text-wrap: pretty (developer.chrome.com)

## hanging-punctuation

The hanging-punctuation CSS property specifies whether a punctuation mark should hang at the start or end of a line of text. Hanging punctuation may be placed outside the line box.

https://developer.mozilla.org/en-US/docs/Web/CSS/hanging-punctuation

## prefers-reduced-motion

The prefers-reduced-motion CSS media feature is used to detect if a user has enabled a setting on their device to minimize the amount of non-essential motion. The setting is used to convey to the browser on the device that the user prefers an interface that removes, reduces, or replaces motion-based animations.

https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion

## prefers-color-scheme

The prefers-color-scheme CSS media feature is used to detect if a user has requested light or dark color themes. A user indicates their preference through an operating system setting (e.g. light or dark mode) or a user agent setting.

https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-color-scheme

## prefers-reduced-data

The prefers-reduced-data CSS media feature is used to detect if the user has requested the web content that consumes less internet traffic.

https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-data

## color-scheme

The color-scheme CSS property allows an element to indicate which color schemes it can comfortably be rendered in.

https://developer.mozilla.org/en-US/docs/Web/CSS/color-scheme

## prefers-contrast

The prefers-contrast CSS media feature is used to detect whether the user has requested the web content to be presented with a lower or higher contrast.

https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-contrast

## forced-colors

The forced-colors CSS media feature is used to detect if the user agent has enabled a forced colors mode where it enforces a user-chosen limited color palette on the page. An example of a forced colors mode is Windows High Contrast mode.

https://developer.mozilla.org/en-US/docs/Web/CSS/@media/forced-colors

## :focus-visible

The :focus-visible pseudo-class applies while an element matches the :focus pseudo-class and the UA (User Agent) determines via heuristics that the focus should be made evident on the element. (Many browsers show a "focus ring" by default in this case.)

https://developer.mozilla.org/en-US/docs/Web/CSS/:focus-visible

## light-dark()

The light-dark() CSS function enables setting two colors for a property - returning one of the two colors options by detecting if the developer has set a light or dark color scheme or the user has requested light or dark color theme - without needing to encase the theme colors within a prefers-color-scheme media feature query. Users are able to indicate their color-scheme preference through their operating system settings (e.g. light or dark mode) or their user agent settings. The light-dark() function enables providing two color values where any value is accepted. The light-dark() CSS color function returns the first value if the user's preference is set to light or if no preference is set and the second value if the user's preference is set to dark.

https://developer.mozilla.org/en-US/docs/Web/CSS/color_value/light-dark

## Comparison Functions

min(), max(), clamp()

CSS value functions are statements that invoke special data processing or calculations to return a CSS value for a CSS property. CSS value functions represent more complex data types and they may take some input arguments to calculate the return value.

https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Functions

## Trigonometric Functions

sin(), cos(), tan()…

CSS value functions are statements that invoke special data processing or calculations to return a CSS value for a CSS property. CSS value functions represent more complex data types and they may take some input arguments to calculate the return value.

https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Functions

## Stepped Value Functions

round(), mod(), rem()

CSS value functions are statements that invoke special data processing or calculations to return a CSS value for a CSS property. CSS value functions represent more complex data types and they may take some input arguments to calculate the return value.

https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Functions

## Sign-related Functions

sign(), abs()

The sign() CSS function contains one calculation, and returns -1 if the numeric value of the argument is negative, +1 if the numeric value of the argument is positive, 0⁺ if the numeric value of the argument is 0⁺, and 0⁻ if the numeric value of the argument is 0⁻.

https://developer.mozilla.org/en-US/docs/Web/CSS/sign

## Exponential Functions

pow(), sqrt(), exp(), log(), hypot()

The pow() CSS function is an exponential function that returns the value of a base raised to the power of a number.

https://developer.mozilla.org/en-US/docs/Web/CSS/pow

## @supports

The @supports CSS at-rule lets you specify CSS declarations that depend on a browser's support for CSS features. Using this at-rule is commonly called a feature query. The rule must be placed at the top level of your code or nested inside any other conditional group at-rule.

https://developer.mozilla.org/en-US/docs/Web/CSS/@supports

## @property

The @property CSS at-rule is part of the CSS Houdini umbrella of APIs. It allows developers to explicitly define their CSS custom properties, allowing for property type checking and constraining, setting default values, and defining whether a custom property can inherit values or not.

https://developer.mozilla.org/en-US/docs/Web/CSS/@property

## :has()

The functional :has() CSS pseudo-class represents an element if any of the relative selectors that are passed as an argument match at least one element when anchored against this element. This pseudo-class presents a way of selecting a parent element or a previous sibling element with respect to a reference element by taking a relative selector list as an argument.

https://developer.mozilla.org/en-US/docs/Web/CSS/:has

## :where()

The :where() CSS pseudo-class function takes a selector list as its argument, and selects any element that can be selected by one of the selectors in that list.

https://developer.mozilla.org/en-US/docs/Web/CSS/:where

## @layer

The @layer CSS at-rule is used to declare a cascade layer and can also be used to define the order of precedence in case of multiple cascade layers.

https://developer.mozilla.org/en-US/docs/Web/CSS/@layer

## CSS Nesting

## CSS Nesting (developer.chrome.com)

## image-set()

The image-set() CSS functional notation is a method of letting the browser pick the most appropriate CSS image from a given set, primarily for high pixel density screens.

https://developer.mozilla.org/en-US/docs/Web/CSS/image/image-set

## image()

The image() CSS function defines an  in a similar fashion to the url() function, but with added functionality including specifying the image's directionality, displaying just a part of that image defined by a media fragment, and specifying a solid color as a fallback in case none of the specified images are able to be rendered.

https://developer.mozilla.org/en-US/docs/Web/CSS/image/image

## @scope

The @scope CSS at-rule enables you to select elements in specific DOM subtrees, targeting elements precisely without writing overly-specific selectors that are hard to override, and without coupling your selectors too tightly to the DOM structure.

https://developer.mozilla.org/en-US/docs/Web/CSS/@scope

You are receiving this email because you completed the State of CSS 2024 survey (https://survey.devographics.com/survey/state-of-css/2024) and asked to receive a copy of your reading list.
