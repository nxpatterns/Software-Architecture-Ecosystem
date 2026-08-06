# Use Case 04: Rich-Text Editor With Reliable Undo/Redo

Most teams think a rich-text editor is a `contenteditable` element plus a bold button. Then they ship it, paste in a table from a spreadsheet, press undo, and discover the browser has been freelancing in their document model.

This use case is about taking control without fighting the keyboard, selection, or an IME. The browser may still do the typing. It does not get to be the source of truth.

## Why this is a good next "hard topic"

Because editing is not one event. It is selection movement, input intent, paste, composition, browser DOM mutation, history grouping, and sometimes a phone keyboard doing something perfectly reasonable to code that is not.

## User Story (Abstracted)

A user can:

- click into formatted text,
- type, select, delete, and insert paragraphs,
- apply inline and block formatting,
- paste content from another application,
- type with an IME or mobile keyboard,
- undo and redo their own changes predictably,
- and keep the caret where a human expects after every operation.

We do not care which content.
Could be a knowledge-base article, a proposal, an email draft, a comment, or a
structured note. Same editing engine problem.

## Core Browser Technologies

- `contenteditable`: browser editing surface and input integration, not the
  canonical document database.
- `Selection` / `Range` API: read and restore the caret or selected content
  before and after controlled mutations.
- `beforeinput`: capture the user's editing intent before the browser mutates the editing host, then selectively prevent or translate it.
- `input` / `compositionstart` / `compositionupdate` / `compositionend`: observe native mutations and keep IME composition separate from committed document transactions.
- `ClipboardEvent` / `DataTransfer`: read plain text and rich HTML during paste, then sanitize and normalize it.
- `MutationObserver`: last-resort reconciliation when an allowed native edit
  changes DOM in a way the editor did not model directly.
- `History API` in the editor model: store semantic transactions and selection snapshots for reliable undo/redo; do not outsource this to browser history.
- `InputEvent.getTargetRanges()` (where present): map an editing intent to the affected static ranges before deciding how to handle it.

## Browser Reality Check

### Desktop

