# OpenCode Agent Harness

A production-grade agentic AI configuration for [OpenCode](https://opencode.ai) — 31 specialised
subagents, a hybrid retrieval plane, declarative event hooks, a 14-hub command system, and a
990-test suite that asserts on *behaviour* rather than on source text.

This repository is the agent's entire operating system. It is not a prompt collection: it is a
runtime with policy enforcement, an incremental knowledge graph, a token budget, and an
evaluation harness that fails when any of them stop working.

---

## Why this exists

Most agent configurations are a markdown file and good intentions. The failure modes are
predictable and none of them crash — they are silent:

- A caching layer that writes but is never read, so every turn re-pays for retrieval.
- A knowledge graph that reports `18,000 edges` and contains 88 edges pointing at nodes that
  do not exist, so `impact` analysis answers with confident nonsense.
- A rule that says "verify your own work", which depends on the agent remembering it.
- A skill that four hub commands delegate to, which has no frontmatter and is therefore
  invisible to the loader.
- A test suite that passes against code that never runs.

Every subsystem here is built to make one of those failures **loud**. `rules/efficiency-first.md`
is the standing constraint that shapes the whole design.

---

## Architecture at a glance

```
                      ┌──────────────────────────────────────────────┐
   user input  ──────▶│  plugins/hooks/hooks.ts   (event interceptor) │
                      │  8 hook points · modes · focus · telemetry     │
                      └───────┬──────────────────────────────┬─────────┘
                              │                              │
              ┌───────────────▼───────────┐     ┌────────────▼─────────────┐
              │ retrieval (always local)  │     │ plugins/command-hooks/   │
              │  graph (SQL) → vectors    │     │ declarative shell hooks  │
              │  → rerank → token budget  │     │ injects into next turn   │
              └───────────────┬───────────┘     └────────────┬─────────────┘
                              │                              │
                      ┌───────▼──────────────────────────────▼─────────┐
                      │  31 subagents · 125 skills · 46 tools        │
                      │  14 hubs / 183 subcommands · 20 rules         │
                      └──────────────────────────────────────────────┘
```

| Layer                | Implementation                                | Scale (measured)         |
| -------------------- | --------------------------------------------- | ------------------------ |
| Event interception   | `plugins/hooks/`                              | 3,987 LOC, 8 hook points |
| Declarative hooks    | `plugins/command-hooks/`                      | 1,726 LOC, 7 modules     |
| TUI                  | `plugins/hubs-tui/`                           | 899 LOC                  |
| Graph retrieval      | `skills/graph-context/scripts/graphlib.ts`     | 2,708 LOC                |
| Vector retrieval     | `skills/vectorize-context/scripts/veclib.ts`   | 1,484 LOC                |
| Tooling              | `tools/`                                      | 46 tools, 11,785 LOC     |
| Evals                | `tests/global/`                               | 990 tests, 2,652 LOC     |
| Knowledge store      | SQLite                                        | 3,596 nodes / 20,992 edges |

---

## The four things that make it an agent harness

### 1. Hybrid retrieval: graph first, vectors second, budget always

A local knowledge plane with no inference call on the hot path.

- **Graph layer** — SQLite entity/relation store, incrementally derived from the symbol sidecar.
  3,596 nodes, 20,992 edges, **zero dangling edges, zero edgeless nodes**. Enforced as
  invariants, not maintained by hand.
- **Vector layer** — Ollama embeddings, 2,261 chunks, 4,720 symbols, 70,868 identifier
  postings for reverse "which files mention X" lookups.
- **Reranking** — local BGE cross-encoder, degrading to distance ordering on failure.
- **Negative caching** — a query that matches nothing is remembered, so a miss is not re-run.

Graph-only recall is pure SQL: **< 5 ms**, no child process, no model load.

→ [`memory-system.md`](.documentation/memory-system.md) ·
[`knowledge-plane.md`](.documentation/knowledge-plane.md)

### 2. Event-driven declarative hooks

Attach shell commands to tool and session events; inject their output into the agent's context.

```jsonc
{
  "id": "typecheck-after-task",
  "when": { "phase": "after", "tool": "task" },
  "run": "npx tsc --noEmit",
  "injectOn": "failure",
  "inject": "Type errors after the subagent finished:\n{stdout}{stderr}"
}
```

Two design decisions carry this:

- **Injection is queued, not prompted.** Results enter the next turn's system transform via the
  session queue. Upstream implementations use `client.session.promptAsync`, which costs a full
  inference request per result. A test asserts the fallback is never taken.
- **`injectOn: "failure"`** means a green check costs **zero tokens**. This is why the hook gets
  used rather than switched off.

→ [`plugins-command-hooks.md`](.documentation/plugins-command-hooks.md)

### 3. A command system, not a slash-command pile

14 topical hubs, 183 subcommands, two-tier routing. Bare hub → slim identity slice; explicit
`/hub subcommand` → full spec in one response. **One LLM round-trip instead of two.**

Every subcommand description is ≤ 80 characters and self-contained, because the TUI dialog shows
a flat list with no hub name. Descriptions that name their hub are rejected by a test.

→ [`hub-command-system.md`](.documentation/hub-command-system.md)

### 4. Evals that drive real code

No test in this repository asserts that source text contains a substring. 990 tests drive the
actual runtime:

- **Behavioural** — hooks are invoked and their side effects observed.
- **Database-level** — invariants are SQL queries over a live graph, not regexes.
- **Adversarial** — a test asserts the injection path makes *zero* `promptAsync` calls.
- **Regression-pinned** — the flaky wall-clock assertions that measured machine load were
  replaced with assertions on mechanism.

→ [`testing-strategy.md`](.documentation/testing-strategy.md)

---

## Request and token efficiency as an architectural constraint

| Technique                              | Effect                                                              |
| -------------------------------------- | ------------------------------------------------------------------- |
| Session-scoped positive + negative cache | A repeat turn costs **0** retrieval calls                          |
| Long-lived query server                  | 1 child process serves N queries; no per-call model load             |
| Read-only query path                     | Query never writes — the sync child is the sole writer              |
| Node-first runtime resolution            | Bun crashes on `better-sqlite3`; children run under Node by default |
| Per-turn token budget                    | A reminder under 600 chars instead of a wall of guidance           |
| Readonly probe before write lock         | No exclusive DB lock when there is nothing to write                 |
| Graph-only recall path                   | Pure SQL fallback when vectors are cold                            |

→ [`request-token-efficiency.md`](.documentation/request-token-efficiency.md)

---

## Getting started

```bash
# Verify the whole system
bun run test:run                          # 990 tests
npx tsc --noEmit -p tsconfig.json         # config + plugins
npx tsc --noEmit -p skills/tsconfig.json  # skills

# Rebuild the knowledge plane
npx tsx skills/graph-context/scripts/graph.ts build
npx tsx skills/graph-context/scripts/regen-index.ts
```

Requires Bun, Node 20+, and an Ollama daemon for embeddings and reranking. Everything else is
local and offline.

---

## Documentation

| Page | Covers |
| ---- | ------ |
| [Architecture](.documentation/architecture.md) | Layer-by-layer design, data flow, extension points |
| [Event Interception](.documentation/plugins-hooks.md) | `plugins/hooks/` — modes, focus, telemetry, caching, vectorize |
| [Command Hooks](.documentation/plugins-command-hooks.md) | `plugins/command-hooks/` — declarative shell hooks on events |
| [TUI Plugin](.documentation/plugins-hubs-tui.md) | `plugins/hubs-tui/` — native dialogs, generated menu bundle |
| [Memory System](.documentation/memory-system.md) | Durable context, state vs context, the wiki layer |
| [Knowledge Plane](.documentation/knowledge-plane.md) | Graph + vector retrieval, invariants, incremental rebuilds |
| [Orchestration](.documentation/subagent-orchestration.md) | 31 subagents, delegation, the `task` tool |
| [Hub Command System](.documentation/hub-command-system.md) | 14 hubs, 183 subcommands, two-tier routing |
| [Rules & Skills](.documentation/rules-and-skills.md) | Rule loading, 125 skills, 46 tools |
| [Efficiency](.documentation/request-token-efficiency.md) | Request and token budgets |
| [Testing Strategy](.documentation/testing-strategy.md) | 990 behavioural tests and what they protect |

---

## Repository layout

```
├── agents/                 31 subagent definitions
├── skills/                 125 skills (+ vectorize-context, graph-context)
├── rules/                  20 rules — 11 preloaded, 9 on demand
├── tools/                  46 TypeScript tools
├── plugins/                hooks · command-hooks · hubs-tui
├── tests/global/           990 tests across 9 suites
├── command-hooks.jsonc     global declarative hooks
├── opencode.jsonc          plugin, MCP, instructions, references
├── .documentation/         this documentation set
└── .opencode/              state (ephemeral) + context (durable)
```

---

## Design commitments

1. **Nothing loads silently.** A skill, rule, agent, or subcommand that is referenced but
   unreachable fails a test. Four were found and fixed this way.
2. **A hook never breaks a tool call.** Hook failures are contained and reported.
3. **Derived state is verifiable.** Graph edges are checked against live nodes; a rebuild that
   changes structure without a reason is impossible by construction.
4. **Every regeneration is idempotent.** A settled rebuild reports zero work; a second build
   skips. A derivation-rule change is versioned so it *cannot* skip.
5. **Tests observe effects.** If a subsystem could be broken and the suite stay green, the test
   is the bug.

---

*This configuration was built and hardened against its own failure modes. Numbers quoted above
are measured by the test suite or by `graph.ts stats`, not estimated.*

**Keywords:** OpenCode plugin, agentic AI, agent harness, agent orchestration, multi-agent
systems, hybrid retrieval, RAG, knowledge graph, vector search, MCP (Model Context Protocol),
context engineering, prompt caching, token optimization, LLM evals, TypeScript, Bun, SQLite,
deterministic tooling.
