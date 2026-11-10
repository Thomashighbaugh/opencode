---
name: opencode-plugin-creator
description: Guide for creating OpenCode 2 plugins — local plugin directories, npm packages, tool plugins, and TUI plugins. Covers the V2 plugin context, discovery rules, and the full procedural workflow. Use when building, updating, or packaging OpenCode plugins.
level: 3
license: MIT
version: 2.0.0
---

# OpenCode Plugin Creator

Guide for creating OpenCode 2 plugins. Four shapes:

1. **Local plugin** — a directory under `plugins/` with an `index.ts` (server) and optional `tui.tsx` (TUI)
2. **Tool plugin** — a local plugin whose only job is to register a tool
3. **NPM plugin** — a published package referenced from `opencode.jsonc`
4. **TUI plugin** — a local plugin with a `tui.tsx` entrypoint that renders dialogs

## What changed in V2

| V1 | V2 |
| --- | --- |
| Plugin = a file listed in `opencode.jsonc` `plugin[]` | Plugin = a **directory** under `plugins/` (or `.opencode/plugins/`); auto-discovered, no config entry |
| `import { Plugin } from "@opencode-ai/plugin"` | Plain object `{ id, setup(ctx) }` — a runtime import of `@opencode/plugin` breaks plugin loading |
| Hook map `hooks["tool.execute.before"] = ...` | `ctx.tool.hook("execute.before", ...)`, `ctx.session.hook("context", ...)`, `ctx.permission.hook("evaluate", ...)`, `ctx.event.subscribe(...)` |
| `tool({ args, execute })` files auto-discovered | `ctx.tool.transform((editor) => editor.add({ name, description, input, execute }))` |
| `client.registerDialog(...)` | TUI plugin exports a `Plugin` definition from `tui.tsx` and renders through the V2 TUI plugin API |
| Config key `plugin: [...]` | `plugin: [...]` still accepted (migrated), `plugins: [...]` is the native form |

**Why the runtime import matters:** importing `@opencode/plugin` pulls in `@opencode/schema`, which binds to the host binary's embedded Effect instance. The plugin then fails to load with a schema/effect mismatch. Type-only imports (`import type { ... }`) are safe. See the note at the top of `plugins/hubs/index.ts`.

## When to Use

- User asks "create a plugin for OpenCode"
- User asks "add a hook for X" (permission auto-approval, state persistence, magic keywords)
- User asks "build a TUI dialog for my hub"
- User says "I want to intercept [tool|command|session|compact] events"
- User wants to publish a plugin to npm

## Workflow

### Step 1: Identify the Hook Points

Ask the user: "What behavior are you trying to add?"

| If they want to... | V2 registration |
|-------------------|-----------------|
| Auto-approve safe shell commands | `ctx.permission.hook("evaluate", ...)` → set `event.effect = "allow"` |
| Inject context every turn | `ctx.session.hook("context", ...)` → push `{ type: "text", text }` to `event.system` |
| Preserve state across compaction | `ctx.session.hook("compaction", ...)` → prepend to `event.result.summary` |
| Detect magic keywords in chat | `ctx.session.hook("prompt", ...)` |
| Track tool usage | `ctx.tool.hook("execute.before" / "execute.after", ...)` |
| Intercept a tool's arguments | `ctx.tool.hook("execute.before", ...)` → mutate `event.input` |
| Add a slash command | `ctx.command.transform((editor) => editor.add({ name, description, execute }))` |
| Add a tool for the model | `ctx.tool.transform((editor) => editor.add({ ... }))` |
| React to any server event | `ctx.event.subscribe({ signal })` and filter on `event.type` |
| Add TUI dialog menus | TUI plugin with a `tui.tsx` entrypoint |

The working reference for all of these is `plugins/hooks/index.ts` — it maps every V1 hook this repo used onto its V2 domain.

### Step 2: Determine Plugin Type

| Type | Location | Registration | Best For |
|------|----------|-------------|----------|
| **Local plugin** | `plugins/<name>/index.ts` | none — auto-discovered | Internal hooks, project behavior |
| **Tool plugin** | `plugins/<name>/index.ts` | none — auto-discovered | One tool per plugin |
| **NPM plugin** | `node_modules/` | `"plugin": ["@scope/package@version"]` | Reusable, published behavior |
| **TUI plugin** | `plugins/<name>/tui.tsx` | none — auto-discovered | Visual dialogs and menus |

