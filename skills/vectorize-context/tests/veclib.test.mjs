/**
 * veclib.test.mjs — Unit + integration tests for veclib.mjs (both stores).
 *
 * Hermetic: mock embed server (helpers.mjs) — no Ollama, no network.
 * Run:  node --test tests/veclib.test.mjs
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import fs from 'node:fs';
import os from 'node:os';
import { spawn } from 'node:child_process';
import {
  startMockEmbedServer, setMockUrl, makeFixture, cleanupFixture,
  touchFile, EXPECTED_CONTEXT_TOTAL, EXPECTED_CODE_TOTAL, SCRIPTS_DIR,
  EMBED_MODEL,
} from './helpers.mjs';

// ─── Setup: env BEFORE importing veclib (config read at module load) ───────
const server = await startMockEmbedServer();
setMockUrl(server.url);
process.env.OLLAMA_URL = server.url;
process.env.EMBED_MODEL = EMBED_MODEL;
process.env.RERANK_DISABLED = '1';

const veclib = await import('../scripts/veclib.mjs');

test.after(() => cleanupFixture());
test.after(() => server.close());

// ─── 1. Path resolution ────────────────────────────────────────────────────

test('resolvePaths: accepts project root, .opencode dir, env, or defaults', () => {
  const fx = makeFixture();
  const root = fx.root;
  const oc = path.join(root, '.opencode');

  // project root form
  const a = veclib.resolvePaths(root);
  assert.equal(a.projectRoot, root);
  assert.equal(a.opencodeDir, oc);
  assert.equal(a.contextDir, path.join(oc, 'context'));
  assert.equal(a.vectorDir, path.join(oc, 'state', 'vector'));
  assert.equal(a.dbPath, path.join(oc, 'state', 'vector', 'context.db'));
  assert.equal(a.codeDbPath, path.join(oc, 'state', 'vector', 'code.db'));

  // .opencode dir form
  const b = veclib.resolvePaths(oc);
  assert.equal(b.projectRoot, root);
  assert.equal(b.opencodeDir, oc);

  // env form
  const oldEnv = process.env.OPCODE_DIR;
  process.env.OPCODE_DIR = oc;
  try {
    const c = veclib.resolvePaths(undefined);
    assert.equal(c.opencodeDir, oc);
  } finally {
    if (oldEnv === undefined) delete process.env.OPCODE_DIR; // restore, don't set 'undefined'
    else process.env.OPCODE_DIR = oldEnv;
  }

  // default form (cwd-based)
  const d = veclib.resolvePaths();
  assert.equal(d.opencodeDir, path.resolve(process.cwd(), '.opencode'));
});

// ─── 2. Scoped file collection (context store) ─────────────────────────────

test('collectScopedFiles: context/rules/docs md + AGENTS.md, excludes non-md & node_modules', async () => {
  const fx = makeFixture();
  const files = await veclib.collectScopedFiles(veclib.resolvePaths(fx.root));
  assert.equal(files.length, 5);
  const rels = files.map((f) => path.relative(fx.root, f)).sort();
  assert.deepEqual(rels, [
    '.opencode/context/frameworks/auth.md',
    '.opencode/context/patterns/pagination.md',
    '.opencode/docs/guide.md',
    '.opencode/rules/security.md',
    'AGENTS.md',
  ]);
  // non-md and node_modules-inside-context are never collected
  assert.ok(!rels.some((r) => r.includes('notes.txt')));
  assert.ok(!rels.some((r) => r.includes('node_modules')));
});

test('collectScopedFiles: missing dirs do not crash', async () => {
  const empty = fs.mkdtempSync(path.join(os.tmpdir(), 'vec-empty-'));
  try {
    const files = await veclib.collectScopedFiles(veclib.resolvePaths(empty));
    assert.equal(files.length, 0);
  } finally {
    fs.rmSync(empty, { recursive: true, force: true });
  }
});

// ─── 3. Code file collection ───────────────────────────────────────────────

test('collectCodeFiles: collects code, skips node_modules/dist/state/cache/md', async () => {
  const fx = makeFixture();
  const files = await veclib.collectCodeFiles(veclib.resolvePaths(fx.root));
  const rels = files.map((f) => path.relative(fx.root, f)).sort();
  assert.equal(rels.length, 5, `expected 5, got: ${rels.join(', ')}`);
  assert.deepEqual(rels, [
    '.opencode/tools/my-tool.ts', // dot-dir .opencode IS walked
    'src/auth.ts',
    'src/legacy/old.py',
    'src/pagination.ts',
    'src/utils/helpers.js',
  ]);
  for (const forbidden of ['node_modules', 'dist', '.opencode/state', '.opencode/cache', 'README.md']) {
    assert.ok(!rels.some((r) => r.includes(forbidden)), `must not contain ${forbidden}`);
  }
});

// ─── 4. Chunkers ───────────────────────────────────────────────────────────

test('chunkMarkdown: strips frontmatter, splits on ##/###, drops tiny chunks', () => {
  const fx = makeFixture();
  const content = fs.readFileSync(path.join(fx.root, '.opencode/context/frameworks/auth.md'), 'utf-8');
  const chunks = veclib.chunkMarkdown(content, 'auth.md');

  assert.equal(chunks.length, 3); // intro + Authentication + Token Refresh (Tiny dropped)
  assert.equal(chunks[0].heading, '(no heading)');
  assert.equal(chunks[1].heading, 'Authentication');
  assert.equal(chunks[2].heading, 'Token Refresh');
  // frontmatter must not leak into chunks
  for (const c of chunks) {
    assert.ok(!c.content.includes('title:'), 'frontmatter leaked into chunk');
    assert.ok(c.content.length >= 50, 'chunk below MIN_CHUNK_LENGTH');
  }
  // heading levels tracked
  assert.equal(chunks[1].headingLevel, 2);
  assert.equal(chunks[2].headingLevel, 3);
});

test('chunkCode: splits at top-level declarations only, records headings', () => {
  const fx = makeFixture();
  const content = fs.readFileSync(path.join(fx.root, 'src/auth.ts'), 'utf-8');
  const chunks = veclib.chunkCode(content, 'auth.ts');

  assert.equal(chunks.length, 2);
  // first chunk keeps the file-name heading (boundary at buffer start), second gets the decl line
  assert.equal(chunks[0].heading, 'auth.ts');
  assert.match(chunks[0].content, /login/);
  assert.equal(chunks[1].heading, 'export async function refreshToken(token, auth) {');
  assert.match(chunks[1].content, /refreshToken/);
  assert.ok(chunks[0].content.length >= 50 && chunks[1].content.length >= 50);
});

test('chunkCode: never splits inside blocks (indented declarations)', () => {
  const content = [
    'export function outer() {',
    '  function inner() { return 1; }',
    '  const local = () => 2;',
    '  return inner() + local;',
    '}',
  ].join('\n');
  const chunks = veclib.chunkCode(content, 'nested.ts');
  assert.equal(chunks.length, 1, 'indented declarations must not be boundaries');
  assert.ok(chunks[0].content.includes('inner'));
});

test('chunkCode: line cap (60) and char cap (6000) bound chunk size', () => {
  const manyLines = ['export function big() {'];
  for (let i = 0; i < 70; i++) manyLines.push(`  const v${i} = ${i};`);
  manyLines.push('}');
  const content = manyLines.join('\n');
  const chunks = veclib.chunkCode(content, 'big.ts');
  assert.ok(chunks.length >= 2, '70-line file must split into 2+ chunks');
  for (const c of chunks) {
    assert.ok(c.content.split('\n').length <= 60, 'chunk exceeds 60-line cap');
    assert.ok(c.content.length <= 7000, 'chunk exceeds char cap tolerance');
  }

  const hugeLine = 'export const data = "' + 'x'.repeat(12000) + '";';
  const huge = veclib.chunkCode(hugeLine, 'huge.ts');
  assert.equal(huge.length, 1, 'single line stays one chunk');
  assert.ok(huge[0].content.length >= 12000);
});

test('chunkCode: empty/degenerate input yields no chunks', () => {
  assert.equal(veclib.chunkCode('', 'empty.ts').length, 0);
  assert.equal(veclib.chunkCode('short', 'tiny.ts').length, 0);
});

// ─── 5. ensureIndexed — context store ──────────────────────────────────────

test('ensureIndexed: fresh index of all scoped files', async () => {
  const fx = makeFixture();
  const r = await veclib.ensureIndexed(fx.root);
  assert.equal(r.filesScanned, 5);
  assert.equal(r.filesIndexed, 5);
  assert.equal(r.filesSkipped, 0);
  assert.equal(r.totalChunks, EXPECTED_CONTEXT_TOTAL);
  assert.equal(r.errors, 0);
});

test('ensureIndexed: second run is a no-op (mtime skip)', async () => {
  const fx = makeFixture();
  await veclib.ensureIndexed(fx.root);
  const r = await veclib.ensureIndexed(fx.root);
  assert.equal(r.filesIndexed, 0);
  assert.equal(r.filesSkipped, 5);
  assert.equal(r.totalChunks, EXPECTED_CONTEXT_TOTAL);
});

test('ensureIndexed: incremental — only changed files re-index', async () => {
  const fx = makeFixture();
  await veclib.ensureIndexed(fx.root);
  touchFile(path.join(fx.root, '.opencode/context/frameworks/auth.md'));
  const r = await veclib.ensureIndexed(fx.root);
  assert.equal(r.filesIndexed, 1);
  assert.equal(r.filesSkipped, 4);
  assert.equal(r.totalChunks, EXPECTED_CONTEXT_TOTAL); // re-indexed, not duplicated
});

test('ensureIndexed: deleted files have chunks removed', async () => {
  const fx = makeFixture();
  await veclib.ensureIndexed(fx.root);
  fs.rmSync(path.join(fx.root, '.opencode/context/patterns/pagination.md'));
  const r = await veclib.ensureIndexed(fx.root);
  assert.equal(r.filesIndexed, 0);
  assert.equal(r.totalChunks, EXPECTED_CONTEXT_TOTAL - 2); // pagination.md had 2 chunks
});

test('ensureIndexed: no scoped files → clean zero result', async () => {
  const empty = fs.mkdtempSync(path.join(os.tmpdir(), 'vec-empty2-'));
  try {
    const r = await veclib.ensureIndexed(empty);
    assert.deepEqual(r, { filesScanned: 0, filesIndexed: 0, filesSkipped: 0, totalChunks: 0, errors: 0 });
  } finally {
    fs.rmSync(empty, { recursive: true, force: true });
  }
});

// ─── 6. ensureCodeIndexed — code store ─────────────────────────────────────

test('ensureCodeIndexed: fresh index of code files', async () => {
  const fx = makeFixture();
  const r = await veclib.ensureCodeIndexed(fx.root);
  assert.equal(r.filesScanned, 5);
  assert.equal(r.filesIndexed, 5);
  assert.equal(r.totalChunks, EXPECTED_CODE_TOTAL);
  assert.equal(r.errors, 0);
});

test('ensureCodeIndexed: incremental after edit', async () => {
  const fx = makeFixture();
  await veclib.ensureCodeIndexed(fx.root);
  touchFile(path.join(fx.root, 'src/auth.ts'));
  const r = await veclib.ensureCodeIndexed(fx.root);
  assert.equal(r.filesIndexed, 1);
  assert.equal(r.filesSkipped, 4);
  assert.equal(r.totalChunks, EXPECTED_CODE_TOTAL);
});

test('ensureCodeIndexed: code store ignores markdown + context changes', async () => {
  const fx = makeFixture();
  await veclib.ensureIndexed(fx.root);
  await veclib.ensureCodeIndexed(fx.root);
  // touching a markdown file must not re-index code
  touchFile(path.join(fx.root, '.opencode/context/frameworks/auth.md'));
  const r = await veclib.ensureCodeIndexed(fx.root);
  assert.equal(r.filesIndexed, 0);
  assert.equal(r.totalChunks, EXPECTED_CODE_TOTAL);
});

// ─── 7. Single-file vectorization ──────────────────────────────────────────

test('vectorizeFile: indexes one md file, idempotent, missing file → 0', async () => {
  const fx = makeFixture();
  const auth = path.join(fx.root, '.opencode/context/frameworks/auth.md');

  const r1 = await veclib.vectorizeFile(auth, fx.root);
  assert.equal(r1.chunks, 3);

  const r2 = await veclib.vectorizeFile(auth, fx.root);
  assert.equal(r2.chunks, 3, 'idempotent — no duplication');
  const stats = await veclib.getIndexStats(fx.root);
  assert.equal(stats.totalChunks, 3);

  const missing = await veclib.vectorizeFile(path.join(fx.root, 'nope.md'), fx.root);
  assert.deepEqual(missing, { file: '../nope.md', chunks: 0 }); // rel to .opencode dir
});

test('vectorizeCodeFile: indexes one code file into the code store', async () => {
  const fx = makeFixture();
  const auth = path.join(fx.root, 'src/auth.ts');
  const r = await veclib.vectorizeCodeFile(auth, fx.root);
  assert.equal(r.chunks, 2);
  const stats = await veclib.getCodeIndexStats(fx.root);
  assert.equal(stats.totalChunks, 2);
  assert.ok(stats.files.some((f) => f.file_path === 'src/auth.ts'));
});

// ─── 8. Queries ────────────────────────────────────────────────────────────

test('queryChunks: lazy-ensures, ranks target file first', async () => {
  const fx = makeFixture(); // NO explicit ensureIndexed — exercises lazy path
  const results = await veclib.queryChunks(fx.root, 'auth login token refresh', 3, { useReranker: false });
  assert.ok(results.length >= 1, 'expected results');
  assert.equal(results.length, 3, 'topK honored');
  assert.ok(results[0].source.endsWith('auth.md'), `top hit should be auth.md, got ${results[0].source}`);
  assert.ok(results[0].distance < 0.8, 'distance below context floor');
  // ranking is monotonic by distance
  for (let i = 1; i < results.length; i++) {
    assert.ok(results[i - 1].distance <= results[i].distance);
  }
});

test('queryChunks: topK=1 returns exactly one result', async () => {
  const fx = makeFixture();
  const results = await veclib.queryChunks(fx.root, 'auth login token refresh', 1, { useReranker: false });
  assert.equal(results.length, 1);
});

test('queryChunks: disjoint query → floor rejection → empty', async () => {
  const fx = makeFixture();
  await veclib.ensureIndexed(fx.root);
  const results = await veclib.queryChunks(fx.root, 'zzzzqqqq wwwwrrrr', 5, { useReranker: false });
  assert.deepEqual(results, []);
});

test('queryCodeChunks: ranks code file first', async () => {
  const fx = makeFixture();
  await veclib.ensureCodeIndexed(fx.root);
  const results = await veclib.queryCodeChunks(fx.root, 'auth login password', 3, { useReranker: false });
  assert.ok(results.length >= 1);
  assert.ok(results[0].file_path.endsWith('auth.ts'), `top hit should be auth.ts, got ${results[0].file_path}`);
  assert.ok(results[0].distance < 0.92, 'distance below code floor');
});

test('store separation: context query never returns code, code query never returns md', async () => {
  const fx = makeFixture();
  await veclib.ensureIndexed(fx.root);
  await veclib.ensureCodeIndexed(fx.root);

  const ctx = await veclib.queryChunks(fx.root, 'auth login token refresh', 5, { useReranker: false });
  for (const r of ctx) {
    assert.match(r.source, /\.md$/, `context store leaked code source: ${r.source}`);
    assert.ok(!r.source.includes('src/'));
  }

  const code = await veclib.queryCodeChunks(fx.root, 'auth login password', 5, { useReranker: false });
  for (const r of code) {
    assert.ok(!r.file_path.endsWith('.md'), `code store leaked md source: ${r.file_path}`);
    assert.match(r.file_path, /\.(ts|js|py)$/);
  }
});

test('queryChunks: missing store / corrupt DB degrade to [] (never throw)', async () => {
  // (a) project with no scoped files — no DB is ever created
  const empty = fs.mkdtempSync(path.join(os.tmpdir(), 'vec-empty3-'));
  try {
    const results = await veclib.queryChunks(empty, 'anything', 3, { useReranker: false });
    assert.deepEqual(results, []);
  } finally {
    fs.rmSync(empty, { recursive: true, force: true });
  }

  // (b) corrupt DB file — must return [], not throw
  const fx = makeFixture();
  fs.mkdirSync(path.join(fx.root, '.opencode/state/vector'), { recursive: true });
  fs.writeFileSync(path.join(fx.root, '.opencode/state/vector/context.db'), 'this is not a sqlite database at all');
  const results = await veclib.queryChunks(fx.root, 'auth login token refresh', 3, { useReranker: false });
  assert.deepEqual(results, []);
});

test('queryChunks: rerank failure degrades to distance ordering (child process)', async () => {
  // Rerank ENABLED with a bogus model → local-file guard throws → distance fallback.
  // Runs in an async child so the in-process mock embed server stays responsive.
  const fx = makeFixture();
  const script = `
    const veclib = await import('${SCRIPTS_DIR.replace(/\\/g, '/')}/veclib.mjs');
    const results = await veclib.queryChunks('${fx.root}', 'auth login token refresh', 3, { useReranker: true });
    console.log(JSON.stringify(results));
  `;
  const env = { ...process.env, OLLAMA_URL: server.url, EMBED_MODEL, RERANK_MODEL: 'Xenova/definitely-not-cached' };
  delete env.RERANK_DISABLED; // rerank must actually attempt to load
  delete env.OPCODE_DIR;      // inputDir passed explicitly in script
  const child = spawn(process.execPath, ['--input-type=module', '-e', script], { env });
  let stdout = '';
  let stderr = '';
  child.stdout.on('data', (d) => (stdout += d));
  child.stderr.on('data', (d) => (stderr += d));
  const [code] = await new Promise((resolve) => {
    child.on('close', (c) => resolve([c]));
  });
  assert.equal(code, 0, stderr);
  const results = JSON.parse(stdout);
  assert.ok(Array.isArray(results) && results.length >= 1, 'rerank failure must not kill the query');
  assert.ok(results[0].source.endsWith('auth.md'), 'distance ordering preserved after rerank failure');
});

// ─── 9. Stats ──────────────────────────────────────────────────────────────

test('getIndexStats: counts + embedding metadata', async () => {
  const fx = makeFixture();
  await veclib.ensureIndexed(fx.root);
  const stats = await veclib.getIndexStats(fx.root);
  assert.equal(stats.exists, true);
  assert.equal(stats.totalChunks, EXPECTED_CONTEXT_TOTAL);
  assert.equal(stats.totalFiles, 5);
  assert.deepEqual(stats.embedding, { model: EMBED_MODEL, dim: '1024' });
  const auth = stats.files.find((f) => f.file_path.endsWith('auth.md'));
  assert.equal(auth.chunk_count, 3);
});

test('getCodeIndexStats: counts + per-file chunks', async () => {
  const fx = makeFixture();
  await veclib.ensureCodeIndexed(fx.root);
  const stats = await veclib.getCodeIndexStats(fx.root);
  assert.equal(stats.exists, true);
  assert.equal(stats.totalChunks, EXPECTED_CODE_TOTAL);
  assert.equal(stats.totalFiles, 5);
  const helpers = stats.files.find((f) => f.file_path.endsWith('helpers.js'));
  assert.equal(helpers.chunk_count, 2);
});

test('stats: missing DB → exists:false', async () => {
  const fx = makeFixture();
  const ctx = await veclib.getIndexStats(fx.root);
  const code = await veclib.getCodeIndexStats(fx.root);
  assert.deepEqual(ctx, { exists: false, totalChunks: 0, totalFiles: 0, files: [], embedding: null });
  assert.deepEqual(code, { exists: false, totalChunks: 0, totalFiles: 0, files: [], embedding: null });
});

// ─── 10. Schema rebuild on embedder change ─────────────────────────────────

test('embedding model change triggers schema rebuild (no stale vectors)', async () => {
  const fx = makeFixture();
  await veclib.ensureIndexed(fx.root);

  // Simulate a model change: mutate the stored meta directly.
  const { default: Database } = await import('better-sqlite3');
  const dbPath = path.join(fx.root, '.opencode/state/vector/context.db');
  const db = new Database(dbPath);
  db.prepare('UPDATE meta SET value = ? WHERE key = ?').run('some-other-model', 'embedding_model');
  db.close();

  const r = await veclib.ensureIndexed(fx.root);
  assert.equal(r.filesIndexed, 5, 'model change must re-index everything');
  assert.equal(r.totalChunks, EXPECTED_CONTEXT_TOTAL);
  const stats = await veclib.getIndexStats(fx.root);
  assert.equal(stats.embedding.model, EMBED_MODEL, 'meta reflects the current model');
});
