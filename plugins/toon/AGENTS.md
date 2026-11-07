<!-- Parent: ../AGENTS.md -->

# toon (V2 + V1)

Compacts large JSON tool output to TOON in context and restores JSON before a later `bash` consumes it.

| Path | Role |
| --- | --- |
| `index.ts` | **V2 server entry** — `ctx.tool.hook("execute.before"/"execute.after")` |
| `v1.ts` | V1 plugin (frozen with the `v1` branch) |
| `toon.ts` | Self-contained codec; `encode` returns null rather than emit anything it cannot decode |

Eligible tools default to `bash`, `hubMenu`, `codeSearch`, `cache`, and the edit family (`OPENCODE_TOON_TOOLS` overrides). Every conversion is verified by a round trip.
