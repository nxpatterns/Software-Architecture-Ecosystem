# Use Case 63: Background Fetch for Large Transfer Resilience

Users close tabs. Large downloads either keep going without them, or the support queue keeps growing with "my upload disappeared" tickets. Background Fetch exists for the first outcome — where the browser actually supports it.

This covers resilient large-file transfer workflows using Background Fetch where available, and the fallback that carries the rest of the audience.

## Why "Background" Doesn't Mean Guaranteed Everywhere

Support is limited, lifecycle semantics differ meaningfully from a classic `fetch()` call, and teams routinely assume "background" means guaranteed execution on every browser — which is exactly the assumption Use Case 18 already warned against for background APIs generally, and it applies here with the same force.

## The User Story, Stripped of Domain

A user can:

- start a large download or upload,
- leave the page without losing progress, where the platform supports it,
- resume or recover cleanly when it doesn't.

## Core Browser Technologies

| API | Job | Reference |
|---|---|---|
| Background Fetch API | Persists a large transfer across page lifecycle, service-worker-driven | [MDN – Background Fetch API](https://developer.mozilla.org/en-US/docs/Web/API/Background_Fetch_API) |
| Service worker event handling | Owns the fetch lifecycle outside the page itself | [MDN - Service Worker API](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API), [MDN - Background Fetch API events](https://developer.mozilla.org/en-US/docs/Web/API/Background_Fetch_API#interfaces) |
| Durable transfer metadata + resumable chunking | Survives a browser restart, not just a tab close | [MDN - IndexedDB API](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API), [MDN - HTTP range requests](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Range_requests) |

## The Browser Reality Check

This has a limited practical support footprint — it's a Chromium-family feature with no meaningful presence in Firefox or Safari. A robust fallback — a foreground resumable transfer the user actively keeps the tab open for — isn't optional; for a real share of users, it's the entire mechanism. Never make mission-critical transfer correctness depend solely on Background Fetch actually being available.

## What Breaks First

- No fallback at all for unsupported browsers, leaving the majority of the browser landscape with a broken upload button.
- Missing integrity checks after a resumed transfer, so a chunk that got corrupted mid-network-drop goes undetected until the final file fails to open.
- Oversized retry storms on a flaky network, hammering the server with repeated attempts instead of backing off sensibly.
- Poor user visibility into transfer state, leaving someone staring at a spinner with no idea whether anything is actually happening.

## Minimal Technical Blueprint

```javascript
async function startResilientTransfer(file) {
  if (!('BackgroundFetchManager' in self)) {
    return startForegroundResumableTransfer(file); // real fallback, chunked and checksummed too
  }
  const registration = await swRegistration.backgroundFetch.fetch(
    `transfer-${crypto.randomUUID()}`,
    chunkFile(file), // chunked regardless of path chosen
    { title: 'Uploading', downloadTotal: file.size }
  );
  persistTransferMetadata(registration.id); // survives a browser restart, not just a tab close
}
```

1. Capability-check first and select the transfer mode explicitly — Background Fetch where supported, a foreground resumable path everywhere else.
2. Use chunked transfer with checksums and idempotency regardless of which mode is active, so a corrupted or duplicated chunk is detectable either way.
3. Persist transfer state outside volatile memory — a transfer that only lives in a JS variable doesn't survive the scenarios this use case exists for.
4. Expose clear progress and an explicit recovery action, so the user has something to act on if the transfer stalls rather than a spinner with no information.
5. Reconcile server-side and client-side transfer state on reopen, confirming what the server actually received before assuming the transfer needs to restart from zero.

## Test Matrix You Actually Need

- The unsupported-browser fallback path, tested as thoroughly as the Background Fetch path itself.
- Abrupt tab close and full browser restart, both tested separately.
- A flaky network with repeated interruptions, deliberately induced.
- Duplicate or replayed chunk handling, confirming the idempotency logic actually holds under a forced retry.

## Decision Summary

Background Fetch is valuable acceleration where it exists. It is not a universal foundation to build correctness on top of — design the resumability and reconciliation logic first, as something that works with or without the API, and treat Background Fetch as the enhancement it actually is.
