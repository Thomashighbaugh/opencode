/**
 * Read-only adapter over OpenCode's own database. Source of truth for all
 * metrics. No inference used for any value — everything derives from SQL.
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

function hasTable(db: Database, name: string): boolean {
  try {
    return db.query("SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = ?").get(name) != null
  } catch {
    return false
  }
}

/** OpenCode stores model as either a plain string ("claude-sonnet-4") or a JSON
 *  object string ('{"id":"...","providerID":"..."}'). Extract the id string so
 *  pricing/window lookup can match it. */
export function extractModelId(model: unknown): string | undefined {
  if (typeof model === "string") {
    if (!model.startsWith("{")) return model || undefined
    try {
      const parsed = JSON.parse(model)
      if (parsed && typeof parsed === "object" && parsed.id) return String(parsed.id)
    } catch {
      return model || undefined
    }
    return undefined
  }
  if (model && typeof model === "object" && (model as any).id) return String((model as any).id)
  return undefined
}

function mapSessionRow(row: any): SessionRow {
  return {
    id: String(row.id),
    projectID: String(row.project_id),
    directory: String(row.directory ?? ""),
    title: row.title ?? undefined,
    agent: row.agent ?? undefined,
    model: extractModelId(row.model),
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
  for (const table of ["session_v2", "session"] as const) {
    if (!hasTable(db, table)) continue
    try {
      const row = db.query(`SELECT ${SESSION_COLUMNS} FROM ${table} WHERE id = ?`).get(id) as any
      if (row) return mapSessionRow(row)
    } catch {
      continue
    }
  }
  return null
}

export function listSessions(db: Database, days = 30, projectID?: string): SessionRow[] {
  const cutoff = Date.now() - Math.max(1, days) * 86_400_000
  const rows = projectID
    ? db.query(
        `SELECT ${SESSION_COLUMNS} FROM session_v2 WHERE time_updated >= ? AND project_id = ? ORDER BY time_updated DESC LIMIT 500`,
      ).all(cutoff, projectID)
    : db.query(
        `SELECT ${SESSION_COLUMNS} FROM session_v2 WHERE time_updated >= ? ORDER BY time_updated DESC LIMIT 500`,
      ).all(cutoff)
  return (rows as any[]).map((row) => mapSessionRow(row))
}

function usageFromTokens(tokens: any, model?: string): Usage | undefined {
  return {
    input: Number(tokens.input ?? 0),
    output: Number(tokens.output ?? 0),
    reasoning: Number(tokens.reasoning ?? 0),
    cacheRead: Number(tokens.cache?.read ?? 0),
    cacheWrite: Number(tokens.cache?.write ?? 0),
    cost: Number(tokens.cost ?? 0),
    model: extractModelId(tokens.model ?? model),
    time: undefined,
  }
}

export function sessionParts(db: Database, sessionID: string, limit = 4000): PartEntry[] {
  let v2 = false
  try {
    v2 = db.query("SELECT 1 FROM session_v2 WHERE id = ?").get(sessionID) != null
  } catch {}
  if (v2) {
    try {
      const v2Parts = sessionPartsV2(db, sessionID, limit)
      if (v2Parts.length > 0) return v2Parts
    } catch {
      // fall through to V1 path
    }
  }
  return sessionPartsV1(db, sessionID, limit)
}

function sessionPartsV1(db: Database, sessionID: string, limit: number): PartEntry[] {
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
      model: extractModelId(m.modelID ?? m.model),
      usage: m.tokens
        ? {
            input: Number(m.tokens.input ?? 0),
            output: Number(m.tokens.output ?? 0),
            reasoning: Number(m.tokens.reasoning ?? 0),
            cacheRead: Number(m.tokens.cache?.read ?? 0),
            cacheWrite: Number(m.tokens.cache?.write ?? 0),
            cost: Number(m.cost ?? 0),
            model: extractModelId(m.modelID ?? m.model),
            time: Number(m.time?.created ?? 0),
          }
        : undefined,
    })
  })
  return out
}

