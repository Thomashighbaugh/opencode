# Hub State Conventions

OpenCode JOC uses five hub commands. Four track state; `/project` is stateless. All state lives in `.opencode/state/` and is gitignored. Durable context lives in `.opencode/context/` and is committed. See `rules/context-strategy.md` for the full context model.

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

## Auto-Load Context Convention

Agents load relevant context on process start — never all at once, always subtree-scoped:

| Trigger | Auto-load | Scope |
|---------|-----------|-------|
| Any hub invocation | `project-memory.json` | Facts only (compact) |
| `/init-project setup` | `context/frameworks/`, `context/patterns/` | Framework subtree |
| `/ideation plan` | `context/research/`, `context/decisions.md` | Domain-filtered |
| `/ideation deep` | `context/theory.md` | Operating theory |
| `/orchestrate execute` | `state/orchestration/checkpoints/`, `context/patterns/` | Phase-scoped |
| `/orchestrate resume` | Latest checkpoint JSON | Full checkpoint |
| `/orchestrate gsd` | `context/decisions.md` | ADRs for spec-driven work |
| `/harvest-context session` | Full session scan then save to context dirs | New frame |
| `/harvest-context docs` | Fetch → `context/research/` | New research frame |

## Auto-Save Context Convention

| Trigger | What's Saved | Where |
|---------|-------------|-------|
| Architectural decision | ADR entry | `.opencode/context/decisions.md` |
| Pattern discovered | Pattern doc | `.opencode/context/patterns/` |
| Web docs extracted | Research doc | `.opencode/context/research/` |
| Phase completed | Phase summary + patterns | `state/orchestration/`, `context/patterns/` |
| Gate passed | Evidence + quality report | `state/orchestration/progress/` |
| Error found + fixed | Root cause + solution | `context/patterns/` |
| Theory updated | Updated THEORY.MD | `context/theory.md` |

## Cross-Hub Hand-Off

- `/ideation` final output is read by `/orchestrate` to load approved plans
- `/orchestrate` completion auto-saves patterns/decisons to `context/`, then offers `/harvest-context`
- `/harvest-context` output feeds back into `/ideation` as prior context
- `/init-project setup --full` completion auto-saves context, offers `/harvest-context`
- `/init-project` detection results are read by `/ideation` for project context
- `/project` subcommands generate artifacts (commits, PRs, icons, tests) but do not cache state

## Resume Behavior

Each hub checks for existing state on `resume` and `status` subcommands:
- Resume: load latest checkpoint/work-product, offer to continue
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
