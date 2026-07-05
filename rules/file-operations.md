# Artifact Placement Rule

**Never create standalone scripts at the project root or any top-level directory.**

## The Problem

Agents (executor, skill-creator, refactoring, provision, and any subagent) have a tendency to create standalone `.sh`, `.ts`, `.mjs`, `.py` files at the project root when they need to generate an executable artifact. This creates:

- **Root directory pollution**: `./deploy.sh`, `./migrate.ts`, `./tools/`, `./scripts/` at the project root
- **Discovery failure**: OpenCode auto-discovers tools from `.opencode/tools/`, not from the project root
- **Git tracking confusion**: Root-level scripts are often committed unintentionally
- **Inconsistency**: Every project ends up with a different ad-hoc layout

## The Solution

All executable artifacts MUST go into their designated `.opencode/` subdirectory:

| Artifact Type | Location | Example |
|---------------|----------|---------|
| TypeScript tools | `.opencode/tools/` | `.opencode/tools/project-info.ts` |
| Skill scripts | `.opencode/skills/{name}/scripts/` | `.opencode/skills/deploy/scripts/deploy.sh` |
| Slash commands | `.opencode/commands/` | `.opencode/commands/build.md` |
| Shell scripts (skill-bundled) | `skills/{name}/scripts/` | `skills/my-skill/scripts/helper.sh` |
| package.json scripts | `package.json` scripts field | `"scripts": { "build": "tsc" }` |

## Forbidden Patterns

| Pattern | Why It's Wrong | Correct Alternative |
|---------|---------------|-------------------|
| `./deploy.sh` at project root | Root pollution, not auto-discovered | `.opencode/tools/deploy.ts` |
| `./tools/` at project root | OpenCode looks in `.opencode/tools/` | `.opencode/tools/` |
| `./scripts/` at project root | No auto-discovery for root scripts | `.opencode/skills/{name}/scripts/` |
| `./migrate.ts` at project root | Not registered as a tool | `.opencode/tools/db-migrate.ts` |
| `./my-command.sh` at project root | Not a slash command | `.opencode/commands/my-command.md` |
| Any standalone executable not in `.opencode/` | Won't be found by agents or OpenCode | Move to appropriate `.opencode/` subdirectory |

## Scope

This rule applies to:

1. **Global config directory** (`~/.config/opencode/`) — skills, tools, commands, agents all live in their designated subdirectories
2. **Any project being worked on** — project-specific artifacts go into `.opencode/` subdirectories
3. **All agents** — hubs, executor, skill-creator, refactoring, provision, and any subagent

## Enforcement

- **Hubs agent**: Has a hard constraint in `<Constraints>` section
- **Executor agent**: Has a hard constraint in `<Constraints>` section
- **Skill-creator agent**: Has a dedicated section documenting the rule
- **Refactoring agent**: Has a dedicated section documenting the rule
- **Provision skill**: Generates tools into `.opencode/tools/` by default
- **Code review**: `@code-reviewer` should flag root-level scripts as a smell
- **Verification**: `@verifier` should check for root-level scripts during completion checks

## Exceptions

The only allowed exceptions are:

1. **`package.json` scripts** — these are the standard Node.js convention
2. **`Makefile`** — standard build system convention
3. **`docker-compose.yml`** — standard Docker convention
4. **`.github/workflows/*.yml`** — GitHub Actions workflow files
5. **`install.sh`** — only if the project is explicitly a distribution/installer package

---

# Script Elimination Rule

**Never write inline scripts (Python, Node.js, shell) for file editing operations.** Use the dedicated file-editing tools instead.

## The Problem

Agents frequently create disposable scripts to edit files:

```bash
# BAD: Inline Python script for JSON editing
python3 -c "
import json
with open('config.json') as f: d = json.load(f)
d['port'] = 8080
json.dump(d, open('config.json', 'w'), indent=2)
"
```

```bash
# BAD: Inline sed script — fragile quoting, no error handling
sed -i 's/oldFunction/newFunction/g' src/*.ts
```

```bash
# BAD: Inline Node.js one-liner
node -e "
const fs = require('fs');
const d = JSON.parse(fs.readFileSync('package.json'));
d.scripts.build = 'tsc';
fs.writeFileSync('package.json', JSON.stringify(d, null, 2));
"
```

