#!/usr/bin/env node
/**
 * vectorize.mjs — CLI wrapper for veclib.ensureIndexed() / ensureCodeIndexed()
 *
 * Usage:
 *   node vectorize.mjs                # Index context + code (default)
 *   node vectorize.mjs --context      # Index context store only
 *   node vectorize.mjs --code         # Index code store only
 *   OPCODE_DIR=/path node vectorize.mjs  # Index specific project
 */
import { ensureIndexed, ensureCodeIndexed, resolvePaths } from './veclib.mjs';

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

  const results = {};
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
