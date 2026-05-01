---
description: "Execution hub — pick an orchestration pattern, load a plan, and build"
invoke: orchestrate
argument-hint: "[ralph|team|deep|ccg|ultrawork|autopilot|sciomc] [plan or description]"
---

# Orchestrate

Unified entry point for all execution and orchestration patterns. Pick a method, review your plan, and build.

## Behavior

### With Arguments

Directly invoke the matching subcommand. Skip the menu.

### Without Arguments

Use the `hubMenu` tool with `action: "menu"` and `hub: "orchestrate"` to get the interactive menu JSON, then pass the result to the `question` tool to present it.

After the user selects, invoke the `orchestrate` skill with the selected subcommand.

## Subcommand Delegation

| Selection | Skill | Reminder |
|-----------|-------|----------|
| `ralph` | ralph | Persistent loop. I'll keep working until the task is verified complete. Won't stop early. |
| `team` | team | Coordinated agents. I'll spin up N agents on a shared task list with real-time messaging. |
| `deep` | deep-dive | 2-stage pipeline. First I'll trace the root cause, then interview to crystallize requirements. |
| `ccg` | ccg | Multi-model synthesis. I'll query diverse models and merge their perspectives into one answer. |
| `ultrawork` | ultrawork | Maximum parallelism. I'll execute all independent tasks simultaneously. |
| `autopilot` | autopilot | Full autonomy. From idea to working code — I'll handle everything. |
| `sciomc` | sciomc | Parallel scientists. I'll run multiple analysis agents concurrently for comprehensive coverage. |
| `resume` | — | Load most recent checkpoint from `.opencode/state/orchestration/checkpoints/` |
| `status` | — | List state files in `.opencode/state/orchestration/` |

## Plan Input

Orchestration needs a plan. Sources (checked in order):

1. **Direct argument** — description provided on the command line
2. **Ideation output** — most recent approved plan in `.opencode/state/ideation/`
3. **Orchestration cache** — most recent plan in `.opencode/state/orchestration/`
4. **Interactive** — ask user to describe the task

## Task

Invoke the `orchestrate` skill with: `$ARGUMENTS`