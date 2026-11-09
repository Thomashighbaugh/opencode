import path from "node:path"
import { existsSync } from "node:fs"
import { MemoryDb, type Category, type Memory, type Origin, CATEGORIES } from "./db.ts"
import { embedOne, embedTexts, embeddingMeta } from "./embedding.ts"
import { rerank } from "./rerank.ts"
import { categorize, classifyRelation } from "./classify.ts"
import { inspect } from "./privacy.ts"
import { databasePath as opencodePath, openOpenCode, sessionParts } from "../../token-optimizer/src/db/opencode.ts"

export type RecallOptions = {
  query?: string
  project?: string | null
  limit?: number
  category?: Category
  semantic?: boolean
  includePrivate?: boolean
}

export type RecallHit = Memory & { score: number; stale: boolean }

export class MemoryService {
  readonly directory: string
  readonly project: string
  private _db: MemoryDb | null = null
  private lastPrompt = ""
  pendingPrompt = ""

  constructor(directory: string, project?: string) {
    this.directory = directory
    this.project = project || projectName(directory)
  }

  get db(): MemoryDb {
    if (!this._db) this._db = new MemoryDb(this.directory)
    return this._db
  }

  close() { this._db?.close(); this._db = null }

  async learn(input: {
    content: string
    title?: string
    category?: Category
    importance?: number
    confidence?: number
    project?: string | null
    files?: string[]
    origin?: Origin
    isPrivate?: boolean
    workspace?: string | null
    agent?: string | null
  }) {
    const inspected = await inspect(input.content)
    const category = input.category && CATEGORIES.includes(input.category) ? input.category : await categorize(inspected.text)
    const embedding = process.env.MEMORY_EMBED === "0" ? null : await embedOne(inspected.text)
    const project = input.project === undefined ? this.project : input.project
    let duplicate: Memory | null = null
    if (embedding) {
      const nearest = this.db.vec(embedding, project, 1)[0]
      if (nearest && nearest.distance <= 0.08) duplicate = this.db.get(nearest.id)
    }
    if (duplicate) {
      this.db.reinforce(duplicate.id)
      void (await classifyRelation(inspected.text, duplicate.content))
      return { action: "reinforced" as const, id: duplicate.id, category: duplicate.category, memory: this.db.get(duplicate.id)! }
    }
    const result = this.db.addMemory({
      content: inspected.text,
      title: input.title,
      category,
      importance: input.importance,
      confidence: input.confidence,
      project,
      workspace: input.workspace,
      agent: input.agent,
      files: input.files,
      origin: input.origin ?? "agent-observation",
      isPrivate: input.isPrivate || inspected.private,
      embedding: embedding ?? undefined,
      embeddingModel: embedding ? embeddingMeta().key : undefined,
    })
    if (embedding) {
      for (const near of this.db.vec(embedding, project, 5)) {
        if (near.id === result.id) continue
        const existing = this.db.get(near.id)
        if (!existing) continue
        const relation = await classifyRelation(inspected.text, existing.content)
        if (relation === "contradicts" || relation === "supersedes") {
          this.db.addConflict(existing.id, result.id, relation)
        }
      }
    }
    return { action: result.action, id: result.id, category, memory: result.memory }
  }

  async recall(opts: RecallOptions): Promise<RecallHit[]> {
    const limit = Math.max(1, Math.min(50, opts.limit ?? 10))
    const project = opts.project === undefined ? this.project : opts.project
    const query = (opts.query ?? "").trim()
    const lexical = query ? this.db.fts(query, project, 50) : []
    const semantic = query && opts.semantic !== false ? await embedOne(query) : null
    const vectors = semantic ? this.db.vec(semantic, project, 50) : []

    const fused = new Map<number, number>()
    lexical.forEach((hit, rank) => fused.set(hit.id, (fused.get(hit.id) ?? 0) + 1 / (60 + rank + 1)))
    vectors.forEach((hit, rank) => fused.set(hit.id, (fused.get(hit.id) ?? 0) + 1 / (60 + rank + 1)))

    let ids = [...fused.entries()].sort((a, b) => b[1] - a[1]).slice(0, 24).map(([id]) => id)
    if (!ids.length && !query) {
      ids = (this.db.db.query(
        `SELECT id FROM memories WHERE status='active' ${project ? "AND (project=? OR project IS NULL)" : ""}
         ORDER BY importance DESC, updated_at DESC LIMIT ?`,
      ).all(...(project ? [project, limit * 2] : [limit * 2])) as any[]).map((r) => Number(r.id))
    }
    if (!ids.length) return []

    let scores = ids.map((id) => fused.get(id) ?? 0)
    if (query && ids.length > 1) {
      try {
        const docs = ids.map((id) => this.db.get(id)?.content ?? "")
        scores = await rerank(query, docs)
      } catch {}
    }

    const hits: RecallHit[] = []
    ids.forEach((id, i) => {
      const m = this.db.get(id)
      if (!m) return
      if (opts.category && m.category !== opts.category) return
      if (m.isPrivate && !opts.includePrivate) return
      const importance = m.importance / 100
      const confidence = m.confidence / 20
      const stalePenalty = m.staleFlaggedAt ? 0.15 : 0
      const score = (scores[i] ?? 0) + importance + confidence - stalePenalty
      hits.push({ ...m, score, stale: Boolean(m.staleFlaggedAt) })
    })
    hits.sort((a, b) => b.score - a.score)
    const top = hits.slice(0, limit)
    this.db.markUsed(top.map((m) => m.id))
    return top
  }

