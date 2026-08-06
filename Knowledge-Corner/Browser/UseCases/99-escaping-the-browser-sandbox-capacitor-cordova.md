# Use Case 99: Where Browser Capability Ends — Capacitor, Cordova, and the Exit From the Sandbox

Two years ago, someone built a web app that turned on a phone's flashlight. Everyone told them it couldn't be done. It got done anyway, with a library called Capacitor. Nobody was lying and nobody was wrong — they were just answering two different questions without realizing it.

"Can a website turn on the flashlight?" No. Use Case 97 covers exactly why: `MediaStreamTrack`'s torch constraint works on Chrome for Android and nowhere else that matters — not iOS Safari, not Firefox for Android, not desktop. That's the ceiling of the browser sandbox, and it's a real, permanent ceiling, not a bug waiting for a patch.

"Can an app built with web technology turn on the flashlight?" Completely different question. And the answer has been yes for over a decade.

## The Whole Deck Was a Story About a Fence

Every "Chromium-only," every "iOS Safari doesn't expose this," every "requires a user gesture," every "no fallback exists" in the ninety-eight use cases before this one — all of it was the browser sandbox doing exactly what it was designed to do. A web page runs code from a URL nobody vetted, on a device the user trusts, and the sandbox exists to make sure that page can't quietly turn the microphone on, read the whole contact list, or brick the phone. That's not an accident of browser politics. That's the entire safety model the open web runs on, and it's a genuinely good one — it's why you can click a link from a stranger without installing a virus.

Capacitor — and its older ancestor Cordova, née PhoneGap, dating back to 2009 — doesn't defeat that sandbox. It steps outside it entirely. The trick is almost embarrassingly simple once you see it: stop being a website. Become an app.

## How the Trick Actually Works

A Capacitor app isn't a browser tab with delusions of grandeur. It's a real native app — a genuine `.ipa` on iOS, a genuine `.apk`/`.aab` on Android — that happens to render its UI inside a native WebView component (WKWebView on iOS, the Android System WebView on Android) instead of a stack of native `UIView`/`View` widgets. Your HTML, CSS, and JavaScript run inside that WebView exactly the way they'd run in Safari or Chrome. But the WebView isn't the whole app. It's one view, embedded inside a real native shell that Xcode or Android Studio compiled, signed, and shipped through an app store's review process.

The part that actually breaks the sandbox is the bridge. Capacitor registers native plugins — real Swift and Kotlin code, compiled into the app binary — and exposes each one to the JavaScript running in the WebView through a message-passing bridge. Your JS calls something that looks exactly like calling a Promise-returning function:

```javascript
import { Torch } from '@capacitor-community/torch';

async function toggleFlashlight() {
  const { enabled } = await Torch.isEnabled();
  enabled ? await Torch.disable() : await Torch.enable();
}
```

Underneath that innocent-looking call, the bridge serializes the request, hands it to the native layer, and on iOS that native Swift code calls straight into `AVCaptureDevice.torchMode` — the actual Apple framework governing camera hardware, the one iOS Safari deliberately never exposes to a web page. On Android it's the equivalent Camera2 API call. Same JavaScript-looking function. Completely different execution path. No browser sandbox anywhere in the chain, because there's no browser — just a WebView that happens to be really good at running your code, sitting inside an app that has whatever native permission the user granted it at install time.

Cordova pioneered this pattern in 2009 and it's still around, still maintained, still the right call for teams with deep legacy plugin investments. Capacitor, built by the Ionic team from 2018 onward as what they call — accurately — a spiritual successor, modernized the architecture: it doesn't copy plugin source into your project and mangle it the way Cordova does, it treats native and web code as genuinely separate concerns, installed through each platform's own dependency manager (CocoaPods on iOS, Gradle on Android), so you can open the native project in real Xcode or Android Studio and debug it like the real native app it actually is. By most industry counts, it's now the default choice for new hybrid projects, with Cordova holding on mostly in long-lived legacy codebases.

Worth naming the neighbors too, so nobody confuses them: React Native and Flutter take a different approach entirely — no WebView at all, your code compiles down to (or drives) real native UI components directly, which is faster and more "native-feeling" but means leaving HTML/CSS behind completely. Electron is this same WebView-bridge idea's desktop sibling, wrapping a Chromium instance instead of a mobile WebView. Capacitor's whole pitch is narrower and, for a team that already has a web app: keep the web app. Wrap it. Bridge the gaps.

## What This Actually Buys You, Use Case by Use Case

This isn't a vague "more power" story. It's a specific, addressable list of exactly the ceilings this deck spent ninety-eight files documenting.

**The flashlight, obviously (Use Case 97).** iOS Safari's restriction on torch access isn't a missing feature, it's policy. A native plugin calling `AVCaptureDevice.torchMode` directly doesn't ask Safari's permission, because it was never Safari's decision to begin with.

**Background execution that actually survives (Use Case 18).** Background Sync and Background Fetch are Chromium-only and still constrained by aggressive OS-level tab suspension the moment you're not looking at the page. A Capacitor app can register real background modes with iOS and Android — background location updates, geofencing that wakes the app from a fully terminated state, background audio sessions that keep playing after the screen locks — because it's asking the OS for a background execution entitlement a website was never eligible to request.