Discovery details: OpenCode 2 scans `<config>/plugin` and `<config>/plugins` (and the project equivalents) for directories. A directory contributes a server entrypoint at `index` and a TUI entrypoint at `tui`. A single file (`plugins/foo.ts`) also works as a server entrypoint.

### Step 3: Scaffold

```bash
# Local plugin
mkdir -p plugins/my-plugin
# Create plugins/my-plugin/index.ts

# TUI plugin (adds a tui.tsx beside index.ts)
mkdir -p plugins/my-tui
```

A minimal server plugin:

```typescript
export default {
  id: "my-plugin",
  async setup(ctx: any) {
    // register commands, tools, hooks here
  },
}
```

### Step 4: Implement the behavior

```typescript
// Command
await ctx.command.transform((editor: any) => {
  editor.add({
    name: "my-command",
    description: "What it does",
    async execute(invocation: any) {
      const sessionID = String(invocation?.sessionID ?? "")
      await ctx.session.prompt({ sessionID, text: "done" })
    },
  })
})

// Tool
await ctx.tool.transform((editor: any) => {
  editor.add({
    name: "my-tool",
    description: "What it does",
    input: { type: "object", properties: {} },
    options: { codemode: false },
    execute: async () => ({ content: "ok" }),
  })
})

// Event
const controller = new AbortController()
void (async () => {
  for await (const event of ctx.event.subscribe({ signal: controller.signal })) {
    if (event?.type === "session.idle") { /* ... */ }
  }
})()
return () => controller.abort()
```

### Step 5: Register (only for npm packages)

Local plugins under `plugins/` need no config entry. NPM packages do:

```jsonc
{
  "plugin": [
    "@scope/package@version"
  ]
}
```

### Step 6: Test

```bash
# Confirm the plugin is discovered
opencode2 plugin list

# Confirm the tool is registered (ask the model to list its tools, or read the run log)
opencode2 run --standalone --model <provider/model> "list your tool names"
```

## V1 → V2 Hook Mapping

| V1 hook | V2 registration | Notes |
| --- | --- | --- |
| `event` | `ctx.event.subscribe` | V2 events carry fields under `data`; V1 modules read `properties` |
| `tool.execute.before` | `ctx.tool.hook("execute.before")` | mutate `event.input` to change the call |
| `tool.execute.after` | `ctx.tool.hook("execute.after")` | write back via `event.result.content` |
| `chat.message` | `ctx.session.hook("prompt")` | |
| `experimental.chat.system.transform` | `ctx.session.hook("context")` | push `{ type: "text", text }` parts |
| `experimental.session.compacting` | `ctx.session.hook("compaction")` | append to `event.result.summary` |
| `permission.ask` | `ctx.permission.hook("evaluate")` | V2 action is `shell` where V1 said `bash` |
| `command.execute.before` | no equivalent | V2 has no global command-execute hook; register a command instead |

## The Two Context Injection Patterns

### Pattern A: Per-Turn System Injection (`ctx.session.hook("context")`)

```typescript
const queued = new Map<string, string[]>()

function queueContextMessage(sessionId: string, message: string) {
  if (!queued.has(sessionId)) queued.set(sessionId, [])
  queued.get(sessionId)!.push(message)
}

await ctx.session.hook("context", async (event: any) => {
  const messages = queued.get(event.sessionID) ?? []
  queued.delete(event.sessionID)
  for (const text of messages) event.system.push({ type: "text", text })
})
```

### Pattern B: Compaction Preservation (`ctx.session.hook("compaction")`)

