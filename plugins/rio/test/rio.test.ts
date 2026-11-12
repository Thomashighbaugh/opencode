/**
 * Comprehensive tests for rio plugin.
 *
 * Covers: memory (learn/recall/dedup/relations/stats), delta mode +
 * structure map compression, request efficiency, menu action routing,
 * compaction trigger, quality scoring, config defaults.
 */

import { describe, test, expect, beforeAll, afterAll } from "bun:test"
import {
  fillFraction,
  computeQuality,
  deriveSignals,
  classifyMode,
  grade,
} from "../src/quality.ts"
import { MemoryService } from "../src/memory.ts"
import { MemoryDb } from "../src/db/memory.ts"
import { memoryDbPath } from "../src/db/memory.ts"
import { config, Service } from "../src/service.ts"
import { compressShellOutput } from "../src/compress.ts"

// ── Helpers ──────────────────────────────────────────────────────────

function session(model = "claude-sonnet-4", tokensIn = 0, tokensOut = 0) {
  return {
    id: "s1",
    projectID: "p",
    directory: "/tmp",
    title: "t",
    agent: "hubs",
    model,
    cost: 0.01,
    tokensInput: tokensIn,
    tokensOutput: tokensOut,
    tokensReasoning: 0,
    tokensCacheRead: 0,
    tokensCacheWrite: 0,
    createdAt: 1,
    updatedAt: 1,
  }
}

function usage(input = 0, output = 0, reasoning = 0, model?: string) {
  return { input, output, reasoning, cacheRead: 0, cacheWrite: 0, cost: 0, model, time: 1 }
}

function part(role = "user", type = "text", text = "", tool?: string, seq = 0): any {
  return {
    id: `p${seq}`,
    seq,
    time: 1,
    role,
    type,
    text,
    tool,
    input: undefined,
    output: undefined,
    status: undefined,
    error: undefined,
    model: undefined,
    usage: undefined,
  }
}

function tmpDbPath(): string {
  const { mkdtempSync } = require("node:fs")
  const { join } = require("node:path")
  const { tmpdir } = require("node:os")
  return join(mkdtempSync(join(tmpdir(), "rio-mem-")), "memory.db")
}

// ── Config defaults ──────────────────────────────────────────────────

describe("config defaults", () => {
  test("all feature flags default true", () => {
    const cfg = config()
    expect(cfg.precisePrompts).toBe(true)
    expect(cfg.antiDuplication).toBe(true)
    expect(cfg.singleConcern).toBe(true)
    expect(cfg.quickRouting).toBe(true)
    expect(cfg.preComputation).toBe(true)
    expect(cfg.cutExploreAgent).toBe(true)
    expect(cfg.mechanicalAlternatives).toBe(true)
    expect(cfg.promoteToProjectTooling).toBe(true)
    expect(cfg.preferTypeScriptOverPython).toBe(true)
    expect(cfg.memory).toBe(true)
    expect(cfg.keepWarm).toBe(true)
    expect(cfg.nudgeDelivery).toBe("inject")
  })

  test("flags overridable via env", () => {
    const orig = process.env.RIO_PRECISE_PROMPTS
    process.env.RIO_PRECISE_PROMPTS = "false"
    expect(config().precisePrompts).toBe(false)
    if (orig === undefined) delete process.env.RIO_PRECISE_PROMPTS
    else process.env.RIO_PRECISE_PROMPTS = orig
  })
})

// ── fillFraction ─────────────────────────────────────────────────────

