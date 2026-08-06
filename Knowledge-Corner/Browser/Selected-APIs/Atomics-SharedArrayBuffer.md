# Web APIs Today: Atomics + SharedArrayBuffer

*(Part of the "Web APIs Today" series, status as of August 2026)*

JavaScript has been running a single thread since Brendan Eich wrote it in ten days in 1995, and for about twenty years that was fine, because nobody was doing anything that needed real threads. Then WebAssembly showed up wanting to run C++ codebases with actual pthreads in them, and suddenly "single thread, message passing only" stopped being a design philosophy and started being a bottleneck with a PR department.

`SharedArrayBuffer` and `Atomics` are the answer. They let multiple threads — your main thread and any number of Web Workers — read and write the *same* block of memory, at the same time, without corrupting each other's work. This is not `postMessage()` shipping a copy of your data across a channel. This is honest-to-god shared memory, the kind operating systems have had since forever and the browser spent two decades pretending wasn't necessary.

It was necessary. It's also the one Web API that got banned by every browser vendor simultaneously, in unison, overnight. Let's talk about that first, because you can't understand the current shape of this API without understanding why it briefly didn't exist.

## The Incident: How Shared Memory Got Everyone Fired

January 2018. Spectre and Meltdown land — a pair of CPU-level side-channel attacks that exploit speculative execution to leak memory contents across security boundaries that were supposed to be airtight. The detail that matters here: exploiting Spectre reliably requires a *very* precise, *very* high-resolution timer, so you can measure cache-hit timing differences down to the nanosecond and infer what's sitting in memory you shouldn't be able to read.

`SharedArrayBuffer` combined with `Atomics.wait()` happened to be exactly that timer. Free of charge, built into every browser, no npm install required.

So every vendor pulled it. Same week. `SharedArrayBuffer` vanished from Chrome, Firefox, Safari, and Edge like a guilty party at a dinner where the police just arrived. Anyone who had shipped WASM threading on top of it woke up to broken production apps and no warning.[^spectreTimer]

[^spectreTimer]: The elegance of the attack is honestly a little offensive. You didn't need to break encryption or find a buffer overflow — you just needed a stopwatch precise enough to notice that cached memory reads are faster than uncached ones, and shared memory gave you a stopwatch precise enough to notice the difference between "L1 cache hit" and "somebody else's secret."

## The Resurrection: Cross-Origin Isolation

By 2020 the standards bodies had worked out a deal, and it's the deal we're still living with today: you can have your fast, dangerous, timing-attack-enabling shared memory back, but only if your page proves it isn't sharing a process with anything it doesn't fully trust.

That proof comes in the form of two response headers on your top-level document:

```http
Cross-Origin-Opener-Policy: same-origin
Cross-Origin-Embedder-Policy: require-corp
```

**COOP** (`same-origin`) severs your browsing context group from anything cross-origin — a window that opens your page, or a page your page opens, no longer shares a process with you unless it's same-origin too. **COEP** (`require-corp`) refuses to load any cross-origin resource — images, iframes, scripts, fonts, all of it — unless that resource explicitly opts in via a `Cross-Origin-Resource-Policy` header of its own.

Send both, and your page becomes **cross-origin isolated**. Check it with:

```js
if (self.crossOriginIsolated) {
  // SharedArrayBuffer and high-resolution timers are available
}
```

Get it wrong and `SharedArrayBuffer` is simply `undefined` — no error, no warning, the constructor just doesn't exist. This is the single most common support question in every forum thread about this API, and it is never a browser bug. It's a missing header.[^coepPain]

[^coepPain]: The honest downside nobody puts in the marketing copy: COEP is a house guest who insists on seeing everyone else's ID at the door. Enable it on an existing site with embedded YouTube players, third-party ad tags, or a CDN that doesn't set CORP headers, and things quietly stop rendering. Migrating a real production app to cross-origin isolation is less "add two headers" and more "audit every embed you've ever added and hope the vendor cooperates."

## The Core API

`SharedArrayBuffer` is the memory. `Atomics` is how you touch it without racing yourself into undefined behavior.