```typescript
await ctx.session.hook("compaction", async (event: any) => {
  if (!event.result) return
  event.result.summary = `## My Plugin State\n- Active: true\n` + event.result.summary
})
```

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
await ctx.permission.hook("evaluate", async (event: any) => {
  if (event.action !== "shell") return

  const command = event.resources.join(" ")
  const safePatterns = [
    /^git (status|diff|log|branch|show|fetch)/,
    /^npm (test|run (test|lint|build|check))/,
    /^ls( |$)/,
  ]
  const isSafe = safePatterns.some((p) => p.test(command.trim()))
  const hasDangerousChars = /[;&|`$()<>\n\r\t\0\\]/.test(command)

  if (isSafe && !hasDangerousChars) event.effect = "allow"
  // Leave unset = prompt the user (default)
})
```

## TUI Plugin Entry Point

A TUI plugin lives beside the server plugin in the same directory and exports a TUI plugin definition:

```
plugins/my-plugin/
├── index.ts     # server entrypoint
└── tui.tsx      # TUI entrypoint
```

```tsx
import type { Plugin } from "@opencode/plugin/tui"

export default {
  id: "my-plugin",
  setup(ctx) {
    // register dialogs / palette entries against the V2 TUI plugin API
  },
} satisfies Plugin.Definition
```

The working example in this repo is `plugins/hubs/tui.tsx` (hub picker, skill browser, sidebar) alongside `plugins/hubs/index.ts`.

## Feasibility Check

### Feasible as plugins:
- Intercepting/blocking tool calls
- Reacting to events (file edits, session completion, etc.)
- Adding custom tools for the LLM
- Customizing session compaction and system context
- Adding slash commands
- Displaying status messages in the TUI

### NOT feasible (inform user):
- Changing core agent behavior/prompts
- Intercepting assistant responses mid-stream
- Adding new permission *types* (a plugin can set the effect of an existing action)
- Modifying internal file read/write

**Alternatives:** OC core changes → contribute upstream; MCP tools → use MCP server configuration; simple automation → shell scripts.

## Common Mistakes

| Mistake | Fix |
|---------|-----|
| `import { Plugin } from "@opencode-ai/plugin"` at runtime | Plain object plugin; type-only imports are fine |
| `client.registerTool()` | `ctx.tool.transform((editor) => editor.add({ ... }))` |
| Registering a tool as a file under `.opencode/tools/` | Make it a plugin directory under `.opencode/plugins/` |
| Returning a bare string from `execute` | Return `{ content: "..." }` |
| Assuming `context.directory` exists in a tool | Use `ctx.location.directory` (the tool context has no path) |
| Omitting `options: { codemode: false }` | The tool stays out of the provider's native tool list |
| Duplicate plugin `id` | V2 keeps the first occurrence and reports the rest as failures — ids must be unique |

## Modular Structure (Complex Plugins)

```
plugins/my-plugin/
├── index.ts          # entrypoint, exports { id, setup }
├── types.ts          # TypeScript types/interfaces
├── utils.ts          # shared utilities
├── hooks/            # hook implementations
│   ├── event.ts
│   └── tool-execute.ts
└── tools/            # tool registration modules
    └── my-tool.ts
```

**Rules:** Keep files under 150 lines. Single purpose per function. No monoliths.

## References

V2 sources of truth (read these before the reference pack):

- `plugins/hooks/index.ts` — every V1 hook mapped onto its V2 domain
- `plugins/hubs/index.ts` — tool + command registration, and the "no runtime import" rule
- `plugins/tools/index.ts` — a plugin that registers a whole tool suite
- `plugins/hubs/tui.tsx` — TUI plugin entrypoint

Reference pack (written for V1 — check each pattern against the mapping table above):

- `references/hook-api.md` — V1 hook API reference and patterns
- `references/templates.md` — V1 hook, stateful, and TUI plugin templates
- `references/hooks.md` — V1 hook signatures
- `references/events.md` — V1 event types and properties
- `references/examples.md` — V1 plugin examples
- `references/hook-patterns.md` — V1 hook implementation patterns
- `references/CODING-TS.MD` — code architecture principles
- `references/tool-helper.md` — V1 zod tool schemas for custom tools
- `references/testing.md` — testing procedure
- `references/publishing.md` — npm publishing guide
- `references/toast-notifications.md` — toast popup API
- `references/ui-feedback.md` — inline message API
- `references/update-notifications.md` — version update toast pattern
- `scripts/extract-plugin-api.ts` — API reference extraction script

## See Also

- `tool-creator` skill — for a plugin whose only job is one tool
- Existing plugins in `~/.config/opencode/plugins/` for reference
- `opencode.jsonc` — npm plugin registration config
