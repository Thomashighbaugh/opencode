# OpenCode Hubs - Project Instructions

> Hub-based multi-agent orchestration for OpenCode

## Overview

- **1 primary agent** (`hubs`) — the only primary. It handles tasks directly and is the sole entry point.
- **30 subagents** — all `mode: subagent`, dispatched by `hubs` or by an explicit user request. See `agents/hubs.md`
- **123 workflow skills** for development tasks
- **38 TypeScript tools** for session management and file editing
- **188 hub subcommand specs** across 7 hub directories
- **Hook system plugin** for mode detection, state persistence, and context injection
- **Multi-tier cache system** — tool, file, session, vector search caching
- **Durable context storage** — knowledge compounds across sessions

### Model Policy

**This config pins no models.** There is no `model` key in `opencode.jsonc`, no `model:` in any agent
frontmatter, and no model in any profile. Model choice is made at runtime by OpenCode or explicitly by
the user. Never hardcode a model, and never select or fail over between specific models on your own
initiative — if a subagent fails, escalate to the user instead of switching providers.
`tests/global/schema.test.ts` and `tests/global/agent-format.test.ts` enforce this.

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
**Classify subagent errors before retrying.** Provider errors (connection refused, 502/503/504, timeout, rate limit) → retry once, then escalate. Task errors (incorrect output, wrong implementation) → fix the task prompt, don't retry. Tool errors (file not found, permission denied) → fix the root cause, don't retry. Never retry more than 3 times total.

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

## Subagent Dispatch

There is **one primary agent** (`hubs`) and **30 subagents** — all `mode: subagent`. The subagent
roster is live, not retired: `agents/` holds 30 specialists spanning planning, implementation,
review, research, design, and workflow, each with its own `<Agent_Prompt>`.

**`hubs` is never retired.** It is the sole entry point and the only agent a session starts as
(`default_agent: "hubs"`). It handles work directly by default and proposes subagent patterns
rather than deploying them unprompted.

### Model selection is not a dispatch concern

Do not choose, pin, or fail over between models when dispatching a subagent — this config pins none
(see **Model Policy** above). The dispatched subagent runs on whatever model the runtime gives it.
If a subagent fails:

| Error type | Action |
|------------|--------|
| Provider error (connection refused, 502/503/504, timeout, rate limit) | Retry once, then escalate via `question` |
| Task error (wrong output, wrong implementation) | Fix the task prompt — do **not** retry or switch agents |
| Tool error (file not found, permission denied) | Fix the root cause |

Retries are per-subagent: one stuck subagent never blocks the others. Subagent timeout is
60s without error; beyond that let it finish. Full detail in `agents/hubs.md` → `<Error_Handling>`.


## Hub Commands

Menus are **topical** and every name carries a `-hub` suffix so a menu never collides with an
OpenCode built-in slash command (`/git`, `/plan`, `/build`, ...). The pre-2026-09-28 menus
(`/init-project`, `/ideation`, `/orchestrate`, `/harvest-context`, `/project`, `/skills`) still
resolve via `LEGACY_ROUTE_MAP` in `tools/hub-data.ts`, so old invocations keep working.

