---
title: "Hubs V2 port — packaging decision and implementation plan"
type: decision
tags: [opencode, v2, hubs, plugin-package, tui-picker, mcp, migration, porting]
created: 2026-11-06
updated: 2026-11-06
sources: [context/research/opencode-v2-api/2026-11-06]
status: active
---

# Hubs V2 port

Decision context: the hub menus (13 hubs, 174 subcommand specs, routing, state, 47 cited skills)
must survive the OpenCode 2 migration without losing the interactive selection menu. V1 is the
only runtime until the port is complete and verified; V2 runs only in isolated test invocations
until then. Target is fixed at what the lockfile installs: **opencode2 2.2.0**, bundled
**OpenTUI 0.7.0**, binary `opencode2`.

Facts behind every choice here: [[context/research/opencode-v2-api/2026-11-06]].

## Why not MCP-only

An MCP server exposes prompts, tools, resources. In V2, MCP prompts become flat commands
(`/server:prompt`) with positional arguments, and the TUI plugin context has **no API to call MCP
tools or prompts** — only `data.location.mcp.server` / `.resource` collections. MCP elicitation is
ACP-only, not rendered by the TUI. The interactive picker therefore cannot live in MCP; it must be
a TUI plugin. MCP remains the optional external-client face.

## Package layout

One local plugin directory, self-contained, also publishable:

```
~/.config/opencode/plugins/hubs/
├── package.json          # optional locally; required only for publishing
├── index.ts              # server part    → <dir>/server then <dir>/index
├── tui.tsx               # TUI part       → <dir>/tui
├── mcp.ts                # optional stdio MCP adapter
├── src/
│   ├── core.ts           # loadHub / loadSubcommandSpecFull / route / state — no SDK imports
│   ├── registry.ts       # hub + subcommand index built at load time
│   ├── render.ts         # one payload→text serializer shared by all faces
│   └── paths.ts          # package-relative data root (import.meta.dir) + project state root
├── data/
│   ├── hubs/**           # vendored: 174 specs + 13 index.ts
│   ├── fragments.ts      # shared-spec-fragments
│   ├── rules/**          # security, context-strategy, karpathy-guidelines (+ combos)
│   └── skills/**         # vendored: 47 SKILL.md trees with scripts
└── test/
    ├── fixtures/         # captured v1 hubMenu outputs, one per subcommand
    ├── parity.test.ts
    ├── state.test.ts
    └── picker.test.ts
```

Resolution depends on `packages/plugin/src/host.ts:17-43` (entrypoints) and
`packages/tui/src/plugin/discovery.ts:8-37` (directories under `<config>/plugins`). No
`package.json` exports needed for a local directory.

Vendoring is deliberate: the package must work for someone who has none of this config. Rules and
skills referenced by the specs travel with the specs.

## Three faces, one core

| Face | Registered | Consumer |
| --- | --- | --- |
| `index.ts` | `ctx.tool.transform` → `hubMenu`; `ctx.skill.transform` → 47 skills; `ctx.command.transform` → `/hubs` | agent + command catalog |
| `tui.tsx` | `keymap.layer` slash per hub + `ui.dialog.select` picker + `client.session.prompt` | user |
| `mcp.ts` | `tools/list` → `hubMenu`; `prompts/list` → 13 hub prompts | external clients |

`src/core.ts` is the only consumer of the data; all three faces call `render.ts` so payload text is
identical regardless of entry point.

Server tool registers with `options: { codemode: false }` so it stays on the native tool list, as
`hubMenu` is today.

TUI picker shape: `dialog.select` with `options{title=label, value=label, description}` and a
`search` over label+description; escape resolves `undefined` and submits nothing; selection resolves
to the subcommand, `renderRoute()` produces the payload, `client.session.prompt({ sessionID, text })`
submits it as an ordinary durable prompt. Session id comes from `ui.router.current()` when the route
is `{ type: "session" }`. No generated menu bundle: the hub list is read at runtime, so
`generated-hubs.ts`, the `generate-menus` script, and `rules/hub-menu-rebuild.md` stop existing.

