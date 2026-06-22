---
name: swarm
description: Architect-led swarm of 11 specialized agents with gated QA pipeline. Use when you need parallel execution with quality gates between batches
level: 4
---

# Swarm — Architect-Led Multi-Agent Execution

Architect-led team of 11 specialized agents executing in parallel batches with a gated QA pipeline. The architect designs the solution and creates a work plan, then agents execute in 3 parallel batches. Each batch passes through a QA gate before the next batch starts. Final verification by the verifier agent.

## When to Use

- Complex task benefiting from specialized agent roles working in parallel
- Work decomposable into independent units that don't conflict
- Need gated quality checks between execution phases
- Architect-driven design with structured handoffs
- Task too large for a single agent but doesn't need full autonomous orchestration

## Do Not Use When

- Simple enough for a single agent — delegate directly
- Need persistent retry loops — use `ralph` instead
- Need full autonomous execution from idea to PR — use `metaswarm` instead
- Need N generic agents on a shared task list — use `team` instead
- Need batched parallelism with worktree isolation — use `hive` instead

## The 11 Agent Roles

| # | Role | Responsibility |
|---|------|----------------|
| 1 | **Architect** | Designs the solution, creates the work plan, defines interfaces and data flow |
| 2 | **Executor 1** | Implements core logic — primary implementation agent |
| 3 | **Executor 2** | Implements supporting modules — secondary implementation agent |
| 4 | **Executor 3** | Implements utilities, config, and infrastructure — tertiary implementation agent |
| 5 | **Code Reviewer** | Reviews code for correctness, style, and adherence to conventions |
| 6 | **Security Reviewer** | Reviews code for vulnerabilities, secrets exposure, and security anti-patterns |
| 7 | **Test Engineer** | Writes and runs unit/integration tests, ensures coverage thresholds |
| 8 | **QA Tester** | Runs end-to-end verification, edge case testing, and integration checks |
| 9 | **Verifier** | Final gate — validates all work meets acceptance criteria before sign-off |
| 10 | **Designer** | Designs UI/UX, component architecture, and visual consistency (when applicable) |
| 11 | **Debugger** | Diagnoses and fixes issues found during QA gates |

## Workflow Steps

### Step 1: Architect Designs
Delegate to `@architect` to analyze requirements, design the solution, create a work plan with task breakdown, define interfaces/data flow, and output `work-plan.md` to `.opencode/state/orchestration/progress/`.

**Delegation:** `@architect Design the solution for: {task}. Create a work plan with task breakdown for 3 parallel executor tracks. Output to .opencode/state/orchestration/progress/.`

### Step 2: Batch 1 — Implementation (3-4 agents in parallel)
Decompose the work plan into independent tasks and delegate in parallel: `@executor` (core), `@executor` (supporting), `@executor` (utilities/config), `@designer` (UI/UX if applicable). Each receives their specific task from the work plan.

**Delegation:** `@executor Implement {module} per the work plan at {path}. Follow the interfaces defined by the architect.`

### Step 3: QA Gate 1 — Review & Test
After all Batch 1 agents complete, delegate in parallel: `@code-reviewer` (correctness/style), `@security-reviewer` (vulnerabilities/secrets), `@test-engineer` (write/run tests, verify coverage).

**Gate criteria:** All code reviewed and approved. No security issues (or all resolved). Tests written and passing. Coverage meets thresholds.

**If gate fails:** Note issues, delegate to `@debugger` to fix, then re-run the gate.

### Step 4: Batch 2 — QA & Integration (2-3 agents in parallel)
`@qa-tester` runs end-to-end verification, edge case testing, integration checks. `@debugger` fixes issues from QA Gate 1. (Optional) `@executor` addresses remaining implementation gaps.

### Step 5: QA Gate 2 — Re-Review
`@code-reviewer` verifies fixes and new code. `@test-engineer` runs full test suite, verifies no regressions.

**Gate criteria:** All QA tester findings resolved. Full test suite passes. No regressions. Integration tests pass.

**If gate fails:** Delegate to `@debugger` for fixes, re-run gate.

### Step 6: Batch 3 — Final Fixes (1-2 agents)
`@debugger` addresses remaining issues from QA Gate 2. (Optional) `@executor` for final polish.

### Step 7: Final Verification
Delegate to `@verifier` for final sign-off: `@verifier Verify all work against the acceptance criteria in {work-plan path}. Check: all tests pass, no security issues, code reviewed, acceptance criteria met.`

**Verification checklist:** All acceptance criteria met. Full test suite passes. Code review completed with no blockers. Security review completed with no blockers. No regressions. All edge cases handled.

**If verification fails:** Return to Batch 3 for fixes, then re-verify. **If passes:** Mark task complete, write final checkpoint.

## Agent Delegation Format

Use `@agent-name` format (NOT `call_omo_agent`): `@architect`, `@executor`, `@code-reviewer`, `@security-reviewer`, `@test-engineer`, `@qa-tester`, `@verifier`, `@designer`, `@debugger`.

## Checkpointing

At each stage boundary, write a checkpoint JSON to `.opencode/state/orchestration/checkpoints/{timestamp}_swarm_stage{N}.json` with fields: method, task, stage, stageName, timestamp, batch, completed[], remaining[], gateStatus, context.

## Constraints

1. **Never skip a QA gate** — each batch must pass before the next begins
2. **Never run more than 4 agents in parallel** — batch size is 3-4 max
3. **Architect must design first** — no execution without a plan
4. **Verifier has final say** — only the verifier can sign off
5. **Use @agent-name format** — never use `call_omo_agent` or raw tool calls
6. **Write checkpoints at every stage** — enables resume on interruption
7. **Do NOT pause for user confirmation** between stages — continue immediately
8. **If a gate fails**, delegate to debugger, re-run the gate, do NOT skip forward

## Reminder

> Swarm: Architect-led team of 11 agents with gated QA pipeline. Design, execute in parallel batches, verify each batch.

## Related

- `/orchestrate team` — N coordinated agents on shared task list
- `/orchestrate hive` — Batched parallelism with worktree isolation
- `/orchestrate metaswarm` — 12-agent autonomous issue-to-PR pipeline
- `/orchestrate ralph` — Persistent retry loop
- `hive-methodology` skill — 7 principles for structured multi-agent coordination
