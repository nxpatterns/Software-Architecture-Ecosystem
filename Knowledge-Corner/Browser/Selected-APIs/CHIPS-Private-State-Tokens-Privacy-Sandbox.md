# Special Web APIs Today: CHIPS, Private State Tokens, and the Privacy Sandbox Graveyard

*State as of August 6, 2026*

Google spent six years and, by some estimates, north of a hundred W3C meetings building a cathedral to replace the third-party cookie. On October 17, 2025, it demolished most of the building and kept two side rooms and a hallway nobody quite knows what to do with anymore.

This is the tour. Two APIs you can actually ship today (CHIPS, Private State Tokens), one architectural leftover that's technically still standing but has nothing left to serve (Fenced Frames), and four APIs that are dead — Topics, Protected Audience, Attribution Reporting, Shared Storage — which we'll bury properly but without excavating the whole corpse, because you don't need the autopsy report to know the timeline.

---

## Why Any of This Happened

Short version, because the long version is a graduate seminar in regulatory capture and ad-tech politics: Chrome announced in 2020 it would kill third-party cookies. It didn't. Four delays later, Google reversed course entirely on April 22, 2025 and said Chrome would keep third-party cookies indefinitely, just with a user-facing choice toggle instead of a ban.[^reversal]

That single decision removed the reason for half the Privacy Sandbox to exist. If cookies aren't going away, why would any ad-tech vendor migrate to a noisier, harder-to-debug, differentially-private replacement? Nobody did. Adoption numbers presented at a March 2026 W3C meeting were brutal: roughly 8–15% integration testing completion across the top 1,000 Chrome advertisers, depending on the API.[^adoption] Six months after the reversal, on October 17, 2025, Google's Anthony Chavez posted the obituary: ten technologies retired, three kept.[^official]

Kept: **CHIPS**, **FedCM** (not in scope today, but it's the third survivor if you're curious), and **Private State Tokens**.

Retired: Attribution Reporting API, IP Protection, On-Device Personalization, Private Aggregation (which takes Shared Storage down with it), Protected Audience, Protected App Signals, Related Website Sets, SelectURL, SDK Runtime, and Topics.

Fenced Frames wasn't named on either list. We'll get to why that's the interesting part.

---

## CHIPS (Cookies Having Independent Partitioned State)

**Status: alive, shipped, boring in the best possible way.**

CHIPS is the one Privacy Sandbox idea that didn't need an ad-tech business model to justify its existence, which is probably why it survived. The pitch is simple: a third-party cookie that's scoped per top-level site instead of shared globally.

Say `chat-widget.example` is embedded via iframe on both `shop-a.example` and `shop-b.example`. Under the old cookie model, `chat-widget.example` could correlate a visitor across both sites — great for chat-widget analytics, also great for tracking your Tuesday grocery run to your Friday shopping spree on an unrelated site. With CHIPS, the widget gets a *different* cookie jar on each top-level site. Same third party, same functionality (session state works fine within a site), zero cross-site linkability.

```http
Set-Cookie: session_id=abc123; Secure; Partitioned; SameSite=None; Path=/
```

That's the entire API surface, more or less. Add `Partitioned` to a cookie that already needs `SameSite=None; Secure`, and the browser keys it by `(top-level site, cookie domain)` instead of just `(cookie domain)`.

**Concrete use case:** a payment widget or CDN-hosted embed (think Stripe Elements, Intercom, a third-party image CDN with session-based rate limiting) that needs to remember state *within* a page load and across a session on one site, but has no legitimate reason to know that the same browser also visited a competitor. CHIPS is exactly the right tool — you get functional cross-request state without functional cross-site tracking.

**Browser support, and this matters more than usual:** Chrome shipped it by default in Chrome 115. Firefox doesn't implement CHIPS specifically, but achieves the same *outcome* through Total Cookie Protection (on by default since Firefox 103, and since Firefox 131 it partitions third-party cookies in ETP Strict mode without requiring the site to opt in at all). Safari doesn't implement CHIPS either — Intelligent Tracking Prevention just blocks third-party cookies outright and has since 2020, partitioning wasn't considered worth the complexity when blocking works. So functionally: Chrome needs your explicit `Partitioned` attribute to get partitioned behavior; Firefox and Safari partition or block by default whether you ask or not. Test in all three. They arrive at similar privacy outcomes via three different philosophies, which is very on-brand for browser vendors.

---

## Private State Tokens

**Status: alive, still labeled "Experimental" on MDN, and worth knowing about even though almost nobody ships it.**

Private State Tokens (formerly Trust Tokens — renamed in 2022 for the same reason consultancies rename themselves after a scandal) solve one specific problem: how does Site B know a visitor is a real human and not a bot, without Site B being able to identify *which* human?

