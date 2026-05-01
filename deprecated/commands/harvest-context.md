---
description: "Context and artifact hub — extract, generate, and manage project context from sessions, codebase, and libraries"
invoke: harvest-context
argument-hint: "[session|codebase|skill|agent|rule|command|memory|docs|decompose|context] [description]"
---

# Harvest Context

Unified entry point for extracting, generating, and managing project context. Capture learnings, generate documentation, decompose concepts, and create new project resources.

## Behavior

### With Arguments

Directly invoke the matching subcommand. Skip the menu.

### Without Arguments

Present the menu immediately — NO inference needed:

| Selection | Delegates To | What It Does |
|-----------|-------------|--------------|
| `session` | self (inline) | Extract decisions, patterns, learnings from current session |
| `codebase` | deepinit | Generate hierarchical AGENTS.md across the codebase |
| `skill` | skill-creator | Create a reusable skill from session knowledge |
| `agent` | opencode-agent-creator | Create a project-specific agent |
| `rule` | self (inline) | Create a project rule in .opencode/rules/ |
| `command` | opencode-command-creator | Create a project slash command |
| `memory` | remember + wiki | Promote durable knowledge to memory, notepad, or wiki |
| `docs` | context7 MCP | Fetch official library documentation for any package |
| `decompose` | planner agent | Break down concepts, problems, or goals into smaller units |
| `context` | self (inline) | Manage context files — harvest, extract, organize, compact, map |

## Task

Invoke the `harvest-context` skill with: `$ARGUMENTS`