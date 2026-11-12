/**
 * Small local SQLite store for the optimization plugin. Separate from OpenCode's
 * main DB. Holds quality cache, savings ledger, and checkpoints.
 *
 * `bun:sqlite` is imported lazily because the OpenCode server runtime may
 * not be a bun process. If unavailable, all functions degrade gracefully.
 */

import { existsSync, mkdirSync } from "node:fs"
import { homedir } from "node:os"
import { join } from "node:path"

export type CheckpointRow = {
  id: string
  sessionID: string
  projectID: string
  directory: string
  trigger: string
  mode: string
  qualityScore: number | null
  fillPct: number | null
  activeFiles: string[]
  content: string
  constants: { maxChars: number }
}

export type QualityRow = {
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

export type SavingsEvent = {
  type: string
  tokens: number
  costUsd: number
  sessionID: string
  model?: string | null
  detail: string
  createdAt: number
}

export function dataDir(): string {
  const override = process.env.RIO_DATA_DIR?.trim()
  if (override) return override
  return join(homedir(), ".local/share/opencode/rio")
}

let dbConstructorCache: any = null
let dbConstructorPromise: Promise<any> | null = null

async function ensureDbConstructor(): Promise<any> {
  if (dbConstructorCache) return dbConstructorCache
  if (dbConstructorPromise) return dbConstructorPromise
  dbConstructorPromise = (async () => {
    try {
      const mod = await import("bun:sqlite")
      dbConstructorCache = mod.Database
      return mod.Database
    } catch {
      dbConstructorCache = null
      return null
    }
  })()
  return dbConstructorPromise
}

export class OptimizerStore {
  db: any | null
  readonly dir: string

  constructor(dir = dataDir()) {
    this.dir = dir
    try {
      mkdirSync(dir, { recursive: true })
    } catch {}
    this.db = null
    // Initialize lazily on first use
    void this._init()
  }

  private async _init(): Promise<void> {
    try {
      const Database = await ensureDbConstructor()
      if (Database) {
        this.db = new Database(join(this.dir, "rio.db"))
        this.db.exec("PRAGMA journal_mode=WAL")
        this.db.exec(`
          CREATE TABLE IF NOT EXISTS quality_cache (
            sessionID TEXT PRIMARY KEY,
            resourceHealth REAL,
            sessionEfficiency REAL,
            fillPct REAL,
            toolCalls INTEGER DEFAULT 0,
            compactions INTEGER DEFAULT 0,
            scoreVersion INTEGER DEFAULT 2,
            data TEXT,
            updatedAt REAL
          );
          CREATE TABLE IF NOT EXISTS savings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            type TEXT,
            tokens INTEGER,
            costUsd REAL,
            sessionID TEXT,
            model TEXT,
            detail TEXT,
            createdAt REAL
          );
          CREATE TABLE IF NOT EXISTS checkpoints (
            id TEXT PRIMARY KEY,
            sessionID TEXT,
            projectID TEXT,
            directory TEXT,
            trigger TEXT,
            mode TEXT,
            qualityScore REAL,
            fillPct REAL,
            activeFiles TEXT,
            content TEXT,
            maxChars INTEGER,
            createdAt REAL
          );
        `)
      }
    } catch {}
  }

  private async ensureDb(): Promise<boolean> {
    if (this.db) return true
    await this._init()
    return !!this.db
  }

  getQuality(sessionID: string): QualityRow | null {
    // Synchronous read — returns null if DB not yet initialized
    if (!this.db) return null
    try {
      const row = this.db.query("SELECT * FROM quality_cache WHERE sessionID = ?").get(sessionID) as any
      if (!row) return null
      return {
        sessionID: row.sessionID,
        resourceHealth: row.resourceHealth ?? null,
        sessionEfficiency: row.sessionEfficiency ?? null,
        fillPct: row.fillPct ?? null,
        toolCalls: Number(row.toolCalls ?? 0),
        compactions: Number(row.compactions ?? 0),
        scoreVersion: Number(row.scoreVersion ?? 2),
        data: row.data ?? null,
        updatedAt: Number(row.updatedAt ?? 0),
      }
    } catch {
      return null
    }
  }

  setQuality(row: QualityRow): void {
    if (!this.db) return
    try {
      this.db.query(
        `INSERT INTO quality_cache (sessionID, resourceHealth, sessionEfficiency, fillPct, toolCalls, compactions, scoreVersion, data, updatedAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT(sessionID) DO UPDATE SET
           resourceHealth=excluded.resourceHealth,
           sessionEfficiency=excluded.sessionEfficiency,
           fillPct=excluded.fillPct,
           toolCalls=excluded.toolCalls,
           compactions=excluded.compactions,
           scoreVersion=excluded.scoreVersion,
           data=excluded.data,
           updatedAt=excluded.updatedAt`,
      ).run(
        row.sessionID, row.resourceHealth, row.sessionEfficiency, row.fillPct,
        row.toolCalls, row.compactions, row.scoreVersion, row.data, row.updatedAt,
      )
    } catch {}
  }

  logSavings(event: SavingsEvent): void {
    if (!this.db) return
    try {
      this.db.query(
        `INSERT INTO savings (type, tokens, costUsd, sessionID, model, detail, createdAt)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
      ).run(event.type, event.tokens, event.costUsd, event.sessionID, event.model ?? null, event.detail, event.createdAt)
    } catch {}
  }

  captureCheckpoint(input: {
    sessionID: string
    projectID: string
    directory: string
    trigger: string
    mode: string
    qualityScore: number | null
    fillPct: number | null
    activeFiles: string[]
    content: string
    constants: { maxChars: number }
  }): CheckpointRow {
    const id = `rio_cp_${Date.now()}_${Math.random().toString(36).slice(2)}`
    if (!this.db) {
      return {
        id, sessionID: input.sessionID, projectID: input.projectID, directory: input.directory,
        trigger: input.trigger, mode: input.mode, qualityScore: input.qualityScore,
        fillPct: input.fillPct, activeFiles: input.activeFiles, content: input.content,
        constants: input.constants,
      }
    }
    try {
      this.db.query(
        `INSERT INTO checkpoints (id, sessionID, projectID, directory, trigger, mode, qualityScore, fillPct, activeFiles, content, maxChars, createdAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      ).run(
        id, input.sessionID, input.projectID, input.directory, input.trigger, input.mode,
        input.qualityScore, input.fillPct, JSON.stringify(input.activeFiles), input.content,
        input.constants.maxChars, Date.now() / 1000,
      )
    } catch {}
    return {
      id, sessionID: input.sessionID, projectID: input.projectID, directory: input.directory,
      trigger: input.trigger, mode: input.mode, qualityScore: input.qualityScore,
      fillPct: input.fillPct, activeFiles: input.activeFiles, content: input.content,
      constants: input.constants,
    }
  }

  findCheckpointCandidates(projectID: string, days: number, limit: number): CheckpointRow[] {
    if (!this.db) return []
    try {
      const cutoff = Date.now() - Math.max(1, days) * 86_400_000
      const rows = this.db.query(
        `SELECT * FROM checkpoints WHERE projectID = ? AND createdAt >= ? ORDER BY createdAt DESC LIMIT ?`,
      ).all(projectID, cutoff, limit) as any[]
      return rows.map((r) => ({
        id: r.id,
        sessionID: r.sessionID,
        projectID: r.projectID,
        directory: r.directory,
        trigger: r.trigger,
        mode: r.mode,
        qualityScore: r.qualityScore,
        fillPct: r.fillPct,
        activeFiles: JSON.parse(r.activeFiles ?? "[]"),
        content: r.content,
        constants: { maxChars: Number(r.maxChars ?? 12_000) },
      }))
    } catch {
      return []
    }
  }

  pruneCheckpoints(retentionDays: number): void {
    if (!this.db) return
    try {
      const cutoff = Date.now() - Math.max(1, retentionDays) * 86_400_000
      this.db.query("DELETE FROM checkpoints WHERE createdAt < ?").run(cutoff)
    } catch {}
  }

  savings(days = 30): SavingsEvent[] {
    if (!this.db) return []
    try {
      const cutoff = Date.now() - Math.max(1, days) * 86_400_000
      const rows = this.db.query(
        `SELECT * FROM savings WHERE createdAt >= ? ORDER BY createdAt DESC`,
      ).all(cutoff) as any[]
      return rows.map((r) => ({
        type: r.type,
        tokens: Number(r.tokens),
        costUsd: Number(r.costUsd),
        sessionID: r.sessionID,
        model: r.model,
        detail: r.detail,
        createdAt: Number(r.createdAt),
      }))
    } catch {
      return []
    }
  }

  close(): void {
    try { this.db?.close() } catch {}
  }
}
