# HTML APIs Today

**A complete map of what browsers can actually do. Status: 6 August 2026.**

I've been shipping web software since 2000. Long enough to have used most of this document's graveyard section in production. Some of it proudly.

This is the reference I wanted and couldn't find: every API the web platform offers, in one place, with an honest status label. Not a tutorial. A map. You don't read a map cover to cover, you find your street.

> **Provenance, because it matters:** The backbone of this document is stable platform knowledge through early 2026. Everything volatile (built-in AI, Interop 2026, the Privacy Sandbox funeral, WebGPU rollout, Safari 26.x, Digital Credentials, WebNN, the XSLT execution date) was verified against live primary sources on 6 August 2026. Sources are listed at the end. Where I couldn't verify, I say so instead of guessing.

---

## 1. First, the name

"HTML APIs" is what everyone says. It's also wrong, and the wrongness is instructive.

HTML gives you elements. The moment you call a function on one of them, you've left HTML and entered the **Web APIs**: several hundred JavaScript interfaces defined across WHATWG and W3C specs, of which the HTML Standard is just the largest single contributor. Calling all of it "HTML APIs" is like calling your entire company "the Excel department" because that's where it started.

I'll use the correct term from here. You knew what you meant. Now the document does too.

One more scoping decision, made openly: **granularity is per capability, not per interface.** WebRTC alone defines north of forty interfaces. Listing `RTCIceCandidatePairStats` as its own row would make this document complete in the way a phone book is complete. Every capability the platform offers appears below. Its supporting cast of interfaces does not.

---

## 2. How to read the status labels

| Label | Meaning |
|---|---|
| **Baseline** | Ships in all three engines (Chromium, Gecko, WebKit). Safe. Even on the CFO's laptop. |
| **Baseline, new** | Reached all three engines within roughly the last 18 months. Safe, but check your enterprise browser floor. |
| **Partial** | Two of three engines, or shipped everywhere with real caveats. Progressive enhancement territory. |
| **Chromium** | Chrome, Edge, and friends only. Often deliberately so (see Part IV). |
| **WebKit** / **Gecko** | Safari-only / Firefox-only. |
| **Trial** | Origin trial or behind a flag. Production use means paperwork or bravery. |
| **Dying** | Deprecated, scheduled for removal, or already half-buried. Details in the graveyard, Part V. |

"Baseline" here follows the official definition: *newly available* means it works in the current stable of Chrome, Edge, Firefox and Safari; *widely available* means it has been there for 30 months.[^baseline] I compress both into one word and flag the young ones.

A word on why this framing exists at all. The Interop project, where all four browser vendors agree on yearly targets, took the shared interoperability score of its 2025 focus areas from 25 to 95 in one year. That effort is why the tables below contain the word "Baseline" far more often than they would have in 2023. Cross-browser is no longer the exception. It's the default, with a well-lit list of exceptions.

---

# Part I: The Inventory

Twelve categories. Every capability. One line each.

## 3.1 Documents, DOM, Components, UI primitives

| API | What it does | Status |
|---|---|---|
| DOM Standard | Nodes, trees, traversal, events. The floor you stand on. | Baseline |
| Shadow DOM + Custom Elements + `<template>`/`<slot>` | Web Components. Encapsulated, reusable elements. | Baseline |
| Declarative Shadow DOM | Shadow roots from server-rendered HTML, no JS required. | Baseline |
| ElementInternals | Custom elements that participate in forms and accessibility like natives. | Baseline |
| CustomStateSet (`:state()`) | Custom elements exposing their own CSS-stylable states. | Baseline |
| Scoped custom element registries | Multiple element registries per page; ends global tag-name land grabs. WebKit shipped first. Interop 2026 focus. | Partial |
| MutationObserver | React to DOM changes without the deprecated Mutation Events. | Baseline |
| ResizeObserver | Know when an element changes size. Container-query's imperative cousin. | Baseline |
| IntersectionObserver | Visibility of elements relative to viewport or ancestors (v2 occlusion checks: Chromium). | Baseline |
| Selection API | Read and manipulate user text selection; `getComposedRanges()` reaches into shadow DOM. | Baseline |
| Range / StaticRange | Character-precise document fragments. | Baseline |
| DOMParser / XMLSerializer | Strings to DOM and back. | Baseline |
| `setHTMLUnsafe()` / `parseHTMLUnsafe()` | HTML parsing that understands declarative shadow DOM. The name is the warning label. | Baseline |
| Sanitizer API (`setHTML()`) | Injection-safe HTML insertion with a real sanitizer. WebKit shipped in Safari 26.3; others landing. | Partial |
| Trusted Types | Compiler-enforced discipline for DOM XSS sinks. Newly in all three engines. | Baseline, new |
| Popover API (`popover`, incl. `hint`) | Top-layer popups without z-index archaeology. (`hint`: Chromium.) | Baseline |
| `<dialog>` + `closedby` | Modal and non-modal dialogs with light-dismiss control. | Baseline |
| Invoker Commands (`command`/`commandfor`) | Buttons that open dialogs and popovers with zero JavaScript. Chromium + Safari 26.2; Gecko in progress. | Partial |
| Interest Invokers (`interestfor`) | Hover-cards and preview UI as a declarative primitive. | Trial |
| CloseWatcher | One API for "the user wants out" (Esc, Android back). | Partial |
| Fullscreen API | Elements go fullscreen. | Baseline |
| Page Visibility | Is the tab visible? Throttle accordingly. | Baseline |
| `Element.moveBefore()` | Move a node without destroying its state (iframes, animations, focus). Chromium; others positive. | Partial |
| Customizable `<select>` (`appearance: base-select`) | The form control that resisted styling for 25 years, finally surrendering. Chromium first. | Partial |
| CSS Custom Highlight API | Style arbitrary text ranges without wrapping them in spans. Interop 2026 focus. | Baseline, new |
| CSSOM + CSS Typed OM | Read/write styles; Typed OM adds typed values instead of string soup. Typed OM: no Gecko yet. | Partial |
| CSS Properties & Values (`@property`, `registerProperty`) | Custom properties with types, defaults, animation. | Baseline |
| CSS Painting API (Paint Worklet) | Programmable CSS images. The only Houdini worklet that meaningfully shipped. | Chromium |
| CSS Font Loading API | Load and inspect fonts programmatically. | Baseline |
| Constructable Stylesheets (`adoptedStyleSheets`) | Share one stylesheet object across shadow roots. | Baseline |
| Web Animations API | Imperative control over CSS-grade animations. | Baseline |
| View Transitions (same-document) | Animated state changes with before/after snapshots. | Baseline, new |
| View Transitions (cross-document) | The same, between page loads. Chromium + WebKit; Gecko via Interop 2026. | Partial |
| Element-scoped View Transitions | Transitions on a subtree without freezing the page. Chrome 147. | Chromium |
| History API | `pushState` and friends. Still works. Still awkward. | Baseline |
| Navigation API | The History API replacement: intercept every navigation, own your SPA routing. All three engines as of Safari 26.2. | Baseline, new |
| URL / URLSearchParams | Parse and build URLs like an adult. | Baseline |
| URLPattern | Route matching as a platform primitive. Cross-browser since Interop 2025. | Baseline, new |
| Text Fragments (`#:~:text=`, `fragmentDirective`) | Deep-link to text that has no anchor. | Baseline |
| Visual Viewport | The viewport the user actually sees, keyboards and pinch-zoom included. | Baseline |
| Screen Orientation | Read and (on mobile) lock orientation. | Baseline |
| VirtualKeyboard API | Control and geometry of the on-screen keyboard. | Chromium |
| XPath | Query XML/HTML by path. Alive, unlike its sibling below. | Baseline |
| XSLTProcessor | In-browser XSLT 1.0. Execution scheduled: see graveyard. | Dying |

