/**
 * Memory DB — shared target with memory-hub subcommands.
 *
 * Single SQLite file at .opencode/state/vector/memory.db (already exists,
 * created by the deprecated memory-system plugin). Uses FTS5 for lexical
 * recall and sqlite-vec (when available) for semantic recall. Same schema,
 * same tables — rio and memory-hub operate on identical targets.
 *
 * Lazy bun:sqlite import so the plugin loads on non-bun runtimes.
 */

import { createHash } from "node:crypto"
import { existsSync, mkdirSync } from "node:fs"
import { dirname, join } from "node:path"

export const CATEGORIES = ["preference", "architecture", "gotcha", "pattern", "workflow", "constraint"] as const
export type Category = (typeof CATEGORIES)[number]
export type Origin = "owner-statement" | "agent-observation" | "external-source" | "proposal" | "historical-approval"

export type Memory = {
  id: number
  content: string
  title: string | null
  category: Category
  importance: number
  confidence: number
  project: string | null
  workspace: string | null
  agent: string | null
  status: string
  origin: Origin | null
  isPrivate: boolean
  staleFlaggedAt: string | null
  staleReason: string | null
  recallCount: number
  confirmCount: number
  lastUsedAt: string
  lastConfirmedAt: string
  decayScore: number | null
  createdAt: string
  updatedAt: string
}

export type OriginStats = { total: number; byOrigin: Record<string, number> }

let Database: any = null

try {
  // bun:sqlite is available synchronously in bun runtime
  Database = require("bun:sqlite").Database
} catch {
  // Non-bun runtime: fall back to async import
}

export function memoryDbPath(directory: string): string {
  const override = process.env.MEMORY_DB_PATH?.trim()
  if (override) return override.replace(/^~(?=$|\/)/, process.env.HOME || "~")
  return join(directory, ".opencode", "state", "vector", "memory.db")
}

export class MemoryDb {
  db: any | null
  readonly path: string
  readonly embedDim: number

  constructor(directory: string, embedDim = 384) {
    this.path = memoryDbPath(directory)
    this.embedDim = embedDim
    try {
      mkdirSync(dirname(this.path), { recursive: true })
    } catch {}
    this._init()
  }

  private _init(): void {
    if (!Database) return
    try {
      this.db = new Database(this.path, { create: true })
      this.db.exec("PRAGMA journal_mode=WAL")
      this.db.exec("PRAGMA busy_timeout=3000")
      this.loadVec()
      this.ensure()
    } catch {}
  }

  private loadVec(): void {
    try {
      const vec = require("sqlite-vec")
      if (vec && typeof vec.load === "function") {
        vec.load(this.db as any)
        this.db.exec("SELECT vec_version()")
      }
    } catch {
      // Lexical recall still works without sqlite-vec.
    }
  }

