# Use Case 14: Pixel-Perfect Printing From the Browser

"Print-ready" gets translated by most teams into "a server turns HTML into a PDF." That's often cargo cult wearing a billing account.

The browser can lay out invoices, tickets, labels, and forms directly and hand them to the user's print dialog. No server-side PDF worker required. Just CSS, pagination, fonts, printer settings, and several fresh opportunities for humility.

## Why 1440 Pixels Was Never a Document

A page that looks correct on a 1440px screen is not a document. The moment paper size, page breaks, browser headers, and printer margins enter the room, a perfectly reasonable responsive layout becomes a very confident liability.

## The User Story, Stripped of Domain

- open a document-like page,
- review an invoice, ticket, label sheet, or receipt,
- pick a paper size or printer in the browser's print flow,
- print or save it through the local dialog,
- get stable page breaks and readable typography,
- receive an output that needed no server-side PDF step at all.

Dispatch ticket, tax invoice, packing slip, barcode label — same rendering problem, different stationery.

## Core Browser Technologies

| API | Job | Reference |
|---|---|---|
| `@media print` | Print-only styling, separate from the screen story | — |
| `@page` | Page size, orientation, printable margins | — |
| `break-before`/`break-after`/`break-inside` | Pagination control without teaching every `div` to be a sheet of paper | — |
| `page-break-*` (legacy) | Fallback aliases — `break-*` is the preferred modern API | [MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/page-break-after) |
| `window.print()` | Invokes the user-agent print flow, only after full render | — |
| `beforeprint`/`afterprint` | Prepare and restore transient print-only UI | — |
| `@font-face` + `document.fonts.ready` | Load exact font files before any layout-sensitive output | — |
| Canvas/SVG (optional) | Deterministic barcode, QR, label art | — |
| Client-side PDF library (optional) | Alternative when users need a downloadable file, not a printer dialog | — |

## The Browser Reality Check

Chrome gives you a preview. Safari gives you a print dialog and a genuine reason to own a test printer.

Chromium is the strongest direct-print path — `@page` support, and from Chrome 131, generated content can live inside page margins, though the browser's own headers/footers stay user-agent-controlled inside the print dialog regardless of what your CSS wants.<sup>[1]</sup> Firefox handles baseline `@page`, `@media print`, and `break-*` layout safely — but don't make page-margin decoration the thing that keeps an invoice legally comprehensible; it's decoration, not structure.<sup>[1]</sup> Safari supports current `@page` paged-media basics, but exposes URL, date, background, and header/footer choices through the macOS print dialog itself.<sup>[2]</sup> That is not Chrome's preview sidebar wearing a different shirt — it's a genuinely different surface with its own controls.

Treat Chrome preview and Safari's dialog as separate pagination targets, full stop. Font metrics vary across engines, and one changed line wrap is enough to shove every subsequent page break out of position.<sup>[3]</sup>

## What Breaks First

- Assuming screen CSS just needs `display: none` on the nav and calling that a print stylesheet.
- Using deprecated `page-break-*` alone, then wondering why a modern layout fragments strangely.
- Letting flex, grid, transforms, fixed heights, or overflow rules survive untouched into print — none of them were designed with paper in mind.
- Putting business-critical text into a browser-generated header or footer the user can simply disable.<sup>[1]</sup>
- Letting the first print happen before web fonts finish loading — invisible-text-until-swap is bad enough on screen; on paper it's a wrong document.
- Assuming Chrome preview, Safari's dialog, and the actual physical printer share identical font metrics and pagination. They don't, reliably.<sup>[3]</sup>
- Calling anything "pixel-perfect" before testing the actual paper size on an actual printer.

Paper is an integration environment. It has drivers, and drivers have opinions.

## Minimal Technical Blueprint

```css
@page {
  size: A4;
  margin: 15mm; /* physical units, never viewport units */
}

@media print {
  nav, .app-shell-chrome, .sticky-controls { display: none; }
  .invoice-total, .signature-block { break-inside: avoid; }
  .ticket-record { break-after: page; }
}
```
```javascript
document.fonts.ready.then(() => {
  printButton.disabled = false; // never print before the exact font metrics are loaded
});
```

