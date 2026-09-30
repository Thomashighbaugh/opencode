/**
 * cli.test.ts — CLI + hook-script integration tests.
 *
 * Runs the actual scripts (vectorize.ts, query.ts, sync-hook.ts,
 * query-hook.ts) as child processes against a fixture, plus source-level
 * regression guards on the PLUGIN hooks (in-process veclib usage would
 * re-introduce the kernel-panic architecture).
 *
 * Run:  node --test tests/cli.test.ts
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import {
  startMockEmbedServer, setMockUrl, makeFixture, cleanupFixture,
  runScript, testEnv, SCRIPTS_DIR,
} from './helpers.ts';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PLUGIN_HOOKS_DIR = path.resolve(__dirname, '..', '..', '..', 'plugins', 'hooks');
// __dirname is skills/vectorize-context/tests, so skills/ is two levels up.
const GRAPH_SCRIPTS_DIR = path.resolve(__dirname, '..', '..', 'graph-context', 'scripts');

const server = await startMockEmbedServer();
setMockUrl(server.url);

test.after(() => cleanupFixture());
test.after(() => server.close());

// ─── vectorize.ts ─────────────────────────────────────────────────────────

test('vectorize.ts: default indexes BOTH stores, JSON on stdout', async () => {
  const fx = makeFixture();
  const res = await runScript('vectorize.ts', [], testEnv(fx.root));
  assert.equal(res.code, 0, res.stderr);
  const out = JSON.parse(res.stdout);
  assert.equal(out.context.filesIndexed, 5);
  assert.equal(out.code.filesIndexed, 5);
  assert.ok(res.stderr.includes('Project root'));
});

test('vectorize.ts: --code indexes only the code store', async () => {
  const fx = makeFixture();
  const res = await runScript('vectorize.ts', ['--code'], testEnv(fx.root));
  assert.equal(res.code, 0, res.stderr);
  const out = JSON.parse(res.stdout);
  assert.equal(out.code.filesIndexed, 5);
  assert.equal(out.context, undefined);
});

test('vectorize.ts: --context indexes only the context store', async () => {
  const fx = makeFixture();
  const res = await runScript('vectorize.ts', ['--context'], testEnv(fx.root));
  assert.equal(res.code, 0, res.stderr);
  const out = JSON.parse(res.stdout);
  assert.equal(out.context.filesIndexed, 5);
  assert.equal(out.code, undefined);
});

// ─── query.ts ─────────────────────────────────────────────────────────────

test('query.ts: missing query → usage error, exit 1', async () => {
  const fx = makeFixture();
  const res = await runScript('query.ts', [], testEnv(fx.root));
  assert.equal(res.code, 1);
  assert.ok(res.stderr.includes('Usage'));
});

test('query.ts: context search returns the matching file', async () => {
  const fx = makeFixture();
  const res = await runScript('query.ts', ['auth login token refresh'], testEnv(fx.root));
  assert.equal(res.code, 0, res.stderr);
  assert.ok(res.stdout.includes('context store'));
  assert.ok(res.stdout.includes('auth.md'), res.stdout);
});

test('query.ts: --code searches the code store', async () => {
  const fx = makeFixture();
  const res = await runScript('query.ts', ['--code', 'auth login password'], testEnv(fx.root));
  assert.equal(res.code, 0, res.stderr);
  assert.ok(res.stdout.includes('code store'));
  assert.ok(res.stdout.includes('auth.ts'), res.stdout);
});

// ─── sync-hook.ts (maintenance mode — the panic regression guard) ─────────

test('sync-hook.ts: missing stores → skipped, exit 0 (never an index storm)', async () => {
  const fx = makeFixture();
  const res = await runScript('sync-hook.ts', [], testEnv(fx.root));
  assert.equal(res.code, 0, res.stderr);
  const out = JSON.parse(res.stdout);
  assert.equal(out.context.skipped, true);
  assert.equal(out.code.skipped, true);
});

test('sync-hook.ts: existing stores → incremental sync, exit 0', async () => {
  const fx = makeFixture();
  await runScript('vectorize.ts', [], testEnv(fx.root)); // build both stores
  const res = await runScript('sync-hook.ts', [], testEnv(fx.root));
  assert.equal(res.code, 0, res.stderr);
  const out = JSON.parse(res.stdout);
  assert.equal(out.context.skipped, undefined);
  assert.equal(out.context.filesIndexed, 0); // nothing changed
  assert.equal(out.context.filesSkipped, 5);
  assert.equal(out.code.filesSkipped, 5);
});

// ─── query-hook.ts (plugin injection payload) ─────────────────────────────

test('query-hook.ts: empty query → empty payload, exit 0', async () => {
  const fx = makeFixture();
  const res = await runScript('query-hook.ts', [''], testEnv(fx.root));
  assert.equal(res.code, 0, res.stderr);
  // graph is part of the contract: structural recall runs alongside the two
  // vector stores so context gathering can see rules/skills, not just content.
  assert.deepEqual(JSON.parse(res.stdout), { context: [], code: [], graph: [] });
});

test('query-hook.ts: query → {context, code} payload with row shape, exit 0', async () => {
  const fx = makeFixture();
  await runScript('vectorize.ts', [], testEnv(fx.root));
  const res = await runScript('query-hook.ts', ['auth login token refresh'], testEnv(fx.root));
  assert.equal(res.code, 0, res.stderr);
  const out = JSON.parse(res.stdout);
  assert.ok(Array.isArray(out.context) && out.context.length <= 5);
  assert.ok(Array.isArray(out.code) && out.code.length <= 4);
  assert.ok(out.context.length >= 1, 'expected context hits');
  assert.ok(out.context.length >= 1 && out.context[0].file.endsWith('auth.md'), JSON.stringify(out.context[0]));
  // graph is always present (possibly empty when no graph.db exists) so the
  // hook's contract is stable regardless of which planes are built.
  assert.ok(Array.isArray(out.graph), 'graph must be an array');
  for (const row of out.graph) {
    assert.ok(typeof row.id === 'string' && typeof row.title === 'string');
    assert.ok(typeof row.score === 'number');
  }
  for (const row of out.context) {
    assert.ok(typeof row.file === 'string' && typeof row.heading === 'string' && typeof row.content === 'string');
    assert.ok('score' in row);
  }
});

test('query-hook.ts: missing stores → empty payload, exit 0 (never crashes the hook)', async () => {
  const empty = fs.mkdtempSync(path.join(process.env.TMPDIR || '/tmp', 'vec-hook-empty-'));
  try {
    const res = await runScript('query-hook.ts', ['anything at all'], testEnv(empty));
    assert.equal(res.code, 0, res.stderr);
    // No stores AND no graph must still be a clean empty payload, never a throw.
    assert.deepEqual(JSON.parse(res.stdout), { context: [], code: [], graph: [] });
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
  assert.ok(!src.includes('veclib.ts'), 'hook must not import veclib (native deps in plugin process)');
  assert.ok(src.includes('child_process') || src.includes('spawn'), 'hook must spawn children');
  assert.ok(src.includes('SIGKILL'), 'hook must SIGKILL runaway children');
  assert.ok(src.includes('childRunning'), 'hook must serialize children (no overlap)');
  assert.ok(src.includes('sync-hook.ts'), 'hook must spawn the maintenance sync script');
  // Event-driven, not polled. The old implementation spawned a sync child
  // every 10s forever — 6 children/minute of pure waste, and it competed for
  // CPU with the query child on the inference path. A bare setInterval here
  // would reintroduce exactly that.
  assert.ok(!/setInterval\s*\(/.test(src), 'hook must NOT poll on an interval (event-driven only)');
  assert.ok(src.includes('notifyFileChanged'), 'hook must expose a file-change entry point');
  assert.ok(src.includes('DEBOUNCE_MS'), 'hook must debounce edit bursts into one sync');
  assert.ok(src.includes('isIndexable'), 'hook must filter out non-indexed paths');
  // Children must be registered for GC, or a crash strands them on the machine.
  assert.ok(src.includes('registry.register') || src.includes('.register('), 'children must be registered for GC');
});

test('child-registry.ts: reaps exited and over-age children', async () => {
  const src = fs.readFileSync(path.join(PLUGIN_HOOKS_DIR, 'child-registry.ts'), 'utf-8');
  assert.ok(src.includes('SIGKILL'), 'reaper must escalate to SIGKILL');
  assert.ok(src.includes('maxAgeMs'), 'reaper must bound child lifetime');
  assert.ok(src.includes('reapAll'), 'reaper must support full shutdown');
});

test('runtime.ts: resolves a script-capable interpreter, not process.execPath', async () => {
  // OpenCode ships as a Bun-compiled binary that treats argv[1] as a directory
  // to chdir into, so `spawn(process.execPath, [script])` cannot run a script.
  // The hook must resolve bun/node from PATH instead.
  const src = fs.readFileSync(path.join(PLUGIN_HOOKS_DIR, 'runtime.ts'), 'utf-8');
  assert.ok(src.includes('resolveRuntime'), 'module must export resolveRuntime');
  const vecSrc = fs.readFileSync(path.join(PLUGIN_HOOKS_DIR, 'vectorize-hook.ts'), 'utf-8');
  assert.ok(vecSrc.includes('resolveRuntime'), 'vectorize hook must resolve its runtime');
  assert.ok(
    !/spawn\(\s*process\.execPath/.test(vecSrc),
    'vectorize hook must not spawn process.execPath (cannot run scripts)',
  );
  const hooksSrc = fs.readFileSync(path.join(PLUGIN_HOOKS_DIR, 'hooks.ts'), 'utf-8');
  assert.ok(
    !/spawn\(\s*process\.execPath/.test(hooksSrc),
    'hooks must not spawn process.execPath for the query child',
  );
  // Node must be preferred over Bun: Bun 1.3.14 hard-crashes with a NAPI FATAL
  // ERROR on require('better-sqlite3'), which every vector child loads. Under
  // Bun the child died at startup and queries silently returned nothing.
  const nodeFirst = src.indexOf('onPath("node")');
  const bunFirst = src.indexOf('onPath("bun")');
  assert.ok(nodeFirst > -1 && bunFirst > -1, 'both interpreters must be probed');
  assert.ok(nodeFirst < bunFirst, 'node must be preferred over bun (bun crashes on better-sqlite3)');
});

test('query-hook.ts: read-only query path (never takes a write lock)', async () => {
  // The maintenance-sync child is the sole writer. When the query child also ran
  // the lazy freshness check it would write to the same SQLite files, and the
  // two processes deadlocked on SQLITE_BUSY long enough to blow the query
  // timeout — the first query after startup returned empty, silently.
  const src = fs.readFileSync(path.join(SCRIPTS_DIR, 'query-hook.ts'), 'utf-8');
  assert.ok(
    /queryChunks\([\s\S]*?skipEnsureIndex:\s*true/.test(src),
    'context query must set skipEnsureIndex',
  );
  assert.ok(
    /queryCodeChunks\([\s\S]*?skipEnsureIndex:\s*true/.test(src),
    'code query must set skipEnsureIndex',
  );
});

test('query-hook.ts: structural (graph) recall is part of the payload', async () => {
  const src = fs.readFileSync(path.join(SCRIPTS_DIR, 'query-hook.ts'), 'utf-8');
  assert.ok(src.includes('graphRecall'), 'query hook must consult the knowledge graph');
  assert.ok(
    src.includes("graph-context/scripts/graphlib.ts"),
    'graph recall must come from graphlib, not a reimplementation',
  );
  // The graph child must not load a vector model: it is pure SQL and runs on
  // the inference path, so a model load there would be a per-turn cost.
  assert.ok(!/graphRecall[\s\S]{0,400}queryChunks/.test(src), 'graph recall must not trigger vector recall');
});

test('graphlib.ts: seeds are weighted by relevance, not result position', async () => {
  // The reranker's score used to be discarded in favour of 1/(n+1), which made
  // the cross-encoder's output nearly worthless: it decided which rows survived
  // and their order, but a marginal rank-8 hit seeded the BFS almost as strongly
  // as a strong rank-1 hit.
  const src = fs.readFileSync(
    path.join(GRAPH_SCRIPTS_DIR, 'graphlib.ts'), 'utf-8');
  assert.ok(src.includes('rerank_score'), 'graphlib must read the rerank score');
  assert.ok(src.includes('seedScoreFor'), 'seed weighting must go through seedScoreFor');
  assert.ok(
    !/sourceScore:\s*1\s*\/\s*\(seeds\.length/.test(src),
    'seed score must not be positional (1/(n+1))',
  );
  // The code store used to be invisible to graph search.
  assert.ok(src.includes('queryCodeChunks'), 'graph recall must include the code store');
  assert.ok(src.includes('graphRecall'), 'graphlib must export a graph-only recall for the hot path');
});

test('hooks.ts: guarded dynamic hook load + child-process query injection', async () => {
  const src = fs.readFileSync(path.join(PLUGIN_HOOKS_DIR, 'hooks.ts'), 'utf-8');
  assert.ok(!src.includes('veclib'), 'plugin must never import veclib');
  assert.ok(src.includes('query-hook.ts'), 'plugin must spawn query-hook.ts for injection');
  assert.ok(src.includes('await import'), 'hook load must be dynamic');
  assert.ok(src.includes('vectorize-hook'), 'hook must be loaded by name');
  // The query child must be bounded. This used to be a bare 25s SIGKILL on a
  // per-turn spawn; it is now a warm persistent child with named budgets
  // (4s steady-state, 12s for the first query which also loads the model).
  assert.ok(
    src.includes('VECTOR_QUERY_TIMEOUT_MS') && src.includes('VECTOR_FIRST_QUERY_TIMEOUT_MS'),
    'query child must have a bounded timeout budget',
  );
});

test('graphlib.ts: seeds are weighted by relevance, not result position', async () => {
  // The reranker's score used to be discarded in favour of 1/(n+1), which made
  // the cross-encoder's output nearly worthless: it decided which rows survived
  // and their order, but a marginal rank-8 hit seeded the BFS almost as strongly
  // as a strong rank-1 hit.
  const src = fs.readFileSync(path.join(GRAPH_SCRIPTS_DIR, 'graphlib.ts'), 'utf-8');
  assert.ok(src.includes('rerank_score'), 'graphlib must read the rerank score');
  assert.ok(src.includes('seedScoreFor'), 'seed weighting must go through seedScoreFor');
  assert.ok(
    !/sourceScore:\s*1\s*\/\s*\(seeds\.length/.test(src),
    'seed score must not be positional (1/(n+1))',
  );
  assert.ok(src.includes('queryCodeChunks'), 'graph recall must include the code store');
  assert.ok(src.includes('graphRecall'), 'graphlib must export a graph-only recall for the hot path');
});

test('graphlib.ts: leaf edges are structural invariants, not manual upkeep', async () => {
  // The graph once held 374 file nodes of which 373 were orphans, and only 2 of
  // 386 code files matched a node by path. Leaves had no edges because the code
  // layer had never been built. These guards pin the two invariants that make
  // edgeless leaves structurally impossible: every file is part_of a directory
  // module, and every declaration is defines-linked to its file.
  //
  // This used to assert the invariants by matching `insertEdge(...)` calls in
  // graphlib's SOURCE TEXT. That is a proxy, and a bad one: reformatting the
  // call — which is what fixing the root-file bug did — broke the assertion
  // while the invariant it claimed to protect was satisfied. Worse, a source
  // regex passes just as happily against code the backfill never runs. So the
  // invariants are now checked on a real database, built by the real backfill,
  // from a fixture that deliberately includes the shapes that used to escape:
  // a file with no declarations, and a file at the project root.
  const fx = makeFixture({
    // A declaration-free file: the JSON case that produced a part_of-less node.
    'data/config.json': JSON.stringify({ retries: 3 }, null, 2),
    // A class with a short name, whose method used to record parent=null.
    'src/Tiny.ts': 'export class T {\n  go(a: number): number {\n    return a;\n  }\n}\n',
  });

  const vec = await runScript('vectorize.ts', [], testEnv(fx.root));
  assert.equal(vec.code, 0, vec.stderr);

  const { backfillFromCode } = await import(
    path.join(GRAPH_SCRIPTS_DIR, 'graphlib.ts')
  );
  const result = backfillFromCode(fx.root);
  assert.equal(result.skipped, null, 'a cold fixture must not be skipped as unchanged');

  // Read the graph back with the same library the product uses.
  const Database = (await import('better-sqlite3')).default;
  const db = new Database(path.join(fx.opencodeDir, 'state', 'vector', 'graph.db'), { readonly: true });
  try {
    const withoutPartOf = db
      .prepare(
        `SELECT n.id FROM nodes n WHERE n.type = 'file'
         AND NOT EXISTS (SELECT 1 FROM edges e WHERE e.src_id = n.id AND e.type = 'part_of')`,
      )
      .all();
    assert.deepEqual(
      withoutPartOf.map((r) => r.id),
      [],
      'INVARIANT 1: every file must be part_of a directory module',
    );

    // INVARIANT 2, as a two-way reconciliation between the store and the graph.
    //
    // Deliberately NOT phrased as "for each store row, look up
    // file:<store path>". The graph normalises ids differently from the store —
    // a file at `.opencode/tools/my-tool.ts` is stored under that path but
    // graphed as `file:tools/my-tool.ts` — so an id-joining assertion silently
    // reports violations for files whose edges are all present and correct. That
    // is the same proxy-instead-of-behaviour trap as the source regex this test
    // replaced, one level up. Reconciling counts and checking for dangling edges
    // states the invariant without depending on the id convention.
    const code = new Database(path.join(fx.opencodeDir, 'state', 'vector', 'code.db'), { readonly: true });
    try {
      const declared = code.prepare('SELECT file_path, name FROM symbols').all().length;
      const defined = db
        .prepare("SELECT COUNT(*) AS c FROM edges WHERE type = 'defines'")
        .get().c;
      assert.equal(
        defined,
        declared,
        `INVARIANT 2: ${declared} declarations but ${defined} defines edges — the graph lost or invented a declaration`,
      );

      const dangling = db
        .prepare(
          `SELECT COUNT(*) AS c FROM edges e
           WHERE e.type = 'defines'
           AND (NOT EXISTS (SELECT 1 FROM nodes n WHERE n.id = e.src_id AND n.type = 'file')
             OR NOT EXISTS (SELECT 1 FROM nodes n WHERE n.id = e.dst_id AND n.type = 'symbol'))`,
        )
        .get().c;
      assert.equal(dangling, 0, `INVARIANT 2: ${dangling} defines edge(s) point at a node that does not exist`);
    } finally {
      code.close();
    }

    // The short-named-scope bug belongs to the extractor, so it is asserted
    // there rather than through a whole indexing pipeline whose file selection
    // this test does not control. `class K` was dropped before it could open a
    // scope, which left every method inside it with parent=null.
    const { extractSymbols } = await import(
      path.join(path.resolve(GRAPH_SCRIPTS_DIR, '..', '..', 'vectorize-context', 'scripts', 'veclib.ts'))
    );
    const tinySyms = extractSymbols('export class K {\n  doThing(a: number): number {\n    return a;\n  }\n}\n', 'x.ts');
    const method = tinySyms.find((sy) => sy.name === 'doThing');
    assert.ok(method, 'a class method must be captured');
    assert.equal(method.parent, 'K', 'a method must record its enclosing class even when the class name is 1 char');

    assert.ok(result.partOf > 0, 'partOf must be counted');
    assert.equal(typeof result.adopted, 'number', 'edgeless nodes must be adopted by provenance');
    assert.equal(typeof result.knowledgeOrphans, 'number', 'knowledge orphans must be counted, not deleted');
  } finally {
    db.close();
  }

  // Rebuilding a settled fixture must be free, and must not damage the graph.
  const before = result.files;
  const again = backfillFromCode(fx.root);
  assert.equal(again.skipped, 'structure unchanged', 'a settled rebuild must be skipped');
  assert.equal(again.changed, 0, 'a settled rebuild must not report work');
  assert.ok(before > 0);
});

test('graphlib.ts: declaration extraction and JSONC parsing', async () => {
  const g = await import(path.join(GRAPH_SCRIPTS_DIR, 'graphlib.ts'));
  // Declaration headings arrive as the source line that opened the chunk.
  const cases = [
    ['export function getProjectSlug(projectRoot: ', 'getProjectSlug'],
    ['export class CacheManager {', 'CacheManager'],
    ['export interface CacheEntry<T = string> {', 'CacheEntry'],
    ['const GENERIC_BASENAMES = new Set(["opencode"', 'GENERIC_BASENAMES'],
    ['export async function queryChunks(inputDir', 'queryChunks'],
    ['cache-utils.ts', null],   // non-declaration chunk
    ['import * as fs from "fs"', null],
    ['if (x) {', null],         // control flow
  ];
  for (const [heading, expected] of cases) {
    assert.equal(g.symbolNameFromHeading(heading), expected, `heading: ${heading}`);
  }

  // The stripper must not truncate URLs inside strings, and must handle the
  // trailing commas this config uses.
  const jsonc = '{\n // c\n "u": "https://opencode.ai/config.json", /* b */\n "a": [1,2,],\n}';
  const parsed = JSON.parse(g.stripJsonComments(jsonc));
  assert.equal(parsed.u, 'https://opencode.ai/config.json', 'URL in a string must survive');
  assert.deepEqual(parsed.a, [1, 2], 'trailing comma must be removed');
});

