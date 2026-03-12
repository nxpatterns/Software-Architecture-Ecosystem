# Testing Google Fonts in the Browser

## Purpose

This technique allows you to rapidly test different Google Fonts on a live webpage without modifying source code or reloading the page. Useful for visual prototyping, design decisions, and client presentations.

## Why This Approach

**Problem:** Traditional workflow requires editing CSS files, saving, and refreshing the browser to see font changes. This is slow when comparing multiple typefaces.

**Solution:** Dynamically inject Google Font stylesheets and apply them via the browser's Developer Console. Changes are instant and non-destructive (they don't persist after refresh).

## How It Works

The technique has two parts:

1. **Load the font:** Create a `<link>` element that fetches the font from Google Fonts API and append it to the document `<head>`
2. **Apply the font:** Use JavaScript to set the `font-family` CSS property on target elements

Google Fonts API serves the font files. The browser downloads and caches them, making subsequent uses of the same font instant.

## Basic Implementation

### Full Page Font Change

```javascript
function tryFont(fontName) {
  // 1. Create stylesheet link
  const link = document.createElement('link');
  link.href = `https://fonts.googleapis.com/css2?family=${fontName.replace(' ', '+')}:wght@400;700&display=swap`;
  link.rel = 'stylesheet';
  document.head.appendChild(link);

  // 2. Apply to entire page
  document.body.style.fontFamily = `'${fontName}', sans-serif`;
}

// Usage
tryFont('Roboto');
tryFont('Playfair Display');
```

### Targeted Selector (Specific Classes/Elements)

```javascript
function tryFont(fontName) {
  // 1. Load font
  const link = document.createElement('link');
  link.href = `https://fonts.googleapis.com/css2?family=${fontName.replace(' ', '+')}:wght@400;700&display=swap`;
  link.rel = 'stylesheet';
  document.head.appendChild(link);

  // 2. Apply only to specific selector
  document.querySelectorAll('.result-name').forEach(el => {
    el.style.fontFamily = `'${fontName}', sans-serif`;
  });
}

// Usage
tryFont('Montserrat');
```

**Key detail:** Replace `.result-name` with whatever CSS selector matches your target elements (e.g., `h1`, `.title`, `#main-heading`).

## Technical Breakdown

### Font Name Formatting

```javascript
fontName.replace(' ', '+')
```

Converts spaces to plus signs for URL encoding. "Playfair Display" becomes "Playfair+Display" in the API URL.

### Font Weights

```javascript
:wght@400;700
```

Loads normal (400) and bold (700) weights. Adjust as needed:

- `wght@300;400;600;700;900` for multiple weights
- `wght@400` for single weight (reduces load time)

### Font Family Declaration

```javascript
el.style.fontFamily = `'${fontName}', sans-serif`;
```

- Quotes around font name handle multi-word fonts
- Fallback (`sans-serif` or `serif`) ensures text displays if font fails to load

## Advanced Variations

### Multiple Selectors

```javascript
function tryFont(fontName, selectors = ['.result-name']) {
  const link = document.createElement('link');
  link.href = `https://fonts.googleapis.com/css2?family=${fontName.replace(' ', '+')}:wght@400;700&display=swap`;
  link.rel = 'stylesheet';
  document.head.appendChild(link);

  selectors.forEach(selector => {
    document.querySelectorAll(selector).forEach(el => {
      el.style.fontFamily = `'${fontName}', sans-serif`;
    });
  });
}

// Usage
tryFont('Lora', ['.result-name', '.subtitle', 'h2']);
```

### Different Fonts for Different Elements

```javascript
function tryFont(fontName, selector) {
  const link = document.createElement('link');
  link.href = `https://fonts.googleapis.com/css2?family=${fontName.replace(' ', '+')}:wght@400;700&display=swap`;
  link.rel = 'stylesheet';
  document.head.appendChild(link);

  document.querySelectorAll(selector).forEach(el => {
    el.style.fontFamily = `'${fontName}', sans-serif`;
  });
}

// Usage - test different fonts simultaneously
tryFont('Merriweather', 'h1');
tryFont('Open Sans', '.body-text');
tryFont('Roboto Mono', 'code');
```

## Common Gotchas

### Font Not Appearing

**Symptom:** Function runs but text doesn't change.

**Causes:**

1. **Selector doesn't match:** Verify selector in Elements panel. Try `document.querySelectorAll('.your-selector').length` to confirm matches.
2. **CSS specificity:** Existing styles with `!important` override inline styles. Workaround: add `!important` to your style application:

   ```javascript
   el.style.setProperty('font-family', `'${fontName}', sans-serif`, 'important');
   ```

3. **Font name typo:** Font names are case-sensitive. "roboto" ≠ "Roboto".

### Multiple Link Elements

Each `tryFont()` call adds a new `<link>` element. After testing 20 fonts, you'll have 20 link elements in `<head>`. This doesn't break anything but clutters the DOM.

**Solution (if needed):**

```javascript
function tryFont(fontName) {
  // Remove previous font link if it exists
  const oldLink = document.querySelector('link[data-font-tester]');
  if (oldLink) oldLink.remove();

  const link = document.createElement('link');
  link.href = `https://fonts.googleapis.com/css2?family=${fontName.replace(' ', '+')}:wght@400;700&display=swap`;
  link.rel = 'stylesheet';
  link.setAttribute('data-font-tester', 'true');
  document.head.appendChild(link);

  document.querySelectorAll('.result-name').forEach(el => {
    el.style.fontFamily = `'${fontName}', sans-serif`;
  });
}
```

## Finding Font Names

Browse fonts at [Google Fonts](https://fonts.google.com/). The font name shown on the card is exactly what you pass to `tryFont()`.

Examples:

- "Roboto"
- "Open Sans"
- "Playfair Display"
- "Roboto Mono"

## Workflow

1. Open Chrome DevTools (F12 or Right-click → Inspect)
2. Go to Console tab
3. Paste the `tryFont` function and press Enter (defines it in the page scope)
4. Call `tryFont('Font Name')` repeatedly to test different fonts
5. Once you find a font you like, add it to your actual CSS files

## Alternative: Browser Extensions

If you test fonts frequently, consider extensions:

- **Font Playground:** GUI for testing fonts without code
- **Fonts Ninja:** Identify and test fonts on any website

These provide point-and-click interfaces but are less flexible than the Console approach for targeted selections.
