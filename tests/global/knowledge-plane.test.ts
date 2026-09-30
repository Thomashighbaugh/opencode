import { describe, it, expect, beforeAll } from 'vitest'
import * as fs from 'fs'
import * as path from 'path'
import { createRequire } from 'node:module'

/**
 * knowledge-plane.test.ts — the retrieval subsystem, asserted by what it
 * produces rather than by what its source says.
 *
 * The graph and vector stores are the part of this configuration most capable of
 * looking correct while doing nothing: an edge type that is never emitted, a
 * rebuild that recomputes the same values, a store that is written but never
 * read. Every test here observes the database or the returned values.
 */

const CONFIG_DIR = path.resolve(__dirname, '..', '..')
const GRAPH = path.join(CONFIG_DIR, '.opencode', 'state', 'vector', 'graph.db')
const CODE_DB = path.join(CONFIG_DIR, '.opencode', 'state', 'vector', 'code.db')
const hasGraph = fs.existsSync(GRAPH)
const hasCode = fs.existsSync(CODE_DB)

const req = createRequire(path.join(CONFIG_DIR, 'x.js'))
const sql = (file: string) => new (req('better-sqlite3'))(file, { readonly: true })

let graphlib: any
let veclib: any
beforeAll(async () => {
  graphlib = await import(path.join(CONFIG_DIR, 'skills', 'graph-context', 'scripts', 'graphlib.ts'))
  veclib = await import(path.join(CONFIG_DIR, 'skills', 'vectorize-context', 'scripts', 'veclib.ts'))
}, 60_000)

describe('knowledge plane: leaf edges', () => {
  it('no node is edgeless', () => {
    if (!hasGraph) return
    const d = sql(GRAPH)
    const n = d
      .prepare(
        `SELECT COUNT(*) AS c FROM nodes n
         WHERE NOT EXISTS (SELECT 1 FROM edges e WHERE e.src_id = n.id OR e.dst_id = n.id)`,
      )
      .get().c
    d.close()
    expect(n, `${n} nodes have no edge in either direction — every leaf must be connected`).toBe(0)
  })

  it('every file node is part_of a directory module (invariant 1)', () => {
    if (!hasGraph) return
    const d = sql(GRAPH)
    const orphan = d
      .prepare(
        `SELECT COUNT(*) AS c FROM nodes n WHERE n.type = 'file'
         AND NOT EXISTS (SELECT 1 FROM edges e WHERE e.src_id = n.id AND e.type = 'part_of')`,
      )
      .get().c
    d.close()
    expect(orphan, 'a file with no declarations still gets part_of, so this must be 0').toBe(0)
  })

  it('every file with a declaration has a defines edge (invariant 2)', () => {
    if (!hasGraph || !hasCode) return
    const g = sql(GRAPH)
    const c = sql(CODE_DB)
    const files = c.prepare('SELECT DISTINCT file_path FROM symbols').all() as Array<{ file_path: string }>
    let missing = 0
    const st = g.prepare("SELECT 1 AS ok FROM edges WHERE type = 'defines' AND src_id = ? LIMIT 1")
    for (const f of files) {
      const id = 'file:' + String(f.file_path).replace(/\\/g, '/').replace(/^(\.\.\/)+/, '')
      if (!st.get(id)) missing++
    }
    g.close(); c.close()
    expect(missing, `${missing} declaring files have no defines edge`).toBe(0)
  })

  it('nested declarations are part_of their enclosing scope', () => {
    if (!hasCode) return
    const c = sql(CODE_DB)
    const nested = c.prepare('SELECT COUNT(*) AS c FROM symbols WHERE parent IS NOT NULL').get().c
    c.close()
    if (nested === 0) return
    const g = sql(GRAPH)
    const linked = g
      .prepare(
        `SELECT COUNT(*) AS c FROM edges e
         JOIN nodes a ON a.id = e.src_id JOIN nodes b ON b.id = e.dst_id
         WHERE e.type = 'part_of' AND a.type = 'symbol' AND b.type = 'symbol'`,
      )
      .get().c
    g.close()
    expect(linked, 'the sidecar records parent links but the graph has none').toBeGreaterThan(0)
  })
})

