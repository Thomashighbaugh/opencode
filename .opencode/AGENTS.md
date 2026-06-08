<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-05-01 | Updated: 2026-05-01 -->

# .opencode

## Purpose
Project-scoped OpenCode configuration. Contains runtime config, persistent state (gitignored), and durable context (committed) that compounds across sessions.

## Key Files

| File | Description |
|------|-------------|
| `opencode.json` | Project-scoped OpenCode configuration (server, tools, plugins) |
| `tui.json` | TUI plugin configuration |
| `package.json` | Node.js dependencies for project-scoped tools |
| `.gitignore` | Git ignore rules for state and node_modules |

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
