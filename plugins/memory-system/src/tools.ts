import { MemoryService } from "./service.ts"
import { CATEGORIES } from "./db.ts"

const LEARN = {
  type: "object",
  properties: {
    content: { type: "string", description: "Durable insight, decision, gotcha, or pattern" },
    title: { type: "string", description: "Short noun-phrase label (<=60 chars)" },
    category: { type: "string", enum: [...CATEGORIES] },
    importance: { type: "number", minimum: 1, maximum: 5 },
    confidence: { type: "number", minimum: 0, maximum: 1 },
    project: { type: "string", description: "Project scope; omit for current project" },
    files: { type: "array", items: { type: "string" }, description: "Repo-relative files this memory is anchored to" },
    origin: { type: "string", enum: ["owner-statement", "agent-observation", "external-source", "proposal", "historical-approval"] },
    private: { type: "boolean" },
    workspace: { type: "string" },
    agent: { type: "string" },
  },
  required: ["content"],
} as const

const RECALL = {
  type: "object",
  properties: {
    query: { type: "string" },
    project: { type: "string" },
    limit: { type: "number", minimum: 1, maximum: 50 },
    category: { type: "string", enum: [...CATEGORIES] },
    semantic: { type: "boolean", description: "Use the local vector store (default true)" },
    includePrivate: { type: "boolean" },
  },
} as const

const CONTEXT_ADD = {
  type: "object",
  properties: {
    type: { type: "string", enum: ["goal", "decision", "gotcha", "progress"] },
    content: { type: "string" },
    project: { type: "string" },
  },
  required: ["type", "content"],
} as const

function text(value: unknown): { content: string } {
  return { content: typeof value === "string" ? value : JSON.stringify(value, null, 2) }
}

