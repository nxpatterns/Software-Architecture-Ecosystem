# Web APIs Today: PWA & App Integration, Offline & Co

*Status as of 06 August 2026.*

Progressive Web Apps have been "the future of mobile" for about a decade now, which should tell you something about how the web ships things. Slowly. In public. With three different vendors arguing about the spec while a fourth quietly implements it anyway and calls it done.

This installment covers the APIs that turn a website into something that behaves like an app: install prompts, file handling, sharing, badges, offline sync, background fetch. The stuff that makes a PWA feel less like "a tab you forgot to close" and more like something that belongs on a home screen.

Fair warning: this corner of the platform is the most fragmented one we've covered yet. Not "some browsers lag a version or two" fragmented. "One vendor built half of this for a different operating system entirely and the other two are watching from the sidelines" fragmented.[^1]

---

## The Manifest Is Still the Foundation

Everything here hangs off one JSON file: the Web App Manifest (`manifest.json`, linked via `<link rel="manifest">`). `name`, `icons`, `start_url`, `display`, `theme_color` — you know the basics. What's changed is how much the manifest now controls. It's no longer just "how does the icon look." It's the entry point for shortcuts, share targets, file handlers, protocol handlers, and display overrides. One config file, growing into a small operating system manifest for your app. If you haven't looked at yours in two years, it's worth a revisit — half the members below didn't exist when most manifests were written.

`display: "standalone"` remains the default choice for "looks like an app, no browser chrome." `display_override` is the newer, more honest field: an ordered list of fallbacks (`window-controls-overlay`, `standalone`, `browser`), because browsers support different display modes and you shouldn't have to guess which one wins.

---

## Getting Installed

`beforeinstallprompt` is the event Chrome and Edge fire when they decide your site qualifies for an install prompt, letting you defer or customize the "Add to Home Screen" moment instead of accepting the browser's default banner. It's Chromium-only. Safari and Firefox have never implemented it and show no signs of starting — Apple in particular treats it as unnecessary, since iOS installs through the Share sheet regardless of what your JavaScript wants.

`navigator.getInstalledRelatedApps()` answers a narrower question: is a related native or web app already installed, so you can skip nagging the user twice. Also Chromium-only, and it requires you to declare the relationship explicitly via `related_applications` in the manifest plus a matching Digital Asset Links / Apple App Site Association file. Useful, niche, not something you'll reach for often.

The honest summary: installability is still something Chrome controls the UX for, Safari controls through Share-sheet convention, and Firefox mostly ignores on desktop. Design your install flow assuming you get zero control over timing on two of your three major browsers.

---

## Making a Web App Feel Like an App

### Window Controls Overlay

Lets an installed desktop PWA draw content into the title bar area, turning the minimize/maximize/close buttons into an overlay instead of ceding the whole top strip to browser chrome. Opt in with `display_override: ["window-controls-overlay"]` in the manifest, then query `navigator.windowControlsOverlay` for the geometry so your UI doesn't draw under the buttons.

Chromium only (Chrome, Edge). No Safari, no Firefox, no public commitment from either. Fine for desktop-only tools where the extra sixteen pixels of title bar genuinely matter to your layout. Not something to build a whole design system around.

### App Shortcuts

The `shortcuts` array in the manifest gives users a long-press (mobile) or right-click (desktop, Windows/ChromeOS taskbar) jump menu straight into specific app actions — "New Message," "Search," whatever your four most-used entry points are. Well supported on Chromium and reasonably on Android home screens. iOS ignores it. Cheap to add, worth adding, don't expect it everywhere.

### File Handling

The File Handling API lets an installed PWA register itself as an "Open With" target for specific file types, the same way a native app claims `.docx` or `.svg`. Declared via `file_handlers` in the manifest, delivered to your app through `launchQueue.setConsumer()`. Chromium desktop only. It's a genuinely nice piece of app-integration plumbing — turns your web app into something the OS treats as a citizen — and it's exactly the kind of feature that quietly dies on the vine because Safari and Firefox never picked it up.

