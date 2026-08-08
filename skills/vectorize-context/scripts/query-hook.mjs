#!/usr/bin/env node
/**
 * query-hook.mjs — Store query for the system.transform hook, run as a CHILD
 * PROCESS so native deps + ONNX rerank inference never run inside the plugin
 * process. Prints JSON to stdout: { context: [...], code: [...] }.
 *
 * Usage:
 *   node query-hook.mjs "user prompt"
 *   OPCODE_DIR=/path node query-hook.mjs "user prompt"
 *
 * Exit 0 always (query failures produce empty results, not errors).
 */
import { queryChunks, queryCodeChunks } from './veclib.mjs';

const inputDir = process.env.OPCODE_DIR || undefined;
const query = (process.argv[2] || '').trim();

async function main() {
  if (!query) {
    console.log(JSON.stringify({ context: [], code: [] }));
    process.exit(0);
  }

  const out = { context: [], code: [] };

  // Context store — top 5 with rerank
  try {
    const results = await queryChunks(inputDir, query, 5, { useReranker: true });
    out.context = (results || []).map((r) => ({
      file: r.source || r.file_path || 'context',
      heading: r.heading || '',
      content: r.content || '',
      score: r.rerank_score ?? null,
    }));
  } catch {
    // context store unavailable — empty results
  }

  // Code store — top 4 with rerank
  try {
    const results = await queryCodeChunks(inputDir, query, 4, { useReranker: true });
    out.code = (results || []).map((r) => ({
      file: r.file_path || r.source || 'code',
      heading: r.heading || '',
      content: r.content || '',
      score: r.rerank_score ?? null,
    }));
  } catch {
    // code store unavailable — empty results
  }

  console.log(JSON.stringify(out));
  process.exit(0);
}

main().catch(() => {
  console.log(JSON.stringify({ context: [], code: [] }));
  process.exit(0);
});
