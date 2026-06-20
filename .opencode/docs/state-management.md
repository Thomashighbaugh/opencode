# State Management

> Complete reference for Hubs state persistence and session management

## Table of Contents

- [Overview](#overview)
- [State Architecture](#state-architecture)
- [State Directory Structure](#state-directory-structure)
- [Mode State Files](#mode-state-files)
- [Project Memory](#project-memory)
- [Session Notepad](#session-notepad)
- [Artifacts](#artifacts)
- [Logs](#logs)
- [State Persistence](#state-persistence)
- [Cross-Session Restoration](#cross-session-restoration)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)

## Overview

Hubs maintains state across sessions to enable:

- **Mode continuity**: Resume where you left off
- **Context preservation**: Remember project details
- **Artifact storage**: Save skill outputs
- **Audit trails**: Track what happened

## State Architecture

### Performance Optimizations

- **Depth-limited scans**: State directory traversal is capped at `MAX_SCAN_DEPTH=3` to prevent O(n) performance degradation on large state directories
- **Index.json auto-updater**: After every state write, a lightweight index file is updated — subsequent reads use the index instead of a full directory scan
- **`getProjectRoot()` cached**: The project root is resolved once via `git rev-parse` and cached for the session lifetime, avoiding redundant child process forks

```
┌─────────────────────────────────────────────────────────────────┐
│                     OpenCode Session                             │
│                           │                                       │
│                           ▼                                       │
│              ┌─────────────────────┐                              │
│              │   hubs-plugin.ts     │                              │
│              │   (State Manager)   │                              │
│              └─────────────────────┘                              │
│                           │                                       │
│          ┌────────────────┴────────────────┐                      │
│          ▼                 ▼                 ▼                    │
│    ┌──────────┐     ┌──────────┐     ┌──────────┐                │
│    │Mode State│     │  Memory  │     │ Artifacts │                │
│    │  Files   │     │  Files   │     │   Files   │                │
│    └──────────┘     └──────────┘     └──────────┘                │
│          │                 │                 │                  │
│          └─────────────────┴─────────────────┘                  │
│                            ▼                                      │
│              ┌─────────────────────┐                              │
│              │ .opencode/state/   │                              │
│              └─────────────────────┘                              │
└─────────────────────────────────────────────────────────────────┘
```

## State Directory Structure

```
.opencode/state/
├── ralph-state.json           # Ralph mode state
├── autopilot-state.json        # Autopilot mode state
├── ultrawork-state.json        # Ultrawork mode state
├── team-state.json             # Team coordination state
├── ultraqa-state.json          # QA cycling state
├── todos.json                  # Task list state
├── project-memory.json         # Cross-session knowledge
├── notepad.md                  # Session notes
├── plans/                      # Planning documents
│   ├── sprint-5.md
│   └── architecture.md
├── logs/                       # Audit logs
│   ├── 2025-04-18.log
│   └── 2025-04-19.log
└── artifacts/                  # Skill outputs
    ├── autopilot/
    │   └── session-abc123/
    │       ├── requirements.md
    │       ├── design.md
    │       └── tasks.json
    ├── planning/
    │   └── session-def456/
    │       └── plan.md
    └── ralph/
        └── session-ghi789/
            └── verification-results.json
```

## Mode State Files

### Ralph State

**File:** `ralph-state.json`

```json
{
  "active": true,
  "started_at": "2025-04-18T10:00:00Z",
  "iteration": 5,
  "max_iterations": 100,
  "prompt": "fix all TypeScript errors",
  "original_prompt": "fix all TypeScript errors",
  "session_id": "abc123",
  "project_path": "/path/to/project",
  "verification_results": [
    { "iteration": 1, "status": "failed", "errors": 15 },
    { "iteration": 2, "status": "failed", "errors": 8 },
    { "iteration": 3, "status": "failed", "errors": 3 },
    { "iteration": 4, "status": "failed", "errors": 1 },
    { "iteration": 5, "status": "passed", "errors": 0 }
  ],
  "last_checked_at": "2025-04-18T10:30:00Z"
}
```

### Autopilot State

**File:** `autopilot-state.json`

```json
{
  "active": true,
  "started_at": "2025-04-18T10:00:00Z",
  "original_prompt": "build a REST API for managing tasks",
  "session_id": "abc123",
  "project_path": "/path/to/project",
  "current_phase": "implementation",
  "phase_status": {
    "requirements": "completed",
    "design": "completed",
    "planning": "completed",
    "implementation": "in_progress",
    "qa": "pending",
    "verification": "pending"
  },
  "artifacts": {
    "requirements_doc": ".opencode/state/artifacts/autopilot/abc123/requirements.md",
    "design_doc": ".opencode/state/artifacts/autopilot/abc123/design.md",
    "task_list": ".opencode/state/artifacts/autopilot/abc123/tasks.json"
  }
}
```

### Ultrawork State

**File:** `ultrawork-state.json`

```json
{
  "active": true,
  "started_at": "2025-04-18T10:00:00Z",
  "original_prompt": "fix all lint errors",
  "session_id": "abc123",
  "reinforcement_count": 2,
  "task_queue": [
    { "id": 1, "status": "completed", "agent": "executor", "result": "Fixed eslint errors in src/auth.ts" },
    { "id": 2, "status": "completed", "agent": "executor", "result": "Fixed eslint errors in src/api.ts" },
    { "id": 3, "status": "in_progress", "agent": "executor", "started_at": "2025-04-18T10:05:00Z" }
  ],
  "completed_count": 2,
  "failed_count": 0,
  "total_count": 5
}
```

### Team State

**File:** `team-state.json`

```json
{
  "active": true,
  "started_at": "2025-04-18T10:00:00Z",
  "session_id": "abc123",
  "team_size": 3,
  "agent_type": "executor",
  "shared_tasks": [
    { "id": 1, "description": "Create interface", "status": "completed", "assigned_to": "agent-1" },
    { "id": 2, "description": "Implement core logic", "status": "in_progress", "assigned_to": "agent-2" },
    { "id": 3, "description": "Add tests", "status": "pending", "assigned_to": null }
  ],
  "progress": {
    "completed": 1,
    "in_progress": 1,
    "pending": 3,
    "total": 5
  }
}
```

### UltraQA State

**File:** `ultraqa-state.json`

```json
{
  "active": true,
  "started_at": "2025-04-18T10:00:00Z",
  "session_id": "abc123",
  "goal": "all tests pass",
  "current_cycle": 2,
  "max_cycles": 50,
  "cycles": [
    {
      "cycle": 1,
      "test_result": { "passed": 12, "failed": 5 },
      "fixes_applied": 5,
      "verification": { "passed": 15, "failed": 2 }
    },
    {
      "cycle": 2,
      "test_result": { "passed": 15, "failed": 2 },
      "fixes_applied": 2,
      "verification": { "passed": 17, "failed": 0 }
    }
  ],
  "status": "success"
}
```

## Project Memory

### Structure

**File:** `.opencode/state/project-memory.json`

```json
{
  "techStack": {
    "languages": [
      { "name": "TypeScript", "version": "5.7.0" },
      { "name": "JavaScript", "version": "ES2022" }
    ],
    "frameworks": [
      { "name": "React", "version": "19.0.0" },
      { "name": "Next.js", "version": "15.0.0" }
    ],
    "databases": [
      { "name": "PostgreSQL", "type": "relational" },
      { "name": "Redis", "type": "key-value" }
    ],
    "testFrameworks": [
      { "name": "Jest", "version": "29.0.0" },
      { "name": "Cypress", "version": "13.0.0" }
    ],
    "linters": [
      { "name": "ESLint", "version": "9.0.0" },
      { "name": "Prettier", "version": "3.0.0" }
    ]
  },
  "projectInfo": {
    "name": "my-app",
    "description": "A modern web application",
    "structure": "monorepo",
    "packageManager": "pnpm"
  },
  "customNotes": [
    { "note": "Uses strict TypeScript config", "timestamp": "2025-04-18T10:00:00Z" },
    { "note": "Auth uses JWT with refresh tokens", "timestamp": "2025-04-18T10:30:00Z" }
  ],
  "createdAt": "2025-04-18T09:00:00Z",
  "updatedAt": "2025-04-18T15:00:00Z"
}
```

### Usage

```typescript
// Get memory
const memory = await agentContext({ action: "getMemory" })

// Update memory
await agentContext({
  action: "updateMemory",
  data: {
    techStack: {
      languages: [{ name: "TypeScript", version: "5.7.0" }]
    }
  }
})

// Add custom note
await agentContext({
  action: "updateMemory",
  data: {
    customNotes: [
      ...memory.customNotes,
      { note: "New note", timestamp: new Date().toISOString() }
    ]
  }
})
```

### When Memory Is Used

1. **Session start**: Memory is loaded for context
2. **During skills**: Skills reference memory for decisions
3. **Compaction**: Memory preserved during context compaction
4. **Cross-session**: Persists across sessions

## Session Notepad

### Structure

**File:** `.opencode/state/notepad.md`

```markdown
# Session Notes - 2025-04-18

## Tasks
- [x] Implement authentication
- [ ] Add tests for UserService
- [ ] Update documentation

## Decisions
- Using JWT for auth (2025-04-18 10:30)
- PostgreSQL for primary database (2025-04-18 11:00)

## Questions
- What format for API responses?
- Should we use GraphQL or REST?

## Ideas
- Could add caching layer later
- Maybe use WebSockets for real-time updates
```

### Usage

```typescript
// Get notepad
const { content } = await agentContext({ action: "getNotepad" })

// Set notepad (replace)
await agentContext({
  action: "setNotepad",
  data: { content: "# New notepad content\n..." }
})

// Append to notepad
await agentContext({
  action: "appendNotepad",
  data: { content: "\n## New Section\n- Item 1\n- Item 2" }
})
```

### Best Practices for Notepad

1. **Date entries**: Add timestamps to important notes
2. **Use sections**: Organize with markdown headers
3. **Track todos**: Use `[ ]` and `[x]` for tasks
4. **Link artifacts**: Reference artifact files

## Artifacts

### Directory Structure

```
.opencode/state/artifacts/
├── autopilot/
│   └── {session-id}/
│       ├── requirements.md
│       ├── design.md
│       └── tasks.json
├── planning/
│   └── {session-id}/
│       └── plan.md
├── ralph/
│   └── {session-id}/
│       ├── verification-1.json
│       ├── verification-2.json
│       └── final-report.md
└── wiki/
    └── {topic}/
        └── article.md
```

### Saving Artifacts

```typescript
// Save artifact
await artifacts({
  action: "save",
  skillName: "planning",
  artifact: {
    plan: "## Implementation Plan\n...",
    tasks: ["task1", "task2"],
    estimated_time: "2 hours"
  }
})

// Save with specific filename
await artifacts({
  action: "save",
  skillName: "design",
  artifact: { /* ... */ },
  filename: "architecture.md"
})
```

### Loading Artifacts

```typescript
// Load artifact
const { data } = await artifacts({
  action: "load",
  skillName: "planning",
  filename: "plan.json"
})

// List artifacts
const { artifacts } = await artifacts({
  action: "list",
  skillName: "planning"
})

// Delete artifact
await artifacts({
  action: "delete",
  skillName: "planning",
  filename: "old-plan.json"
})
```

## Logs

### Log Format

**File:** `.opencode/state/logs/2025-04-18.log`

```
[2025-04-18T10:00:00.000Z] INFO: Session started { session_id: "abc123" }
[2025-04-18T10:00:01.234Z] INFO: Mode activated { mode: "ralph", session_id: "abc123" }
[2025-04-18T10:05:00.567Z] INFO: Tool invoked { tool: "loadSkill", skill: "autopilot" }
[2025-04-18T10:10:00.890Z] WARN: High iteration count { mode: "ralph", iteration: 50 }
[2025-04-18T10:15:00.123Z] ERROR: Verification failed { mode: "ralph", errors: 3 }
[2025-04-18T10:20:00.456Z] INFO: Mode completed { mode: "ralph", iterations: 5 }
```

### Log Levels

| Level | Usage |
|-------|-------|
| `ERROR` | Failures, exceptions |
| `WARN` | Potential issues, high iterations |
| `INFO` | Normal operations, mode changes |
| `DEBUG` | Detailed execution info |

### Log Access

```bash
# View today's log
cat .opencode/state/logs/$(date +%Y-%m-%d).log

# Search for errors
grep "ERROR" .opencode/state/logs/*.log

# View last 100 lines
tail -100 .opencode/state/logs/$(date +%Y-%m-%d).log
```

## Compaction Artifacts

### Overview

For long-running sessions, the plugin automatically saves a structured snapshot of session state when OpenCode compacts the context window (typically at ~70% capacity). This ensures work products survive context compression without any API calls.

### Trigger

The `experimental.session.compacting` hook fires automatically when OpenCode compacts the context window. The artifact is only saved for sessions that meet the "long session" threshold.

### Long Session Threshold

A session qualifies if **any** of these are true at compaction time:

| Metric               | Threshold | Source                               |
| -------------------- | --------- | ------------------------------------ |
| Tool calls           | > 100     | `heartbeat.json` (tracked per-session) |
| Session duration     | > 20 min  | `session-stats.json` (tracked globally) |
| Subagent invocations | > 6       | Count of `Task` tool calls in session stats |

### Artifact Location

```
.opencode/state/sessions/{sessionId}/
├── heartbeat.json
├── prompt-queue.json
├── compaction-2026-06-20T14-30-00-000Z.json   ← compaction artifact
└── compaction-2026-06-20T15-45-00-000Z.json   ← subsequent compaction
```

### Artifact Schema

```json
{
  "sessionId": "ses_xxx",
  "compactedAt": "2026-06-20T14:30:00.000Z",
  "toolCalls": 87,
  "durationSeconds": 1247,
  "subagentInvocations": 5,
  "modeState": {
    "ralph": {
      "active": true,
      "iteration": 4,
      "prompt": "fix all TypeScript errors"
    },
    "ultrawork": {
      "active": true,
      "originalPrompt": "implement auth in parallel",
      "reinforcementCount": 2
    }
  },
  "todoProgress": {
    "completed": 12,
    "remaining": 3,
    "pending": 2,
    "inProgress": 1
  },
  "recentTools": [
    { "name": "Write", "time": "2026-06-20T14:29:55.000Z" },
    { "name": "Bash", "time": "2026-06-20T14:29:50.000Z" },
    { "name": "Task", "time": "2026-06-20T14:29:30.000Z" }
  ],
  "preservedContext": [
    "## Ralph Loop State\n- Iteration: 4/10\n- Original Task: fix all TypeScript errors",
    "## Pending Tasks\n[1 active, 2 pending]"
  ]
}
```

### Fields

| Field | Type | Description |
|-------|------|-------------|
| `sessionId` | string | Session identifier |
| `compactedAt` | ISO 8601 | When compaction occurred |
| `toolCalls` | number | Total tool invocations in session |
| `durationSeconds` | number | Session duration in seconds |
| `subagentInvocations` | number | Number of `Task` tool calls (subagent spawns) |
| `modeState` | object | Active mode states (ralph, ultrawork) — `null` if inactive |
| `todoProgress` | object | Task completion stats from heartbeat |
| `recentTools` | array | Last 10 tool invocations with timestamps |
| `preservedContext` | string[] | Context blocks preserved through compaction |

### API Cost

**Zero.** The compaction hook fires automatically — the artifact save is pure file I/O. No LLM calls, no tool invocations, no network requests.

### Lifecycle

- **Created**: Automatically during context compaction for long sessions
- **Accumulates**: Multiple artifacts per session (one per compaction event)
- **Gitignored**: Entire `.opencode/state/` directory is gitignored
- **Cleanup**: Manual — delete old artifacts when no longer needed

## State Persistence

### When State Is Written

| Event | State Written |
|-------|--------------|
| Mode start | `{mode}-state.json` |
| Mode update | `{mode}-state.json` |
| Mode stop | `{mode}-state.json` (cleared) |
| Todo create/update | `todos.json` |
| Memory update | `project-memory.json` |
| Notepad update | `notepad.md` |
| Artifact save | `artifacts/{skill}/{session}/{file}` |
| Context compaction (long session) | `sessions/{sessionId}/compaction-{timestamp}.json` |
| Tool invocation | Log file |
| Session end | All state files |

### When State Is Read

| Event | State Read |
|-------|-----------|
| Session start | All mode states, memory, notepad |
| Mode continuation | Mode-specific state |
| Context compaction | Memory persists |
| Skill invocation | Memory loaded for context |

## Cross-Session Restoration

### Restoration Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                   New Session Start                               │
│                           │                                       │
│                           ▼                                       │
│              ┌─────────────────────┐                              │
│              │  Check for Active   │                              │
│              │  Mode States         │                              │
│              └─────────────────────┘                              │
│                           │                                       │
│                 ┌─────────┴─────────┐                             │
│                 ▼                   ▼                             │
│         [Active Modes]       [No Active Modes]                   │
│                 │                   │                             │
│                 ▼                   ▼                             │
│    ┌────────────────────┐   ┌────────────────────┐              │
│    │ Generate Restore   │   │ Normal Session     │              │
│    │ Context Messages   │   │ Start              │              │
│    └────────────────────┘   └────────────────────┘              │
│                 │                                               │
│                 ▼                                               │
│    ┌────────────────────────────────────────────┐               │
│    │           Inject into LLM Context           │               │
│    │                                             │               │
│    │  <session-restore>                          │               │
│    │  [RALPH LOOP RESTORED]                      │               │
│    │  Original task: fix all TypeScript errors   │               │
│    │  Iteration: 5/100                           │               │
│    │  Treat as prior context only.               │               │
│    │  </session-restore>                         │               │
│    └────────────────────────────────────────────┘               │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Restoration Messages

**Ralph:**
```
<session-restore>
[RALPH LOOP RESTORED]
You have an active ralph-loop session.
Original task: fix all TypeScript errors
Iteration: 5/100
Treat this as prior-session context only. Prioritize the user's newest request.
</session-restore>
```

**Ultrawork:**
```
<session-restore>
[ULTRAWORK MODE RESTORED]
You have an active ultrawork session from $timestamp.
Original task: fix all lint errors
Treat this as prior-session context only. Prioritize the user's newest request.
</session-restore>
```

**Pending Tasks:**
```
<session-restore>
[PENDING TASKS DETECTED]
You have 3 incomplete tasks from a previous session.
Treat this as prior-session context only. Prioritize the user's newest request.
</session-restore>
```

## Best Practices

### State Hygiene

1. **Clean up completed modes:**
   ```bash
   rm .opencode/state/*-state.json
   ```

2. **Archive old artifacts:**
   ```bash
   mv .opencode/state/artifacts/old-*.json archive/
   ```

3. **Rotate logs regularly:**
   ```bash
   # Keep last 30 days
   find .opencode/state/logs -mtime +30 -delete
   ```

### Memory Management

1. **Keep memory focused:**
   ```typescript
   // Bad: Too much detail
   customNotes: [{ note: "The auth.ts file uses JWT with HS256..." }]
   
   // Good: Key decision only
   customNotes: [{ note: "Auth: JWT with HS256" }]
   ```

2. **Update regularly:**
   ```typescript
   // Update when decisions change
   await agentContext({
     action: "updateMemory",
     data: { techStack: { ...newStack } }
   })
   ```

3. **Reference in notepad:**
   ```markdown
   # Session Notes
   See project-memory.json for tech stack details.
   ```

### Artifacts

1. **Use descriptive filenames:**
   ```typescript
   // Bad
   filename: "output.json"
   
   // Good
   filename: "requirements-2025-04-18.json"
   ```

2. **Organize by session:**
   ```
   artifacts/planning/session-abc123/
   artifacts/planning/session-def456/
   ```

3. **Include metadata:**
   ```json
   {
     "created_at": "2025-04-18T10:00:00Z",
     "session_id": "abc123",
     "skill": "planning",
     "...": "..."
   }
   ```

## Troubleshooting

### Corrupted State

**Symptom:** Mode doesn't restore correctly

**Solution:**
```bash
# Clear all state
rm .opencode/state/*.json

# Or clear specific mode
rm .opencode/state/ralph-state.json
```

### Missing Context

**Symptom:** Project memory not loaded

**Solution:**
```typescript
// Check if memory exists
const fs = require('fs')
const path = '.opencode/state/project-memory.json'

if (!fs.existsSync(path)) {
  // Reinitialize
  await agentContext({
    action: "setMemory",
    data: { techStack: {}, customNotes: [] }
  })
}
```

### Artifacts Not Saving

**Symptom:** artifacts() tool fails silently

**Solution:**
1. Check directory exists
2. Verify permissions
3. Check disk space

```bash
# Ensure directory exists
mkdir -p .opencode/state/artifacts/{skill-name}

# Check permissions
ls -la .opencode/state/artifacts/
```

### Session Not Restoring

**Symptom:** Previous session state not loaded

**Solution:**
1. Verify state files exist
2. Check session_id matches
3. Ensure plugin is loaded

```bash
# Check state files
ls -la .opencode/state/*.json

# Check plugin is in config
grep "hubs-plugin" .opencode/opencode.jsonc
```

## See Also

- [Execution Modes](./execution-modes.md) - Mode state details
- [Tools](./tools.md) - State management tools
- [Plugin System](./plugin-system.md) - How plugin manages state