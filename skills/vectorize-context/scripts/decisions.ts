/**
 * decisions.ts — a local decision engine over the zero-shot NLI primitive.
 *
 * One declared decision = one affirmative question, one affirmative contrast,
 * and a threshold measured per model. `decide` answers it with the cheapest
 * signal that can answer it and says which signal that was.
 *
 * ── The option set is closed, by design ────────────────────────────────────
 *
 * A decision here is a choice between a **fixed** set of answers declared in
 * this file. There is deliberately no API for inventing the options at call
 * time: a pair of hypotheses typed by a caller has no fixed membership, no
 * corpus, and therefore no measurement behind its threshold — which would make
 * `source: 'model'` a fabricated verdict dressed as a measured one, the exact
 * failure the calibration rule below exists to prevent. A new question becomes a
 * new entry in `DECISIONS`, with its separation measured before it ships.
 *
 * `ask`, `failure` and `asksChoice` are two-option decisions, which is what the
 * callers need. The primitive generalises: an N-option decision scores every
 * option's hypothesis and takes the argmax, and belongs here as a registry entry
 * for the same reason — the options are part of the measurement, not part of the
 * call.
 *
 * ── Why a registry rather than a call site ─────────────────────────────────
 *
 * A decision made inline ("is this a failure?", "did the turn end on a
 * question?") is a prompt nobody can audit, and a threshold nobody can compare
 * against the last one. Declaring the decision here means the wording, the
 * threshold, and the corpus it was measured on live in one place. `decide`
 * returns `source` so a caller can see whether a verdict came from a cue, a
 * veto, the model, or a fallback — the distinction that turns "the classifier
 * is flaky" into a specific case to fix.
 *
 * ── The calibration rule (this is the important one) ───────────────────────
 *
 * `calibrated` maps a model id to the threshold measured **on that model**.
 * A model absent from the map is never consulted, and the decision falls back
 * to `defaultWhenUnavailable`. Thresholds are not portable between NLI heads:
 * `mobilebert-uncased-mnli` and `nli-deberta-v3-xsmall` order and scale the same
 * pair completely differently, so a threshold carried across models is a
 * fabricated verdict wearing a measured one's clothes.
 *
 * ── What was measured, and what was rejected ───────────────────────────────
 *
 * Two hypotheses separate reliably only when both are **affirmative and
 * mutually exclusive**. A hypothesis phrased as the negation of the other
 * ("This text does not contain a security risk") reads as thematic overlap and
 * collapses the margin — measured AUC 0.500 on `security` below. Saying "does
 * not X" in NLI is not the complement of X.
 *
 * Measured on `Xenova/nli-deberta-v3-xsmall`, six examples per class, using the
 * exact pairs registered below:
 *
 *   reports-a-failure         AUC 1.000   Δ pos 5.78..1.33  neg 0.64..-2.81   → 0.729
 *   asks-the-reader-to-choose AUC 1.000   Δ pos 4.50..5.95  neg 2.66..-1.58   → 0.973
 *   contains-a-security-risk  AUC 0.722   classes interleaved                 → not calibrated
 *   describes-a-made-decision AUC 0.972   narrower than it looks              → not calibrated
 *
 * The contrast choice is load-bearing, not cosmetic. For `asksChoice` the
 * obvious "This text tells the reader what to do" does not separate at all
 * (positives 0.68..2.48 against negatives 1.90..2.22), because a preference
 * statement also tells the reader what to do. "…reports a choice that was
 * already made" is the mutually exclusive claim, and it separates.
 *
 * That last row is the trap: on a small balanced set it looks separable, but on
 * realistic assistant output ("This text describes a decision that has already
 * been made" vs "…a possibility that has not been chosen") it measured AUC 0.60
 * across five framings. Stance — *committed* vs *reported* — is not an NLI
 * entailment relation, so `durableDecision` below is deliberately NOT
 * model-backed. Its callers use cues plus the `ask` veto instead.
 */

import { OPTIONAL_MODELS, REQUIRED_MODELS, isCached } from './onnx-runtime.ts'
import { entailmentScores, sigmoid } from './zero-shot.ts'