The mechanism, without the cryptography lecture: Site A ("issuer") establishes trust in a visitor — they solved a CAPTCHA, they completed a purchase, they've had an account for six months. Site A issues a cryptographically signed token, stored securely by the browser. The token carries no identity, no user ID, nothing personal — it's a Privacy Pass-style blind signature, meaning even Site A can't later recognize which specific token belongs to which specific visit. Later, when the same browser visits Site B ("redeemer"), Site B can ask "does this browser hold a token from an issuer I trust?" and get a yes/no, without learning who the person is or which issuer specifically vouched for them (if multiple issuers are configured).

```http
Sec-Private-State-Token: <redemption record>
```

**Concrete use case:** you run a comment section or a freemium API and you're drowning in bot signups. Instead of showing every visitor a CAPTCHA (which real users hate and sophisticated bots solve anyway), you check for a Private State Token issued by a provider you trust — say, a major mail provider that only issues tokens to accounts with a clean fraud history. No token, no history of good behavior anywhere on the web with that browser: show the CAPTCHA. Token present: skip it. This is CAPTCHA-fatigue reduction, not CAPTCHA replacement — the spec is explicit that PST conveys trust, it doesn't establish it.[^pst-not-captcha]

**Reality check, because I promised accuracy over vibes:** this is the least adopted of the three survivors. Chrome maintains it, and it's the only Privacy Sandbox API that got an explicit "we're keeping this" mention alongside CHIPS and FedCM in the October 2025 announcement — Google specifically wants to keep exploring anti-fraud approaches even after gutting the ads stack.[^pst-kept] But MDN still flags it "Experimental," and there's no meaningful Firefox or Safari implementation. If you're building anti-fraud infrastructure today, PST is a "watch this" item, not a "ship this" item — unless you're specifically targeting Chrome-only enterprise or CDN-level fraud signals, where a few large players are quietly using it.

---

## The Retired Wing: Topics, Protected Audience, Attribution Reporting, Shared Storage

I won't perform an autopsy nobody asked for. Here's what each one was, in one paragraph, and why it's dead.

**Topics API** replaced the widely mocked FLoC (Federated Learning of Cohorts, killed in 2022 for being a fingerprinting vector dressed up as privacy tech). Topics assigned your browser a rotating set of broad interest categories — "Fitness," "Travel & Transportation" — computed locally, shared with sites in coarse form instead of raw browsing history. It shipped to general availability in September 2023. It's retired as of the October 2025 announcement, alongside Android's version. Adoption at the time of retirement: about 8% of major advertisers had finished integration testing.[^adoption] Critics also noted a structural flaw that never got fully solved: a company running multiple sites or apps could still correlate topics across its own properties to rebuild a fairly detailed profile, which rather defeated the point.[^topics-flaw]

**Protected Audience API** (the productized version of the FLEDGE proposal, itself descended from TURTLEDOVE) was Google's replacement for interest-based remarketing without third-party cookies: your browser locally stores "interest groups" you were added to by advertisers, and an on-device auction — code supplied by buyers and sellers, run inside the browser — decides which ad wins, without any single party seeing your full profile. Genuinely clever cryptographic engineering. Genuinely unloved by an ad industry that runs on real-time bidding infrastructure built around server-side auctions, not client-side ones. Retired, both Chrome and Android.

**Attribution Reporting API** tried to answer "did this ad click lead to that purchase" without letting anyone join click-level and conversion-level data on an individual user — it added calibrated statistical noise to protect against exactly that. Advertisers accustomed to deterministic, user-level attribution treated the noise as a bug rather than the point. Two large demand-side platforms flagged it publicly as a blocker to adoption.[^noise] Retired alongside the rest in October 2025.

**Shared Storage** and its companion **Private Aggregation** provided a write-only, cross-site storage bucket that scripts could read from only inside a locked-down worklet, with output limited to noisy aggregate histograms — useful for things like unique-reach measurement or A/B testing across sites without exposing individual behavior. Retired together, since Private Aggregation was Shared Storage's only sanctioned way to get data back out.

**One footnote for the pedants**[^stale-article]: you'll find articles published well into 2026 that talk about the Attribution Reporting API being "delayed to Q3 2026" as if it's still coming. That's stale content, either republished without updating the byline date or written by someone who didn't check the primary source. The Google blog post retiring it is dated October 17, 2025, and it's unambiguous. Trust the primary source, not the SEO farm that outranks it.

---

## Fenced Frames: The Room With No Furniture Left In It

This is the one worth understanding precisely *because* it's ambiguous.

Fenced Frames — the `<fencedframe>` element — is a genuinely separate piece of engineering from the ad APIs above: a stricter iframe that can hold cross-site data without leaking it to the embedding page or vice versa. It shipped to general availability in Chrome 115 as a platform primitive. It was never, by itself, on the October 2025 retirement list.

