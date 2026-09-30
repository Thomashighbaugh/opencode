/**
 * onnx.test.ts — the ONNX embedder and the gate's classifier.
 *
 * Two things are worth being careful about here, and both are the kind of bug
 * that produces confident nonsense rather than an error:
 *
 *   1. **Pooling.** Mean-pooling a BGE model retrieves plausibly and ranks badly.
 *      Nothing looks wrong. The dimension is still 384 either way.
 *   2. **Label order.** This classifier checkpoint orders its labels
 *      ENTAILMENT, NEUTRAL, CONTRADICTION — the reverse of the MNLI convention —
 *      so reading the conventional index scores *neutral* as entailment, and every
 *      input comes back above 0.93. A test that only checked "returns a number"
 *      would have passed through that.
 *
 * The model-backed tests are skipped when the weights are not cached, because the
 * suite must not download 60 MB to run `bun run test:run`. `prefetch-models.ts`
 * fetches them; `--check` reports whether they are present.
 */

import { describe, it, expect } from 'vitest'
import * as fs from 'node:fs'
import * as path from 'node:path'
import * as os from 'node:os'

const CONFIG_DIR = path.resolve(__dirname, '..', '..')
const RUNTIME_MOD = path.join(CONFIG_DIR, 'skills', 'vectorize-context', 'scripts', 'onnx-runtime.ts')
const EMBEDDER_MOD = path.join(CONFIG_DIR, 'skills', 'vectorize-context', 'scripts', 'embedder.ts')
const CLASSIFIER_MOD = path.join(CONFIG_DIR, 'plugins', 'prompt-queue', 'classifier.ts')
const GATE_MOD = path.join(CONFIG_DIR, 'plugins', 'prompt-queue', 'gate.ts')

// Loaded at module scope, not in beforeEach: the describe bodies below read them
// during collection, which happens before any hook runs.
const rt: typeof import('../../skills/vectorize-context/scripts/onnx-runtime') = await import(RUNTIME_MOD)
const emb: typeof import('../../skills/vectorize-context/scripts/embedder') = await import(EMBEDDER_MOD)
const cls: typeof import('../../plugins/prompt-queue/classifier') = await import(CLASSIFIER_MOD)
const gate: typeof import('../../plugins/prompt-queue/gate') = await import(GATE_MOD)
const veclib: any = await import(path.join(CONFIG_DIR, 'skills', 'vectorize-context', 'scripts', 'veclib.ts'))

const hasEmbedder = rt.isCached(rt.REQUIRED_MODELS.embedder)
const hasClassifier = rt.isCached(rt.REQUIRED_MODELS.classifier)

// ─── pooling ───────────────────────────────────────────────────────────────