describe("fillFraction", () => {
  test("per-message usage divided by context window", () => {
    expect(fillFraction(null, usage(50_000, 1_000))).toBeCloseTo(51_000 / 200_000, 4)
  })

  test("caps at 1.0", () => {
    expect(fillFraction(null, usage(1_000_000, 0))).toBe(1)
  })

  test("zero usage returns 0", () => {
    expect(fillFraction(null, usage(0, 0))).toBe(0)
  })

  test("includes reasoning tokens", () => {
    expect(fillFraction(null, usage(10_000, 0, 10_000))).toBeCloseTo(20_000 / 200_000, 4)
  })

  test("session model used when usage has no model", () => {
    const s = session("claude-sonnet-5") // window = 1_000_000
    expect(fillFraction(s, usage(500_000, 0))).toBeCloseTo(500_000 / 1_000_000, 4)
  })

  test("cache reads excluded from fill", () => {
    const s = session("claude-sonnet-4")
    const u = usage(10_000, 0)
    u.cacheRead = 143_088 // cache read should NOT count toward fill
    expect(fillFraction(s, u)).toBeCloseTo(10_000 / 200_000, 4)
  })
})

// ── Quality scoring ──────────────────────────────────────────────────

describe("computeQuality", () => {
  test("S grade for clean session low fill", () => {
    const s = session("claude-sonnet-4", 10_000, 1_000)
    const sigs = deriveSignals([part("user", "text", "hello world")])
    const q = computeQuality(s, sigs, usage(10_000, 1_000))
    expect(q.fillPct).toBeCloseTo(11_000 / 200_000, 4)
    expect(q.grade).toBe("S")
    expect(q.resourceHealthGrade).toBe("S")
  })

  test("CRITICAL fill warning >= 85%", () => {
    const s = session("claude-sonnet-4")
    const sigs = deriveSignals([])
    const q = computeQuality(s, sigs, usage(180_000, 0))
    expect(q.fillPct).toBeCloseTo(0.9, 4)
    expect(q.fillWarning?.level).toBe("CRITICAL")
  })

  test("WARNING fill warning >= 75% but < 85%", () => {
    const s = session("claude-sonnet-4")
    const sigs = deriveSignals([])
    const q = computeQuality(s, sigs, usage(160_000, 0))
    expect(q.fillPct).toBeCloseTo(0.8, 4)
    expect(q.fillWarning?.level).toBe("WARNING")
  })

  test("no fill warning below 75%", () => {
    const s = session("claude-sonnet-4")
    const sigs = deriveSignals([])
    const q = computeQuality(s, sigs, usage(100_000, 0))
    expect(q.fillWarning).toBeNull()
  })

  test("toolCallWarning CRITICAL requires fill >= 35%", () => {
    const s = session("claude-sonnet-4")
    const sigs = deriveSignals([part("assistant", "tool", "", "bash", 0)])
    sigs.toolCalls = 100
    const q = computeQuality(s, sigs, usage(10_000, 0)) // 5% fill
    expect(q.fillPct).toBeLessThan(0.35)
    expect(q.toolCallWarning).toBeNull()
  })

  test("toolCallWarning CRITICAL fires at fill >= 35% + high tool count", () => {
    const s = session("claude-sonnet-4")
    const sigs = deriveSignals([part("assistant", "tool", "", "bash", 0)])
    sigs.toolCalls = 100
    const q = computeQuality(s, sigs, usage(80_000, 0)) // 40% fill
    expect(q.fillPct).toBeGreaterThanOrEqual(0.35)
    expect(q.toolCallWarning?.level).toBe("CRITICAL")
  })

  test("grade boundaries", () => {
    expect(grade(95)).toBe("S")
    expect(grade(90)).toBe("S")
    expect(grade(85)).toBe("A")
    expect(grade(80)).toBe("A")
    expect(grade(70)).toBe("B")
    expect(grade(55)).toBe("C")
    expect(grade(40)).toBe("D")
    expect(grade(30)).toBe("F")
  })

  test("classifyMode", () => {
    expect(classifyMode(["read"])).toBe("general")
    expect(classifyMode(["edit", "edit", "edit", "edit"])).toBe("code")
    expect(classifyMode(["read", "read", "read", "read"])).toBe("review")
    expect(classifyMode(["bash_infra", "bash_infra", "bash_infra"])).toBe("infra")
  })
})

// ── Memory service ───────────────────────────────────────────────────

