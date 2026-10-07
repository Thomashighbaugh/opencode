/**
 * classifier.ts — "did this turn ask the user something?"
 *
 * The prompt-queue gate's use of the shared zero-shot primitive
 * (`skills/vectorize-context/scripts/zero-shot.ts`). This file owns the
 * gate-specific half: the two hypotheses, the measured threshold, and the
 * tighten-only reconciliation. The mechanics — model loading, the per-hypothesis
 * forward pass, the entailment-label index — live in the primitive.
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

import { entailmentScores, sigmoid, ZERO_SHOT_MODEL_ID } from '../../skills/vectorize-context/scripts/zero-shot.ts'

/**
 * Kept for the gate's diagnostics and the documented env override. The value now
 * originates in the shared primitive; re-exported under the name the gate and
 * `.documentation/onnx-runtime.md` already use.
 */
export const CLASSIFIER_MODEL_ID = ZERO_SHOT_MODEL_ID

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

  // Both hypotheses in one primitive call: one model load, two forward passes.
  const scores = await entailmentScores(tail, [ASK_HYPOTHESIS, REPORT_HYPOTHESIS])
  if (!scores) return null

  // The LOGIT DIFFERENCE, not a ratio of probabilities. Both entailment scores
  // sit near zero for most turns, so p(ask)/(p(ask)+p(report)) is a ratio of two
  // tiny numbers and reads as confident even when the model has no idea.
  return sigmoid(scores[0] - scores[1])
}

/**
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
