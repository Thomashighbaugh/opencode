# OpenCode Hubs

> Hub-Driven Multi-Agent Orchestration for OpenCode — Interactive Menus, Not Memorization.

The name derives from the hub-and-spoke orchestration concept — a central operations hub that coordinates specialized units rather than trying to do everything itself. Each hub dispatches to a curated roster of 29 agents, 76 skills, 14 tools, and 2 commands through structured menus instead of requiring you to remember every capability's exact name.

The codebase evolves organically — each optimization emerges from actual usage: a missing facet surfaces mid-workflow, a previously overlooked edge case bites, and the configuration adapts. Rather than a grand upfront design, the system accretes capability patch by patch, responding to the real needs of orchestrating 29 agents across five hubs. Contributions, overlooked patterns, and pull requests are always welcome.

- **Deterministic Root Path Memoization** — Single-source-of-truth project root resolution with in-memory caching, eliminating redundant `git rev-parse` forks. Implementation: `getProjectRoot()` caches the resolved path after first lookup, collapsing O(n) shell calls to O(1).

- **Constant-Time State Topology Indexing** — State directory traversal bounded at constant depth regardless of session count, preventing unbounded recursion into `.opencode/state/` subtrees. Implementation: directory scans are depth-limited at the tool level, capping scan complexity at O(1) per invocation.

- **Micro-Kernel Hook Decomposition Architecture** — Monolithic plugin refactored into focused, independently-loadable modules (session lifecycle, mode state CRUD, magic keyword detection, hook handler dispatch), each with a single responsibility boundary. Implementation: `plugins/core/` splits the original `hubs-plugin.ts` into `session.ts`, `modes.ts`, `keywords.ts`, and `hooks.ts`.

- **Tiered Cognitive Model Orchestration** — 29 subagents classified into Top (deep reasoning), Mid (implementation), and Fast (search/summarization) tiers, each assigned to a model with matching capability profile. Implementation: agent definitions carry tier-appropriate model assignments (`deepseek-v4-pro:cloud` for architecture/security, `deepseek-v4-flash:cloud` for execution, `glm-5.1:cloud` for exploration).

- **Cross-Provider Resilience Fabric with Automatic Failover** — When the primary Ollama cloud provider errors out on a subagent invocation (connection refused, timeout, 5xx), the orchestrating agent transparently switches to the equivalent OpenCode-Go hosted model, retrying up to three times before escalating to the user. Implementation: `hubs.modelTiering` in `opencode.jsonc` defines primary/fallback chains per tier with configurable retry caps.

- **Emergent Need-Driven Configuration Evolution** — The system is not designed against a spec written in advance; it is continuously reshaped by the friction of real use. When a workflow breaks because a capability was assumed but missing, that gap gets filled. When an edge case that nobody anticipated finally triggers, it gets handled. The configuration is a living artifact that grows toward completeness through iterative, organic refinement — not a static blueprint.

---

## Quick Reference: Hub Menus

| Hub | Subcommands | Purpose |
|-----|-------------|---------|
| `/init-project` | 10 | Project initialization, detection, validation, and diagnostics |
| `/ideation` | 26 | Planning, research, and structured thinking — 24 methodologies |
| `/orchestrate` | 32 | Execution patterns — from persistent loops to multi-stage pipelines |
| `/harvest-context` | 18 | Knowledge extraction and artifact management |
| `/project` | 20 | Git operations, code quality, release management, file organization |

No arguments on any hub produces an interactive menu. Supply a subcommand directly to skip the menu: `/orchestrate ralph`, `/project commit`, `/harvest-context session`.

---

## Subcommand Reference

### `/init-project` — Project Initialization Hub

10 subcommands for first-time setup, detection, and diagnostics.

| Subcommand | Delegates To | Description |
|------------|-------------|-------------|
| `setup` | inline | Full initialization from scratch (phases 0–7). Add `--full` for context capture. |
| `detect` | inline | Auto-detect language, framework, test framework, and linter |
| `docs` | inline | Regenerate AGENTS.md hierarchy from source |
| `context` | inline | Capture session knowledge into durable context |
| `verify` | inline | Validate configuration, paths, and file integrity |
| `refresh` | inline | Update existing setup while preserving manual edits |
| `status` | inline | Show init state, checkpoints, and completion status |
| `map-codebase` | inline | Analyze brownfield codebase structure before initialization |
| `doctor` | inline | Run diagnostic health check for common configuration issues |
| `reset` | inline | Factory reset — wipe state and start fresh |

