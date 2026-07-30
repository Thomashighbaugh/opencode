/**
 * focus.ts — Local focus/goal plugin (in-repo, no external deps)
 *
 * Provides a session-scoped "focus" that steers hub command output toward
 * achieving the stated objective. Integrated into hooks.ts system.transform
 * and session.idle hooks.
 *
 * Adapted from opencode-goal-plugin (willytop8) — stripped of npm packaging,
 * aligned with our existing state management and hook infrastructure.
 *
 * Key differences from upstream:
 * - No npm dependency — lives in plugins/hooks/ alongside hooks.ts
 * - Focus steers hub commands (orchestrate, ideation, harvest-context, project)
 *   by injecting focus context into system prompt on every turn
 * - Uses our existing state dirs (.opencode/state/focus/) instead of .opencode/goals/
 * - Integrated with our existing hooks.ts system.transform hook
 * - No command.execute.before hook — focus is set via /focus command handled by agent
 * - Simpler: no multi-goal, no sisyphus sequences, no agent tools
 */

import { randomUUID } from "node:crypto"
import { promises as fs, appendFileSync, mkdirSync } from "node:fs"
import { homedir } from "node:os"
import { dirname, join } from "node:path"

// ─── Constants ───────────────────────────────────────────────────────────────

const STATE_FILE_VERSION = 1
const STATE_SUBPATH = join(".opencode", "state", "focus", "state.json")
const MAX_HISTORY = 20
const MAX_CHECKPOINTS = 5
const CHECKPOINT_CHAR_LIMIT = 280

const DEFAULT_OPTIONS = {
  maxTurns: 10,
  maxDurationMs: 15 * 60 * 1000,
  maxTokens: 200000,
  minDelayMs: 1500,
  noProgressTokenThreshold: 50,
  noProgressTurnsBeforePause: 2,
  noToolCallTurnsBeforePause: 2,
  budgetWrapupRatio: 0.8,
  warnTurnsRemaining: 3,
  warnDurationMsRemaining: 60 * 1000,
  warnTokensRemaining: 25000,
  maxPromptFailures: 3,
}

// ─── Types ──────────────────────────────────────────────────────────────────

interface FocusOptions {
  maxTurns: number
  maxDurationMs: number
  maxTokens: number
  minDelayMs: number
  noProgressTokenThreshold: number
  noProgressTurnsBeforePause: number
  noToolCallTurnsBeforePause: number
  budgetWrapupRatio: number
  warnTurnsRemaining: number
  warnDurationMsRemaining: number
  warnTokensRemaining: number
  maxPromptFailures: number
}

interface FocusState {
  focusId: string
  objective: string
  successCriteria: string
  constraints: string
  sessionID: string
  turnCount: number
  startedAt: number
  totalTokens: number
  lastContinueAt: number
  lastProgressAt: number
  noProgressTurns: number
  noToolCallTurns: number
  stopped: boolean
  stopReason: string
  blockedReason: string
  budgetWrapupSent: boolean
  lastStatus: string
  lastCheckpoint: { summary: string; timestamp: number } | null
  checkpoints: Array<{ summary: string; timestamp: number }>
  history: Array<{ type: string; detail: string; timestamp: number }>
  options: FocusOptions
}

// ─── In-memory state ────────────────────────────────────────────────────────

const focusStates = new Map<string, FocusState>()
const activeContinues = new Map<string, string>() // sessionID → token

// ─── Helpers ────────────────────────────────────────────────────────────────

function homeBase(env = process.env) {
  return typeof env?.HOME === "string" && env.HOME.trim() ? env.HOME.trim() : homedir()
}

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return v !== null && typeof v === "object" && !Array.isArray(v)
}

function toNonNegativeInteger(v: unknown, fallback = 0): number {
  const n = Number(v)
  return Number.isSafeInteger(n) && n >= 0 ? n : fallback
}

function toPositiveInteger(v: unknown, fallback: number): number {
  const n = Number(v)
  return Number.isSafeInteger(n) && n > 0 ? n : fallback
}

function normalizeTimestamp(v: unknown, fallback = Date.now()): number {
  const n = Number(v)
  return Number.isFinite(n) && n > 0 ? n : fallback
}

function summarizeText(text: string, limit = CHECKPOINT_CHAR_LIMIT): string {
  const norm = String(text || "").replace(/\s+/g, " ").trim()
  if (!norm) return ""
  return norm.length > limit ? norm.slice(0, limit - 1) + "…" : norm
}

function formatTimestamp(ts: number): string {
  return ts ? new Date(ts).toISOString() : "unknown"
}