export function buildTools(service: MemoryService) {
  return [
    {
      name: "memory_learn",
      description: "Store or reinforce a durable project memory. Categories: preference, architecture, gotcha, pattern, workflow, constraint. The memory is embedded, classified, scrubbed, and deduplicated locally.",
      options: { codemode: false } as const,
      input: LEARN,
      async execute(input: any) {
        const result = await service.learn(input)
        return text({ ok: true, id: result.id, action: result.action, category: result.category })
      },
    },
    {
      name: "memory_recall",
      description: "Hybrid memory recall over FTS5 and the local sqlite-vec store, fused with RRF and reranked locally. Call before non-trivial work.",
      options: { codemode: false } as const,
      input: RECALL,
      async execute(input: any) {
        const hits = await service.recall(input)
        return text({
          count: hits.length,
          memories: hits.map((m) => ({
            id: m.id, title: m.title, category: m.category, importance: m.importance,
            score: Math.round(m.score * 1000) / 1000, stale: m.stale, content: m.content,
          })),
        })
      },
    },
    {
      name: "memory_get",
      description: "Fetch one memory by ID, including metadata and files.",
      options: { codemode: false } as const,
      input: { type: "object", properties: { id: { type: "number" }, includePrivate: { type: "boolean" } }, required: ["id"] } as const,
      async execute(input: any) {
        const m = service.db.get(Number(input.id))
        if (!m) return text({ ok: false, error: "not_found", id: input.id })
        if (m.isPrivate && input.includePrivate !== true) return text({ ok: false, error: "private", id: input.id })
        return text({ ok: true, memory: { ...m, files: service.db.files(m.id) } })
      },
    },
    {
      name: "memory_forget",
      description: "Delete a memory by ID. Cascades relations and file anchors.",
      options: { codemode: false } as const,
      input: { type: "object", properties: { id: { type: "number" }, reason: { type: "string" } }, required: ["id"] } as const,
      async execute(input: any) {
        service.forget(Number(input.id))
        return text({ ok: true, id: input.id })
      },
    },
    {
      name: "memory_relate",
      description: "Create a typed relationship: supports, contradicts, refines, depends_on, related_to, supersedes.",
      options: { codemode: false } as const,
      input: { type: "object", properties: { source_id: { type: "number" }, target_id: { type: "number" }, relationship_type: { type: "string" } }, required: ["source_id", "target_id", "relationship_type"] } as const,
      async execute(input: any) {
        service.relate(Number(input.source_id), Number(input.target_id), String(input.relationship_type))
        return text({ ok: true })
      },
    },
    {
      name: "memory_context",
      description: "Restore project goal, decisions, gotchas, and recent progress.",
      options: { codemode: false } as const,
      input: { type: "object", properties: { project: { type: "string" } } } as const,
      async execute(input: any) { return text(service.context(input.project)) },
    },
    {
      name: "memory_context_add",
      description: "Record a project goal, decision, gotcha, or progress note. Goal replaces; decision/gotcha are permanent. Decisions and gotchas also queue a proposal.",
      options: { codemode: false } as const,
      input: CONTEXT_ADD,
      async execute(input: any) {
        service.contextAdd(String(input.type), String(input.content), input.project)
        return text({ ok: true, project: input.project || service.project, type: input.type })
      },
    },
    {
      name: "memory_stale",
      description: "List memories a commit flagged stale, or mark anchored files stale.",
      options: { codemode: false } as const,
      input: {
        type: "object",
        properties: { project: { type: "string" }, limit: { type: "number" }, markFiles: { type: "array", items: { type: "string" } } },
      } as const,
      async execute(input: any) {
        if (Array.isArray(input.markFiles) && input.markFiles.length) {
          return text({ marked: service.markStale(input.markFiles.map(String)) })
        }
        return text({ count: service.staleList(input.project, input.limit).length, memories: service.staleList(input.project, input.limit) })
      },
    },
    {
      name: "memory_revalidate",
      description: "Clear a stale flag after review; use memory_forget when the memory is wrong.",
      options: { codemode: false } as const,
      input: { type: "object", properties: { id: { type: "number" } }, required: ["id"] } as const,
      async execute(input: any) { service.revalidate(Number(input.id)); return text({ ok: true, id: input.id }) },
    },
    {
      name: "memory_proposals",
      description: "Review deterministic memory proposals. action=list|accept|reject.",
      options: { codemode: false } as const,
      input: { type: "object", properties: { action: { type: "string", enum: ["list", "accept", "reject"] }, id: { type: "number" } }, required: ["action"] } as const,
      async execute(input: any) {
        if (input.action === "list") return text({ proposals: service.proposals() })
        const id = Number(input.id)
        if (!id) return text({ ok: false, error: "id required" })
        if (input.action === "accept") service.acceptProposal(id)
        else service.rejectProposal(id)
        return text({ ok: true, action: input.action, id })
      },
    },
    {
      name: "memory_conflicts",
      description: "Review staged contradictions/supersedes. action=list|dismiss|accept; accept keeps both memories linked and closes the conflict.",
      options: { codemode: false } as const,
      input: { type: "object", properties: { action: { type: "string", enum: ["list", "dismiss", "accept"] }, id: { type: "number" } }, required: ["action"] } as const,
      async execute(input: any) {
        if (input.action === "list") return text({ conflicts: service.conflicts() })
        const id = Number(input.id)
        if (!id) return text({ ok: false, error: "id required" })
        service.resolveConflict(id, input.action === "accept" ? "accepted" : "dismissed")
        return text({ ok: true, action: input.action, id })
      },
    },
    {
      name: "memory_stats",
      description: "Memory counts: active, stale, private, categories, importance, pending proposals, embedding state.",
      options: { codemode: false } as const,
      input: { type: "object", properties: { project: { type: "string" } } } as const,
      async execute(input: any) {
        return text({ ...service.stats(input.project), embedding: (await import("./embedding.ts")).embeddingMeta(), rerank: (await import("./rerank.ts")).rerankInfo() })
      },
    },
    {
      name: "memory_janitor",
      description: "Run deterministic maintenance: decay, archive, embedding backfill, duplicate detection. No LLM.",
      options: { codemode: false } as const,
      input: { type: "object", properties: {} } as const,
      async execute() { return text(await service.janitor()) },
    },
    {
      name: "memory_graph",
      description: "Traverse typed memory relations from a seed memory.",
      options: { codemode: false } as const,
      input: { type: "object", properties: { id: { type: "number" }, depth: { type: "number" } }, required: ["id"] } as const,
      async execute(input: any) { return text(service.graph(Number(input.id), Math.max(1, Math.min(4, Number(input.depth ?? 2))))) },
    },
  ]
}
