#!/usr/bin/env node
/**
 * sync-hook.mjs — Maintenance-mode store sync, spawned by the vectorize hook
 * as a CHILD PROCESS so native deps (better-sqlite3, sqlite-vec,
 * @huggingface/transformers) never run inside the plugin process.
 *
 * Semantics: only syncs stores that ALREADY exist (maintenance mode).
 * Fresh builds are the job of /project vectorize (vectorize.mjs). This
 * guarantees the hook can never trigger a full first-run index storm.
 *
 * Usage:
 *   node sync-hook.mjs              # sync existing context.db + code.db
 *   OPCODE_DIR=/path node sync-hook.mjs
 *
 * Exit 0 on success (including "nothing to do"). Never throws.
 */
import { existsSync } from 'node:fs';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ensureIndexed, ensureCodeIndexed, resolvePaths } from './veclib.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const GRAPH_SCRIPTS = path.join(__dirname, '..', '..', 'graph-context', 'scripts', 'graphlib.mjs');

/** Newest mtime (ms) across a set of scoped directories; 0 if none readable. */
async function newestMtime(dirs) {
  let newest = 0;
  const walk = async (dir) => {
    let entries;
    try { entries = await fs.promises.readdir(dir, { withFileTypes: true }); } catch { return; }
    for (const entry of entries) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (!entry.name.startsWith('.') && entry.name !== 'node_modules') await walk(full);
      } else if (entry.isFile()) {
        try { const st = await fs.promises.stat(full); if (st.mtimeMs > newest) newest = st.mtimeMs; } catch { /* ignore */ }
      }
    }
  };
  for (const d of dirs) await walk(d);
  return newest;
}

/**
 * Piggybacked graph maintenance — reuses this existing 10s child (no new hook,
 * no new registration, no new poll loop). Builds only when graph.db already
 * exists (never a first-run storm) AND a scoped source is newer than the DB.
 * Deterministic, local, zero provider tokens. Never throws.
 */
async function syncGraph(paths) {
  const graphDbPath = path.join(paths.vectorDir, 'graph.db');
  if (!existsSync(graphDbPath)) return { skipped: 'no graph.db' };
  let dbMtime = 0;
  try { dbMtime = fs.statSync(graphDbPath).mtimeMs; } catch { return { skipped: 'unreadable' }; }
  const newest = await newestMtime([paths.contextDir, paths.rulesDir]);
  if (newest <= dbMtime) return { skipped: 'unchanged' };
  try {
    const graphlib = await import(GRAPH_SCRIPTS);
    const t0 = Date.now();
    const wiki = await graphlib.backfillFromWiki(process.env.OPCODE_DIR || undefined);
    const registry = await graphlib.backfillFromRegistry(process.env.OPCODE_DIR || undefined);
    console.error(`[sync-hook] graph: wiki=${JSON.stringify(wiki)} registry=${JSON.stringify(registry)} in ${((Date.now() - t0) / 1000).toFixed(1)}s`);
    return { wiki, registry };
  } catch (err) {
    console.error('[sync-hook] graph build failed (non-fatal):', err.message);
    return { error: err.message };
  }
}

async function syncStore(name, ensure, dbPath) {
  if (!existsSync(dbPath)) {
    console.error(`[sync-hook] ${name} store missing (${dbPath}) — skipping (build via /project vectorize)`);
    return { skipped: true };
  }
  const t0 = Date.now();
  const result = await ensure(process.env.OPCODE_DIR || undefined);
  console.error(`[sync-hook] ${name}: scanned=${result.filesScanned} indexed=${result.filesIndexed} skipped=${result.filesSkipped} chunks=${result.totalChunks} errors=${result.errors} in ${((Date.now() - t0) / 1000).toFixed(1)}s`);
  return result;
}

async function main() {
  const paths = resolvePaths(process.env.OPCODE_DIR || undefined);
  const ctx = await syncStore('context', ensureIndexed, paths.dbPath);
  const code = await syncStore('code', ensureCodeIndexed, paths.codeDbPath);
  const graph = await syncGraph(paths);
  console.log(JSON.stringify({ context: ctx, code, graph }));
  process.exit(0);
}

main().catch((err) => {
  console.error('[sync-hook] fatal:', err.message);
  process.exit(0); // never crash the parent; parent enforces timeouts
});
