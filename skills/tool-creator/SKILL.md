---
name: tool-creator
description: Create valid, type-safe OpenCode 2 tool plugins — generates correct boilerplate, JSON Schema arguments, and handler stubs. Use when building new tools for the global config or a per-project .opencode/plugins/ tree.
level: 2
license: MIT
tags: [opencode, tool, typescript, scaffold, automation]
version: 2.0.0
---

# Tool Creator

Use this skill when creating OpenCode tools that extend the agent's capabilities. The skill interviews you about what the tool should do, generates valid boilerplate via `tool-scaffolder`, and validates the output.

## The one rule that changed everything

OpenCode 2 removed file-based tool discovery. In V1 a file at `.opencode/tools/foo.ts` was imported automatically and its default export became a tool. In V2 that file is **inert** — nothing scans the directory.

A tool exists only when a plugin registers it:

```typescript
await ctx.tool.transform((editor) => {
  editor.add({ name, description, input, options, execute })
})
```

So a tool is not a file, it is a **plugin directory**:

```
.opencode/plugins/my-tool/index.ts
```

OpenCode 2 auto-discovers every directory under `<config>/plugins/` and `<project>/.opencode/plugins/`, loads its `index.ts`, and calls `setup(ctx)`. A scaffolded tool therefore works with no registration entry anywhere.

## When to Use

- Creating a new tool for `~/.config/opencode/plugins/` (global scope)
- Creating a project-specific tool in `.opencode/plugins/` (project scope)
- Adding a missing tool type: file editing, validation, state management, search, etc.
- User says "create a tool for X" or "I need a tool that does Y"

## When Not to Use

- The task is better served by an existing tool (check `tools/` first)
- The user wants a skill, not a tool (use `/resource-hub create skill`)
- The user wants a slash command (use `opencode-command-creator`)
- The user wants an agent (use `opencode-agent-creator`)
- The user wants a plugin that is not a tool (use `opencode-plugin-creator`)

## Workflow

### Step 1: Interview

Ask the user these questions, one at a time:

1. **Name** — What should the tool be called? (kebab-case, e.g. `my-utility`, `project-info`, `db-migrate`)
2. **Description** — What does this tool do? (1-2 sentences)
3. **Language** — TypeScript (native OpenCode tools) or shell (bash)?
4. **Scope** — Global (available everywhere) or project (available only in this project)?
5. **Parameters** — Does the tool need input parameters?

If the user says yes to parameters, collect each parameter:
- **Name** (camelCase for TS; UPPER_SNAKE for bash convention)
- **Type** (string | number | boolean | array | object)
- **Required?** (true/false)
- **Description** (what the parameter does)
- **Valid values** (optional, for enums)

### Step 2: Generate

Call `tool-scaffolder` with the collected information:

```
tool-scaffolder {
  action: "generate",
  language: "typescript" | "bash",
  name: "<kebab-case-name>",
  description: "<description>",
  params: '[{"name":"...","type":"string","required":true,"description":"..."}]',
  scope: "global" | "project"
}
```

The tool returns `{ ok: true, language: "...", path: "...", params: N, size: N }`.

### Step 3: Validate

Call `tool-scaffolder` with the validate action:

```
tool-scaffolder {
  action: "validate",
  outputPath: "<path from generate step>"
}
```

Validation checks vary by language:

| Language   | Checks                                                                              |
| ---------- | ----------------------------------------------------------------------------------- |
| TypeScript | default export is a plugin (`export default {`), `setup(`, `ctx.tool.transform`, `editor.add(`, `name`, `description`, `input`, `async execute` |
| Bash       | shebang (`#!/usr/bin/env bash`), `set -euo pipefail`                                  |

If validation fails, fix the issues and re-validate.

### Step 4: Hand Off

Show the user:
- The generated plugin path
- Parameter count and file size
- A preview of the generated code (first 20 lines)
- Reminder: the handler stub needs custom logic — search for `TODO: implement tool logic`

## Tool Plugin Structure

Generated TypeScript tools follow this canonical pattern:

```typescript
/**
 * my-tool — OpenCode 2 tool plugin.
 *
 * V2 removed file-based tool discovery: a file under `.opencode/tools/` is
 * inert until a plugin registers it. This file *is* that plugin.
 */

interface Args {
  input: string
  verbose?: boolean
}

const input = {
  type: "object" as const,
  properties: {
    input: { type: "string", description: "Input value" },
    verbose: { type: "boolean", description: "Enable verbose output" },
  },
  required: ["input"],
}

export default {
  id: "my-tool",
  setup(ctx: any) {
    const directory: string = ctx?.location?.directory ?? process.cwd()

    ctx.tool.transform((editor: any) => {
      editor.add({
        name: "my-tool",
        description: "What this tool does",
        input,
        // codemode: false keeps the tool on the provider's native tool list.
        options: { codemode: false },
        execute: async (args: Args, context: any) => {
          const projectRoot = context?.directory ?? directory
          // TODO: implement tool logic
          return { content: JSON.stringify({ ok: true }) }
        },
      })
    })
  },
}
```