The problem is that Fenced Frames doesn't do anything on its own. Its entire reason to exist was serving as the secure rendering surface for exactly two things: the winning ad from a Protected Audience auction, and the URL chosen by Shared Storage's `selectURL()`. Both of those are now retired. A fenced frame with nothing to fence in is an access-controlled room with no furniture.

Chrome's own developer docs for it still say "in general availability" as of this writing, and the element hasn't been formally deprecated. But treat it as a dead man walking: don't build new architecture around it, and if you inherited code using it for a Protected Audience integration, that code needs to come out regardless, since its upstream dependency is already gone.

---

## Zukunftsmusik: Where This Actually Goes

Three things worth watching, roughly in order of how much they'll matter to you:

**Interoperable Attribution.** Google explicitly said it will keep working on privacy-preserving conversion measurement, but through the W3C's Private Advertising Technology Working Group instead of a unilateral Chrome API, feeding in lessons learned from the dead Attribution Reporting API.[^official] This is the one area where "Privacy Sandbox is dead" is wrong — the *ads-specific browser API* approach is dead, the underlying problem isn't, and it's moving to a slower, more boring, multi-vendor standards process. Don't expect anything shippable before 2027 at the earliest.

**CHIPS and FedCM becoming default infrastructure, not opt-in extras.** Both got explicit "broad adoption, including support from other browsers" callouts in the retirement announcement.[^official] These are graduating from "Privacy Sandbox experiment" to "just how cookies and identity work now" — expect them referenced in generic web platform docs within a year or two, stripped of the Privacy Sandbox branding entirely, the way `fetch()` stopped being an "experimental replacement for XMLHttpRequest" and just became how you make HTTP requests.

**The industry answer isn't a browser API at all.** With Chrome keeping third-party cookies (with a user toggle most users will never touch) and Safari/Firefox continuing to block or partition aggressively regardless of what Chrome does, the practical 2026 playbook for measurement has quietly become: authenticated first-party data, server-side conversion capture, contextual targeting, and consent-based data collection — not waiting for a browser vendor to hand you a replacement. If your roadmap still has a line item that says "migrate to Topics API," delete it. Nobody's coming to save real-time bidding with cryptography. It turns out the ad industry's actual privacy strategy was never a browser API — it was regulatory arbitrage and waiting Google out. This time, waiting worked.

---

**Bottom line:** ship CHIPS if you run any cross-site embed with session state — it costs one cookie attribute and buys you a straight answer to the next privacy audit. Keep an eye on Private State Tokens if bot traffic is actively hurting you and you can tolerate Chrome-only coverage. Everything else in this document with "ad" in its former job title is a museum piece. Don't build on it, and if you inherited it, budget the removal.

---

[^reversal]: Google's April 22, 2025 announcement kept third-party cookies in Chrome behind a user-facing choice prompt instead of removing them — the decision that made the entire ads side of Privacy Sandbox politically unnecessary six months before it was formally retired.

[^adoption]: Figures presented at a W3C Web Advertising Business Group meeting in March 2026: roughly 12% of top-1,000 Chrome advertisers had completed Attribution Reporting integration testing, 8% for Topics, 15% for Protected Audience. Numbers this low, this late, tend to explain a retirement announcement better than any blog post does.

[^official]: Anthony Chavez, VP Privacy Sandbox, "Update on Plans for Privacy Sandbox Technologies," Google, October 17, 2025.

[^pst-not-captcha]: The WICG explainer is unusually blunt about this: Private State Tokens are "not a replacement for CAPTCHAs or other trust-establishing mechanisms" — they convey trust that was established elsewhere, they don't establish it themselves.

[^pst-kept]: From the same October 2025 announcement: "We'll also maintain Private State Tokens and explore additional approaches to help developers reduce fraud and abuse" — the only retired-adjacent API to get a forward-looking commitment rather than a eulogy.

[^topics-flaw]: The structural issue: any company operating multiple sites or apps could still correlate a user's Topics across its own properties, reconstructing a more detailed interest profile than any single site was supposed to see. Randomized topic assignment and noise mitigated but never eliminated this.

[^noise]: The Trade Desk and Criteo both publicly flagged the Attribution Reporting API's differential-privacy noise as a practical barrier to adoption — individual-level attribution accuracy was intentionally degraded, and advertisers used to deterministic tracking treated that as a dealbreaker rather than a feature.

[^stale-article]: Found while researching this document: at least one still-indexed article dated April 2026 describes Attribution Reporting as merely "delayed to Q3 2026." It's wrong, or at best describing pre-retirement history with a misleading publish date. Worth remembering that ad-tech SEO content has a longer half-life than the APIs it describes.
