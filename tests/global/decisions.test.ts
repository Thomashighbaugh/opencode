/**
 * decisions.test.ts — the local decision engine and rio's extractor.
 *
 * Three things are worth testing here, and only the third needs a model:
 *
 *   1. **The degrade contract.** A missing model is "no opinion", never a
 *      fabricated verdict. This is the whole safety argument for putting a
 *      classifier behind a heuristic calling the shots: if it cannot tell, it
 *      must say so and let the caller decide, not pick a side quietly.
 *   2. **Precedence.** Veto → cue → model → default, in that order. Getting this
 *      backwards turns "Should we stick with Postgres?" into a decision because
 *      it contains "stick with".
 *   3. **Calibration.** The thresholds are measured per model, so a model swap
 *      must fail this suite rather than silently move the boundary. The
 *      model-backed cases are skipped when the weights are not cached — CI does
 *      not download 120 MB to run the suite, but a dev machine does, and that is
 *      where a threshold regression is caught.
 *
 * The corpus in `fixtures/decision-corpus.ts` is fixed precisely so that tuning
 * a cue or a threshold is always argued against the same 30/30 examples.
 */

import { describe, it, expect } from 'vitest'
import * as path from 'node:path'

const CONFIG_DIR = path.resolve(__dirname, '..', '..')

const engine: typeof import('../../skills/vectorize-context/scripts/decisions') = await import(
  path.join(CONFIG_DIR, 'skills', 'vectorize-context', 'scripts', 'decisions.ts')
)
const rio: typeof import('../../plugins/rio/src/decisions') = await import(
  path.join(CONFIG_DIR, 'plugins', 'rio', 'src', 'decisions.ts')
)
const rt: typeof import('../../skills/vectorize-context/scripts/onnx-runtime') = await import(
  path.join(CONFIG_DIR, 'skills', 'vectorize-context', 'scripts', 'onnx-runtime.ts')
)
const cls: typeof import('../../plugins/prompt-queue/classifier') = await import(
  path.join(CONFIG_DIR, 'plugins', 'prompt-queue', 'classifier.ts')
)
const corpus: typeof import('./fixtures/decision-corpus') = await import(
  path.join(CONFIG_DIR, 'tests', 'global', 'fixtures', 'decision-corpus.ts')
)

const spec = (id: string): any => (engine.DECISIONS as unknown as Record<string, any>)[id]

// ─── degrade contract ──────────────────────────────────────────────────────

describe('decisions: degrade contract', () => {
  it('empty input is no opinion, not a false verdict', async () => {
    for (const text of ['', '   ', '\n\t']) {
      const r = await engine.decide(spec('failure'), text)
      expect(r.value).toBeNull()
      expect(r.source).toBe('empty')
      expect(r.probability).toBeNull()
    }
  })

  it('no cue and no model answers the declared default', async () => {
    // Every shipping decision defaults to `false`, but the contract is that the
    // default is *declared*, not inferred from a null.
    const r = await engine.decide(spec('failure'), 'All the work is going well.', { noModel: true })
    expect(r.source).toBe('default')
    expect(r.value).toBe(spec('failure').defaultWhenUnavailable)
    expect(r.probability).toBeNull()
  })

  it('a spec whose calibrated model is not cached is never consulted', async () => {
    // The rule that stops this becoming another fickle heuristic: a threshold
    // measured on one NLI head is not portable to another, so an unlisted model
    // gets no vote at all.
    const orphan = {
      ...spec('failure'),
      id: 'orphan',
      calibrated: { 'Xenova/definitely-not-a-real-model-xyz': 0.5 },
    }
    const r = await engine.decide(orphan, 'TypeError: cannot read properties of undefined at line 42.')
    expect(r.source).toBe('default')
    expect(r.value).toBe(orphan.defaultWhenUnavailable)
    expect(r.probability).toBeNull()
  })

  it('resolveModel returns null rather than a substitute', () => {
    expect(engine.resolveModel({ ...spec('failure'), calibrated: {} })).toBeNull()
  })
})

// ─── precedence ────────────────────────────────────────────────────────────

describe('decisions: precedence', () => {
  const both = {
    id: 'precedence',
    question: 'This text reports that a build succeeded.',
    contrast: 'This text reports that a build failed.',
    cues: [/\bdecided\b/i],
    vetoes: [/\?\s*$/],
    calibrated: {},
    defaultWhenUnavailable: false,
  }

  it('a veto answers false even when a cue also fires', async () => {
    // "Have we decided?" contains a commitment cue and is not a commitment.
    const r = await engine.decide(both, 'Have we decided?')
    expect(r.source).toBe('veto')
    expect(r.value).toBe(false)
  })

  it('a cue answers true without touching the model', async () => {
    const r = await engine.decide(both, 'We decided to keep the native API.')
    expect(r.source).toBe('cue')
    expect(r.value).toBe(true)
    expect(r.probability).toBeNull()
  })

  it('the extractor rejects a question that contains a commitment cue', async () => {
    // The exact sentence the old one-line regex got wrong: "stick with" is a
    // commitment cue and this is a question. Measured with no model at all.
    const r = await rio.extractDecisions('Should we stick with Postgres for the audit log?', { noModel: true })
    expect(r.decisions).toEqual([])
    expect(r.vetoed).toBe(1)
  })

  it('the extractor keeps an option-free commitment', async () => {
    const r = await rio.extractDecisions('We settled on SQLite for the audit log.', { noModel: true })
    expect(r.decisions).toEqual(['We settled on SQLite for the audit log.'])
    expect(r.cues).toBe(1)
  })
})

