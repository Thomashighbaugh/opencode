# Orchestrate

Unified entry point for all execution and orchestration patterns. Each subcommand invokes a specific execution methodology with shared lifecycle behavior.

## When to Use

- You have an approved plan (from `/ideation` or elsewhere) and need to execute it
- You want a specific execution pattern for a task
- Multi-agent execution with progress tracking and checkpoints
- Resume interrupted work from a prior orchestration session

## No-Argument Behavior

When invoked without arguments (`/orchestrate`), list the subcommands as plain text and ask the user to choose. Do NOT call `hubMenu` or any other tool — just output the list directly. Available patterns: ralph, team, deep, ccg, ultrawork, autopilot, sciomc, swarm, state-machine, consensus, evolutionary, spec-driven, react, plan-execute, hive, tdd, pair, pipeline, gsd, self-assess, remediate, devin, maestro, metaswarm, cc10x, gastown, ruflo, harden, subagent-driven, brownfield, vibe-code, resume, status.

## With-Argument Behavior

Directly invoke the matching subcommand. Print the reminder, then delegate to the corresponding skill.

## Subcommand Routing

| Subcommand | Skill/Delegate | What It Does |
|------------|----------------|--------------|
| `ralph` | `ralph` skill | Persistent loop — keep working until task is verified complete |
| `team` | `team` skill | N coordinated agents on a shared task list with real-time messaging |
| `deep` | `deep-dive` skill | 2-stage pipeline: trace causal chain, then deep-interview requirements |
| `ccg` | `ccg` skill | Multi-model synthesis — query diverse perspectives, merge into one answer |
| `ultrawork` | `ultrawork` skill | Parallel execution engine — distribute tasks across workers for throughput |
| `autopilot` | `autopilot` skill | Full autonomous execution from idea to working code |
| `sciomc` | `sciomc` skill | Parallel scientist agents — each investigates a different aspect |
| `swarm` | `swarm` skill | Architect-led swarm of 11 agents with gated QA pipeline |
| `state-machine` | inline | State-machine orchestration — explicit states, transitions, and guards |
| `consensus` | inline | Multi-agent consensus — 3+ agents independently, then resolve via vote/synthesis |
| `evolutionary` | inline | Evolutionary delivery — each generation independently valuable |
| `spec-driven` | inline | Spec-first — formalize requirements, implement against spec, verify each step |
| `react` | inline | ReAct pattern — think, act, observe loop until goal met |
| `plan-execute` | `plan-execute` skill | Classic plan-then-execute — architect plans, executor implements step by step |
| `hive` | `hive-methodology` skill | Batched parallel execution with worktree isolation |
| `tdd` | inline | Test-driven — write failing test, implement, verify, refactor |
| `pair` | inline | Pair programming — driver + navigator roles, switch on milestones |
| `pipeline` | inline | Sequential pipeline — ordered stages with gate conditions |
| `gsd` | inline | Get Shit Done — discuss, plan, execute waves in parallel, verify, ship |
| `self-assess` | `self-improve` skill | Iterative self-evaluation — execute, critique against thresholds, refine |
| `remediate` | inline | CI/build auto-remediation — detect failure, analyze, fix, re-run until pass |
| `devin` | inline | Autonomous dev pipeline — plan → code → debug → deploy cycle |
| `maestro` | inline | Strict role separation — PM, Architect, Coder; bias prevention |
| `metaswarm` | inline | Autonomous issue-to-PR — 12 agents across 7 phases with adversarial review |
| `cc10x` | inline | Intent-detecting router — auto-classify BUILD/DEBUG/REVIEW/PLAN |
| `gastown` | inline | Git-backed work units — atomic, traceable, recoverable |
| `ruflo` | inline | Large-scale swarm — 60+ agents with Q-Learning routing |
| `harden` | `harden` skill | Composable robustness — safeTask, circuitBreaker, verificationGate |
| `subagent-driven` | `subagent-driven-development` skill | Dispatch independent subagents per task with review gates |
| `brownfield` | `brownfield` skill | Feature addition to existing codebase — analyze, integrate, validate |
| `vibe-code` | `vibe-code` skill | Conversational rapid prototyping — natural language to full-stack |
| `resume` | self (inline) | Resume last orchestration session from checkpoint |
| `status` | self (inline) | Show current orchestration state |

### Subcommand Behavior

Each subcommand follows the hub pattern:

