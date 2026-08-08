/**
 * cli.test.mjs — CLI + hook-script integration tests.
 *
 * Runs the actual scripts (vectorize.mjs, query.mjs, sync-hook.mjs,
 * query-hook.mjs) as child processes against a fixture, plus source-level
 * regression guards on the PLUGIN hooks (in-process veclib usage would
 * re-introduce the kernel-panic architecture).
 *
 * Run:  node --test tests/cli.test.mjs
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import {
  startMockEmbedServer, setMockUrl, makeFixture, cleanupFixture,
  runScript, testEnv,
} from './helpers.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PLUGIN_HOOKS_DIR = path.resolve(__dirname, '..', '..', '..', 'plugins', 'hooks');

const server = await startMockEmbedServer();
setMockUrl(server.url);

test.after(() => cleanupFixture());
test.after(() => server.close());

// ─── vectorize.mjs ─────────────────────────────────────────────────────────

test('vectorize.mjs: default indexes BOTH stores, JSON on stdout', async () => {
  const fx = makeFixture();
  const res = await runScript('vectorize.mjs', [], testEnv(fx.root));
  assert.equal(res.code, 0, res.stderr);
  const out = JSON.parse(res.stdout);
  assert.equal(out.context.filesIndexed, 5);
  assert.equal(out.code.filesIndexed, 5);
  assert.ok(res.stderr.includes('Project root'));
});

test('vectorize.mjs: --code indexes only the code store', async () => {
  const fx = makeFixture();
  const res = await runScript('vectorize.mjs', ['--code'], testEnv(fx.root));
  assert.equal(res.code, 0, res.stderr);
  const out = JSON.parse(res.stdout);
  assert.equal(out.code.filesIndexed, 5);
  assert.equal(out.context, undefined);
});

test('vectorize.mjs: --context indexes only the context store', async () => {
  const fx = makeFixture();
  const res = await runScript('vectorize.mjs', ['--context'], testEnv(fx.root));
  assert.equal(res.code, 0, res.stderr);
  const out = JSON.parse(res.stdout);
  assert.equal(out.context.filesIndexed, 5);
  assert.equal(out.code, undefined);
});

// ─── query.mjs ─────────────────────────────────────────────────────────────

test('query.mjs: missing query → usage error, exit 1', async () => {
  const fx = makeFixture();
  const res = await runScript('query.mjs', [], testEnv(fx.root));
  assert.equal(res.code, 1);
  assert.ok(res.stderr.includes('Usage'));
});

test('query.mjs: context search returns the matching file', async () => {
  const fx = makeFixture();
  const res = await runScript('query.mjs', ['auth login token refresh'], testEnv(fx.root));
  assert.equal(res.code, 0, res.stderr);
  assert.ok(res.stdout.includes('context store'));
  assert.ok(res.stdout.includes('auth.md'), res.stdout);
});

test('query.mjs: --code searches the code store', async () => {
  const fx = makeFixture();
  const res = await runScript('query.mjs', ['--code', 'auth login password'], testEnv(fx.root));
  assert.equal(res.code, 0, res.stderr);
  assert.ok(res.stdout.includes('code store'));
  assert.ok(res.stdout.includes('auth.ts'), res.stdout);
});

// ─── sync-hook.mjs (maintenance mode — the panic regression guard) ─────────

test('sync-hook.mjs: missing stores → skipped, exit 0 (never an index storm)', async () => {
  const fx = makeFixture();
  const res = await runScript('sync-hook.mjs', [], testEnv(fx.root));
  assert.equal(res.code, 0, res.stderr);
  const out = JSON.parse(res.stdout);
  assert.equal(out.context.skipped, true);
  assert.equal(out.code.skipped, true);
});

test('sync-hook.mjs: existing stores → incremental sync, exit 0', async () => {
  const fx = makeFixture();
  await runScript('vectorize.mjs', [], testEnv(fx.root)); // build both stores
  const res = await runScript('sync-hook.mjs', [], testEnv(fx.root));
  assert.equal(res.code, 0, res.stderr);
  const out = JSON.parse(res.stdout);
  assert.equal(out.context.skipped, undefined);
  assert.equal(out.context.filesIndexed, 0); // nothing changed
  assert.equal(out.context.filesSkipped, 5);
  assert.equal(out.code.filesSkipped, 5);
});

// ─── query-hook.mjs (plugin injection payload) ─────────────────────────────

test('query-hook.mjs: empty query → empty payload, exit 0', async () => {
  const fx = makeFixture();
  const res = await runScript('query-hook.mjs', [''], testEnv(fx.root));
  assert.equal(res.code, 0, res.stderr);
  assert.deepEqual(JSON.parse(res.stdout), { context: [], code: [] });
});

test('query-hook.mjs: query → {context, code} payload with row shape, exit 0', async () => {
  const fx = makeFixture();
  await runScript('vectorize.mjs', [], testEnv(fx.root));
  const res = await runScript('query-hook.mjs', ['auth login token refresh'], testEnv(fx.root));
  assert.equal(res.code, 0, res.stderr);
  const out = JSON.parse(res.stdout);
  assert.ok(Array.isArray(out.context) && out.context.length <= 5);
  assert.ok(Array.isArray(out.code) && out.code.length <= 4);
  assert.ok(out.context.length >= 1, 'expected context hits');
  assert.ok(out.context.length >= 1 && out.context[0].file.endsWith('auth.md'), JSON.stringify(out.context[0]));
  for (const row of out.context) {
    assert.ok(typeof row.file === 'string' && typeof row.heading === 'string' && typeof row.content === 'string');
    assert.ok('score' in row);
  }
});

test('query-hook.mjs: missing stores → empty payload, exit 0 (never crashes the hook)', async () => {
  const empty = fs.mkdtempSync(path.join(process.env.TMPDIR || '/tmp', 'vec-hook-empty-'));
  try {
    const res = await runScript('query-hook.mjs', ['anything at all'], testEnv(empty));
    assert.equal(res.code, 0, res.stderr);
    assert.deepEqual(JSON.parse(res.stdout), { context: [], code: [] });
  } finally {
    fs.rmSync(empty, { recursive: true, force: true });
  }
});

// ─── Plugin hook source regression guards ──────────────────────────────────
// These exist because the first hook architecture imported veclib INTO the
// plugin process and froze the machine (kernel panic). If any of these
// assertions fail, the panic architecture is back.

test('vectorize-hook.ts: child-process supervisor, no in-process veclib', async () => {
  const src = fs.readFileSync(path.join(PLUGIN_HOOKS_DIR, 'vectorize-hook.ts'), 'utf-8');
  assert.ok(!src.includes('veclib.mjs'), 'hook must not import veclib (native deps in plugin process)');
  assert.ok(src.includes('child_process') || src.includes('spawn'), 'hook must spawn children');
  assert.ok(src.includes('SIGKILL'), 'hook must SIGKILL runaway children');
  assert.ok(src.includes('childRunning'), 'hook must serialize children (no overlap)');
  assert.ok(src.includes('sync-hook.mjs'), 'hook must spawn the maintenance sync script');
  assert.ok(src.includes('setInterval'), 'hook must poll on an interval');
});

test('hooks.ts: guarded dynamic hook load + child-process query injection', async () => {
  const src = fs.readFileSync(path.join(PLUGIN_HOOKS_DIR, 'hooks.ts'), 'utf-8');
  assert.ok(!src.includes('veclib'), 'plugin must never import veclib');
  assert.ok(src.includes('query-hook.mjs'), 'plugin must spawn query-hook.mjs for injection');
  assert.ok(src.includes('await import'), 'hook load must be dynamic');
  assert.ok(src.includes('vectorize-hook'), 'hook must be loaded by name');
  assert.ok(src.includes('25000') || src.includes('25_000'), 'query child must have a hard timeout');
});
