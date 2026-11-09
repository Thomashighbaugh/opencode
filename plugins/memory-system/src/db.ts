/**
 * memory-system store. One SQLite file beside the existing vector stores:
 * FTS5 for lexical recall, sqlite-vec (vec0) for semantic recall. Same
 * sqlite-vec extension and model cache as `state/vector/context.db`.
 */

import { Database } from "bun:sqlite"
import { createHash } from "node:crypto"
import { createRequire } from "node:module"
import { mkdirSync } from "node:fs"
import { dirname, join } from "node:path"
import { EMBED_DIM } from "../../../skills/vectorize-context/scripts/embedder.ts"

const require = createRequire(import.meta.url)

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
  createdAt: string
  updatedAt: string
}

export function databasePath(directory: string): string {
  const override = process.env.MEMORY_DB_PATH?.trim()
  if (override) return override.replace(/^~(?=$|\/)/, process.env.HOME || "~")
  return join(directory, ".opencode", "state", "vector", "memory.db")
}

export class MemoryDb {
  readonly db: Database
  readonly path: string

  constructor(directory: string) {
    this.path = databasePath(directory)
    mkdirSync(dirname(this.path), { recursive: true })
    this.db = new Database(this.path, { create: true })
    this.db.exec("PRAGMA journal_mode=WAL")
    this.db.exec("PRAGMA busy_timeout=3000")
    this.loadVec()
    this.ensure()
  }

  private loadVec(): void {
    try {
      const vec = require("sqlite-vec")
      vec.load(this.db)
      this.db.exec("SELECT vec_version()")
    } catch {
      // Lexical recall still works.
    }
  }

