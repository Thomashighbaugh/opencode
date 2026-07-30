---
name: project-config-composer
description: Auto-generate a minimal per-project .opencode/ configuration from a stack fingerprint + recommendations. Creates opencode.jsonc, project agents, rules, and instructions that reference global resources. Used by /init-project provision.
level: 2
license: MIT
tags: [init, config, provisioning, scaffolding, per-project]
---

# Project Config Composer

Takes a stack fingerprint and resource recommendations and auto-generates a lean, production-quality `.opencode/` configuration for the target project.

## When to Use

- During `/init-project provision` after `@stack-detector` + `stack-recommender` have run
- When regenerating an existing project's `.opencode/` from an updated fingerprint
- When setting up a greenfield project from a natural language description
- As a standalone call when the user already knows what they want

## Principles

1. **Reference, don't copy** — project configs reference global resources; never duplicate them. The project `.opencode/` only contains project-specific overrides, new files, and references.
2. **Minimal by default** — start with only what's needed. Add more as the project evolves.
3. **Merge-safe** — every generated file is safe to re-run (writes are idempotent, merges conventions rather than replacing them).
4. **Human-editable** — output is clean, well-commented, and follows standard opencode conventions.

## Input

Takes two inputs (either from previous pipeline steps or direct arguments):

### A. Stack Fingerprint (from @stack-detector)
```json
{
  "fingerprint": { ... },
  "projectType": "webapp",
  "detected": true
}
```

### B. Recommendations (from stack-recommender)
```json
{
  "recommends": {
    "archetype": "nextjs-webapp",
    "skills": [...],
    "agents": [...],
    "rules": [...],
    "commands": [...],
    "notes": [...],
    "gaps": [...]
  }
}
```

## Generated Files

The composer creates the following structure under the project's `.opencode/`:

```
.opencode/
├── opencode.jsonc              # Project-level config (extends global, selects resources)
├── rules/                      # From archetype rules/ + generated rules
│   ├── project-conventions.md  # Auto-generated conventions from detected stack
│   ├── project-testing.md      # Testing guidelines specific to detected frameworks
│   ├── {category}-{name}.md    # Fine-grained rules from templates/rules (if recommended)
│   └── ...                     # One per recommended fine_rule
├── tools/                      # From archetype tools/ + generated tools
│   ├── {name}.ts               # TypeScript tools from templates/tools (if recommended)
│   └── ...                     # One per recommended tool
├── skills/                     # From archetype skills/ — copied/linked into project
│   └── ...                     # Skill directories referenced by agents and rules
├── agents/                     # Project-specific agent wrappers (if needed)
│   └── ... (only if gaps identified)
└── instructions/               # AGENTS.md fragment for project-specific docs
    └── README.md               # Brief note about what was generated
```

> **CRITICAL: All four archetype subdirectories must be provisioned.**
> Archetypes contain four subdirectories: `agents/`, `rules/`, `skills/`, and `tools/`.
> - `agents/` and `rules/` are referenced in `opencode.jsonc` (via the `agent` and `instructions` keys)
> - `skills/` and `tools/` must be copied or linked into the project's `.opencode/` directory
> - Without `skills/` and `tools/` present, agents and rules that reference them will fail to resolve

### 1. opencode.jsonc

The main project config file. It:
- Sets `"$schema"` to the opencode config schema
- Includes project-specific instructions and rules
- Selects relevant global skills via filter tags
- Optionally overrides the default agent for this project

> **⚠️ CRITICAL: Only valid schema keys allowed.** The OpenCode config schema (`https://opencode.ai/config.json`) sets `additionalProperties: false`. Generated files MUST contain ONLY the following valid top-level keys: `$schema`, `shell`, `logLevel`, `server`, `command`, `skills`, `references`, `watcher`, `snapshot`, `plugin`, `share`, `autoupdate`, `disabled_providers`, `enabled_providers`, `model`, `small_model`, `default_agent`, `username`, `agent`, `provider`, `mcp`, `formatter`, `lsp`, `instructions`, `permission`, `tools`, `attachment`, `enterprise`, `tool_output`, `compaction`, `experimental`. Keys like `extends`, `agents` (plural), `project`, `rules`, `state`, `context`, `cache` are NOT valid and will cause validation errors.

