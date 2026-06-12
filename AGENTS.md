# OpenCode Hubs - Project Instructions

> Hub-based multi-agent orchestration for OpenCode

## Overview

This project provides a comprehensive multi-agent orchestration system for OpenCode. It includes:

- **29 specialized agents** for different task types
- **67 workflow skills** for development tasks
- **6 commands** for automation
- **10 TypeScript tools** for session management
- **Hook system plugin** for mode detection and state persistence
- **Durable context storage** — knowledge compounds across sessions (StackMemory-inspired)

## Quick Reference

### Execution Modes

| Mode | Trigger | Purpose |
|------|---------|---------|
| **hubs** | `"hubs"` | Orchestrate subagents for complex multi-step tasks with auto-context creation |
| **autopilot** | `"autopilot"` or `/orchestrate autopilot` | Full autonomous execution |
| **ultrawork** | `"ulw"` or `/orchestrate ultrawork` | Maximum parallel execution |
| **team** | `/orchestrate team` | N coordinated agents on shared tasks |
| **ultraqa** | `/ultraqa` | QA cycling until goal met |

### Key Agents

| Agent | Use For |
|-------|---------|
| **hubs** | Orchestration of subagents for complex tasks with auto-context creation |
| **executor** | Implementation work |
| **architect** | System design |
| **planner** | Task sequencing |
| **debugger** | Root-cause analysis |
| **code-reviewer** | Code quality |
| **security-reviewer** | Security audits |
| **test-engineer** | Test strategy |
| **writer** | Documentation |

### Key Skills

| Skill | Level | Use For |
|-------|-------|---------|
| **hubs-reference** (hubs-reference) | 1 | Hubs catalog and tools reference (auto-loads) |
| **hubs-setup** (hubs-setup) | 2 | Backward-compat alias → /init-project |
| **hubs-doctor** (hubs-doctor) | 2 | Diagnose Hubs issues |
| **init-project** | 3 | Project init hub — setup, detect, docs, context, verify, refresh, map-codebase, doctor, reset, provision |
| **provision** | 3 | Codebase-aware artifact generator — analyzes project and auto-generates agents, skills, tools, and rules |
| **agent-format-enforcer** | 2 | Enforce <Agent_Prompt> XML wrapper convention on all agent definition files |
| **config-sync** | 3 | Sync opencode.jsonc with latest OpenCode schema from Context7 — detects drift, auto-fixes |
| **ideation** | 2 | Planning/research hub — plan, brainstorm, decomposition, refine, deep, graph, research, ralplan, ddd, event-storming, double-diamond, jtbd, impact-mapping, spiral, top-down, bottom-up, adversarial-debate, cleanroom, pwf, rpikit, hive, story-mapping, lean-canvas, constitution |
| **orchestrate** | 2 | Execution hub — ralph, team, deep, ccg, ultrawork, autopilot, sciomc, swarm, state-machine, consensus, evolutionary, spec-driven, react, plan-execute, hive, tdd, pair, pipeline, gsd, self-assess, remediate, devin, maestro, metaswarm, cc10x, gastown, ruflo, harden, brownfield, vibe-code |
| **harvest-context** | 2 | Context/artifact hub — session, codebase, skill, agent, rule, command, memory, docs, decompose, context, compress, secondbrain, journal |
| **project** | 2 | Project ops hub — tests, commit, stage, pr, gh, optimize, icon, organize, analyze, changelog, converge, scan, sandbox, retrospect, purge, release, review, audit, archive, workspace |
| **configure-notifications** | 2 | Configure Telegram/Discord/Slack notifications |
| **context7-mcp** | 2 | Fetch library docs via Context7 MCP |
| **context7-docs** | 2 | Context7 docs for Tailwind, React, Next.js, etc. |

### Magic Keywords

Natural language triggers for modes:

- `"ralph"`, `"don't stop"` → Ralph mode
- `"autopilot"`, `"build me"` → Autopilot mode
- `"ultrawork"`, `"ulw"` → Ultrawork mode
- `"deep interview"` → Deep-interview skill
- `"cancel"`, `"stop"` → Cancel active modes

### Hub Commands

