---
name: opencode-configure
description: Manage all OpenCode configuration surfaces — opencode.jsonc, agents, skills, commands, tools, plugins, rules, MCP, and project-scoped .opencode/ config. Use when adding, modifying, validating, or inspecting any part of the config stack.
level: 3
license: MIT
---

# OpenCode Configure

Manage every surface of the OpenCode configuration stack. From model providers and MCP servers to agent definitions, skills, commands, tools, plugins, rules, and project-scoped `.opencode/` settings.

## When to Use

- User asks "configure X" (agent, skill, command, tool, plugin, MCP, model, permission)
- User asks "add a new model/provider", "change default model", "add MCP server"
- User asks "fix my config" or "validate configuration"
- User asks to inspect or audit the current config state
- User wants to set up project-scoped `.opencode/` config
- User reports config-related errors (plugins not loading, MCP not connecting, skills not found, instructions not applying)

## Configuration Surface

OpenCode has 8 config surfaces. The skill can manage all of them:

| # | Surface | Global Path | Project Path | Purpose |
|---|---------|-------------|--------------|---------|
| 1 | **Main config** | `~/.config/opencode/opencode.jsonc` | `.opencode/opencode.json` | Models, providers, plugins, MCP, permissions, instructions |
| 2 | **Agents** | `~/.config/opencode/agents/*.md` | `.opencode/agents/*.md` | Agent definitions (primary + subagent) |
| 3 | **Skills** | `~/.config/opencode/skills/*/SKILL.md` | `.opencode/skills/*/SKILL.md` | Reusable knowledge packages |
| 4 | **Commands** | `~/.config/opencode/commands/*.md` | `.opencode/commands/*.md` | Slash commands |
| 5 | **Tools** | `~/.config/opencode/tools/*.ts` | — | TypeScript tool implementations |
| 6 | **Plugins** | `~/.config/opencode/plugins/*.ts` | — | Hook plugins + TUI plugins |
| 7 | **Rules** | `~/.config/opencode/rules/*.md` | `.opencode/rules/*.md` | Agent instruction files |
| 8 | **Instructions** | `AGENTS.md` | `.opencode/AGENTS.md` | Root instruction entry points |

The `OPENCODE_CONFIG_DIR` env var overrides the global path. Default: `~/.config/opencode/`.

## Workflow

### Step 1: Identify the Surface

Ask: "What part of the config do you want to manage?"

| User says... | → Surface | → Route to |
|-------------|-----------|------------|
| "add a model/provider" | Main config | Step 2 |
| "add MCP server" | MCP config | `mcp-setup` skill |
| "create/modify an agent" | Agents | `opencode-agent-creator` skill |
| "create a skill" | Skills | `skill-creator` skill |
| "create a command" | Commands | `opencode-command-creator` skill |
| "create a plugin" | Plugins | `opencode-plugin-creator` skill |
| "add a rule/convention" | Rules | Inline rule creation |
| "project-scoped config" | `.opencode/` | Step 2 |
| "fix config" / "validate" | Any/all | Run Step 4 (Validate) |

If the user's request maps neatly to an existing creator skill, **delegate to it**. This skill handles holistic concerns (validation, inspection, cross-surface integration, project setup).

### Step 2: Read Existing Config

Always read the current state before proposing changes:

**Main config:**
```json
// opencode.jsonc structure:
{
  "$schema": "https://opencode.ai/config.json",
  "model": "provider/model-id",
  "default_agent": "agent-name",
  "provider": {
    "provider-name": {
      "name": "Display Name",
      "npm": "@ai-sdk/openai-compatible",
      "options": { "baseURL": "..." },
      "models": { "model-id": { "name": "...", "limit": { "context": N, "output": N } } }
    }
  },
  "permission": { "edit": { "pattern": "allow" } },
  "mcp": { "server-name": { "type": "remote|local", "url": "...", "enabled": true } },
  "plugin": [ "./plugins/*.ts", "@npm/package" ],
  "instructions": [ "AGENTS.md", "./rules/*" ]
}
```

**Agents dir:**
```bash
ls ~/.config/opencode/agents/*.md
```

**Skills dir:**
```bash
ls ~/.config/opencode/skills/*/SKILL.md
```

**Project `.opencode/`:**
```bash
ls .opencode/ 2>/dev/null
ls .opencode/state/ 2>/dev/null
ls .opencode/context/ 2>/dev/null
```

### Step 3: Plan Changes

Minimal, safe adjustments. Follow the **Principle of Least Change** — only modify what's needed to enable the user's goal. Prefer adding new entries over modifying existing ones.

For destructive changes (removing a model, deleting a skill, commenting out a plugin), confirm with the user first.

### Step 4: Validate

After changes, run the validation checklist:

```
┌────────────────────────────────────────────────────────────┐
│                   Validation Checklist                      │
├────────────────────────────────────────────────────────────┤
│ ☐ opencode.jsonc is valid JSONC (no trailing commas,       │
│     comments OK in JSONC but not JSON)                     │
│ ☐ opencode.jsonc references exist (plugin paths,           │
│     instruction files, MCP servers)                        │
│ ☐ All agents have valid YAML frontmatter with required     │
│     fields (description, mode, permission)                 │
│ ☐ Agent descriptions include trigger context               │
│ ☐ All skills have valid YAML frontmatter (name,            │
│     description)                                           │
│ ☐ Skill names match their directory names                  │
│ ☐ All commands have valid YAML frontmatter                 │
│ ☐ All tools import from @opencode-ai/plugin correctly      │
│ ☐ Plugin paths resolve to actual files                     │
│ ☐ Plugin .ts files export default plugin                   │
│ ☐ MCP configs have required fields (type, url/command,     │
│     enabled)                                               │
│ ☐ MCP headers reference valid env vars                     │
│ ☐ Model IDs in provider configs are referenced correctly   │
│ ☐ Instructions paths resolve to actual files               │
│ ☐ No duplicated plugin entries                             │
│ ☐ No dangling agent/skill/command references               │
│ ☐ .gitignore covers .opencode/state/ and .vector/          │
│ ☐ Permission patterns are valid globs                      │
└────────────────────────────────────────────────────────────┘
```

**Validation command examples:**
```bash
# JSONC syntax check
node -e "JSON.parse(require('fs').readFileSync('opencode.jsonc','utf-8')
  .replace(/\/\/.*$/gm,'').replace(/\/\*[\s\S]*?\*\//g,''))" && echo "Valid JSONC"

# Plugin path existence
for p in $(node -e "const c=JSON.parse(require('fs').readFileSync('opencode.jsonc','utf-8')
  .replace(/\/\/.*$/gm,'').replace(/\/\*[\s\S]*?\*\//g,''));c.plugin.forEach(p=>console.log(p))"); do
  [ -f "$p" ] && echo "✓ $p" || echo "✗ $p NOT FOUND"
done

# Agent frontmatter check
for f in agents/*.md; do
  head -1 "$f" | grep -q "^---" && echo "✓ $f has frontmatter" || echo "✗ $f missing frontmatter"
done
```

### Step 5: Apply Changes

Modify or create config files. For changes to `opencode.jsonc`, use the `Edit` tool to make surgical changes — never rewrite the entire file.

**Key patterns:**

Add a new model:
```jsonc
"my-model": {
  "name": "my-model",
  "limit": { "context": 131072, "output": 32768 }
}
```

Register a plugin:
```jsonc
"plugin": [
  // ...existing plugins...
  "./plugins/my-new-plugin.ts",
]
```

Add an MCP server:
```jsonc
"mcp": {
  // ...existing MCP...
  "my-server": {
    "type": "remote",
    "url": "https://mcp.example.com/mcp",
    "headers": { "API_KEY": "{env:MY_API_KEY}" },
    "enabled": true
  }
}
```

### Step 6: Report

Always include in the response:
- What was modified/created
- Why it enables the user's goal
- How elements now work together
- Any manual steps needed (restart session, install npm deps, add env vars)

## Surface-Specific Guides

### Main Config (opencode.jsonc)

The main config is JSONC (JSON with Comments). Key sections:

| Section | Required Fields | Notes |
|---------|----------------|-------|
| `model` | Provider/model ID string | Default model for new sessions |
| `default_agent` | Agent name | Default agent for new sessions |
| `provider` | Provider objects with `name`, `npm`, `models` | Each provider must have at least one model |
| `provider[].options.baseURL` | URL string | API endpoint for compatible providers |
| `provider[].models[].limit` | `{context, output}` | Context/output token limits |
| `permission.edit` | Glob patterns with "allow"/"ask"/"deny" | File permission rules |
| `mcp` | Server objects with `type`, `url`/`command`, `enabled` | MCP server configurations |
| `plugin` | Array of path strings or npm package references | Plugin registrations |
| `instructions` | Array of path globs | Agent instruction files |

**Adding a new OpenAI-compatible provider:**
1. Add provider entry under `"provider"`
2. Add model entries under `provider.models`
3. Optionally set as `"model"` default

**Adding a new plugin:**
1. Create the plugin file in `plugins/`
2. Add path reference to `"plugin"` array
3. Restart session to load

### Agent Surface

Agents are markdown files with YAML frontmatter. See `opencode-agent-creator` skill for full details.

Required frontmatter fields:
```yaml
---
description: What this agent does (include trigger context)
mode: primary | subagent | all
permission:
  bash: ask | allow | deny
  write: ask | allow | deny
  edit: ask | allow | deny
---
```

### Skill Surface

Skills are directories with `SKILL.md`. See `skill-creator` skill for full details.

Required:
```
skill-name/SKILL.md  (with YAML frontmatter: name, description)
```

