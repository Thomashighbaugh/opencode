---
title: "Open Manifold — Multi-Agent Development System with Persistent Knowledge"
type: source-summary
tags: [opencode, plugin, multi-agent, orchestration, persistent-memory, state-machine, gpl3]
created: 2026-07-05
updated: 2026-07-05
sources: [npm-registry, npm-tarball-readme]
status: active
---

# Open Manifold (opencode-manifold)

Multi-agent development system for [opencode](https://opencode.ai) with persistent knowledge.

- **Package**: `opencode-manifold` on npm
- **License**: GPL 3+
- **Latest Version**: 0.6.3
- **59 releases** since Apr 7, 2026
- **Maintainer**: twine_network
- **Repository**: _Not publicly listed on npm — no GitHub link in metadata_
- **Built with**: Bun, TypeScript
- **Architecture**: Plugin-driven state machine (v2)

## Quick Install

```bash
npm install opencode-manifold
```

Then add to `opencode.json`:
```json
{
  "plugin": ["opencode-manifold"]
}
```

Run `/manifold-init` in the TUI to set up the project.

## Requirements

| Dependency | Required | Purpose |
|-----------|----------|---------|
| `opencode-codebase-index` plugin | **Yes** | Semantic code search for the Clerk agent |
| Obsidian | No (recommended) | Browsing Manifold/ as an Obsidian vault |

## Agents (7 total)

| Agent | Role | Model Tier |
|-------|------|-----------|
| **Planner** | Interview agent — asks clarifying questions, refines plans | planning |
| **Todo** | Process engineer — decomposes refined plans into tasks | planning |
| **Clerk** | Researcher — searches codebase, returns structured findings | conceptualizing + large context |
| **Senior Dev** | Implementation specialist | coding |
| **Junior Dev** | Reviewer — strict COMPLETE/QUESTIONS parsing | cheap/small coding |
| **Debug** | Fresh perspective after 3 failed loops | coding + troubleshooting |
| **Manifold** | User-facing guide — explains system, presents results | good tool calling + planning |

## Architecture: Plugin-Driven Orchestration (v2)

Core principle: **Deterministic orchestration + scoped LLM execution + persistent knowledge = agents that learn and don't repeat mistakes.**

In Manifold v2, the **plugin TypeScript code** is the conductor. Agents are pure workers — the plugin decides when to call whom. This eliminates the "agent ignores protocol" problem.

### Planning Phase

```
User → /manifold-plan <plan-file>
  → Plugin invokes Planner → JSON questions
  → User answers → /manifold-plan-answers
  → Plugin invokes Planner with Q&A → refined plan
  → Saved to Manifold/plans/<slug>-plan.md
  → /manifold-decompose → Todo breaks into tasks
  → Saved to Manifold/plans/<slug>-tasks.md
  → /manifold-execute
```

### Implementation Phase (State Machine)

```
For each task:
  1. Clerk researches → returns structured findings
  2. Dev Loop (up to 3 iterations):
     a. Senior Dev implements scoped prompt
     b. Junior Dev reviews (COMPLETE/QUESTIONS parsing)
     c. Junior feedback fed to Senior on next iteration
  3. If loops exhausted → Debug provides fresh perspective
  4. One final Senior attempt with Debug suggestion
  5. Final Junior review → if still fails → Clerk retry → escalate
  6. Log result to Manifold/tasks/<id>.md
  7. Update index.md, log.md, graph/
  8. User runs /manifold-continue for next task
```

### Session Resumption

If a session crashes mid-loop:
- Lead Dev reads the plan file
- Completed tasks are marked in `index.md`
- Resumes from first unmarked task
- Clerk's research phase accounts for prior work

## Folder Structure

```
Manifold/
├── .obsidian/          # Makes it an Obsidian vault
├── index.md            # Catalog of all tasks
├── log.md              # Chronological append-only log
├── plans.json          # Plan registry
├── schema.md           # Wiki conventions
├── settings.json       # User-tunable parameters
├── state.json          # State machine persistence
├── tasks/              # Individual task logs
│   ├── share-cart-001.md
│   └── ...
└── graph/              # Document graph
    └── src_middleware_auth_ts.md
```

## Agent Template Architecture (Three-Tier)

```
Bundled (inside npm package) → never edit directly
  → copies to → ~/.config/opencode/manifold/  (Global templates)
    → /manifold-init copies missing files to → .opencode/ (Project, editable)
```

Settings (`Manifold/settings.json`):

| Setting | Default | Description |
|---------|---------|-------------|
| maxLoops | 3 | Sr↔Jr loops before Debug escalation |
| maxRetries | 1 | Retry attempts per agent call |
| maxResults | 10 | Codebase-index search results |
| recentTaskCount | 3 | Recent task logs for context |
| clerkRetryEnabled | true | Clerk gets second pass after Debug fails |
| timeout | 300 | Max seconds per agent call |
| testCommand | null | Default test command |

## Subcommands

| Command | Description |
|---------|-------------|
| `/manifold-init` | Set up agents, skills, and Manifold directory |
| `/manifold-plan <path>` | Planner interviews to clarify the plan |
| `/manifold-plan-answers` | Submit answers to planner's questions |
| `/manifold-decompose <plan>` | Todo breaks plan into tasks |
| `/manifold-execute <tasks>` | Plugin orchestrates Clerk → Senior → Junior loop |
| `/manifold-continue` | Proceed to next task |

## Key Design Decisions

1. **Plugin-as-conductor (v2)** — Orchestration lives in TypeScript, not agent prompts. Agents are pure workers.
2. **Sr/Jr diversity** — Strong senior paired with cheaper junior for review; different model for Debug (fresh perspective)
3. **File-based persistent knowledge** — `Manifold/` folder compounds knowledge across sessions
4. **Deterministic loops** — Fixed maxLoops (default 3) with Debug escalation, not infinite retry
5. **Obsidian-compatible** — Folder structure works as an Obsidian vault for manual browsing
6. **License: GPL 3+** — Note: different from most other opencode plugins (MIT)

## Dependencies

- `@opencode-ai/sdk` — OpenCode SDK
- `@opencode-ai/plugin` — OpenCode plugin API
- `better-sqlite3` — SQLite for persistent storage
- `js-yaml` — YAML parsing
- `zod` — Schema validation

## Related

- Similar to opencode-dux (both are orchestration plugins) but Manifold uses plugin-driven state machine vs Dux's parallel agent dispatch
- Related to opencode-deep-memory (persistent memory) — both compound knowledge across sessions
- Requires [Helweg/opencode-codebase-index](https://github.com/Helweg/opencode-codebase-index) for semantic code search
- Uses [JuliusBrussee/caveman](https://github.com/JuliusBrussee/caveman) — ultra-compressed communication skill
