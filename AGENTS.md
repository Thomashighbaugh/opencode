# OpenCode Hubs - Project Instructions

> Hub-based multi-agent orchestration for OpenCode

## Overview

- **31 specialized agents** for different task types
- **100 workflow skills** for development tasks
- **19 TypeScript tools** for session management and file editing
- **Hook system plugin** for mode detection and state persistence
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
| `artifact-placement.md` | No standalone scripts at project root |
| `script-elimination.md` | Use file-editing tools, not inline scripts |
| `hub-description-directive.md` | Hub subcommand description conventions |
| `security.md` | Security rules — mandatory checks, secret management |

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

## Agent Model Tiers

Each tier has a failover chain for subagent dispatch. Primary → Fallback 1 → Fallback 2 → (Fallback 3 if available). Stop on first success.

| Tier | Primary | Fallback 1 | Fallback 2 | Fallback 3 | Agents |
|------|---------|------------|------------|------------|--------|
| **Pro** | `ollama/deepseek-v4-pro:cloud` | `opencode-go/deepseek-v4-pro` | `opencode/deepseek-v4-flash-free` | _(NVIDIA NIM if cfg)_ | architect, planner, security-reviewer, requirements-analyzer, tracer, analyst, critic |
| **Default** | `opencode/deepseek-v4-flash-free` | `ollama/deepseek-v4-flash:cloud` | `opencode-go/deepseek-v4-flash` | _(NVIDIA NIM if cfg)_ | hubs, executor, debugger, test-engineer, designer, frontend-design, git-master, config-orchestrator, skill-creator, refactoring, code-simplifier, qa-tester, code-reviewer, scientist, deep-thinker |
| **Fast** | `opencode/deepseek-v4-flash-free` | `ollama/glm-5.2:cloud` | `opencode-go/glm-5.2` | — | writer, verifier, document-specialist, effort-estimator, explore, commit-drafter, prompt-simplifier, convention-extractor |

**Task-to-Tier Routing:** Pro for complex reasoning (architecture, security, planning). Default for implementation, testing, debugging, design. Fast for documentation, verification, search.

**Session model** is set in `agents/hubs.md` frontmatter. Currently: `ollama/deepseek-v4-flash:cloud`.

**Failover:** Provider/agent errors advance the chain after 60s. Task errors do not advance — fix the prompt and retry. Exhausting all models in the chain → escalate via `question` tool.

### Subagent Timeout
**Subagents have a max-turn limit.** If a subagent hasn't produced output after 5 turns, terminate and escalate to the user. Subagents that loop or hang waste API requests. A subagent that can't complete in 5 turns needs a better prompt or a different approach.

## Hub Commands

| Command | Purpose | Subcommands |
|---------|---------|-------------|
| `/init-project` | Project init | setup, detect, recommend, docs, context, verify, refresh, status, map-codebase, doctor, reset, provision, tag, find-skills, find-agents, find-tools, find-rules |
| `/ideation` | Planning/research | plan, brainstorm, decomposition, refine, overhaul, deep, graph, research, ralplan, ddd, event-storming, double-diamond, jtbd, impact-mapping, spiral, top-down, bottom-up, adversarial-debate, cleanroom, pwf, rpikit, hive, story-mapping, lean-canvas, constitution |
| `/orchestrate` | Execution | ralph, team, deep, ccg, ultrawork, autopilot, sciomc, swarm, state-machine, consensus, evolutionary, spec-driven, react, plan-execute, hive, tdd, pair, pipeline, gsd, self-assess, remediate, devin, maestro, metaswarm, cc10x, gastown, ruflo, harden, brownfield, vibe-code |
| `/harvest-context` | Context mgmt | session, codebase, skill, agent, rule, command, memory, docs, decompose, context, consume, compress, secondbrain, journal, search, prune, export, diff, sweep |
| `/project` | Project ops | tests, commit, stage, pr, gh, optimize, icon, organize, analyze, changelog, converge, scan, sandbox, retrospect, purge, release, review, audit, archive, git-cleanup, workspace |
| `/skills` | Skill management | list, add, create, remove, edit, search, info, update, package, validate, sync, setup, scan |

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
├── agents/              # 31 agent definitions
├── skills/              # 100 workflow skills
├── commands/            # 2 custom commands
├── tools/               # 19 TypeScript tools
├── plugins/             # Hook system + TUI plugin
├── rules/               # Shared rules (loaded as instructions)
├── templates/           # File templates
└── .opencode/           # Project state, context, docs, cache
    ├── state/           # Session state (gitignored)
    ├── context/         # Durable knowledge (committed)
    │   └── research/    # Cached Context7 documentation
    ├── cache/           # Multi-tier prompt cache (gitignored)
    ├── docs/            # Generated documentation
    └── CHANGELOG.md     # Auto-commit log
```

## Context7 MCP Directive

Use Context7 MCP to fetch current documentation when the user asks about a library, framework, SDK, API, CLI tool, or cloud service. Always start with `resolve-library-id`, then `query-docs`. Do not use for: refactoring, debugging business logic, code review, or general programming concepts.

**Before fetching:** Check `.opencode/context/research/{library-slug}/` for cached results. If a cached result exists and is less than 7 days old, use it instead of making a new API call. **After fetching:** Save results to `.opencode/context/research/{library-slug}/{query-hash}.md` for future reuse.
