---
name: orchestrate
description: Execution hub — pick an orchestration pattern, load a plan, and build. Persistent, parallel, or coordinated execution.
level: 2
---

# Orchestrate

Unified entry point for all execution and orchestration patterns. Each subcommand invokes a specific execution methodology with shared lifecycle behavior: plan review, progress caching, status reporting, and resource creation.

## When to Use

- You have an approved plan (from `/ideation` or elsewhere) and need to execute it
- You want a specific execution pattern for a task
- You need to resume interrupted work
- You want orchestrated multi-agent execution with progress tracking

## No-Argument Behavior

When invoked without arguments (`/orchestrate`), list the subcommands as plain text and ask the user to choose. Do NOT call `hubMenu` or any other tool — just output the list directly. Available patterns: ralph, team, deep, ccg, ultrawork, autopilot, sciomc, swarm, state-machine, consensus, evolutionary, spec-driven, react, plan-execute, hive, tdd, pair, pipeline, gsd, self-assess, remediate, devin, maestro, metaswarm, cc10x, gastown, ruflo, harden, brownfield, vibe-code.

## With-Argument Behavior

Directly invoke the matching subcommand. Print the reminder, then delegate to the corresponding skill.

## Subcommands

### `/orchestrate ralph` — Persistent Loop

**Method:** `ralph`

Keeps working in a loop until the task is verified complete. Each iteration checks progress, identifies remaining work, and continues. Won't stop until done.

**Reminder:**
> Ralph: Persistent loop. I'll keep working until the task is verified complete. Each iteration checks progress and continues.

**Delegates to:** `ralph` skill

---

### `/orchestrate team` — Coordinated Agents

**Method:** `team`

N coordinated agents working on a shared task list with real-time messaging. Specify agent count and types.

**Reminder:**
> Team: N coordinated agents with shared task list. Specify count and agent types for parallel execution.

**Delegates to:** `team` skill

---

### `/orchestrate deep` — Deep Dive

**Method:** `deep-dive`

Two-stage pipeline: first trace the causal chain, then deep-interview to crystallize requirements. Good for debugging and complex investigation.

**Reminder:**
> Deep: 2-stage trace-to-interview. First I'll trace the causal chain, then interview to crystallize the real requirements.

**Delegates to:** `deep-dive` skill

---

### `/orchestrate ccg` — Multi-Model Synthesis

**Method:** `ccg`

Query multiple models for diverse perspectives, then synthesize into a coherent answer. Good for decisions with tradeoffs.

**Reminder:**
> CCG: Multi-model synthesis. I'll query diverse perspectives and merge them into a coherent answer.

**Delegates to:** `ccg` skill

---

### `/orchestrate ultrawork` — Maximum Parallelism

**Method:** `ultrawork`

Parallel execution engine — distributes tasks across workers for maximum throughput. Good for bulk independent work.

**Reminder:**
> Ultrawork: Maximum parallel execution. I'll distribute independent tasks across workers for highest throughput.

**Delegates to:** `ultrawork` skill

---

### `/orchestrate autopilot` — Full Autonomous

**Method:** `autopilot`

Full autonomous execution from idea to working code. Minimal user input required — plans, executes, verifies, and iterates.

**Reminder:**
> Autopilot: Full autonomous execution. I'll plan, execute, verify, and iterate with minimal intervention.

**Delegates to:** `autopilot` skill

---

### `/orchestrate sciomc` — Parallel Scientist Analysis

**Method:** `sciomc`

Parallel scientist agents for comprehensive analysis. Each agent investigates a different aspect or hypothesis.

**Reminder:**
> Sciomc: Parallel scientist analysis. Multiple agents investigate different aspects simultaneously for comprehensive coverage.

**Delegates to:** `sciomc` skill

---

## Inline Patterns

These patterns execute inline — no separate skill file needed. They are documented here for quick reference.

### `/orchestrate state-machine` — State-Machine Orchestration

**When to use:** Workflows with explicit states, transitions, and guards — agents move between states like a finite state machine.

**Workflow:**
1. Define states (e.g., Analyze → Build → Test → Deploy) with transition guards
2. Each agent operates as a state, with explicit entry/exit conditions
3. Guard conditions block invalid transitions; on failure, transition to error state

---

### `/orchestrate consensus` — Multi-Agent Consensus

**When to use:** Decisions with multiple valid approaches — run agents independently, then resolve via voting.

