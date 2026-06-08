#!/usr/bin/env node
/**
 * vectorize.mjs — CLI wrapper for veclib.ensureIndexed()
 *
 * Usage:
 *   node vectorize.mjs              # Index current project
 *   OPCODE_DIR=/path node vectorize.mjs  # Index specific project
 */
import { ensureIndexed, resolvePaths } from './veclib.mjs';

const opencodeDir = process.env.OPCODE_DIR || undefined;

async function main() {
  const paths = resolvePaths(opencodeDir);
  console.error(`Context dir: ${paths.contextDir}`);

  const result = await ensureIndexed(opencodeDir);

  console.error('');
  console.error('=== Vectorize Summary ===');
  console.error(`Files scanned: ${result.filesScanned}`);
  console.error(`Files indexed: ${result.filesIndexed} (new/changed)`);
  console.error(`Files skipped: ${result.filesSkipped} (unchanged)`);
  console.error(`Total chunks: ${result.totalChunks}`);
  console.error(`Errors: ${result.errors}`);

  // Machine-readable on stdout
  console.log(JSON.stringify(result));
}

main().catch(err => {
  console.error('Fatal:', err.message);
  process.exit(1);
});