// ─── extraction corpus ─────────────────────────────────────────────────────

describe('decisions: extraction corpus', () => {
  it('cue-only extraction keeps almost every decision and invents none', async () => {
    const opts = { noModel: true, limit: 99 }

    const fn: string[] = []
    for (const text of corpus.DECISIONS) {
      const r = await rio.extractDecisions(text, opts)
      if (!r.decisions.length) fn.push(text)
    }
    const fp: string[] = []
    for (const text of corpus.NON_DECISIONS) {
      const r = await rio.extractDecisions(text, opts)
      if (r.decisions.length) fp.push(text)
    }

    const tp = corpus.DECISIONS.length - fn.length
    const recall = tp / corpus.DECISIONS.length

    // The asymmetry is deliberate. A missed decision is dropped at compaction and
    // is never recoverable; a false positive costs a wasted line in the prompt.
    // So recall is high and precision is absolute.
    expect(fp, `false positives: ${fp.join(' | ')}`).toEqual([])
    expect(recall).toBeGreaterThanOrEqual(0.9)
    expect(tp).toBe(corpus.DECISIONS.length - 1) // one documented miss, below
    expect(fn).toEqual(['Right, so: rio owns memory, memory-hub reads the same DB.'])
  }, 60_000)

  it('the ask veto does not remove a real decision', async () => {
    // The extractor only consults `ask` for second-person sentences, and no
    // corpus decision is one. This guards the gate: if it widened, recall would
    // drop and this fails before the corpus test above (which skips the model)
    // would notice.
    const documented = new Set(['Right, so: rio owns memory, memory-hub reads the same DB.'])
    for (const text of corpus.DECISIONS) {
      if (documented.has(text)) continue
      const r = await rio.extractDecisions(text, { limit: 99 })
      expect(r.decisions.length, text).toBeGreaterThan(0)
    }
  }, 120_000)

  it('a realistic turn yields exactly its decisions', async () => {
    const turn = [
      'I read the three files and the gate logic is in `gate.ts`.',
      'The footer vanished because the scrollbox wrapped the whole column.',
      'We settled on the native dialog.select API for this menu.',
      'Should we also drop the custom JSX?',
      'From now on the menu keeps its footer inside the dialog.',
      'All 47 tests pass.',
      'We could also cache the verdicts.',
      'Final call: no new dependency, use the existing embedder.',
    ].join(' ')

    const r = await rio.extractDecisions(turn, { noModel: true })
    expect(r.considered).toBe(8)
    expect(r.decisions).toEqual([
      'We settled on the native dialog.select API for this menu.',
      'From now on the menu keeps its footer inside the dialog.',
      'Final call: no new dependency, use the existing embedder.',
    ])
    // the question and the option were rejected, not silently missed
    expect(r.vetoed).toBe(2)
  })
})

// ─── sentence segmentation ─────────────────────────────────────────────────

describe('decisions: sentence segmentation', () => {
  it('does not split on a filename, a decimal, or a dotted path', () => {
    // Splitting on /[.!?]+/ used to shred these into fragments, each of which
    // could match a cue by accident.
    const one = 'Edit tui.tsx and keep 0.82 for the threshold, then write .opencode/state/keep.json now.'
    expect(rio.sentences(one)).toEqual([one])
  })

  it('does split two real sentences', () => {
    const out = rio.sentences('We shipped the rewrite. All 47 tests pass.')
    expect(out).toHaveLength(2)
    expect(out[0]).toBe('We shipped the rewrite.')
    expect(out[1]).toBe('All 47 tests pass.')
  })

  it('drops short fragments and fenced code', () => {
    // A heading or a code block is not a sentence, and scoring one is noise.
    const out = rio.sentences('### Notes\n\n```\nwe decided to ship it\n```\n\nWe settled on the native API.')
    expect(out).toEqual(['We settled on the native API.'])
  })
})

// ─── parity with the prompt-queue gate ─────────────────────────────────────

