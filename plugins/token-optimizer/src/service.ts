import type { Database } from "bun:sqlite"
import {
  databasePath,
  latestUsage,
  listSessions,
  openOpenCode,
  sessionParts,
  sessionRow,
  sessionUsage,
  type PartEntry,
  type SessionRow,
  type Usage,
} from "./db/opencode.ts"
import { OptimizerStore, dataDir, type CheckpointRow } from "./db/store.ts"
import {
  buildCheckpointContent,
  buildResumeBlock,
  classifyMode,
  computeQuality,
  deriveSignals,
  resumeIntent,
  scoreRelevance,
  type Mode,
  type Quality,
} from "./analyze.ts"
import { contextWindowForModel, costOf } from "./pricing/table.ts"
import { formatTokens, round1 } from "./text.ts"

export type Config = {
  qualityWindow: number
  toolCallWarn?: number
  toolCallCritical?: number
  nudges: "off" | "toast" | "inject"
  continuity: boolean
  smartCompaction: boolean
  activity: boolean
  trends: boolean
  bashCompression: boolean
  retentionDays: number
  relevanceThreshold: number
  checkpointMaxChars: number
}

export function config(env = process.env): Config {
  const num = (key: string, fallback: number) => {
    const raw = env[key]
    if (!raw) return fallback
    const n = Number(raw)
    return Number.isFinite(n) ? n : fallback
  }
  const nudges = (env.TOKEN_OPTIMIZER_NUDGES || "toast").toLowerCase()
  return {
    qualityWindow: Math.max(1, num("TOKEN_OPTIMIZER_QUALITY_WINDOW", 20)),
    toolCallWarn: env.TOKEN_OPTIMIZER_TOOL_CALL_WARN ? num("TOKEN_OPTIMIZER_TOOL_CALL_WARN", 0) : undefined,
    toolCallCritical: env.TOKEN_OPTIMIZER_TOOL_CALL_CRITICAL ? num("TOKEN_OPTIMIZER_TOOL_CALL_CRITICAL", 0) : undefined,
    nudges: nudges === "off" || nudges === "inject" ? nudges : "toast",
    continuity: env.TOKEN_OPTIMIZER_CONTINUITY !== "false",
    smartCompaction: env.TOKEN_OPTIMIZER_SMART_COMPACTION !== "false",
    activity: env.TOKEN_OPTIMIZER_ACTIVITY !== "false",
    trends: env.TOKEN_OPTIMIZER_TRENDS !== "false",
    bashCompression: env.TOKEN_OPTIMIZER_BASH_COMPRESSION === "true",
    retentionDays: Math.max(0, num("TOKEN_OPTIMIZER_CHECKPOINT_RETENTION_DAYS", 7)),
    relevanceThreshold: num("TOKEN_OPTIMIZER_RELEVANCE_THRESHOLD", 0.6),
    checkpointMaxChars: Math.max(200, num("TOKEN_OPTIMIZER_CHECKPOINT_MAX_CHARS", 2000)),
  }
}

export class Service {
  readonly directory: string
  readonly projectID: string
  readonly store: OptimizerStore
  readonly cfg: Config
  private db: Database | null = null
  private qualityCache = new Map<string, { at: number; value: Quality }>()

  constructor(directory: string, projectID: string, cfg = config()) {
    this.directory = directory
    this.projectID = projectID
    this.cfg = cfg
    this.store = new OptimizerStore(dataDir())
  }

  database(): Database | null {
    if (!this.db) this.db = openOpenCode(databasePath())
    return this.db
  }

  invalidate(sessionID: string): void {
    this.qualityCache.delete(sessionID)
  }

  close(): void {
    try { this.db?.close() } catch {}
    this.db = null
    this.store.close()
  }

  session(sessionID: string): SessionRow | null {
    const db = this.database()
    return db ? sessionRow(db, sessionID) : null
  }

  entries(sessionID: string): PartEntry[] {
    const db = this.database()
    return db ? sessionParts(db, sessionID) : []
  }

  quality(sessionID: string): Quality {
    const cachedQuality = this.qualityCache.get(sessionID)
    if (cachedQuality && Date.now() - cachedQuality.at < 120_000) return cachedQuality.value
    const session = this.session(sessionID)
    const entries = this.entries(sessionID)
    const signals = deriveSignals(entries)
    const usage = signals.lastUsage ?? (this.database() ? latestUsage(this.database()!, sessionID) : null)
    // Cumulative session tokens for accurate fill percentage. Single-message
    // usage (latestUsage / signals.lastUsage) represents one message's tokens
    // and can inflate fill to 100% on one long message.
    const fillUsage = this.database() ? sessionUsage(this.database()!, sessionID) : null
    const usageForFill = fillUsage && (fillUsage.input > 0 || fillUsage.output > 0 ||
      fillUsage.cacheRead > 0 || fillUsage.cacheWrite > 0)
      ? fillUsage : usage
    const result = computeQuality(session, signals, usageForFill, {
      qualityWindow: this.cfg.qualityWindow,
      toolCallWarn: this.cfg.toolCallWarn,
      toolCallCritical: this.cfg.toolCallCritical,
    })
    const cached = this.store.getQuality(sessionID)
    if (cached && result.compactions <= cached.compactions && cached.resourceHealth !== null && result.resourceHealth > cached.resourceHealth) {
      result.resourceHealth = cached.resourceHealth
      result.score = cached.resourceHealth
      result.resourceHealthGrade = result.grade
      result.grade = result.resourceHealthGrade
    }
    this.qualityCache.set(sessionID, { at: Date.now(), value: result })
    this.store.setQuality({
      sessionID,
      resourceHealth: result.resourceHealth,
      sessionEfficiency: result.sessionEfficiency,
      fillPct: result.fillPct,
      toolCalls: result.toolCalls,
      compactions: result.compactions,
      scoreVersion: 2,
      data: JSON.stringify({ recovery_status: result.recoveryStatus }),
      updatedAt: Date.now() / 1000,
    })
    return result
  }

