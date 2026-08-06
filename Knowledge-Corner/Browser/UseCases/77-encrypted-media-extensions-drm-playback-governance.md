# Use Case 77: Encrypted Media Extensions for DRM Playback Governance

Licensed video playback is not "just play a video." It's DRM, key systems, license flows, and policy enforcement, all sitting underneath what looks to the user like a single play button.

## Why Playback Success Depends on Things Outside the App's Control

Browser, OS, and DRM key-system combinations differ meaningfully, and playback success depends on license-service behavior, Content Decryption Module (CDM) availability, and device policy constraints — several layers the app doesn't fully control, all of which have to line up correctly for a single video to start playing.

## The User Story, Stripped of Domain

A user can:

- play licensed, protected media reliably,
- recover from a license or session interruption without losing their place,
- receive a clear reason when playback is blocked, rather than a generic error code.

## Core Browser Technologies

| API | Job | Reference |
|---|---|---|
| Encrypted Media Extensions (EME) | Negotiates key systems and manages license sessions | [MDN – Encrypted Media Extensions API](https://developer.mozilla.org/en-US/docs/Web/API/Encrypted_Media_Extensions_API) |
| Media Source Extensions (MSE) | Adaptive streaming pipeline, where the content requires it | [MDN – Media Source Extensions API](https://developer.mozilla.org/en-US/docs/Web/API/Media_Source_Extensions_API) |
| DRM license acquisition/renewal service | The backend counterpart EME's client-side flow depends on | [W3C EME - License and Key Retrieval](https://www.w3.org/TR/encrypted-media-2/#license-and-key-retrieval), [Shaka Player - License Server Authentication](https://shaka-player-demo.appspot.com/docs/api/tutorial-license-server-auth.html) |

## The Browser Reality Check

Key system availability differs meaningfully by browser and platform — Widevine, PlayReady, and FairPlay are not interchangeable, and each browser supports a different subset depending on OS and even specific device hardware. A player that hard-codes assumptions about which key system is available will work in whichever environment it was built against and fail unpredictably everywhere else.

## What Breaks First

- Key-system assumptions hard-coded to one environment, breaking the moment the player runs somewhere with a different available CDM.
- Vague playback errors with no operational diagnostics, leaving support unable to tell a license failure from a network failure from a device policy block.
- No fallback at all for unsupported device/browser combinations, presenting a broken player instead of a clear, actionable message.

## Minimal Technical Blueprint

```javascript
async function setupProtectedPlayback(video, keySystemCandidates) {
  for (const keySystem of keySystemCandidates) { // ordered by preference, tried in sequence
    try {
      const access = await navigator.requestMediaKeySystemAccess(keySystem, configs);
      const mediaKeys = await access.createMediaKeys();
      await video.setMediaKeys(mediaKeys);
      return keySystem; // succeeded — stop here
    } catch { continue; } // this key system isn't available, try the next
  }
  throw new PlaybackUnsupportedError(); // maps to a real user-facing message, not a generic error
}
```

1. Detect supported key systems and robustness levels at runtime, trying candidates in order rather than assuming one is universally available.
2. Keep the playback and DRM session state machine explicit — license requested, license granted, session active, session expired — not an implicit tangle inside the player's event handlers.
3. Implement license retry and renewal with bounded backoff, since a license service hiccup shouldn't immediately fail playback outright.
4. Map technical failures to user-meaningful recovery messaging — "this device isn't licensed for this content" reads very differently to a user than a raw error code, and it's also more actionable for support.

## Decision Summary

EME playback requires strict compatibility governance and real operational observability, not just a player UI sitting on top and hoping the key system negotiation works out. The complexity here is genuinely proportional to what's at stake — a licensing agreement, not just a video tag.
