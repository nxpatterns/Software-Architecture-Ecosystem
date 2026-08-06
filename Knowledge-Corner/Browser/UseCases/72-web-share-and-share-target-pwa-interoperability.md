# Use Case 72: Web Share and Share Target for PWA Interoperability

Users expect sharing to flow both ways: out to their native apps, and in from those apps back into yours. Web Share and Web Share Target close that loop without a single copy-paste in either direction.

## Why Sharing Was Never Just a Button

Support differs by platform and context, payload types vary between text, URLs, and files, and fallback UX gets neglected constantly because "just add a share button" undersells how much platform-specific behavior sits underneath it.

## The User Story, Stripped of Domain

A user can:

- share content out of the app through the native share sheet,
- send shared content into the PWA from another app,
- complete either direction without clipboard gymnastics standing in the way.

## Core Browser Technologies

| API | Job | Reference |
|---|---|---|
| Web Share API (`navigator.share()`) | Outbound sharing to the native share sheet | [MDN – Navigator.share()](https://developer.mozilla.org/en-US/docs/Web/API/Navigator/share) |
| Web Share Target (manifest integration) | Inbound sharing into the installed PWA | [MDN – Share PWA content](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Share) |
| Payload validation and routing | Inbound shared data treated as untrusted input | [OWASP Input Validation Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Input_Validation_Cheat_Sheet.html), [MDN - URL API](https://developer.mozilla.org/en-US/docs/Web/API/URL) |

## The Browser Reality Check

Outbound sharing via `navigator.share()` is broadly supported on mobile browsers and increasingly on desktop, though desktop Chrome and Firefox historically lagged mobile support — a rare case where the phone does something the desktop doesn't do as well.<sup>[1]</sup> Share Target requires the PWA to actually be installed, which narrows the audience further; it's not a feature that works for a bookmarked tab.

## What Breaks First

- No fallback at all in an unsupported environment, leaving a share button that silently does nothing.
- Weak validation of inbound shared payloads, treating whatever another app handed off as trusted input by default.
- Poor routing of shared content into app state, dumping a shared file or link somewhere the user then has to go hunting for.

## Minimal Technical Blueprint

```javascript
shareButton.addEventListener('click', async () => {
  if (!navigator.share) return showCopyLinkFallback(); // real fallback
  try { await navigator.share({ title, url }); } catch { /* user cancelled — normal */ }
});
```

```json
// manifest.json — inbound Share Target
{ "share_target": { "action": "/share-intake", "method": "GET",
  "params": { "title": "title", "text": "text", "url": "url" } } }
```

1. Feature-detect outbound share support and keep a copy-link fallback fully functional for everywhere it's missing.
2. Define a strict inbound payload schema for the share target endpoint — validate before trusting anything it received.
3. Route inbound data to an explicit intake flow, not a generic drop zone the user has to interpret.
4. Measure completion and drop-off separately for each share path, since outbound and inbound sharing fail in different ways.

## Decision Summary

Treat sharing as workflow infrastructure, not a decorative button — for the users it reaches, it's a genuine reduction in friction, and it deserves the same validation discipline as any other data entry point into the app.

---

[1]: Web Share API mobile-first support pattern, [MDN](https://developer.mozilla.org/en-US/docs/Web/API/Navigator/share).