## 3.2 Fetching, Networking, Realtime

| API | What it does | Status |
|---|---|---|
| Fetch | The network primitive: requests, responses, streams, priorities. | Baseline |
| `fetchLater()` | Reliable "send this even if the tab dies" beacons with a body worth the name. | Chromium |
| XMLHttpRequest | The ancestor. Feature-frozen, not deprecated, mildly embarrassing. | Baseline |
| Beacon (`sendBeacon`) | Fire-and-forget analytics on page exit. | Baseline |
| Server-Sent Events (`EventSource`) | One-way server push over plain HTTP. Underrated. | Baseline |
| WebSocket | Bidirectional messaging. The workhorse. | Baseline |
| WebSocketStream | WebSocket with backpressure via Streams. | Chromium |
| WebTransport | Datagrams and streams over HTTP/3. All three engines as of Safari 26.4; Interop 2026 focus. | Baseline, new |
| WebRTC (PeerConnection, DataChannel, getStats) | Peer-to-peer audio, video, data. Interop 2026 focus (again). | Baseline |
| WebRTC Encoded Transform | Touch encoded frames in transit (E2E encryption, effects). | Partial |
| Compression Streams | gzip/deflate (de)compression as a stream. | Baseline |
| Compression: zstd + dictionary transport | Smaller payloads via zstd and shared-dictionary deltas. Newly broad (Firefox 147, Safari 26.3). | Baseline, new |
| Streams (Readable/Writable/Transform) | Backpressure-aware data plumbing underneath everything above. | Baseline |
| Broadcast Channel | Same-origin pub/sub across tabs and workers. | Baseline |
| Channel Messaging (`MessageChannel`) | Point-to-point pipes between contexts. | Baseline |
| Web Locks | Cross-tab mutexes. The polite way to stop two tabs writing one resource. | Baseline |
| Network Information (`navigator.connection`) | Connection type and save-data hints. | Chromium |
| Push API | Server-initiated push to service workers. Everywhere, with Apple's asterisk: iOS wants the app installed. | Partial |
| Notifications API | System notifications. Platform rules vary more than the API does. | Baseline |
| Background Sync / Periodic Background Sync | Defer work until connectivity / recurring background work. | Chromium |
| Background Fetch | Large downloads that outlive the page. | Chromium |
| Cookie Store API | Async, sane cookie access, also in service workers. Safari since 18.4; Gecko subset. | Baseline, new |
| Storage Access API | Embedded third-party contexts requesting storage, with user gesture. | Baseline |
| CHIPS (partitioned cookies) | Third-party cookies, partitioned per top site. One of the three Privacy Sandbox survivors. | Baseline, new |
| Private State Tokens | Anti-fraud tokens without cross-site identity. Survivor number two. | Chromium |
| Topics / Protected Audience / Attribution Reporting / Shared Storage / Fenced Frames | The Privacy Sandbox ad stack. Retired October 2025, removed from Chrome by mid-2026. Obituary in Part V. | Dying |

## 3.3 Storage & Files

