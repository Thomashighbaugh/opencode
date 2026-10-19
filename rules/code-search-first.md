---
name: code-search-first
description: Default code retrieval path — use the codeSearch tool for codebase questions; reserve Grep for exact-string plumbing and Read for files you already know you need.
---

# Code Search First

**The `codeSearch` tool is the default way to find code in a project.** It answers "where is X / how does Y work" with ranked `file:start-end` locations and trimmed snippets — the grep+read pattern (grep for a name, read the file, read another, piece it together) in one call, using ~99% fewer tokens.

It runs on this config's stack: local bge-small embeddings + BM25, RRF-merged, cross-encoder reranked (bge-reranker-base), indexed under `.opencode/state/vector/codesearch/` and invalidated by mtime. No daemon, no network at query time.

## Decision Order

| # | If you need... | Use |
|---|----------------|-----|
| 1 | To find where something is defined / how a behavior is implemented / which files touch a concept | `codeSearch` — one call, locations back |
| 2 | An exact string: an error message, a literal constant, a specific identifier spelling, a regex over the whole tree | `Grep` — `codeSearch` is semantic, not literal |
| 3 | A specific file you already know you need | `Read` — no search involved |
| 4 | To triage before reading | `codeSearch` with `maxSnippetLines: 0` → locations only, then `Read` the winners |

**Never grep-then-read to answer a "where/what" question.** That chain is 3–5 tool calls and the full text of every file opened. `codeSearch` is one call and returns only the relevant chunks.

## How To Query

| Query type | Example | What the tool does |
|------------|---------|--------------------|
| Natural language | `"how does the prompt queue fire"` | alpha 0.5, semantic + BM25 balanced |
| Symbol | `"SessionManager"`, `"auth::verify"` | alpha 0.3, leans on exact identifier match; definition boost |
| Error text | `"Cannot read properties of undefined"` | use `Grep` instead — it is a literal string |

- `content`: `code` (default) | `docs` | `config` | `all`
- `topK`: default 5. Raise for breadth, lower for a quick answer.
- `maxSnippetLines`: `0` = locations only, `10` (default) = signature + first lines, omit for the full chunk.
- `reindex: true` forces a rebuild. Only needed if the mtime cache looks stale.
- `stats: true` reports index state without searching.

## Failure Shape

- `ok: false, error: ...` — the index or a model failed. The error is real; surface it, don't silently fall back to grep and present an empty answer.
- `results: []` — a genuine negative. Say so.
- A missing embedder model → run `npx tsx skills/vectorize-context/scripts/prefetch-models.ts` once.