function formatAge(ts: number): string {
  return ts ? `${Math.round((Date.now() - ts) / 1000)}s ago` : "unknown"
}

function makeHistoryEntry(type: string, detail: string, ts = Date.now()) {
  return { type, detail: summarizeText(detail, 400), timestamp: ts }
}

// ─── State file path resolution ─────────────────────────────────────────────

function resolveStateFilePath(directory: string): string {
  return join(directory, STATE_SUBPATH)
}

function ledgerPathFor(statePath: string): string {
  return statePath + ".ledger.jsonl"
}

// ─── Persistence ────────────────────────────────────────────────────────────

async function persistState(directory: string, state: FocusState): Promise<boolean> {
  const statePath = resolveStateFilePath(directory)
  try {
    await fs.mkdir(dirname(statePath), { recursive: true, mode: 0o700 })
    const tmpPath = statePath + "." + process.pid + "." + randomUUID() + ".tmp"
    await fs.writeFile(tmpPath, JSON.stringify({ version: STATE_FILE_VERSION, focus: state }, null, 2), {
      encoding: "utf8", mode: 0o600,
    })
    await fs.rename(tmpPath, statePath)
    await fs.chmod(statePath, 0o600)
    return true
  } catch {
    return false
  }
}

async function loadPersistedState(directory: string): Promise<FocusState | null> {
  const statePath = resolveStateFilePath(directory)
  try {
    const raw = await fs.readFile(statePath, "utf8")
    const parsed = JSON.parse(raw)
    if (parsed?.version !== STATE_FILE_VERSION || !isPlainObject(parsed.focus)) return null
    return parsed.focus as FocusState
  } catch {
    return null
  }
}

// ─── Ledger (append-only lifecycle log) ──────────────────────────────────────

function appendLedgerLine(ledgerPath: string, entry: Record<string, unknown>) {
  try {
    mkdirSync(dirname(ledgerPath), { recursive: true, mode: 0o700 })
    appendFileSync(ledgerPath, JSON.stringify(entry) + "\n", { mode: 0o600 })
  } catch { /* best-effort */ }
}

function emitLedgerEvent(directory: string, state: FocusState, type: string, detail: string) {
  const ledgerPath = ledgerPathFor(resolveStateFilePath(directory))
  appendLedgerLine(ledgerPath, {
    ts: Date.now(), sessionID: state.sessionID, focusId: state.focusId,
    objective: state.objective, type, detail,
  })
}

// ─── State management ───────────────────────────────────────────────────────

function pushHistory(state: FocusState, type: string, detail: string, ts = Date.now()) {
  state.history = [...(state.history || []), makeHistoryEntry(type, detail, ts)].slice(-MAX_HISTORY)
}

function recordCheckpoint(state: FocusState, text: string, ts = Date.now()) {
  const summary = summarizeText(text)
  if (!summary || state.lastCheckpoint?.summary === summary) return
  const cp = { summary, timestamp: ts }
  state.lastCheckpoint = cp
  state.checkpoints = [...(state.checkpoints || []), cp].slice(-MAX_CHECKPOINTS)
}

function resetBudget(state: FocusState) {
  state.focusId = randomUUID()
  state.startedAt = Date.now()
  state.turnCount = 0
  state.totalTokens = 0
  state.lastContinueAt = 0
  state.lastProgressAt = 0
  state.noProgressTurns = 0
  state.noToolCallTurns = 0
  state.budgetWrapupSent = false
  state.history = [...(state.history || [])].slice(-MAX_HISTORY)
}

// ─── Public API ─────────────────────────────────────────────────────────────

/**
 * Set or replace the session focus.
 * Returns the new FocusState.
 */
