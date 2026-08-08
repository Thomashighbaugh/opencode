/**
 * e2e.test.mjs — OPT-IN end-to-end tests against the real Ollama embed server.
 *
 * The hermetic suites (veclib.test.mjs, cli.test.mjs) run everywhere. This
 * suite validates the REAL API contract (Ollama /api/embed response shape,
 * real mxbai-embed-large vectors, optional real reranker) so the mock can
 * never drift from production.
 *
 * Run:  RUN_E2E=1 node --test tests/e2e.test.mjs
 * Skips gracefully when Ollama is unreachable.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { makeFixture, cleanupFixture, SCRIPTS_DIR } from './helpers.mjs';

const RUN_E2E = process.env.RUN_E2E === '1';
const OLLAMA_URL = process.env.OLLAMA_URL || 'http://127.0.0.1:11434';
// The REAL production embed model — the mock suite's EMBED_MODEL ('test-embed-model')
// intentionally doesn't exist on Ollama (Ollama 404s on unknown models).
const REAL_EMBED_MODEL = process.env.REAL_EMBED_MODEL || 'pedrohml/mxbai-embed-large:latest';

async function ollamaReachable() {
  try {
    const res = await fetch(`${OLLAMA_URL}/api/tags`, { signal: AbortSignal.timeout(3000) });
    return res.ok;
  } catch {
    return false;
  }
}

const reachable = RUN_E2E ? await ollamaReachable() : false;

test.after(() => cleanupFixture());

test('e2e: real Ollama full pipeline (index → query → ranking)', { skip: !RUN_E2E && 'set RUN_E2E=1 to run; skipped by default' }, async (t) => {
  if (!reachable) return t.skip(`Ollama unreachable at ${OLLAMA_URL}`);
  const fx = makeFixture();
  const script = `
    const veclib = await import('${SCRIPTS_DIR.replace(/\\/g, '/')}/veclib.mjs');
    const indexed = await veclib.ensureIndexed('${fx.root}');
    const ctx = await veclib.queryChunks('${fx.root}', 'authentication login token refresh expiry', 5, { useReranker: false });
    const code = await veclib.queryCodeChunks('${fx.root}', 'auth login password', 5, { useReranker: false });
    const stats = await veclib.getIndexStats('${fx.root}');
    console.log(JSON.stringify({ indexed, ctx, code, stats }));
  `;
  const res = spawnSync(process.execPath, ['--input-type=module', '-e', script], {
    encoding: 'utf-8',
    timeout: 120_000,
    env: { ...process.env, OLLAMA_URL, EMBED_MODEL: REAL_EMBED_MODEL },
  });
  assert.equal(res.status, 0, res.stderr);
  const { indexed, ctx, code, stats } = JSON.parse(res.stdout);

  assert.equal(indexed.errors, 0);
  assert.equal(indexed.totalChunks, 9, 'context store: 9 chunks');
  assert.equal(stats.embedding.model, REAL_EMBED_MODEL);
  assert.equal(stats.embedding.dim, '1024');

  assert.ok(ctx.length >= 1, 'real embeddings must find auth docs');
  assert.ok(ctx[0].source.endsWith('auth.md'), `top context hit should be auth.md, got ${ctx[0].source}`);
  assert.ok(code.length >= 1, 'code store must return hits');
  assert.ok(code[0].file_path.endsWith('auth.ts'), `top code hit should be auth.ts, got ${code[0].file_path}`);
});

test('e2e: real reranker path (when ONNX model is cached)', { skip: !RUN_E2E && 'set RUN_E2E=1 to run; skipped by default' }, async (t) => {
  if (!reachable) return t.skip(`Ollama unreachable at ${OLLAMA_URL}`);
  const fx = makeFixture();
  const script = `
    const veclib = await import('${SCRIPTS_DIR.replace(/\\/g, '/')}/veclib.mjs');
    const ctx = await veclib.queryChunks('${fx.root}', 'authentication login token refresh expiry', 5, { useReranker: true });
    console.log(JSON.stringify(ctx));
  `;
  const res = spawnSync(process.execPath, ['--input-type=module', '-e', script], {
    encoding: 'utf-8',
    timeout: 120_000,
    env: { ...process.env, OLLAMA_URL, EMBED_MODEL: REAL_EMBED_MODEL },
  });
  assert.equal(res.status, 0, res.stderr);
  const ctx = JSON.parse(res.stdout);
  assert.ok(Array.isArray(ctx) && ctx.length >= 1, 'rerank path must not break retrieval');
  for (const row of ctx) {
    assert.ok(typeof row.rerank_score === 'number' || row.rerank_score === null || row.rerank_score === undefined);
  }
  // Degradation contract: if rerank loaded, scores are present; if not, distance ordering survived.
  assert.ok(ctx[0].source.endsWith('auth.md'), `top hit should be auth.md, got ${ctx[0].source}`);
});
