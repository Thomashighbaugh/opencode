# Architecture Decision Records

## 2026-04-28: Durable Context Separation

**Status:** Accepted

Split `.opencode/` into two storage tiers:
- `state/` — gitignored, ephemeral session data (progress, checkpoints, active modes, secrets)
- `context/` — committed, durable knowledge (frameworks, patterns, research, theory, ADRs)

Inspired by StackMemory principle: "State != Context. State is ephemeral. Context compounds across sessions."

## 2026-04-28: Inline Delegation for Methodology Patterns

**Status:** Accepted

Methodology patterns (adversarial-debate, consensus, evolutionary, etc.) use `inline: true` delegation rather than separate skills or agents. Rationale: these are instruction patterns, not executable tools. The agent implements the pattern directly for the user's specific goals. Keeps hub menus flat while providing rich methodology selection.

## 2026-04-28: joc-tui-hubs server.config Removal

**Status:** Resolved

Removed the `server.config` hook from `joc-tui-hubs/index.js`. The hook was registering hub commands with template strings (`"/${hub} [subcommand]"`), creating registration collisions with `commands/*.md` markdown files. OpenCode resolved to the template registration, dispatched `hubMenu(action="display")`, causing `undefined.split()`. Resolution: strip `server.config`, rely solely on TUI `api.command.register()` and markdown `invoke:`.

## 2026-04-28: Hub Command Structure

**Status:** Accepted

Five hubs: `/init-project`, `/ideation`, `/orchestrate`, `/harvest-context`, `/project`. Each routes subcommands via `hubMenu` tool. State tracked in `.opencode/state/{hub}/`. Context extracted to `.opencode/context/{category}/`.

## 2026-04-28: Babysitter Methodology Integration

**Status:** Accepted

Integrated 30+ patterns from `a5c-ai/babysitter/library/methodologies/` and `gsd-build/get-shit-done`. Patterns are instruction-level — each describes a methodology the agent implements. No code dependencies, no SDK requirements. Pure methodology descriptions.
