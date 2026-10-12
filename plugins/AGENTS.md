<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-05-01 | Updated: 2026-05-01 -->

# plugins

## Purpose
OpenCode plugin system components — hook system plugin for lifecycle events, session goal management, and TUI plugin for visual hub interfaces.

## Key Files

| File | Description |
|------|-------------|
| `hooks/hooks.ts` | Hook system plugin entry point — session lifecycle, tool lifecycle, chat messages, permission auto-approval, context preservation, context injection |
| `hooks/goal.ts` | Session goal management — set, clear, pause, resume goal; state persistence; progress tracking with turn/token budgets; auto-continue message generation |

## Subdirectories

| Directory | Purpose |
|-----------|---------|
| `hooks/` | Hook system modules — session.ts, modes.ts, keywords.ts, telemetry.ts, cache-hook.ts, vectorize-hook.ts (imported by hooks.ts) |
| `hubs-tui/` | TUI plugin with hub dialogs and visual interface components (see `hubs-tui/AGENTS.md`) |

## For AI Agents

### Working In This Directory
- `hooks/hooks.ts` registers hooks for: `session.created`, `session.deleted`, `tool.execute.before`, `tool.execute.after`, `chat.message`, `permission.ask`, `experimental.session.compacting`, `experimental.chat.system.transform`
- `goal.ts` provides session goal management — imported by `hooks/hooks.ts` for system prompt injection; state persisted to `.opencode/state/goal/state.json`
- The TUI plugin provides native DialogSelect menus for hub command palettes
- Plugins are registered via `opencode.jsonc` npm plugin entries

### The `/goal` Command
- Registered as a TUI slash command in `plugins/hubs-tui/src/tui.tsx` (rebuild dist with `bun build`)
- Command template at `commands/goal.md` handles agent-side logic
- Subcommands: `set`, `show`, `clear`, `pause`, `resume`
- Bare `/goal` (no subcommand) presents an interactive hub-style menu via `question` tool
- Goal state file: `.opencode/state/goal/state.json` (created automatically on first use)

### The `/todo` Command
- Registered as a TUI slash command **and** ctrl+p palette entry in `plugins/hubs-tui/src/todo-commands.ts`
- Menus: add / list / complete / delete / inject into input box / copy to clipboard / view archive
- Store: `.opencode/todo/todos.json` (active) + `.opencode/todo/archive.jsonl` (completed, append-only) — committed, per project
- The **human's** list; distinct from the agent's in-session `taskTodos` (`.opencode/state/todos.json`). No agent tool, no system-prompt injection by design.

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
