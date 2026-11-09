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
| `toon/index.ts` | TOON compaction plugin — rewrites large JSON from `bash` output as TOON in context and restores the JSON before a later `bash` command consumes it (v1 `tool.execute.before`/`after` hooks) |
| `toon/toon.ts` | Self-contained TOON encoder/decoder — tabular arrays, inline primitive arrays, indented objects; `encode` returns null rather than emit anything it cannot decode |

## Subdirectories

| Directory | Purpose |
|-----------|---------|
| `hooks/` | Hook system — V2 adapter (`index.ts`) over the V1 modules: session, modes, keywords, telemetry, cache, vectorize, goal |
| `hubs/` | OpenCode 2 hub plugin package — router, vendored corpus, TUI picker (see `hubs/AGENTS.md`) |
| `todo/` | V2 human todo list — `/todo` menu, store, and pure operations |
| `toon/` | Home-rolled TOON compaction plugin (no npm dependency) |
| `ax-guard/` | Rejects curl/wget and throwaway HTTP parsers in favour of ax |

## For AI Agents

### Working In This Directory
- `hooks/hooks.ts` registers hooks for: `session.created`, `session.deleted`, `tool.execute.before`, `tool.execute.after`, `chat.message`, `permission.ask`, `experimental.session.compacting`, `experimental.chat.system.transform`
- `goal.ts` provides session goal management — imported by `hooks/hooks.ts` for system prompt injection; state persisted to `.opencode/state/goal/state.json`
- The TUI plugin provides native DialogSelect menus for hub command palettes
- Plugins are registered via `opencode.jsonc` npm plugin entries

### The `/goal` Command
- Registered by `plugins/hooks/index.ts` on `ctx.command.transform`
- Forms: `/goal <objective>`, `/goal set <objective>`, `status`, `pause`, `resume`, `clear`, `complete`, `blocked`
- `buildGoalBlock()` injects the active goal into every system prompt through the existing hooks context transform
- `plugins/hooks/goal-wire.ts` records the finished assistant turn on `session.idle`, checks `[goal:complete]` / `[goal:blocked]`, and submits a budgeted continuation with `resume: true`
- Goal state file: `.opencode/state/goal/state.json` (created automatically on first use)

### The `/todo` Command
- Registered as a TUI slash command **and** ctrl+p palette entry in `plugins/todo/tui.tsx`
- Menus: add / list / complete / delete / inject into input box / copy to clipboard / view archive
- Store: `.opencode/todo/todos.json` (active) + `.opencode/todo/archive.jsonl` (completed, append-only) — committed, per project
- The **human's** list; distinct from the agent's in-session `taskTodos` (`.opencode/state/todos.json`). No agent tool, no system-prompt injection by design.

### The TOON Compaction Plugin
- `toon/index.ts` mirrors `opencode-toon-plugin` without its `@toon-format/toon` dependency
- Conversion is gated: eligible tool (default `bash`, override with `OPENCODE_TOON_TOOLS`), valid JSON, ≥256 chars, TOON strictly shorter, and `decode(encode(x))` deep-equals `x`
- Encoded payloads are remembered in-process (100 entries) and restored inside quoted strings and heredocs before a later `bash` run; debug with `OPENCODE_TOON_DEBUG=1`
- Uses the v1 plugin API — the V2 port needs `Plugin.define` + `tool.hook("execute.before"/"execute.after")`
- Tests: `bunx vitest run tests/plugins`

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
- NPM plugin system

<!-- MANUAL: -->
