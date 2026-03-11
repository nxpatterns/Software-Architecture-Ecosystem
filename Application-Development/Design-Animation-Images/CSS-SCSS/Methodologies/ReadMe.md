# CSS Methodologies

<!-- @import "[TOC]" {cmd="toc" depthFrom=2 depthTo=6 orderedList=true} -->

<!-- code_chunk_output -->

1. [Overview](#overview)
2. [BEM (Block Element Modifier)](#bem-block-element-modifier)
3. [OOCS (Object-Oriented CSS)](#oocs-object-oriented-css)
4. [SMACSS (Scalable and Modular Architecture for CSS)](#smacss-scalable-and-modular-architecture-for-css)
5. [ACSS (Atomic CSS)](#acss-atomic-css)
6. [ITCSS (Inverted Triangle CSS)](#itcss-inverted-triangle-css)
    1. [Examples](#examples)
7. [SUIT CSS](#suit-css)
8. [CSS Modules](#css-modules)
9. [Utility-First (e.g., Tailwind CSS)](#utility-first-eg-tailwind-css)

<!-- /code_chunk_output -->

## Overview

| Methodology     | Focus                                               | Key Features                                                                                                        | Use Case                                             |
|-----------------|-----------------------------------------------------|---------------------------------------------------------------------------------------------------------------------|------------------------------------------------------|
| BEM             | Block, Element, Modifier                            | - Strict naming conventions<br>- Enhances reusability and modularity                                                | When project scalability and organization is crucial |
| OOCSS           | Object-Oriented CSS                                 | - Separation of structure from skin<br>- Promotes reusability of styles                                             | For large-scale projects needing flexible styling    |
| SMACSS          | Scalable and Modular Architecture for CSS           | - Categorization of CSS rules<br>- Base, layout, module, state, theme                                               | Managing complex projects with a structured approach |
| ACSS            | Atomic CSS                                          | - Single-purpose classes<br>- Focus on utility and minimalism                                                       | Projects that benefit from highly reusable utilities |
| ITCSS           | Inverted Triangle CSS                               | - Organized in layers of specificity<br>- From generic to explicit styles                                            | Large projects requiring a maintainable CSS structure|
| SUIT CSS        | Structured class names and meaningful hyphens       | - Component-based design<br>- Conformity to decoupled styles                                                        | Component-driven projects with a need for modularity |
| CSS Modules     | Locally scoped CSS                                  | - Avoids global scope<br>- Import styles as modules                                                                  | Modular web application development                  |
| Utility-First  | Tailwind CSS as an example                          | - Utility classes for direct styling<br>- Encourages composition over customization                                  | Rapid development with design consistency            |

Each methodology has its strengths and is suited to different types of projects and developer preferences. BEM, SMACSS, and ITCSS focus on organization and scalability, making them ideal for large, complex projects. OOCSS and SUIT CSS emphasize reusability and modularity. ACSS and Utility-First methodologies like Tailwind CSS prioritize utility and speed of development, offering a different approach to CSS architecture that can lead to highly efficient and fast-paced styling processes. CSS Modules provide a solution to scope styles locally to components, which is particularly useful in modern JavaScript framework-based applications.

## BEM (Block Element Modifier)

A methodology aimed at increasing the scalability and reusability of CSS code by using a naming convention that makes styles more understandable and easier to maintain. [Official BEM site](http://getbem.com/)

## OOCS (Object-Oriented CSS)
Divides CSS rules into structure (grids, layout) and skin (colors, fonts) to increase reusability and reduce stylesheet size. [OOCSS on GitHub](https://github.com/stubbornella/oocss)

## SMACSS (Scalable and Modular Architecture for CSS)

A style guide for organizing CSS into five categories: Base, Layout, Module, State, and Theme, aimed at reducing complexity in large stylesheets.  [Official SMACSS site](https://smacss.com/)

## ACSS (Atomic CSS)

Focuses on creating single-purpose classes that define one style property, promoting style reusability. [Atomic CSS on GitHub](https://acss.io/)

## ITCSS (Inverted Triangle CSS)

ITCSS, which stands for Inverted Triangle CSS, is a CSS architecture developed by Harry Roberts. The core idea behind ITCSS is to organize your CSS in a way that helps manage complexity, especially in large projects, by structuring the CSS files according to specificity and reach. This methodology aims to increase maintainability and scalability by dividing CSS into several layers, from the most generic styles to the most specific ones.

The "inverted triangle" metaphor describes how CSS should be structured: starting with the least specific selectors (which have the widest reach) and moving towards the most specific (with the narrowest reach). Here’s a brief overview of the typical layers in ITCSS, starting from the top of the triangle:

1. **Settings**: Used for global variables, such as color codes, font sizes, etc., that you might want to reuse throughout your project.
2. **Tools**: Globally available mixins and functions to be used across your project. This layer doesn't output any CSS when compiled on its own; it's purely functional.
3. **Generic**: Reset and normalize styles. This layer impacts a lot of elements and is very broad. It’s the first layer that outputs actual CSS.
4. **Elements**: Styling for bare HTML elements (like H1, A, etc.). These come with default styling from the browser, so here you can redefine them.
5. **Objects**: Class-based selectors which define undecorated design patterns, for example, a `.container` class.
6. **Components**: Specific UI components. This is where the majority of your work goes, defining specific pieces of the UI, like buttons, cards, etc.
7. **Utilities**: Utility and helper classes with the ability to override anything which goes before in the triangle, typically used for margins, paddings, text alignment, etc.

### Examples

This approach ensures that the CSS that affects the entire project (like resets) is written first, and the CSS that affects individual components is written last, which helps in managing specificity and preventing styles from unintentionally overriding others.

```scss
// Settings
$primary-color: #333;

// Tools
@mixin font-size($size) {
  font-size: $size;
  line-height: (1.5 * $size);
}

// Generic
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

// Elements
body {
  font-family: 'Open Sans', sans-serif;
}

a {
  color: $primary-color;
  text-decoration: none;
}

// Objects
.container {
  max-width: 1200px;
  margin: 0 auto;
}

// Components
.button {
  padding: 10px 20px;
  background-color: $primary-color;
  color: white;
  border: none;
  border-radius: 5px;
}

// Utilities
.mt-10 {
  margin-top: 10px;
}
```

## SUIT CSS

Provides a naming convention and methodology for structuring CSS classes focused on component orientation, including states and variants. [SUIT CSS on GitHub](https://github.com/suitcss/suit)

## CSS Modules

A technique where CSS styles are defined locally to a component rather than globally, avoiding class name conflicts and treating styles like module imports.
    [CSS Modules on GitHub](https://github.com/css-modules/css-modules)

## Utility-First (e.g., Tailwind CSS)

A methodology that uses predefined utility classes to apply styles directly in the HTML code, promoting development speed and minimizing CSS size. [Tailwind CSS Official Site](https://tailwindcss.com/)