  private ensure(): void {
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
      this.db.exec(`CREATE VIRTUAL TABLE IF NOT EXISTS memories_vec USING vec0(memory_id INTEGER PRIMARY KEY, embedding float[${EMBED_DIM}])`)
    } catch {
      // sqlite-vec unavailable; lexical only.
    }
    for (const migration of [
      "ALTER TABLE memories ADD COLUMN last_confirmed_at TEXT NOT NULL DEFAULT ''",
      "ALTER TABLE memories ADD COLUMN decay_score REAL",
    ]) {
      try { this.db.exec(migration) } catch {}
    }
    const dim = String(EMBED_DIM)
    this.db.query("INSERT INTO meta(key,value) VALUES ('embedding_dim',?) ON CONFLICT(key) DO UPDATE SET value=excluded.value").run(dim)
  }

  close(): void { this.db.close() }

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
    const content = input.content.trim()
    if (!content) throw new Error("content must not be empty")
    const dedup = createHash("sha256").update(content.toLowerCase().replace(/\s+/g, " ").trim()).digest("hex")
    const existing = this.db.query("SELECT id FROM memories WHERE dedup_key = ?").get(dedup) as any
    if (existing) {
      this.db.query("UPDATE memories SET confirm_count=confirm_count+1, confidence=min(1.0, confidence+0.05), last_confirmed_at=datetime('now'), updated_at=datetime('now') WHERE id=?").run(existing.id)
      this.audit(Number(existing.id), "reinforce", content.slice(0, 200))
      return { id: Number(existing.id), action: "reinforced", memory: this.get(Number(existing.id))! }
    }
    const result = this.db.query(
      `INSERT INTO memories
       (content,title,category,importance,confidence,project,workspace,agent,origin,is_private,dedup_key,embedding_model)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`,
    ).run(
      content, input.title ?? null, input.category ?? "pattern",
      Math.max(1, Math.min(5, input.importance ?? 3)),
      Math.max(0, Math.min(1, input.confidence ?? 1)),
      input.project ?? null, input.workspace ?? null, input.agent ?? null,
      input.origin ?? "agent-observation", input.isPrivate ? 1 : 0, dedup,
      input.embeddingModel ?? null,
    )
    const id = Number(result.lastInsertRowid)
    try { this.db.query("INSERT INTO memories_fts(memory_id,title,content) VALUES (?,?,?)").run(id, input.title ?? "", content) } catch {}
    if (input.embedding?.length) {
      try { this.db.query("INSERT INTO memories_vec(memory_id,embedding) VALUES (?,?)").run(id, new Float32Array(input.embedding)) } catch {}
    }
    for (const file of input.files ?? []) {
      this.db.query("INSERT OR IGNORE INTO memory_files(memory_id,path) VALUES (?,?)").run(id, file)
    }
    this.audit(id, "insert", content.slice(0, 200))
    return { id, action: "inserted", memory: this.get(id)! }
  }

  get(id: number): Memory | null {
    const row = this.db.query("SELECT * FROM memories WHERE id = ?").get(id) as any
    return row ? mapMemory(row) : null
  }

  delete(id: number): boolean {
    try { this.db.query("DELETE FROM memories_fts WHERE memory_id = ?").run(id) } catch {}
    try { this.db.query("DELETE FROM memories_vec WHERE memory_id = ?").run(id) } catch {}
    this.db.query("DELETE FROM memories WHERE id = ?").run(id)
    this.audit(id, "forget", null)
    return true
  }

  reinforce(id: number): void {
    this.db.query("UPDATE memories SET confirm_count=confirm_count+1, confidence=min(1.0, confidence+0.05), updated_at=datetime('now') WHERE id=?").run(id)
    this.audit(id, "reinforce", null)
  }

  markUsed(ids: number[]): void {
    for (const id of ids) {
      this.db.query("UPDATE memories SET recall_count=recall_count+1, last_used_at=datetime('now') WHERE id=?").run(id)
    }
  }

  relate(source: number, target: number, type: string, weight = 1): void {
    this.db.query("INSERT OR IGNORE INTO memory_relations(source_id,target_id,type,weight) VALUES (?,?,?,?)").run(source, target, type, weight)
    this.audit(source, "relate", `${target}:${type}`)
  }

  relations(id: number): Array<{ source_id: number; target_id: number; type: string; weight: number }> {
    return this.db.query("SELECT source_id,target_id,type,weight FROM memory_relations WHERE source_id=? OR target_id=?").all(id, id) as any[]
  }

  files(id: number): string[] {
    return (this.db.query("SELECT path FROM memory_files WHERE memory_id=?").all(id) as any[]).map((r) => String(r.path))
  }

  addConflict(olderID: number, newerID: number, relation: string): void {
    if (olderID === newerID) return
    this.db.query("INSERT INTO memory_conflicts(older_id,newer_id,relation) VALUES (?,?,?)").run(olderID, newerID, relation)
  }

  conflicts(status = "pending"): any[] {
    return this.db.query("SELECT * FROM memory_conflicts WHERE status=? ORDER BY created_at DESC LIMIT 100").all(status) as any[]
  }

  resolveConflict(id: number, status: string): void {
    this.db.query("UPDATE memory_conflicts SET status=? WHERE id=?").run(status, id)
  }

  markStaleForFiles(paths: string[], reason = "commit touched anchored file"): number {
    if (!paths.length) return 0
    const rows = this.db.query(
      `SELECT DISTINCT memory_id FROM memory_files WHERE path IN (${paths.map(() => "?").join(",")})`,
    ).all(...paths) as any[]
    let count = 0
    for (const row of rows) {
      const id = Number(row.memory_id)
      const mem = this.get(id)
      if (!mem || mem.importance >= 5 || mem.category === "preference") continue
      this.db.query("UPDATE memories SET stale_flagged_at=datetime('now'), stale_reason=?, updated_at=datetime('now') WHERE id=?").run(reason, id)
      this.audit(id, "stale", reason)
      count++
    }
    return count
  }

  revalidate(id: number): boolean {
    this.db.query("UPDATE memories SET stale_flagged_at=NULL, stale_reason=NULL, updated_at=datetime('now') WHERE id=?").run(id)
    this.audit(id, "revalidate", null)
    return true
  }

  addContext(project: string, type: string, content: string, sessionID?: string): void {
    if (type === "goal") this.db.query("DELETE FROM context_items WHERE project=? AND type='goal'").run(project)
    this.db.query("INSERT INTO context_items(project,type,content,session_id) VALUES (?,?,?,?)").run(project, type, content.trim(), sessionID ?? null)
    if (type === "decision" || type === "gotcha") {
      this.db.query("INSERT INTO proposals(project,content,category,importance,source) VALUES (?,?,?,?,?)").run(project, content.trim(), type, type === "decision" ? 4 : 3, "context_add")
    }
  }

  upsertProgress(project: string, sessionID: string, content: string): void {
    this.db.query("DELETE FROM context_items WHERE project=? AND type='progress' AND session_id=?").run(project, sessionID)
    this.db.query("INSERT INTO context_items(project,type,content,session_id) VALUES (?,'progress',?,?)").run(project, content.trim(), sessionID)
  }

  context(project: string): Array<{ type: string; content: string; created_at: string }> {
    return this.db.query("SELECT type,content,created_at FROM context_items WHERE project=? ORDER BY created_at DESC LIMIT 100").all(project) as any[]
  }

  proposals(status = "pending"): any[] {
    return this.db.query("SELECT * FROM proposals WHERE status=? ORDER BY importance DESC, created_at DESC LIMIT 100").all(status) as any[]
  }

  acceptProposal(id: number, add: (input: any) => any): void {
    const row = this.db.query("SELECT * FROM proposals WHERE id=?").get(id) as any
    if (!row) return
    add({ content: row.content, category: row.category, importance: row.importance, project: row.project, origin: "proposal" })
    this.db.query("UPDATE proposals SET status='accepted' WHERE id=?").run(id)
  }

  rejectProposal(id: number): void {
    this.db.query("UPDATE proposals SET status='rejected' WHERE id=?").run(id)
  }

  audit(memoryID: number | null, op: string, detail: string | null): void {
    this.db.query("INSERT INTO audit(memory_id,op,detail) VALUES (?,?,?)").run(memoryID, op, detail)
  }

  stats(project?: string): any {
    const where = project ? "WHERE project = ? OR project IS NULL" : ""
    const params = project ? [project] : []
    const rows = this.db.query(`SELECT status, category, importance, is_private, stale_flagged_at FROM memories ${where}`).all(...params) as any[]
    return {
      total: rows.length,
      active: rows.filter((r) => r.status === "active").length,
      stale: rows.filter((r) => r.stale_flagged_at).length,
      private: rows.filter((r) => r.is_private).length,
      pendingProposals: (this.db.query("SELECT count(*) n FROM proposals WHERE status='pending'").get() as any).n,
      byCategory: rows.reduce((acc: any, r) => { acc[r.category] = (acc[r.category] ?? 0) + 1; return acc }, {}),
      byImportance: rows.reduce((acc: any, r) => { const k = String(r.importance); acc[k] = (acc[k] ?? 0) + 1; return acc }, {}),
    }
  }

  fts(query: string, project: string | null | undefined, limit: number): Array<{ id: number; rank: number }> {
    try {
      const terms = query.toLowerCase().replace(/[^a-z0-9]+/g, " ").split(/\s+/).filter((t) => t.length >= 2).slice(0, 10)
      if (!terms.length) return []
      const match = terms.join(" OR ")
      const rows = this.db.query(
        `SELECT f.memory_id id, bm25(memories_fts) rank
         FROM memories_fts f JOIN memories m ON m.id = f.memory_id
         WHERE memories_fts MATCH ? AND m.status='active' AND m.is_private=0
           ${project ? "AND (m.project = ? OR m.project IS NULL)" : ""}
         ORDER BY rank LIMIT ?`,
      ).all(...(project ? [match, project, limit] : [match, limit])) as any[]
      return rows.map((r) => ({ id: Number(r.id), rank: Number(r.rank) }))
    } catch {
      return []
    }
  }

  vec(embedding: number[], project: string | null | undefined, limit: number): Array<{ id: number; distance: number }> {
    try {
      const rows = this.db.query(
        `SELECT v.memory_id id, v.distance
         FROM memories_vec v JOIN memories m ON m.id = v.memory_id
         WHERE v.embedding MATCH ? AND k = ?
           AND m.status='active' AND m.is_private=0
           ${project ? "AND (m.project = ? OR m.project IS NULL)" : ""}
         ORDER BY v.distance`,
      ).all(...(project ? [new Float32Array(embedding), limit, project] : [new Float32Array(embedding), limit])) as any[]
      return rows.map((r) => ({ id: Number(r.id), distance: Number(r.distance) }))
    } catch {
      return []
    }
  }

  allForDecay(): Array<{ id: number; importance: number; confidence: number; last_used_at: string; created_at: string; status: string }> {
    return this.db.query("SELECT id,importance,confidence,last_used_at,created_at,status FROM memories WHERE status='active'").all() as any[]
  }

  setStatus(id: number, status: string): void {
    this.db.query("UPDATE memories SET status=?, updated_at=datetime('now') WHERE id=?").run(status, id)
  }
}

function mapMemory(row: any): Memory {
  return {
    id: Number(row.id),
    content: String(row.content),
    title: row.title ?? null,
    category: row.category as Category,
    importance: Number(row.importance),
    confidence: Number(row.confidence),
    project: row.project ?? null,
    workspace: row.workspace ?? null,
    agent: row.agent ?? null,
    status: String(row.status),
    origin: row.origin ?? null,
    isPrivate: Boolean(row.is_private),
    staleFlaggedAt: row.stale_flagged_at ?? null,
    staleReason: row.stale_reason ?? null,
    recallCount: Number(row.recall_count ?? 0),
    confirmCount: Number(row.confirm_count ?? 1),
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  }
}
