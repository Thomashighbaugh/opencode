<!-- Parent: ../AGENTS.md -->

# toon (V2 + V1)

Compacts large JSON tool output to TOON in context and restores JSON before a later `bash` consumes it.

| Path | Role |
| --- | --- |
| `index.ts` | **V2 server entry** — `ctx.tool.hook("execute.before"/"execute.after")` |
| `toon.ts` | Self-contained codec; `encode` returns null rather than emit anything it cannot decode |

Eligible tools default to `bash`, `hubMenu`, `codeSearch`, `cache`, and the edit family (`OPENCODE_TOON_TOOLS` overrides). Every conversion is verified by a round trip.

`ax` output arrives through `bash`, so API payloads it fetches are compacted here too. Prefer `ax URL --body` for JSON APIs: the default envelope nests the payload as a string field, which TOON cannot compact.
