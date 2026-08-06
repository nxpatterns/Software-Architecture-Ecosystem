# Use Case 09: Encrypted Offline Notes App

Most teams hear "offline notes" and think IndexedDB plus a textarea. Then someone says "encrypt it," someone else says "the key must survive a restart," and the browser turns into a small, opinionated key vault with an eviction policy. This is not a serverless security shortcut. It is a local-data system that needs an explicit loss-and-recovery story.

## Why this is a good next "hard topic"

Because client-side encryption makes the browser responsible for content, cryptography, key lifecycle, and storage durability at the same time. The demo is tiny. The failure modes are not.

## User Story (Abstracted)

A user can:

- create, edit, search, and delete private notes while offline,
- lock the notes app and unlock it locally,
- close and reopen the browser without re-entering every note,
- keep note content encrypted before it reaches local browser storage,
- export an encrypted recovery copy when they choose,
- and clear all local content from a shared device.

We do not care which notes.
Could be meeting notes, a field journal, a private checklist, or a secure
scratchpad. Same pattern: useful local data, no plaintext at rest in app storage.

## Core Browser Technologies

- `Web Crypto API` (`SubtleCrypto`): generate or derive keys, then encrypt each note payload with authenticated encryption such as AES-GCM. Web Crypto is a secure-context API ([MDN](https://developer.mozilla.org/en-US/docs/Web/API/Web_Crypto_API)).
- `CryptoKey` with `extractable: false`: lets script use the device key without
  allowing `exportKey()` or `wrapKey()` to extract it ([MDN](https://developer.mozilla.org/en-US/docs/Web/API/CryptoKey/extractable)).
- `IndexedDB`: store encrypted note records, IVs, schema versions, and possibly
  the opaque `CryptoKey`; IndexedDB is scoped to the origin ([MDN](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API)).
- `Structured clone`: the mechanism IndexedDB uses to store complex values,
  including `CryptoKey` ([MDN](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Structured_clone_algorithm)).
- `Storage API` (`estimate()`, `persisted()`, `persist()`): measure pressure and request a more durable storage mode; a request may still be denied under browser-specific rules ([MDN](https://developer.mozilla.org/en-US/docs/Web/API/StorageManager/persist)).
- `Web Workers` (recommended): keep encryption, indexing, and import/export
  work off the typing path; Web Crypto is available in workers ([MDN](https://developer.mozilla.org/en-US/docs/Web/API/Web_Crypto_API)).
- `Web Authentication API` or a local PIN (optional): add a user-presence gate
  before a key is made available. This is unlock UX, not a replacement for
  encryption; WebAuthn also requires HTTPS ([MDN](https://developer.mozilla.org/en-US/docs/Web/API/Web_Authentication_API)).

## Browser Reality Check

### Desktop

- Chromium (Chrome, Edge, Arc): IndexedDB and `StorageManager.persist()` are supported, so this is the least surprising route. Still check the returned persistence result; requesting it is not receiving it ([IndexedDB](https://caniuse.com/mdn-api_indexeddb), [Storage API](https://caniuse.com/mdn-api_storagemanager_persist)).
- Firefox: the same IndexedDB and persistence-request primitives are supported ([IndexedDB](https://caniuse.com/mdn-api_indexeddb), [Storage API](https://caniuse.com/mdn-api_storagemanager_persist)).
  Treat a new profile, private session, cleared site data, or a failed key probe
  as a fresh vault, not as a minor UI inconvenience.
- Safari (macOS): IndexedDB and `persist()` are supported in current Safari lines ([IndexedDB](https://caniuse.com/mdn-api_indexeddb), [Storage API](https://caniuse.com/mdn-api_storagemanager_persist)).
  The important bit is retention: WebKit defaults origins to best-effort storage
  and can evict an entire origin under quota pressure, system pressure, or lack
  of interaction; its normal ordering is least-recently-used
  ([WebKit storage policy](https://webkit.org/blog/14403/updates-to-storage-policy/)).

### Mobile

- Android Chromium: the same core IndexedDB, Web Crypto, and Storage API model applies; test the actual phone with low free space, not just desktop DevTools ([IndexedDB](https://caniuse.com/mdn-api_indexeddb), [Web Crypto](https://developer.mozilla.org/en-US/docs/Web/API/Web_Crypto_API)).
- iOS Safari / WebKit-based browsers: this is where "persistent local vault" stops being a slogan. WebKit says its storage policy covers IndexedDB, defaults origins to best-effort, and may delete all data for an origin; persistent mode is only an opt-in request evaluated with heuristics such as Home Screen use ([WebKit storage policy](https://webkit.org/blog/14403/updates-to-storage-policy/)).
  A missing IndexedDB record can therefore mean the key is gone as well as the
  ciphertext. Plan for recovery, not a clever retry.

Short version: non-extractable keys are useful.
Browser storage is still not a safe deposit box.

## What Usually Breaks First

- Treating `extractable: false` as "safe against malicious script." It blocks
  key export, not an XSS payload that can call decrypt while the vault is open
  ([MDN](https://developer.mozilla.org/en-US/docs/Web/API/CryptoKey/extractable)).
- Encrypting note text but forgetting titles, tags, search indexes, attachments, undo history, or error telemetry.
- Storing one IV for every AES-GCM encryption instead of generating a fresh IV for every ciphertext.
- Assuming a `persist()` call succeeded without checking its Boolean result
  ([MDN](https://developer.mozilla.org/en-US/docs/Web/API/StorageManager/persist)).
- Treating IndexedDB as permanent on iOS Safari, then discovering an evicted
  origin has also deleted the only device key
  ([WebKit storage policy](https://webkit.org/blog/14403/updates-to-storage-policy/)).
- Calling a PIN "encryption" while storing its raw value, or a fast hash, next
  to the ciphertext.

The browser will happily store your assumptions. It does not preserve them.

## Minimal Technical Blueprint

1. Serve a static, tightly controlled app over HTTPS; fail closed if `crypto.subtle` or IndexedDB is unavailable.
2. Generate a random AES-GCM vault key with `extractable: false`, or derive a
   separate wrapping key from a user PIN using a random salt and a deliberately
   expensive KDF.
3. Store the opaque `CryptoKey` directly in IndexedDB for the device-tied mode;
   the Web Crypto standard explicitly allows serializable key objects to be
   stored there without exposing key material to script
   ([Web Crypto Level 2](https://www.w3.org/TR/webcrypto-2/)).
4. For each note revision, generate a fresh IV, encrypt the complete note
   envelope, and store only ciphertext, IV, algorithm version, and a random
   record identifier in IndexedDB.
5. Keep plaintext only in memory while the vault is unlocked; clear editor, worker, and search caches on an explicit lock or idle timeout.
6. On first meaningful use, call `navigator.storage.persisted()` and then
   `persist()` if needed; record the result, and show an honest recovery warning
   if storage remains best-effort ([MDN](https://developer.mozilla.org/en-US/docs/Web/API/StorageManager/persist)).
7. Run a startup probe after upgrades: load the saved key, decrypt a small known
   record, and treat failure as restore-or-reset flow, never as an empty vault.
8. Offer an explicit export of one authenticated, encrypted vault file and an
   equally explicit "destroy local vault" action.

## Compatibility Strategy (Pragmatic)

- Baseline mode (all modern browsers): local encrypted notes, a device-tied opaque key where the key-store-reload probe succeeds, explicit lock, and an encrypted export. IndexedDB and Web Crypto are broadly established platform features ([MDN: IndexedDB](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API), [MDN: Web Crypto](https://developer.mozilla.org/en-US/docs/Web/API/Web_Crypto_API)).
- Enhanced mode (supporting browsers): request persistent storage, add
  WebAuthn-gated unlock, use a worker-backed encrypted search index, and offer
  safer recovery UX when persistent mode is actually granted
  ([MDN](https://developer.mozilla.org/en-US/docs/Web/API/StorageManager/persist)).

This is progressive enhancement, not a promise that local data outlives the
operating system's storage emergency.

## Security and Compliance Notes

- Define the threat model before choosing an unlock design: stolen phone, shared profile, browser extension, XSS, and malicious update are different problems with different bad days.
- Keep keys non-extractable by default and scope their usages narrowly. Do not put the vault key in `localStorage`, a URL fragment, analytics, logs, or an exported debug object.
- Authenticate ciphertext with AES-GCM and bind record/version metadata as
  additional authenticated data where it matters. Encryption without integrity
  is a very expensive way to store corruption.
- Treat plaintext as sensitive in memory too. Disable third-party scripts, ship a strict Content Security Policy, and make the app shell update path boringly trustworthy.
- If notes must survive device loss, the backup may leave the device only as an
  encrypted, user-controlled blob. "Never unencrypted" is a transport and
  storage rule, not a ban on recovery.

Client-side encryption reduces who can read the notes. It does not repeal data
loss, XSS, or a user forgetting their PIN.

## Test Matrix You Actually Need

- Desktop Chrome/Edge: create notes, restart the browser, upgrade the app, and
  verify the saved key can decrypt existing ciphertext.
- Firefox latest: repeat key-store-reload, lock, clear-site-data, and encrypted
  export/import flows.
- Safari macOS latest: test `persist()` result, then test behavior after low
  disk space and a long period without using the site.
- Android Chromium on a real lower-storage phone: fill storage, background the browser, reboot, then reopen the vault.
- iOS Safari on a real device: same low-storage and reopen tests, plus an
  explicit eviction/recovery drill. Do not call an empty database "first run"
  until the key probe agrees.
- Security drill: inject a harmless test script in a staging build and confirm CSP, locking, and telemetry controls do not turn decrypted notes into logs.

If the recovery flow has never been rehearsed on iOS, it is not a recovery flow.
It is a prayer with a button.

## Decision Summary

Use this pattern when:

- notes must remain useful with no network,
- plaintext must not be written to browser storage or sent to a service,
- users accept device-bound access and an explicit encrypted recovery export.

Avoid this pattern when:

- a user must recover every note after arbitrary browser-data deletion without keeping an encrypted backup somewhere,
- the threat model includes untrusted scripts on the same origin and the team
  cannot fund strict supply-chain and XSS controls,
- cross-device collaboration is the real requirement. That needs a deliberately
  designed encrypted sync system, not optimism.

Because yes, the browser can hold a local encrypted vault.
And no, it cannot make its own storage policy disappear.

## Next Logical Topic

After this, the best follow-up is:
**Installable PWA with push notifications**
(service workers, permission timing, VAPID, and the one part that actually needs
a server).
