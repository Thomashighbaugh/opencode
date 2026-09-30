# Request and Token Efficiency

`rules/efficiency-first.md` is a **standing constraint**, re-applied every interaction cycle
rather than once per session. This page documents the mechanisms that make it enforceable.

Two budgets, and they mean different things:

| Budget             | Definition                                                      |
| ------------------ | --------------------------------------------------------------- |
| **Request budget** | LLM round-trips to inference hosts                               |
| **Token budget**   | Prompt and completion tokens, measured in input characters       |

Neither ever constrains generated code or explicitly requested text. Both are explicitly allowed
to be exceeded when the user asked for the output.

---

## The failure mode this exists to prevent

Every defect this configuration has had in the efficiency area was a **no-op, not a crash**:

- A cache probe that read a value and discarded it.
- An invalidation keyed on a hash that could never match its own prefix search.
- A gate whose short-circuit was never taken.
- A child process spawned per call instead of reused.
- A hook that cost one full inference request per result.

None of them throw. All of them are invisible without a test that observes the effect.

---

## Request efficiency

### Session-scoped positive and negative caching

```
query ──▶ session cache ──▶ hit?  return          0 inference, 0 child
                             miss? embed + rerank, then store
```

A miss is remembered too. Without negative caching, every "nothing found" costs as much as a
successful search — and a user repeating an unanswerable question is the common case, not the rare
one.

A test asserts a **hit counter increments**, not that the call was fast.

### One child serves many queries

`child-registry.ts` keeps a long-lived query server. The retriever used to spawn a child per turn
and pay ~9.4 s of model load each time. Now the child count does not grow with query count, which
is asserted directly.

### Node-first runtime resolution

Bun 1.3.14 hard-crashes with a NAPI `FATAL ERROR` on `require('better-sqlite3')`. Under Bun the
child dies at startup and **queries silently return nothing** — the most expensive possible
failure, because it looks like "no results". `runtime.ts` resolves Node first.

### Read-only query path

Two processes writing the same SQLite file deadlocked on `SQLITE_BUSY` long enough to blow the
query timeout, after which the query returned nothing. The sync child is now the **sole writer**;
the query path opens read-only and passes `skipEnsureIndex: true`.

### Queued injection instead of prompting

The single largest saving. `client.session.promptAsync` is a full inference request.
`queueContextMessage` costs nothing. A test counts prompt calls across a fired hook and requires
zero.

### Read-only probe before a write lock

`pruneDanglingEdges` runs on every graph build. Opening the database for writing to execute a
`DELETE` that matches zero rows still takes an exclusive lock, and on a 20,992-edge table that
stalled concurrent readers for seconds. It now probes read-only and only opens for writing when
there is genuinely something to remove.

---

## Token efficiency

### The per-turn reminder

Rather than a wall of guidance on every turn, a short reminder is injected per turn, under a
character budget, stating the standing constraint. The size of that reminder is asserted by
`tests/global/efficiency-token.test.ts`.

### Retrieval ladder

Cheapest source first:

1. In-session cache
2. Local vector/graph recall (SQLite, no inference)
3. Multi-tier prompt cache
4. Hosted search — **only** when the local layers miss

### Failure-only reporting

`injectOn: "failure"` in [command hooks](plugins-command-hooks.md) is the mechanism, not a
nicety: a passing check reports nothing, so the hook costs zero tokens when everything is fine.

---

## Multi-tier prompt cache

| Namespace  | TTL          | Holds                                      |
| ---------- | ------------ | ------------------------------------------ |
| `tool`     | 15 min       | Tool results                               |
| `agent`    | 30 min       | Agent definitions                          |
| `llm`      | 1 hour       | LLM responses                              |
| `session`  | 24 h (memory)| Per-session context                        |
| `stable`   | 24 h         | Agent defs, skill frontmatter, routing     |
| `mcp`      | 7 days       | MCP responses                              |
| `context7` | 7 days       | Library documentation                      |
| `file`     | 24 h (memory)| File contents                              |

**The invalidation bug.** Entries were keyed on a bare SHA-256 hash while invalidation searched
for a literal tool-name prefix. The prefix could never match a hex string, so every write-side
invalidation was a silent no-op: stale `Glob`/`Grep` results after a `Write`, and stale
`modeState`/`agentContext`/`taskTodos` for their full TTL after any mutation.

The fix prefixes the **tool name** into the key, so invalidation addresses entries by name. It
also works across a process restart, when the in-memory index is empty but the persisted entries
on disk are not.

### Observability

`__hubsDiagnostics().cache` exposes per-namespace hit/miss counters. They existed but were
unreachable, so cache effectiveness could only be judged by timing a session by hand, and a
regression to per-turn retrieval was invisible until someone noticed latency.

---

## What the tests actually assert

`tests/global/efficiency-request.test.ts` and `efficiency-token.test.ts` — 37 tests, none of
which measure wall-clock, because a timing assertion in a parallel suite measures the machine
rather than the code.

| Property | How it is observed |
| -------- | ------------------ |
| Repeat prompt is served from cache | Session hit counter increments |
| Cache invalidation works | Second call after a write returns the fresh value |
| Child reuse | `childCount` does not grow with query count |
| Runtime correctness | `runtime.kind === 'node'` |
| Injection costs no request | `promptAsync` call count is 0 |
| Per-turn reminder is small | Character budget on the injected string |
| Retrieval ordering | The ladder is honoured |
| Negative caching | A repeated miss does not re-run the pipeline |

**Two flaky tests were rewritten rather than retried.** One asserted `elapsed < 1000ms` and failed
intermittently under full-suite load while passing 3/3 in isolation — it was measuring machine load.
The other asserted on every temp directory in `/tmp`, so an unrelated killed run left orphans and
it blamed the code under test. Both now assert on mechanism.

---

## Interdependencies

| This system uses | From |
| ---------------- | ---- |
| `queueContextMessage` | [Event Interception](plugins-hooks.md) |
| `injectOn: "failure"` | [Command Hooks](plugins-command-hooks.md) |
| `CacheManager.getStats()` | [Rules & Skills](rules-and-skills.md) |
| Turn/token budgets in focus state | [Orchestration](subagent-orchestration.md) |

→ Next: [Testing Strategy](testing-strategy.md)