  async prefill(limit = 15): Promise<string> {
    const context = this.db.context(this.project)
    const goals = context.filter((c) => c.type === "goal").slice(0, 1)
    const decisions = context.filter((c) => c.type === "decision").slice(0, 6)
    const gotchas = context.filter((c) => c.type === "gotcha").slice(0, 6)
    const progress = context.filter((c) => c.type === "progress").slice(0, 5)
    const memories = await this.recall({ project: this.project, limit, semantic: false })
    if (!context.length && !memories.length) return ""
    const lines = ["## Prior Knowledge"]
    if (goals.length) lines.push("", "**Goal**", ...goals.map((g) => `- ${g.content}`))
    if (decisions.length) lines.push("", "**Decisions**", ...decisions.map((d) => `- ${d.content}`))
    if (gotchas.length) lines.push("", "**Gotchas**", ...gotchas.map((g) => `- ${g.content}`))
    if (progress.length) lines.push("", "**Progress**", ...progress.map((p) => `- ${p.content}`))
    if (memories.length) {
      lines.push("", "**Memory index**")
      for (const m of memories) lines.push(`- [${m.id}] ${m.title || trim(m.content, 100)}`)
    }
    return lines.join("\n")
  }

  async promptRecall(prompt: string, limit = 5): Promise<string> {
    if (prompt.length < 15 || prompt.trim().startsWith("/")) return ""
    if (prompt === this.lastPrompt) return ""
    this.lastPrompt = prompt
    const hits = await this.recall({ query: prompt, project: this.project, limit, semantic: false })
    const fresh = hits.filter((m) => !this.recalledIDs.has(m.id))
    for (const m of fresh) this.recalledIDs.add(m.id)
    if (!fresh.length) return ""
    return ["## LTM prompt recall", ...fresh.map((m) => `- [${m.id}] (${m.category}) ${trim(m.content, 200)}`)].join("\n")
  }
  private recalledIDs = new Set<number>()

  context(project?: string): string {
    const p = project || this.project
    const items = this.db.context(p)
    if (!items.length) return `No context for ${p}.`
    const lines = [`## Project Context: ${p}`]
    for (const type of ["goal", "decision", "gotcha", "progress"]) {
      const rows = items.filter((x) => x.type === type)
      if (!rows.length) continue
      lines.push("", `**${type[0].toUpperCase()}${type.slice(1)}**`)
      lines.push(...rows.slice(0, 10).map((x) => `- ${x.content}`))
    }
    return lines.join("\n")
  }

  recordSessionSummary(sessionID: string): string | null {
    const db = openOpenCode(opencodePath())
    if (!db) return null
    try {
      const parts = sessionParts(db, sessionID, 800)
      const user = [...parts].reverse().find((p) => p.role === "user" && p.text)?.text ?? ""
      const assistant = [...parts].reverse().find((p) => p.role === "assistant" && p.text)?.text ?? ""
      const files = [...new Set(parts.filter((p) => p.type === "tool" && p.input)
        .map((p) => String(p.input?.filePath ?? p.input?.path ?? "")).filter(Boolean))].slice(0, 10)
      if (!user && !assistant) return null
      const summary = `Session ${sessionID.slice(0, 8)}: ${trim(user || assistant, 180)}${files.length ? ` | files: ${files.join(", ")}` : ""}`
      this.db.upsertProgress(this.project, sessionID, summary)
      return summary
    } finally {
      try { db.close() } catch {}
    }
  }

  contextAdd(type: string, content: string, project?: string, sessionID?: string): void {
    this.db.addContext(project || this.project, type, content, sessionID)
  }

  forget(id: number): boolean { return this.db.delete(id) }
  revalidate(id: number): boolean { return this.db.revalidate(id) }

  markStale(paths: string[], reason?: string): number {
    return this.db.markStaleForFiles(paths, reason)
  }

  relate(source: number, target: number, type: string): void {
    if (!["supports", "contradicts", "refines", "depends_on", "related_to", "supersedes"].includes(type)) {
      throw new Error("invalid relationship type")
    }
    this.db.relate(source, target, type)
  }