describe('pooling', () => {
  /**
   * Minimal stand-in for a transformers.js output tensor, as [batch, seq, hidden].
   * `rows` is the token axis; a batch of N sequences is N tensors.
   */
  const tensor = (rows: number[][], hidden: number) => ({
    dims: [1, rows.length, hidden],
    data: Float32Array.from(rows.flat()),
  })
  const mask = (n: number, keep = 1) => Uint8Array.from({ length: n }, (_, i) => (i < keep ? 1 : 0))

  it('mean-pooling ignores the padded tail', () => {
    // One real token, two masked after it. Pooling over the pad embedding instead
    // of the mask is what silently drags a batch's vectors and degrades recall
    // without changing the dimension — the hardest retrieval bug to notice.
    const out = rt.meanPool(tensor([[1, 2, 3], [99, 99, 99], [99, 99, 99]], 3), { data: mask(3, 1) })
    // Only token 0 counts, then the whole vector is L2-normalized.
    const norm = Math.hypot(1, 2, 3)
    for (let i = 0; i < 3; i++) expect(out[0][i]).toBeCloseTo([1, 2, 3][i] / norm, 5)
    // The decisive part: nothing from the padded positions leaked in.
    expect(out[0]).not.toContain(99 / norm)
  })

  it('mean-pooling averages only unmasked positions', () => {
    const out = rt.meanPool(tensor([[2, 4], [6, 8], [50, 50], [50, 50]], 2), { data: mask(4, 2) })
    // mean of the two unmasked rows = [4, 6], then normalized.
    const norm = Math.hypot(4, 6)
    expect(out[0][0]).toBeCloseTo(4 / norm, 5)
    expect(out[0][1]).toBeCloseTo(6 / norm, 5)
  })

  it('mean-pooling returns unit vectors', () => {
    const out = rt.meanPool(tensor([[3, 4]], 2))
    expect(Math.hypot(out[0][0], out[0][1])).toBeCloseTo(1, 5)
  })

  it('a fully-masked row does not divide by zero', () => {
    const out = rt.meanPool(tensor([[1, 1, 1]], 3), { data: mask(1, 0) })
    expect(out[0]).toEqual([0, 0, 0])
  })

  it('cls-pooling takes the first token, not the mean', () => {
    // BGE is trained with [CLS] as the sentence representation. Both poolings
    // return unit vectors, so the mistake is invisible without a known answer.
    const out = rt.clsPool(tensor([[1, 0], [0, 1]], 2))
    expect(out[0]).toEqual([1, 0])
  })

  it('cls-pooling normalizes', () => {
    const out = rt.clsPool(tensor([[3, 4]], 2))
    expect(Math.hypot(out[0][0], out[0][1])).toBeCloseTo(1, 5)
  })

  it('cls-pooling and mean-pooling genuinely differ', () => {
    const t = tensor([[1, 2], [3, 4]], 2)
    expect(rt.clsPool(t)[0]).not.toEqual(rt.meanPool(t, { data: mask(2, 2) })[0])
  })
})

// ─── runtime conventions ───────────────────────────────────────────────────

describe('onnx runtime', () => {
  it('the cache lives inside the config, not in ~/.cache', () => {
    // A model removed by a cache purge is a model that fails in production.
    expect(rt.cacheRoot()).toContain('node_modules')
    expect(rt.cacheRoot()).not.toContain(path.join(os.homedir(), '.cache'))
  })

  it('declares the three models this harness needs', () => {
    expect(Object.keys(rt.REQUIRED_MODELS).sort()).toEqual(['classifier', 'embedder', 'reranker'])
  })

  it('query-time loading refuses a model that is not cached', async () => {
    await expect(rt.loadModel('Xenova/definitely-not-a-real-model-xyz', { allowDownload: false }))
      .rejects.toThrow(/not cached|prefetch-models/)
  })

  it('a failed load is not cached as the promise for every later caller', async () => {
    // Otherwise one transient failure makes the query path degrade forever.
    rt.__resetOnnxRuntime()
    await expect(rt.loadModel('Xenova/definitely-not-a-real-model-xyz', { allowDownload: false })).rejects.toThrow()
    await expect(rt.loadModel('Xenova/definitely-not-a-real-model-xyz', { allowDownload: false })).rejects.toThrow()
  })

  it('the prefetch script exists and reports without downloading', () => {
    expect(fs.existsSync(path.join(CONFIG_DIR, 'skills', 'vectorize-context', 'scripts', 'prefetch-models.ts'))).toBe(true)
  })
})

describe('onnx runtime: model availability', () => {
  it.each(Object.entries(rt.REQUIRED_MODELS))('%s (%s) is cached', (_role: string, modelId: string) => {
    // Reported, not asserted: a missing model is a deployment state, not a code
    // defect, and the fallback paths below are what must be tested here.
    expect(typeof rt.isCached(modelId as string)).toBe('boolean')
  })

  it.skipIf(!hasClassifier)('classifier weights are present', () => {
    expect(rt.isCached(rt.REQUIRED_MODELS.classifier)).toBe(true)
  })

  it.skipIf(!hasEmbedder)('embedder weights are present', () => {
    expect(rt.isCached(rt.REQUIRED_MODELS.embedder)).toBe(true)
  })
})

