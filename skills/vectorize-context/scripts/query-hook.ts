#!/usr/bin/env node
/**
 * query-hook.ts — Store query for the system.transform hook, run as a CHILD
 * PROCESS so native deps + ONNX rerank inference never run inside the plugin
 * process. Prints JSON to stdout: { context: [...], code: [...] }.
 *
 * Usage:
 *   node query-hook.ts "user prompt"          # one-shot, exits after answering
 *   VECLIB_SERVER=1 node query-hook.ts        # persistent server, see below
 *   OPCODE_DIR=/path node query-hook.ts "user prompt"
 *
 * PERSISTENT SERVER MODE (VECLIB_SERVER=1)
 *   Reads newline-delimited requests on stdin, writes newline-delimited
 *   responses on stdout. Request: {"id":<n>,"query":"<text>"}. Response:
 *   {"id":<n>,"context":[...],"code":[...]}. Malformed lines are answered with
 *   an empty result rather than killing the server.
 *
 *   WHY: the cross-encoder reranker (Xenova/bge-reranker-base) costs ~9.4s to
 *   load via @huggingface/transformers, and ~0.1s to actually run once warm.
 *   Spawning a fresh child per turn puts that 9.4s directly on the inference
 *   path — measured 10.0s cold vs 0.55s with RERANK_DISABLED=1. A long-lived
 *   child pays the load once per session and keeps rerank precision.
 *
 *   stdout is reserved for the protocol. veclib.ts never writes to stdout
 *   (diagnostics go to stderr), so the channel stays clean.
 *
 * Exit 0 always (query failures produce empty results, not errors).
 */
import { createInterface } from 'node:readline';
import { queryChunks, queryCodeChunks } from './veclib.ts';

const inputDir = process.env.OPCODE_DIR || undefined;

// Reranker cost scales linearly with the candidate count, and the cross-encoder
// is CPU-bound. 20 candidates measured 0.3–5.6s warm on this machine, which is
// too wide a spread for something that sits on the inference path. Callers that
// need a bounded turn cost (the system.transform hook) dial this down; manual
// and CLI use keeps the higher default for precision.
const RERANK_CANDIDATES = Number(process.env.VECLIB_RERANK_CANDIDATES || '20') || 20;

/** Cap on structural (graph) hits injected into the prompt. */
const GRAPH_HIT_LIMIT = Number(process.env.VECLIB_GRAPH_HITS || '4') || 4;

const EMPTY = { context: [], code: [], graph: [] };

/**
 * Structural recall: which rules, skills, and concepts the graph says are
 * related to this query.
 *
 * Deliberately separate from the two vector stores, and deliberately not routed
 * through the graphlib→veclib import chain: graphRecall is pure SQL, so it
 * costs no child process, no embedding, and no reranking. That matters because
 * this runs on the inference path. veclib answers "what text is relevant";
 * the graph answers "what governs this" — edges, not prose — so a
 * content-only injection was leaving the structural layer unused.
 */
async function runGraphRecall(query: string): Promise<Array<Record<string, unknown>>> {
  try {
    const graphlibUrl = new URL('../../graph-context/scripts/graphlib.ts', import.meta.url).href;
    const { graphRecall } = await import(graphlibUrl);
    const hits = graphRecall(inputDir, query, GRAPH_HIT_LIMIT, 1);
    return Array.isArray(hits) ? hits : [];
  } catch (err) {
    // No graph built, or graphlib unavailable — structural recall is optional.
    console.error(`[query-hook] graph recall unavailable: ${err instanceof Error ? err.message : err}`);
    return [];
  }
}

/**
 * Run both stores for one query. Each store is independently fault-tolerant:
 * a missing or locked store degrades to empty results, never an exception.
 */
async function runQuery(query: string) {
  const out: { context: any[]; code: any[]; graph: any[] } = { context: [], code: [], graph: [] };

  // Context store — top 5 with rerank
  try {
    const results = await queryChunks(inputDir, query, 5, { useReranker: true, rerankCandidates: RERANK_CANDIDATES, skipEnsureIndex: true });
    out.context = (results || []).map((r: Record<string, any>) => ({
      file: r.source || r.file_path || 'context',
      heading: r.heading || '',
      content: r.content || '',
      score: r.rerank_score ?? null,
    }));
  } catch (err) {
    console.error(`[query-hook] context store unavailable: ${err instanceof Error ? err.message : err}`);
  }

  // Code store — top 4 with rerank
  try {
    const results = await queryCodeChunks(inputDir, query, 4, { useReranker: true, rerankCandidates: RERANK_CANDIDATES, skipEnsureIndex: true });
    out.code = (results || []).map((r: Record<string, any>) => ({
      file: r.file_path || r.source || 'code',
      heading: r.heading || '',
      content: r.content || '',
      score: r.rerank_score ?? null,
    }));
  } catch (err) {
    console.error(`[query-hook] code store unavailable: ${err instanceof Error ? err.message : err}`);
  }

  // Structural recall — pure SQL, so it is cheap enough to always attempt.
  out.graph = await runGraphRecall(query);

  return out;
}

