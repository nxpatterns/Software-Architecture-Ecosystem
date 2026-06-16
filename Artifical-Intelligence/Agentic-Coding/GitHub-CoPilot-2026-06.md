# GitHub Copilot Deep-Dive

**As-of date:** 16 June 2026
**Companion to:** `agentic-coding-landscape-2026-06.md` and `warp-deep-dive-2026-06.md`. Copilot was the "default for GitHub-centric teams, weaker on deep multi-file reasoning" line in the first doc. This is the full treatment.
**Lens:** CloudLib.EU. Commercial B2B SaaS, EU/DSGVO-bound, IP-sensitive, Node/Angular/Nx monorepo, small core team. Already using Claude Code. The deciding questions remain: what does it cost, where does our code go, and does it do anything Claude Code does not.

> **Bias check, stated openly.** This document was requested by someone who rates Copilot as useful only for comments, imports, and formatting, and who asked not to have that prior confirmed reflexively. So: that description was accurate for Copilot around 2022. It is wrong for the 2026 product, which is a full agentic platform. Whether the 2026 product is *good* at the agentic part, and whether it is the right tool for CloudLib, are separate questions with more defensible negative answers. This doc separates "what it is" (your prior is outdated) from "is it the best choice for you" (your skepticism has a real kernel). Both get a fair hearing.

> Same freshness warning as the other two. Pricing, models, and the litigation docket move; the shape of the thing ages more slowly. Re-verify load-bearing facts against the sources at the bottom.

---

## 0. Verdict first (and the honest correction to the prior)

**Where the prior is factually wrong:** Copilot in 2026 is not autocomplete with extras. It has Agent Mode (autonomous multi-step editing, GA on VS Code and JetBrains), a cloud Coding Agent that turns a GitHub issue into a pull request while you do something else, a CLI with plan/autopilot/fleet modes and sub-agents, agentic code review that reads cross-file context before commenting, MCP support, and a model picker spanning OpenAI, Anthropic, and Google. Its issue-to-PR cloud automation is arguably the most advanced of any IDE-integrated tool. Dismissing it as "comments and imports" describes a product that stopped existing around 2023.

**Where the skepticism is right:** Copilot is not where the frontier of agentic *quality* sits. In blind comparisons the agent-natives win on output quality, and Copilot's own honest framing of Agent Mode is "a junior pair programmer with infinite stamina, great for well-scoped test-covered tasks, risky for anything subtle or load-bearing." Its actual moat is not intelligence, it is **integration depth into the GitHub ecosystem** plus the **most mature enterprise compliance and IP-indemnity story** in the US tool market. If you are not living in GitHub, most of that moat evaporates, and as a pure coding agent it is a step behind the tool you already use.

**The one-line read for CloudLib:** Copilot is not a "use it instead of Claude Code" tool. It is a "use it for GitHub-native workflow automation and enterprise governance, if you are on GitHub and want one vendor with a clean DPA and EU data residency." If CloudLib is not on GitHub, skip it. If it is, the value is narrow and specific, not "a better agent."

**Three things that matter most, up front:**

1. **The April 2026 data change is the big flag.** Since 24 April 2026, Copilot trains on your interaction data by default on Free, Pro, and Pro+. Business and Enterprise are excluded. For commercial IP-sensitive EU code, the individual plans are disqualified, full stop. Section 7.
2. **The copyright scare is overstated, the licence-hygiene risk is real.** The core copyright claims in Doe v. GitHub were dismissed; what survives is the open-source-license/attribution theory. You own the code Copilot generates. IP indemnity exists, but only on Business/Enterprise and only with the public-code filter on. Section 6.
3. **Billing became a metered utility on 1 June 2026.** Completions stay free; agent and chat use bill per token against a monthly credit pool, and agent-heavy use with frontier models gets expensive fast. Section 5.

---

## 1. What Copilot actually is in 2026

Copilot is four surfaces sharing one GitHub identity and repo context, plus a few satellites. The "it is autocomplete" mental model fails because completion is now the *least* of it.

| Surface | What it does | Runs where |
|---|---|---|
| **Code completion** | Inline suggestions, Next Edit Suggestions. The original product. | In-editor, local |
| **Chat** | Conversational Q&A with repo/file context, `@workspace` style queries | In-editor |
| **Agent Mode** | Autonomous multi-step: decides which files to edit, runs terminal commands, iterates on its own errors, self-heals. GA on VS Code and JetBrains (March 2026). | In-editor, active session |
| **Coding Agent** | Cloud, asynchronous. Assign a GitHub issue, it spins up a sandbox on GitHub Actions, branches, writes code, runs tests, opens a PR. GA September 2025. | GitHub cloud (Actions) |