### `/ideation` — Planning, Research, And Ideation Hub

26 subcommands spanning strategic planning, domain modeling, task decomposition, and creative exploration.

| Subcommand | Delegates To | Description |
|------------|-------------|-------------|
| `plan` | `plan` skill | Structured work plan via interview, direct, or consensus mode |
| `brainstorm` | inline | Divergent idea generation around a topic |
| `decomposition` | inline | Break complex tasks into ordered, actionable subtasks with dependencies |
| `refine` | `idea-refine` skill | Convergent/divergent refinement of raw concepts |
| `deep` | `deep-interview` skill | Socratic interview with mathematical ambiguity gating |
| `graph` | `graph-thinking` skill | Map complex relationships as dependency/flow graphs |
| `research` | `ccg` skill | Multi-model consultation for balanced analysis |
| `ralplan` | `ralplan` skill | Planner→Architect→Critic consensus loop with auto-gating |
| `ddd` | inline | Domain-driven design: bounded contexts, ubiquitous language |
| `event-storming` | inline | Collaborative domain exploration via event modeling |
| `double-diamond` | inline | Divergent-convergent design thinking (discover→define→develop→deliver) |
| `jtbd` | inline | Jobs-To-Be-Done framework for requirement reframing |
| `impact-mapping` | inline | Strategic planning tracing deliverables to business goals |
| `spiral` | inline | Risk-driven iterative development planning |
| `top-down` | inline | Architectural decomposition from system to components |
| `bottom-up` | inline | Composition from primitives to system |
| `adversarial-debate` | inline | Structured critique validating design decisions |
| `cleanroom` | inline | Formal correctness verification of specifications |
| `pwf` | inline | Plan-With-Files: persistent file-backed planning |
| `rpikit` | inline | Rapid prototyping and iterative kit development |
| `hive` | inline | Multi-agent hive methodology planning |
| `story-mapping` | inline | User journey planning along a narrative spine |
| `lean-canvas` | inline | One-page business model and product strategy |
| `constitution` | inline | Define operating principles and decision-making rules |
| `resume` | — | Resume the most recent ideation session |
| `status` | — | Show all ideation work products with timestamps |

### `/orchestrate` — Execution Hub

32 subcommands covering persistent loops, parallel execution, swarm coordination, and development pipelines.

| Subcommand | Delegates To | Description |
|------------|-------------|-------------|
| `ralph` | `ralph` skill | Self-referential loop: execute, verify, repeat until task completes |
| `team` | `team` skill | N coordinated agents on a shared task list |
| `deep` | `deep-dive` skill | Two-stage pipeline: trace (causal investigation)→deep-interview |
| `ccg` | `ccg` skill | Multi-model consultation and synthesis across perspectives |
| `ultrawork` | `ultrawork` skill | Maximum parallel execution for high-throughput tasks |
| `autopilot` | `autopilot` skill | Full autonomous execution from idea to working code |
| `sciomc` | `sciomc` skill | Orchestrate parallel scientist agents for comprehensive analysis |
| `swarm` | inline | Multi-agent gated pipeline with coordinated handoffs |
| `state-machine` | inline | Phase-gated execution with checkpoints at each state transition |
| `consensus` | inline | Multi-agent voting to reach consensus on design decisions |
| `evolutionary` | inline | Tournament-selection evolution toward optimal solutions |
| `spec-driven` | inline | Execute against a formal specification with validation gates |
| `react` | inline | Reactive debug loop: observe, diagnose, fix, verify |
| `plan-execute` | inline | Two-phase: generate a plan, then execute against it |
| `hive` | inline | Structured multi-agent coordination (7 principles) |
| `tdd` | inline | Test-driven development: write failing test, implement, verify |
| `pair` | inline | Collaborative pair programming with role rotation |
| `pipeline` | inline | Deploy validated changes through a staged pipeline |
| `gsd` | inline | Get-Shit-Done: focused execution against clear deliverables |
| `self-assess` | inline | Self-evaluation and remediation without external review |
| `remediate` | inline | Diagnose issues and apply targeted fixes |
| `devin` | inline | Autonomous issue-to-PR pipeline |
| `maestro` | inline | Strict role-separated factory with specialized workers |
| `metaswarm` | inline | Meta-orchestration layer coordinating sub-swarms |
| `cc10x` | inline | Capability-based auto-detection and routing |
| `gastown` | inline | High-throughput task parallelization |
| `ruflo` | inline | Rule-based flow orchestration |
| `harden` | inline | Production hardening: error handling, edge cases, reliability |
| `brownfield` | inline | Legacy codebase analysis and incremental improvement |
| `vibe-code` | inline | Conversational prototyping with rapid iteration |
| `resume` | — | Resume the most recent orchestration from its checkpoint |
| `status` | — | Show all orchestration state files and checkpoints |

