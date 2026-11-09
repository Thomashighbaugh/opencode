import { afterAll, beforeAll, describe, expect, test } from "bun:test"
import { mkdtempSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { MemoryService } from "../src/service.ts"
import { MemoryDb } from "../src/db.ts"
import { buildTools } from "../src/tools.ts"

let dir: string
let service: MemoryService

beforeAll(() => {
  process.env.MEMORY_EMBED = "0"
  process.env.MEMORY_CLASSIFY = "0"
  process.env.RERANK_DISABLED = "1"
  dir = mkdtempSync(join(tmpdir(), "memory-system-"))
  service = new MemoryService(dir, "demo")
})

afterAll(() => {
  service.close()
  delete process.env.MEMORY_EMBED
  delete process.env.MEMORY_CLASSIFY
  delete process.env.RERANK_DISABLED
})

describe("memory store", () => {
  test("learns, dedupes, recalls by FTS, and records context", async () => {
    const a = await service.learn({ content: "Auth uses JWT refresh tokens in the gateway", category: "architecture", importance: 4 })
    expect(a.action).toBe("inserted")
    const b = await service.learn({ content: "Auth uses JWT refresh tokens in the gateway", category: "architecture", importance: 4 })
    expect(b.action).toBe("reinforced")
    const hits = await service.recall({ query: "JWT refresh", project: "demo" })
    expect(hits.length).toBeGreaterThan(0)
    expect(hits[0].content).toContain("JWT")
    service.contextAdd("decision", "Use the gateway for token refresh", "demo")
    expect(service.context("demo")).toContain("gateway")
    expect(service.proposals().length).toBe(1)
  })

  test("forgets, revalidates, and reports stats", async () => {
    const item = await service.learn({ content: "Temporary gotcha about port binding", category: "gotcha", importance: 2 })
    expect(service.revalidate(item.id)).toBe(true)
    expect(service.stats("demo").total).toBeGreaterThan(0)
    expect(service.forget(item.id)).toBe(true)
  })

  test("registers memory tools and executes recall", async () => {
    const tools = buildTools(service)
    expect(tools.map((t) => t.name)).toContain("memory_learn")
    expect(tools.map((t) => t.name)).toContain("memory_recall")
    const learned: any = await tools.find((t) => t.name === "memory_learn")!.execute({ content: "The queue uses a lock file", category: "pattern" })
    expect(learned.content).toContain("ok")
    const recalled: any = await tools.find((t) => t.name === "memory_recall")!.execute({ query: "lock file", project: "demo" })
    expect(recalled.content).toContain("lock")
    const stats: any = await tools.find((t) => t.name === "memory_stats")!.execute({})
    expect(stats.content).toContain("total")
  })

  test("plugin registers tools and cleans up", async () => {
    const tools: Record<string, any> = {}
    const ctx = {
      location: { directory: dir, project: { id: "demo" } },
      tool: { transform: async (cb: any) => cb({ add: (t: any) => { tools[t.name] = t } }) },
    }
    const plugin = (await import("../index.ts")).default
    const cleanup = await plugin.setup(ctx)
    expect(Object.keys(tools)).toContain("memory_context")
    expect(Object.keys(tools)).toContain("memory_recall")
    const out: any = await tools.memory_context.execute({ project: "demo" })
    expect(out.content).toContain("Project Context")
    await cleanup()
  })

  test("store file is beside the vector store", () => {
    expect(service.db.path).toContain(join(".opencode", "state", "vector", "memory.db"))
    const other = new MemoryDb(dir)
    other.close()
  })
})
