# Dark Mode Readable Simple - Technical Documentation

## Overview

A Chrome extension that applies a high-contrast, readable dark mode to any website with a single click. The extension persists settings per domain and automatically applies dark mode on subsequent visits.

## Problem Statement

Many websites either lack dark mode entirely or implement it poorly with insufficient contrast. Existing solutions like browser-level color inversion produce unusable results for syntax-highlighted code and data visualizations. We needed a solution that:

1. Works universally across all websites
2. Preserves syntax highlighting in code blocks
3. Maintains data visualization colors (charts, graphs, contribution calendars)
4. Provides excellent text readability with proper contrast ratios
5. Applies instantly without page flash on navigation
6. Requires zero configuration (one-click activation)

## Architecture

### Core Components

**manifest.json** - Chrome Extension configuration

- Manifest V3 (required for modern Chrome)
- Permissions: `activeTab`, `scripting`, `storage`, `host_permissions`
- Content scripts injected at `document_start` for flash-free loading
- Service worker for icon click handling

**background.js** - Service worker

- Handles extension icon clicks
- Manages per-domain state persistence via `chrome.storage.local`
- Updates icon appearance based on active/inactive state
- Dynamic icon generation using OffscreenCanvas

**content.js** - Content script

- Checks domain-specific dark mode state on page load
- Applies CSS class immediately (document_start timing)
- JavaScript-based color contrast correction
- MutationObserver for dynamically loaded content

**styles.css** - Dark mode stylesheet

- Injected at `document_start` via manifest content_scripts
- Color scheme based on carefully tested color palette
- Selective application to avoid breaking visualizations

## Design Decisions

### Color Palette

Based on extensive testing for readability and aesthetics:

```css
--dmr-bg: #202026           /* Dark background */
--dmr-text: #DEE2E6         /* Light gray text */
--dmr-heading: #08E3E7      /* Cyan for headings */
--dmr-link: #74C0FC         /* Blue links */
```

Syntax highlighting colors preserve distinct semantic meaning:

- Keywords: `#FF79C6` (pink)
- Strings: `#FFB86C` (orange)
- Comments: `#6272A4` (muted blue)
- Functions: `#FF70FF` (magenta)
- Numbers: `#F1FA8C` (yellow)
- Types: `#6CADFF` (light blue)

### Font Strategy

- Body text: Georgia (widely available serif with excellent screen readability)
- Code: System monospace stack (Consolas, Monaco, Courier New)
- No custom font files to avoid licensing issues and reduce extension size

## Technical Challenges & Solutions

### Challenge 1: Page Flash on Navigation

**Problem:** Initial implementations injected CSS after page load, causing a visible white flash when clicking links.

**Solution:** Use manifest `content_scripts` with `run_at: "document_start"` to inject CSS before any rendering occurs. This ensures dark mode styles are present from the first paint.

```json
"content_scripts": [{
  "matches": ["<all_urls>"],
  "js": ["content.js"],
  "css": ["styles.css"],
  "run_at": "document_start"
}]
```

### Challenge 2: Preserving Data Visualizations

**Problem:** Aggressive `background-color: transparent !important` rules destroyed GitHub contribution calendars, charts, and other data visualizations.

**Solution:** Multi-layered exclusion strategy:

1. Exclude elements with inline `background` styles
2. Exclude specific visualization classes
3. Use `:not()` pseudo-class chains to prevent rule application

```css
.dmr-dark-mode *:not([style*="background-color"]):not(.ContributionCalendar-day):not([data-level]):not([class*="contrib"]):not([class*="chart"]):not([class*="graph"]) {
  background-image: none !important;
}
```

**Key Insight:** Data visualizations typically use either:

- Inline styles (`style="background-color: #xxx"`)
- CSS custom properties (`background-color: var(--contribution-level-1)`)
- Specific class-based styling

Excluding inline styles preserves most visualizations without explicit knowledge of every library.

### Challenge 3: SVG Icon Visibility