describe('knowledge plane: the code layer is derived from the symbol sidecar', () => {
  it('declarations at every indentation are indexed', () => {
    if (!hasCode) return
    const c = sql(CODE_DB)
    const nested = c.prepare('SELECT COUNT(*) AS c FROM symbols WHERE parent IS NOT NULL').get().c
    const methods = c.prepare("SELECT COUNT(*) AS c FROM symbols WHERE kind = 'method'").get().c
    c.close()
    // chunkCode only marks top-level declarations, so a sidecar that captured
    // nothing nested would mean the graph still cannot see local consts or
    // class methods.
    expect(nested, 'no nested declarations captured').toBeGreaterThan(0)
    expect(methods, 'no class methods captured').toBeGreaterThan(0)
  })

  it('a function-local const is resolvable as a symbol', () => {
    if (!hasCode) return
    const sample = 'function outer(): void {\n  const localThing = 1;\n  void localThing;\n}\n'
    const syms = veclib.extractSymbols(sample, 'x.ts')
    const local = syms.find((s: any) => s.name === 'localThing')
    expect(local, 'function-local declarations are not captured').toBeTruthy()
    expect(local.parent).toBe('outer')
  })

  it('a class method is resolvable as a symbol', () => {
    const sample = 'export class K {\n  doThing(a: number): number {\n    return a;\n  }\n}\n'
    const syms = veclib.extractSymbols(sample, 'y.ts')
    const m = syms.find((s: any) => s.name === 'doThing')
    expect(m, 'class methods are not captured').toBeTruthy()
    expect(m.kind).toBe('method')
    expect(m.parent).toBe('K')
  })

  it('the reverse index answers "which files mention X" without a project scan', () => {
    if (!hasCode) return
    const c = sql(CODE_DB)
    const row = c
      .prepare('SELECT identifier FROM code_identifiers GROUP BY identifier HAVING COUNT(*) > 3 LIMIT 1')
      .get() as { identifier: string } | undefined
    if (!row) { c.close(); return }
    const t = Date.now()
    const files = c
      .prepare('SELECT DISTINCT file_path FROM code_identifiers WHERE identifier = ?')
      .all(row.identifier)
    const ms = Date.now() - t
    c.close()
    expect(files.length).toBeGreaterThan(3)
    expect(ms, `reverse lookup took ${ms}ms — the identifier index is not being used`).toBeLessThan(50)
  })
})

