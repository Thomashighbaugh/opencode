import { afterAll, beforeAll, describe, expect, test } from "bun:test"
import { mkdtempSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { MemoryService } from "../src/service.ts"

const oldEmbed = process.env.MEMORY_EMBED
const oldClassify = process.env.MEMORY_CLASSIFY
const oldRerank = process.env.RERANK_DISABLED
let service: MemoryService

beforeAll(() => {
  process.env.MEMORY_EMBED = "0"
  process.env.MEMORY_CLASSIFY = "0"
  process.env.RERANK_DISABLED = "1"
  service = new MemoryService(mkdtempSync(join(tmpdir(), "memory-update-")), "demo")
})

afterAll(() => {
  service.close()
  if (oldEmbed === undefined) delete process.env.MEMORY_EMBED; else process.env.MEMORY_EMBED = oldEmbed
  if (oldClassify === undefined) delete process.env.MEMORY_CLASSIFY; else process.env.MEMORY_CLASSIFY = oldClassify
  if (oldRerank === undefined) delete process.env.RERANK_DISABLED; else process.env.RERANK_DISABLED = oldRerank
})

describe("memory sidebar source", () => {
  test("stats change immediately after learn/context writes", async () => {
    const before = service.stats()
    await service.learn({ content: "Sidebar test memory", category: "pattern" })
    const after = service.stats()
    expect(after.total).toBe(before.total + 1)
    service.contextAdd("decision", "Sidebar context decision", "demo")
    expect(service.proposals().length).toBeGreaterThan(0)
    expect(service.stats().pendingProposals).toBeGreaterThan(0)
  })
})
