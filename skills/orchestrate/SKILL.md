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