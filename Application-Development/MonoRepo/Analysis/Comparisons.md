# Angular + NestJS Monorepo Comparison

## Short version

"Without Nx" does not mean "without monorepo". Angular CLI runs multiple apps and libraries from one `angular.json`, Nest CLI has a monorepo mode (`nest-cli.json`, `apps/` + `libs/`), pnpm workspaces glue the two together. What you lack is anything that spans both CLIs: a dependency graph, affected detection, task ordering, caching. That is the entire product Nx sells. The real question is whether you need cross-CLI orchestration and what it costs you.

## Nx with Angular + NestJS

What you get: one project graph over frontend, backend and shared libs (DTOs, validation schemas). `nx affected -t build test lint` is the actual payoff of a two-CLI stack. Task graph and local cache out of the box. Generators, targets inferred from `angular.json`, and `nx migrate` that bumps Angular, Nest and Nx together; Nx 23 made migrate AI-assisted for multi-major upgrades. Module boundaries enforced by tags plus a lint rule, so Angular code cannot import server-only libs. Two layouts: integrated (`project.json`) or package-based via `nx init` on an existing pnpm workspace.

**What it costs you, leading with the ugly parts:**

Version coupling. An Angular major waits for the matching Nx release; Angular 22 and TypeScript 6 support arrived with Nx 23.1 in July 2026. Nx 23 also removed a batch of long-deprecated generators, executors and APIs, so you ride their deprecation cadence, not only Angular's.

Remote cache is now effectively a paid decision. In May 2026 Nx deprecated its free self-hosted remote cache plugins after a cache-poisoning vulnerability (CVE-2025-36852). The documented options today: Nx Cloud, or build your own cache server against their OpenAPI spec (two endpoints, bearer token, not hard, but it is your server). Conformance rules and Owners, formerly Powerpack, are now Nx Enterprise.

Supply chain record. The Nx ecosystem was hit twice within a year: the s1ngularity npm credential stealer in August 2025, then a compromised Nx Console 18.95.0 in May 2026. The Console incident is CVE-2026-48027, CVSS 9.8, listed in CISA KEV; the CLI, official plugins and Nx Cloud were not affected, and the attacker got in via a contributor compromised by the TanStack supply-chain attack. Consequence: pin versions, no auto-update on the VS Code extension, lockfile review on `postinstall` changes.

Cache correctness is on you. Wrong `inputs`/`outputs` means stale artifacts, and Angular's own `.angular/cache` sits under Nx's cache, so two layers to reason about. The Nest plugin is thin (build executor plus generators); Nest CLI's own monorepo mode already does most of that.

## Without Nx (Angular CLI + Nest CLI + pnpm workspaces)

Gains: nothing between you and the framework CLIs, `ng update` and Nest migrations on their own schedule, smallest attack surface, and `pnpm --filter "...[origin/main]"` gives crude changed-since scoping for free.

Costs: no cross-CLI task ordering (the shared lib must build before api and app; you script it), no affected detection across FE and BE, no remote cache at all (Angular caches locally per project, Nest CLI caches nothing), boundaries only via hand-written ESLint `no-restricted-imports`. Fine for one app, one API, a few libs. Starts to drift at three-plus apps or when CI time hurts.

Bolting Turborepo on later closes the orchestration and cache gap, but there is a structural conflict: Turbo's unit is the `package.json` workspace package, while an Angular CLI multi-project workspace is one package. Realistic Turbo layout: each Angular app its own package with its own `angular.json`, the Nest app its own package, shared libs as packages with real entry points. Doable, but it is a restructure, not a plugin.

## Tool landscape, September 2026

| Tool | State / license | Graph, affected, cache | Remote cache | Boundaries | Angular + Nest fit |
|---|---|---|---|---|---|
| Nx | 23.2 stable, 23.3 in beta, MIT core | All three, integrated or package-based | Nx Cloud or self-built OpenAPI server | Yes, lint rule + tags | First-class plugins for both |
| Turborepo | 2.11 (Sept 18, 2026), MIT, Rust | All three, package-based only; 2.11 adds experimental Rust, Python and Go workspaces in one task graph | Vercel Remote Cache free for Vercel-linked repos; self-host via open-source implementations of the documented API | `turbo boundaries` and Tags still experimental | No framework plugins, no generators or migrations; Angular needs per-package workspaces |
| moon | v2.0 "Phobos" Feb 2026, now 2.5.x, MIT, Rust | All three; WASM plugin toolchains for any language, tool installs via proto | Self-hosted via any Bazel Remote Execution v2 API server such as bazel-remote; moonbase SaaS sunset | Yes, project constraints | Task-level only, no Angular/Nest awareness; small maintainer base |
| Rush | 5.177 (June 2026), MIT, Microsoft | All three, strict install and versioning policies | Free plugins: S3, Azure, HTTP cache, Redis cobuild | Via policies and lint | None; pnpm-only, verbose config, enterprise-strict |
| Lerna | Lerna 9, maintained by the Nx team since 2022; task running delegates to Nx | Via Nx | Via Nx Cloud | No | Only if you publish many npm packages; otherwise use Nx directly |
| pnpm / npm / yarn / bun workspaces | Baseline | None (pnpm changed-since filter) | None | None | Native; combine with one of the above |
| Bazel + rules_js | Hermetic, polyglot | Full | Yes | Yes | Angular CLI dropped Bazel support years ago; only with existing Bazel people |

Wireit (Google) and Lage (Microsoft) do script-level dependency and caching without a workspace model. Niche, not contenders here.

Turborepo 2.9 announced deprecations to prepare for 3.0, so a major is coming there too. On the Nx side the daemon's memory footprint dropped from roughly 1.5 GB to 200 MB across 22.x, which answers the old "Nx is heavy" complaint for local dev.

## Cost and license flags (your standing rule)

Every CLI above is MIT. Paid or conditional: Nx Cloud Hobby is free with 50,000 credits per month, 5 contributors and 10 concurrent CI connections; Team is `$29/month` plus `$19` per additional contributor, `$5.50` per 10,000 extra credits, `$2.25` per extra concurrent connection; Enterprise (custom pricing) holds Conformance, cross-repo visibility, SSO and self-hosted deployment. An EU-managed multi-tenant option exists. Vercel Remote Cache is free but tied to a Vercel account. Third-party Nx cache servers: Cachely is a paid subscription, remotecache.dev is MIT. bazel-remote is Apache-2.0.

## Decision rule

One Angular app, one Nest API, a handful of shared libs, small team: no Nx. Angular CLI workspace, Nest monorepo mode, pnpm workspaces, boundaries via ESLint. Add Turborepo when CI time or task ordering becomes a real cost, and accept the per-package restructure then.

Several apps, shared domain libs, more than roughly five developers, CI time is money: Nx. But budget Nx Cloud from day one or decide who writes and runs the cache server, and pin every Nx package.

Polyglot services alongside (Python, Go, Rust): moon, or Turbo 2.11 if you can live with experimental, or Nx (it has .NET, Gradle, Python plugins). Bazel only if you already pay Bazel people.

One correction to the framing of your question: it is not "Nx with all its plugins" versus "nothing". `nx init` on a plain pnpm workspace, no framework plugins, is footprint-wise close to Turborepo. The steep lock-in starts with the integrated layout and executors, not with Nx itself.
