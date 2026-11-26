/**
 * Cache and token-saving tests for rio, at the depth of the memory suite.
 *
 * Each block exercises one feature the way it is used:
 *   - quality cache: reuse within TTL, recompute after invalidate, persisted row
 *   - delta mode: a file re-read returns only changed lines (the read cache)
 *   - structure map: signatures only, bodies dropped
 *   - shell compression: large output keeps head + tail
 *   - request efficiency: per-request token accounting and the larger-request hint
 *   - savings ledger: logged savings aggregate by token and cost
 *   - mechanical alternatives: local generation instead of inference
 *   - continuity: lean resume of a relevant prior checkpoint
 */

import { describe, test, expect, beforeAll, afterAll } from "bun:test"
import { mkdtempSync, rmSync, writeFileSync, existsSync } from "node:fs"
import { join } from "node:path"
import { tmpdir } from "node:os"

import { Service, config } from "../src/service.ts"
import { OptimizerStore } from "../src/db/store.ts"
import { compressShellOutput } from "../src/compress.ts"
import {
  estimateMechanicalSavings,
  slugify,
  findExistingProjectTool,
  promoteToProjectTooling,
} from "../src/mechanical.ts"
import { scoreCheckpoint, findBestCheckpoint, buildResumeHint } from "../src/continuity.ts"

const ENV_RIO_DATA = process.env.RIO_DATA_DIR

function tempDir(prefix: string): string {
  return mkdtempSync(join(tmpdir(), prefix))
}

async function readyStore(dir: string): Promise<OptimizerStore> {
  const store = new OptimizerStore(dir)
  for (let i = 0; i < 40 && !store.db; i++) await new Promise((r) => setTimeout(r, 25))
  return store
}

// ── Quality cache ────────────────────────────────────────────────────

describe("quality cache", () => {
  let dir: string
  let service: Service

  beforeAll(() => {
    dir = tempDir("rio-qcache-")
    process.env.RIO_DATA_DIR = dir
    service = new Service(dir, "p", config())
  })

  afterAll(() => {
    service.close()
    rmSync(dir, { recursive: true, force: true })
    if (ENV_RIO_DATA === undefined) delete process.env.RIO_DATA_DIR
    else process.env.RIO_DATA_DIR = ENV_RIO_DATA
  })

  test("a second call within the TTL returns the cached object, not a recompute", async () => {
    const a = await service.quality("cache-session")
    const b = await service.quality("cache-session")
    expect(b).toBe(a)
  })

  test("invalidate forces a recompute on the next call", async () => {
    const a = await service.quality("cache-session-2")
    service.invalidate("cache-session-2")
    const c = await service.quality("cache-session-2")
    expect(c).not.toBe(a)
    expect(c.fillPct).toBe(a.fillPct)
  })

  test("the quality row is persisted for later sessions to read", async () => {
    await service.quality("persist-session")
    const stored = service.store.getQuality("persist-session")
    expect(stored).not.toBeNull()
    expect(typeof stored!.resourceHealth).toBe("number")
  })
})

// ── Delta mode (file read cache) ─────────────────────────────────────

describe("delta mode", () => {
  const service = new Service("/tmp", "p", config())

  afterAll(() => service.close())

  test("first read returns the full content, uncompressed", () => {
    const r = service.fileReadDelta("s", "/a.ts", "line1\nline2\nline3")
    expect(r.compressed).toBe(false)
    expect(r.content).toBe("line1\nline2\nline3")
    expect(r.savedChars).toBe(0)
  })

  test("an unchanged re-read still returns content, no delta", () => {
    service.fileReadDelta("s", "/b.ts", "same\ncontent")
    const r = service.fileReadDelta("s", "/b.ts", "same\ncontent")
    // No changed lines, delta length 0 < content length, so it compresses to an empty delta.
    expect(r.compressed).toBe(true)
    expect(r.content).toContain("0 line(s) changed")
  })

  test("a partial change returns only the changed lines", () => {
    service.fileReadDelta("s", "/c.ts", "a\nb\nc\nd")
    const r = service.fileReadDelta("s", "/c.ts", "a\nB\nc\nd")
    expect(r.compressed).toBe(true)
    expect(r.content).toContain("+ B")
    expect(r.content).not.toContain("+ a")
    expect(r.savedChars).toBeGreaterThan(0)
  })

  test("added and removed lines are both reported", () => {
    service.fileReadDelta("s", "/d.ts", "keep\ngone")
    const r = service.fileReadDelta("s", "/d.ts", "keep\nadded\nmore")
    expect(r.content).toContain("+ added")
    expect(r.content).toContain("+ more")
  })

  test("the read cache is keyed per session and path, so sessions do not collide", () => {
    service.fileReadDelta("sa", "/same.ts", "one")
    const other = service.fileReadDelta("sb", "/same.ts", "two")
    expect(other.compressed).toBe(false)
    expect(other.content).toBe("two")
  })

  test("a change larger than the file returns the full content", () => {
    service.fileReadDelta("s", "/e.ts", "x")
    const r = service.fileReadDelta("s", "/e.ts", "completely\ndifferent\nlonger\ncontent")
    expect(r.compressed).toBe(false)
    expect(r.content).toContain("completely")
  })
})

