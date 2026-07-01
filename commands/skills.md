---
description: Manage OpenCode skills - list, add, remove, edit, search, create, update, package, validate, sync, setup, scan
argument-hint: "<subcommand> [args]"
---

# Skill Manager

This command delegates to the `/skills` hub. Use the hub directly for all skill operations:

## Subcommands

All skill operations route through `/skills <subcommand>`:

| Subcommand | Purpose |
|------------|---------|
| `/skills list` | List all skills by scope (built-in, user, project) |
| `/skills add` | Quick-add a skill via interactive wizard |
| `/skills create` | Full skill creation workflow with bundled resources |
| `/skills remove` | Delete a skill by name (with confirmation) |
| `/skills edit` | Edit skill metadata or content interactively |
| `/skills search` | Search skills by name, triggers, or content |
| `/skills info` | Show full skill details and content |
| `/skills update` | Update a skill via skill-creator iteration workflow |
| `/skills package` | Validate and package a skill for distribution |
| `/skills validate` | Validate a skill's structure without packaging |
| `/skills sync` | Sync skills between user and project scopes |
| `/skills setup` | Interactive setup wizard for skill directories |
| `/skills scan` | Quick non-interactive inventory scan of skill directories |

## Usage

Invoke the hub directly:

```
/skills list
/skills create
/skills search "authentication"
```

For full subcommand descriptions and workflow details, use `/skills <subcommand>` — the hub router returns the complete spec for each subcommand.

## Scope

Skills exist in three scopes:
- **Built-in** (`~/.config/opencode/skills/`): bundled, read-only
- **User** (`~/.config/opencode/skills/omc-learned/`): user-created or installed
- **Project** (`.opencode/state/skills/`): project-specific