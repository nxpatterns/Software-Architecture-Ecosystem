# Favicon Cookbook

<!-- @import "[TOC]" {cmd="toc" depthFrom=2 depthTo=5 orderedList=false} -->

<!-- code_chunk_output -->

- [Converting PNG to favicon.ico on macOS](#converting-png-to-faviconico-on-macos)
  - [Context: What and Why](#context-what-and-why)
  - [Method 1: ImageMagick (Recommended)](#method-1-imagemagick-recommended)
    - [Installation](#installation)
    - [Basic Conversion](#basic-conversion)
    - [Single Size (Simpler)](#single-size-simpler)
  - [Method 2: Built-in macOS Tools (sips + iconutil)](#method-2-built-in-macos-tools-sips--iconutil)
    - [Step-by-Step](#step-by-step)
  - [Method 3: Online Converters](#method-3-online-converters)
  - [Common Sizes for Favicons](#common-sizes-for-favicons)
  - [Modern HTML Implementation](#modern-html-implementation)
  - [Troubleshooting](#troubleshooting)
  - [Decision Guide](#decision-guide)
  - [Key Takeaway](#key-takeaway)

<!-- /code_chunk_output -->


## Converting PNG to favicon.ico on macOS

### Context: What and Why

A favicon is the small icon displayed in browser tabs, bookmarks, and address bars. Historically, browsers expected a file named `favicon.ico` containing multiple icon sizes (16x16, 32x32, 48x48, etc.) in a single ICO container format.

**Why convert PNG to ICO:**

- Legacy browser support (older IE versions, some email clients)
- Certain platforms still expect `.ico` files
- Single file contains multiple resolutions for different display contexts

**Modern alternative:** Most browsers now accept PNG directly via `<link rel="icon" type="image/png" href="favicon.png">`. This is simpler and often preferred for new projects.

### Method 1: ImageMagick (Recommended)

**What it does:** Converts PNG to multi-resolution ICO in one command.

**Why this method:** Simple, reliable, handles multiple sizes automatically.

#### Installation

```bash
brew install imagemagick
```

#### Basic Conversion

```bash
convert input.png -resize 256x256 -define icon:auto-resize=256,128,64,48,32,16 favicon.ico
```

**What happens:**

- Resizes input to 256x256 as base
- Creates ICO file with 6 embedded sizes (256, 128, 64, 48, 32, 16 pixels)
- Each size is optimized for different display contexts

#### Single Size (Simpler)

If you only need 32x32:

```bash
convert input.png -resize 32x32 favicon.ico
```

### Method 2: Built-in macOS Tools (sips + iconutil)

**What it does:** Uses native macOS utilities without external dependencies.

**Why this method:** No installation required, but more verbose.

**How it works:**

1. Generate individual PNG files at required sizes
2. Bundle them into an iconset directory
3. Convert iconset to ICNS (Apple's icon format)
4. Convert ICNS to ICO

#### Step-by-Step

```bash
# Create iconset directory structure
mkdir favicon.iconset

# Generate required sizes using sips (macOS image tool)
sips -z 16 16 input.png --out favicon.iconset/icon_16x16.png
sips -z 32 32 input.png --out favicon.iconset/icon_16x16@2x.png
sips -z 32 32 input.png --out favicon.iconset/icon_32x32.png
sips -z 64 64 input.png --out favicon.iconset/icon_32x32@2x.png
sips -z 128 128 input.png --out favicon.iconset/icon_128x128.png
sips -z 256 256 input.png --out favicon.iconset/icon_128x128@2x.png

# Convert iconset to ICNS
iconutil -c icns favicon.iconset

# Convert ICNS to ICO
sips -s format ico favicon.icns --out favicon.ico

# Cleanup
rm -rf favicon.iconset favicon.icns
```

**Note:** The `@2x` suffix indicates retina/high-DPI versions of each size.

### Method 3: Online Converters

Services like favicon.io, realfavicongenerator.net, or cloudconvert.com can convert PNG to ICO through a web interface.

**When to use:** Quick one-off conversions without installing tools.

**Tradeoff:** Requires uploading your image, less control over output settings.

### Common Sizes for Favicons

Standard ICO files typically contain:

- **16x16** - Browser tab, address bar
- **32x32** - Taskbar, desktop shortcuts (Windows)
- **48x48** - Windows site icons
- **64x64** - High-DPI displays
- **128x128, 256x256** - Larger displays, app icons

Most use cases are covered by 16x16, 32x32, and 48x48.

### Modern HTML Implementation

After generating `favicon.ico`, place it in your site's root directory. Browsers automatically check `/favicon.ico` without explicit HTML.

For explicit linking or PNG alternatives:

```html
<!-- ICO with multiple sizes -->
<link rel="icon" href="/favicon.ico" sizes="any">

<!-- PNG alternative for modern browsers -->
<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png">
<link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png">

<!-- Apple touch icon (180x180 PNG) -->
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
```

### Troubleshooting

**Blurry icons:** Start with high-resolution source PNG (at least 512x512). Downscaling produces better results than upscaling.

**ImageMagick not found:** Verify installation with `brew list imagemagick`. Restart terminal after installation.

**sips conversion fails:** ICNS to ICO conversion isn't always reliable. If it produces a broken file, fall back to ImageMagick.

**Browser not showing new favicon:** Clear browser cache or hard refresh (Cmd+Shift+R). Browsers aggressively cache favicons.

### Decision Guide

**Use ImageMagick if:**

- You need repeatable, automated conversions
- You want simple one-line commands
- You're comfortable installing Homebrew packages

**Use sips/iconutil if:**

- You prefer zero external dependencies
- You need a one-time conversion
- You're on macOS without admin privileges for Homebrew

**Use PNG directly if:**

- Building a new site with modern browser support
- Want to avoid ICO format entirely
- Don't need IE/legacy compatibility

### Key Takeaway

ICO conversion is increasingly optional. For new projects, serving PNG files directly is simpler and widely supported. Use ICO conversion when legacy browser support is required or when working with platforms that specifically expect `.ico` files.
