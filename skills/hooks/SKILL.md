---
name: hooks
description: Hook Development Rules
level: 2
license: MIT
user-invocable: false
---

# Hook Development Rules

When working with files in `.claude/hooks/`:

## Pattern
Shell wrapper (.sh) → TypeScript (.ts) via `npx tsx`

## Shell Wrapper Template
```bash
#!/bin/bash
set -e
cd "$CLAUDE_PROJECT_DIR/.claude/hooks"
cat | npx tsx <handler>.ts
```

## TypeScript Handler Pattern
```typescript
interface HookInput {
  // Event-specific fields — see `hook-developer` for the field list per event
}

async function main() {
  const input: HookInput = JSON.parse(await readStdin());

  // Process input

  // Real output shape (there is no generic result/message pair — it's
  // per-event; this is the PreToolUse/UserPromptSubmit shape):
  const output = {
    hookSpecificOutput: {
      hookEventName: "PreToolUse",
      permissionDecision: "allow", // or "deny" / "ask"
      additionalContext: "Optional context for Claude",
    },
  };

  console.log(JSON.stringify(output));
}
```
A plain executable script (shebang + execute bit) needs no shell wrapper at all — `type: "command"` can point straight at it. See `~/.config/opencode/claude/hooks/*.mjs` for two working examples.

## Hook Events
The full set is ~28 events (see `hook-developer` skill for the complete reference, refreshed 2026-09-27). The ones you'll reach for most:
- **PreToolUse** - Before tool execution (can block)
- **PostToolUse** - After tool execution (can only add context, NOT block — use `tool_response`, not `tool_result`)
- **UserPromptSubmit** - Before processing user prompt (can block)
- **PreCompact** / **PostCompact** - Before / after context compaction
- **SessionStart** / **SessionEnd** - On session start/resume/compact / on session end
- **Stop** / **SubagentStop** - When agent/subagent finishes (can block — check `stop_hook_active` to avoid looping)

## Testing
Test hooks manually:
```bash
echo '{"type": "resume"}' | .claude/hooks/session-start-continuity.sh
```

## Registration
Add hooks to `.claude/settings.json`:
```json
{
  "hooks": {
    "EventName": [{
      "matcher": ["pattern"],  // Optional
      "hooks": [{
        "type": "command",
        "command": "$CLAUDE_PROJECT_DIR/.claude/hooks/hook.sh"
      }]
    }]
  }
}
```
