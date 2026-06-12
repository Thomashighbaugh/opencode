<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-05-01 | Updated: 2026-05-01 -->

# .opencode

## Purpose
Durable knowledge store for the global OpenCode Hubs configuration. Since `~/.config/opencode/` **is** the global config directory, the `.opencode/` subdirectory here does NOT duplicate config files (opencode.json, package.json, tui.json) — those live at root. Instead, `.opencode/` hosts:
- Durable context and research artifacts that compound across sessions
- Auto-generated changelogs from hub operations
- Vector search index for context retrieval
- Session state (gitignored)

## Key Files

| File | Description |
|------|-------------|
| `CHANGELOG.md` | Auto-generated commit log from hub operations |
| `AGENTS.md` | Instructions for this durable knowledge directory |
| `.gitignore` | Git ignore rules for state and generated files |

## Critical Instruction: README Maintenance

**Any modification that changes how the user interacts with the project, alters configuration structure or location, adds or removes subcommands from hub menus, introduces new agents/skills/tools/commands that change the capability surface, or restructures the file system layout MUST update `README.md` and the appropriate `.documentation/*.md` files before the session completes.**

This includes but is not limited to:

- **Hub menus**: Adding, removing, or renaming subcommands on `/ideation`, `/orchestrate`, `/harvest-context`, `/project`, or `/init-project`
- **Configuration surface**: Changes to `opencode.jsonc` structure, model lists, plugin paths, instruction paths, permission rules
- **Agent/skill/command/tool inventory**: Adding or removing any of the 29 agents, 64 skills, 6 commands, or 10 tools that changes the advertised capability surface
- **File system layout**: Moving or renaming top-level directories or paths referenced in documentation
- **Workflow semantics**: Changes to how hubs delegate, how state is persisted, or how context is harvested

The README and documentation files are the primary user-facing reference. They must remain in sync with the codebase they document.

## Subdirectories

| Directory | Purpose |
|-----------|---------|
| `context/` | Durable knowledge — frameworks, patterns, research, decisions, theory (committed) |
| `state/` | Session data — progress, checkpoints, sessions, project memory (gitignored) |
| `node_modules/` | Project-scoped Node.js dependencies (gitignored) |

## For AI Agents

### Working In This Directory
- State vs Context separation is fundamental — see `rules/context-strategy.md`
- State is gitignored and ephemeral; context is committed and durable
- Never store secrets in committed context files
- Auto-load context on process start; auto-save on milestones, decisions, and errors

### Testing Requirements
- Configuration validated by `/hubs-doctor`
- Context integrity checked via `/harvest-context context`

### Common Patterns
- `context/decisions.md` — Architecture Decision Records (ADRs)
- `context/theory.md` — Living documentation (THEORY.MD equivalent)
- `context/frameworks/` — Architecture patterns and conventions
- `context/patterns/` — Discovered patterns, anti-patterns, solutions
- `context/research/` — Web-extracted docs and references

## State vs Context Separation

| Type | Location | Git | Lifecycle |
|------|----------|-----|-----------|
| State | `.opencode/state/` | Gitignored | Ephemeral — deleted between sessions or compacted |
| Context | `.opencode/context/` | Committed | Accumulates — compounds across sessions |

## Dependencies

### Internal
- `tools/` — TypeScript tools read/write state here
- `rules/context-strategy.md` — Context model and conventions

### External
- OpenCode runtime — Reads `opencode.json` for project configuration

<!-- MANUAL: -->
