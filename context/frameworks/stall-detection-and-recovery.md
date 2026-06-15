# Stall Detection and Graceful Recovery

> Smart heartbeat-based stall detection that distinguishes between "actively working" and "stalled" without spamming subagents or the TUI.

## The Problem

The current "continue" plugin has three failure modes:

1. **Blind repetition**: It sends continuation nudges at fixed intervals (every tool call, every chat message) regardless of whether the subagent is actively making progress. This is like tapping someone on the shoulder every 5 seconds while they're already working.

2. **Subagent noise**: When subagents are running pipelines (ralph loops, ultrawork parallel lanes, team orchestration), redundant context messages are queued into their context window, consuming tokens and potentially slowing their progress by forcing them to process irrelevant nudges.

3. **No stall discrimination**: The system cannot tell the difference between:
   - **Actively working** — tool calls are happening, todos are advancing, output is flowing
   - **Slow but alive** — one long-running tool call (e.g., a 60-second build, a complex search)
   - **Stalled** — no tool calls in N seconds, agent is stuck in a reasoning loop or waiting for input
   - **Dead** — network reset, process killed, session disconnected

## Design Principles

1. **Don't interrupt working agents.** If tool calls are happening and todos are advancing, say nothing.
2. **Detect stalls by heartbeat, not interval.** Check the last tool call timestamp against a sliding window.
3. **Graceful recovery, not spam.** Send a single, minimal resume message with the last known state — not a "continue!" barrage.
4. **Session continuity across resets.** If a session dies and restarts, detect the orphaned state and offer clean resume or cancel.
5. **Silence when uncertain.** If we can't tell whether the agent is stalled or just slow, wait longer rather than nudge.

## Architecture

### 1. Tool Call Heartbeat Log

Every tool call (via `tool.execute.after`) records a heartbeat entry:

```
.opencode/state/sessions/{session-id}/heartbeat.json
```

Format:
```json
{
  "lastToolCall": "2026-06-14T14:30:00.000Z",
  "lastToolName": "Bash",
  "lastOutputTruncated": "Running build...",
  "toolCount": 47,
  "recentTools": [
    {"name": "Bash", "time": "2026-06-14T14:29:55.000Z"},
    {"name": "Read", "time": "2026-06-14T14:29:50.000Z"},
    {"name": "Edit", "time": "2026-06-14T14:29:45.000Z"}
  ],
  "todoProgress": {
    "lastChange": "2026-06-14T14:29:00.000Z",
    "completed": 5,
    "remaining": 2
  }
}
```

### 2. Stall Classification Algorithm

```
Input: heartbeat log + current time
Output: STALL_STATUS enum

function classifyStall(heartbeat, now):
    elapsed = now - heartbeat.lastToolCall

    if elapsed < STALL_THRESHOLD_ACTIVE (15s):
        return ACTIVE
    if elapsed < STALL_THRESHOLD_SLOW (60s):
        return SLOW_POSSIBLE     // long-running tool, wait
    if elapsed < STALL_THRESHOLD_WARN (120s):
        if todoProgress has changed recently:
            return SLOW_POSSIBLE  // todos advancing, agent is working
        else:
            return STALLED_SOFT   // no progress, may be stuck

    // Beyond 120s with zero tool calls
    if session was interrupted (process restart detected):
        return SESSION_RESET
    if network is back after disconnection:
        return NETWORK_RECOVERY
    else:
        return STALLED_HARD
```

### 3. Response Strategy

| Stall Status | Action | Message |
|---|---|---|
| `ACTIVE` | Do nothing | — |
| `SLOW_POSSIBLE` | Do nothing (extend wait) | — |
| `STALLED_SOFT` | Single gentle nudge via context | Brief: "Last tool call was X ago. Are you stuck on something?" |
| `STALLED_HARD` | Stronger nudge + state summary | "No activity in 120s. Last state: [todos]. Resume or cancel?" |
| `SESSION_RESET` | Session restore with full state | Full state recovery — todos, checkpoint, last context |
| `NETWORK_RECOVERY` | Detect + resume without spamming | "Network reconnected. Progress preserved. Continue where you left off." |

### 4. Anti-Spam Safeguards

- **Minimum interval between nudges**: 60 seconds (STALLED_SOFT only), 30 seconds (STALLED_HARD only)
- **Maximum nudges per stall period**: 1 soft + 1 hard, then offer cancel
- **Nudge cooldown**: After any nudge, wait STALL_COOLDOWN (90s) before detecting again
- **Silent during known long ops**: If `lastToolName` is `Bash` and the command looks long (build, test, deploy), extend thresholds

### 5. Recovery Mechanics

#### Session Reset Recovery
When a session restarts and finds orphaned mode state (active=true, but no recent heartbeats):

1. Scan `.opencode/state/sessions/` for orphaned state files
2. If found, inject a single `<session-recovery>` context block:
   ```xml
   <session-recovery>
     Previous session was interrupted at YYYY-MM-DD HH:MM.
     Last state: [todos summary]
     Original task: [prompt]
     Action: Resume from last checkpoint, or start fresh.
   </session-recovery>
   ```
