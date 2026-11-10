/**
 * Read-only adapter over OpenCode's own database. This is the source of truth:
 * hooks accelerate live turns, but every value can be recomputed from SQL.
 */

import { Database } from "bun:sqlite"
import { existsSync } from "node:fs"
import { homedir } from "node:os"
import { join } from "node:path"

export function databasePath(): string {
  const override = process.env.OPENCODE_DB?.trim()
  if (override) return override
  return join(homedir(), ".local/share/opencode/opencode.db")
}

export function openOpenCode(path = databasePath()): Database | null {
  if (!existsSync(path)) return null
  try {
    const db = new Database(path, { readonly: true })
    db.exec("PRAGMA query_only=ON")
    db.exec("PRAGMA busy_timeout=3000")
    return db
  } catch {
    return null
  }
}

export type Usage = {
  input: number
  output: number
  reasoning: number
  cacheRead: number
  cacheWrite: number
  cost: number
  model?: string
  time?: number
}

export type SessionRow = {
  id: string
  projectID: string
  directory: string
  title?: string
  agent?: string
  model?: string
  cost: number
  tokensInput: number
  tokensOutput: number
  tokensReasoning: number
  tokensCacheRead: number
  tokensCacheWrite: number
  createdAt: number
  updatedAt: number
}

export type PartEntry = {
  id: string
  seq: number
  time: number
  role: "user" | "assistant" | "tool" | "unknown"
  type: string
  text: string
  tool?: string
  input?: Record<string, unknown>
  output?: string
  status?: string
  error?: string
  model?: string
  usage?: Usage
}

function parse(data: unknown): Record<string, any> {
  if (typeof data !== "string") return {}
  try {
    const value = JSON.parse(data)
    return value && typeof value === "object" ? value : {}
  } catch {
    return {}
  }
}

function mapSessionRow(row: any): SessionRow {
  return {
    id: String(row.id),
    projectID: String(row.project_id),
    directory: String(row.directory ?? ""),
    title: row.title ?? undefined,
    agent: row.agent ?? undefined,
    model: row.model ?? undefined,
    cost: Number(row.cost ?? 0),
    tokensInput: Number(row.tokens_input ?? 0),
    tokensOutput: Number(row.tokens_output ?? 0),
    tokensReasoning: Number(row.tokens_reasoning ?? 0),
    tokensCacheRead: Number(row.tokens_cache_read ?? 0),
    tokensCacheWrite: Number(row.tokens_cache_write ?? 0),
    createdAt: Number(row.time_created ?? 0),
    updatedAt: Number(row.time_updated ?? 0),
  }
}

const SESSION_COLUMNS = `id, project_id, directory, title, agent, model, cost,
            tokens_input, tokens_output, tokens_reasoning,
            tokens_cache_read, tokens_cache_write, time_created, time_updated`

export function sessionRow(db: Database, id: string): SessionRow | null {
  // V2 first, then V1. Sessions created by OpenCode 1 never receive a
  // `session_v2` row — 59 of the 579 sessions in this database are exactly
  // that — and the sidebar used to score them from a row that did not exist.
  for (const table of ["session_v2", "session"] as const) {
    if (!hasTable(db, table)) continue
    const row = db.query(`SELECT ${SESSION_COLUMNS} FROM ${table} WHERE id = ?`).get(id) as any
    if (row) return mapSessionRow(row)
  }
  return null
}

export function listSessions(db: Database, days = 30, projectID?: string): SessionRow[] {
  const cutoff = Date.now() - Math.max(1, days) * 86_400_000
  const rows = projectID
    ? db.query(
        `SELECT id, project_id, directory, title, agent, model, cost,
                tokens_input, tokens_output, tokens_reasoning,
                tokens_cache_read, tokens_cache_write, time_created, time_updated
         FROM session_v2 WHERE time_updated >= ? AND project_id = ?
         ORDER BY time_updated DESC LIMIT 500`,
      ).all(cutoff, projectID)
    : db.query(
        `SELECT id, project_id, directory, title, agent, model, cost,
                tokens_input, tokens_output, tokens_reasoning,
                tokens_cache_read, tokens_cache_write, time_created, time_updated
         FROM session_v2 WHERE time_updated >= ?
         ORDER BY time_updated DESC LIMIT 500`,
      ).all(cutoff)
  return (rows as any[]).map((row) => ({
    id: String(row.id),
    projectID: String(row.project_id),
    directory: String(row.directory ?? ""),
    title: row.title ?? undefined,
    agent: row.agent ?? undefined,
    model: row.model ?? undefined,
    cost: Number(row.cost ?? 0),
    tokensInput: Number(row.tokens_input ?? 0),
    tokensOutput: Number(row.tokens_output ?? 0),
    tokensReasoning: Number(row.tokens_reasoning ?? 0),
    tokensCacheRead: Number(row.tokens_cache_read ?? 0),
    tokensCacheWrite: Number(row.tokens_cache_write ?? 0),
    createdAt: Number(row.time_created ?? 0),
    updatedAt: Number(row.time_updated ?? 0),
  }))
}

