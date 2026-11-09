/** Local NLI/lexical classification. No LLM calls and no fabricated verdicts. */
import { entailmentScores } from "../../../skills/vectorize-context/scripts/zero-shot.ts"
import { isCached, REQUIRED_MODELS } from "../../../skills/vectorize-context/scripts/onnx-runtime.ts"
import type { Category } from "./db.ts"

const CATEGORY_HYPOTHESES: Array<[Category, string]> = [
  ["preference", "This is a user preference or style choice."],
  ["architecture", "This is an architectural decision or system design fact."],
  ["gotcha", "This is a pitfall, bug, or non-obvious failure mode."],
  ["pattern", "This is a reusable implementation pattern."],
  ["workflow", "This is a process, command, or workflow step."],
  ["constraint", "This is a hard constraint, limitation, or requirement."],
]

const KEYWORDS: Record<Category, RegExp> = {
  preference: /\b(prefer|always|never|style|convention|should use)\b/i,
  architecture: /\b(architecture|module|service|database|schema|interface|layer|design)\b/i,
  gotcha: /\b(gotcha|bug|pitfall|fails?|breaks?|workaround|race|leak|surprising)\b/i,
  pattern: /\b(pattern|approach|implement|idiom|template|reuse)\b/i,
  workflow: /\b(workflow|command|script|deploy|build|test|run)\b/i,
  constraint: /\b(must|required|cannot|limit|constraint|only|mandatory)\b/i,
}

export async function categorize(text: string): Promise<Category> {
  if (process.env.MEMORY_CLASSIFY !== "0" && isCached(REQUIRED_MODELS.classifier)) {
    try {
      const scores = await entailmentScores(text, CATEGORY_HYPOTHESES.map(([, h]) => h))
      if (scores?.length) {
        let best = 0
        for (let i = 1; i < scores.length; i++) if (scores[i] > scores[best]) best = i
        return CATEGORY_HYPOTHESES[best][0]
      }
    } catch {}
  }
  for (const [category, re] of Object.entries(KEYWORDS) as Array<[Category, RegExp]>) {
    if (re.test(text)) return category
  }
  return "pattern"
}

export type RelationType = "supports" | "contradicts" | "refines" | "depends_on" | "related_to" | "supersedes"

export async function classifyRelation(incoming: string, existing: string): Promise<RelationType> {
  if (process.env.MEMORY_CLASSIFY !== "0" && isCached(REQUIRED_MODELS.classifier)) {
    try {
      const hypotheses = [
        "The new statement is consistent with the existing statement.",
        "The new statement contradicts the existing statement.",
        "The new statement refines or narrows the existing statement.",
        "The new statement depends on the existing statement.",
        "The new statement replaces the existing statement.",
      ]
      const scores = await entailmentScores(`${incoming}\nExisting: ${existing}`, hypotheses)
      if (scores?.length) {
        let best = 0
        for (let i = 1; i < scores.length; i++) if (scores[i] > scores[best]) best = i
        if (best === 1) return "contradicts"
        if (best === 2) return "refines"
        if (best === 3) return "depends_on"
        if (best === 4) return "supersedes"
        if (best === 0) return "supports"
      }
    } catch {}
  }
  const lower = `${incoming}\n${existing}`.toLowerCase()
  if (/\b(instead of|replaces?|no longer|supersedes?|deprecated)\b/.test(lower)) return "supersedes"
  if (/\b(contradicts?|conflicts?|but actually|not true|wrong|opposite)\b/.test(lower)) return "contradicts"
  if (/\b(depends on|requires|needs)\b/.test(lower)) return "depends_on"
  if (/\b(refines?|clarifies?|extends?|narrows?)\b/.test(lower)) return "refines"
  if (/\b(supports?|confirms?|consistent)\b/.test(lower)) return "supports"
  return "related_to"
}

export type ClassifierInfo = { nli: boolean; models: typeof REQUIRED_MODELS }
export function classifierInfo(): ClassifierInfo {
  return { nli: isCached(REQUIRED_MODELS.classifier), models: REQUIRED_MODELS }
}