**Workflow:**
1. Run 3+ agents independently on the same problem
2. Collect outputs and identify areas of agreement/disagreement
3. Resolve via majority vote, weighted scoring, or synthesis

---

### `/orchestrate evolutionary` — Evolutionary Delivery

**When to use:** Incremental delivery where each generation must be independently valuable and validated.

**Workflow:**
1. Build the minimum viable generation (Gen 1)
2. Validate fitness against acceptance criteria
3. Evolve to next generation, preserving what works, discarding what doesn't

---

### `/orchestrate spec-driven` — Spec-First Development

**When to use:** Requirements must be formalized and validated before implementation begins.

**Workflow:**
1. Formalize the spec from requirements (structured, testable)
2. Validate spec for completeness, consistency, and testability
3. Implement against the spec; verify each implementation step against it

---

### `/orchestrate react` — ReAct Pattern

**When to use:** Open-ended problems where the path to solution isn't known upfront — interleave reasoning and acting.

**Workflow:**
1. **Think** — analyze current state and decide next action
2. **Act** — execute the action (tool call, code change, query)
3. **Observe** — evaluate the result, then loop back to Think until goal met

---

### `/orchestrate gsd` — Get Shit Done Pipeline

**When to use:** End-to-end feature delivery with wave-based parallel execution and atomic commits.

**Workflow:**
1. **Discuss** — clarify requirements and scope
2. **Plan** — break into independent waves
3. **Execute** — run waves in parallel with fresh context per task
4. **Verify** — validate each wave independently
5. **Ship** — atomic commits per wave

---

### `/orchestrate self-assess` — Iterative Self-Evaluation

**When to use:** Quality-critical work where the agent must self-critique and refine until thresholds are met.

**Workflow:**
1. Execute the task
2. Critically evaluate output against quality thresholds
3. Reflect on gaps, refine, and repeat until all targets are met

---

### `/orchestrate remediate` — CI/Build Auto-Remediation

**When to use:** Build or CI pipeline failures — monitor, diagnose, fix, and re-run until green.

**Workflow:**
1. Detect failure and capture error output
2. Analyze root cause from logs and error messages
3. Apply targeted fix and re-run; loop until pipeline passes

---

### `/orchestrate devin` — Autonomous Dev Pipeline

**When to use:** Full-stack feature development requiring plan → code → debug → deploy cycles.

**Workflow:**
1. **Plan** — decompose requirements into implementation steps
2. **Code** — implement each step
3. **Debug** — iterative debugging with root-cause analysis loops
4. **Deploy** — ship when all tests pass

---

### `/orchestrate maestro` — Strict Role Separation

**When to use:** Large features where role separation prevents bias — PMs, Architects, and Coders have distinct responsibilities.

**Workflow:**
1. **PM** gathers and formalizes requirements
2. **Architect** designs the solution and reviews (never codes)
3. **Coder** implements and tests (never self-reviews)

---

### `/orchestrate metaswarm` — Autonomous Issue-to-PR

**When to use:** Full autonomous pipeline from issue to pull request with adversarial reviews.

**Workflow:**
1. 12 agents across 7 phases: analyze, plan, implement, test, review, refine, PR
2. Adversarial reviews use fresh reviewers each round to block anchoring bias
3. Each phase gates the next; rollback if quality thresholds aren't met

---

### `/orchestrate cc10x` — Intent-Detecting Router

**When to use:** Mixed-mode tasks where the system must auto-detect whether to build, debug, review, or plan.

**Workflow:**
1. Intent detector classifies the request (BUILD/DEBUG/REVIEW/PLAN)
2. Evidence-first validation checks confidence before dispatching
3. Confidence gating routes to the appropriate workflow with fallback on low confidence

---

### `/orchestrate gastown` — Git-Backed Work Units

**When to use:** Distributed or unreliable agent environments where work must be tracked and recoverable.

**Workflow:**
1. Each work unit is a git-backed commit/branch — atomic and traceable
2. GUPP principle: "if work on your hook, YOU MUST RUN IT" — no handoffs without execution
3. NDI (Non-Deterministic Isolation) ensures reliable outcomes from unreliable processes

---

### `/orchestrate ruflo` — Large-Scale Agent Swarm

**When to use:** Maximum-scale orchestration with 60+ agents, Q-Learning routing, and hierarchical topologies.

**Workflow:**
1. Queen agents decompose work and assign to Worker agents
2. Q-Learning smart routing optimizes agent-task matching over time
3. 4 consensus protocols resolve conflicts at each hierarchy level

