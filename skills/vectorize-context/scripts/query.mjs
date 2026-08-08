#!/usr/bin/env node
/**
 * query.mjs — CLI wrapper for veclib.queryChunks() / queryCodeChunks()
 *
 * Usage:
 *   node query.mjs "your search query"
 *   node query.mjs --code "how is chunking done"   # query the code store
 *   QUERY="your search" node query.mjs
 */
import { queryChunks, queryCodeChunks, resolvePaths } from './veclib.mjs';

const opencodeDir = process.env.OPCODE_DIR || undefined;

function formatResults(results, useCode) {
  if (results.length === 0) {
    console.log('No matching results found.');
    return;
  }

  console.log('');
  console.log(`=== Search Results (${useCode ? 'code' : 'context'} store) ===`);
  console.log('');

  for (let i = 0; i < results.length; i++) {
    const row = results[i];
    const similarity = Math.max(0, 1 - row.distance / 2);
    const rerank = row.rerank_score !== undefined && row.rerank_score !== null
      ? `, rerank: ${row.rerank_score.toFixed(4)}`
      : '';

    console.log(`${i + 1}. ${row.source} — ${row.heading} (score: ${similarity.toFixed(4)}${rerank})`);

    const preview = row.content.length > 200
      ? row.content.slice(0, 200) + '...'
      : row.content;
    console.log(`   ${preview}`);
    console.log(`   [file: ${row.file_path}]`);
    console.log('');
  }
}

async function main() {
  const args = process.argv.slice(2);
  const useCode = args.includes('--code');
  const query = (args.find(a => !a.startsWith('--')) || process.env.QUERY || '').trim();

  if (!query) {
    console.error('Usage: node query.mjs [--code] "your search query"');
    console.error('   or: QUERY="your search query" node query.mjs');
    process.exit(1);
  }

  console.error(`Query: "${query}" (${useCode ? 'code' : 'context'} store)`);

  // queryChunks/queryCodeChunks automatically ensure fresh indexes (lazy)
  const results = useCode
    ? await queryCodeChunks(opencodeDir, query)
    : await queryChunks(opencodeDir, query);
  formatResults(results, useCode);
}

main().catch(err => {
  console.error('Fatal:', err.message);
  process.exit(1);
});
