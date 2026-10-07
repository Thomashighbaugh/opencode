/**
 * zero-shot.ts — a generic zero-shot text classifier over a local ONNX model.
 *
 * One primitive: score a piece of text against a set of English hypotheses and
 * return how strongly the text *entails* each. The label lives in the caller as
 * English, so it can be edited when it is wrong — which is the whole reason this
 * uses NLI rather than a classifier trained for one question.
 *
 * ── Why zero-shot NLI rather than a trained classifier ─────────────────────
 *
 * The text these callers classify is whatever a model happened to produce, and
 * that phrasing distribution moves every time the model, prompt, or task
 * changes. Anything trained on a fixed corpus ages into a false-negative
 * generator: it keeps passing the examples it was trained on while missing the
 * new way the same thing gets said. An NLI model scores the *hypothesis* against
 * the *premise* at inference time, so a new question is a new English string.
 *
 * `Xenova/mobilebert-uncased-mnli` is used for the same reason the embedder uses
 * bge-small: small, int8, fast enough to sit behind a keystroke.
 *
 * ── Contract ───────────────────────────────────────────────────────────────
 *
 * **Returns `null`, never a fabricated score, when the model is unavailable.**
 * Every caller must treat `null` as "no opinion". Returning 0 would be a claim;
 * absence of evidence is not evidence.
 *
 * **Query-time loading never downloads** (`allowDownload` defaults to `false`).
 * A model fetch inside a turn is indistinguishable from a hang, and every caller
 * here has a cheaper fallback it can degrade to.
 *
 * Callers are responsible for the text they pass and the threshold they apply.
 * The gate (`plugins/prompt-queue/classifier.ts`) is the reference caller: it
 * scores only the *tail* of a turn, and it treats the model as advisory — able
 * to add a hold, never to remove one.
 */

import { loadModel, REQUIRED_MODELS } from './onnx-runtime.ts'

/**
 * Model id for the classifier.
 *
 * `ZERO_SHOT_ONNX_MODEL` is the generic override; `CLASSIFIER_ONNX_MODEL` is kept
 * because it is the name the prompt-queue gate shipped under and is documented in
 * `.documentation/onnx-runtime.md`.
 */
export const ZERO_SHOT_MODEL_ID =
  process.env.ZERO_SHOT_ONNX_MODEL || process.env.CLASSIFIER_ONNX_MODEL || REQUIRED_MODELS.classifier

export interface ZeroShotOptions {
  /** Override the model id (defaults to `ZERO_SHOT_MODEL_ID`). */
  modelId?: string
  /** Query-time default is `false`; pass `true` only from an index-time caller. */
  allowDownload?: boolean
  /** Tokenizer truncation length. 256 is enough for a title + lead or a turn tail. */
  maxLength?: number
  dtype?: 'q8' | 'fp16' | 'fp32'
}

/**
 * Raw entailment logits, one per hypothesis, in the order given.
 *
 * Raw logits rather than probabilities because a caller may want a *difference*
 * between two hypotheses (the gate's ask-vs-report margin), and turning each
 * into a sigmoid first destroys the margin that difference is measuring.
 *
 * Returns `null` on any failure — no model, no session, OOM, malformed output.
 */
export async function entailmentScores(
  text: string,
  hypotheses: string[],
  opts: ZeroShotOptions = {},
): Promise<number[] | null> {
  const premise = String(text ?? '').trim()
  if (!premise || !hypotheses.length) return null

  try {
    const { tokenizer, model } = await loadModel(opts.modelId || ZERO_SHOT_MODEL_ID, {
      allowDownload: opts.allowDownload ?? false,
      dtype: opts.dtype,
    })
    const idx = entailmentIndex(model)
    const maxLength = opts.maxLength ?? 256

    // One forward pass per hypothesis, each with the premise alone as the first
    // sequence. Passing two hypotheses as a `text_pair` list is invalid — `text`
    // and `text_pair` must be the same length — and scoring one hypothesis
    // against nothing is what made the first version of the gate's classifier
    // return ~1.0 for every input.
    const out: number[] = []
    for (const hypothesis of hypotheses) {
      const enc = await tokenizer([premise], {
        text_pair: [hypothesis],
        padding: true,
        truncation: true,
        max_length: maxLength,
      })
      const { logits } = await model(enc)
      const dims = logits.dims as number[]
      const n = dims[dims.length - 1]
      if (n <= idx) return null
      out.push(Number((logits.data as Float32Array | Float64Array)[idx]))
    }
    return out
  } catch {
    // No model, no session, OOM — all degrade to the caller's fallback.
    return null
  }
}

/**
 * Independent sigmoid probability per hypothesis, keyed by the hypothesis string.
 *
 * Each score is `sigmoid(entailment logit)` — a per-label probability, not a
 * softmax over labels. Callers that need to compare labels should use
 * `entailmentScores` and take the difference of the raw logits instead.
 */
export async function classify(
  text: string,
  hypotheses: string[],
  opts: ZeroShotOptions = {},
): Promise<Record<string, number> | null> {
  const scores = await entailmentScores(text, hypotheses, opts)
  if (!scores) return null
  const out: Record<string, number> = {}
  hypotheses.forEach((h, i) => {
    out[h] = sigmoid(scores[i])
  })
  return out
}

/**
 * The hypothesis with the highest entailment logit, or `null` if unavailable.
 *
 * Convenience for callers that want a single label from a mutually-exclusive set.
 * A thin wrapper over `entailmentScores` so it shares the model session and the
 * null-on-unavailable contract.
 */
export async function bestHypothesis(
  text: string,
  hypotheses: string[],
  opts: ZeroShotOptions = {},
): Promise<{ label: string; score: number; margin: number } | null> {
  const scores = await entailmentScores(text, hypotheses, opts)
  if (!scores) return null
  let best = 0
  for (let i = 1; i < scores.length; i++) if (scores[i] > scores[best]) best = i
  const sorted = [...scores].sort((a, b) => b - a)
  const margin = sorted.length > 1 ? sorted[0] - sorted[1] : sorted[0]
  return { label: hypotheses[best], score: sigmoid(scores[best]), margin }
}

/**
 * Which logit is entailment.
 *
 * Not assumed. `Xenova/mobilebert-uncased-mnli` orders its labels
 * `ENTAILMENT, NEUTRAL, CONTRADICTION` — the reverse of the MNLI convention
 * everyone carries in their head — so the conventional index 1 reads the
 * *neutral* score as entailment, which is how a first pass scored every input
 * above 0.93.
 */
function entailmentIndex(model: any): number {
  const map = model?.config?.id2label as Record<string, string> | undefined
  if (map) {
    const found = Object.entries(map).find(([, v]) => /entail/i.test(String(v)))
    if (found) return Number(found[0])
  }
  return 1
}

export function sigmoid(x: number): number {
  return 1 / (1 + Math.exp(-x))
}
