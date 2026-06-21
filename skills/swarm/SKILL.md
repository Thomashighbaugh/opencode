---
name: swarm
description: Architect-led swarm of 11 specialized agents with gated QA pipeline. Use when you need parallel execution with quality gates between batches
level: 4
---

# Swarm — Architect-Led Multi-Agent Execution

Architect-led team of 11 specialized agents executing in parallel batches with a gated QA pipeline. The architect designs the solution and creates a work plan, then agents execute in 3 parallel batches. Each batch passes through a QA gate before the next batch starts. Final verification by the verifier agent.

## When to Use

- You have a complex task that benefits from specialized agent roles working in parallel
- The work can be decomposed into independent units that don't conflict
- You need gated quality checks between execution phases
- You want architect-driven design with structured handoffs
- The task is too large for a single agent but doesn't need full autonomous orchestration

## Do Not Use When

- The task is simple enough for a single agent — just delegate directly
- You need persistent retry loops — use `ralph` instead
- You need full autonomous execution from idea to PR — use `metaswarm` instead
- You need N generic agents on a shared task list — use `team` instead
- You need batched parallelism with worktree isolation — use `hive` instead

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

## Gated Pipeline

```
                    ┌─────────────────┐
                    │    Architect     │
                    │  Design + Plan   │
                    └────────┬────────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │   Batch 1 (3-4) │
                    │  Executor 1     │
                    │  Executor 2     │
                    │  Executor 3     │
                    │  Designer       │
                    └────────┬────────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │    QA Gate 1    │
                    │  Code Reviewer  │
                    │  Security Rev.  │
                    │  Test Engineer  │
                    └────────┬────────┘
                             │
                    ┌────────▼────────┐
                    │   Pass/Fail?    │
                    └────────┬────────┘
                     ┌──────┘
                     ▼
            ┌─────────────────┐
            │   Batch 2 (2-3) │
            │  QA Tester      │
            │  Debugger       │
            │  (fixes)        │
            └────────┬────────┘
                     │
                     ▼
            ┌─────────────────┐
            │    QA Gate 2    │
            │  Code Reviewer  │
            │  Test Engineer  │
            └────────┬────────┘
                     │
            ┌────────▼────────┐
            │   Pass/Fail?    │
            └────────┬────────┘
                     ┌──────┘
                     ▼
            ┌─────────────────┐
            │   Batch 3 (1-2) │
            │  Debugger       │
            │  (final fixes)  │
            └────────┬────────┘
                     │
                     ▼
            ┌─────────────────┐
            │  Final Verify   │
            │   @verifier     │
            └─────────────────┘
```

## Workflow Steps

### Step 1: Architect Designs

Delegate to `@architect` to:
1. Analyze the task requirements
2. Design the solution architecture
3. Create a work plan with clear task breakdown
4. Define interfaces, data flow, and acceptance criteria
5. Output: `work-plan.md` saved to `.opencode/state/orchestration/progress/`

**Delegation format:**
```
@architect Design the solution for: {task description}. 
Create a work plan with task breakdown for 3 parallel executor tracks.
Output to .opencode/state/orchestration/progress/.
```

### Step 2: Batch 1 — Implementation (3-4 agents in parallel)

Decompose the architect's work plan into independent tasks and delegate to executors in parallel:

- `@executor` — Core implementation (primary)
- `@executor` — Supporting modules (secondary)
- `@executor` — Utilities, config, infrastructure (tertiary)
- `@designer` — UI/UX design, component architecture (if applicable)

All 3-4 agents run simultaneously. Each receives their specific task from the work plan.

**Delegation format:**
```
@executor Implement {specific module} per the work plan at {path}.
Follow the interfaces defined by the architect.
```

### Step 3: QA Gate 1 — Review & Test

After all Batch 1 agents complete, run the QA gate. Delegate in parallel:

- `@code-reviewer` — Review all code for correctness, style, conventions
- `@security-reviewer` — Review for vulnerabilities, secrets, anti-patterns
- `@test-engineer` — Write and run tests, verify coverage

**Gate criteria:**
- [ ] All code reviewed and approved by code-reviewer
- [ ] No security issues found (or all resolved)
- [ ] Tests written and passing
- [ ] Coverage meets thresholds

**If gate fails:** Note the issues, delegate to `@debugger` to fix, then re-run the gate.

### Step 4: Batch 2 — QA & Integration (2-3 agents in parallel)

- `@qa-tester` — Run end-to-end verification, edge case testing, integration checks
- `@debugger` — Fix any issues found in QA Gate 1
- (Optional) `@executor` — Address any remaining implementation gaps

### Step 5: QA Gate 2 — Re-Review

- `@code-reviewer` — Verify fixes and any new code
- `@test-engineer` — Run full test suite, verify no regressions

**Gate criteria:**
- [ ] All QA tester findings resolved
- [ ] Full test suite passes
- [ ] No regressions introduced
- [ ] Integration tests pass

**If gate fails:** Delegate to `@debugger` for fixes, re-run gate.

### Step 6: Batch 3 — Final Fixes (1-2 agents)

- `@debugger` — Address any remaining issues from QA Gate 2
- (Optional) `@executor` — Final polish if needed

### Step 7: Final Verification

Delegate to `@verifier` for the final sign-off:

```
@verifier Verify all work against the acceptance criteria in {work-plan path}.
Check: all tests pass, no security issues, code reviewed, acceptance criteria met.
```

**Verification checklist:**
- [ ] All acceptance criteria from work plan are met
- [ ] Full test suite passes
- [ ] Code review completed with no blockers
- [ ] Security review completed with no blockers
- [ ] No regressions introduced
- [ ] All edge cases handled

**If verification fails:** Return to Batch 3 for fixes, then re-verify.

**If verification passes:** Mark task complete, write final checkpoint.

## Agent Delegation Format

Use `@agent-name` format (NOT `call_omo_agent`):

```
@architect Design the solution for: {task}
@executor Implement {module} per the work plan
@code-reviewer Review {files} for correctness and style
@security-reviewer Audit {files} for vulnerabilities
@test-engineer Write tests for {module}
@qa-tester Run end-to-end verification on {feature}
@verifier Verify all acceptance criteria are met
@designer Design the UI/component architecture for {feature}
@debugger Diagnose and fix {issue}
```

## Checkpointing

At each stage boundary, write a checkpoint:

```bash
STAGE_ID="$(date +%Y%m%d_%H%M%S)_swarm_stage${N}"
cat > ".opencode/state/orchestration/checkpoints/${STAGE_ID}.json" << 'EOF'
{
  "method": "swarm",
  "task": "{description}",
  "stage": {n},
  "stageName": "{name}",
  "timestamp": "{ISO timestamp}",
  "batch": "{batch number}",
  "completed": ["{item1}", "{item2}"],
  "remaining": ["{item3}", "{item4}"],
  "gateStatus": "passed|failed|pending",
  "context": "{key decisions and learnings so far}"
}
EOF
```

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
