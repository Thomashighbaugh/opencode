# memory-system

Local long-term memory for OpenCode. One SQLite file beside the existing vector
stores, using the same `sqlite-vec` extension and in-process ONNX runtime as
`context.db` and `code.db`.

## Storage

`.opencode/state/vector/memory.db`

- `memories` + `memories_fts` + `memories_vec` (`vec0`)
- `context_items` (goal / decision / gotcha / progress)
- `memory_relations`, `memory_files`, `memory_conflicts`, `proposals`, `audit`

Embeddings come from `skills/vectorize-context/scripts/embedder.ts`; no model
name is pinned here. Reranking uses the shared cross-encoder when its ONNX files
are already cached. Classification uses the shared NLI/classifier heads; when a
model is absent, lexical fallback is used and no verdict is fabricated.

## Tools

`memory_learn`, `memory_recall`, `memory_get`, `memory_forget`, `memory_relate`,
`memory_context`, `memory_context_add`, `memory_stale`, `memory_revalidate`,
`memory_proposals`, `memory_conflicts`, `memory_stats`, `memory_janitor`,
`memory_graph`.

## Hooks

- `session.hook("prompt")` records the prompt for per-prompt recall.
- `session.hook("context")` injects project context + memory index + prompt recall.
- `session.hook("compaction")` stores a deterministic progress summary and injects current context.
- `tool.hook("execute.after")` marks anchored memories stale after a successful `git commit`.

## Env

| Variable | Default | Meaning |
| --- | --- | --- |
| `MEMORY_DB_PATH` | `<project>/.opencode/state/vector/memory.db` | database path |
| `MEMORY_EMBED=0` | off | disable embeddings (FTS-only) |
| `MEMORY_CLASSIFY=0` | off | disable NLI classification |
| `RERANK_DISABLED=1` | off | skip reranking |
| `EMBED_ONNX_MODEL` | runtime default | embedding model |
| `RERANK_MODEL` | runtime default | reranker model |

Recall: FTS5 top 50 + vec0 top 50 -> RRF -> local rerank -> SQL importance,
confidence, decay, stale, and project scope. No hosted call.
