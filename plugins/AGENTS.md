<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-05-01 | Updated: 2026-05-01 -->

# plugins

## Purpose
OpenCode plugin system components — hook system plugin for lifecycle events and TUI plugin for visual hub interfaces.

## Key Files

| File | Description |
|------|-------------|
| `hubs-plugin.ts` | Hook system plugin — session lifecycle, tool lifecycle, chat messages, permission auto-approval, context preservation, context injection |

## Subdirectories

| Directory | Purpose |
|-----------|---------|
| `hubs-tui/` | TUI plugin with hub dialogs and visual interface components (see `hubs-tui/AGENTS.md`) |

## For AI Agents

### Working In This Directory
- `hubs-plugin.ts` registers hooks for: `session.created`, `session.deleted`, `tool.execute.before`, `tool.execute.after`, `chat.message`, `permission.ask`, `experimental.session.compacting`, `experimental.chat.system.transform`
- The TUI plugin provides native DialogSelect menus for hub command palettes
- Plugins are registered via `opencode.jsonc` npm plugin entries

### Testing Requirements
- Use `btw_status` tool to report plugin status
- Run `/hubs-doctor` for plugin diagnostics

### Common Patterns
- Plugin hooks follow the OpenCode plugin API spec
- Hooks intercept lifecycle events and inject behavior
- TUI components use the Hubs TUI framework

## Dependencies

### Internal
- `tools/` — TypeScript tools that plugins may invoke
- `rules/` — Shared rules for context strategy and state management

### External
- OpenCode plugin API — Hook registration and lifecycle
- NPM plugin system — `hubs-tui-hubs@0.1.0` and other plugins

<!-- MANUAL: -->
