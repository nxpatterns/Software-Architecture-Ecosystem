# Use Case 78: WebAssembly for Compute-Heavy Browser Workloads

Half the use cases in this deck lean on WebAssembly without ever naming it. Local full-text search (12), on-device AI inference (13), local encryption vaults (09) — all of it either runs on WASM directly or runs on a runtime (SQLite, ONNX Runtime Web, a codec library) compiled to it. This is the compute layer underneath the compute layer.

## Why the Foundation Deserves Its Own Slide

WebAssembly itself has been stable, fast, and broadly supported for years — that part is a solved problem. What isn't solved, and what every team discovers the hard way, is threading: real multi-threaded WASM needs `SharedArrayBuffer`, and `SharedArrayBuffer` needs cross-origin isolation, and cross-origin isolation needs two response headers that break any third-party embed, ad, or widget on the page the moment they're turned on.

## The User Story, Stripped of Domain

A user can:

- run genuinely heavy client-side computation — parsing, compression, a database engine, a codec — at close to native speed,
- do it without a server round-trip for every operation,
- keep the UI responsive while the heavy work happens, when the architecture actually isolates it correctly.

## Core Browser Technologies

| API / Concept | Job | Reference |
|---|---|---|
| WebAssembly core (`WebAssembly.instantiate`) | Loads and runs a compiled WASM module | [MDN – WebAssembly](https://developer.mozilla.org/en-US/docs/WebAssembly) |
| `SharedArrayBuffer` | Shared memory backing real WASM threads | [MDN – SharedArrayBuffer](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/SharedArrayBuffer) |
| Cross-Origin-Opener-Policy / Cross-Origin-Embedder-Policy | The two headers that unlock `SharedArrayBuffer` | [MDN – Cross-Origin Isolation](https://developer.mozilla.org/en-US/docs/Web/Security/Cross-origin_isolation_guide) |
| WASM SIMD | Vectorized operations for codec and numeric workloads | [MDN – WebAssembly SIMD](https://developer.mozilla.org/en-US/docs/WebAssembly/Guides/Concepts) |
| Web Workers | Keeps the WASM module's heavy work off the UI thread | [MDN – Web Workers API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API) |

## The Browser Reality Check

Core WebAssembly execution — the module loading, instantiation, and single-threaded execution model — is Baseline, broadly available across Chrome, Edge, Firefox, and Safari, and has been for years. This is not the risky part of the architecture.

The threading story is where reality bites. `SharedArrayBuffer` was actually disabled by default across major browsers for a period following the Spectre disclosures, and its return was conditioned specifically on cross-origin isolation — a page has to opt in with `Cross-Origin-Opener-Policy: same-origin` and `Cross-Origin-Embedder-Policy: require-corp` (or `credentialless`), and every cross-origin resource on that page then has to cooperate with those headers or silently fail to load.<sup>[1]</sup> This is precisely why a page that embeds a third-party ad, a payment widget, or an uncooperative analytics script often can't simply flip on cross-origin isolation without breaking something else first.

## What Breaks First

- Assuming threaded WASM "just works" the way single-threaded WASM does, without budgeting for the cross-origin isolation migration.
- Turning on the isolation headers and discovering a third-party embed silently stops loading, with no obvious error pointing at the actual cause.
- Loading a large WASM module with no streaming compilation, blocking the main thread on a multi-megabyte download-then-compile sequence.
- Running the WASM module directly on the main thread "for now," and never actually moving it to a Worker before shipping.

## Minimal Technical Blueprint

```javascript
// Streaming instantiation — compiles as bytes arrive, not after the full download
const { instance } = await WebAssembly.instantiateStreaming(
  fetch('module.wasm'),
  importObject
);

// Inside a Worker, if the module needs threads:
// requires COOP/COEP headers set on the document that spawned this worker
if (crossOriginIsolated) {
  const memory = new WebAssembly.Memory({ initial: 256, maximum: 512, shared: true });
}
```

1. Load WASM modules with `instantiateStreaming()` rather than fetching the full buffer first — compilation starts as bytes arrive.
2. Decide early whether the workload genuinely needs threads. Single-threaded WASM avoids the entire cross-origin isolation migration and is often fast enough.
3. If threading is required, audit every third-party resource on the page before turning on COOP/COEP — this is a compatibility project, not a header flip.
4. Always run WASM execution inside a Worker for anything non-trivial; the UI thread should never wait on a WASM call directly.
5. Version and cache compiled modules deliberately — recompiling a multi-megabyte module on every page load defeats much of the performance benefit.

## Compatibility Strategy

**Baseline:** single-threaded WASM, streamed instantiation, Worker-isolated execution. Works everywhere Baseline WebAssembly is supported — which is to say, everywhere that matters.

**Enhanced:** multi-threaded WASM behind full cross-origin isolation, adopted only where the third-party resource audit is complete and the performance gain justifies the migration cost.

## Security and Compliance

Treat a WASM module as executable code with the same supply-chain scrutiny as any other dependency — pin versions, verify build provenance, and don't load one from an unpinned third-party CDN. Cross-origin isolation is itself a security boundary (it's what re-enabled high-resolution timers and `SharedArrayBuffer` safely after Spectre); don't weaken it with `credentialless` or `unsafe-none` settings without understanding exactly what protection is being traded away.

## Decision Summary

Use WebAssembly when a workload is genuinely compute-bound and JavaScript's performance ceiling is the actual constraint — parsing, compression, a database engine, codec work.

Reach for threaded WASM only when single-threaded performance has actually been measured and found wanting — the cross-origin isolation migration is real engineering cost, and a large share of workloads never need it to hit their target performance.

---

[1]: Cross-origin isolation requirements for `SharedArrayBuffer`, [MDN](https://developer.mozilla.org/en-US/docs/Web/Security/Cross-origin_isolation_guide).