```js
// main.js — cross-origin isolated page
const sab = new SharedArrayBuffer(1024);
const counter = new Int32Array(sab);

const worker = new Worker("worker.js");
worker.postMessage(sab); // sends the buffer reference, not a copy
```

```js
// worker.js
onmessage = (e) => {
  const counter = new Int32Array(e.data);
  Atomics.add(counter, 0, 1);      // thread-safe increment
  Atomics.notify(counter, 0);       // wake anyone waiting on index 0
};
```

Note what did **not** happen: no `structuredClone`, no serialization round-trip. `postMessage` transmits the `SharedArrayBuffer` reference itself — both sides now point at the same physical memory. Mutate it in the worker, and the main thread sees the change immediately, no message required to observe it (though you still need one to get *notified* of it).

The `Atomics` namespace gives you the primitives a systems programmer would recognize instantly: `add`, `sub`, `and`, `or`, `xor`, `exchange`, `compareExchange`, `load`, `store` — all atomic, all guaranteed not to tear even under concurrent access from multiple threads. And then the two that make this genuinely useful instead of just "memory you can share but not safely coordinate":

- **`Atomics.wait(view, index, expectedValue)`** — blocks the calling thread until the value at `index` changes, or a timeout hits. Worker-thread only; call it on the main thread and the browser throws, because blocking the main thread is how you get a very justified 1-star review.
- **`Atomics.notify(view, index, count)`** — wakes up threads parked in `wait()` on that index.

This is a futex. Linux has had this exact primitive since 2002. JavaScript got it in 2020. We got there.

## Growable Buffers (Baseline 2024)

For its first few years, a `SharedArrayBuffer` was fixed-size at birth — need more room, allocate a new one and copy. Since mid-2024 that's no longer mandatory:

```js
const buffer = new SharedArrayBuffer(8, { maxByteLength: 16 });

if (buffer.growable) {
  buffer.grow(12); // new bytes zero-initialized; can only grow, never shrink
}
```

`grow()` and the `growable` accessor reached Baseline status in July 2024, so this is safe to use without a fallback across current browser versions. The size-only-increases restriction is deliberate: shrinking shared memory that another thread might be mid-read on is a use-after-free waiting to happen, so the spec simply doesn't offer the footgun.

## Atomics.pause() and Atomics.waitAsync() (Baseline 2025)

Two additions matured to Baseline in 2025, and both are worth knowing about even though neither changes what's *possible* — they change what's *efficient*.

**`Atomics.waitAsync()`** (Baseline since November 2025) is the non-blocking sibling of `wait()`. It returns immediately with either a result or a `Promise` that resolves when `notify()` fires — meaning you can now do futex-style synchronization from the main thread, since you're never actually blocking it:

```js
const { value } = Atomics.waitAsync(view, 0, 0);
if (value instanceof Promise) {
  value.then((result) => console.log(result)); // "ok" or "timed-out"
}
```

Safari was the long-time holdout here — every other engine had it years earlier, and WebKit only finished catching up in late 2025, which is why "Baseline" for this one arrived so much later than you'd expect from a spec feature that's conceptually simple.

**`Atomics.pause()`** (Baseline since April 2025) is a CPU hint, not a synchronization primitive. Call it inside a spin-wait loop and you're telling the processor "I'm busy-waiting, deprioritize me accordingly" — the same job the `pause` instruction does in x86 assembly. It has zero observable effect on program behavior beyond timing:

```js
let spins = 0;
do {
  if (Atomics.compareExchange(lock, 0, 0, 1) === 0) break;
  Atomics.pause();
  spins++;
} while (spins < 10);

Atomics.wait(lock, 0, 1); // fall back to a real wait if spinning didn't work
```

The pattern — spin briefly with `pause()`, then fall back to a blocking `wait()` — is the standard hybrid lock strategy: cheap under low contention, correct under high contention.

## Current Browser Reality (August 2026)

| Feature | Status |
|---|---|
| `SharedArrayBuffer` + core `Atomics` | Baseline since 2021 (Chrome/Edge 92, Firefox 79, Safari 15.2) |
| Cross-origin isolation requirement (COOP/COEP) | Mandatory in all engines since the 2020 reintroduction |
| `grow()` / `growable` | Baseline 2024 (July 2024) |
| `Atomics.pause()` | Baseline 2025 (April 2025) |
| `Atomics.waitAsync()` | Baseline 2025 (November 2025 — Safari was last to ship) |

