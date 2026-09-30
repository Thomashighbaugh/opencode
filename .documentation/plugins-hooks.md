# Event Interception — `plugins/hooks/`

The primary plugin. It registers eight hook points and is the reason most of this configuration
behaves the way it does: caching, mode detection, context injection, permission policy, and the
event-driven knowledge sync all hang off it.

| File                      | LOC   | Role                                                           |
| ------------------------- | ----: | -------------------------------------------------------------- |
| `hooks.ts`                | 1,501 | Plugin entry; all hook registration and dispatch              |
| `session.ts`              |   636 | Session lifecycle, pending-message queue, stall classification |
| `focus.ts`                |   614 | Session focus/goal state, turn and token budgets               |
| `keywords.ts`             |   282 | Magic-keyword detection (`ralph`, `autopilot`, …) — **detect only** |
| `modes.ts`                |   258 | Mode state machine, persistence, resume                        |
| `vectorize-hook.ts`       |   224 | Event-driven sync supervisor for the knowledge plane           |
| `child-registry.ts`       |   137 | Child-process lifecycle, reuse, GC                             |
| `telemetry.ts`            |   132 | Stall classification, heartbeat                                |
| `runtime.ts`              |   114 | Node-first interpreter resolution                              |
| `compaction-hook.ts`      |    48 | Pre-compaction state preservation                             |
| `cache-hook.ts`           |    41 | Tool-cache invalidation wiring                                 |

---

## Registered hook points

```ts
hooks["chat.message"]
hooks["command.execute.before"]
hooks["experimental.chat.system.transform"]
hooks["experimental.session.compacting"]
hooks["permission.ask"]
hooks["tool.execute.before"]
hooks["tool.execute.after"]
hooks.event              // session.created, session.deleted
```

---

## The context-injection pipeline

This is the plugin's most important mechanism, because
[`plugins/command-hooks/`](plugins-command-hooks.md) depends on it.

```
  event fires
      │
      ├─▶ queueContextMessage(sessionId, text)     ← cheap path, no inference
      │        session.ts · bounded at 20 messages
      │
      └─▶ next turn: experimental.chat.system.transform
               └─▶ consumeContextMessages(sessionId)
                        └─▶ appended to the system prompt
```

A producer anywhere in the system — the hooks plugin, command hooks, a hub command, a skill —
writes into one queue, and the next turn drains it. **The producer never spends an inference
request to be heard.**

This is the single most important design decision in the repository. The upstream
`opencode-command-hooks` package injects with `client.session.promptAsync`, which is a full
inference request per result and lands the text as a synthetic user turn. Routing through the
queue instead makes a hook result cost zero extra requests.

`tests/global/efficiency-request.test.ts` asserts this directly: it counts `promptAsync` calls
across a fired hook and requires zero.

---

## Tool-result caching

`tool.execute.before` / `tool.execute.after` implement a positive cache for expensive read-only
tools.

```
  before  ─▶ compute cache key = tool name + hash(args)
           ─▶ if hit: return cached output, skip the tool entirely
           ─▶ if miss: run, and remember the args for the after-hook
  after   ─▶ if this call had a cached entry: substitute → no second call
           ─▶ else: run, store under the same key
  write   ─▶ invalidate affected namespaces
```

**The bug this replaced.** `invalidateToolCache` was keyed on a bare SHA-256 hash while its
prefix search looked for a literal tool name. The prefix could never match a hex string, so
every write-side invalidation was a silent no-op: stale `Glob`/`Grep` results after a `Write`, and
stale `modeState`/`agentContext`/`taskTodos` for their full TTL after any mutation. The fix
prefixes the *tool name* into the key so invalidation addresses entries by name rather than by
hash.

`tests/global/efficiency-request.test.ts` drives all of it and asserts observable effects.

---

## Mode detection is detection, not activation

`keywords.ts` scans for `ralph`, `autopilot`, `ultrawork`, `deep interview`, `cancel`. On a
match it injects a `<mode-detected names="...">` context message.

It **never activates the mode.** `AGENTS.md` is explicit: the plugin detects, and the agent must
propose and get approval. Auto-activation on a keyword is the failure mode where an agent
silently starts looping.

```ts
// A keyword proposes. A human disposes.
queueContextMessage(sessionId, `<mode-detected names="${names}">…`)
```

---

## Vectorize supervisor — event-driven, not polled

`vectorize-hook.ts` keeps the knowledge plane fresh **without** the agent paying to remember.

The previous design required the agent to call a maintenance command; if it did not, the index
silently rotted. Now the supervisor reacts to the events that actually change code:

| Event                     | Response                        |
| ------------------------- | ------------------------------- |
| `tool.execute.after` on a write | debounced sync of that path |
| `session.created`         | warm the session cache           |
| `session.idle`            | incremental graph rebuild        |
| compaction                | checkpoint the store             |

`child-registry.ts` then guarantees the child count does not grow with query count. `runtime.ts`
resolves the interpreter to Node before Bun, because **Bun hard-crashes with a NAPI FATAL ERROR
on `require('better-sqlite3')`** — under Bun the child dies at startup and queries silently return
nothing.

→ [Knowledge Plane](knowledge-plane.md) covers what the supervisor maintains.

---

## Focus and budgets

`focus.ts` maintains a session-scoped goal with explicit **turn and token budgets**.

This is where `rules/efficiency-first.md` stops being prose. The rule says a standing constraint
applies every interaction cycle; `focus.ts` is the mechanism that can observe whether it is
being honoured, and `modes.ts` can halt a run that blows its budget.

---

## Permission policy

`permission.ask` auto-approves a narrow, enumerated set of bash commands and **injects a record of
what it approved**:

```ts
queueContextMessage(sessionId,
  `<permission-auto-approved type="bash">\nSafe command auto-approved: ${command}\n…`)
```

The agent can therefore see what was waved through — policy that is invisible is policy that
cannot be audited.

---

## Diagnostics

`__hubsDiagnostics()` is the observability surface. It exists because a previous version could not
answer "did the sync fire?" and "is it leaking a child?" without attaching a debugger to the
process.

```ts
{
  runtime:  { kind: 'node', cmd: '…' },
  vectorize:{ synced, lastSyncAt, … },
  childCount, children: [...],
  cache:    { session: { hits, misses }, tool: { … }, … }   // added by this work
}
```

The `cache` block is the one that makes the request-budget claim *measurable*. Hit/miss counters
existed but were unreachable, so cache effectiveness could only be judged by timing a session by
hand. A regression to per-turn retrieval was invisible until someone noticed latency.

---

## Interdependencies

| Consumes                                 | From                                        |
| ---------------------------------------- | ------------------------------------------- |
| `queueContextMessage`                    | [command-hooks](plugins-command-hooks.md)    |
| Ollama embeddings, `better-sqlite3`      | [knowledge plane](knowledge-plane.md)        |
| child-process supervision                | [vectorize supervisor](knowledge-plane.md)   |
| `rules/efficiency-first.md` budgets      | [efficiency](request-token-efficiency.md)    |
| persisted mode/focus state               | [memory system](memory-system.md)            |

---

## Extending

Add behaviour by wrapping an existing hook point rather than replacing the plugin — a second
`tool.execute.after` registration replaces the first, not composes with it. For genuinely
independent behaviour, use [`plugins/command-hooks/`](plugins-command-hooks.md), which is
designed to compose.

**Failure containment.** Nothing here may throw into a tool call. A broken cache must not become a
failed tool. Every handler is wrapped, and a failure is recorded rather than propagated.
