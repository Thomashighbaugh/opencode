# OpenCode Hubs - Project Instructions

> Hub-based multi-agent orchestration for OpenCode

## Overview

- **1 primary agent** (`hubs`) — the specialist roster was retired in favor of auto-selecting skills, see `agents/hubs.md`
- **137 workflow skills** for development tasks
- **30 TypeScript tools** for session management and file editing
- **154 hub subcommand specs** across 6 hub directories
- **Hook system plugin** for mode detection, state persistence, and context injection
- **Multi-tier cache system** — tool, file, session, vector search caching
- **Durable context storage** — knowledge compounds across sessions

## API Request Efficiency (CRITICAL)

Every turn, every subagent invocation, every verification round costs an API request. Minimize them.

### Batch Tool Calls
**When making multiple independent tool calls, batch them in a single message.** Reading 3 files? 3 Read calls in one message. Dispatching 2 subagents? 2 Task calls in one message. Never serialize independent operations across multiple turns.

### No Thinking-Aloud Turns
**Think, then act in the same turn.** Do not send a message that only contains analysis, planning, or narration without taking action. Internal reasoning happens before the tool call, not as a separate message. The user sees results, not process.

### Direct Execution Preference
**Handle tasks directly by default.** For natural-language requests, assess whether you can do the work yourself with good results. Only propose delegation when it would be meaningfully faster or more effective. When the user explicitly selects an orchestration pattern from the hub menu or names a subagent, use that pattern — no proposal needed.

### Self-Contained Subagent Prompts
**Give subagents everything they need in one prompt.** Include full file contents, relevant rules, expected output format, and verification commands. A subagent that completes in 1 turn saves 2+ API requests over one that needs follow-up.

### Self-Verification
**Verify your own work before handing off.** Run the test/lint command, check the output, confirm it works. Only escalate to `@verifier` when self-verification fails or the task explicitly requires independent review. **Skip verification entirely if no files were modified.**

### Report and Stop
**After completing work, report results and stop.** Do not ask "Would you like me to..." or "Shall I proceed with..." — the user already gave the command. Only ask follow-up questions when genuinely blocked (missing credentials, ambiguous requirements, conflicting instructions).

### Context7 Caching
**Cache Context7 documentation results.** Before calling Context7 MCP, check `.opencode/context/research/` for existing cached docs matching the library and query. After fetching, save results to `.opencode/context/research/{library-slug}/` for future reuse. Library docs rarely change — cache with a 7-day TTL.

### File Read Caching
**Cache file reads within a session.** When reading a file that was already read earlier in the same session, use the cached content instead of re-reading. The `file` cache namespace (24h TTL, memory-only) is available for this. Invalidate on write to the same file.

### Intelligent Retry Gating
**Classify subagent errors before retrying.** Provider errors (connection refused, model unavailable, 502/503/504, timeout, rate limit) → retry with fallback. Task errors (incorrect output, wrong implementation) → fix the task prompt, don't retry. Tool errors (file not found, permission denied) → fix the root cause, don't retry. Never retry more than 3 times total.

## Core Rules (Loaded at Startup)

| Rule | Purpose |
|------|---------|
| `shell_strategy.md` | Non-interactive shell — CI-safe commands, banned patterns |
| `context-strategy.md` | Durable memory — state vs context, manual-only load/save |
| `karpathy-guidelines.md` | Think before coding, simplicity first, surgical changes |
| `file-operations.md` | No standalone scripts at project root; use file-editing tools, not inline scripts |
| `hub-description-directive.md` | Hub subcommand description conventions |
| `security.md` | Security rules — mandatory checks, secret management |
| `completion-guardrail.md` | **MANDATORY STOP** after planning/analysis — no auto-implementation |
| `anti-sycophancy.md` | No sycophantic agreement — assess claims independently, conclusion-first |
| `hub-menu-rebuild.md` | Rebuild TUI menus after hub subcommand changes (`bun run generate-menus`) |

