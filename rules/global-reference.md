# Global Config Reference

**Purpose:** Single authoritative reference for the OpenCode Hubs global configuration structure. Agents modifying the global config MUST consult this rule before creating or modifying files.

## Directory Layout

```
~/.config/opencode/
├── opencode.jsonc        # Main configuration (providers, plugins, instructions, permissions, MCP)
├── AGENTS.md             # This file — root instructions, agent catalog, available skills
├── agents/               # Agent definitions (30 agents)
│   ├── hubs.md           # Primary agent (mode: primary)
│   ├── executor.md       # Subagents (mode: subagent)
│   ├── architect.md
│   └── ...                # 30 total
├── skills/               # Reusable workflow skills (99 skills)
│   ├── provision/
│   │   └── SKILL.md      # Entry point with YAML frontmatter
│   ├── ralph/
│   │   └── SKILL.md
│   └── ...                # 99 total
├── tools/                # TypeScript tools (19 tools — including the 5 new file-editing tools)
│   ├── regex-edit.ts
│   ├── json-edit.ts
│   ├── yaml-edit.ts
│   ├── conf-edit.ts
│   ├── multi-edit.ts
│   ├── hubMenu.ts
│   └── ...                # 19 total
├── commands/             # Slash command definitions
│   └── *.md
├── plugins/              # Hook system plugins and TUI plugins
│   ├── hooks/hooks.ts
│   └── hubs-tui/
├── rules/                # Shared agent instructions (loaded via opencode.jsonc)
│   ├── shell_strategy.md
│   ├── context-strategy.md
│   ├── karpathy-guidelines.md
│   └── ...                # 15 total rules
├── archetypes/           # Project archetype templates for /init-project
│   ├── bare-bones/
│   ├── nextjs-webapp/
│   └── ...                # 8 archetypes
│   └── each archetype has: agents/, rules/, skills/, tools/
│      # agents/ and rules/ → referenced in opencode.jsonc (agent + instructions keys)
│      # skills/ and tools/ → copied/linked into project's .opencode/ directory
├── templates/            # File templates
│   ├── agent-template.md  # Agent definition template
│   ├── context-template.md # Context document template
│   ├── rules/             # Rule generation templates
│   │   ├── api/
│   │   ├── testing/
│   │   └── ...             # 8 categories
│   ├── tools/             # Tool creation templates
│   └── reasoning/         # CoT reasoning templates
```

## File Format Requirements

### Agent Files (`agents/<name>.md`)

```yaml
---
description: <one-line trigger description — when to use this agent>
model: opencode/deepseek-v4-flash-free   # from the model tier table
mode: subagent                            # or "primary" (only hubs.md)
permission:
  bash: ask                               # or "allow" / "deny"
  write: allow                            # or "ask" / "deny"
  edit: allow                             # or "ask" / "deny"
tags: [tag1, tag2]                        # from resource-tags.md vocabulary
---
<Agent_Prompt>
  <Role>
    ...agent instructions...
  </Role>
</Agent_Prompt>
```

**Rules:**
- `description` MUST include trigger context ("Use when...")
- `mode` is `subagent` for all agents except `hubs.md` (which is `primary`)
- Tags MUST come from the `resource-tags.md` vocabulary
- The `<Agent_Prompt>` XML wrapper is required for agent-format-enforcer compliance

### Skill Files (`skills/<name>/SKILL.md`)

```yaml
---
name: <skill-name>
description: <one-line description — when to use, what it does>
level: <1-5>                              # complexity level
tags: [tag1, tag2]                        # from resource-tags.md vocabulary
---
```

**Rules:**
- `SKILL.md` is the entry point — the skill directory MUST contain it
- Optional subdirectories: `scripts/`, `references/`, `templates/`, `tests/`
- Description MUST use the format: "{action verb} {what it does} — {buzzwords}"

### Tool Files (`tools/<name>.ts`)

```typescript
import { tool } from "@opencode-ai/plugin"

export default tool({
  description: "...",
  args: { ... },
  async execute(args, context) { ... }
})
```

**Rules:**
- Uses `@opencode-ai/plugin` SDK
- Each tool exports a default tool definition
- Tools are auto-discovered by OpenCode from this directory
- Import external deps from the project's `node_modules/`

### Rule Files (`rules/<name>.md`)

**Rules:**
- Markdown with actionable format (lists, tables, BAD/GOOD patterns)
- Tags in frontmatter (optional but recommended for resource filtering)
- MUST NOT conflict with `shell_strategy.md` (non-interactive mode)
- Should use progressive disclosure — reference other rules where appropriate

### Command Files (`commands/<name>.md`)

Markdown files with frontmatter defining the trigger and description. Follow the pattern in existing commands.

## Naming Conventions

| Resource  | Convention                        | Example                          |
| --------- | --------------------------------- | -------------------------------- |
| Agents    | kebab-case, descriptive noun      | `config-orchestrator.md`, `stack-detector.md` |
| Skills    | kebab-case, short action noun     | `provision/`, `deep-interview/`, `ai-slop-cleaner/` |
| Tools     | kebab-case, noun with hyphens     | `regex-edit.ts`, `json-edit.ts`, `hubMenu.ts` |
| Rules     | kebab-case, descriptive           | `artifact-placement.md`, `shell_strategy.md` |
| Commands  | lowercase, no special chars       | `create-tests.md`, `git-stage-thread.md` |
| Archetypes | kebab-case                        | `nextjs-webapp/`, `cli-tool/` |

## Config Registration

| Resource          | How It's Registered                                    |
| ----------------- | ------------------------------------------------------ |
| `opencode.jsonc`  | Root config file — no registration needed              |
| Agents            | Auto-discovered from `agents/` directory               |
| Skills            | Auto-discovered from `skills/` directory               |
| Tools             | Auto-discovered from `tools/` directory                |
| Rules             | Registered in `opencode.jsonc` `instructions` array     |
| Commands          | Registered in `opencode.jsonc` or auto-discovered      |
| Plugins           | Registered in `opencode.jsonc` `plugin` array           |
| MCP Servers       | Registered in `opencode.jsonc` `mcp` object             |
| Archetypes        | Referenced by `/init-project` — registered in `opencode.jsonc` if needed |

## Permission Convention

- **Global config files** (opencode.jsonc, core rules): `write: allow` for `config-orchestrator`, `ask` for other agents
- **Skill files**: `write: allow` for `skill-creator` agent, `ask` for others
- **Agent files**: `write: allow` for agents designed for config work
- **Project files** (`.opencode/`): `write: allow` for all agents working in project context

## Related Rules

- `artifact-placement.md` — where generated artifacts go (no root-level scripts)
- `resource-tags.md` — tagging vocabulary for all resources
- `hub-state.md` — state path conventions for session data
