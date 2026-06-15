---
name: vectorize-context
description: Manual vector DB for semantic search over .opencode/context/ — triggered via /harvest-context search
level: 2
---

# Vectorize Context

Indexes `.opencode/context/` markdown files into a local sqlite-vec vector database for semantic search. **Manual trigger only** — invoked via `/harvest-context search`.

## How It Works

The system uses **lazy freshness**: every query automatically stats all context files, re-indexes only what changed, then searches. This covers every write path:

| Trigger | Behavior |
|---------|----------|
| Hub writes a new context/decision/pattern file | Next query picks it up automatically |
| `/harvest-context` saves research docs | Indexed on next query |
| `/orchestrate` completes and saves patterns | Indexed on next query |
| `/ideation` finalizes a plan to context | Indexed on next query |
| Direct `.md` file edit in `.opencode/context/` | Indexed on next query |
| Full re-index needed | Delete `.opencode/.vector/` — auto-rebuilds |

The ML model is **only loaded when there's actual work to do** (files changed). If everything is up to date, `ensureIndexed()` returns instantly with no model load.

## Scripts

| Script | Purpose |
|--------|---------|
| `scripts/veclib.mjs` | Shared library — exported programmatic API for all integrations |
| `scripts/vectorize.mjs` | CLI: manual re-index (for debugging/forced refresh) |
| `scripts/query.mjs` | CLI: semantic search over context |

## Programmatic API (veclib.mjs)

Used by Hubs hub subcommands and agents:

```js
// Lazy re-index: stats files, only loads model if something changed
import { ensureIndexed } from './veclib.mjs';
await ensureIndexed();                // current project
await ensureIndexed('/path/to/app');  // specific project

// Semantic search (auto-refreshes index first)
import { queryChunks } from './veclib.mjs';
const results = await queryChunks(undefined, 'auth patterns', 10);
// results: [{ source, heading, content, file_path, distance }]

// Index stats
import { getIndexStats } from './veclib.mjs';
const stats = await getIndexStats();
// { exists, totalChunks, totalFiles, files: [...] }
```

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
npm install better-sqlite3 sqlite-vec @xenova/transformers
```

Requires Node.js 18+ and ~200MB RAM for the embedding model (loaded lazily only when indexing).

## Integration Points

### Hub Lifecycle Integration (manual trigger)

After any hub subcommand writes to `.opencode/context/`:
1. Write the file (existing behavior)
2. **Manual vectorize**: Run `/harvest-context search` to index and query — no automatic indexing

### Agent Integration

Agents can use `queryChunks()` to retrieve relevant context during execution:

```js
const ctx = await queryChunks(process.cwd() + '/.opencode', query, 5);
// Inject results into agent context as supporting evidence
```

### Forced Re-index

```bash
rm -rf .opencode/.vector/    # Delete the DB
# Next query or ensureIndexed() call auto-rebuilds it
```

## How It Works Internally

1. `ensureIndexed()` scans `.opencode/context/` for `*.md` files
2. Compares current file mtimes against stored mtimes in the DB
3. If no files changed → returns immediately, no model loaded
4. If files changed → loads model, chunks new/changed files by `##`/`###` headers
5. Generates 384-dim embeddings via `Xenova/all-MiniLM-L6-v2`
6. Deletes old chunks for changed files, inserts new ones
7. Query always runs against the freshly-updated index

The vec0 virtual table uses L2 distance. Since embeddings are normalized (unit vectors), L2 distance sorts equivalently to cosine similarity — nearest neighbors are the most semantically similar chunks.