```jsonc
{
  "$schema": "https://opencode.ai/config.json",
  "instructions": [
    "AGENTS.md",
    "./rules/project-conventions.md",
    "./rules/project-testing.md"
  ],
  "resource_tags": {
    "include": ["typescript", "react", "nextjs", "tailwind", "prisma", "vitest"],
    "exclude": ["python", "rust", "go"]
  },
  "permission": {
    "edit": "allow",
    "bash": "allow"
  }
}
```

If an archetype was matched:
```jsonc
{
  "$schema": "https://opencode.ai/config.json",
  "instructions": [
    "AGENTS.md",
    "./rules/project-conventions.md"
  ],
  "resource_tags": {
    "include": ["typescript", "react", "nextjs", "tailwind"],
    "exclude": ["python"]
  }
}
```

### 2. Project Conventions Rule

Auto-generated from the detected stack:

```markdown
---
name: project-conventions
description: Auto-generated conventions for [framework] project
---

# Project Conventions

## Tech Stack
- **Language:** TypeScript (strict mode)
- **Framework:** Next.js 15 (App Router)
- **CSS:** Tailwind CSS v4
- **Database:** PostgreSQL via Prisma
- **Testing:** Vitest (unit) + Playwright (e2e)

## Code Conventions
- Use `async/await` over raw promises
- Preher server components by default; client components only when needed
- Route handlers in `app/api/` directory
- Prisma schema follows singular table naming: `user`, `post`, `comment`
- All API routes must be validated with Zod schemas

## Naming
- Components: PascalCase
- Hooks: camelCase with `use` prefix
- Utilities: camelCase
- Types/Interfaces: PascalCase with `Type`/`Interface` suffix where disambiguation helps

## Imports
- Absolute imports using `@/` alias
- Group: external → internal → types
```

### 3. Tools (from templates/tools)

When the recommendations include `tools[]`, the composer generates TypeScript tool files from the local template catalog at `~/.config/opencode/templates/tools/`:

```bash
TOOL_TEMPLATES_DIR="$HOME/.config/opencode/templates/tools"
PROJECT_TOOLS_DIR="$PROJECT_DIR/.opencode/tools"
```

For each recommended tool, the composer:
1. Reads the template file from `$TOOL_TEMPLATES_DIR/{category}/{name}.ts`
2. Replaces `{{PLACEHOLDERS}}` with values from the stack fingerprint (e.g., `{{PROJECT_NAME}}`, `{{LANGUAGE}}`, `{{FRAMEWORK}}`)
3. Writes the result to `$PROJECT_TOOLS_DIR/{name}.ts`
4. Registers the tool in `opencode.jsonc` under the `tools` array

**Template placeholders:**

| Placeholder | Source | Example |
|-------------|--------|---------|
| `{{PROJECT_NAME}}` | Fingerprint or directory name | `my-app` |
| `{{LANGUAGE}}` | `fingerprint.language.primary` | `typescript` |
| `{{FRAMEWORK}}` | `fingerprint.framework.name` | `nextjs` |
| `{{TEST_FRAMEWORK}}` | `fingerprint.testing.frameworks[0].name` | `vitest` |
| `{{PACKAGE_MANAGER}}` | `fingerprint.packageManager.name` | `pnpm` |
| `{{BUILD_TOOL}}` | `fingerprint.buildTool.name` | `tsc` |
| `{{ORM}}` | `fingerprint.database.orm` | `prisma` |
| `{{DATABASE}}` | `fingerprint.database.database` | `postgresql` |

**Example output** (from `templates/tools/typescript/type-check.ts`):

```typescript
// Auto-generated from tool-template: typescript/type-check.ts
// Project: my-app (TypeScript, Next.js)

import { execSync } from 'child_process'

export default {
  name: 'type-check',
  description: 'Run TypeScript type checking for my-app',
  handler: () => {
    execSync('npx tsc --noEmit', { stdio: 'inherit' })
  }
}
```

### 4. Fine-Grained Rules (from templates/rules)

When the recommendations include `fine_rules[]`, the composer generates granular rule files from the local template catalog at `~/.config/opencode/templates/rules/`:

```bash
RULE_TEMPLATES_DIR="$HOME/.config/opencode/templates/rules"
PROJECT_RULES_DIR="$PROJECT_DIR/.opencode/rules"
```