async function runServer() {
  const rl = createInterface({ input: process.stdin, crlfDelay: Infinity });

  // Requests are serialized: the reranker is CPU-bound, and concurrent
  // cross-encoder passes would only contend for the same cores.
  let chain = Promise.resolve();

  rl.on('line', (line) => {
    const trimmed = line.trim();
    if (!trimmed) return;

    let id = null;
    let query = '';
    try {
      const req = JSON.parse(trimmed);
      id = typeof req.id === 'number' ? req.id : null;
      query = typeof req.query === 'string' ? req.query.trim() : '';
    } catch {
      // Unparseable line — answer with empty result if we can identify it.
      process.stdout.write(JSON.stringify({ id: null, ...EMPTY }) + '\n');
      return;
    }

    chain = chain.then(async () => {
      const result = query ? await runQuery(query) : EMPTY;
      process.stdout.write(JSON.stringify({ id, ...result }) + '\n');
    }).catch((err) => {
      console.error('[query-hook] server error:', err instanceof Error ? err.message : err);
      process.stdout.write(JSON.stringify({ id, ...EMPTY }) + '\n');
    });
  });

  rl.on('close', () => {
    chain.finally(() => process.exit(0));
  });

  // Warm both ONNX models BEFORE signalling readiness.
  //
  // This child used to signal ready the moment it opened stdin, so the first real
  // query paid for every model load inside the caller's timeout. Swapping the
  // embedder from a warm Ollama daemon to an in-process ONNX session doubled that
  // cold cost — two models at ~4s each against a 12s first-query budget — and the
  // first query of a session timed out and degraded to no injection at all.
  //
  // Readiness now means what it should: the models are loaded and the next request
  // is inference, not installation. A model that cannot load is reported and the
  // server still starts, because a degraded query path beats a dead one.
  await warmModels();

  process.stdout.write(JSON.stringify({ ready: true }) + '\n');
  console.error('[query-hook] server ready');
}

/**
 * Load the embedder and reranker so the first query does not pay for them.
 *
 * Both are best-effort. `queryChunks` still works with a cold embedder (it loads
 * on demand) and degrades to distance ordering without a reranker, so a failure
 * here costs latency, not correctness.
 */
async function warmModels(): Promise<void> {
  if (process.env.VECLIB_NO_WARM === '1') return
  const t0 = Date.now()
  const warmed: string[] = []
  const failed: string[] = []

  try {
    const emb = await import('./embedder.ts')
    await emb.embed(['warmup'])
    warmed.push('embedder')
  } catch (e) {
    failed.push(`embedder: ${e instanceof Error ? e.message : String(e)}`)
  }

  try {
    if (process.env.RERANK_DISABLED !== '1') {
      const veclib = await import('./veclib.ts')
      await (veclib as any).__warmReranker()
      warmed.push('reranker')
    }
  } catch (e) {
    failed.push(`reranker: ${e instanceof Error ? e.message : String(e)}`)
  }

  const ms = Date.now() - t0
  console.error(
    `[query-hook] warm ${warmed.length ? warmed.join(',') : 'none'} in ${ms}ms` +
      (failed.length ? ` — failed: ${failed.join('; ')}` : ''),
  )
}

async function main() {
  if (process.env.VECLIB_SERVER === '1') {
    await runServer();
    return;
  }

  const query = (process.argv[2] || '').trim();
  if (!query) {
    console.log(JSON.stringify(EMPTY));
    process.exit(0);
  }

  console.log(JSON.stringify(await runQuery(query)));
  process.exit(0);
}

main().catch((err) => {
  console.error('[query-hook] fatal:', err instanceof Error ? err.message : err);
  console.log(JSON.stringify(EMPTY));
  process.exit(0);
});
