---
name: orchestrate
description: Execution hub — pick an orchestration pattern, load a plan, and build. Persistent, parallel, or coordinated execution.
level: 2
---

# Orchestrate

Unified entry point for all execution and orchestration patterns. Each subcommand invokes a specific execution methodology with shared lifecycle behavior.

## When to Use

- You have an approved plan (from `/ideation` or elsewhere) and need to execute it
- You want a specific execution pattern for a task
- You need to resume interrupted work or run multi-agent execution with progress tracking

## No-Argument Behavior

When invoked without arguments (`/orchestrate`), list the subcommands as plain text and ask the user to choose. Do NOT call `hubMenu` or any other tool. Available patterns: ralph, team, deep, ccg, ultrawork, autopilot, sciomc, swarm, state-machine, consensus, evolutionary, spec-driven, react, plan-execute, hive, tdd, pair, pipeline, gsd, self-assess, remediate, devin, maestro, metaswarm, cc10x, gastown, ruflo, harden, brownfield, vibe-code.

## With-Argument Behavior

Directly invoke the matching subcommand. Print the reminder, then delegate to the corresponding skill.

## Subcommands

### `/orchestrate ralph` — Persistent Loop
**Method:** `ralph` — Keeps working in a loop until the task is verified complete. Each iteration checks progress and continues.
**Reminder:** Ralph: Persistent loop. I'll keep working until the task is verified complete.
**Delegates to:** `ralph` skill

### `/orchestrate team` — Coordinated Agents
**Method:** `team` — N coordinated agents on a shared task list with real-time messaging. Specify agent count and types.
**Reminder:** Team: N coordinated agents with shared task list. Specify count and agent types.
**Delegates to:** `team` skill

### `/orchestrate deep` — Deep Dive
**Method:** `deep-dive` — Two-stage pipeline: trace the causal chain, then deep-interview to crystallize requirements.
**Reminder:** Deep: 2-stage trace-to-interview. First trace the causal chain, then interview to crystallize requirements.
**Delegates to:** `deep-dive` skill

### `/orchestrate ccg` — Multi-Model Synthesis
**Method:** `ccg` — Query multiple models for diverse perspectives, then synthesize into a coherent answer.
**Reminder:** CCG: Multi-model synthesis. I'll query diverse perspectives and merge them into a coherent answer.
**Delegates to:** `ccg` skill

### `/orchestrate ultrawork` — Maximum Parallelism
**Method:** `ultrawork` — Parallel execution engine distributing tasks across workers for maximum throughput.
**Reminder:** Ultrawork: Maximum parallel execution. I'll distribute independent tasks across workers.
**Delegates to:** `ultrawork` skill

### `/orchestrate autopilot` — Full Autonomous
**Method:** `autopilot` — Full autonomous execution from idea to working code. Plans, executes, verifies, and iterates.
**Reminder:** Autopilot: Full autonomous execution. I'll plan, execute, verify, and iterate with minimal intervention.
**Delegates to:** `autopilot` skill

### `/orchestrate sciomc` — Parallel Scientist Analysis
**Method:** `sciomc` — Parallel scientist agents for comprehensive analysis. Each investigates a different aspect or hypothesis.
**Reminder:** Sciomc: Parallel scientist analysis. Multiple agents investigate different aspects simultaneously.
**Delegates to:** `sciomc` skill

## Inline Patterns

These patterns execute inline — no separate skill file needed.

### `/orchestrate state-machine` — State-Machine Orchestration
**When to use:** Workflows with explicit states, transitions, and guards.
**Workflow:** Define states (Analyze → Build → Test → Deploy) with transition guards. Each agent operates as a state with entry/exit conditions. Guard conditions block invalid transitions; on failure, transition to error state.

### `/orchestrate consensus` — Multi-Agent Consensus
**When to use:** Decisions with multiple valid approaches.
**Workflow:** Run 3+ agents independently on the same problem. Collect outputs, identify agreement/disagreement. Resolve via majority vote, weighted scoring, or synthesis.

### `/orchestrate evolutionary` — Evolutionary Delivery
**When to use:** Incremental delivery where each generation must be independently valuable.
**Workflow:** Build minimum viable generation (Gen 1). Validate fitness against acceptance criteria. Evolve to next generation, preserving what works.

### `/orchestrate spec-driven` — Spec-First Development
**When to use:** Requirements must be formalized before implementation.
**Workflow:** Formalize spec from requirements (structured, testable). Validate for completeness and consistency. Implement against the spec; verify each step.

### `/orchestrate react` — ReAct Pattern
**When to use:** Open-ended problems where the path isn't known upfront.
**Workflow:** **Think** — analyze state and decide next action. **Act** — execute the action. **Observe** — evaluate result, loop back to Think until goal met.