export type DecisionSource = 'cue' | 'veto' | 'model' | 'default' | 'empty'

export interface DecisionResult {
  /** `null` only for empty input. A boolean is always an answer. */
  value: boolean | null
  /** Which signal produced the answer. */
  source: DecisionSource
  /** Model probability, when the model was consulted. */
  probability: number | null
  /** The cue that fired, the veto that fired, or why the model was skipped. */
  evidence?: string
}

export interface DecisionSpec {
  id: string
  /** Affirmative hypothesis. Never "does not …". */
  question: string
  /** Affirmative, mutually exclusive contrast. Must be a different claim, not a negation. */
  contrast: string
  /** A hit answers `true` without the model. Free and instant. */
  cues?: RegExp[]
  /** A hit answers `false` without the model — an option, a question, a hypothetical. */
  vetoes?: RegExp[]
  /**
   * Measured threshold per model id. A model not listed here is never consulted.
   * `sigmoid(Δ)` at the midpoint of the measured separation.
   */
  calibrated: Record<string, number>
  /** Answer when no cue fired and no calibrated model is cached. */
  defaultWhenUnavailable: boolean
  /** Characters scored — the tail, not the whole document. */
  window?: number
}

/** The hypotheses the prompt-queue gate ships, duplicated here so this module
 *  does not import a plugin. `decisions.test.ts` asserts they still agree. */
const ASK_HYPOTHESIS = 'This example is a request for the reader to answer a question.'
const REPORT_HYPOTHESIS = 'This example is a report of completed work.'
/** Measured on mobilebert-uncased-mnli; see `plugins/prompt-queue/classifier.ts`. */
const ASK_THRESHOLD = 0.817

const MOBILEBERT = REQUIRED_MODELS.classifier
const DEBERTA = OPTIONAL_MODELS.nliLarge.id

/** Δ midpoint → probability, for the thresholds recorded below. */
const p = (delta: number) => Number(sigmoid(delta).toFixed(3))

export const DECISIONS = {
  /**
   * Does the text ask the reader a question? The one decision calibrated on the
   * *required* model, so it answers on a stock install with no optional model.
   */
  ask: {
    id: 'ask',
    question: ASK_HYPOTHESIS,
    contrast: REPORT_HYPOTHESIS,
    calibrated: { [MOBILEBERT]: ASK_THRESHOLD },
    defaultWhenUnavailable: false,
    window: 600,
  },

  /**
   * Does the text report a failure? Measured on `nli-deberta-v3-xsmall` over six
   * failures and six successes: positives Δ 5.78 .. 1.33, negatives Δ 0.64 ..
   * -2.81. Midpoint 0.987 → p 0.729, which sits 0.12 below the closest negative
   * and 0.06 above the weakest positive.
   *
   * Calibrated on the stronger head only. A missing optional model means no
   * verdict, not a mobilebert guess — mobilebert measured AUC 0.806 on this pair,
   * with the classes interleaved.
   */
  failure: {
    id: 'failure',
    question: 'This text reports a failure or an error.',
    contrast: 'This text reports that everything worked as expected.',
    calibrated: { [DEBERTA]: p(0.987) },
    defaultWhenUnavailable: false,
    window: 600,
  },

  /**
   * Does the text ask the reader to pick between options?
   *
   * The contrast matters more than the question here. The obvious
   * "This text tells the reader what to do" does NOT separate (positives
   * 0.68 .. 2.48 against negatives 1.90 .. 2.22) because a preference statement
   * both tells the reader what to do and is not an ask. "…reports a choice that
   * was already made" is mutually exclusive with asking, and separates at
   * positives 4.50 .. 5.95 against negatives 2.66 .. -1.58; midpoint 3.58 →
   * p 0.973.
   */
  asksChoice: {
    id: 'asksChoice',
    question: 'This text asks the reader to make a choice.',
    contrast: 'This text reports a choice that was already made.',
    calibrated: { [DEBERTA]: 0.973 },
    defaultWhenUnavailable: false,
    window: 600,
  },
} as const satisfies Record<string, DecisionSpec>