**Push notifications that don't require a Home Screen ritual (Use Case 10).** Web Push on iOS demands the user add the site to their Home Screen first and launch it from there before a permission prompt is even legal to show. A native app just asks for notification permission, once, the way every app on the phone does, and gets real APNs/FCM delivery with no onboarding dance required.

**Storage that isn't hostage to Safari's eviction policy (Use Case 20).** The entire nightmare of that use case — best-effort storage, LRU eviction, a vault key disappearing along with its IndexedDB record — is a browser storage-quota problem. A native SQLite plugin writing to the app's own sandboxed filesystem doesn't negotiate storage with a browser eviction heuristic. It just persists, the same way any other app's data persists, until the user deletes the app.

**Bluetooth and NFC with no per-connection nagging (Use Cases 24, 52).** Web Bluetooth and Web NFC exist almost nowhere outside Chrome, and even there, every connection re-triggers a user-gesture-gated chooser dialog. A native BLE plugin can maintain a persistent background connection, scan continuously, and — on Android — use Host Card Emulation to make the phone itself act as an NFC tag, something no browser API attempts.

**File System Access without the picker ceremony, and without the Chromium ceiling (Use Case 68).** `showDirectoryPicker()` doesn't exist on Firefox or Safari at all. A native filesystem plugin reads and writes anywhere within the app's sandbox on every platform, with no picker dialog required for the app's own data.

**Haptics with an actual engine behind them, not a fading API (Use Case 53).** The Vibration API is unsupported on Safari and was removed from Firefox entirely. Apple's native Core Haptics and `UIFeedbackGenerator`, reachable through a Capacitor haptics plugin, give you the same nuanced tap-tap-thud feedback native iOS apps use — richer than `navigator.vibrate(200)` ever offered even at its best.

**Full contacts, full calendar, native share sheets, camera with manual controls.** The Contact Picker API (Use Case 51) hands over one consent-gated contact at a time, Android-only. A native contacts plugin reads and writes the address book the way a real contacts-management app does. Camera access through `getUserMedia()` gets you a video stream and some constraints; a native camera plugin gets you manual focus, exposure, multiple lenses, and RAW capture.

**Distribution and OS-level presence.** No PWA install-prompt negotiation, no "add to Home Screen" nagging, no browser chrome ever visible. A real icon, a real entry in Settings → Notifications, App Store and Play Store discoverability, widgets, Live Activities, App Clips — the whole OS-integration surface a website can only approximate.

## What It Costs You, Because Nothing Here Is Free

Say all of that out loud in a room full of enterprise architects and someone will ask, reasonably, why anyone still builds plain websites. Here's why.

**The App Store is now your release manager.** Every update — even a JavaScript-only bug fix in some interpretations of App Store policy — can be subject to review. Apple's review timeline is not your sprint cadence. Ship a bad build and you're waiting on a stranger's approval to fix it, not deploying to production the moment CI goes green.

**"Just send a link" is gone.** A URL is the web's entire distribution model — click it, it works, no gatekeeper. A Capacitor app needs to be installed, which means App Store friction, Play Store friction, and a user willing to tap "Install" before they've seen any value at all.

**You now maintain two extra native projects.** The Xcode project and the Android Studio project are real projects, with real native dependencies, real signing certificates, real OS-version compatibility matrices — Cordova and Capacitor upgrades have historically been genuine migration events, not `npm update`. Someone on the team needs to actually understand Swift and Kotlin well enough to debug a native plugin when the bridge itself is the thing that's broken.

**SEO, deep linking, and the open web's discoverability model mostly don't apply.** Search engines don't crawl app binaries. A shared link to a specific screen inside the app needs universal links or app links configured correctly on both platforms, which is its own project.

**Cost.** Apple's developer program is an annual fee. Selling anything inside the app invites the platform's commission on in-app purchases. None of that exists for a website.

## The Actual Decision, Not a Sales Pitch for Either Side

None of this is an argument that Capacitor is better than the browser, or that the ninety-eight use cases before this one were somehow the wrong approach. They weren't. Browser-first is correct by default — instant distribution, zero install friction, one codebase that reaches literally every device with a URL bar, and a security model that lets a stranger's link be safe to click. That default should not move for convenience.

The move to a hybrid-native shell is correct when, and only when, a *specific, named capability* is a genuine hard requirement the sandbox cannot deliver at any acceptable quality — not "wouldn't it be nice to have the flashlight," but "our field technicians need a working torch to read serial numbers in a warehouse with the lights off, and there is no browser-only path to that on the iPhones we've already issued them." That's a business requirement forcing an architecture decision, not an architecture decision looking for a justification.

Every capability in the list above has a name and a use case number attached to it in this deck for a reason: before reaching for Capacitor, name exactly which browser ceiling is actually blocking the product, and confirm it's a ceiling — Chromium-only, iOS-absent, storage-evictable, background-execution-limited — rather than a browser feature nobody on the team had found yet. If ninety-eight files of browser platform reality didn't have an answer, this is where the answer lives. If they did have an answer, use it — the sandbox is a feature, not a limitation to route around out of habit.

That's the whole deck, front to back: ninety-eight ways to work brilliantly inside the fence, and one way to know exactly when it's time to open the gate instead.