### Rules that bite

| Rule | Why |
| ---- | --- |
| No `import { tool } from "@opencode-ai/plugin"` | That runtime import loads `@opencode/schema` against the host's embedded effect and breaks plugin loading. Type-only imports are safe. |
| Input is plain JSON Schema | A project plugin should not acquire a zod dependency to describe four arguments. |
| Result is `{ content }` | V2 tool results carry `content` (string or content parts), not a bare string. |
| `options: { codemode: false }` | Without it the tool only appears inside Code Mode, not on the provider's native tool list. |
| Tool names are `[A-Za-z0-9_-]+` | Anything else is rejected at registration. |
| The project root comes from `ctx.location.directory` | The V2 tool context carries no filesystem path. |

### Bash Output Structure

```
#!/usr/bin/env bash
set -euo pipefail

# <description>

# Parse arguments
while [[ $# -gt 0 ]]; do
  case "$1" in
    --input) INPUT="$2"; shift 2 ;;
    --verbose) VERBOSE=true; shift ;;
    *) echo "Unknown option: $1" >&2; exit 1 ;;
  esac
done

# TODO: implement tool logic
printf '{"ok": true}\n'
```

## Scope Rules

| Scope   | TypeScript                          | Shell (bash)                                 | Available         |
| ------- | ----------------------------------- | -------------------------------------------- | ----------------- |
| global  | `~/.config/opencode/plugins/<name>/` | `~/.config/opencode/skills/<name>/scripts/`  | All projects      |
| project | `<project>/.opencode/plugins/<name>/` | `<project>/.opencode/skills/<name>/scripts/` | This project only |

**Artifact placement rule:** TypeScript tools are plugin directories under `plugins/` (global) or `.opencode/plugins/` (project). Bash scripts go into `skills/<name>/scripts/` (global) or `.opencode/skills/<name>/scripts/` (project). Never create standalone scripts at the project root. See `rules/file-operations.md`.

## Parameter Types

| Type      | TypeScript (JSON Schema)          | Bash                | Use Case          |
| --------- | --------------------------------- | ------------------- | ----------------- |
| `string`    | `{ type: "string" }`              | positional/flag       | Text, paths, IDs    |
| `number`    | `{ type: "number" }`              | positional/flag       | Counts, limits      |
| `boolean`   | `{ type: "boolean" }`             | flag, no value        | Flags, toggles      |
| `array`     | `{ type: "array", items: {...} }` | `IFS`-split string    | Lists (of strings)  |
| `object`    | `{ type: "object" }`              | JSON string parse    | Complex nested data |

## Validation Checks

After generation, always validate. The `tool-scaffolder validate` action checks:

**TypeScript:**
- ✓ `export default {` — a plugin, not a bare object
- ✓ `setup(` present
- ✓ `ctx.tool.transform` registration present
- ✓ `editor.add(` present
- ✓ `name:`, `description:`, `input` defined
- ✓ `async execute` handler present

**Bash:**
- ✓ `#!/usr/bin/env bash` shebang present
- ✓ `set -euo pipefail` present

## Anti-Patterns

| BAD                                | GOOD                                        |
| ---------------------------------- | ------------------------------------------- |
| Creating a tool that duplicates an existing one | Check `tools/` first, then create     |
| Hand-rolling boilerplate           | Use `tool-scaffolder generate`                |
| Writing the tool to `.opencode/tools/` | Write a plugin directory under `.opencode/plugins/` |
| Importing `@opencode-ai/plugin` at runtime | Plain object plugin, no runtime import |
| Returning a bare string from `execute` | Return `{ content: "..." }`              |
| Skipping validation                | Always run `tool-scaffolder validate`         |
| Unclear parameter descriptions     | Each property gets a `description`            |

## Related

- `tool-scaffolder` tool — the generator this skill employs
- `opencode-command-creator` skill — for slash commands instead of tools
- `opencode-agent-creator` skill — for agents instead of tools
- `opencode-plugin-creator` skill — for plugins instead of tools
- `rules/artifact-placement.md` — where generated files go
