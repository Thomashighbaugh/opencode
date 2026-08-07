---
name: vectorize-context
description: Vector DB for semantic retrieval over .opencode/context/, rules/, docs/ and AGENTS.md — Ollama embeddings, injected into prompts via hooks. Triggered via /harvest-context search
level: 2
license: MIT
---

# Vectorize Context

Indexes scoped project markdown (`.opencode/context/`, `.opencode/rules/`, `.opencode/docs/`, root `AGENTS.md`) into a local sqlite-vec vector database for semantic retrieval. **Local-only** — embeddings run via Ollama at `127.0.0.1:11434`; reranking runs **in-process** via an ONNX cross-encoder (`@huggingface/transformers`). **Zero provider API requests** during retrieval or injection.

## How It Works

The system uses **lazy freshness**: every query automatically stats all scoped files, re-indexes only what changed, then searches. This covers every write path:

| Trigger | Behavior |
|---------|----------|
| Hub writes a new context/decision/pattern file | Next query picks it up automatically |
| `/harvest-context` saves research docs | Indexed on next query |
| `/orchestrate` completes and saves patterns | Indexed on next query |
| `/ideation` finalizes a plan to context | Indexed on next query |
| Direct `.md` file edit in scoped dirs | Indexed on next query |
| Plugin watcher detects file change | `vectorize-hook.ts` re-indexes that file (10s poll) |
| Full re-index needed | Delete `.opencode/state/vector/context.db` — auto-rebuilds |

The embedding model is **only called when there's actual work to do** (files changed). If everything is up to date, `ensureIndexed()` returns instantly with no Ollama calls.

## Scoped Sources

| Path | Included |
|------|----------|
| `.opencode/context/**` (frameworks, patterns, research, decisions) | Yes |
| `.opencode/rules/**` | Yes |
| `.opencode/docs/**` | Yes |
| Root `AGENTS.md` | Yes |
| Everything else | No |

## Scripts

| Script | Purpose |
|--------|---------|
| `scripts/veclib.mjs` | Shared library — exported programmatic API for all integrations |
| `scripts/vectorize.mjs` | CLI: manual re-index (for debugging/forced refresh) |
| `scripts/query.mjs` | CLI: semantic search over scoped sources |

## Programmatic API (veclib.mjs)

Used by Hubs hub subcommands, agents, and the hooks plugin:

```js
// Lazy re-index: stats files, only loads model if something changed
import { ensureIndexed } from './veclib.mjs';
await ensureIndexed();                // current project
await ensureIndexed('/path/to/app');  // specific project (or .opencode dir)

// Semantic search (auto-refreshes index first)
import { queryChunks } from './veclib.mjs';
const results = await queryChunks(undefined, 'auth patterns', 10);
// results: [{ source, heading, content, file_path, distance }]

// Index stats
import { getIndexStats } from './veclib.mjs';
const stats = await getIndexStats();
// { exists, totalChunks, totalFiles, embedding: { model, dim }, files: [...] }
```

`queryChunks(projectRoot, query, topN, { useReranker: true })` — two-stage retrieval: ANN distance floor (0.8) on ~20 candidates, then in-process cross-encoder rerank to top-N. If the reranker fails (model missing, timeout), it falls back to distance ordering — same behavior as rerank-less retrieval.

## CLI Usage

```bash
# Manual re-index (useful for debugging)
node {skill_dir}/scripts/vectorize.mjs

# Semantic search (auto-refreshes on every call)
node {skill_dir}/scripts/query.mjs "how does error handling work"
QUERY="auth patterns" node {skill_dir}/scripts/query.mjs
```

## Output Format

### Query results
```
=== Search Results ===

1. patterns/error-handling.md — Error Patterns (score: 0.71)
   Error handling follows a centralized approach with...
   [file: .opencode/context/patterns/error-handling.md]

2. frameworks/architecture.md — System Design (score: 0.64)
   The project follows a layered architecture...
   [file: .opencode/context/frameworks/architecture.md]
```

## Dependencies

```bash
npm install better-sqlite3 sqlite-vec @huggingface/transformers
```

Requires Node.js 18+ and a running Ollama server (`http://127.0.0.1:11434`) for embeddings:

| Model | Purpose | Dimension |
|-------|---------|-----------|
| `pedrohml/mxbai-embed-large:latest` | Embeddings (via `/api/embed`) | 1024 |

**Reranking** uses an in-process ONNX cross-encoder — no server-side rerank API needed (works even on Ollama builds without `/api/rerank`):

| Model | Purpose | Notes |
|-------|---------|-------|
| `Xenova/bge-reranker-base` (override via `RERANK_MODEL` env) | Cross-encoder rerank | q8 quantized ONNX, ~280MB, cached under `node_modules/@huggingface/transformers/.cache/` |

Reranking is a single-logit sigmoid cross-encoder (loaded via `AutoModel` + sigmoid — transformers.js has no built-in `rerank` pipeline). First query after install downloads the model (~280MB, one-time). If the model or download fails, retrieval silently falls back to distance ordering.

## Integration Points

### Automatic Injection (hooks plugin)

The plugin (`plugins/hooks/hooks.ts` + `vectorize-hook.ts`) provides automatic context injection:

1. `chat.message` captures the user's latest prompt (per session, 2000-char slice)
2. `experimental.chat.system.transform` runs on the next turn:
   - Skips for simple prompts (complexity keyword gate)
   - Calls `queryChunks()` with the **real user prompt** (not the model ID)
   - Builds `<Relevant_Context>` block, truncated to `CONTEXT_TOKEN_BUDGET` (1000 tokens)
   - 5-min session cache on prompt hash — repeat queries hit cache, no local search
   - Clears the stored prompt after use (no stale injection)
   - Any failure → silent skip (try/catch), zero impact on the turn

### Manual Trigger (`/harvest-context search`)

After any hub subcommand writes to scoped dirs:
1. Write the file (existing behavior)
2. Run `/harvest-context search` to index and query — no automatic indexing required (but the hook watcher does it anyway)

### Agent Integration

Agents can use `queryChunks()` to retrieve relevant context during execution:

```js
const ctx = await queryChunks(process.cwd() + '/.opencode', query, 5);
// Inject results into agent context as supporting evidence
```

### Forced Re-index

```bash
rm -f .opencode/state/vector/context.db    # Delete the DB
# Next query or ensureIndexed() call auto-rebuilds it
```

## Storage & Git

- Store: `.opencode/state/vector/context.db` (sqlite-vec)
- Gitignored via `.opencode/state/` — never committed; fresh clones build their own store lazily
- Schema versioned in a `meta` table (`embedding_model`, `embedding_dim`) — if the embedding model or dimension changes, the store is dropped and rebuilt automatically

## How It Works Internally

1. `ensureIndexed()` scans scoped sources (context/rules/docs/AGENTS.md) for `*.md` files
2. Compares current file mtimes against stored mtimes in the DB
3. If no files changed → returns immediately, no model loaded
4. If files changed → calls Ollama `/api/embed` (1024-dim `mxbai-embed-large`), chunks new/changed files by `##`/`###` headers
5. Deletes old chunks for changed files, inserts new ones
6. Query: ANN L2-distance search (floor 0.8, ~20 candidates) → in-process cross-encoder rerank (bge-reranker-base, sigmoid on single logit) → top-N
7. Query always runs against the freshly-updated index

The vec0 virtual table uses L2 distance. Since embeddings are normalized (unit vectors), L2 distance sorts equivalently to cosine similarity — nearest neighbors are the most semantically similar chunks.
