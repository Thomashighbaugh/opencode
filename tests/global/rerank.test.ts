/**
 * rerank.test.ts — the `rerank` tool, now ONNX-first.
 *
 * The tool used to be the only Ollama-dependent surface left in the retrieval
 * stack: embedder, classifier, and veclib's internal reranker all ran in-process,
 * so with the daemon stopped they kept working while `rerank` returned
 * `ECONNREFUSED`. The tests below pin the three properties that make that gap
 * impossible to reintroduce unnoticed:
 *
 *   1. **onnx is the default** — asserted on the tool's own default, not on a
 *      comment. A default that silently reverts is invisible until a daemon dies.
 *   2. **Pairing is cross-encoder** — the query is repeated per candidate and
 *      passed as `text_pair`. Scoring documents in isolation still returns
 *      plausible 0..1 numbers, so only a discrimination test catches it.
 *   3. **Failure is distinguishable from empty** — a missing model must produce
 *      `{ok: false, error}`, never `results: []`. An empty array reads as "nothing
 *      matched", which is how a broken retriever gets reported as a thin corpus.
 *
 * Model-backed tests skip when the weights are absent; the contract tests do not,
 * because they are the ones that must hold on a machine with no models at all.
 */

import { describe, it, expect } from 'vitest'
import * as fs from 'node:fs'
import * as path from 'node:path'

const CONFIG_DIR = path.resolve(__dirname, '..', '..')
const RERANK_MOD = path.join(CONFIG_DIR, 'tools', 'rerank.ts')

const rt: typeof import('../../skills/vectorize-context/scripts/onnx-runtime') = await import(
  path.join(CONFIG_DIR, 'skills', 'vectorize-context', 'scripts', 'onnx-runtime.ts')
)
const rr: typeof import('../../tools/rerank') = await import(RERANK_MOD)

const hasReranker = rt.isCached(rt.REQUIRED_MODELS.reranker)

/** Call the tool's handler the way the runtime does. */
async function callTool(args: Record<string, unknown>): Promise<any> {
  const mod: any = await import(RERANK_MOD)
  const handler = mod.default?.execute ?? mod.execute
  return JSON.parse(await handler(args, {}))
}

// ─── sigmoid ───────────────────────────────────────────────────────────────

describe('rerank: sigmoid', () => {
  it('maps the logit line to 0..1', () => {
    expect(rr.sigmoid(0)).toBeCloseTo(0.5, 10)
    expect(rr.sigmoid(-20)).toBeCloseTo(0, 6)
    expect(rr.sigmoid(20)).toBeCloseTo(1, 6)
  })

  it('is strictly increasing', () => {
    // Ranking is the entire output; a flat or inverted squash returns a
    // confidently wrong order while every score still looks like a probability.
    let prev = -Infinity
    for (let x = -8; x <= 8; x += 0.5) {
      const s = rr.sigmoid(x)
      expect(s).toBeGreaterThan(prev)
      prev = s
    }
  })

  it('does not collapse a strongly-negative logit to exactly 0', () => {
    // The real defect the clamp exists to prevent: unclamped,
    // Math.exp(10000) is Infinity, so 1/(1+Infinity) is a hard 0 — which then
    // sorts as a genuine score instead of a saturation artifact.
    expect(rr.sigmoid(-1e4)).toBeGreaterThan(0)
    expect(rr.sigmoid(-100)).toBeGreaterThan(0)
    expect(rr.sigmoid(-100)).toBeLessThan(1e-20)
  })

  it('saturates toward 1 without ever exceeding it', () => {
    expect(rr.sigmoid(1e4)).toBeLessThanOrEqual(1)
    expect(rr.sigmoid(50)).toBeLessThanOrEqual(1)
    // Note: sigmoid(50) is *exactly* 1.0 in float64, and that is correct —
    // 1 - 1.9e-22 has no representable double. Saturation at 1 is the honest
    // limit; collapsing to 0 on the other side was not.
    expect(rr.sigmoid(-100)).toBeLessThan(rr.sigmoid(100))
  })
})

// ─── default backend ───────────────────────────────────────────────────────

