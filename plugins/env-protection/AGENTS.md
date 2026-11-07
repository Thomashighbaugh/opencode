<!-- Parent: ../AGENTS.md -->

# env-protection (V2)

Local replacement for `@opencode-plugins/env-protection` (V1-only package, removed from the plugin list).
Blocks `read` on paths containing `.env`, `.credential`, or `.secret` via `ctx.tool.hook("execute.before", …)`.
OpenCode V2 has no built-in equivalent.