For each recommended fine_rule, the composer:
1. Reads the template file from `$RULE_TEMPLATES_DIR/{category}/{name}.md`
2. Replaces `{{PLACEHOLDERS}}` with values from the stack fingerprint
3. Writes the result to `$PROJECT_RULES_DIR/{category}-{name}.md`
4. Adds the rule to `opencode.jsonc` under `instructions`

**Example output** (from `templates/rules/framework/nextjs.md`):

```markdown
---
name: nextjs-conventions
description: Auto-generated Next.js framework conventions for my-app
tags: [nextjs, react, conventions, framework]
---

# Next.js Conventions

## App Router
- Use `app/` directory for routes (App Router detected)
- Server Components by default; add `'use client'` only when needed
- Route handlers in `app/api/` directory
- Layouts in `app/layout.tsx`, nested layouts in route groups
```

### 5. Agent Wrappers (only when gap is flagged)

If a gap in global resources is detected, the composer generates a minimal project-specific wrapper agent. For example, if no global rule exists for Prisma conventions:

```markdown
---
description: Project-specific Prisma schema review and database migration guidance
model: opencode/deepseek-v4-flash-free
mode: subagent
---
<Agent_Prompt>
  <Role>
    You are a database and Prisma specialist for this project.
  </Role>
  <Conventions>
    - Table names are singular: User, Post, Comment
    - All models have `id`, `createdAt`, `updatedAt`
    - Use `@default(autoincrement())` for primary keys
    - Relations use cascade delete by default
  </Conventions>
</Agent_Prompt>
```

## Workflow

### Step 0: Parse Flags

Check for `--minimal` flag: when present, generate only `opencode.jsonc` with `resource_tags` and `extends` — skip rules, tools, agents, and instructions. Produces a ~10-line config instead of a full scaffold. Use for quick project setup where per-project rules aren't needed yet.

### Step 1: Prepare Output Directory

```bash
PROJECT_DIR="."  # or specified path
mkdir -p "$PROJECT_DIR/.opencode/rules"
mkdir -p "$PROJECT_DIR/.opencode/tools"
mkdir -p "$PROJECT_DIR/.opencode/skills"
mkdir -p "$PROJECT_DIR/.opencode/agents"
mkdir -p "$PROJECT_DIR/.opencode/instructions"
```

> **Also copy/link archetype skills/ and tools/ into the project's `.opencode/`:**
> If an archetype was matched, copy its `skills/` and `tools/` directories into `.opencode/skills/` and `.opencode/tools/` respectively. These are needed by agents and rules that reference them — without their presence, per-project invocations will fail.

### Step 2: Generate opencode.jsonc

- Generate a standalone config with the valid keys listed above
- Do NOT include `extends` — it is NOT a valid config key (archetype manifests use it internally, project configs do not)
- Do NOT include `agents` (plural), `project`, `rules`, `state`, `context`, or `cache` — these are NOT valid config keys
- Do NOT overwrite existing `opencode.jsonc` without confirming with the user first
- If existing config found, prompt: "Existing .opencode/opencode.jsonc found. Merge recommendations, overwrite, or skip?"

### Step 2a: Validate opencode.jsonc against schema

After writing the config file, validate it against the actual OpenCode schema:

```bash
# Fetch the schema and validate all top-level keys
SCHEMA_URL="https://opencode.ai/config.json"
CONFIG_FILE=".opencode/opencode.jsonc"

# Extract top-level keys from the schema definition
VALID_KEYS=$(curl -s "$SCHEMA_URL" | python3 -c "
import json,sys
schema = json.load(sys.stdin)
# Navigate to Config definition
config = schema
if '\$defs' in schema and 'Config' in schema['\$defs']:
    config = schema['\$defs']['Config']
valid = list(config.get('properties', {}).keys())
print(' '.join(valid))
")

# Check config for invalid keys
python3 -c "
import json, re, sys
with open('$CONFIG_FILE') as f:
    raw = f.read()
# Strip comments
raw = re.sub(r'//.*', '', raw)
raw = re.sub(r'/\*[\s\S]*?\*/', '', raw)
config = json.loads(raw)
valid_keys = set('''$VALID_KEYS'''.split())
invalid = [k for k in config if k not in valid_keys]
if invalid:
    print(f'ERROR: Invalid config keys: {invalid}')
    print('Remove these keys. Valid keys: {\$schema, ' + ', '.join(sorted(valid_keys - {'\\\$schema'})) + '}')
    sys.exit(1)
else:
    print('OK: All keys valid')
"

# If validation fails, fix the config and re-validate before proceeding
```