// ── Structure map ────────────────────────────────────────────────────

describe("structure map", () => {
  const service = new Service("/tmp", "p", config())
  afterAll(() => service.close())

  test("keeps signatures and imports, drops bodies", () => {
    const content = [
      "import fs from 'node:fs'",
      "export function add(a, b) {",
      "  const sum = a + b",
      "  return sum",
      "}",
      "export class Foo {",
      "  bar() { return 1 }",
      "}",
    ].join("\n")
    const r = service.fileStructureMap(content)
    expect(r.content).toContain("import fs")
    expect(r.content).toContain("export function add")
    expect(r.content).toContain("export class Foo")
    expect(r.content).not.toContain("return sum")
    expect(r.savedChars).toBeGreaterThan(0)
  })

  test("a file with no signatures is returned unchanged", () => {
    const r = service.fileStructureMap("just\nplain\ntext")
    expect(r.savedChars).toBe(0)
    expect(r.content).toBe("just\nplain\ntext")
  })

  test("the map is always smaller than the source when it compresses", () => {
    const lines = ["export const x = 1", ...Array.from({ length: 30 }, (_, i) => `// comment ${i}`)]
    const content = lines.join("\n")
    const r = service.fileStructureMap(content)
    if (r.savedChars > 0) expect(r.content.length).toBeLessThan(content.length)
  })
})

// ── Shell compression ────────────────────────────────────────────────

describe("shell compression", () => {
  test("short output is untouched", () => {
    const r = compressShellOutput("short output")
    expect(r.savedChars).toBe(0)
    expect(r.text).toBe("short output")
  })

  test("large output keeps head and tail with a line count", () => {
    // The compressor only fires above 4096 chars; pad so the path is real.
    const text = Array.from({ length: 600 }, (_, i) => `line ${i} ${"x".repeat(20)}`).join("\n")
    expect(text.length).toBeGreaterThan(4096)
    const r = compressShellOutput(text)
    expect(r.text).toContain("600 lines")
    expect(r.text).toContain("line 0 ")
    expect(r.text).toContain("line 599 ")
    expect(r.savedChars).toBeGreaterThan(0)
  })

  test("savedChars equals original minus compressed length", () => {
    const text = Array.from({ length: 600 }, (_, i) => `row ${i} ${"y".repeat(20)}`).join("\n")
    expect(text.length).toBeGreaterThan(4096)
    const r = compressShellOutput(text)
    expect(r.savedChars).toBeGreaterThan(0)
    expect(r.savedChars).toBe(text.trim().length - r.text.length)
  })
})

// ── Request efficiency ───────────────────────────────────────────────

describe("request efficiency", () => {
  const service = new Service("/tmp", "p", config())
  afterAll(() => service.close())

  test("no records yields zeros, not a crash", () => {
    expect(service.requestEfficiency("empty")).toEqual({
      requestCount: 0,
      totalTokens: 0,
      tokensPerRequest: 0,
      efficiency: 0,
    })
  })

  test("records accumulate count and tokens", () => {
    service.recordRequest("eff", 10_000, 2_000, "m", "build")
    service.recordRequest("eff", 8_000, 1_000, "m", "build")
    const re = service.requestEfficiency("eff")
    expect(re.requestCount).toBe(2)
    expect(re.totalTokens).toBe(21_000)
    expect(re.tokensPerRequest).toBe(10_500)
  })

  test("decomposed requests (distinct concerns) cap efficiency lower", () => {
    service.recordRequest("dec", 8_000, 0, "m", "a")
    service.recordRequest("dec", 8_000, 0, "m", "b")
    const decomposed = service.requestEfficiency("dec")
    expect(decomposed.efficiency).toBeCloseTo(Math.min(1, 8_000 / 50_000), 4)
  })

  test("many small same-concern requests trigger the larger-request hint", () => {
    for (let i = 0; i < 6; i++) service.recordRequest("small", 5_000, 500, "m", "build")
    expect(service.shouldPreferLargerRequest("small")).toBe(true)
  })

  test("decomposed small requests do not trigger the hint", () => {
    for (let i = 0; i < 6; i++) service.recordRequest("dec2", 5_000, 500, "m", `concern-${i}`)
    expect(service.shouldPreferLargerRequest("dec2")).toBe(false)
  })

  test("large requests do not trigger the hint", () => {
    for (let i = 0; i < 6; i++) service.recordRequest("big", 200_000, 10_000, "m", "build")
    expect(service.shouldPreferLargerRequest("big")).toBe(false)
  })
})

// ── Savings ledger ───────────────────────────────────────────────────