### Protocol Handlers

Two related but distinct things wear this name. `navigator.registerProtocolHandler()` is the old, broadly supported API letting a web page register itself as a handler for a custom scheme (`mailto:`, `web+something:`) at runtime, with a user permission prompt. It's been around since roughly forever and works across Chrome, Firefox, and Safari, with each browser enforcing its own scheme allowlist.

`protocol_handlers` in the manifest is the newer, PWA-specific sibling: declare the scheme up front, and once the app is installed, the OS routes matching links straight to it — no runtime registration call needed. Chromium only, again. If you need cross-browser custom-scheme handling today, the old runtime API is still your only real option.

### Web Share and Share Target

`navigator.share()` — hand text, a URL, or files to the OS-native share sheet — is in genuinely good shape: Chrome, Edge, Safari (desktop and iOS), and Samsung Internet all support it. Firefox desktop is the holdout; Firefox for Android has it.

The mirror image, `share_target` in the manifest (letting your installed app *appear* as a destination in other apps' share sheets, not just call out to one), is Chromium/Android territory. iOS has no equivalent — Apple keeps the receiving side of its share sheet closed to web apps entirely. So: sharing *out* of your PWA, solid cross-platform story. Being a share *target*, Android-and-desktop-Chromium only.

### Badging

`navigator.setAppBadge(n)` / `clearAppBadge()` puts a numeric or dot badge on the installed app's icon, the small red counter native apps have trained everyone to glance at. Support is real but platform-dependent in a way that's worth internalizing before you build a feature around it: Windows and macOS show it for Chrome- or Edge-installed apps; Linux Chromium supports the API but the OS never renders anything; Android shows a dot regardless of the number, the same way it badges native apps; iOS and iPadOS support it from 16.4 onward but only once notification permission is granted. Safari and Firefox on desktop don't implement it at all, and don't support installing PWAs the traditional way either, so the gap is somewhat moot there.

Treat the badge as a bonus signal, never the only signal. Feature-detect with `if (navigator.setAppBadge)` and keep an in-app unread indicator regardless.

---

## Offline Is a Spectrum, Not a Switch

"Offline support" gets talked about as one feature. It's really four or five APIs stacked on top of each other, each covering a different failure mode.

### The Foundation You Already Have

Service Worker plus the Cache API is still the base layer — intercept `fetch`, serve from cache, fall back to network or vice versa depending on your strategy. We covered Service Workers in depth in an earlier installment of this series, so no repeat performance here. Everything below assumes a service worker is already running the show.

### Background Sync

`registration.sync.register(tag)` queues a one-off task to retry once connectivity returns — the classic case being "user submitted a form while offline, retry the POST the moment the network comes back," without you hand-rolling a retry loop. No explicit permission prompt required. Solid support on Chrome, Edge, Opera. Firefox has never shipped it, on any platform, in any version. Safari never has either, desktop or iOS. If your app needs guaranteed offline-to-online sync everywhere, this API alone won't get you there — you'll want a fallback path that checks on next foreground launch regardless.

### Periodic Background Sync

The more ambitious sibling: `registration.periodicSync.register(tag, { minInterval })` wakes your service worker at intervals to refresh content in the background, so a news app has fresh articles cached before the user even opens it. Chromium only, requires the PWA to be installed (not just a tab), and the browser throttles or skips syncs entirely based on a rolling engagement score — stop using the app and the syncs quietly stop too. It's still marked experimental in the spec itself. Build for graceful absence, not for reliability.

### Background Fetch

For the "download a 400 MB podcast episode and keep going even if the user closes the app" case. `registration.backgroundFetch.fetch()` hands the browser a long-running download, which then shows a persistent, user-visible progress UI (the browser insists on this, for good reason — silent background downloads are a privacy and battery nightmare) and fires an event in the service worker on completion. Chromium only, still a WICG incubation spec rather than a W3C standard, and it had a real cross-origin data leak (CVE-2026-1504, patched in Chrome 144, January 2026) — worth knowing about if a security review ever asks why background-fetch permissions are locked down tighter than they used to be.

### Storage: Know What You're Allowed to Keep

`navigator.storage.estimate()` tells you how much of your storage quota is used; `navigator.storage.persist()` requests that the browser not silently evict your cached data under storage pressure (a real risk for anything relying on Cache API or IndexedDB for offline data — eviction happens without warning otherwise). Both are well supported across Chrome, Firefox, Edge, and Safari. This one's a rare case of near-universal agreement in this whole document, so use it.

### Knowing You're Offline At All

`navigator.onLine` plus the `online` / `offline` window events are the blunt instrument every browser has supported for over a decade: true/false, nothing about *how good* the connection is. The Network Information API (`navigator.connection`, `effectiveType`, `downlink`) would tell you more, but it's Chromium-and-Android only, was dropped from Safari and Firefox on privacy-fingerprinting grounds, and Chrome itself has trimmed how much detail it exposes over the years. Don't build a serious adaptive-loading strategy on top of it; treat it as an occasional hint on Chromium platforms and design your offline fallback around the blunt online/offline signal instead.

---

## Push and Notifications, the PWA Version

Push API and Notification API aren't new, but the PWA-specific wrinkle worth flagging: as of this writing, push works on iOS and iPadOS 16.4 and later — but *only* for a web app that's been added to the home screen through Safari's Share sheet. A Safari tab, even with permission granted, gets nothing. Android and desktop don't have this restriction; push works from an ordinary tab. Safari 18.4 added Declarative Web Push, a lighter mechanism that skips running your service worker's JavaScript just to display a notification — the browser reads a JSON payload directly, which is both faster and a smaller attack surface, at the cost of losing the ability to run custom logic before showing the notification.

If you're building for an EU audience specifically: Apple briefly gutted Home Screen web apps in the EU under DMA pressure in early 2024 (no standalone mode, no push, websites reduced to Safari-tab bookmarks), then reversed course within about three weeks after the predictable outcry. As of iOS 17.4 onward, EU users get the same PWA capabilities as everyone else. Worth knowing the history exists, because someone on your team will eventually ask "didn't Apple ban PWAs in Europe at some point," and the answer is "yes, for about three weeks, then no."

---

## The iOS Situation, Summarized

Since it keeps surfacing above rather than sitting in one place: iOS remains the platform where "PWA" means something narrower than it does everywhere else. No Background Sync, no Periodic Background Sync, no Background Fetch, no File Handling API, no share targets, no Window Controls Overlay, no `beforeinstallprompt`. Push works, but only once installed via the Share sheet. Badging works, but only with notification permission granted. iOS 26 quietly improved the baseline: sites added to the home screen now open as standalone web apps by default rather than requiring the old manifest dance to get there — a small but genuine win.

None of this is Apple being lazy. It's Apple keeping the capability gap between "web app" and "native app" wide on purpose, because that gap is also the App Store's revenue moat. Plan your feature matrix accordingly: build the full experience for Chromium and Android, and design iOS as a deliberately reduced but still functional tier, not an afterthought that breaks.

---

## Deprecated, Dying, or Already Dead

- **AppCache (`<html manifest="...">`)** — the pre-Service-Worker offline mechanism. Removed from every major browser years ago. If you find it in a legacy codebase, that codebase predates most of the people maintaining it.
- **Old-style install banners** — the pre-`beforeinstallprompt` browser-controlled banner UX. Superseded, not really usable as a targeted API anymore.
- **`navigator.connection.type` and the more granular Network Information fields** — progressively stripped down across browser versions for fingerprinting reasons. What's left (`effectiveType`, `downlink`) is a coarse approximation, and even that is Chromium-only.
- **Application Cache Events / `FileSystemDirectoryEntry`-style legacy file APIs** — covered in the File System installment of this series; same story, don't build anything new on them.

Nothing new *deprecated* in this specific category since our last check-in. This corner of the platform is more "things that never got built out" than "things that got torn down," which is its own kind of instructive.

---

## Vendor Süppchen

### Isolated Web Apps

Chrome's answer to "what if a web app needed native-app-level trust." IWAs are packaged as signed Web Bundles rather than fetched live over HTTPS, get their own `isolated-app://` scheme, and in exchange get access to high-trust APIs too dangerous to expose to the open web. Launched enterprise-only on managed ChromeOS, and as of Chrome 150 (mid-2026) extended to enterprise-managed Windows browsers too. Still nowhere near consumer-facing, still nowhere near cross-vendor. File this under "watch, don't build against yet" unless you're doing enterprise ChromeOS deployment work specifically.

### Declarative Web Push

Covered above under Push, worth repeating here because it's genuinely Safari's own initiative rather than a standards-body import: a JSON-only push payload format that skips executing service worker JavaScript for the common "just show a notification" case. Chrome and Firefox haven't committed to matching it yet.

### Web Bundles / Signed Web Bundles

The packaging format underneath Isolated Web Apps — bundle a whole app's HTML, JS, CSS, and assets into one signed, verifiable file. Origin Trial territory in Chromium, no cross-vendor traction. The kind of infrastructure piece that matters enormously if it succeeds and quietly disappears if it doesn't, and it's genuinely too early to tell which.

### Widgets Board (Windows)

Microsoft lets PWAs contribute a small widget to the Windows 11 Widgets Board via a manifest declaration and an Adaptive Cards template. Windows-only, Edge-specific tooling, essentially zero relevance outside a Windows-first product strategy. Mentioned here so you know it exists, not so you build for it.

---

## Where This Is Going

The trajectory is less "new capabilities arriving" and more "the existing capability list slowly, unevenly, filling in across vendors." Isolated Web Apps expanding beyond ChromeOS is the closest thing to a genuinely new direction — trusted, signed, native-adjacent web apps as a real deployment target rather than a thought experiment. Declarative Web Push suggests Apple is willing to lead on specific pieces of the PWA stack when it serves their battery/privacy priorities, even while sitting out entire categories (Background Sync, File Handling) that don't.

The realistic five-year bet: the Chromium/Android/Windows PWA story keeps getting richer and closer to native. iOS keeps closing individual, specific gaps (push, badging, standalone-by-default) while deliberately leaving the background-processing and OS-integration gaps open. Anyone shipping a cross-platform PWA in 2026 is still building two tiers, whether they admit it to themselves or not.

[^1]: To be fair, this is also just what "living standard, multiple independent implementers, no single vendor in charge" looks like from the inside. The alternative is one company deciding unilaterally what an app is allowed to do, and we've tried that model before. It has other problems.

---

## Quick Reference

| API | Chrome/Edge | Firefox | Safari (macOS) | Safari (iOS) |
|---|---|---|---|---|
| `beforeinstallprompt` | Yes | No | No | No |
| Window Controls Overlay | Yes | No | No | No |
| App Shortcuts (manifest) | Yes | Partial | No | No |
| File Handling API | Yes | No | No | No |
| `registerProtocolHandler` (runtime) | Yes | Yes | Yes | Yes |
| `protocol_handlers` (manifest) | Yes | No | No | No |
| Web Share (`navigator.share`) | Yes | Android only | Yes | Yes |
| Share Target (manifest) | Yes | No | No | No |
| Badging API | Yes (Win/Mac) | No | No | Yes (16.4+, needs notif. permission) |
| Background Sync | Yes | No | No | No |
| Periodic Background Sync | Yes (installed only) | No | No | No |
| Background Fetch | Yes | No | No | No |
| Storage `persist`/`estimate` | Yes | Yes | Yes | Yes |
| Push API | Yes (tab or installed) | Yes | Yes | Yes (installed only) |
| Declarative Web Push | No | No | Yes (18.4+) | Yes (18.4+) |
