---
name: hive-methodology
description: Agent Hive methodology — 7 principles for structured multi-agent coordination: Plan→Approve→Execute, context persistence, batched parallelism, worktree isolation, good enough wins, tests define done, iron laws
level: 2
---

# Agent Hive Methodology

> **Stop vibing. Start hiving.** Plan first. Execute with trust. Context persists.

Inspired by [hung319/agent-hive](https://github.com/hung319/agent-hive)'s PHILOSOPHY.md — a multi-agent orchestration framework grounded in bee colony efficiency.

## The 7 Core Principles

### P1: Context Persists
Calibration survives between sessions. Store grounded, project-specific knowledge that shapes agent behavior.

**Store:**
- "We use Zustand, not Redux"
- "Auth is in /lib/auth, don't create new auth code"
- "We tried X, it was overkill for our scale"

**Don't store:** General knowledge the agent already has.

### P2: Plan → Approve → Execute
Two phases with a clear approval gate between them.

| Phase | Mode | Human Role |
|-------|------|------------|
| **Planning** | Dialogue | Shape, question, refine |
| **Execution** | Trust | Agent runs, human monitors |

Planning is collaborative. Execution is autonomous. The approval gate is where trust is earned.

### P3: Human Shapes, Agent Builds
- **Human owns:** The shape (what), the why (problem), the taste (what feels right)
- **Agent owns:** The details (how), the how (patterns/libraries), the execution (just do it)

Destination known. Path explored.

### P4: Good Enough Wins
Capture what's good enough FOR THIS CONTEXT. Reject over-engineering.

Valuable context examples:
- "We tried X, it was overkill for our 3-person team"
- "Don't suggest Z, we explicitly rejected it"

### P5: Batched Parallelism
Parallel tasks grouped into sequential batches. Context flows between batches.

```
Batch 1 (parallel):     Batch 2 (parallel):
├── Task A              ├── Task D (uses A+B+C)
├── Task B              └── Task E (uses A+B+C)
└── Task C
        ↓
   Glue task synthesizes results
        ↓
   Context flows to Batch 2
```

### P6: Tests Define Done
Best-effort worker verification + orchestrator batch testing.

- **Workers:** Write code, do best-effort checks (ast-grep, lint). ~80% confidence is enough to ship.
- **Orchestrator:** After batch merge, run full build + test suite. Diagnose failures, fix or re-dispatch.

### P7: Iron Laws + Hard Gates
Enforce with tools and instructions, not soft suggestions.

**Iron Laws:**
- Never plan without asking questions first
- Never complete without attempting verification
- Never assume when uncertain — ASK
- Always one question at a time (discovery)
- Always best-effort verification before commit
- Always stop and ask when blocked

## Bee Colony Agent Roles

| Agent | Role | Description |
|-------|------|-------------|
| **Architect Bee** | Planner | Interviews, discovers requirements, writes plan.md. NEVER executes. |
| **Swarm Bee** | Orchestrator | Coordinates execution, delegates to workers, merges results. |
| **Forager Bee** | Executor | Executes tasks in isolated contexts. Does the actual coding. |
| **Scout Bee** | Researcher | Researches codebase and external docs in parallel. |
| **Hygienic Bee** | Reviewer | Reviews plan quality. Returns OKAY/REJECT verdict. |

## Workflow

### Ideation Phase (Architect Bee)

1. **Active Discovery**: Ask clarifying questions. Challenge assumptions. Don't accept vague requirements.
2. **Gather Context**: Research codebase, existing patterns, external docs. Produce royal jelly (context).
3. **Design the Comb**: Break into tasks with dependencies. Task types: greenfield, testing, modification, bugfix, refactoring.
4. **Write plan.md**: Each task has: objective, context, approach, files affected, acceptance criteria.
5. **Approval Gate**: Present to human. Wait for explicit approval before any execution.

### Orchestration Phase (Swarm Bee)

1. **Load Plan**: Read the approved plan.md.
2. **Execute Batches**: Group independent tasks into parallel batches. Sequential batches share context flow.
3. **Monitor Workers**: Forager Bees execute each task. If blocked, worker reports: status, reason, options, recommendation.
4. **Blocked Worker Protocol**: Pause → ask human via structured question → resume with decision context. NEVER guess.
5. **Merge Batches**: After each batch, merge completed work. Run full tests.
6. **Synthesize**: Glue tasks merge findings between batches. Context flows forward.

## Usage Examples

### Planning with Hive
```
/ideation hive add user authentication
→ Architect Bee interviews you
→ Gathers context (existing auth code, patterns)
→ Produces plan.md with task breakdown
→ You approve → ready for /orchestrate hive
```

### Execution with Hive
```
/orchestrate hive user authentication
→ Swarm Bee loads approved plan
→ Batch 1: AuthService + Token refresh (parallel)
→ Batch 2: API routes + Tests (after Batch 1)
→ Each Forager in isolated worktree
→ Blocked? Worker reports, you decide
→ Final merge + tests → done
```

### Combined Flow
```
/hive add dark mode support
→ /ideation hive plan (interviews, produces plan.md)
→ /orchestrate hive execute (batched parallel execution)
→ Context persists for next session
```

## Integration with Hubs

| Hub | Subcommand | Hive Phase |
|-----|-----------|------------|
| `/ideation hive` | Plan | Architect Bee — interview → context → plan.md → approval gate |
| `/orchestrate hive` | Execute | Swarm Bee — batched parallelism → blocked protocol → batch test → merge |

## When to Use

- **Multi-file features** that need coordinated parallel work
- **Complex tasks** where planning prevents wasted effort
- **Team projects** where context must survive sessions
- **Any task** where you want assurance before execution begins

## When Not to Use

- **Single-file fixes** — just use direct execution
- **Urgent hotfixes** — planning overhead isn't worth it
- **Exploratory/toy projects** — vibe coding is fine
