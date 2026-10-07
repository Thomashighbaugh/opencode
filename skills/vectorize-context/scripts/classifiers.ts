/**
 * classifiers.ts — task-specific classifier heads over the local ONNX runtime.
 *
 * `zero-shot.ts` is the NLI primitive: it answers "does this text entail that
 * claim?". That is the right tool for *pragmatic* questions (is this an ask?
 * does this announce a replacement?) and the wrong tool for *factual-property*
 * questions (does this text contain a secret? is this a prompt injection?).
 *
 * That distinction was measured, not assumed. Asked via NLI, a natural-language
 * secret scored 0.219 — *below* an ordinary ADR at 0.388 — because entailment has
 * no mechanism for "contains X". The same question, asked of a token classifier
 * trained for it, is exactly what the model does. So property detection lives
 * here, on task-specific heads, and NLI stays in `zero-shot.ts`.
 *
 * Every function here follows the same contract as the rest of the runtime:
 * `null` when the model is unavailable (never a fabricated verdict), and
 * query-time loading never downloads.
 */

import { loadPipeline, OPTIONAL_MODELS } from './onnx-runtime.ts'

export interface TaskModelOptions {
  modelId?: string
  allowDownload?: boolean
}

/** A single-label sequence verdict (e.g. injection). */
export interface SequenceVerdict {
  label: string
  score: number
}

/**
 * Sequence classification over the injection head.
 *
 * Returns `null` when the model is absent or errors. The caller must treat that
 * as "no opinion", exactly like the NLI primitive — a missing model disables the
 * scan, it does not pass the content.
 */
export async function classifySequence(
  text: string,
  opts: TaskModelOptions = {},
): Promise<SequenceVerdict | null> {
  const premise = String(text ?? '').trim()
  if (!premise) return null
  try {
    const model = OPTIONAL_MODELS.injection
    const pipe = await loadPipeline(model.task, opts.modelId || model.id, {
      allowDownload: opts.allowDownload ?? false,
      cachedFile: model.cachedFile,
    })
    const out = await pipe(premise.slice(0, 2000), { topk: 1 })
    const top = Array.isArray(out) ? out[0] : out
    if (!top?.label) return null
    return { label: String(top.label), score: Number(top.score) }
  } catch {
    return null
  }
}

/**
 * True when a sequence verdict reads as an injection.
 *
 * The checkpoint's labels are not assumed: protectai's heads have shipped both
 * `INJECTION`/`LEGIT` and `LABEL_0`/`LABEL_1`, so the label is normalised to the
 * positive class by name first and by the conventional index second.
 */
export function isInjection(verdict: SequenceVerdict | null): boolean {
  if (!verdict) return false
  return /inject|malicious|label_1/i.test(verdict.label)
}

/** One entity span from a token-classification head. */
export interface EntitySpan {
  entity: string
  text: string
  start: number
  end: number
  score: number
}

/**
 * Named-entity / PII extraction over the token-classification head.
 *
 * `aggregation_strategy: 'simple'` merges BIO sub-tokens into word spans, which
 * is the part that is easy to get wrong by hand — hence the pipeline rather than
 * raw logits.
 */
export async function extractEntities(
  text: string,
  opts: TaskModelOptions = {},
): Promise<EntitySpan[] | null> {
  const src = String(text ?? '')
  if (!src.trim()) return null
  try {
    const model = OPTIONAL_MODELS.pii
    const pipe = await loadPipeline(model.task, opts.modelId || model.id, {
      allowDownload: opts.allowDownload ?? false,
      cachedFile: model.cachedFile,
    })
    const out = await pipe(src.slice(0, 4000), { aggregation_strategy: 'simple' })
    if (!Array.isArray(out)) return null
    return out.map((r: any) => ({
      entity: String(r.entity_group || r.entity || ''),
      text: String(r.word || r.text || ''),
      start: Number(r.start ?? -1),
      end: Number(r.end ?? -1),
      score: Number(r.score ?? 0),
    }))
  } catch {
    return null
  }
}

/**
 * PII / credential entity labels this head emits that warrant escalation.
 *
 * Only the classes that mean "do not commit this". A detected PERSON or
 * LOCATION is context, not a secret, and escalating on it would make the scan
 * cry wolf until it is ignored — the failure mode that kills a scanner.
 */
const SENSITIVE_ENTITIES = /password|credit_card|iban|bank|driver_license|ssn|social|tax|passport|id_card|secret|api_key/i

/** The spans in `spans` that are credentials or identity numbers. */
export function sensitiveSpans(spans: EntitySpan[] | null): EntitySpan[] {
  if (!spans) return []
  return spans.filter((s) => SENSITIVE_ENTITIES.test(s.entity))
}