export function setFocus(
  directory: string,
  sessionID: string,
  objective: string,
  opts?: { successCriteria?: string; constraints?: string; maxTurns?: number; maxDurationMs?: number; maxTokens?: number },
): FocusState {
  const existing = focusStates.get(sessionID)
  if (existing) {
    // Replace objective, keep budget + history
    existing.objective = objective
    existing.successCriteria = opts?.successCriteria || ""
    existing.constraints = opts?.constraints || ""
    existing.stopped = false
    existing.stopReason = ""
    existing.blockedReason = ""
    existing.lastStatus = "Focus updated."
    pushHistory(existing, "refocused", objective)
    emitLedgerEvent(directory, existing, "refocused", objective)
    persistState(directory, existing)
    return existing
  }

  const state: FocusState = {
    focusId: randomUUID(),
    objective,
    successCriteria: opts?.successCriteria || "",
    constraints: opts?.constraints || "",
    sessionID,
    turnCount: 0,
    startedAt: Date.now(),
    totalTokens: 0,
    lastContinueAt: 0,
    lastProgressAt: 0,
    noProgressTurns: 0,
    noToolCallTurns: 0,
    stopped: false,
    stopReason: "",
    blockedReason: "",
    budgetWrapupSent: false,
    lastStatus: "Focus set.",
    lastCheckpoint: null,
    checkpoints: [],
    history: [makeHistoryEntry("focused", objective)],
    options: {
      maxTurns: toPositiveInteger(opts?.maxTurns, DEFAULT_OPTIONS.maxTurns),
      maxDurationMs: toPositiveInteger(opts?.maxDurationMs, DEFAULT_OPTIONS.maxDurationMs),
      maxTokens: toPositiveInteger(opts?.maxTokens, DEFAULT_OPTIONS.maxTokens),
      minDelayMs: DEFAULT_OPTIONS.minDelayMs,
      noProgressTokenThreshold: DEFAULT_OPTIONS.noProgressTokenThreshold,
      noProgressTurnsBeforePause: DEFAULT_OPTIONS.noProgressTurnsBeforePause,
      noToolCallTurnsBeforePause: DEFAULT_OPTIONS.noToolCallTurnsBeforePause,
      budgetWrapupRatio: DEFAULT_OPTIONS.budgetWrapupRatio,
      warnTurnsRemaining: DEFAULT_OPTIONS.warnTurnsRemaining,
      warnDurationMsRemaining: DEFAULT_OPTIONS.warnDurationMsRemaining,
      warnTokensRemaining: DEFAULT_OPTIONS.warnTokensRemaining,
      maxPromptFailures: DEFAULT_OPTIONS.maxPromptFailures,
    },
  }

  focusStates.set(sessionID, state)
  emitLedgerEvent(directory, state, "focused", objective)
  persistState(directory, state)
  return state
}

/**
 * Clear the session focus.
 */
export function clearFocus(directory: string, sessionID: string): boolean {
  const state = focusStates.get(sessionID)
  if (!state) return false
  state.stopped = true
  state.stopReason = "cleared"
  state.lastStatus = "Focus cleared."
  pushHistory(state, "cleared", "Focus cleared by user.")
  emitLedgerEvent(directory, state, "cleared", "Focus cleared.")
  persistState(directory, state)
  focusStates.delete(sessionID)
  activeContinues.delete(sessionID)
  return true
}

/**
 * Pause the session focus (stop auto-continue without clearing).
 */
export function pauseFocus(directory: string, sessionID: string): boolean {
  const state = focusStates.get(sessionID)
  if (!state) return false
  state.stopped = true
  state.stopReason = "paused"
  state.lastStatus = "Focus paused."
  pushHistory(state, "paused", "Focus paused by user.")
  emitLedgerEvent(directory, state, "paused", "Focus paused.")
  persistState(directory, state)
  activeContinues.delete(sessionID)
  return true
}

/**
 * Resume a paused/stopped focus.
 */
export function resumeFocus(directory: string, sessionID: string): boolean {
  const state = focusStates.get(sessionID)
  if (!state) return false
  state.stopped = false
  state.stopReason = ""
  state.blockedReason = ""
  state.lastStatus = "Focus resumed."
  pushHistory(state, "resumed", "Focus resumed by user.")
  emitLedgerEvent(directory, state, "resumed", "Focus resumed.")
  persistState(directory, state)
  return true
}

/**
 * Get the current focus state for a session.
 */
export function getFocus(sessionID: string): FocusState | null {
  return focusStates.get(sessionID) || null
}

/**
 * Get formatted focus status string.
 */
export function formatFocusStatus(sessionID: string): string {
  const state = focusStates.get(sessionID)
  if (!state) return "No active focus."

  const elapsed = Math.round((Date.now() - state.startedAt) / 1000)
  const lastProgress = state.lastProgressAt > 0
    ? `${Math.round((Date.now() - state.lastProgressAt) / 1000)}s ago`
    : "none yet"
  const lastCp = state.lastCheckpoint
    ? `${state.lastCheckpoint.summary} (${formatAge(state.lastCheckpoint.timestamp)})`
    : "none yet"

  const lines = [
    `Focus: ${state.objective}`,
  ]
  if (state.successCriteria) lines.push(`Success: ${state.successCriteria}`)
  if (state.constraints) lines.push(`Constraints: ${state.constraints}`)
  lines.push(
    `Turns: ${state.turnCount}/${state.options.maxTurns}`,
    `Tokens: ${state.totalTokens.toLocaleString()}/${state.options.maxTokens.toLocaleString()}`,
    `Elapsed: ${elapsed}s/${Math.round(state.options.maxDurationMs / 1000)}s`,
    `Last progress: ${lastProgress}`,
    `Checkpoint: ${lastCp}`,
    `Status: ${state.lastStatus}`,
  )
  if (state.stopped) lines.push(`Stopped: ${state.stopReason}`)
  if (state.blockedReason) lines.push(`Blocked: ${state.blockedReason}`)
  return lines.join("\n")
}

