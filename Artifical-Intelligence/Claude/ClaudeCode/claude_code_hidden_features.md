# Claude Code: Underused Features Worth Knowing

*Verified against official docs and changelog as of April 2026.*

---

## I / Channels: Message Claude from Telegram, Discord, or iMessage

```bash
claude --channels plugin:telegram@claude-plugins-official
```

Launched March 20, 2026 as a research preview (v2.1.80+). An MCP server runs locally alongside your Claude Code session. When you message your bot, the plugin forwards it into the active session — with full filesystem, git, and MCP access — and sends the reply back through the same app.

**Prerequisites:** Claude Code v2.1.80+, the Bun JavaScript runtime, a claude.ai subscription (no separate API key needed), and a bot token from your platform of choice.

Current platform support: Telegram, Discord, iMessage (macOS only, requires Full Disk Access), and a `fakechat` demo for local testing. Custom channels are possible but require a `dangerously-` dev flag and Anthropic review before they'll work for others.

**Practical limits:** Loops die on terminal close unless you're running in tmux/screen or on a VPS. Telegram has no message history API. Permission prompts that require interactive approval can stall the session; `--dangerously-skip-permissions` is the workaround, with the usual caveats.

---

## II / /batch: One Command, Parallel Agents, One PR Each

```
/batch migrate src/ from Solid to React
```

A bundled skill introduced in v2.1.63. Claude analyzes your codebase, breaks it into independent units, asks for approval, then spawns one agent per unit in an isolated git worktree. Each agent runs tests and opens a pull request. You get a stack of PRs rather than one enormous diff.

Each agent runs `/simplify` (a parallel code review skill) before creating its PR, so every PR arrives in a pre-reviewed state. Work is truly parallel; worktree isolation means agents can rewrite the same file in different branches without merge conflicts.

Scope limitation: `/batch` works on parallelizable, non-interdependent changes. For work where units need to coordinate mid-task, use Agent Teams instead.

---

## III / Agent Teams: Agents That Talk to Each Other

```bash
export CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1
```

Experimental, requires v2.1.32+ and Opus 4.6. After enabling the flag, tell Claude to create a team:

```
Create a team: one on UX, one on architecture, one playing devil's advocate on my new auth flow
```

Unlike subagents (which only report results back to the main thread), teammates share a task list and communicate directly via a mailbox system. One teammate can discover a security issue and message the architecture teammate mid-task. Context windows remain isolated (1M tokens per agent), but explicit peer-to-peer messaging enables real coordination.

**Current limitations worth knowing:** No session resumption for in-process teammates; `/resume` won't restore teammates that are gone. Tasks can get stuck if a teammate fails to mark work complete — nudge the lead manually. Only one team per session; no nested teams.

---

## IV / CLAUDE_CODE_NEW_INIT=1: A Proper Onboarding Flow

```bash
CLAUDE_CODE_NEW_INIT=1 claude
# then run:
/init
```

Without the flag, `/init` scans your codebase and produces a generic `CLAUDE.md`. With it, the process becomes interactive: Claude explores your repo with a dedicated subagent, identifies build commands, test setup, and architecture, asks follow-up questions to fill gaps, then shows you a full proposal before writing anything.

The result is a `CLAUDE.md` that reflects how your project actually works rather than a template you'll spend an hour editing.

---

## V / TaskCompleted Hook: Veto Claude Declaring Victory

```json
{
  "hooks": {
    "TaskCompleted": [{
      "hooks": [{
        "type": "command",
        "command": "/path/to/your/quality-gate.sh"
      }]
    }]
  }
}
```

BTW, the claim that `exit 2` blocks task completion is wrong. Exit code 2 is the mechanism for `PreToolUse` hooks to block tool calls. For `TaskCompleted`, the mechanism is JSON output:

```bash
echo '{"continue": false, "stopReason": "Tests are still failing — task is not done"}'
exit 0
```

Claude reads the `stopReason` and keeps working. Pair it with a `TaskCreated` hook to reject poorly scoped tasks before they start. This is quality enforcement baked into the agent loop itself, not a prompt you hope Claude remembers.

---

## VI / CwdChanged Hook: Auto-Reload Your Environment

```json
{
  "hooks": {
    "CwdChanged": [{
      "hooks": [{
        "type": "command",
        "command": "direnv export bash >> $CLAUDE_ENV_FILE"
      }]
    }]
  }
}
```

Fires every time Claude executes a `cd`. Write environment variables to `$CLAUDE_ENV_FILE` and they persist into subsequent Bash commands for the session. The canonical use case is direnv in monorepos: Claude moves into `packages/payments`, the billing environment loads automatically; moves to `packages/auth`, different vars, reloaded.

Note: CwdChanged doesn't support matchers and always fires on every directory change. It also cannot block the change.

---

## VII / FileChanged Hook: React When Files Change on Disk

```json
{
  "hooks": {
    "FileChanged": [{
      "matcher": "package-lock.json",
      "hooks": [{
        "type": "command",
        "command": "npm audit --json > /tmp/audit.json && claude-code-inject /tmp/audit.json"
      }]
    }]
  }
}
```