describe('decisions: hypothesis parity with the prompt-queue gate', () => {
  it('the duplicated hypotheses and threshold still agree', () => {
    // `decisions.ts` cannot import a plugin, so it duplicates the strings. A
    // silent divergence would mean two "ask" classifiers with different
    // behaviour and one shared name.
    expect(spec('ask').question).toBe(cls.ASK_HYPOTHESIS)
    expect(spec('ask').contrast).toBe(cls.REPORT_HYPOTHESIS)
    expect(spec('ask').calibrated[rt.REQUIRED_MODELS.classifier]).toBe(cls.ASK_THRESHOLD)
  })
})

// ─── calibration ───────────────────────────────────────────────────────────

const calibrationIds = ['failure', 'asksChoice', 'ask'] as const

describe('decisions: model-backed calibration', () => {
  it('every calibrated threshold names a model the runtime declares', () => {
    // A threshold keyed by a typo is a decision that silently never consults the
    // model and always returns its default — the worst kind of passing test.
    const known = new Set<string>([
      ...Object.values(rt.REQUIRED_MODELS),
      ...Object.values(rt.OPTIONAL_MODELS).map((m: any) => m.id),
    ])
    for (const id of calibrationIds) {
      const models = Object.keys(spec(id).calibrated)
      expect(models.length, id).toBeGreaterThan(0)
      for (const model of models) expect(known.has(model), `${id}: ${model}`).toBe(true)
    }
  })

  for (const id of calibrationIds) {
    const model = engine.resolveModel(spec(id))
    it.skipIf(!model)(`${id} separates its calibration set on ${model ?? 'the cached model'}`, async () => {
      const set = (corpus.CALIBRATION as Record<string, { pos: readonly string[]; neg: readonly string[] }>)[id]
      const threshold = spec(id).calibrated[model!]

      for (const text of set.pos) {
        const r = await engine.decide(spec(id), text)
        expect(r.source, `pos: ${text}`).toBe('model')
        expect(r.value, `pos: ${text} p=${r.probability?.toFixed(3)} thr=${threshold}`).toBe(true)
      }
      for (const text of set.neg) {
        const r = await engine.decide(spec(id), text)
        expect(r.source, `neg: ${text}`).toBe('model')
        expect(r.value, `neg: ${text} p=${r.probability?.toFixed(3)} thr=${threshold}`).toBe(false)
      }
    }, 180_000)
  }

  it.skipIf(!engine.resolveModel(spec('ask')))('the ask threshold misreads a bare preference statement', async () => {
    // Recorded, not fixed. The threshold is the gate's (0.817), measured on turn
    // tails; a preference statement scores above it. rio never asks the model
    // about this sentence because it has no second-person address, which is the
    // designed containment. Asserting it here means a future "make it stricter"
    // change has to confront the trade instead of quietly breaking the gate.
    const r = await engine.decide(spec('ask'), corpus.ASK_KNOWN_FALSE_POSITIVE)
    expect(r.source).toBe('model')
    expect(r.value).toBe(true)
  }, 180_000)

  it('answers an ad-hoc question without a registered decision', async () => {
    // The point of the tool: a question the registry does not cover is still a
    // local yes/no, not an inference request.
    const r = await engine.decideAdhoc(
      'adhoc',
      'This text reports that a build succeeded.',
      'This text reports that a build failed.',
      'The build failed with exit code 1.',
    )
    if (r.source === 'default') {
      // No model cached in this environment — the contract is "no verdict".
      expect(r.value).toBeNull()
      return
    }
    expect(r.source).toBe('model')
    expect(r.value).toBe(false)
    expect(r.probability).not.toBeNull()
  }, 120_000)

  it('an ad-hoc question with no text is empty, not defaulted', async () => {
    const r = await engine.decideAdhoc('adhoc', 'q', 'c', '   ')
    expect(r.source).toBe('empty')
    expect(r.value).toBeNull()
  })
})

// ─── integration with rio ──────────────────────────────────────────────────

describe('decisions: rio integration', () => {
  it('the extractor returns the accounting the caller logs', async () => {
    // `index.ts` writes `considered` / `vetoed` into the savings log; a mismatch
    // between what it reports and what happened makes the log useless.
    const r = await rio.extractDecisions('We could switch. Should we switch? We settled on q8.', {
      noModel: true,
    })
    expect(r.decisions).toEqual(['We settled on q8.'])
    expect(r.considered).toBe(3)
    expect(r.askConsulted).toBe(false)
    expect(r.cues + r.vetoed).toBeLessThanOrEqual(r.considered)
  })

  it('the model budget bounds how many ask calls a turn can make', async () => {
    // These sentences carry a commitment cue *and* second-person address — the
    // only shape that reaches the `ask` call. With the budget at zero the model
    // must not be consulted at all, and the decisions must still be extracted.
    const many = Array.from({ length: 8 }, (_, i) => `We decided that you should keep option ${i} as the plan.`).join(' ')
    const r = await rio.extractDecisions(many, { modelBudget: 0 })
    expect(r.askConsulted).toBe(false)
    expect(r.decisions.length).toBeGreaterThan(0)
  }, 60_000)
})