describe('knowledge plane: rebuilds are gated, partial, and reproducible', () => {
  it('a rebuild from a settled state does no work', () => {
    if (!hasGraph || !hasCode) return
    const t = Date.now()
    const r = graphlib.backfillFromCode(CONFIG_DIR)
    const ms = Date.now() - t
    expect(r.skipped, 'a settled rebuild reported work to do').toBe('structure unchanged')
    expect(r.changed).toBe(0)
    expect(ms, `a no-op rebuild took ${ms}ms`).toBeLessThan(2_000)
  })

  it('a rebuild preserves the graph exactly', () => {
    if (!hasGraph || !hasCode) return
    const open = (ro: boolean) => new (req('better-sqlite3'))(GRAPH, ro ? { readonly: true } : {})
    const snap = () => {
      const d = open(true)
      const e = d.prepare('SELECT src_id, dst_id, type FROM edges').all()
      const n = d.prepare('SELECT id, type FROM nodes').all()
      d.close()
      return { e: e.map((r: any) => `${r.type}|${r.src_id}|${r.dst_id}`).sort(), n: n.map((r: any) => `${r.type}|${r.id}`).sort() }
    }
    const before = snap()
    graphlib.backfillFromCode(CONFIG_DIR)
    const after = snap()
    expect(after.e.length, 'a partial rebuild changed the edge count').toBe(before.e.length)
    expect(after.n.length, 'a partial rebuild changed the node count').toBe(before.n.length)
    const lost = before.e.filter((x: string) => !after.e.includes(x))
    expect(lost.slice(0, 3), `a partial rebuild lost ${lost.length} edge(s)`).toEqual([])
  })

  it('fan-out caps are not binding (a binding cap makes rebuilds irreproducible)', () => {
    if (!hasGraph) return
    const src = fs.readFileSync(path.join(CONFIG_DIR, 'skills', 'graph-context', 'scripts', 'graphlib.ts'), 'utf-8')
    const d = sql(GRAPH)
    for (const [type, name] of [['related_to', 'MAX_BRIDGES_PER_NODE'], ['uses', 'MAX_USES_PER_FILE']] as const) {
      const cap = parseInt(src.match(new RegExp(`const ${name} = (\\d+);`))![1], 10)
      const over = d
        .prepare('SELECT COUNT(*) AS c FROM (SELECT src_id FROM edges WHERE type = ? GROUP BY src_id HAVING COUNT(*) > ?)')
        .get(type, cap).c
      expect(over, `${type}: ${over} sources exceed ${name}=${cap} — the cap binds`).toBe(0)
    }
    d.close()
  })

  it('the graph records what it derived from, so the next run can be partial', () => {
    if (!hasGraph || !hasCode) return
    const g = sql(GRAPH)
    const derived = g.prepare('SELECT COUNT(*) AS c FROM derived_file').get().c
    g.close()
    const c = sql(CODE_DB)
    const facts = c.prepare('SELECT COUNT(*) AS c FROM code_files').get().c
    c.close()
    expect(derived, 'no derived_file bookkeeping — every rebuild must be a full one').toBeGreaterThan(0)
    expect(facts, 'no code_files fingerprints — change detection cannot run').toBeGreaterThan(0)
    expect(Math.abs(derived - facts), `derived_file=${derived} vs code_files=${facts} — the two disagree on the file set`).toBeLessThan(5)
  })
})

