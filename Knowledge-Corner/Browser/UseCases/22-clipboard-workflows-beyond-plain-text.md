# Use Case 03: Clipboard Workflows Beyond Plain Text

Most teams think clipboard means one thing:
copy a string, paste a string, ship it.

That is the kindergarten version.
Real web apps often need richer clipboard behavior:
structured text, HTML fragments, images, and sane fallbacks when permissions or browser politics say "not today."

## Why this is a proper "hard topic"

Clipboard feels tiny in UI.
One icon, one tooltip, one happy PM.

Under the hood, it is security-sensitive, browser-dependent, and full of user-gesture constraints that can make a perfect demo die in production.

Especially in enterprise environments where security policies are not suggestions.

## User Story (Abstracted)

A user can:

- copy content from the app,
- paste content into the app,
- preserve meaningful structure where possible,
- and still complete the workflow when advanced APIs are blocked.

Could be issue trackers, CRM notes, design tools, admin consoles, doc editors.
Same pattern.
Different compliance headaches.

## Core Browser Technologies

- `Navigator.clipboard.writeText` and `readText`: baseline async text copy/paste.
- `Navigator.clipboard.write` and `read`: richer clipboard items (where supported).
- `ClipboardItem`: typed payload container (`text/plain`, `text/html`, `image/png`, etc.).
- `copy`, `cut`, `paste` DOM events: event-driven control and fallback handling.
- `DataTransfer` on clipboard events: inspect and parse incoming types.
- `document.execCommand('copy')` fallback path for legacy support cases.
- Permissions API (partial utility): inspect likely permission state before UX decisions.

## Browser Reality Check

### Desktop

- Chromium: strongest support for async clipboard and richer payload patterns.
- Firefox: text flows are solid; richer clipboard features vary and may require stricter handling.
- Safari (macOS): improved over time, still requires conservative assumptions for advanced flows.

### Mobile

- Android Chromium: generally workable for text-first workflows.
- iOS Safari / WebKit: stricter gesture and lifecycle boundaries.
  - Some clipboard actions are more tightly coupled to direct user interaction.
  - Advanced type handling is less predictable across versions.

Short version:
Copying text is easy.
Copying rich payloads across all browsers is diplomacy.

## What Usually Breaks First

- Calling clipboard APIs outside a trusted user gesture.
- Assuming `read()`/`write()` rich clipboard support is universal.
- Writing HTML without sanitization, then importing XSS into your own app.
- Treating permission prompts as stable UX flows across browsers.
- Forgetting fallback for blocked clipboard access.
- Ignoring enterprise policy restrictions that disable clipboard behavior entirely.

Your local machine says "works fine."
Corporate endpoint management says "cute."

## Minimal Technical Blueprint

1. Define clear clipboard levels:
   - Level 1: plain text,
   - Level 2: structured text + HTML,
   - Level 3: binary payloads (e.g., images).
2. Detect capability at runtime, not from browser brand assumptions.
3. For copy actions:
   - execute in direct user gesture path,
   - attempt highest supported level,
   - degrade gracefully to text.
4. For paste actions:
   - parse available MIME types,
   - prioritize safe, expected formats,
   - sanitize HTML before rendering.
5. Expose UX feedback:
   - success state,
   - fallback state,
   - manual instructions when blocked.
6. Keep a legacy fallback path for critical workflows (`execCommand`) where policy allows.
7. Log capability/failure telemetry to guide product decisions instead of guesswork.

## Compatibility Strategy (Pragmatic)

- Baseline mode (all modern browsers):
  - copy/paste plain text,
  - explicit UI feedback,
  - manual fallback instructions.
- Enhanced mode (supporting browsers):
  - rich HTML clipboard,
  - binary clipboard items,
  - smarter paste parsing.

Do not make advanced clipboard support a hard dependency unless your user base is tightly controlled.

## Security and Compliance Notes

- Clipboard data is untrusted input on paste.
- Sanitize all HTML fragments before insertion.
- Never trust hidden markup or embedded links.
- Be explicit in UX when reading from clipboard, especially in regulated domains.
- Document clipboard behavior for security review boards before rollout.

Clipboard convenience is not worth a surprise incident.

## Test Matrix You Actually Need

- Desktop Chrome, Firefox, Safari with text and HTML copy/paste.
- Real iOS Safari and Android Chrome tests for gesture-gated behavior.
- Enterprise-managed browsers with restrictive policies.
- Paste payload fuzzing:
  - malformed HTML,
  - unexpected MIME combinations,
  - oversized clipboard content.
- Accessibility pass: keyboard-only copy/paste UX and feedback visibility.

If testing stops at "Ctrl+C worked once," you tested optimism, not software.

## Decision Summary

Use this pattern when:

- users frequently move data between systems,
- speed and accuracy of transfer matter,
- rich formatting adds measurable value.

Avoid over-engineering when:

- plain text covers 95% of real workflows,
- compliance constraints neutralize rich clipboard value,
- support team cannot absorb cross-browser edge-case volume.

Because yes, clipboard looks simple.
It is simple the same way "just a small regex" is simple.
