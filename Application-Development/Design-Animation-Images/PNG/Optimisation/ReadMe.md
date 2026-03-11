# PNG Optimization Guide

<!-- @import "[TOC]" {cmd="toc" depthFrom=2 depthTo=5 orderedList=false} -->

<!-- code_chunk_output -->

- [Overview](#overview)
- [Understanding PNG Compression](#understanding-png-compression)
  - [Lossless vs Near-Lossless vs Lossy](#lossless-vs-near-lossless-vs-lossy)
- [Core Tools](#core-tools)
  - [1. pngquant (Near-Lossless)](#1-pngquant-near-lossless)
  - [2. OptiPNG (Lossless)](#2-optipng-lossless)
  - [3. advpng (Lossless, Zopfli)](#3-advpng-lossless-zopfli)
- [Practical Workflows](#practical-workflows)
  - [Quick Optimization (Single File)](#quick-optimization-single-file)
  - [Maximum Compression (Batch)](#maximum-compression-batch)
  - [Lossless-Only (Paranoid Mode)](#lossless-only-paranoid-mode)
- [Metadata Stripping](#metadata-stripping)
- [Common Pitfalls & Learnings](#common-pitfalls--learnings)
  - [Mistake: Running pngquant on already-quantized images](#mistake-running-pngquant-on-already-quantized-images)
  - [Mistake: Optimizing photos as PNG](#mistake-optimizing-photos-as-png)
  - [Mistake: Blind batch optimization without inspection](#mistake-blind-batch-optimization-without-inspection)
  - [Mistake: Over-optimizing during development](#mistake-over-optimizing-during-development)
- [Decision Framework](#decision-framework)
- [Verification & Quality Control](#verification--quality-control)
- [Tool Comparison Matrix](#tool-comparison-matrix)
- [Integration Examples](#integration-examples)
  - [Git Pre-Commit Hook](#git-pre-commit-hook)
  - [Node.js Build Script](#nodejs-build-script)
- [Further Reading](#further-reading)
- [Summary](#summary)

<!-- /code_chunk_output -->


## Overview

PNG files are often larger than necessary due to inefficient compression, embedded metadata, and suboptimal encoding choices. This guide covers proven techniques to reduce PNG file sizes by 40-70% without visible quality loss.

**When to optimize PNGs:**

- Web assets (faster page loads)
- Mobile apps (smaller app bundles)
- Build pipelines (automated optimization)
- Archive storage (long-term space savings)

**When NOT to use PNG:**

- Photographic images → Use JPEG/WebP instead
- Large images with millions of colors → PNG is inefficient for photos

## Understanding PNG Compression

### Lossless vs Near-Lossless vs Lossy

**Lossless optimization:**

- Pixel data remains 100% identical
- Only compression algorithm changes
- Safe for all use cases
- Typical savings: 10-30%

**Near-lossless optimization:**

- Visually identical to human eye
- Reduces color palette (quantization)
- Adds dithering to hide artifacts
- Typical savings: 50-80%

**Lossy compression:**

- Visible quality degradation
- Rarely appropriate for PNGs (use JPEG/WebP instead)

## Core Tools

### 1. pngquant (Near-Lossless)

**What it does:**
Reduces 24-bit PNG to 8-bit (256 colors) using perceptual quantization. Adds dithering to maintain visual quality.

**Installation (macOS):**

```bash
brew install pngquant
```

**Basic usage:**

```bash
pngquant --quality=80-95 input.png
# Creates input-fs8.png by default
```

**Key parameters:**

- `--quality=min-max`: Quality range (80-95 recommended)
- `--ext .png`: Replace original file extension
- `--force`: Overwrite existing files
- `--skip-if-larger`: Abort if output is bigger

**When to use:**

- Icons, UI elements, graphics with <1000 colors
- Web assets where 50%+ size reduction matters
- NOT for gradients, photos, or images requiring exact colors

**Critical limitation:**
Transparency handling can introduce artifacts. Always visually inspect output.

### 2. OptiPNG (Lossless)

**What it does:**
Recompresses PNG data using better deflate parameters. Tries different filter strategies to find smallest output.

**Installation (macOS):**

```bash
brew install optipng
```

**Basic usage:**

```bash
optipng -o7 input.png
```

**Key parameters:**

- `-o0` to `-o7`: Optimization level (7 = slowest, best compression)
- `-strip all`: Remove metadata chunks
- `-preserve`: Keep file attributes

**When to use:**

- After any PNG generation (always safe)
- When exact pixel accuracy is required
- As final step in optimization chain

**Performance note:**
Level 7 is slow (10-30s for large files). Level 5 gives 95% of the benefit in 10% of the time.

### 3. advpng (Lossless, Zopfli)

**What it does:**
Uses Zopfli compression (slower, better than standard deflate). Often squeezes out extra 5-15% after OptiPNG.

**Installation (macOS):**

```bash
brew install advancecomp
```

**Basic usage:**

```bash
advpng -z -4 input.png
```

**Key parameters:**

- `-z`: Zopfli mode
- `-0` to `-4`: Compression level (4 = maximum)
- `-i N`: Iteration count (default 15, higher = slower)

**When to use:**

- Final optimization pass
- When you need absolute minimum size
- NOT for rapid iteration (too slow)

**Reality check:**
Often only saves 2-8% vs OptiPNG alone. Diminishing returns for most workflows.

## Practical Workflows

### Quick Optimization (Single File)

```bash
pngquant --quality=80-95 --ext .png --force image.png
optipng -o5 image.png
```

**Result:** 50-70% smaller, visually identical, completes in seconds.

### Maximum Compression (Batch)

```bash
#!/bin/bash
# optimize-pngs.sh

for img in *.png; do
  echo "Processing: $img"

  # Near-lossless quantization
  pngquant --quality=80-95 --ext .png --force "$img"

  # Lossless deflate optimization
  optipng -o7 "$img"

  # Zopfli final pass
  advpng -z -4 "$img"
done
```

**Use case:** Build pipelines, asset preparation for production.

### Lossless-Only (Paranoid Mode)

```bash
# Skip pngquant, only recompress
optipng -o7 -strip all input.png
advpng -z -4 input.png
```

**Use case:** Medical imaging, legal documents, archival data.

## Metadata Stripping

PNG files often contain hidden metadata (camera settings, GPS, comments) that bloats file size.

**Using ExifTool:**

```bash
brew install exiftool
exiftool -all= *.png
```

**Using OptiPNG:**

```bash
optipng -strip all input.png
```

**Caution:** Don't strip metadata from images where attribution/licensing info matters.

## Common Pitfalls & Learnings

### Mistake: Running pngquant on already-quantized images
**Problem:** Double quantization destroys quality.

**Solution:** Check bit depth first:

```bash
file image.png
# Look for "8-bit/color" vs "24-bit/color"
```

### Mistake: Optimizing photos as PNG
**Problem:** PNG is wrong format. JPEG/WebP will be 5-10x smaller.

**Detection:** If image has >10,000 unique colors, it's probably a photo.

**Solution:**

```bash
# Convert to JPEG instead
magick input.png -quality 85 output.jpg
```

### Mistake: Blind batch optimization without inspection
**Problem:** pngquant can introduce banding/artifacts in gradients.

**Solution:** Always visually compare before/after for first few images in a batch. Use `--skip-if-larger` flag.

### Mistake: Over-optimizing during development
**Problem:** Running all three tools on every save wastes time.

**Solution:**

- Development: No optimization (or OptiPNG -o2 only)
- Pre-commit: pngquant + OptiPNG -o5
- Production build: Full pipeline

## Decision Framework

**Choose your optimization path:**

```
Is exact pixel accuracy required?
├─ YES → Lossless only (OptiPNG + advpng)
└─ NO → Can I accept quantization?
    ├─ YES → Near-lossless (pngquant + OptiPNG)
    └─ NO → Don't optimize (or reconsider PNG format)

Is this a photo/gradient-heavy image?
├─ YES → Wrong format, use JPEG/WebP
└─ NO → Proceed with PNG optimization

How much time do I have?
├─ Seconds → pngquant only
├─ Minutes → pngquant + OptiPNG -o5
└─ Hours → Full pipeline with advpng
```

## Verification & Quality Control

**Check file size reduction:**

```bash
# Before
ls -lh original.png

# After
ls -lh optimized.png
```

**Visual comparison:**

```bash
# macOS Quick Look
open original.png optimized.png
```

**Automated comparison (requires ImageMagick):**

```bash
# Calculate PSNR (>40 dB = visually identical)
magick compare -metric PSNR original.png optimized.png null:
```

## Tool Comparison Matrix

| Tool | Type | Speed | Savings | Use Case |
|------|------|-------|---------|----------|
| pngquant | Near-lossless | Fast | 50-80% | UI graphics, icons |
| OptiPNG | Lossless | Medium | 10-30% | Always safe |
| advpng | Lossless | Slow | 2-8% extra | Production builds |
| ExifTool | Metadata | Fast | 5-20% | Privacy, size |

## Integration Examples

### Git Pre-Commit Hook

```bash
#!/bin/bash
# .git/hooks/pre-commit

# Optimize staged PNGs
for file in $(git diff --cached --name-only --diff-filter=ACM | grep '\.png$'); do
  if [ -f "$file" ]; then
    pngquant --quality=80-95 --ext .png --force "$file" 2>/dev/null
    optipng -o5 -quiet "$file"
    git add "$file"
  fi
done
```

### Node.js Build Script

```javascript
// package.json script
{
  "scripts": {
    "optimize-images": "find ./assets -name '*.png' -exec pngquant --quality=80-95 --ext .png --force {} \\; && find ./assets -name '*.png' -exec optipng -o5 {} \\;"
  }
}
```

## Further Reading

- PNG Specification: https://www.w3.org/TR/PNG/
- Zopfli Algorithm: https://github.com/google/zopfli
- Color Quantization Theory: https://en.wikipedia.org/wiki/Color_quantization

## Summary

**Default recommendation for web assets:**

```bash
pngquant --quality=80-95 --ext .png --force image.png
optipng -o5 image.png
```

**This gives you:**

- 50-70% size reduction
- Visually identical output
- Completes in <5 seconds per image
- Safe for 95% of use cases

**When in doubt:** Run OptiPNG alone. It's always safe and never makes things worse.
