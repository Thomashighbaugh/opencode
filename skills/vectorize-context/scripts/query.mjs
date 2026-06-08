#!/usr/bin/env node
/**
 * query.mjs — CLI wrapper for veclib.queryChunks()
 *
 * Usage:
 *   node query.mjs "your search query"
 *   QUERY="your search" node query.mjs
 */
import { queryChunks, resolvePaths } from './veclib.mjs';

const opencodeDir = process.env.OPCODE_DIR || undefined;

function formatResults(results) {
  if (results.length === 0) {
    console.log('No matching results found.');
    return;
  }

  console.log('');
  console.log('=== Search Results ===');
  console.log('');

  for (let i = 0; i < results.length; i++) {
    const row = results[i];
    const similarity = Math.max(0, 1 - row.distance / 2);

    console.log(`${i + 1}. ${row.source} — ${row.heading} (score: ${similarity.toFixed(4)})`);

    const preview = row.content.length > 200
      ? row.content.slice(0, 200) + '...'
      : row.content;
    console.log(`   ${preview}`);
    console.log(`   [file: ${row.file_path}]`);
    console.log('');
  }
}

async function main() {
  let query = process.argv[2] || process.env.QUERY || '';
  query = query.trim();

  if (!query) {
    console.error('Usage: node query.mjs "your search query"');
    console.error('   or: QUERY="your search query" node query.mjs');
    process.exit(1);
  }

  console.error(`Query: "${query}"`);

  // queryChunks automatically calls ensureIndexed first (lazy freshness)
  const results = await queryChunks(opencodeDir, query);
  formatResults(results);
}

main().catch(err => {
  console.error('Fatal:', err.message);
  process.exit(1);
});