### `/orchestrate gsd` — Get Shit Done Pipeline
**When to use:** End-to-end feature delivery with wave-based parallel execution.
**Workflow:** **Discuss** — clarify scope. **Plan** — break into independent waves. **Execute** — run waves in parallel. **Verify** — validate each wave. **Ship** — atomic commits per wave.

### `/orchestrate self-assess` — Iterative Self-Evaluation
**When to use:** Quality-critical work requiring self-critique and refinement.
**Workflow:** Execute the task. Critically evaluate against quality thresholds. Reflect on gaps, refine, and repeat until all targets met.

### `/orchestrate remediate` — CI/Build Auto-Remediation
**When to use:** Build or CI pipeline failures.
**Workflow:** Detect failure and capture error output. Analyze root cause from logs. Apply targeted fix and re-run; loop until pipeline passes.

### `/orchestrate devin` — Autonomous Dev Pipeline
**When to use:** Full-stack feature development requiring plan → code → debug → deploy cycles.
**Workflow:** **Plan** — decompose requirements. **Code** — implement each step. **Debug** — iterative root-cause analysis. **Deploy** — ship when tests pass.

### `/orchestrate maestro` — Strict Role Separation
**When to use:** Large features where role separation prevents bias.
**Workflow:** **PM** gathers and formalizes requirements. **Architect** designs the solution (never codes). **Coder** implements and tests (never self-reviews).

### `/orchestrate metaswarm` — Autonomous Issue-to-PR
**When to use:** Full autonomous pipeline from issue to pull request with adversarial reviews.
**Workflow:** 12 agents across 7 phases: analyze, plan, implement, test, review, refine, PR. Adversarial reviews use fresh reviewers each round. Each phase gates the next.

### `/orchestrate cc10x` — Intent-Detecting Router
**When to use:** Mixed-mode tasks where the system auto-detects whether to build, debug, review, or plan.
**Workflow:** Intent detector classifies request (BUILD/DEBUG/REVIEW/PLAN). Evidence-first validation checks confidence. Confidence gating routes to appropriate workflow with fallback.

### `/orchestrate gastown` — Git-Backed Work Units
**When to use:** Distributed or unreliable agent environments requiring recoverable work.
**Workflow:** Each work unit is a git-backed commit/branch — atomic and traceable. GUPP principle: no handoffs without execution. NDI ensures reliable outcomes from unreliable processes.

### `/orchestrate ruflo` — Large-Scale Agent Swarm
**When to use:** Maximum-scale orchestration with 60+ agents and Q-Learning routing.
**Workflow:** Queen agents decompose work and assign to Workers. Q-Learning optimizes agent-task matching over time. 4 consensus protocols resolve conflicts at each hierarchy level.

### `/orchestrate hive` — Agent Hive Execution
**When to use:** Batched parallel execution with worktree isolation (Swarm Bee phase of Hive methodology).
**Workflow:** Decompose work into independent batches. Execute each batch in parallel with isolated worktrees. Best-effort worker verification; blocked workers trigger re-routing. Orchestrator runs batch-level tests before merging.

## Shared Lifecycle

Every subcommand follows this lifecycle:

### Step 0: Initialize State Directory
```bash
mkdir -p .opencode/state/orchestration/progress
mkdir -p .opencode/state/orchestration/checkpoints
```

### Step 1: Load Plan
Check for a plan in this order:
1. **Direct argument** — the description provided with the command
2. **Ideation output** — check `.opencode/state/ideation/` for most recent approved plan: `ls -t .opencode/state/ideation/*_final.md 2>/dev/null | head -1`
3. **Orchestration cache** — check `.opencode/state/orchestration/checkpoints/*.json` for prior work
4. **Interactive** — if no plan found, ask user to describe the task

### Step 2: Execute
Skip plan review when the user explicitly invoked a subcommand with a task. Only review if the plan came from ideation and the user hasn't seen it yet. Print the method reminder inline, then immediately begin execution. Do NOT pause for confirmation.

Load and execute the appropriate skill:

| Subcommand | Skill to Load |
|------------|---------------|
| `ralph` | `ralph` |
| `team` | `team` |
| `deep` | `deep-dive` |
| `ccg` | `ccg` |
| `ultrawork` | `ultrawork` |
| `autopilot` | `autopilot` |
| `sciomc` | `sciomc` |

At each significant stage, write a checkpoint JSON and progress Markdown file to the state directories. Include method, stage, timestamp, completed/remaining items, and key decisions.

### Step 3: Report Progress (Inline Only)
At stage boundaries, write a checkpoint to disk and provide a brief inline status update. Do NOT pause for confirmation.

### Step 4: Create Resources On The Fly
If a new rule, skill, or agent is needed during execution: identify the gap, note it in the checkpoint, create the resource (rule → `.opencode/rules/`, skill → `skill-creator`, agent → `opencode-agent-creator`), and continue. Do NOT block for approval unless destructive.

### Step 5: Completion
Write a final checkpoint. Report results inline. Do NOT offer hand-off to other hubs.

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
