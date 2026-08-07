#!/usr/bin/env node
/**
 * veclib.mjs — Shared vector DB library for OpenCode per-project vectorization
 *
 * Ollama-backed embeddings (/api/embed, pedrohml/mxbai-embed-large); reranking
 * via an IN-PROCESS cross-encoder (@huggingface/transformers, Xenova/bge-reranker-base)
 * — no server-side /api/rerank dependency. All retrieval is LOCAL — zero
 * provider API requests.
 *
 * Store: .opencode/state/vector/context.db (gitignored — ephemeral, per-project).
 *
 * Exports:
 *   resolvePaths(inputDir?)       — path resolution (accepts project root OR .opencode dir)
 *   ensureIndexed(inputDir?)      — lazy re-index of scoped sources (context/ + rules/ + docs/ + AGENTS.md)
 *   vectorizeFile(filePath, inputDir?) — index a single file (hook-friendly)
 *   queryChunks(inputDir, queryText, topK?, opts?) — embed → top-K candidates → rerank → top-N
 *   getIndexStats(inputDir?)      — stats about the current index
 *
 * Design principle: Lazy freshness. On every query we stat all scoped files and
 * re-index only what changed. Models load only when there is work.
 */

import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);

// ─── Config ────────────────────────────────────────────────────────────────

const OLLAMA_URL = 'http://127.0.0.1:11434';
const EMBED_MODEL = 'pedrohml/mxbai-embed-large:latest';
const RERANK_MODEL = process.env.RERANK_MODEL || 'Xenova/bge-reranker-base';
const EMBEDDING_DIM = 1024;
const MODEL_LOAD_TIMEOUT_MS = 30_000;
const RERANK_TIMEOUT_MS = 10_000;
const MIN_CHUNK_LENGTH = 50;
const TOP_K_DEFAULT = 10;
const RERANK_CANDIDATES = 20;   // candidates pulled from ANN search before rerank
const RERANK_TOP_N_DEFAULT = 5;
const DISTANCE_FLOOR = 0.8;     // hard filter before rerank (bounds reranker input)

// ─── Path Resolution ───────────────────────────────────────────────────────

/**
 * Accepts either a project root or a .opencode directory.
 * Returns canonical paths with the vector store under .opencode/state/vector/.
 */
export function resolvePaths(inputDir) {
  const raw = inputDir || process.env.OPCODE_DIR || path.resolve(process.cwd(), '.opencode');
  const isOcodeDir = path.basename(raw) === '.opencode';
  const opencodeDir = isOcodeDir ? raw : path.join(raw, '.opencode');
  const projectRoot = isOcodeDir ? path.dirname(raw) : raw;
  return {
    opencodeDir,
    projectRoot,
    contextDir: path.join(opencodeDir, 'context'),
    rulesDir: path.join(opencodeDir, 'rules'),
    docsDir: path.join(opencodeDir, 'docs'),
    agentsFile: path.join(projectRoot, 'AGENTS.md'),
    vectorDir: path.join(opencodeDir, 'state', 'vector'),
    dbPath: path.join(opencodeDir, 'state', 'vector', 'context.db'),
  };
}

// ─── SQLite / vec0 ─────────────────────────────────────────────────────────

function openDatabase(dbPath, readonly = false) {
  let Database;
  try {
    Database = require('better-sqlite3');
  } catch {
    throw new Error('better-sqlite3 not installed. Run: npm install better-sqlite3');
  }

  let sqliteVec;
  try {
    sqliteVec = require('sqlite-vec');
  } catch {
    throw new Error('sqlite-vec not installed. Run: npm install sqlite-vec');
  }

  const db = new Database(dbPath, readonly ? { readonly: true } : {});
  sqliteVec.load(db);
  if (!readonly) {
    db.pragma('journal_mode = WAL');
  }
  return db;
}

function getMeta(db, key) {
  const row = db.prepare('SELECT value FROM meta WHERE key = ?').get(key);
  return row ? row.value : null;
}

function setMeta(db, key, value) {
  db.prepare('INSERT INTO meta (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value').run(key, value);
}

