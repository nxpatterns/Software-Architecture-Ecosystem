# Use Case 68: File System Access API for Project-Style Browser Editing

Picking one file is not the same as managing a project folder. The File System Access API lets a browser app behave like a real local editor — open a folder, edit files in place, save back to disk, no download-then-reupload dance required.

## Why Persistent Permissions Are Harder Than One-Time File Picks

Permissions here are persistent and stateful, not a one-shot grant. Handle validity changes over time as files move, get deleted, or the underlying permission expires. And unsupported browsers need a genuinely different UX contract, not a degraded version of the same one.

## The User Story, Stripped of Domain

A user can:

- open files or folders directly from local disk,
- edit in place,
- save changes without a repetitive download-upload loop standing between every edit and the file actually being saved.

## Core Browser Technologies

| API | Job | Reference |
|---|---|---|
| `showOpenFilePicker()`/`showDirectoryPicker()` | User-mediated file/folder selection | [MDN – File System API](https://developer.mozilla.org/en-US/docs/Web/API/File_System_API) |
| File/directory handles + permission lifecycle | Persistent references with their own permission state | [Chrome for Developers](https://developer.chrome.com/docs/capabilities/web-apis/file-system-access) |
| Fallback import/export flow | The universal path for browsers without the API | [MDN - File API](https://developer.mozilla.org/en-US/docs/Web/API/File_API), [MDN - URL.createObjectURL()](https://developer.mozilla.org/en-US/docs/Web/API/URL/createObjectURL_static) |

## The Browser Reality Check

This is a Chromium feature with no Firefox or Safari implementation as of this writing — a project-style editing tool built purely around this API simply doesn't function outside Chromium.<sup>[1]</sup> A portable import/export fallback isn't a secondary path here; for a meaningful share of the audience, it's the only path that exists at all.

## What Breaks First

- Assuming a handle stays valid forever, when permission can be revoked and files can move or be deleted entirely outside the app's awareness.
- No strategy for a denied or revoked permission, leaving a save action that silently fails with no explanation to the user.
- No fallback at all for non-supporting browsers, turning a Chromium-only feature into a hard wall for everyone else.

## Minimal Technical Blueprint

```javascript
async function openProjectFolder() {
  if (!('showDirectoryPicker' in window)) return renderImportExportFallback();

  const dirHandle = await window.showDirectoryPicker();
  const permission = await dirHandle.requestPermission({ mode: 'readwrite' });
  if (permission !== 'granted') return showPermissionDeniedState();

  loadProjectFrom(dirHandle);
}

async function saveFile(fileHandle, contents) {
  const permission = await fileHandle.queryPermission({ mode: 'readwrite' });
  if (permission !== 'granted') return promptReauthorization(); // never assume it's still valid
  const writable = await fileHandle.createWritable();
  await writable.write(contents);
  await writable.close();
}
```

1. Feature-detect early and branch the UX at that point, not deep inside a save function that assumes the API exists.
2. Keep permission state and save state explicit in the UI — a user should always know whether the app can currently write to disk.
3. Validate handle access before every critical write, never assuming a handle obtained minutes or hours ago is still valid.
4. Keep a portable import/export fallback path fully functional on its own, for both unsupported browsers and the moment a handle genuinely goes stale.

## Decision Summary

Use this for serious local-authoring workflows where in-place file editing is genuinely core to the product — a code editor, a design tool, anything that behaves like a desktop app.

Don't make baseline correctness depend on it — the Chromium-only ceiling here is real, and the fallback needs to be a complete experience, not an apology screen.

---

[1]: File System Access API Chromium-only availability, [Chrome for Developers](https://developer.chrome.com/docs/capabilities/web-apis/file-system-access).
