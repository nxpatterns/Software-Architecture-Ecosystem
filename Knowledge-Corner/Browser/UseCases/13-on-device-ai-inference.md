# Use Case 13: On-Device AI Inference in the Browser

Most teams hear “AI feature” and immediately add an API endpoint.
Then the image, text, audio, or document takes a small international trip before
the user gets a result.

This use case does the work in the browser instead.
The model runs on the user's CPU, GPU, or NPU. No inference request. No queue.
Just a model bundle, local compute, and the usual amount of browser reality.

## Why this is a good next "hard topic"

Because a local model demo is easy. A local model that loads once, stays
responsive, works on Safari and Firefox, and does not melt a phone is not.

## User Story (Abstracted)

A user can:

- open a web page,
- provide an image, text prompt, audio clip, or local document,
- run classification, extraction, embedding, or small-model generation,
- receive a result without sending the input to an inference service,
- keep using the page while inference is running,
- lose connectivity after the model is available,
- and run the same task again without another server round-trip.

We do not care which model task.
Could be image classification, semantic search, OCR post-processing, moderation,
or a small language model. Same execution shape.

## Core Browser Technologies

- `WebGPU`: GPU compute fast path for suitably supported devices and models.
- `WebNN` (where available): browser API for hardware-accelerated neural-network graphs, potentially using CPU, GPU, or NPU backends.
- `WebAssembly` / `WASM SIMD`: portable CPU execution path for the model runtime.
- `ONNX Runtime Web` or `transformers.js`: model runtime and execution-provider layer instead of hand-writing kernels for a Tuesday afternoon.
- `Web Workers`: run model initialization, pre-processing, and inference away from the UI thread.
- `OffscreenCanvas` (optional): resize and normalize image input in a Worker.
- `Cache Storage` / `IndexedDB`: cache model files, tokenizer assets, and an explicit model-version manifest.
- `Fetch` / `Streams API`: download model artifacts with progress and integrity checks before first use.
- `Web Crypto API`: verify a pinned model digest and protect any local metadata you actually need to retain.
- `Cross-Origin Isolation` (optional): enable the `SharedArrayBuffer` path used by threaded WASM runtimes.

## Browser Reality Check

### Desktop

