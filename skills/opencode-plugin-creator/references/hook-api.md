# OpenCode Plugin TypeScript Hook Reference

Based on the existing `hubs-plugin.ts` at `~/.config/opencode/plugins/hubs-plugin.ts`.

## Plugin Structure

```typescript
import type { Plugin, Hooks } from "@opencode-ai/plugin"
import type { Event } from "@opencode-ai/sdk"
import { existsSync, mkdirSync, readFileSync, writeFileSync, readdirSync } from "fs"
import { join, dirname } from "path"
import { homedir } from "os"

const USER_CONFIG_DIR = process.env.OPENCODE_CONFIG_DIR || join(homedir(), '.config', 'opencode')

const plugin: Plugin = {
  async setup(client, { directory }) {
    const hooks: Hooks = {}

    // Register hooks here...

    return hooks
  }
}

export default plugin
```

## Available Hooks

### `session.created`
```typescript
hooks["session.created"] = async (input, output) => {
  // input: { sessionID, config }
  // Called when a session is created
}
```

### `session.deleted`
```typescript
hooks["session.deleted"] = async (input, output) => {
  // input: { sessionID }
  // Opportunity to clean up session state
}
```

### `chat.message`
```typescript
hooks["chat.message"] = async (input, output) => {
  // input: { sessionID, message }
  // Called on each chat message. Use queueContextMessage() to inject context.
}
```

### `tool.execute.before`
```typescript
hooks["tool.execute.before"] = async (input, output) => {
  // input: { tool, args, sessionID }
  // Called before any tool execution. Can modify args via input.
  // Access args: output.args as Record<string, unknown>
  // Access tool name: input.tool
}
```

### `tool.execute.after`
```typescript
hooks["tool.execute.after"] = async (input, output) => {
  // input: { tool, args, sessionID }
  // output: { output: string }
  // Called after tool execution. Output available in output.output.
}
```

### `permission.ask`
```typescript
hooks["permission.ask"] = async (input, output) => {
  // input: { type: string, pattern?: string, sessionID }
  // type: 'bash', 'write', etc.
  // pattern: the bash command or file pattern
  // Set output.status = 'allow' to auto-approve
  // Set output.status = 'deny' to block
  // Default (no set) = prompt user
}
```

### `experimental.session.compacting`
```typescript
hooks["experimental.session.compacting"] = async (input, output) => {
  // Called when context window is being compacted
  // Push preservation context: output.context.push("## Title\ncontent\n")
  // This context survives compaction and is re-injected
}
```

### `experimental.chat.system.transform`
```typescript
hooks["experimental.chat.system.transform"] = async (input, output) => {
  // input: { sessionID }
  // output: { system: string[] }
  // Push system-level context: output.system.push("context block")
  // This is injected into system prompt for every turn
}
```

### `command.execute.before`
```typescript
hooks["command.execute.before"] = async (input, output) => {
  // input: { command: string, args: string[], sessionID }
  // Called before a /command executes
}
```

### `command.execute.after`
```typescript
hooks["command.execute.after"] = async (input, output) => {
  // Called after a /command executes
}
```

## Context Injection Pattern

```typescript
const _contextMessages: Record<string, string[]> = {}

function queueContextMessage(sessionId: string, message: string) {
  if (!_contextMessages[sessionId]) {
    _contextMessages[sessionId] = []
  }
  _contextMessages[sessionId].push(message)
}

function consumeContextMessages(sessionId: string): string[] {
  const messages = _contextMessages[sessionId] || []
  delete _contextMessages[sessionId]
  return messages
}
```

## State Management Pattern

```typescript
interface PluginState {
  active: boolean
  started_at?: string
  session_id?: string
  // ... custom state fields
}

function getStatePath(directory: string, stateName: string, sessionId?: string): string {
  const stateDir = sessionId
    ? join(directory, '.opencode', 'state', 'sessions', sessionId)
    : join(directory, '.opencode', 'state')
  return join(stateDir, `${stateName}-state.json`)
}

function readState<T>(filePath: string): T | null {
  try {
    if (!existsSync(filePath)) return null
    return JSON.parse(readFileSync(filePath, 'utf-8')) as T
  } catch { return null }
}

function writeState<T>(filePath: string, data: T): void {
  try {
    const dir = dirname(filePath)
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
    writeFileSync(filePath, JSON.stringify(data, null, 2), { mode: 0o600 })
  } catch {}
}
```

## Registration (opencode.jsonc)

```jsonc
{
  "plugin": [
    "./plugins/my-plugin.ts",                // Local TypeScript plugin
    "@npm-user/opencode-my-plugin@1.0.0",    // NPM plugin
  ]
}
```

## Magic Keyword Detection Pattern

```typescript
const KEYWORD_PATTERNS: Record<string, RegExp> = {
  myMode: /\b(my mode|trigger phrase)\b/i,
}

function detectKeywords(text: string): Array<{ name: string; args: string }> {
  const matches: Array<{ name: string; args: string }> = []
  for (const [name, pattern] of Object.entries(KEYWORD_PATTERNS)) {
    if (pattern.test(text)) {
      matches.push({ name, args: text })
    }
  }
  return matches
}
```

## System Transform Context Block Pattern

```typescript
hooks["experimental.chat.system.transform"] = async (input, output) => {
  const sessionId = input.sessionID
  if (!sessionId) return
  
  const messages = consumeContextMessages(sessionId)
  if (messages.length === 0) return
  
  const contextBlock = `<my-plugin-context>\n${messages.join('\n\n')}\n</my-plugin-context>`
  output.system.push(contextBlock)
}
```