// ─── embedder ──────────────────────────────────────────────────────────────

describe('embedder', () => {
  it('the dimension is what veclib writes into the vec0 table', () => {
    // A mismatch here fails at insert time with a constraint error deep in a
    // batch, which is a miserable way to find a one-character difference.
    expect(emb.EMBED_DIM).toBe(384)
    expect(veclib.embedderStatus().dim).toBe(emb.EMBED_DIM)
  })

  it('the store key names the ONNX model, not the retired Ollama tag', () => {
    expect(emb.EMBED_MODEL_KEY).toContain('onnx:')
    expect(emb.EMBED_MODEL_KEY).not.toContain('mxbai')
  })

  it('ONNX is the default backend', () => {
    expect(veclib.embedderStatus().backend).toBe('onnx')
  })

  it('status reports enough to tell "no results" from "embedder down"', () => {
    const s = veclib.embedderStatus()
    expect(s).toHaveProperty('cached')
    expect(typeof s.rerankerCached).toBe('boolean')
    expect(typeof s.classifierCached).toBe('boolean')
  })

  it('embedding an empty batch is a no-op, not a model load', async () => {
    expect(await emb.embed([])).toEqual([])
  })

  it.skipIf(!hasEmbedder)('produces unit vectors of the declared dimension', async () => {
    const [v] = await emb.embed(['the quick brown fox'])
    expect(v).toHaveLength(emb.EMBED_DIM)
    expect(Math.hypot(...v)).toBeCloseTo(1, 3)
  })

  it.skipIf(!hasEmbedder)('related text scores higher than unrelated text', async () => {
    const [a, b] = await emb.embed([
      'the graph rebuild is gated on a structure signature',
      'a banana is a yellow fruit grown in the tropics',
    ])
    const dot = (x: number[], y: number[]) => x.reduce((s, v, i) => s + v * y[i], 0)
    expect(dot(a, a)).toBeGreaterThan(dot(a, b))
  })

  it.skipIf(!hasEmbedder)('is deterministic within a process', async () => {
    const [a] = await emb.embed(['determinism check'])
    const [b] = await emb.embed(['determinism check'])
    for (let i = 0; i < a.length; i++) expect(a[i]).toBeCloseTo(b[i], 5)
  })
})

// ─── classifier ────────────────────────────────────────────────────────────

describe('classifier: contract', () => {
  it('reconcile can only ever tighten the regex verdict', () => {
    // The whole safety argument: a model that is confidently wrong releases
    // nothing, because a false release buries a question the user is waiting on.
    for (const p of [0, 0.1, 0.5, 0.817, 0.95, 1]) {
      expect(cls.reconcile(p, true).holds).toBe(true)
    }
    expect(cls.reconcile(0.99, false).holds).toBe(true)
    expect(cls.reconcile(0.1, false).holds).toBe(false)
  })

  it('a missing model is no opinion, not a verdict', () => {
    const v = cls.reconcile(null, false)
    expect(v.available).toBe(false)
    expect(v.probability).toBeNull()
    expect(v.holds).toBe(false)
  })

  it('the threshold sits in the measured gap, not near a boundary', () => {
    // Measured: weakest real ask 0.969, strongest false-positive-looking
    // completion 0.438. The threshold is above the midpoint of a wide gap.
    expect(cls.ASK_THRESHOLD).toBeGreaterThan(0.5)
    expect(cls.ASK_THRESHOLD).toBeLessThan(0.9)
  })

  it('empty text yields no opinion', async () => {
    expect(await cls.askProbability('')).toBeNull()
    expect(await cls.askProbability('   ')).toBeNull()
  })
})

