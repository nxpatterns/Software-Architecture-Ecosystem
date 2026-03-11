# CSS Style Guides

Quote by cssguidelin.es

> These guidelines are opinionated, but they have been repeatedly tried, tested, stressed, refined, broken, reworked, and revisited over a number of years on projects of all sizes.

<!-- @import "[TOC]" {cmd="toc" depthFrom=2 depthTo=6 orderedList=false} -->

<!-- code_chunk_output -->

- [Scope (under construction)](#scope-under-construction)
- [Naming Conventions](#naming-conventions)
  - [Objective](#objective)
  - [Use Hyphen Delimited Strings](#use-hyphen-delimited-strings)
- [Further Reading](#further-reading)
  - [Using `!important`](#using-important)
  - [Common Considerations](#common-considerations)
    - [Coding Format, Rules & Naming Convention](#coding-format-rules-naming-convention)
    - [Reusability](#reusability)
    - [Documentation](#documentation)
    - [Categorization (e.g. due to SMACSS - see next section)](#categorization-eg-due-to-smacss-see-next-section)
      - [Base](#base)
      - [Layout](#layout)
      - [Module](#module)
      - [State](#state)
      - [Theme](#theme)
    - [Common Elements](#common-elements)
      - [Headings](#headings)
      - [Lists](#lists)
      - [Module headers & footers](#module-headers-footers)
      - [Grids](#grids)
      - [Buttons](#buttons)
      - [...](#)
    - [Principles (e.g. due to OOCSS)](#principles-eg-due-to-oocss)
      - [Keep stylesheets maintainable](#keep-stylesheets-maintainable)
      - [Keep code transparent, sane, and readable](#keep-code-transparent-sane-and-readable)
      - [Keep stylesheets scalable](#keep-stylesheets-scalable)
      - [Grid control width, content controls height](#grid-control-width-content-controls-height)
      - [Seperate Structure and Skin](#seperate-structure-and-skin)
      - [Seperate Container and Content](#seperate-container-and-content)
      - [Set the standard for code quality across a codebase](#set-the-standard-for-code-quality-across-a-codebase)
      - [Promote consistency across codebases](#promote-consistency-across-codebases)
      - [Give developers a feeling of familiarity across codebases](#give-developers-a-feeling-of-familiarity-across-codebases)
      - [Increase productivity](#increase-productivity)
    - [Best Practics (e.g. due to OOCSS)](#best-practics-eg-due-to-oocss)
      - [Create a component library](#create-a-component-library)
      - [Use consistent semantic styles](#use-consistent-semantic-styles)
      - [Design modules to be transparent on the inside](#design-modules-to-be-transparent-on-the-inside)
      - [Be flexible](#be-flexible)
      - [Learn to love grids](#learn-to-love-grids)
      - [Minimize selectors](#minimize-selectors)
      - [Seperate structure and skin](#seperate-structure-and-skin-1)
      - [Seperate container and content](#seperate-container-and-content-1)
      - [Extend objects by applying multiple classes to an element](#extend-objects-by-applying-multiple-classes-to-an-element)
      - [Use reset and fonts (e.g. YUI is no longer actively maintained)](#use-reset-and-fonts-eg-yui-is-no-longer-actively-maintainedhttpsclarlegithubioyui3)
    - [Some Pitfalls](#some-pitfalls)
      - [Location depentend styles](#location-depentend-styles)
      - [Avoid specifiying what tag a class applies](#avoid-specifiying-what-tag-a-class-applies)
      - [Avoid IDs to style inside the main content areas (but you can use them as reference for styles if necessary)](#avoid-ids-to-style-inside-the-main-content-areas-but-you-can-use-them-as-reference-for-styles-if-necessary)
      - [Avoid drop shadows and rounded corners over irregular backgrounds](#avoid-drop-shadows-and-rounded-corners-over-irregular-backgrounds)
      - [Text as Text, not as images](#text-as-text-not-as-images)
      - [Redundancy](#redundancy)
      - [Avoid premature optimization](#avoid-premature-optimization)
  - [Other existing naming conventions](#other-existing-naming-conventions)
    - [BEM: Block, Element, Modifier](#bem-block-element-modifier)
    - [SMACSS: Scalable and Modular Architecture for CSS](#smacss-scalable-and-modular-architecture-for-css)
    - [OOCSS: Object Oriented CSS](#oocss-object-oriented-css)
  - [Other Style Guides](#other-style-guides)
    - [CSS guidelin.es](#css-guidelines)
    - [Google Html/CSS Style Guides](#google-htmlcss-style-guides)
    - [Primer - GitHub's Design System](#primer-githubs-design-system)
  - [Tools & Co.](#tools-co)
    - [StoryBook](#storybook)
    - [KSS Knyle Style Sheets](#kss-knyle-style-sheets)
    - [Nucleus](#nucleus)

<!-- /code_chunk_output -->

## Scope (under construction)

- Globally available variables & configuration.
  - also indentions,
  - width (e.g. 70 characters - not 80)
- Useful mixins
- General Informations
  - E.g. Normalize.css
  - Box-sizing, etc.
- Typographie
  - Headings
  - Other content relevant settings
- Common Tokens & Wrappers
  - e.g. center (text-align: center)
  - e.g. flex etc.
  - e.g. spacing
- Buttons
- Navigation

## Naming Conventions

### Objective

1. To know what a selector does, by looking at its name
2. To have an idea of where a selector can be user, by looking at it
3. To know the relationship between class names, by looking at them

### Use Hyphen Delimited Strings

```css
.red-box {
  ...;
} /* instead of .redBox */
```

## Further Reading

### Using `!important`

Excerpt from SMACSS Documentation (Section: Type-State):

> **States** should be made to stand alone and are usually built of a single class selector. Since the state will likely need to override the style of a more complex rule set, the use of **`!important`** is **allowed** and, dare I say, **recommended**.

> I used to say that !important was never needed but on complex systems, **it is often a necessity**.

> You won’t normally have two states applied to the same module or two states that tend to affect the same set of styles, so specificity conflicts from using **`!important` should be few and far between**.

> With that said, be cautious. Leave **`!important`** off until you actually and truly need it.

### Common Considerations

#### Coding Format, Rules & Naming Convention

#### Reusability

#### Documentation

#### Categorization (e.g. due to SMACSS - see next section)

##### Base

##### Layout

##### Module

##### State

##### Theme

#### Common Elements

##### Headings

##### Lists

##### Module headers & footers

##### Grids

##### Buttons

##### ...

#### Principles (e.g. due to OOCSS)

##### Keep stylesheets maintainable

##### Keep code transparent, sane, and readable

##### Keep stylesheets scalable

##### Grid control width, content controls height

##### Seperate Structure and Skin

##### Seperate Container and Content

##### Set the standard for code quality across a codebase

##### Promote consistency across codebases

##### Give developers a feeling of familiarity across codebases

##### Increase productivity

#### Best Practics (e.g. due to OOCSS)

##### Create a component library

##### Use consistent semantic styles

##### Design modules to be transparent on the inside

##### Be flexible

##### Learn to love grids

##### Minimize selectors

##### Seperate structure and skin

##### Seperate container and content

##### Extend objects by applying multiple classes to an element

##### Use reset and fonts ([e.g. YUI is no longer actively maintained](https://clarle.github.io/yui3/))

#### Some Pitfalls

##### Location depentend styles

##### Avoid specifiying what tag a class applies

##### Avoid IDs to style inside the main content areas (but you can use them as reference for styles if necessary)

##### Avoid drop shadows and rounded corners over irregular backgrounds

##### Text as Text, not as images

##### Redundancy

##### Avoid premature optimization

### Other existing naming conventions

#### BEM: Block, Element, Modifier

<https://css-tricks.com/bem-101/>

#### SMACSS: Scalable and Modular Architecture for CSS

<http://smacss.com/>

#### OOCSS: Object Oriented CSS

<https://github.com/stubbornella/oocss/wiki>

### Other Style Guides

#### CSS guidelin.es

<https://cssguidelin.es/>

#### Google Html/CSS Style Guides

<https://google.github.io/styleguide/htmlcssguide.html>

#### Primer - GitHub's Design System

<https://primer.style/css/>
<https://github.com/primer>

### Tools & Co.

#### StoryBook

<https://storybook.js.org/>

#### KSS Knyle Style Sheets

<http://warpspire.com/kss/>

#### Nucleus

<https://holidaypirates.github.io/nucleus/getting-started.html>