Satellites: **Copilot CLI** (GA February 2026; plan mode, autopilot mode, fleet mode with parallel sub-agents, session memory, MCP), **agentic code review** (explores the repo and traces cross-file dependencies before commenting; over 60 million reviews run; can hand fixes to the coding agent automatically), **custom agents and sub-agents** (GA March 2026), and **GitHub Spark** (natural-language app generation, Pro+ and Enterprise).

The honest summary from the field, which is the correct one: stop thinking of Copilot as autocomplete; it has become an agentic platform, and it is no longer competing on completion quality but on integration depth, which is where its moat actually is. Completion plus chat plus Agent Mode plus Coding Agent all share the same GitHub auth and repo context, and that single-identity, deeply-GitHub-wired experience is the thing competitors cannot easily copy.

---

## 2. The agentic capabilities, in detail

Because the prior specifically underrates this, here is the actual surface area.

**Agent Mode (in-editor, synchronous).** You give a high-level natural-language task. It plans, edits across multiple files, runs terminal commands, reads the output, and iterates on failures without you driving each step. VS Code shows a multi-file summary diff with granular keep/undo and checkpoint restore. Self-healing on build errors is the headline behavior. GA in both VS Code and JetBrains as of March 2026, which finally covered the large JetBrains-based Java/Kotlin/Python population.

**Coding Agent (cloud, asynchronous).** Conceptually different from Agent Mode. You assign a GitHub issue to Copilot; it provisions a secure environment via GitHub Actions, analyzes the issue and repo context, writes the code, runs tests, and opens a PR for review, all without an IDE open. This is the "open an issue before lunch, find a PR when you are back" workflow, and it is the most autonomous thing any IDE-integrated tool ships. Recent additions: a model picker, agent self-review, built-in security scanning, custom agents, and CLI handoff.

**Copilot CLI (terminal).** Plan mode (generates a strategy before executing), autopilot mode (executes without confirmation), and fleet mode (parallel sub-agents on different parts of a task). Session memory persists across interactions; MCP servers connect external tools and data. An agent picker lets you switch operating modes per workflow. As of June 2026 it is phasing in as the default CLI experience and gaining a debug panel.

**Agentic code review.** Moved to an agentic architecture that explores the repository, reads related files, and traces cross-file dependencies before suggesting changes, rather than scanning a diff line by line. It can pass suggestions straight to the coding agent to generate fix PRs. Caveat with a cost tail: since 1 June 2026 it consumes GitHub Actions minutes (Section 5).

**Model picker and effort control.** You choose the model per task across OpenAI, Anthropic, and Google families, and for reasoning models you set a "thinking effort" level (higher for architecture or multi-step debugging, lower for simple generation). BYOK is supported (bring your own provider key).

This is a real agentic platform. The question is not whether it can do these things. It can. The question is how well, and at what cost, which is the next two sections.

---

## 3. Honest capability assessment versus the agent-natives

This is where the skepticism earns its keep, so it gets a straight answer.

**Copilot trails the quality leaders on hard agentic work.** In blind output comparisons referenced across 2026 roundups, Claude Code's output was preferred on the order of two-to-one over the OpenAI-agent baseline, and Copilot generally sits behind the agent-natives (Claude Code, Cursor) on complex, multi-file, subtle changes. Its own documentation frames Agent Mode as a junior pair programmer: excellent on well-scoped, test-covered tasks, risky on anything load-bearing or subtle. That is an accurate self-description, and it is the kernel of truth in the prior. If your bar is "best raw agentic reasoning," Copilot is not it, and you already run the tool that is.

**Where Copilot genuinely leads, and it is not nothing:**

- **GitHub-native automation.** The issue-to-PR cloud Coding Agent running on Actions, agentic code review wired into the PR flow, and the single GitHub identity across all surfaces. No other tool integrates this tightly with GitHub issues, Actions, and PRs, because no other tool *is* GitHub.
- **Ubiquity and friction.** It runs in every major IDE (VS Code, JetBrains, Visual Studio, Neovim, Xcode) and is the lowest-friction option for a team already on GitHub. Free, unmetered completions on paid plans.
- **Enterprise governance and compliance.** The most mature story in the US-vendor market: downloadable DPA, EU data residency, FedRAMP path, IP indemnity, admin policy controls, audit logs. Section 6 and 7.