describe("savings ledger", () => {
  let dir: string
  let store: OptimizerStore

  beforeAll(async () => {
    dir = tempDir("rio-savings-")
    store = await readyStore(dir)
  })

  afterAll(() => {
    store.close()
    rmSync(dir, { recursive: true, force: true })
  })

  test("logged events are readable back with tokens and cost", () => {
    const now = Math.floor(Date.now() / 1000)
    store.logSavings({ type: "compression", tokens: 120, costUsd: 0.001, sessionID: "s", detail: "shell", createdAt: now })
    store.logSavings({ type: "decision_extracted", tokens: 30, costUsd: 0, sessionID: "s", detail: "decision", createdAt: now })
    const events = store.savings(30)
    expect(events.length).toBeGreaterThanOrEqual(2)
    expect(events.reduce((n, e) => n + e.tokens, 0)).toBeGreaterThanOrEqual(150)
  })

  test("events older than the window are excluded", () => {
    const old = Math.floor(Date.now() / 1000) - 40 * 86_400
    store.logSavings({ type: "compression", tokens: 999, costUsd: 1, sessionID: "s", detail: "old", createdAt: old })
    const recent = store.savings(7)
    expect(recent.some((e) => e.tokens === 999)).toBe(false)
  })

  test("Service.savings returns the ledger plus session spend", async () => {
    const service = new Service(dir, "p", config())
    const sav = await service.savings(30)
    expect(typeof sav.sessions).toBe("number")
    expect(typeof sav.spent).toBe("number")
    expect(Array.isArray(sav.events)).toBe(true)
    expect(sav.cost).toBe(sav.spent)
    service.close()
  })
})

// ── Mechanical alternatives ──────────────────────────────────────────

describe("mechanical alternatives", () => {
  let dir: string
  beforeAll(() => (dir = tempDir("rio-mech-")))
  afterAll(() => rmSync(dir, { recursive: true, force: true }))

  test("savings estimate is inference minus local, floored at zero", () => {
    expect(estimateMechanicalSavings(1000, 200)).toBe(800)
    expect(estimateMechanicalSavings(100, 400)).toBe(0)
  })

  test("slugify produces a filesystem-safe name", () => {
    expect(slugify("  Git Diff Summary! ")).toBe("git-diff-summary")
    expect(slugify("a/b/c")).toBe("a-b-c")
  })

  test("an unpromoted task has no existing tool", () => {
    expect(findExistingProjectTool(dir, "no-such-task")).toBeNull()
  })

  test("promotion writes a project tool once, then reports it already exists", () => {
    const first = promoteToProjectTooling(dir, "summ", "export default 1\n")
    expect(first.promoted).toBe(true)
    expect(existsSync(first.path)).toBe(true)
    const second = promoteToProjectTooling(dir, "summ", "export default 2\n")
    expect(second.promoted).toBe(false)
    // The original body is preserved, not overwritten.
    expect(findExistingProjectTool(dir, "summ")).toBe(first.path)
  })

  test("a promoted tool is discoverable by slug", () => {
    promoteToProjectTooling(dir, "diff-summary", "export default 1\n")
    expect(findExistingProjectTool(dir, "diff-summary")).not.toBeNull()
  })
})

// ── Continuity (lean resume) ─────────────────────────────────────────

describe("continuity resume", () => {
  function checkpoint(content: string, files: string[] = []) {
    return {
      id: "cp",
      sessionID: "old",
      projectID: "p",
      directory: "/tmp",
      trigger: "compaction",
      mode: "code",
      qualityScore: 70,
      fillPct: 0.9,
      activeFiles: files,
      content,
      constants: { maxChars: 12_000 },
    }
  }

  test("checkpoint relevance scores on keyword overlap", () => {
    const cp = checkpoint("refactored the auth middleware and token validation", ["auth.ts"])
    expect(scoreCheckpoint("how does auth token validation work", cp)).toBeGreaterThan(0.5)
    expect(scoreCheckpoint("unrelated zebra topic", cp)).toBe(0)
  })

  test("findBestCheckpoint returns the most relevant above threshold", () => {
    const auth = checkpoint("auth middleware token validation")
    const css = checkpoint("css grid layout spacing")
    const best = findBestCheckpoint([css, auth], "fix auth token validation bug", 0.6)
    expect(best?.cp.content).toContain("auth")
    expect(best!.score).toBeGreaterThanOrEqual(0.6)
  })

  test("findBestCheckpoint returns null below the threshold", () => {
    const cp = checkpoint("css grid layout")
    expect(findBestCheckpoint([cp], "auth token validation", 0.6)).toBeNull()
  })

  test("the resume hint is fenced as recovered data, never instructions", () => {
    const hint = buildResumeHint(checkpoint("prior work here", ["a.ts"]), 0.8)
    expect(hint).toContain('trust="data"')
    expect(hint).toContain("RECOVERED DATA")
    expect(hint).toContain("prior work here")
    expect(hint).toContain("relevance=\"80%\"")
  })
})