- Chromium (Chrome, Edge, Arc): the broadest WebGPU path: Windows, macOS, and
  ChromeOS have support, with Android available on Android 12+ Qualcomm/ARM
  devices; Linux coverage is still expanding ([web.dev](https://web.dev/blog/webgpu-supported-major-browsers)).
  WebNN remains Chromium-oriented and requires an enablement flag in ONNX
  Runtime's documented setup ([ONNX Runtime Web](https://onnxruntime.ai/docs/get-started/with-javascript/web.html)).
- Firefox: WebGPU is stable on Windows and on Apple-silicon Macs running macOS
  Tahoe 26, but Linux, Android, and Intel Mac support remain gaps
  ([web.dev](https://web.dev/blog/webgpu-supported-major-browsers)).
- Safari (macOS): WebGPU is available only on macOS Tahoe 26; older supported
  Safari installations still need the CPU path ([web.dev](https://web.dev/blog/webgpu-supported-major-browsers)).

### Mobile

- Android Chromium: WebGPU can be the enhanced path on Android 12+ hardware
  with Qualcomm/ARM GPUs; do not confuse “Android” with one performance class
  ([web.dev](https://web.dev/blog/webgpu-supported-major-browsers)).
- iOS Safari / WebKit-based browsers: WebGPU needs iOS 26, so WASM remains the
  product path for the long tail of devices ([web.dev](https://web.dev/blog/webgpu-supported-major-browsers)).
  - Memory pressure is still yours.
  - A “small” language model is small only until it lands on a phone.

Short version: Chromium gets the GPU demo.
WASM gets the users.

## What Usually Breaks First

- Assuming `navigator.gpu` means the target model and every operator will work.
- Shipping only WebGPU because the team tested one recent Chrome laptop.
- Doing tokenization, image decode, and inference on the main thread.
- Downloading a 300 MB model before showing a useful loading state.
- Using float32 everywhere, then acting surprised by memory pressure.
- Forgetting that non-WASM execution providers support only a subset of ONNX
  operators ([ONNX Runtime Web](https://onnxruntime.ai/docs/tutorials/web/)).
- Treating a cached model as immutable when the tokenizer and preprocessing
  code have already changed underneath it.

“The demo was fast” is not a performance budget.

## Minimal Technical Blueprint

1. Pick one bounded task first: a classifier, embedding model, or deliberately
   small instruction model. State the input and output size limits in code.
2. Export or choose a browser-ready model; quantize it (`q8` or `q4` where
   quality permits) and publish model, tokenizer, and manifest as one version.
3. Serve the artifacts over HTTPS. WebGPU itself is restricted to secure
   contexts ([MDN](https://developer.mozilla.org/en-US/docs/Web/API/WebGPU_API)).
4. At startup, feature-detect `navigator.gpu` and attempt a real adapter and
   device request. Presence is not a benchmark.
5. Select an execution provider in order: WebGPU, WebNN if deliberately
   enabled and tested, then WASM. Keep the same application-level model API.
6. Create a dedicated Worker; load the runtime and model there, then pass
   transferable input buffers and structured results across `postMessage`.
7. Pre-process image/audio/text in the Worker, run inference, and emit progress,
   cancellation, timing, and a bounded result payload.
8. Cache verified artifacts with their manifest version. Delete obsolete
   versions rather than building a private model museum in IndexedDB.
9. Record local telemetry only after consent: selected backend, cold/warm load,
   inference duration, errors, and model version. Never log the input by
   accident.

## Compatibility Strategy (Pragmatic)

- Baseline mode (all modern browsers):
  - WASM runtime in a Worker,
  - quantized small model,
  - progress UI, cancellation, and an explicit “model unavailable” state,
  - no dependency on GPU, NPU, or cross-origin isolation.
- Enhanced mode (supporting browsers):
  - WebGPU execution provider,
  - GPU-resident tensors for chained work where the runtime supports it,
  - threaded WASM only when isolation headers and the device justify it,
  - WebNN only as a separately tested experiment, not a magic accelerator.

Transformers.js follows the same basic split: browser CPU execution uses WASM by
default, with WebGPU selected explicitly for supported environments
([Transformers.js](https://huggingface.co/docs/transformers.js/en/index)).

## Security and Compliance Notes

- Local inference keeps the raw input out of a remote inference request, which
  is useful for private images, text, and documents
  ([W3C WebNN specification](https://www.w3.org/TR/webnn/)).
- “Local” does not mean “safe by vibes.” Model files are executable-adjacent
  supply-chain inputs; pin versions, verify hashes, and control their origin.
- Explain the first-download size before starting it, especially on mobile data.
- Treat cached inputs, thumbnails, prompts, and embeddings as user data. Retain
  only what the feature genuinely needs and provide a clear-data control.
- If result telemetry leaves the device, document it separately from inference.
  Privacy claims enjoy that distinction.

## Test Matrix You Actually Need

- Desktop Chrome/Edge with WebGPU enabled and a GPU driver old enough to be
  annoying.
- Firefox latest: verify the complete WASM path, not a flag-enabled developer
  setup.
- Safari macOS latest: verify WASM load, Worker messaging, cancellation, and
  memory recovery after repeated runs.
- Android Chrome on one capable phone and one mid-range phone.
- iOS Safari on a real device with cold cache, warm cache, low-power mode, and
  a background/return cycle.
- Offline after the model is cached, including a reload.
- Slow first download, corrupted artifact, unsupported operator, Worker crash,
  and a user pressing Cancel halfway through.

If the fallback only appears in a test plan, it is not a fallback.

## Decision Summary

Use this pattern when:

- the task is bounded enough for a browser-sized, browser-speed model,
- raw input should stay on the device,
- offline or low-latency interaction matters,
- the product can accept device-dependent performance.

Avoid this pattern when:

- the model requires server-class memory or long generation windows,
- the result must be identical across every device,
- you cannot budget for model packaging, fallback testing, and cache lifecycle
  engineering.

Because yes, the browser can run the model.
No, that does not make every laptop an inference appliance.

## Next Logical Topic

After this, the best follow-up is:
**Private local semantic search in the browser**
(embeddings, vector indexes, offline document retrieval, and the moment a
“small” index becomes another memory budget).
