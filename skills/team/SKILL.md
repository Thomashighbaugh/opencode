---
name: team
description: N coordinated agents on shared task list using OpenCode native teams
argument-hint: "[N:agent-type] [ralph] <task description>"
aliases: []
level: 4
---

# Team Skill

Spawn N coordinated agents working on a shared task list using OpenCode's native team tools. Replaces the legacy `/swarm` skill (SQLite-based) with built-in team management, inter-agent messaging, and task dependencies.

## Usage

```
/team N:agent-type "task description"
/team "task description"
/team ralph "task description"
```

- **N** — Number of teammate agents (1-20). Optional; defaults to auto-sizing based on task decomposition.
- **agent-type** — OMC agent to spawn for `team-exec` (e.g., executor, debugger, designer, codex, gemini). Optional; defaults to stage-aware routing.
- **task** — High-level task to decompose and distribute among teammates.
- **ralph** — Wraps the team pipeline in Ralph's persistence loop (retry on failure, architect verification before completion).

## Staged Pipeline

`team-plan -> team-prd -> team-exec -> team-verify -> team-fix (loop)`

### Stage Agent Routing

Each pipeline stage uses specialized agents. The lead selects agents based on stage and task characteristics.

| Stage | Required Agents | Optional Agents | Selection Criteria |
|-------|----------------|-----------------|-------------------|
| **team-plan** | `explore`, `planner` | `analyst`, `architect` | Use `analyst` for unclear requirements. Use `architect` for complex system boundaries. |
| **team-prd** | `analyst` | `critic` | Use `critic` to challenge scope. |
| **team-exec** | `executor` | `executor` (opus), `debugger`, `designer`, `writer`, `test-engineer` | Match agent to subtask type. `executor` (opus) for complex autonomous work, `designer` for UI, `debugger` for compilation issues, `writer` for docs, `test-engineer` for tests. |
| **team-verify** | `verifier` | `test-engineer`, `security-reviewer`, `code-reviewer` | Always run `verifier`. Add `security-reviewer` for auth/crypto changes. Add `code-reviewer` for >20 files or architectural changes. |
| **team-fix** | `executor` | `debugger`, `executor` (opus) | Use `debugger` for type/build errors. Use `executor` (opus) for complex multi-file fixes. |

**Routing rules:**
1. The lead picks agents per stage, not the user. The user's `N:agent-type` only overrides `team-exec` worker type.
2. Specialist agents complement executors. Route analysis/review to architect/critic, UI to designer. Tmux CLI workers are one-shot.
3. Cost mode affects model tier: downgrade opus→sonnet→haiku where quality permits. `team-verify` always uses at least sonnet.
4. Security-sensitive or >20 file changes must include `security-reviewer` + `code-reviewer` (opus) in `team-verify`.

### Stage Entry/Exit Criteria

- **team-plan**: Entry — team invocation parsed. Agents: `explore` scans codebase, `planner` creates task graph. Exit — decomposition complete with runnable task graph.
- **team-prd**: Entry — scope ambiguous or acceptance criteria missing. Agents: `analyst` extracts requirements. Exit — acceptance criteria and boundaries explicit.
- **team-exec**: Entry — TeamCreate, TaskCreate, assignment, worker spawn complete. Agents: workers per subtask type. Exit — tasks reach terminal state for current pass.
- **team-verify**: Entry — execution pass finishes. Agents: `verifier` + reviewers. Exit (pass) — verification gates pass. Exit (fail) — fix tasks generated, control moves to `team-fix`.
- **team-fix**: Entry — verification found defects. Agents: `executor`/`debugger` per defect type. Exit — fixes complete, flow returns to `team-exec` → `team-verify`.

### Verify/Fix Loop

Continue `team-exec -> team-verify -> team-fix` until: (1) verification passes with no required fix tasks, or (2) terminal blocked/failed outcome with evidence. `team-fix` is bounded by max attempts (default: 3).

### Stage Handoff Convention

Each completing stage MUST produce a handoff document before transitioning. The lead writes handoffs to `.opencode/state/handoffs/<stage-name>.md`.

**Format:**
```markdown
## Handoff: <current-stage> → <next-stage>
- **Decided**: [key decisions]
- **Rejected**: [alternatives considered and why rejected]
- **Risks**: [identified risks for next stage]
- **Files**: [key files created or modified]
- **Remaining**: [items for next stage]
```

