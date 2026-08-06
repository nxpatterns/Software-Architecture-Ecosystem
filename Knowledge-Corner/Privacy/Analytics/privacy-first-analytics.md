# Privacy-First Analytics for a Backend-Free Web App

## Why this is harder than it looks

A backend-free client app (e.g. served as static files from GitHub Pages) has no server-side log of its own, so any visitor count has to come from somewhere else: a third-party service, a self-hosted tool with its own backend, or edge logs from whatever host serves the files.

"Cookieless" and "no PII" are marketing terms, not legal guarantees. Most of these tools distinguish returning from new visitors using a daily-rotating, salted hash built from IP address plus User-Agent (and sometimes screen resolution). That hash is not directly identifying and isn't PII in the narrow US sense, but under the EU's GDPR definition of "personal data" (Art. 4(1)), a hash that *could* in principle be reversed with extra knowledge may still count as personal data. This has been raised publicly even about tools that advertise GDPR compliance by default — their session identifier is a hash of IP plus other properties, which is pseudonymous personal data, not PII-free by the letter of the law.

Practical upshot: using any of these tools is very likely fine under "legitimate interest" (GDPR Art. 6(1)(f)) if configured for minimal data collection, but it still needs a mention in your privacy policy, a stated retention period, and ideally an opt-out path. None of them make that paperwork disappear.

## Data retention: the feature that quietly disqualifies half these tools

If you actually want a concrete, defensible retention period ("raw data deleted after N days"), check whether the tool supports this **natively** before adopting it:

- **Umami** — no built-in retention/purge feature as of 2026. It's been an open feature request for years; the workaround is a manual SQL `DELETE` or a cron job against the database yourself.
- **Matomo** — built-in. Under *Privacy → Regularly delete old raw data*, you set a number of days; aggregated reports are kept separately.
- **GoatCounter** — doesn't store raw personal data to begin with (no persistent identifier, no fingerprinting), which sidesteps the retention question rather than solving it with a settings toggle.
- **Ackee** — no retention automation found; also has no Do Not Track support (an outlier among these tools).

If a fixed, self-managed retention window matters to you, this alone rules some tools out regardless of their other privacy claims.

## The tools

### Plausible Analytics
- **URL:** https://plausible.io
- **Country of origin:** Estonia (Plausible Insights OÜ, based in Tartu).
- **Where cloud data is stored:** Entirely on infrastructure owned and operated by European companies, in the EU. No transfer outside the EU — this is architectural, not a config option.
- **License / hosting:** Open source (AGPL-3.0), self-hostable or paid EU-hosted cloud.
- **Backend:** Elixir/Phoenix + PostgreSQL + ClickHouse.
- **What it does:** Pageviews, unique visitors, referrers, top pages, basic goal/conversion tracking. No cookies, no cross-site identifiers.
- **Notable:** One of the most widely adopted "GA replacement" tools; strong reputation for genuinely minimal data collection.

### Fathom Analytics
- **URL:** https://usefathom.com
- **Country of origin:** Canada (based in Victoria, British Columbia).
- **Where cloud data is stored:** Routed by region — EU/UK visitor traffic is processed on servers in Germany ("EU Isolation"); non-EU traffic (e.g. US visitors) goes to Fathom's other infrastructure. Canada holds an EU adequacy decision, so Fathom argues this satisfies GDPR even without EU incorporation.
- **License / hosting:** Current Fathom is fully proprietary, cloud-only. Paid subscription, no self-hosting.
- **Separate project — Fathom Lite:** an old, MIT-licensed, no-longer-actively-maintained open-source version (Go, SQLite) exists on GitHub, distinct from the current commercial product; if self-hosted, you choose where it runs. Don't confuse the two when evaluating "open source."
- **What it does:** Pageviews, unique visitors, referrers, basic events. Explicitly honors Do Not Track — one of the few tools in this list that does.

### Umami
- **URL:** https://umami.is
- **Country of origin:** United States (Umami Software, Inc., Delaware/San Francisco).
- **Where cloud data is stored:** You choose the region — Umami Cloud offers both a US region and an EU region (Germany).
- **License / hosting:** Open source (MIT), self-host or paid cloud (free tier up to 100k events/month).
- **Backend:** Node.js (18.18+), MySQL (8.0+) or PostgreSQL (12.14+).
- **What it does:** Pageviews, unique visitors, referrers, custom events, basic funnels, user path and retention (cohort) analysis, device/browser/OS breakdown.
- **Caveat:** No native data-retention/auto-delete feature (see above). Its "no PII" claim has been publicly disputed — the visitor identifier is a hash derived from IP and other request properties, which is pseudonymous personal data, not necessarily PII-free.

