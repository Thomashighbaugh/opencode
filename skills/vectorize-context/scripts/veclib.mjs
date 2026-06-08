#!/usr/bin/env node
/**
 * veclib.mjs — Shared vector DB library for JOC context auto-vectorization
 *
 * Exports:
 *   ensureIndexed(opencodeDir?)  — Lazy re-index: checks file mtimes, re-indexes stale files
 *   queryChunks(opencodeDir, queryText, topK) — Returns top-K results with scores
 *   getIndexStats(opencodeDir) — Returns stats about the current index
 *
 * Design principle: Lazy freshness. On every query or explicit call, we stat all
 * context files and re-index any that changed. This means:
 *   - Any hub writing context → files change on disk → next query picks it up
 *   - Direct file edits → same behavior
 *   - No manual triggering needed
 *   - The ML model only loads when there's actually work to do
 */

import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);

// ─── Config ────────────────────────────────────────────────────────────────

const MODEL_NAME = 'Xenova/all-MiniLM-L6-v2';
const EMBEDDING_DIM = 384;
const MODEL_LOAD_TIMEOUT_MS = 30_000;
const MIN_CHUNK_LENGTH = 50;
const TOP_K_DEFAULT = 10;

// Cache the pipeline so we don't reload it on every call
let _pipelinePromise = null;

// ─── Path Resolution ───────────────────────────────────────────────────────

export function resolvePaths(opencodeDir) {
  const dir = opencodeDir || process.env.OPCODE_DIR || path.resolve(process.cwd(), '.opencode');
  return {
    opencodeDir: dir,
    contextDir: path.join(dir, 'context'),
    vectorDir: path.join(dir, '.vector'),
    dbPath: path.join(dir, '.vector', 'context.db'),
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

function ensureSchema(db) {
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

// ─── Chunking ──────────────────────────────────────────────────────────────

function chunkMarkdown(content, sourcePath) {
  const lines = content.split('\n');
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

// ─── Embedding Pipeline (lazy-loaded) ──────────────────────────────────────

async function getPipeline() {
  if (!_pipelinePromise) {
    _pipelinePromise = (async () => {
      let pipeline;
      try {
        pipeline = (await import('@xenova/transformers')).pipeline;
      } catch {
        throw new Error('@xenova/transformers not installed. Run: npm install @xenova/transformers');
      }

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), MODEL_LOAD_TIMEOUT_MS);
      try {
        return await pipeline('feature-extraction', MODEL_NAME, { signal: controller.signal });
      } finally {
        clearTimeout(timeout);
      }
    })();
  }
  return _pipelinePromise;
}

async function generateEmbeddings(extractor, texts) {
  const results = await extractor(texts, { pooling: 'mean', normalize: true });
  const output = [];
  for (let i = 0; i < results.dims[0]; i++) {
    const offset = i * results.dims[1];
    const vec = results.data.slice(offset, offset + results.dims[1]);
    output.push(Array.from(vec));
  }
  return output;
}

async function generateSingleEmbedding(extractor, text) {
  const result = await extractor(text, { pooling: 'mean', normalize: true });
  return Array.from(result.data.slice(0, result.dims[1]));
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
 * Ensure the vector DB is up-to-date with all context files.
 * Only re-indexes files whose mtime has changed (lazy/incremental).
 * Returns a summary of what was done.
 */
export async function ensureIndexed(opencodeDir) {
  const paths = resolvePaths(opencodeDir);

  if (!fs.existsSync(paths.contextDir)) {
    return { filesScanned: 0, filesIndexed: 0, filesSkipped: 0, totalChunks: 0, errors: 0 };
  }

  // Collect md files
  const mdFiles = [];
  for await (const filePath of walk(paths.contextDir, name => name.endsWith('.md'))) {
    mdFiles.push(filePath);
  }

  if (mdFiles.length === 0) {
    return { filesScanned: 0, filesIndexed: 0, filesSkipped: 0, totalChunks: 0, errors: 0 };
  }

  // Ensure directories
  await fs.promises.mkdir(paths.vectorDir, { recursive: true });

  // Open DB
  const db = openDatabase(paths.dbPath);
  ensureSchema(db);

  // Check mtimes — use relative paths consistently
  const storedMtimes = getStoredMtimes(db);
  const filesToIndex = [];
  const filesToSkip = [];

  for (const filePath of mdFiles) {
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
    db.close();
    return { filesScanned: mdFiles.length, filesIndexed: 0, filesSkipped: filesToSkip.length, totalChunks, errors: 0 };
  }

  // Load model and process
  const extractor = await getPipeline();
  let totalChunks = 0;
  let errors = 0;

  for (const { path: filePath, rel: relPath, mtime } of filesToIndex) {
    try {
      const content = await fs.promises.readFile(filePath, 'utf-8');
      const rawChunks = chunkMarkdown(content, relPath);
      if (rawChunks.length === 0) continue;

      const texts = rawChunks.map(c => `${c.heading}\n${c.content}`);
      const embeddings = await generateEmbeddings(extractor, texts);
      const chunksWithEmbeddings = rawChunks.map((chunk, i) => ({ ...chunk, embedding: embeddings[i] }));

      if (storedMtimes[relPath]) deleteFileChunks(db, relPath);
      totalChunks += insertChunks(db, chunksWithEmbeddings, mtime, relPath);
    } catch (err) {
      errors++;
    }
  }

  db.close();
  return { filesScanned: mdFiles.length, filesIndexed: filesToIndex.length, filesSkipped: filesToSkip.length, totalChunks, errors };
}

/**
 * Query the vector DB for semantically similar chunks.
 * Automatically ensures the index is fresh before searching.
 */
export async function queryChunks(opencodeDir, queryText, topK = TOP_K_DEFAULT) {
  const paths = resolvePaths(opencodeDir);

  // Lazy freshness: ensure indexed before query
  await ensureIndexed(opencodeDir);

  // Open DB (readonly for query)
  const db = openDatabase(paths.dbPath, true);

  // Verify schema
  const tableCheck = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='chunks'").get();
  if (!tableCheck) {
    db.close();
    return [];
  }

  // Generate query embedding
  const extractor = await getPipeline();
  const embedding = await generateSingleEmbedding(extractor, queryText);

  // Search
  const rows = db.prepare(`
    SELECT c.source, c.heading, c.content, c.file_path, v.distance
    FROM chunks c
    JOIN chunks_vec v ON v.chunk_id = c.id
    WHERE v.embedding MATCH ?
      AND k = ?
    ORDER BY v.distance
  `).all(new Float32Array(embedding), topK);

  db.close();
  return rows;
}

/**
 * Get stats about the current vector index.
 */
export async function getIndexStats(opencodeDir) {
  const paths = resolvePaths(opencodeDir);

  if (!fs.existsSync(paths.dbPath)) {
    return { exists: false, totalChunks: 0, totalFiles: 0, files: [] };
  }

  const db = openDatabase(paths.dbPath, true);
  const totalChunks = db.prepare('SELECT COUNT(*) as c FROM chunks').get().c;
  const files = db.prepare('SELECT file_path, COUNT(*) as chunk_count, mtime FROM chunks GROUP BY file_path').all();
  db.close();

  return { exists: true, totalChunks, totalFiles: files.length, files };
}
