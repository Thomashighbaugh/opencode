#!/usr/bin/env node
/**
 * sync-hook.ts — Maintenance-mode store sync, spawned by the vectorize hook
 * as a CHILD PROCESS so native deps (better-sqlite3, sqlite-vec,
 * @huggingface/transformers) never run inside the plugin process.
 *
 * Semantics: only syncs stores that ALREADY exist (maintenance mode).
 * Fresh builds are the job of /maintain-hub vectorize (vectorize.ts). This
 * guarantees the hook can never trigger a full first-run index storm.
 *
 * GRAPH MAINTENANCE
 * The knowledge graph's code layer is DERIVED from the code store — file
 * nodes, symbol nodes, and the part_of / defines / uses edges between them. If
 * the store moves and the graph does not, the graph goes stale and the edges on
 * its leaves stop describing reality, which is worse than having no graph.
 *
 * So the graph is rebuilt here, after the stores settle, and only when the code
 * store actually changed something (filesIndexed > 0). Rebuilding on every
 * event regardless would cost ~1.9s per burst for no new information; gating on
 * filesIndexed makes the cost proportional to real change. This runs in the
 * child, off the inference path, so it never blocks a turn.
 *
 * Usage:
 *   node sync-hook.ts              # sync existing context.db + code.db
 *   OPCODE_DIR=/path node sync-hook.ts
 *   OPCODE_DIR=/path SYNC_SKIP_GRAPH=1 node sync-hook.ts
 *
 * Exit 0 on success (including "nothing to do"). Never throws.
 */
import { existsSync } from 'node:fs';
import { ensureIndexed, ensureCodeIndexed, resolvePaths } from './veclib.ts';

async function syncStore(name, ensure, dbPath) {
  if (!existsSync(dbPath)) {
    console.error(`[sync-hook] ${name} store missing (${dbPath}) — skipping (build via /maintain-hub vectorize)`);
    return { skipped: true };
  }
  const t0 = Date.now();
  const result = await ensure(process.env.OPCODE_DIR || undefined);
  console.error(`[sync-hook] ${name}: scanned=${result.filesScanned} indexed=${result.filesIndexed} skipped=${result.filesSkipped} chunks=${result.totalChunks} errors=${result.errors} in ${((Date.now() - t0) / 1000).toFixed(1)}s`);
  return result;
}

/**
 * Rebuild the graph's code layer. Never throws: a graph failure must not fail
 * the vector sync, which is the thing the turn actually depends on.
 */
async function syncGraph(inputDir, codeResult) {
  if (process.env.SYNC_SKIP_GRAPH === '1') return { skipped: 'SYNC_SKIP_GRAPH=1' };
  if (codeResult?.skipped) return { skipped: 'code store missing' };
  // Only when the code store actually moved.
  if (!codeResult || !(codeResult.filesIndexed > 0)) return { skipped: 'code store unchanged' };
  try {
    const graphlibUrl = new URL('../../graph-context/scripts/graphlib.ts', import.meta.url).href;
    const { backfillFromCode } = await import(graphlibUrl);
    const t0 = Date.now();
    const result = backfillFromCode(inputDir);
    console.error(
      `[sync-hook] graph: changed=${result.changed} full=${result.full} files=${result.files} defines=${result.defines} ` +
      `uses=${result.uses} part_of=${result.partOf} bridges=${result.bridges} adopted=${result.adopted} ` +
      `pruned=${result.pruned} knowledgeOrphans=${result.knowledgeOrphans} in ${((Date.now() - t0) / 1000).toFixed(1)}s`,
    );
    return result;
  } catch (err) {
    console.error(`[sync-hook] graph backfill failed: ${err instanceof Error ? err.message : err}`);
    return { error: err instanceof Error ? err.message : String(err) };
  }
}

async function main() {
  const inputDir = process.env.OPCODE_DIR || undefined;
  const paths = resolvePaths(inputDir);
  const ctx = await syncStore('context', ensureIndexed, paths.dbPath);
  const code = await syncStore('code', ensureCodeIndexed, paths.codeDbPath);
  const graph = await syncGraph(inputDir, code);
  console.log(JSON.stringify({ context: ctx, code, graph }));
  process.exit(0);
}

main().catch((err) => {
  console.error('[sync-hook] fatal:', err.message);
  process.exit(0); // never crash the parent; parent enforces timeouts
});