describe('rerank: backend default', () => {
  it('onnx is the default, not a comment', async () => {
    // Read from the handler's own behaviour: with no daemon reachable, the
    // default path must not be the one that reaches for Ollama.
    const out = await callTool({ query: 'q', documents: ['d'] })
    expect(out.ok === false ? out.backend : 'onnx').not.toBe('ollama')
    if (out.ok) expect(out.backend).toBe('onnx')
  })

  it('the default model is the cached ONNX checkpoint, not an Ollama tag', () => {
    expect(rr.RERANK_ONNX_MODEL).toBe(rt.REQUIRED_MODELS.reranker)
    expect(rr.RERANK_ONNX_MODEL).not.toContain(':')
  })

  it('the tool never downloads at query time', () => {
    const src = fs.readFileSync(RERANK_MOD, 'utf-8')
    expect(src).toContain('allowDownload: false')
    // A download inside a turn is indistinguishable from a hang.
    expect(src).not.toMatch(/allowDownload:\s*true/)
  })

  it('ollama is opt-in, not a silent fallback', async () => {
    // An automatic fallback would mask a broken ONNX path behind a
    // working-but-different scorer — the shape of bug that survives releases.
    //
    // Port 1 rather than the default: this daemon does answer, and its
    // /api/rerank returns 404 on this Ollama build, so a default-URL assertion
    // would be testing the wrong failure.
    const out = await callTool({
      query: 'q',
      documents: ['d'],
      backend: 'ollama',
      ollamaUrl: 'http://127.0.0.1:1',
    })
    expect(out.ok).toBe(false)
    expect(out.backend).toBe('ollama')
    expect(out).not.toHaveProperty('results')
    expect(out.error).toMatch(/connection failed|refused|fetch failed/i)
  })

  it('the ollama path surfaces a non-404 error rather than swallowing it', async () => {
    // Deliberately not asserting a status: what matters is that an HTTP failure
    // becomes {ok:false, error}, never an empty ranking.
    const out = await callTool({ query: 'q', documents: ['d'], backend: 'ollama' })
    if (!out.ok) {
      expect(out.error).toBeTruthy()
      expect(out).not.toHaveProperty('results')
    } else {
      expect(out.backend).toBe('ollama')
    }
  })
})

// ─── argument validation ───────────────────────────────────────────────────

describe('rerank: validation', () => {
  it('rejects an empty or whitespace query', async () => {
    for (const q of ['', '   ', '\n\t']) {
      const out = await callTool({ query: q, documents: ['d'] })
      expect(out.ok, JSON.stringify(q)).toBe(false)
      expect(out.error).toMatch(/query is required/)
    }
  })

  it('rejects an empty document list', async () => {
    const out = await callTool({ query: 'q', documents: [] })
    expect(out.ok).toBe(false)
    expect(out.error).toMatch(/at least one document/)
  })

  it('never reports a validation failure as zero results', async () => {
    // The distinction the whole contract turns on: a refusal is not a ranking.
    const out = await callTool({ query: '', documents: ['d'] })
    expect(out).not.toHaveProperty('results')
  })
})

// ─── failure is distinguishable from empty ─────────────────────────────────

describe('rerank: failure contract', () => {
  it('an uncached model produces an actionable error, not an empty result set', async () => {
    const out = await callTool({
      query: 'q',
      documents: ['d'],
      model: 'Xenova/definitely-not-a-real-reranker-xyz',
    })
    expect(out.ok).toBe(false)
    expect(out).not.toHaveProperty('results')
    expect(out.error).toMatch(/not cached|prefetch-models/)
  })

  it('the not-cached error names the command that fixes it', () => {
    const src = fs.readFileSync(RERANK_MOD, 'utf-8')
    expect(src).toContain('prefetch-models.ts')
  })
})

// ─── model-backed discrimination ───────────────────────────────────────────

