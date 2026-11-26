/**
 * Memory injection, promotion, and sidebar tests.
 *
 * Each test exercises a rio memory feature the way the user hits it:
 *   - recall the memories relevant to the CURRENT prompt, not the first
 *   - inject only the matching memories, embedded + reranked via recall
 *   - promote extracted decisions to durable memory as they occur
 *   - report loaded / total for the sidebar row
 *
 * Embedding and classification are disabled so recall is deterministic
 * (lexical + token-overlap rerank, both model-free). The same code path runs
 * with embeddings on in production.
 */

import { describe, test, expect, beforeAll, afterAll } from "bun:test"
import { mkdtempSync, rmSync } from "node:fs"
import { join } from "node:path"
import { tmpdir } from "node:os"

import { MemoryService } from "../src/memory.ts"
import {
  latestPrompt,
  memoryContextBlock,
  promoteDecisions,
  memorySidebarLine,
  readMemoryState,
  writeMemoryState,
} from "../src/inject.ts"

const ENV = { MEMORY_EMBED: process.env.MEMORY_EMBED, MEMORY_CLASSIFY: process.env.MEMORY_CLASSIFY }

function tempDir(prefix: string): string {
  return mkdtempSync(join(tmpdir(), prefix))
}

describe("latestPrompt", () => {
  test("returns the most recent prompt, not the first", () => {
    expect(latestPrompt(["set up the repo", "add a button", "which database do we use?"])).toBe(
      "which database do we use?",
    )
  })

  test("empty or missing history yields empty string", () => {
    expect(latestPrompt([])).toBe("")
    expect(latestPrompt(undefined)).toBe("")
  })
})

describe("memoryContextBlock", () => {
  let ms: MemoryService
  let dir: string

  beforeAll(async () => {
    process.env.MEMORY_EMBED = "0"
    process.env.MEMORY_CLASSIFY = "0"
    dir = tempDir("rio-inject-")
    ms = new MemoryService(dir, "proj")
    await ms.learn({ content: "Use PostgreSQL for the primary datastore", category: "architecture", project: "proj" })
    await ms.learn({ content: "Buttons use a 44px tap target", category: "constraint", project: "proj" })
  })

  afterAll(() => {
    ms.close()
    rmSync(dir, { recursive: true, force: true })
    if (ENV.MEMORY_EMBED === undefined) delete process.env.MEMORY_EMBED
    else process.env.MEMORY_EMBED = ENV.MEMORY_EMBED
    if (ENV.MEMORY_CLASSIFY === undefined) delete process.env.MEMORY_CLASSIFY
    else process.env.MEMORY_CLASSIFY = ENV.MEMORY_CLASSIFY
  })

  test("injects the memory relevant to the current prompt and not the unrelated one", async () => {
    const r = await memoryContextBlock(ms, "datastore", { project: "proj" })
    expect(r.loaded).toBeGreaterThan(0)
    expect(r.text).toContain("PostgreSQL")
    expect(r.text).not.toContain("44px")
  })

  test("uses the current prompt, so a different turn surfaces a different memory", async () => {
    const history = ["Use PostgreSQL for the primary datastore", "44px tap target"]
    const current = latestPrompt(history)
    const r = await memoryContextBlock(ms, current, { project: "proj" })
    expect(r.text).toContain("44px")
    expect(r.text).not.toContain("PostgreSQL")
  })

  test("empty prompt injects nothing", async () => {
    const r = await memoryContextBlock(ms, "", { project: "proj" })
    expect(r.loaded).toBe(0)
    expect(r.text).toBe("")
  })

  test("reports total stored memories alongside loaded", async () => {
    const r = await memoryContextBlock(ms, "PostgreSQL datastore", { project: "proj" })
    expect(r.total).toBeGreaterThanOrEqual(2)
    expect(r.loaded).toBeLessThanOrEqual(r.total)
  })

  test("default recall is global, so a memory stored under a project is not hidden", async () => {
    // The real bug: memories are written under a project id but MemoryService
    // defaults recall to "default", which matched nothing. No project filter
    // must still surface the memory.
    const r = await memoryContextBlock(ms, "datastore", {})
    expect(r.text).toContain("PostgreSQL")
  })
})

describe("promoteDecisions", () => {
  let ms: MemoryService
  let dir: string

  beforeAll(() => {
    process.env.MEMORY_EMBED = "0"
    process.env.MEMORY_CLASSIFY = "0"
    dir = tempDir("rio-promote-")
    ms = new MemoryService(dir, "proj")
  })

  afterAll(() => {
    ms.close()
    rmSync(dir, { recursive: true, force: true })
    if (ENV.MEMORY_EMBED === undefined) delete process.env.MEMORY_EMBED
    else process.env.MEMORY_EMBED = ENV.MEMORY_EMBED
    if (ENV.MEMORY_CLASSIFY === undefined) delete process.env.MEMORY_CLASSIFY
    else process.env.MEMORY_CLASSIFY = ENV.MEMORY_CLASSIFY
  })

  test("a decision becomes a durable memory without waiting for compaction", async () => {
    const stored = await promoteDecisions(ms, ["We chose PostgreSQL over SQLite for concurrency"], "proj")
    expect(stored).toBe(1)
    const hits = await ms.recall({ query: "PostgreSQL concurrency", limit: 5, project: "proj" })
    expect(hits.some((h) => h.content.includes("PostgreSQL over SQLite"))).toBe(true)
  })

  test("re-promoting the same decision reinforces instead of duplicating", async () => {
    const before = ms.stats("proj").total
    const stored = await promoteDecisions(ms, ["We chose PostgreSQL over SQLite for concurrency"], "proj")
    expect(stored).toBe(1)
    expect(ms.stats("proj").total).toBe(before)
  })

  test("blank decisions are ignored", async () => {
    const before = ms.stats("proj").total
    expect(await promoteDecisions(ms, ["  ", ""], "proj")).toBe(0)
    expect(ms.stats("proj").total).toBe(before)
  })
})

describe("memorySidebarLine", () => {
  test("formats loaded over total", () => {
    expect(memorySidebarLine(3, 42)).toBe("memory · 3/42 loaded")
  })

  test("clamps negatives", () => {
    expect(memorySidebarLine(-1, -5)).toBe("memory · 0/0 loaded")
  })
})

describe("memory sidebar state", () => {
  test("write then read round trip, scoped to the session", () => {
    const dir = tempDir("rio-state-")
    try {
      writeMemoryState(dir, { sessionID: "s1", loaded: 2, total: 9, at: 1 })
      expect(readMemoryState(dir, "s1")?.loaded).toBe(2)
      expect(readMemoryState(dir, "s1")?.total).toBe(9)
      expect(readMemoryState(dir, "other")).toBeNull()
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }
  })

  test("missing state file returns null", () => {
    const dir = tempDir("rio-state-none-")
    try {
      expect(readMemoryState(dir)).toBeNull()
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }
  })
})