---

### `/orchestrate hive` — Agent Hive Execution

**When to use:** Batched parallel execution with worktree isolation — Swarm Bee phase of the Hive methodology.

**Workflow:**
1. Decompose work into independent batches
2. Execute each batch in parallel with isolated worktrees
3. Best-effort worker verification; blocked workers trigger re-routing
4. Orchestrator runs batch-level tests before merging

---

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
2. **Ideation output** — check `.opencode/state/ideation/` for most recent approved plan:

```bash
ls -t .opencode/state/ideation/*_final.md 2>/dev/null | head -1
```

3. **Orchestration cache** — check `.opencode/state/orchestration/` for prior work:

```bash
ls -t .opencode/state/orchestration/checkpoints/*.json 2>/dev/null | head -1
```

4. **Interactive** — if no plan found, ask user to describe the task

### Step 2: Execute

Skip plan review when the user explicitly invoked a subcommand with a task — they want execution, not confirmation. Only review if the plan came from ideation and the user hasn't seen it yet.

Print the method reminder inline (1-2 lines, static), then immediately begin execution. Do NOT pause for confirmation.

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

At each significant stage, write a checkpoint:

```bash
STAGE_ID="$(date +%Y%m%d_%H%M%S)_${METHOD}_stage${N}"
cat > ".opencode/state/orchestration/checkpoints/${STAGE_ID}.json" << 'EOF'
{
  "method": "{method}",
  "task": "{description}",
  "stage": {n},
  "stageName": "{name}",
  "timestamp": "{ISO timestamp}",
  "completed": ["{item1}", "{item2}"],
  "remaining": ["{item3}", "{item4}"],
  "context": "{key decisions and learnings so far}"
}
EOF
```

Write progress summaries for human readability:

```bash
cat > ".opencode/state/orchestration/progress/${STAGE_ID}.md" << 'EOF'
# Orchestration Progress

**Method:** {method}
**Stage:** {n} — {name}
**Timestamp:** {timestamp}

## Completed
- {item1}
- {item2}

## Remaining
- {item3}
- {item4}

## Key Decisions
- {decision1}
- {decision2}

## Context Notes
{learnings useful for continuation}
EOF
```

### Step 3: Report Progress (Inline Only)

At stage boundaries, write a checkpoint to disk and provide a brief inline status update. Do NOT pause for confirmation — continue immediately to the next stage.

### Step 4: Create Resources On The Fly

During orchestration, if the need arises for a new rule, skill, or agent:

1. Identify the gap
2. Note it in the checkpoint context
3. Create the resource using the appropriate creator:
   - New rule → create directly in `.opencode/rules/`
   - New skill → delegate to `skill-creator`
   - New agent → delegate to `opencode-agent-creator`
4. Continue execution with the new resource available

Do NOT block execution waiting for user approval on resource creation unless the change is destructive.

### Step 5: Completion

On task completion, write a final checkpoint to disk. Report results inline. Do NOT offer hand-off to other hubs — the user will invoke them explicitly if needed.

## Resume Behavior

`/orchestrate resume` checks `.opencode/state/orchestration/checkpoints/` for the most recent checkpoint and offers to continue from where it left off:

1. Find latest checkpoint
2. Show stage, completed items, and remaining items
3. Ask: "Resume from stage {n}? [yes / start fresh]"

## Status Behavior

`/orchestrate status` shows:
- Active checkpoints in `.opencode/state/orchestration/checkpoints/`
- Progress reports in `.opencode/state/orchestration/progress/`
- Completed orchestrations in `.opencode/state/orchestration/`
- Current method and stage if an orchestration is active

## Plan From Ideation

When a plan comes from `/ideation` (located in `.opencode/state/ideation/`), the orchestration skill:

1. Reads the approved plan file
2. Extracts key decisions, assumptions, and open items
3. Incorporates them into the execution plan
4. Notes in the checkpoint that the plan source was ideation

## Interruption Recovery

If orchestration is interrupted:

1. The checkpoint file records exactly where we were
2. `/orchestrate resume` picks up from the last checkpoint
3. Context from the checkpoint feeds into the resumed session
4. Completed items are NOT repeated

## Related

- `/ideation` — Plan before you build
- `/harvest-context` — Extract and manage context artifacts
- `remember` skill — Promote durable knowledge
- `wiki` skill — Persistent knowledge base