**On-demand rules** (load via tool when needed): `hub-routing.md`, `resource-tags.md`, `global-reference.md`, `hub-state.md`

## State vs Context

| Type | Location | Git | Lifecycle |
|------|----------|-----|-----------|
| **State** | `.opencode/state/` | Gitignored | Ephemeral session data |
| **Context** | `.opencode/context/` | Committed | Durable knowledge |
| **Secrets** | `.opencode/state/sessions/` | Gitignored | Session lifetime only |

**All context operations are MANUAL ONLY.** No auto-harvest, auto-commit, auto-chain, or auto-submit.

## Critical: No Auto-Mode Activation

Magic keywords (`ralph`, `autopilot`, `ultrawork`, `build me`, `create me`, etc.) do **NOT** auto-activate modes. The plugin detects them and injects a context message, but the agent must **propose** the mode to the user and get explicit confirmation before activating.

## Model & Fallback

As of 2026-09-27, the 30-agent specialist roster was retired in favor of skills that auto-select by
description (see `agents/hubs.md` → `<Specialist_Skills>` for the full list and
`claude/knowledge-claude-config/agents-to-skills-2026-09-27.md` for the retirement mapping). Skills
load inline at whatever model the current session is already running — there's no per-specialty
tier table to maintain anymore.

The two exceptions are `architect-review` and `plan-critic`, the only roles that still warrant an
isolated Task dispatch (they need a perspective uncontaminated by the current conversation). When
dispatching either: try `o/dsv4-pro:cloud` → `og/dsv4-pro` → `oc/space-bunny-free`, stop on first
success. Everything else in this section still applies to that dispatch:

**Session model:** `opencode-go/deepseek-v4.1-flash` (set in `agents/hubs.md` frontmatter).

**Ambiguity default:** in ambiguous situations (unclear which model to use), default to
`oc/space-bunny-free` — the free, always-available model. Never default to a paid/cloud model when
uncertain.

**Failover:** provider errors advance the chain after 60s. Task errors → fix the prompt, don't
advance the chain. Chain exhausted → escalate via the `question` tool.

**Timeout:** 5 turns is a reasonable default max for a fork dispatch. If no output by then, terminate
and escalate rather than letting it loop.

## Hub Commands

| Command | Purpose | Subcommands |
|---------|---------|-------------|
| `/init-project` | Project init | setup, detect, recommend, docs, context, verify, refresh, status, map-codebase, doctor, reset, provision, tag, find-skills, find-agents, find-tools, find-rules |
| `/ideation` | Planning/research | plan, brainstorm, decomposition, refine, overhaul, deep, graph, research, ralplan, ddd, event-storming, double-diamond, jtbd, impact-mapping, spiral, top-down, bottom-up, adversarial-debate, cleanroom, pwf, rpikit, hive, story-mapping, lean-canvas, constitution, quality, architecture, redesign, grill, modularity, arch-prep, web-research, tech-eval, competitive-analysis, tree-of-thoughts, deep-thinker, opro, analyze-patterns, improvements |
| `/orchestrate` | Execution | ralph, team, deep, ccg, ultrawork, autopilot, sciomc, swarm, state-machine, consensus, evolutionary, spec-driven, react, plan-execute, hive, tdd, pair, pipeline, gsd, self-assess, remediate, devin, maestro, metaswarm, cc10x, gastown, ruflo, harden, subagent-driven, brownfield, vibe-code |
| `/harvest-context` | Context mgmt | session, codebase, skill, agent, rule, command, memory, docs, web-research, compare, decompose, context, consume, compress, secondbrain, journal, search, prune, export, diff, sweep |
| `/project` | Project ops | create-tests, code-review, commit, git-stage-thread, pr, gh, optimize, refactor, simplify, simplify-code, cleanup, modernize, icon, organize, changelog, converge, scan, vectorize, sandbox, retrospect, purge, release, review, audit, archive, git-cleanup, workspace, readme, extract-standards, deep-bug-hunt, insights, delegate, self-improve, graph |
| `/skills` | Skill management | list, add, create, remove, edit, search, info, update, package, validate, sync, setup, scan |

