---
name: hubs-teams
description: CLI-team runtime for opencode, codex, or gemini workers in tmux panes when you need process-based parallel execution
aliases: []
level: 4
mode: subagent
---

# Hubs Teams Skill

Spawn N CLI worker processes in tmux panes to execute tasks in parallel. Supports `opencode`, `codex`, and `gemini` agent types.

`/hubs-teams` is a legacy compatibility skill for the CLI-first runtime: use `opencode team ...` commands (not deprecated MCP runtime tools).

## Usage

```bash
/hubs-teams N:opencode "task description"
/hubs-teams N:codex "task description"
/hubs-teams N:gemini "task description"
```

### Parameters

- **N** - Number of CLI workers (1-10)
- **agent-type** - `opencode` (OpenCode CLI), `codex` (OpenAI Codex CLI), or `gemini` (Google Gemini CLI)
- **task** - Task description to distribute across all workers

### Examples

```bash
/hubs-teams 2:opencode "implement auth module with tests"
/hubs-teams 2:codex "review the auth module for security issues"
/hubs-teams 3:gemini "redesign UI components for accessibility"
```

## Requirements

- **tmux binary** must be installed and discoverable (`command -v tmux`)
- **Classic tmux session optional** for in-place pane splitting (`$TMUX` set). Inside cmux or a plain terminal, `opencode team` falls back to a detached tmux session instead of splitting the current surface.
- **opencode** CLI: installed via OpenCode
- **codex** CLI: `npm install -g @openai/codex`
- **gemini** CLI: `npm install -g @google/gemini-cli`

## Workflow

### Phase 0: Verify prerequisites

Check tmux explicitly before claiming it is missing:

```bash
command -v tmux >/dev/null 2>&1
```

- If this fails, report that **tmux is not installed** and stop.
- If `$TMUX` is set, `opencode team` can reuse the current tmux window/panes directly.
- If `$TMUX` is empty but `CMUX_SURFACE_ID` is set, report that the user is running inside **cmux**. Do **not** say tmux is missing or that they are "not inside tmux"; `opencode team` will launch a **detached tmux session** for workers instead of splitting the cmux surface.
- If neither `$TMUX` nor `CMUX_SURFACE_ID` is set, report that the user is in a **plain terminal**. `opencode team` can still launch a **detached tmux session**, but if they specifically want in-place pane/window topology they should start from a classic tmux session first.
- If you need to confirm the active tmux session, use:

```bash
tmux display-message -p '#S'
```

### Phase 1: Parse + validate input

Extract:

- `N` — worker count (1–10)
- `agent-type` — `opencode|codex|gemini`
- `task` — task description

Validate before decomposing or running anything:

- Reject unsupported agent types up front. `/hubs-teams` only supports **`opencode`**, **`codex`**, and **`gemini`**.
- If the user asks for an unsupported type such as `expert`, explain that `/hubs-teams` launches external CLI workers only.
- For native OpenCode team agents/roles, direct them to **`/team`** instead.

### Phase 2: Decompose task

Break work into N independent subtasks (file- or concern-scoped) to avoid write conflicts.

### Phase 3: Start CLI team runtime

Activate mode state (recommended):

```text
state_write(mode="team", current_phase="team-exec", active=true)
```

Start workers via CLI:

```bash
opencode team <N>:<opencode|codex|gemini> "<task>"
```

Team name defaults to a slug from the task text (example: `review-auth-flow`).

After launch, verify the command actually executed instead of assuming Enter fired. Check pane output and confirm the command or worker bootstrap text appears in pane history:

```bash
tmux list-panes -a -F '#{session_name}:#{window_index}.#{pane_index} #{pane_id} #{pane_current_command}'
tmux capture-pane -pt <pane-id> -S -20
```

Do not claim the team started successfully unless pane output shows the command was submitted.

### Phase 4: Monitor + lifecycle API

```bash
opencode team status <team-name>
opencode team api list-tasks --input '{"team_name":"<team-name>"}' --json
```

Use `opencode team api ...` for task claiming, task transitions, mailbox delivery, and worker state updates.

### Phase 5: Shutdown (only when needed)

```bash
opencode team shutdown <team-name>
opencode team shutdown <team-name> --force
```

Use shutdown for intentional cancellation or stale-state cleanup. Prefer non-force shutdown first.

### Phase 6: Report + state close

Report task results with completion/failure summary and any remaining risks.

```text
state_write(mode="team", current_phase="complete", active=false)
```

## Deprecated Runtime Note

Legacy MCP runtime tools are deprecated for execution:

- `oas_run_team_start`
- `oas_run_team_status`
- `oas_run_team_wait`
- `oas_run_team_cleanup`

If encountered, switch to `opencode team ...` CLI commands.

## Error Reference

| Error                        | Cause                               | Fix                                                                                 |
| ---------------------------- | ----------------------------------- | ----------------------------------------------------------------------------------- |
| `not inside tmux`            | Requested in-place pane topology from a non-tmux surface | Start tmux and rerun, or let `opencode team` use its detached-session fallback           |
| `cmux surface detected`      | Running inside cmux without `$TMUX` | Use the normal `opencode team ...` flow; OAS will launch a detached tmux session         |
| `Unsupported agent type`     | Requested agent is not opencode/codex/gemini | Use `opencode`, `codex`, or `gemini`; for native OpenCode agents use `/team` |
| `codex: command not found`   | Codex CLI not installed             | `npm install -g @openai/codex`                                                      |
| `gemini: command not found`  | Gemini CLI not installed            | `npm install -g @google/gemini-cli`                                                 |
| `Team <name> is not running` | stale or missing runtime state      | `opencode team status <team-name>` then `opencode team shutdown <team-name> --force` if stale |
| `status: failed`             | Workers exited with incomplete work | inspect runtime output, narrow scope, rerun                                         |

## Relationship to `/team`

| Aspect       | `/team`                                   | `/hubs-teams`                                         |
| ------------ | ----------------------------------------- | ---------------------------------------------------- |
| Worker type  | OpenCode native team agents            | opencode / codex / gemini CLI processes in tmux        |
| Invocation   | `TeamCreate` / `Task` / `SendMessage`     | `opencode team [N:agent]` + `status` + `shutdown` + `api` |
| Coordination | Native team messaging and staged pipeline | tmux worker runtime + CLI API state files            |
| Use when     | You want OpenCode-native team orchestration | You want external CLI worker execution               |
