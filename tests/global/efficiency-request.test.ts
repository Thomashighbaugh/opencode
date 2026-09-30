import { describe, it, expect, beforeAll } from 'vitest'
import * as fs from 'fs'
import * as path from 'path'

/**
 * efficiency-request.test.ts — REQUEST efficiency, behaviourally.
 *
 * Every real defect this configuration has had in the "efficiency" area was a
 * no-op, not a crash: a cache probe that read a value and discarded it, an
 * invalidation keyed on a hash that could never match, a gate whose
 * short-circuit was never taken, a child spawned per call instead of reused.
 * Text assertions cannot catch any of those — they all look correct.
 *
 * So these tests DRIVE the plugin hooks and assert observable effects: what the
 * model would actually see, what would actually be spawned, what would actually
 * be re-read.
 */

const CONFIG_DIR = path.resolve(__dirname, '..', '..')
const GRAPH = path.join(CONFIG_DIR, '.opencode', 'state', 'vector', 'graph.db')
const CODE_DB = path.join(CONFIG_DIR, '.opencode', 'state', 'vector', 'code.db')

type Hooks = Record<string, any>
let plugin: any
let hooks: Hooks
let diagnostics: () => any
/** Hit/miss counters per cache namespace, as reported by the plugin. */
const cacheStats = (): Record<string, { hits: number; misses: number }> => diagnostics().cache ?? {}

beforeAll(async () => {
  plugin = await import(path.join(CONFIG_DIR, 'plugins', 'hooks', 'hooks.ts'))
  const init = plugin.JocPlugin || plugin.default
  hooks = await init({
    project: { id: 'test' },
    client: { app: { log: () => {} } },
    directory: CONFIG_DIR,
    worktree: CONFIG_DIR,
    $: () => {},
  })
  diagnostics = () => plugin.__hubsDiagnostics()

  // The tool cache is disk-persistent by design, so entries from a previous run
  // are still on disk when this suite starts. That is the product behaving
  // correctly — a Grep result for identical args is reusable — but it made this
  // suite order- and history-dependent: a run that ended with 'AFTER-WRITE'
  // cached under one pattern was replayed as the FIRST result of the next run's
  // cache-hit test. Start every run from a cold tool cache so what is under test
  // is the hook logic rather than the filesystem's history.
  try {
    const cacheRoot = path.join(CONFIG_DIR, '.opencode', 'cache', 'tool')
    for (const entry of fs.readdirSync(cacheRoot)) {
      fs.rmSync(path.join(cacheRoot, entry), { recursive: true, force: true })
    }
  } catch {
    // No cache on disk yet — already cold, which is all this needs to be.
  }
}, 60_000)

/** Drive one chat turn through the transform hook and return what it injected. */
const transform = async (prompt: string, sid: string) => {
  await hooks['chat.message']({ sessionID: sid, message: { role: 'user', content: prompt } }, {})
  const out: any = { system: [] }
  await hooks['experimental.chat.system.transform']({ sessionID: sid }, out)
  return out.system as string[]
}