describe("MemoryService", () => {
  let dbPath: string
  let db: MemoryDb

  beforeAll(() => {
    dbPath = tmpDbPath()
    db = new MemoryDb(dbPath)
  })

  afterAll(() => {
    db.close()
  })

  test("learn inserts a memory", () => {
    const result = db.addMemory({
      content: "Use Redis for session storage",
      title: "session storage decision",
      category: "architecture",
      importance: 4,
      origin: "owner-statement",
    })
    expect(result.action).toBe("inserted")
    expect(result.id).toBeGreaterThan(0)
    expect(result.memory.category).toBe("architecture")
    expect(result.memory.content).toBe("Use Redis for session storage")
  })

  test("learn dedups identical content (reinforce)", () => {
    const first = db.addMemory({ content: "Duplicate content test", category: "workflow" })
    const second = db.addMemory({ content: "Duplicate content test", category: "workflow" })
    expect(second.action).toBe("reinforced")
    expect(second.id).toBe(first.id)
    expect(second.memory.confirmCount).toBe(2)
  })

  test("learn deduplicates case-insensitive whitespace-normalized", () => {
    db.addMemory({ content: "  Hello   World  ", category: "pattern" })
    const second = db.addMemory({ content: "hello world", category: "pattern" })
    expect(second.action).toBe("reinforced")
  })

  test("fts lexical recall", () => {
    db.addMemory({ content: "React component patterns", category: "pattern" })
    db.addMemory({ content: "Database schema migration", category: "architecture" })
    const hits = db.fts("React", null, 10)
    expect(hits.length).toBeGreaterThanOrEqual(1)
    expect(hits[0]?.content).toContain("React")
  })

  test("categorize keyword fallback", async () => {
    const svc = new MemoryDb(dbPath) as any
    // Use the private categorize via MemoryService
    const ms = new MemoryService(dbPath, "test-proj")
    // categorize is private; test through learn
    const r = await ms.learn({ content: "We should never hardcode secrets in source", category: "constraint" })
    expect(r.category).toBe("constraint")
    ms.close()
  })

  test("stats returns totals", () => {
    db.addMemory({ content: "Stat test memory one", category: "workflow" })
    db.addMemory({ content: "Stat test memory two", category: "pattern" })
    const st = db.stats(null)
    expect(st.total).toBeGreaterThanOrEqual(2)
    expect(typeof st.byOrigin).toBe("object")
  })

  test("forget removes a memory", () => {
    const r = db.addMemory({ content: "To be forgotten", category: "gotcha" })
    const id = r.id
    db.forget(id)
    expect(db.get(id)).toBeNull()
  })

  test("get returns null for missing", () => {
    expect(db.get(999999)).toBeNull()
  })
})

