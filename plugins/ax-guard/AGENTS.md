<!-- Parent: ../AGENTS.md -->

# ax-guard (V2)

Enforces `rules/ax-first.md` at the tool boundary: `ctx.tool.hook("execute.before")`
throws on bash commands that start an HTTP fetch with `curl`/`wget`, or that use a
`python -c` / `node -e` one-liner with urllib/requests/fetch/cheerio to read a URL.

The thrown message lists the ax alternatives (`--body`, `--md`, `--outline`,
`--locate`, `--row`, `--table`). curl remains available for WebSocket/streaming
and curl-only flags — the guard matches only commands containing an `http(s)://`
URL.

Logic: `guard.ts` (pure, unit-tested in `tests/plugins/ax-guard.test.ts`).
