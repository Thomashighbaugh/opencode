---
name: subagent-driven-development
description: Execute implementation plans by dispatching independent subagents per task with automated review gates. Use when executing implementation plans with independent tasks, when you need per-task subagents for isolated context, or when you want spec compliance + code quality review after each task. CRITICAL for Hub-to-Hub handoffs between /ideation and /orchestrate — ensures plans survive context switches.
---

# Subagent-Driven Development

Execute plan by dispatching a fresh implementer subagent per task, a task review (spec compliance + code quality) after each, and a broad whole-branch review at the end.

**Why subagents:** You delegate tasks to specialized agents with isolated context. By precisely crafting their instructions and context, you ensure they stay focused and succeed at their task. They should never inherit your session's context or history — you construct exactly what they need.

**Core principle:** Fresh subagent per task + task review (spec + quality) + broad final review = high quality, fast iteration

**Continuous execution:** Do not pause to check in with your human partner between tasks. Execute all tasks from the plan without stopping. The only reasons to stop are: BLOCKED status you cannot resolve, ambiguity that genuinely prevents progress, or all tasks complete.

## When to Use

Use when you have an implementation plan with mostly independent tasks and you want to stay in the same session (no context switch).

**vs. Manual execution:**
- Subagents follow TDD naturally
- Fresh context per task (no confusion)
- Subagent can ask questions before AND during work

**vs. Parallel session execution:**
- Same session (no handoff)
- Continuous progress (no waiting)
- Review checkpoints automatic

## Hub-to-Hub Handoff Protocol

This skill is the bridge between `/ideation` (planning) and `/orchestrate` (execution). When handing off between hubs:

### ideation → orchestrate Handoff

When an `/ideation` session produces a plan that needs execution:

1. **Finalize the plan** — Ensure the plan has:
   - Ordered task list with acceptance criteria
   - Global constraints and design decisions
   - File paths and interfaces referenced
   - Dependencies between tasks documented

2. **Create handoff artifact** — Save the plan as a durable artifact:
   ```
   .opencode/state/ideation/handoff-{timestamp}.md
   ```
   Include: plan summary, task list with deps, decisions made, unresolved questions

3. **Handoff command** — From `/ideation`:
   ```
   /orchestrate --plan .opencode/state/ideation/handoff-{timestamp}.md
   ```

4. **On receipt** — The orchestration agent reads the handoff artifact, creates a progress ledger, and dispatches tasks using subagent-driven development.

### orchestrate → harvest-context Handoff

When an orchestration run completes:

1. **Extract decisions** — From task reviews and the final review
2. **Save progress ledger** — `.opencode/state/orchestration/progress/ledger-{timestamp}.md`
3. **Trigger harvest** — `/harvest-context session` to capture what was learned

### General Handoff Rules

- Always save a **handoff artifact** to `.opencode/state/` before switching hubs
- The artifact must be **self-contained** — the receiving hub should not need the sending hub's context
- Include: what was done, what decisions were made, what's left to do, any blockers
- Use **file-based handoffs** never inline context dumps
- After compaction, trust the handoff artifact and `git log` over your own recollection

## The Process

### Pre-Flight Plan Review

Before dispatching Task 1, scan the plan once for conflicts:
- Tasks that contradict each other or the plan's Global Constraints
- Anything the plan explicitly mandates that conflicts with quality standards

Present findings to the human as one batched question before execution begins.

### Per-Task Loop

For each task:

1. **Create task brief** — Extract the task requirements to a file
2. **Dispatch implementer subagent** with brief + report paths + context
3. **Handle implementer status**:
   - `DONE` — Generate review package, dispatch task reviewer
   - `DONE_WITH_CONCERNS` — Read concerns before proceeding
   - `NEEDS_CONTEXT` — Provide missing context, re-dispatch
   - `BLOCKED` — Assess and escalate
4. **Task reviewer checks** spec compliance + code quality
5. **Fix loop** — Critical/Important findings → dispatch fix subagent → re-review
6. **Mark task complete** in progress ledger

### Final Review

After all tasks complete, dispatch a final code reviewer with the full branch diff.

## Durable Progress

Track progress in a ledger file — conversation memory does not survive compaction.

- At skill start, check for existing ledger: `cat .opencode/state/orchestration/progress/ledger.md`
- When a task's review comes back clean, append to the ledger
- The ledger is your recovery map after context compaction

## Model Selection

| Task Complexity | Model Tier | Example |
|----------------|------------|---------|
| Mechanical (1-2 files, clear spec) | Fast/cheap | Isolated functions, clear specs |
| Integration (multi-file, coordination) | Mid | Cross-module changes |
| Architecture/Design | Most capable | Broad codebase understanding |
| Review | Match diff complexity | Small diff → fast, large → capable |

## Red Flags

**Never:**
- Start implementation on main/master branch without explicit user consent
- Skip task review or accept a report missing either verdict
- Proceed with unfixed Critical/Important issues
- Dispatch multiple implementation subagents in parallel (conflicts)
- Make a subagent read the whole plan file — hand it its task brief
- Skip scene-setting context
- Ignore subagent questions
- Move to next task while the review has open Critical/Important issues
- Re-dispatch a task the progress ledger already marks complete

## Handoff Artifact Template (for hub-to-hub transfer)

```markdown
# Handoff: [Plan Name]

## Origin
- **From hub**: [hub name]
- **Date**: [timestamp]

## Plan Summary
[1-2 sentence summary]

## Task List
| # | Task | Dependencies | Status |
|---|------|-------------|--------|
| 1 | ... | none | pending |
| 2 | ... | 1 | pending |

## Decisions Made
- [Decision 1]
- [Decision 2]

## Open Questions / Blockers
- [Any unresolved issues]

## Context Files
- [Paths to relevant files]
```
