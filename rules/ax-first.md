---
name: ax-first
description: Use ax instead of curl (and instead of throwaway python/node parsers) for web fetches, HTML extraction, and API calls. Its JSON output is compacted by the TOON plugin.
---

# ax First

`ax` is installed (`~/.local/state/nix/profile/bin/ax`, 0.1.25) and is the default
tool for anything that touches HTTP. It is curl parity without silence: every
response prints `{status, ok, url, redirected, ms, headers, body}`, so failures are
visible instead of quietly empty.

## Mandate

| Instead of                                   | Use                                            |
| -------------------------------------------- | ---------------------------------------------- |
| `curl https://api.example/v1/items`            | `ax https://api.example/v1/items`                |
| `curl -s URL \| python3 -c "import json,sys; …"` | `ax URL` (JSON is already parsed; then `--row`)   |
| `curl URL \| python3 - <<'PY'` HTML parsing     | `ax URL --outline` → `--locate` → `--row`/`--table` |
| regex/sed over HTML                          | `ax URL '.selector' --row 'a=a, b=a@href'`         |
| dumping a page into context                  | `ax URL --md` (readable markdown, capped)         |

`curl` survives only where `ax` cannot do the job: WebSocket upgrades, streaming
downloads to a pipe, or an endpoint that requires curl-specific flags. Say which
one and why in the same sentence.

Throwaway parsers are the thing to avoid most: a `python3 -c` block that greps a
page costs an inference round-trip to write, another to read its output, and it
re-parses what `ax` already structured.

## Output rules

- JSON bodies are parsed and printed as objects; `--body` prints the payload alone,
  uncapped (`--body` is what you want when the response itself is JSON).
- `--row`/`--table` report `N rows extracted` and empty-field counts on stderr —
  treat those as the completeness check.
- `--outline` and `--locate` answer "where is this?" without loading the page.
- Parse mode caches for ~2 min, so probing is free; `--fresh`/`--no-cache` when it
  matters.

## Integration with TOON

Every `ax` call is a `bash` tool call, and `bash` is TOON-eligible
(`plugins/toon/index.ts`). Large JSON — API payloads, or `ax --body` responses —
is rewritten as TOON in context automatically and restored to JSON before a later
command consumes it.

Two consequences:

1. Prefer `ax URL --body` for JSON APIs so the payload is the top-level object.
   The default envelope wraps the payload in a `body` field, which TOON cannot
   compact because it is a string inside an object.
2. Do not pipe `ax` output through `jq`/`python` to "clean it up" — that trades a
   compacted, round-trip-verified payload for an uncompacted one.

## When not to use ax

- Interactive OAuth flows or tools that need a browser session.
- Binary downloads larger than the 20 MB cap (`--max-bytes` raises it).
- Non-HTTP work: local files, git, package managers.

Full playbook: `ax agent-context` or `skills/ax/SKILL.md`.
