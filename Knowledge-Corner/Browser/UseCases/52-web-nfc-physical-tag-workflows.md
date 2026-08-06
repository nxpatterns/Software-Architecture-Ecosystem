# Use Case 52: Web NFC for Physical Tag Workflows

When a user taps a tag and something useful happens, people call it magic. When it fails on the wrong phone, support calls it Tuesday.

This covers NFC tag read/write flows directly in the browser.

## Why Happy-Path Demos Skip the Real Work

Platform support is highly constrained, tag formats vary in the wild, and error handling gets skipped entirely in the happy-path demo that convinced everyone this was easy.

## The User Story, Stripped of Domain

A user can:

- tap an NFC tag,
- read the context payload it carries,
- trigger the right in-app action quickly, with no manual lookup required.

## Core Browser Technologies

| API | Job | Reference |
|---|---|---|
| Web NFC API | Read/write NFC sessions from the browser | [webnfc.org – browser support](https://webnfc.org/documentation/browser-support) |
| NDEF payload parsing | Structured, defensively validated tag data | [MDN – Web NFC API](https://developer.mozilla.org/en-US/docs/Web/API/Web_NFC_API) |
| Offline-safe action queue | Handles intermittent connectivity at the point of the scan | [MDN - Background Synchronization API](https://developer.mozilla.org/en-US/docs/Web/API/Background_Synchronization_API), [MDN - IndexedDB API](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API) |

## The Browser Reality Check

This is mostly Chrome on Android — there's no reliable iOS or desktop baseline at all, since neither platform implements Web NFC.<sup>[1]</sup> A fallback isn't optional here: QR code, manual code entry, or a deep link needs to exist for every user outside that one supported combination, because that's most of the potential audience.

## What Breaks First

- No fallback path at all for unsupported devices, leaving a tap-to-scan feature as the only door into a workflow most users can't open.
- Unvalidated NDEF payload data driving app routing directly, so a malformed or unexpected tag content sends the user somewhere wrong instead of failing safely.
- Race conditions from repeated scans — a tag tapped twice quickly firing the associated action twice.
- Assuming an always-online backend for validation, when the entire point of a physical tag workflow is often a field environment with unreliable connectivity.

## Minimal Technical Blueprint

```javascript
async function startNFCScan() {
  if (!('NDEFReader' in window)) return showFallback(); // QR / manual code / deep link

  const reader = new NDEFReader();
  await reader.scan();
  reader.onreading = ({ message, serialNumber }) => {
    const payload = safelyParseNDEF(message); // schema + version checked, never trusted raw
    if (!payload) return showScanError();
    handleActionIdempotently(payload, serialNumber); // repeated taps don't double-fire
  };
}
```

1. Gate the feature on capability detection with a real fallback route, not a dead button on unsupported devices.
2. Parse NDEF defensively — validate schema and version before acting on anything the tag claims to contain.
3. Make scan actions idempotent, so a double-tap or a retry never triggers the underlying action twice.
4. Show immediate feedback for both success and failure — a tag scan with no visible confirmation reads as broken even when it worked.
5. Log coarse scan diagnostics without leaking the actual sensitive payload content into logs.

## Test Matrix You Actually Need

- Multiple Android hardware models — NFC reader quality varies meaningfully by device.
- Malformed and outdated tag payloads, deliberately tested.
- Rapid repeated scans of the same tag.
- Offline scanning followed by later reconciliation once connectivity returns.

## Decision Summary

Web NFC is excellent for constrained field workflows — inventory, check-in, physical asset tracking on a controlled Android fleet.

Treat it as a specialized capability, never a universal input primitive — the platform ceiling here is real and permanent, not a temporary gap waiting on the next browser release.

---

[1]: Web NFC browser support (Chrome on Android only), [webnfc.org](https://webnfc.org/documentation/browser-support).