**The accurate framing:** Copilot competes on integration and governance, not on being the smartest agent. For a GitHub-centric enterprise that wants one vendor and one bill, that is a coherent value proposition. For a small team chasing the best agentic output, it is a redundant second-best. Both statements are true at once; which one applies depends on what CloudLib actually optimizes for.

---

## 4. Models

Copilot is model-agnostic through a picker. As of mid-2026 it spans the current OpenAI (GPT-5.x line), Anthropic (Claude Opus and Sonnet 4.x line), and Google (Gemini 3.x line) frontier models, plus cheaper base models for unmetered everyday use. Two things matter for budgeting and capability:

- **Opus-class models are gated and expensive.** GitHub removed the Opus family from the base Pro tier, restricting it to Pro+ and above, and under the token meter a heavy-use Opus request was estimated at roughly 27x the cost of a cheaper model. So "use the best model in Copilot" is a Pro+/Max-tier decision with a real bill attached.
- **Thinking-effort control and BYOK** let you tune cost against quality per request, and route through your own provider account if you prefer that billing and visibility.

The practical implication: the model that makes Copilot's agent competitive with Claude Code is the same expensive frontier model you would pay for anyway, now wrapped in Copilot's metering. You do not get a quality shortcut by going through Copilot; you get the GitHub integration around the same models.

---

## 5. Pricing (a metered utility as of 1 June 2026)

The model changed materially. Verify current numbers before committing, because this is the second pricing overhaul in a year and each one drew complaints.

**The change:** on 1 June 2026, Copilot moved from "premium requests" (a discrete-credit currency) to **usage-based billing on GitHub AI Credits**, billed against actual token consumption (input, output, cached) at published per-model API rates. One credit equals roughly one cent. Annual plans are retired and grandfathered until expiry, then drop to Free.

| Plan | Price | Included AI Credits | Notes |
|---|---|---|---|
| **Free** | $0 | minimal | Limited; for trial/light use. |
| **Pro** | $10/mo | ~$10 in credits | Opus-class models excluded from base. |
| **Pro+** | $39/mo | ~$39 in credits | Adds Opus-class access, Spark. |
| **Max** | $100/mo | higher allowance | Only rational if you run Copilot as an automated agent for hours a day. |
| **Business** | $19/user/mo | ~$19 per user (pooled) | SSO, admin/policy controls, audit logs, IP indemnity, training exclusion, DPA. |
| **Enterprise** | $39/user/mo | ~$39 per seat (pooled) | All of Business plus SAML SSO, fine-tuning options, data-residency path. |

**What stays free:** standard code completions and Next Edit Suggestions are not metered on paid plans. The meter targets chat, Agent Mode, the coding agent, code review, and premium-model use.

**The catches worth flagging explicitly (the hidden-cost stuff):**

- **Agent-heavy use burns the allowance fast, then bills per token with no silent downgrade.** An agent-heavy developer can exhaust a seat's monthly credit before mid-month, after which premium-model usage bills at per-token rates with no automatic fallback to a cheaper model. The teams most likely to overspend are exactly the agent-heavy ones, and they are the ones who do not know it yet.
- **Code review now eats GitHub Actions minutes** (since 1 June 2026), on top of AI Credits, because it runs on Actions.
- **Promotional credits cushion the transition** for Business/Enterprise through August 2026 (Business ~$30 vs $19, Enterprise ~$70 vs $39), which means the real steady-state cost arrives in September. Budget for that, not the promo.
- **Pooled entitlements** on Business/Enterprise can *reduce* total cost by balancing heavy and light users, which is the one piece of good news for a team buying seats.

The honest community summary, which is correct: "you are really paying for AI compute, not the editor," and June 2026 is when Copilot stopped being a flat subscription and became a metered utility.

---

## 6. Licensing and intellectual property

This is where Copilot has the most history and the most fear, so it gets precision, because the fear and the real risk are not the same thing.

**The litigation, deflated to its actual size.** Doe v. GitHub (No. 22-cv-06823-JST, N.D. Cal., filed November 2022 against GitHub, Microsoft, and OpenAI) alleged that training Copilot on public code and reproducing similar output violated copyright and open-source licenses. As of early 2026 the case is still active but substantially narrowed:

- **Dismissed:** the core copyright infringement claims, DMCA Section 1202(b), punitive damages, and unjust-enrichment monetary relief. The judge ruled Copilot's output was not sufficiently similar to any specific plaintiff's code to sustain direct copyright infringement.
- **Surviving:** breach of contract and open-source license-violation theories. The judge has been willing to treat open-source licenses as binding agreements, so stripping attribution or omitting required license text when reproducing code is the live exposure. An appeal on the DMCA 1202 statutory question has been in play.
- **Verify the current docket** before relying on this; it was moving.

So the scary headline ("Copilot launders GPL code") is not where the legal action landed. The residual risk is narrower: a generated block that reproduces identifiable licensed code without its attribution/license text.

**You own the output.** GitHub's terms assign ownership of Copilot-generated code to you, on every plan including Individual. Ownership is not the issue; provenance of larger generated blocks is.

**The mitigations, and what is gated:**

- **"Suggestions matching public code" filter (duplicate detection).** When enabled, Copilot checks a suggestion plus ~150 characters of surrounding context against public GitHub code and suppresses matches or near-matches. Known limitation: it catches exact/near-exact matches, not paraphrased reproductions, and the plaintiffs allege output variation defeats it. Useful, not a guarantee. Admin-controllable on Business/Enterprise.
- **IP indemnity (the Copilot Copyright Commitment).** Microsoft/GitHub indemnifies you against third-party IP claims arising from Copilot output, but only on **Business and Enterprise**, and only if the public-code filter is enabled. Individual/Pro plans give you ownership but **no indemnity**.
- **A real-world compliance playbook** (from an OSS-compliance lead at a public company): enable the duplicate-detection filter, run license scanning (FOSSA/Snyk) on PRs to catch verbatim copies, require Business minimum for indemnity, and document significant AI-assisted sections in commits. In practice most suggestions are short non-copyrightable snippets; the risk concentrates in larger generated blocks. Due-diligence reality: investors now ask about AI-assisted coding and want to see Business/Enterprise with indemnity.

