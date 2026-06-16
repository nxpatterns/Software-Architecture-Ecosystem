# Agentic Coding: Paradigms, Workspace Analysis, and the Tool Landscape

**As-of date:** 16 June 2026

**Author context:** Notes for CloudLib.EU. Stack reference: Node.js / Angular / Nx monorepo, dedicated AI/processing server (ai.cloudlib.eu), commercial B2B SaaS, EU/DSGVO-bound, core technical team. Baseline already in use: Claude Code with a project context file, Repomix for one-shot packing.

**Purpose:** A durable reference on (a) how the field shifted from prompting to driving agentic systems, (b) the methods now in fashion (loops, state machines, delegation), and (c) the thing all of those depend on and that most people skip explaining: getting the workspace analysed well first. Written so that a person or a model can pick it up cold in six months and either act on it or extend it.

> **Health warning on freshness.** This field moves in weeks, not quarters. Everything here is true as of mid-June 2026 and some of it will be wrong by autumn. Versions, prices, and star counts rot fastest. The *concepts* and the *decision logic* age more slowly. When in doubt, re-verify against the sources at the bottom.

---

## 0. The one-paragraph version

The unit of work moved up a level. For two years the job was: write a good prompt, read the reply, write the next prompt. As of mid-2026 the leverage is in building the *system* that prompts the agent for you and checks its work.

That system is called a "loop," and the social-media moment that named it was a Peter Steinberger tweet on 7 June 2026 ("you shouldn't be prompting coding agents anymore, you should be designing loops that prompt your agents"), echoing Boris Cherny, the creator of Claude Code, who had said two days earlier that he no longer prompts Claude, he writes loops.

Three method families compete for attention: simple shell **loops** (Ralph), formal **state machines** (LangGraph and durable-execution engines), and **delegation** (orchestrator plus sub-agents).

They are not rivals. They are points on a control-complexity spectrum, and real setups mix them. Every one of them degrades badly if the agent cannot understand the codebase it is editing.

So the actual foundation, and the part worth investing in, is **workspace analysis**: standing instructions (AGENTS.md, SKILL.md, specs) plus on-demand structural retrieval (a code-intelligence index served over MCP).

The durable asset is the index, not the agent. Agents are now interchangeable; your codebase understanding is not.

---

## 1. Why the paradigm shifted (first principles)

Three forces, not hype, drove this.

**Force 1: context rot is real and measurable.** Large-language-model output quality degrades as the context window fills. Practitioners put the inflection somewhere between 100k and 150k tokens depending on the model, and call the region past it the "Dumb Zone." This is the single most important physical fact behind every technique below. A long interactive session inevitably drifts into that zone. The defences are either (a) keep each unit of work small and start fresh often, or (b) build machinery that manages context for you. Both lead away from one-shot prompting.

**Force 2: token economics became the buying trigger.** Once agents run autonomously for hours, "fewer broken edits" stopped being the pitch and "measurably cheaper sessions" took over. The 2026 benchmarks on the retrieval layer (Section 3b) are quoted in token reductions, not quality stars, because that is what a capped plan or a metered API bill actually feels like.

**Force 3: models got good enough to trust with a loop, but not good enough to trust without a gate.** The capability crossed the threshold where an agent can plausibly run a tool, read the result, and decide the next step on its own. It did not cross the threshold where you can let it do that unsupervised against production. So the era is defined by *controlled* autonomy: loops with caps, iteration limits, and verification gates.

The progression of where human effort sits:

write code → write prompts → design loops → build the factory that runs the loops.

The honest correction to the hype: **the prompt did not die. It got promoted.** It now lives inside the loop instead of being typed by hand each turn. Anyone telling you prompt-craft is obsolete has not read the loops they admire; those loops are full of carefully written prompts.

---

## 2. The three ways to drive an agent

Think of these as a spectrum from "deliberately dumb" to "fully formalised." Pick the least complex one that solves your problem.

### 2a. Loops, the simple end: "Ralph"

**What.** A coding agent runs in an infinite shell loop. Each iteration reads the same prompt/spec file, modifies the codebase on disk, and exits. State lives in the file system (a TODO/progress file, a spec folder, git history), not in conversation memory. Named by Geoffrey Huntley (July 2025 blog post, still the canonical reference). The name is after Ralph Wiggum from The Simpsons: a cheerful, dumb, persistent loop that is surprisingly effective.

**Why it works (this is the non-obvious part).** Fresh context every iteration is not a side effect, it is the entire point. By re-reading the full spec each loop and throwing away the accumulated conversation, Ralph never drifts into the Dumb Zone and never suffers a "compaction" event where the agent silently loses the plot. Huntley's framing: "deterministically bad in an undeterministic world," and "the more you allocate to the context window, the worse the outcomes." It is intentional, structured inefficiency.

**How, minimally.** A bash `while` loop calling the agent (Claude Code, Codex, Amp, goose, others) against a prompt file, with the spec broken into one-item-per-loop chunks small enough to fit a single context window. Reference implementations: `snarktank/ralph` (works with Amp or Claude Code), goose's built-in Ralph Loop recipe (adds a cross-model review phase: model A works, model B reviews, ship-or-revise).

**The plugin-versus-bash fight (worth knowing).** Anthropic shipped an official `ralph-wiggum` plugin for Claude Code in December 2025. Critics (Dex Horthy, Michael Arnaldi) argue it misses the point because it re-feeds the prompt inside one growing session via a Stop hook, which is *not* fresh context per iteration. If you implement Ralph as a skill or command inside the harness, you have rebuilt the thing Ralph exists to avoid. The pure bash version with a genuinely new process each loop is the real technique. The plugin is a lower-barrier on-ramp, not the same thing.

