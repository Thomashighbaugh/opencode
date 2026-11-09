<!-- Parent: ../AGENTS.md -->

# hooks (V2 adapter over the V1 modules)

`index.ts` boots the V1 factory in `hooks.ts` and re-registers its hook map on the
V2 domains — a port by mapping, not a rewrite:

| V1 hook | V2 registration |
| --- | --- |
| `event` | `ctx.event.subscribe` |
| `tool.execute.before` / `.after` | `ctx.tool.hook` (after writes changed output back to `event.result.content`) |
| `chat.message` | `ctx.session.hook("prompt")` |
| `experimental.chat.system.transform` | `ctx.session.hook("context")` — strings converted to `{type:"text"}` parts |
| `experimental.session.compacting` | `ctx.session.hook("compaction")` — appends to `result.summary`, else queues context for the next turn |
| `permission.ask` | `ctx.permission.hook("evaluate")` — maps `shell` → legacy `bash` |
| `command.execute.before` / goal dispatch | `ctx.command.transform` for `/goal`; retired mode commands are no longer registered |

Everything the modules carry keeps running through the map: the vectorize indexer
(`vectorize-hook.ts`, fed by `file.edited`), the tool cache (`cache-hook.ts`),
mode state and keyword detection (`modes.ts`, `keywords.ts`), telemetry, goal
state, and context queueing (`session.ts`).

`/goal` is registered directly on `ctx.command.transform`; it supports
`/goal <objective>`, `status`, `pause`, `resume`, `clear`, `complete`, and
`blocked`. Goal continuation is driven by `goal-wire.ts` on `session.idle`,
which reads the finished turn from the OpenCode DB, checks completion markers,
records the turn budget, and submits a continuation with `resume: true`.

Known gap: V2 has no global command-execute hook, so arbitrary command text
cannot be intercepted; retired mode commands are no longer registered.