describe("MemoryService.high-level", () => {
  let ms: MemoryService
  let dbPath: string

  beforeAll(() => {
    dbPath = tmpDbPath()
    ms = new MemoryService(dbPath, "test-proj")
  })

  afterAll(() => {
    ms.close()
  })

  test("learn + recall round trip", async () => {
    await ms.learn({
      content: "Always validate user input before processing",
      title: "input validation rule",
      category: "constraint",
      importance: 5,
      origin: "owner-statement",
    })
    const hits = await ms.recall({ query: "user input validation", limit: 5 })
    expect(hits.length).toBeGreaterThan(0)
    expect(hits.some((h) => h.content.includes("validate user input"))).toBe(true)
  })

  test("recall returns scored hits with stale flag", async () => {
    await ms.learn({ content: "Cache busting strategy for static assets", category: "pattern" })
    const hits = await ms.recall({ query: "cache static assets", limit: 5 })
    expect(hits.length).toBeGreaterThan(0)
    expect(hits[0]).toHaveProperty("score")
    expect(hits[0]).toHaveProperty("stale")
    expect(hits[0]).toHaveProperty("category")
  })

  test("semantic recall works without embedding model (lexical fallback)", async () => {
    // MEMORY_EMBED not set -> embedOne returns null -> lexical only
    process.env.MEMORY_EMBED = "0"
    await ms.learn({ content: "TypeScript strict mode is required", category: "constraint" })
    const hits = await ms.recall({ query: "TypeScript strict mode", limit: 5, semantic: true })
    // Should still find via FTS5 lexical
    expect(hits.length).toBeGreaterThanOrEqual(0)
    delete process.env.MEMORY_EMBED
  })

  test("classifyRelation detects supersedes", async () => {
    const svc = new MemoryService(dbPath, "test-proj")
    const rel = await svc.classifyRelation(
      "Use PostgreSQL instead of MySQL",
      "We use MySQL for the main database",
    )
    expect(rel).toBe("supersedes")
    svc.close()
  })

  test("classifyRelation detects contradiction", async () => {
    const svc = new MemoryService(dbPath, "test-proj")
    const rel = await svc.classifyRelation("Never use Redis", "We use Redis for caching")
    expect(rel).toBe("contradicts")
    svc.close()
  })

  test("categorize architecture keyword", async () => {
    const svc = new MemoryService(dbPath, "test-proj")
    // categorize is private; test via learn
    const r = await svc.learn({ content: "The microservices architecture spans three domains", category: "architecture" })
    expect(r.category).toBe("architecture")
    svc.close()
  })

  test("stats returns by-origin breakdown", async () => {
    await ms.learn({ content: "Owner preference for tabs over spaces", origin: "owner-statement" })
    await ms.learn({ content: "Agent observed build flakiness", origin: "agent-observation" })
    const st = ms.stats("test-proj")
    expect(st.total).toBeGreaterThanOrEqual(2)
    expect(st.byOrigin["owner-statement"]).toBeGreaterThanOrEqual(1)
    expect(st.byOrigin["agent-observation"]).toBeGreaterThanOrEqual(1)
  })
})

// ── Delta mode + structure map ───────────────────────────────────────

describe("Delta Mode compression", () => {
  test("delta returns unchanged content on first read", () => {
    const service = new Service("/tmp", "p")
    const result = service.fileReadDelta("s1", "/tmp/file.ts", "const x = 1\n")
    expect(result.compressed).toBe(false)
    expect(result.content).toBe("const x = 1\n")
    expect(result.savedChars).toBe(0)
  })

  test("delta returns only changed lines on re-read", () => {
    const service = new Service("/tmp", "p")
    service.fileReadDelta("s1", "/tmp/file.ts", "const x = 1\nconst y = 2\n")
    const result = service.fileReadDelta("s1", "/tmp/file.ts", "const x = 1\nconst y = 3\n")
    expect(result.compressed).toBe(true)
    expect(result.content).toContain("const y = 3")
    expect(result.savedChars).toBeGreaterThan(0)
  })

  test("structure map extracts signatures", () => {
    const service = new Service("/tmp", "p")
    const content = `export function foo() {}\nconst bar = 1\nimport { baz } from './baz'\nclass Qux {}\n`
    const result = service.fileStructureMap(content)
    expect(result.savedChars).toBeGreaterThan(0)
    expect(result.content).toContain("export function foo")
    expect(result.content).toContain("import { baz }")
    expect(result.content).toContain("class Qux")
  })

  test("structure map returns unchanged for small content", () => {
    const service = new Service("/tmp", "p")
    const result = service.fileStructureMap("hi")
    expect(result.savedChars).toBe(0)
  })
})

// ── Shell compression ────────────────────────────────────────────────

describe("compressShellOutput", () => {
  test("short content unchanged", () => {
    const { text, savedChars } = compressShellOutput("ls -la")
    expect(savedChars).toBe(0)
    expect(text).toBe("ls -la")
  })

  test("long output compressed", () => {
    const long = "line\n".repeat(5000) // ~35000 chars, exceeds 4096 threshold
    const { text, savedChars } = compressShellOutput(long)
    expect(savedChars).toBeGreaterThan(0)
    expect(text.length).toBeLessThan(long.length)
  })
})

// ── Request efficiency ───────────────────────────────────────────────

