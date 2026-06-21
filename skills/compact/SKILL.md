---
name: compact
description: Compact session context — save work artifacts to state and update CHANGELOG with recent changes. Use when session context is full or before switching tasks.
---

# Compact

Save a structured snapshot of the current session to disk and record any code changes in the project CHANGELOG. Use this skill when the session context window is approaching capacity, before switching to a different task, or when you want to preserve work products before a context compaction event.

## When to Use

- Session context is full or approaching the context window limit
- Before switching to a different task or project
- After completing a significant unit of work
- When the compaction hook (`experimental.session.compacting`) fires and you want to ensure artifacts are saved
- To record code changes with priority over `git log` for agent consumption

## Workflow

### Step 1: Gather Session Metrics

Read the heartbeat and session-stats files to collect current metrics:

| Source | Path | Fields |
|--------|------|--------|
| Heartbeat | `.opencode/state/sessions/{sessionId}/heartbeat.json` | `toolCount`, `recentTools`, `todoProgress` |
| Session stats | `~/.config/opencode/.session-stats.json` | `tool_counts`, `total_calls`, `started_at`, `updated_at` |

### Step 2: Check for Code Changes

Run `git diff --stat` to detect files modified since the last compaction. If there are changes, capture the list of changed files for the CHANGELOG entry.

### Step 3: Save Compaction Artifact

Write a structured JSON artifact to:

```
.opencode/state/sessions/{sessionId}/compaction-{timestamp}.json
```

**Artifact schema:**

```json
{
  "sessionId": "string",
  "compactedAt": "ISO-8601 timestamp",
  "toolCalls": "number (total tool calls from heartbeat)",
  "durationSeconds": "number (session duration from session-stats)",
  "subagentInvocations": "number (Task tool count from session-stats)",
  "modeState": {
    "ralph": {
      "active": "boolean",
      "iteration": "number",
      "prompt": "string"
    } | null,
    "ultrawork": {
      "active": "boolean",
      "originalPrompt": "string",
      "reinforcementCount": "number"
    } | null
  },
  "todoProgress": {
    "completed": "number",
    "remaining": "number",
    "pending": "number",
    "inProgress": "number"
  } | null,
  "recentTools": [
    {
      "name": "string",
      "time": "ISO-8601 timestamp"
    }
  ],
  "preservedContext": "string[] (key context items preserved)"
}
```

### Step 4: Update CHANGELOG

If `git diff --stat` shows changes, append an entry to `.opencode/CHANGELOG.md` (create the file if it doesn't exist):

```markdown
## [compaction-{timestamp}]
- Session: {sessionId}
- Tool calls: {count}
- Duration: {durationSeconds}s
- Files changed: {list from git diff --stat}
```

### Step 5: Report Summary

Output a concise summary of what was saved:

```
Compaction saved to: .opencode/state/sessions/{sessionId}/compaction-{timestamp}.json
CHANGELOG updated: {yes/no}
Tool calls: {count}
Duration: {durationSeconds}s
Files changed: {count}
```

## Inputs

| Input | Source | Description |
|-------|--------|-------------|
| `sessionId` | `getSessionID` tool | Current session identifier |
| `directory` | Project root | Working directory for path resolution |
| `heartbeat` | `.opencode/state/sessions/{sessionId}/heartbeat.json` | Tool call metrics and todo progress |
| `sessionStats` | `~/.config/opencode/.session-stats.json` | Session timing and tool counts |
| `gitDiff` | `git diff --stat` | Code changes since last commit |

## Outputs

| Output | Path | Description |
|--------|------|-------------|
| Compaction artifact | `.opencode/state/sessions/{sessionId}/compaction-{timestamp}.json` | Structured session snapshot |
| CHANGELOG entry | `.opencode/CHANGELOG.md` | Record of code changes (if any) |

## Conventions

- Use ISO-8601 timestamps with colons and dots replaced by hyphens for filenames (e.g., `compaction-2026-06-20T12-00-00-000Z.json`)
- Always read heartbeat.json and session-stats.json fresh — do not use cached values
- If heartbeat.json does not exist, use default values (toolCalls: 0, recentTools: [], todoProgress: null)
- If session-stats.json does not exist, use default values (durationSeconds: 0, subagentInvocations: 0)
- If git diff --stat shows no changes, skip the CHANGELOG update
- Create the sessions directory if it doesn't exist
- Never overwrite an existing compaction artifact — timestamps ensure uniqueness

## Example

```json
{
  "sessionId": "abc123-def456",
  "compactedAt": "2026-06-20T14:30:00.000Z",
  "toolCalls": 142,
  "durationSeconds": 3840,
  "subagentInvocations": 8,
  "modeState": {
    "ralph": {
      "active": true,
      "iteration": 4,
      "prompt": "Fix all TypeScript errors in src/"
    },
    "ultrawork": null
  },
  "todoProgress": {
    "completed": 12,
    "remaining": 3,
    "pending": 2,
    "inProgress": 1
  },
  "recentTools": [
    { "name": "Edit", "time": "2026-06-20T14:29:45.000Z" },
    { "name": "Read", "time": "2026-06-20T14:29:30.000Z" },
    { "name": "Bash", "time": "2026-06-20T14:29:15.000Z" }
  ],
  "preservedContext": [
    "## Ralph Loop State\n- Iteration: 4/10\n- Original Task: Fix all TypeScript errors in src/",
    "## Pending Tasks\n[1 active, 2 pending]"
  ]
}
```

## Related

- The compaction hook in `plugins/core/hooks.ts` (`experimental.session.compacting`) auto-saves artifacts for long sessions (>75 tool calls, >15 min, or >5 subagent invocations). This skill provides a manual trigger for the same behavior.
- Use `/harvest-context session` to extract session knowledge into durable context after compaction.
- Use `remember` skill to promote key findings into project memory.
