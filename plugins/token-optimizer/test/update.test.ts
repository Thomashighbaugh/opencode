import { afterAll, beforeAll, describe, expect, test } from "bun:test"
import { Database } from "bun:sqlite"
import { mkdtempSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { Service, config } from "../src/service.ts"

let dir: string
let dbPath: string
let service: Service
const oldDb = process.env.OPENCODE_DB
const oldData = process.env.TOKEN_OPTIMIZER_DATA_DIR

beforeAll(() => {
  dir = mkdtempSync(join(tmpdir(), "token-update-"))
  dbPath = join(dir, "opencode.db")
  process.env.OPENCODE_DB = dbPath
  process.env.TOKEN_OPTIMIZER_DATA_DIR = join(dir, "data")
  const db = new Database(dbPath, { create: true })
  db.exec(`
    CREATE TABLE session_v2 (id TEXT PRIMARY KEY, project_id TEXT NOT NULL, directory TEXT NOT NULL,
      title TEXT, agent TEXT, model TEXT, cost REAL DEFAULT 0, tokens_input INTEGER DEFAULT 0,
      tokens_output INTEGER DEFAULT 0, tokens_reasoning INTEGER DEFAULT 0, tokens_cache_read INTEGER DEFAULT 0,
      tokens_cache_write INTEGER DEFAULT 0, time_created INTEGER, time_updated INTEGER);
    CREATE TABLE message (id TEXT PRIMARY KEY, session_id TEXT, time_created INTEGER, time_updated INTEGER, data TEXT);
    CREATE TABLE part (id TEXT PRIMARY KEY, message_id TEXT, session_id TEXT, time_created INTEGER, time_updated INTEGER, data TEXT);
    CREATE TABLE session_message (id TEXT PRIMARY KEY, session_id TEXT, type TEXT, seq INTEGER, time_created INTEGER, time_updated INTEGER, data TEXT);
  `)
  const now = Date.now()
  db.run("INSERT INTO session_v2(id,project_id,directory,model,cost,tokens_input,time_created,time_updated) VALUES('s1','p','/tmp','claude-sonnet-4',0,1000,?,?)", [now, now])
  db.run("INSERT INTO message(id,session_id,time_created,time_updated,data) VALUES('m1','s1',?,?,?)", [now, now, JSON.stringify({ role: "assistant", modelID: "claude-sonnet-4", tokens: { input: 1000, output: 100, cache: { read: 0, write: 0 } }, time: { created: now } })])
  db.close()
  service = new Service("/tmp", "p", config())
})

afterAll(() => {
  service.close()
  if (oldDb === undefined) delete process.env.OPENCODE_DB
  else process.env.OPENCODE_DB = oldDb
  if (oldData === undefined) delete process.env.TOKEN_OPTIMIZER_DATA_DIR
  else process.env.TOKEN_OPTIMIZER_DATA_DIR = oldData
})

describe("live sidebar source", () => {
  test("quality changes after new tool activity", () => {
    const first = service.quality("s1")
    const db = new Database(dbPath)
    const now = Date.now()
    db.run("INSERT INTO part(id,message_id,session_id,time_created,time_updated,data) VALUES('p1','m1','s1',?,?,?)", [
      now, now, JSON.stringify({ type: "tool", tool: "read", state: { status: "completed", input: { filePath: "a.ts" }, output: "x".repeat(5000) } }),
    ])
    db.close()
    service.invalidate("s1")
    const second = service.quality("s1")
    expect(second.toolCalls).toBeGreaterThan(first.toolCalls)
    expect(second.fillPct).not.toBeNaN()
  })
})
