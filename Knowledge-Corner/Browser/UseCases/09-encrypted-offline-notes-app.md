# Use Case 09: Encrypted Offline Notes App

"Offline notes" sounds like IndexedDB plus a textarea. Then someone says "encrypt it," someone else says "the key must survive a restart," and the browser turns into a small, opinionated key vault with an eviction policy nobody consulted you about.

This is not a serverless security shortcut. It's a local-data system that needs an explicit loss-and-recovery story, because the browser will absolutely delete your vault one day and it will not apologize.

## Why the Demo Is Tiny and the Failure Modes Aren't

Client-side encryption makes the browser responsible for content, cryptography, key lifecycle, and storage durability, all at once. Four different ways to fail, none of them visible until the day someone's phone runs low on space.

## The User Story, Stripped of Domain

- create, edit, search, delete private notes while offline,
- lock the app and unlock it locally,
- close and reopen the browser without retyping every note,
- keep content encrypted before it ever touches local storage,
- export an encrypted recovery copy on demand,
- clear all local content from a shared device.

Meeting notes, a field journal, a private checklist — same pattern: useful local data, zero plaintext at rest.

## Core Browser Technologies

| API | Job | Reference |
|---|---|---|
| Web Crypto (`SubtleCrypto`) | Generate/derive keys, encrypt with AES-GCM | [MDN](https://developer.mozilla.org/en-US/docs/Web/API/Web_Crypto_API) |
| `CryptoKey` with `extractable: false` | Usable by script, never exportable by script | [MDN](https://developer.mozilla.org/en-US/docs/Web/API/CryptoKey/extractable) |
| IndexedDB | Encrypted note records, IVs, schema version, origin-scoped | [MDN](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API) |
| Structured clone | The mechanism IndexedDB uses to persist a `CryptoKey` object | MDN |
| `StorageManager.persist()`/`persisted()` | Request durable storage; a request is not a guarantee | [MDN](https://developer.mozilla.org/en-US/docs/Web/API/StorageManager/persist) |
| Web Workers | Keep encryption and indexing off the typing path | — |
| WebAuthn or a local PIN (optional) | Unlock UX gate — not a substitute for the encryption itself | MDN |

## The Browser Reality Check

Non-extractable keys are genuinely useful. Browser storage is still not a safe deposit box.

Chromium and Firefox both support IndexedDB and `StorageManager.persist()` cleanly.<sup>[1]</sup> Still check the returned boolean — requesting persistence is not receiving it, and code that assumes success is code that finds out the hard way.

Safari supports the same primitives, but retention is the real story: WebKit defaults origins to best-effort storage and can evict an entire origin under quota pressure, system pressure, or plain inactivity, in roughly least-recently-used order.<sup>[2]</sup>

**iOS Safari is where "persistent local vault" stops being a slogan.** WebKit's storage policy covers IndexedDB the same way, defaults to best-effort, and persistent mode is only an opt-in request evaluated against heuristics like Home Screen usage.<sup>[2]</sup> A missing IndexedDB record on iOS doesn't just mean lost ciphertext — it can mean the key is gone too, in the same eviction. Plan for recovery. Not a clever retry loop that assumes the data is still there somewhere.

## What Breaks First

- Treating `extractable: false` as protection against malicious script. It blocks key *export*, not an XSS payload calling `decrypt()` while the vault sits open.<sup>[3]</sup>
- Encrypting note text but forgetting titles, tags, search indexes, attachments, undo history, and error telemetry — the metadata that tells the whole story even without the body.
- Reusing one IV across every AES-GCM encryption instead of generating a fresh one per ciphertext. AES-GCM with a reused IV is not encryption, it's a puzzle with a known solution.
- Assuming `persist()` succeeded without checking its actual return value.
- Treating IndexedDB as permanent on iOS Safari, then discovering an evicted origin took the device key with it.<sup>[2]</sup>
- Calling a PIN "encryption" while storing its raw value, or a fast unsalted hash, right next to the ciphertext it's supposedly protecting.

The browser will happily store your assumptions. It will not preserve them.

## Minimal Technical Blueprint

```javascript
async function encryptNote(vaultKey, note) {
  const iv = crypto.getRandomValues(new Uint8Array(12)); // fresh, every single time
  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    vaultKey,
    new TextEncoder().encode(JSON.stringify(note))
  );
  return { ciphertext, iv, recordId: crypto.randomUUID(), version: 1 };
  // plaintext never leaves this function's scope
}
```

1. Serve a static, tightly controlled app over HTTPS. Fail closed if `crypto.subtle` or IndexedDB is unavailable — don't degrade silently into plaintext.
2. Generate a random AES-GCM vault key with `extractable: false`, or derive a wrapping key from a user PIN through a random salt and a deliberately expensive KDF.
3. Store the opaque `CryptoKey` directly in IndexedDB for device-tied mode — the Web Crypto spec explicitly permits storing serializable key objects there without exposing key material to script.<sup>[4]</sup>
4. For every note revision: fresh IV, encrypt the full note envelope, store only ciphertext, IV, algorithm version, and a random record ID.
5. Keep plaintext in memory only while the vault is unlocked. Clear editor, worker, and search caches on explicit lock or idle timeout.
6. On first meaningful use, call `persisted()` then `persist()` if needed. Record the actual result and show an honest recovery warning when storage stays best-effort.
7. Run a startup probe after every app upgrade: load the saved key, decrypt one small known record, treat failure as restore-or-reset — never silently render an "empty vault."
8. Offer an explicit export of one authenticated, encrypted vault file, and an equally explicit "destroy local vault" action. Both need to actually work, not just exist in the menu.

## Compatibility Strategy

**Baseline:** local encrypted notes, a device-tied opaque key where the key-reload probe succeeds, explicit lock, encrypted export. IndexedDB and Web Crypto are broadly established.

**Enhanced:** request persistent storage, add WebAuthn-gated unlock, run a worker-backed encrypted search index, offer safer recovery UX when persistence is actually granted.

Progressive enhancement — not a promise that local data outlives an operating system's storage emergency.

## Security and Compliance

Define the threat model before designing the unlock: stolen phone, shared profile, malicious browser extension, XSS, malicious update — four genuinely different bad days requiring four different mitigations, not one PIN screen to rule them all.

Keep keys non-extractable and scoped narrowly. Never let the vault key touch `localStorage`, a URL fragment, analytics, logs, or a debug export — all four have happened somewhere, in production, to a team that thought it couldn't. Authenticate ciphertext with AES-GCM and bind record/version metadata as additional authenticated data where it matters — encryption without integrity is an expensive way to store corruption and call it security.

If notes must survive device loss, the backup leaves the device only as an encrypted, user-controlled blob. "Never unencrypted" is a transport-and-storage rule. It is not a ban on recovery existing at all.

## Test Matrix You Actually Need

- Desktop Chrome/Edge: create notes, restart, upgrade the app, confirm the saved key still decrypts existing ciphertext.
- Firefox: same key-reload, lock, clear-site-data, and encrypted export/import cycle.
- Safari macOS: test the actual `persist()` result, then behavior under low disk space and a long idle period.
- Android real device, low storage: fill storage, background, reboot, reopen the vault.
- iOS real device: same low-storage and reopen tests, plus a deliberate eviction/recovery drill. Don't call an empty database "first run" until the key probe agrees with you.
- Security drill: inject a harmless test script into a staging build, confirm CSP and locking actually stop decrypted notes from leaking into logs.

If the recovery flow has never been rehearsed on iOS, it isn't a recovery flow. It's a prayer with a button.

## Decision Summary

Use this when notes must stay useful with no network, when plaintext must never touch browser storage or a server, and when users accept device-bound access plus an explicit encrypted export as their recovery path.

Skip it when users must recover every note after arbitrary browser-data deletion with no encrypted backup anywhere, when the threat model includes untrusted same-origin scripts and nobody's funding real supply-chain and XSS controls, or when cross-device collaboration is the actual requirement — that needs a deliberately designed encrypted sync system, not optimism wearing a lock icon.

The browser can hold a local encrypted vault. It cannot make its own storage eviction policy disappear just because your app is well-intentioned.

---

[1]: IndexedDB and Storage API support, [caniuse – IndexedDB](https://caniuse.com/mdn-api_indexeddb), [caniuse – persist()](https://caniuse.com/mdn-api_storagemanager_persist).
[2]: WebKit storage eviction policy, [WebKit Blog](https://webkit.org/blog/14403/updates-to-storage-policy/).
[3]: `extractable: false` scope, [MDN – CryptoKey.extractable](https://developer.mozilla.org/en-US/docs/Web/API/CryptoKey/extractable).
[4]: Storing serializable `CryptoKey` objects, [W3C Web Crypto API Level 2](https://www.w3.org/TR/webcrypto-2/).