Optional:
```
skill-name/{scripts/, references/, assets/}
```

### Command Surface

Commands are markdown files. See `opencode-command-creator` skill for details.

```markdown
---
description: Brief description of command
agent: agent-name (optional)
model: model-identifier (optional)
---

Command template with $ARGUMENTS placeholder.
```

### Tool Surface

Tools are TypeScript files using the `@opencode-ai/plugin` SDK:

```typescript
import { tool } from "@opencode-ai/plugin"

export default tool({
  description: "...",
  args: {
    param: tool.schema.string().describe("...")
  },
  async execute(args, ctx) { /* ... */ }
})
```

Tools are registered in `opencode.jsonc` via the `tool` export — they're auto-discovered from the `tools/` directory by OpenCode.

### Plugin Surface

Plugins are TypeScript files using the `@opencode-ai/plugin` SDK:

```typescript
import type { Plugin } from "@opencode-ai/plugin"

const plugin: Plugin = {
  async setup(client, { directory }) {
    const hooks = {}
    // Register hooks...
    return hooks
  }
}

export default plugin
```

See `opencode-plugin-creator` skill for full details on hook plugins and TUI plugins.

### Rule Surface

Rules are markdown files in `rules/`. They're loaded as agent instructions via `opencode.jsonc`:

```jsonc
"instructions": [ "AGENTS.md", "./rules/*" ]
```

Each rule file should cover one convention or constraint with examples.

### Project .opencode/ Surface

Project-scoped config mirrors global config but lives in `.opencode/` at the project root:

| Global | Project | Notes |
|--------|---------|-------|
| `~/.config/opencode/opencode.jsonc` | `.opencode/opencode.json` | Overrides global settings |
| `~/.config/opencode/agents/` | `.opencode/agents/` | Project-specific agents |
| `~/.config/opencode/skills/` | `.opencode/skills/` | Project-specific skills |
| `~/.config/opencode/commands/` | `.opencode/commands/` | Project-specific commands |
| — | `.opencode/context/` | Durable knowledge (committed) |
| — | `.opencode/state/` | Session state (gitignored) |
| — | `.opencode/AGENTS.md` | Project instructions |
| — | `.opencode/rules/` | Project rules |
| — | `.opencode/.gitignore` | Ignores state/, node_modules/, .vector/ |

## Common Scenarios

| Scenario | Approach |
|----------|----------|
| "Add new model/provider" | Add provider entry + model entries in opencode.jsonc |
| "Set default model" | Change `model` field in opencode.jsonc |
| "Add MCP server" | Use `mcp-setup` skill or add entry to `mcp` section |
| "Register plugin" | Add path to `plugin` array in opencode.jsonc |
| "Fix plugin not loading" | Validate path exists, check export default, restart session |
| "Add a project rule" | Create `.opencode/rules/{name}.md`, verify instructions path |
| "Add project agent" | Create `.opencode/agents/{name}.md` |
| "Add project skill" | Create `.opencode/skills/{name}/SKILL.md` |
| "Init project .opencode/" | Create `.opencode/` directory structure, `.gitignore`, context dirs |
| "Audit/inspect config" | Read all surfaces, report counts and issues |
| "Validate everything" | Run validation checklist across all surfaces |

## Config vs Context Separation

```
.opencode/
├── .gitignore            # State, node_modules, .vector ignored
├── AGENTS.md             # Project instructions (committed)
├── opencode.json         # Project-scoped config overrides (committed)
│
├── context/              # Durable knowledge (committed)
│   ├── decisions.md      # ADRs
│   ├── theory.md         # Living documentation
│   ├── frameworks/       # Architecture patterns
│   ├── patterns/         # Discovered patterns
│   └── research/         # Web-extracted docs
│
├── rules/                # Project rules (committed)
│   └── *.md
│
├── agents/               # Project agents (committed)
├── skills/               # Project skills (committed)
├── commands/             # Project commands (committed)
│
└── state/                # Session state (gitignored)
    ├── project-memory.json
    ├── sessions/
    ├── ideation/
    ├── orchestration/
    └── harvest/
```

## Error Handling

| Situation | Behavior |
|-----------|----------|
| Malformed JSONC | Parse error with line number, suggest fix |
| Missing file reference | Report which path doesn't exist |
| Duplicate entry | Flag the duplicate, ask how to resolve |
| Permission config typo | Report invalid glob pattern |
| MCP server not connecting | Check URL, API key env var, enabled flag |
| Plugin crash on load | Validate export default, check syntax |

## Related

- `opencode-agent-creator` skill — Deep agent creation guide
- `skill-creator` skill — Deep skill creation guide  
- `opencode-command-creator` skill — Deep command creation guide
- `opencode-plugin-creator` skill — Deep plugin creation guide
- `mcp-setup` skill — MCP server configuration
- `config-orchestrator` agent — Companion subagent for config work
