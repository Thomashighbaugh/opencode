---
title: "opencode-goal-plugin — Session-Scoped /goal Command with Auto-Continue"
type: source-summary
tags: [opencode, plugin, goal, auto-continue, session, hooks, state-machine]
created: 2026-07-07
updated: 2026-07-07
sources: [github-readme, source-code]
status: active
---

# opencode-goal-plugin (willytop8/OpenCode-goal-plugin)

Experimental session-scoped `/goal` command for OpenCode. Set a goal, plugin keeps it in context, auto-continues on idle, stops when complete/blocked/limit reached.

## Install

```bash
npm install opencode-goal-plugin
```

Add to `opencode.jsonc`:

```jsonc
{
  "plugin": ["opencode-goal-plugin"],
  "command": {
    "goal": {
      "description": "Set a session-scoped goal and auto-continue until complete.",
      "template": "$ARGUMENTS",
      "agent": "build"
    }
  }
}
```

## Commands

| Command | Description |
|---------|-------------|
| `/goal <condition>` | Set/replace focused goal |
| `/goal add <condition>` | Add goal, background current one |
| `/goal status` | Check active goal status |
| `/goal history` | View lifecycle history + latest checkpoint |
| `/goal resume` | Resume paused/stopped goal |
| `/goal edit <new objective>` | Revise objective, preserve budget + history |
| `/goal pause` | Pause without clearing |
| `/goal clear` | Clear active goal (aliases: stop, off, reset, none, cancel) |
| `/goal list` | List all live goals (focused + backgrounded) + archive |
| `/goal focus <n>` | Switch focused goal |
| `/goal sisyphus <a>; <b>; <c>` | Ordered sequence — auto-focus next on completion |

## How It Works

1. Set goal → plugin stores in session memory, injects into system prompt
2. Session idle → plugin sends continuation prompt with goal + budget + completion audit
3. Stops when assistant outputs `[goal:complete]` (with `[goal:evidence]` line) or `[goal:blocked]` (with concrete blocker), or safety limit reached
4. On session compaction → plugin injects deterministic summary from persisted state (not chat memory)
5. User message during goal → plugin pauses auto-continue (doesn't talk over you)
6. Unsubstantiated `[goal:complete]` (no evidence) or `[goal:blocked]` (no blocker) → rejected, re-prompted

## Completion Markers

```
[goal:evidence] ran npm test (83 passing), verified build output
[goal:complete]
```

```
Deploy needs production API token I don't have.
[goal:blocked]
```

`[goal:complete]` only honored when preceded by `[goal:evidence]` line. `[goal:blocked]` only honored with concrete blocker. Both rejected without substantiation.

## Safety Limits

| Limit | Default |
|-------|---------|
| Auto-continue turns | 10 |
| Max duration | 15 min |
| Context tokens | 200,000 |
| Min delay between continues | 1.5s |
| No-progress pause | <50 output tokens, 2-turn grace |
| Budget wrap-up | 80% of context token budget |
| Prompt failure pause | 3 consecutive failures |
| No-tool-call pause | 2 consecutive tool-free turns |

## Per-Goal Flags

`--max-turns`, `--max-minutes`, `--max-duration-ms`, `--max-tokens`, `--budget` (k/m suffix), `--cooldown-ms`, `--no-progress-threshold`, `--no-progress-turns`, `--success`/`--success-criteria`, `--constraints`/`--non-goals`, `--mode` (normal/ordered), `--no-tool-turns`

## State Persistence

Project-local: `<cwd>/.opencode/goals/state.json`. Precedence: explicit `stateFilePath` option > `OPENCODE_GOAL_STATE_PATH` env var > project-local default. Migrates from legacy `~/.opencode-goal-plugin/state.json` and XDG path on first load.

**Append-only lifecycle ledger** (`<stateFile>.ledger.jsonl`): every lifecycle event appended as JSON line. If main state file is lost/corrupted, reconstructs still-active goals from ledger on startup (paused recovery state). Terminal events written to ledger BEFORE main state write (fail-closed). `persistState: false` for purely in-memory.

## Multi-Goal Support

- `/goal add` backgrounds current goal, focuses new one
- `/goal list` shows numbered live goals (focused + backgrounded) + archive
- `/goal focus <n>` switches focus
- `/goal sisyphus <a>; <b>; <c>` — ordered sequence, auto-promotes next on completion

## Agent Tools (Optional)

Requires `@opencode-ai/plugin` peer dep. Tools: `get_goal`, `get_goal_history`, `set_goal`, `update_goal`, `clear_goal`. Same state as command path.

## Prompt Safety

Goal text wrapped in `<goal_objective>` tags, labeled as user-provided task data. Assistant told to treat as task description, not elevated instructions. XML tag injection prevention via `escapeGoalText()`.

## Key Design Patterns

- Marker-based completion detection (no independent evaluator)
- Deterministic compaction survival (state from persisted record, not chat memory)
- User-message preemption (pauses auto-continue on user input)
- Fail-closed ledger (terminal events written before state file)
- Ledger reconstruction from append-only log on state file loss
- Per-session multi-goal state with focus/background model
- Ordered (sisyphus) sequences with auto-promotion
- Token budget tracking (input + output + reasoning)
- No-progress + no-tool-call heuristics with grace windows
