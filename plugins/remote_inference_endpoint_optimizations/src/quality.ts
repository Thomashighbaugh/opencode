/**
 * Context quality scoring. Every metric derives from OpenCode's DB — no
 * inference calls. Fill percentage uses per-message usage (latest assistant
 * message tokens ÷ context window), never cumulative session totals which
 * monotonically grow and pin fill at 100%. Cache reads/writes are excluded
 * from fill since they are reused KV-cache tokens already counted when first
 * added to the window.
 */

import type { PartEntry, SessionRow, Usage } from "./db/opencode.ts"
import { contextWindowForModel } from "./pricing/table.ts"
import { words } from "./text.ts"

export type Mode = "code" | "debug" | "review" | "infra" | "general"

export type Signals = {
  reads: Array<{ path: string; seq: number }>
  writes: Array<{ path: string; seq: number }>
  results: Array<{ size: number; seq: number; failure: boolean }>
  messages: Array<{ role: string; size: number; substantive: boolean; seq: number }>
  agents: Array<{ prompt: number; result: number; seq: number }>
  toolCalls: number
  compactions: number
  userTexts: string[]
  toolBuckets: string[]
  lastUsage: Usage | null
}

export type Quality = {
  score: number
  grade: string
  resourceHealth: number
  resourceHealthGrade: string
  sessionEfficiency: number
  sessionEfficiencyGrade: string
  fillPct: number
  fillWarning: { level: string; fillPct: number; message: string } | null
  toolCallWarning: { level: string; toolCalls: number; message: string } | null
  regimeChange: { fillPct: number; message: string } | null
  toolCalls: number
  compactions: number
  recoveryStatus: string | null
  breakdown: Record<string, { score?: number | null; detail: string; [k: string]: unknown }>
}

const EDIT = new Set(["edit", "write", "multiedit", "notebookedit", "file_write", "file_edit"])
const READ = new Set(["read", "file_read"])
const AGENT = new Set(["task", "agent", "taskcreate"])
const SHELL = new Set(["bash", "shell"])

export function deriveSignals(entries: PartEntry[], cutExploreAgent = true): Signals {
  const reads: Signals["reads"] = []
  const writes: Signals["writes"] = []
  const results: Signals["results"] = []
  const messages: Signals["messages"] = []
  const agents: Signals["agents"] = []
  const userTexts: string[] = []
  const toolBuckets: string[] = []
  let toolCalls = 0
  let compactions = 0
  let lastUsage: Usage | null = null

  for (const e of entries) {
    if (e.type === "compaction") compactions++
    if (e.usage) lastUsage = e.usage
    if (e.type === "text" && e.text) {
      const substantive = words(e.text) > 10
      messages.push({ role: e.role, size: e.text.length, substantive, seq: e.seq })
      if (e.role === "user") userTexts.push(e.text.slice(0, 1000))
    }
    if (e.type !== "tool" || !e.tool) continue
    toolCalls++
    const tool = e.tool.toLowerCase()
    const command = typeof e.input?.command === "string" ? e.input.command : ""
    if (READ.has(tool)) {
      const p = pathOf(e.input)
      if (p) reads.push({ path: p, seq: e.seq })
      toolBuckets.push("read")
    } else if (EDIT.has(tool)) {
      const p = pathOf(e.input)
      if (p) writes.push({ path: p, seq: e.seq })
      toolBuckets.push("edit")
    } else if (AGENT.has(tool)) {
      toolBuckets.push("agent")
      if (cutExploreAgent) {
        const prompt = typeof e.input?.prompt === "string" ? e.input.prompt.length : 0
        agents.push({ prompt, result: e.output?.length ?? 0, seq: e.seq })
      }
    } else if (SHELL.has(tool)) {
      if (/\b(systemctl|docker|kubectl|nginx|service|apt|brew|pacman|dnf)\b/.test(command)) toolBuckets.push("bash_infra")
      else if (/\bgit\s+(push|pull|merge|rebase|tag)\b/.test(command)) toolBuckets.push("bash_git")
      else if (/\b(npm|pnpm|bun|pip|cargo|go)\s+(install|add|update|upgrade)\b/.test(command)) toolBuckets.push("bash_install")
      else toolBuckets.push("bash_other")
    } else if (tool.startsWith("mcp")) toolBuckets.push("mcp")
    else if (tool === "websearch" || tool === "webfetch" || tool === "searxng_web_search") toolBuckets.push("web")
    else toolBuckets.push("other")

    const failure = Boolean(e.error) || /\b(error|exception|failed|denied|ENOENT)\b/i.test(e.output ?? "")
    results.push({ size: e.output?.length ?? 0, seq: e.seq, failure })
  }
  return { reads, writes, results, messages, agents, toolCalls, compactions, userTexts, toolBuckets, lastUsage }
}

