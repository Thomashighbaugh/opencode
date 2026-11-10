---
name: opencode-sdk-development
description: This skill should be used when the user asks to "create an OpenCode tool", "build an OpenCode plugin", "write a custom tool for OpenCode", "use the OpenCode client", "integrate with OpenCode", "create OpenCode hooks", "define tool schema", "work with OpenCode sessions", or needs guidance on OpenCode 2 SDK patterns, plugin development, or custom tool creation.
level: 2
license: MIT
version: 2.0.0
---

# OpenCode SDK Development (OpenCode 2)

Guide for creating custom tools and plugins against the OpenCode 2 runtime.

## Overview

OpenCode 2 ships four packages that matter for extension work:

| Package | Purpose |
|---------|---------|
| `@opencode/plugin` | Plugin context: tool/command registration, hooks, events. Promise API at the root, Effect API at `@opencode/plugin/effect`, TUI API at `@opencode/plugin/tui` |
| `@opencode/client` | Client SDK for talking to a running OpenCode server (sessions, events, plugins, permissions) |
| `@opencode/schema` | The shared schemas (tool, permission, model, config). **Do not import at runtime from a plugin** — see below |
| `@opencode/ai` | Message/prompt types used by the plugin and client APIs |

**The runtime-import rule:** importing `@opencode/plugin` (or `@opencode/schema`) at runtime inside a plugin binds those packages to the host binary's embedded Effect instance. The plugin then fails to load. Use a plain object plugin and type-only imports. The note at the top of `plugins/hubs/index.ts` explains it in full.

## Quick Start: Custom Tools

V2 removed file-based tool discovery. A file at `.opencode/tool/foo.ts` is inert — nothing scans the directory. A tool exists only when a plugin registers it.

```typescript
// .opencode/plugins/my-tool/index.ts
export default {
  id: "my-tool",
  async setup(ctx: any) {
    await ctx.tool.transform((editor: any) => {
      editor.add({
        name: "my-tool",
        description: "Brief description of what the tool does",
        input: {
          type: "object",
          properties: {
            paramName: { type: "string", description: "Parameter description" },
          },
          required: ["paramName"],
        },
        options: { codemode: false },
        async execute(args: any, context: any) {
          return { content: "Result string returned to the AI" }
        },
      })
    })
  },
}
```

OpenCode 2 auto-discovers every directory under `<config>/plugins/` and `<project>/.opencode/plugins/`, loads its `index.ts`, and calls `setup(ctx)`. No registration entry is needed.

### Input Schema

`input` accepts a plain JSON Schema, an Effect codec, or a Standard Schema. For a project plugin, use plain JSON Schema — a zod dependency is not worth four arguments.

```typescript
input: {
  type: "object",
  properties: {
    query: { type: "string", description: "Search query" },
    path: { type: "string", description: "File path" },
    limit: { type: "number", minimum: 1, maximum: 100, description: "Max results" },
    format: { type: "string", enum: ["json", "text"], description: "Output format" },
    recursive: { type: "boolean", description: "Search recursively" },
  },
  required: ["query"],
}
```

A zod schema is also valid — but the host converts a Standard Schema with *its own* zod instance, which does not match the zod copy a plugin imports. If you use zod, convert it yourself before registering:

```typescript
import { z } from "zod/v4"

const input = z.object({ query: z.string().describe("Search query") })
const jsonSchema = z.toJSONSchema(input, { io: "input", unrepresentable: "any" })
```

### Tool Context

```typescript
type ToolContext = {
  sessionID: string
  messageID: string
  agent: string
  id: string
  signal: AbortSignal
  progress: (update: unknown) => Promise<void>
}
```

There is **no** `directory` in the tool context. The project root comes from the plugin context: `ctx.location.directory`. Inject it into the tool when registering.

### Result Shape

```typescript
return { content: "text the model reads" }
// or structured parts
return { content: [{ type: "text", text: "..." }] }
```

Returning a bare string is a V1 shape and is not the V2 contract.

### Example: File Search Tool

```typescript
import { execFile } from "node:child_process"
import { promisify } from "node:util"

const exec = promisify(execFile)

export default {
  id: "file-search",
  async setup(ctx: any) {
    const directory: string = ctx?.location?.directory ?? process.cwd()

    await ctx.tool.transform((editor: any) => {
      editor.add({
        name: "file-search",
        description: "Search for files matching a pattern",
        input: {
          type: "object",
          properties: {
            pattern: { type: "string", description: "Glob pattern to match" },
            directory: { type: "string", description: "Directory to search" },
          },
          required: ["pattern"],
        },
        options: { codemode: false },
        async execute(args: any) {
          const { stdout } = await exec("find", [args.directory ?? ".", "-name", args.pattern])
          return { content: stdout || "No files found" }
        },
      })
    })
  },
}
```

Arguments are passed as an array, never interpolated into a shell string — a caller-supplied pattern must not be able to become a command.

## Plugin Development

```typescript
export default {
  id: "my-plugin",
  async setup(ctx: any) {
    // Commands
    await ctx.command.transform((editor: any) => {
      editor.add({
        name: "my-command",
        description: "What it does",
        async execute(invocation: any) {
          await ctx.session.prompt({ sessionID: invocation.sessionID, text: "done" })
        },
      })
    })

    // Events
    const controller = new AbortController()
    void (async () => {
      for await (const event of ctx.event.subscribe({ signal: controller.signal })) {
        if (event?.type === "session.idle") { /* ... */ }
      }
    })()

    return () => controller.abort()
  },
}
```