describe('request efficiency: the tool cache must actually substitute output', () => {
  const SD = 'eff-req-cache'
  const call = async (tool: string, args: any, callID: string, realOutput: string) => {
    await hooks['tool.execute.before']({ tool, sessionID: SD, callID, args }, { args })
    const out: any = { output: realOutput, title: '', metadata: {} }
    await hooks['tool.execute.after']({ tool, sessionID: SD, callID, args }, out)
    return out.output
  }

  it('a repeat call returns the FIRST result, not a freshly computed one', async () => {
    // This is the whole point. The before-hook can look a value up and the
    // after-hook can substitute it; if substitution does not happen the model
    // pays for the tokens again and the cache is decorative.
    const args = { pattern: '**/*.never-matches-hit-zzz', path: CONFIG_DIR }
    const first = await call('Grep', args, 'r1', 'FIRST-RESULT')
    const second = await call('Grep', args, 'r2', 'SECOND-RESULT')
    expect(first).toBe('FIRST-RESULT')
    expect(second, 'cache hit did not substitute — the second result was computed again').toBe('FIRST-RESULT')
  })

  it('a write invalidates, so the next call computes fresh', async () => {
    // invalidateToolCache was keyed on a bare sha256 while it searched for a
    // literal tool-name prefix, so it matched nothing and every write left the
    // cache intact until its TTL expired.
    const args = { pattern: '**/*.never-matches-invalidate-zzz', path: CONFIG_DIR }
    await call('Grep', args, 'w1', 'SEED')
    await call('Write', { filePath: path.join(CONFIG_DIR, '.opencode', 'state', 'tmp-eff.txt'), content: 'x' }, 'w2', 'WROTE')
    const afterWrite = await call('Grep', args, 'w3', 'AFTER-WRITE')
    expect(afterWrite, 'write did not invalidate the cache').toBe('AFTER-WRITE')
  })

  it('cache keys distinguish args, so different work is not confused', async () => {
    const a = await call('Grep', { pattern: 'x-a', path: CONFIG_DIR }, 'k1', 'RESULT-A')
    const b = await call('Grep', { pattern: 'x-b', path: CONFIG_DIR }, 'k2', 'RESULT-B')
    expect(a).toBe('RESULT-A')
    expect(b, 'distinct args shared a cache entry').toBe('RESULT-B')
  })

  it('Read results are keyed by offset/limit, not path alone', async () => {
    // A partial read served to a later full-file read silently truncates the
    // model's view of a file — the most expensive possible cache bug, because
    // the model cannot tell content is missing.
    const f = path.join(CONFIG_DIR, 'rules', 'efficiency-first.md')
    if (!fs.existsSync(f)) return
    const full = await call('Read', { filePath: f }, 'rf1', 'FULL')
    const part = await call('Read', { filePath: f, offset: 50 }, 'rf2', 'PARTIAL')
    const fullAgain = await call('Read', { filePath: f }, 'rf3', 'FULL-AGAIN')
    expect(full).toBe('FULL')
    expect(part, 'offset read collided with the full read').toBe('PARTIAL')
    expect(fullAgain).toBe('FULL')
  })

  it('an mtime change invalidates a cached Read', async () => {
    const f = path.join(CONFIG_DIR, 'rules', 'efficiency-first.md')
    if (!fs.existsSync(f)) return
    await call('Read', { filePath: f }, 'rm1', 'V1')
    const future = new Date(Date.now() + 60_000)
    fs.utimesSync(f, future, future)
    try {
      const after = await call('Read', { filePath: f }, 'rm2', 'V2')
      expect(after, 'a changed mtime was served from cache').toBe('V2')
    } finally {
      const now = new Date()
      fs.utimesSync(f, now, now)
    }
  })
})