**Problem:** SVG icons often use `fill: currentColor`, inheriting text color from parent elements. When parents get dark text colors, SVG icons become invisible on dark backgrounds.

**Attempted Solutions:**

1. ✗ `fill: revert !important` - Didn't work because color inheritance happened before revert
2. ✗ Excluding SVG from color rules - Parent elements still passed through dark colors
3. ✓ **Working solution:** Exclude parent elements containing SVGs using `:has(> svg)` pseudo-class

```css
/* Exclude parents of SVGs from color inheritance */
.dmr-dark-mode body *:not(:has(> svg)) {
  color: inherit !important;
}

/* Brighten SVG icons with filter */
.dmr-dark-mode svg {
  filter: brightness(1.8) saturate(0.85) contrast(0.95) !important;
}
```

**Key Insight:** CSS inheritance requires thinking about parent-child relationships, not just targeting the final element.

### Challenge 4: Syntax Highlighting Preservation

**Problem:** Overly aggressive `color: inherit !important` rules collapsed all syntax highlighting to a single color.

**Solution:** Exclude code-related elements from blanket color rules:

```css
.dmr-dark-mode *:not([class*="highlight"]):not([class*="code"]):not(pre):not(code) {
  /* Only apply to non-code elements */
}
```

Additionally, provide fallback syntax highlighting styles for sites that don't have their own:

```css
.dmr-dark-mode .keyword { color: #FF79C6 !important; }
.dmr-dark-mode .string { color: #FFB86C !important; }
/* etc. */
```

### Challenge 5: Automatic Text Contrast Correction

**Problem:** Some sites use dark text colors (e.g., `rgb(44, 62, 80)`) that are readable on white backgrounds but invisible on dark backgrounds. CSS alone cannot detect and fix this.

**Solution:** JavaScript-based WCAG contrast calculation and automatic color adjustment.

#### Algorithm

1. **Calculate Relative Luminance** (WCAG 2.0 formula):

```javascript
function getLuminance(r, g, b) {
  const [rs, gs, bs] = [r, g, b].map(c => {
    c = c / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}
```

2. **Calculate Contrast Ratio**:

```javascript
function getContrast(rgb1, rgb2) {
  const lum1 = getLuminance(rgb1[0], rgb1[1], rgb1[2]);
  const lum2 = getLuminance(rgb2[0], rgb2[1], rgb2[2]);
  const lighter = Math.max(lum1, lum2);
  const darker = Math.min(lum1, lum2);
  return (lighter + 0.05) / (darker + 0.05);
}
```

3. **Determine Actual Background Color**:
Traverse parent elements to find the effective background:

```javascript
let bgColor = defaultBg;
let current = el;
while (current && current !== document.body) {
  const bg = window.getComputedStyle(current).backgroundColor;
  const parsed = parseColor(bg);
  if (parsed && !(parsed[0] === 0 && parsed[1] === 0 && parsed[2] === 0)) {
    bgColor = parsed;
    break;
  }
  current = current.parentElement;
}
```

4. **Adjust Color Based on Background Luminance**:

```javascript
const bgLuminance = getLuminance(bgColor[0], bgColor[1], bgColor[2]);

if (bgLuminance > 0.5) {
  // Light background - darken text
  adjusted = textColor.map(c => Math.max(0, Math.floor(c * 0.3)));
} else {
  // Dark background - lighten text
  adjusted = lightenColor(textColor, 2.5);
}
```

**Key Insights:**

- Cannot assume all text should be lightened - must check actual background
- GitHub announcement banners have light backgrounds even in dark mode
- WCAG AA standard (4.5:1 contrast ratio) is a reasonable threshold
- Need to traverse parent tree because CSS `background-color: transparent` doesn't return the effective visual background

### Challenge 6: Dynamic Content Handling

**Problem:** Single-page applications and infinite scroll load content after initial page render. These elements miss the initial color correction pass.

**Solution:** MutationObserver to detect DOM changes:

```javascript
const observer = new MutationObserver(() => fixTextColors());
observer.observe(document.body, {
  childList: true,
  subtree: true
});
```

**Trade-off:** This can be performance-intensive on highly dynamic pages. Consider adding debouncing if performance issues arise:

```javascript
let timeout;
const observer = new MutationObserver(() => {
  clearTimeout(timeout);
  timeout = setTimeout(fixTextColors, 100);
});
```

## CSS Strategy Evolution

### Iteration 1: Nuclear Approach (Failed)

```css
.dmr-dark-mode * {
  background: transparent !important;
  color: var(--dmr-text) !important;
}
```

**Result:** Destroyed everything - syntax highlighting, data visualizations, icons.

### Iteration 2: Selective Exclusions (Partial Success)

```css
.dmr-dark-mode *:not(pre):not(code) {
  background: transparent !important;
  color: inherit !important;
}
```

**Result:** Preserved code blocks but still broke charts and icons.

### Iteration 3: Extensive Exclusions (Working)

```css
.dmr-dark-mode *:not([style*="background-color"]):not(.viz-class):not(svg):not(:has(> svg)) {
  /* Apply dark mode */
}
```

**Result:** Balances broad application with preservation of critical elements.

## State Management

### Per-Domain Persistence

Dark mode state is stored in `chrome.storage.local` keyed by hostname:

```javascript
const domain = new URL(tab.url).hostname;
await chrome.storage.local.set({ [domain]: isEnabled });
```

**Why hostname, not full URL?**

- User expectation: Dark mode applies to entire site, not individual pages
- Simpler mental model
- Subdomain specificity (e.g., `docs.example.com` vs `example.com`) is preserved

### Icon State Updates

Dynamic icon generation reflects active/inactive state:

```javascript
async function updateIcon(enabled) {
  const iconColor = enabled ? '#08E3E7' : '#6272A4'; // Cyan vs Gray
  const canvas = new OffscreenCanvas(128, 128);
  // ... draw icon with appropriate color
  await chrome.action.setIcon({ imageData });
}
```

**Why dynamic generation?**

- Avoids maintaining separate icon image files
- Ensures exact color matching with theme
- Allows future customization without asset updates

## Performance Considerations

### CSS Specificity

Long `:not()` chains impact performance. Current implementation is acceptable for most sites but could be optimized for extremely large DOMs:

```css
/* Current: O(n * m) where m is exclusion count */
.dmr-dark-mode *:not(a):not(b):not(c):not(d) { }

/* Potential optimization: Use @layer for specificity control */
@layer base, visualizations;
@layer base {
  .dmr-dark-mode * { /* broad rules */ }
}
@layer visualizations {
  .viz-class { /* overrides */ }
}
```

### JavaScript Color Correction

MutationObserver firing on every DOM change can be expensive. Current implementation processes all text elements on each mutation, which is inefficient for:

- Infinite scroll pages
- Real-time chat applications
- Dynamic dashboards

**Optimization strategies:**

1. Debounce mutation handling (100-200ms)
2. Process only added nodes, not entire document
3. Cache processed elements in WeakSet
4. Limit scope to visible viewport using IntersectionObserver

## Known Limitations

### 1. Sites with Complex Theming
Sites that already have sophisticated dark modes may conflict. Notable examples:

- GitHub's native dark mode + our extension can cause double-inversion
- Some design tools with custom color pickers

**Potential Solution:** Detect existing dark modes and disable extension automatically:

```javascript
const hasDarkMode = document.documentElement.classList.contains('dark') ||
                    document.body.getAttribute('data-theme') === 'dark';
```

### 2. PDF Viewers and Embedded Content
Browser PDF viewers and `<iframe>` content with different origins cannot be styled due to cross-origin restrictions.

### 3. Canvas-Based Applications
Applications rendering to `<canvas>` (games, complex visualizations) cannot be restyled without intercepting rendering calls.

### 4. Performance on Massive Pages
Pages with 10,000+ DOM elements may experience slowdown from color correction algorithm.