export function messageUsage(db: Database, sessionID: string): Usage[] {
  const rows = db.query(
    `SELECT data FROM message WHERE session_id = ? ORDER BY time_created ASC LIMIT 20000`,
  ).all(sessionID) as Array<{ data: string }>
  const out: Usage[] = []
  for (const row of rows) {
    const m = parse(row.data)
    if (m.role !== "assistant" || !m.tokens) continue
    out.push({
      input: Number(m.tokens.input ?? 0),
      output: Number(m.tokens.output ?? 0),
      reasoning: Number(m.tokens.reasoning ?? 0),
      cacheRead: Number(m.tokens.cache?.read ?? 0),
      cacheWrite: Number(m.tokens.cache?.write ?? 0),
      cost: Number(m.cost ?? 0),
      model: typeof m.modelID === "string" ? m.modelID : undefined,
      time: Number(m.time?.created ?? 0),
    })
  }
  return out
}

/** Last N parts joined to message role, ordered oldest → newest. */
export function sessionParts(db: Database, sessionID: string, limit = 4000): PartEntry[] {
  const rows = db.query(
    `SELECT p.id, p.data AS part_data, m.data AS message_data, p.time_created
     FROM part p JOIN message m ON m.id = p.message_id
     WHERE p.session_id = ?
     ORDER BY p.time_created DESC, p.id DESC
     LIMIT ?`,
  ).all(sessionID, Math.max(1, Math.min(limit, 20000))) as Array<{
    id: string
    part_data: string
    message_data: string
    time_created: number
  }>
  rows.reverse()
  const out: PartEntry[] = []
  rows.forEach((row, seq) => {
    const p = parse(row.part_data)
    const m = parse(row.message_data)
    const state = p.state ?? {}
    const output = typeof state.output === "string"
      ? state.output
      : typeof state.metadata?.output === "string"
        ? state.metadata.output
        : ""
    out.push({
      id: String(row.id),
      seq,
      time: Number(row.time_created ?? 0),
      role: m.role === "user" ? "user" : m.role === "assistant" ? "assistant" : "unknown",
      type: String(p.type ?? "unknown"),
      text: typeof p.text === "string" ? p.text : "",
      tool: typeof p.tool === "string" ? p.tool : undefined,
      input: state.input && typeof state.input === "object" ? state.input : undefined,
      output,
      status: typeof state.status === "string" ? state.status : undefined,
      error: typeof state.error === "string" ? state.error : undefined,
      model: typeof m.modelID === "string" ? m.modelID : undefined,
      usage: m.tokens
        ? {
            input: Number(m.tokens.input ?? 0),
            output: Number(m.tokens.output ?? 0),
            reasoning: Number(m.tokens.reasoning ?? 0),
            cacheRead: Number(m.tokens.cache?.read ?? 0),
            cacheWrite: Number(m.tokens.cache?.write ?? 0),
            cost: Number(m.cost ?? 0),
            model: typeof m.modelID === "string" ? m.modelID : undefined,
            time: Number(m.time?.created ?? 0),
          }
        : undefined,
    })
  })
  return out
}

export function latestUsage(db: Database, sessionID: string): Usage | null {
  const rows = db.query(
    `SELECT data FROM message WHERE session_id = ? ORDER BY time_created DESC LIMIT 50`,
  ).all(sessionID) as Array<{ data: string }>
  for (const row of rows) {
    const m = parse(row.data)
    if (m.role !== "assistant" || !m.tokens) continue
    return {
      input: Number(m.tokens.input ?? 0),
      output: Number(m.tokens.output ?? 0),
      reasoning: Number(m.tokens.reasoning ?? 0),
      cacheRead: Number(m.tokens.cache?.read ?? 0),
      cacheWrite: Number(m.tokens.cache?.write ?? 0),
      cost: Number(m.cost ?? 0),
      model: typeof m.modelID === "string" ? m.modelID : undefined,
      time: Number(m.time?.created ?? 0),
    }
  }
  return null
}

export function sessionUsage(db: Database, sessionID: string): Usage {
  const total: Usage = { input: 0, output: 0, reasoning: 0, cacheRead: 0, cacheWrite: 0, cost: 0 }
  for (const u of messageUsage(db, sessionID)) {
    total.input += u.input
    total.output += u.output
    total.reasoning += u.reasoning
    total.cacheRead += u.cacheRead
    total.cacheWrite += u.cacheWrite
    total.cost += u.cost
    total.model = total.model ?? u.model
  }
  return total
}