function pathOf(input: Record<string, unknown> | undefined): string | null {
  if (!input) return null
  const v = input.filePath ?? input.file_path ?? input.path
  return typeof v === "string" && v ? v : null
}

export function classifyMode(buckets: string[], hasErrors = false): Mode {
  if (buckets.length < 3) return "general"
  const count = (name: string) => buckets.filter((b) => b === name).length
  const edits = count("edit")
  const reads = count("read")
  const infra = count("bash_infra") + count("bash_git") + count("bash_install")
  const web = count("web")
  const other = count("bash_other")
  if (infra >= 3) return "infra"
  if (hasErrors && reads >= 3 && edits <= 1) return "debug"
  if (edits >= 4) return "code"
  if (reads >= 4 && edits === 0) return "review"
  if (web >= 3) return "review"
  if (edits >= 2 && (other >= 2 || reads >= 2)) return "code"
  return "general"
}

const STALE_DISTANCE = 120
const BLOAT_CHARS = 4000

export function staleReads(s: Signals, window = 20) {
  const reads = s.reads.slice(-window)
  const writes = s.writes.slice(-window * 2).sort((a, b) => a.seq - b.seq)
  const byPath = new Map<string, number[]>()
  for (const w of writes) {
    const arr = byPath.get(w.path) ?? []
    arr.push(w.seq)
    byPath.set(w.path, arr)
  }
  let count = 0, waste = 0
  for (const r of reads) {
    const ws = byPath.get(r.path)
    if (!ws?.length) continue
    if (ws.some((w) => w < r.seq)) { count++; waste += 2000; continue }
    const later = ws.filter((w) => w > r.seq)
    if (later.length && later[0] - r.seq > STALE_DISTANCE) {
      const reread = reads.some((x) => x.path === r.path && x.seq > r.seq)
      if (!reread) { count++; waste += 1000 }
    }
  }
  return { count, waste, windowReads: reads.length }
}

export function bloatedResults(s: Signals, window = 20) {
  const results = s.results.slice(-window).sort((a, b) => a.seq - b.seq)
  const messages = s.messages.slice(-window).sort((a, b) => a.seq - b.seq)
  let count = 0, waste = 0
  for (const r of results) {
    if (r.size < BLOAT_CHARS) continue
    let referenced = false
    for (const m of messages) {
      if (m.seq <= r.seq) continue
      if (m.role === "assistant" && m.substantive) { referenced = true; break }
      if (m.seq > r.seq + 10) break
    }
    if (!referenced) { count++; waste += Math.floor(r.size / 4) }
  }
  return { count, waste, windowResults: results.length }
}

export function decisionDensity(s: Signals, window = 20) {
  const msgs = s.messages.slice(-window)
  const substantive = msgs.filter((m) => m.substantive).length
  return { substantive, total: msgs.length, ratio: msgs.length ? substantive / msgs.length : 0 }
}

export function agentEfficiency(s: Signals, window = 20) {
  const dispatches = s.agents.slice(-window)
  if (!dispatches.length) return { dispatches: 0, efficiency: 0.8 }
  const prompt = dispatches.reduce((n, d) => n + d.prompt, 0)
  const result = dispatches.reduce((n, d) => n + d.result, 0)
  if (prompt <= 0) return { dispatches: dispatches.length, efficiency: 0.8 }
  return { dispatches: dispatches.length, efficiency: result / (prompt + result || 1) }
}

export function grade(score: number): string {
  if (score >= 90) return "S"
  if (score >= 80) return "A"
  if (score >= 70) return "B"
  if (score >= 55) return "C"
  if (score >= 40) return "D"
  return "F"
}

/** Fill percentage: per-message usage ÷ context window. Cache reads/writes
 *  excluded — they are reused tokens already counted when first added. */
export function fillFraction(session: SessionRow | null, usage: Usage | null): number {
  const model = usage?.model || session?.model
  const window = contextWindowForModel(model)
  let used = 0
  if (usage) {
    used = usage.input + usage.output + usage.reasoning
  }
  return window > 0 ? Math.min(1, used / window) : 0
}

