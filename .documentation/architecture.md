# Architecture

How the pieces fit, and why the boundaries are where they are.

---

## The shape

```
┌───────────────────────────────────────────────────────────────────────────┐
│  opencode.jsonc                                                            │
│  plugin · MCP servers · instructions (11 rules) · references               │
└───────┬─────────────────────────────────────────────────────┬─────────────┘
        │                                                     │
        ▼                                                     ▼
┌───────────────────────┐                        ┌──────────────────────────┐
│  plugins/             │                        │  content layer           │
│  ├── hooks/           │◀── queueContextMessage │  ├── rules/    (20)      │
│  │   event intercept  │                        │  ├── skills/  (125)      │
│  │   cache · modes    │─── injects ───────────▶│  ├── agents/   (31)      │
│  │   focus · telemetry│                        │  └── tools/    (46)      │
│  ├── command-hooks/   │                        └─────────────┬────────────┘
│  │   declarative shell│                                      │
│  └── hubs-tui/        │                        ┌─────────────▼────────────┐
└───────────────────────┘                        │  knowledge plane         │
                                                │  graph.db  vectors  rerank│
                                                └──────────────────────────┘
```

---

## Layer 1 — Event interception

[`plugins/hooks/`](plugins-hooks.md) is the only component every turn passes through. It owns
caching, mode state, context injection, permission policy, and the knowledge sync trigger.

Everything else produces messages **into** its queue rather than talking to the model directly.
That is the boundary that makes the system cheap: a producer can be loud without spending a
request.

## Layer 2 — Declarative behaviour

[`plugins/command-hooks/`](plugins-command-hooks.md) turns user-authored configuration into event
behaviour, with no code. It is deliberately a **separate plugin** so it composes with the hooks
plugin rather than replacing it — a second `tool.execute.after` registration replaces the first
in OpenCode, it does not merge with it.

## Layer 3 — Content

[Rules, skills, agents, tools](rules-and-skills.md). Two loading policies, chosen per asset:

- **Startup** (11 rules) — applies to every turn; pays a permanent cost; must earn it.
- **On demand** (everything else) — loaded when a workflow needs it, named by its consumer.

A test fails if an on-demand asset has no referrer. That single assertion is what turned five
dead files and one unreachable skill into a working system.

## Layer 4 — Knowledge

[Memory system](memory-system.md) and the [knowledge plane](knowledge-plane.md) hold durable
context and answer questions about the codebase. Markdown is the source of truth; SQLite is a
derived index over it.

---

## Data flow of a single turn

```
  user message
      │
      ▼
  chat.message ─────────────▶ keywords.ts detects a mode  ──▶ PROPOSES, never activates
      │
      ▼
  experimental.chat.system.transform
      │   ├─ consumeContextMessages()      ← anything queued this session
      │   ├─ focus goal + budget state
      │   └─ per-turn efficiency reminder   (char-budgeted)
      ▼
  model call  ◀── retrieval: session cache → graph (SQL) → vectors → rerank
      │
      ▼
  tool.execute.before   ─▶ positive-cache probe; args cached for the after-hook
      ▼
  tool.execute.after    ─▶ cache substitution, or run + store
      │
      │   after + task ─▶ command-hooks fire: typecheck, tests (injectOn: failure)
      ▼
  session idle ─────────▶ debounced knowledge sync, graph rebuild
```

Every arrow is observable and, where it costs something, measured.

---

## Design decisions, and what they replaced

| Decision | Replaced |
| -------- | -------- |
| Queued injection | `client.session.promptAsync` — one inference request per result |
| Node-first child runtime | Bun's NAPI crash on `better-sqlite3`, which returned "no results" silently |
| Sole-writer sync process | Two-process SQLite deadlocks on `SQLITE_BUSY` |
| `DERIVATION_EPOCH` | A partial rebuild that could never notice a change in derivation logic |
| Graph-only SQL recall | A retrieval layer that returns nothing when a sidecar is unavailable |
| Bare-name node ids for rules, skills, agents | Path-keyed ids nobody could guess or join on |
| `index.md` generated from disk | A hand-maintained catalog that drifted to 36 phantom entries |
| `injectOn: "failure"` | A validation hook that spends tokens reporting success |
| Hard 80-char description limit | 243-character strings truncated in the one place they are read |
| On-demand rules with named referrers | Five files present, referenced by nothing, loaded by nothing |

---

## Extension points

| To add                        | Do this                                                            |
| ----------------------------- | ------------------------------------------------------------------ |
| Event behaviour               | A `command-hooks.jsonc` entry — no code                            |
| A subagent                    | `agents/<name>.md`; the format is validated by 280 tests           |
| A skill                       | `skills/<name>/SKILL.md` with valid frontmatter                    |
| A tool                        | `tools/<name>.ts`; auto-discovered                                 |
| A hub subcommand              | `tools/hubs/<hub>/<sub>.ts`, then **regenerate the registry and the TUI bundle** |
| Durable knowledge             | `/memory-hub consume` — never written automatically                |
| A rule                        | Add to `instructions` if it applies every turn, or give it a named referrer |

The two-step regeneration is the most-skipped step in the repository; see
[TUI Plugin](plugins-hubs-tui.md).

---

## Invariants

The system is built so these cannot be lost silently:

1. No model is pinned anywhere in the config.
2. Every referenced asset resolves to a real file.
3. No on-demand asset lacks a referrer.
4. Every graph edge points at a node that exists; no node is edgeless.
5. A settled rebuild is free; a derivation-rule change is not skippable.
6. A hook never breaks the tool call it decorates.
7. Injection costs no inference request.
8. A broken config source disables only itself.

Each is asserted by a test. See [Testing Strategy](testing-strategy.md).

---

## Stack

| Layer        | Technology                                                          |
| ------------ | ------------------------------------------------------------------ |
| Runtime      | Bun (OpenCode host), Node 20+ for native children                  |
| Language     | TypeScript, `strict: false` with `noImplicitAny: false` in skills   |
| Storage      | SQLite via `better-sqlite3` — `code.db`, `context.db`, `graph.db`   |
| Embeddings   | Ollama, `mxbai-embed-large`                                         |
| Reranking    | Ollama, BGE cross-encoder                                           |
| Interop      | MCP — context7, grep.app, searxng, filesystem, sequential-thinking  |
| Testing      | Vitest (990) + `node --test` (64)                                  |

Local-first by design: the retrieval hot path touches no network, and the only external
dependencies are optional and individually degradable.

---

*→ [Event Interception](plugins-hooks.md) · [Back to README](../README.md)*