| API | What it does | Status |
|---|---|---|
| Web Storage (`localStorage`/`sessionStorage`) | Synchronous key-value. Fine for a theme flag, wrong for everything else. | Baseline |
| IndexedDB | The structured database nobody loves and everybody uses (usually via a wrapper). | Baseline |
| Cache API | Request/response storage powering offline. | Baseline |
| StorageManager (`estimate()`, `persist()`) | How much space, and may I keep it. | Baseline |
| Origin Private File System (OPFS) | A private, fast, real file system per origin. Sync access handles in workers make it SQLite-fast. | Baseline |
| File System Access (pickers, `showOpenFilePicker`) | Read and write the user's actual files, with permission. WebKit ships only the `WritableStream` part (Safari 26); pickers remain Chromium. | Chromium |
| File / Blob / FileReader | Files as objects. | Baseline |
| File & Directory Entries (`webkitdirectory`) | Legacy directory upload. Works, smells of 2012. | Baseline |
| Drag and Drop | The API everyone implements twice: once wrong, once with a library. | Baseline |
| Async Clipboard (`navigator.clipboard`) | Read/write clipboard incl. images; web custom formats are Chromium. | Baseline |
| Web Share / Web Share Target | Hand data to the OS share sheet / receive shares as an installed app. Target: Chromium-leaning. | Partial |

## 3.4 Workers, Threads, Scheduling

| API | What it does | Status |
|---|---|---|
| Web Workers (dedicated, module) | JavaScript off the main thread. | Baseline |
| SharedWorker | One worker, many tabs. Absent on Chrome for Android, of all places. | Partial |
| Service Worker | The programmable network proxy. Offline, caching, push, the PWA backbone. | Baseline |
| Worklets (Audio, Paint) | Tiny high-frequency hooks into rendering and audio pipelines. | See rows |
| OffscreenCanvas | Canvas rendering in a worker. Jank-free charts. | Baseline |
| `requestAnimationFrame` | Do it before the next paint. | Baseline |
| `requestIdleCallback` | Do it when nobody's looking. Still no WebKit. | Partial |
| Prioritized Task Scheduling (`scheduler.postTask`, `scheduler.yield`) | Cooperative main-thread scheduling with priorities. | Chromium |
| Atomics + SharedArrayBuffer | Real shared-memory threading, gated behind cross-origin isolation (COOP/COEP). | Baseline |
| Idle Detection | Is the human still there. Gecko and WebKit say: none of your business. | Chromium |
| Compute Pressure | CPU pressure signals for adaptive workloads (video calls, games). | Chromium |

## 3.5 Graphics, Media, Audio, Capture