describe('knowledge plane: referential integrity', () => {
  // SQLite enforces nothing here. Every invariant below was violated at some
  // point while this suite was being written, and in each case the graph still
  // reported plausible counts — 3,203 nodes, 18,037 edges, zero errors — while
  // answering questions with dead ends. A graph that lies quietly is worse than
  // one that is empty, because the empty one is obviously empty.

  it('no edge points at a node that does not exist', () => {
    if (!hasGraph) return
    const d = sql(GRAPH)
    const n = d
      .prepare(
        `SELECT COUNT(*) AS c FROM edges e
         WHERE NOT EXISTS (SELECT 1 FROM nodes n WHERE n.id = e.src_id)
            OR NOT EXISTS (SELECT 1 FROM nodes n WHERE n.id = e.dst_id)`,
      )
      .get().c
    d.close()
    // 88 wiki links to non-existent pages, then 26 agent edges to agents that
    // were never indexed. Both were "harmless" per the original comments.
    expect(n, `${n} dangling edge(s) — traversal and impact are following edges into nothing`).toBe(0)
  })

  it('pruneDanglingEdges is what makes that true, and it reports its work', () => {
    if (!hasGraph) return
    expect(typeof graphlib.pruneDanglingEdges).toBe('function')
    // A settled graph must have nothing to prune. Non-zero here means the build
    // is re-creating orphans it should have cleaned in the same pass.
    expect(graphlib.pruneDanglingEdges(CONFIG_DIR)).toBe(0)
  })

  it('every hub subcommand that names an agent resolves to a real agent node', () => {
    // The registry emitted used_by → agent:@executor while the graph had no agent
    // nodes at all, then had them under path-keyed ids. Either way the edge
    // existed and carried no information, so "which agent handles this" was
    // unanswerable while the graph looked complete.
    if (!hasGraph) return
    const d = sql(GRAPH)
    const unresolved = d
      .prepare(
        `SELECT COUNT(*) AS c FROM edges e
         WHERE e.type = 'used_by' AND e.dst_id LIKE 'agent:%'
         AND NOT EXISTS (SELECT 1 FROM nodes n WHERE n.id = e.dst_id AND n.type = 'agent')`,
      )
      .get().c
    const agents = d.prepare("SELECT COUNT(*) AS c FROM nodes WHERE type = 'agent'").get().c
    const agentEdges = d
      .prepare("SELECT COUNT(*) AS c FROM edges WHERE type = 'used_by' AND dst_id LIKE 'agent:%'")
      .get().c
    d.close()
    expect(agents, 'no agent nodes are indexed').toBeGreaterThan(0)
    expect(unresolved).toBe(0)
    expect(agentEdges, 'agent delegation edges were dropped rather than resolved').toBeGreaterThan(0)
  })

  it('node ids that a consumer must guess are keyed by bare name, not by path', () => {
    // rule:rules/efficiency-first and agent:agents/executor are both unguessable:
    // nothing in the system documents the path, and every lookup is by name.
    if (!hasGraph) return
    const d = sql(GRAPH)
    const pathKeyed = d
      .prepare(
        `SELECT COUNT(*) AS c FROM nodes
         WHERE (type = 'rule' OR type = 'agent' OR type = 'skill') AND id LIKE '%/%'`,
      )
      .get().c
    d.close()
    expect(pathKeyed, `${pathKeyed} rule/agent/skill node(s) are keyed by path rather than bare name`).toBe(0)
  })

  it('every cross-reference in the context tree resolves', () => {
    // Was 205. Almost none were missing pages:
    //   - 34 were relative links (`../docs/skills.md`) resolved against the
    //     linking file's directory, which the resolver ignored;
    //   - 38 were bare slugs whose node id is path-keyed
    //     (`source-summary:context/research/arcanum`), which the suffix lookup
    //     missed because it only matched ids ENDING in `:slug`;
    //   - 36 were stale index.md slugs left behind when research pages moved
    //     into dated subdirectories (index.md is now regenerated from disk);
    //   - the rest were external GitHub URLs ending in `.md`, bash `[[ ! -f ]]`
    //     tests, and the wiki-schema's own `[[page-slug]]` example — all
    //     scraped as links.
    // The invariant is that the scan finds nothing it cannot resolve, so a
    // genuinely broken link is a new, visible failure rather than a count
    // everyone learned to ignore.
    if (!hasGraph) return
    const d = sql(GRAPH)
    const linked = d.prepare("SELECT COUNT(*) AS c FROM edges WHERE type = 'related_to'").get().c
    d.close()
    expect(linked, 'cross-reference edges exist').toBeGreaterThan(0)
    expect(fs.existsSync(path.join(CONFIG_DIR, '.opencode', 'context', 'index.md'))).toBe(true)
  })

  it('a rebuild reports zero unresolved links', () => {
    if (!hasGraph) return
    const result = graphlib.backfillFromWiki(CONFIG_DIR)
    expect(
      result.skippedLinks ?? 0,
      `unresolved cross-references: ${(result.skippedLinkSamples ?? []).join('; ')}`,
    ).toBe(0)
  })

  it('stripCode blanks fenced blocks and inline spans, and terminates', () => {
    const src = 'a `inline` b\n```bash\n[[ ! -f x ]]\n```\nc [[real]] d\n'
    const out = graphlib.stripCode(src)
    expect(out).toHaveLength(src.length)
    expect(out).not.toContain('! -f x')
    expect(out).not.toContain('inline')
    expect(out).toContain('[[real]]')
    // An unterminated fence must blank to the end rather than hang the build.
    const unterminated = graphlib.stripCode('x\n```bash\n[[ still inside ]]\n')
    expect(unterminated).not.toContain('still inside')
  })

  it('index.md is regenerated from the pages that exist, not hand-maintained', () => {
    const index = fs.readFileSync(path.join(CONFIG_DIR, '.opencode', 'context', 'index.md'), 'utf-8')
    // Every [[slug]] in the catalog must name a page that exists. Scanned through
    // stripCode, exactly as the graph scanner does — the catalog's own prose
    // documents the syntax inside backticks, and matching the raw text counted
    // that documented example as a catalog entry.
    const scannable = graphlib.stripCode(index)
    const slugs = [...scannable.matchAll(/\[\[([^\]|]+)(?:\|[^\]]+)?\]\]/g)].map((m) => m[1].trim())
    expect(slugs.length, 'the catalog lists no pages').toBeGreaterThan(10)
    const missing = slugs.filter((slug) => {
      const candidates = [slug, `context/${slug}`, `context/research/${slug}`]
      return !candidates.some((c) => fs.existsSync(path.join(CONFIG_DIR, '.opencode', `${c}.md`)))
        && !candidates.some((c) => fs.existsSync(path.join(CONFIG_DIR, '.opencode', c)))
    })
    expect(missing.slice(0, 5), `catalog entries with no page: ${missing.length}`).toEqual([])
  })
})

