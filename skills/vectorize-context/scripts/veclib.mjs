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
 *        .opencode/state/vector/code.db  (same, source-code store)
 *
 * Exports:
 *   resolvePaths(inputDir?)       — path resolution (accepts project root OR .opencode dir)
 *   ensureIndexed(inputDir?)      — lazy re-index of scoped sources (context/ + rules/ + docs/ + AGENTS.md)
 *   ensureCodeIndexed(inputDir?)  — lazy re-index of project source code (code.db)
 *   vectorizeFile(filePath, inputDir?) — index a single markdown file (hook-friendly)
 *   vectorizeCodeFile(filePath, inputDir?) — index a single code file (hook-friendly)
 *   queryChunks(inputDir, queryText, topK?, opts?) — embed → top-K candidates → rerank → top-N
 *   queryCodeChunks(inputDir, queryText, topK?, opts?) — same against the code store
 *   getIndexStats(inputDir?)      — stats about the context index
 *   getCodeIndexStats(inputDir?)  — stats about the code index
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

// Env-overridable so tests can point at a mock embed endpoint and CI can
// pin a specific embedding model. Production defaults match the docs.
const OLLAMA_URL = process.env.OLLAMA_URL || 'http://127.0.0.1:11434';
const EMBED_MODEL = process.env.EMBED_MODEL || 'pedrohml/mxbai-embed-large:latest';
const RERANK_MODEL = process.env.RERANK_MODEL || 'Xenova/bge-reranker-base';
const RERANK_DISABLED = process.env.RERANK_DISABLED === '1'; // force distance-only path (CI)
const EMBEDDING_DIM = 1024;
const MODEL_LOAD_TIMEOUT_MS = 30_000;
const MIN_CHUNK_LENGTH = 50;
const TOP_K_DEFAULT = 10;
const RERANK_CANDIDATES = 20;   // candidates pulled from ANN search before rerank
const RERANK_TOP_N_DEFAULT = 5;
const DISTANCE_FLOOR = 0.8;     // hard filter before rerank (bounds reranker input)

// ─── Code store config ────────────────────────────────────────────────────

const CODE_EXTENSIONS = new Set([
  '.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs', '.cts', '.mts',
  '.py', '.go', '.rs', '.java', '.kt', '.kts', '.c', '.h', '.cpp', '.hpp', '.cc',
  '.cs', '.rb', '.php', '.swift', '.scala', '.sh', '.bash', '.zsh', '.sql',
  '.vue', '.svelte', '.css', '.scss', '.html', '.json', '.yaml', '.yml', '.toml',
  '.proto', '.graphql', '.lua', '.r', '.dart', '.zig', '.ex', '.exs', '.tf',
]);

// Non-dot dirs to skip during code walks (dot dirs + node_modules are
// skipped by the walker itself). Privacy: .opencode/state + /cache are
// always skipped (session data may contain PII).
const CODE_SKIP_DIRS = new Set([
  'node_modules', 'dist', 'build', 'out', 'target', 'coverage', 'venv', 'vendor', 'tmp', 'Pods',
]);

const MAX_CODE_CHUNK_LINES = 60;
const CODE_CHUNK_MAX_CHARS = 6000;
const EMBED_BATCH_SIZE = 32; // texts per /api/embed call (amortizes request overhead)

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
    codeDbPath: path.join(opencodeDir, 'state', 'vector', 'code.db'),
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

/**
 * Walk the project tree for indexable code files.
 * Skips: dot dirs (except .opencode), node_modules, CODE_SKIP_DIRS,
 * and .opencode/state + .opencode/cache (privacy — session data may
 * contain PII; caches are not source).
 */
function isCodeSkipPath(fullPath) {
  if (CODE_SKIP_DIRS.has(path.basename(fullPath))) return true;
  if (/[\\/]\.opencode[\\/](state|cache)([\\/]|$)/.test(fullPath)) return true;
  return false;
}