**Rules:**
1. Lead reads previous handoff BEFORE spawning next stage's agents — handoff content is included in agent spawn prompts.
2. Handoffs accumulate — verify stage reads all prior handoffs for full decision history.
3. On cancellation, handoffs survive in `.opencode/state/handoffs/` for session resume.
4. Handoffs are lightweight (10-20 lines max) — capture decisions and rationale, not full specs.

### Resume and Cancel Semantics

- **Resume:** Restart from last non-terminal stage using staged state + live task status. Read `.opencode/state/handoffs/` to recover stage transition context.
- **Cancel:** `/cancel` requests teammate shutdown, waits for responses (best effort), marks phase `cancelled`, captures metadata, deletes team resources. Handoff files preserved for potential resume.
- Terminal states: `complete`, `failed`, `cancelled`.

## Workflow

### Phase 1: Parse Input
Extract N (1-20), agent-type (valid OMC subagent), and task description.

### Phase 2: Analyze & Decompose
Use `explore` or `architect` to analyze codebase and break task into N subtasks. Each subtask should be file-scoped or module-scoped to avoid conflicts. Identify dependencies between subtasks.

### Phase 3: Create Team
Call `TeamCreate` with a slug derived from the task. The current session becomes team lead (`team-lead@{team_name}`).

Write OMC state: `state_write(mode="team", active=true, current_phase="team-plan", state={team_name, agent_count, agent_types, task, fix_loop_count: 0, max_fix_loops: 3, linked_ralph: false, stage_history: "team-plan"})`

> **Note:** MCP `state_write` transports all values as strings. Consumers must coerce `agent_count`, `fix_loop_count`, `max_fix_loops` to numbers and `linked_ralph` to boolean.

Update state on every stage transition. Read state for resume detection: if `active=true` and `current_phase` is non-terminal, resume from last incomplete stage.

### Phase 4: Create Tasks
Call `TaskCreate` for each subtask. Set dependencies with `TaskUpdate` using `addBlockedBy`. Pre-assign owners from the lead to avoid race conditions: `TaskUpdate(taskId, owner)`.

### Phase 5: Spawn Teammates
Spawn N teammates using `@agent-name` with `team_name` and `name` parameters. Each teammate gets the worker preamble plus their specific assignment. **Spawn all teammates in parallel** — do NOT wait for one to finish before spawning the next.

### Phase 6: Monitor
The lead monitors through two channels:
1. **Inbound messages** — Teammates send `SendMessage` to `team-lead`. These arrive as new conversation turns (no polling needed).
2. **TaskList polling** — Periodically call `TaskList` to check progress.

**Coordination actions:** Unblock a teammate via `SendMessage`, reassign work via `TaskUpdate`, handle failures by reassigning or spawning replacements.

**Task Watchdog:** If a task stays `in_progress` >5 min without messages, send status check. No messages + stuck task >10 min → reassign. If a worker fails 2+ tasks, stop assigning to it.

### Phase 7: Completion
1. Verify all real tasks (non-internal) are completed via `TaskList`.
2. Send `shutdown_request` to each active teammate.
3. Await `shutdown_response(approve: true)` from each (30s timeout).
4. Call `TeamDelete` to clean up.
5. Clear OMC state: `state_clear(mode="team")`.
6. Report summary to user.

## Agent Preamble

Include this preamble when spawning teammates, adapted with their specific task assignments:

```
You are a TEAM WORKER in team "{team_name}". Your name is "{worker_name}".
You report to the team lead ("team-lead").
You are not the leader and must not perform leader orchestration actions.

== WORK PROTOCOL ==
1. CLAIM: Call TaskList to see your assigned tasks (owner = "{worker_name}").
   Pick the first pending task assigned to you. Call TaskUpdate to set status "in_progress".
2. WORK: Execute the task using your tools (Read, Write, Edit, Bash).
   Do NOT spawn sub-agents. Do NOT delegate. Work directly.
3. COMPLETE: When done, mark the task completed via TaskUpdate.
4. REPORT: Notify the lead via SendMessage with summary of what was done.
5. NEXT: Check TaskList for more assigned tasks. If none, notify lead "All assigned tasks complete. Standing by."
6. SHUTDOWN: When you receive a shutdown_request, respond with shutdown_response(approve: true).

== BLOCKED TASKS ==
If a task has blockedBy dependencies, skip it until those tasks are completed.

== ERRORS ==
If you cannot complete a task, report failure to the lead via SendMessage.
Do NOT mark the task as completed. Leave it in_progress so the lead can reassign.

== RULES ==
- NEVER spawn sub-agents or use the @agent-name tool
- NEVER run tmux pane/session orchestration commands
- NEVER run team spawning/orchestration skills or commands
- ALWAYS use absolute file paths
- ALWAYS report progress via SendMessage to "team-lead"
- Use SendMessage with type "message" only -- never "broadcast"
```

