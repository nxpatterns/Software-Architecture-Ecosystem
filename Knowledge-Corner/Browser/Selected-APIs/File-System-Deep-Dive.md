# The File System APIs, Properly This Time

Four names, one confusing family tree, and a graveyard entry nobody bothered to remove. Let's sort out who's related to whom.

- **File / Blob / FileReader** — the ancient one. Reads what the user hands you. Can't touch disk on its own.
- **File and Directory Entries API** — Chrome's 2010-era side quest. Deprecated, still runs in every browser, refuses to die.
- **File System Access API** — the grown-up version. Pickers, permissions, real read/write to the user's disk.
- **Origin Private File System (OPFS)** — the part of that same spec that doesn't ask permission, because it never leaves your sandbox.

They share a type hierarchy and a naming committee's sense of humor. That's it. Get the differences wrong and you'll ship a feature that works in Chrome and quietly does nothing in Safari.[^naming]

[^naming]: `FileSystemFileEntry` (2010, deprecated), `FileSystemFileHandle` (2019, current). One letter of difference, completely different object. Whoever approved that naming meeting owes the web platform an apology.

---

## 1. File, Blob, FileReader — the foundation everyone actually uses

This is the one API in this family that just works, everywhere, since forever. `Blob` is immutable binary data with a size and a MIME type. `File` is a `Blob` with a name and a timestamp bolted on. You get `File` objects from `<input type="file">` or drag-and-drop, and from that point on you're holding a `Blob` with a résumé.

```javascript
const file = document.querySelector('input[type="file"]').files[0];
// file.name, file.size, file.type, file.lastModified — all free
```

### Reading it: skip FileReader unless you need what it uniquely offers

For a decade `FileReader` was the only way to get bytes out of a `Blob`. Event-based, slightly clunky, works everywhere:

```javascript
const reader = new FileReader();
reader.onload = () => console.log(reader.result);
reader.readAsText(file);
```

Then `Blob` grew promise-based methods that do the same job without the event boilerplate:

```javascript
const text = await file.text();
const buffer = await file.arrayBuffer();
const stream = file.stream(); // ReadableStream, for genuinely large files
const bytes = await file.bytes(); // Uint8Array directly, no ArrayBuffer detour
```

`text()`, `arrayBuffer()`, and `stream()` have been safe to use everywhere for years. `bytes()` is the new one — shipped in Chrome and Firefox, landed in Safari more recently, so check before relying on it in anything Safari-sensitive.

So when do you still reach for `FileReader`? Two situations, and only two:

1. **`readAsDataURL()`** — nobody moved this convenience onto `Blob` itself. Still the shortest path to a base64 data URL for an `<img src>` preview.
2. **`FileReaderSync`, inside a Web Worker** — blocking reads are illegal on the main thread but perfectly legal in a worker, and sometimes a blocking read is exactly what a worker-based pipeline wants.

Everything else — `FileReader` is legacy plumbing you keep around out of habit, not necessity.

### Use case: client-side CSV preview before upload

```javascript
input.addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (file.size > 50_000_000) return alert('Too big, buddy.');
  const text = await file.text();
  renderPreviewTable(text.split('\n').slice(0, 20));
});
```

No server round-trip to reject a malformed file. The user finds out in milliseconds, not after a 30-second upload.

---

## 2. File and Directory Entries API — the one you inherit, never choose

Chrome shipped a proprietary filesystem API around 2010, before anyone had agreed on a standard. Standardization attempts stalled. Chrome's implementation stuck around anyway, other browsers reverse-engineered `webkitGetAsEntry()` for compatibility, and now it's a WICG "Draft Community Group Report" — documenting existing behavior, not defining new behavior. MDN's verdict is blunt: **non-standard, do not use in new code.**[^history]

[^history]: The full irony: it's prefixed `webkit`, but Firefox implements the exact same prefixed method today, because ripping it out would break the drag-and-drop-a-folder pattern half the web quietly depends on. Deprecated and load-bearing at the same time. Very web platform of it.