### `/harvest-context` — Context And Artifact Hub

18 subcommands for extracting, generating, and managing project knowledge.

| Subcommand | Delegates To | Description |
|------------|-------------|-------------|
| `session` | inline | Extract decisions, patterns, and learnings from the current conversation |
| `codebase` | `deepinit` skill | Generate hierarchical AGENTS.md documentation across the codebase |
| `skill` | `skill-creator` skill | Create or update a reusable workflow skill |
| `agent` | `opencode-agent-creator` skill | Define a project-specific agent role and instructions |
| `rule` | inline | Codify a convention or constraint as a project rule |
| `command` | `opencode-command-creator` skill | Create a slash command wrapping a repeatable workflow |
| `memory` | `remember` + `wiki` skills | Classify and persist project knowledge to memory, notepad, or wiki |
| `docs` | Context7 MCP | Fetch up-to-date official library documentation |
| `decompose` | `planner` agent | Break requirements into independently actionable units |
| `context` | inline | Scan, harvest, organize, or compact context files |
| `consume` | inline | Ingest a file, directory, or URL into durable context |
| `compress` | inline | Reduce verbose context to MVI format (under 200 lines) |
| `secondbrain` | inline | Set up a persistent knowledge base that compounds across sessions |
| `journal` | inline | Enable session audit trails and chronological event logging |
| `search` | inline | Semantic search across committed context |
| `prune` | inline | Clean stale entries from the context store |
| `export` | inline | Generate team-readable reports from harvested context |
| `diff` | inline | Show changes between current and previous context state |

### `/project` — Project Operations Hub

20 subcommands for git, quality, security, and release management.

| Subcommand | Delegates To | Description |
|------------|-------------|-------------|
| `tests` | inline | Generate 8-type test suite (unit, integration, E2E, performance, security, edge cases, regression, accessibility) |
| `commit` | `conventional-commit` skill | Conventional commit with emoji prefixes and structured messages |
| `stage` | inline | Stage files modified in the current conversation thread |
| `pr` | inline | Create, view, merge, and manage pull requests via GitHub CLI |
| `gh` | `github-ops` skill | Full GitHub CLI operations: repos, issues, releases, workflows |
| `optimize` | inline | Performance, security, and maintainability analysis |
| `icon` | `icon-generator` skill | Generate favicon, apple-touch-icon, and PWA icons from source |
| `organize` | `file-organizer` skill | Find duplicates, suggest structure improvements, automate cleanup |
| `analyze` | inline | Code pattern and architecture analysis across the codebase |
| `changelog` | `changelog-generator` skill | User-facing changelog from git history |
| `converge` | inline | Quality gate pipeline: run all checks until criteria are met |
| `scan` | inline | Security vulnerability scan across dependencies and code |
| `sandbox` | inline | Enforce tool execution policies and resource constraints |
| `retrospect` | inline | Analyze a completed orchestration run for process improvements |
| `purge` | inline | Clean stale orchestration state, checkpoints, and artifacts |
| `release` | inline | Tag versions, generate changelogs, and publish releases |
| `review` | `code-reviewer` agent | Multi-perspective code review: smells, security, architecture |
| `audit` | inline | Full project health audit: config, dependencies, security, coverage |
| `archive` | inline | Move stale branches and inactive components to archive storage |
| `workspace` | inline | Worktree-first dev environment management with tmux sessions |

---

## Overview

OpenCode Hubs solves a problem of scale. A configuration that accumulates 29 agents, 64 skills, and 6 commands over time becomes a burden of memory rather than a toolbox. The natural response — "I hope what I need exists somewhere" — is not a workflow.

The five hubs (`/init-project`, `/ideation`, `/orchestrate`, `/harvest-context`, `/project`) give every capability a discoverable home, ordered by the project development lifecycle. Each hub offers a menu when invoked without arguments, listing subcommands with descriptions. For experienced users, direct invocation skips the menu entirely: `/orchestrate ralph fix all TypeScript errors`.

### Architecture

Every hub follows the same three-phase lifecycle:

1. **Argument Detection** — No arguments produce an interactive menu; a recognized subcommand proceeds directly.
2. **Execution** — A terse reminder confirms intent, the hub checks for prior state, then delegates to the appropriate skill or agent.
3. **Post-Completion** — The hub suggests the next logical step in the workflow chain: init sets the stage, ideation leads to orchestration, orchestration leads to context harvesting, and completed artifacts should be committed.

Three hubs (`ideation`, `orchestrate`, `harvest-context`) persist progress to `.opencode/state/` for session-to-session continuity. The `/project` hub is intentionally stateless — git serves as its record.

### Execution Modes

| Mode | Trigger | Purpose |
|------|---------|---------|
| **Hubs** | `"hubs"` | Orchestrate subagents for complex multi-step tasks with auto-context creation |
| **Autopilot** | `"autopilot"` or `/orchestrate autopilot` | Full autonomous execution from idea to working code |
| **Ultrawork** | `"ulw"` or `/orchestrate ultrawork` | Maximum parallel execution for high-throughput tasks |
| **Team** | `/orchestrate team` | N coordinated agents on shared task lists |
| **UltraQA** | `/ultraqa` | QA cycling — test, verify, fix — until all criteria are met |

### Magic Keywords

Natural language triggers that invoke subcommands directly, bypassing the menu. Useful when you know what you want; potentially surprising when you type "don't stop" in casual conversation.

| Keyword | Routes To |
|---------|-----------|
| `"ralph"`, `"don't stop"` | `/orchestrate ralph` |
| `"autopilot"`, `"build me"` | `/orchestrate autopilot` |
| `"ultrawork"`, `"ulw"` | `/orchestrate ultrawork` |
| `"deep interview"` | `/ideation deep` |
| `"plan"` | `/ideation plan` |
| `"cancel"`, `"stop"` | Cancel any active mode |

---

## Quick Start

```bash
# Explore — menus guide discovery
/init-project
/ideation
/orchestrate
/harvest-context
/project

# Go direct when you know the subcommand
/init-project setup
/ideation plan redesign the auth module
/orchestrate ralph fix all TypeScript errors
/harvest-context memory
/project commit
```

---

## What's Inside

### Agents (29)

| Category | Agents |
|----------|--------|
| Implementation | @executor, @code-simplifier, @refactoring, @frontend-design |
| Architecture | @architect, @planner, @analyst, @deep-thinker, @designer |
| Review | @code-reviewer, @security-reviewer, @critic, @verifier, @qa-tester, @test-engineer |
| Research | @scientist, @explore, @writer, @document-specialist |
| Workflow | @tracer, @git-master, @debugger, @config-orchestrator |
| Specialized | @effort-estimator, @prompt-simplifier, @skill-creator, @requirements-analyzer, @commit-drafter |

### Skills (76)

| Category | Key Skills |
|----------|------------|
| Execution Modes | ralph, autopilot, ultrawork, team, ultraqa, cancel |
| Planning | plan, ralplan, deep-interview, deep-dive, sciomc |
| Quality | ai-slop-cleaner, self-improve, verify, visual-verdict |
| Development | deepinit, changelog-generator, skillify, learner |
| Setup | init-project, hubs-doctor, hubs-reference, mcp-setup |
| Hubs | ideation, orchestrate, project, harvest-context |

### Commands (2)

| Command | Purpose |
|---------|---------|
| `/init-project` | Initialize or refresh project configuration and documentation |
| `/ideation` | Planning and research hub |
| `/orchestrate` | Execution hub |
| `/harvest-context` | Context and artifact hub |
| `/project` | Project operations hub |
| `/skill` | Manage workflow skills |

### Tools (14)

| Tool | Description |
|------|-------------|
| `loadSkill` | Load skill content and metadata into agent context |
| `runSkillScript` | Execute shell scripts bundled with skills |
| `agentContext` | Manage project memory, notepad, and active mode state |
| `listAgents` | Enumerate and filter available agents by capability |
| `modeState` | Start, stop, update, or query execution mode state |
| `taskTodos` | Create and manage structured task lists |
| `artifacts` | Save, load, list, and delete skill-generated artifacts |
| `getSessionID` | Retrieve the current OpenCode session identifier |
| `saveCommitMessage` | Persist a commit message for the current session |
| `getCommitMessage` | Retrieve a previously saved commit message |
| `hubMenu` | Hub menu router — parse subcommands, check state, route delegation |
| `cache` | Multi-tier prompt cache management (tool, mcp, llm, agent, session) |
| `agent-cache` | Tier 4 agent output cache — avoid re-executing identical subagent tasks |
| `cache-utils` | Shared cache infrastructure — SHA-256 keying, TTL, disk+memory LRU |