test('graphlib.ts: rules discovered from opencode.jsonc, not a hardcoded dir', async () => {
  // This project keeps its rules at <projectRoot>/rules while the graph
  // hardcoded <projectRoot>/.opencode/rules, so all 21 rules were absent from
  // the graph — including every rule governing how this config behaves.
  const src = fs.readFileSync(path.join(GRAPH_SCRIPTS_DIR, 'graphlib.ts'), 'utf-8');
  assert.ok(src.includes('instructionMarkdownFiles'), 'must read rules from config instructions');
  assert.ok(src.includes('isRule'), 'rules must be classified structurally, not only by frontmatter');
});

test('sync-hook.ts: rebuilds the graph when, and only when, the code store moved', async () => {
  // The code layer is derived from the code store. Without this the graph goes
  // stale and its leaf edges stop describing reality.
  const src = fs.readFileSync(path.join(SCRIPTS_DIR, 'sync-hook.ts'), 'utf-8');
  assert.ok(src.includes('backfillFromCode'), 'sync must maintain the graph code layer');
  assert.ok(/filesIndexed > 0/.test(src), 'graph rebuild must be gated on the code store changing');
  assert.ok(src.includes('SYNC_SKIP_GRAPH'), 'graph sync must be disableable');
  assert.ok(
    /graph backfill failed/.test(src),
    'graph failure must be swallowed, not propagated to the vector sync',
  );
});

