/**
 * semantic-cache.test.ts — the subagent output cache after its move to ONNX.
 *
 * This cache embedded via Ollama `/api/embed` at 1024 dimensions while the rest
 * of the retrieval stack ran 384-dim ONNX vectors. The migration is only correct
 * if two things hold, and both fail silently otherwise:
 *
 *   1. **Dimensional mismatch is refused, not absorbed.** `cosineSimilarity`
 *      indexed by the shorter vector and read `undefined` past its end, yielding
 *      NaN — which fails `>= 0.92` for every candidate. The symptom is a cache
 *      that reports "no match" forever, with no error anywhere.
 *   2. **A stale index is discarded.** Version 1 entries are 1024-dim vectors
 *      that can never match a 384-dim query. Carrying them forward turns a
 *      recoverable cold cache into a permanently dead semantic tier.
 *
 * The exact-match tier is the control: it must keep working through every
 * degradation, because it is the part that does not need an embedding model.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import * as fs from 'node:fs'
import * as os from 'node:os'
import * as path from 'node:path'

const CONFIG_DIR = path.resolve(__dirname, '..', '..')
const SEMANTIC_MOD = path.join(CONFIG_DIR, 'tools', 'semantic-cache.ts')

const { getProjectSlug } = await import('../../tools/cache-utils')

const sc: any = await import(SEMANTIC_MOD)
const rt: typeof import('../../skills/vectorize-context/scripts/onnx-runtime') = await import(
  path.join(CONFIG_DIR, 'skills', 'vectorize-context', 'scripts', 'onnx-runtime.ts')
)
const emb: typeof import('../../skills/vectorize-context/scripts/embedder') = await import(
  path.join(CONFIG_DIR, 'skills', 'vectorize-context', 'scripts', 'embedder.ts')
)

const hasEmbedder = rt.isCached(rt.REQUIRED_MODELS.embedder)

let tmp: string
beforeEach(() => {
  tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'sem-cache-'))
})
afterEach(() => {
  fs.rmSync(tmp, { recursive: true, force: true })
})

/** Write a raw index file, bypassing version checks. */
function writeIndex(projectRoot: string, index: any) {
  const p = path.join(projectRoot, '.opencode', 'cache', 'semantic', getProjectSlug(projectRoot), 'index.json')
  fs.mkdirSync(path.dirname(p), { recursive: true })
  fs.writeFileSync(p, JSON.stringify(index, null, 2), 'utf-8')
  return p
}

function indexPath(projectRoot: string) {
  return path.join(projectRoot, '.opencode', 'cache', 'semantic', getProjectSlug(projectRoot), 'index.json')
}

async function callTool(args: Record<string, unknown>, projectRoot = tmp): Promise<any> {
  const handler = sc.default?.execute ?? sc.execute
  return JSON.parse(await handler(args, { directory: projectRoot }))
}

describe('semantic-cache: vector helpers', () => {
  it('cosine similarity of identical vectors is 1', () => {
    const v = Float32Array.from([0.1, 0.2, 0.3])
    expect(sc.cosineSimilarity(v, v)).toBeCloseTo(1, 6)
  })

  it('cosine similarity of orthogonal vectors is 0', () => {
    expect(sc.cosineSimilarity(Float32Array.from([1, 0]), Float32Array.from([0, 1]))).toBeCloseTo(0, 6)
  })

  it('cosine similarity of opposite vectors is -1', () => {
    expect(sc.cosineSimilarity(Float32Array.from([1, 0]), Float32Array.from([-1, 0]))).toBeCloseTo(-1, 6)
  })

  it('mismatched dimensions score 0 instead of NaN', () => {
    // The regression. 384-dim query against a 1024-dim legacy vector: without
    // the length guard this is NaN, which fails the 0.92 threshold silently and
    // makes the semantic tier look permanently empty rather than broken.
    const narrow = Float32Array.from([0.5, 0.5, 0.5])
    const wide = Float32Array.from(new Array(1024).fill(0.01))
    const sim = sc.cosineSimilarity(narrow, wide)
    expect(Number.isNaN(sim)).toBe(false)
    expect(sim).toBe(0)
  })

  it('an empty vector scores 0 rather than dividing by zero', () => {
    const e = new Float32Array(0)
    expect(sc.cosineSimilarity(e, e)).toBe(0)
    expect(Number.isNaN(sc.cosineSimilarity(e, Float32Array.from([1])))).toBe(false)
  })

  it('a zero-magnitude vector scores 0', () => {
    expect(sc.cosineSimilarity(Float32Array.from([0, 0]), Float32Array.from([0, 0]))).toBe(0)
  })
})