### Step 3: Generate Convention Rules

For each detected technology, generate a brief conventions rule file:
- Language conventions (TypeScript strict mode, Python type hints, Rust clippy rules)
- Framework conventions (App Router patterns, Django MTV structure, Rails convention over configuration)
- Testing conventions (mocking strategy, test file placement, naming)
- Database conventions (migration workflow, naming, indexing strategy)
- CSS conventions (Tailwind class ordering, component styling approach)

### Step 3a: Generate Tools (from templates/tools)

If the recommendations include `tools[]`:

1. For each recommended tool, check if a matching template exists at `~/.config/opencode/templates/tools/{category}/{name}.ts`
2. Read the template, replace `{{PLACEHOLDERS}}` with fingerprint values
3. Write the result to `$PROJECT_DIR/.opencode/tools/{name}.ts`
4. Add a `tools` entry to `opencode.jsonc` referencing the generated file

If a tool template doesn't exist locally, suggest running `/init-project find-tools` to search registries.

### Step 3b: Generate Fine-Grained Rules (from templates/rules)

If the recommendations include `fine_rules[]`:

1. For each recommended fine_rule, check if a matching template exists at `~/.config/opencode/templates/rules/{category}/{name}.md`
2. Read the template, replace `{{PLACEHOLDERS}}` with fingerprint values
3. Write the result to `$PROJECT_DIR/.opencode/rules/{category}-{name}.md`
4. Add the rule to `opencode.jsonc` under `instructions`

If a rule template doesn't exist locally, suggest running `/init-project find-rules` to search registries.

### Step 4: Generate Agent Wrappers (if gaps)

For each identified gap, create a minimal agent that fills the missing capability.

### Step 5: Report Results

```markdown
## Generated .opencode/ Configuration

### Files Created
- `.opencode/opencode.jsonc` — Project config (extends archetype/standalone)
- `.opencode/rules/project-conventions.md` — Stack-specific conventions
- `.opencode/rules/project-testing.md` — Testing guidelines
- `.opencode/tools/{n}.ts` — N project-specific TypeScript tools (from templates/tools)
- `.opencode/rules/{category}-{name}.md` — M fine-grained convention rules (from templates/rules)
- `.opencode/skills/` — Copied/linked from archetype skills/ directory
- `.opencode/tools/` — Copied/linked from archetype tools/ directory

### Recommendations Applied
- ✅ 3 skills activated via resource_tags
- ✅ 2 agents available for subdelegation
- ✅ 1 archetype matched (nextjs-webapp)
- ✅ N tools generated from templates/tools
- ✅ M fine-grained rules generated from templates/rules

### Gaps Identified
- ⚠️ No global skill for Next.js App Router → created project agent wrapper
- ⚠️ No global rule for Prisma conventions → added to project rules
- ⚠️ No tool template for {missing_tool} → suggest `/init-project find-tools`
- ⚠️ No rule template for {missing_rule} → suggest `/init-project find-rules`

### Next Steps
1. Review generated files and customize as needed
2. Run `/project commit` to commit initial config
3. Start using OpenCode with stack-aware defaults
```

## Integration

### Via init-project provision flow

```
@stack-detector → stack-recommender → project-config-composer → .opencode/ output
```

### Via direct invocation

```bash
/init-project provision
# Automatically: detect → recommend → compose
```

### Via natural language

User says "Set up a Next.js project with Prisma" → `@stack-detector` produces
a synthetic fingerprint → `stack-recommender` maps resources → `project-config-composer`
generates the config — all in one pipeline.

## Safety

- Never overwrite existing `.opencode/agents/` or `.opencode/rules/` files without user confirmation
- Before any file write, check if the target exists and offer merge/overwrite/skip
- Generated rules are *suggestions* — they should guide, not enforce
- Always output a `.opencode/instructions/README.md` that explains what was generated and how to customize
