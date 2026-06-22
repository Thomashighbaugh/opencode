---
name: autopilot
description: Full autonomous execution from idea to working code
argument-hint: "<product idea or task description>"
level: 4
---

## Use When
- User wants end-to-end autonomous execution from an idea to working code
- User says "autopilot", "auto pilot", "autonomous", "build me", "create me", "make me", "full auto", "handle it all", or "I want a/an..."
- Task requires multiple phases: planning, coding, testing, and validation
- User wants hands-off execution and is willing to let the system run to completion

## Do Not Use When
- User wants to explore options or brainstorm — use `plan` skill instead
- User says "just explain", "draft only", or "what would you suggest" — respond conversationally
- User wants a single focused code change — use `ralph` or delegate to an executor agent
- User wants to review or critique an existing plan — use `plan --review`
- Task is a quick fix or small bug — use direct executor delegation

## Execution Policy
- Each phase must complete before the next begins
- Parallel execution is used within phases where possible (Phase 2 and Phase 4)
- QA cycles repeat up to 5 times; if the same error persists 3 times, stop and report the fundamental issue
- Validation requires approval from all reviewers; rejected items get fixed and re-validated
- Cancel with `/cancel` at any time; progress is preserved for resume

## Phases

### Phase 0 — Expansion
Turn the user's idea into a detailed spec.

- **If ralplan consensus plan exists** (`.opencode/state/plans/ralplan-*.md` or `consensus-*.md`): Skip BOTH Phase 0 and Phase 1 — jump directly to Phase 2. The plan has already been Planner/Architect/Critic validated.
- **If deep-interview spec exists** (`.opencode/state/specs/deep-interview-*.md`): Skip analyst+architect expansion, use the pre-validated spec directly as Phase 0 output. Continue to Phase 1.
- **If input is vague** (no file paths, function names, or concrete anchors): **HARD GATE** — Do NOT proceed. Redirect to `/deep-interview` for Socratic clarification. Only continue when the user provides concrete, actionable requirements.
- **Otherwise**: Analyst extracts requirements, Architect creates technical specification.
- Output: `.opencode/state/autopilot/spec.md`

### Phase 1 — Planning
Create an implementation plan from the spec.

- **If ralplan consensus plan exists**: Skip — already done.
- Architect: Create plan (direct mode, no interview)
- Critic: Validate plan
- Output: `.opencode/state/plans/autopilot-impl.md`

### Phase 2 — Execution
Implement the plan using Ralph + Ultrawork.

- Executor (Haiku): Simple tasks
- Executor (Sonnet): Standard tasks
- Executor (Opus): Complex tasks
- Run independent tasks in parallel

### Phase 3 — QA
Cycle until all tests pass (UltraQA mode).

- Build, lint, test, fix failures
- Repeat up to 5 cycles
- Stop early if the same error repeats 3 times (indicates a fundamental issue)

### Phase 4 — Validation
Tiered review — cheapest gate first, escalate on failure.

1. **Code-reviewer** (flash-tier): Runs first — quality + security smells + style
2. **Security-reviewer** (flash-tier): Only if code-reviewer flags security concerns
3. **Architect** (pro-tier): Only if code-reviewer or security-reviewer rejects
- All must approve; fix and re-validate on rejection

### Phase 5 — Cleanup
Delete all state files on successful completion.

- Remove `.opencode/state/state/autopilot-state.json`, `ralph-state.json`, `ultrawork-state.json`, `ultraqa-state.json`
- Run `/cancel` for clean exit

## Tool Usage
- Use `@architect` for Phase 4 architecture validation
- Use `@security-reviewer` for Phase 4 security review
- Use `@code-reviewer` for Phase 4 quality review
- Agents form their own analysis first, then spawn OpenCode Task agents for cross-validation
- Never block on external tools; proceed with available agents if delegation fails

## Escalation and Stop Conditions
- Stop and report when the same QA error persists across 3 cycles (fundamental issue requiring human input)
- Stop and report when validation keeps failing after 3 re-validation rounds
- Stop when the user says "stop", "cancel", or "abort"
- If requirements were too vague and expansion produces an unclear spec, offer redirect to `/deep-interview` for Socratic clarification, or pause and ask the user for clarification before proceeding

## Final Checklist
- [ ] All 5 phases completed (Expansion, Planning, Execution, QA, Validation)
- [ ] All validators approved in Phase 4
- [ ] Tests pass (verified with fresh test run output)
- [ ] Build succeeds (verified with fresh build output)
- [ ] State files cleaned up
- [ ] User informed of completion with summary of what was built

## Related
- `ralph` skill — Self-referential loop until task completion with configurable verification reviewer
- `ultrawork` skill — Parallel execution engine for high-throughput task completion
