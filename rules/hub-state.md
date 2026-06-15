# Hub State Conventions

OpenCode Hubs uses five hub commands. Four track state; `/project` is stateless. All state lives in `.opencode/state/` and is gitignored. Durable context lives in `.opencode/context/` and is committed. See `rules/context-strategy.md` for the full context model.

## State vs Context Separation

| Type | Location | Git | Purpose |
|------|----------|-----|---------|
| **State** | `.opencode/state/` | Gitignored | Ephemeral session data (progress, checkpoints, secrets, active modes) |
| **Context** | `.opencode/context/` | Committed | Durable knowledge (frameworks, patterns, research, decisions, theory) |

## State Paths

| Hub | In-Progress | Progress | Final Output | Checkpoints |
|-----|-------------|----------|-------------|-------------|
| `/init-project` | — | — | `.opencode/state/init/` | `.opencode/state/init/init-checkpoint.json` |
| `/ideation` | `.opencode/state/ideation/work-products/` | — | `.opencode/state/ideation/` | — |
| `/orchestrate` | `.opencode/state/orchestration/progress/` | `.opencode/state/orchestration/progress/` | `.opencode/state/orchestration/` | `.opencode/state/orchestration/checkpoints/` |
| `/harvest-context` | — | — | `.opencode/state/harvest/` | — |
| `/project` | — (stateless) | — | — | — |

## Durable Context Paths

| Category | Location | What Goes There |
|----------|----------|----------------|
| Architecture | `.opencode/context/frameworks/` | Design patterns, conventions, system structure |
| Patterns | `.opencode/context/patterns/` | Discovered patterns, anti-patterns, solutions, error patterns |
| Research | `.opencode/context/research/` | Web-extracted docs, papers, references, external context |
| Decisions | `.opencode/context/decisions.md` | Architecture Decision Records (ADRs) |
| Theory | `.opencode/context/theory.md` | Living documentation — THEORY.MD equivalent |
| Memory | `.opencode/state/project-memory.json` | Cross-session durable facts (conditionally committed) |

## Context Loading and Saving

All context operations are MANUAL ONLY — triggered by explicit user hub commands. No automatic loading on session start or hub invocation. No automatic saving on phase completion or gate pass. See `rules/context-strategy.md` for the full model.

## State Database

Each state subdirectory uses a SQLite database (`state.db`) for structured state queries instead of ONNX-based vectorization. SQLite databases are gitignored (in `.opencode/state/`).

| State Dir | Database | Purpose |
|-----------|----------|---------|
| `.opencode/state/init/` | `init.db` | Init project state — checkpoints, phases, detection results |
| `.opencode/state/ideation/` | `ideation.db` | Ideation state — work products, plans, research |
| `.opencode/state/orchestration/` | `orchestration.db` | Orchestration state — progress, checkpoints, phase data |
| `.opencode/state/harvest/` | `harvest.db` | Harvest state — extracted context, session summaries |

SQLite databases are created on first use. Schema is auto-generated from the JSON state files written to each directory. No embedding models, no ONNX, no vector DB — plain SQL queries over structured state data.

## Cross-Hub Hand-Off

Hub hand-offs are MANUAL ONLY — the user invokes the next hub explicitly. No automatic offers or suggestions after completion.

## Resume Behavior

Each hub checks for existing state on `resume` and `status` subcommands:
- Resume: load latest checkpoint/work-product, continue immediately
- Status: list all state files with timestamps

(init, ideation, orchestration, harvest support resume/status; project is stateless)

## File Naming Convention

All state files use ISO date prefixes for chronological sorting:

```
YYYYMMDD_HHMMSS_{method}_{topic-slug}_{stage}.{md|json}
```

Examples:
- `20260422_143021_plan_auth-redesign_final.md`
- `20260422_150032_ralph_fix-ts-errors_stage3.json`
- `20260422_163000_session_decisions-and-patterns.md`

## Scope

- Project-scoped state: `.opencode/state/` (gitignored, per-project)
- Project-scoped durable context: `.opencode/context/` (committed, per-project)
- User-scoped skills/agents: `~/.config/opencode/skills/` and `~/.config/opencode/agents/`
- Project-scoped skills/agents: `.opencode/skills/` and `.opencode/agents/`