## Spec field remapping

`tools:` arrays cite V1 names. V2 names: `shell`, `read`, `write`, `edit`, `glob`, `grep`, `skill`,
`subagent`, `webfetch`, `websearch`, `question`, `todowrite`, `mcp-resource`.

| Cited | Count | V2 | Action |
| --- | ---: | --- | --- |
| `bash` | 178 | `shell` | rewrite spec text |
| `loadSkill` | 65 | `skill` | rewrite; skills registered via transform |
| `listAgents` | 52 | none | shim tool or rewrite |
| `modeState` | 47 | none | shim or rewrite |
| `taskTodos` | 41 | `todowrite`, gated, no priority | shim with old 7-action schema, or rewrite |
| `agentContext` | 3 | none | shim or rewrite |
| `read`/`grep`/`glob`/`edit` | 2 each | same | unchanged |

Per tool, either shim (old name re-registered by the package, specs untouched) or rewrite (specs
point at the V2 name). The parity harness catches missed citations either way.

## Stages and gates

| Stage | Work | Gate |
| --- | --- | --- |
| 0 | Snapshot `tools/hubMenu.ts` outputs for all 174 subcommands into `test/fixtures/` | 174 fixtures exist; V1 suite green |
| 1 | Extract `hub-data.ts` + specs into `src/core.ts` + `data/`; rebase the rules path | core imports only `node:*`; a bun script reproduces 174/174 payloads byte-identically |
| 2 | `index.ts`: skills transform, `hubMenu` tool, `/hubs` command | under `OPENCODE_DB=opencode-v2.db opencode2`: tool callable, 174/174 parity, all 47 skills resolve |
| 3 | `tui.tsx`: slash registration + picker + prompt submit | select submits fixture-identical payload; filter narrows; escape submits nothing |
| 4 | `mcp.ts` (only if external clients needed) | `/hubs:git-hub commit` returns the fixture payload |
| 5 | Cutover | full matrix green twice on a fresh `OPENCODE_DB`; then swap the Nix package |

Verification matrix: payload parity (key-order-normalized), status/resume parity, skill resolution,
picker UAT per hub, legacy aliases (`/init-project`, `/scaffold-hub`), V1 database hash unchanged
after a V2 session, V1 test suite green, `opencode2` loads no V1 plugin errors.

## Coexistence

V1 stays the daily runtime throughout. V2 is invoked as `opencode2` with `OPENCODE_DB=opencode-v2.db`
for tests. The new `plugins/hubs/` directory is invisible to V1 (V1 loads only the configured plugin
entries; `opencode debug info` lists them explicitly). V1 keeps `tools/hubs/**`, `tools/hubMenu.ts`,
`plugins/hubs-tui` as the reference implementation and fixture source until cutover.

## Cutover

One commit: `llm-agents.opencode` → `llm-agents.opencode2` in
`modules/nixos/base/packages/core.nix`; remove the `hubs-tui` plugin entry; delete
`tools/hubMenu.ts`, `tools/hub-*.ts`, `tools/hubs/**`, `tools/hub-data.ts`, `plugins/hubs-tui/`,
`rules/hub-menu-rebuild.md`, and the menu generator. `plugins/hooks`, `command-hooks`,
`prompt-queue` stay on V1 semantics until their own port — they consume `hubMenu` but hubs do not
require them.

## Open items

- `ctx.skill.transform` is accepted by 2.2.0 but unexercised in-tree; verify at stage 2.
- MCP `prompts/get` has no cwd context; the external face needs `cwd` config or absolute paths.
- Publish shape, if ever shipped: `exports: { ".": "./index.ts", "./tui": "./tui.tsx", "./mcp": "./mcp.ts" }`.
- The 47 vendored skills are also referenced by non-hub agents; duplication is accepted, with the
  package as the authoritative copy once ported.
