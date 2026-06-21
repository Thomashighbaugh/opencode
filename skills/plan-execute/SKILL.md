---
name: plan-execute
description: Classic plan-then-execute — architect builds complete plan, executor implements step by step
---

# Plan-Execute

Classic plan-then-execute orchestration: an architect agent builds a complete, detailed plan first, then an executor agent implements it step by step. No overlapping phases — the plan is fully specified before any code is written.

## When to Use

- Task benefits from a clear architectural blueprint before any code is written
- You need to separate design concerns from implementation concerns
- The work is complex enough that coding without a plan risks rework
- You want a clear "design review" gate before implementation begins
- The task involves multiple files, modules, or systems that need coordination

**Do not use when:**
- The task is trivial and well-understood — delegate directly to an executor
- Requirements are vague and need iterative discovery — use `deep` or `ralph` instead
- You need rapid prototyping with user feedback — use `vibe-code` instead
- The task is purely exploratory or research-oriented — use `/ideation` instead

## Workflow

### Phase 1: Architect Builds Plan

Delegate to `@architect` with the full task description and codebase context. The architect produces:

1. **System understanding** — Read relevant files, map dependencies, identify integration points
2. **Design decisions** — Architecture choices, tradeoffs, rejected alternatives
3. **Implementation plan** — Ordered steps, each with:
   - Files to create or modify
   - Specific changes to make
   - Dependencies on prior steps
4. **Risk assessment** — What could go wrong, what to verify after each step

**Output:** A `PLAN.md` file written to `.opencode/state/orchestration/plans/{slug}-plan.md`

### Phase 2: Plan Review (Optional Gate)

If the task is complex or the user wants a review gate:
- Present the plan to the user for approval
- Ask: "Does this plan look correct? Shall I proceed with implementation?"
- Wait for confirmation before Phase 3

### Phase 3: Executor Implements Step by Step

Delegate to `@executor` with the plan as context. The executor:

1. Reads the plan from `PLAN.md`
2. Implements each step **in order** — never skips ahead
3. After each step, runs verification:
   - Build/typecheck passes
   - Relevant tests pass
   - No regressions introduced
4. If a step fails, reports the issue and stops (does not improvise around the plan)
5. Marks each step as `[x]` completed in the plan as it goes

**Output:** Updated `PLAN.md` with completion status, and all implementation files.

### Phase 4: Final Verification

After all steps are complete:
1. Run full build/typecheck
2. Run full test suite
3. Verify no regressions
4. Report summary to user

## Constraints

- **No overlapping phases**: The plan must be complete before any code is written. The architect does not code. The executor does not design.
- **No plan deviation**: The executor follows the plan exactly. If a step cannot be implemented as specified, stop and report — do not improvise.
- **Step ordering**: Steps with dependencies must execute in order. Independent steps may be parallelized within the executor phase.
- **Plan scope**: The plan should be detailed enough that a different executor could follow it without the architect present.
- **State persistence**: Plan files go in `.opencode/state/orchestration/plans/` with ISO date prefix.

## Reminder

Plan first, then execute step by step.
