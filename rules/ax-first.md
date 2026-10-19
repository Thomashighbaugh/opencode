---
name: ax-first
description: Use ax instead of curl for web/API fetches, page-to-markdown conversion, and HTML extraction. curl remains only where ax cannot replace it.
---

# ax First — Reach for ax, not curl

[`ax`](https://github.com/yusukebe/ax) is installed on this system (Nix profile, `github:yusukebe/ax`). It is the AI-era curl: fetch, discover, extract in one command. Use it in place of `curl` wherever possible — in shell commands, scripts, examples, and agent instructions.

## Decision Order

| # | Situation | Use |
|---|-----------|-----|
| 1 | Fetch a URL / API endpoint and inspect the response | `ax URL` — always reports `{status, ok, url, redirected, ms, headers, body}`, never silent |
| 2 | Read a docs page or article as markdown | `ax URL --md [--budget <tokens>]` — not curl piped to a converter |
| 3 | Extract structured data from HTML (rows, tables, attributes) | `ax URL '.sel' --row 'a=b, c=d@href'` / `--table` — not curl + regex/htmlq |
| 4 | Probe an unknown page's structure | `ax URL --outline` / `ax URL --locate 'text'` — never dump raw HTML into context |
| 5 | Pipe a response body onward to another tool | `ax URL --body` — body only on stdout, status notes on stderr |
| 6 | Raw byte-level control curl has but ax doesn't (custom TLS client certs, FTP/SFTP, `--resolve`, HTTP/1.0 quirks, multipart form upload, resumable range downloads, proxy auth dance) | `curl` — ax is HTTP(S) fetch/parse only; keep curl for these |

When in doubt, `ax --help` or `ax agent-context` for the full flag reference.

## Mapping curl reflexes to ax

| curl | ax |
|------|-----|
| `curl -fsSL URL` | `ax URL` (errors already reported; `-f` accepted if a nonzero exit is needed) |
| `curl -s URL \| jq ...` | `ax URL --body \| jq ...` or just `ax URL` (JSON bodies are parsed and shown) |
| `curl -I URL` | `ax -I URL` |
| `curl -u user:pass URL` | `ax -u user:pass URL` |
| `curl -X POST -d 'data' URL` | `ax URL -X POST -d 'data'` |
| `curl -o file URL` | `ax -o file URL` |
| `curl -m 10 URL` | `ax -m 10 URL` |
| `curl -H 'K: V' URL` | `ax -H 'K: V' URL` |
| `curl URL > page.html` then eyeball the HTML | `ax URL --outline` then `ax URL --md` — raw HTML never hits the context window |

## Why

- **curl is silent** on an empty 200 body; ax always reports status, headers, timing, and the final URL after redirects.
- **Structured extraction** (`--row`, `--table`, `--where`) replaces the curl+regex/throwaway-python loop that breaks on markup drift.
- **Token-cheap by design**: results cap at 50 with announced truncation and an `--offset` continuation path; `--budget` cuts at item boundaries.
- **Parse-mode URL caching (~2 min)** makes repeated probes free.

Full playbook: `ax agent-context`, or the bundled skill at `skills/ax/SKILL.md`.
