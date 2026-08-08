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
import { ensureIndexed, ensureCodeIndexed, resolvePaths } from './veclib.mjs';

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
  console.log(JSON.stringify({ context: ctx, code }));
  process.exit(0);
}

main().catch((err) => {
  console.error('[sync-hook] fatal:', err.message);
  process.exit(0); // never crash the parent; parent enforces timeouts
});