- Chromium (Chrome, Edge, Arc): the modern editing primitives are available: `contenteditable` is broadly established and `beforeinput` is supported
  ([MDN](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Global_attributes/contenteditable), [MDN](https://developer.mozilla.org/en-US/docs/Web/API/Element/beforeinput_event)).
  Still intercept intent, not keystrokes; paste, context menus, and platform
  formatting controls do not all arrive as a tidy keyboard shortcut.
- Firefox: modern Firefox supports `beforeinput` and `getTargetRanges()`; Mozilla enabled both by default in Firefox 87
  ([Mozilla Hacks](https://hacks.mozilla.org/2021/03/in-march-we-see-firefox-87/)).
  That makes the same controlled-input architecture practical, not an excuse
  to rely on browser-native undo semantics.
- Safari (macOS): WebKit implements `beforeinput`, including `inputType` and
  `dataTransfer` for rich pasted content
  ([WebKit](https://webkit.org/blog/7358/enhanced-editing-with-input-events/)).
  The trap is assuming that feature support makes its native editing DOM
  interchangeable with Chromium or Firefox. Keep one normalized document
  schema and own paragraph/line-break serialization.

### Mobile

- Android Chromium: the same `contenteditable` and `beforeinput` foundations apply ([MDN](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Global_attributes/contenteditable), [MDN](https://developer.mozilla.org/en-US/docs/Web/API/Element/beforeinput_event)).
  Test the actual keyboard, long-press selection, paste menu, and back button;
  desktop DevTools does not contain a phone keyboard.
- iOS Safari / WebKit-based browsers: this is where native editing quirks earn
  their reputation. WebKit has an open report in which IME input mutates a
  `contentEditable` DOM before `keydown`
  ([WebKit bug 25119](https://bugs.webkit.org/show_bug.cgi?id=25119)), and a
  Safari composition report reproduces `deleteCompositionText` removing empty
  wrapper nodes during Japanese IME replacement
  ([ProseMirror issue 934](https://github.com/ProseMirror/prosemirror/issues/934)).
  Treat composition as a protected transaction; do not normalize or rerender
  the composing subtree on every keystroke.

Short version: `contenteditable` accepts text.
Safari asks whether you meant that text, that line break, or that DOM node.

## What Usually Breaks First

- Calling `document.execCommand()` for formatting or undo because it appears to work in a five-minute demo. It is deprecated and not recommended for new code ([MDN](https://developer.mozilla.org/en-US/docs/Web/API/Document/execCommand)).
- Saving `innerHTML` after every input and calling it an editor state model.
- Mapping a selection by DOM child indexes, then invalidating it when a paste
  normalizer wraps one inline node.
- Handling only `keydown`; IME, paste, drag/drop, context menus, and mobile
  formatting controls do not promise to behave like a physical key.
- Letting native `insertParagraph` decide permanent document structure, then being surprised when browsers choose different editing DOM shapes
  ([contenteditable lab](https://contenteditable.realerror.com/docs/input-types/insertParagraph/)).
- Sanitizing paste after the browser has already inserted hostile or ugly
  markup instead of preventing the default paste and inserting normalized
  content yourself.
- Putting browser undo and application undo in the same room without a clear
  owner. They will both bring history.

## Minimal Technical Blueprint

1. Define a constrained document schema first: paragraphs, headings, lists,
   links, marks, embeds, and the exact HTML serialization you will permit.
2. Render that model into one editing host, and represent selections with
   model positions plus a DOM `Range` mapping layer.
3. Listen for `beforeinput`; translate supported `inputType` values into
   semantic transactions, call `preventDefault()`, apply the transaction to
   the model, render the smallest safe DOM change, then restore selection.
4. Handle `insertFromPaste` and the `paste` event explicitly: read clipboard
   data, sanitize it, convert it to the schema, and insert one transaction.
5. During composition, preserve the browser-owned composing DOM. Delay heavy
   normalization, collaborative transforms, and selection repair until the
   composition commits or cancels.
6. For native paths you intentionally allow, observe `input` and reconcile
   mutations into the model immediately. Do not leave unmodelled DOM changes
   around hoping they remain harmless.
7. Push semantic transactions, inverse transactions, and pre/post-selection
   snapshots into an editor-owned undo stack. Group adjacent typing by time,
   selection continuity, and composition boundary.
8. On undo/redo, apply the inverse/forward transaction to the model, rerender
   deterministically, and restore the recorded selection. Browser undo can be
   blocked or delegated only after this contract is explicit.

## Compatibility Strategy (Pragmatic)

- Baseline mode (all modern browsers): constrained `contenteditable`,
  Selection/Range mapping, sanitized paste, editor-owned transaction history,
  and a conservative input fallback that reconciles `input` events.
- Enhanced mode (supporting browsers): precise `beforeinput.inputType` and
  `getTargetRanges()` interception before DOM mutation. `beforeinput` applies
  to `contenteditable` editing hosts and is broadly available
  ([MDN](https://developer.mozilla.org/en-US/docs/Web/API/Element/beforeinput_event)).

This is progressive enhancement, not an invitation to store random browser
DOM forever.

## Security and Compliance Notes

- Treat pasted HTML as hostile input. Sanitize tags, attributes, URL schemes,
  styles, embeds, and data URLs before it reaches the canonical model.
- Enforce the same schema and sanitization server-side; client filtering is
  fast UX, not a security boundary.
- If documents contain sensitive content, define retention and access rules
  for autosave, offline drafts, clipboard handling, and error telemetry.
- Never put full document text into client analytics or exception reports.

A polished editor that turns paste into XSS is still a security incident with
better typography.

## Test Matrix You Actually Need

- Desktop Chrome/Edge: type, format, paste rich HTML, undo/redo, then compare
  model and rendered DOM after every transaction.
- Firefox latest: repeat the same tests with `beforeinput`, selection changes,
  and native spellcheck/autocomplete paths.
- Safari macOS latest: test Enter at empty and formatted blocks, paste plain
  and rich content, composition with a Japanese or Chinese IME, and undo after
  each operation.
- Android Chromium on a real phone: long-press selection, keyboard suggestions,
  paste from another app, and undo around an IME commit.
- iOS Safari on a real phone: same tests, plus focus loss mid-composition and
  a paste into nested formatting.
- A selection around links, inline marks, empty blocks, list items, and table
  cells before every formatting, paste, undo, and redo case.

If your editor test plan is English-only typing in Chrome, you built a demo
that happens to have a caret.

## Decision Summary

Use this pattern when:

- users need structured, formatted content rather than a plain textarea,
- content must be sanitized, normalized, and stored predictably,
- undo/redo and IME behavior are product requirements, not nice extras.

Avoid this pattern when:

- plain text or Markdown is sufficient,
- the project cannot budget for browser, keyboard, selection, paste, and IME
  testing on real devices.

Because yes, it is "just contenteditable." And no, the browser is not your
editor engine.

## Next Logical Topic

After this, the best follow-up is:
**Clipboard and cross-app data exchange in the browser**
(rich paste, files, permission gates, sanitization, and why clipboard APIs
become product behavior the moment users depend on them).
