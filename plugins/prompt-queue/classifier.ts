/**
 * classifier.ts — "did this turn ask the user something?"
 *
 * A zero-shot natural-language-inference pass over the tail of an assistant turn,
 * used by the [prompt-queue gate](gate.ts) to decide whether a queued prompt may
 * run.
 *
 * ── Why zero-shot NLI rather than a classifier trained for this ───────────────
 *
 * The gate's input is an assistant turn whose phrasing is whatever the model
 * happened to produce. The phrasing distribution moves every time the model,
 * prompt, or task changes, so anything trained on a fixed corpus of "questions"
 * ages into a false-negative generator: it keeps passing the examples it was
 * trained on while missing the new way the same thing gets asked. An NLI model
 * scores the *hypothesis* against the *premise* at inference time, so the label
 * lives in this file as English and can be edited when it is wrong.
 *
 * `Xenova/mobilebert-uncased-mnli` is used for the same reason the embedder uses
 * bge-small: small, int8, fast enough to sit behind a keystroke.
 *
 * ── What it is allowed to do ────────────────────────────────────────────────
 *
 * **Advisory only.** It never decides on its own — it *adjusts* the regex gate:
 *
 *   - regex holds, model does not → still holds. The model's silence never
 *     releases a question.
 *   - regex releases, model holds → **holds**. This is the whole value: catching
 *     the ask the phrase list does not contain.
 *
 * So the classifier can only make the gate more conservative, never less. A model
 * that is confidently wrong in that direction costs a turn of latency; the same
 * confidence in the other direction would bury a question the user is waiting on.
 */

import { loadModel, REQUIRED_MODELS } from '../../skills/vectorize-context/scripts/onnx-runtime.ts'

export const CLASSIFIER_MODEL_ID = process.env.CLASSIFIER_ONNX_MODEL || REQUIRED_MODELS.classifier

/**
 * The two hypotheses, as English, in this file rather than in the model.
 *
 * `enterfact` is the entailment head we want: "does the premise entail that the
 * author is asking?" Contradiction and neutral are both non-asks for our purposes.
 */
/**
 * Hypotheses, chosen by measurement rather than taste.
 *
 * Three framings were benchmarked against ten hand-labelled turns. The natural
 * one — "The author is asking the reader a question…" — separated the obvious
 * cases but scored a *problem report* ("There are two problems: the parser and
 * the schema") barely above a genuine completion, leaving no usable margin. These
 * template-shaped predicates put the problem report at -0.25 and the weakest real
 * ask at 3.45.
 *
 * The margin is the point. The classifier may only add holds, so a framing that is
 * merely usually-right turns ordinary reporting into a held turn, and the queue
 * starts to feel stuck.
 */
export const ASK_HYPOTHESIS =
  'This example is a request for the reader to answer a question.'
export const REPORT_HYPOTHESIS =
  'This example is a report of completed work.'

/** Only this much of the turn is scored — the conclusion, not the whole report. */
const TAIL_CHARS = 600

/**
 * Probability that the tail is an ask.
 *
 * Returns `null` when the model is unavailable, which every caller must treat as
 * "no opinion". Returning 0 would be a claim; absence of evidence is not evidence.
 */
export async function askProbability(text: string): Promise<number | null> {
  const tail = String(text ?? '').trim().slice(-TAIL_CHARS)
  if (!tail) return null
  try {
    // Query-time: never download. A model fetch inside a turn is indistinguishable
    // from a hang, and the regex gate is a perfectly good fallback.
    const { tokenizer, model } = await loadModel(CLASSIFIER_MODEL_ID, { allowDownload: false })

    // One forward pass per hypothesis, each with the premise alone as the first
    // sequence. Passing two hypotheses as a `text_pair` list is invalid — `text`
    // and `text_pair` must be the same length — and scoring one hypothesis
    // against nothing is what made the first version of this return ~1.0 for
    // every input.
    const entailment = async (hypothesis: string): Promise<number | null> => {
      const enc = await tokenizer([tail], {
        text_pair: [hypothesis],
        padding: true,
        truncation: true,
        max_length: 256,
      })
      const { logits } = await model(enc)
      const dims = logits.dims as number[]
      const n = dims[dims.length - 1]
      if (n < 2) return null
      const idx = entailmentIndex(model)
      return Number((logits.data as Float32Array | Float64Array)[idx])
    }

    const ask = await entailment(ASK_HYPOTHESIS)
    const report = await entailment(REPORT_HYPOTHESIS)
    if (ask === null || report === null) return null

    // The LOGIT DIFFERENCE, not a ratio of probabilities. Both entailment scores
    // sit near zero for most turns, so p(ask)/(p(ask)+p(report)) is a ratio of two
    // tiny numbers and reads as confident even when the model has no idea.
    return sigmoid(ask - report)
  } catch {
    // No model, no session, OOM — all degrade to the regex gate.
    return null
  }
}

/**
 * Which logit is entailment.
 *
 * Not assumed. This checkpoint orders its labels `ENTAILMENT, NEUTRAL,
 * CONTRADICTION` — the reverse of the MNLI convention everyone carries in their
 * head — so the conventional index 1 reads the *neutral* score as entailment,
 * which is how a first pass scored every input above 0.93.
 */
function entailmentIndex(model: any): number {
  const map = model?.config?.id2label as Record<string, string> | undefined
  if (map) {
    const found = Object.entries(map).find(([, v]) => /entail/i.test(String(v)))
    if (found) return Number(found[0])
  }
  return 1
}

function sigmoid(x: number): number {
  return 1 / (1 + Math.exp(-x))
}/**
 * Above this, the classifier may hold a turn the regex released.
 *
 * `sigmoid(1.5) ≈ 0.82`. The measured separation on ten labelled turns put the
 * weakest real ask at 3.45 and the strongest false-positive-looking completion at
 * -0.25, so 1.5 sits in the middle of a 3.7-wide gap rather than near a decision
 * boundary. A threshold near 0.5 would hold ordinary reporting and make the queue
 * feel stuck — which is the failure mode this whole gate is designed against.
 */
export const ASK_THRESHOLD = 0.817

export interface ClassifierVerdict {
  available: boolean
  probability: number | null
  holds: boolean
}

/**
 * Combine the model's opinion with the regex verdict.
 *
 * Only ever tightens. `regexHolds === false && holds === true` is the entire
 * reason this module exists; the other three combinations are pass-through.
 */
export function reconcile(probability: number | null, regexHolds: boolean): ClassifierVerdict {
  if (probability === null) return { available: false, probability: null, holds: regexHolds }
  const modelHolds = probability >= ASK_THRESHOLD
  return { available: true, probability, holds: regexHolds || modelHolds }
}

function softmax(xs: number[]): number[] {
  const max = Math.max(...xs)
  const exps = xs.map((x) => Math.exp(x - max))
  const sum = exps.reduce((a, b) => a + b, 0)
  return exps.map((e) => e / sum)
}
