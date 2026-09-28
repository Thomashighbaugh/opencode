---
name: vectorize-context
description: Vector DB for semantic retrieval over context, rules, docs, AGENTS.md AND project source code — Ollama embeddings + ONNX rerank, injected via hooks, maintained by /project vectorize
relatedSkills: graph-context, self-improvement, wiki, harvest-context
level: 2
license: MIT
---

# Vectorize Context

Indexes scoped project markdown (`.opencode/context/`, `.opencode/rules/`, `.opencode/docs/`, root `AGENTS.md`) **and the project source tree** into two local sqlite-vec vector databases for semantic retrieval. **Local-only** — embeddings run via Ollama at `127.0.0.1:11434`; reranking runs via an ONNX cross-encoder (`@huggingface/transformers`). **Zero provider API requests** during retrieval or injection.

## Two Stores

| Store | DB | Sources | Chunking |
|-------|----|---------|----------|
| **context** | `.opencode/state/vector/context.db` | `.opencode/context/**`, `.opencode/rules/**`, `.opencode/docs/**`, `AGENTS.md` | `##`/`###` heading boundaries |
| **code** | `.opencode/state/vector/code.db` | Project source tree (`.ts .js .py .go .rs …`), skipping `node_modules`, `.git`, `dist/build/vendor` dirs, and `.opencode/state` + `.opencode/cache` (privacy) | Declaration boundaries (function/class/const/def at col 0), 60-line / 6KB caps |

The code store uses a looser ANN distance floor (0.92 vs 0.8) — code embeddings sit at higher distances than markdown.

## How It Works

The system uses **lazy freshness**: every query automatically stats all scoped files, re-indexes only what changed, then searches. This covers every write path:

| Trigger | Behavior |
|---------|----------|
| Hub writes a new context/decision/pattern file | Next query picks it up automatically |
| `/harvest-context` saves research docs | Indexed on next query |
| `/orchestrate` completes and saves patterns | Indexed on next query |
| `/ideation` finalizes a plan to context | Indexed on next query |
| Direct `.md` file edit in scoped dirs | Indexed on next query |
| Source file edited/created in project tree | Hook sync re-indexes it (10s poll) |
| Plugin watcher detects file change | `vectorize-hook.ts` spawns `sync-hook.mjs` (10s poll) |
| Full re-index needed | Delete `.opencode/state/vector/*.db` — auto-rebuilds on next query |

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
| `scripts/vectorize.mjs` | CLI: manual re-index (`--all` default, `--context`, `--code`) |
| `scripts/query.mjs` | CLI: semantic search (`--code` for the code store) |
| `scripts/sync-hook.mjs` | **Child-process** maintenance sync — spawned by `vectorize-hook.ts`; only syncs stores that already exist (builds are manual via `vectorize.mjs`) |
| `scripts/query-hook.mjs` | **Child-process** store query — spawned by the transform hook in `hooks.ts`; outputs `{context, code}` JSON |

## Programmatic API (veclib.mjs)

Used by Hubs hub subcommands, agents, and the hooks plugin (via child processes):

```js
// Lazy re-index: stats files, only loads model if something changed
import { ensureIndexed, ensureCodeIndexed } from './veclib.mjs';
await ensureIndexed();                // context store, current project
await ensureCodeIndexed();            // code store, current project
await ensureIndexed('/path/to/app');  // specific project (or .opencode dir)

// Semantic search (auto-refreshes index first)
import { queryChunks, queryCodeChunks } from './veclib.mjs';
const results = await queryChunks(undefined, 'auth patterns', 10);
const codeResults = await queryCodeChunks(undefined, 'chunking logic', 5);
// results: [{ source, heading, content, file_path, distance, rerank_score? }]

// Single-file upsert (hook path)
import { vectorizeFile, vectorizeCodeFile } from './veclib.mjs';
await vectorizeFile('/abs/path/file.md', projectRoot);
await vectorizeCodeFile('/abs/path/src/main.ts', projectRoot);

// Index stats
import { getIndexStats, getCodeIndexStats } from './veclib.mjs';
const stats = await getIndexStats();
// { exists, totalChunks, totalFiles, embedding: { model, dim }, files: [...] }
```

`queryChunks(projectRoot, query, topN, { useReranker: true })` — two-stage retrieval: ANN distance floor (0.8 context / 0.92 code) on ~20 candidates, then in-process cross-encoder rerank to top-N. If the reranker fails (model missing, timeout), it falls back to distance ordering — same behavior as rerank-less retrieval.

## CLI Usage

