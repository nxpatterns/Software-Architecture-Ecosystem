# SVG Icons

<!-- @import "[TOC]" {cmd="toc" depthFrom=2 depthTo=6 orderedList=false} -->

<!-- code_chunk_output -->

- [Font Custom Icons](#font-custom-icons)
  - [Installation](#installation)
  - [Quick Start](#quick-start)
- [Examples](#examples)
  - [Icon Dimensions/Relations](#icon-dimensionsrelations)
  - [Hand-drawn Example Set (SVG)](#hand-drawn-example-set-svg)

<!-- /code_chunk_output -->

## Font Custom Icons

### Installation

```shell
# On Mac
brew tap bramstein/webfonttools
brew update
brew install woff2

brew install --cask fontforge
brew install eot-utils
gem install fontcustom
```

### Quick Start

```shell
fontcustom compile my/vectors  # Compiles icons into `fontcustom/`
fontcustom watch my/vectors    # Re-compiles when changed/added/removed
fontcustom compile             # Uses options from `./fontcustom.yml` or
                               # `config/fontcustom.yml`
fontcustom config              # Generate a blank a config file
fontcustom help                # See all options
```

See Details online: <https://github.com/FontCustom/fontcustom>

## Examples

### Icon Dimensions/Relations

![Browser Cache](IconDesign-Muster.png)

### Hand-drawn Example Set (SVG)

![Browser Cache](OneLineIconSetExample.svg)
