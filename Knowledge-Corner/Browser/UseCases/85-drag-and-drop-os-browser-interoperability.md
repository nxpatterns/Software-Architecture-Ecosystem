# Use Case 85: Drag and Drop Between the Browser and the Operating System

Dragging a file from a desktop folder into a browser tab feels like it should be trivial. Dragging something out of the browser onto the desktop feels like it should be symmetric. It isn't — the browser-to-OS direction is a genuinely different, much more constrained problem than OS-to-browser.

## Why the Two Directions Aren't Mirror Images

Native HTML5 Drag and Drop covers dragging within and into the page extremely well — a file dropped from the OS file explorer onto a page is a well-trodden, broadly supported path. Dragging content *out* of the browser onto the desktop is a narrower capability, historically inconsistent across engines, and still mostly a Chromium-specific trick rather than a universal API guarantee.

## The User Story, Stripped of Domain

A user can:

- drag a file from their desktop directly into the browser to upload or import it,
- drag an image, link, or generated file out of the browser onto their desktop or into another app,
- get clear visual feedback throughout, instead of wondering whether the drop actually registered.

## Core Browser Technologies

| API | Job | Reference |
|---|---|---|
| HTML Drag and Drop API (`dragover`, `drop`) | The core event model for both directions | [MDN – HTML Drag and Drop API](https://developer.mozilla.org/en-US/docs/Web/API/HTML_Drag_and_Drop_API) |
| `DataTransfer`/`DataTransferItemList` | Carries the dragged payload — files, text, or custom data | [MDN – DataTransfer](https://developer.mozilla.org/en-US/docs/Web/API/DataTransfer) |
| `DownloadURL` drag-out convention (Chromium) | Enables dragging a generated file out to the OS | [MDN – HTML Drag and Drop API](https://developer.mozilla.org/en-US/docs/Web/API/HTML_Drag_and_Drop_API) |
| File System Access API (optional, see Use Case 68) | A stronger alternative for saving content locally where supported | [MDN - File System API](https://developer.mozilla.org/en-US/docs/Web/API/File_System_API), [Chrome for Developers - File System Access API](https://developer.chrome.com/docs/capabilities/web-apis/file-system-access) |

## The Browser Reality Check

Dragging *into* the browser — files from the OS file explorer, or between elements on the page — is broadly supported and consistent across Chrome, Firefox, and Safari, and has been for a long time. This direction is safe to build on as a baseline.

Dragging *out* of the browser to the OS desktop is where the asymmetry shows up. The common mechanism — setting a `DownloadURL` value in `dataTransfer` to let the browser materialize a file on drop — is a Chromium convention, not a universally implemented standard behavior, and Safari and Firefox handle drag-out with meaningfully different levels of support and reliability. Treat drag-out as a Chromium-favored enhancement, not a cross-browser guarantee, and always pair it with an explicit "Save" or "Download" button as the reliable fallback.

## What Breaks First

- Forgetting to call `event.preventDefault()` on both `dragover` and `drop` — without it, the browser's default behavior (often navigating to the dropped file) fires instead of the intended handler.
- Assuming drag-out to the desktop works identically across browsers, when it's meaningfully more reliable in Chromium than elsewhere.
- No visual feedback during the drag — a drop zone that doesn't highlight on `dragenter` leaves the user unsure whether the interaction is even being recognized.
- Treating dropped file content as safe because it came from "the user's own computer" — a dropped file is still user-supplied input requiring the same validation as an uploaded one.

## Minimal Technical Blueprint

```javascript
dropZone.addEventListener('dragover', (e) => {
  e.preventDefault(); // required, or drop never fires
  dropZone.classList.add('drag-active'); // visible feedback, every time
});

dropZone.addEventListener('drop', (e) => {
  e.preventDefault();
  dropZone.classList.remove('drag-active');
  const files = [...e.dataTransfer.files];
  files.forEach(validateAndProcess); // still untrusted input, regardless of source
});

// Drag-out (Chromium-favored): still pair with an explicit Save button as the real fallback
exportItem.addEventListener('dragstart', (e) => {
  e.dataTransfer.setData('DownloadURL', `${mimeType}:${filename}:${blobUrl}`);
});
```

1. Always call `preventDefault()` on both `dragover` and `drop` — the single most common reason a drop handler silently never fires.
2. Provide clear visual feedback on `dragenter`/`dragleave`, so the user has continuous confirmation the interaction is registering.
3. Validate every dropped file exactly as rigorously as an uploaded one — its local origin doesn't make it trusted input.
4. Treat drag-out to the desktop as a Chromium-favored enhancement and ship an explicit Save/Download button as the reliable, universal fallback.
5. Support both drag-and-drop and a traditional file input side by side — drag-and-drop is a convenience layer, not a replacement for the accessible, keyboard-operable alternative.

## Decision Summary

Use drag-in freely — it's a mature, well-supported, low-risk enhancement to any file upload or import flow.

Use drag-out as a nice-to-have layered on top of a real export button, not as the primary mechanism — the cross-browser inconsistency here is real, and a feature that only reliably works in Chromium isn't a complete feature.