## Testing Strategy

### Critical Test Cases

1. **Code Syntax Highlighting**
   - Test on: GitHub, StackOverflow, MDN, Medium code blocks
   - Verify: Each token type has distinct color

2. **Data Visualizations**
   - Test on: GitHub contribution calendar, Chart.js demos, D3.js examples
   - Verify: Colors preserved, no solid-color blocks

3. **SVG Icons**
   - Test on: GitHub, Google products, design system documentation
   - Verify: Icons visible with adequate contrast

4. **Text Contrast**
   - Test on: Sites with varied backgrounds (Medium, news sites)
   - Verify: No unreadable text combinations

5. **Dynamic Content**
   - Test on: Twitter/X, infinite scroll blogs
   - Verify: New content gets dark mode styling

6. **Navigation**
   - Click multiple links on same domain
   - Verify: No flash, instant dark mode

### Regression Prevention

When making CSS changes, always test against:

- github.com (visualizations, icons, code)
- stackoverflow.com (code blocks)
- medium.com (varied content)

## Deployment Checklist

### Before Publishing to Chrome Web Store

- [ ] Update version in manifest.json
- [ ] Test on Chromium browsers (Chrome, Edge, Brave)
- [ ] Verify icon displays correctly at 16px, 48px, 128px
- [ ] Create privacy policy (required by Chrome Web Store)
- [ ] Prepare screenshots (1280x800 minimum)
- [ ] Write clear store description
- [ ] Set appropriate category (Accessibility/Productivity)

### Privacy Policy Requirements

Extension uses:

- `storage`: Local only, no remote transmission
- `activeTab` & `scripting`: Only applies changes when user clicks icon
- No analytics, no external connections, no data collection

## Future Enhancements

### Potential Features

1. **Smart Mode Detection**
   - Detect existing dark modes and disable automatically
   - Reduce conflicts with native implementations

2. **Customization Options**
   - Allow users to adjust color palette
   - Per-site overrides for problem sites
   - Whitelist/blacklist specific domains

3. **Performance Optimization**
   - Viewport-only color correction
   - Cached element processing
   - Debounced mutation handling

4. **Advanced Contrast Control**
   - User-adjustable WCAG level (AA vs AAA)
   - High-contrast mode for accessibility
   - Dyslexia-friendly font option

5. **Keyboard Shortcuts**
   - Quick toggle without clicking icon
   - Configurable hotkey

## Lessons Learned

### CSS Specificity is Both Friend and Enemy
Long exclusion chains in `:not()` solved preservation problems but created performance concerns. Future versions should explore CSS `@layer` or `@scope` for cleaner specificity control.

### JavaScript is Necessary for True Contrast Control
CSS alone cannot perform contrast calculations. Hybrid approach (CSS for structure, JS for refinement) provides best results.

### Test on Real-World Sites Early
Synthetic test cases miss edge cases. Testing on GitHub, Medium, and StackOverflow from day one prevented major refactoring.

### User Expectations are "Just Work"
One-click, zero-config is mandatory. Any settings menu would reduce adoption. Simplicity wins.

### SVG Inheritance is Complex
Spent significant time on SVG visibility issues. Key insight: always consider parent element color inheritance, not just the SVG itself.

### Background Detection is Hard
Detecting effective background color requires traversing parent chain because `transparent` doesn't return the visual background. WCAG contrast math requires the actual rendered background color.

## Conclusion

Building a universal dark mode extension that "just works" requires balancing broad application with surgical preservation of special content. The hybrid CSS + JavaScript approach provides excellent results across diverse sites while maintaining good performance. Key success factors:

1. Early CSS injection eliminates flash
2. Smart exclusions preserve visualizations
3. JavaScript contrast correction handles edge cases
4. Per-domain persistence matches user expectations
5. Minimal configuration reduces friction

The extension demonstrates that good dark mode implementation requires understanding both visual design principles (color theory, contrast ratios) and technical implementation details (CSS specificity, DOM traversal, color space mathematics).
