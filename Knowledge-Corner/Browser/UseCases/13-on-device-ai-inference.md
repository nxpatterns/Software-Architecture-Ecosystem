# Use Case 13: On-Device AI Inference in the Browser

"AI feature" usually means adding an API endpoint, and then the image, text, or document takes a small international trip before the user gets an answer back.

This does the work in the browser instead. The model runs on the user's CPU, GPU, or NPU. No inference request, no queue — just a model bundle, local compute, and the usual amount of browser reality waiting underneath.

## Why the Demo Is Easy and the Product Isn't

A local model demo is trivial. A local model that loads once, stays responsive, works on Safari and Firefox, and doesn't melt a phone in someone's pocket — that's the actual project.

## The User Story, Stripped of Domain

- open a web page,
- provide an image, text prompt, audio clip, or local document,
- run classification, extraction, embedding, or small-model generation,
- get a result with no input ever sent to an inference service,
- keep using the page while inference runs,
- lose connectivity after the model is cached and keep going anyway,
- run the same task again with zero server round-trip.

Image classification, semantic search, OCR post-processing, a small language model — same execution shape underneath.

## Core Browser Technologies

| API | Job | Reference |
|---|---|---|
| WebGPU | GPU compute fast path on supported devices | [MDN](https://developer.mozilla.org/en-US/docs/Web/API/WebGPU_API) |
| WebNN (where available) | Hardware-accelerated neural-network graphs across CPU/GPU/NPU | [ONNX Runtime Web](https://onnxruntime.ai/docs/get-started/with-javascript/web.html) |
| WebAssembly / WASM SIMD | Portable CPU execution path — the one that actually reaches everyone | [WebAssembly (MDN)](https://developer.mozilla.org/en-US/docs/WebAssembly), [SIMD (MDN)](https://developer.mozilla.org/en-US/docs/WebAssembly/Reference/SIMD) |
| ONNX Runtime Web / transformers.js | Model runtime and execution-provider layer, instead of hand-writing kernels on a Tuesday afternoon | [Transformers.js](https://huggingface.co/docs/transformers.js/en/index) |
| Web Workers | Model init, preprocessing, inference — off the UI thread, always | [MDN](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API) |
| OffscreenCanvas (optional) | Resize/normalize image input inside a Worker | [MDN](https://developer.mozilla.org/en-US/docs/Web/API/OffscreenCanvas) |
| Cache Storage / IndexedDB | Model files, tokenizer assets, an explicit version manifest | [CacheStorage (MDN)](https://developer.mozilla.org/en-US/docs/Web/API/CacheStorage), [IndexedDB (MDN)](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API) |
| Web Crypto | Verify a pinned model digest before trusting it | [MDN](https://developer.mozilla.org/en-US/docs/Web/API/Web_Crypto_API) |
| Cross-Origin Isolation (optional) | Unlocks `SharedArrayBuffer` for threaded WASM runtimes | [MDN](https://developer.mozilla.org/en-US/docs/Web/API/Window/crossOriginIsolated) |

## The Browser Reality Check

Chromium gets the GPU demo. WASM gets the actual users.

Chromium has the broadest WebGPU path: Windows, macOS, ChromeOS supported, Android 12+ on Qualcomm/ARM devices, Linux coverage still expanding.<sup>[1]</sup> WebNN stays Chromium-oriented and needs an explicit enablement flag in ONNX Runtime's documented setup — not a default-on assumption.<sup>[2]</sup>

Firefox has stable WebGPU on Windows and on Apple-silicon Macs, but Linux, Android, and Intel Mac remain real gaps, not edge cases you can round to zero.<sup>[1]</sup> Safari's WebGPU support is tied to a specific recent macOS release — anything older still needs the CPU path, full stop.<sup>[1]</sup>

**iOS needs the same recent OS version for WebGPU, which means WASM stays the actual product path for the long tail of devices out there.**<sup>[1]</sup> Memory pressure is still entirely yours to manage. A "small" language model is small only until it lands on a phone that disagrees.

## What Breaks First

- Assuming `navigator.gpu` existing means the target model and every operator it needs will actually run.
- Shipping WebGPU-only because the team tested it on one recent Chrome laptop and called that coverage.
- Doing tokenization, image decode, and inference on the main thread and wondering why the UI stutters.
- Downloading a 300MB model before showing any useful loading state at all.
- Using float32 everywhere, then acting surprised by memory pressure that quantization would have avoided.
- Forgetting non-WASM execution providers support only a subset of ONNX operators — checking that subset is not optional.<sup>[3]</sup>
- Treating a cached model as immutable when the tokenizer or preprocessing code has quietly changed underneath it.

"The demo was fast" is not a performance budget.

## Minimal Technical Blueprint

```javascript
// Worker: pick the best available backend, keep one API surface above it
async function loadRuntime() {
  if (navigator.gpu && await tryWebGPUAdapter()) return 'webgpu';
  if (webnnEnabledAndTested()) return 'webnn';
  return 'wasm'; // the backend that actually reaches everyone
}

self.onmessage = async ({ data }) => {
  const backend = await loadRuntime();
  const result = await runInference(backend, data.input); // transferable buffers in, structured result out
  self.postMessage({ result, backend, durationMs: performance.now() - data.startedAt });
};
```

1. Pick one bounded task first — a classifier, an embedding model, a deliberately small instruction model. State input/output size limits in code, not in a comment.
2. Export or choose a browser-ready model, quantize it (`q8` or `q4` where quality allows), publish model, tokenizer, and manifest as one atomic version.
3. Serve everything over HTTPS — WebGPU itself is secure-context-restricted.
4. At startup, feature-detect `navigator.gpu` and attempt a *real* adapter and device request. Presence of the API is not a benchmark.
5. Select an execution provider in order: WebGPU, then WebNN if deliberately enabled and tested, then WASM. One application-level API on top, regardless of which backend actually runs.
6. Load the runtime and model inside a dedicated Worker; pass transferable buffers and structured results across `postMessage` — never raw tensors by copy.
7. Preprocess in the Worker, run inference, emit progress, cancellation, timing, and a bounded result payload.
8. Cache verified artifacts against their manifest version. Delete obsolete versions — don't build a private model museum inside IndexedDB nobody remembers to clean.
9. Log local telemetry only after consent: selected backend, cold/warm load time, duration, errors, model version. Never the input, not even by accident.

## Compatibility Strategy

**Baseline:** WASM runtime in a Worker, a quantized small model, progress UI, cancellation, an honest "model unavailable" state, zero dependency on GPU, NPU, or cross-origin isolation.

**Enhanced:** WebGPU execution provider, GPU-resident tensors for chained work where the runtime supports it, threaded WASM only when isolation headers and the device actually justify it, WebNN as a separately tested experiment — not a magic accelerator you flip on and forget about.

Transformers.js follows the same split by default: WASM on the CPU path, WebGPU only where explicitly selected and supported.<sup>[4]</sup>

## Security and Compliance

Local inference keeps raw input out of a remote request entirely — genuinely useful for private images, text, and documents.<sup>[5]</sup> "Local" does not mean "safe by vibes" — model files are executable-adjacent supply-chain inputs, so pin versions, verify hashes, control their origin like you would any other dependency that runs code.

Explain the first-download size before it starts, especially on mobile data — a silent 300MB download is the fastest way to burn trust before the feature even runs once. Treat cached inputs, thumbnails, prompts, and embeddings as user data: retain only what the feature genuinely needs, provide a real clear-data control. If any result telemetry leaves the device, document that separately from the inference story itself — privacy claims deserve that distinction, and reviewers will ask for it.

## Test Matrix You Actually Need

- Desktop Chrome/Edge with WebGPU enabled and a GPU driver old enough to be genuinely annoying.
- Firefox: the complete WASM path, not a flag-enabled developer setup that never ships.
- Safari macOS: WASM load, Worker messaging, cancellation, memory recovery across repeated runs.
- Android: one capable phone and one deliberately mid-range one.
- iOS real device: cold cache, warm cache, low-power mode, a background/return cycle.
- Fully offline after the model is cached, including a page reload.
- Slow first download, a corrupted artifact, an unsupported operator, a Worker crash, a user hitting Cancel halfway through.

If the fallback only appears in the test plan and never in the actual product, it isn't a fallback.

## Decision Summary

Use this when the task is bounded enough for a browser-sized, browser-speed model, when raw input genuinely should stay on-device, when offline or low-latency interaction matters, and when the product can accept device-dependent performance as a real design constraint rather than a bug to file.

Skip it when the model needs server-class memory or long generation windows, when the result must be bit-identical across every device, or when nobody's budgeting for model packaging, fallback testing, and cache lifecycle as ongoing engineering.

The browser can run the model. That doesn't make every laptop in the audience an inference appliance.

---

[1]: WebGPU support across Chromium, Firefox, and Safari, [web.dev](https://web.dev/blog/webgpu-supported-major-browsers).
[2]: WebNN Chromium-oriented status and setup, [ONNX Runtime Web](https://onnxruntime.ai/docs/get-started/with-javascript/web.html).
[3]: Execution-provider operator coverage, [ONNX Runtime Web tutorials](https://onnxruntime.ai/docs/tutorials/web/).
[4]: Transformers.js default WASM/WebGPU split, [Transformers.js docs](https://huggingface.co/docs/transformers.js/en/index).
[5]: On-device inference privacy rationale, [W3C WebNN specification](https://www.w3.org/TR/webnn/).
