---
name: opencode-plugin-creator
description: Guide for creating OpenCode plugins — hook plugins (.ts), npm plugins, and TUI plugins (.tsx). Use when building, updating, or packaging OpenCode plugins.
level: 3
license: MIT
---

# OpenCode Plugin Creator

Guide for creating OpenCode plugins. Covers three plugin types:

1. **Hook plugins** — TypeScript `.ts` files that register lifecycle hooks
2. **NPM plugins** — Published packages consumed via `opencode.jsonc`
3. **TUI plugins** — TSX terminal UI components with dialogs

## When to Use

- User asks "create a plugin for OpenCode"
- User asks "add a hook for X" (permission auto-approval, state persistence, magic keywords)
- User asks "build a TUI dialog for my hub"
- User says "I want to intercept [tool|command|session|compact] events"
- User wants to publish a plugin to npm

## Workflow

### Step 1: Identify the Hook Points

Ask the user: "What behavior are you trying to add?"

| If they want to... | Use hook(s) |
|-------------------|-------------|
| Auto-approve safe bash commands | `permission.ask` |
| Persist state across compaction | `experimental.session.compacting` |
| Inject context every turn | `experimental.chat.system.transform` |
| Detect magic keywords in chat | `chat.message` or `tui.prompt.append` |
| Track tool usage | `tool.execute.before` / `.after` |
| Intercept custom commands | `command.execute.before` / `.after` |
| Add TUI dialog menus | TUI plugin with DialogSelect |
| Run on session start/end | `session.created` / `.deleted` |
| Modify tool arguments before execution | `tool.execute.before` (mutate input) |

### Step 2: Determine Plugin Type

| Type | Location | Registration | Best For |
|------|----------|-------------|----------|
| **Hook plugin** (.ts) | `plugins/my-plugin.ts` | `"./plugins/my-plugin.ts"` | Internal hooks, project-specific behavior |
| **NPM plugin** | `node_modules/` | `"@scope/package@version"` | Reusable, published behavior |
| **TUI plugin** (.tsx) | `plugins/my-tui/` | `"./plugins/my-tui/index.js"` | Visual dialogs and menus |

### Step 3: Scaffold

Use the templates in `references/templates.md` to scaffold:

```bash
# Hook plugin (single file)
touch plugins/my-plugin.ts
# Paste the Minimal Hook Plugin Template

# TUI plugin (project)
mkdir -p plugins/my-tui/src plugins/my-tui/dist
# Create package.json, src/index.tsx, build config
```

### Step 4: Implement Hooks

Each hook follows this pattern:

```typescript
hooks["hook.name"] = async (input, output) => {
  // input contains event data
  // output allows modification of behavior
  
  // For context injection: use queueContextMessage() + experimental.chat.system.transform
  // For state: use readJsonFile()/writeJsonFile() in .opencode/state/sessions/<id>/
  // For permissions: set output.status = 'allow' | 'deny'
  // For compaction: push to output.context[]
  // For system: push to output.system[]
}
```

### Step 5: Register

Add the plugin to `opencode.jsonc`:

```jsonc
{
  "plugin": [
    "./plugins/my-plugin.ts",
  ]
}
```

### Step 6: Test

```bash
# Check plugin loads
btw_status

# Run hub doctor for diagnostics
/hubs-doctor

# Verify hooks fire by observing behavior
```

## The Two Context Injection Patterns

OpenCode has two independent mechanisms for injecting context:

### Pattern A: Per-Turn System Injection (`experimental.chat.system.transform`)

```typescript
const _contextMessages: Record<string, string[]> = {}

function queueContextMessage(sessionId: string, message: string) {
  if (!_contextMessages[sessionId]) _contextMessages[sessionId] = []
  _contextMessages[sessionId].push(message)
}

function consumeContextMessages(sessionId: string): string[] {
  const messages = _contextMessages[sessionId] || []
  delete _contextMessages[sessionId]
  return messages
}

hooks["experimental.chat.system.transform"] = async (input, output) => {
  const sessionId = input.sessionID
  if (!sessionId) return
  const messages = consumeContextMessages(sessionId)
  if (messages.length === 0) return
  // Wrapped in XML tags for clean parsing
  output.system.push(`<my-plugin>\n${messages.join('\n\n')}\n</my-plugin>`)
}
```

**Key detail:** Messages queued via `queueContextMessage()` are injected into the *system prompt* on every turn. They persist until consumed. Use this for: mode reminders, state summaries, todo lists.

### Pattern B: Compaction Preservation (`experimental.session.compacting`)

```typescript
hooks["experimental.session.compacting"] = async (_input, output) => {
  // Push plain markdown — survives context window compression
  output.context.push(`## My Plugin State
- Active: true
- Started: ${startedAt}
- Items processed: ${count}
`)
}
```

**Key detail:** `output.context` is markdown injected during context window compression events. It survives compaction and ensures the agent remembers plugin state after the window is compressed.

## State File Architecture

State files live in `.opencode/state/` (gitignored):

```
.opencode/state/
├── my-plugin-state.json              # Session-independent state
└── sessions/<sessionId>/
    └── my-plugin-state.json          # Per-session state (auto-cleaned)
```

Use per-session state by passing `sessionId` to the file path. Use global state for cross-session data.

## Permission Auto-Approval Pattern

```typescript
hooks["permission.ask"] = async (input, output) => {
  if (input.type !== 'bash') return

  const command = typeof input.pattern === 'string' ? input.pattern : ''
  
  // Define safe command patterns
  const safePatterns = [
    /^git (status|diff|log|branch|show|fetch)/,
    /^npm (test|run (test|lint|build|check))/,
    /^ls( |$)/,
    /^node --check/,
  ]
  
  const isSafe = safePatterns.some(p => p.test(command.trim()))
  const hasDangerousChars = /[;&|`$()<>\n\r\t\0\\]/.test(command)
  
  if (isSafe && !hasDangerousChars) {
    output.status = 'allow'
  }
  // Leave unset = prompt user (default)
}
```

## TUI Plugin Entry Point

```tsx
// plugins/<name>/src/index.tsx
import { Plugin } from "@opencode-ai/tui-sdk"

export default {
  async setup(client) {
    client.registerDialog("my-command", {
      render: ({ onClose }) => (
        <MyHubDialog options={[...]} onClose={onClose} />
      )
    })
  }
}
```

Build with `bun run build` (configured in `package.json`). Register compiled `.js` in `opencode.jsonc`.

## References

- `references/hook-api.md` — Complete hook API reference and patterns
- `references/templates.md` — Ready-to-use templates for hook, stateful, and TUI plugins

## See Also

- Existing plugins in `~/.config/opencode/plugins/` for reference
- `plugins/hubs-plugin.ts` — Full-featured hook plugin example
- `plugins/hubs-tui/` — Full TUI plugin example
- `opencode.jsonc` — Plugin registration config
