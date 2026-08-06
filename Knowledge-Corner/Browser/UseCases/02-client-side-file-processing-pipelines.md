# Use Case 02: Client-Side File Processing Pipelines

"Just upload the file and process it on the server" is the correct answer right up until someone uploads 180 photos from a phone, on hotel Wi-Fi, in a country where bandwidth is billed by the megabyte and patience is billed by the minute.

This use case moves a serious chunk of that pipeline into the browser: read the file, inspect it, build a preview, transform it, then upload only what's actually needed. Not because client-side is fashionable. Because your cloud bill and your user's patience are both finite resources, and the browser has been able to do this work for a decade — most teams just never opened that drawer.

## Why "Choose File" Is a Trap

The button is one line of HTML. Behind it: memory pressure, decode latency, EXIF orientation chaos, MIME types that lie about their own contents, mobile camera output that doesn't behave like desktop uploads, and per-browser quirks that show up two sprints after the demo shipped clean.

File handling isn't one feature. It's ten features that agreed to share a button.

## The User Story, Stripped of Domain

- select one file or many,
- see a preview before anything leaves the device,
- read the properties that matter (dimensions, duration, orientation, a hash),
- apply lightweight transforms locally,
- upload only what's needed, not the 24-megapixel original nobody asked for.

Images, PDFs, short audio, short video, CAD exports — same skeleton, different pain. The room's PMs should read this as "we stop paying to transfer and store data nobody looks at at full resolution." The room's specialists should read the next section.

## Core Browser Technologies