These create problems:
- **Workspace pollution** — scripts leave no trace but the file change, making debugging harder
- **Fragile quoting** — shell escaping fails on special characters, paths with spaces
- **No error handling** — silent failures on invalid input, missing files, permission errors
- **No preview** — changes applied immediately with no dry-run option
- **Reinvention** — every agent writes the same pattern from scratch

## The Solution

Use the dedicated file-editing tools from `.opencode/tools/`. Each tool handles a specific editing domain with proper error handling, dry-run support, and structured output.

| Task                                      | Tool         | Example Call                                                                                        |
| ----------------------------------------- | ------------ | --------------------------------------------------------------------------------------------------- |
| Regex find/replace in a file              | `regex-edit`   | `regex-edit { file: "src/main.ts", action: "replaceAll", pattern: "oldFunc", replacement: "newFunc" }` |
| Insert line before a pattern              | `regex-edit`   | `regex-edit { file: "config.ts", action: "insertBefore", pattern: "export const", content: "// new" }` |
| Delete lines matching a pattern           | `regex-edit`   | `regex-edit { file: "test.txt", action: "deleteMatching", pattern: "^\\s*// TODO" }`                  |
| Delete a range of lines                   | `regex-edit`   | `regex-edit { file: "main.ts", action: "deleteRange", startLine: 10, endLine: 20 }`                   |
| Get lines matching a pattern              | `regex-edit`   | `regex-edit { file: "config.ts", action: "getLines", pattern: "import" }`                             |
| Set a JSON value by path                  | `json-edit`    | `json-edit { file: "package.json", action: "set", path: "$.scripts.build", value: "tsc" }`             |
| Delete a JSON key                         | `json-edit`    | `json-edit { file: "config.json", action: "delete", path: "$.deprecated" }`                            |
| Append to a JSON array                    | `json-edit`    | `json-edit { file: "tsconfig.json", action: "arrayAppend", path: "$.include", value: "src/**/*.ts" }`  |
| Merge an object into JSON                 | `json-edit`    | `json-edit { file: "config.json", action: "merge", path: "$.server", value: { port: 8080 } }`          |
| Get/set YAML values                       | `yaml-edit`    | `yaml-edit { file: "docker-compose.yml", action: "set", path: "services.app.ports", value: ["8080:80"] }` |
| Set .env variables                        | `conf-edit`    | `conf-edit { file: ".env", action: "set", key: "DATABASE_URL", value: "postgres://localhost/db" }`     |
| Comment out a config key                  | `conf-edit`    | `conf-edit { file: "config.ini", action: "commentOut", key: "debug_mode" }`                            |
| Batch replace across files by glob        | `multi-edit`   | `multi-edit { glob: "src/**/*.ts", action: "replaceAll", pattern: "old", replacement: "new" }`         |
| Search for pattern across files           | `multi-edit`   | `multi-edit { glob: "src/**/*.ts", action: "find", pattern: "deprecated" }`                            |

## When Inline Scripts ARE Allowed

There are exactly two situations where an inline script is acceptable:

1. **The operation cannot be expressed with any existing tool.** If none of `regex-edit`, `json-edit`, `yaml-edit`, `conf-edit`, or `multi-edit` can do what's needed, use an inline script — BUT use `file-edit: true` in the bash call options so the tool infrastructure tracks it.

2. **The script is a reusable automation saved as a skill script.** If the operation is repeatable, create a script at `skills/<name>/scripts/<name>.sh` instead of writing it inline.

## Enforcement

- `@code-reviewer` checks for inline script file-edit patterns and flags them
- `@verifier` checks for leftover script artifacts during completion verification
- If you catch yourself writing `python3 -c`, `node -e`, or a `sed -i` pipeline, stop and use the appropriate tool

## Tool Availability

All file-editing tools are in `~/.config/opencode/tools/` and are auto-discovered by OpenCode. They are available globally for any project, and can be overridden per-project in `.opencode/tools/`.

- `regex-edit.ts` — file operations: replace, insert, delete lines by regex
- `json-edit.ts` — JSON/JSONC editing by JSON Path (RFC 9535)
- `yaml-edit.ts` — YAML editing by dot-path
- `conf-edit.ts` — Config file editing (.env, INI, key=value)
- `multi-edit.ts` — Batch operations across files by glob pattern
