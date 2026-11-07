<!-- Parent: ../AGENTS.md -->

# command-hooks (V1)

File-write hook runner driven by `command-hooks.jsonc`. Runs a command when a matching tool writes a file and injects its output into context on failure.

| File | Role |
| --- | --- |
| `plugin.ts` | Loader entry (`tool.execute.after`) |
| `index.ts` | Matcher, debounce, execution, injection |
| `config.ts`, `schema.ts` | JSONC config parsing and validation |

V1 hook API only; V2 port needs `ctx.tool.hook("execute.after", …)`.