### Matomo
- **URL:** https://matomo.org
- **Country of origin:** New Zealand (InnoCraft Ltd., headquartered in Wellington; the company also has an office in Poland).
- **Where cloud data is stored:** Matomo Cloud data and backups are stored entirely in Europe (via AWS, under a contract chain through InnoCraft's NZ-based hosting partner), even though the company itself is based in New Zealand.
- **License / hosting:** Open source (GPL-3.0), self-host ("Matomo On-Premise") or paid cloud.
- **Backend:** PHP + MySQL/MariaDB.
- **What it does:** The most feature-complete of this list: pageviews, unique visitors, goals, funnels, heatmaps and A/B testing (paid plugins even on self-hosted), cookieless tracking mode, GA4 data import, per-visitor GDPR access/export/erasure tools, and — importantly — a native, UI-configurable raw-data retention setting.
- **Trade-off:** More complex to run and to navigate than the lighter tools on this list; some advanced features are gated behind paid plugins even when self-hosted.

### GoatCounter
- **URL:** https://www.goatcounter.com
- **Country of origin:** Netherlands/Ireland (creator Martin Tournoij is Dutch, currently based in Ireland; no formal company entity, this is an independent project).
- **Where cloud data is stored:** The hosted service (goatcounter.com) runs on EU infrastructure.
- **License / hosting:** Open source (EUPL-1.2), free hosted tier for non-commercial use, or fully self-hosted.
- **Backend:** Single Go binary; SQLite by default, PostgreSQL supported for larger deployments.
- **What it does:** Pageviews, unique visits, referrers, browser/OS/device breakdown, country (via IP geolocation performed before the IP is discarded/hashed). Script is roughly 3.5–4 KB.
- **Notable:** The most minimal and arguably the cleanest privacy posture in this list — no cookies, no persistent identifier, no fingerprinting, no stored IP. Actively maintained by a single developer (Martin Tournoij) since 2019. The hosted service runs on EU infrastructure. Trade-off: no funnels, no e-commerce tracking, no mobile SDK, and the free hosted tier is non-commercial only (commercial use requires self-hosting or a paid plan).

### Shynet
- **URL:** https://github.com/milesmcc/shynet
- **Country of origin:** United States (creator Miles McCain built it at the Recurse Center, based in New York).
- **Where cloud data is stored:** No managed cloud offering, so this doesn't apply — wherever you self-host it is where the data lives.
- **License / hosting:** Open source, self-host only, no managed cloud offering.
- **What it does:** Pageviews, real-time active visitor count, referrers, geographic and device breakdown, no cookies.
- **Notable:** Smaller community than the others here; check current maintenance activity before relying on it long-term.

### Ackee
- **URL:** https://ackee.electerious.com
- **Country of origin:** Not clearly established from public sources — treat as unconfirmed rather than guessing; check the project's GitHub/imprint yourself if this matters for your write-up.
- **Where cloud data is stored:** No cloud offering exists, so this doesn't apply — wherever you self-host it is where the data lives.
- **License / hosting:** Open source (MIT), self-host only — deliberately no SaaS/cloud option, and the maintainers have stated this isn't on the roadmap.
- **Backend:** Node.js + MongoDB.
- **What it does:** Pageviews, custom events, active-visitor count (no historical real-time graph), GraphQL API.
- **Caveat:** No Do Not Track support (an outlier among privacy-focused tools here), no built-in retention automation.

### PostHog (self-hosted)
- **URL:** https://posthog.com
- **Country of origin:** United States (PostHog Inc., San Francisco), founded by two co-founders who met in London; UK entity (Hiberly Ltd.) also exists for European operations.
- **Where cloud data is stored:** You choose — PostHog Cloud offers a US region (AWS Virginia) or an EU region (AWS Frankfurt, Germany), fully independent instances.
- **License / hosting:** Open source core, self-host or cloud; full self-hosting is now community-build-only and lacks some features available on PostHog Cloud — self-hosted and cloud are not feature-identical, unlike Plausible/Umami/Matomo/GoatCounter.
- **What it does:** Far broader than pure visitor counting — full product analytics, session replay, feature flags, A/B experiments, error tracking, surveys, a built-in data warehouse with import connectors (Stripe, HubSpot, Zendesk). Includes a simpler web-analytics view alongside the full product-analytics toolset.
- **Notable:** Likely overkill if you only want a visitor count and a device/browser breakdown, but worth knowing about if the project might grow into needing funnels or feature flags later.

### Countly (Community Edition)
- **URL:** https://count.ly
- **Country of origin:** Founded in Turkey (Istanbul, 2012); the company is now headquartered in London, United Kingdom.
- **Where cloud data is stored:** Not clearly documented in public sources for the Cloud Edition — check directly with Countly if this matters, rather than assuming.
- **License / hosting:** Open source (AGPL-3.0), self-host (Community Edition) or paid enterprise cloud.
- **Backend:** Node.js.
- **What it does:** Real-time mobile and web analytics, crash reporting, push notifications, custom events, funnels.
- **Notable:** Heavier and more oriented toward mobile-app analytics than the lightweight web-focused tools above; consider only if you need the mobile SDK / crash-reporting angle.

## Quick comparison

| Tool | Country of origin | Cloud data location (if not self-hosted) | License | Native retention control | DNT support |
|---|---|---|---|---|---|
| Plausible | Estonia | EU only (architectural) | AGPL-3.0 | Cloud plan setting; self-host varies | — |
| Fathom (current) | Canada | Germany (EU traffic) / other region (non-EU traffic) | Proprietary | Cloud only | Yes |
| Fathom Lite | Canada (unmaintained fork) | N/A — self-host only | MIT | — | — |
| Umami | United States | US or EU (Germany), your choice | MIT | **No** (manual only) | — |
| Matomo | New Zealand | Europe (via AWS) | GPL-3.0 | **Yes**, built-in | Configurable |
| GoatCounter | NL/IE (independent dev) | EU | EUPL-1.2 | N/A — doesn't store raw PII-adjacent data | Yes |
| Shynet | United States | N/A — self-host only | Open source | Unclear | — |
| Ackee | Unconfirmed | N/A — self-host only | MIT | **No** | **No** |
| PostHog (self-hosted) | United States (UK roots) | US or EU (Germany), your choice | Open core | Configurable | — |
| Countly CE | Turkey (now UK HQ) | Not clearly documented | AGPL-3.0 | Configurable | — |

## Tools from larger companies (Google, Microsoft, Meta, Adobe)

These are the tools most sites default to, precisely because they're free, feature-rich, and bundled with an ecosystem. They also sit on the opposite end of the privacy spectrum from everything above, and several have already been the subject of formal regulatory rulings in the EU.

### Google Analytics (GA4)
- **URL:** https://analytics.google.com
- **Country of origin:** United States (Google LLC).
- **Where data is stored/processed:** Google's global infrastructure, primarily the US, with data transfer to the US as the core legal issue.
- **What it can do:** Full-featured — pageviews, sessions, demographics, interests, conversion funnels, e-commerce tracking, audience segments, integration with Google Ads for retargeting, cross-device and cross-site user identification, machine-learning-based predictive metrics (e.g. purchase probability).
- **Why this is legally troublesome in the EU:** After the 2020 Schrems II ruling invalidated the EU-US Privacy Shield, <cite index="108-1,112-1">data protection authorities in Austria, France, and Italy ruled Google Analytics non-compliant with GDPR, with Denmark, Finland, Norway, and Sweden issuing similar rulings by January 2025</cite> — <cite index="112-1">seven EU/EEA countries in total.</cite> <cite index="108-1">Sweden's authority fined Tele2 €1 million in 2023</cite> specifically for using the platform. The core finding, per multiple authorities: <cite index="108-1">the individual data points Google Analytics collects (pages visited, browser, OS, screen resolution, language, timestamps, IP) each seem harmless alone, but combined they form a unique fingerprint,</cite> and <cite index="108-1,112-1">contractual safeguards (Standard Contractual Clauses) do nothing to stop US intelligence agencies from accessing that data once it's transferred, so the transfer itself was ruled unlawful.</cite>
- **Current status (2026):** <cite index="115-1">The 2023 EU-US Data Privacy Framework provided a legal transfer mechanism, and the General Court upheld its validity — though an appeal is pending at the Court of Justice, and the framework's foundations are described as shakier than the headline suggests.</cite> Separately, <cite index="116-1">GA4 is now generally treated as conditionally legal in most EU countries, provided you obtain valid opt-in consent before the tracking script loads (GA4's cookies are non-essential under the ePrivacy Directive) and apply IP anonymization</cite> — the DPF fixed the transfer problem, not the consent requirement. In short: still needs a full cookie consent banner, and rests on a legal foundation that is actively being challenged in EU courts.