/**
 * Build the focus block for system prompt injection.
 * This is what steers hub commands toward the focus objective.
 */
export function buildFocusBlock(sessionID: string): string | null {
  const state = focusStates.get(sessionID)
  if (!state || state.stopped) return null

  const lines = [
    "<active_focus>",
    `Objective: ${state.objective}`,
  ]
  if (state.successCriteria) lines.push(`Success criteria: ${state.successCriteria}`)
  if (state.constraints) lines.push(`Constraints: ${state.constraints}`)
  lines.push(
    `Progress: ${state.turnCount} turns, ${state.totalTokens.toLocaleString()} tokens used.`,
    "Steer all hub command output toward achieving this focus.",
    "When the focus is satisfied, end with [focus:complete].",
    "When blocked by user input, end with [focus:blocked] and explain the blocker.",
    "</active_focus>",
  )
  return lines.join("\n")
}

/**
 * Build a continuation message for auto-continue on idle.
 */
export function buildContinueMessage(sessionID: string): string | null {
  const state = focusStates.get(sessionID)
  if (!state || state.stopped) return null

  const remainingTokens = Math.max(0, state.options.maxTokens - state.totalTokens)
  const remainingTurns = Math.max(0, state.options.maxTurns - state.turnCount)
  const elapsed = Math.round((Date.now() - state.startedAt) / 1000)
  const budgetWrapup = state.totalTokens >= state.options.maxTokens * state.options.budgetWrapupRatio

  const lines = [
    "<focus_continuation>",
    `<focus_objective>${state.objective}</focus_objective>`,
    "",
    "<progress>",
    `turns: ${state.turnCount}/${state.options.maxTurns}`,
    `tokens: ${state.totalTokens}/${state.options.maxTokens}`,
    `elapsed: ${elapsed}s/${Math.round(state.options.maxDurationMs / 1000)}s`,
    "</progress>",
    "",
  ]

  if (budgetWrapup) {
    lines.push(
      "<budget_wrapup>",
      "Near token limit. Finish current step if small. Write handoff of what's done and what remains. Do not mark complete unless verified.",
      "</budget_wrapup>",
    )
  } else {
    lines.push(
      "<next_step>",
      "Continue working toward the focus. Take the next concrete step. Verify actual state before assuming prior work succeeded.",
      "</next_step>",
    )
  }

  lines.push(
    "",
    "<completion>",
    "Before [focus:complete], verify against objective and current state. Put [focus:evidence] <summary> on the line before [focus:complete].",
    "For blockers, explain the specific need on the line before [focus:blocked].",
    "Unsubstantiated claims are rejected.",
    "</completion>",
  )

  return lines.join("\n")
}

/**
 * Check if the assistant's last text indicates focus completion or blocking.
 */
export function checkFocusMarkers(text: string): { type: "complete" | "blocked" | "none"; evidence?: string; blocker?: string } {
  const safeText = typeof text === "string" ? text : String(text || "")
  const trimmed = safeText.trimEnd()
  const lines = trimmed.split("\n")

  // Check for [focus:complete] or focus:complete
  const completeIdx = lines.findIndex(l => {
    const t = l.trim().toLowerCase()
    return t === "[focus:complete]" || t === "focus:complete"
  })

  if (completeIdx >= 0) {
    // Look for evidence line before the marker
    for (let i = completeIdx - 1; i >= 0; i--) {
      const raw = lines[i].trim()
      if (!raw) continue
      const match = raw.match(/^\[?\s*focus:evidence\s*\]?[:\-\s]*(.*)$/i)
      if (match) {
        const inline = match[1].trim()
        if (inline) return { type: "complete", evidence: inline }
        const following = lines.slice(i + 1, completeIdx).map(l => l.trim()).filter(Boolean).join(" ").trim()
        if (following) return { type: "complete", evidence: following }
      }
    }
    return { type: "complete", evidence: "" } // marker found but no evidence
  }

  // Check for [focus:blocked] or focus:blocked
  const blockedIdx = lines.findIndex(l => {
    const t = l.trim().toLowerCase()
    return t === "[focus:blocked]" || t === "focus:blocked"
  })

  if (blockedIdx >= 0) {
    const blocker = blockedIdx > 0
      ? lines.slice(0, blockedIdx).reverse().find(l => l.trim())?.trim() || ""
      : ""
    return { type: "blocked", blocker }
  }

  return { type: "none" }
}