| Command | # | Subcommands |
|--------|--:|-------------|
| `/scaffold-hub` | 12 | config, detect, doctor, map-codebase, provision, recommend, refresh, reset, setup, status, tag, verify |
| `/resource-hub` | 12 | agent, command, config-orchestrator, effort-estimator, find-agents, find-rules, find-skills, find-tools, knowledge-graph, prompt-simplifier, rule, skill |
| `/memory-hub` | 18 | capture, codebase, compare, compress, consume, context, decompose, diff, export, journal, memory, prune, resume, search, secondbrain, session, sweep, web-research |
| `/research-hub` | 13 | analyst, analyze-patterns, competitive-analysis, convention-extractor, document-specialist, explore, graph, library-docs, research, scientist, tech-eval, tracer, web-research |
| `/design-hub` | 9 | arch-prep, architecture, designer, docs, frontend-design, modularity, readme, redesign, writer |
| `/ideate-hub` | 16 | adversarial-debate, brainstorm, cleanroom, ddd, deep-dive, deep-thinker, double-diamond, event-storming, grill, interview, opro, pwf, refine, rpikit, spark, tree-of-thoughts |
| `/plan-hub` | 16 | bottom-up, constitution, decomposition, impact-mapping, improvements, jtbd, lean-canvas, plan, plan-execute, quality, ralplan, requirements-analyzer, spiral, status, story-mapping, top-down |
| `/verify-hub` | 11 | audit, code-review, create-tests, critic, debugger, deep-bug-hunt, qa-tester, review, security-reviewer, tdd, test-engineer |
| `/swarm-hub` | 17 | cc10x, delegate, devin, gastown, gsd, harden, hive, hive-plan, maestro, metaswarm, pair, react, remediate, ruflo, self-assess, spec-driven, subagent-driven |
| `/build-hub` | 12 | brownfield, cleanup, executor, extract-standards, modernize, optimize, overhaul, pipeline, refactor, simplify, simplify-code, vibe-code |
| `/orchestrate-hub` | 12 | autopilot, ccg, consensus, evolutionary, ralph, resume, sciomc, state-machine, status, swarm, team, ultrawork |
| `/git-hub` | 10 | archive, changelog, commit, commit-drafter, gh, git-cleanup, git-master, git-stage-thread, pr, release |
| `/maintain-hub` | 12 | consolidate-telemetry, converge, icon, insights, organize, purge, retrospect, sandbox, scan, self-improve, vectorize, workspace |
| `/skills-hub` | 13 | add, create, edit, info, list, package, remove, scan, search, setup, sync, update, validate |

### Two-Tier Subcommand Routing

Each of the 155 hub subcommands has a dedicated spec file in `tools/hubs/<hub>/<subcommand>.ts` containing the full `HubSubcommandSpec` — `detailedDescription`, `tools`, `rules`, `relatedSkills`, `examples`, `warnings`.

**Direct selection** (`/orchestrate-hub ralph`): `hubMenu route` returns the full spec in one response (detailedDescription + inlined rules + related skill pointers + examples). No follow-up `loadSkill` or rule-read calls needed.

**Routing required** (a bare hub (e.g. `/orchestrate-hub`) + NL task, or pure NL): `hubMenu menu` returns the slim identity slice (label + short description + reminder) for the model to pick from. Then `route` loads the full spec for the chosen subcommand.

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
├── agents/              # hubs.md (primary) + 30 subagents
├── skills/              # 123 workflow skills
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

## Web Search Directive (SearXNG — Default Engine)

**Use SearXNG MCP as the first and default engine for all web search.** It is wired in
`opencode.jsonc` as the `searxng` MCP server, backed by the locally hosted instance at
`http://localhost:8080` (`SEARXNG_URL`). Prefer it over the generic `websearch` tool, and prefer
it over any hosted search backend.

- **Use SearXNG** for: factual/current lookups, docs pages, error messages and their upstream
  issues, library behaviour, release notes, "what does X do", anything where a fresh web result
  is the point.
- **Fall back to `websearch`** only when SearXNG is unreachable, returns nothing usable, or the
  user explicitly asks for a different engine. Say which one you used and why.
- **Scope queries narrowly.** Prefer site-scoped queries (`site:github.com ...`) over broad ones.

## Code Snippet Directive (gh_grep)

**Use the `gh_grep` MCP server (`https://mcp.grep.app`) to search real code** when you need to
know how something is actually written in the wild, rather than guessing.

Use it when:

- You are **not sure** how to do something and an example would remove the guesswork.
- A task requires **performing a specific function** in a **specific language**, and idiomatic
  examples would materially improve the result.
- You need **library or framework usage patterns** that the local codebase does not contain.
- An API's exact call shape, import path, or option names are **uncertain**.

Skip it when the answer is already in the repo (`grep`/`glob` are faster and authoritative here),
for general programming concepts, or when Context7 already documented the usage.

### Caching retrieved snippets (REQUIRED)

Retrieved snippets are expensive to re-fetch and are the kind of knowledge worth compounding.
**After using a `gh_grep` result, save it:**

1. Write the useful snippets to `.opencode/context/research/code-snippets/{topic-slug}.md`.
2. Include the source repo/file, the language, and why the pattern matters — not just a raw paste.
3. **Before searching again, check that directory first** and reuse a cached hit if it covers the
   question. Grep there before spending a network call.
4. Keep entries current: if a cached snippet turns out to be outdated, correct it in place rather
   than adding a near-duplicate.