### Plugin Context Domains

| Domain | What it gives you |
|--------|-------------------|
| `ctx.location` | `{ directory }` — the project root |
| `ctx.tool` | `transform(editor)`, `hook("execute.before"/"execute.after")`, `list()`, `reload()` |
| `ctx.command` | `transform(editor)` → `editor.add({ name, description, execute })` |
| `ctx.event` | `subscribe({ signal })` — an async iterator of server events |
| `ctx.permission` | `hook("evaluate")`, `list()`, `get()`, `reply()` |
| `ctx.session` | `prompt(...)`, `hook("prompt"/"context"/"compaction")` |
| `ctx.skill` | skill listing and transforms |
| `ctx.storage` | key/value storage scoped to the plugin |
| `ctx.model`, `ctx.provider` | model and provider introspection |
| `ctx.agent`, `ctx.reference`, `ctx.vcs`, `ctx.worktree` | agent definitions, references, version control, worktrees |
| `ctx.shell`, `ctx.websearch`, `ctx.mcp`, `ctx.rpc` | shell, web search, MCP servers, raw RPC |

### Hook → V2 registration

| V1 hook | V2 |
|---------|-----|
| `event` | `ctx.event.subscribe` |
| `tool.execute.before` / `.after` | `ctx.tool.hook("execute.before" / "execute.after")` |
| `chat.message` | `ctx.session.hook("prompt")` |
| `experimental.chat.system.transform` | `ctx.session.hook("context")` — push `{ type: "text", text }` parts |
| `experimental.session.compacting` | `ctx.session.hook("compaction")` — append to `event.result.summary` |
| `permission.ask` | `ctx.permission.hook("evaluate")` — set `event.effect = "allow" \| "deny"` |

There is no global command-execute hook in V2.

## Client SDK Usage

The client talks to a running OpenCode server.

```typescript
import { OpenCode } from "@opencode/client"

const client = OpenCode.make({ baseUrl: "http://127.0.0.1:4096" })

const sessions = await client.session.list({ directory: process.cwd() })
const events = await client.event.subscribe({ signal: controller.signal })
```

### Client API Categories

| Category | Methods |
|----------|---------|
| `client.session` | list, get, create, prompt, messages, fork, interrupt, compact, export |
| `client.event` | subscribe (async iterator) |
| `client.plugin` | list, check, update |
| `client.command` | list |
| `client.permission` | list, reply |
| `client.agent`, `client.config`, `client.file`, `client.mcp` | server introspection |

Arguments are passed as a single object (`{ sessionID }`, `{ directory }`), not as V1's `{ path, body }` pairs.

## Installation

```bash
# Client SDK
npm install @opencode/client

# Plugin types (type-only imports are safe; runtime imports are not)
npm install -D @opencode/plugin
```

Requires TypeScript >= 4.9.

## Tool Plugin Location

| Location | Scope |
|----------|-------|
| `<project>/.opencode/plugins/<name>/index.ts` | Project-specific tools |
| `~/.config/opencode/plugins/<name>/index.ts` | Global tools for all projects |

A plugin directory may register several tools; one tool per directory is the convention this repo follows.

## Best Practices

1. **Clear descriptions** — concise, action-oriented, for the tool and each property
2. **Plain JSON Schema** — no zod dependency in a project plugin
3. **Return `{ content }`** — that is the result contract
4. **`options: { codemode: false }`** — keeps the tool on the provider's native tool list
5. **Inject the directory** — `ctx.location.directory`, because the tool context has no path
6. **Array arguments, not shell strings** — never let caller input become a command
7. **Abort signal** — check `context.signal` for long-running operations

## Common Patterns

### Tool with Context

```typescript
execute: async (_args: any, context: any) => ({
  content: JSON.stringify(
    {
      session: context.sessionID,
      message: context.messageID,
      agent: context.agent,
    },
    null,
    2,
  ),
})
```

## Troubleshooting

**Tool not appearing:**
- The file must live in a plugin directory (`plugins/<name>/index.ts`), not in a `tools/` directory
- The plugin must call `ctx.tool.transform` and `editor.add`
- `options: { codemode: false }` is required for the provider's native tool list
- Check the server log for `loading plugin` and registration errors
- Confirm the plugin `id` is unique — a duplicate id is dropped

**Registration errors:**
- `Invalid tool name` — names must match `[A-Za-z0-9_-]+`
- `Schema vendor "zod" does not support JSON Schema conversion` — the host tried to convert a Standard Schema with its own zod; convert it yourself or use plain JSON Schema
- Plugin loads but no tools — the plugin exported something other than `{ id, setup }`, or `setup` threw

**Execution errors:**
- `execute` must return `{ content }` (or `{ output }`/`{ metadata }`)
- Verify async operations complete before returning

## Additional Resources

### Working examples in this repo

- `plugins/tools/index.ts` — one plugin registering 29 tools
- `plugins/hubs/index.ts` — tool + command registration, and the runtime-import rule
- `plugins/hooks/index.ts` — every V1 hook mapped onto its V2 domain
- `plugins/hubs/tui.tsx` — TUI plugin entrypoint

### External Documentation

- [OpenCode SDK Docs](https://opencode.ai/docs/sdk/)
- [Custom Tools Guide](https://opencode.ai/docs/custom-tools/)
- [OpenCode GitHub](https://github.com/anomalyco/opencode)
