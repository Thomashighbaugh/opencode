import { afterAll, beforeAll, beforeEach, describe, expect, test } from "bun:test"
import { Database } from "bun:sqlite"
import { mkdtempSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import {
  databasePath,
  openOpenCode,
  sessionRow,
  listSessions,
  messageUsage,
  sessionParts,
  latestUsage,
  sessionUsage,
  type SessionRow,
} from "../src/db/opencode.ts"

let dir: string
let dbPath: string
let db: Database
const oldDb = process.env.OPENCODE_DB

function exec(db: Database, sql: string, params: any[] = []) {
  return db.prepare(sql).run(...params)
}

function queryOne(db: Database, sql: string, params: any[] = []) {
  return db.prepare(sql).get(...params) as any
}

beforeAll(() => {
  dir = mkdtempSync(join(tmpdir(), "token-optimizer-db-"))
  dbPath = join(dir, "opencode.db")
  process.env.OPENCODE_DB = dbPath
  db = new Database(dbPath, { create: true })
  db.exec("PRAGMA journal_mode=WAL")
  db.exec(`
    CREATE TABLE session_v2 (
      id TEXT PRIMARY KEY, project_id TEXT, directory TEXT, title TEXT,
      agent TEXT, model TEXT, cost REAL DEFAULT 0,
      tokens_input INTEGER DEFAULT 0, tokens_output INTEGER DEFAULT 0,
      tokens_reasoning INTEGER DEFAULT 0, tokens_cache_read INTEGER DEFAULT 0,
      tokens_cache_write INTEGER DEFAULT 0, time_created INTEGER,
      time_updated INTEGER
    );
    CREATE TABLE session (
      id TEXT PRIMARY KEY, project_id TEXT, directory TEXT, title TEXT,
      agent TEXT, model TEXT, cost REAL DEFAULT 0,
      tokens_input INTEGER DEFAULT 0, tokens_output INTEGER DEFAULT 0,
      tokens_reasoning INTEGER DEFAULT 0, tokens_cache_read INTEGER DEFAULT 0,
      tokens_cache_write INTEGER DEFAULT 0, time_created INTEGER,
      time_updated INTEGER
    );
    CREATE TABLE message (
      id TEXT PRIMARY KEY, session_id TEXT, time_created INTEGER,
      time_updated INTEGER, data TEXT
    );
    CREATE TABLE part (
      id TEXT PRIMARY KEY, message_id TEXT, session_id TEXT,
      time_created INTEGER, time_updated INTEGER, data TEXT
    );
    CREATE TABLE session_message (
      id TEXT PRIMARY KEY, session_id TEXT, type TEXT, seq INTEGER,
      time_created INTEGER, time_updated INTEGER, data TEXT
    );
  `)
})

afterAll(() => {
  db.close()
  if (oldDb === undefined) delete process.env.OPENCODE_DB
  else process.env.OPENCODE_DB = oldDb
})

function insertV2Session(id: string, tokensIn = 1000, tokensOut = 200) {
  exec(db, `INSERT OR IGNORE INTO session_v2 (id,project_id,directory,title,agent,model,cost,
    tokens_input,tokens_output,tokens_reasoning,tokens_cache_read,tokens_cache_write,time_created,time_updated)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    [id, "prj", "/tmp", "Session " + id, "hubs", "claude-sonnet-4", 0.01, tokensIn, tokensOut, 50, 10000, 500, Date.now(), Date.now()])
}

function insertV1Session(id: string, tokensIn = 500, tokensOut = 100) {
  exec(db, `INSERT OR IGNORE INTO session (id,project_id,directory,title,agent,model,cost,
    tokens_input,tokens_output,tokens_reasoning,tokens_cache_read,tokens_cache_write,time_created,time_updated)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    [id, "prj", "/tmp", "V1 Session " + id, "hubs", "minimax-m3", 0.005, tokensIn, tokensOut, 25, 5000, 250, Date.now(), Date.now()])
}

function insertV2Message(sessionID: string, type: string, data: any, seq = 1, timeCreated = Date.now()) {
  exec(db, `INSERT OR IGNORE INTO session_message (id,session_id,type,seq,time_created,time_updated,data) VALUES (?,?,?,?,?,?,?)`,
    ["msg_" + sessionID + "_" + seq, sessionID, type, seq, timeCreated, timeCreated, JSON.stringify(data)])
}

function insertV1Message(sessionID: string, role: string, data: any) {
  exec(db, `INSERT OR IGNORE INTO message (id,session_id,time_created,time_updated,data) VALUES (?,?,?,?,?)`,
    ["msg_" + sessionID, sessionID, Date.now(), Date.now(), JSON.stringify({ role, ...data })])
}

function insertV2Part(sessionID: string, type: string, data: any) {
  exec(db, `INSERT OR IGNORE INTO part (id,message_id,session_id,time_created,time_updated,data) VALUES (?,?,?,?,?,?)`,
    ["prt_" + sessionID, "msg_x", sessionID, Date.now(), Date.now(), JSON.stringify({ type, ...data })])
}

function insertV1Part(sessionID: string, type: string, data: any) {
  exec(db, `INSERT OR IGNORE INTO part (id,message_id,session_id,time_created,time_updated,data) VALUES (?,?,?,?,?,?)`,
    ["prt_" + sessionID, "msg_" + sessionID, sessionID, Date.now(), Date.now(), JSON.stringify({ type, ...data })])
}

describe("db - sessionRow V2", () => {
  beforeEach(() => {
    insertV2Session("ses_v2_1", 50000, 10000)
    insertV2Session("ses_v2_2", 100, 10)
  })

  test("returns row from session_v2", () => {
    const row = sessionRow(db, "ses_v2_1") as SessionRow
    expect(row.id).toBe("ses_v2_1")
    expect(row.projectID).toBe("prj")
    expect(row.directory).toBe("/tmp")
    expect(row.title).toBe("Session ses_v2_1")
    expect(row.agent).toBe("hubs")
    expect(row.model).toContain("claude-sonnet-4")
    expect(row.tokensInput).toBe(50000)
    expect(row.tokensOutput).toBe(10000)
    expect(row.cost).toBe(0.01)
  })

  test("returns null for missing session", () => {
    expect(sessionRow(db, "no_such_session")).toBeNull()
  })

  test("V1 session falls back to session table", () => {
    insertV1Session("ses_v1_1")
    const row = sessionRow(db, "ses_v1_1") as SessionRow
    expect(row.id).toBe("ses_v1_1")
    expect(row.model).toContain("minimax-m3")
    expect(row.tokensInput).toBe(500)
  })

  test("V2 takes precedence when both tables have row", () => {
    insertV1Session("ses_both", 999999, 1)
    insertV2Session("ses_both", 1, 1)
    const row = sessionRow(db, "ses_both") as SessionRow
    expect(row.tokensInput).toBe(1) // V2 value
  })
})

describe("db - listSessions", () => {
  beforeEach(() => {
    insertV2Session("ses_list_1")
    insertV2Session("ses_list_2")
    insertV1Session("ses_list_v1")
  })

  test("lists V2 sessions", () => {
    const rows = listSessions(db)
    expect(rows.length).toBeGreaterThanOrEqual(2)
    const ids = rows.map((r) => r.id)
    expect(ids).toContain("ses_list_1")
    expect(ids).toContain("ses_list_2")
  })

  test("filters by project", () => {
    const rows = listSessions(db, 30, "prj")
    expect(rows.length).toBeGreaterThanOrEqual(2)
    expect(rows.every((r) => r.projectID === "prj")).toBe(true)
  })

  test("returns empty for no sessions", () => {
    const db2 = new Database(join(dir, "empty.db"), { create: true })
    db2.exec(`CREATE TABLE session_v2 (id TEXT PRIMARY KEY, project_id TEXT, directory TEXT, title TEXT, agent TEXT, model TEXT, cost REAL, tokens_input INTEGER, tokens_output INTEGER, tokens_reasoning INTEGER, tokens_cache_read INTEGER, tokens_cache_write INTEGER, time_created INTEGER, time_updated INTEGER)`)
    const rows = listSessions(db2)
    expect(rows).toEqual([])
    db2.close()
  })
})

describe("db - sessionParts V1", () => {
  beforeEach(() => {
    insertV1Session("ses_parts_v1")
    insertV1Part("ses_parts_v1", "tool", { tool: "read", state: { status: "completed", input: { filePath: "src/a.ts" }, output: "x".repeat(100) } })
    insertV1Part("ses_parts_v1", "text", { text: "hello world this is a substantive message" })
  })

  test("returns part entries for V1 session", () => {
    // Insert a matching message row so the part->message join works
    insertV1Message("ses_parts_v1", "assistant", {
      modelID: "claude-sonnet-4",
      tokens: { input: 100, output: 50, cache: { read: 0, write: 0 } },
      cost: 0.001, time: { created: Date.now() },
    })
    const parts = sessionParts(db, "ses_parts_v1")
    expect(parts.length).toBeGreaterThan(0)
    const toolParts = parts.filter((p) => p.type === "tool")
    expect(toolParts.length).toBe(1)
    expect(toolParts[0].tool).toBe("read")
    expect(toolParts[0].input?.filePath).toBe("src/a.ts")
  })
})

describe("db - sessionParts V2 (session_message)", () => {
  beforeEach(() => {
    insertV2Session("ses_parts_v2")
    insertV2Message("ses_parts_v2", "user", { text: "fix the bug", time: { created: Date.now() } }, 1)
    insertV2Message("ses_parts_v2", "assistant", {
      model: { id: "claude-sonnet-4", providerID: "anthropic" },
      content: [
        { type: "text", text: "I will fix the bug" },
        { type: "tool", name: "read", id: "call_1", state: { status: "completed", input: { filePath: "src/b.ts" }, output: "ok" } },
        { type: "reasoning", text: "thinking about the bug" },
      ],
      time: { created: Date.now() },
    }, 2)
  })

  test("returns part entries for V2 session", () => {
    const parts = sessionParts(db, "ses_parts_v2")
    expect(parts.length).toBeGreaterThan(0)
    const userParts = parts.filter((p) => p.role === "user")
    expect(userParts.length).toBe(1)
    expect(userParts[0].text).toBe("fix the bug")
    const toolParts = parts.filter((p) => p.type === "tool")
    expect(toolParts.length).toBe(1)
    expect(toolParts[0].tool).toBe("read")
    expect(toolParts[0].input?.filePath).toBe("src/b.ts")
    const reasoningParts = parts.filter((p) => p.type === "reasoning")
    expect(reasoningParts.length).toBe(1)
  })

  test("V2 session with no session_message returns empty", () => {
    insertV2Session("ses_parts_empty")
    const parts = sessionParts(db, "ses_parts_empty")
    expect(parts).toEqual([])
  })
})

describe("db - messageUsage", () => {
  beforeEach(() => {
    insertV2Session("ses_usage_v2")
    insertV2Message("ses_usage_v2", "assistant", {
      model: { id: "claude-sonnet-4", providerID: "anthropic" },
      tokens: { input: 50_000, output: 2000, reasoning: 100, cache: { read: 20_000, write: 1000 } },
      cost: 0.2, time: { created: Date.now() },
    }, 1)
  })

  test("returns usage entries for V2 session", () => {
    const rows = messageUsage(db, "ses_usage_v2")
    expect(rows.length).toBe(1)
    expect(rows[0].input).toBe(50_000)
    expect(rows[0].output).toBe(2000)
    expect(rows[0].cacheRead).toBe(20_000)
    expect(rows[0].model).toContain("claude-sonnet-4")
  })

  test("V1 messageUsage reads message table", () => {
    insertV1Session("ses_usage_v1")
    insertV1Message("ses_usage_v1", "assistant", {
      modelID: "minimax-m3",
      tokens: { input: 1000, output: 100, cache: { read: 0, write: 0 } },
      cost: 0.01, time: { created: Date.now() },
    })
    const rows = messageUsage(db, "ses_usage_v1")
    expect(rows.length).toBe(1)
    expect(rows[0].input).toBe(1000)
    expect(rows[0].model).toContain("minimax-m3")
  })
})

describe("db - latestUsage", () => {
  beforeEach(() => {
    insertV2Session("ses_latest_v2")
  })

  test("returns latest assistant usage for V2", () => {
    const now = Date.now()
    insertV2Message("ses_latest_v2", "assistant", {
      model: { id: "claude-sonnet-4", providerID: "anthropic" },
      tokens: { input: 1000, output: 100, cache: { read: 0, write: 0 } },
      cost: 0.01, time: { created: now - 1000 },
    }, 1, now - 1000)
    insertV2Message("ses_latest_v2", "assistant", {
      model: { id: "claude-sonnet-4", providerID: "anthropic" },
      tokens: { input: 2000, output: 200, cache: { read: 0, write: 0 } },
      cost: 0.02, time: { created: now },
    }, 2, now)
    const u = latestUsage(db, "ses_latest_v2")
    expect(u).not.toBeNull()
    expect(u!.input).toBe(2000)
    expect(u!.output).toBe(200)
  })

  test("returns null when no assistant messages", () => {
    insertV2Session("ses_latest_empty")
    insertV2Message("ses_latest_empty", "user", { text: "hi", time: { created: Date.now() } }, 1, Date.now())
    expect(latestUsage(db, "ses_latest_empty")).toBeNull()
  })
})

describe("db - sessionUsage", () => {
  beforeEach(() => {
    insertV2Session("ses_total_v2")
    insertV2Message("ses_total_v2", "assistant", {
      model: { id: "claude-sonnet-4", providerID: "anthropic" },
      tokens: { input: 1000, output: 100, cache: { read: 0, write: 0 } },
      cost: 0.01, time: { created: Date.now() },
    }, 1)
    insertV2Message("ses_total_v2", "assistant", {
      model: { id: "claude-sonnet-4", providerID: "anthropic" },
      tokens: { input: 2000, output: 200, cache: { read: 0, write: 0 } },
      cost: 0.02, time: { created: Date.now() },
    }, 2)
  })

  test("totals all assistant usage", () => {
    const u = sessionUsage(db, "ses_total_v2")
    expect(u.input).toBe(3000)
    expect(u.output).toBe(300)
    expect(u.cost).toBe(0.03)
    expect(u.model).toContain("claude-sonnet-4")
  })
})

describe("db - databasePath and openOpenCode", () => {
  test("databasePath returns override or default", () => {
    const override = "/tmp/custom.db"
    process.env.OPENCODE_DB = override
    expect(databasePath()).toBe(override)
    delete process.env.OPENCODE_DB
    const dp = databasePath()
    expect(dp).toContain("opencode.db")
  })

  test("openOpenCode returns null for missing file", () => {
    expect(openOpenCode("/tmp/nonexistent_db_xyz.db")).toBeNull()
  })

  test("openOpenCode returns readonly db for existing file", () => {
    const d = openOpenCode(dbPath)
    expect(d).not.toBeNull()
    d!.close()
  })
})
