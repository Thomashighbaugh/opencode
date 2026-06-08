# OpenCode Plugin Templates

## Minimal Hook Plugin Template

```typescript
/**
 * opencode-my-plugin.ts — My OpenCode Plugin
 * 
 * @module my-plugin
 */

import type { Plugin, Hooks } from "@opencode-ai/plugin"

const plugin: Plugin = {
  async setup(client, { directory }) {
    const hooks: Hooks = {}

    // ─── Session Lifecycle ──────────────────────────────────────────
    
    hooks["session.created"] = async (input, _output) => {
      const sessionId = input.sessionID
      // Initialize per-session state
    }

    hooks["session.deleted"] = async (input, _output) => {
      const sessionId = input.sessionID
      // Cleanup per-session state
    }

    // ─── Tool Lifecycle ─────────────────────────────────────────────
    
    hooks["tool.execute.before"] = async (input, _output) => {
      const toolName = input.tool || 'unknown'
      // Called before every tool call
    }

    hooks["tool.execute.after"] = async (input, _output) => {
      const toolName = input.tool || 'unknown'
      // Called after every tool call
    }

    // ─── Chat Messages ──────────────────────────────────────────────
    
    hooks["chat.message"] = async (input, _output) => {
      const sessionId = input.sessionID
      // Called on each user message
    }

    // ─── Permission Auto-Approval ───────────────────────────────────
    
    hooks["permission.ask"] = async (input, output) => {
      // Auto-approve safe commands
      // Set output.status = 'allow' to auto-approve
      // Set output.status = 'deny' to block
      // Leave unset to prompt user
    }

    // ─── Context Preservation on Compaction ─────────────────────────
    
    hooks["experimental.session.compacting"] = async (_input, output) => {
      output.context.push(`## My Plugin State\n- Key info that survives compaction\n`)
    }

    // ─── System Context Injection ───────────────────────────────────
    
    hooks["experimental.chat.system.transform"] = async (input, output) => {
      const sessionId = input.sessionID
      // Inject context into every system prompt turn
      output.system.push(`<my-plugin-context>\nCurrent status: ...\n</my-plugin-context>`)
    }

    // ─── Command Hooks ──────────────────────────────────────────────
    
    hooks["command.execute.before"] = async (input, _output) => {
      const command = input.command
      // Intercept /command execution
    }

    return hooks
  }
}

export default plugin
```

## Stateful Plugin with Context Injection

```typescript
/**
 * opencode-todo-plugin.ts — Injects todo list into system context
 */
import type { Plugin, Hooks } from "@opencode-ai/plugin"
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs"
import { join, dirname } from "path"

interface TodoPluginState {
  todos: Array<{ content: string; status: 'pending' | 'done' }>
  session_id?: string
}

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

const plugin: Plugin = {
  async setup(_client, { directory }) {
    const hooks: Hooks = {}

    hooks["chat.message"] = async (input) => {
      const sessionId = input.sessionID
      if (!sessionId) return

      const statePath = join(directory, '.opencode', 'state', 'sessions', sessionId, 'todo-plugin-state.json')
      let state: TodoPluginState = { todos: [] }

      if (existsSync(statePath)) {
        try { state = JSON.parse(readFileSync(statePath, 'utf-8')) } catch {}
      }

      if (state.todos.length > 0) {
        const todoText = state.todos
          .map(t => `- [${t.status === 'done' ? 'x' : ' '}] ${t.content}`)
          .join('\n')
        queueContextMessage(sessionId, `<todo-plugin>\nPending Tasks:\n${todoText}\n</todo-plugin>`)
      }
    }

    hooks["experimental.chat.system.transform"] = async (input, output) => {
      const sessionId = input.sessionID
      if (!sessionId) return
      const messages = consumeContextMessages(sessionId)
      if (messages.length > 0) output.system.push(messages.join('\n\n'))
    }

    return hooks
  }
}

export default plugin
```

## TUI Plugin Component Template

```tsx
// src/my-hub.tsx — Custom TUI dialog component
import { DialogSelect } from "@opencode-ai/tui-components"

interface HubOption {
  label: string
  description: string
  onSelect: () => void
}

export function MyHubDialog({ options, onClose }: {
  options: HubOption[]
  onClose: () => void
}) {
  return (
    <DialogSelect
      options={options.map(opt => ({
        label: opt.label,
        description: opt.description,
        action: () => {
          opt.onSelect()
          onClose()
        }
      }))}
      onClose={onClose}
    />
  )
}
```

## Plugin Registration Config

```jsonc
// In opencode.jsonc:
{
  "plugin": [
    // Local TypeScript file (recommended for project-specific plugins)
    "./plugins/my-plugin.ts",
    
    // npm package
    "@npm-user/opencode-plugin-name@1.0.0",
    
    // npm package with latest
    "@npm-user/opencode-plugin-name@latest",
    
    // Local TUI plugin (compiled JS)
    "./plugins/my-tui/index.js"
  ]
}
```

## Common Patterns Reference

| Pattern | Hook | When to Use |
|---------|------|-------------|
| Auto-approve bash commands | `permission.ask` | Safe read-only commands |
| State preservation on compact | `experimental.session.compacting` | Any state that must survive compaction |
| Per-turn system injection | `experimental.chat.system.transform` | Status updates, reminders, context |
| Chat message injection | `chat.message` + `queueContextMessage()` | Async info that needs injection next turn |
| Tool call monitoring | `tool.execute.before` / `.after` | Usage tracking, logging |
| Magic keyword detection | `chat.message` or `tui.prompt.append` | Mode activation, feature flags |
| Command interception | `command.execute.before` / `.after` | Custom /commands, workflow hooks |

## File Organization

```
plugins/
├── my-plugin.ts          # Main hook plugin (TS)
├── my-plugin/
│   ├── index.ts          # Plugin entry
│   ├── state.ts          # State management
│   ├── hooks/            # Hook implementations
│   │   ├── session.ts
│   │   ├── tools.ts
│   │   └── permissions.ts
│   └── utils/            # Utilities
│       ├── context.ts    # Context injection helpers
│       └── state.ts      # State file helpers
└── my-tui/
    ├── package.json
    ├── src/
    │   ├── index.tsx     # Plugin entry (TSX for TUI)
    │   └── components/   # UI components
    └── dist/
        └── index.js      # Compiled output
```