You'll meet this API in exactly one context: **reading a dropped folder from a drag-and-drop event.** `<input type="file" webkitdirectory>` and `DataTransferItem.webkitGetAsEntry()` are still, as of today, the only way to pull a whole directory tree out of a drop event without the File System Access API — and the File System Access API's picker methods don't exist in Firefox or Safari at all (more on that in a second).

```javascript
dropzone.addEventListener('drop', (e) => {
  e.preventDefault();
  for (const item of e.dataTransfer.items) {
    const entry = item.webkitGetAsEntry();
    if (entry?.isDirectory) walkDirectory(entry);
  }
});

function walkDirectory(dirEntry) {
  const reader = dirEntry.createReader();
  reader.readEntries((entries) => {
    // Chromium caps this at 100 entries per call — call again until it returns empty
    entries.forEach(entry => entry.isFile
      ? entry.file(f => console.log(f.name))
      : walkDirectory(entry));
  });
}
```

Note the 100-entry cap and the callback-pyramid API design. This is what "abandoned standardization in 2012, frozen in amber" looks like in practice.

**Migration path when you can:** `DataTransferItem.getAsFileSystemHandle()` returns a modern `FileSystemHandle` from the same drop event, in browsers that support the File System Access API. Feature-detect, prefer the modern handle, fall back to `webkitGetAsEntry()` only where you must.

Don't build new architecture on this API. Use it as the one bridge you need for folder-drop support, wrap it in a function, and never think about `FileSystemDirectoryReader` again.

---

## 3. File System Access API — real disk access, with the permission dialog to prove it

This is what most people mean when they say "the File System API" and then get surprised it doesn't work in Firefox. It grants a web page pickers for the user's actual disk — Desktop, Documents, wherever they navigate to — and read/write handles that persist across sessions.

```javascript
// Open
const [fileHandle] = await window.showOpenFilePicker();
const file = await fileHandle.getFile();
const text = await file.text();

// Save
const handle = await window.showSaveFilePicker({ suggestedName: 'notes.txt' });
const writable = await handle.createWritable();
await writable.write('Hello, disk.');
await writable.close();

// Whole directory
const dirHandle = await window.showDirectoryPicker();
for await (const [name, handle] of dirHandle.entries()) {
  console.log(name, handle.kind); // 'file' or 'directory'
}
```

### The support gap that will bite you if you skip it

`showOpenFilePicker`, `showSaveFilePicker`, `showDirectoryPicker` — **Chromium only.** Chrome, Edge, Opera. Firefox has published what Mozilla itself calls a "harmful" standards position on the picker methods specifically, and has no plans to implement them. Safari doesn't implement them either, on macOS or iOS.

Firefox and Safari both implement OPFS (section 4) just fine. It's specifically the local-disk pickers that are Chromium territory. Feature-detect, always:

```javascript
if ('showOpenFilePicker' in window) {
  // real thing
} else {
  // <input type="file"> fallback — works everywhere, no persistent handle though
}
```

### Permissions persist, which is the whole point and the whole risk