| Command | Subcommands | Purpose |
|---------|------------|---------|
| `/init-project` | setup, detect, docs, context, verify, refresh, status, map-codebase, doctor, reset, provision | Project init — full setup, detection, validation, codebase-aware artifact generation, and reset |
| `/ideation` | plan, brainstorm, decomposition, refine, deep, graph, research, ralplan, ddd, event-storming, double-diamond, jtbd, impact-mapping, spiral, top-down, bottom-up, adversarial-debate, cleanroom, pwf, rpikit, hive, story-mapping, lean-canvas, constitution, resume, status | Planning & research — 24 methodologies plus task decomposition
| `/orchestrate` | ralph, team, deep, ccg, ultrawork, autopilot, sciomc, swarm, state-machine, consensus, evolutionary, spec-driven, react, plan-execute, hive, tdd, pair, pipeline, gsd, self-assess, remediate, devin, maestro, metaswarm, cc10x, gastown, ruflo, harden, brownfield, vibe-code, resume, status | Execution — 30 patterns from persistent loops to multi-stage pipelines |
| `/harvest-context` | session, codebase, skill, agent, rule, command, memory, docs, decompose, context, consume, compress, search, prune, export, diff, secondbrain, journal | Context & artifacts — 18 subcommands for knowledge extraction and management |
| `/project` | tests, commit, stage, pr, gh, optimize, icon, organize, analyze, changelog, converge, scan, sandbox, retrospect, purge, release, review, audit, archive, workspace | Project ops — 20 subcommands for quality, security, and maintenance |

## Project Structure

```
~/.config/opencode/
├── opencode.jsonc       # Main configuration
├── AGENTS.md            # Project-level instructions
├── agents/              # 29 agent definitions
├── skills/              # 67 workflow skills (65 original + 2 new: agent-format-enforcer, config-sync)
├── commands/            # 6 custom commands
├── tools/               # 10 TypeScript tools (hubMenu, loadSkill, listAgents, etc.)
├── plugins/             # Hook system + TUI plugins (hubs-plugin.ts, hubs-tui/)
├── rules/               # Shared rules (shell_strategy.md, context-strategy.md, hub-state.md, hub-routing.md, etc.)
├── templates/           # File templates
├── .opencode/           # Durable knowledge store (committed: context/; gitignored: state/)
│   ├── state/           # Session state (gitignored) — progress, checkpoints, sessions, project-memory.json
│   ├── context/         # Durable knowledge (committed) — frameworks/, patterns/, research/, decisions.md, theory.md
│   ├── CHANGELOG.md     # Auto-commit log (committed)
│   └── .vector/         # Vector search index (gitignored)
└── docs/                # Documentation
```

## State vs Context Separation

| Type | Location | Git | Purpose |
|------|----------|-----|---------|
| **State** | `.opencode/state/` | Gitignored | Ephemeral session data (progress, checkpoints, secrets, active modes) |
| **Context** | `.opencode/context/` | Committed | Durable knowledge (frameworks, patterns, research, decisions, theory) |

See `rules/context-strategy.md` for the full context model — auto-load/save conventions, security-aware storage rules, and frame retrieval conventions.

## Model Configuration

Default ollama cloud models:

| Model | Context | Output | Best For |
|-------|---------|--------|----------|
| deepseek-v4-pro:cloud | 1M | 131K | Default — frontier reasoning, agentic tasks |
| deepseek-v4-flash:cloud | 1M | 131K | Fast efficient reasoning |
| nemotron-3-ultra:cloud | 256K | 131K | Agent orchestration, long-running agents |
| glm-5.1:cloud | 202K | 131K | General purpose |
| glm-5:cloud | 202K | 131K | General purpose |
| kimi-k2.6:cloud | 262K | 262K | Extended context |
| minimax-m2.7:cloud | 205K | 128K | High performance |
| qwen3.6:cloud | 262K | 32K | Long documents |

## State Management

Session state lives in `.opencode/state/`:

- `*-state.json` - Mode state files
- `todos.json` - Task lists
- `project-memory.json` - Cross-session knowledge
- `notepad.md` - Session notes
- `artifacts/` - Skill outputs

## Path Conventions

| Path | Purpose |
|------|---------|
| `~/.config/opencode/` | User-wide config (shared) |
| `~/.config/opencode/skills/` | User-wide skills (64 skills) |
| `~/.agents/skills/` | External skills (context7-mcp) |
| `.opencode/` | Project-level config |
| `.opencode/state/` | Session state (gitignored) |
| `.opencode/context/` | Durable context (committed) |
| `.opencode/context/frameworks/` | Architecture patterns, conventions |
| `.opencode/context/patterns/` | Discovered patterns, anti-patterns, solutions |
| `.opencode/context/research/` | Web-extracted docs, papers, references |
| `.opencode/context/decisions.md` | Architecture Decision Records (ADRs) |
| `.opencode/context/theory.md` | Living documentation — THEORY.MD equivalent |

## Plugin Hooks

The Hubs plugin (`hubs-plugin.ts`) provides:

- `session.created` / `session.deleted` - Session lifecycle
- `tool.execute.before` / `tool.execute.after` - Tool lifecycle
- `chat.message` - Chat message processing
- `permission.ask` - Permission auto-approval
- `experimental.session.compacting` - Context preservation
- `experimental.chat.system.transform` - Context injection

## NPM Plugins

Configured in `opencode.jsonc`:

- `hubs-tui-hubs@0.1.0` - TUI hub dialogs (server.config removed to fix crash)
- `@plannotifier/opencode` - Plan notifications
- `@opencode-plugins/env-protection` - Environment protection
- `@franlol/opencode-md-table-formatter` - Markdown tables
- `@mohak34/opencode-notifier` - Desktop notifications
- `opencode-auto-resume` - Session auto-resume

## MCP Servers

Configured in `opencode.jsonc`:

- **Context7** (`context7`) - Remote MCP for fetching up-to-date library documentation. Requires `CONTEXT7_API_KEY` env var.

## Getting Started

```bash
# Initialize project (interactive menu)
/init-project

# Or use subcommands directly
/init-project setup          # Full init from scratch (phases 0-7)
/init-project setup --full   # Everything including context capture
/init-project detect          # Detect language, framework, tooling
/init-project docs            # Regenerate AGENTS.md documentation
/init-project context         # Capture session knowledge
/init-project verify          # Validate configuration
/init-project refresh         # Update existing, preserve manual edits
/init-project status          # Show init state and checkpoints
/init-project map-codebase    # Analyze brownfield codebase before init
/init-project doctor          # Run diagnostic health check
/init-project reset           # Reset project state with clean slate
/init-project provision       # Analyze codebase and auto-generate project-specific agents, skills, tools, and rules

# Plan and research (23 methodologies via /ideation)
/ideation plan sprint 5 implementation
/ideation deep design payment system
/ideation research auth tradeoffs
/ideation ddd model bounded contexts
/ideation event-storming explore domain
/ideation double-diamond solve UX problem
/ideation jtbd reframe requirements
/ideation impact-mapping trace deliverables
/ideation spiral target highest risk
/ideation top-down decompose architecture
/ideation bottom-up compose from primitives
/ideation adversarial-debate validate spec
/ideation cleanroom verify correctness
/ideation pwf plan with file persistence
/ideation story-mapping plan user journey
/ideation lean-canvas model product strategy

# Execute tasks (30 patterns via /orchestrate)
/orchestrate ralph fix all TypeScript errors
/orchestrate autopilot build feature X
/orchestrate ultrawork implement auth in parallel
/orchestrate swarm orchestrate gated pipeline
/orchestrate react debug login loop
/orchestrate consensus vote on best approach
/orchestrate evolutionary evolve to optimal solution
/orchestrate tdd build feature test-first
/orchestrate pair review and implement
/orchestrate pipeline deploy validated changes
/orchestrate cc10x detect and route automatically
/orchestrate metaswarm autonomous issue-to-PR
/orchestrate maestro strict role-separated factory
/orchestrate vibe-code conversational prototyping

# Harvest context and create artifacts (18 subcommands via /harvest-context)
/harvest-context session
/harvest-context codebase
/harvest-context skill error handling pattern
/harvest-context compress reduce token usage
/harvest-context search find auth decisions
/harvest-context prune clean stale context
/harvest-context export generate team report
/harvest-context diff show context changes
/harvest-context secondbrain setup knowledge base
/harvest-context journal enable audit trails

# Project operations (20 subcommands via /project)
/project commit fix auth bug
/project stage
/project pr create
/project optimize src/
/project icon logo.svg
/project changelog since v1.0
/project converge run 5-gate quality checks
/project scan run security vulnerability scan
/project sandbox enforce tool execution policies
/project retrospect analyze completed run
/project purge clean stale orchestration state
/project release tag and publish
/project review analyze recent changes
/project audit full project health check
/project archive move stale branches
```

## Dependencies

- `@opencode-ai/plugin` - Tool development SDK
- TypeScript 5.x - For custom tools
- Node.js 18+ - Runtime environment

<!-- context7 -->
Use Context7 MCP to fetch current documentation whenever the user asks about a library, framework, SDK, API, CLI tool, or cloud service -- even well-known ones like React, Next.js, Prisma, Express, Tailwind, Django, or Spring Boot. This includes API syntax, configuration, version migration, library-specific debugging, setup instructions, and CLI tool usage. Use even when you think you know the answer -- your training data may not reflect recent changes. Prefer this over web search for library docs.

Do not use for: refactoring, writing scripts from scratch, debugging business logic, code review, or general programming concepts.

## Steps

1. Always start with `resolve-library-id` using the library name and the user's question, unless the user provides an exact library ID in `/org/project` format
2. Pick the best match (ID format: `/org/project`) by: exact name match, description relevance, code snippet count, source reputation (High/Medium preferred), and benchmark score (higher is better). If results don't look right, try alternate names or queries (e.g., "next.js" not "nextjs", or rephrase the question). Use version-specific IDs when the user mentions a version
3. `query-docs` with the selected library ID and the user's full question (not single words)
4. Answer using the fetched docs
<!-- context7 -->