describe.skipIf(!hasReranker)('rerank: onnx scoring', () => {
  it(
    'scores a relevant document above an unrelated one',
    async () => {
      const out = await callTool({
        query: 'how do I regenerate the TUI hub menu bundle after adding a subcommand',
        documents: [
          'The TUI menu bundle is regenerated with `bun run generate-menus` then `bun build src/tui.tsx`. The generated source file src/generated-hubs.ts is committed; dist/tui.js is gitignored and rebuilt locally.',
          'Bananas are a yellow fruit grown in the tropics and are harvested before fully ripe.',
        ],
      })
      expect(out.ok, out.error).toBe(true)
      expect(out.backend).toBe('onnx')
      expect(out.results).toHaveLength(2)
      // Cross-encoder relevance, not lexical overlap: the relevant document wins
      // despite sharing no content words with the query beyond "menu"/"hub".
      expect(out.results[0].index).toBe(0)
      expect(out.results[0].score).toBeGreaterThan(out.results[1].score)
    },
    180_000,
  )

  it(
    'returns every input document exactly once, indices intact',
    async () => {
      const docs = ['alpha document', 'beta document', 'gamma document', 'delta document']
      const out = await callTool({ query: 'which mentions beta', documents: docs })
      expect(out.ok, out.error).toBe(true)
      expect(out.total_input).toBe(4)
      expect(out.returned).toBe(4)
      expect(out.results.map((r: any) => r.index).sort()).toEqual([0, 1, 2, 3])
      // `text` must be re-attached from the original array — a sorted score list
      // without it is unactionable, since the caller only has indices.
      for (const r of out.results) expect(r.text).toBe(docs[r.index])
    },
    180_000,
  )

  it(
    'honours topK and still sorts descending',
    async () => {
      const out = await callTool({
        query: 'vector index rebuild',
        documents: ['vector index rebuild is mtime-driven', 'unrelated text', 'another unrelated text'],
        topK: 2,
      })
      expect(out.ok, out.error).toBe(true)
      expect(out.returned).toBe(2)
      expect(out.results[0].score).toBeGreaterThanOrEqual(out.results[1].score)
    },
    180_000,
  )

  it(
    'scores land strictly inside (0, 1)',
    async () => {
      const out = await callTool({ query: 'q', documents: ['a', 'b'] })
      expect(out.ok, out.error).toBe(true)
      for (const r of out.results) {
        expect(r.score).toBeGreaterThan(0)
        expect(r.score).toBeLessThan(1)
      }
    },
    180_000,
  )

  it(
    'batches past RERANK_BATCH without losing or duplicating pairs',
    async () => {
      // The logit-count assertion inside rerankOnnx is what catches a batch
      // boundary that drops a pair; this confirms it end to end.
      const docs = Array.from({ length: rr.RERANK_BATCH + 5 }, (_, i) => `document number ${i}`)
      const out = await callTool({ query: 'document number 7', documents: docs })
      expect(out.ok, out.error).toBe(true)
      expect(out.returned).toBe(docs.length)
      expect(new Set(out.results.map((r: any) => r.index)).size).toBe(docs.length)
    },
    180_000,
  )

  it(
    'is deterministic within a process',
    async () => {
      const a = await callTool({ query: 'stability', documents: ['one', 'two'] })
      const b = await callTool({ query: 'stability', documents: ['one', 'two'] })
      expect(a.ok && b.ok).toBe(true)
      expect(a.results.map((r: any) => r.score)).toEqual(b.results.map((r: any) => r.score))
    },
    180_000,
  )
})

// ─── cross-encoder pairing ─────────────────────────────────────────────────

describe('rerank: cross-encoder pairing', () => {
  it('passes the query as text_pair, not as the primary sequence', () => {
    // Scoring each document alone still returns 0..1 scores that look fine.
    // Only the wiring assertion distinguishes a reranker from a second embedder.
    const src = fs.readFileSync(RERANK_MOD, 'utf-8')
    expect(src).toContain('text_pair: slice')
    expect(src).toContain('slice.map(() => query)')
  })

  it('validates the logit count against the pair count', () => {
    // A checkpoint with a different head would otherwise return scores for a
    // different number of pairs and silently misalign every index.
    const src = fs.readFileSync(RERANK_MOD, 'utf-8')
    expect(src).toContain('data.length !== slice.length')
  })
})

// ─── wiring ────────────────────────────────────────────────────────────────

describe('rerank: wiring', () => {
  it('is discoverable as an OpenCode tool', () => {
    // Tools are auto-discovered from tools/ by their default `tool()` export —
    // they are NOT listed in opencode.jsonc. Asserting the manifest contains
    // "rerank" would pass on a typo'd filename and fail on a correct one.
    const src = fs.readFileSync(RERANK_MOD, 'utf-8')
    expect(src).toMatch(/export default tool\(\{/)
    expect(path.basename(RERANK_MOD, '.ts')).toBe('rerank')
  })

  it('shares its model id and scoring convention with veclib', () => {
    // Divergent checkpoints or scoring between the two rerank paths make scores
    // incomparable across tools, which defeats using them together.
    const veclib = fs.readFileSync(
      path.join(CONFIG_DIR, 'skills', 'vectorize-context', 'scripts', 'veclib.ts'),
      'utf-8',
    )
    expect(veclib).toContain(rt.REQUIRED_MODELS.reranker)
    expect(rr.RERANK_ONNX_MODEL).toBe(rt.REQUIRED_MODELS.reranker)
    // Both apply a logistic squash to a single logit per pair. Asserting the
    // shared shape rather than a literal, since the clamped variant names its
    // variable differently but must stay the same function.
    expect(veclib).toContain('1 / (1 + Math.exp(-logit))')
    expect(fs.readFileSync(RERANK_MOD, 'utf-8')).toMatch(/1 \/ \(1 \+ Math\.exp\(-[a-z]\)\)/)
  })

  it('the prefetch script covers the reranker', () => {
    const prefetch = fs.readFileSync(
      path.join(CONFIG_DIR, 'skills', 'vectorize-context', 'scripts', 'prefetch-models.ts'),
      'utf-8',
    )
    // prefetch iterates REQUIRED_MODELS, so the reranker is covered by
    // construction. Asserted so a future hardcoded list cannot drop it.
    expect(prefetch).toContain('Object.entries(REQUIRED_MODELS)')
  })
})