Grant access once, and the handle can be reused in future sessions without re-prompting — store the `FileSystemFileHandle` in IndexedDB (it's structured-cloneable) and check `queryPermission()` / `requestPermission()` on reuse. This is what lets a browser-based code editor reopen your project folder tomorrow without you re-granting access to every file. It's also exactly the kind of persistent access that deserves a deliberate UX moment, not a picker fired on page load.

### FileSystemObserver — the newest piece, and it's not standard yet

Watching a handle for external changes used to mean polling `lastModified` in a loop, which is exactly as bad as it sounds. `FileSystemObserver` fixes that:

```javascript
const observer = new FileSystemObserver((records) => {
  for (const record of records) console.log(record.type, record.changedHandle);
});
await observer.observe(dirHandle);
```

Status: Chrome only, still marked experimental and non-standard on MDN, works for both the local disk and OPFS. Worth knowing about, not yet worth depending on for anything shipping broadly.

### Use case: a browser-based Markdown editor with real save-to-disk

Open a `.md` file via picker, edit it, hit Ctrl+S, write straight back through the same handle — no download-folder round-trip, no "Save As" dialog every single time. This is the feature that makes web apps feel like desktop apps, and it's the single biggest practical reason this API exists.

---

## 4. Origin Private File System (OPFS) — the fast, invisible one

Same spec family as the File System Access API, completely different deal: OPFS is a private, sandboxed filesystem per origin. The user never sees it, never grants permission for it, can't browse it. It disappears if they clear site data. In exchange for giving up visibility, you get speed the other two APIs can't touch.

```javascript
const opfsRoot = await navigator.storage.getDirectory();
const fileHandle = await opfsRoot.getFileHandle('data.db', { create: true });
```

That much runs on the main thread. The part that makes OPFS genuinely fast — `createSyncAccessHandle()` and its synchronous `read()`/`write()` — is **worker-only.** Not available on the main thread, not in an iframe, not even in a `SharedWorker`. Only a dedicated Web Worker gets the synchronous, in-place, byte-level access:

```javascript
// Inside a dedicated worker
const root = await navigator.storage.getDirectory();
const handle = await root.getFileHandle('db.sqlite', { create: true });
const accessHandle = await handle.createSyncAccessHandle();

const buffer = new Uint8Array(1024);
accessHandle.read(buffer, { at: 0 });
accessHandle.write(buffer, { at: 0 });
accessHandle.flush();
accessHandle.close();
```

That restriction isn't an oversight. Synchronous file I/O on the main thread would freeze the tab on every write. Pushing it into a worker is the tradeoff that makes "SQLite database running in the browser, 3-4x faster than IndexedDB for the same workload" a real, shipping thing rather than a benchmark footnote.[^rxdb]

[^rxdb]: This is not a hypothetical. RxDB, ElectricSQL, and LiveStore all run SQLite-on-OPFS in production as their local-first storage layer. If you're building offline-capable apps and you're still reaching for IndexedDB by default, it's worth checking whether OPFS-backed SQLite fits better — IndexedDB's per-operation serialization overhead is exactly the cost OPFS was built to avoid.

### Debugging it

There's no built-in DevTools panel for OPFS as of this writing. The community fix is the **OPFS Explorer** Chrome extension — shows you the file tree, lets you inspect and delete entries. Without it, you're debugging a filesystem you can't see, which is about as fun as it sounds.

### Use case: local-first apps that need a real database, not a key-value store

IndexedDB is fine for "store some objects." It's the wrong tool when you need actual SQL, transactions, and indexes over structured data that lives entirely client-side. SQLite compiled to WASM, backed by OPFS via a sync access handle in a worker, gives you that — a genuine embedded database, in the browser, with performance in the same ballpark as native.

---

## Deprecated, Current, Experimental — the one-glance version

| | Status | Where it works |
|---|---|---|
| File / Blob / FileReader | Stable, foundational | Everywhere |
| `Blob.bytes()` | New-ish addition | Chrome, Firefox, recent Safari — check before relying on it |
| File and Directory Entries API | **Deprecated / non-standard** | Everywhere, because nobody removed it |
| File System Access API (pickers) | Current standard track | **Chromium only** — no Firefox, no Safari |
| OPFS | Baseline widely available since March 2023 | All major engines, including Firefox and Safari |
| `FileSystemObserver` | **Experimental, non-standard** | Chrome only |

The one-line summary worth remembering: **OPFS is the part that's actually cross-browser. The disk-access pickers are the part that isn't.** Get those two backwards and you'll design a feature around the wrong assumption.

---

## Where this is going

The trajectory is unmistakable: browsers are quietly becoming an operating system for local-first software, and OPFS plus WASM is the foundation that makes it viable. SQLite-in-the-browser is already production reality, not a demo. `FileSystemObserver` is the last missing piece — real filesystem change notifications instead of polling — and once it standardizes and lands in Firefox and Safari, watching a project folder for external changes stops requiring a native app.

The pickers are the part that won't converge any time soon. Mozilla's rejection isn't a scheduling delay, it's a stated position. Design for a world where disk access stays Chromium-exclusive for the foreseeable future, and where OPFS is your one truly portable primitive for anything performance-sensitive that doesn't need to touch the user's actual files.