**Codex caught up.** OpenAI shipped Codex CLI 0.128.0 on 30 April 2026 with a `/goal` command that is essentially Ralph as a first-class primitive. Claude Code's `/loop` command plays a similar role. The pattern graduated from "pile of bash scripts only you understand" to a shipped feature.

**When to use.** Greenfield projects, or well-specified work where "done" means a green build and a passing test suite. Real anecdotes from the community: Huntley built an entire programming language (CURSED) over three months this way; a developer reportedly completed a $50k contract for ~$297 in API cost.

**When NOT to use.** One-shot tasks (just use the agent interactively). True exploration where you do not yet know what you want; Ralph optimises for a green build, not for taste or insight. Brownfield code with subtle constraints, unless you fence it hard. Anything touching production without a human gate (see the May 2026 recursive-deletion incident in Section 7).

**Cost reality.** Running a capable model in an autonomous bash loop lands around US$10/hour on metered API. If you do this regularly, a flat Max-tier subscription is usually cheaper than metering.

### 2b. State machines, the formal end: LangGraph and durable execution

**What.** Model the agent explicitly as a finite state machine: nodes are functions (LLM call, tool call, logic), edges are transitions (including conditional ones), and a shared state object is read and written at every step. The ReAct loop (decide → call tool → observe → decide again) is just a cyclic edge in that graph, which is where the "recursive state machine" phrasing comes from. The reference implementation is **LangGraph** ("a state machine for LLM applications," MIT licensed; LangGraph Platform is the paid hosted option).

**Why.** A plain loop has no memory of structure and no clean way to express "wait for human approval here," "retry this sub-step three times," "branch on that condition," or "resume exactly where you crashed two days ago." A state machine makes control flow explicit, traceable, and debuggable. In 2026 the production features that used to be community recipes became first-class: checkpointing, durable execution, and human-in-the-loop approval gates.

**Durable execution is the real 2026 story here.** With a persistent checkpointer (PostgreSQL or Redis), workflow state survives process restarts, server crashes, and deployments. You can start a workflow, interrupt it for human approval, and resume it days later. The heavyweight option is **Temporal** as the durable backbone with LangGraph or an agent SDK on top: Temporal handles the multi-hour lifecycle, retries, and crash recovery (each LLM/tool call becomes a replayable activity), while the graph handles the unpredictable reasoning inside each step. The OpenAI Agents SDK reached GA integration with Temporal's Python SDK on 23 March 2026, which lowers the barrier considerably.

**When to use.** When you are building a *product* that contains an agent (long-running, must survive infrastructure events, needs auditability and approval gates), not when you are just driving your own coding work. For CloudLib this matters only if the AI/processing pipeline on ai.cloudlib.eu grows agentic behaviour that has to be reliable and auditable. For "make Claude refactor my renderer," this is over-engineering.

**Cost.** Real engineering investment. Temporal's execution model in particular has a genuine learning curve, and porting LangGraph-style dynamic routing into it is awkward. Do not adopt it to look serious. Adopt it when crash-recovery and auditability are hard requirements.

**Framework housekeeping (so you do not pick a dead branch).** Microsoft renamed and rewrote AutoGen as v0.4+; the original v0.2 community continues under the name **AG2** (ag2.ai). They are related but no longer the same project. CrewAI added enterprise tooling. **Pydantic AI** emerged as a credible typed alternative. And the **Claude Agent SDK** (`@anthropic-ai/claude-agent-sdk` for TypeScript, `claude-agent-sdk` for Python) exposes the same architecture that powers Claude Code: hooks, MCP, skills, sub-agents, the execution loop. If you want to build on the same primitives you already use interactively, that SDK is the path.

### 2c. Delegation: orchestrator plus sub-agents

