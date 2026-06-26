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
