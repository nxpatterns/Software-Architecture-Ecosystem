# Use Case 02: Client-Side File Processing Pipelines

Everyone says, "just upload the file and process it on the server."
That works until bandwidth is expensive, privacy matters, or users upload 180 photos from a phone in bad hotel Wi-Fi.

This use case keeps a serious part of the pipeline inside the browser:
read file, inspect metadata, transform preview assets, optionally compress, then upload smartly.

No magic.
Just using browser capabilities most teams ignore until cloud bills start screaming.

## Why this is a proper "hard topic"

Because file handling is not one feature.
It is ten features pretending to be one button.

"Choose file" looks tiny in UI.
Behind it lives memory pressure, decode latency, EXIF chaos, MIME lies, mobile camera weirdness, and browser-specific behavior that can ruin your sprint.

## User Story (Abstracted)

A user can:

- select one or many files,
- preview basic content,
- read relevant properties,
- apply lightweight client-side processing,
- and upload only what is needed.

Could be images, PDFs, audio snippets, short videos, CAD exports.
Same architectural pattern.
Different pain flavors.

## Core Browser Technologies

- `File API`: access user-selected file objects.
- `Blob` and `ArrayBuffer`: binary handling without server roundtrip.
- `URL.createObjectURL`: fast local preview streams.
- `FileReader` (fallback) and stream-based reads: file content access patterns.
- `Canvas API` and `OffscreenCanvas` (where supported): resize, crop, pixel-level operations.
- `ImageBitmap` / `createImageBitmap`: async decode path for responsive previews.
- `Web Workers`: move CPU-heavy transforms off the main thread.
- `WebAssembly` (optional): high-performance codecs or specialized transforms.
- `Fetch` + `FormData` or chunked upload protocol: upload transport.
- `AbortController`: cancel uploads and long-running client work.

## Browser Reality Check

### Desktop

- Chromium: broad support, usually fastest path for complex pipelines.
- Firefox: generally good, but some performance profiles differ from Chromium assumptions.
- Safari (macOS): capable, but stricter with memory and occasional API edge behavior.

### Mobile

- Android Chromium: often acceptable for moderate image workloads.
- iOS Safari / WebKit: practical limit arrives earlier.
  - Memory pressure can terminate work unexpectedly.
  - Large canvas operations can fail silently or degrade brutally.
  - Background tab behavior can interrupt long-running flows.

Short version:
Your laptop demo proves the idea.
Your phone test proves reality.

## What Usually Breaks First

- Trusting file extension instead of validating MIME and magic bytes.
- Decoding full-resolution images when thumbnails would do.
- Running compression loops on the main thread and freezing the UI.
- Forgetting EXIF orientation, then shipping rotated previews.
- Treating iOS memory limits as a "rare corner case".
- Assuming one upload request is enough for big files on unstable networks.

The browser did not fail you.
You asked it to do forklift work with a bicycle.

## Minimal Technical Blueprint

1. Accept files and perform early validation:
   - extension,
   - MIME type,
   - size boundaries,
   - signature checks for critical formats.
2. Build lightweight preview objects using object URLs.
3. Extract only required metadata (dimensions, duration, orientation, hash).
4. Route heavy processing to a worker:
   - resize,
   - compression,
   - format conversion where feasible.
5. Keep UI responsive with progress states and cancel controls.
6. Decide upload strategy by file profile:
   - direct upload for small assets,
   - chunked/resumable upload for larger assets.
7. Attach integrity metadata (hash, byte length, client transform profile).
8. Revoke object URLs and release buffers aggressively to avoid memory leaks.

## Compatibility Strategy (Pragmatic)

- Baseline mode (all modern browsers):
  - file select,
  - simple preview,
  - metadata display,
  - direct upload.
- Enhanced mode (supporting browsers):
  - worker-based transforms,
  - advanced compression,
  - chunked/resumable upload,
  - richer progress telemetry.

No drama, no purity tests.
Progressive enhancement wins again.

## Security and Compliance Notes

- Treat client-side validation as convenience, not trust boundary.
- Re-validate everything on server ingress.
- Strip sensitive metadata when policy requires it.
- Avoid persisting raw files in browser storage unless strictly necessary.
- If local persistence is used, define retention and explicit purge behavior.

"Processed in browser" is not a security model.
It is an optimization strategy.

## Test Matrix You Actually Need

- Chrome, Firefox, Safari on desktop with mixed file sets.
- iOS Safari on real devices with large photos from actual camera rolls.
- Android devices with low-memory profiles.
- Corrupt or mislabeled files (wrong extension, broken headers).
- Slow network and interrupted upload scenarios.
- Multi-file batch tests with cancellation and retry actions.

If you only test clean JPEGs on fast Wi-Fi, congratulations, you tested marketing.

## Decision Summary

Use this pattern when:

- upload latency and bandwidth cost matter,
- privacy benefits from local preprocessing,
- user experience depends on immediate preview and feedback.

Avoid this pattern when:

- client devices are too constrained for required transforms,
- compliance forbids local processing/persistence,
- project cannot support proper cross-browser QA depth.

Because yes, browsers can do a lot.
But they still have physics, quotas, and product managers named Safari.

## Next Logical Topic

After this, the best follow-up is:
**Clipboard workflows beyond plain text**
(binary clipboard, permission models, secure-context constraints, and fallback design).
That rabbit hole is smaller than file processing, but far more politically sensitive in enterprise security reviews.