1. Build a dedicated document container. Don't print the application shell and hope to hide seventeen unrelated components with CSS after the fact.
2. Define real paper rules in `@page`: approved size, orientation, a conservative margin that leaves room for actual printer hardware tolerances.
3. Separate `@media print` stylesheet. Strip navigation, animations, sticky controls, overflow clips, decorative backgrounds — none of it belongs on paper.
4. Use `break-before`, `break-after`, `break-inside: avoid` on semantic chunks — invoice totals, ticket records, label rows, signature blocks. Keep the legacy alias only as a measured fallback, not the primary mechanism.
5. Physical units — `mm`, `in`, `pt` — for document geometry. Never let a viewport unit decide where a perforation lands.
6. Self-host the exact font files, declare the required weights, wait for `document.fonts.ready`, only then enable printing. Vertical metrics vary by typeface and engine enough to move a later line onto a new page entirely.<sup>[3]</sup>
7. Render machine-readable marks as SVG or high-resolution canvas, with a real quiet zone and a physical-size test fixture. A barcode that looks artistic but doesn't scan isn't a barcode.
8. Call `window.print()` only from a user action. `beforeprint` exposes print-only content, `afterprint` puts the app back together.
9. Offer a client-side PDF alternative only when users genuinely need a file. Keep its layout test suite separate — "same HTML" does not mean "same renderer."

## Compatibility Strategy

**Baseline:** `@media print`, `@page` size/margins, explicit fonts, normal-flow layout, tested `break-*` rules with legacy aliases where needed, user-controlled print or save-to-PDF flow.

**Enhanced:** Chrome page-margin boxes for generated page numbers and running text, richer pagination decoration, a client-side PDF download for workflows needing an attachment instead of physical paper.

The CSS Paged Media spec covers pages and breaks, but no browser today implements `marks` or `bleed` descriptors — that gap is real, not a testing oversight on your part.<sup>[4]</sup> Progressive enhancement. Not an excuse for printing an empty second page.

## Security and Compliance

Never put secrets in a visually hidden screen element and assume print CSS will save you — print from a purpose-built document DOM instead. Treat print preview as a disclosure surface on shared devices: account numbers, addresses, QR payloads, and tax identifiers all need the same access controls as the source page. If a client-side PDF library embeds fonts or images, verify its licenses and cache behavior before it ships. Add an explicit "printed copy may contain personal data" notice where policy requires it — the browser has no way to retrieve a page once it's sitting in a printer tray.

## Test Matrix You Actually Need

- Chrome/Edge: A4, Letter, portrait, landscape, print preview, Save as PDF with headers/footers on and off.
- Firefox: long tables, forced breaks, avoided breaks, a document that spills onto exactly one extra page.
- Safari macOS: the same fixtures through the native dialog, including Safari's own header/footer and background settings.
- At least one real office printer and one PDF destination per supported desktop browser — not a simulation of either.
- Android Chrome and iOS Safari for the mobile receipt/ticket flow.
- Font unavailable, font slow to load, printer scaling at 95%/100%/fit-to-page, and an actual barcode scan off the physical output.

A test that ends at a screenshot of Chrome preview never touched a printer. It imagined one.

## Decision Summary

Use this when the output is a bounded business document, ticket, receipt, or label, users can accept a browser-controlled print/save flow, supported browsers and paper formats are known in advance, and the team can maintain visual regression fixtures per browser.

Skip it when a regulator, customer, or print house requires byte-identical PDF output, when the job needs crop marks, bleed, or other features no browser implements, or when unattended batch printing or exact industrial label calibration is the actual requirement.

The browser can print the document. It cannot negotiate with the printer driver on your behalf, no matter how confident the CSS looks.

---

[1]: Chrome print margin content and header/footer behavior, [Chrome for Developers](https://developer.chrome.com/blog/print-margins).
[2]: Safari macOS print dialog controls, [Apple Support](https://support.apple.com/en-euro/guide/safari/ibrw1060/mac).
[3]: Cross-browser font metric variance affecting pagination, [Adobe Typekit Blog](https://blog.typekit.com/2010/07/14/font-metrics-and-vertical-space-in-css/).
[4]: CSS Paged Media browser coverage gaps (`marks`, `bleed`), [MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Paged_media).
