# SVG Compression Guide

<!-- @import "[TOC]" {cmd="toc" depthFrom=2 depthTo=5 orderedList=false} -->

<!-- code_chunk_output -->

- [Context](#context)
- [Tools Overview](#tools-overview)
  - [SVGO (Node.js)](#svgo-nodejs)
  - [svgcleaner (Rust)](#svgcleaner-rust)
  - [scour (Python)](#scour-python)
- [Installation (macOS)](#installation-macos)
  - [SVGO](#svgo)
  - [scour](#scour)
  - [svgcleaner](#svgcleaner)
    - [Option 1: rustup (Official Rust Version Manager - Recommended)](#option-1-rustup-official-rust-version-manager---recommended)
    - [Option 2: asdf (Multi-language Version Manager)](#option-2-asdf-multi-language-version-manager)
    - [Option 3: mise (Modern asdf Alternative)](#option-3-mise-modern-asdf-alternative)
- [Usage](#usage)
  - [Basic Optimization](#basic-optimization)
  - [Aggressive Optimization](#aggressive-optimization)
- [Comparison Workflow](#comparison-workflow)
- [Optimization Strategies by File Size](#optimization-strategies-by-file-size)
  - [<500KB: Automated Tools Sufficient](#500kb-automated-tools-sufficient)
  - [500KB-1MB: Aggressive Settings Required](#500kb-1mb-aggressive-settings-required)
  - [>1MB: Manual Intervention Likely Needed](#1mb-manual-intervention-likely-needed)
- [Key Parameters Explained](#key-parameters-explained)
- [Troubleshooting](#troubleshooting)
- [Expected Results](#expected-results)
- [When Tools Aren't Enough](#when-tools-arent-enough)

<!-- /code_chunk_output -->


## Context

SVG files frequently bloat beyond reasonable sizes due to:

- Excessive path data from automated converters
- Redundant shapes that could be merged
- High-precision decimal coordinates (8+ digits when 2-3 suffice)
- Embedded metadata and hidden elements
- Inefficient transform matrices

**Real-world scenario:** A 1.3MB SVG with thousands of paths, target reduction to <100KB. Standard optimization tools can achieve 50-90% compression, but extreme cases require aggressive path merging or manual intervention.

## Tools Overview

### SVGO (Node.js)

- **Best for:** Balanced optimization, preserves quality
- **Strength:** Configurable, multipass optimization, widely used
- **Typical reduction:** 40-70%

### svgcleaner (Rust)

- **Best for:** Aggressive compression, maximum file size reduction
- **Strength:** More thorough than SVGO, Rust performance
- **Typical reduction:** 60-90%

### scour (Python)

- **Best for:** Thorough cleanup with viewbox optimization
- **Strength:** Middle ground between SVGO and svgcleaner
- **Typical reduction:** 50-80%

## Installation (macOS)

### SVGO

```bash
npm install -g svgo
```

### scour

```bash
pip3 install scour
```

### svgcleaner
**Issue:** Not available in Homebrew (as of 2025).

**Solution:** Install via Cargo (Rust package manager)

#### Option 1: rustup (Official Rust Version Manager - Recommended)

```bash
# Install rustup
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# Refresh PATH
source ~/.cargo/env

# Verify installation
rustc --version

# Install svgcleaner
cargo install svgcleaner
```

**Note:** rustup IS the version manager - it manages Rust toolchain versions (stable/beta/nightly). The binary installs to `~/.cargo/bin` (automatically added to PATH).

#### Option 2: asdf (Multi-language Version Manager)

```bash
brew install asdf
asdf plugin add rust
asdf install rust latest
asdf global rust latest
cargo install svgcleaner
```

#### Option 3: mise (Modern asdf Alternative)

```bash
brew install mise
mise use -g rust@latest
cargo install svgcleaner
```

**Recommendation:** Use rustup for Rust-only needs, mise for polyglot development (manages Node, Python, Go, Rust, etc. in one tool).

## Usage

### Basic Optimization

**SVGO:**

```bash
svgo input.svg -o output.svg
```

**svgcleaner:**

```bash
svgcleaner input.svg output.svg
```

**scour:**

```bash
scour input.svg output.svg
```

### Aggressive Optimization

**SVGO (Nuclear Mode):**

```bash
svgo input.svg -o output.svg \
  --multipass \
  --precision=2 \
  --enable=removeHiddenElems \
  --enable=mergePaths \
  --enable=convertPathData
```

**scour (Extreme):**

```bash
scour input.svg output.svg \
  --enable-viewboxing \
  --enable-id-stripping \
  --enable-comment-stripping \
  --shorten-ids \
  --indent=none
```

## Comparison Workflow

Run all three tools on the same file:

```bash
# Optimize with all tools
svgo input.svg -o svgo-output.svg --multipass --precision=2
svgcleaner input.svg cleaner-output.svg
scour input.svg scour-output.svg --indent=none

# Compare file sizes
ls -lh *output.svg | awk '{print $5, $9}'
```

## Optimization Strategies by File Size

### <500KB: Automated Tools Sufficient
Run SVGO multipass or svgcleaner, expect 50-70% reduction.

### 500KB-1MB: Aggressive Settings Required
Use nuclear mode commands above, combine tools sequentially if needed.

### >1MB: Manual Intervention Likely Needed
Automated tools may not reach extreme compression targets (e.g., 1.3MB → 100KB). Consider:

- Manual path merging in Inkscape/Illustrator
- Re-vectorization at lower fidelity
- Identifying and removing redundant elements
- Using `<use>` elements for repeated patterns

## Key Parameters Explained

**--precision=2**: Reduces coordinate decimals to 2 digits (sufficient for most use cases)

**--multipass**: Runs optimization multiple times until no further reduction

**mergePaths**: Combines adjacent/overlapping paths into single elements

**removeHiddenElems**: Strips invisible/transparent elements

**enable-viewboxing**: Replaces fixed width/height with flexible viewBox

**shorten-ids**: Minifies element IDs (breaks references if SVG used in HTML/CSS)

## Troubleshooting

**Quality degradation:** Reduce precision setting (use 3-4 instead of 2)

**Broken references:** Disable ID shortening if SVG referenced externally

**Minimal compression (<30%):** File bloat is structural (too many paths), not metadata. Requires manual optimization or re-vectorization.

**svgcleaner compilation fails:** Rust toolchain issue. Run `rustup update stable` and retry.

## Expected Results

- **Metadata cleanup only:** 10-30% reduction
- **Standard optimization:** 40-70% reduction
- **Aggressive optimization:** 60-90% reduction
- **Extreme cases (1MB+):** Manual intervention required for >90% reduction

## When Tools Aren't Enough

If automated optimization fails to meet targets:

1. Inspect SVG in text editor - identify repetitive patterns
2. Use Inkscape: Path → Simplify (Ctrl+L)
3. Consider if original design can be simplified
4. For icons/logos: re-trace from raster at lower complexity
5. Use online services like SVGOMG (web UI for SVGO) for visual feedback
