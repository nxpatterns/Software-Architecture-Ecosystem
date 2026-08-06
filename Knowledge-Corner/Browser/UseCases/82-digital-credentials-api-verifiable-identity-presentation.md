# Use Case 82: Digital Credentials API for Verifiable Identity Presentation

A user needs to prove they're over 18, or present a driving license, or verify their identity for a regulated service. Today that usually means uploading a photo of an ID document to a website and hoping it's handled responsibly. The Digital Credentials API replaces that entirely: the browser asks the user's digital wallet for a specific, minimal, cryptographically verifiable claim — and nothing more than that claim ever leaves the device.

## Why This Isn't a Future Use Case Anymore

This shipped. Chrome enabled the Digital Credentials API by default starting in Chrome 141 (October 2025). iOS 26 added Safari support at the same time. Firefox landed baseline support in Firefox 149 in Q1 2026.<sup>[1][2]</sup> The EU is the reason this matters right now, not eventually: the EUDI (European Digital Identity) Wallet Architecture Reference Framework conditionally requires that EUDI Wallet Units and relying parties support the DC API for remote presentation and issuance flows, with every EU member state required to have a wallet in citizens' hands by the end of 2026.<sup>[1][3]</sup>

## The User Story, Stripped of Domain

A user can:

- prove a specific claim — age, a license, a qualification — without uploading a document scan,
- choose which installed wallet handles the request, the same way a payment sheet offers a choice of payment method,
- share only the requested fields, not the whole underlying document.

Age verification, driver's license presentation, professional credential checks, KYC-adjacent identity flows — same mechanism, different regulated context each time.

## Core Browser Technologies

| API | Job | Reference |
|---|---|---|
| Digital Credentials API (`navigator.credentials.get({ digital: ... })`) | Requests a verifiable credential presentation from an installed wallet | [Chrome for Developers](https://developer.chrome.com/blog/digital-credentials-api-shipped) |
| OpenID4VP | One of two supported presentation protocols, carrying SD-JWT VC, mdoc, or W3C VC credentials | [Authsignal – Digital ID in 2026](https://www.authsignal.com/blog/articles/digital-id-is-going-mainstream-in-2026) |
| ISO 18013-7 mdoc binding | The other supported protocol, a direct binding for ISO mobile-document credentials | [Corbado – Digital Credentials API 2026](https://www.corbado.com/blog/digital-credentials-api) |
| Digital Credentials API for issuance (`navigator.credentials.create({ digital: ... })`) | The issuer-side counterpart, requesting a wallet accept a new credential | [Chrome for Developers – issuance](https://developer.chrome.com/blog/digital-credentials-api-143-issuance-ot) |

## The Browser Reality Check

This is genuinely new and moving fast. Chrome 141 shipped it enabled by default, supporting both same-device presentation on Android and cross-device presentation from desktop Chrome.<sup>[2]</sup> The API itself is protocol-agnostic — it just hands a request through to whichever wallet the user has installed — but the underlying protocol support diverges by platform in a way that matters for implementation: Safari 26 exclusively uses the `org-iso-mdoc` protocol string, while Chrome 141 supports both OpenID4VP and the ISO 18013-7 Annex C mdoc binding. Relying parties have to detect the browser and route to the correct protocol path — this is not yet a single universal code path.<sup>[1]</sup>

The W3C specification could reach Candidate Recommendation status sometime in 2026 or 2027, timed roughly with the EUDI Wallet rollout — meaning the spec is still being finalized even as major browsers ship working implementations against it.<sup>[4]</sup>

## What Breaks First

- Treating this as a distant future API, when Chrome shipped it enabled by default over a year before most teams start planning for it.
- Building against only one presentation protocol, when Safari and Chrome currently diverge on which protocol they exclusively or primarily support.
- Requesting more claims than the workflow actually needs — the entire privacy value of this API depends on minimal, purpose-specific requests, not habitually asking for a full document.
- Assuming a user has a compatible wallet installed at all — the request flow needs a real "no wallet available" path, not a dead end.

## Minimal Technical Blueprint

```javascript
async function requestAgeVerification() {
  if (!('credentials' in navigator) || !('digital' in navigator.credentials)) {
    return renderFallbackVerification(); // real fallback for unsupported browsers
  }

  try {
    const credential = await navigator.credentials.get({
      digital: {
        requests: [{
          protocol: detectSupportedProtocol(), // Safari vs Chrome differ here
          data: { /* minimal claim request — e.g. age_over_18 only */ },
        }],
      },
    });
    await verifyOnServer(credential); // server validates the cryptographic proof
  } catch {
    renderFallbackVerification(); // user declined or no compatible wallet
  }
}
```

1. Feature-detect the API and route to a genuinely usable fallback verification flow — this is not universally available yet, and the audience without it is not small.
2. Detect which protocol the current browser expects (OpenID4VP vs. the ISO mdoc binding) and route the request accordingly, rather than hard-coding one path.
3. Request the absolute minimum claim set the workflow needs — an age-over-18 boolean, not a full identity document, whenever that's sufficient.
4. Verify the returned credential server-side against the issuing authority's public keys — the client-side flow only obtains the presentation, it never establishes trust on its own.
5. Design the "no compatible wallet" path as a first-class outcome, not an error state — a real share of users won't have a wallet configured yet during this rollout period.

## Security and Compliance

This API exists specifically to reduce the data users have to hand over for identity verification — treat over-requesting as a direct undermining of that purpose, not a convenience. Verification of the cryptographic proof belongs entirely server-side; never trust a client-reported "verified: true." Document exactly which claims are requested and why, since regulated identity flows attract exactly the kind of scrutiny this API was built to survive.

## Test Matrix You Actually Need

- Chrome 141+ on both Android (same-device) and desktop (cross-device) presentation.
- Safari on iOS 26+, using its exclusive protocol path.
- Firefox 149+, confirming the newly landed baseline support behaves as expected.
- The full "no wallet available" and "user declines" paths, tested as thoroughly as the happy path.
- A genuinely unsupported older browser, confirming the fallback verification flow works completely on its own.

## Decision Summary

Use this where identity or credential verification is a real product requirement, especially anywhere touching EU users given the EUDI Wallet mandate — this is regulatory tailwind, not speculative feature work.

Don't wait for "full stability" before prototyping — the major browsers are already shipping against a spec that's still finalizing, and the practical adoption curve is happening now, not in some comfortable future release cycle.

---

[1]: Digital Credentials API protocol divergence and EUDI Wallet requirements, [Corbado – Digital Credentials API (2026)](https://www.corbado.com/blog/digital-credentials-api).
[2]: Chrome 141 default-on shipping and iOS 26 Safari support, [Chrome for Developers](https://developer.chrome.com/blog/digital-credentials-api-shipped).
[3]: EUDI Wallet Architecture Reference Framework DC API requirement, [Corbado – Digital Credentials API (2026)](https://www.corbado.com/blog/digital-credentials-api).
[4]: Digital Credentials API path to W3C Candidate Recommendation, [Authsignal – Digital ID is going mainstream in 2026](https://www.authsignal.com/blog/articles/digital-id-is-going-mainstream-in-2026).