### Microsoft Clarity
- **URL:** https://clarity.microsoft.com
- **Country of origin:** United States (Microsoft Corporation); <cite index="121-1">Microsoft Ireland Operations Limited processes Clarity data for EU visitors, with Standard Contractual Clauses covering onward transfer to Microsoft Corp. in the US.</cite>
- **What it can do:** Free — <cite index="120-1">heatmaps showing where users click, scroll, and interact most; full session recordings/replays of anonymous browsing sessions; user click analysis.</cite> <cite index="118-1">Collects mouse movements, scrolling behavior, click patterns, device data, and form field interactions (with default masking for sensitive fields).</cite>
- **Why this is legally troublesome in the EU:** <cite index="118-1">Session replay and interaction data can indirectly identify individuals and constitutes personal data under GDPR.</cite> <cite index="126-1">Explicit consent is generally required, especially for session recordings, and this is stricter than what GA4 needs for basic anonymized collection.</cite> A separate wrinkle: <cite index="121-1">Clarity sets an MUID cookie, a Microsoft-wide persistent identifier also used across Microsoft Advertising and Bing — if your Clarity deployment is connected to Microsoft Advertising, behavioral session data may be linked to advertising profiles,</cite> which pushes this well past "just analytics" into ad-tracking territory that needs separate disclosure and consent.

