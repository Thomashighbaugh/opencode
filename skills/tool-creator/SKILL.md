---
name: tool-creator
description: Create valid, type-safe TypeScript tools for OpenCode — generates correct boilerplate, typed interfaces, and handler stubs. Use when building new tools for global config or per-project .opencode/tools/.
level: 2
license: MIT
tags: [opencode, tool, typescript, scaffold, automation]
version: 1.0.0
---

# Tool Creator

Use this skill when creating OpenCode TypeScript tools that extend the agent's capabilities. The skill interviews you about what the tool should do, generates valid boilerplate via `tool-scaffolder`, and validates the output.

## When to Use

- Creating a new TypeScript tool for `~/.config/opencode/tools/` (global scope)
- Creating a project-specific tool in `.opencode/tools/` (project scope)
- Adding a missing tool type: file editing, validation, state management, search, etc.
- User says "create a tool for X" or "I need a tool that does Y"

## When Not to Use

- The task is better served by an existing tool (check `tools/` first)
- The user wants a skill, not a tool (use `/skills create`)
- The user wants a slash command (use `opencode-command-creator`)
- The user wants an agent (use `opencode-agent-creator`)

## Workflow

### Step 1: Interview

Ask the user these questions, one at a time:

1. **Name** — What should the tool be called? (kebab-case, e.g. `my-utility`, `project-info`, `db-migrate`)
2. **Description** — What does this tool do? (1-2 sentences)
3. **Language** — TypeScript (native OpenCode tools), Python, or Bash?
4. **Scope** — Global (available everywhere) or project (available only in this project)?
5. **Parameters** — Does the tool need input parameters?

If the user says yes to parameters, collect each parameter:
- **Name** (camelCase for TS/Python; UPPER_SNAKE for bash convention)
- **Type** (string | number | boolean | array | object)
- **Required?** (true/false)
- **Description** (what the parameter does)
- **Valid values** (optional, for enums)

### Step 2: Generate

Call `tool-scaffolder` with the collected information:

```
tool-scaffolder {
  action: "generate",
  language: "typescript" | "python" | "bash",
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

| Language   | Checks                                                                 |
| ---------- | ---------------------------------------------------------------------- |
| TypeScript | import, export default tool(), description, args, async execute        |
| Python     | shebang (`#!/usr/bin/env python3`), argparse, main(), `__name__` guard |
| Bash       | shebang (`#!/usr/bin/env bash`), `set -euo pipefail`                     |

If validation fails, fix the issues and re-validate.

### Step 4: Hand Off

Show the user:
- The generated file path
- Parameter count and file size
- A preview of the generated code (first 20 lines)
- Reminder: the handler stub needs custom logic — search for `TODO: implement tool logic`

## Tool File Structure

Generated tools follow this canonical pattern:

```typescript
import { tool } from "@opencode-ai/plugin"
import * as fs from "fs"
import * as path from "path"
import { homedir } from "os"

interface MyToolArgs {
  input: string
  verbose?: boolean
}

export default tool({
  description: "What this tool does",
  args: {
    input: tool.schema.string().describe("Input value"),
    verbose: tool.schema.boolean().optional().describe("Enable verbose output"),
  },
  async execute(args: MyToolArgs, context) {
    const projectRoot = context.directory || process.cwd()
    // TODO: implement tool logic
    return JSON.stringify({ ok: true })
  },
})
```

### Python Output Structure

```
#!/usr/bin/env python3
"""<description>"""
import argparse
import json
import sys

def main():
    parser = argparse.ArgumentParser(description="<description>")
    parser.add_argument("--input", type=str, required=True, help="Input value")
    parser.add_argument("--verbose", action="store_true", help="Verbose output")
    args = parser.parse_args()

    # TODO: implement tool logic
    result = {"ok": True}
    print(json.dumps(result))

if __name__ == "__main__":
    main()
```

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

| Scope   | TypeScript                          | Python / Bash                       | Available         |
| ------- | ----------------------------------- | ----------------------------------- | ----------------- |
| global  | `~/.config/opencode/tools/`          | `~/.config/opencode/skills/<name>/scripts/` | All projects      |
| project | `<project>/.opencode/tools/`         | `<project>/.opencode/skills/<name>/scripts/` | This project only |

**Artifact placement rule:** TypeScript tools go into `tools/` (global) or `.opencode/tools/` (project). Python and Bash scripts go into `skills/<name>/scripts/` (global) or `.opencode/skills/<name>/scripts/` (project). Never create standalone scripts at the project root. See `rules/artifact-placement.md`.

## Parameter Types

| Type      | TypeScript           | Python (argparse)          | Bash                | Use Case          |
| --------- | -------------------- | -------------------------- | ------------------- | ----------------- |
| `string`    | `tool.schema.string()`  | `type=str`                   | positional/flag       | Text, paths, IDs    |
| `number`    | `tool.schema.number()`  | `type=float`                 | positional/flag       | Counts, limits      |
| `boolean`   | `tool.schema.boolean()` | `action="store_true"`        | flag, no value        | Flags, toggles      |
| `array`     | `tool.schema.array()`   | `nargs="+"`                   | `IFS`-split string    | Lists (of strings)  |
| `object`    | `tool.schema.object()`  | `type=json.loads`            | JSON string parse    | Complex nested data |

## Validation Checks

After generation, always validate. The `tool-scaffolder validate` action checks:

**TypeScript:**
- ✓ Import from `@opencode-ai/plugin` present
- ✓ `export default tool(` present
- ✓ `description:` field defined
- ✓ `args:` schema defined
- ✓ `async execute` handler present

**Python:**
- ✓ `#!/usr/bin/env python3` shebang present
- ✓ `import argparse` present
- ✓ `def main()` function present
- ✓ `if __name__ == "__main__"` guard present

**Bash:**
- ✓ `#!/usr/bin/env bash` shebang present
- ✓ `set -euo pipefail` present

## Anti-Patterns

| BAD                                | GOOD                                        |
| ---------------------------------- | ------------------------------------------- |
| Creating a tool that duplicates an existing one | Check `tools/` first, then create     |
| Hand-rolling boilerplate           | Use `tool-scaffolder generate`                |
| Putting tools at project root      | Always in `.opencode/tools/` or `tools/`      |
| Skipping validation                | Always run `tool-scaffolder validate`         |
| Unclear parameter descriptions     | Each param gets a meaningful `.describe()`     |

## Related

- `tool-scaffolder` tool — the generator this skill employs
- `opencode-command-creator` skill — for slash commands instead of tools
- `opencode-agent-creator` skill — for agents instead of tools
- `opencode-plugin-creator` skill — for plugins instead of tools
- `rules/artifact-placement.md` — where generated files go
