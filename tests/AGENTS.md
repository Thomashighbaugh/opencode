<!-- Parent: ../AGENTS.md -->

# tests

Vitest suites (`vitest.config.ts` includes `tests/**/*.test.ts`, 60s timeouts).

| Path | Covers |
| --- | --- |
| `tests/global/` | Schema, agent format, delegation, feature inventory, command hooks, prompt queue, knowledge plane, efficiency rules |
| `tests/plugins/` | Local plugin behaviour — TOON codec + V2 hooks, todo operations |
| `tests/agents/`, `tests/project/` | Agent fixtures and project-scoped configuration |
| `tests/helpers/` | `load-config` and shared fixtures |

Per-plugin behavioural tests that need Bun live beside the package (`plugins/hubs/test/`, run with `bun test plugins/hubs`); everything under `tests/` must run under Node.
