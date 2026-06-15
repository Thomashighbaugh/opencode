# Smart Prompt Queue — Non-Interrupting User Prompt Sequencing

> Complements stall detection by queuing user-submitted prompts when the LLM is busy, then auto-submitting them when the current task completes — without generating synthetic "continue" prompts.

## The Problem

When the LLM is actively working (running tool calls, advancing todos, processing a pipeline), any prompt the user types is submitted immediately. This creates two problems:

1. **Interruption**: A new prompt interrupts the current task mid-stream, forcing the LLM to context-switch. The original task may be left incomplete or produce garbage as it tries to handle two requests at once.

2. **Lost prompts**: If the user types multiple prompts while waiting for a long task, only the last one is processed — the rest are lost.

The "dumb continue" plugin tried to solve the stall problem by sending synthetic prompts, but that's the opposite problem: generating prompts when none were given. This queue solves the real problem: **preserving user intent across task boundaries**.

## Design

### What Gets Queued

Only **substantive user prompts** are queued. The following are **NOT** queued:

- `"..."` — handled by stall detection
- `"continue"`, `"go on"`, `"proceed"` — continuation signals
- Empty/whitespace-only input
- Magic keywords (ralph, autopilot, etc.) — these activate modes immediately

### When Queuing Happens

A prompt is queued when **all** of these are true:

1. The user typed a substantive prompt (not a continuation signal)
2. The LLM is currently busy (heartbeat shows tool calls within the last 15-60s)
3. The prompt is not a magic keyword that should activate immediately

### When Dequeuing Happens

A queued prompt is auto-submitted when **all** of these are true:

1. The current task is complete (no tool calls in 120s+ AND all todos done)
2. There are queued prompts waiting
3. No previously submitted prompt is still pending
4. The queue is not paused

### Queue Persistence

The queue is stored in `.opencode/state/sessions/{session-id}/prompt-queue.json`:

```json
{
  "items": [
    {
      "id": "q-1718383200000-a1b2c3",
      "text": "add error handling to the payment service",
      "timestamp": "2026-06-14T16:00:00.000Z",
      "status": "completed"
    },
    {
      "id": "q-1718383300000-d4e5f6",
      "text": "then write tests for it",
      "timestamp": "2026-06-14T16:01:40.000Z",
      "status": "queued"
    }
  ],
  "lastSubmittedId": "q-1718383200000-a1b2c3",
  "lastSubmittedAt": "2026-06-14T16:00:05.000Z",
  "paused": false
}
```

### Queue States

| State | Meaning | Behavior |
|-------|---------|----------|
| `queued` | Waiting for current task to complete | Not submitted to LLM |
| `submitted` | Sent to LLM, awaiting response | Blocks next dequeue |
| `completed` | LLM finished processing this prompt | Archived, not re-submitted |
| `failed` | Error during submission | Logged, next prompt dequeued |

### Integration with Stall Detection

The queue and stall detection work as complementary systems:

| Situation | Stall Detection | Prompt Queue |
|-----------|----------------|--------------|
| LLM actively working | Silent | Queues user prompts |
| LLM stalled (no progress) | Sends nudge | Does nothing (no queued prompts to submit) |
| Task completed | Sends completion signal | Dequeues next prompt |
| Network reset | Detects orphaned state | Preserves queue across sessions |
| User types "..." | Sends continuation nudge | Does not queue (not substantive) |

## Plugin Integration

### Hook: `tui.prompt.append`

When a user types a prompt:
1. Check if it's a continuation signal → skip queue, let stall detection handle
2. Check if LLM is busy → if yes, enqueue and return (don't process further)
3. If LLM is not busy → process normally (keyword detection, mode activation, etc.)

### Hook: `tool.execute.after`

After every tool call:
1. Record heartbeat (existing stall detection)
2. Check if task is complete → if yes, mark current submitted item as completed
3. Try to dequeue next prompt → if found, inject queue context into system transform
4. Log the auto-submission

### Hook: `experimental.chat.system.transform`

Before every LLM turn:
1. Consume queued context messages (existing)
2. If there are queued prompts, inject `<prompt-queue>` context block
3. This tells the LLM: "There are N more prompts waiting after this one"

### Hook: `experimental.session.compacting`

During context compression:
1. Preserve queue state (queued count, current submitted item)
2. This prevents the queue from being forgotten during long sessions

## User Experience

### Scenario: User types 3 prompts during a long build

```
User: "fix the type error in payment.ts"           → Queued (LLM is building)
User: "then add input validation"                   → Queued (2 waiting)
User: "and write tests for the validation"          → Queued (3 waiting)

[Build completes, tests pass]
→ "fix the type error in payment.ts" auto-submitted

[Type error fixed, tests pass]
→ "then add input validation" auto-submitted

[Validation added, tests pass]
→ "and write tests for the validation" auto-submitted
```

### Scenario: User types during idle

```
User: "add error handling to payment service"      → Submitted immediately (LLM idle)
```

### Scenario: User types "..." during a stall

```
User: "..."                                         → Not queued (continuation signal)
                                                     → Stall detection handles it
```

## Commands

| Command | Effect |
|---------|--------|
| `/queue status` | Show queue state: N queued, M completed, paused status |
| `/queue pause` | Pause auto-submission (prompts stay queued) |
| `/queue resume` | Resume auto-submission |
| `/queue clear` | Remove all queued prompts |
| `/queue flush` | Submit all queued prompts immediately |

## File Location

This document: `.opencode/context/frameworks/smart-prompt-queue.md`