function ensureSchema(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS meta (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    )
  `);
  db.exec(`
    CREATE TABLE IF NOT EXISTS chunks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      source TEXT NOT NULL,
      heading TEXT NOT NULL,
      content TEXT NOT NULL,
      mtime TEXT NOT NULL,
      file_path TEXT NOT NULL
    )
  `);
  // Embedding schema is versioned: if the model/dim changes, rebuild.
  const storedModel = getMeta(db, 'embedding_model');
  const storedDim = getMeta(db, 'embedding_dim');
  const currentModel = EMBED_MODEL;
  const currentDim = String(EMBEDDING_DIM);

  if (storedModel !== currentModel || storedDim !== currentDim) {
    // Drop and rebuild — vector data is incompatible across embedder/dim changes
    db.exec('DROP TABLE IF EXISTS chunks_vec');
    db.exec('DROP TABLE IF EXISTS chunks');
    db.exec(`
      CREATE TABLE IF NOT EXISTS chunks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        source TEXT NOT NULL,
        heading TEXT NOT NULL,
        content TEXT NOT NULL,
        mtime TEXT NOT NULL,
        file_path TEXT NOT NULL
      )
    `);
    db.exec(`
      CREATE VIRTUAL TABLE IF NOT EXISTS chunks_vec USING vec0(
        chunk_id INTEGER PRIMARY KEY,
        embedding float[${EMBEDDING_DIM}]
      )
    `);
    setMeta(db, 'embedding_model', currentModel);
    setMeta(db, 'embedding_dim', currentDim);
  } else {
    db.exec(`
      CREATE VIRTUAL TABLE IF NOT EXISTS chunks_vec USING vec0(
        chunk_id INTEGER PRIMARY KEY,
        embedding float[${EMBEDDING_DIM}]
      )
    `);
  }
  db.exec(`CREATE INDEX IF NOT EXISTS idx_chunks_file_path ON chunks(file_path)`);
}

// ─── File Walking ──────────────────────────────────────────────────────────

async function* walk(dir, predicate) {
  let entries;
  try {
    entries = await fs.promises.readdir(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name.startsWith('.') || entry.name === 'node_modules') continue;
      yield* walk(fullPath, predicate);
    } else if (entry.isFile() && predicate(entry.name)) {
      yield fullPath;
    }
  }
}

async function getFileMtime(filePath) {
  try {
    const stat = await fs.promises.stat(filePath);
    return stat.mtime.toISOString();
  } catch {
    return null;
  }
}

// ─── Scoped Sources ────────────────────────────────────────────────────────

/**
 * Collect all indexable markdown files for a project:
 *   .opencode/context/** (recursive) + .opencode/rules/** + .opencode/docs/** + AGENTS.md
 */
export async function collectScopedFiles(paths) {
  const files = [];
  for (const dir of [paths.contextDir, paths.rulesDir, paths.docsDir]) {
    if (!fs.existsSync(dir)) continue;
    for await (const f of walk(dir, name => name.endsWith('.md'))) {
      files.push(f);
    }
  }
  if (fs.existsSync(paths.agentsFile)) {
    files.push(paths.agentsFile);
  }
  return files;
}

// ─── Chunking ──────────────────────────────────────────────────────────────

function stripFrontmatter(content) {
  // Strip leading YAML frontmatter block (--- ... ---) so it doesn't pollute chunks
  const m = content.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  return m ? content.slice(m[0].length) : content;
}

function chunkMarkdown(content, sourcePath) {
  const body = stripFrontmatter(content);
  const lines = body.split('\n');
  const chunks = [];
  let currentHeading = '(no heading)';
  let currentLines = [];
  let headingLevel = 0;

  function flush() {
    const text = currentLines.join('\n').trim();
    if (text.length >= MIN_CHUNK_LENGTH) {
      chunks.push({ source: sourcePath, heading: currentHeading, content: text, headingLevel });
    }
  }

  for (const line of lines) {
    const h2Match = line.match(/^## (.*)/);
    const h3Match = line.match(/^### (.*)/);
    if (h2Match) {
      flush();
      currentHeading = h2Match[1].trim();
      currentLines = [line];
      headingLevel = 2;
    } else if (h3Match) {
      flush();
      currentHeading = h3Match[1].trim();
      currentLines = [line];
      headingLevel = 3;
    } else {
      currentLines.push(line);
    }
  }
  flush();
  return chunks;
}

// ─── Ollama Embedding (local, no provider API) ─────────────────────────────

async function embedTexts(texts) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), MODEL_LOAD_TIMEOUT_MS);
  try {
    const res = await fetch(`${OLLAMA_URL}/api/embed`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: EMBED_MODEL, input: texts }),
      signal: controller.signal,
    });
    if (!res.ok) throw new Error(`Ollama embed failed: HTTP ${res.status}`);
    const data = await res.json();
    return data.embeddings;
  } finally {
    clearTimeout(timeout);
  }
}

// ─── Local Cross-Encoder Reranker (in-process, no server dependency) ────────

let rerankerPromise = null;

/**
 * Lazily load the @huggingface/transformers cross-encoder (bge-reranker-base,
 * XLMRobertaForSequenceClassification, single-logit). transformers.js has no
 * 'rerank' pipeline, so we use AutoModel directly and apply sigmoid to the
 * single logit per pair. Loaded once per process. Set RERANK_MODEL to override.
 */
function getReranker() {
  if (!rerankerPromise) {
    rerankerPromise = (async () => {
      const { AutoTokenizer, AutoModel, env } = await import('@huggingface/transformers');
      // Cache models under the config node_modules/.cache (bundled, gitignored)
      env.cacheDir = path.join(__dirname, '..', '..', '..', 'node_modules', '@huggingface', 'transformers', '.cache');
      const tokenizer = await AutoTokenizer.from_pretrained(RERANK_MODEL);
      const model = await AutoModel.from_pretrained(RERANK_MODEL, { dtype: 'q8' });
      return { tokenizer, model };
    })();
  }
  return rerankerPromise;
}

/**
 * Rerank candidate documents against the query with the in-process
 * cross-encoder. Returns [{ index, relevance_score }] sorted by score
 * descending. Throws on failure — callers fall back to distance ordering.
 */
async function rerankDocuments(query, documents) {
  const { tokenizer, model } = await getReranker();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), RERANK_TIMEOUT_MS);
  try {
    const queries = documents.map(() => query);
    const enc = await tokenizer(queries, { text_pair: documents, padding: true, truncation: true });
    const { logits } = await model(enc);
    const data = Array.from(logits.data);
    return data
      .map((logit, index) => ({ index, relevance_score: 1 / (1 + Math.exp(-logit)) }))
      .sort((a, b) => b.relevance_score - a.relevance_score);
  } finally {
    clearTimeout(timeout);
  }
}

// ─── DB Operations ─────────────────────────────────────────────────────────

function getStoredMtimes(db) {
  const rows = db.prepare('SELECT DISTINCT file_path, mtime FROM chunks').all();
  const map = {};
  for (const row of rows) map[row.file_path] = row.mtime;
  return map;
}

function deleteFileChunks(db, filePath) {
  const chunkIds = db.prepare('SELECT id FROM chunks WHERE file_path = ?').all(filePath).map(r => r.id);
  if (chunkIds.length === 0) return;
  const deleteVec = db.prepare(`DELETE FROM chunks_vec WHERE chunk_id IN (${chunkIds.map(() => '?').join(',')})`);
  const deleteChunks = db.prepare('DELETE FROM chunks WHERE file_path = ?');
  const tx = db.transaction(() => {
    deleteVec.run(...chunkIds);
    deleteChunks.run(filePath);
  });
  tx();
}

function insertChunks(db, chunks, mtime, filePath) {
  if (chunks.length === 0) return 0;
  const insertChunk = db.prepare('INSERT INTO chunks (source, heading, content, mtime, file_path) VALUES (?, ?, ?, ?, ?)');
  const insertVec = db.prepare('INSERT INTO chunks_vec (chunk_id, embedding) VALUES (?, ?)');
  let inserted = 0;
  const tx = db.transaction(() => {
    for (const chunk of chunks) {
      const info = insertChunk.run(chunk.source, chunk.heading, chunk.content, mtime, filePath);
      insertVec.run(BigInt(info.lastInsertRowid), new Float32Array(chunk.embedding));
      inserted++;
    }
  });
  tx();
  return inserted;
}

// ─── Public API ────────────────────────────────────────────────────────────

/**
 * Index a single file (used by the vectorize hook for hot paths).
 * Opens the DB, computes chunks + embeddings, upserts.
 */
export async function vectorizeFile(filePath, inputDir) {
  const paths = resolvePaths(inputDir);
  const relPath = path.relative(paths.opencodeDir, filePath);
  await fs.promises.mkdir(paths.vectorDir, { recursive: true });
  const db = openDatabase(paths.dbPath);
  ensureSchema(db);
  try {
    const mtime = await getFileMtime(filePath);
    if (!mtime) return { file: relPath, chunks: 0 };
    const content = await fs.promises.readFile(filePath, 'utf-8');
    const rawChunks = chunkMarkdown(content, relPath);
    if (rawChunks.length === 0) return { file: relPath, chunks: 0 };
    const texts = rawChunks.map(c => `${c.heading}\n${c.content}`);
    const embeddings = await embedTexts(texts);
    const chunksWithEmbeddings = rawChunks.map((chunk, i) => ({ ...chunk, embedding: embeddings[i] }));
    deleteFileChunks(db, relPath);
    const inserted = insertChunks(db, chunksWithEmbeddings, mtime, relPath);
    return { file: relPath, chunks: inserted };
  } finally {
    db.close();
  }
}

/**
 * Ensure the vector DB is up-to-date with all scoped project files.
 * Only re-indexes files whose mtime has changed (lazy/incremental).
 */
export async function ensureIndexed(inputDir) {
  const paths = resolvePaths(inputDir);

  const scopedFiles = await collectScopedFiles(paths);
  if (scopedFiles.length === 0) {
    return { filesScanned: 0, filesIndexed: 0, filesSkipped: 0, totalChunks: 0, errors: 0 };
  }

  // Ensure directories
  await fs.promises.mkdir(paths.vectorDir, { recursive: true });

  // Open DB
  const db = openDatabase(paths.dbPath);
  ensureSchema(db);

  try {
    // Check mtimes — use relative paths consistently
    const storedMtimes = getStoredMtimes(db);
    const filesToIndex = [];
    const filesToSkip = [];

    for (const filePath of scopedFiles) {
      const relPath = path.relative(paths.opencodeDir, filePath);
      const currentMtime = await getFileMtime(filePath);
      if (!currentMtime) { filesToSkip.push({ path: filePath, rel: relPath, reason: 'unreadable' }); continue; }
      if (storedMtimes[relPath] === currentMtime) {
        filesToSkip.push({ path: filePath, rel: relPath, reason: 'unchanged' });
      } else {
        filesToIndex.push({ path: filePath, rel: relPath, mtime: currentMtime });
      }
    }

    // Handle deleted files: clean up chunks for files no longer on disk
    const indexedRelPaths = new Set(filesToIndex.map(f => f.rel).concat(filesToSkip.map(f => f.rel)));
    let deletedCount = 0;
    for (const storedPath of Object.keys(storedMtimes)) {
      if (!indexedRelPaths.has(storedPath)) {
        deleteFileChunks(db, storedPath);
        deletedCount++;
      }
    }

    if (filesToIndex.length === 0 && deletedCount === 0) {
      const totalChunks = db.prepare('SELECT COUNT(*) as c FROM chunks').get().c;
      return { filesScanned: scopedFiles.length, filesIndexed: 0, filesSkipped: filesToSkip.length, totalChunks, errors: 0 };
    }

    // Process changed files
    let totalChunks = 0;
    let errors = 0;

    for (const { path: filePath, rel: relPath, mtime } of filesToIndex) {
      try {
        const content = await fs.promises.readFile(filePath, 'utf-8');
        const rawChunks = chunkMarkdown(content, relPath);
        if (rawChunks.length === 0) continue;

        const texts = rawChunks.map(c => `${c.heading}\n${c.content}`);
        const embeddings = await embedTexts(texts);
        const chunksWithEmbeddings = rawChunks.map((chunk, i) => ({ ...chunk, embedding: embeddings[i] }));

        if (storedMtimes[relPath]) deleteFileChunks(db, relPath);
        totalChunks += insertChunks(db, chunksWithEmbeddings, mtime, relPath);
      } catch (err) {
        errors++;
      }
    }

    return { filesScanned: scopedFiles.length, filesIndexed: filesToIndex.length, filesSkipped: filesToSkip.length, totalChunks, errors };
  } finally {
    db.close();
  }
}

/**
 * Query the vector DB for semantically similar chunks.
 * Two-stage retrieval: ANN top-K (distance floor) → in-process cross-encoder rerank → top-N.
 *
 * opts: { useReranker?: boolean, rerankCandidates?: number, rerankTopN?: number }
 * Reranker failure degrades gracefully to distance-only ordering.
 */
export async function queryChunks(inputDir, queryText, topK = TOP_K_DEFAULT, opts = {}) {
  const paths = resolvePaths(inputDir);
  const useReranker = opts.useReranker !== false;
  const candidates = opts.rerankCandidates || RERANK_CANDIDATES;
  const rerankTopN = opts.rerankTopN || RERANK_TOP_N_DEFAULT;

  // Lazy freshness: ensure indexed before query
  await ensureIndexed(inputDir);

  // Open DB (readonly for query)
  const db = openDatabase(paths.dbPath, true);

  try {
    // Verify schema
    const tableCheck = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='chunks'").get();
    if (!tableCheck) {
      return [];
    }

    // Generate query embedding
    const [embedding] = await embedTexts([queryText]);
    if (!embedding) return [];

    // Stage 1: ANN search with distance floor (bounds reranker input)
    const rows = db.prepare(`
      SELECT c.source, c.heading, c.content, c.file_path, v.distance
      FROM chunks c
      JOIN chunks_vec v ON v.chunk_id = c.id
      WHERE v.embedding MATCH ?
        AND k = ?
        AND v.distance < ?
      ORDER BY v.distance
    `).all(new Float32Array(embedding), candidates, DISTANCE_FLOOR);

    if (rows.length === 0) return [];

    // Stage 2: rerank (optional, graceful degradation)
    if (useReranker && rows.length > 1) {
      try {
        const documents = rows.map(r => `${r.heading}\n${r.content}`);
        const reranked = await rerankDocuments(queryText, documents);
        if (reranked.length > 0) {
          const scoreByIndex = new Map(reranked.map(r => [r.index, r.relevance_score]));
          rows.forEach((r, i) => { r.rerank_score = scoreByIndex.get(i) ?? null; });
          rows.sort((a, b) => (b.rerank_score ?? 0) - (a.rerank_score ?? 0));
          return rows.slice(0, Math.min(topK, rows.length));
        }
      } catch {
        // Reranker unavailable — fall through to distance ordering
      }
    }

    return rows.slice(0, Math.min(topK, rows.length));
  } finally {
    db.close();
  }
}

/**
 * Get stats about the current vector index.
 */
export async function getIndexStats(inputDir) {
  const paths = resolvePaths(inputDir);

  if (!fs.existsSync(paths.dbPath)) {
    return { exists: false, totalChunks: 0, totalFiles: 0, files: [], embedding: null };
  }

  const db = openDatabase(paths.dbPath, true);
  try {
    const totalChunks = db.prepare('SELECT COUNT(*) as c FROM chunks').get().c;
    const files = db.prepare('SELECT file_path, COUNT(*) as chunk_count, mtime FROM chunks GROUP BY file_path').all();
    return {
      exists: true,
      totalChunks,
      totalFiles: files.length,
      files,
      embedding: {
        model: getMeta(db, 'embedding_model'),
        dim: getMeta(db, 'embedding_dim'),
      },
    };
  } finally {
    db.close();
  }
}