1. **Print a terse reminder** (1-2 lines, see Terse Reminders table below — never generated dynamically)
2. **Load plan** — check direct argument, then ideation output, then orchestration cache, then interactive
3. If plan came from ideation and user hasn't seen it, review briefly; otherwise skip review and execute
4. **Execute** by delegating to the appropriate skill (see routing table above)
5. **Write checkpoints** after each significant stage to `.opencode/state/orchestration/checkpoints/`
6. **Report inline** at stage boundaries — do NOT pause for confirmation
7. **On completion**, write final checkpoint and offer hand-off to other hubs

### Terse Reminders

| Subcommand | Reminder on Invoke |
|------------|-------------------|
| `ralph` | Ralph: Persistent loop. I'll keep working until the task is verified complete. |
| `team` | Team: N coordinated agents with shared task list. Specify count and agent types. |
| `deep` | Deep: 2-stage trace-to-interview. First trace the causal chain, then interview to crystallize requirements. |
| `ccg` | CCG: Multi-model synthesis. I'll query diverse perspectives and merge them into a coherent answer. |
| `ultrawork` | Ultrawork: Maximum parallel execution. I'll distribute independent tasks across workers. |
| `autopilot` | Autopilot: Full autonomous execution. I'll plan, execute, verify, and iterate with minimal intervention. |
| `sciomc` | Sciomc: Parallel scientist analysis. Multiple agents investigate different aspects simultaneously. |
| `swarm` | Swarm: Architect-led swarm with gated QA pipeline. 11 specialized agents, quality gates between batches. |
| `harden` | Harden: Composable robustness primitives — safeTask, circuitBreaker, verificationGate. |
| `plan-execute` | Plan-Execute: Architect builds complete plan, executor implements step by step. |

---

## Shared Lifecycle

Every subcommand follows this lifecycle:

### Step 0: Initialize State Directory

```bash
mkdir -p .opencode/state/orchestration/progress
mkdir -p .opencode/state/orchestration/checkpoints
```

### Step 0a: Parse Flags

Check for `--quiet` flag: when present, suppress all inline progress narration. Only print the final result and any errors. Saves tokens on long-running tasks where intermediate status is not needed.

### Step 1: Load Plan

Check for a plan in this order:
1. **Direct argument** — the description provided with the command
2. **Ideation output** — check `.opencode/state/ideation/` for most recent approved plan: `ls -t .opencode/state/ideation/*_final.md 2>/dev/null | head -1`
3. **Orchestration cache** — check `.opencode/state/orchestration/checkpoints/*.json` for prior work
4. **Interactive** — if no plan found, ask user to describe the task

### Step 2: Execute

Skip plan review when the user explicitly invoked a subcommand with a task. Only review if the plan came from ideation and the user hasn't seen it yet. Print the method reminder inline, then immediately begin execution. Do NOT pause for confirmation.

Load and execute the appropriate skill (see Subcommand Routing table). At each significant stage, write a checkpoint JSON and progress Markdown file to the state directories. Include method, stage, timestamp, completed/remaining items, and key decisions.

### Step 3: Report Progress (Inline Only)

At stage boundaries, write a checkpoint to disk and provide a brief inline status update. Do NOT pause for confirmation.

### Step 4: Create Resources On The Fly

If a new rule, skill, or agent is needed during execution: identify the gap, note it in the checkpoint, create the resource (rule → `.opencode/rules/`, skill → `skill-creator`, agent → `opencode-agent-creator`), and continue. Do NOT block for approval unless destructive.

### Step 5: Completion

Write a final checkpoint. Report results inline. Offer hand-off to other hubs (e.g., `/harvest-context` to capture decisions).

## Resume Behavior

`/orchestrate resume` checks `.opencode/state/orchestration/checkpoints/` for the most recent checkpoint. Shows stage, completed items, and remaining items. Asks: "Resume from stage {n}? [yes / start fresh]"

## Status Behavior

`/orchestrate status` shows active checkpoints, progress reports, completed orchestrations, and current method/stage if active.

## Plan From Ideation

When a plan comes from `/ideation` (`.opencode/state/ideation/`): reads the approved plan, extracts key decisions and assumptions, incorporates into execution, notes plan source in checkpoint.

## Interruption Recovery

If interrupted: checkpoint records exact position. `/orchestrate resume` picks up from last checkpoint. Completed items are NOT repeated.

## Related

- `/ideation` — Plan before you build
- `/harvest-context` — Extract and manage context artifacts
- `remember` skill — Promote durable knowledge
- `wiki` skill — Persistent knowledge base