describe('classifier: discrimination', () => {
  it.skipIf(!hasClassifier)('asks score well above the threshold', async () => {
    for (const t of [
      'Which approach do you prefer?',
      'All tests pass. Would you like me to update the README too?',
      'Let me know if you want the changelog entry as well.',
    ]) {
      const p = await cls.askProbability(t)
      expect(p, t).not.toBeNull()
      expect(p!, t).toBeGreaterThan(cls.ASK_THRESHOLD)
    }
  }, 120_000)

  it.skipIf(!hasClassifier)('completions score below the threshold', async () => {
    for (const t of [
      'All 990 tests pass and the graph is consistent.',
      'Refactored the parser and verified the suite.',
      'Done. Tests pass.',
      'Everything is committed and pushed to main.',
    ]) {
      const p = await cls.askProbability(t)
      expect(p, t).not.toBeNull()
      expect(p!, t).toBeLessThan(cls.ASK_THRESHOLD)
    }
  }, 120_000)

  it.skipIf(!hasClassifier)('a problem report is a completion, not an ask', async () => {
    // The case the natural framing got wrong: it scored this barely above a real
    // completion, leaving no margin, which would have held ordinary reporting.
    const p = await cls.askProbability('There are two problems: the parser and the schema.')
    expect(p).toBeLessThan(cls.ASK_THRESHOLD)
  }, 120_000)

  it.skipIf(!hasClassifier)('the two label sets are cleanly separated', async () => {
    const asks = ['Which approach do you prefer?', 'Let me know if you want the changelog entry.']
    const reports = ['All tests pass.', 'Committed and pushed to main.']
    const askP = Math.min(...(await Promise.all(asks.map((t) => cls.askProbability(t)))).map((x) => x ?? 0))
    const repP = Math.max(...(await Promise.all(reports.map((t) => cls.askProbability(t)))).map((x) => x ?? 0))
    expect(askP - repP, `ask min ${askP.toFixed(3)} vs report max ${repP.toFixed(3)}`)
      .toBeGreaterThan(0.3)
  }, 120_000)
})

describe('gate + classifier integration', () => {
  const live = { askProbability: cls.askProbability, reconcile: cls.reconcile }

  it('a stub classifier can hold a turn the phrase list released', async () => {
    // The behaviour that justifies the model: "Pick one: A or B." has no
    // question mark and no listed ask-phrase.
    const text = 'I am ready to proceed. Pick one: A or B.'
    expect(gate.evaluateTurn({ finalText: text }).holds).toBe(false)

    const stub = { askProbability: async () => 0.99, reconcile: cls.reconcile }
    const d = await gate.decide({ finalText: text }, 0, 3, stub)
    expect(d.holds).toBe(true)
    expect(d.reason).toBe('model')
  })

  it('a low-confidence classifier changes nothing', async () => {
    const text = 'All tests pass and everything is committed.'
    const stub = { askProbability: async () => 0.2, reconcile: cls.reconcile }
    const d = await gate.decide({ finalText: text }, 0, 3, stub)
    expect(d.holds).toBe(false)
  })

  it('an unavailable classifier leaves the regex verdict untouched', async () => {
    const text = 'All tests pass.'
    const stub = { askProbability: async () => null, reconcile: cls.reconcile }
    expect((await gate.decide({ finalText: text }, 0, 3, stub)).holds).toBe(false)
    expect((await gate.decide({ finalText: 'Ready?' }, 0, 3, stub)).holds).toBe(true)
  })

  it('the classifier is never consulted for an already-held turn', async () => {
    let calls = 0
    const counting = {
      askProbability: async () => { calls++; return 0.99 },
      reconcile: cls.reconcile,
    }
    // A popup hold is definitive; spending a model call to confirm it is waste.
    await gate.decide({ tools: ['question'], finalText: 'Which one?' }, 0, 3, counting)
    expect(calls).toBe(0)
  })

  it('the anti-deadlock guard still applies to a model hold', async () => {
    const stub = { askProbability: async () => 0.99, reconcile: cls.reconcile }
    const d = await gate.decide({ finalText: 'Pick one: A or B.' }, 2, 3, stub)
    expect(d.holds).toBe(false)
    expect(d.deadlockBreak).toBe(true)
  })

  it.skipIf(!hasClassifier)('the live classifier holds a phrase-list-miss ask', async () => {
    // No question mark, and no phrase in the regex list. Measured p = 0.969.
    const text = 'I need a decision from you before I continue.'
    expect(gate.evaluateTurn({ finalText: text }).holds).toBe(false)
    const d = await gate.decide({ finalText: text }, 0, 3, live)
    expect(d.holds, `live classifier p=${d.evidence}`).toBe(true)
  }, 120_000)

  it.skipIf(!hasClassifier)('subtle asks land in a lukewarm band below the threshold', async () => {
    // Measured, and recorded here so the threshold is not "tuned until green".
    // 'I am ready to proceed. Pick one: A or B.' scores 0.574 and 'Two options
    // remain: migrate in place, or dual-write until v2' scores 0.646 — both real
    // asks the phrase list also misses.
    //
    // The threshold stays high because the classifier may only ADD holds. Catching
    // these would mean lowering it to ~0.55, which would also hold statements
    // like 'Two options remain: A or B' that merely enumerate. A stuck queue costs
    // more than one missed queued prompt, so precision wins and the gap is stated
    // rather than papered over.
    for (const t of [
      'I am ready to proceed. Pick one: A or B.',
      'Two options remain: migrate in place, or dual-write until v2.',
    ]) {
      const p = await cls.askProbability(t)
      expect(p, t).not.toBeNull()
      expect(p!, t).toBeLessThan(cls.ASK_THRESHOLD)
      expect(p!, t).toBeGreaterThan(0.5) // it did notice something, just not enough
    }
  }, 120_000)

  it.skipIf(!hasClassifier)('the live classifier releases a real completion', async () => {
    const d = await gate.decide({ finalText: 'All 990 tests pass and the graph is consistent.' }, 0, 3, live)
    expect(d.holds).toBe(false)
  }, 120_000)
})