---

## Model Configuration

Default Ollama cloud models with OpenCode-Go hosted fallbacks, configured in `opencode.jsonc`:

| Model | Context | Output | Tier | Fallback | Best For |
|-------|---------|--------|------|----------|----------|
| deepseek-v4-pro:cloud | 1M | 131K | **Top** | `opencode-go/deepseek-v4-pro` | Frontier reasoning, agentic tasks |
| deepseek-v4-flash:cloud | 1M | 131K | **Mid** | `opencode-go/deepseek-v4-flash` | Fast efficient reasoning |
| nemotron-3-ultra:cloud | 256K | 131K | **Mid** | `opencode/nemotron-3-ultra-free` | Agent orchestration, long-running agents |
| glm-5.1:cloud | 202K | 131K | **Fast** | `opencode-go/glm-5.1` | General purpose |
| glm-5:cloud | 202K | 131K | Fast | — | General purpose |
| kimi-k2.6:cloud | 262K | 262K | — | — | Extended context |
| minimax-m2.7:cloud | 205K | 128K | — | — | High performance |
| qwen3.6:cloud | 262K | 32K | — | — | Long documents |

### Provider Fallback

When an Ollama cloud model errors out on a subagent invocation (connection refused, timeout, 502/503/504), the orchestrating agent automatically retries with the equivalent OpenCode-Go hosted model. After 3 fallback retries, the user is asked how to proceed via the `question` tool. Task-level errors (wrong output) do not trigger provider switching — the task prompt is fixed instead.

| Attempt | Provider | Behavior |
|---------|----------|----------|
| 0 (initial) | Ollama cloud | Default from agent definition |
| 1–3 (retries) | OpenCode-Go | Automatic fallback, same task prompt |
| After 3 retries | — | Escalate to user (retry, handle manually, skip, abort) |

Configured under `hubs.modelTiering` in `opencode.jsonc`. See [Model Tiering & Fallback](./.opencode/docs/model-configuration.md#model-tiering--fallback) for full protocol details.

---

## Directory Structure

```
~/.config/opencode/
├── opencode.jsonc          # Main configuration
├── AGENTS.md               # Project-level agent instructions
├── agents/                 # 29 agent definitions
├── skills/                 # 76 workflow skills
├── commands/               # 2 commands
├── tools/                  # 14 TypeScript tools
├── plugins/                # Hubs plugin system
│   ├── hubs-plugin.ts      # Original monolith (preserved)
│   └── core/               # Split into focused modules
│       ├── session.ts      # Session lifecycle & stats
│       ├── modes.ts        # Mode state CRUD
│       ├── keywords.ts     # Magic keyword detection
│       └── hooks.ts        # All hook handlers (entry point)
├── rules/                  # 13 shared rules
├── templates/              # File templates
├── .opencode/              # Project-scoped config (committed)
│   ├── state/              # Session state (gitignored)
│   ├── context/            # Durable knowledge (committed)
│   ├── cache/              # Multi-tier prompt cache (gitignored)
│   └── docs/               # Reference documentation
└── .documentation/         # Reference documentation
```

---

## State Vs Context

| Type | Location | Git | Purpose |
|------|----------|-----|---------|
| **State** | `.opencode/state/` | Ignored | Ephemeral session data — progress, checkpoints, active modes, secrets |
| **Context** | `.opencode/context/` | Committed | Durable knowledge — frameworks, patterns, research, ADRs, theory |

The separation is deliberate. State is transient and compaction-safe. Context accumulates across sessions and forms a persistent project memory.

---

## Documentation

| File | Description |
|------|-------------|
| [installation.md](./.documentation/installation.md) | Installation methods, configuration, upgrading |
| [execution-modes.md](./.documentation/execution-modes.md) | Ralph, autopilot, ultrawork, team, ultraqa |
| [agents.md](./.documentation/agents.md) | All 29 agents with descriptions and usage |
| [skills.md](./.documentation/skills.md) | All 64 skills organized by category |
| [commands.md](./.documentation/commands.md) | All 6 commands with examples |
| [tools.md](./.documentation/tools.md) | TypeScript tools API reference |
| [model-configuration.md](./.documentation/model-configuration.md) | Model setup and routing |
| [state-management.md](./.documentation/state-management.md) | Session state persistence |
| [plugin-system.md](./.documentation/plugin-system.md) | Hook system and keyword detection |
| [path-conventions.md](./.documentation/path-conventions.md) | File and directory structure |

---

## License

MIT