async function* walkCode(dir) {
  let entries;
  try {
    entries = await fs.promises.readdir(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (isCodeSkipPath(fullPath)) continue;
      if (entry.name.startsWith('.') && entry.name !== '.opencode') continue;
      yield* walkCode(fullPath);
    } else if (entry.isFile() && CODE_EXTENSIONS.has(path.extname(entry.name))) {
      yield fullPath;
    }
  }
}

/**
 * Collect all indexable code files for a project (projectRoot tree).
 * AGENTS.md / markdown are handled by the context store — not included.
 */
export async function collectCodeFiles(paths) {
  if (!fs.existsSync(paths.projectRoot)) return [];
  const files = [];
  for await (const f of walkCode(paths.projectRoot)) {
    files.push(f);
  }
  return files;
}

// ─── Chunking ──────────────────────────────────────────────────────────────

function stripFrontmatter(content) {
  // Strip leading YAML frontmatter block (--- ... ---) so it doesn't pollute chunks
  const m = content.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  return m ? content.slice(m[0].length) : content;
}

export function chunkMarkdown(content, sourcePath) {
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

/**
 * Language-agnostic code chunker. Splits at top-level declaration
 * boundaries (function/class/const/def/… at column 0), with line and
 * char caps so long files degrade to fixed-size chunks. Heading is the
 * declaration line (or file name), which the cross-encoder reranker
 * uses alongside the body.
 */
const CODE_BOUNDARY_RE = /^(export\s+)?(default\s+)?(async\s+)?(?:function|class|interface|type|enum|const|let|var|def|func|fn|impl|struct|trait|module|package|sub|public|private|protected|static)\b/;

export function chunkCode(content, sourcePath) {
  const lines = content.split('\n');
  const chunks = [];
  const fileName = path.basename(sourcePath);
  let currentHeading = fileName;
  let currentLines = [];
  let currentChars = 0;

  const isBoundary = (line) => {
    if (!line.trim()) return false;
    if (line[0] === ' ' || line[0] === '\t') return false; // inside a block
    return CODE_BOUNDARY_RE.test(line);
  };

  function flush() {
    const text = currentLines.join('\n').trim();
    if (text.length >= MIN_CHUNK_LENGTH) {
      chunks.push({ source: sourcePath, heading: currentHeading, content: text });
    }
  }

  for (const line of lines) {
    if (isBoundary(line) && currentLines.length > 0) {
      flush();
      currentLines = [];
      currentChars = 0;
      currentHeading = line.slice(0, 80);
    }
    currentLines.push(line);
    currentChars += line.length + 1;
    if (currentChars >= CODE_CHUNK_MAX_CHARS || currentLines.length >= MAX_CODE_CHUNK_LINES) {
      flush();
      currentLines = [];
      currentChars = 0;
      currentHeading = fileName;
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
 *
 * Local-only guard: if the ONNX model files aren't already in the local cache,
 * we throw immediately — never attempt a network download from the hot path.
 * Missing model ⇒ distance-order fallback (same as rerank-less retrieval).
 */
function getReranker() {
  if (RERANK_DISABLED) {
    return Promise.reject(new Error('RERANK_DISABLED=1 — reranking skipped (CI mode)'));
  }
  if (!rerankerPromise) {
    rerankerPromise = (async () => {
      const { AutoTokenizer, AutoModel, env } = await import('@huggingface/transformers');
      // Cache models under the config node_modules/.cache (bundled, gitignored)
      env.cacheDir = path.join(__dirname, '..', '..', '..', 'node_modules', '@huggingface', 'transformers', '.cache');
      const modelId = RERANK_MODEL.split('/').pop();
      const modelDir = path.join(env.cacheDir, RERANK_MODEL.replace('/', path.sep));
      const onnxFile = path.join(modelDir, 'onnx', 'model_quantized.onnx');
      if (!fs.existsSync(onnxFile)) {
        throw new Error(`rerank model ${RERANK_MODEL} not cached locally (${onnxFile}) — skipping rerank`);
      }
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
  const queries = documents.map(() => query);
  const enc = await tokenizer(queries, { text_pair: documents, padding: true, truncation: true });
  const { logits } = await model(enc);
  const data = Array.from(logits.data);
  return data
    .map((logit, index) => ({ index, relevance_score: 1 / (1 + Math.exp(-logit)) }))
    .sort((a, b) => b.relevance_score - a.relevance_score);
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

// Store registry: context (markdown docs) and code (source tree) are kept in
// separate DBs (context.db / code.db) with different collectors + chunkers.
// floor: ANN distance cutoff before rerank — code embeddings sit at higher
// distances than markdown, so the code store uses a looser floor.
const STORES = {
  context: {
    dbPath: (paths) => paths.dbPath,
    relBase: (paths) => paths.opencodeDir,
    chunker: chunkMarkdown,
    collector: collectScopedFiles,
    floor: 0.8,
  },
  code: {
    dbPath: (paths) => paths.codeDbPath,
    relBase: (paths) => paths.projectRoot,
    chunker: chunkCode,
    collector: collectCodeFiles,
    floor: 0.92,
  },
};

/**
 * Index a single file (used by the vectorize hook for hot paths).
 * Opens the DB, computes chunks + embeddings, upserts.
 */
async function vectorizeStoreFile(filePath, inputDir, store) {
  const paths = resolvePaths(inputDir);
  const cfg = STORES[store];
  const relPath = path.relative(cfg.relBase(paths), filePath);
  await fs.promises.mkdir(paths.vectorDir, { recursive: true });
  const db = openDatabase(cfg.dbPath(paths));
  ensureSchema(db);
  try {
    const mtime = await getFileMtime(filePath);
    if (!mtime) return { file: relPath, chunks: 0 };
    const content = await fs.promises.readFile(filePath, 'utf-8');
    const rawChunks = cfg.chunker(content, relPath);
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

export async function vectorizeFile(filePath, inputDir) {
  return vectorizeStoreFile(filePath, inputDir, 'context');
}

export async function vectorizeCodeFile(filePath, inputDir) {
  return vectorizeStoreFile(filePath, inputDir, 'code');
}

/**
 * Ensure a vector store is up-to-date with its scoped files.
 * Only re-indexes files whose mtime has changed (lazy/incremental).
 */
async function ensureStoreIndexed(inputDir, store) {
  const paths = resolvePaths(inputDir);
  const cfg = STORES[store];

  const scopedFiles = await cfg.collector(paths);
  if (scopedFiles.length === 0) {
    return { filesScanned: 0, filesIndexed: 0, filesSkipped: 0, totalChunks: 0, errors: 0 };
  }

  // Ensure directories
  await fs.promises.mkdir(paths.vectorDir, { recursive: true });

  // Open DB. Corrupt/unreadable store ⇒ report the error, never crash —
  // sync is a maintenance path (hook child) and must stay alive.
  let db;
  try {
    db = openDatabase(cfg.dbPath(paths));
    ensureSchema(db);
  } catch {
    return { filesScanned: scopedFiles.length, filesIndexed: 0, filesSkipped: 0, totalChunks: 0, errors: 1 };
  }

  try {
    // Check mtimes — use relative paths consistently
    const storedMtimes = getStoredMtimes(db);
    const filesToIndex = [];
    const filesToSkip = [];

    for (const filePath of scopedFiles) {
      const relPath = path.relative(cfg.relBase(paths), filePath);
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

    // Process changed files — chunk first, then embed in shared batches
    // (one /api/embed call per batch instead of one per file).
    let totalChunks = 0;
    let errors = 0;
    const pending = []; // { rel, mtime, chunks }

    for (const { path: filePath, rel: relPath, mtime } of filesToIndex) {
      try {
        const content = await fs.promises.readFile(filePath, 'utf-8');
        const rawChunks = cfg.chunker(content, relPath);
        if (rawChunks.length === 0) continue;
        pending.push({ rel: relPath, mtime, chunks: rawChunks });
      } catch (err) {
        errors++;
      }
    }

    const allTexts = [];
    for (const p of pending) {
      for (const c of p.chunks) allTexts.push(`${c.heading}\n${c.content}`);
    }

    const embeddings = [];
    for (let i = 0; i < allTexts.length; i += EMBED_BATCH_SIZE) {
      const batch = allTexts.slice(i, i + EMBED_BATCH_SIZE);
      const emb = await embedTexts(batch);
      if (emb.length !== batch.length) throw new Error(`embed batch size mismatch: ${emb.length} != ${batch.length}`);
      embeddings.push(...emb);
    }

    let offset = 0;
    for (const p of pending) {
      try {
        const chunkEmbs = p.chunks.map((c, j) => ({ ...c, embedding: embeddings[offset + j] }));
        offset += p.chunks.length;
        if (storedMtimes[p.rel]) deleteFileChunks(db, p.rel);
        totalChunks += insertChunks(db, chunkEmbs, p.mtime, p.rel);
      } catch (err) {
        errors++;
      }
    }

    // Report the FULL chunk count in the store, not just what changed
    const storeTotal = db.prepare('SELECT COUNT(*) as c FROM chunks').get().c;
    return { filesScanned: scopedFiles.length, filesIndexed: filesToIndex.length, filesSkipped: filesToSkip.length, totalChunks: storeTotal, errors };
  } finally {
    db.close();
  }
}

export async function ensureIndexed(inputDir) {
  return ensureStoreIndexed(inputDir, 'context');
}

export async function ensureCodeIndexed(inputDir) {
  return ensureStoreIndexed(inputDir, 'code');
}

/**
 * Query a vector store for semantically similar chunks.
 * Two-stage retrieval: ANN top-K (distance floor) → in-process cross-encoder rerank → top-N.
 *
 * opts: { useReranker?: boolean, rerankCandidates?: number, rerankTopN?: number }
 * Reranker failure degrades gracefully to distance-only ordering.
 */
async function queryStoreChunks(inputDir, queryText, topK = TOP_K_DEFAULT, opts = {}, store) {
  const paths = resolvePaths(inputDir);
  const cfg = STORES[store];
  const useReranker = opts.useReranker !== false;
  const candidates = opts.rerankCandidates || RERANK_CANDIDATES;
  const rerankTopN = opts.rerankTopN || RERANK_TOP_N_DEFAULT;

  // Lazy freshness: ensure indexed before query
  await ensureStoreIndexed(inputDir, store);

  // Open DB (readonly for query). Missing/unreadable store ⇒ empty results —
  // the query path runs in the hot transform hook and must NEVER throw.
  let db;
  try {
    db = openDatabase(cfg.dbPath(paths), true);
  } catch {
    return [];
  }

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
    `).all(new Float32Array(embedding), candidates, cfg.floor);

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
  } catch {
    // Corrupt DB or unexpected query error — degrade to no results, never throw.
    return [];
  } finally {
    db.close();
  }
}

export async function queryChunks(inputDir, queryText, topK = TOP_K_DEFAULT, opts = {}) {
  return queryStoreChunks(inputDir, queryText, topK, opts, 'context');
}

export async function queryCodeChunks(inputDir, queryText, topK = TOP_K_DEFAULT, opts = {}) {
  return queryStoreChunks(inputDir, queryText, topK, opts, 'code');
}

/**
 * Get stats about a vector index.
 */
async function getStoreStats(dbPath) {
  if (!fs.existsSync(dbPath)) {
    return { exists: false, totalChunks: 0, totalFiles: 0, files: [], embedding: null };
  }

  const db = openDatabase(dbPath, true);
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

export async function getIndexStats(inputDir) {
  const paths = resolvePaths(inputDir);
  return getStoreStats(paths.dbPath);
}

export async function getCodeIndexStats(inputDir) {
  const paths = resolvePaths(inputDir);
  return getStoreStats(paths.codeDbPath);
}