  private ensure(): void {
    if (!this.db) return
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS memories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        content TEXT NOT NULL,
        title TEXT,
        category TEXT NOT NULL DEFAULT 'pattern',
        importance INTEGER NOT NULL DEFAULT 3,
        confidence REAL NOT NULL DEFAULT 1.0,
        project TEXT,
        workspace TEXT,
        agent TEXT,
        status TEXT NOT NULL DEFAULT 'active',
        origin TEXT,
        is_private INTEGER NOT NULL DEFAULT 0,
        dedup_key TEXT UNIQUE,
        embedding_model TEXT,
        stale_flagged_at TEXT,
        stale_reason TEXT,
        recall_count INTEGER NOT NULL DEFAULT 0,
        confirm_count INTEGER NOT NULL DEFAULT 1,
        last_used_at TEXT NOT NULL DEFAULT (datetime('now')),
        last_confirmed_at TEXT NOT NULL DEFAULT (datetime('now')),
        decay_score REAL,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
      );
      CREATE INDEX IF NOT EXISTS idx_memories_project ON memories(project);
      CREATE INDEX IF NOT EXISTS idx_memories_status ON memories(status);
      CREATE INDEX IF NOT EXISTS idx_memories_stale ON memories(stale_flagged_at);
      CREATE INDEX IF NOT EXISTS idx_memories_importance ON memories(importance DESC);
      CREATE TABLE IF NOT EXISTS memory_relations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        source_id INTEGER NOT NULL REFERENCES memories(id) ON DELETE CASCADE,
        target_id INTEGER NOT NULL REFERENCES memories(id) ON DELETE CASCADE,
        type TEXT NOT NULL,
        weight REAL NOT NULL DEFAULT 1.0,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        UNIQUE(source_id, target_id, type)
      );
      CREATE TABLE IF NOT EXISTS memory_conflicts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        older_id INTEGER NOT NULL,
        newer_id INTEGER NOT NULL,
        relation TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending',
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );
      CREATE TABLE IF NOT EXISTS memory_files (
        memory_id INTEGER NOT NULL REFERENCES memories(id) ON DELETE CASCADE,
        path TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        PRIMARY KEY (memory_id, path)
      );
      CREATE TABLE IF NOT EXISTS context_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        project TEXT NOT NULL,
        type TEXT NOT NULL,
        content TEXT NOT NULL,
        session_id TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );
      CREATE INDEX IF NOT EXISTS idx_context_project ON context_items(project, type);
      CREATE TABLE IF NOT EXISTS proposals (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        project TEXT,
        content TEXT NOT NULL,
        category TEXT NOT NULL DEFAULT 'gotcha',
        importance INTEGER NOT NULL DEFAULT 3,
        source TEXT,
        status TEXT NOT NULL DEFAULT 'pending',
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );
      CREATE TABLE IF NOT EXISTS audit (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        memory_id INTEGER,
        op TEXT NOT NULL,
        detail TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );
      CREATE TABLE IF NOT EXISTS meta (key TEXT PRIMARY KEY, value TEXT NOT NULL);
      CREATE VIRTUAL TABLE IF NOT EXISTS memories_fts USING fts5(memory_id UNINDEXED, title, content, tokenize='porter unicode61 remove_diacritics 2');
    `)
    try {
      this.db.exec(`CREATE VIRTUAL TABLE IF NOT EXISTS memories_vec USING vec0(memory_id INTEGER PRIMARY KEY, embedding float[${this.embedDim}])`)
    } catch {
      // sqlite-vec unavailable; lexical only.
    }
    const dim = String(this.embedDim)
    this.db.query("INSERT INTO meta(key,value) VALUES ('embedding_dim',?) ON CONFLICT(key) DO UPDATE SET value=excluded.value").run(dim)
  }

  close(): void {
    try { this.db?.close() } catch {}
  }

  private async ensureDb(): Promise<boolean> {
    if (this.db) return true
    await this._init()
    return !!this.db
  }

  get(id: number): Memory | null {
    if (!this.db) return null
    try {
      const row = this.db.query("SELECT * FROM memories WHERE id = ?").get(id) as any
      if (!row) return null
      return this.mapRow(row)
    } catch {
      return null
    }
  }

  files(memoryId: number): string[] {
    if (!this.db) return []
    try {
      const rows = this.db.query("SELECT path FROM memory_files WHERE memory_id = ?").all(memoryId) as any[]
      return rows.map((r) => r.path)
    } catch {
      return []
    }
  }

  private mapRow(row: any): Memory {
    return {
      id: Number(row.id),
      content: row.content,
      title: row.title ?? null,
      category: (row.category as Category) ?? "pattern",
      importance: Number(row.importance ?? 3),
      confidence: Number(row.confidence ?? 1.0),
      project: row.project ?? null,
      workspace: row.workspace ?? null,
      agent: row.agent ?? null,
      status: row.status ?? "active",
      origin: (row.origin as Origin) ?? null,
      isPrivate: Boolean(row.is_private),
      staleFlaggedAt: row.stale_flagged_at ?? null,
      staleReason: row.stale_reason ?? null,
      recallCount: Number(row.recall_count ?? 0),
      confirmCount: Number(row.confirm_count ?? 1),
      lastUsedAt: row.last_used_at,
      lastConfirmedAt: row.last_confirmed_at,
      decayScore: row.decay_score ?? null,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }
  }

  dedupKey(content: string): string {
    return createHash("sha256").update(content.toLowerCase().replace(/\s+/g, " ").trim()).digest("hex")
  }

  addMemory(input: {
    content: string
    title?: string
    category?: Category
    importance?: number
    confidence?: number
    project?: string | null
    workspace?: string | null
    agent?: string | null
    origin?: Origin | null
    isPrivate?: boolean
    files?: string[]
    embedding?: number[]
    embeddingModel?: string
  }): { id: number; action: "inserted" | "reinforced"; memory: Memory } {
    if (!this.db) throw new Error("memory DB not available")
    const content = input.content.trim()
    if (!content) throw new Error("content must not be empty")
    const dedup = this.dedupKey(content)
    const existing = this.db.query("SELECT id FROM memories WHERE dedup_key = ?").get(dedup) as any
    if (existing) {
      this.db.query(
        "UPDATE memories SET confirm_count=confirm_count+1, confidence=min(1.0, confidence+0.05), last_confirmed_at=datetime('now'), updated_at=datetime('now') WHERE id=?",
      ).run(Number(existing.id))
      this.audit(Number(existing.id), "reinforce", content.slice(0, 200))
      return { id: Number(existing.id), action: "reinforced", memory: this.get(Number(existing.id))! }
    }
    const result = this.db.query(
      `INSERT INTO memories
       (content,title,category,importance,confidence,project,workspace,agent,origin,is_private,dedup_key,embedding_model)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`,
    ).run(
      content, input.title ?? null, input.category ?? "pattern",
      input.importance ?? 3, input.confidence ?? 1.0, input.project ?? null,
      input.workspace ?? null, input.agent ?? null, input.origin ?? "agent-observation",
      input.isPrivate ? 1 : 0, dedup, input.embeddingModel ?? null,
    )
    const id = Number(result.lastInsertRowid ?? result.meta?.last_row_id ?? 0)
    if (input.files?.length) {
      for (const f of input.files) {
        this.db.query("INSERT INTO memory_files (memory_id, path, created_at) VALUES (?,?,datetime('now'))").run(id, f)
      }
    }
    if (input.embedding) {
      try {
        this.db.query("INSERT INTO memories_vec (memory_id, embedding) VALUES (?, ?)").run(id, JSON.stringify(input.embedding))
      } catch {}
    }
    // Index in FTS for lexical search
    try {
      this.db.query("INSERT INTO memories_fts(rowid, title, content) VALUES (?, ?, ?)").run(id, input.title ?? null, content)
    } catch {}
    this.audit(id, "insert", content.slice(0, 200))
    return { id, action: "inserted", memory: this.get(id)! }
  }

  fts(query: string, project: string | null, limit: number): Memory[] {
    if (!this.db) return []
    try {
      const rows = project
        ? this.db.query(
            `SELECT m.* FROM memories_fts f
             JOIN memories m ON m.id = f.rowid
             WHERE memories_fts MATCH ? AND m.project = ?
             ORDER BY rank LIMIT ?`,
          ).all(query, project, limit)
        : this.db.query(
            `SELECT m.* FROM memories_fts f
             JOIN memories m ON m.id = f.rowid
             WHERE memories_fts MATCH ?
             ORDER BY rank LIMIT ?`,
          ).all(query, limit)
      return (rows as any[]).map((r) => this.mapRow(r))
    } catch {
      return []
    }
  }

  vec(embedding: number[], project: string | null, limit: number): Array<{ id: number; distance: number }> {
    if (!this.db) return []
    try {
      const emb = JSON.stringify(embedding)
      const rows = project
        ? this.db.query(
            `SELECT memory_id as id, distance FROM memories_vec
             WHERE embedding MATCH ? AND memory_id IN (SELECT id FROM memories WHERE project = ?)
             ORDER BY distance LIMIT ?`,
          ).all(emb, project, limit)
        : this.db.query(
            `SELECT memory_id as id, distance FROM memories_vec
             WHERE embedding MATCH ?
             ORDER BY distance LIMIT ?`,
          ).all(emb, limit)
      return (rows as any[]).map((r) => ({ id: Number(r.id), distance: Number(r.distance) }))
    } catch {
      return []
    }
  }

  reinforce(id: number): void {
    if (!this.db) return
    try {
      this.db.query(
        "UPDATE memories SET confirm_count=confirm_count+1, last_confirmed_at=datetime('now'), updated_at=datetime('now') WHERE id=?",
      ).run(id)
    } catch {}
  }

  forget(id: number): void {
    if (!this.db) return
    try {
      this.db.query("DELETE FROM memories WHERE id = ?").run(id)
      try {
        this.db.query("DELETE FROM memories_fts WHERE rowid = ?").run(id)
      } catch {}
    } catch {}
  }

  audit(memoryId: number, op: string, detail: string): void {
    if (!this.db) return
    try {
      this.db.query("INSERT INTO audit (memory_id, op, detail, created_at) VALUES (?,?,?,datetime('now'))").run(memoryId, op, detail)
    } catch {}
  }

  stats(project: string | null): OriginStats {
    if (!this.db) return { total: 0, byOrigin: {} }
    try {
      const row = project
        ? this.db.query("SELECT COUNT(*) as total FROM memories WHERE project = ? AND status = 'active'").get(project) as any
        : this.db.query("SELECT COUNT(*) as total FROM memories WHERE status = 'active'").get() as any
      const total = Number(row?.total ?? 0)
      const byOrigin: Record<string, number> = {}
      try {
        const rows = project
          ? this.db.query("SELECT origin, COUNT(*) as c FROM memories WHERE project = ? AND status = 'active' GROUP BY origin").all(project)
          : this.db.query("SELECT origin, COUNT(*) as c FROM memories WHERE status = 'active' GROUP BY origin").all()
        for (const r of rows as any[]) {
          byOrigin[r.origin ?? "unknown"] = Number(r.c)
        }
      } catch {}
      return { total, byOrigin }
    } catch {
      return { total: 0, byOrigin: {} }
    }
  }
}
