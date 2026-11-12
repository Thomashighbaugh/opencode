/**
 * MemoryService — learn, recall, relate, forget.
 *
 * Shares the same .opencode/state/vector/memory.db target as the
 * memory-hub subcommands (capture, memory, session, vectorize, search,
 * consume). Rio and memory-hub operate on identical tables, so memories
 * created by either are visible to both.
 *
 * Embedding / rerank / classification reuse the local ONNX runtime from
 * skills/vectorize-context/scripts — no new model downloads, no network.
 */

import { MemoryDb, type Category, type Memory, type Origin, CATEGORIES } from "./db/memory.ts"
import { embedQuery, embedderInfo } from "../../../skills/vectorize-context/scripts/embedder.ts"
import { rerank } from "./rerank.ts"
import { entailmentScores } from "../../../skills/vectorize-context/scripts/zero-shot.ts"
import { isCached, REQUIRED_MODELS } from "../../../skills/vectorize-context/scripts/onnx-runtime.ts"
import { inspect } from "./privacy.ts"

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

const RELATION_HYPOTHESES = [
  "The new statement is consistent with the existing statement.",
  "The new statement contradicts the existing statement.",
  "The new statement refines or narrows the existing statement.",
  "The new statement depends on the existing statement.",
  "The new statement replaces the existing statement.",
]

type RelationType = "supports" | "contradicts" | "refines" | "depends_on" | "related_to" | "supersedes"

export type RecallHit = Memory & { score: number; stale: boolean }

export type LearnResult = {
  action: "inserted" | "reinforced"
  id: number
  category: Category
  memory: Memory
}

export class MemoryService {
  readonly db: MemoryDb
  readonly project: string

  constructor(directory: string, project?: string) {
    this.db = new MemoryDb(directory)
    this.project = project || "default"
  }

  close(): void {
    this.db.close()
  }

  // ── Learn ──────────────────────────────────────────────────────────

  async learn(input: {
    content: string
    title?: string
    category?: Category
    importance?: number
    confidence?: number
    project?: string | null
    workspace?: string | null
    agent?: string | null
    origin?: Origin | null
    isPrivate?: boolean
    files?: string[]
  }): Promise<LearnResult> {
    const inspected = await inspect(input.content)
    const category = input.category && (CATEGORIES as readonly string[]).includes(input.category)
      ? input.category
      : await this.categorize(inspected.text)

    let embedding: number[] | undefined
    let embeddingModel: string | undefined
    if (process.env.MEMORY_EMBED !== "0") {
      const meta = embedderInfo()
      embeddingModel = meta.key
      try {
        const v = await embedQuery(inspected.text)
        if (v && v.length) embedding = v
      } catch {}
    }

    const project = input.project === undefined ? this.project : input.project
    const result = this.db.addMemory({
      content: inspected.text,
      title: input.title,
      category,
      importance: input.importance,
      confidence: input.confidence,
      project,
      workspace: input.workspace,
      agent: input.agent,
      origin: input.origin ?? "agent-observation",
      isPrivate: input.isPrivate || inspected.private,
      files: input.files,
      embedding,
      embeddingModel,
    })

    if (embedding) {
      for (const near of this.db.vec(embedding, project, 5)) {
        if (near.id === result.id) continue
        const existing = this.db.get(near.id)
        if (!existing) continue
        const relation = await this.classifyRelation(inspected.text, existing.content)
        if (relation === "contradicts" || relation === "supersedes") {
          this.addRelation(result.id, existing.id, relation)
        }
      }
    }

    return { action: result.action, id: result.id, category, memory: result.memory }
  }

  // ── Recall ─────────────────────────────────────────────────────────