export type DecisionId = keyof typeof DECISIONS

/** Bounded result cache. Decisions repeat across turns and across compaction. */
const cache = new Map<string, DecisionResult>()
const CACHE_LIMIT = 500

const stats = { calls: 0, hits: 0, model: 0, cues: 0, vetoes: 0, defaults: 0 }

function key(id: string, modelId: string, text: string): string {
  let h = 5381
  for (let i = 0; i < text.length; i++) h = ((h << 5) + h + text.charCodeAt(i)) | 0
  return `${id}:${modelId}:${h}:${text.length}`
}

function firstMatch(patterns: RegExp[] | undefined, text: string): string | null {
  if (!patterns) return null
  for (const re of patterns) {
    const m = re.exec(text)
    if (m) return m[0]
  }
  return null
}

/**
 * The best cached model this decision has a measured threshold for.
 *
 * Order comes from the caller's `calibrated` map, so a spec can express a
 * preference simply by listing the stronger model first.
 */
export function resolveModel(spec: DecisionSpec): string | null {
  for (const modelId of Object.keys(spec.calibrated)) {
    if (isCached(modelId)) return modelId
  }
  return null
}

export interface DecideOptions {
  /** Skip the model entirely — for a hot path that must not pay for a session. */
  noModel?: boolean
}

/**
 * Answer one decision.
 *
 * Order is deliberate and each step is cheaper than the next:
 *   1. veto  — an option or an explicit question answers `false` for free
 *   2. cue   — a commitment marker answers `true` for free
 *   3. model — the cases the cues cannot see
 *   4. default — no calibrated model cached
 *
 * Vetoes run before cues because "Should we stick with Postgres?" contains a
 * commitment cue and is not a decision.
 */
export async function decide(
  spec: DecisionSpec,
  text: string,
  opts: DecideOptions = {},
): Promise<DecisionResult> {
  stats.calls++
  const raw = String(text ?? '').trim()
  if (!raw) return { value: null, source: 'empty', probability: null }

  const body = raw.length <= (spec.window ?? 600) ? raw : raw.slice(-(spec.window ?? 600))

  const veto = firstMatch(spec.vetoes, body)
  if (veto) {
    stats.vetoes++
    return { value: false, source: 'veto', probability: null, evidence: veto }
  }

  const cue = firstMatch(spec.cues, body)
  if (cue) {
    stats.cues++
    return { value: true, source: 'cue', probability: null, evidence: cue }
  }

  const modelId = opts.noModel ? null : resolveModel(spec)
  if (!modelId) {
    stats.defaults++
    return {
      value: spec.defaultWhenUnavailable,
      source: 'default',
      probability: null,
      evidence: opts.noModel ? 'model disabled by caller' : 'no calibrated model cached',
    }
  }

  const k = key(spec.id, modelId, body)
  const hit = cache.get(k)
  if (hit) {
    stats.hits++
    return hit
  }

  const scores = await entailmentScores(body, [spec.question, spec.contrast], { modelId })
  if (!scores) {
    stats.defaults++
    return { value: spec.defaultWhenUnavailable, source: 'default', probability: null, evidence: 'model unavailable' }
  }

  stats.model++
  const probability = sigmoid(scores[0] - scores[1])
  const result: DecisionResult = {
    value: probability >= spec.calibrated[modelId],
    source: 'model',
    probability,
    evidence: `${modelId} ≥ ${spec.calibrated[modelId]}`,
  }

  if (cache.size >= CACHE_LIMIT) cache.delete(cache.keys().next().value as string)
  cache.set(k, result)
  return result
}

export function decisionStats() {
  return { ...stats, cached: cache.size, models: { deberta: isCached(DEBERTA), mobilebert: isCached(MOBILEBERT) } }
}

/** Test seam. */
export function __resetDecisions(): void {
  cache.clear()
  for (const k of Object.keys(stats) as Array<keyof typeof stats>) stats[k] = 0
}