  proposals(): any[] { return this.db.proposals() }
  conflicts(): any[] { return this.db.conflicts() }
  resolveConflict(id: number, status: string): void { this.db.resolveConflict(id, status) }
  acceptProposal(id: number): void { this.db.acceptProposal(id, (input) => this.db.addMemory({ ...input, origin: "proposal" })) }
  rejectProposal(id: number): void { this.db.rejectProposal(id) }

  async janitor(): Promise<{ decayed: number; archived: number; embedded: number; deduped: number }> {
    let decayed = 0
    let archived = 0
    let embedded = 0
    let deduped = 0
    const now = Date.now()
    for (const row of this.db.allForDecay()) {
      const important = Number(row.importance)
      if (important >= 5) continue
      const half = important === 4 ? 180 : important === 3 ? 90 : important === 2 ? 30 : 14
      const last = Date.parse(`${row.last_used_at}Z`) || Date.parse(`${row.created_at}Z`) || now
      const ageDays = Math.max(0, (now - last) / 86_400_000)
      const factor = Math.pow(2, -ageDays / half)
      const score = important * Number(row.confidence) * factor
      this.db.db.query("UPDATE memories SET decay_score=?, updated_at=datetime('now') WHERE id=?").run(score, row.id)
      decayed++
      if (factor < 0.25) {
        this.db.setStatus(Number(row.id), "deprecated")
        archived++
      }
    }
    const missing = this.db.db.query(
      `SELECT m.id, m.content FROM memories m LEFT JOIN memories_vec v ON v.memory_id=m.id
       WHERE v.memory_id IS NULL AND m.status='active' LIMIT 50`,
    ).all() as any[]
    if (missing.length) {
      const vectors = await embedTexts(missing.map((r) => r.content))
      for (let i = 0; i < missing.length; i++) {
        if (!vectors[i]) continue
        try {
          this.db.db.query("INSERT INTO memories_vec(memory_id,embedding) VALUES (?,?)").run(missing[i].id, new Float32Array(vectors[i]))
          embedded++
        } catch {}
      }
    }
    const candidates = this.db.db.query(
      `SELECT id FROM memories WHERE status='active' AND is_private=0 ORDER BY updated_at DESC LIMIT 100`,
    ).all() as any[]
    for (let i = 0; i < candidates.length; i++) {
      const a = this.db.get(Number(candidates[i].id))
      if (!a) continue
      const vec = await embedOne(a.content)
      if (!vec) continue
      const near = this.db.vec(vec, a.project, 1)[0]
      if (near && near.id !== a.id && near.distance <= 0.05) {
        this.db.setStatus(a.id, "duplicate")
        deduped++
      }
    }
    return { decayed, archived, embedded, deduped }
  }

  stats(project?: string) { return this.db.stats(project || this.project) }

  graph(seed: number, depth = 2): { nodes: any[]; edges: any[] } {
    const nodes = new Map<number, any>()
    const edges: any[] = []
    let frontier = [seed]
    for (let d = 0; d < depth; d++) {
      const next: number[] = []
      for (const id of frontier) {
        if (nodes.has(id)) continue
        const m = this.db.get(id)
        if (!m) continue
        nodes.set(id, { id: m.id, title: m.title, category: m.category })
        for (const rel of this.db.relations(id)) {
          edges.push(rel)
          const other = rel.source_id === id ? rel.target_id : rel.source_id
          if (!nodes.has(other)) next.push(other)
        }
      }
      frontier = next
      if (!frontier.length) break
    }
    return { nodes: [...nodes.values()], edges }
  }
}

export function projectName(directory: string): string {
  let dir = path.resolve(directory)
  while (true) {
    if (existsSync(path.join(dir, ".git"))) return path.basename(dir)
    const parent = path.dirname(dir)
    if (parent === dir) break
    dir = parent
  }
  return path.basename(path.resolve(directory)) || "default"
}

function trim(text: string, max: number): string {
  return text.length <= max ? text : `${text.slice(0, max)}…`
}

declare module "./service.ts" {
  interface MemoryService {
    notePrompt(text: string): void
    currentPrompt(): string
    staleList(project?: string, limit?: number): any[]
  }
}
MemoryService.prototype.notePrompt = function (this: MemoryService, text: string) {
  this.pendingPrompt = text
}
MemoryService.prototype.currentPrompt = function (this: MemoryService) {
  return this.pendingPrompt
}
MemoryService.prototype.staleList = function (this: MemoryService, project?: string, limit = 50) {
  const p = project || this.project
  return this.db.db.query(
    `SELECT id,title,content,category,importance,stale_flagged_at,stale_reason FROM memories
     WHERE stale_flagged_at IS NOT NULL AND status='active' AND (project=? OR project IS NULL)
     ORDER BY stale_flagged_at DESC LIMIT ?`,
  ).all(p, Math.max(1, Math.min(200, limit)))
}
