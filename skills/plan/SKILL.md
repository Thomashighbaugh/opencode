---
name: omc-plan
description: Strategic planning with optional interview workflow
argument-hint: "[--direct|--consensus|--review] [--interactive] [--deliberate] <task description>"
pipeline: [deep-interview, omc-plan, autopilot]
next-skill: autopilot
handoff: .opencode/state/plans/ralplan-*.md
level: 4
---

<Purpose>
Auto-detects interview vs direct planning, supports consensus mode (Planner/Architect/Critic loop with RALPLAN-DR) and review mode (Critic evaluation).
</Purpose>

<Use_When>
- Plan before implementing -- "plan this", "let's plan"
- Structured requirements gathering for a vague idea
- Review existing plan -- "review this plan", `--review`
- Multi-perspective consensus -- `--consensus`, "ralplan"
- Broad/vague task needing scoping before code
</Use_When>

<Do_Not_Use_When>
- Autonomous end-to-end execution -- use `autopilot`
- Clear task ready to code -- use `ralph` or executor
- Simple question answerable directly
- Single focused fix with obvious scope
</Do_Not_Use_When>

<Why_This_Exists>
Structured requirements gathering prevents rework and scope creep. Consensus mode adds multi-perspective validation for high-stakes projects.
</Why_This_Exists>

<Execution_Policy>
- Auto-detect interview vs direct; one question at a time; explore codebase facts first
- Plans: 80%+ claims cite file/line, 90%+ criteria testable
- Consensus: automated by default; `--interactive` for user prompts; `--deliberate` for high-risk
</Execution_Policy>

<Steps>

### Mode Selection

| Mode | Trigger | Behavior |
|------|---------|----------|
| Interview | Default for broad requests | Interactive requirements gathering |
| Direct | `--direct`, or detailed request | Skip interview, generate plan directly |
| Consensus | `--consensus`, "ralplan" | Planner->Architect->Critic loop with RALPLAN-DR; `--deliberate` for high-risk; `--interactive` for user prompts |
| Review | `--review`, "review this plan" | Critic evaluation of existing plan |

### Interview Mode (broad/vague requests)

1. **Classify**: Broad (vague verbs, no specific files, 3+ areas) triggers interview
2. **Ask one question** via `AskUserQuestion` for preferences, scope, constraints
3. **Explore first**: Spawn `explore` agent for codebase facts before asking the user
4. **Build on answers**: Each question builds on the previous
5. **Consult Analyst** for hidden requirements, edge cases, risks
6. **Create plan** when user signals readiness

### Direct Mode (detailed requests)

1. Optional brief Analyst consultation
2. Generate plan immediately
3. Optional Critic review

### Consensus Mode (`--consensus` / "ralplan")

**RALPLAN-DR modes**: **Short** (default) and **Deliberate** (`--deliberate` or high-risk). Same Planner->Architect->Critic sequence.

**Provider overrides**: `--architect codex` / `--critic codex` replaces OpenCode passes with `omc ask codex --agent-prompt ...`. If unavailable, use default.

**State lifecycle**: On entry, `state_write(mode="ralplan", active=true, session_id=...)`. On handoff, `state_write(active=false, ...)`. Never `state_clear` before launching execution (30s cancel signal). On terminal exit, `state_clear(mode="ralplan", session_id=...)`. Always pass `session_id`.

1. **Planner**: plan + RALPLAN-DR summary (3-5 principles, top 3 drivers, >=2 options). Deliberate: pre-mortem + expanded test plan.
2. **User feedback** *(--interactive)*: `AskUserQuestion` (Proceed/Request changes/Skip review). Without: auto-proceed.
3. **Architect** via `@architect`: steelman counterargument, tradeoff tension, synthesis path. Deliberate: flag violations. **Sequential with step 4.**
4. **Critic** via `@critic`: principle-option consistency, alternative exploration, risk clarity, testable criteria. Reject shallow alternatives, contradictions, vague risks. Deliberate: reject missing pre-mortem/test plan.
5. **Re-review** (max 5): Collect feedback, Planner revises, return to step 3. If max reached, present best version.
6. **Apply improvements**: Deduplicate, update plan. Final output includes **ADR** (Decision/Drivers/Alternatives/Why/Consequences/Follow-ups).
7. *(--interactive)* `AskUserQuestion`: Approve via team (Recommended), Approve via ralph, Clear context and implement, Request changes, Reject. Without: output plan, `state_clear`, stop.
8. *(--interactive)* User chooses. If Reject, `state_clear` and stop.
9. On approval *(--interactive)*: `state_write(active=false)`, then `skill("team")` or `skill("ralph")`. For "Clear context": `state_write(active=false)`, `Skill("compact")`, `skill("ralph")`.

### Review Mode (`--review`)

1. Read plan from `.opencode/state/plans/`
2. Evaluate via `@critic`
3. Verdict: APPROVED, REVISE (with feedback), or REJECT

### Plan Output Format

Every plan: Requirements Summary, Acceptance Criteria (testable), Implementation Steps (file refs), Risks/Mitigations, Verification Steps.
- Consensus adds: **RALPLAN-DR summary** + **ADR** (Decision/Drivers/Alternatives/Why/Consequences/Follow-ups)
- Deliberate adds: **Pre-mortem (3 scenarios)** + **Expanded Test Plan**

Saved to `.opencode/state/plans/`. Drafts to `.opencode/state/drafts/`.
</Steps>

<Tool_Usage>
- `AskUserQuestion` for preferences; plain text for specific values (ports, names)
- `explore` agent (Haiku, 30s) for codebase facts
- `@planner` for validation, `@analyst` for requirements, `@critic` for review
- **CRITICAL — Consensus calls sequential.** Await Architect before Critic.
- Consensus: `AskUserQuestion` for feedback (step 2) and approval (step 7)
- On approval: `skill("ralph")` or `skill("team")` — never implement directly
- **State lifecycle**: `state_write(active=false)` for handoff, `state_clear` for terminal. Never `state_clear` before launching execution.
</Tool_Usage>

<Escalation_And_Stop_Conditions>
- Stop interviewing when requirements are clear
- Consensus: max 5 iterations, present best version. Don't clear state — user may Request changes. Clear only on final choice or non-interactive output.
- Without `--interactive`: output plan, `state_clear`, stop. With: require approval before execution.
- "Just do it": `state_write(active=false)`, then `skill("ralph")`. Never implement directly.
- Escalate irreconcilable trade-offs to user
</Escalation_And_Stop_Conditions>

<Final_Checklist>
- [ ] Testable acceptance criteria (90%+ concrete), file/line refs (80%+ claims)
- [ ] All risks have mitigations; no vague terms ("fast" -> "p99 < 200ms")
- [ ] Plan saved to `.opencode/state/plans/`
- [ ] Consensus: RALPLAN-DR summary (3-5 principles, top 3 drivers, >=2 options or invalidation rationale)
- [ ] Consensus final: ADR section (Decision/Drivers/Alternatives/Why/Consequences/Follow-ups)
- [ ] Deliberate: pre-mortem (3 scenarios) + expanded test plan
- [ ] `--interactive`: user approved before execution; no `--interactive`: plan output only
- [ ] State deactivated on every exit: `state_write(active=false)` for handoff, `state_clear` for terminal
</Final_Checklist>