The `matcher` field is a pipe-separated list of basenames (not paths): `"package-lock.json|.env|schema.prisma"`. The hook fires when any matching file changes on disk, from any source — not just Claude edits.

Useful patterns: dependency audit on lockfile change, config validation on config change, sync check on generated files. This turns Claude from something you prompt into something that watches your project.

---

## VIII / /loop: Schedule Any Skill on an Interval

```
/loop 20m /simplify focus on the auth module
/loop 5m check the deployment health endpoint and alert me if it returns non-200
```

`/loop` has a 3-day maximum expiry and is killed on terminal close.

For persistent scheduling that survives terminal close and computer sleep, use `/schedule` via the Claude Desktop app's Cowork sidebar instead.

Interval syntax rounds to clean cron steps. Set `CLAUDE_CODE_DISABLE_CRON=true` to stop all scheduled tasks immediately.

---

## IX / Subagent Persistent Memory: Agents That Remember

In your subagent definition's YAML frontmatter:

```yaml
---
name: code-reviewer
description: Reviews code for quality and recurring issues
memory: user
---
```

The `memory: user` field loads user-level auto memory into the subagent at start. Claude writes what it learns to disk during sessions; future sessions load it back automatically.

**Note:** Some users claims on X that the path is `~/.claude/agent-memory/`. That specific path is not confirmed in official docs. Memory is managed by Claude Code internally; the precise storage location may vary.

Your code reviewer can learn your recurring async error-handling patterns. Your debugger can track your common failure modes. The practical payoff is a subagent that doesn't need re-teaching every session.

---

## X / HTML Comments in CLAUDE.md: Notes That Don't Cost Tokens

```markdown
<!-- Last reviewed: March 2025. Update auth section after OAuth migration. -->

## Build Commands
npm run build
```

HTML block comments are stripped before CLAUDE.md is injected into the context window. Claude never sees them; your teammates do when they open the file.

If Claude explicitly reads CLAUDE.md with the Read tool (rather than the auto-injection at session start), it *will* see the comments. The stripping only applies to auto-injection.

---

## Bonus: Features that didn't fit into the top 10 but are still worth knowing.

### /schedule (Desktop): Persistent Scheduled Tasks

```
/schedule daily at 8:30am, summarize overnight Slack and email and outline my day
```

Unlike `/loop`, scheduled tasks in the Claude Desktop app's Cowork sidebar survive terminal close, sleep, and restart. Task definitions live at `~/.claude/scheduled-tasks/<task-name>/SKILL.md`. The canonical pattern: hourly error log review → automatic PRs for actionable issues. You review PRs instead of scanning logs.

---

### --worktree: Isolated Parallel Sessions

```bash
claude --worktree feature-auth
```

Available since v2.1.50. Creates a separate checkout of your repo under `.claude/worktrees/` on a dedicated branch. Lets you run two Claude Code sessions against the same codebase without conflicts — one on a bug fix, one on a feature — with full git isolation. `/batch` uses this internally for every parallel agent it spawns.

---

### CLAUDE_CODE_SUBAGENT_MODEL: Run Subagents on a Cheaper Model

```bash
export CLAUDE_CODE_SUBAGENT_MODEL="claude-haiku-4-5-20251001"
```

Your main session runs on Opus for complex reasoning; subagents doing file exploration, search, or boilerplate tasks run on Haiku. The cost difference is roughly 10-15x per token. For agentic workflows that spawn many subagents, this compounds significantly.

---

### .claude/rules/: Conditional Instructions

Files under `.claude/rules/` support `paths:` frontmatter that limits when they load:

```markdown
---
paths:
  - "packages/payments/**"
---

Always validate currency amounts against the CurrencyValidator service.
Never log raw payment data.
```

These rules only enter context when Claude is working in the matched paths. This keeps your main `CLAUDE.md` lean and avoids injecting irrelevant instructions into every session.

---

### PreCompact / PostCompact Hooks: Control What Survives Compression

```json
{
  "hooks": {
    "PreCompact": [{
      "hooks": [{ "type": "command", "command": "save-session-state.sh" }]
    }],
    "PostCompact": [{
      "hooks": [{ "type": "command", "command": "reload-critical-context.sh" }]
    }]
  }
}
```

`PreCompact` fires before Claude compresses the conversation. `PostCompact` fires after. Use the former to snapshot state you can't afford to lose to summarization; use the latter to re-inject context that compaction typically drops.

---

### --bare: Headless Scripting Without the Overhead

```bash
ANTHROPIC_API_KEY=... claude --bare -p "Review this diff for security issues" < changes.patch
```

The `--bare` flag (v2.1.81+) skips hooks, LSP, plugin sync, and skill directory walks. Requires `ANTHROPIC_API_KEY` directly; auto-memory is disabled. Use it for CI/CD integration or scripted pipelines where you want minimal startup overhead and no side effects from the session infrastructure.

---

### /security-review: Built-in Security Audit Slash Command

```
/security-review
```

A bundled slash command that runs a comprehensive security review of recent code changes. Focuses on exploitable vulnerabilities. Runs as a dedicated subagent with a 2600-token system prompt optimized for security analysis. Worth running before any PR merge on security-sensitive code paths.

---

*For the official reference: https://code.claude.com/docs*
