# OpenCode Hubs - Project Instructions

> Hub-based multi-agent orchestration for OpenCode

## Overview

- **29 specialized agents** for different task types
- **76 workflow skills** for development tasks
- **14 TypeScript tools** for session management
- **Hook system plugin** for mode detection and state persistence
- **Durable context storage** — knowledge compounds across sessions

## Core Rules (Loaded at Startup)

| Rule | Purpose |
|------|---------|
| `shell_strategy.md` | Non-interactive shell — CI-safe commands, banned patterns |
| `context-strategy.md` | Durable memory — state vs context, manual-only load/save |
| `hub-state.md` | State paths, cross-hub handoff conventions |
| `hub-routing.md` | Command routing, delegation tables, intent router |
| `hub-description-directive.md` | Hub subcommand description conventions |
| `karpathy-guidelines.md` | Think before coding, simplicity first, surgical changes |
| `artifact-placement.md` | No standalone scripts at project root |

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

| Tier | Model | Agents |
|------|-------|--------|
| **Top** (pro) | `deepseek-v4-pro:cloud` | architect, planner, security-reviewer, requirements-analyzer, tracer, analyst, critic |
| **Mid** (flash) | `deepseek-v4-flash:cloud` | hubs, executor, debugger, test-engineer, designer, frontend-design, git-master, config-orchestrator, skill-creator, refactoring, code-simplifier, qa-tester, code-reviewer, scientist, deep-thinker |
| **Fast** (glm) | `glm-5.1:cloud` | writer, verifier, document-specialist, effort-estimator, explore, commit-drafter, prompt-simplifier |

**Fallback:** 1 retry on opencode-go, then escalate via `question` tool.

## Hub Commands

| Command | Purpose | Subcommands |
|---------|---------|-------------|
| `/init-project` | Project init | setup, detect, docs, context, verify, refresh, status, map-codebase, doctor, reset, provision |
| `/ideation` | Planning/research | plan, brainstorm, decomposition, refine, overhaul, deep, graph, research, ralplan, ddd, event-storming, double-diamond, jtbd, impact-mapping, spiral, top-down, bottom-up, adversarial-debate, cleanroom, pwf, rpikit, hive, story-mapping, lean-canvas, constitution |
| `/orchestrate` | Execution | ralph, team, deep, ccg, ultrawork, autopilot, sciomc, swarm, state-machine, consensus, evolutionary, spec-driven, react, plan-execute, hive, tdd, pair, pipeline, gsd, self-assess, remediate, devin, maestro, metaswarm, cc10x, gastown, ruflo, harden, brownfield, vibe-code |
| `/harvest-context` | Context mgmt | session, codebase, skill, agent, rule, command, memory, docs, decompose, context, consume, compress, secondbrain, journal, search, prune, export, diff, sweep |
| `/project` | Project ops | tests, commit, stage, pr, gh, optimize, icon, organize, analyze, changelog, converge, scan, sandbox, retrospect, purge, release, review, audit, archive, git-cleanup, workspace |

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
├── agents/              # 29 agent definitions
├── skills/              # 76 workflow skills (87 dirs)
├── commands/            # 2 custom commands
├── tools/               # 14 TypeScript tools
├── plugins/             # Hook system + TUI plugin
├── rules/               # Shared rules (loaded as instructions)
├── templates/           # File templates
└── .opencode/           # Project state, context, docs, cache
    ├── state/           # Session state (gitignored)
    ├── context/         # Durable knowledge (committed)
    ├── cache/           # Multi-tier prompt cache (gitignored)
    ├── docs/            # Generated documentation
    └── CHANGELOG.md     # Auto-commit log
```

## Context7 MCP Directive

Use Context7 MCP to fetch current documentation when the user asks about a library, framework, SDK, API, CLI tool, or cloud service. Always start with `resolve-library-id`, then `query-docs`. Do not use for: refactoring, debugging business logic, code review, or general programming concepts.