/**
 * Update focus state with token usage from a message.
 */
export function recordTurn(sessionID: string, tokens: number, outputText: string, hasToolCall: boolean) {
  const state = focusStates.get(sessionID)
  if (!state || state.stopped) return

  state.turnCount++
  state.totalTokens += tokens
  state.lastContinueAt = Date.now()

  // Check for progress (output tokens above threshold)
  if (outputText.length >= state.options.noProgressTokenThreshold) {
    state.lastProgressAt = Date.now()
    state.noProgressTurns = 0
  } else {
    state.noProgressTurns++
  }

  // Check for tool calls
  if (hasToolCall) {
    state.noToolCallTurns = 0
  } else {
    state.noToolCallTurns++
  }

  // Record checkpoint from output
  recordCheckpoint(state, outputText)

  // Check for stop conditions
  if (state.turnCount >= state.options.maxTurns) {
    state.stopped = true
    state.stopReason = `max turns (${state.options.maxTurns})`
    state.lastStatus = `Stopped: ${state.stopReason}`
  } else if (Date.now() - state.startedAt >= state.options.maxDurationMs) {
    state.stopped = true
    state.stopReason = `max duration (${Math.round(state.options.maxDurationMs / 1000)}s)`
    state.lastStatus = `Stopped: ${state.stopReason}`
  } else if (state.totalTokens >= state.options.maxTokens) {
    state.stopped = true
    state.stopReason = `max tokens (${state.options.maxTokens.toLocaleString()})`
    state.lastStatus = `Stopped: ${state.stopReason}`
  } else if (state.noProgressTurns >= state.options.noProgressTurnsBeforePause) {
    state.stopped = true
    state.stopReason = "no progress"
    state.lastStatus = "Paused: no progress detected."
  } else if (state.noToolCallTurns >= state.options.noToolCallTurnsBeforePause) {
    state.stopped = true
    state.stopReason = "no tool calls"
    state.lastStatus = "Paused: no tool calls detected."
  }
}

/**
 * Mark focus as completed (with evidence).
 */
export function completeFocus(directory: string, sessionID: string, evidence: string) {
  const state = focusStates.get(sessionID)
  if (!state) return
  state.stopped = true
  state.stopReason = "completed"
  state.lastStatus = `Completed. Evidence: ${summarizeText(evidence, 200)}`
  pushHistory(state, "completed", evidence)
  emitLedgerEvent(directory, state, "completed", evidence)
  persistState(directory, state)
  focusStates.delete(sessionID)
  activeContinues.delete(sessionID)
}

/**
 * Mark focus as blocked.
 */
export function blockFocus(directory: string, sessionID: string, blocker: string) {
  const state = focusStates.get(sessionID)
  if (!state) return
  state.stopped = true
  state.stopReason = "blocked"
  state.blockedReason = blocker
  state.lastStatus = `Blocked: ${summarizeText(blocker, 200)}`
  pushHistory(state, "blocked", blocker)
  emitLedgerEvent(directory, state, "blocked", blocker)
  persistState(directory, state)
  activeContinues.delete(sessionID)
}

/**
 * Initialize focus state from persisted file on session start.
 */
export async function initializeFocus(directory: string, sessionID: string): Promise<void> {
  const persisted = await loadPersistedState(directory)
  if (persisted && persisted.sessionID === sessionID && !persisted.stopped) {
    // Recover in paused state — don't auto-continue blindly after restart
    persisted.stopped = true
    persisted.stopReason = "recovered"
    persisted.lastStatus = "Focus recovered from persisted state. Resume with /focus resume."
    focusStates.set(sessionID, persisted)
  }
}

/**
 * Clear all in-memory focus state (on session end).
 */
export function clearSessionFocus(sessionID: string) {
  focusStates.delete(sessionID)
  activeContinues.delete(sessionID)
}

/**
 * Get the active continues guard map (for idle handler coordination).
 */
export function getActiveContinues(): Map<string, string> {
  return activeContinues
}