function sessionPartsV2(db: Database, sessionID: string, limit: number): PartEntry[] {
  const rows = db.query(
    `SELECT id, type, seq, data FROM session_message WHERE session_id = ? ORDER BY seq ASC LIMIT ?`,
  ).all(sessionID, Math.max(1, Math.min(limit, 20000))) as Array<{
    id: string
    type: string
    seq: number
    data: string
  }>
  const out: PartEntry[] = []
  let seq = 0
  for (const row of rows) {
    const m = parse(row.data)
    const model = extractModelId(m.model)
    if (row.type === "user") {
      out.push({
        id: String(row.id),
        seq: seq++,
        time: Number(m.time?.created ?? row.seq ?? 0),
        role: "user",
        type: "text",
        text: typeof m.text === "string" ? m.text : "",
        tool: undefined,
        input: undefined,
        output: undefined,
        status: undefined,
        error: undefined,
        model,
        usage: m.tokens ? usageFromTokens(m.tokens, model) : undefined,
      })
    } else if (row.type === "assistant" && Array.isArray(m.content)) {
      for (const item of m.content) {
        if (item.type === "text" && typeof item.text === "string") {
          out.push({
            id: String(row.id),
            seq: seq++,
            time: Number(m.time?.created ?? row.seq ?? 0),
            role: "assistant",
            type: "text",
            text: item.text,
            tool: undefined,
            input: undefined,
            output: undefined,
            status: undefined,
            error: undefined,
            model,
            usage: undefined,
          })
        } else if (item.type === "reasoning" && typeof item.text === "string") {
          out.push({
            id: String(row.id),
            seq: seq++,
            time: Number(m.time?.created ?? row.seq ?? 0),
            role: "assistant",
            type: "reasoning",
            text: item.text,
            tool: undefined,
            input: undefined,
            output: undefined,
            status: undefined,
            error: undefined,
            model,
            usage: undefined,
          })
        } else if (item.type === "tool") {
          const state = item.state ?? {}
          const input = state.input && typeof state.input === "object" ? state.input : undefined
          const output = typeof state.output === "string" ? state.output :
            typeof state.metadata?.output === "string" ? state.metadata.output :
            typeof state.content === "string" ? state.content : ""
          out.push({
            id: typeof item.id === "string" ? item.id : String(row.id),
            seq: seq++,
            time: Number(m.time?.created ?? row.seq ?? 0),
            role: "assistant",
            type: "tool",
            text: "",
            tool: typeof item.name === "string" ? item.name : undefined,
            input,
            output,
            status: typeof state.status === "string" ? state.status : undefined,
            error: typeof state.error === "string" ? state.error : undefined,
            model,
            usage: undefined,
          })
        }
      }
    }
  }
  return out
}

export function latestUsage(db: Database, sessionID: string): Usage | null {
  let v2 = false
  try {
    v2 = db.query("SELECT 1 FROM session_v2 WHERE id = ?").get(sessionID) != null
  } catch {}
  const rows: Array<{ data: string; type?: string }> = []
  if (v2) {
    try {
      const v2Rows = db.query(`SELECT data, type FROM session_message WHERE session_id = ? ORDER BY time_created DESC LIMIT 50`).all(sessionID) as Array<{ data: string; type?: string }>
      rows.push(...v2Rows)
    } catch {
      // fall through to V1
    }
  }
  if (!v2 || rows.length === 0) {
    try {
      const v1Rows = db.query(`SELECT data FROM message WHERE session_id = ? ORDER BY time_created DESC LIMIT 50`).all(sessionID) as Array<{ data: string }>
      for (const r of v1Rows) rows.push({ data: r.data })
    } catch {}
  }
  for (const row of rows) {
    const m = parse(row.data)
    if (v2 ? row.type !== "assistant" : m.role !== "assistant") continue
    if (!m.tokens) continue
    return {
      input: Number(m.tokens.input ?? 0),
      output: Number(m.tokens.output ?? 0),
      reasoning: Number(m.tokens.reasoning ?? 0),
      cacheRead: Number(m.tokens.cache?.read ?? 0),
      cacheWrite: Number(m.tokens.cache?.write ?? 0),
      cost: Number(m.cost ?? 0),
      model: extractModelId(m.modelID ?? m.model),
      time: Number(m.time?.created ?? 0),
    }
  }
  return null
}