### Meta Pixel (Facebook Pixel)
- **URL:** https://www.facebook.com/business/tools/meta-pixel
- **Country of origin:** United States (Meta Platforms, Inc.).
- **What it can do:** Not primarily a visitor counter — it's an advertising and retargeting tool. Tracks page visits, button clicks, purchases, form submissions, and links this activity to a person's Facebook/Instagram account for ad targeting and lookalike-audience building across Meta's platforms.
- **Why this is legally troublesome in the EU:** This is the most aggressive tool on this list in terms of data linkage — it doesn't anonymize by design, it exists specifically to build cross-site, cross-session identity profiles for advertising. <cite index="109-1">Max Schrems and noyb have filed complaints across Europe specifically naming sites using Google Analytics and Facebook Connect/Pixel together,</cite> for the same underlying reason as the Google Analytics rulings: personal data flowing to a US company under insufficient transfer safeguards, compounded here by the explicit advertising-profile use case that GDPR's purpose-limitation principle scrutinizes especially closely.

### Adobe Analytics
- **URL:** https://business.adobe.com/products/analytics/adobe-analytics.html
- **Country of origin:** United States (Adobe Inc.).
- **What it can do:** Enterprise-grade analytics — real-time data, AI-driven attribution, cross-channel tracking (web, mobile, offline), audience segmentation, predictive analytics.
- **Why this is legally troublesome in the EU:** Same fundamental issue as Google Analytics — a US company processing EU personal data, subject to the same Schrems II transfer-mechanism scrutiny and the same DPF dependency. Adobe offers an EU data center option for its Experience Cloud, which mitigates but doesn't eliminate the underlying exposure, since Adobe as a US company remains subject to US surveillance law (FISA/CLOUD Act) regardless of where servers physically sit.

### The pattern across all of these

The legal problem is structural, not a matter of sloppy configuration: <cite index="110-1">any EU personal data sent to a US-based company can, once on US soil, potentially be accessed by US intelligence authorities under US surveillance law, and the GDPR requires that transfers outside the EU have safeguards equivalent to EU protections.</cite> <cite index="112-1">Contractual promises (like Standard Contractual Clauses) don't fix this, because a company cannot contractually promise to defy a US government surveillance order.</cite>

The 2023 EU-US Data Privacy Framework currently provides a legal basis for these transfers, but as flagged earlier in this document, <cite index="16-1">its validity is being actively contested at the EU's highest court, and it has already collapsed once before under the same legal theory (Privacy Shield, 2020).</cite> Building a dependency on any of these tools today means accepting that the legal ground it stands on could shift again with a single court ruling, the same way Privacy Shield did.



For "just tell me visitor count plus rough browser/OS/resolution, nothing fancier, minimal legal exposure": **GoatCounter** (simplest, cleanest privacy posture, smallest footprint) and **Matomo** (if you specifically need a UI-configurable retention window and don't mind more complexity) are the strongest fits. Umami is popular and easy to run but currently lacks native data retention — a real gap if a fixed, enforceable retention period matters to you. Fathom's *current* product is proprietary cloud-only; don't confuse it with the old open-source Fathom Lite.

Whatever you pick, self-hosting doesn't remove the need to update your privacy policy: mention the tool, the legal basis (legitimate interest), what's collected, where it's hosted, the retention period, and an opt-out mechanism (or Do Not Track support, where the tool offers it).
