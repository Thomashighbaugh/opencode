/**
 * Small durable store for values that do not belong in OpenCode's own DB:
 * quality cache, checkpoints, savings events, and meta.
 */

import { Database } from "bun:sqlite"
import { existsSync, mkdirSync } from "node:fs"
import { homedir } from "node:os"
import { join } from "node:path"
import { redact, scrubControl } from "../redact.ts"
import { safePath, oneLine, truncate } from "../text.ts"

const SCHEMA = `
CREATE TABLE IF NOT EXISTS quality_cache (
  session_id TEXT PRIMARY KEY,
  resource_health REAL,
  session_efficiency REAL,
  fill_pct REAL,
  tool_calls INTEGER DEFAULT 0,
  compactions INTEGER DEFAULT 0,
  score_version INTEGER DEFAULT 2,
  data_json TEXT,
  updated_at REAL NOT NULL
);
CREATE TABLE IF NOT EXISTS checkpoints (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id TEXT NOT NULL,
  project_id TEXT,
  directory TEXT,
  trigger TEXT NOT NULL,
  mode TEXT,
  quality_score REAL,
  fill_pct REAL,
  active_files_json TEXT,
  decisions_json TEXT,
  content TEXT NOT NULL,
  raw_bytes INTEGER NOT NULL,
  created_at REAL NOT NULL
);
CREATE INDEX IF NOT EXISTS checkpoints_project_time ON checkpoints(project_id, created_at DESC);
CREATE TABLE IF NOT EXISTS savings_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  event_type TEXT NOT NULL,
  tokens INTEGER NOT NULL DEFAULT 0,
  cost_usd REAL NOT NULL DEFAULT 0,
  session_id TEXT,
  model TEXT,
  detail TEXT,
  created_at REAL NOT NULL
);
CREATE INDEX IF NOT EXISTS savings_events_time ON savings_events(created_at DESC);
CREATE TABLE IF NOT EXISTS meta (key TEXT PRIMARY KEY, value TEXT NOT NULL);
`

export function dataDir(): string {
  const raw = process.env.TOKEN_OPTIMIZER_DATA_DIR?.trim()
  const base = raw || join(process.env.XDG_DATA_HOME || join(homedir(), ".local/share"), "opencode", "token-optimizer")
  return base.replace(/^~(?=$|\/)/, homedir())
}

export type QualityCache = {
  sessionID: string
  resourceHealth: number | null
  sessionEfficiency: number | null
  fillPct: number | null
  toolCalls: number
  compactions: number
  scoreVersion: number
  data: string | null
  updatedAt: number
}

export type CheckpointRow = {
  id: number
  sessionID: string
  projectID: string | null
  directory: string | null
  trigger: string
  mode: string
  qualityScore: number | null
  fillPct: number | null
  activeFiles: string[]
  decisions: string[]
  content: string
  rawBytes: number
  createdAt: number
}

export type SavingsEvent = {
  type: string
  tokens: number
  costUsd: number
  sessionID?: string
  model?: string
  detail?: string
  createdAt: number
}

export class OptimizerStore {
  private db: Database
  readonly path: string

  constructor(dir = dataDir()) {
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
    this.path = join(dir, "optimizer.db")
    this.db = new Database(this.path, { create: true })
    this.db.exec("PRAGMA journal_mode=WAL")
    this.db.exec("PRAGMA busy_timeout=3000")
    this.db.exec(SCHEMA)
  }

  close(): void {
    this.db.close()
  }

  getQuality(sessionID: string): QualityCache | null {
    const row = this.db.query("SELECT * FROM quality_cache WHERE session_id = ?").get(sessionID) as any
    if (!row) return null
    return {
      sessionID: String(row.session_id),
      resourceHealth: row.resource_health === null ? null : Number(row.resource_health),
      sessionEfficiency: row.session_efficiency === null ? null : Number(row.session_efficiency),
      fillPct: row.fill_pct === null ? null : Number(row.fill_pct),
      toolCalls: Number(row.tool_calls ?? 0),
      compactions: Number(row.compactions ?? 0),
      scoreVersion: Number(row.score_version ?? 2),
      data: row.data_json ?? null,
      updatedAt: Number(row.updated_at ?? 0),
    }
  }

  setQuality(value: QualityCache): void {
    this.db.query(
      `INSERT INTO quality_cache
       (session_id, resource_health, session_efficiency, fill_pct, tool_calls,
        compactions, score_version, data_json, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(session_id) DO UPDATE SET
         resource_health=excluded.resource_health,
         session_efficiency=excluded.session_efficiency,
         fill_pct=excluded.fill_pct,
         tool_calls=excluded.tool_calls,
         compactions=excluded.compactions,
         score_version=excluded.score_version,
         data_json=excluded.data_json,
         updated_at=excluded.updated_at`,
    ).run(
      value.sessionID,
      value.resourceHealth,
      value.sessionEfficiency,
      value.fillPct,
      value.toolCalls,
      value.compactions,
      value.scoreVersion,
      value.data,
      value.updatedAt,
    )
  }