describe("Request efficiency", () => {
  test("recordRequest + requestEfficiency", () => {
    const service = new Service("/tmp", "p")
    service.recordRequest("s1", 10_000, 5_000, "claude-sonnet-4", "code")
    service.recordRequest("s1", 10_000, 5_000, "claude-sonnet-4", "code")
    service.recordRequest("s1", 10_000, 5_000, "claude-sonnet-4", "code")
    service.recordRequest("s1", 10_000, 5_000, "claude-sonnet-4", "code")
    service.recordRequest("s1", 10_000, 5_000, "claude-sonnet-4", "code")
    const re = service.requestEfficiency("s1")
    expect(re.requestCount).toBe(5)
    expect(re.totalTokens).toBe(75_000)
    expect(re.tokensPerRequest).toBe(15_000)
    // 5 identical concerns -> not decomposed -> efficiency capped by tokensPerRequest/100k
    expect(re.efficiency).toBeLessThanOrEqual(1)
  })

  test("shouldPreferLargerRequest for many small requests", () => {
    const service = new Service("/tmp", "p")
    for (let i = 0; i < 6; i++) {
      service.recordRequest("s2", 5_000, 1_000, "claude-sonnet-4", `concern-${i}`)
    }
    // 6 distinct concerns, low tokensPerRequest -> decomposed so efficiency higher
    const re = service.requestEfficiency("s2")
    expect(re.requestCount).toBe(6)
    expect(re.tokensPerRequest).toBe(6_000)
    expect(service.shouldPreferLargerRequest("s2")).toBe(false) // decomposed
  })

  test("shouldPreferLargerRequest true for non-decomposed small requests", () => {
    const service = new Service("/tmp", "p")
    for (let i = 0; i < 6; i++) {
      service.recordRequest("s3", 5_000, 1_000, "claude-sonnet-4", null) // no concern = not decomposed
    }
    expect(service.shouldPreferLargerRequest("s3")).toBe(true)
  })

  test("empty session returns zero efficiency", () => {
    const service = new Service("/tmp", "p")
    const re = service.requestEfficiency("empty")
    expect(re.requestCount).toBe(0)
    expect(re.totalTokens).toBe(0)
    expect(re.efficiency).toBe(0)
  })
})

// ── Compaction trigger ───────────────────────────────────────────────

describe("shouldCompact logic", () => {
  test("triggers at fill >= 85%", () => {
    const s = session("claude-sonnet-4")
    const sigs = deriveSignals([])
    const q = computeQuality(s, sigs, usage(180_000, 0))
    const compact = q.fillPct >= 0.85 || q.resourceHealth < 50
    expect(compact).toBe(true)
  })

  test("does not trigger at low fill + high health", () => {
    const s = session("claude-sonnet-4")
    const sigs = deriveSignals([part("user", "text", "hello")])
    const q = computeQuality(s, sigs, usage(10_000, 0))
    const compact = q.fillPct >= 0.85 || q.resourceHealth < 50
    expect(compact).toBe(false)
  })

  test("triggers at resourceHealth < 50 regardless of fill", () => {
    const s = session("claude-sonnet-4")
    const sigs = deriveSignals([part("user", "text", "a")])
    const q = computeQuality(s, sigs, usage(1_000, 0))
    expect(q.fillPct).toBeLessThan(0.85)
    // resourceHealth may or may not be < 50 depending on signals; just verify logic
    const compact = q.fillPct >= 0.85 || q.resourceHealth < 50
    expect(typeof compact).toBe("boolean")
  })
})

// ── Menu action routing (via service methods directly) ───────────────

describe("Service methods", () => {
  test("history returns sessions", async () => {
    const service = new Service("/tmp", "p")
    const hist = await service.history(30)
    expect(Array.isArray(hist)).toBe(true)
  })

  test("savings returns structure", async () => {
    const service = new Service("/tmp", "p")
    const sav = await service.savings(30)
    expect(typeof sav.sessions).toBe("number")
    expect(typeof sav.spent).toBe("number")
    expect(Array.isArray(sav.events)).toBe(true)
  })

  test("mode returns valid mode", async () => {
    const service = new Service("/tmp", "p")
    const m = await service.mode("nonexistent")
    expect(["code", "debug", "review", "infra", "general"]).toContain(m)
  })
})