  mode(sessionID: string): Mode {
    const signals = deriveSignals(this.entries(sessionID))
    return classifyMode(signals.toolBuckets.slice(-10), signals.results.slice(-10).some((r) => r.failure))
  }

  shouldCompact(sessionID: string): { compact: boolean; fillPct: number; quality: number } {
    const quality = this.quality(sessionID)
    const compact = quality.fillPct >= 0.85 || quality.resourceHealth < 50
    return { compact, fillPct: quality.fillPct, quality: quality.resourceHealth }
  }

  checkpoint(sessionID: string, trigger = "manual"): CheckpointRow {
    const session = this.session(sessionID)
    const entries = this.entries(sessionID)
    const signals = deriveSignals(entries)
    const quality = this.quality(sessionID)
    const mode = classifyMode(signals.toolBuckets.slice(-10), signals.results.slice(-10).some((r) => r.failure))
    const files = [...new Set([...signals.writes, ...signals.reads].map((x) => x.path))].slice(0, 15)
    const content = buildCheckpointContent({
      trigger,
      sessionID,
      mode,
      quality: quality.resourceHealth,
      fillPct: quality.fillPct,
      activeFiles: files,
      userTexts: signals.userTexts,
    })
    return this.store.captureCheckpoint({
      sessionID,
      projectID: session?.projectID ?? this.projectID,
      directory: session?.directory ?? this.directory,
      trigger,
      mode,
      qualityScore: quality.resourceHealth,
      fillPct: quality.fillPct,
      activeFiles: files,
      content,
      constants: { maxChars: 12_000 },
    })
  }

  restoreFor(sessionID: string, prompt: string): { block: string; checkpoint: CheckpointRow; score: number } | null {
    if (!this.cfg.continuity || !prompt.trim()) return null
    const session = this.session(sessionID)
    const project = session?.projectID ?? this.projectID
    const candidates = this.store.findCheckpointCandidates(project, this.cfg.retentionDays, 50)
      .filter((cp) => cp.sessionID !== sessionID)
    let best: { cp: CheckpointRow; score: number } | null = null
    for (const cp of candidates) {
      const score = scoreRelevance(prompt, cp.content)
      if (!best || score > best.score) best = { cp, score }
    }
    if (!best) return null
    const explicit = resumeIntent(prompt)
    if (best.score <= 0) return null
    if (!explicit && best.score < this.cfg.relevanceThreshold) return null
    return {
      block: buildResumeBlock({ content: best.cp.content, mode: best.cp.mode, score: best.score, activeFiles: best.cp.activeFiles }, session?.directory ?? this.directory),
      checkpoint: best.cp,
      score: best.score,
    }
  }

  history(days = 30): SessionRow[] {
    const db = this.database()
    return db ? listSessions(db, days, this.projectID || undefined) : []
  }