  captureCheckpoint(input: {
    sessionID: string
    projectID?: string
    directory?: string
    trigger: string
    mode: string
    qualityScore: number | null
    fillPct: number | null
    activeFiles: string[]
    decisions?: string[]
    content: string
    constants?: { maxChars?: number }
  }): CheckpointRow {
    const files = input.activeFiles.map(safePath).map(redact).slice(0, 15)
    const decisions = (input.decisions ?? []).map((d) => redact(oneLine(d))).slice(0, 10)
    const content = truncate(redact(scrubControl(input.content)), input.constants?.maxChars ?? 12_000)
    const createdAt = Date.now() / 1000
    const result = this.db.query(
      `INSERT INTO checkpoints
       (session_id, project_id, directory, trigger, mode, quality_score, fill_pct,
        active_files_json, decisions_json, content, raw_bytes, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ).run(
      input.sessionID,
      input.projectID ?? null,
      input.directory ?? null,
      input.trigger,
      input.mode,
      input.qualityScore,
      input.fillPct,
      JSON.stringify(files),
      JSON.stringify(decisions),
      content,
      Buffer.byteLength(content, "utf8"),
      createdAt,
    )
    return {
      id: Number(result.lastInsertRowid),
      sessionID: input.sessionID,
      projectID: input.projectID ?? null,
      directory: input.directory ?? null,
      trigger: input.trigger,
      mode: input.mode,
      qualityScore: input.qualityScore,
      fillPct: input.fillPct,
      activeFiles: files,
      decisions,
      content,
      rawBytes: Buffer.byteLength(content, "utf8"),
      createdAt,
    }
  }

  listCheckpoints(projectID?: string, limit = 10): CheckpointRow[] {
    const rows = projectID
      ? this.db.query(
          `SELECT * FROM checkpoints WHERE project_id = ? ORDER BY created_at DESC LIMIT ?`,
        ).all(projectID, limit)
      : this.db.query(`SELECT * FROM checkpoints ORDER BY created_at DESC LIMIT ?`).all(limit)
    return (rows as any[]).map((row) => ({
      id: Number(row.id),
      sessionID: String(row.session_id),
      projectID: row.project_id ?? null,
      directory: row.directory ?? null,
      trigger: String(row.trigger),
      mode: String(row.mode ?? "general"),
      qualityScore: row.quality_score === null ? null : Number(row.quality_score),
      fillPct: row.fill_pct === null ? null : Number(row.fill_pct),
      activeFiles: safeJsonArray(row.active_files_json),
      decisions: safeJsonArray(row.decisions_json),
      content: String(row.content),
      rawBytes: Number(row.raw_bytes),
      createdAt: Number(row.created_at),
    }))
  }

  findCheckpointCandidates(projectID: string | undefined, days: number, limit: number): CheckpointRow[] {
    const cutoff = Date.now() / 1000 - Math.max(1, days) * 86_400
    const rows = projectID
      ? this.db.query(
          `SELECT * FROM checkpoints WHERE project_id = ? AND created_at > ? ORDER BY created_at DESC LIMIT ?`,
        ).all(projectID, cutoff, limit)
      : this.db.query(
          `SELECT * FROM checkpoints WHERE created_at > ? ORDER BY created_at DESC LIMIT ?`,
        ).all(cutoff, limit)
    return (rows as any[]).map((row) => ({
      id: Number(row.id),
      sessionID: String(row.session_id),
      projectID: row.project_id ?? null,
      directory: row.directory ?? null,
      trigger: String(row.trigger),
      mode: String(row.mode ?? "general"),
      qualityScore: row.quality_score === null ? null : Number(row.quality_score),
      fillPct: row.fill_pct === null ? null : Number(row.fill_pct),
      activeFiles: safeJsonArray(row.active_files_json),
      decisions: safeJsonArray(row.decisions_json),
      content: String(row.content),
      rawBytes: Number(row.raw_bytes),
      createdAt: Number(row.created_at),
    }))
  }

  pruneCheckpoints(days: number): number {
    if (days <= 0) return 0
    const cutoff = Date.now() / 1000 - days * 86_400
    const result = this.db.query(
      `DELETE FROM checkpoints WHERE created_at < ?
       AND id NOT IN (SELECT id FROM checkpoints ORDER BY created_at DESC LIMIT 3)`,
    ).run(cutoff)
    return Number(result.changes ?? 0)
  }

  logSavings(event: SavingsEvent): void {
    this.db.query(
      `INSERT INTO savings_events (event_type, tokens, cost_usd, session_id, model, detail, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
    ).run(
      event.type,
      Math.max(0, Math.round(event.tokens)),
      Math.max(0, event.costUsd),
      event.sessionID ?? null,
      event.model ?? null,
      event.detail ? oneLine(event.detail, 500) : null,
      event.createdAt || Date.now() / 1000,
    )
  }

  savings(days = 30): SavingsEvent[] {
    const cutoff = Date.now() / 1000 - Math.max(1, days) * 86_400
    const rows = this.db.query(
      `SELECT event_type, tokens, cost_usd, session_id, model, detail, created_at
       FROM savings_events WHERE created_at >= ? ORDER BY created_at DESC LIMIT 5000`,
    ).all(cutoff) as any[]
    return rows.map((row) => ({
      type: String(row.event_type),
      tokens: Number(row.tokens ?? 0),
      costUsd: Number(row.cost_usd ?? 0),
      sessionID: row.session_id ?? undefined,
      model: row.model ?? undefined,
      detail: row.detail ?? undefined,
      createdAt: Number(row.created_at ?? 0),
    }))
  }

  getMeta(key: string): string | null {
    const row = this.db.query("SELECT value FROM meta WHERE key = ?").get(key) as any
    return row ? String(row.value) : null
  }

  setMeta(key: string, value: string): void {
    this.db.query(
      "INSERT INTO meta(key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value=excluded.value",
    ).run(key, value)
  }
}

function safeJsonArray(value: unknown): string[] {
  try {
    const parsed = typeof value === "string" ? JSON.parse(value) : []
    return Array.isArray(parsed) ? parsed.map(String) : []
  } catch {
    return []
  }
}
