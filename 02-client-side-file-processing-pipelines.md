# Use Case 02: Client-Side File Processing Pipelines in the Browser

Most teams treat file upload as "pick a file, POST it, hope for the best."
That works until the file is a 20-megapixel phone photo, the network drops
mid-transfer, or someone needs the colors extracted before the bytes ever
touch a server.

This use case covers the browser doing real work on a file before (or
instead of) shipping it anywhere: resizing, filtering, hashing, compressing,
chunking, and resuming. No native app. No plugin. Just the platform.

## Why this is a good next "hard topic"

Because "just use `<input type="file">`" is true for the easy 10% and
completely useless for the other 90%. The moment you touch pixels, chunks,
or resumability, you are stacking four or five browser APIs that were each
designed by a different team, at a different time, with different opinions
about memory, threading, and what Safari should be allowed to do.

## User Story (Abstracted)

A user can:

- select or drag-and-drop a file (image, video, document — doesn't matter),
- have the browser inspect and transform it locally (resize, crop, extract
  colors, strip metadata, compress),
- start uploading it in the background,
- lose connectivity or switch tabs/apps,
- come back later,
- and have the upload resume instead of restarting from zero.

We do not care which file type. Could be a product photo, an inspection
image, a video clip, a PDF. Same pipeline shape.

## Core Browser Technologies

- `File` / `Blob` / `FileReader` / `Blob.slice()`: read and chunk the raw
  bytes without loading everything as a string.
- `Canvas` 2D / `OffscreenCanvas`: pixel-level work — resize, crop, filter,
  color extraction, watermarking.
- `Web Workers`: move CPU-heavy transforms and hashing off the main thread.
- `Streams API` (`ReadableStream`/`WritableStream`): process data as it
  flows instead of buffering the whole file in memory.
- `CompressionStream` / `DecompressionStream`: gzip/deflate a payload
  client-side before upload.
- `Web Crypto API` (`SubtleCrypto.digest`): checksum each chunk for
  integrity checks and deduplication.
- `fetch()` with chunked/multipart requests (or a resumable-upload protocol
  such as [tus](https://tus.io/protocols/resumable-upload)) for the actual
  transfer.
- `IndexedDB`: persist upload/processing progress across reloads and tab
  closures.
- `File System Access API` (optional, Chromium-only): handle very large
  files without holding them entirely in memory.

## Browser Reality Check

### Desktop

- Chromium (Chrome, Edge, Arc): full toolkit — File System Access API,
  OffscreenCanvas in Workers, CompressionStream, all solid.
- Firefox: strong on Blob/Streams/Canvas/CompressionStream, but no File
  System Access API — Firefox and Safari expose the sandboxed Origin
  Private File System (OPFS) instead of real file-picker read/write access
  ([testmuai.com](https://www.testmuai.com/learning-hub/file-system-access-api-browser-support/), [MDN](https://developer.mozilla.org/en-US/docs/Web/API/File_System_API)).
- Safari (macOS): `CompressionStream` has been supported since Safari 16.4
  ([caniuse](https://caniuse.com/mdn-api_compressionstream)), but Canvas
  still lacks `ctx.filter` and has the same size ceilings as its iOS
  sibling — treat macOS Safari like "iOS Safari's calmer cousin," not like
  Chrome.

### Mobile

- Android Chromium: comparable to desktop Chromium; watch memory pressure
  on low-end devices when processing large images in a Worker.
- iOS Safari / WebKit-based browsers (all iOS browsers use WebKit): the
  hard part again.
  - Canvas area is hard-capped around 16.7 million pixels (roughly
    4096×4096) — a modern phone photo will exceed this and must be
    downscaled before it ever touches a canvas
    ([lionpuro.com](https://lionpuro.com/posts/canvas-is-finally-usable-on-safari)).
  - No File System Access API at all — you're always working with in-memory
    Blobs.
  - Backgrounding the tab (switching apps, locking the phone) can suspend
    or kill an in-progress upload; there is no guaranteed background
    completion the way Background Sync promises on Chromium.

Short version: desktop gives you memory headroom and real file access.
iOS gives you a hard pixel ceiling and zero guarantees once you leave the
foreground.

## What Usually Breaks First

- Loading a full-resolution camera photo straight into a canvas without
  checking its pixel count first (silent crash on iOS Safari).
- Assuming `ctx.filter` works everywhere — it does not exist in Safari at
  all ([MDN](https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/filter)).
- Assuming `canvas.toBlob('image/webp')` actually returns WebP — on iOS it
  can silently fall back to PNG ([Stack Overflow](https://stackoverflow.com/questions/79186306/canvas-todataurl-with-webp-not-working-on-ipad-chrome-and-safari)).
- Assuming a paused upload resumes itself with no extra engineering.
- Doing hashing/compression/resizing on the main thread and wondering why
  the UI freezes for three seconds on a mid-range Android phone.
- Assuming File System Access API is available anywhere outside Chromium
  ([caniuse](https://caniuse.com/native-filesystem-api)).

## Minimal Technical Blueprint

1. Accept the file via input or drag-and-drop; keep it as a `Blob`, never
   read it fully into a string unless you must.
2. Probe dimensions/type before touching canvas; downscale if it exceeds a
   safe pixel budget (cap long edge or total pixels, with iOS's ~16.7M
   pixel ceiling as your worst case).
3. Move heavy work (resize, filters, hashing, compression) into a Worker,
   using `OffscreenCanvas` where supported; fall back to main-thread canvas
   where it isn't (Safari < 16.4).
4. Slice large files with `Blob.slice()` into fixed-size chunks.
5. Hash each chunk with `SubtleCrypto.digest` for integrity and
   deduplication.
6. Upload chunks with bounded concurrency via `fetch`, tracking per-chunk
   status in IndexedDB.
7. On failure or reconnect, resume from the last acknowledged chunk instead
   of restarting the whole file.
8. Server reassembles chunks and confirms the final checksum.

## Compatibility Strategy (Pragmatic)

- Baseline (all modern browsers): main-thread canvas processing, single
  request upload with a progress bar, manual retry button. `CompressionStream`
  is now safe to treat as baseline too — it's Baseline "Widely Available" as
  of late 2025 ([web-features-explorer](https://web-platform-dx.github.io/web-features-explorer/features/compression-streams/)).
- Enhanced (Chromium, and Firefox/Safari where noted): Worker +
  `OffscreenCanvas` processing, chunked resumable upload, File System
  Access API for very large files (Chromium only).

This is progressive enhancement, not wishful thinking.

## Security and Compliance Notes

- Never trust the client-reported MIME type; re-validate (magic bytes,
  re-encode) server-side.
- Strip EXIF/GPS metadata client-side before upload if privacy requires it
  — or make stripping an explicit, visible user choice.
- Treat client-side size/dimension checks as UX only; the server must
  re-enforce every limit.

Client-side processing without server-side re-validation is just a future
incident report with extra steps.

## Test Matrix You Actually Need

- Desktop Chrome/Edge with a real 20+ MP test photo.
- Firefox latest with the same photo.
- Safari macOS latest — verify the `ctx.filter` fallback path actually
  fires.
- iOS Safari on a real device with a photo taken directly on that device
  (not a pre-shrunk stock image).
- Forced network interruption mid-chunk-upload, then reconnect.
- Low-memory / many-background-tabs scenario on a mid-range Android phone.

If your iOS test used a pre-shrunk image instead of a native camera photo,
your pixel-ceiling handling is untested.

## Decision Summary

Use this pattern when:

- users upload media from phones/cameras with unpredictable size,
- some transform (crop, color extraction, compression) should happen
  before the file reaches the server,
- uploads must survive flaky or interrupted connections.

Avoid this pattern when:

- files are always small and the network is reliable — a single `fetch`
  with a progress bar is enough,
- you can't budget for the Worker + resumable-upload engineering it
  actually takes.

Because yes, this is "just a file input." And no, it is not the naive
version.

## Next Logical Topic

After this, the best follow-up is:
**Clipboard and cross-app data exchange in the browser**
(text/image/file copy-paste, permission prompts, and why
`navigator.clipboard.write()` is never "just one line of code").