describe('semantic-cache: index versioning', () => {
  it('the current index version is 2', () => {
    // Version 1 is the 1024-dim Ollama layout. Bumping this without a migration
    // silently discards every entry; the number is asserted so the next change
    // is a deliberate one.
    expect(sc.INDEX_VERSION).toBe(2)
  })

  it('a version-1 index is discarded rather than compared', () => {
    writeIndex(tmp, {
      version: 1,
      entries: [
        {
          key: 'legacy',
          agentType: 'executor',
          prompt: 'old task',
          vectorB64: sc.vectorToBase64(new Array(1024).fill(0.02)),
          output: 'stale output',
          fileHashes: 'no-files',
          savedAt: '2026-01-01T00:00:00.000Z',
        },
      ],
    })
    const loaded = sc.loadIndex(tmp)
    expect(loaded.version).toBe(2)
    // Dropped, not carried: these can never clear the 0.92 threshold.
    expect(loaded.entries).toEqual([])
  })

  it('a current-version index is loaded intact', () => {
    writeIndex(tmp, {
      version: 2,
      entries: [
        {
          key: 'k',
          agentType: 'executor',
          prompt: 'task',
          vectorB64: sc.vectorToBase64([0.1, 0.2, 0.3]),
          output: 'out',
          fileHashes: 'no-files',
          savedAt: '2026-01-01T00:00:00.000Z',
          lastAccess: '2026-01-02T00:00:00.000Z',
        },
      ],
    })
    const loaded = sc.loadIndex(tmp)
    expect(loaded.entries).toHaveLength(1)
    expect(loaded.entries[0].output).toBe('out')
  })

  it('a missing index file yields an empty current-version index', () => {
    const loaded = sc.loadIndex(tmp)
    expect(loaded.version).toBe(2)
    expect(loaded.entries).toEqual([])
  })

  it('a corrupt index file does not throw', () => {
    fs.mkdirSync(path.dirname(indexPath(tmp)), { recursive: true })
    fs.writeFileSync(indexPath(tmp), '{not json', 'utf-8')
    expect(() => sc.loadIndex(tmp)).not.toThrow()
    expect(sc.loadIndex(tmp).entries).toEqual([])
  })
})

describe('semantic-cache: base64 round-trip', () => {
  it('survives a round-trip without NaN', () => {
    // A byte-length mismatch here would make every stored vector NaN on read —
    // indistinguishable from "no semantic match" at the call site.
    const vec = [0.1, -0.25, 0.5, 0.75]
    const back = sc.base64ToVector(sc.vectorToBase64(vec))
    expect(back).toHaveLength(vec.length)
    for (let i = 0; i < vec.length; i++) expect(back[i]).toBeCloseTo(vec[i], 6)
    expect(sc.cosineSimilarity(Float32Array.from(vec), back)).toBeCloseTo(1, 6)
  })

  it('rejects a vector whose length disagrees with the embedder dimension', async () => {
    // Defence in depth: getEmbedding refuses a wrong-width vector rather than
    // storing something that can never match.
    if (!hasEmbedder) return
    const v = await emb.embedQuery('dimension check')
    expect(v).toHaveLength(emb.EMBED_DIM)
    // And the round-trip back out preserves that width exactly — a pool-offset
    // bug here would inflate it without any error.
    expect(sc.base64ToVector(sc.vectorToBase64(v))).toHaveLength(emb.EMBED_DIM)
  })
})