Node.js never needed any of this ceremony. `worker_threads` exposes `SharedArrayBuffer` and `Atomics` directly, no headers, no isolation dance — the browser's COOP/COEP requirement is purely a mitigation for a browser-specific threat model (arbitrary cross-origin content sharing a renderer process), and it doesn't apply outside one.

## Where This Actually Gets Used

Nobody reaches for raw `Atomics.compareExchange` to build a to-do app. This API exists because a specific category of software refused to run in the browser without it:

- **Multi-threaded WebAssembly.** C/C++/Rust code compiled with pthreads support needs real shared memory to behave like it does natively. This is the primary reason the feature exists at all — WASM threading was blocked on `SharedArrayBuffer`'s return for two full years.
- **In-browser SQLite (`sqlite-wasm`).** The OPFS (Origin Private File System) sync-access-handle backend uses a dedicated worker plus `Atomics` to let the main thread issue synchronous-feeling database calls without freezing the UI.
- **`ffmpeg.wasm`.** Video transcoding in-browser, split across worker threads that share frame buffers directly instead of copying megabytes of pixel data across `postMessage` on every frame.
- **WebContainers (StackBlitz).** Running an actual Node.js runtime inside a browser tab, including synchronous filesystem syscalls, leans on `SharedArrayBuffer` plus `Atomics.wait()`/`waitAsync()` to fake POSIX's blocking I/O model on top of an event loop that was never built for it.
- **Pyodide and browser-based Python.** Multi-worker CPython builds use shared memory the same way native CPython uses shared memory across processes — because the alternative is serializing every array between workers, and nobody runs NumPy in a browser to watch it serialize NumPy arrays.
- **AudioWorklet-adjacent low-latency audio.** Real-time audio processing where message-passing latency is audible, not just inconvenient.

The common thread: every one of these is a port of something that already assumed shared memory existed, running into a JavaScript runtime that spent twenty years assuming it didn't.

## Deprecated / Historical Baggage

Nothing in the current `Atomics`/`SharedArrayBuffer` surface is deprecated — everything described above is the live, current spec. The only "deprecated" thing worth flagging is a pattern, not an API: **relying on `SharedArrayBuffer` without checking `crossOriginIsolated` first**. Code written before 2018, or written without the isolation requirement in mind, will fail silently or throw depending on the engine, and porting it forward means adding the COOP/COEP headers and the runtime check — there's no polyfill that gets you out of that requirement, because the requirement is the security fix.

## Where This Goes Next

The interesting motion right now isn't in the JS-facing API — that's largely settled — it's one layer down, in WebAssembly itself. The **shared-everything-threads** proposal (still in active draft as of 2026, under discussion at the WebAssembly CG) aims to let WASM modules share not just linear memory but functions, tables, and globals across threads directly, plus add thread-local storage and a proper thread-spawn mechanism that doesn't route through JavaScript's Worker API at all.

Translated out of standards-speak: today, spinning up a new thread inside a WASM module means going through JS to create a `Worker` and hand it a `SharedArrayBuffer`. The proposal's endgame is a WASM module that can spawn and coordinate its own threads natively, with JavaScript reduced to a bystander instead of a mandatory intermediary. If it lands, the browser gets closer to offering WebAssembly a genuine native threading model instead of a JavaScript-shaped approximation of one — which is roughly the gap that's been separating "WASM can run your C++" from "WASM runs your C++ the way your C++ expects to be run."

Don't hold your breath on a ship date. This is the kind of proposal that touches memory models, security review, and every engine's GC implementation at once — which is a polite way of saying it'll take a while, and it should.

**Bottom line:** `SharedArrayBuffer` and `Atomics` are the closest thing the web platform has to real systems programming. Powerful, correctly locked down after a security incident that earned the lockdown, and almost entirely invisible to you unless you're the person building the runtime that some other framework quietly depends on. If you've never touched this API directly, that's not a gap in your skills. That's the API working as intended.