| API | Job | Reference |
|---|---|---|
| [File API](https://developer.mozilla.org/en-US/docs/Web/API/File_API) | Access to user-selected file objects | MDN |
| [Blob](https://developer.mozilla.org/en-US/docs/Web/API/Blob) / [ArrayBuffer](https://developer.mozilla.org/en-US/docs/Web/API/ArrayBuffer) | Binary handling with zero server round-trips | MDN |
| [`URL.createObjectURL`](https://developer.mozilla.org/en-US/docs/Web/API/URL/createObjectURL_static) | Instant local preview streams | MDN |
| [`createImageBitmap`](https://developer.mozilla.org/en-US/docs/Web/API/createImageBitmap) | Async, off-main-thread-friendly image decode | MDN |
| [OffscreenCanvas](https://developer.mozilla.org/en-US/docs/Web/API/OffscreenCanvas) | Resize/crop/pixel work inside a worker, no DOM attached | Baseline: widely available since March 2023, [MDN](https://developer.mozilla.org/en-US/docs/Web/API/OffscreenCanvas) |
| [Web Workers](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API) | Get CPU-heavy transforms off the thread your UI lives on | MDN |
| WebAssembly (optional) | High-performance codecs, specialized transforms | See Use Case on WASM |
| [Fetch](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API) + [FormData](https://developer.mozilla.org/en-US/docs/Web/API/FormData) or chunked/resumable transport | Getting the result back to the server without betting the whole file on one unstable connection | MDN |
| [AbortController](https://developer.mozilla.org/en-US/docs/Web/API/AbortController) | Cancel uploads and long transforms cleanly | MDN |

OffscreenCanvas earns its own footnote: it reached Baseline "widely available" status in 2023, meaning every major engine has shipped it for years now.<sup>[1]</sup> If your codebase still has a comment reading "OffscreenCanvas — check support first," that comment is older than the problem it's guarding against.

## Browser Reality Check

**Desktop:** Chromium is usually your fastest path for complex pipelines. Firefox is generally solid, with performance characteristics that don't always match Chromium's assumptions — profile before you optimize for the wrong engine. Safari macOS is capable but stricter about memory, and it will surface edge-case behavior you didn't budget time for.

**Mobile:** Android Chromium handles moderate image workloads acceptably. iOS Safari — and everything on iOS, since it's all WebKit under the hood — is where the ceiling shows up early. Memory pressure kills work without asking permission first. Large canvas operations degrade silently instead of throwing a helpful error. Background-tab behavior interrupts long-running flows exactly when you least expect a phone user to have switched apps, which is to say: constantly.

Your laptop demo proves the concept works. Your phone test proves whether it survives contact with reality.

## What Breaks First

- Trusting the file extension instead of validating MIME type and magic bytes. A `.jpg` is a promise, not a fact.
- Decoding a 24-megapixel original when a 400px thumbnail is all the UI will ever show.
- Running compression on the main thread and watching the UI freeze mid-interaction.
- Forgetting EXIF orientation, then shipping a preview grid full of sideways portraits.
- Treating iOS memory limits as a rare corner case. It's not rare. It's Tuesday.
- Assuming a single upload request survives an unstable connection for a large file.

The browser didn't fail you. You asked a bicycle to do forklift work and were surprised when it complained.

## Minimal Technical Blueprint

```javascript
// Off the main thread. Resize happens here, not in the UI's critical path.
self.onmessage = async (e) => {
  const { file, targetWidth } = e.data;
  const bitmap = await createImageBitmap(file, {
    resizeWidth: targetWidth,
    resizeQuality: 'medium',
  });

  const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
  const ctx = canvas.getContext('2d');
  ctx.drawImage(bitmap, 0, 0);
  bitmap.close(); // release decoded pixels immediately, iOS will thank you

  const blob = await canvas.convertToBlob({ type: 'image/webp', quality: 0.8 });
  self.postMessage({ blob }, [blob]); // transfer, don't copy
};
```

1. Validate on arrival: extension, MIME type, size boundary, and — for anything that matters — a signature check on the actual bytes, not the label the OS gave the file.
2. Build the preview from an object URL. Cheap, fast, revocable.
3. Extract only the metadata you actually need. Dimensions, duration, orientation, a content hash. Not "everything EXIF has ever recorded, just in case."
4. Push heavy work into a worker: resize, compress, convert format where feasible. The main thread's only job is staying responsive.
5. Keep the user informed: progress states, a real cancel button wired to `AbortController`, not a spinner that lies.
6. Pick the upload strategy by file profile — small assets go direct, large ones go chunked and resumable. One giant `fetch` for a 200MB video on mobile data is optimism, not engineering.
7. Attach integrity metadata — hash, byte length, the transform profile applied client-side — so the server can verify what it actually received.
8. Revoke object URLs and release buffers aggressively. `bitmap.close()` above isn't decoration; skip it and watch memory climb on a long batch job.

## Compatibility Strategy

**Baseline:** file select, simple preview, metadata display, direct upload. Works everywhere, no asterisks.

**Enhanced:** worker-based transforms, real compression, chunked/resumable upload, progress telemetry with actual granularity.

No purity tests, no browser holy wars. Progressive enhancement, same as every other use case in this deck — you'll notice the pattern repeats because it's the pattern that survives contact with five different rendering engines.

## Security and Compliance

Client-side validation is a courtesy to the user, not a trust boundary for your server. Re-validate everything on ingress — extension, MIME, magic bytes, size — as if the client-side checks never ran, because for a motivated attacker, they didn't.

Strip sensitive metadata (GPS coordinates buried in EXIF is the classic one) when policy requires it — before the file leaves the device, not after someone in a data-protection review asks why it's still there. Avoid persisting raw files in browser storage unless there's a real reason. If you do persist them, define retention and an actual purge job, not a TODO comment.

"Processed in the browser" is an optimization strategy. It is not a security model, and nobody in the compliance seats will let you conflate the two.

## Test Matrix You Actually Need

- Chrome, Firefox, Safari desktop, with a genuinely mixed file set — not five clean JPEGs of the same cat.
- iOS Safari on a real device, with real photos from a real camera roll, not a curated test asset folder.
- Android on a low-memory device profile.
- Corrupt and mislabeled files — wrong extension, broken headers, the stuff users actually upload.
- Slow-network and interrupted-upload scenarios, deliberately triggered.
- Multi-file batch runs with cancel and retry exercised mid-flight.

Test only clean JPEGs on fast Wi-Fi and you've tested the marketing screenshot, not the product.

## Decision Summary

Use this when upload latency and bandwidth cost actually matter, when local preprocessing gives you a genuine privacy story, or when the user experience depends on an instant preview rather than a spinner and a prayer.

Skip it when client devices are too constrained for the required transforms, when compliance forbids local processing or persistence outright, or when the team can't fund cross-browser QA at the depth this table just implied. Half of this pipeline, shipped in a hurry, is a worse outcome than a plain server-side upload — a broken preview and a phantom memory leak are not an improvement on boring and reliable.

Browsers can do a lot. They still answer to physics, storage quotas, and a product manager named Safari who was never consulted on your roadmap.

---

[1]: OffscreenCanvas Baseline status, [MDN Web Docs](https://developer.mozilla.org/en-US/docs/Web/API/OffscreenCanvas) — widely available across Chrome, Edge, Firefox, and Safari (macOS and iOS) since 2023.
