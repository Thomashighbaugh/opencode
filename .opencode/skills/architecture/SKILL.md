---
name: architecture
description: Reference skill describing this OpenCode Hubs config — directory layout, runtime data flow, and extension points
level: 1
---

# Architecture

This repository is the global OpenCode Hubs configuration. It supplies the entry-point agent, hub routing, workflow skills, tools, plugins, rules, and templates used by OpenCode sessions.

## Directory Layout

```text
~/.config/opencode/
├── opencode.jsonc          # Runtime config: default agent, providers, MCP servers, plugins
├── AGENTS.md               # Global instructions loaded into agent sessions
├── agents/                 # hubs primary agent plus specialist subagents
├── skills/                 # Global workflow skills
├── rules/                  # Shared rules referenced by opencode.jsonc
├── tools/                  # Auto-discovered TypeScript tools
│   ├── hub-data.ts         # Hub types, manifest loader, state and spec resolution
│   ├── hubMenu.ts          # Hub list/menu/route/status/resume tool
│   ├── hub-<name>.ts       # Thin identity manifest for each hub
│   └── hubs/               # Per-hub indexes, subcommand specs, spec registry
├── plugins/
│   ├── hooks/              # Session lifecycle, mode, goal, cache, telemetry hooks
│   ├── auto-continue/      # Goal-driven continuation
│   ├── command-hooks/      # Configurable command execution on tool/session events
│   ├── prompt-queue/       # Persistent prompt queue gating and draining
│   └── hubs-tui/           # TUI menus; generated data and runtime bundle
├── templates/              # Agent, rule, tool, context, reasoning, and project templates
├── tests/global/           # Repository-wide schema and behavior tests
└── .opencode/              # Project-scoped config, durable context, and ephemeral state
    ├── agents/
    ├── skills/             # Project-specific helpers such as build, lint, test
    ├── rules/
    ├── context/            # Committed durable knowledge and generated wiki pages
    ├── cache/              # Gitignored caches
    └── state/              # Gitignored sessions, checkpoints, queues, goals, vectors
```

## Hub Data Flow

Hub data has two representations: a small manifest for menus and a full specification for routing.

1. `tools/hub-<name>.ts` exports the hub identity and its subcommand slices. Each slice contains the label, short description, reminder, and delegation target.
2. `tools/hubs/<hub>/index.ts` assembles the full `HubDefinition`; sibling files such as `tools/hubs/resource-hub/knowledge-graph.ts` provide the per-subcommand `HubSubcommandSpec`.
3. `tools/hubs/spec-registry.json` is a generated lookup used during routing. Regenerate it with `npx tsx tools/build-spec-registry.ts` after adding or moving a specification.
4. `hubMenu route` resolves one hub and one subcommand, then returns its full spec, selected rules, related-skill metadata, examples, warnings, and checkpoint state. This keeps the common route to one tool call.
5. `plugins/hubs-tui/generate-menus.ts` imports the thin manifests and writes `plugins/hubs-tui/src/generated-hubs.ts`. `plugins/hubs-tui/src/tui.tsx` registers those menus and appends the selected `/hub subcommand ` text to the prompt.
6. `plugins/hubs-tui/package.json` bundles `src/tui.tsx` into the gitignored `dist/tui.js`. The TUI loads that bundle, so menu changes require both regeneration and a TUI restart.

```text
hub manifest ─┐
              ├─> generated-hubs.ts ─> TUI selection ─> /hub subcommand
hub spec ─────┘
       │
       └─> spec-registry.json ─> hubMenu route ─> skill | agent | command | inline
```

## Execution Model

`agents/hubs.md` defines the sole primary agent. It handles work directly unless the user selects an orchestration mode or requests a specialist. The specialist agents under `agents/` run as subagents and do not become session entry points.

Hub subcommands delegate through exactly one primary mechanism:

| Target | Resolution |
|--------|------------|
| `skill` | Load `skills/<name>/SKILL.md` |
| `agent` | Dispatch the named specialist from `agents/` |
| `command` | Run the named command |
| `inline` | Execute the specification as instructions |

The route can also name related skills, rules, and tools that the executing agent should load or use.

## State and Context

The project separates knowledge that outlives a session from state that supports the current work.

| Store | Location | Versioned | Purpose |
|-------|----------|-----------|---------|
| Durable context | `.opencode/context/` | Yes | Decisions, research, patterns, wiki pages |
| Project memory | `.opencode/state/project-memory.json` | Conditional | Stable facts selected for reuse |
| Session state | `.opencode/state/sessions/` | No | Transcript and session-scoped data |
| Hub state | `.opencode/state/{init,ideation,orchestration,...}/` | No | Checkpoints, plans, work products |
| Cache | `.opencode/cache/` and `.opencode/state/cache/` | No | Prompt, file, tool, and semantic caches |
| Vector index | `.opencode/state/vector/` | No | Local embeddings for retrieval |

Context writes are explicit. Hub state is written by long-running workflows so `hubMenu status` and `hubMenu resume` can find checkpoints.

## Plugins

| Plugin | Responsibility |
|--------|----------------|
| `hooks` | Loads rules and context, tracks modes and goals, and coordinates session hooks |
| `auto-continue` | Continues goal-oriented work when a session becomes idle |
| `command-hooks` | Runs configured commands on matching tool or session events |
| `prompt-queue` | Holds prompts, classifies them, and gates queue draining |
| `hubs-tui` | Provides hub, queue, and todo UI commands; renders generated hub menus |

## Main Dependencies

| Dependency | Purpose |
|------------|---------|
| `@opencode-ai/plugin` | Tool, hook, and TUI plugin APIs |
| `@opencode-ai/sdk` | OpenCode client integration |
| `@opentui/solid` | TUI component rendering |
| `zod` | Runtime schemas and validation |
| `better-sqlite3` and `sqlite-vec` | Local structured and vector storage |
| `@huggingface/transformers` | Local embedding and reranking models |
| `vitest` | Global test suite |

## Change Rules

- Add a hub subcommand under `tools/hubs/<hub>/`, register it in that hub's `index.ts`, then regenerate `tools/hubs/spec-registry.json` and the TUI data.
- After any hub label or description change, run `bun run build` in `plugins/hubs-tui/` so `src/generated-hubs.ts` and `dist/tui.js` both match the manifests.
- Add reusable workflows to `skills/`; keep project-only build, lint, test, and convention helpers in `.opencode/skills/`.
- Add automatically discovered tools to `tools/` or `.opencode/tools/`, not at the repository root.
- Keep secrets and session-specific content under `.opencode/state/`; commit durable context only when it belongs in the repository.