  async recall(opts: {
    query?: string
    project?: string | null
    limit?: number
    category?: Category
    semantic?: boolean
    includePrivate?: boolean
  }): Promise<RecallHit[]> {
    const limit = Math.max(1, Math.min(50, opts.limit ?? 10))
    const project = opts.project === undefined ? this.project : opts.project
    const query = (opts.query ?? "").trim()

    const lexical = query ? this.db.fts(query, project, 50) : []
    let semantic: Array<{ id: number; distance: number }> = []
    if (query && opts.semantic !== false && process.env.MEMORY_EMBED !== "0") {
      try {
        const qv = await embedQuery(query)
        if (qv && qv.length) {
          semantic = this.db.vec(qv, project, 50)
        }
      } catch {}
    }

    const fused = new Map<number, number>()
    lexical.forEach((hit, rank) => fused.set(hit.id, (fused.get(hit.id) ?? 0) + 1 / (60 + rank + 1)))
    semantic.forEach((hit, rank) => fused.set(hit.id, (fused.get(hit.id) ?? 0) + 1 / (60 + rank + 1)))

    let ids = [...fused.entries()].sort((a, b) => b[1] - a[1]).slice(0, 24).map(([id]) => id)
    if (!ids.length && !query) {
      ids = (this.db as any).db.query(
        `SELECT id FROM memories WHERE status='active' ${project ? "AND (project=? OR project IS NULL)" : ""}
         ORDER BY importance DESC, updated_at DESC LIMIT ?`,
      ).all(...(project ? [project, limit * 2] : [limit * 2])) as any[]
      ids = ids.map((r: any) => Number(r.id))
    }
    if (!ids.length) return []

    const docs = ids.map((id) => this.db.get(id)?.content ?? "")
    let scored: Array<{ id: number; score: number }> = ids.map((id) => ({ id, score: fused.get(id) ?? 0 }))
    if (query && docs.length > 1) {
      try {
        const reranked = rerank(query, docs)
        const byId = new Map(docs.map((d, i) => [ids[i], d]))
        scored = scored.map((s) => ({
          id: s.id,
          score: reranked.find((r) => r.document === byId.get(s.id))?.score ?? s.score,
        }))
        scored.sort((a, b) => b.score - a.score)
      } catch {}
    }

    const hits: RecallHit[] = []
    for (const s of scored.slice(0, limit)) {
      const m = this.db.get(s.id)
      if (!m) continue
      if (m.isPrivate && !opts.includePrivate) continue
      hits.push({ ...m, score: s.score, stale: Boolean(m.staleFlaggedAt) })
    }
    return hits
  }

  // ── Relations ──────────────────────────────────────────────────────

  addRelation(sourceId: number, targetId: number, type: RelationType): void {
    if (!this.db.db) return
    try {
      this.db.db.query(
        `INSERT INTO memory_relations (source_id, target_id, type, weight, created_at)
         VALUES (?,?,?,1.0,datetime('now'))
         ON CONFLICT(source_id, target_id, type) DO UPDATE SET weight = weight + 0.5`,
      ).run(sourceId, targetId, type)
    } catch {}
  }

  async classifyRelation(incoming: string, existing: string): Promise<RelationType> {
    if (process.env.MEMORY_CLASSIFY !== "0" && isCached(REQUIRED_MODELS.classifier)) {
      try {
        const scores = await entailmentScores(`${incoming}\nExisting: ${existing}`, RELATION_HYPOTHESES)
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
    if (/\b(contradicts?|conflicts?|but actually|not true|wrong|opposite|never)\b/.test(lower)) return "contradicts"
    if (/\b(depends on|requires|needs)\b/.test(lower)) return "depends_on"
    if (/\b(refines?|clarifies?|extends?|narrows?)\b/.test(lower)) return "refines"
    if (/\b(supports?|confirms?|consistent)\b/.test(lower)) return "supports"
    return "related_to"
  }

  forget(id: number): void {
    this.db.forget(id)
  }

  get(id: number): Memory | null {
    return this.db.get(id)
  }

  stats(project: string | null) {
    return this.db.stats(project)
  }

  // ── Categorize (keyword + optional NLI) ────────────────────────────

  private async categorize(text: string): Promise<Category> {
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
}
