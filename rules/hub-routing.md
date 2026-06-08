# Hub Command Routing

Five hub commands provide unified access to related capabilities.

## hubMenu Tool

Single source of truth at `tools/hubMenu.ts`. Results are **cached in memory** after first call.

| When | Action |
|------|--------|
| Hub invoked with no args | List subcommands as plain text (no tool call) |
| Hub invoked with subcommand | `hubMenu(action: "route", hub: "<name>", subcommand: "<sub>")` |
| User asks hub status | `hubMenu(action: "status", hub: "<name>")` |
| User wants to resume | `hubMenu(action: "resume", hub: "<name>")` |
| Listing hubs | `hubMenu(action: "list")` |

**Adding subcommands/hubs:** Add entries to `HUBS` in `hubMenu.ts`. Menu, routing, reminders update automatically.

## Hub Command Pattern

### No Arguments
List subcommands as plain text. Do NOT call `hubMenu(action: "menu")` — the TUI plugin handles native dialogs. Just output options and ask user to choose.

### With Subcommand
1. `hubMenu("route", hub, subcommand)` — cached after first call
2. **If unknown subcommand** — route via intent detector: run `skills/orchestrate-router/scripts/route-{hub}.mjs "{text}"`, read `recommended` from JSON output, then `hubMenu("route", hub, recommended)`. Show user: "Routed to `/hub recommended` (confidence%)."
3. Print the static terse reminder
4. If `canResume: true`, offer resume or start fresh
5. Execute subcommand via `delegation.type`/`delegation.target`
6. **Cache progress** at significant stages (ideation, orchestration, harvest, init)
7. **Auto-harvest** on completion — extract decisions/patterns → `.opencode/context/`
8. **Chain hubs**: On ideation completion → offer `/orchestrate` hand-off. On orchestration completion → auto-offer `/harvest-context`. On harvest completion → suggest `/ideation` for next plan cycle.

**Auto-vectorize after context write:** `veclib.mjs` handles lazy freshness — files changed on disk = re-indexed on next query. No manual triggering. See `skills/vectorize-context/SKILL.md`.

**Auto-commit to git:** After context writes + vectorization, auto-commit `.opencode/` changes with conventional commit message. Accumulates in `.opencode/CHANGELOG.md`.

### Resume / Status
- Resume: load latest checkpoint/work-product from state dir
- Status: list state files from index.json (or fallback scan)

## Intent Router (Fallback for Unknown Subcommands)

When a user enters text that doesn't match a known subcommand, use `skills/orchestrate-router/scripts/route-{hub}.mjs`:

| Hub | Router Script |
|-----|------|
| `/orchestrate` | `.../route-orchestrate.mjs [text]` — 27 patterns |
| `/ideation` | `.../route-ideation.mjs [text]` — 21 methods |
| `/harvest-context` | `.../route-harvest.mjs [text]` — 13 subcommands + auto-vectorize |

Output JSON, read `recommended`, route via `hubMenu("route", hub, recommended)`.

## Delegation Table

Canonical source: `tools/hubMenu.ts`. Key routing:

| Hub | Subcommand | Delegates To |
|-----|-----------|-------------|
| `/init-project` | setup/detect/docs/context/verify | Various skills/agents |
| `/ideation` | plan/refine/deep/graph/research/ralplan | Respective skills |
| `/orchestrate` | ralph/team/deep/ccg/ultrawork/autopilot/sciomc/swarm | Respective skills |
| `/orchestrate` | (21 inline patterns) | Inline execution |
| `/harvest-context` | session/codebase/skill/agent/rule/command/memory/docs/consume/decompose/context | Various |
| `/project` | tests/commit/stage/pr/gh/optimize/icon/organize/analyze/changelog | Various |

## Magic Keywords

| Keyword | Routes To |
|---------|-----------|
| "ralph"/"don't stop" | `/orchestrate ralph` |
| "autopilot"/"build me" | `/orchestrate autopilot` |
| "ultrawork"/"ulw" | `/orchestrate ultrawork` |
| "deep interview" | `/ideation deep` |
| "plan" | `/ideation plan` |
| "cancel"/"stop" | Cancel active mode |

Magic keywords bypass menu and invoke subcommand directly.