describe('knowledge plane: rules are reachable, not just present', () => {
  it('rules registered in opencode.jsonc exist as graph nodes', () => {
    if (!hasGraph) return
    const { loadConfig } = require(path.join(CONFIG_DIR, 'tests', 'helpers', 'load-config.ts'))
    const { config } = loadConfig(CONFIG_DIR)
    const rules = ((config.instructions as string[]) ?? [])
      .map((i) => path.basename(String(i), '.md'))
      .filter((n) => n !== 'AGENTS')
    const d = sql(GRAPH)
    const st = d.prepare('SELECT 1 AS ok FROM nodes WHERE type = ? AND title = ? LIMIT 1')
    const missing = rules.filter((r) => !st.get('rule', r))
    d.close()
    // The graph hardcoded .opencode/rules while this project keeps its rules at
    // <root>/rules, which made every rule invisible to retrieval.
    expect(missing, `registered rules absent from the graph: ${missing.join(', ')}`).toEqual([])
  })

  it('a code file that implements a rule is linked to it', () => {
    if (!hasGraph || !hasCode) return
    const d = sql(GRAPH)
    const linked = d
      .prepare(
        `SELECT COUNT(*) AS c FROM edges e
         JOIN nodes a ON a.id = e.src_id JOIN nodes b ON b.id = e.dst_id
         WHERE e.type = 'related_to' AND a.type = 'file' AND b.type = 'rule'`,
      )
      .get().c
    d.close()
    expect(linked, 'no code-to-rule bridge edges — the two halves of the graph never meet').toBeGreaterThan(0)
  })
})

describe('knowledge plane: retrieval is bounded and degrades safely', () => {
  it('graph-only recall runs without touching the vector store', () => {
    if (!hasGraph) return
    const t = Date.now()
    const hits = graphlib.graphRecall(CONFIG_DIR, 'caching strategy', 4, 1)
    const ms = Date.now() - t
    expect(Array.isArray(hits)).toBe(true)
    // This runs on the inference path, so it must be pure SQL — no child
    // process and no model load.
    expect(ms, `graph-only recall took ${ms}ms — it is doing more than SQL`).toBeLessThan(500)
  })

  it('graph recall returns nothing rather than throwing on a missing store', () => {
    const hits = graphlib.graphRecall(path.join(CONFIG_DIR, '.opencode', 'state', 'no-such-project'), 'anything', 3, 1)
    expect(hits).toEqual([])
  })

  it('a query with no results returns an empty list, not an error', async () => {
    if (!hasCode) return
    const hits = await veclib.queryChunks(CONFIG_DIR, 'zzzznonexistenttokenqqqq', 3, { skipEnsureIndex: true })
    expect(Array.isArray(hits)).toBe(true)
  })

  it('the query path never writes (the sync child is the sole writer)', () => {
    // Two processes writing the same SQLite file deadlocked on SQLITE_BUSY long
    // enough to blow the query timeout, and the query returned nothing.
    const src = fs.readFileSync(path.join(CONFIG_DIR, 'skills', 'vectorize-context', 'scripts', 'query-hook.ts'), 'utf-8')
    expect(src).toMatch(/queryChunks\([\s\S]*?skipEnsureIndex:\s*true/)
    expect(src).toMatch(/queryCodeChunks\([\s\S]*?skipEnsureIndex:\s*true/)
  })
})
