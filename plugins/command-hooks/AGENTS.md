<!-- Parent: ../AGENTS.md -->

# command-hooks (V1)

File-write hook runner driven by `command-hooks.jsonc`. Runs a command when a matching tool writes a file and injects its output into context on failure.

| File | Role |
| --- | --- |
| `index.ts` | V2 entry: registers the runtime's `before`/`after`/`event` directly on `ctx.tool.hook` and `ctx.event.subscribe` |
| `v1.ts` | All matcher/executor logic + `createCommandHooksRuntime`; the V1 factory wraps the same runtime |
| `plugin.ts` | V1 loader entry (frozen branch) |
| `index.ts` | Matcher, debounce, execution, injection |
| `config.ts`, `schema.ts` | JSONC config parsing and validation |

V1 hook API only; V2 port needs `ctx.tool.hook("execute.after", …)`.
