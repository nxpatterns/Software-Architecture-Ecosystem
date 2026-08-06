# Use Case 04: Rich-Text Editor With Reliable Undo/Redo

Most teams think a rich-text editor is `contenteditable` plus a bold button. Then someone pastes a table from a spreadsheet, hits undo, and discovers the browser has been quietly freelancing in what everyone assumed was their document model.

The browser may still do the typing. It does not get to be the source of truth. This use case is about taking control without fighting the keyboard, the selection, or an IME that has its own opinions about your DOM.

## Why Editing Is Not One Event

Editing is selection movement, input intent, paste, IME composition, native DOM mutation, history grouping — and occasionally a phone keyboard doing something perfectly reasonable to code that finds it anything but.

## The User Story, Stripped of Domain

- click into formatted text,
- type, select, delete, insert paragraphs,
- apply inline and block formatting,
- paste content from another application,
- type through an IME or mobile keyboard,
- undo and redo predictably,
- keep the caret exactly where a human expects after every single operation.

Knowledge-base article, proposal, comment, structured note — same editing engine underneath, same list of ways to get it wrong.

## Core Browser Technologies

| API | Job | Reference |
|---|---|---|
| [`contenteditable`](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Global_attributes/contenteditable) | The editing surface and input integration — not your document database | MDN |
| [Selection / Range API](https://developer.mozilla.org/en-US/docs/Web/API/Selection) | Read and restore the caret around controlled mutations | MDN |
| [`beforeinput`](https://developer.mozilla.org/en-US/docs/Web/API/Element/beforeinput_event) | Catch editing intent before the browser mutates anything | MDN |
| `compositionstart/update/end` | Keep IME composition out of your committed transaction history | [compositionstart (MDN)](https://developer.mozilla.org/en-US/docs/Web/API/Element/compositionstart_event), [compositionupdate (MDN)](https://developer.mozilla.org/en-US/docs/Web/API/Element/compositionupdate_event), [compositionend (MDN)](https://developer.mozilla.org/en-US/docs/Web/API/Element/compositionend_event) |
| `ClipboardEvent` / `DataTransfer` | Read plain text and rich HTML on paste, then sanitize it yourself | [ClipboardEvent (MDN)](https://developer.mozilla.org/en-US/docs/Web/API/ClipboardEvent), [DataTransfer (MDN)](https://developer.mozilla.org/en-US/docs/Web/API/DataTransfer) |
| `MutationObserver` | Last-resort reconciliation for native edits your model didn't see coming | [MDN](https://developer.mozilla.org/en-US/docs/Web/API/MutationObserver) |
| Editor-owned history model | Semantic transactions and selection snapshots — never outsourced to browser undo | [History API (MDN)](https://developer.mozilla.org/en-US/docs/Web/API/History_API) |
| `InputEvent.getTargetRanges()`| Map intent to affected ranges before deciding what to do about it | [MDN](https://developer.mozilla.org/en-US/docs/Web/API/InputEvent/getTargetRanges)  |

## The Browser Reality Check

**Desktop.** Chromium has the modern editing primitives — `contenteditable` is broadly established, `beforeinput` is supported.<sup>[1]</sup> That still doesn't mean every intent arrives as a tidy keyboard shortcut; paste, context menus, and OS-level formatting controls don't file a `keydown` event first. Firefox enabled `beforeinput` and `getTargetRanges()` by default back in Firefox 87.<sup>[2]</sup> Safari's WebKit implements `beforeinput` including `inputType` and `dataTransfer` for rich paste.<sup>[3]</sup> The trap across all three: assuming feature parity means DOM parity. It doesn't. Own one normalized schema and serialize it yourself.

**Mobile.** Android Chromium runs on the same foundations — test the actual keyboard, long-press selection, and paste menu; desktop DevTools does not simulate a phone keyboard, no matter how convincing the emulator looks.

iOS Safari is where composition earns its reputation. WebKit has an open, specific report of IME input mutating the `contentEditable` DOM before `keydown` even fires,<sup>[4]</sup> and a documented Safari case where `deleteCompositionText` removes empty wrapper nodes mid-Japanese-IME-replacement.<sup>[5]</sup> Treat composition as a protected transaction. Don't normalize or rerender the composing subtree on every keystroke — you'll lose the race with the IME every time.

`contenteditable` accepts text. Safari asks whether you meant that text, that line break, or that specific DOM node.

## What Breaks First

- Calling `document.execCommand()` because it works in a five-minute demo. It's deprecated, unrecommended for new code, and a trap with excellent initial optics.
- Saving `innerHTML` after every keystroke and calling that a state model. It's a snapshot of a browser's opinion, not a document.
- Mapping selection by DOM child index, then watching it invalidate the moment a paste normalizer wraps one inline node.
- Handling only `keydown`. IME, paste, drag-drop, and mobile formatting controls never promised to behave like a physical key.
- Letting native `insertParagraph` decide permanent document structure, then being surprised different browsers choose different shapes for the same keystroke.
- Sanitizing paste *after* the browser already inserted hostile markup, instead of intercepting `beforeinput` and inserting normalized content yourself.
- Running browser-native undo and application undo in the same room with no agreed owner. Both will show up with their own version of history.

## Minimal Technical Blueprint

```javascript
editorHost.addEventListener('beforeinput', (e) => {
  const handler = supportedInputTypes[e.inputType];
  if (!handler) return; // let genuinely unhandled types pass, don't fight everything

  e.preventDefault();
  const ranges = e.getTargetRanges();
  const transaction = handler(model, ranges, e.dataTransfer ?? e.data);

  applyTransaction(model, transaction);
  renderMinimalDiff(model, transaction);
  restoreSelection(transaction.resultingSelection);
  history.push(transaction); // editor-owned, not browser-owned
});
```

1. Define a constrained schema first: paragraphs, headings, lists, links, marks, embeds — and the exact HTML you'll ever permit.
2. Render into one editing host, represent selection as model positions with a DOM `Range` mapping layer on top.
3. Listen for `beforeinput`, translate supported `inputType` values into semantic transactions, `preventDefault()`, apply to the model, render the smallest safe diff, restore selection.
4. Handle paste explicitly: read clipboard data, sanitize, convert to schema, insert as one transaction — never let raw clipboard HTML touch the DOM directly.
5. During composition, leave the browser-owned composing DOM alone. Delay normalization and collaborative transforms until it commits or cancels.
6. For native paths you deliberately allow through, reconcile via `input` events immediately — don't leave unmodelled DOM changes lying around hoping they stay harmless.
7. Push transactions, inverse transactions, and selection snapshots into an editor-owned undo stack, grouped by time, selection continuity, and composition boundaries.
8. On undo/redo: apply the inverse or forward transaction, rerender deterministically, restore recorded selection. Only after this contract is airtight can browser undo be blocked or delegated.

## Compatibility Strategy

**Baseline:** constrained `contenteditable`, Selection/Range mapping, sanitized paste, editor-owned transaction history, conservative `input`-event reconciliation as fallback.

**Enhanced:** precise `beforeinput.inputType` and `getTargetRanges()` interception before mutation — broadly available where it counts.

Progressive enhancement. Not an invitation to let random browser DOM live in your document forever.

## Security and Compliance

Treat every pasted HTML payload as hostile: sanitize tags, attributes, URL schemes, styles, embeds, data URLs before it touches the canonical model. Enforce the same schema and sanitization server-side — client-side filtering is UX polish, not a security boundary, and nobody's pen test will accept the substitution.

If documents carry sensitive content, define retention and access rules for autosave, offline drafts, clipboard handling, and error telemetry. Never let full document text ride along in analytics or exception reports — a polished editor that turns paste into XSS is still a security incident, just one with better typography.

## Test Matrix You Actually Need

- Desktop Chrome/Edge: type, format, paste rich HTML, undo/redo, diff model against rendered DOM after every transaction.
- Firefox: same tests, plus native spellcheck and autocomplete paths interacting with `beforeinput`.
- Safari macOS: Enter at empty and formatted blocks, plain and rich paste, Japanese or Chinese IME composition, undo after each.
- Android real device: long-press selection, keyboard suggestions, cross-app paste, undo around an IME commit.
- iOS real device: same, plus focus loss mid-composition and paste into nested formatting.
- Selections spanning links, marks, empty blocks, list items, and table cells before every formatting/paste/undo case.

English-only typing in Chrome is a demo with a caret, not a test plan.

## Decision Summary

Use this when users need structured, formatted content rather than a plain textarea, when output must be sanitized and stored predictably, and when undo/redo and IME behavior are actual requirements rather than nice-to-haves nobody budgeted for.

Skip it when plain text or Markdown genuinely covers the need, or when the project can't fund real browser, keyboard, selection, paste, and IME testing on physical devices.

It's "just `contenteditable`." The browser was never going to be your editor engine, no matter how politely it pretends otherwise.

---

[1]: `contenteditable` and `beforeinput` support, [MDN – contenteditable](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Global_attributes/contenteditable), [MDN – beforeinput](https://developer.mozilla.org/en-US/docs/Web/API/Element/beforeinput_event).
[2]: Firefox 87 enabling `beforeinput`/`getTargetRanges()` by default, [Mozilla Hacks](https://hacks.mozilla.org/2021/03/in-march-we-see-firefox-87/).
[3]: WebKit `beforeinput` implementation detail, [WebKit Blog](https://webkit.org/blog/7358/enhanced-editing-with-input-events/).
[4]: IME mutating `contentEditable` before `keydown`, [WebKit Bug 25119](https://bugs.webkit.org/show_bug.cgi?id=25119).
[5]: Safari `deleteCompositionText` node removal during Japanese IME, [ProseMirror Issue 934](https://github.com/ProseMirror/prosemirror/issues/934).
