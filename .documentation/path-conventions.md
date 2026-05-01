# Path Conventions

> Complete reference for JOC file and directory conventions

## Table of Contents

- [Overview](#overview)
- [User-wide Configuration](#user-wide-configuration)
- [Project-level Configuration](#project-level-configuration)
- [State Directory](#state-directory)
- [Search Order](#search-order)
- [Configuration Files](#configuration-files)
- [Environment Variables](#environment-variables)
- [Best Practices](#best-practices)

## Overview

JOC uses a hierarchical configuration system with two main locations:

| Location | Path | Purpose |
|----------|------|---------|
| **User-wide** | `~/.config/opencode/` | Shared across all projects |
| **Project-level** | `./.opencode/` | Project-specific configuration |
| **State** | `./.opencode/state/` | Session data (gitignored) |

## User-wide Configuration

### Location

```
~/.config/opencode/
├── opencode.jsonc           # Global settings
├── AGENTS.md                 # Global agent instructions
├── agent/                    # Shared agents
│   ├── executor.md
│   ├── architect.md
│   └── ...
├── skills/                   # Shared skills
│   ├── autopilot/SKILL.md
│   ├── ralph/SKILL.md
│   └── ...
├── commands/                 # Shared commands
│   ├── commit.md
│   ├── pr.md
│   └── ...
├── tools/                    # Shared tools
│   ├── loadSkill.ts
│   └── ...
├── plugins/                  # Shared plugins
│   └── my-plugin.ts
└── rules/                    # Shared rules
    └── coding-standards.md
```

### When to Use User-wide

Use user-wide configuration for:
- Agents you use in all projects
- Skills you use frequently
- Personal preferences and settings
- Shared commands
- Global tool configurations

### Example: Global Agent

```markdown
<!-- ~/.config/opencode/agent/my-global-agent.md -->
---
name: my-global-agent
description: Agent I use everywhere
model: ollama/glm-5.1:cloud
mode: subagent
---

## Purpose
This agent is available in all my projects.
```

### Environment Variable Override

```bash
# Override global config location
export OPENCODE_CONFIG_DIR="$HOME/.opencode-config"
```

## Project-level Configuration

### Location

```
./.opencode/
├── opencode.jsonc           # Project settings
├── AGENTS.md                 # Project instructions
├── agent/                    # Project agents
│   ├── project-specific.md
│   └── ...
├── skills/                   # Project skills
│   ├── project-workflow/SKILL.md
│   └── ...
├── commands/                 # Project commands
│   ├── build-project.md
│   └── ...
├── tools/                    # Project tools
│   ├── project-tool.ts
│   └── ...
├── plugins/                  # Project plugins
│   └── project-plugin.ts
├── rules/                    # Project rules
│   └── project-conventions.md
└── state/                    # Session state (gitignored)
    ├── ralph-state.json
    ├── todos.json
    └── ...
```

### When to Use Project-level

Use project configuration for:
- Project-specific agents
- Project-specific skills
- Project-specific commands
- Project overrides
- Project state

### Example: Project Agent

```markdown
<!-- .opencode/agent/project-specific.md -->
---
name: project-building-agent
description: Agent specific to this project's build system
model: ollama/glm-5.1:cloud
mode: subagent
---

## Purpose
This agent knows the specific build system of this project.

## Project Context
- Build system: Custom webpack
- Test framework: Jest with custom matcher
- Deployment: Kubernetes
```

## State Directory

### Location

```
./.opencode/state/
├── ralph-state.json          # Ralph mode state
├── autopilot-state.json       # Autopilot mode state
├── ultrawork-state.json       # Ultrawork mode state
├── team-state.json            # Team coordination state
├── ultraqa-state.json          # QA cycling state
├── todos.json                  # Task list state
├── project-memory.json         # Cross-session knowledge
├── notepad.md                  # Session notes
├── plans/                      # Planning documents
│   └── sprint-5.md
├── logs/                       # Audit logs
│   └── 2025-04-18.log
└── artifacts/                  # Skill outputs
    ├── autopilot/
    │   └── session-abc/
    └── planning/
        └── session-def/
```

### Gitignore

State should be gitignored:

```gitignore
# .gitignore
.opencode/state/
```

### What's Stored in State

| File | Purpose |
|------|---------|
| `*-state.json` | Mode state (iteration, status, etc.) |
| `todos.json` | Task list |
| `project-memory.json` | Project knowledge (tech stack, notes) |
| `notepad.md` | Session notes |
| `plans/` | Planning documents |
| `logs/` | Audit logs |
| `artifacts/` | Skill outputs |

## Search Order

When looking for configuration, JOC searches:

```
1. Project-level: ./.opencode/
2. User-wide:     ~/.config/opencode/
```

### Example: Loading an Agent

```
User invokes: my-agent

Search order:
1. ./.opencode/agent/my-agent.md
2. ~/.config/opencode/agent/my-agent.md
   (if not found in project)
```

### Example: Loading a Skill

```
User invokes: /autopilot

Search order:
1. ./.opencode/skills/autopilot/SKILL.md
2. ~/.config/opencode/skills/autopilot/SKILL.md
```

### Override Behavior

Project-level configurations **override** user-wide:

```typescript
// Configuration merge
const config = {
  ...userWideConfig,    // Base configuration
  ...projectConfig,     // Overrides
  skills: [
    ...projectSkills,   // Project skills first
    ...userWideSkills   // Then user-wide
  ]
}
```

## Configuration Files

### opencode.jsonc

Main configuration file with JSON5 syntax (comments allowed).

**Project-level:**
```jsonc
{
  "$schema": "https://opencode.ai/config.json",
  "provider": {
    "ollama": {
      "models": {
        "glm-5.1:cloud": { "_launch": true }
      }
    }
  },
  "tools": {
    "loadSkill": "./tools/loadSkill.ts"
  },
  "plugin": [
    "./plugins/project-plugin.ts"
  ],
  "instructions": ["AGENTS.md"],
  "skills": { "paths": ["./skills"] },
  "agents": { "paths": ["./agent"] },
  "commands": { "paths": ["./commands"] }
}
```

**User-wide:**
```jsonc
{
  "provider": {
    "ollama": {
      "models": {
        "glm-5.1:cloud": { "_launch": true },
        "kimi-k2.5:cloud": { "_launch": true }
      }
    }
  },
  "skills": { "paths": ["./skills"] },
  "agents": { "paths": ["./agent"] },
  "commands": { "paths": ["./commands"] }
}
```

### AGENTS.md

Agent instructions file with markdown syntax.

```markdown
# Project Instructions

## Tech Stack
- TypeScript 5.7
- React 19
- Next.js 15

## Coding Standards
- Use const assertions for readonly arrays
- Prefer named exports
- Use Zod for runtime validation

## Project-Specific Rules
- All API routes use /api/v2/ prefix
- Tests go in __tests__ directory
- Use custom hooks for data fetching
```

### tsconfig.json

For custom tools:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true
  },
  "include": ["./tools/**/*"],
  "exclude": ["node_modules"]
}
```

## Environment Variables

### Available Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `OPENCODE_CONFIG_DIR` | `~/.config/opencode` | Global config directory |
| `OMC_QUIET` | `0` | Quiet mode (0-2) |
| `OLLAMA_HOST` | (ollama default) | Ollama API host |
| `OLLAMA_API_KEY` | (none) | Ollama API key |

### Usage Examples

```bash
# Custom config directory
export OPENCODE_CONFIG_DIR="$HOME/.opencode-config"

# Quiet mode (suppress non-essential output)
export OMC_QUIET=1

# More quiet (suppress more output)
export OMC_QUIET=2

# Custom Ollama host
export OLLAMA_HOST="https://api.ollama.ai"
export OLLAMA_API_KEY="your-key"
```

### In opencode.jsonc

```jsonc
{
  "provider": {
    "ollama": {
      "models": {
        "glm-5.1:cloud": {
          "_launch": true,
          "env": {
            "OLLAMA_HOST": "${OLLAMA_HOST}",
            "OLLAMA_API_KEY": "${OLLAMA_API_KEY}"
          }
        }
      }
    }
  }
}
```

## Best Practices

### Project Structure

```
my-project/
├── .opencode/
│   ├── opencode.jsonc        # Project config
│   ├── AGENTS.md              # Project instructions
│   ├── agent/                 # Project agents
│   ├── skills/                # Project skills
│   ├── commands/              # Project commands
│   ├── state/                 # (gitignored)
│   └── .gitignore             # Ignore state/
├── .gitignore                 # Also ignore state/
└── ... (project files)
```

### .gitignore

```gitignore
# .opencode/.gitignore
state/

# Keep config
!.opencode.jsonc
!AGENTS.md
!agent/
!skills/
!commands/
!tools/
!rules/
!plugins/
!templates/
```

### Shared vs Project-specific

| Type | Shared (User-wide) | Project-specific |
|------|-------------------|------------------|
| Common agents | ✅ | - |
| Project agents | - | ✅ |
| Common skills | ✅ | - |
| Project skills | - | ✅ |
| Global settings | ✅ | - |
| Project overrides | - | ✅ |
| State | - | ✅ |

### Configuration Inheritance

```
User-wide config:
├── Base provider settings
├── Common agents
├── Common skills
└── Common commands

Project config:
├── Provider overrides (merges with user-wide)
├── Project-specific agents (adds to user-wide)
├── Project-specific skills (adds to user-wide)
├── Project-specific commands (adds to user-wide)
└── Project state (not inherited)
```

## See Also

- [Installation](./installation.md) - Setting up configuration
- [Agents](./agents.md) - Agent configuration
- [Skills](./skills.md) - Skill configuration
- [Tools](./tools.md) - Tool configuration