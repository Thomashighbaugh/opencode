/**
 * decisions.ts — extract the decisions a turn made, so compaction can preserve
 * them verbatim.
 *
 * ── Why this replaced the one-line regex ──────────────────────────────────
 *
 * The previous extractor was a single word list (`decid|decision|agreed|
 * resolved|chose|selected|will use|approve|confirm`) matched anywhere in a
 * sentence. It failed in both directions on real output:
 *
 *   false positives  "I resolved the merge conflict"          (work, not a decision)
 *                    "confirm the build passes before pushing"  (an instruction)
 *                    "decision extraction is a heuristic"      (a topic)
 *   false negatives  "Going with q8 for every model."
 *                    "From now on the gate is advisory."
 *                    "Final call: no new dependency."
 *                    "Use bun, not npm."
 *
 * A missed decision is the dangerous direction: it is silently dropped at
 * compaction and never recoverable. So the cue set below is written for
 * precision first and then widened deliberately, and the residue — a commitment
 * cue on a sentence that may actually be a question — is put to the local `ask`
 * decision rather than guessed at.
 *
 * ── Why the model is not the primary signal ───────────────────────────────
 *
 * Measured, not assumed. Zero-shot NLI cannot separate "committed" from
 * "reported": across five framings on a 30/30 corpus it scored AUC 0.37–0.75,
 * and the best-looking framing (AUC 0.97) was an artefact of a balanced toy set.
 * Stance is not an entailment relation. So the model is used for the one thing
 * it measurably does well — detecting that a sentence is a question — and the
 * commitment signal stays in cues, where it is auditable and free.
 *
 * See `skills/vectorize-context/scripts/decisions.ts` for the measured table.
 */

import { DECISIONS, decide } from '../../../skills/vectorize-context/scripts/decisions.ts'

/**
 * Commitment cues. A hit means "this sentence settles something".
 *
 * Each entry earns its place against the corpus in
 * `tests/global/fixtures/decision-corpus.ts`; a cue that only fires on the
 * sentence that motivated it is a cue that will misfire on the next model's
 * phrasing.
 */
const STRONG_CUES: RegExp[] = [
  // "Decision:", "Decided against X", "Approved: …"
  /^\s*(?:decision|decided|agreed|approved|settled|resolved)\b\s*[:\-—]/i,
  /^\s*(?:decided|agreed|approved|settled)\b/i,
  // "let's commit", "let's use", "let's ship"
  /\blet'?s\s+(?:use|go|keep|drop|switch|stick|standardize|adopt|move|remove|rename|commit|treat|hold|delete|ship|not)\b/i,
  // "we agreed", "I chose", "the team decided"
  /\b(?:we|i|the team|team)\b[^.!?]{0,60}\b(?:agreed?|decided?|settled|chose|chosen|approved?|committed)\b/i,
  // "going with", "went with"
  /\b(?:go|going|went)\s+with\b/i,
  // "stick with", "sticking with"
  /\bstick(?:ing)?\s+with\b/i,
  // "standardizing on"
  /\bstandardiz(?:e|es|ing)\s+on\b/i,
  // "from now on"
  /\bfrom\s+now\s+on\b/i,
  /\bfinal\s+call\b/i,
  /\blocking\s+in\b/i,
  // "the default is", "our policy is", "the plan is"
  /\b(?:the|our)\s+(?:default|policy|plan|decision)\s+is\b/i,
  // "No new dependency"
  /\bno\s+new\s+(?:dep|deps|dependency|dependencies)\b/i,
  // "we will use", "I'll keep", "we're dropping"
  /\b(?:we|i|the team)\b[^.!?]{0,30}\bwill\s+(?:use|go|keep|drop|switch|stick|standardize|adopt|move|remove|rename|commit|treat|hold|not)\b/i,
  /\b(?:i|we)'(?:ll|re)\s+(?:use|go|keep|drop|switch|stick|standardize|adopt|move|remove|rename|commit|treat|hold|not|going|keeping|dropping|switching|using)\b/i,
  /\bgoing\s+to\s+(?:use|keep|go|switch|drop|adopt|move|rename|stick|treat|hold)\b/i,
  // "switch to", "renaming the", "drop the V1"
  /\bswitch(?:ing|ed)?\s+(?:the|to)\b/i,
  /\brenam(?:e|es|ing)\b/i,
  /\bdropp?(?:ing|ed|s)?\s+(?:the|v1)\b/i,
  // "use bun, not npm" / "keep X rather than Y"
  /\b(?:use|adopt|keep|switch|go)\b[^.!?]{0,50}\b(?:instead\s+of|rather\s+than|not)\b/i,
  // "I'd rather hold the turn than fire the queue"
  /\brather\b[^.!?]{0,50}\bthan\b/i,
]