**What.** A primary agent decomposes a task, spawns scoped worker agents, monitors them, verifies their output, and integrates the result. It does not do the granular work itself. The mental model is a manager who plans, delegates to specialists, checks the work, and ships a coherent deliverable. The win is **parallelism** (independent sub-tasks run at once, so total time is the longest single step, not the sum) and **context hygiene** (each worker burns its own context window, keeping the orchestrator's clean).

**Claude Code's three modes (know the difference; people conflate them).**

| Mode | What it is | Use when |
|---|---|---|
| **Agent View** | A full-screen dashboard (`claude agents`) over background sessions. Sessions survive terminal closure; a supervisor process keeps them running. Dispatch, peek, attach. | Independent, unrelated tasks. Fix a bug in service A, review a PR in service B, investigate logs in service C. No dependencies. |
| **Sub-agents** | Reusable YAML configs in `.claude/agents/` with a locked model, system prompt, and tool permissions. Run *inside* a parent session, report back. Cannot spawn their own sub-agents (one level of delegation). Most token-efficient agent type. | Repeatable, scoped work. A `code-reviewer` that always uses a fixed model and checks your style guide; a test generator against your framework. Define once, invoke by name forever. |
| **Agent Teams** | An orchestrator/team-lead coordinates teammates that each run in their own context window and message each other, via a shared task list. Still experimental, disabled by default. | Dependent work that should be split across longer-lived sessions. A frontend refactor that needs API changes first, test updates second, a consolidated PR third. |

**The three-tier orchestration model (Addy Osmani's framing, useful beyond Claude Code).**

- **Tier 1, interactive:** sub-agents and Agent Teams in a single terminal. Start here. Best for up to a handful of agents on a known codebase.
- **Tier 2, local fleet:** your machine spawns multiple agents in isolated git worktrees; you stay in the loop with dashboards, diff review, and merge control. Best for ~3 to 10 agents. Tools: Conductor, Vibe Kanban, Gas Town, OpenClaw + Antfarm, Claude Squad, Cursor Background Agents, Antigravity.
- **Tier 3, cloud:** assign a task, close the laptop, return to a pull request. Agents run in cloud VMs, no local setup. Tools: Claude Code Web, GitHub Copilot Coding Agent, Jules (Google), Codex Web (OpenAI).

Most teams in 2026 use all three: Tier 1 for interactive work, Tier 2 for parallel sprints, Tier 3 to drain the backlog overnight.

**Recursive delegation (the scaling trick).** Do not have one orchestrator spawn six sub-agents; that fragments its context. Spawn two "feature leads," each of which spawns its own two or three specialists. The orchestrator only talks to two agents and stays clean. This buys depth of decomposition without context explosion.

**"Gas Town" and the frontier.** Steve Yegge's term, adopted by Huntley, for orchestrating many autonomous loops into a self-evolving ecosystem. Huntley's personal implementation, "Loom," runs cloned versions of GitHub and Daytona to control everything from source to execution. This is the bleeding edge and is genuinely chaotic ("a spaghetti base in factorial," in Huntley's words). Interesting to track, not something a small team should run in production yet.

**When delegation hurts.** Coordination overhead is real. Multiple agents on one codebase collide (two branches checked out at once, merge conflicts), which is why worktree isolation is mandatory past Tier 1. If the work does not actually decompose into independent parallel chunks, a single focused session beats an orchestra.

### The unifying view

```
                deliberately dumb  <─────────────────────>  fully formalised
                       Ralph loop      sub-agents/teams       LangGraph/Temporal
control complexity:      low               medium                  high
context strategy:    fresh per loop     per-agent windows      explicit state object
crash recovery:      git reset          re-dispatch            checkpoint + resume
best for:            greenfield,        parallel scoped        productised agents,
                     specced work       coding work            auditable workflows
```

A mature setup is not "loops vs state machines vs delegation." It is a Ralph-style outer loop that dispatches sub-agents, with a memory file on disk, and only reaches for a real state machine if it is shipping an agent as a product. Choose the least machinery that holds.

---

## 3. The prerequisite nobody front-loads: workspace analysis

Here is the thing the loop hype skips. Every method in Section 2 assumes the agent can understand the codebase it is editing. When it cannot, you get the classic failure: an agent edits a function without knowing that 47 other functions call it, renames a class without tracing the import chain, refactors a module without checking the blast radius. A loop running over a misunderstood codebase does not produce good software faster. It produces broken software faster, at machine speed.

So the real investment is making the workspace legible to the agent. This splits into two layers that solve different problems and are frequently confused:

- **3a. Standing context** is what the agent should *always* know: conventions, build commands, architectural boundaries, guardrails. Static, version-controlled, loaded every session.
- **3b. On-demand structural retrieval** is what the agent needs to *look up* about *this* task: who calls this, what breaks if I change it, where is the code that does X. Dynamic, queried per task, served from an index.

You need both. They are not substitutes.

### 3a. Standing context: AGENTS.md, SKILL.md, and specs

**AGENTS.md is now the de facto standard.** A markdown file at the repo root that tells coding agents the conventions, build steps, testing requirements, and guardrails for that codebase. Think "README written for machines." It was formalised at agents.md in mid-2025, and in December 2025 it was donated, alongside Anthropic's MCP and Block's goose, to the **Agentic AI Foundation (AAIF)** under the Linux Foundation. Founding members include Anthropic, OpenAI, and Block; backers include Google, Microsoft, AWS, Bloomberg, and Cloudflare. As of 2026 it is read by Claude Code, Codex CLI, Cursor, Aider, Devin, Sourcegraph Amp, Jules, Zed, Continue, Roo Code, Factory, GitHub Copilot, Gemini CLI, Windsurf/Devin Desktop, and Amazon Q. Adoption is north of 60,000 repositories.

**Why this matters for an Nx monorepo specifically:** most tools read AGENTS.md *hierarchically*, walking to the nearest file relative to the file being edited. That means per-package AGENTS.md overrides in a monorepo work cleanly. One root file for global rules, one per library/app for local conventions. This maps almost perfectly onto an Nx workspace layout.

**SKILL.md is the matching standard for reusable agent skills** (named recipes the agent can call). Also cross-tool as of 2026: Claude Code, Codex CLI, Gemini CLI, Copilot, Cursor, Cline, Windsurf, OpenCode. A skill written for one tool can usually be copied into another's skills directory. Some features stay tool-specific (Claude Code adds context forking; Codex adds `openai.yaml` metadata).

**Spec-driven development (SDD): the spec as the artifact.** The structured response to "vibe coding" (Karpathy's term, Feb 2025) and its failure modes: plausible code that drifts from intent, hallucinated APIs, and decay at scale. In SDD the specification is the source of truth and code is a regenerable build output. "The spec is the prompt." Martin Fowler's team frames three levels:

- **spec-first:** specs drive generation, code is then maintained by hand.
- **spec-anchored:** specs and code coexist and are kept in sync.
- **spec-as-source:** specs are the sole artifact, code is fully generated (the radical end).

Tooling: **GitHub Spec Kit** (CLI, templates, prompts moving work through spec → plan → tasks → implementation; multi-agent), **AWS Kiro** (enforces spec → design → tasks → implementation, with "steering documents" like `structure.md` that encode file organisation and architectural decisions, plus event-driven agent hooks and property-based test generation), **Claude Code Skills** (package an SDD workflow as a slash command), plus OpenSpec, BMAD, Tessl, and Antigravity. **EARS** is the controlled-syntax notation that makes acceptance criteria machine-readable. Reported gains: GitHub claims roughly an order-of-magnitude fewer "regenerate from scratch" cycles; Kiro documents 40-hour features shipped in under 8 hours of human time. DeepLearning.AI ran a dedicated short course in late 2025, which is the usual "crossed into mainstream" signal.

Note the relationship: Kiro's `structure.md` steering document is essentially a richer, more enforced AGENTS.md. SDD and AGENTS.md are the same idea at different intensities: turn one-off chat context into durable, reviewable, version-controlled engineering context.

#### The counterintuitive evidence (read this before you write a 2,000-line context file)

This is where conventional wisdom is wrong, and where it pays to think from first principles rather than copy what everyone posts.

An ETH study (2026) evaluated multiple coding agents and LLMs against benchmarks, comparing LLM-generated context files, developer-written context files, and no repository context. Two common practices took damage:

1. **LLM-generated context files hurt performance.** In 5 of 8 tested settings, having the agent write its own context file *reduced* task success rates and increased the number of steps taken. The "just ask Claude to generate your CLAUDE.md" shortcut is actively counterproductive in most cases.
2. **Architectural overviews increased inference cost and encouraged broader, more wasteful file traversal without improving success.** A long "here is how the whole system fits together" section makes the agent wander and spend tokens, and does not make it finish more often, especially when the directory layout already follows framework conventions the model knows.

Add the well-documented "lost in the middle" effect (Claude Code agents demonstrably ignore instructions buried mid-file) and the failure mode where stale structural references actively mislead once the codebase changes.

**Practical rules that fall out of this:**

- Keep the file short. Put the critical, non-obvious rules early.
- Do not paste a directory tree or an architecture essay the agent can derive itself. Drop the "Project Structure" section entirely if your layout is conventional.
- Hand-write it. Do not auto-generate it. Treat updates as code changes (review them, version them).
- Encode *prescriptive* things the agent cannot infer: "use Transloco, never @angular/localize," "OnPush by default," "this service must stay stateless." Not descriptive narration of what the code already shows.
- Start new sessions for new tasks rather than letting one session's context bloat.

The instinct after reading the loop hype is to write an enormous standing-context document so the agent "knows everything." The evidence says the opposite: a lean, prescriptive, hand-written file beats a fat generated one, and structural facts belong in a queryable index (3b), not in the prompt.

### 3b. On-demand structural retrieval: the code-intelligence layer

This is the layer that gives the agent structural understanding it can *query*: dependencies, call chains, blast radius, symbols, semantic search. It is served to the agent over **MCP** (the standard transport), so it works across whatever harness you use. The category went from niche to vertical in spring 2026 (two open-source tools crossed 40,000 GitHub stars), and a key thesis crystallised: **the durable primitive is the index, not the agent.** Augment Code, a vendor with US$252M raised, conceded the agent layer to Claude Code and Cursor and shipped its real asset, the semantic index, as a standalone MCP server. Expect more of this.

**The grep-versus-index debate got data.** Anthropic ships *grep-only* retrieval in Claude Code, reportedly because grep "just worked better." The entire code-intelligence category is a bet against that position, and as of May–June 2026 the bet has numbers, mostly pointing the same way for non-trivial codebases:

- grepai: an independent benchmark measured ~97% fewer Claude Code input tokens and ~27.5% lower API cost.
- CodeGraph: independently measured ~70% median tool-call reduction (58% vendor-reported).
- GitNexus: a production audit reported ~88% fewer tool calls and ~74% token savings.
- Augment: vendor-run claims of 70%+ agent quality gains.

Honest caveats: the strongest numbers are tool-specific, several are vendor-reported and unreplicated, and grep still wins on zero setup and exact-pattern speed. Direction of travel: indexed/semantic retrieval beats raw agentic grep on token economics once the codebase is non-trivial.

**The four tiers.**

| Tier | What it does | Pick when |
|---|---|---|
| **1. Knowledge graphs** | Model every import, call, definition, extension. Enable blast-radius analysis ("if I change this, what breaks?"), impact detection, safe cross-file rename, execution tracing. | Complex refactors, impact analysis, large dependency chains. |
| **2. Symbol + semantic search** | Symbol navigation and/or fuzzy "where is the code that does X" retrieval. Lighter than a full graph. | Navigation, fuzzy search, symbol-level editing. The everyday layer. |
| **3. Context packing** | Flatten the repo into one LLM-friendly file. No graph, no DB. | Small/medium repos, one-shot context dumps. |
| **4. Commercial engines** | Hosted/cross-repo semantic indexes, enterprise integration. | Cross-repo at scale with a cloud budget. |

**The tools that matter, with the two columns you actually care about (licence and where your code goes).**

| Tool | Tier | Licence | Runs | Notes |
|---|---|---|---|---|
| **CodeGraph** | 1 | MIT | Local | Biggest in category (~47k stars). One embedded SQLite file + tree-sitter, 21 languages, 8 agent integrations, file-watcher incremental sync. Commercial-safe. Solo-maintained (~91% one person's commits). Hosted platform on waitlist. |
| **GitNexus** | 1 | **PolyForm Noncommercial** | Local | Deepest MCP integration (16 tools, skills, Claude Code hooks, cross-repo groups). **Commercial use requires a separate paid licence via Akon Labs.** Re-index only (incremental on roadmap). |
| **CodeGraphContext** | 1 | MIT | Local | Pluggable backends (FalkorDB Lite, KuzuDB, Neo4j), 22 languages. The MIT alternative one team picked specifically to escape GitNexus's licence. |
| **Serena** | 2 | MIT | Local | The symbol-level standard (~25k stars). LSP-over-MCP, does retrieval *and* editing/refactoring (`find_symbol`, `find_referencing_symbols`, `replace_symbol_body`, project-wide rename), 40+ languages. Commercial-safe. |
| **claude-context** | 2 | MIT | **Cloud by default** | Zilliz's hybrid BM25 + vector search, AST chunking, Merkle incremental. **Sends code chunks to a cloud embedding API and vector store by default.** Self-hosting Milvus + Ollama avoids egress. Privacy/DSGVO concern as-shipped. |
| **grepai** | 2 | MIT | Local | 100% local via Ollama embeddings, call-graph tracing, single Go binary with a watcher daemon. Best independently-verified token savings. Solo-maintained. |
| **Repomix** | 3 | (permissive) | Local | Category leader (~26k stars, ~255k npm/month). XML output tuned for Claude parsing, tree-sitter compression (~70% token reduction). v1.14.0 (April 2026) cut pack time 58%. Has an MCP server for dynamic packing. **This is your current baseline; it still holds for one-shot context.** |
| **Aider repo-map** | 3 | Apache-2.0 | Local | Not standalone; built into Aider. Tree-sitter tag map, dynamically optimised per chat. |
| **Augment Context Engine** | 4 | Commercial (closed) | Local or **hosted** | GA Feb 2026. Local Auggie CLI mode (no egress) or Augment-hosted cross-repo index (egress). **Token pricing plus a ~40% service fee.** Strong but self-reported benchmarks. |
| **Sourcegraph Cody / Greptile / DeepWiki** | 4 | Commercial / SaaS | Cloud | Cody: enterprise code search + RAG. Greptile: AI code review with full-repo context (YC-backed). DeepWiki: free auto-docs for public GitHub repos. All have cloud components. |

**Decision shortcut.**

- Need blast radius / impact analysis, local and commercial-safe → **CodeGraph** (MIT) or **CodeGraphContext** (MIT). Avoid GitNexus for commercial use unless you buy the Akon Labs licence.
- Need symbol-level navigation *and* editing, local → **Serena** (MIT). Strong fit for a TypeScript/Angular codebase via LSP.
- Need fuzzy semantic search, fully local → **grepai**. If you accept cloud or self-host the vector DB → claude-context.
- Need to pack a repo into one prompt → **Repomix** (you already have it).
- Cross-repo at enterprise scale with budget and an acceptable data-flow → Augment or Cody.

**Two caveats that age slowly.**

1. **Concentration risk.** The two 40k-star leaders (CodeGraph, GitNexus) are effectively solo-maintained, and both maintainers concede star velocity outruns community depth (some growth may be bot-driven). Treat star counts as awareness, not durability. Do not build a hard dependency on a one-person pre-1.0 project without a fallback.
2. **IDE absorption.** Cursor, Claude Code, and Windsurf/Devin Desktop are all building native code intelligence. Every tool in this category is racing the chance that the harness absorbs its function. The sharpest criticism of Serena is precisely that Claude Code's native tools keep getting better. The gap that remains open across the whole category: nobody has shipped a *standard semantic layer* so agents can query any engine the same way. MCP standardised the transport, not the semantics. Whoever defines that wins the category.

---

## 4. The harnesses (tool landscape), June 2026

The agent you run. This list rots fastest; verify versions before quoting them.

| Tool | Form | State as of June 2026 | Notable |
|---|---|---|---|
| **Claude Code** | Terminal-first agent | Opus 4.x line (4.8 current), `/ultrareview`, auto mode for Max users, up to 1M-token extended context (200k standard), Agent Teams, automatic memory, Agent Skills. Ranked top for code *quality* (blind reviews preferred its output ~67% vs Codex ~25% in one comparison). Plans US$20–$200, no free tier. | Cleanest output, terminal-native, the SDK and skills ecosystem. The most natural home given your existing setup. |
| **OpenCode** | Open-source agent infra | New, topped one June 2026 ranking. Background sub-agents, a "Scout" agent for external-doc research, and crucially an **air-gapped mode with Ollama (zero data leaves the machine).** Model-agnostic (it is infrastructure, not a model). | The standout for strict data-residency/IP needs (defence, healthcare, fintech, and arguably DSGVO-bound SaaS). Worth a serious look for CloudLib. |
| **Codex (OpenAI)** | CLI + cloud | `/goal` (Ralph primitive) in the CLI. Now bundled across ChatGPT plans (Free through Enterprise). Codex Web for cloud delegation. | Strong autonomous execution; cloud sandboxes for safe runs. |
| **Cursor** | AI-first IDE (VS Code fork) | Cursor 3.7, Composer 2.5, dedicated Tab model, up to 8 parallel agents with auto-judging of best solution, cloud agents with their own VMs, multi-repo workspaces, plugin marketplace, commit-to-merged-PR. Teams repriced June 2026 (Standard ~$32/seat/mo annual, Premium ~$96/seat/mo annual). | Best full-IDE experience and the most mature parallel-agent implementation. |
| **Devin Desktop (formerly Windsurf)** | IDE | **Cognition retired the Windsurf brand on 2 June 2026** and relaunched the IDE as Devin Desktop, with an Agent Command Center and support for the open **Agent Client Protocol (ACP)** so Codex, Claude Agent, OpenCode, and others run inside it. Pro raised to ~$20 (from $15) in May 2026; Max ~$200. | If your notes still say "Windsurf," update them. The ACP support is the interesting part: harness-agnostic agents. |
| **Antigravity (Google)** | Agent-first IDE + CLI | **Antigravity 2.0 relaunched at I/O on 19 May 2026:** multi-agent suite, redesigned desktop app, a new Go-based **Antigravity CLI** scheduled to replace Gemini CLI for consumers around 18 June 2026, public SDK, dynamic sub-agents, scheduled background tasks, Gemini 3.5 Flash default (very fast, ~4x Opus 4.8 throughput on one benchmark). The 1.0 preview had serious stability complaints in Jan 2026; 2.0 is the do-over. | Massive context, Google-ecosystem depth, raw speed. Verify stability before committing; the 1.0 reputation was bad. |
| **Gemini Code Assist** | IDE extension (VS Code/JetBrains) | Agent mode with whole-project understanding; can index internal Markdown docs; `@`-mention remote repos. Enterprise edition has SOC 2 Type II, ISO 27001, HIPAA, FedRAMP, GDPR, and data-residency options; can run on Google Cloud. | The reliable, compliance-heavy Google option. The cleaner IP/compliance alternative to Augment if you want a hosted enterprise engine. |
| **GitHub Copilot** | IDE plugin + coding agent | Moved to usage-based/flex billing on 1 June 2026, added a ~$100 Max plan, agent mode, Coding Agent (cloud). SOC 2. | Default for GitHub-centric teams; weaker on deep multi-file/cross-repo reasoning than the agent-natives. |
| **Aider** | Open-source CLI | Mature, built-in repo-map (Tier-3 retrieval), model-agnostic. | The lean open-source workhorse. |
| **Jules (Google) / Claude Code Web / Codex Web** | Cloud agents | Tier-3 "close the laptop, get a PR" delegation. | Backlog-draining overnight. |

**Interop protocols worth knowing (three letters each, easy to confuse):**

- **MCP** (Model Context Protocol, Anthropic, now under AAIF): how agents call tools and data sources, including the code-intelligence layer in 3b. The dominant standard.
- **A2A** (Agent-to-Agent): how agents talk to each other across vendors.
- **ACP** (Agent Client Protocol): how different agents plug into the same IDE/client surface (Devin Desktop runs multiple ACP agents). Newer.

The direction is clear: the harness and the model are becoming interchangeable, swappable behind shared protocols. Which reinforces the Section 3 thesis: invest in the durable layer (your context and your index), not in a specific agent you might swap next quarter.

---

## 5. What this means for CloudLib (the actual recommendation)

Given the constraints (Nx monorepo, Node/Angular, commercial, EU/DSGVO, small team, Claude Code + Repomix already in hand), here is the pragmatic stack and the reasoning. Lead with what to do, then why.

**Standing context (do this first, it is cheap and high-leverage):**

- Migrate the project context file from CLAUDE.md to **AGENTS.md**. It is now the cross-tool standard, so you stop betting on one vendor and your context survives a harness switch. Claude Code still reads it.
- Use **per-package AGENTS.md** in the Nx workspace. Root file for global rules (Transloco-only, OnPush-default, the `@Service()` convention, "stay stateless" boundaries), per-lib/app files for local conventions. Hierarchical reading makes this work natively in a monorepo.
- Keep skills as **SKILL.md** (you already maintain user skills; the format is now portable across Claude Code, Codex, Gemini CLI, etc.).
- **Heed the ETH study.** Do not bloat these files. No auto-generated context, no directory-tree dumps, no architecture essays the model can derive. Short, hand-written, prescriptive, critical rules first. This is the one place where following the herd (big generated context docs) measurably hurts.

**On-demand retrieval (the durable investment):**

- Add a **local, MIT-licensed code-intelligence index over MCP.** For your TypeScript/Angular codebase, **Serena** (symbol-level navigation and safe rename via LSP) is the natural everyday layer, and **CodeGraph** (blast-radius/impact analysis) is the natural addition when you do cross-cutting refactors. Both are MIT, both run local, both are DSGVO-safe (no code egress).
- **Do not use GitNexus for commercial CloudLib work** unless you buy the Akon Labs commercial licence. Its PolyForm Noncommercial licence prohibits exactly your use. You flagged GitNexus as known; this is the catch.
- **Do not use claude-context as-shipped** (it sends code chunks to a cloud vector store by default, which is a DSGVO and IP problem). If you want its semantic search, self-host Milvus + Ollama so nothing leaves your infrastructure. Otherwise prefer grepai (100% local) for fuzzy search.
- **Keep Repomix** for one-shot context dumps. It still earns its place; the April 2026 release also made it noticeably faster.

**Driving the work (adopt gradually, gate hard):**

- For bounded, well-specified jobs (the kind of FFmpeg/render-tuning and DSGVO-anonymisation batch work you already do), use a **loop**: Claude Code `/loop` or Codex `/goal`, with a clear spec, an iteration cap, a no-progress detector, and a dollar budget. Verification gate = your existing tests and type-checks. This is `controlled` autonomy; the cap is not optional.
- For **greenfield** features (Smart Glasses Capture is a candidate), a **Ralph-style fresh-context loop** with one-item-per-loop specs fits well, because the failure mode you most need to avoid (context rot over a long build) is exactly what Ralph defends against. Run it in an isolated branch/worktree and be ready to `git reset --hard` and restart rather than rescuing a broken tree.
- For **repeatable scoped tasks**, define Claude Code **sub-agents**: a `code-reviewer` locked to your conventions, a test generator against your framework. Define once, reuse forever, predictable cost.
- For **cross-cutting monorepo changes** (frontend plus API plus tests in one PR), try **Agent Teams**, with **worktree isolation** so parallel agents do not collide on branches. This is the one place the Nx monorepo makes coordination genuinely harder, so isolation is mandatory.
- **Do not reach for LangGraph/Temporal** to drive your coding. That machinery is for shipping an auditable agent *inside* a product. It becomes relevant only if the ai.cloudlib.eu pipeline grows agentic behaviour that must survive crashes and be auditable. For "make Claude refactor the renderer," it is pure overhead.

**One strategic option to evaluate seriously:** **OpenCode's air-gapped Ollama mode** is the cleanest answer to "I want autonomous agents but my code and my customers' data are DSGVO-bound and must not leave my infrastructure." It is model-agnostic infrastructure, so you are not locked to one vendor. For an EU SaaS with IP sensitivity, this is worth a pilot even though Claude Code is your default for quality. The honest trade-off: local Ollama models are weaker than Opus, so you would be trading output quality for data residency. Test on a real task before deciding.

**Net:** the highest-leverage, lowest-risk moves are the boring ones. Lean AGENTS.md, a local MIT-licensed index over MCP, and capped loops with test gates. The exotic stuff (Gas Town, Temporal, ten-agent orchestration) is real but premature for a small team. Spend on the index and the context. Those survive every agent you will swap through.

---

## 6. Licensing and data-flow flags (consolidated)

Per the standing rule: anything that prohibits commercial use, charges a fee, or moves your code off-premises is flagged here explicitly.

| Tool | Licence | Commercial use | Data leaves your machine? | Flag |
|---|---|---|---|---|
| CodeGraph | MIT | Free | No | Clear. Solo-maintained. |
| CodeGraphContext | MIT | Free | No | Clear. |
| Serena | MIT | Free | No | Clear. |
| grepai | MIT | Free | No | Clear. Solo-maintained. |
| Repomix | Permissive (MIT-style) | Free | No | Clear. |
| Aider (+ repo-map) | Apache-2.0 | Free | No (model calls aside) | Clear. |
| CodePathFinder | Apache-2.0 | Free | No | Clear. |
| **GitNexus** | **PolyForm Noncommercial** | **No, needs paid Akon Labs licence** | No | **Blocked for CloudLib unless licensed.** |
| **claude-context** | MIT | Free | **Yes, cloud vector store by default** | **DSGVO/IP risk as-shipped; self-host to avoid.** |
| **mcp-vector-search** | **Elastic 2.0** | Internal use generally OK; cannot offer as a managed service to third parties | No | Minor: Elastic 2.0 restricts reselling it as a service. |
| **Augment Context Engine** | Commercial (closed) | Paid | Local mode no; **hosted mode yes** | **Cost (token pricing + ~40% service fee) and egress in hosted mode.** |
| Sourcegraph Cody | Commercial | Paid | Cloud components | Cost + egress. |
| Greptile | Commercial (SaaS) | Paid | Yes | Cost + egress. |
| Gemini Code Assist (Enterprise) | Commercial | Paid | Cloud, but EU data-residency + GDPR/SOC2/ISO available | Cost; compliance-friendly. |
| Claude Code / Codex / Cursor / Copilot (paid tiers) | Commercial | Paid | Yes (model calls; check each vendor's data/retention terms) | Standard SaaS cost + data-handling review. |
| OpenCode | Open-source | Free | **No in air-gapped Ollama mode** | Clear, and the strongest data-residency story. |

If you adopt any cloud-indexed or hosted tool, do a DSGVO data-flow review first: what code/PII is sent, where it is stored, retention, sub-processors, and whether a Data Processing Agreement is in place. This is not legal advice; confirm specifics with counsel.

---

## 7. Regulatory and safety watch (light, not legal advice)

- **EU AI Act.** The high-risk-system obligations are scheduled to take effect in **August 2026**, with general-purpose-AI-model obligations already phasing in from 2025. Whether and how this touches your *use* of coding agents (versus building a regulated AI product) is nuanced and worth a counsel check rather than a guess. You already track this; flagging the date so it does not sneak up.
- **Export controls.** You have been tracking these. Concrete recent example: around 12 June 2026, a US export-control directive reportedly led Anthropic to suspend access to its Fable 5 / Mythos 5 models for affected customers. The practical lesson for a vendor-dependent workflow: model availability is now a geopolitical variable, which is another argument for harness/model portability (Section 4) and a local fallback (OpenCode/Ollama).
- **Autonomy safety, learned the hard way.** A May 2026 incident saw an autonomous agent follow a vague "delete legacy data" instruction into production and the cross-region replication buckets, wiping point-in-time recovery snapshots, using a legitimate admin token that no RBAC/IaC scanner flagged. The general lesson is now standard practice: a mandatory human-in-the-loop gate for destructive operations, an "agentic kill switch," hard iteration/budget caps, and never handing an autonomous loop a token that can `rm -rf` production. The number-one operational plague of 2026 agentic engineering is the infinite loop (truncated error logs convince the agent the bug persists; vague "done" conditions; silently-failing validation). Caps and verifiable goals are the antidote.

---

## 8. Open questions / what to revisit

Track these; they will decide whether parts of this document hold.

- **Does Anthropic ship first-party semantic retrieval in Claude Code?** If yes, it validates the whole semantic-index thesis while absorbing much of the standalone niche (Serena's value in particular).
- **Does a standard semantic layer for code intelligence emerge?** MCP standardised transport, not semantics. Whoever standardises "query any code engine the same way" wins the category.
- **Do the solo-maintained leaders (CodeGraph, GitNexus) grow real contributor depth, ship 1.0, and publish hosted/commercial terms?** Concentration risk is the category's soft underbelly.
- **Does Augment's 70%+ benchmark get independently replicated?** The whole paid-engine value proposition rests on numbers that are currently vendor-run.
- **Does loop engineering settle into tooling or stay a debate?** Half the field calls it the next abstraction layer; half calls it "a cron job wearing a hat." Both are partly right. Watch whether the harnesses make capped, verified loops boringly reliable.
- **Antigravity 2.0 stability.** The 1.0 reputation was bad. If 2.0 holds and Gemini 3.5 Flash's speed/quality balance is good, the calculus shifts.
- **For CloudLib specifically:** pilot OpenCode air-gapped on one real task and measure the quality gap versus Opus. That number decides whether data-residency-by-architecture is viable for you or whether you stay on hosted Claude with a data-flow review.

---

## 9. Glossary (so future-you does not have to re-derive the jargon)

- **Loop engineering:** building the system that prompts an agent on a schedule against a goal, instead of typing each prompt by hand. The prompt moves inside the loop.
- **Ralph / Ralph Wiggum loop:** a recursive agent pattern where an agent runs in a shell loop, re-reads the same spec each iteration, and uses the file system (not conversation history) as memory. Fresh context per iteration is the point.
- **Context rot / compaction / the "Dumb Zone":** the measurable quality drop as the context window fills (roughly past 100k–150k tokens). Compaction is the silent event where the agent loses earlier context. Everything in Section 2 is a strategy for avoiding this.
- **Blast radius:** everything that breaks if you change a given symbol. The headline capability of a knowledge-graph index.
- **Knowledge graph vs context packing:** a graph *models* relationships you can query (who calls this?); packing *flattens* the repo into one prompt. Different problems.
- **MCP / A2A / ACP:** agent-to-tools / agent-to-agent / agent-to-client-surface protocols, respectively.
- **AGENTS.md:** the standard root-level markdown file of conventions and guardrails for coding agents. SKILL.md is the matching standard for reusable agent skills.
- **SDD (spec-driven development):** spec is the source of truth, code is a regenerable build output. Levels: spec-first, spec-anchored, spec-as-source. EARS is the machine-readable acceptance-criteria notation.
- **Sub-agent vs Agent Team (Claude Code):** sub-agent = scoped worker inside one session, cannot spawn its own sub-agents, most token-efficient. Agent Team = multiple longer-lived sessions coordinated by an orchestrator, messaging each other.
- **Durable execution:** workflow state persisted (checkpointer / Temporal) so an agent run survives crashes and can resume days later.
- **Vibe coding:** ad-hoc prompt-driven coding (Karpathy, Feb 2025). Great for exploration, bad for institutional memory; the thing SDD reacts against.

---

## 10. Sources (with dates, so claims can be re-verified)

Primary / standards:

- agents.md spec; OpenAI, "OpenAI co-founds the Agentic AI Foundation under the Linux Foundation" (Dec 2025); CDO Magazine and IntuitionLabs AAIF write-ups (Dec 2025 / Apr 2026).
- Gemini Code Assist release notes, Google Cloud docs (updated through Apr 2026).
- Geoffrey Huntley, "Ralph Wiggum as a software engineer" (ghuntley.com, canonical July 2025; updated Feb 2026) and "everything is a ralph loop" (Jan 2026).

Loop engineering:

- Data Science Dojo, "Agentic Loops: From ReAct to Loop Engineering" (June 2026); Firecrawl, "Loop Engineering" (June 2026); Lushbinary, "Loop Engineering: The Guide for AI Agents" (June 2026); explainx.ai loop-engineering guide (June 2026); Interesting Engineering, "Designing Loops" (June 2026). Steinberger tweet dated 7 June 2026; Cherny remarks ~5 June 2026; Addy Osmani credited with popularising the term.

Ralph / recursion / state machines:

- Thomas Wiegold, "The Ralph Loop: How Recursive AI Agents Actually Work" (May 2026); LinearB, "Mastering Ralph loops" and "Inventing the Ralph Wiggum Loop" (Jan 2026); ZeroSync Ralph deep-dive (Jan 2026); goose docs Ralph Loop tutorial; snarktank/ralph (GitHub).
- "LangGraph Explained (2026 Edition)" (Jan 2026); CallSphere, "LangGraph Agent Patterns 2026" (May 2026); AgentMarketCap, "LangGraph vs Temporal" (Apr 2026, notes OpenAI Agents SDK + Temporal GA 23 Mar 2026); alicelabs, "Best AI Agent Frameworks 2026."

Delegation / orchestration:

- Addy Osmani, "The Code Agent Orchestra" (addyosmani.com, Mar 2026); CloudZero, "Claude Code Agents in 2026" (May 2026); hidekazu-konishi Claude Code sub-agents guide (June 2026); Shipyard, "Multi-agent orchestration for Claude Code" (2026); Nimbalyst sub-agents guide (May 2026).

Workspace analysis / code intelligence:

- Ry Walker Research, "Code Intelligence Tools" (rywalker.com, published Mar 2026, updated 11 June 2026) — primary source for the tier tables, star counts, licences, and benchmark figures.
- Augment Code, "How to Build Your AGENTS.md (2026)" (Mar 2026) — primary source for the ETH study findings on context files; BuildBetter and Kingy AI AGENTS.md guides (2026); agensi.io SKILL.md open-standard write-up (Apr 2026).
- Serena: vibecodinghub, a2a-mcp, oraios/serena (GitHub). claude-context: zilliztech/claude-context. grepai: yoanbernabeu/grepai. CodeGraph, GitNexus, CodeGraphContext, Repomix per the Ry Walker tables.

Spec-driven development:

- thebcms.com, "Spec-Driven Development: The Definitive 2026 Guide" (2026); productbuilder.net SDD 2026 guide; Augment "Kiro vs Augment Code" (Apr 2026); Carlos Biagolini and Vishal Mysore Kiro/Spec-Kit write-ups (2026). Martin Fowler's team referenced for the three-level model; EARS notation; DeepLearning.AI short course (late 2025).

Harness landscape / June 2026 state:

- LogRocket, "AI dev tool power rankings" (June 2026, OpenCode #1, air-gapped Ollama mode); Lushbinary, "AI Coding Agents 2026 ... comparison" (updated June 2026, Windsurf→Devin Desktop 2 June, Antigravity 2.0 19 May, Cursor Teams repricing, billing changes); cosmicjs and prommer.net comparisons (June 2026, Cursor 3.7 / Composer 2.5); Developers Digest pricing (June 2026); Augment Antigravity vs Gemini comparisons (Jan 2026).

Regulatory / safety:

- IntuitionLabs AAIF article (EU AI Act high-risk timeline Aug 2026); Tech Bytes post-mortems on the May 2026 recursive-deletion incident and on infinite-loop failure modes (Feb / May 2026); export-control note per Lushbinary update (12 June 2026).

*End of document. If you are a future model reading this as context: treat the version numbers and prices as stale, trust the decision logic in Sections 2, 3, and 5, and re-verify anything load-bearing against current sources.*