```bash
# Manual re-index — context + code (default), or per store
node {skill_dir}/scripts/vectorize.mjs            # both stores
node {skill_dir}/scripts/vectorize.mjs --code     # code store only
node {skill_dir}/scripts/vectorize.mjs --context  # context store only

# Semantic search (auto-refreshes on every call)
node {skill_dir}/scripts/query.mjs "how does error handling work"
node {skill_dir}/scripts/query.mjs --code "chunking logic"
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

## Tests

Hermetic suite — zero network, zero native-model deps (a deterministic hash embedder + mock `/api/embed` server stand in for Ollama):

```bash
cd scripts && npm test          # 45 tests: veclib units + CLI + hook-script integration
```

| File | Coverage |
|------|----------|
| `tests/veclib.test.mjs` | Path resolution, collectors (skip rules), chunkers (frontmatter, boundaries, line/char caps), indexing (fresh/incremental/deletion/idempotent), single-file vectorization, queries (ranking, floors, topK, lazy ensure, store separation), rerank degradation, stats, schema rebuild on model change, missing/corrupt DB grace |
| `tests/cli.test.mjs` | `vectorize.mjs` flags, `query.mjs` (usage/context/code), `sync-hook.mjs` maintenance mode (skip-missing contract), `query-hook.mjs` payload shape + never-crash contract, **plugin source regression guards** (no `veclib.mjs` import in the plugin — the kernel-panic architecture; spawn/SIGKILL/childRunning/setInterval present) |
| `tests/e2e.test.mjs` | **Opt-in** (`RUN_E2E=1 npm run test:e2e`): full pipeline against real Ollama + real reranker. Skips gracefully when Ollama is unreachable. Validates the mock never drifts from the real API contract |

Test env overrides (also useful in production): `OLLAMA_URL` (mock server), `EMBED_MODEL`, `RERANK_MODEL`, `RERANK_DISABLED=1` (force distance-only path, CI-friendly).

## Integration Points

### Automatic Injection (hooks plugin) — child-process isolated

The plugin (`plugins/hooks/hooks.ts` + `vectorize-hook.ts`) provides automatic context + code injection. **Crash hardening: the plugin process never loads veclib or native modules** (better-sqlite3, sqlite-vec, ONNX). All indexing and querying happens in short-lived child processes:

1. `chat.message` captures the user's latest prompt (per session, 2000-char slice)
2. `experimental.chat.system.transform` runs on the next turn:
   - Skips for simple prompts (complexity keyword gate)
   - Spawns `query-hook.mjs` (node child, 25s hard kill) → queries **both** stores with the **real user prompt** (not the model ID)
   - Builds `<Relevant_Context>` (budget 1000 tokens) + `<Relevant_Code>` (budget 800 tokens) blocks
   - 5-min session cache per store on prompt hash — repeat queries hit cache, no child spawn
   - Clears the stored prompt after use (no stale injection)
   - Any failure → silent skip (try/catch), zero impact on the turn
3. `vectorize-hook.ts` keeps stores fresh: every 10s spawns `sync-hook.mjs` (maintenance mode — **skips stores that don't exist yet**; the full build is `/project vectorize`), one child at a time, SIGKILL after 90s. A fresh install can never trigger a first-run index storm.

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

- Stores: `.opencode/state/vector/context.db` + `code.db` (sqlite-vec)
- Gitignored via `.opencode/state/` — never committed; fresh clones build their own stores lazily
- Schema versioned in a `meta` table (`embedding_model`, `embedding_dim`) — if the embedding model or dimension changes, the store is dropped and rebuilt automatically

## How It Works Internally

1. `ensureIndexed()` scans scoped sources (context/rules/docs/AGENTS.md) for `*.md` files; `ensureCodeIndexed()` walks the project tree (skip dirs: node_modules, .git, dist/build/vendor, .opencode/state, .opencode/cache)
2. Compares current file mtimes against stored mtimes in the DB
3. If no files changed → returns immediately, no model loaded
4. If files changed → calls Ollama `/api/embed` (1024-dim `mxbai-embed-large`) in **batches of 32 texts** (one request per batch, not per file), chunks changed files (`##`/`###` headers for markdown; declaration boundaries for code)
5. Deletes old chunks for changed files, inserts new ones
6. Query: ANN L2-distance search (floor 0.8 context / 0.92 code, ~20 candidates) → in-process cross-encoder rerank (bge-reranker-base, sigmoid on single logit) → top-N
7. Query always runs against the freshly-updated index

The vec0 virtual table uses L2 distance. Since embeddings are normalized (unit vectors), L2 distance sorts equivalently to cosine similarity — nearest neighbors are the most semantically similar chunks.