describe('request efficiency: context injection must be gated, not unconditional', () => {
  it('a short prompt retrieves nothing', async () => {
    const blocks = await transform('yes', 'eff-tok-short')
    expect(blocks.some((b) => b.includes('<Relevant_Context>')), 'a one-word prompt triggered retrieval').toBe(false)
  }, 30_000)

  it('a substantive question does retrieve', async () => {
    if (!fs.existsSync(CODE_DB)) return
    const blocks = await transform('how does the tool cache invalidation work across writes', 'eff-tok-real')
    expect(blocks.some((b) => b.includes('<Relevant_')), 'a substantive question retrieved nothing').toBe(true)
  }, 90_000)

  it('a repeat prompt costs nothing — the result is served from the session cache', async () => {
    if (!fs.existsSync(CODE_DB)) return
    const q = 'which rule governs inference host request efficiency'
    const first = await transform(q, 'eff-tok-repeat')

    // Assert on the MECHANISM, not on elapsed time. This test used to measure
    // wall-clock and failed intermittently under the full suite (4031ms against a
    // 1000ms bound) while passing 3/3 in isolation — it was measuring how loaded
    // the machine was, not whether the cache worked. A regression to per-turn
    // retrieval shows up here as a miss, deterministically.
    const before = cacheStats()
    const second = await transform(q, 'eff-tok-repeat')
    const after = cacheStats()

    // A cache test needs something to cache. When the store returns nothing,
    // injecting nothing is CORRECT behaviour and the hit counter is the only
    // meaningful signal — so the presence check is a precondition, not an
    // assertion. It used to be an assertion, and under the load of the full suite
    // (11 files, several spawning children and rebuilding the graph) a slow
    // retrieval failed a test whose subject is caching. The hit assertion below
    // still holds either way, so this cannot pass vacuously.
    const gotResults = first.some((b) => b.includes('<Relevant_'))
    if (gotResults) {
      expect(
        second.some((b) => b.includes('<Relevant_')),
        'the cached call returned less than the original call',
      ).toBe(true)
    }

    const hits = (after.session?.hits ?? 0) - (before.session?.hits ?? 0)
    const misses = (after.session?.misses ?? 0) - (before.session?.misses ?? 0)
    expect(
      hits,
      `repeat prompt recorded no session-cache hit (hits +${hits}, misses +${misses}) — retrieval is running again instead of being served`,
    ).toBeGreaterThan(0)
  }, 90_000)
})

describe('request efficiency: children are reused and reaped, never leaked', () => {
  it('one child serves many queries rather than one per call', async () => {
    // The retriever used to spawn a child per turn and pay ~9.4s of model load
    // each time. It is now a long-lived server; the child count must not grow
    // with the number of queries.
    if (!fs.existsSync(CODE_DB)) return
    const sd = 'eff-req-child'
    const before = diagnostics().childCount
    for (let i = 0; i < 3; i++) {
      await transform(`explain the graph rebuild gating for iteration ${i}`, sd)
    }
    const after = diagnostics().childCount
    expect(after - before, `${after - before} new children for 3 queries — a child is spawning per call`).toBeLessThanOrEqual(1)
  }, 120_000)

  it('the registry reports its children, so a leak would be visible', () => {
    const d = diagnostics()
    expect(Array.isArray(d.children)).toBe(true)
    expect(d.childCount).toBe(d.children.length)
  })

  it('the interpreter resolves to node, never bun', () => {
    // Bun 1.3.14 hard-crashes with a NAPI FATAL ERROR on
    // require('better-sqlite3'), which every vector child loads. Under bun the
    // child dies at startup and queries silently return nothing.
    expect(diagnostics().runtime.kind, `runtime is ${diagnostics().runtime.kind}`).toBe('node')
    expect(diagnostics().runtime.cmd).not.toBe('bun')
  })
})

describe('request efficiency: the hook source has no silent no-ops left', () => {
  const src = fs.readFileSync(path.join(CONFIG_DIR, 'plugins', 'hooks', 'hooks.ts'), 'utf-8')

  it('no cache probe discards its result', () => {
    // The original shape: `if (cached) { /* nothing */ }`. Counted a hit,
    // spent the tokens anyway.
    const inert = src.match(/if\s*\(\s*cached\s*\)\s*\{\s*(\/\*[^*]*\*\/)?\s*\}/g) ?? []
    expect(inert, `inert cache probes remain:\n${inert.join('\n')}`).toEqual([])
  })

  it('cache hits are recorded against the call so the after-hook can substitute', () => {
    expect(src).toMatch(/cacheHitMap\.set\(callID, cached\)/)
  })

  it('the after-hook substitutes before any re-caching', () => {
    const idx = src.indexOf('cacheHitMap.has(hitCallID)')
    const reCache = src.indexOf('withToolCache(toolName, args')
    expect(idx, 'the substitution branch is missing').toBeGreaterThan(-1)
    expect(idx, 'substitution must precede re-caching').toBeLessThan(reCache)
  })
})
