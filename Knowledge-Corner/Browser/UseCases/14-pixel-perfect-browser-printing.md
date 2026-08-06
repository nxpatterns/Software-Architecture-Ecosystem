# Use Case 14: Pixel-Perfect Printing From the Browser

Most teams assume a document becomes “print-ready” only after a server turns
HTML into a PDF.
That is often cargo cult with a billing account.

The browser can lay out invoices, tickets, labels, and forms directly, then hand
them to the user's print dialog. No server-side PDF worker required. Just CSS,
pagination, fonts, printer settings, and several opportunities for humility.

## Why this is a good next "hard topic"

Because a page that looks correct at 1440 pixels is not a document.
The moment paper size, page breaks, browser headers, and printer margins enter
the room, your normal responsive layout becomes a very confident liability.

## User Story (Abstracted)

A user can:

- open a document-like page,
- review an invoice, ticket, label sheet, or receipt,
- choose a paper size or printer in the browser print flow,
- print it or save it through the local print dialog,
- receive stable page breaks and readable typography,
- and get an output that needs no server-side PDF generation step.

We do not care which document.
Could be a dispatch ticket, a tax invoice, a packing slip, or a barcode label.
Same rendering problem. Different stationery.

## Core Browser Technologies

- `@media print`: apply document styles only to print and print-preview output.
- `@page`: set page size, orientation, and printable margins.
- `break-before` / `break-after` / `break-inside`: control pagination without teaching every `div` how to be a sheet of paper.
- `page-break-*` legacy aliases: fallback declarations for older print CSS and
  existing layouts; the modern `break-*` properties are the preferred API
  ([MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/page-break-after)).
- `window.print()`: invoke the user-agent print flow after the document is
  fully rendered.
- `beforeprint` / `afterprint`: prepare and restore transient print UI.
- `@font-face` and `document.fonts.ready`: load the exact font files before
  allowing layout-sensitive output.
- `Canvas` / SVG (optional): create deterministic barcode, QR, and label art.
- `CSS counters` / page-margin boxes (optional): page numbers and running labels where the target browser actually supports them.
- Client-side PDF library (optional): alternative download path when users need a generated PDF file rather than a printer dialog.

## Browser Reality Check

### Desktop