### Agent-Type Prompt Injection
Append a short addendum based on worker type emphasizing strict TaskList/TaskUpdate/SendMessage loop, CLI API lifecycle, bounded file ownership, and milestone ACKs. Preserve the core rule: **worker = executor only, never leader/orchestrator**.

## Communication Patterns

- **Teammate → Lead (completion):** `{"type": "message", "recipient": "team-lead", "content": "...", "summary": "Task #N complete"}`
- **Lead → Teammate (reassignment):** `{"type": "message", "recipient": "worker-N", "content": "...", "summary": "New task assignment"}`
- **Broadcast (sparingly):** `{"type": "broadcast", "content": "...", "summary": "..."}` — sends N separate messages, use only for team-wide critical alerts.

### Shutdown Protocol (BLOCKING)
Steps must execute in exact order. Never call TeamDelete before shutdown is confirmed.

1. Verify all real tasks completed via TaskList.
2. Send `shutdown_request` to each teammate.
3. Wait up to 30s per teammate for `shutdown_response(approve: true)`. Track confirmations vs timeouts.
4. Call `TeamDelete` — only after ALL teammates confirmed or timed out.
5. Run orphan scan: `node "${OPENCODE_PLUGIN_ROOT}/scripts/cleanup-orphans.mjs" --team-name {team_name}`

The `request_id` is provided in the shutdown request message. The teammate must extract it and pass it back. Do NOT fabricate request IDs.

## CLI Workers (Codex and Gemini)

The team skill supports hybrid execution combining OpenCode agent teammates with external CLI workers. Both types can make code changes.

Tasks are tagged with an execution mode during decomposition:
- **OpenCode agent** — Full tool access (Read/Write/Edit/Bash/@agent-name). Best for iterative multi-step work, build/test loops, tasks needing team coordination.
- **Codex CLI (tmux pane)** — Full filesystem access, runs autonomously. Best for code review, security analysis, refactoring, architecture.
- **Gemini CLI (tmux pane)** — Full filesystem access, runs autonomously. Best for UI/design work, documentation, large-context tasks.

CLI workers operate via tmux, not OpenCode's tool system. They cannot use TaskList/TaskUpdate/SendMessage. The lead manages their lifecycle: write prompt file, spawn CLI worker, read output file, mark task complete.

## Error Handling

- **Teammate fails a task:** Lead decides retry (reassign to same/different worker) or skip. Use `TaskUpdate` to set new owner, `SendMessage` to notify.
- **Teammate stuck (no messages):** Lead detects via `TaskList` — task stuck `in_progress` too long. Send status check. If no response, consider dead and reassign.
- **Dependency blocked:** If blocking task fails, lead decides: retry blocker, remove dependency, or skip blocked task. Communicate via `SendMessage`.
- **Teammate crashes:** Internal task shows unexpected status. Teammate disappears from config. Lead reassigns orphaned tasks. Spawn replacement if needed.

## Team + Ralph Composition

When invoked with `ralph`, team mode wraps itself in Ralph's persistence loop. Both modes write state with cross-references (`linked_ralph: true`, `linked_team: true`).

**Execution flow:**
1. Ralph outer loop starts (iteration 1).
2. Team pipeline runs: `team-plan → team-prd → team-exec → team-verify`.
3. If `team-verify` passes: Ralph runs architect verification (STANDARD tier minimum).
4. If architect approves: both complete, run `/cancel`.
5. If `team-verify` fails OR architect rejects: team enters `team-fix`, loops back to `team-exec → team-verify`.
6. If fix loop exceeds `max_fix_loops`: Ralph increments iteration and retries full pipeline.
7. If Ralph exceeds `max_iterations`: terminal `failed` state.

**Cancellation:** Cancel either mode cancels both. Cancel Ralph → cancel Team first (graceful shutdown), then clear Ralph state. Cancel Team → clear Team, mark Ralph iteration cancelled, stop loop.