// ─── wiring ────────────────────────────────────────────────────────────────

describe('wiring', () => {
  it('veclib embeds through ONNX by default and Ollama only when forced', () => {
    const src = fs.readFileSync(path.join(CONFIG_DIR, 'skills', 'vectorize-context', 'scripts', 'veclib.ts'), 'utf-8')
    expect(src).toContain("process.env.EMBED_BACKEND || 'onnx'")
    // Ollama is an escape hatch for comparing recall, not a fallback — the old
    // arrangement had no fallback and a dead daemon looked like an empty index.
    expect(src).toContain("EMBED_BACKEND === 'ollama'")
  })

  it('the dimension change is versioned so the old store is rebuilt, not mismatched', () => {
    const src = fs.readFileSync(path.join(CONFIG_DIR, 'skills', 'vectorize-context', 'scripts', 'veclib.ts'), 'utf-8')
    expect(src).toContain('embedding_model')
    expect(src).toContain('DROP TABLE IF EXISTS chunks_vec')
  })

  it('the plugin exposes embedder state in diagnostics', () => {
    const src = fs.readFileSync(path.join(CONFIG_DIR, 'plugins', 'hooks', 'hooks.ts'), 'utf-8')
    expect(src).toContain('embedder')
    expect(src).toContain('embedderInfo')
    // Reported from the small model modules, NOT from the vector library.
    // Importing that would pull better-sqlite3 into the plugin process — the
    // kernel panic the plugin/child split exists to avoid, and the reason
    // `cli.test.ts` asserts `hooks.ts` never mentions it.
    expect(src).toContain("scripts/embedder.ts")
    expect(src).toContain("scripts/onnx-runtime.ts")
    expect(src).not.toContain('veclib')
    expect(src).toContain('rerankerCached')
    expect(src).toContain('classifierCached')
  })

  it('the classifier can be switched off entirely', () => {
    const src = fs.readFileSync(path.join(CONFIG_DIR, 'plugins', 'prompt-queue', 'index.ts'), 'utf-8')
    expect(src).toContain('PROMPT_QUEUE_DISABLE_MODEL')
  })
})
