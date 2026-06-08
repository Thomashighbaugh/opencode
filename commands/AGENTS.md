<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-05-01 | Updated: 2026-05-01 -->

# commands

## Purpose
Custom slash commands for the OpenCode Hubs system. These `.md` files define user-invocable commands that trigger specific workflows.

## Key Files

| File | Description |
|------|-------------|
| `skill.md` | Base command for skill invocation routing |

## For AI Agents

### Working In This Directory
- Each command is a `.md` file with frontmatter specifying trigger, description, and arguments
- Commands are auto-discovered by the OpenCode runtime
- Use the `opencode-command-creator` skill to create new commands
- Command files may reference `$ARGUMENTS` for parameter passing

### Testing Requirements
- Verify commands appear in `/help` output
- Test argument parsing with sample invocations
- Ensure commands follow the shell non-interactive strategy

### Common Patterns
- YAML frontmatter with `trigger`, `description`, `args` fields
- Markdown body contains execution workflow instructions

## Dependencies

### Internal
- `skills/` — Commands often delegate to skills
- `tools/` — Commands may invoke TypeScript tools

### External
- OpenCode command system — auto-loads `.md` files as slash commands

## Subdirectories

| Directory | Purpose |
|-----------|---------|
| _(none)_ | This is a flat directory |

<!-- MANUAL: -->