- Chromium (Chrome, Edge, Arc): the strongest direct-print path. Chrome supports `@page`, and from Chrome 131 it can place generated content in page margins; its own print headers and footers remain user-agent content controlled in the print dialog ([Chrome for Developers](https://developer.chrome.com/blog/print-margins)).
- Firefox: safe for the baseline `@page`, `@media print`, and `break-*` layout, but do not make page-margin decoration the thing that keeps an invoice legally comprehensible ([Chrome for Developers](https://developer.chrome.com/blog/print-margins)).
- Safari (macOS): supports current `@page` paged-media basics ([caniuse](https://caniuse.com/css-paged-media)), but it exposes webpage URL, date, background, and header/footer choices through the macOS print dialog ([Apple Support](https://support.apple.com/en-euro/guide/safari/ibrw1060/mac)).
  That is not Chrome's preview sidebar wearing a different shirt.
- Treat Chrome preview and Safari's dialog as separate pagination targets. Font
  metrics vary across browsers; one changed line wrap is enough to move every
  later page break ([Adobe Typekit](https://blog.typekit.com/2010/07/14/font-metrics-and-vertical-space-in-css/)).

### Mobile

- Android Chromium: useful for receipts and simple labels, but validate the
  actual printer/share destination rather than declaring “PDF output” solved.
- iOS Safari / WebKit-based browsers: build for a user-driven print/share flow,
  not unattended production printing.
  - Keep pages short and single-purpose.
  - Avoid a layout that relies on manually tuned printer margins.
  - Do not promise a label will land at a physical size unless the target
    printer, paper, scaling setting, and device have been tested together.

Short version: Chrome gives you a preview.
Safari gives you a print dialog and a reason to own a test printer.

## What Usually Breaks First

- Assuming screen CSS merely needs a `display: none` for the navigation.
- Using deprecated `page-break-*` alone and then wondering why a modern layout
  fragments strangely.
- Letting flex, grid, transforms, fixed heights, or overflow rules survive
  untouched into print layout.
- Putting business-critical text in a browser-generated header or footer that the user can disable ([Chrome for Developers](https://developer.chrome.com/blog/print-margins)).
- Letting the first print happen before web fonts finish loading.
- Assuming Chrome preview, Safari's macOS dialog, and the final printer use identical font metrics, scaling, or pagination ([Adobe Typekit](https://blog.typekit.com/2010/07/14/font-metrics-and-vertical-space-in-css/)).
- Calling it “pixel-perfect” before testing the actual paper size.

Paper is an integration environment. It has drivers.

## Minimal Technical Blueprint

1. Create a dedicated document container. Do not print the application shell
   and attempt to hide seventeen unrelated components later.
2. Define real paper rules in `@page`: approved size, orientation, and a
   conservative margin that leaves room for printer hardware.
3. Add a separate `@media print` stylesheet. Flatten screen-only layout where
   necessary: remove navigation, animations, sticky controls, overflow clips,
   and decorative backgrounds that do not belong on paper.
4. Use `break-before`, `break-after`, and `break-inside: avoid` on semantic
   chunks: invoice totals, ticket records, label rows, and signature blocks.
   Keep the legacy `page-break-*` alias only as a measured fallback.
5. Use explicit physical units (`mm`, `in`, `pt`) for document geometry; do
   not let viewport units decide where a perforation lives.
6. Self-host the exact font files, declare the required weights, wait for
   `document.fonts.ready`, then enable Print. Vertical font metrics vary among
   typefaces and browser engines, which is enough to move a later line onto a
   new page ([Adobe Typekit](https://blog.typekit.com/2010/07/14/font-metrics-and-vertical-space-in-css/)).
7. Render machine-readable marks as SVG or high-resolution canvas, with a
   quiet zone and physical-size test fixture. A barcode that looks artistic but
   will not scan is not a barcode.
8. Call `window.print()` only from a user action. Use `beforeprint` to expose
   print-only content and `afterprint` to put the app back together.
9. Provide a client-side PDF alternative only when the user needs a file. Keep
   its layout test suite separate; “same HTML” is not the same renderer.

## Compatibility Strategy (Pragmatic)

- Baseline mode (all modern browsers):
  - `@media print`, `@page` size/margins, explicit fonts,
  - normal-flow document layout,
  - tested `break-*` rules with legacy aliases where required,
  - user-controlled print or save-to-PDF flow.
- Enhanced mode (supporting browsers):
  - Chrome page-margin boxes for generated page numbers and running text,
  - print-specific counters and richer pagination decoration,
  - a client-side PDF download for workflows that need an attachment instead
    of physical paper.

The core CSS Paged Media model covers pages and breaks, but browser support does
not extend to everything in the specification: no browser supports `marks` and
`bleed` descriptors today ([MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Paged_media)).

This is progressive enhancement, not an excuse to print an empty second page.

## Security and Compliance Notes

- Do not put secrets in a visually hidden screen element and assume print CSS
  will save you. Print from a purpose-built document DOM.
- Treat a print preview as a disclosure surface on shared devices: account
  numbers, addresses, QR payloads, and tax identifiers need the same access
  controls as the page itself.
- If a client-side PDF library embeds fonts or images, verify its licenses and
  cache behavior.
- Add an explicit “printed copy may contain personal data” notice where policy
  requires it. The browser cannot retrieve a page from a printer tray.

## Test Matrix You Actually Need

- Chrome/Edge latest: A4, Letter, portrait, landscape, print preview, and
  Save as PDF with headers/footers both on and off.
- Firefox latest: long tables, forced breaks, avoided breaks, and a document
  that spills onto exactly one more page.
- Safari macOS latest: the same fixtures through the native print dialog,
  including Safari header/footer and background settings.
- At least one real office printer and one PDF destination for each supported
  desktop browser.
- Android Chrome and iOS Safari for the mobile receipt/ticket flow.
- Font unavailable, font slow to load, printer scaling at 95%/100%/fit-to-page,
  and a barcode scan from the physical output.

If the test ends at a screenshot of Chrome preview, the printer has not been
tested. It has been imagined.

## Decision Summary

Use this pattern when:

- the output is a bounded business document, ticket, receipt, or label,
- users can accept a browser-controlled print/save flow,
- the supported browsers and paper formats are known,
- the team can maintain visual regression fixtures per browser.

Avoid this pattern when:

- a regulator, customer, or print house requires byte-identical PDF output,
- output needs crop marks, bleed, or other features browsers do not implement,
- unattended batch printing or exact industrial label calibration is required.

Because yes, the browser can print the document.
No, it cannot negotiate with the printer driver on your behalf.

## Next Logical Topic

After this, the best follow-up is:
**Browser-based barcode and label composition**
(physical dimensions, SVG/Canvas rendering, scanner verification, and why
“100% scale” is not a measurement system).