export function computeQuality(
  session: SessionRow | null,
  signals: Signals,
  usage: Usage | null,
): Quality {
  const fillPct = fillFraction(session, usage)
  const model = usage?.model || session?.model
  const cw = contextWindowForModel(model)

  // Fill score decreases as fill increases — a fuller context is worse health.
  const fillScore = Math.max(0, Math.min(100, (1 - fillPct) * 100))
  const stale = staleReads(signals)
  const staleScore = stale.windowReads ? Math.max(0, 100 - Math.min(1, stale.count / stale.windowReads) * 100) : 100
  const bloat = bloatedResults(signals)
  const bloatScore = bloat.windowResults ? Math.max(0, 100 - Math.min(1, bloat.count / bloat.windowResults) * 300) : 100
  const density = decisionDensity(signals)
  const densityScore = density.total ? Math.min(100, density.ratio * 200) : 50
  const agent = agentEfficiency(signals)
  const agentScore = agent.dispatches ? Math.min(100, agent.efficiency * 150) : 80
  const waste = stale.waste + bloat.waste
  const wasteScore = cw > 0 ? Math.max(0, Math.min(100, 100 - (waste / cw) * 1000)) : 100

  const scores = {
    context_fill_degradation: round1(fillScore),
    stale_reads: round1(staleScore),
    bloated_results: round1(bloatScore),
    decision_density: round1(densityScore),
    agent_efficiency: round1(agentScore),
    absolute_waste_tokens: round1(wasteScore),
  }
  const rh = round1(scores.context_fill_degradation * (5 / 7) + scores.absolute_waste_tokens * (2 / 7))
  const se = round1(
    scores.stale_reads * 0.3 + scores.bloated_results * 0.3 +
    scores.decision_density * 0.2 + scores.agent_efficiency * 0.2,
  )

  let fillWarning: Quality["fillWarning"] = null
  if (fillPct >= 0.85) fillWarning = { level: "CRITICAL", fillPct: round1(fillPct * 100), message: "85% context fill, compact now" }
  else if (fillPct >= 0.75) fillWarning = { level: "WARNING", fillPct: round1(fillPct * 100), message: "75% context fill, consider compacting" }

  const scale = Math.max(1, (cw / 200_000) ** 1.3)
  const warn = Math.floor(25 * scale)
  const critical = Math.floor(40 * scale)
  let toolCallWarning: Quality["toolCallWarning"] = null
  // Fill < 35% means context isn't actually full — tool-call volume alone
  // never declares CRITICAL regardless of count.
  if (fillPct >= 0.35 && signals.toolCalls >= critical) {
    toolCallWarning = { level: "CRITICAL", toolCalls: signals.toolCalls, message: `${critical}+ tool calls, instruction adherence severely degraded` }
  } else if (fillPct >= 0.35 && signals.toolCalls >= warn) {
    toolCallWarning = { level: "WARNING", toolCalls: signals.toolCalls, message: `${warn}+ tool calls, consider a fresh session` }
  }

  const regimeChange = fillPct > 0.5 && signals.toolCalls > 0
    ? { fillPct: round1(fillPct * 100), message: "Single-concern boundary: context filling with repeated tool calls — prefer one larger request over several small ones" }
    : null

  return {
    score: rh,
    grade: grade(Math.round(rh)),
    resourceHealth: rh,
    resourceHealthGrade: grade(Math.round(rh)),
    sessionEfficiency: se,
    sessionEfficiencyGrade: grade(Math.round(se)),
    fillPct,
    fillWarning,
    toolCallWarning,
    regimeChange,
    toolCalls: signals.toolCalls,
    compactions: signals.compactions,
    recoveryStatus: signals.compactions ? "observing" : null,
    breakdown: {
      context_fill_degradation: { score: scores.context_fill_degradation, detail: `${Math.round(fillPct * 100)}% fill`, fillPct: round1(fillPct * 100), modelContextWindow: cw },
      stale_reads: { score: scores.stale_reads, detail: `${stale.count} stale reads`, count: stale.count, estimatedWasteTokens: stale.waste },
      bloated_results: { score: scores.bloated_results, detail: `${bloat.count} bloated results`, count: bloat.count, estimatedWasteTokens: bloat.waste },
      decision_density: { score: scores.decision_density, detail: `${Math.round(density.ratio * 100)}% substantive`, substantive: density.substantive, windowMessages: density.total },
      agent_efficiency: { score: scores.agent_efficiency, detail: `${agent.dispatches} agent dispatches`, dispatchCount: agent.dispatches },
      absolute_waste_tokens: { score: scores.absolute_waste_tokens, detail: `${waste} waste tokens`, totalWasteTokens: waste },
      compactions: { detail: `${signals.compactions} compaction(s)` },
    },
  }
}

function round1(n: number): number { return Math.round(n * 10) / 10 }