| API | What it does | Status |
|---|---|---|
| Canvas 2D | Immediate-mode 2D drawing. | Baseline |
| WebGL / WebGL 2 | GPU rendering, OpenGL ES lineage. Maintenance mode in spirit. | Baseline |
| WebGPU | Modern GPU access: rendering plus compute shaders. All three engines since January 2026; Firefox still rolling out Linux/Android/Intel-Mac. The new substrate for graphics *and* client-side ML. | Baseline, new |
| WebXR Device API | VR/AR sessions. Chromium on Android, Quest browser, Safari on visionOS (VR only). | Partial |
| `<model>` | Declarative interactive 3D models. Apple's spatial-web opener. | WebKit |
| Web Audio API + AudioWorklet | Audio graphs, synthesis, sample-precise processing. | Baseline |
| Audio Output Devices (`setSinkId`) | Route audio to a chosen output device. | Partial |
| Media element (`<audio>`/`<video>`) | Playback with a DOM face. | Baseline |
| Media Source Extensions (MSE) | Feed the video element yourself: adaptive streaming. (`ManagedMediaSource`: WebKit's battery-aware variant.) | Baseline |
| Encrypted Media Extensions (EME) | DRM. You don't have to like it. | Baseline |
| WebCodecs | Raw access to hardware encoders/decoders. The API that moved video editing into the tab. | Baseline, new |
| Media Capture (`getUserMedia`) | Camera and microphone. | Baseline |
| Screen Capture (`getDisplayMedia`) | Share a screen, window, or tab. | Baseline |
| Element / Region Capture | Capture a DOM subtree or crop, not the whole tab. | Chromium |
| Captured Surface Control | Scroll and zoom the tab you're capturing. | Chromium |
| MediaStream Recording (`MediaRecorder`) | Capture to a file without touching WebCodecs. | Baseline |
| Image Capture | Photo-grade camera control (`takePhoto`, focus, torch). | Partial |
| Media Session | Lock-screen and hardware-key metadata and controls. | Baseline |
| Media Capabilities | "Can this device decode 4K HEVC *smoothly*?" Answers before you buffer. | Baseline |
| Picture-in-Picture | Float a video. Gecko has the feature but not the API. | Partial |
| Document Picture-in-Picture | Float an arbitrary HTML window. | Chromium |
| Remote Playback | Send media to Cast/AirPlay targets. | Partial |
| Presentation API | Drive a second screen. | Chromium |
| Web Speech: synthesis | Text-to-speech. | Baseline |
| Web Speech: recognition | Speech-to-text; Chromium can now run it on-device. Gecko still missing. | Partial |
| WebVTT / TextTrack | Captions and cues. Interop 2026 investigation area. | Baseline |
| Shape Detection (Barcode) | Hardware-assisted barcode/QR scanning. | Chromium |
| Autoplay Policy Detection | Ask *before* the play() promise rejects. | Partial |

## 3.6 Input & Interaction

| API | What it does | Status |
|---|---|---|
| Pointer Events | Mouse, touch, pen, unified. | Baseline |
| Touch Events | The legacy layer Pointer Events replaced. Still everywhere. | Baseline |
| Pointer Lock | Infinite mouse movement for games and 3D. | Baseline |
| Gamepad API | Controllers; rumble support varies. | Baseline |
| Keyboard Lock | Capture browser-reserved shortcuts in fullscreen (remote desktops, games). Newly joined by Safari 26.4. | Partial |
| Keyboard Map (`getLayoutMap`) | What character does this physical key produce. | Chromium |
| Input Events (`beforeinput`) | Intercept edits before they land. | Baseline |
| EditContext | Build serious text editors without contenteditable's haunted house. | Chromium |
| `contenteditable` / `execCommand` | The haunted house. Works, deprecated, load-bearing. | Dying |
| Ink API (`DelegatedInkTrail`) | OS-composited pen strokes ahead of your event loop. | Chromium |
| Vibration | Buzz. Android only in practice. | Partial |
| EyeDropper | Pick a color from anywhere on screen. | Chromium |

## 3.7 Device, Sensors, Hardware

| API | What it does | Status |
|---|---|---|
| Geolocation | Where the user is, with permission. | Baseline |
| Device Orientation & Motion | Gyro/accelerometer events; iOS gates behind a permission prompt. | Baseline |
| Generic Sensor API (Accelerometer, Gyroscope, LinearAcceleration, Orientation) | The tidy successor to the above. | Chromium |
| Magnetometer / Ambient Light | Flagged even in Chromium. Fingerprinting worries won. | Trial |
| Battery Status | Charge level. Gecko removed it years ago; WebKit never came. | Chromium |
| Device Memory | RAM class of the device. | Chromium |
| Screen Wake Lock | Keep the screen on (recipes, dashboards, boarding passes). | Baseline |
| Web Bluetooth | Talk BLE to devices. | Chromium |
| WebUSB | Raw USB. | Chromium |
| Web Serial | Serial ports: Arduinos, printers, lab gear. | Chromium |
| WebHID | Human-interface devices beyond keyboard/mouse. | Chromium |
| Web NFC | NFC tags on Android. | Chromium |
| Web MIDI | Instruments in, sound out. The rare hardware API Gecko ships. | Partial |
| Contact Picker | User-mediated address book access on Android. | Chromium |
| Window Management | Multi-screen placement, fullscreen on a chosen display. | Chromium |
| Local Font Access | Enumerate installed fonts (design tools). | Chromium |
| Web Smart Card / Direct Sockets | TCP/UDP and smart cards, Isolated-Web-Apps only. | Trial |

## 3.8 Auth, Identity, Payments, Crypto

| API | What it does | Status |
|---|---|---|
| Web Crypto (SubtleCrypto) | Hashing, signing, key wrangling; Ed25519 now everywhere. | Baseline |
| Web Authentication (WebAuthn) | Passkeys. The thing that is actually killing passwords. | Baseline |
| WebAuthn Signal API (`PublicKeyCredential.signal*`) | Tell the platform a credential changed or died; keeps passkey lists clean. In Safari since 26.0. | Baseline, new |
| Credential Management | Programmatic sign-in with stored credentials. | Partial |
| Federated Credential Management (FedCM) | Federated login without third-party cookies. Privacy Sandbox survivor number three. | Chromium |
| WebOTP | Autofill SMS one-time codes. | Chromium |
| Digital Credentials API | Request government-grade credentials (mobile driver's licenses, EU wallet attestations) from OS wallets. Chrome 141 + Safari 26 stable since autumn 2025; Gecko implementing despite an officially grumpy standards position. The EU angle in Part VI. | Partial |
| Payment Request | Browser-mediated checkout. Chromium + WebKit; Gecko never shipped. | Partial |
| Payment Handler | Web-based payment apps behind Payment Request. | Chromium |
| Secure Payment Confirmation | WebAuthn-signed transaction confirmation. | Chromium |
| Apple Pay JS | Apple Pay on the web, Safari only, by design. | WebKit |
| Permissions API (`query`) | Ask about permission state without triggering prompts. | Baseline |
| Permissions Policy | Not JS, but the header that decides which of everything above an embedded frame may use. | Baseline |

## 3.9 Performance & Observability

| API | What it does | Status |
|---|---|---|
| High Resolution Time (`performance.now`) | Monotonic clocks. | Baseline |
| Navigation / Resource / User Timing | When things loaded, in painful detail. | Baseline |
| Server-Timing | Backend timings surfaced to the client. | Baseline |
| Paint Timing (FCP) | First contentful paint. | Baseline |
| Largest Contentful Paint (LCP) | The headline loading metric. WebKit finally joined in Safari 26.2. | Baseline, new |
| Event Timing (INP) | Interaction responsiveness. Also newly WebKit. | Baseline, new |
| Layout Instability (CLS) | Visual stability score. | Partial |
| Long Tasks / Long Animation Frames (LoAF) | Who blocked the main thread and who to blame. LoAF: Chromium. | Partial |
| Element Timing | When *that specific* element rendered. | Chromium |
| PerformanceObserver | The delivery mechanism for all of the above. | Baseline |
| Reporting API | Deprecations, CSP violations, crashes, delivered as reports. | Partial |
| `measureUserAgentSpecificMemory` | Real memory usage, cross-origin-isolated pages only. | Chromium |
| Page Lifecycle (freeze/resume) | Tabs get frozen; know when. | Chromium |
| bfcache `notRestoredReasons` | Why the back/forward cache rejected you. | Chromium |
| Speculation Rules | Declarative prefetch/prerender: the "instant navigation" API. | Chromium |
| Soft Navigations API | Core Web Vitals for SPA route changes. Long overdue; arriving in Chromium now. | Trial |

## 3.10 PWA & App Integration

| API | What it does | Status |
|---|---|---|
| Web App Manifest | Installability metadata. | Baseline |
| Badging API | Unread counts on the app icon. | Partial |
| Declarative Web Push | Push without waking a service worker; battery-friendly. Apple's design, shipped in Safari 18.4. | WebKit |
| File Handling | Register an installed web app as an OS file handler. | Chromium |
| Launch Handler | Control how launches focus/navigate existing windows. | Chromium |
| `registerProtocolHandler` | Claim `web+` and standard schemes. | Partial |
| Window Controls Overlay | Draw into the title bar of installed apps. | Chromium |
| `beforeinstallprompt` / `getInstalledRelatedApps` | Install prompts and "is our native app here". | Chromium |
| Digital Goods | In-app purchases for store-distributed web apps. | Chromium |
| Isolated Web Apps + Controlled Frame | Signed, packaged web apps with extra powers (sockets, smart cards). Enterprise-flavored. | Trial |

## 3.11 Built-in AI & ML

The APIs themselves. The politics live in Part III.

| API | What it does | Status |
|---|---|---|
| Translator API | On-device translation between language pairs. Chromium stable since 138. | Chromium |
| Language Detector API | What language is this text. Chrome stable; Edge pending. | Chromium |
| Summarizer API | Key points, TL;DRs, headlines, on-device. | Chromium |
| Prompt API (`LanguageModel`) | Direct sessions with the built-in model (Gemini Nano): multimodal input, structured JSON output. Stable on the web in Chrome 148. | Chromium |
| Writer / Rewriter APIs | Generate or transform text to length/tone specs. | Trial |
| Proofreader API | Grammar and clarity correction. | Trial |
| WebNN | Low-level neural-network graph API targeting CPU/GPU/**NPU**. W3C Candidate Recommendation (updated Jan 2026); origin trial in Chromium. The only web API that reaches the NPU. | Trial |

That's the inventory. If a capability of the platform isn't in these tables, it's in the graveyard (Part V), the vendor kitchens (Part III), or it doesn't exist. If you find a fourth possibility, my inbox is open and my apology pre-drafted.

---

# Part II: Everyday Use Cases

Twelve scenarios. Each one names the API stack that solves it today, and where the sharp edges are. Together they touch nearly every table above; that's deliberate.

## 4.1 Forms that don't insult the user

**Stack:** Constraint Validation, `beforeinput`, Popover + Invoker Commands, ElementInternals, WebOTP, customizable `<select>`.

Native validation handles required fields, patterns and ranges before you write a single `if`. `ElementInternals` lets your custom `<currency-input>` participate in that same machinery instead of faking it. Popovers plus `command`/`commandfor` give you the hint bubbles and unit pickers with zero positioning JavaScript. On Android, WebOTP autofills the SMS code so the user never plays working memory champion with a six-digit number.

The result: a form where JavaScript enhances instead of impersonates the platform.

## 4.2 The offline-capable field app

**Stack:** Service Worker, Cache API, IndexedDB, Background Sync, `StorageManager.persist()`, Web Locks.

A technician in a basement has no bars and no patience. Service worker plus Cache API serve the shell instantly; IndexedDB holds the job data; every edit is queued and Background Sync replays the queue when the network reappears, even if the tab is long closed (Chromium; elsewhere you retry on next launch). `persist()` asks the browser not to evict your storage during the annual disk-cleanup panic. Web Locks stop two tabs from replaying the same queue twice.

Offline-first is not exotic anymore. It's about 200 lines and the discipline to treat the network as an enhancement.

## 4.3 Client-side media processing

**Stack:** File, WebCodecs, OffscreenCanvas, Streams, OPFS, Web Workers.

The user drops a 2 GB video. The old answer: upload it, burn server CPU, bill yourself. The 2026 answer: decode frames with WebCodecs in a worker, generate thumbnails on an OffscreenCanvas, write intermediates to OPFS with sync access handles, and only upload the result. I run exactly this pattern for panorama and tour footage; the server's job has shrunk to storage and jealousy.

```js
const decoder = new VideoDecoder({
  output: frame => { paintThumb(frame); frame.close(); },
  error: console.error,
});
```

Ten lines of setup, hardware decode speed, zero cloud invoice.

## 4.4 Video calls that hold up in production

**Stack:** getUserMedia, WebRTC, getDisplayMedia, Element/Region Capture, Media Session, Compute Pressure, WebRTC Encoded Transform.

WebRTC does the calling. `getDisplayMedia` does the screenshare; Region/Element Capture (Chromium) shares *the slide*, not your inbox. Media Session wires the headset buttons. Compute Pressure tells you the laptop is melting so you can drop to 720p before the fan does it for you. Encoded Transform inserts end-to-end encryption between encoder and wire, which is the difference between "encrypted" and "encrypted, also from us".

## 4.5 Live data without polling

**Stack:** SSE for one-way, WebSocket for chat-grade, WebTransport for latency-grade; Streams + Compression Streams; Broadcast Channel.

Ticker and notification feeds: Server-Sent Events, because it's plain HTTP, auto-reconnects, and survives every corporate proxy that eats WebSockets for breakfast. Collaborative editing: WebSocket. Game state and live media: WebTransport, now in all three engines, gives you unordered datagrams so one lost packet doesn't stall the world behind it. Broadcast Channel fans the single connection out to every open tab, because opening five sockets for five tabs is how you get rate-limited by your own backend.

## 4.6 Sign-in without passwords

**Stack:** WebAuthn, Conditional UI, Signal API, Credential Management, FedCM.

Passkeys autofill through Conditional UI: the user taps their username field, the platform offers the passkey, done: phished exactly never. The Signal API reports deleted or renamed credentials back to the OS so the picker doesn't show ghosts. FedCM covers "Sign in with X" federation without third-party cookies, which matters because that crutch is gone everywhere except, ironically, Chrome.

If you build one new thing from this document, build this one.

## 4.7 Checkout and identity, EU edition

**Stack:** Payment Request, Apple Pay JS, Secure Payment Confirmation, Digital Credentials API.

Payment Request gives you browser-native checkout with stored cards on Chromium and WebKit (Gecko sat this one out; keep a form fallback). Apple Pay on the web remains its own Safari-only API, take it or leave the iOS revenue. The new part: Digital Credentials. Age verification or KYC no longer has to mean "photograph your ID and trust us": the browser asks the OS wallet, the wallet returns a signed, minimal attestation ("over 18": yes), and you never touch the document. With EU age-verification mandates and the EUDI wallet timeline (Part VI), this goes from novelty to compliance tooling fast, especially in this jurisdiction.

## 4.8 A "desktop-class" editor in a tab

**Stack:** File System Access, OPFS, EditContext, Local Font Access, EyeDropper, Window Management, Clipboard.

Photoshop-in-the-browser is not a metaphor; it's an existence proof, and this is its stack. Open real files with `showOpenFilePicker`, keep scratch data in OPFS, place palettes on the second monitor via Window Management, pick colors off the user's screen with EyeDropper, list their installed fonts. All Chromium-only, all deliberately so (Part IV). The honest architecture: full experience in Chromium, graceful degradation to download/upload elsewhere. State that in the README before a customer states it in a ticket.

## 4.9 Performance work you can defend in a meeting

**Stack:** PerformanceObserver, LCP, INP, LoAF, `notRestoredReasons`, Speculation Rules, `fetchLater`.

Observe LCP and INP in the field, because lab numbers are astrology with better tooling. When INP is bad, Long Animation Frames names the script that blocked the thread, with receipts. `notRestoredReasons` explains why your back-navigation missed the bfcache (usually an `unload` handler someone added in 2019). Then go on offense:

```html
<script type="speculationrules">
{ "prerender": [{ "where": { "href_matches": "/tours/*" }, "eagerness": "moderate" }] }
</script>
```

Chromium prerenders the likely next page and navigation drops to ~0 ms. Exit telemetry goes out via `fetchLater`, which survives tab death without the `sendBeacon` size diet.

## 4.10 On-device AI features (the GDPR-friendly kind)

**Stack:** Translator, Language Detector, Summarizer, Prompt API; WebGPU + WebNN as the DIY tier.

The everyday wins: translate user reviews in place, summarize the 40-message support thread before your agent opens it, let the Prompt API turn free-text into structured JSON for your forms. All of it on-device: no tokens billed, no personal data crossing a border, no DPA amendment. For a DACH business, "the text never left the machine" is a sentence your data-protection officer frames and hangs on the wall.

```js
const translator = await Translator.create({ sourceLanguage: 'de', targetLanguage: 'en' });
const english = await translator.translate(review);
```

Chromium-only for now, so ship it as enhancement with a server fallback. The polyfill story is decent; the standardization story is Part VI.

## 4.11 Hardware at the edge of the web

**Stack:** Web Serial, WebUSB, WebHID, Web Bluetooth, Web NFC, Barcode Detection.

Label printers on the warehouse floor via Web Serial. Firmware flashing for your IoT device from a support page via WebUSB, instead of a 90 MB installer with an expired certificate. Inventory scans via Barcode Detection and NFC tap-to-pair on Android. This is the quiet category where the web replaced a decade of Windows-only utilities, for the 70-ish percent of users on Chromium, and permanently only for them.

## 4.12 3D, maps, and the product configurator

**Stack:** WebGPU (WebGL fallback), OffscreenCanvas, Gamepad, WebXR, `<model>`.

Configurators, digital twins, and 3D tours now target WebGPU first: compute shaders make crowd, particle and lighting work feasible that WebGL politely declined. Render in a worker via OffscreenCanvas so the UI never stutters. WebXR takes the same scene to a Quest or visionOS headset (VR there, AR not yet). And on Apple platforms, `<model>` drops a spinnable, AR-ready 3D object into HTML with the ceremony of an `<img>` tag: one line, no engine.

---

# Part III: The Vendor Kitchens

Standards are what browsers agree on. This part is about what they cook alone, because the soup of 2026 is the standard of 2029. Or the graveyard entry of 2027. Telling the two apart is the actual skill.

## 5.1 Google: the browser grows a brain, then invites the robots

Chrome's kitchen has two pots on the stove, and both are large.

**Pot one: built-in AI.** Chrome ships Gemini Nano inside the browser, downloaded once, shared across every site.[^washing] On top of it: the task APIs (Translator, Language Detector, Summarizer, stable since Chrome 138) and the Prompt API, which went stable on the open web in Chrome 148 with multimodal input and structured JSON output. At I/O 2026 Google added Gemma 197M, an ultra-small expert model to back task APIs on hardware that can't feed the big one. Writer, Rewriter and Proofreader are in origin trials; the earliest experiments still live behind the Early Preview Program.

I'm in that program.[^epp] The pattern from the inside: APIs arrive as EPP explainers, get sanded down by developer feedback, graduate to origin trials, then stable, and the API shapes genuinely change along the way (the Prompt API alone was rebuilt from a `window.ai` namespace into today's global `LanguageModel`). It is real standards-adjacent iteration, not a press release with a polyfill. The hardware floor is real too: gigabytes of disk, a capable GPU, desktop-class devices. Gemma 197M exists precisely because Gemini Nano's floor excludes half the planet.

**Pot two: the agentic web.** Also at I/O 2026: **WebMCP**, an early proposal to let websites expose structured tools and guidance to AI agents, plus "auto browse" automation and Gemini in Chrome as a product layer (desktop, iOS, Android rolling out mid-2026). We spent twenty years building websites for humans and a `robots.txt` for the robots. Now the robots get a real API. Whether sites *want* competent robot visitors is a business question the technology has cheerfully skipped.

**Also simmering:** the HTML-in-Canvas origin trial (real, accessible DOM inside WebGL/WebGPU scenes), element-scoped view transitions (Chrome 147), the Soft Navigations API, and the whole Project Fugu hardware catalog from Part I. And one pot was taken off the stove entirely; see the graveyard for the Privacy Sandbox.

## 5.2 Apple: late, opinionated, and occasionally first

The old model, Safari as the place features go to wait, is dead. Two Safari releases in the last year shipped the Navigation API, WebTransport, LCP, Event Timing, Trusted Types, the Sanitizer API, Keyboard Lock and WebGPU. Apple even shipped *first* on scoped custom element registries and several CSS features now in Interop 2026.

What Apple cooks alone is platform-shaped: **Apple Pay JS** (the only way to Apple Pay on the web), **Declarative Web Push** (push without waking a service worker, designed around battery), **`<model>`** and the spatial-web work for visionOS, and **Digital Credentials** wired straight into Apple Wallet, though restricted to ISO document types; custom credential types remain an Android-first story. The common thread: Apple ships web APIs where the web meets Apple hardware, and ships them polished. Everything else waits for a standard, or for Interop to make waiting embarrassing.

What Apple does *not* do: expose Apple Intelligence to web pages. There is no `window.appleIntelligence`. The on-device model era has, so far, exactly one browser vendor giving JavaScript the keys.

## 5.3 Mozilla: AI for the user, not the page

Firefox runs local ML aggressively, just not for you, the developer. Bergamot-based translation is fully local. PDF alt-text generation runs a local model. The AI runtime for extensions lets add-ons run on-device inference. The philosophical line is consistent: AI as a *user agent* feature, not a site capability, which is also why Mozilla's standards positions on the Chromium AI APIs and the hardware APIs read the way they do.

Elsewhere Mozilla plays catch-up with unusual speed: WebGPU shipped on Windows (141) and Apple Silicon (145-147) with the rest rolling through 2026, and Firefox landed Digital Credentials groundwork despite its own negative position, which tells you how the EU regulatory wind is blowing.

## 5.4 Microsoft: Chromium plus an NPU obsession

Edge inherits every Chromium API and differentiates on Windows integration. Its two genuine kitchen projects: pushing **WebNN** (the DirectML-backed path to the NPU in every Copilot+ laptop) and its own built-in model experiments with Phi-family small models behind the same API shapes as Chrome, so `Summarizer` may be Gemini-backed in one browser and Phi-backed in another. That's the quiet, correct design decision of this whole era: the *API* is the standard candidate, the model is an implementation detail.

---

# Part IV: Capable but Not Standard

Things browsers can do that no standard blesses. Two flavors, and confusing them is expensive.

**Flavor one: permanently vendor-only, on principle.** Web Bluetooth, WebUSB, Web Serial, WebHID, Battery, Idle Detection, Local Fonts, Window Management, Speculation Rules, Document PiP. Mozilla and WebKit have published *negative* positions on most of these, mainly fingerprinting and security surface. Firefox and Safari looked at Web Bluetooth the way a Viennese waiter looks at a tourist ordering cappuccino after dinner: no scene, no argument, and absolutely no cappuccino. Plan these as Chromium features forever, not as "early".

**Flavor two: pre-standard, direction unclear or positive.** The built-in AI task APIs (specs incubating in W3C's Web Machine Learning group), WebMCP, HTML-in-Canvas, Soft Navigations, Isolated Web Apps, `<model>` (Immersive Web WG), and the federated-identity pair, FedCM and Digital Credentials (W3C drafts with real multi-vendor movement). These are soups with a plausible path to the menu.

And one honorable mention that is neither: **Apple Pay JS**, vendor-only not on principle but on business model. No standards position required; the position is the revenue share.

---

# Part V: The Graveyard

Mentioned, as promised, without lingering. Bring flowers, not code.

| Deceased | Cause of death |
|---|---|
| AppCache | Replaced by Service Workers; removed years ago. |
| WebSQL | One implementation, zero spec; removed. OPFS + WASM SQLite is the heir. |
| Mutation Events | Performance poison; removed from Chromium 2024, deprecated everywhere. Use MutationObserver. |
| `document.execCommand` / `showModalDialog` | Deprecated / long gone. EditContext and `<dialog>` are the adults in the room. |
| HTML Imports / Web Components v0 | The v0 experiments; v1 won, v0 removed. |
| WebVR | Superseded by WebXR. |
| Portals | Prerendering ambitions folded into Speculation Rules. |
| Notification Triggers, Handwriting Recognition | Origin trials that ended without applause. |
| `keygen`, `document.domain` setter, sync XHR, `unload` | Dead, neutered, throttled, and being actively discouraged out of existence, respectively. |
| Do Not Track | Removed from Firefox in 2025; universally ignored before that. GPC inherits the dream. |
| **Privacy Sandbox ad stack** | Topics, Protected Audience, Attribution Reporting, Shared Storage/Private Aggregation, Fenced Frames, Related Website Sets, even IP Protection: retired October 2025 after the third-party-cookie deprecation was itself abandoned. Deprecated in Chrome 144, removed by Chrome 150 (July 2026). Six years of engineering undone by the one disease ad-tech never survives: nobody adopted it. CHIPS, FedCM and Private State Tokens are the three survivors. |
| **XSLT / `XSLTProcessor`** | On death row with a date: deprecated late 2025, stops working in Chrome stable on 17 November 2026, origin trial and enterprise policy reprieve until August 2027. Firefox and WebKit have signaled they'll follow. Cause: quarter-century-old C libraries in the attack surface. A polyfill exists and mostly works.[^xslt] |

---

# Part VI: Where This Is Going

No crystal ball, just trajectories with paper trails.

**1. Interop is the engine now.** Interop 2026 spans twenty focus areas plus four investigations: cross-document view transitions, WebRTC and WebTransport hardening, dialog/popover/`:open`, scoped custom element registries, anchor positioning, and a stack of CSS. After 2025's score went 25 to 95, the pattern is set: the gap between "shipped somewhere" and "shipped everywhere" keeps collapsing to roughly one year. Plan architectures accordingly; "Chromium-first, Baseline-soon" is now a legitimate roadmap column.

**2. The AI APIs head to committee.** WebNN reached updated W3C Candidate Recommendation in January 2026 and is the only route to the NPU; the task APIs (Translator, Summarizer and friends) are incubating along the same track, with Edge already proving the model-agnostic point. My bet, clearly labeled as one: translation and summarization become Baseline capabilities within a few years, the raw Prompt API stays contested much longer, because "browser ships a text transformer" and "browser ships an oracle" are different privacy conversations.

**3. The agentic web gets plumbing.** WebMCP and its siblings ask a real question: does your site expose *tools* or only pixels? If agents become a meaningful traffic class, machine-facing endpoints stop being an integration afterthought and start being the second front door. Watch this one skeptically and early; that combination is usually correct.

**4. Identity becomes an API, with a deadline.** The EUDI wallet framework points at the Digital Credentials API, member states are on the hook to issue wallets, and EU age-verification mandates are already citing browser-mediated credentials. Chrome and Safari ship it; Firefox is building it while officially disliking it. For anyone operating in the EU, "verify an attribute without seeing the document" will move from innovation-team demo to procurement checkbox within a couple of budget cycles.

**5. WebGPU becomes the substrate.** Baseline since January 2026, it's now the floor under three separate futures at once: graphics, client-side ML (transformers.js and friends run on it today, WebNN slots in above it tomorrow), and the compute half of things like HTML-in-Canvas. WebGL gets the honorable Latin-of-graphics-APIs retirement: read forever, written rarely.

**6. HTML keeps eating your component library.** Dialogs, popovers, invokers, customizable `<select>`, interest invokers, `moveBefore()`: the platform is absorbing, one primitive per release cycle, the widgets we've rebuilt in JavaScript since 2010. Every one of them deletes a dependency. This is my favorite trend, because its end state is less of my own code, and nobody writes bugs faster than I do.

**Bottom line:** the platform's capability race is decided; Chromium won it years ago. The race that matters now is interoperability plus intelligence, and for the first time all four vendors are running in the same direction, just for four different reasons. Take the map, check the labels, ship.

---

## Sources & Verification

Verified live on 2026-08-06 (primary sources unless noted): Chrome for Developers, "15 updates from Google I/O 2026" and "Built-in AI" docs (Prompt API stable in Chrome 148, Gemma 197M, WebMCP, HTML-in-Canvas, Soft Navigations); Interop 2026 announcements from Mozilla, WebKit, Microsoft Edge and Igalia (focus areas; 2025 score 25→95; Navigation API and URLPattern cross-browser); Google Privacy Sandbox blog, "Update on Plans for Privacy Sandbox Technologies" plus AdWeek/AdExchanger coverage (October 2025 retirement; Chrome 144→150 removal; CHIPS/FedCM/Private State Tokens retained); W3C, WebNN Candidate Recommendation of 22 January 2026; WebKit blog release notes for Safari 26.0-26.5 (WebGPU, Navigation API, WebTransport, LCP/Event Timing, Keyboard Lock, Sanitizer, Trusted Types, Digital Credentials); web.dev and Firefox 141/145/147 coverage (WebGPU rollout); Chrome Developers, "Digital Credentials API shipped" (Chrome 141) and Corbado/VESS analyses (Safari 26 protocol scope, Firefox implementation, EUDI ARF Topic F); Chrome for Developers, "Removing XSLT for a more secure browser" (Chrome 155 removal, 17 Nov 2026).

Everything else: platform knowledge current through early 2026, cross-checked against the above where they touch. Corrections welcome; I'd rather update a table than defend it.

---

[^baseline]: Yes, that means a feature can be "Baseline" and still missing on the three-year-old kiosk browser in your customer's warehouse. Baseline describes engines, not fleets. Your analytics describe fleets.

[^washing]: One shared model instead of every site downloading its own is the communal washing machine of AI: nobody's dream setup, until each tenant prices out owning one.

[^epp]: Early Preview Program: Google's mailing-list-and-docs channel where the built-in AI APIs appear before origin trials. Disclosure: I'm a participant. Nobody pays me, least of all Google; I read the explainers so my roadmap doesn't get surprised.

[^xslt]: I transformed XML with XSLT in production while some of my current stack's maintainers were in Kindergarten. It was clever, it was unreadable a week later, and I will still light a small candle in November.