test('graphlib.ts: derived edges are recomputed, never accumulated', async () => {
  // Two identical builds produced 2197 then 2301 related_to edges, and three
  // consecutive auto-syncs kept adding. Cause: derived edges were inserted but
  // never retired, and slug resolution was first-wins with no ORDER BY, so the
  // chosen node could change between runs. Since sync-hook now runs the graph
  // rebuild on every code change, non-idempotence means unbounded growth.
  const src = fs.readFileSync(path.join(GRAPH_SCRIPTS_DIR, 'graphlib.ts'), 'utf-8');
  // The code layer's delete is now SCOPED to the files whose fingerprints moved
  // — a blanket delete would put the cost straight back. The two global
  // consequences still have to be handled explicitly, because they are not
  // reachable from any single changed file.
  assert.ok(
    /DELETE FROM edges\s+WHERE src_id IN \(\$\{holes\}\)/.test(src),
    'code-layer derived edges must be deleted for the changed files, prepared and bound',
  );
  assert.ok(
    /type IN \('defines','uses','related_to','part_of'\)/.test(src),
    'all four derived edge types must be recomputed for a changed file',
  );
  assert.ok(
    /DELETE FROM edges WHERE type='uses' AND dst_id = \?/.test(src),
    "a symbol that disappears must lose its uses edges from files that never changed",
  );
  assert.ok(
    /type = 'related_to' AND src_id IN \(\s*SELECT id FROM nodes WHERE type IN \('rule','skill'/s.test(src),
    'knowledge cross-links must be deleted before recomputation',
  );
  // Deterministic first-wins slug resolution, or the target can change per run.
  assert.ok(
    /ORDER BY id/.test(src),
    'slug resolution must be deterministically ordered',
  );
  // Curated and registry-stable edges must survive the recompute.
  assert.ok(
    !/DELETE FROM edges[^;]*used_by/.test(src),
    'must not delete used_by (registry-derived, not recomputed here)',
  );
});

test('veclib.ts: extractSymbols captures declarations at every indentation', async () => {
  // chunkCode never starts a chunk on an indented line, so function-local consts
  // and class methods were invisible to the graph — cacheHitMap and reapAll were
  // both reported as NOT FOUND. The symbols sidecar exists precisely to cover
  // that gap, and it must not disturb chunking (that would re-embed the project).
  const v = await import(path.join(SCRIPTS_DIR, 'veclib.ts'));
  const src = [
    'export class Foo {',
    '  private cache = new Map();',
    '  get<T>(key: string): T | null {',
    '    const hit = this.cache.get(key);',
    '    return hit ?? null;',
    '  }',
    '  describe(): Array<{ a: string }> {',
    '    return [];',
    '  }',
    '}',
    'export function outer(): void {',
    '  const innerLocal = 1;',
    '  if (innerLocal) {',
    '    const deeper = 2;',
    '    void deeper;',
    '  }',
    '}',
    'const arrow = (x: number) => x + 1;',
  ].join('\n');
  const syms = v.extractSymbols(src, 'foo.ts');
  const by = (n) => syms.find((s) => s.name === n);
  assert.ok(by('Foo'), 'class');
  assert.ok(by('get'), 'generic method get<T>');
  assert.ok(by('describe'), 'method with a brace-bearing return type');
  assert.ok(by('outer'), 'top-level function');
  assert.ok(by('arrow'), 'arrow binding is a function');
  assert.equal(by('get').parent, 'Foo', 'method parents to its class');
  assert.equal(by('hit').parent, 'get', 'local parents to its enclosing method');
  assert.equal(by('innerLocal').parent, 'outer', 'local parents to its function');
  assert.equal(by('deeper').parent, 'outer', 'deeper block still parents to the function');
  // Control flow must never become a symbol.
  for (const kw of ['if', 'void', 'new']) {
    assert.ok(!by(kw), `${kw} must not be recorded as a symbol`);
  }
});

test('veclib.ts: symbols are a sidecar, and chunking is untouched', async () => {
  // The fix must be additive. Widening chunk boundaries would re-embed every
  // file, which is a large cost paid to solve a structural problem.
  const src = fs.readFileSync(path.join(SCRIPTS_DIR, 'veclib.ts'), 'utf-8');
  assert.ok(src.includes('CREATE TABLE IF NOT EXISTS symbols'), 'symbols table must exist');
  assert.ok(src.includes('CREATE INDEX IF NOT EXISTS idx_symbols_name'), 'symbols must be indexed by name');
  // chunkCode must still refuse indented boundaries, or the whole store re-embeds.
  assert.ok(
    /if \(line\[0\] === ' ' \|\| line\[0\] === '\\t'\) return false;/.test(src),
    'chunkCode must still treat indented lines as inside a block',
  );
  // The re-index path replaces chunks, and must not delete the symbols it just
  // wrote — that bug left the table permanently empty.
  assert.ok(
    /deleteFileChunks\(db, p\.rel, false\)/.test(src),
    're-index must not wipe the symbols written in the same pass',
  );
  assert.ok(/deleteFileChunks\(db, storedPath\)/.test(src), 'deleted files must still drop their symbols');
  // Self-heal is by COVERAGE, not emptiness: a non-empty table still leaves the
  // other indexed files unhealed.
  assert.ok(
    /needsHeal/.test(src) && /!haveSymbols\.has\(f\.rel\)/.test(src),
    'self-heal must target files with no symbol rows, not just an empty table',
  );
});

test('graphlib.ts: the code layer is derived from the symbols sidecar', async () => {
  const src = fs.readFileSync(path.join(GRAPH_SCRIPTS_DIR, 'graphlib.ts'), 'utf-8');
  assert.ok(
    /SELECT file_path, name, kind, parent FROM symbols/.test(src),
    'declarations must come from the symbols table, not chunk headings',
  );
  // Nested declarations hang off their enclosing scope, not just their file.
  assert.ok(src.includes('symbolParent'), 'parent links must be tracked');
  assert.ok(
    /insertEdge\(nodeId\('symbol', child\), nodeId\('symbol', parentName\), 'part_of'\)/.test(src),
    'a nested declaration must be part_of its enclosing scope',
  );
});

test('graphlib.ts: structure signature gates the rebuild (cache, not rework)', async () => {
  // A `touch` re-indexes chunks but leaves the declaration index identical, so
  // every derived edge would be recomputed to the same values. Measured before
  // the gate: ~1.9s of graph work producing zero new edges. After: 23-57ms.
  const src = fs.readFileSync(path.join(GRAPH_SCRIPTS_DIR, 'graphlib.ts'), 'utf-8');
  assert.ok(src.includes('structureSignature'), 'must expose a structure fingerprint');
  assert.ok(
    /stored === sig[\s\S]{0,120}'structure unchanged'/.test(src),
    'an unchanged structure must short-circuit the rebuild',
  );
  assert.ok(
    /writeGraphMeta\(inputDir, 'structure_signature', sig\)/.test(src),
    'a successful build must record what it describes',
  );
  // The gate must be conservative: no fingerprint available means no skip.
  const fn = src.slice(src.indexOf('export function structureSignature'));
  assert.ok(/if \(!fs\.existsSync\(paths\.codeDbPath\)\) return null;/.test(fn), 'no store means no signature');
  assert.ok(/if \(rows\.length === 0\) return null;/.test(fn), 'an empty symbol set must not produce a signature');
});

test('graphlib.ts: the structure gate ACTUALLY short-circuits (functional)', async () => {
  // A source-text assertion is not enough here. The gate once read like a
  // correct no-op: the reader opened graph.db read-only and then issued
  // CREATE TABLE IF NOT EXISTS, which throws, was swallowed, and returned null
  // on every call — so the gate never fired and every sync paid the full
  // rebuild. This exercises it end to end.
  const g = await import(path.join(GRAPH_SCRIPTS_DIR, 'graphlib.ts'));
  // The project root, not process.cwd() — the suite runs from
  // skills/vectorize-context/scripts, and resolvePaths treats its argument as
  // the project root.
  const root = path.resolve(__dirname, '..', '..', '..');
  const sig = g.structureSignature(root);
  assert.ok(sig, 'this project must have a declaration index to fingerprint');

  const first = g.backfillFromCode(root);
  // Either a real build, or already current — both are legitimate.
  assert.ok(first.skipped === 'structure unchanged' || first.files > 0, JSON.stringify(first));
  if (first.signature) assert.equal(first.signature, sig, 'a build must record the signature it derived from');

  const second = g.backfillFromCode(root);
  assert.equal(
    second.skipped,
    'structure unchanged',
    'a second call with no structural change must short-circuit',
  );
  assert.equal(second.files, 0, 'a short-circuited call must do no work');
  assert.equal(second.defines, 0, 'a short-circuited call must not recompute edges');
  assert.equal(second.knowledgeOrphans, 0, 'and must not report orphans it never looked for');
});

test('graphlib.ts: graph_meta is created with the schema, not lazily on a readonly db', async () => {
  // Regression guard for the inert-gate bug above.
  const src = fs.readFileSync(path.join(GRAPH_SCRIPTS_DIR, 'graphlib.ts'), 'utf-8');
  const reader = src.slice(src.indexOf('function readGraphMeta'), src.indexOf('function writeGraphMeta'));
  assert.ok(
    !/ensureMetaTable|CREATE TABLE/i.test(reader),
    'the readonly meta reader must not attempt any CREATE (it throws and was being swallowed)',
  );
  assert.ok(
    /CREATE TABLE IF NOT EXISTS graph_meta/.test(src),
    'graph_meta must be created by the schema',
  );
  assert.ok(
    /db = ensureGraphReady\(inputDir\)/.test(src.slice(src.indexOf('function writeGraphMeta'))),
    'the meta writer must use the writable graph handle',
  );
});

test('graphlib.ts: a partial rebuild preserves the graph exactly (functional)', async () => {
  // Establishes a canonical graph, then requires a partial rebuild to leave it
  // byte-identical. Deliberately self-contained: an earlier version of this test
  // ran the partial first and compared against whatever the preceding test left
  // in the database, so it depended on test order and flaked.
  //
  // The stronger property — that a partial rebuild after a real edit produces
  // the same edges as a from-scratch rebuild — cannot be checked in-process
  // without mutating the project, so it is covered by the guard assertions below
  // plus the four-case harness used during development (add, rename, delete,
  // new rule), each of which compared a partial against a forced full.
  const g = await import(path.join(GRAPH_SCRIPTS_DIR, 'graphlib.ts'));
  const { createRequire } = await import('node:module');
  const req = createRequire(process.cwd() + '/x.js');
  const root = path.resolve(__dirname, '..', '..', '..');
  const graphPath = path.join(root, '.opencode', 'state', 'vector', 'graph.db');
  if (!fs.existsSync(graphPath)) return;
  const open = (ro) => new (req('better-sqlite3'))(graphPath, ro ? { readonly: true } : {});
  const snap = () => {
    const d = open(true);
    const e = d.prepare('SELECT src_id, dst_id, type FROM edges').all();
    const n = d.prepare('SELECT id, type FROM nodes').all();
    d.close();
    return {
      e: new Set(e.map((r) => `${r.type}|${r.src_id}|${r.dst_id}`)),
      n: new Set(n.map((r) => `${r.type}|${r.id}`)),
    };
  };

  // Canonical baseline: force a full recompute.
  const d0 = open(false);
  d0.exec('DELETE FROM derived_file');
  d0.prepare("DELETE FROM graph_meta WHERE key = 'structure_signature'").run();
  d0.close();
  g.backfillFromCode(root);
  const a = snap();

  // Now a partial rebuild from that settled state.
  const inc = g.backfillFromCode(root);
  const b = snap();

  assert.equal(a.e.size, b.e.size, 'a partial rebuild must not change the edge count');
  assert.equal(a.n.size, b.n.size, 'a partial rebuild must not change the node count');
  assert.deepEqual([...a.e].filter((x) => !b.e.has(x)).slice(0, 3), [], 'no edge may be lost by a partial rebuild');
  assert.deepEqual([...b.e].filter((x) => !a.e.has(x)).slice(0, 3), [], 'no edge may be gained spuriously');
  assert.deepEqual([...a.n].filter((x) => !b.n.has(x)).slice(0, 3), [], 'no node may be lost');
  assert.deepEqual([...b.n].filter((x) => !a.n.has(x)).slice(0, 3), [], 'no node may be gained spuriously');
  assert.ok(inc.changed >= 0 && typeof inc.full === 'boolean', 'a rebuild must report its scope');
});

test('graphlib.ts: cross-file invalidation is handled explicitly, not by rescanning', async () => {
  // A `uses` edge is cross-file: adding a symbol in one file changes the correct
  // output for every file that references it, none of which were touched. A
  // partial rebuild must therefore consult the reverse index for new symbols and
  // clear the edges of vanished ones, rather than relying on the changed files.
  const src = fs.readFileSync(path.join(GRAPH_SCRIPTS_DIR, 'graphlib.ts'), 'utf-8');
  assert.ok(src.includes('readIdentsMatching'), 'new symbols must be resolved through the reverse index');
  assert.ok(
    /SELECT DISTINCT file_path FROM code_identifiers WHERE identifier = \?/.test(src),
    'the reverse lookup must be an indexed query on code_identifiers, not a project scan',
  );
  assert.ok(
    /for \(const name of goneSymbols\)/.test(src),
    'vanished symbols must be handled explicitly',
  );
  assert.ok(
    /readSymbolsFor\(inputDir, changedFiles\)/.test(src) && /readIdentsFor\(inputDir, changedFiles\)/.test(src),
    'facts must be fetched only for changed files',
  );
  assert.ok(
    !/SELECT file_path, identifier FROM code_identifiers`\s*\.all\(\)/.test(src),
    'the whole identifier table must never be read in one go again',
  );
});

test('graphlib.ts: fan-out caps must not bind (guards, not selections)', async () => {
  // A BINDING cap makes the derivation history-dependent: a full rebuild deletes
  // and re-adds a file's edges so it ends up with exactly the cap, while a
  // partial rebuild leaves an unchanged file's edges alone so it keeps whatever
  // it had accumulated. 69 sources exceeded the original cap of 6, which is
  // exactly how partial and from-scratch builds disagreed while each looked
  // internally consistent. A cap that starts binding must fail here.
  const { createRequire } = await import('node:module');
  const req = createRequire(process.cwd() + '/x.js');
  const graphPath = path.resolve(__dirname, '..', '..', '..', '.opencode', 'state', 'vector', 'graph.db');
  if (!fs.existsSync(graphPath)) return;
  const src = fs.readFileSync(path.join(GRAPH_SCRIPTS_DIR, 'graphlib.ts'), 'utf-8');
  const caps = [
    ['related_to', 'MAX_BRIDGES_PER_NODE'],
    ['uses', 'MAX_USES_PER_FILE'],
  ];
  const d = new (req('better-sqlite3'))(graphPath, { readonly: true });
  for (const [type, name] of caps) {
    const m = src.match(new RegExp('const ' + name + ' = (\\d+);'));
    assert.ok(m, name + ' must be a named constant so this guard can read it');
    const cap = parseInt(m[1], 10);
    const over = d
      .prepare('SELECT COUNT(*) AS c FROM (SELECT src_id FROM edges WHERE type = ? GROUP BY src_id HAVING COUNT(*) > ?)')
      .get(type, cap).c;
    assert.equal(over, 0, type + ': ' + over + ' source(s) exceed ' + name + '=' + cap + ' — the cap binds and rebuilds stop being reproducible');
  }
  d.close();
});

test('veclib.ts: per-file fingerprints drive partial rebuilds', async () => {
  // Change detection reads code_files (one row per file) instead of re-hashing
  // 64,000 identifier rows in JavaScript, which cost ~220ms on every rebuild
  // even when nothing had changed.
  const src = fs.readFileSync(path.join(SCRIPTS_DIR, 'veclib.ts'), 'utf-8');
  assert.ok(src.includes('CREATE TABLE IF NOT EXISTS code_files'), 'code_files must exist');
  assert.ok(src.includes('recordFileFacts'), 'fingerprints must be written at index time');
  assert.ok(src.includes('CREATE TABLE IF NOT EXISTS code_identifiers'), 'the reverse index must exist');
  assert.ok(
    src.includes('CREATE INDEX IF NOT EXISTS idx_ident_name'),
    'the reverse index must be indexed by identifier — that is what makes "which files mention S" one lookup',
  );
  // A hash is only a change signal if it is a pure function of the file.
  const v = await import(path.join(SCRIPTS_DIR, 'veclib.ts'));
  const sample = 'export class A {\n  m(x: number): number {\n    const y = x + 1;\n    return y;\n  }\n}\n';
  const fp = () =>
    [...v.identifiersOf(sample)].sort().join(' ') + '|' +
    v.extractSymbols(sample, 'a.ts').map((s) => `${s.name}:${s.kind}`).sort().join(' ');
  assert.equal(fp(), fp(), 'fingerprints must be deterministic');
  assert.deepEqual([...v.identifiersOf(sample)], [...v.identifiersOf(sample)], 'identifiersOf must be deterministic');
  // A comment adds identifiers but no declarations; a method adds both. The
  // fingerprint must distinguish them, or a comment-only edit looks structural.
  const withComment = sample + '\n// a trailing comment with some words\n';
  assert.notEqual(
    [...v.identifiersOf(sample)].length, [...v.identifiersOf(withComment)].length,
    'a comment changes the identifier set',
  );
  assert.equal(
    v.extractSymbols(sample, 'a.ts').length, v.extractSymbols(withComment, 'a.ts').length,
    'a comment adds no declarations',
  );
});
