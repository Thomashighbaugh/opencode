# Documentation Index

Technical documentation for this OpenCode agent harness. Start at
[Architecture](architecture.md) for the system design, or the
[README](../README.md) for the overview.

## Read in this order

1. **[Architecture](architecture.md)** — layers, data flow, extension points, invariants.
2. **[Event Interception](plugins-hooks.md)** — the plugin every turn passes through.
3. **[Memory System](memory-system.md)** — what survives a session, and what does not.
4. **[Knowledge Plane](knowledge-plane.md)** — hybrid retrieval and its graph invariants.
5. **[Prompt Queue](prompt-queue.md)** — the one piece of UI that changes what the model is asked next.

## By component

### Custom plugins

| Page | Component | LOC | What it does |
| ---- | --------- | ---: | ------------ |
| [Event Interception](plugins-hooks.md) | `plugins/hooks/` | 3,987 | 8 hook points, caching, modes, focus, telemetry, knowledge sync |
| [Command Hooks](plugins-command-hooks.md) | `plugins/command-hooks/` | 1,726 | Declarative shell hooks on tool and session events, output injected into context |
| [TUI Plugin](plugins-hubs-tui.md) | `plugins/hubs-tui/` | 899 | Native dialogs for the hub command system |

### Supporting systems

| Page | Component | What it does |
| ---- | --------- | ------------ |
| [Memory System](memory-system.md) | `.opencode/context/`, `/memory-hub` | Durable context, state vs context, the self-maintaining wiki |
| [Knowledge Plane](knowledge-plane.md) | `skills/graph-context/`, `skills/vectorize-context/` | Graph + vector hybrid retrieval, structural invariants, incremental rebuilds |
| [Orchestration](subagent-orchestration.md) | `agents/`, `modes.ts` | 31 subagents, the dispatch policy, mode detection |
| [Hub Command System](hub-command-system.md) | `tools/hub-*.ts`, `tools/hubs/` | 14 hubs, 183 subcommands, two-tier routing |
| [Rules & Skills](rules-and-skills.md) | `rules/`, `skills/`, `tools/` | 20 rules, 125 skills, 46 tools, MCP servers |
| [Efficiency](request-token-efficiency.md) | `cache-utils`, `runtime`, `child-registry` | Request and token budgets, and how they are measured |
| [Testing Strategy](testing-strategy.md) | `tests/global/`, `skills/*/tests/` | 1,086 behavioural tests, and the defects they caught |

---

## Cross-cutting concepts

These appear on several pages and are worth their own reading.

### The session queue

`plugins/hooks/session.ts` → `queueContextMessage(sessionId, text)` → drained by
`experimental.chat.system.transform` on the next turn.

Any component can be heard by the agent **without spending an inference request**. This is the
mechanism behind the largest efficiency decision in the system, and it is why
[command hooks](plugins-command-hooks.md) inject rather than prompt.

### State vs context

| Tier    | Location                 | Git         |
| ------- | ------------------------ | ----------- |
| State   | `.opencode/state/`       | gitignored  |
| Context | `.opencode/context/`     | committed   |
| Secrets | `.opencode/state/sessions/` | gitignored |

See [Memory System](memory-system.md).

### Derivation epoch

`DERIVATION_EPOCH` in `graphlib.ts`. Bumping it forces a full rebuild, because a change to how
edges are *derived* cannot be detected by a signature over the data. See
[Knowledge Plane](knowledge-plane.md).

### No pinned models

`opencode.jsonc`, agent frontmatter, and profiles contain no `model` key. Model choice is made at
runtime by OpenCode or explicitly by the user. A subagent failure escalates to the user rather than
silently failing over to a different provider. Enforced by `schema.test.ts` and
`agent-format.test.ts`.

---

## Conventions

- **Behaviour over source text.** If a test could pass against code that never runs, it is wrong.
- **Invariants over intentions.** Structural properties are SQL queries, not comments.
- **Regenerate, never hand-maintain.** `index.md`, the spec registry, and the TUI bundle are all
  generated.
- **Fail soft in production, loud in tests.** A hook must never break a tool call; a test must
  never stay green on a broken one.

→ [Back to README](../README.md)