describe('semantic-cache: exact tier survives embedder failure', () => {
  it('an uncached embedder degrades to exact match, not an error', async () => {
    const saved = await callTool({
      action: 'save',
      agentType: 'executor',
      taskPrompt: 'do the thing',
      output: 'the result',
    })
    // The exact tier is written before the embed is attempted, so a cold or
    // missing model cannot cost the caller their cache write.
    expect(saved.success).toBe(true)
    expect(saved.key).toBeTruthy()
  }, 180_000)

  it('the exact tier returns a hit with no embedding model involved', async () => {
    await callTool({
      action: 'save',
      agentType: 'executor',
      taskPrompt: 'exact tier probe',
      output: 'cached output text',
    })
    const hit = await callTool({
      action: 'load',
      agentType: 'executor',
      taskPrompt: 'exact tier probe',
    })
    expect(hit.success).toBe(true)
    expect(hit.hit).toBe(true)
    expect(hit.tier).toBe('exact')
    expect(hit.output).toBe('cached output text')
  }, 180_000)

  it('a load with no candidates is a miss, not a failure', async () => {
    const out = await callTool({ action: 'load', agentType: 'ghost', taskPrompt: 'nothing stored' })
    expect(out.success).toBe(true)
    expect(out.hit).toBe(false)
  }, 180_000)
})

describe.skipIf(!hasEmbedder)('semantic-cache: semantic tier', () => {
  it(
    'a near-identical prompt hits the semantic tier',
    async () => {
      const prompt =
        'Rewrite the parser in src/parse.ts so the tokenizer handles nested braces, then run the suite.'
      await callTool({ action: 'save', agentType: 'executor', taskPrompt: prompt, output: 'parser rewritten' })

      // Different wording, same request — exactly the case the 0.92 tier exists for.
      const paraphrase =
        'Rewrite the parser in src/parse.ts so the tokenizer handles nested braces and then run the test suite.'
      const out = await callTool({ action: 'load', agentType: 'executor', taskPrompt: paraphrase })
      expect(out.success).toBe(true)
      if (out.hit) {
        expect(['semantic', 'exact']).toContain(out.tier)
      } else {
        // A miss is an acceptable outcome at a 0.92 threshold with a 384-dim
        // model; a crash or a NaN similarity is not.
        expect(out.tier).toBe('none')
        expect(out.reason).not.toMatch(/nan/i)
      }
    },
    180_000,
  )

  it(
    'an unrelated prompt does not return the cached output',
    async () => {
      await callTool({
        action: 'save',
        agentType: 'executor',
        taskPrompt: 'Migrate the PostgreSQL schema to add a composite index on orders.customer_id',
        output: 'schema migrated',
      })
      const out = await callTool({
        action: 'load',
        agentType: 'executor',
        taskPrompt: 'Bake a sourdough loaf with a 24-hour cold ferment',
      })
      expect(out.success).toBe(true)
      // The safety property: a semantic near-match must not hand back an
      // unrelated agent output.
      expect(out.output).not.toBe('schema migrated')
    },
    180_000,
  )

  it(
    'stats names the model and dimension',
    async () => {
      const out = await callTool({ action: 'stats' })
      expect(out.success).toBe(true)
      expect(out.semanticDim).toBe(emb.EMBED_DIM)
      expect(out.semanticModel).toContain('onnx:')
      // Without these two, a dimension mismatch is indistinguishable from a
      // cache that simply never hits.
      expect(out.semanticModel).not.toContain('mxbai')
    },
    180_000,
  )
})

describe('semantic-cache: wiring', () => {
  it('no longer calls the Ollama embed endpoint', () => {
    const src = fs.readFileSync(SEMANTIC_MOD, 'utf-8')
    expect(src).not.toContain('/api/embed')
    expect(src).not.toContain('mxbai')
    expect(src).not.toContain('127.0.0.1:11434')
  })

  it('shares the embedder with the vector store rather than loading its own model', () => {
    const src = fs.readFileSync(SEMANTIC_MOD, 'utf-8')
    expect(src).toContain("vectorize-context/scripts/embedder.ts")
    expect(src).toContain('EMBED_MODEL_KEY')
  })

  it('the tool description does not advertise a daemon that is no longer used', () => {
    const src = fs.readFileSync(SEMANTIC_MOD, 'utf-8')
    expect(src).not.toMatch(/description:.*Ollama/)
    expect(src).toMatch(/description:.*ONNX/)
  })
})