  savings(days = 30) {
    const sessions = this.history(days).filter((s) => s.tokensInput >= 1000)
    const events = this.store.savings(days)
    const spent = sessions.reduce((n, s) => n + (s.cost || costOf(s.model, {
      input: s.tokensInput, output: s.tokensOutput, cacheRead: s.tokensCacheRead, cacheWrite: s.tokensCacheWrite,
    })), 0)
    const measured = events.filter((e) => e.type === "compression").reduce((n, e) => n + e.costUsd, 0)
    const estimated = events.filter((e) => e.type !== "compression").reduce((n, e) => n + e.costUsd, 0)
    const sorted = [...sessions].sort((a, b) => a.createdAt - b.createdAt)
    if (sorted.length < 30) {
      return {
        ready: false,
        status: `building baseline (${sorted.length}/30 early sessions)`,
        sessions: sorted.length,
        spent,
        measured,
        estimated,
        monthlySavingsUsd: 0,
        savingsPerSession: 0,
        beforeCostPerSession: 0,
        afterCostPerSession: 0,
        events,
        installDate: sorted[0] ? new Date(sorted[0].createdAt).toISOString().slice(0, 10) : null,
      }
    }
    const sessionCost = (s: SessionRow) => s.cost || costOf(s.model, {
      input: s.tokensInput, output: s.tokensOutput, cacheRead: s.tokensCacheRead, cacheWrite: s.tokensCacheWrite,
    })
    const before = sorted.slice(0, 30)
    const after = sorted.slice(-Math.min(30, sorted.length - 30))
    const avg = (rows: SessionRow[]) => rows.reduce((n, s) => n + sessionCost(s), 0) / Math.max(1, rows.length)
    const beforeCost = avg(before)
    const afterCost = avg(after)
    const perSession = Math.max(0, beforeCost - afterCost)
    const spanDays = Math.max(1, (sorted[sorted.length - 1].updatedAt - sorted[0].createdAt) / 86_400_000)
    const perDay = sorted.length / spanDays
    if (beforeCost <= 0 || afterCost <= 0) {
      return {
        ready: false,
        status: "pricing incomplete for the comparison window",
        sessions: sorted.length, spent, measured, estimated,
        monthlySavingsUsd: 0, savingsPerSession: 0,
        beforeCostPerSession: beforeCost, afterCostPerSession: afterCost,
        events, installDate: new Date(sorted[0].createdAt).toISOString().slice(0, 10),
      }
    }
    return {
      ready: true,
      status: "ready",
      sessions: sorted.length,
      spent,
      measured,
      estimated,
      monthlySavingsUsd: perSession * perDay * 30,
      savingsPerSession: perSession,
      beforeCostPerSession: beforeCost,
      afterCostPerSession: afterCost,
      events,
      installDate: new Date(sorted[0].createdAt).toISOString().slice(0, 10),
    }
  }
}

export function qualityReport(q: Quality, sessionID: string, detail = false): string {
  const lines = [
    "## Context Health Report",
    "",
    `**Resource Health**: ${Math.round(q.resourceHealth)}/100 (${q.resourceHealthGrade})`,
    `**Session Efficiency**: ${Math.round(q.sessionEfficiency)}/100 (${q.sessionEfficiencyGrade})`,
    `**Context Fill**: ~${Math.round(q.fillPct * 100)}% (${formatTokens(Math.round(q.fillPct * Number(q.breakdown.context_fill_degradation.modelContextWindow ?? 0)))} of window)`,
    `**Tool Calls**: ${q.toolCalls} | **Compactions**: ${q.compactions}`,
    `**Session**: ${sessionID}`,
  ]
  if (q.fillWarning) lines.push("", `**${q.fillWarning.level}**: ${q.fillWarning.message}`)
  if (q.toolCallWarning) lines.push(`**${q.toolCallWarning.level}**: ${q.toolCallWarning.message}`)
  if (q.regimeChange) lines.push(`**NOTE**: ${q.regimeChange.message}`)
  if (detail) {
    lines.push("", "### Signal Breakdown", "", "| Signal | Score | Detail |", "| --- | ---: | --- |")
    for (const [name, bd] of Object.entries(q.breakdown)) {
      lines.push(`| ${name.replace(/_/g, " ")} | ${bd.score ?? "—"} | ${String(bd.detail).replace(/\|/g, "\\|")} |`)
    }
  }
  return lines.join("\n")
}

export function savingsReport(s: ReturnType<Service["savings"]>, days: number): string {
  const lines = [
    "## Token Optimizer Savings",
    "",
    `Window: last ${days} days | Sessions: ${s.sessions} | Status: ${s.status}`,
    `Spent: $${s.spent.toFixed(4)} | Measured saved: $${s.measured.toFixed(4)} | Estimated saved: $${s.estimated.toFixed(4)}`,
  ]
  if (s.ready) {
    lines.push(
      `Cost/session: before $${s.beforeCostPerSession.toFixed(4)} → after $${s.afterCostPerSession.toFixed(4)}`,
      `Savings/session: $${s.savingsPerSession.toFixed(4)} | Monthly estimate: $${s.monthlySavingsUsd.toFixed(2)}`,
    )
  } else {
    lines.push(`Install date: ${s.installDate ?? "none"}`)
  }
  if (s.events.length) {
    lines.push("", "| Event | Tokens | Cost | Detail |", "| --- | ---: | ---: | --- |")
    for (const e of s.events.slice(0, 20)) {
      lines.push(`| ${e.type} | ${e.tokens} | $${e.costUsd.toFixed(4)} | ${(e.detail ?? "").replace(/\|/g, "\\|")} |`)
    }
  }
  return lines.join("\n")
}

export function historyReport(rows: SessionRow[]): string {
  const lines = ["## Session History", "", "| Date | Session | Model | Input | Cache read | Cost |", "| --- | --- | --- | ---: | ---: | ---: |"]
  for (const s of rows.slice(0, 30)) {
    lines.push(`| ${new Date(s.updatedAt).toISOString().slice(0, 10)} | ${s.id.slice(0, 10)} | ${s.model ?? "unknown"} | ${formatTokens(s.tokensInput)} | ${formatTokens(s.tokensCacheRead)} | $${s.cost.toFixed(4)} |`)
  }
  return lines.join("\n")
}