### Two-Tier Subcommand Routing

Each of the 155 hub subcommands has a dedicated spec file in `tools/hubs/<hub>/<subcommand>.ts` containing the full `HubSubcommandSpec` — `detailedDescription`, `tools`, `rules`, `relatedSkills`, `examples`, `warnings`.

**Direct selection** (`/orchestrate ralph`): `hubMenu route` returns the full spec in one response (detailedDescription + inlined rules + related skill pointers + examples). No follow-up `loadSkill` or rule-read calls needed.

**Routing required** (bare `/orchestrate` + NL task, or pure NL): `hubMenu menu` returns the slim identity slice (label + short description + reminder) for the model to pick from. Then `route` loads the full spec for the chosen subcommand.

See `rules/hub-routing.md` for the complete delegation table and architecture details.

## Magic Keywords (Detection Only — No Auto-Activation)

| Keyword | Injects Mode Context |
|---------|---------------------|
| `"ralph"`, `"don't stop"`, `"must complete"` | Ralph |
| `"autopilot"`, `"build me"`, `"create me"` | Autopilot |
| `"ultrawork"`, `"ulw"`, `"uw"` | Ultrawork |
| `"deep interview"` | Deep-interview |
| `"cancel"`, `"stop"` | Cancel modes |

## Project Structure

```
~/.config/opencode/
├── opencode.jsonc       # Main configuration
├── AGENTS.md            # This file (core instructions)
├── agents/              # hubs.md only — the specialist roster now lives in skills/
├── skills/              # 137 workflow skills
├── commands/            # (empty — all subcommands live in hub menus)
├── templates/
│   ├── projects/         # Project archetype templates (bare-bones, cli-tool, docker, go, nextjs, etc.)
│   │   └── Each archetype contains four subdirectories: agents/, rules/, skills/, tools/
│   │      Only agents/ and rules/ can be referenced in opencode.jsonc (via `agent` and `instructions` keys).
│   │      skills/ and tools/ must be copied/linked into the project's .opencode/ directory.
│   ├── agent-template.md # Agent definition template
│   ├── context-template.md
│   ├── rules/            # Rule generation templates
│   ├── tools/            # Tool creation templates
│   └── reasoning/        # CoT reasoning templates
├── tools/               # TypeScript tools
│   ├── hubMenu.ts       # Hub menu router (route returns full spec, menu returns slim slice)
│   ├── hub-data.ts      # Hub types, subcommand spec loader, state helpers
│   ├── hub-<name>.ts    # Thin hub manifests (10 lines each, identity slice only)
│   ├── hubs/            # Per-subcommand spec files (155 files across 6 directories)
│   └── ...              # File editing, cache, session, skill tools
├── plugins/             # Hook system + TUI plugin
├── rules/               # Shared rules (loaded as instructions)
├── templates/           # File templates (agents, context, rules, tools, reasoning)
└── .opencode/           # Project state, context, docs, cache
    ├── state/           # Session state (gitignored)
    ├── context/         # Durable knowledge (committed)
    │   ├── research/    # Cached Context7 documentation
    │   ├── index.md     # LLM Wiki catalog
    │   ├── log.md       # LLM Wiki operation chronicle
    │   └── wiki-schema.md # LLM Wiki schema
    ├── cache/           # Multi-tier prompt cache (gitignored)
    ├── docs/            # Generated documentation
    └── CHANGELOG.md     # Auto-commit log
```

## Context7 MCP Directive

Use Context7 MCP to fetch current documentation when the user asks about a library, framework, SDK, API, CLI tool, or cloud service. Always start with `resolve-library-id`, then `query-docs`. Do not use for: refactoring, debugging business logic, code review, or general programming concepts.

**Before fetching:** Check `.opencode/context/research/{library-slug}/` for cached results. If a cached result exists and is less than 7 days old, use it instead of making a new API call. **After fetching:** Save results to `.opencode/context/research/{library-slug}/{query-hash}.md` for future reuse.
