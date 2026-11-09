import { afterAll, beforeAll, describe, expect, test } from "bun:test"
import { Database } from "bun:sqlite"
import { mkdtempSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"

let dbPath: string
let dataDir: string
const priorDb = process.env.OPENCODE_DB
const priorData = process.env.TOKEN_OPTIMIZER_DATA_DIR

beforeAll(() => {
  const dir = mkdtempSync(join(tmpdir(), "token-optimizer-plugin-"))
  dbPath = join(dir, "opencode.db")
  dataDir = join(dir, "data")
  process.env.OPENCODE_DB = dbPath
  process.env.TOKEN_OPTIMIZER_DATA_DIR = dataDir
  const db = new Database(dbPath, { create: true })
  db.exec(`
    CREATE TABLE session_v2 (
      id TEXT PRIMARY KEY, project_id TEXT NOT NULL, workspace_id TEXT, parent_id TEXT,
      fork_session_id TEXT, fork_boundary TEXT, slug TEXT NOT NULL DEFAULT '', directory TEXT NOT NULL DEFAULT '',
      path TEXT, title TEXT, version TEXT NOT NULL DEFAULT '2', share_url TEXT,
      summary_additions INTEGER, summary_deletions INTEGER, summary_files INTEGER, summary_diffs TEXT,
      metadata TEXT, cost REAL DEFAULT 0 NOT NULL, tokens_input INTEGER DEFAULT 0 NOT NULL,
      tokens_output INTEGER DEFAULT 0 NOT NULL, tokens_reasoning INTEGER DEFAULT 0 NOT NULL,
      tokens_cache_read INTEGER DEFAULT 0 NOT NULL, tokens_cache_write INTEGER DEFAULT 0 NOT NULL,
      revert TEXT, permission TEXT, agent TEXT, model TEXT, time_created INTEGER NOT NULL,
      time_updated INTEGER NOT NULL, time_compacting INTEGER, time_archived INTEGER,
      time_suspended INTEGER, resume_attempts INTEGER DEFAULT 0 NOT NULL, time_idle INTEGER,
      time_viewed INTEGER, idle_outcome TEXT
    );
    CREATE TABLE message (
      id TEXT PRIMARY KEY, session_id TEXT NOT NULL, time_created INTEGER NOT NULL,
      time_updated INTEGER NOT NULL, data TEXT NOT NULL
    );
    CREATE TABLE part (
      id TEXT PRIMARY KEY, message_id TEXT NOT NULL, session_id TEXT NOT NULL,
      time_created INTEGER NOT NULL, time_updated INTEGER NOT NULL, data TEXT NOT NULL
    );
  `)
  const now = Date.now()
  db.run(
    `INSERT INTO session_v2 (id, project_id, slug, directory, title, cost, tokens_input, tokens_output,
      tokens_reasoning, tokens_cache_read, tokens_cache_write, model, time_created, time_updated)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ["ses_test", "prj_test", "test", "/tmp/project", "Test", 0.02, 50_000, 2000, 100, 20_000, 1000, "claude-sonnet-4", now - 1000, now],
  )
  db.run("INSERT INTO message (id, session_id, time_created, time_updated, data) VALUES (?, ?, ?, ?, ?)", [
    "msg_u", "ses_test", now - 1000, now - 1000,
    JSON.stringify({ role: "user", time: { created: now - 1000 } }),
  ])
  db.run("INSERT INTO message (id, session_id, time_created, time_updated, data) VALUES (?, ?, ?, ?, ?)", [
    "msg_a", "ses_test", now - 500, now,
    JSON.stringify({ role: "assistant", modelID: "claude-sonnet-4", cost: 0.02, tokens: { input: 50_000, output: 2000, reasoning: 100, cache: { read: 20_000, write: 1000 } }, time: { created: now - 500 } }),
  ])
  db.run("INSERT INTO part (id, message_id, session_id, time_created, time_updated, data) VALUES (?, ?, ?, ?, ?, ?)", [
    "prt_1", "msg_u", "ses_test", now - 1000, now - 1000, JSON.stringify({ type: "text", text: "read the auth module and fix the failing login test" }),
  ])
  db.run("INSERT INTO part (id, message_id, session_id, time_created, time_updated, data) VALUES (?, ?, ?, ?, ?, ?)", [
    "prt_2", "msg_a", "ses_test", now - 900, now - 900,
    JSON.stringify({ type: "tool", tool: "read", state: { status: "completed", input: { filePath: "src/auth.ts" }, output: "x".repeat(100) } }),
  ])
  db.run("INSERT INTO part (id, message_id, session_id, time_created, time_updated, data) VALUES (?, ?, ?, ?, ?, ?)", [
    "prt_3", "msg_a", "ses_test", now - 800, now - 800,
    JSON.stringify({ type: "tool", tool: "write", state: { status: "completed", input: { filePath: "src/auth.ts" }, output: "ok" } }),
  ])
  db.close()
})

afterAll(() => {
  if (priorDb === undefined) delete process.env.OPENCODE_DB
  else process.env.OPENCODE_DB = priorDb
  if (priorData === undefined) delete process.env.TOKEN_OPTIMIZER_DATA_DIR
  else process.env.TOKEN_OPTIMIZER_DATA_DIR = priorData
})

describe("plugin registration", () => {
  test("registers tools and reports from a synthetic OpenCode DB", async () => {
    const tools: Record<string, any> = {}
    const ctx = {
      location: { directory: "/tmp/project", project: { id: "prj_test" } },
      tool: {
        transform: async (cb: any) => cb({ add: (tool: any) => { tools[tool.name] = tool } }),
      },
    }
    const plugin = (await import("../index.ts")).default
    const cleanup = await plugin.setup(ctx)
    expect(Object.keys(tools).sort()).toEqual(["tokenOptimizer", "token_status"])

    const status: any = await tools.token_status.execute({ detail: true }, { sessionID: "ses_test" })
    expect(status.content).toContain("Context Health Report")
    expect(status.content).toContain("Resource Health")
    expect(status.content).toContain("Signal Breakdown")

    const captured: any = await tools.tokenOptimizer.execute({ action: "checkpoint", subaction: "capture" }, { sessionID: "ses_test" })
    expect(captured.content).toContain("Checkpoint")
    const listed: any = await tools.tokenOptimizer.execute({ action: "checkpoint", subaction: "list" }, { sessionID: "ses_test" })
    expect(listed.content).toContain("## Checkpoints")
    const mode: any = await tools.tokenOptimizer.execute({ action: "mode" }, { sessionID: "ses_test" })
    expect(mode.content).toContain("Session mode")
    const savings: any = await tools.tokenOptimizer.execute({ action: "savings", days: 30 }, { sessionID: "ses_test" })
    expect(savings.content).toContain("Token Optimizer Savings")
    const history: any = await tools.tokenOptimizer.execute({ action: "history", days: 30 }, { sessionID: "ses_test" })
    expect(history.content).toContain("Session History")
    await cleanup()
  })
})