**For CloudLib:** none of the AGPL-style "using it infects your code" problem from the Warp analysis applies here; this is the opposite kind of IP question (provenance of generated snippets, not the tool's own license). The clean posture is Business or Enterprise (for indemnity) + public-code filter on + license scanning in CI. On Pro/Individual you own your code but carry the provenance risk yourself with no indemnity backstop.

---

## 7. Data, privacy, and sovereignty (the decisive section for CloudLib)

This is the part that should drive the decision for a DSGVO-bound, IP-sensitive product, and there is a recent change that matters.

**The April 2026 training-by-default change (the big flag).** Announced 25 March 2026, live 24 April 2026: interaction data from Copilot **Free, Pro, and Pro+** users is now used to train GitHub's models **by default, opt-out not opt-in**. "Interaction data" is broad: your prompts and chat messages, the code around your cursor, accepted snippets, comments, file names, repository structure, navigation patterns, and thumbs up/down signals. You opt out under Settings, Privacy, a placement widely criticized as a dark pattern, and EU commentators flagged that opt-out-by-default for training data sits uneasily with GDPR's usual opt-in expectation.

**Business and Enterprise are excluded.** GitHub's contractual commitments to Business/Enterprise customers prohibit using their interaction data for training, and that exclusion is the dividing line. So for any commercial code you care about, the individual plans are off the table and only the organizational plans are defensible. This is unambiguous and it is the single most important fact in this document for CloudLib.

**EU data residency exists, but only via the Enterprise data-residency product.** Since April/May 2026, Copilot supports data residency for US and the **EU Data Boundary** (EU member states plus EFTA: Iceland, Liechtenstein, Norway, Switzerland). With it enforced, GitHub routes all Copilot requests to model endpoints within your region, and your code, prompts, and responses do not leave the region during inference. The catches: it requires **GitHub Enterprise Cloud with data residency** (a specific offering, not a checkbox on any plan), it is off by default, an admin must opt in, and it restricts you to data-resident models and changes pricing. More regions (Japan, Australia) are on the roadmap.

**The compliance framework is genuinely the most mature among US-vendor tools.** A downloadable DPA, the no-training commitment and zero-retention on Business/Enterprise, the EU Data Boundary residency option, and a FedRAMP path are real, documented strengths. That is a fair, non-promotional assessment.

**The caveat that does not go away.** Copilot is a Microsoft/GitHub product on Azure, so even with EU data residency you are dealing with a US company under US jurisdiction (FISA 702, the CLOUD Act). For most EU teams the practical risk is theoretical; there is no public record of FISA orders targeting developer code. For regulated work it warrants an explicit DPO/legal assessment, especially against the EU AI Act timeline from the first document. EU data residency addresses *where processing happens*; it does not change *whose jurisdiction the vendor sits under*. This is not legal advice; involve counsel.

**Secret leakage, a smaller but real flag.** Because models trained on public code can surface secrets, and because accepted suggestions land in your repo, a GitGuardian study found a higher rate of leaked secrets in Copilot-enabled repositories than the baseline. It is partly correlational, but the mechanism is real: review generated code for embedded credentials, and keep secret-scanning on.

**DSGVO verdict for CloudLib:**

- **Free / Pro / Pro+: no.** Trains on your interaction data by default, no DPA. Disqualifying for commercial IP-sensitive EU work, regardless of how good the features are.
- **Business ($19/user): the workable floor.** Excludes training, downloadable DPA, zero-retention. Default processing is on globally distributed infrastructure (US jurisdiction) unless you add residency.
- **Enterprise + GitHub Enterprise Cloud with data residency: the DSGVO-serious configuration.** EU Data Boundary in-region processing, the full control set, FedRAMP path. Most expensive, requires the specific GHEC-DR product, still a US vendor under US jurisdiction.

---

## 8. Where Copilot fits versus the other two documents

| Comparison | How Copilot relates |
|---|---|
| **vs Claude Code (your default)** | Competes on integration and governance, not agentic quality. Claude Code wins on raw output for complex work; Copilot wins on GitHub-native issue-to-PR automation and enterprise compliance. For a small team already on Claude Code, Copilot's unique pull is narrow: GitHub workflow automation and the mature DPA/residency/indemnity story, not "a better agent." |
| **vs OpenCode air-gapped (doc 1's DSGVO pick)** | Opposite sovereignty posture. OpenCode air-gapped keeps everything local; Copilot is US-cloud with an Enterprise residency path. For pure data sovereignty, OpenCode wins; for GitHub integration and enterprise governance, Copilot wins. |
| **vs Warp / Oz (doc 2)** | Different shape again. Warp/Oz is a multi-harness control plane; Copilot is a single-vendor IDE+cloud platform. Notably, Oz can orchestrate Copilot-adjacent agents, and Copilot's coding agent can be one worker among many in a fleet. They are not mutually exclusive. |
| **On AGENTS.md and standards (doc 1)** | Copilot reads AGENTS.md, supports MCP, and supports the SKILL.md-style customization, so it speaks the now-standard context dialects. The first document's "lean, hand-written AGENTS.md, structural facts in a queryable index" advice applies to Copilot unchanged. |

**The structural read:** Copilot is the incumbent betting on integration depth and compliance maturity as its moat, while the agent-natives bet on raw capability. The first document's thesis (harness and model are interchangeable, the durable seat is your portable context and your index) cuts against Copilot's lock-in pitch but is compatible with using Copilot as one interchangeable surface. Copilot reads AGENTS.md too; your investment in portable context is not wasted if you add or drop Copilot.

---

## 9. Honest assessment for CloudLib (problem first, then the call)

**The problem, stated plainly:** as a coding agent, Copilot is a second-best to the tool you already run, and its whole value proposition is conditional on living in the GitHub ecosystem, which the available context does not confirm CloudLib does. On the individual plans it trains on your code by default, which is disqualifying for commercial work. So the default consumer configuration is both redundant and a data-handling problem for you.

**What is genuinely good, fairly stated:** the GitHub-native issue-to-PR automation is the best of its kind and is real leverage *if you are on GitHub*; the enterprise compliance and IP-indemnity story is the most mature among US-vendor tools; completions are free and frictionless; and the model picker means you are not locked to one provider.

**The call:**

- **Do not adopt Copilot on Free/Pro/Pro+ for CloudLib code.** The training-by-default change is the disqualifier, independent of feature quality.
- **If CloudLib is not on GitHub, skip Copilot entirely.** Without the GitHub ecosystem, you are paying for a second-best agent and losing the only thing that made it distinctive. Your skepticism is correct in this scenario.
- **If CloudLib is on GitHub and you want GitHub-native automation,** the minimum is Copilot Business (training exclusion, DPA, indemnity), with the public-code filter on and license scanning in CI. For a serious DSGVO posture, Enterprise plus GitHub Enterprise Cloud with EU data residency. Use it for what it uniquely does (issue-to-PR, agentic PR review wired into your GitHub flow), not as a Claude Code replacement.
- **Watch the bill.** On usage-based billing, agent-heavy use with frontier models can outrun a seat's credits before mid-month. Set budgets, lean on pooled entitlements, and keep completions (free) as the default daily driver.

**Net:** your instinct to be unimpressed is reasonable *as a judgment about agentic quality* and *as a small team already on a better agent*. It is wrong *as a description of what Copilot is*. The accurate position is not "it is only good for comments." It is "it is a capable agentic platform whose distinctive value is GitHub integration and enterprise compliance, neither of which is a reason for CloudLib to switch its primary agent, and both of which only matter if you are on GitHub and need them." That is a narrower and more defensible version of the same skepticism.

---

## 10. Open questions to resolve before any adoption

- **Is CloudLib actually on GitHub?** This is the gating fact. If GitLab or self-hosted, most of Copilot's value does not apply.
- **Current Doe v. GitHub docket.** Confirm whether the surviving license/contract claims advanced or settled since early 2026.
- **EU data residency specifics.** Confirm that GitHub Enterprise Cloud with data residency covers the exact processing you care about, the model availability under EU Data Boundary, and the pricing delta.
- **The signed DPA and transfer mechanism.** SCCs / EU-US Data Privacy Framework status, for counsel.
- **Steady-state cost after the August 2026 promo ends**, modeled for your actual agent usage shape, not the sticker seat price.
- **Whether any of this beats your current Claude Code workflow** for a concrete CloudLib task. If it does not, the GitHub-automation case has to carry the decision on its own.

---

## 11. Sources (with dates, for re-verification)

GitHub primary:

- GitHub Blog, "GitHub Copilot is moving to usage-based billing" (27 Apr 2026) and community discussion #192948 (usage-based billing live 1 Jun 2026, code review consumes Actions minutes, annual plans retired).
- GitHub Blog, "Updates to GitHub Copilot interaction data usage policy" (25 Mar 2026; training on Free/Pro/Pro+ from 24 Apr, Business/Enterprise excluded).
- GitHub Changelog, "Data residency (US + EU) and FedRAMP-authorized models now available in Copilot" (13/24 Apr 2026; EU Data Boundary = EU + EFTA) and GitHub Enterprise Cloud docs, "GitHub Copilot with data residency."
- GitHub Blog, "What's new with GitHub Copilot coding agent" (26 Feb 2026; model picker, self-review, security scanning, custom agents) and Changelog, "Copilot CLI and agentic capabilities in JetBrains" (2 Jun 2026; agent picker, fleet/plan modes).
- GitHub features/plans page (current as of mid-Jun 2026); Microsoft Learn, "Use Agent Mode" (Visual Studio).

Capability / pricing analysis:

- NxCode "GitHub Copilot 2026 Complete Guide" (29 Mar 2026); SolidAITech (Jun 2026); buildmvpfast "Agentic Engineering 2026" (16 May 2026, 60M code reviews, GA timeline); tech-insider AU usage-based billing (Jun 2026, Opus ~27x estimate); No Code MBA, Automation Atlas, UsageBox pricing breakdowns (Jun 2026).

Licensing / IP:

- Doe v. GitHub status: ai-copyright-digest case summary (2 Jan 2026), criticnest "Is GitHub Copilot Safe for Private Code in 2026" (dismissed vs surviving claims), patentailab "Doe v GitHub Explained" (13 Apr 2026), BakerHostetler and Joseph Saveri Law Firm case pages, The Register coverage (2023-2024, filter mechanics and amended complaint).
- terms.law forum, "Who Owns GitHub Copilot Code" (20 Jan 2026; practitioner compliance playbook, indemnity gating).

Data / privacy / GDPR:

- SmartScope and WaveSpeed write-ups of the 24 Apr 2026 training change (opt-out scope, "interaction data" definition); GitLab blog, "Copilot's new policy is a governance wake-up call" (20 Apr 2026); Lurus Code, "Is GitHub Copilot GDPR compliant?" (1 Apr 2026; plan-by-plan, FISA 702 caveat; note: competitor source, factual claims cross-checked against GitHub docs).

*End of document. Cross-reference with `agentic-coding-landscape-2026-06.md` (paradigms, AGENTS.md, the OpenCode sovereignty pick) and `warp-deep-dive-2026-06.md` (the control-plane comparison). If you are a future model reading this as context: the load-bearing conclusions are (1) the "autocomplete only" framing is outdated, (2) Copilot's edge is GitHub integration and compliance, not agentic quality, (3) individual plans train on your code by default since 24 Apr 2026, and (4) only Business/Enterprise, ideally with EU data residency, are defensible for commercial EU work. Verify versions, prices, and the litigation docket against current sources.*