## Idempotent Recovery

If the lead crashes mid-run, detect existing state: check `${OPENCODE_CONFIG_DIR}/teams/` for teams matching the task slug. If found, read `config.json`, resume monitor mode instead of creating duplicate team. Call `TaskList` to determine current progress.

## Cancellation

`/cancel` handles team cleanup: read state via `state_read(mode="team")`, send `shutdown_request` to all active teammates, wait for responses (15s timeout), call `TeamDelete`, clear state via `state_clear(mode="team")`. If `linked_ralph`, also clear ralph state.

**Linked mode:** Cancel from Ralph context → cancel Team first, then clear Ralph. Cancel from Team context → clear Team, mark Ralph cancelled. Force cancel (`--force`) → clears both unconditionally.

## Runtime V2 (Event-Driven)

When `OMC_RUNTIME_V2=1` is set, uses event-driven architecture: snapshot-based monitoring with delta computation, event log at `.opencode/state/state/team/{teamName}/events.jsonl`, worker status files at `.opencode/state/state/team/{teamName}/workers/{name}/status.json`. Preserved: sentinel gate, circuit breaker, failure sidecars.

## Dynamic Scaling

When `OMC_TEAM_SCALING_ENABLED=1` is set: `scale_up` adds workers (respects max_workers), `scale_down` removes idle workers with graceful drain. File-based scaling lock prevents concurrent operations. Monotonic worker index counter ensures unique names across scale events.

## Configuration

Optional settings via `.omc-config.json`:
```json
{"team": {"maxAgents": 20, "defaultAgentType": "executor", "monitorIntervalMs": 30000, "shutdownTimeoutMs": 15000}}
```

Team members do not have a hardcoded model default. Each teammate is a separate OpenCode session inheriting the user's configured model.

## State Cleanup

On completion: `TeamDelete` removes `~/.config/opencode/teams/{team_name}/` and `~/.config/opencode/tasks/{team_name}/`. Then `state_clear(mode="team")`. If linked to Ralph: `state_clear(mode="ralph")`. Or run `/cancel` which handles all cleanup automatically.

**IMPORTANT:** Call `TeamDelete` only AFTER all teammates shut down. It will fail if active members (besides lead) still exist.

## Git Worktree Integration

MCP workers can operate in isolated git worktrees to prevent file conflicts. Create worktree at `.opencode/state/worktrees/{team}/{worker}` with branch `omc-team/{teamName}/{workerName}`. Pass worktree path as `workingDirectory` in `BridgeConfig`. After completion, use `checkMergeConflicts()` then `mergeWorkerBranch()` with `--no-ff`. On team shutdown, `cleanupTeamWorktrees()` removes all worktrees and branches.

Worktree lifecycle is managed separately via `git-worktree.ts` — `createSession()` does NOT handle worktree creation. Worktrees are NOT cleaned up on individual worker shutdown, only on team shutdown.

## Gotchas

1. **Internal tasks pollute TaskList** — Auto-created with `metadata._internal: true` when spawning teammates. Filter them when counting real task progress.
2. **No atomic claiming** — No transactional guarantee on `TaskUpdate`. Mitigation: lead pre-assigns owners before spawning. Teammates only work on assigned tasks.
3. **Task IDs are strings** — Always pass string values to `taskId` fields.
4. **TeamDelete requires empty team** — All teammates must be shut down first. Lead (only remaining member) is excluded.
5. **Messages are auto-delivered** — Teammate messages arrive as new conversation turns. No polling needed for inbound messages.
6. **Teammate prompt stored in config** — Do not put secrets or sensitive data in teammate prompts.
7. **Members auto-removed on shutdown** — After teammate approves shutdown, auto-removed from `config.json`. Don't re-read config expecting shut-down members.
8. **shutdown_response needs request_id** — Teammate must extract `request_id` from incoming shutdown request and pass it back. Fabricating causes silent failure.
9. **Team name must be a valid slug** — Lowercase letters, numbers, hyphens. Derive from task description.
10. **Broadcast is expensive** — Sends separate message to every teammate. Use DM by default.
11. **CLI workers are one-shot, not persistent** — Full filesystem access, can make code changes, but cannot use TaskList/TaskUpdate/SendMessage. Lead manages their lifecycle.
