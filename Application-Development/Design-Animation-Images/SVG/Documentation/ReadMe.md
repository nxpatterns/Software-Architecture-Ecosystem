# SVG

<!-- @import "[TOC]" {cmd="toc" depthFrom=2 depthTo=6 orderedList=true} -->

<!-- code_chunk_output -->

1. [Introduction](#introduction)
   1. [Within HTML](#within-html)
   2. [Shapes](#shapes)
      1. [rect, circle, ellipse, line, polyline, polygon](#rect-circle-ellipse-line-polyline-polygon)
   3. [Path](#path)
      1. [`moveto command`](#moveto-command)
      2. [`closepath command`](#closepath-command)
      3. [`lineto command`](#lineto-command)
      4. [`cubic Bézier curve command`](#cubic-bézier-curve-command)
      5. [`quadratic Bézier curve command`](#quadratic-bézier-curve-command)
      6. [`elliptical arc curve command`](#elliptical-arc-curve-command)
      7. [The grammar for path data](#the-grammar-for-path-data)
   4. [Text](#text)
   5. [Presentational Attributes](#presentational-attributes)
   6. [Color](#color)
   7. [Transformations](#transformations)
   8. [Structural Elements and Document Organization](#structural-elements-and-document-organization)
   9. [Coordinating, Scaling, Rendering](#coordinating-scaling-rendering)
   10. [SVG and CSS](#svg-and-css)
   11. [Further Reading - svgwg.org](#further-reading-svgwgorg)
       1. [Chapter 1: Introduction](#chapter-1-introduction)
       2. [Chapter 2: Conformance Criteria](#chapter-2-conformance-criteria)
       3. [Chapter 3: Rendering Model](#chapter-3-rendering-model)
       4. [Chapter 4: Basic Data Types and Interfaces](#chapter-4-basic-data-types-and-interfaces)
       5. [Chapter 5: Document Structure](#chapter-5-document-structure)
       6. [Chapter 6: Styling](#chapter-6-styling)
       7. [Chapter 7: Geometry Properties](#chapter-7-geometry-properties)
       8. [Chapter 8: Coordinate Systems, Transformations and Units](#chapter-8-coordinate-systems-transformations-and-units)
       9. [Chapter 9: Paths](#chapter-9-paths)
       10. [Chapter 10: Basic Shapes](#chapter-10-basic-shapes)
       11. [Chapter 11: Text](#chapter-11-text)
       12. [Chapter 12: Embedded Content](#chapter-12-embedded-content)
       13. [Chapter 13: Painting: Filling, Stroking and Marker Symbols](#chapter-13-painting-filling-stroking-and-marker-symbols)
       14. [Chapter 14: Paint Servers: Gradients and Patterns](#chapter-14-paint-servers-gradients-and-patterns)
       15. [Chapter 15: Scripting and Interactivity](#chapter-15-scripting-and-interactivity)
       16. [Chapter 16: Linking](#chapter-16-linking)
       17. [Appendix A: IDL Definitions](#appendix-a-idl-definitions)
       18. [Appendix B: Implementation Notes](#appendix-b-implementation-notes)
       19. [Appendix C: Accessibility Support](#appendix-c-accessibility-support)
       20. [Appendix D: Animating SVG Documents](#appendix-d-animating-svg-documents)
       21. [Appendix F: Element Index](#appendix-f-element-index)
       22. [Appendix G: Attribute Index](#appendix-g-attribute-index)
       23. [Appendix H: Property Index](#appendix-h-property-index)
       24. [Appendix I: IDL Index](#appendix-i-idl-index)
       25. [Appendix J: Media Type Registration for image/svg+xml](#appendix-j-media-type-registration-for-imagesvgxml)
       26. [Appendix K: Changes from SVG 1.1](#appendix-k-changes-from-svg-11)
   12. [Indexed TOC](#indexed-toc)

<!-- /code_chunk_output -->

## Introduction

> Details online: <https://svgwg.org/svg2-draft/intro.html>

- Two-dimensional
- Support of interactivity and animation
- XML-based
- Produces DOM-Tree (not a canvas-like image)
- `Renderable Graphic Elements`
  - Such as basic shapes, text elements, lines and curves
    - controlled by `presentational attributes`
      - size, position, color etc.
- `Structural Elements`
  - are used to organize information within an SVG document
    - grouping, reusing, etc.
- Transformations
  - translate, rotate, stretch etc.
- Rendered in document order,
  - the later ones occlude previous ones
- SVG uses `graphical coordinates`
  - from left top running `downward`
  - Positions and sizes
    - measured in dimensionless user coordinates
  - Absolute size is determined by the rendering device
- SVG Documents can receive `user events`
  - and invoke corresponding `event handlers`

### Within HTML

- `<svg>...</svg>`
- `<img src="mySVGFile.svg" />`
  - If so, SVG Namespace Declaration required:

```svg
<svg
  xmlns="http://www.w3.org/2000/svg"
  xmlns:svg="http://www.w3.org/2000/svg"
>...</svg>
```

### Shapes

> Details online: <https://svgwg.org/svg2-draft/shapes.html>

#### rect, circle, ellipse, line, polyline, polygon

```svg
   <svg
      xmlns="http://www.w3.org/2000/svg"
      xmlns:svg="http://www.w3.org/2000/svg"
      viewBox="0 0 1920 1090"
    >
      <rect
        x="10"
        y="10"
        width="300"
        height="300"
        fill="yellowgreen"
        stroke="blue"
        stroke-width="2"
      />

      <g transform="translate(150 150) rotate(-30)">
        <rect
          x="0"
          y="0"
          width="300"
          height="300"
          rx="50"
          fill="none"
          stroke="purple"
          stroke-width="10"
        />
      </g>

      <circle
        cx="150"
        cy="150"
        r="100"
        fill="red"
        stroke="blue"
        stroke-width="10"
      />

      <g transform="translate(300 150)">
        <ellipse rx="150" ry="100" fill="green" />
      </g>

      <ellipse
        transform="translate(400 150) rotate(-30)"
        rx="150"
        ry="100"
        fill="none"
        stroke="darkorange"
        stroke-width="20"
      />

      <g stroke="black">
        <line x1="100" y1="300" x2="300" y2="100" stroke-width="10" />
        <line x1="300" y1="300" x2="500" y2="100" stroke-width="30" />
        <line x1="500" y1="300" x2="700" y2="100" stroke-width="60" />
      </g>

      <polyline
        fill="yellow"
        stroke="blue"
        stroke-width="10"
        points="50,375
              150,375 150,325 250,325 250,375
              350,375 350,250 450,250 450,375
              550,375 550,175 650,175 650,375
              750,375 750,100 850,100 850,375
              950,375 950,25 1050,25 1050,375
              1150,375"
      />
      <g transform="translate(200 150)">
        <polygon
          fill="orange"
          stroke="purple"
          stroke-width="10"
          points="350,75  379,161 469,161 397,215
                    423,301 350,250 277,301 303,215
                    231,161 321,161"
        />
      </g>

      <g transform="translate(0 150) rotate(10)">
        <polygon
          fill="orange"
          stroke="purple"
          stroke-width="10"
          points="850,75  958,137.5 958,262.5
                    850,325 742,262.6 742,137.5"
        />
      </g>
    </svg>
```

### Path

> Details online: <https://svgwg.org/svg2-draft/paths.html>

```svg
<svg
  viewBox="0 0 1920 1090"
  xmlns="http://www.w3.org/2000/svg"
  version="1.1"
>
  <title>Example triangle01- simple example of a 'path'</title>
  <desc>A path that draws a triangle</desc>
  <path
    d="M 100 100 L 300 100 L 200 300 z"
    fill="red"
    stroke="blue"
    stroke-width="3"
  />
</svg>
```

#### `moveto command`

#### `closepath command`

#### `lineto command`

#### `cubic Bézier curve command`

#### `quadratic Bézier curve command`

#### `elliptical arc curve command`

#### The grammar for path data

### Text

> Details online: https://svgwg.org/svg2-draft/text.html

### Presentational Attributes

### Color

### Transformations

### Structural Elements and Document Organization

### Coordinating, Scaling, Rendering

### SVG and CSS

### Further Reading - svgwg.org

#### Chapter 1: Introduction

<https://svgwg.org/svg2-draft/intro.html>

#### Chapter 2: Conformance Criteria

<https://svgwg.org/svg2-draft/conform.html>

#### Chapter 3: Rendering Model

<https://svgwg.org/svg2-draft/render.html>

#### Chapter 4: Basic Data Types and Interfaces

<https://svgwg.org/svg2-draft/types.html>

#### Chapter 5: Document Structure

<https://svgwg.org/svg2-draft/struct.html>

#### Chapter 6: Styling

<https://svgwg.org/svg2-draft/styling.html>

#### Chapter 7: Geometry Properties

<https://svgwg.org/svg2-draft/geometry.html>

#### Chapter 8: Coordinate Systems, Transformations and Units

<https://svgwg.org/svg2-draft/coords.html>

#### Chapter 9: Paths

<https://svgwg.org/svg2-draft/paths.html>

#### Chapter 10: Basic Shapes

<https://svgwg.org/svg2-draft/shapes.html>

#### Chapter 11: Text

<https://svgwg.org/svg2-draft/text.html>

#### Chapter 12: Embedded Content

<https://svgwg.org/svg2-draft/embedded.html>

#### Chapter 13: Painting: Filling, Stroking and Marker Symbols

<https://svgwg.org/svg2-draft/painting.html>

#### Chapter 14: Paint Servers: Gradients and Patterns

<https://svgwg.org/svg2-draft/pservers.html>

#### Chapter 15: Scripting and Interactivity

<https://svgwg.org/svg2-draft/interact.html>

#### Chapter 16: Linking

<https://svgwg.org/svg2-draft/linking.html>

#### Appendix A: IDL Definitions

<https://svgwg.org/svg2-draft/idl.html>

#### Appendix B: Implementation Notes

<https://svgwg.org/svg2-draft/implnote.html>

#### Appendix C: Accessibility Support

<https://svgwg.org/svg2-draft/access.html>

#### Appendix D: Animating SVG Documents

> Overview: <https://svgwg.org/svg2-draft/animate.html>
> Details: <https://svgwg.org/specs/animations/>

#### Appendix F: Element Index

<https://svgwg.org/svg2-draft/eltindex.html>

#### Appendix G: Attribute Index

<https://svgwg.org/svg2-draft/attindex.html>

#### Appendix H: Property Index

<https://svgwg.org/svg2-draft/propidx.html>

#### Appendix I: IDL Index

<https://svgwg.org/svg2-draft/idlindex.html>

#### Appendix J: Media Type Registration for image/svg+xml

<https://svgwg.org/svg2-draft/mimereg.html>

#### Appendix K: Changes from SVG 1.1

<https://svgwg.org/svg2-draft/changes.html>

### Indexed TOC

```diff
Introduction
1.1.About SVG
1.2.Compatibility with other standards efforts
1.3.Relationship to previous versions of this standard
1.4.Normative Terminology
2.Conformance Criteria
2.1.Overview
2.2.Processing modes
2.2.1.Features
2.2.2.Dynamic interactive mode
2.2.3.Animated mode
2.2.4.Secure animated mode
2.2.5.Static mode
2.2.6.Secure static mode
2.3.Processing modes for SVG sub-resource documents
2.3.1.Examples
2.4.Document Conformance Classes
2.4.1.Conforming SVG DOM Subtrees
2.4.2.Conforming SVG Markup Fragments
2.4.3.Conforming XML-Compatible SVG Markup Fragments
2.4.4.Conforming XML-Compatible SVG DOM Subtrees
2.4.5.Conforming SVG Stand-Alone Files
2.4.6.Error processing
2.5.Software Conformance Classes
2.5.1.Conforming SVG Generators
2.5.2.Conforming SVG Authoring Tools
2.5.3.Conforming SVG Servers
2.5.4.Conforming SVG Interpreters
2.5.5.Conforming SVG Viewers
2.5.5.1.Printing implementation notes
2.5.6.Conforming High-Quality SVG Viewer
3.Rendering Model
3.1.Introduction
3.2.The rendering tree
3.2.1.Definitions
3.2.2.Rendered versus non-rendered elements
3.2.3.Controlling visibility: the effect of the ‘display’ and ‘visibility’ properties
3.2.4.Re-used graphics
3.3.The painters model
3.4.Rendering order
3.4.1.Establishing a stacking context in SVG
3.5.How elements are rendered
3.6.How groups are rendered
3.6.1.Object and group opacity: the effect of the ‘opacity’ property
3.7.Types of graphics elements
3.7.1.Painting shapes and text
3.7.2.Painting raster images
3.8.Filtering painted regions
3.9.Clipping and masking
3.10.Parent compositing
3.11.The effect of the ‘overflow’ property
4.Basic Data Types and Interfaces
4.1.Definitions
4.2.Attribute syntax
4.2.1.Real number precision
4.2.2.Clamping values which are restricted to a particular range
4.3.SVG DOM overview
4.3.1.Dependencies for SVG DOM support
4.3.2.Naming conventions
4.3.3.Elements in the SVG DOM
4.3.4.Reflecting content attributes in the DOM
4.3.5.Synchronizing reflected values
4.3.6.Reflecting an empty initial value
4.3.7.Invalid values
4.4.DOM interfaces for SVG elements
4.4.1.Interface SVGElement
4.4.2.Interface SVGGraphicsElement
4.4.3.Interface SVGGeometryElement
4.5.DOM interfaces for basic data types
4.5.1.Interface SVGNumber
4.5.2.Interface SVGLength
4.5.3.Interface SVGAngle
4.5.4.List interfaces
4.5.5.Interface SVGNumberList
4.5.6.Interface SVGLengthList
4.5.7.Interface SVGStringList
4.6.DOM interfaces for reflecting animatable SVG attributes
4.6.1.Interface SVGAnimatedBoolean
4.6.2.Interface SVGAnimatedEnumeration
4.6.3.Interface SVGAnimatedInteger
4.6.4.Interface SVGAnimatedNumber
4.6.5.Interface SVGAnimatedLength
4.6.6.Interface SVGAnimatedAngle
4.6.7.Interface SVGAnimatedString
4.6.8.Interface SVGAnimatedRect
4.6.9.Interface SVGAnimatedNumberList
4.6.10.Interface SVGAnimatedLengthList
4.7.Other DOM interfaces
4.7.1.Interface SVGUnitTypes
4.7.2.Mixin SVGTests
4.7.3.Mixin SVGFitToViewBox
4.7.4.Mixin SVGURIReference
5.Document Structure
5.1.Defining an SVG document fragment: the ‘svg’ element
5.1.1.Overview
5.1.2.Namespace
5.1.3.Definitions
5.1.4.The ‘svg’ element
5.2.Grouping: the ‘g’ element
5.2.1.Overview
5.2.2.The ‘g’ element
5.3.Defining content for reuse, and the ‘defs’ element
5.3.1.Overview
5.3.2.The ‘defs’ element
5.4.The ‘symbol’ element
5.4.1.Attributes
5.4.2.Notes on symbols
5.5.The ‘use’ element
5.5.1.The use-element shadow tree
5.5.2.Layout of re-used graphics
5.5.3.Style Scoping and Inheritance
5.5.4.Animations in use-element shadow trees
5.5.5.Event handling in use-element shadow trees
5.6.Conditional processing
5.6.1.Conditional processing overview
5.6.2.Definitions
5.6.3.The ‘switch’ element
5.6.4.The ‘requiredExtensions’ attribute
5.6.5.The ‘systemLanguage’ attribute
5.7.The ‘desc’ and ‘title’ elements
5.7.1.Definition
5.8.The ‘metadata’ element
5.9.HTML metadata elements
5.10.Foreign namespaces and private data
5.11.Common attributes
5.11.1.Definitions
5.11.2.Attributes common to all elements: ‘id’
5.11.3.The ‘lang’ and ‘xml:lang’ attributes
5.11.4.The ‘xml:space’ attribute
5.11.5.The ‘tabindex’ attribute
5.11.6.The ‘autofocus’ attribute
5.11.7.The ‘data-*’ attributes
5.12.WAI-ARIA attributes
5.12.1.Definitions
5.12.2.Role attribute
5.12.3.State and property attributes (all aria- attributes)
5.12.4.Implicit and Allowed ARIA Semantics
5.13.DOM interfaces
5.13.1.Extensions to the Document interface
5.13.2.Interface SVGSVGElement
5.13.3.Interface SVGGElement
5.13.4.Interface SVGDefsElement
5.13.5.Interface SVGDescElement
5.13.6.Interface SVGMetadataElement
5.13.7.Interface SVGTitleElement
5.13.8.Interface SVGSymbolElement
5.13.9.Interface SVGUseElement
5.13.10.Interface SVGUseElementShadowRoot
5.13.11.Mixin SVGElementInstance
5.13.12.Interface ShadowAnimation
5.13.13.Interface SVGSwitchElement
5.13.14.Mixin GetSVGDocument
6.Styling
6.1.Styling SVG content using CSS
6.2.Inline style sheets: the ‘style’ element
6.3.External style sheets: the effect of the HTML ‘link’ element
6.4.Style sheets in HTML documents
6.5.Element-specific styling: the ‘class’ and ‘style’ attributes
6.6.Presentation attributes
6.7.Required properties
6.8.User agent style sheet
6.9.Required CSS features
6.10.DOM interfaces
6.10.1.Interface SVGStyleElement
7.Geometry Properties
7.1.Horizontal center coordinate: The ‘cx’ property
7.2.Vertical center coordinate: The ‘cy’ property
7.3.Radius: The ‘r’ property
7.4.Horizontal radius: The ‘rx’ property
7.5.Vertical radius: The ‘ry’ property
7.6.Horizontal coordinate: The ‘x’ property
7.7.Vertical coordinate: The ‘y’ property
7.8.Sizing properties: the effect of the ‘width’ and ‘height’ properties
8.Coordinate Systems, Transformations and Units
8.1.Introduction
8.2.Computing the equivalent transform of an SVG viewport
8.3.The initial viewport
8.4.The initial coordinate system
8.5.The ‘transform’ property
8.6.The ‘viewBox’ attribute
8.7.The ‘preserveAspectRatio’ attribute
8.8.Establishing a new SVG viewport
8.9.Units
8.10.Bounding boxes
8.11.Object bounding box units
8.12.Intrinsic sizing properties of SVG content
8.13.Vector effects
8.13.1.Computing the vector effects
8.13.2.Computing the vector effects for nested viewport coordinate systems
8.13.3.Examples of vector effects
8.14.DOM interfaces
8.14.1.Interface SVGTransform
8.14.2.Interface SVGTransformList
8.14.3.Interface SVGAnimatedTransformList
8.14.4.Interface SVGPreserveAspectRatio
8.14.5.Interface SVGAnimatedPreserveAspectRatio
9.Paths
9.1.Introduction
9.2.The ‘path’ element
9.3.Path data
9.3.1.General information about path data
9.3.2.Specifying path data: the ‘d’ property
9.3.3.The "moveto" commands
9.3.4.The "closepath" command
9.3.4.1.Segment-completing close path operation
9.3.5.The "lineto" commands
9.3.6.The cubic Bézier curve commands
9.3.7.The quadratic Bézier curve commands
9.3.8.The elliptical arc curve commands
9.3.9.The grammar for path data
9.4.Path directionality
9.5.Implementation notes
9.5.1.Out-of-range elliptical arc parameters
9.5.2.Reflected control points
9.5.3.Zero-length path segments
9.5.4.Error handling in path data
9.6.Distance along a path
9.6.1.The ‘pathLength’ attribute
9.7.DOM interfaces
9.7.1.Interface SVGPathElement
10.
Basic Shapes
10.1.Introduction and definitions
10.2.The ‘rect’ element
10.3.The ‘circle’ element
10.4.The ‘ellipse’ element
10.5.The ‘line’ element
10.6.The ‘polyline’ element
10.7.The ‘polygon’ element
10.8.DOM interfaces
10.8.1.Interface SVGRectElement
10.8.2.Interface SVGCircleElement
10.8.3.Interface SVGEllipseElement
10.8.4.Interface SVGLineElement
10.8.5.Mixin SVGAnimatedPoints
10.8.6.Interface SVGPointList
10.8.7.Interface SVGPolylineElement
10.8.8.Interface SVGPolygonElement
11.Text
11.1.Introduction
11.1.1.Definitions
11.1.2.Fonts and glyphs
11.1.3.Glyph metrics and layout
11.2.The ‘text’ and ‘tspan’ elements
11.2.1.Attributes
11.2.2.Notes on 'x', 'y', 'dx', 'dy' and 'rotate'
11.3.Text layout – Introduction
11.4.Text layout – Content Area
11.4.1.The ‘inline-size’ property
11.4.2.The ‘shape-inside’ property
11.4.3.The ‘shape-subtract’ property
11.4.4.The ‘shape-image-threshold’ property
11.4.5.The ‘shape-margin’ property
11.4.6.The ‘shape-padding’ property
11.5.Text layout – Algorithm
11.6.Pre-formatted text
11.6.1.Multi-line text via 'white-space'
11.6.2.Repositioning Glyphs
11.7.Auto-wrapped text
11.7.1.Notes on Text Wrapping
11.7.1.1.First Line Positioning
11.7.1.2.Broken Lines
11.8.Text on a path
11.8.1.The ‘textPath’ element
11.8.2.Attributes
11.8.3.Text on a path layout rules
11.9.Text rendering order
11.10.Properties and pseudo-elements
11.10.1.SVG properties
11.10.1.1.Text alignment, the ‘text-anchor’ property
11.10.1.2.The ‘glyph-orientation-horizontal’ property
11.10.1.3.The ‘glyph-orientation-vertical’ property
11.10.1.4.The ‘kerning’ property
11.10.2.SVG adaptions
11.10.2.1.The ‘font-variant’ property
11.10.2.2.The ‘line-height’ property
11.10.2.3.The ‘writing-mode’ property
11.10.2.4.The ‘direction’ property
11.10.2.5.The ‘dominant-baseline’ property
11.10.2.6.The ‘alignment-baseline’ property
11.10.2.7.The ‘baseline-shift’ property
11.10.2.8.The ‘letter-spacing’ property
11.10.2.9.The ‘word-spacing’ property
11.10.2.10.The ‘text-overflow’ property
11.10.3.White space
11.10.3.1.SVG 2 Preferred white space handling, the ‘white-space’ property
11.10.3.2.Legacy white-space handling, the ‘xml:space’ property
11.10.3.3.Duplicate white-space directives
11.11.Text decoration
11.12.Text selection and clipboard operations
11.12.1.Text selection implementation notes
11.13.DOM interfaces
11.13.1.Interface SVGTextContentElement
11.13.2.Interface SVGTextPositioningElement
11.13.3.Interface SVGTextElement
11.13.4.Interface SVGTSpanElement
11.13.5.Interface SVGTextPathElement
12.Embedded Content
12.1.Overview
12.2.Placement of the embedded content
12.3.The ‘image’ element
12.4.The ‘foreignObject’ element
12.5.DOM interfaces
12.5.1.Interface SVGImageElement
12.5.2.Interface SVGForeignObjectElement
13.Painting: Filling, Stroking and Marker Symbols
13.1.Introduction
13.1.1.Definitions
13.2.Specifying paint
13.3.The effect of the ‘color’ property
13.4.Fill properties
13.4.1.Specifying fill paint: the ‘fill’ property
13.4.2.Winding rule: the ‘fill-rule’ property
13.4.3.Fill paint opacity: the ‘fill-opacity’ property
13.5.Stroke properties
13.5.1.Specifying stroke paint: the ‘stroke’ property
13.5.2.Stroke paint opacity: the ‘stroke-opacity’ property
13.5.3.Stroke width: the ‘stroke-width’ property
13.5.4.Drawing caps at the ends of strokes: the ‘stroke-linecap’ property
13.5.5.Controlling line joins: the ‘stroke-linejoin’ and ‘stroke-miterlimit’ properties
13.5.6.Dashing strokes: the ‘stroke-dasharray’ and ‘stroke-dashoffset’ properties
13.5.7.Computing the shape of the stroke
13.5.8.Computing the circles for the arcs 'stroke-linejoin'
13.5.9.Adjusting the circles for the arcs 'stroke-linejoin' when the initial circles do not intersect
13.6.Vector effects
13.7.Markers
13.7.1.The ‘marker’ element
13.7.2.Vertex markers: the ‘marker-start’, ‘marker-mid’ and ‘marker-end’ properties
13.7.3.Marker shorthand: the ‘marker’ property
13.7.4.Rendering markers
13.8.Controlling paint operation order: the ‘paint-order’ property
13.9.Color space for interpolation: the ‘color-interpolation’ property
13.10.Rendering hints
13.10.1.The ‘shape-rendering’ property
13.10.2.The ‘text-rendering’ property
13.10.3.The ‘image-rendering’ property
13.11.The effect of the ‘will-change’ property
13.12.DOM interfaces
13.12.1.Interface SVGMarkerElement
14.Paint Servers: Gradients and Patterns
14.1.Introduction
14.1.1.Using paint servers as templates
14.2.Gradients
14.2.1.Definitions
14.2.2.Linear gradients
14.2.2.1.Attributes
14.2.2.2.Notes on linear gradients
14.2.3.Radial gradients
14.2.3.1.Attributes
14.2.3.2.Notes on radial gradients
14.2.4.Gradient stops
14.2.4.1.Attributes
14.2.4.2.Properties
14.2.4.3.Notes on gradient stops
14.3.Patterns
14.3.1.Attributes
14.3.2.Notes on patterns
14.4.DOM interfaces
14.4.1.Interface SVGGradientElement
14.4.2.Interface SVGLinearGradientElement
14.4.3.Interface SVGRadialGradientElement
14.4.4.Interface SVGStopElement
14.4.5.Interface SVGPatternElement
15.Scripting and Interactivity
15.1.Introduction
15.2.Supported events
15.2.1.Relationship with UI Events
15.3.User interface events
15.4.Pointer events
15.5.Hit-testing and processing order for user interface events
15.5.1.Hit-testing
15.5.2.Event processing
15.6.The ‘pointer-events’ property
15.7.Focus
15.8.Event attributes
15.8.1.Animation event attributes
15.9.The ‘script’ element
15.10.DOM interfaces
15.10.1.Interface SVGScriptElement
16.Linking
16.1.References
16.1.1.Overview
16.1.2.Definitions
16.1.3.URLs and URIs
16.1.4.Syntactic forms: URL and <url>
16.1.5.URL reference attributes
16.1.6.Deprecated XLink URL reference attributes
16.1.7.Processing of URL references
16.1.7.1.Generating the absolute URL
16.1.7.2.Fetching the document
16.1.7.3.Processing the subresource document
16.1.7.4.Identifying the target element
16.1.7.5.Valid URL targets
16.2.Links out of SVG content: the ‘a’ element
16.3.Linking into SVG content: URL fragments and SVG views
16.3.1.SVG fragment identifiers
16.3.2.SVG fragment identifiers definitions
16.3.3.Predefined views: the ‘view’ element
16.4.DOM interfaces
16.4.1.Interface SVGAElement
16.4.2.Interface SVGViewElement
Appendix A: IDL Definitions
Appendix B: Implementation Notes
B.1.Introduction
B.2.Elliptical arc parameter conversion
B.2.1.Elliptical arc endpoint syntax
B.2.2.Parameterization alternatives
B.2.3.Conversion from center to endpoint parameterization
B.2.4.Conversion from endpoint to center parameterization
B.2.5.Correction of out-of-range radii
B.3.Notes on generating high-precision geometry
Appendix C: Accessibility Support
C.1.SVG Accessibility Features
C.2.Supporting SVG Accessibility Specifications and Guidelines
Appendix D: Animating SVG Documents
Appendix E: References
E.1.Normative references
E.2.Informative references
Appendix F: Element Index
Appendix G: Attribute Index
G.1.Regular attributes
G.2.Presentation attributes
Appendix H: Property Index
Appendix I: IDL Index
Appendix J: Media Type Registration for image/svg+xml
J.1.Introduction
J.2.Registration of media type image/svg+xml
Appendix K: Changes from SVG 1.1
K.1.Editorial changes
K.2.Substantial changes
K.2.1.Across the whole document
K.2.2.Concepts chapter (SVG 1.1 only)
K.2.3.Conformance Criteria chapter (Appendix in SVG 1.1)
K.2.4.Rendering Model chapter
K.2.5.Basic Data Types and Interfaces chapter
K.2.6.Document Structure chapter
K.2.7.Styling chapter
K.2.8.Geometry Properties chapter (SVG 2 only)
K.2.9.Coordinate Systems, Transformations and Units chapter
K.2.10.Paths chapter
K.2.11.Basic Shapes chapter
K.2.12.Text chapter
K.2.13.Embedded Content chapter (SVG 2 only)
K.2.14.Painting chapter
K.2.15.Color chapter (SVG 1.1 only)
K.2.16.Paint Servers chapter (called Gradients and Patterns in SVG 1.1)
K.2.17.Clipping, Masking and Compositing chapter (SVG 1.1 only)
K.2.18.Filter Effects chapter (SVG 1.1 only)
K.2.19.Scripting and Interactivity chapter (separate chapters in SVG 1.1)
K.2.20.Linking chapter
K.2.21.Scripting chapter (in SVG 1.1)
K.2.22.Animation chapter (SVG 1.1 only)
K.2.23.Fonts chapter (SVG 1.1 only)
K.2.24.Metadata chapter (SVG 1.1 only)
K.2.25.Backwards Compatibility chapter (SVG 1.1 only)
K.2.26.Extensibility chapter (SVG 1.1 only)
K.2.27.Document Type Definition appendix (SVG 1.1 only)
K.2.28.SVG Document Object Model (DOM)(SVG 1.1 Only)
K.2.29.IDL Definitions appendix
K.2.30.Java Language Binding appendix (SVG 1.1 only)
K.2.31.ECMAScript Language Binding appendix (SVG 1.1 only)
K.2.32.Implementation Notes appendix (was Implementation Requirements in SVG 1.1)
K.2.33.Accessibility Support appendix
K.2.34.Internationalization Support appendix (SVG 1.1 only)
K.2.35.Minimizing SVG File Sizes appendix (SVG 1.1 only)
K.2.36.Animating SVG Documents appendix (SVG 2 only)
K.2.37.References appendix
K.2.38.Element, Attribute, and Property index appendices
K.2.39.IDL Index appendix (SVG 2 only)
K.2.40.Feature Strings (SVG 1.1 only)
```