/**
 * Sentences that look like a decision but are not one: an option, a
 * hypothetical, an instruction, or an actual question. Checked *before* the
 * cues, because "Should we stick with Postgres?" contains "stick with".
 */
const VETOES: RegExp[] = [
  /\?\s*$/,
  /\b(?:could|would|might|may)\b/i, // possibility, not commitment
  /\b(?:one|an?)\s+(?:option|alternative|approach|possibility)\b/i,
  /\bif\s+we\b/i,
  /\b(?:do|would|should|shall)\s+you\b/i,
  /\bshall\s+i\b/i,
  /\blet\s+me\s+know\b/i,
  /\bwhich\s+(?:one|of|do|would|should)\b/i,
  /\b(?:maybe|perhaps|possibly)\b/i,
]

/** Strip fenced code, inline code, bullets, headings, links. */
function prose(text: string): string {
  return String(text ?? '')
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`[^`\n]*`/g, ' ')
    .replace(/^\s*[-*+]\s+/gm, '')
    .replace(/^\s*#{1,6}\s+/gm, '')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/[*_~]/g, '')
}

/**
 * Sentence segmentation that survives code identifiers and decimals.
 *
 * Splitting on `[.!?]+` (what this used to do) shreds `tui.tsx`,
 * `.opencode/state`, and `0.82` into fragments, none of which is a sentence and
 * any of which could match a cue by accident.
 */
export function sentences(text: string): string[] {
  return prose(text)
    .split(/(?<=[.!?])\s+(?=["'(]?[A-Z])|\n{2,}/)
    .map((s) => s.trim())
    .filter((s) => s.length >= 15 && /[a-z]/i.test(s))
}

export interface DecisionExtraction {
  decisions: string[]
  /** Candidates examined. */
  considered: number
  /** Accepted on a cue. */
  cues: number
  /** Rejected by a veto, including the `ask` decision. */
  vetoed: number
  /** Whether the `ask` decision was consulted for this turn. */
  askConsulted: boolean
}

export interface ExtractOptions {
  /** Maximum sentences returned. */
  limit?: number
  /** Maximum `ask` decisions per turn. Bounds latency on a long output. */
  modelBudget?: number
  /** Skip the model entirely. */
  noModel?: boolean
}

/**
 * Extract decisions from a turn's output.
 *
 * Order per sentence: veto → cue → (residue only) `ask`.
 *
 * The `ask` call is reached only when a cue fired and nothing vetoed. That is
 * the narrow band where a commitment marker appears in a sentence that might
 * still be a question — short enough to be worth a bounded model call, and
 * otherwise invisible to the cues.
 */
export async function extractDecisions(text: string, opts: ExtractOptions = {}): Promise<DecisionExtraction> {
  const limit = opts.limit ?? 5
  const budget = opts.modelBudget ?? 4
  const out: string[] = []

  let considered = 0
  let cues = 0
  let vetoed = 0
  let used = 0
  let askConsulted = false

  for (const sentence of sentences(text)) {
    if (out.length >= limit) break
    considered++

    // A hard veto is free — no model, no doubt.
    if (VETOES.some((re) => re.test(sentence))) {
      vetoed++
      continue
    }
    if (!STRONG_CUES.some((re) => re.test(sentence))) continue

    // A commitment cue fired and no pattern vetoed it. Only now is the sentence
    // ambiguous enough to be worth asking whether it is really a question.
    //
    // The `ask` decision is calibrated on a turn *tail*, where a question is
    // expected, so on a bare declarative it over-reads (measured: it scored
    // "This module scores a premise against a hypothesis" as an ask at 0.91).
    // Restricting the call to second-person address — the one shape that actually
    // asks something of the reader — keeps the model on the cases it is good at.
    if (!opts.noModel && used < budget && /\b(?:you|your)\b/i.test(sentence)) {
      const verdict = await decide(DECISIONS.ask, sentence)
      if (verdict.value === true) {
        askConsulted = true
        used++
        vetoed++
        continue
      }
      if (verdict.source === 'model') {
        askConsulted = true
        used++
      }
    }

    cues++
    out.push(sentence)
  }

  return { decisions: out, considered, cues, vetoed, askConsulted }
}