3. Offer `/orchestrate resume` if a checkpoint exists
4. Do NOT auto-restart the mode — let the user or orchestrator decide

#### Network Reset Recovery
When tool.execute.before fires after a long gap (>120s):
1. Check if heartbeats show an abrupt stop (no gradual slowdown)
2. If yes → network/interruption detected
3. Inject minimal resume context:
   ```xml
   <connection-restored>
     Connection was interrupted. Progress up to the last tool call is preserved.
     Continue from where you left off.
   </connection-restored>
   ```
4. Do NOT re-queue old context messages — they're already in the LLM context

### 6. Threshold Configuration

Stored in `.opencode/state/stall-config.json`:

```json
{
  "activeThreshold": 15000,
  "slowThreshold": 60000,
  "warnThreshold": 120000,
  "hardThreshold": 300000,
  "nudgeCooldown": 90000,
  "knownLongOps": ["build", "test", "deploy", "install", "compile"],
  "maxSoftNudges": 1,
  "maxHardNudgesPerSession": 3
}
```

All values in milliseconds. Tune for environment (faster for local models, slower for cloud APIs).

## Plugin Integration

### New Hooks

The stall detection system hooks into two existing plugin points:

#### `tool.execute.after` — Heartbeat Recording
```typescript
hooks["tool.execute.after"] = async (input, output) => {
  // ... existing stat tracking ...
  
  // NEW: Record heartbeat
  recordHeartbeat(sessionId, toolName, output, directory)
  
  // NEW: Check for stalled agent (only on periodic basis, not every call)
  if (shouldCheckStall(sessionId, directory)) {
    const status = classifyStall(getHeartbeat(sessionId, directory))
    if (status === STALLED_SOFT || status === STALLED_HARD) {
      const nudge = generateStallNudge(status, sessionId, directory)
      if (nudge) queueContextMessage(sessionId, nudge)
    }
  }
}
```

#### `session.created` — Session Recovery
```typescript
hooks["event"] = async ({ event }) => {
  case 'session.created': {
    // ... existing restore logic ...
    
    // NEW: Check for orphaned mode state
    const orphaned = detectOrphanedModes(directory, sessionId)
    if (orphaned.length > 0) {
      // Inject recovery context, don't auto-restart
      queueContextMessage(sessionId, generateRecoveryContext(orphaned))
    }
  }
}
```

### No New Hooks Required

The stall detection does not require new plugin hooks. It uses existing hooks more intelligently — recording on `tool.execute.after` and checking on `tool.execute.before`.

## Comparison: Dumb vs Smart

| Aspect | Dumb Continue Plugin | Smart Stall Detection |
|--------|---------------------|----------------------|
| **Trigger** | Every tool call + every chat message | Only when stall is detected |
| **Stall detection** | None (always sends) | Heartbeat-based classification |
| **Spamming** | Injects context on every turn | Max 1 soft + 1 hard nudge per stall period |
| **Subagent impact** | Consumes context tokens unnecessarily | Only nudges when stalled |
| **Network recovery** | None | Detects abrupt stops and recovers gracefully |
| **Session restore** | Duplicate mode messages | Single recovery context block |
| **Configurability** | None | Tunable thresholds |

## Implementation Plan

### Phase 1: Heartbeat Recording (in `tool.execute.after`)
- Add `recordHeartbeat()` function
- Store heartbeat in `.opencode/state/sessions/{id}/heartbeat.json`
- Track: last tool call time, recent tools (last 5), todo progress

### Phase 2: Stall Classification (in `tool.execute.before`, periodic)
- Add `classifyStall()` with the 5-tier classification
- Add `shouldCheckStall()` to gate checking to every N calls or every M seconds
- Nudge cooldown to prevent spam

### Phase 3: Recovery (in `session.created`)
- Add `detectOrphanedModes()` — look for mode state files with `active: true` but no recent heartbeat
- Add `generateRecoveryContext()` — minimal, single-block recovery message
- Do NOT auto-restart modes — let orchestrator decide

### Phase 4: Network Reset Detection
- Detect abrupt stop patterns in heartbeat log
- Generate minimal connection-restored context
- Test with actual network disconnection scenarios

## Relationship to Existing Modes

| Mode | Current Behavior | Smart Behavior |
|------|-----------------|----------------|
| **ralph** | Continuation message on every chat turn | Only nudge if no tool calls in 120s |
| **ultrawork** | Reinforcement count increments, message on every turn | Silent while parallel lanes are producing output |
| **autopilot** | Same pattern as ultrawork | Silent while tool calls are happening |
| **team** | No specific stall detection | Detects if team workers stalled independently |
| **idle (no mode)** | Spammy pre/post tool reminders | Silent unless STALLED_HARD |

## File Location

This document: `.opencode/context/frameworks/stall-detection-and-recovery.md`