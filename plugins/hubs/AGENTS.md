<!-- Parent: ../AGENTS.md -->

# hubs (V2 plugin package)

## Purpose

The hub menus as one OpenCode 2 plugin: subcommand routing, the vendored spec/rules/skill corpus,
the interactive picker, and a skills sidebar. Self-contained — nothing outside this directory is
required at runtime.

## Layout

| Path | Role |
| --- | --- |
| `index.ts` | Server part. Plain `{ id, setup }` object (no `@opencode/plugin` import). Registers skills via `ctx.skill.transform`, the `hubMenu` tool via `ctx.tool.transform`, and `/hubs` via `ctx.command.transform`. |
| `tui.tsx` | TUI part. Per-hub slash commands + `ui.dialog.select` picker, `/hubs` (hub picker), `/hubs-skills`, `/hubs-settings`, and a `sidebar.content` panel with one block per hub menu. Left-click a hub row expands its subcommands inline; right-click opens the same picker dialog the MCP list uses. |
| `src/core.ts` | Registry + router. `route()` payloads match the V1 `hubMenu` tool; legacy `hub/sub` pairs resolve through `LEGACY_ROUTE_MAP`. |
| `src/skills.ts` | Vendored skill corpus, hub→skill mapping, token estimates, load-state extraction. |
| `src/agents.ts` | Vendored agents the subcommands delegate to, plus write-if-changed installation into the host `agents/` dir (`ctx.agent.transform` has no `add` in V2). |
| `data/` | Vendored: `hubs/**` (174 specs + registry), `hub-data.ts`, `state-utils.ts`, 13 `hub-*.ts` manifests, `rules/` (3 inlined rule files), `skills/` (47 cited skills), `agents/` (25 coupled agents). |
| `test/` | `bun test plugins/hubs` — registry, routing, legacy aliases, skill corpus, load parsing. |

## Invariants

- `src/` and `data/` import no OpenCode SDK — usable from a plugin, an MCP process, or a test.
- `HUBS_PROJECT_ROOT` overrides the project root used for `.opencode/state` lookups; the entrypoints set it from `ctx.location.directory`.
- Vendor copies mirror `tools/hubs/**`, `rules/{security,context-strategy,karpathy-guidelines}.md`, and the 47 cited skills. Re-copy rather than edit in place.
- Payload parity is a hard requirement: `src/core.ts` must emit exactly what V1 `hubMenu route` emitted.

## V2 API notes

- Entrypoints resolve `<dir>/index` (server) and `<dir>/tui` (TUI) — `packages/plugin/src/host.ts`.
- Picker = `ui.dialog.select` with `search` + `actions`; MCP cannot render a chooser.
- Prompt submission from the TUI uses `ctx.client.session.prompt({ sessionID, text })`.
- Agents cannot be registered by a plugin: `AgentEditor` exposes list/get/update/remove/default only. `installAgents()` writes the vendored files instead.
- Native skill mention insertion reuses the host `/skills` picker: dispatch `prompt.skills`, then `dialog.select.*`.

## Testing

```bash
bun test plugins/hubs
```

Runtime verification requires the V2 binary: `OPENCODE_DB=opencode-v2.db opencode2`.
