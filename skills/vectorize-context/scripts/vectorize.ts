#!/usr/bin/env node
/**
 * vectorize.ts — CLI wrapper for veclib.ensureIndexed() / ensureCodeIndexed()
 *
 * Usage:
 *   node vectorize.ts                # Index context + code (default)
 *   node vectorize.ts --context      # Index context store only
 *   node vectorize.ts --code         # Index code store only
 *   OPCODE_DIR=/path node vectorize.ts  # Index specific project
 */
import { ensureIndexed, ensureCodeIndexed, resolvePaths } from './veclib.ts';

const args = process.argv.slice(2);
const wantContext = args.includes('--context') || !args.includes('--code');
const wantCode = args.includes('--code') || !args.includes('--context');

const opencodeDir = process.env.OPCODE_DIR || undefined;

async function runStore(name, fn) {
  const t0 = Date.now();
  const result = await fn(opencodeDir);
  console.error('');
  console.error(`=== ${name} Vectorize Summary ===`);
  console.error(`Files scanned: ${result.filesScanned}`);
  console.error(`Files indexed: ${result.filesIndexed} (new/changed)`);
  console.error(`Files skipped: ${result.filesSkipped} (unchanged)`);
  console.error(`Total chunks: ${result.totalChunks}`);
  console.error(`Errors: ${result.errors}`);
  console.error(`Elapsed: ${((Date.now() - t0) / 1000).toFixed(1)}s`);
  return result;
}

async function main() {
  const paths = resolvePaths(opencodeDir);
  console.error(`Project root: ${paths.projectRoot}`);
  console.error(`Context dir: ${paths.contextDir}`);

  const results: { context?: unknown; code?: unknown } = {};
  if (wantContext) {
    results.context = await runStore('Context', ensureIndexed);
  }
  if (wantCode) {
    results.code = await runStore('Code', ensureCodeIndexed);
  }

  // Machine-readable on stdout
  console.log(JSON.stringify(results));
}

main().catch(err => {
  console.error('Fatal:', err.message);
  process.exit(1);
});
