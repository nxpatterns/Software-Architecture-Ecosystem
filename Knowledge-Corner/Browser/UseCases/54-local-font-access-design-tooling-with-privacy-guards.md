# Use Case 54: Local Font Access for Browser Design Tooling With Privacy Guards

Design users want "use my installed fonts." Security and privacy teams hear "new fingerprint surface." Both are correct, simultaneously, and the feature only works when the architecture takes both seriously.

This covers responsible use of Local Font Access in web-based creative tools.

## Why Font Inventories Are a Fingerprinting Goldmine

A user's installed font list is high-entropy — the exact combination of fonts someone has installed is often unique enough to help identify them across sessions. Support is browser-limited on top of that, and users expect desktop-app behavior from what is still, underneath, a sandboxed web app with real permission boundaries.

## The User Story, Stripped of Domain

A user can:

- browse local fonts they've explicitly granted access to,
- preview typography accurately using their real installed fonts,
- keep control over what's actually exposed to the app.

## Core Browser Technologies

| API | Job | Reference |
|---|---|---|
| Local Font Access API | Enumerate and use locally installed fonts, permission-gated | [Chrome for Developers](https://developer.chrome.com/docs/capabilities/web-apis/local-fonts) |
| Font preview pipeline with web-font fallback | Works even where local access isn't available | [MDN - @font-face](https://developer.mozilla.org/en-US/docs/Web/CSS/@font-face), [MDN - FontFaceSet API](https://developer.mozilla.org/en-US/docs/Web/API/FontFaceSet) |
| Permission-scoped font selection cache | Persists only the chosen fonts, not the full inventory | [MDN - IndexedDB API](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API), [MDN - Storage API](https://developer.mozilla.org/en-US/docs/Web/API/Storage_API) |

## The Browser Reality Check

This is a Chromium-first feature.<sup>[1]</sup> Unsupported browsers need a genuine fallback to uploaded or bundled web fonts — not a degraded experience, a fully functional one. Project loading should never depend on local font access being present; that would make the app unusable outside Chromium for anyone who didn't happen to bundle their fonts.

## What Breaks First

- Treating the full font list as harmless telemetry and shipping it somewhere it shouldn't go — a complete local font inventory is exactly the kind of high-entropy signal fingerprinting defenses exist to stop.
- Storing persistent raw font fingerprints, turning a one-time permission grant into an ongoing identity signal.
- No fallback at all in unsupported browsers, breaking the tool entirely for Firefox and Safari users.
- Assuming identical rendering metrics across systems — the same font name can render with different metrics depending on the exact installed version and the OS's font substitution behavior.

## Minimal Technical Blueprint

```javascript
addFontButton.addEventListener('click', async () => {
  if (!('queryLocalFonts' in window)) return promptFontUpload(); // real fallback, not a dead end

  const fonts = await window.queryLocalFonts(); // permission prompt happens here
  const chosen = await presentFontPicker(fonts);
  persistFontReference(chosen.postscriptName); // store the reference, never the full inventory
});
```

1. Request access only at an explicit "Add local font" step — never on load, never implicitly.
2. Keep font handling local wherever possible, avoiding unnecessary server round-trips for what's fundamentally personal device data.
3. Persist only the chosen font references, never the full inventory the API returned.
4. Provide a robust fallback substitution map for unsupported browsers or missing glyphs.
5. Document the privacy boundary clearly and visibly — what gets read, what gets stored, and what never leaves the device.

## Privacy

Never export the full installed-font catalog to analytics, under any framing. Avoid cross-session fingerprint joins built from font sets — that's precisely the identifying signal this API's permission model exists to gate. Keep access optional and genuinely revocable, not a one-time grant with no way back.

## Test Matrix You Actually Need

- Supported Chromium versions, confirmed against the actual permission flow, not just capability detection.
- Unsupported-engine fallback quality, tested as a first-class path, not an afterthought.
- Mixed-script typography and missing-glyph behavior, since design tools attract exactly this kind of edge case.
- Permission revoke and cache invalidation, confirming a revoked grant actually clears cached font data.

## Decision Summary

Use Local Font Access for professional typography workflows where the accuracy genuinely matters to the product.

Treat it like a privileged capability requiring strict minimization — a font list is personal, identifying data, and the feature's value doesn't require treating it any less carefully than that.

---

[1]: Local Font Access API Chromium-only availability, [Chrome for Developers](https://developer.chrome.com/docs/capabilities/web-apis/local-fonts).
