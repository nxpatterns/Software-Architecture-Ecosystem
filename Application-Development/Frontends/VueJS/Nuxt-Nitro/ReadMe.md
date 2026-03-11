# Vue/Nuxt/Nitro:

<!-- @import "[TOC]" {cmd="toc" depthFrom=2 depthTo=5 orderedList=false} -->

<!-- code_chunk_output -->

- [Problem: Case-sensitivity Issues in Cross-Platform Development](#problem-case-sensitivity-issues-in-cross-platform-development)
- [Core Issues](#core-issues)
  - [1. Git Case-Sensitivity Tracking](#1-git-case-sensitivity-tracking)
  - [2. Nuxt Component Duplication Warning](#2-nuxt-component-duplication-warning)
  - [3. Manual Chunk Optimization Gone Wrong](#3-manual-chunk-optimization-gone-wrong)
  - [4. Development vs Production Build Differences](#4-development-vs-production-build-differences)
- [Workflow Best Practices](#workflow-best-practices)
  - [Local Development Setup](#local-development-setup)
  - [Testing Before Deployment](#testing-before-deployment)
  - [Debugging Build Issues](#debugging-build-issues)
- [Lessons Learned](#lessons-learned)
- [Quick Reference](#quick-reference)

<!-- /code_chunk_output -->


## Problem: Case-sensitivity Issues in Cross-Platform Development

Developing on Windows/macOS (case-insensitive filesystem) and deploying to Linux (case-sensitive filesystem) creates hidden issues that only appear in CI/CD pipelines or production builds. Git's default behavior on Windows/macOS masks these problems locally.

## Core Issues

### 1. Git Case-Sensitivity Tracking

**Symptom:** Build fails on Linux with "file not found" errors despite files existing locally on Windows/macOS.

**Root cause:** Windows/macOS filesystem treats `components/Vehicle/` and `components/vehicle/` as identical. Git can track both paths simultaneously without warning. When code is deployed to Linux, the mismatch breaks builds.

**Example scenario:**

- File originally committed as `components/Vehicle/Card.vue`
- Directory later renamed to `components/vehicle/` on Windows/macOS
- Git still tracks old uppercase path
- Import statement uses lowercase: `~/components/vehicle/Card.vue`
- Works on Windows/macOS (case-insensitive), fails on Linux (case-sensitive)

**Detection:**

```bash
# Check what git tracks vs filesystem
git ls-files | grep -i "problematic-path"
ls -la components/vehicle/
```

If git shows uppercase but filesystem shows lowercase, you have a tracking mismatch.

**Fix:**

```bash
# Remove old uppercase tracking
git rm --cached components/Vehicle/Card.vue

# Add correct lowercase version
git add components/vehicle/Card.vue
git commit -m "fix: correct case tracking for vehicle components"
```

**Prevention - Configure git for case-sensitivity:**

```bash
# Make git case-sensitive on macOS
git config core.ignorecase false
git config core.filemode true
git config core.autocrlf false
git config core.eol lf
```

**Prevention - Normalize line endings with `.gitattributes`:**

```
* text=auto eol=lf
*.vue text eol=lf
*.ts text eol=lf
*.js text eol=lf
*.json text eol=lf
```

Commit this file to enforce consistent behavior:

```bash
git add .gitattributes
git commit --allow-empty -m "Add .gitattributes to normalize line endings" --no-verify
```

The `--allow-empty --no-verify` flags are necessary because this is an infrastructure change that may not add new content and pre-commit hooks often block such commits.

### 2. Nuxt Component Duplication Warning

**Symptom:** Nuxt warns about duplicate components resolving to same name during build.

```
Two component files resolving to the same name VehicleCard:
- /app/components/vehicle/Card.vue
- /app/components/Vehicle/Card.vue
```

**Cause:** Git tracks both uppercase and lowercase paths. Docker extracts both from repository. Nuxt's auto-import sees duplicates.

**Fix:** Same as case-sensitivity tracking fix above. Clean git index of duplicate paths.

### 3. Manual Chunk Optimization Gone Wrong

**Symptom:** Build works locally but fails in production with errors like:

```
Cannot access 'Z' before initialization
Could not resolve entry module "@vue/shared"
```

**Root cause:** Aggressive manual chunking creates circular dependencies or tries to bundle transitive dependencies as entry points.

**Bad configuration example:**

```typescript
// DON'T DO THIS
vite: {
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            // Too many granular chunks
            if (id.includes('vue-i18n') || id.includes('@intlify'))
              return 'vendor-i18n';
            if (id.includes('vue') || id.includes('@vue'))
              return 'vendor-vue';
            // ... many more splits
          }
        },
      },
    },
  },
},
```

**Why this fails:**

- Vue ecosystem packages have tight coupling
- Splitting them creates circular dependencies
- `@vue/shared` is a transitive dependency, not directly installed
- Rollup cannot bundle it as entry module

**Conservative approach that works:**

```typescript
vite: {
  build: {
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          // Only direct dependencies from package.json
          'vendor-vue': ['vue'],
          'vendor-i18n': ['vue-i18n'],
          'vendor-ui': ['@headlessui/vue'],
          'vendor-utils': ['lodash', 'date-fns'],
        },
      },
    },
  },
},
```

**Key rules for manual chunks:**

1. Only split packages listed in `package.json` dependencies
2. Never split transitive dependencies (like `@vue/shared`)
3. Avoid splitting tightly coupled ecosystems (Vue core packages)
4. Test after each addition
5. Start simple, add incrementally

**Alternative - rely on Nuxt's built-in optimization:**

```typescript
// Remove manual chunks entirely, use Nuxt defaults
experimental: {
  payloadExtraction: false,
  inlineSSRStyles: false,
},
```

### 4. Development vs Production Build Differences

**Symptom:** `pnpm dev` works perfectly, `pnpm build` fails or produces broken artifacts.

**Common causes:**

- Case-sensitivity issues (masked in dev, exposed in build)
- Manual chunking problems (dev uses different bundling strategy)
- Missing sourcemaps for debugging

**Better debugging configuration:**

```typescript
vite: {
  build: {
    sourcemap: true,  // Always enable in development
    minify: false,    // Disable to see actual variable names
  },
},
nitro: {
  minify: false,
  sourcemap: true,
},
```

This produces readable build output instead of minified `x`, `y`, `Z` variables.

## Workflow Best Practices

### Local Development Setup

Configure your local repository to match production Linux environment:

```bash
# One-time setup per repository
git config core.ignorecase false
git config core.filemode true
git config core.autocrlf false
git config core.eol lf
git config core.whitespace trailing-space,space-before-tab
git config apply.whitespace error
```

Add `.gitattributes` to repository root:

```
* text=auto eol=lf
```

### Testing Before Deployment

Always test production builds locally:

```bash
pnpm build
node .output/server/index.mjs
```

Don't rely solely on `pnpm dev` - it uses different bundling strategy.

### Debugging Build Issues

When build fails on CI/CD but works locally:

1. Check case-sensitivity: `git ls-files | grep -i "problematic-file"`
2. Verify filesystem matches git: `ls -la` vs `git ls-files`
3. Test with minification disabled for readable errors
4. Check for manual chunking circular dependencies
5. Verify all imports use exact case matching

## Lessons Learned

**Mistake:** Aggressive manual chunking to optimize load times without understanding dependencies.

**Lesson:** Nuxt's default chunking is already optimized. Manual optimization should be incremental and tested. Don't split tightly coupled packages.

**Mistake:** Renaming directories on macOS without verifying git tracking.

**Lesson:** Always check `git ls-files` after filesystem operations. Configure `core.ignorecase=false` to catch issues immediately.

**Mistake:** Assuming dev and production builds behave identically.

**Lesson:** Always test production builds locally. Development mode masks many issues that only appear in optimized builds.

## Quick Reference

**Check for case mismatches:**

```bash
git ls-files | grep -i "directory-name"
find . -name "*filename*" -type f
```

**Fix case tracking:**

```bash
git rm --cached path/to/File.vue
git add path/to/file.vue
git commit -m "fix: correct case tracking"
```

**Safe chunk configuration:**

```typescript
// Only direct dependencies, tested incrementally
manualChunks: {
  'vendor-name': ['package-from-package-json'],
}
```

**Debug production build:**

```bash
pnpm build
node .output/server/index.mjs
# Check console for errors
```
