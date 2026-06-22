/**
 * Session management module for the Hubs plugin.
 *
 * Provides session statistics, context message caching, file tracking,
 * todo monitoring, heartbeat-based stall detection, and shared utility
 * functions for file I/O and path resolution.
 *
 * This is the foundation module imported by modes.ts, keywords.ts, and hooks.ts.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync, readdirSync, unlinkSync } from "fs"
import { join, dirname } from "path"
import { homedir } from "os"
import { getCache, CacheManager, withToolCache, invalidateToolCache, invalidateAllToolCaches } from "../../tools/cache-utils"

// User-wide configuration directory (Linux: ~/.config/opencode/)
export const USER_CONFIG_DIR = process.env.OPENCODE_CONFIG_DIR || join(homedir(), '.config', 'opencode')

// ============================================================================
// Utility Functions
// ============================================================================

export const SESSION_ID_PATTERN = /^[a-zA-Z0-9][a-zA-Z0-9_-]{0,255}$/

export function getQuietLevel(): number {
  const parsed = Number.parseInt(process.env.OMC_QUIET || '0', 10)
  return Number.isNaN(parsed) ? 0 : Math.max(0, parsed)
}

export const QUIET_LEVEL = getQuietLevel()

export function isValidSessionId(sessionId: string | undefined): boolean {
  return typeof sessionId === 'string' && SESSION_ID_PATTERN.test(sessionId)
}

export function readJsonFile<T>(filePath: string): T | null {
  try {
    if (!existsSync(filePath)) return null
    return JSON.parse(readFileSync(filePath, 'utf-8')) as T
  } catch {
    return null
  }
}

export function writeJsonFile<T>(filePath: string, data: T): void {
  try {
    const dir = dirname(filePath)
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true })
    }
    writeFileSync(filePath, JSON.stringify(data, null, 2), { mode: 0o600 })
  } catch {
    // Best-effort write
  }
}

// ─── Hub Menu Route Cache ──────────────────────────────────────────────
// Caches hubMenu route results to avoid redundant tool execution per session.
const _hubRouteCache = new Map<string, string>()

export function getHubRoute(hub: string, subcommand: string): string | null {
  return _hubRouteCache.get(`${hub}:${subcommand}`) || null
}

export function setHubRoute(hub: string, subcommand: string, result: string): void {
  _hubRouteCache.set(`${hub}:${subcommand}`, result)
}

// ============================================================================
// Path Resolution
// ============================================================================

export function getStateDir(directory: string, sessionId?: string): string {
  if (sessionId && isValidSessionId(sessionId)) {
    return join(directory, '.opencode', 'state', 'sessions', sessionId)
  }
  return join(directory, '.opencode', 'state')
}

export function getStatePath(directory: string, stateName: string, sessionId?: string): string {
  return join(getStateDir(directory, sessionId), `${stateName}-state.json`)
}

export function getOmcConfigDir(): string {
  return USER_CONFIG_DIR
}

export function getProjectStateDir(projectDir: string): string {
  return join(projectDir, '.opencode', 'state')
}

export function isProjectInitialized(projectDir: string): boolean {
  return existsSync(join(projectDir, '.opencode', 'opencode.jsonc')) ||
         existsSync(join(projectDir, '.opencode', 'AGENTS.md'))
}

// ============================================================================
// Session Statistics — In-Memory Cache (Avoid Sync I/O on Hot Path)
// ============================================================================

export interface SessionStats {
  sessions: Record<string, {
    tool_counts: Record<string, number>
    last_tool: string
    total_calls: number
    started_at: number
    updated_at?: number
  }>
}

const SESSION_STATS_FILE = join(getOmcConfigDir(), '.session-stats.json')

/** In-memory cache: loaded once, mutated in-place, written back every N calls. */
let statsCache: SessionStats | null = null
let statsDirty = false
const STATS_FLUSH_INTERVAL = 5 // flush to disk every N updates

function loadSessionStats(): SessionStats {
  if (!statsCache) {
    statsCache = readJsonFile<SessionStats>(SESSION_STATS_FILE) || { sessions: {} }
  }
  return statsCache
}

function saveSessionStats(stats: SessionStats): void {
  statsCache = stats
  statsDirty = true
}

/** Flush cached stats to disk if dirty. Called on tool.execute.after to persist periodically. */
export function flushSessionStats(): void {
  if (statsDirty && statsCache) {
    writeJsonFile(SESSION_STATS_FILE, statsCache)
    statsDirty = false
  }
}

let statsUpdateCounter = 0

export function updateToolStats(toolName: string, sessionId: string): number {
  const stats = loadSessionStats()

  if (!stats.sessions[sessionId]) {
    stats.sessions[sessionId] = {
      tool_counts: {},
      last_tool: '',
      total_calls: 0,
      started_at: Math.floor(Date.now() / 1000)
    }
  }

  const session = stats.sessions[sessionId]
  session.tool_counts[toolName] = (session.tool_counts[toolName] || 0) + 1
  session.last_tool = toolName
  session.total_calls++
  session.updated_at = Math.floor(Date.now() / 1000)

  saveSessionStats(stats)
  statsUpdateCounter++

  // Periodic flush to disk for crash safety
  if (statsUpdateCounter % STATS_FLUSH_INTERVAL === 0) {
    flushSessionStats()
  }

  return session.tool_counts[toolName]
}

// Prune throttling counter — only scans for old sessions every 20th call
let _pruneCounter = 0

/** Prune sessions older than 7 days on load to prevent unbounded file growth. */
export function loadSessionStatsPruned(): SessionStats {
  const stats = loadSessionStats()
  // Defer full-scan pruning to reduce I/O — only prune every 20th call
  _pruneCounter++
  if (_pruneCounter % 20 !== 0) return stats

  const now = Math.floor(Date.now() / 1000)
  const WEEK = 7 * 24 * 60 * 60
  let pruned = false
  for (const [id, s] of Object.entries(stats.sessions)) {
    if (now - (s.updated_at || s.started_at) > WEEK) {
      delete stats.sessions[id]
      pruned = true
    }
  }
  if (pruned) {
    statsDirty = true
    flushSessionStats()
  }
  return stats
}

// ============================================================================
// Context Injection System
// ============================================================================

/**
 * Session-scoped context cache for message injection.
 * Messages stored here are injected into the LLM via experimental.chat.system.transform
 */
interface SessionContext {
  pendingMessages: string[]
  lastUpdated: string
}

const sessionContextCache = new Map<string, SessionContext>()

function getSessionContext(sessionId: string): SessionContext {
  let ctx = sessionContextCache.get(sessionId)
  if (!ctx) {
    ctx = { pendingMessages: [], lastUpdated: new Date().toISOString() }
    sessionContextCache.set(sessionId, ctx)
  }
  return ctx
}

export function queueContextMessage(sessionId: string, message: string): void {
  if (!message.trim()) return
  const ctx = getSessionContext(sessionId)
  ctx.pendingMessages.push(message)
  ctx.lastUpdated = new Date().toISOString()

  // Prevent unbounded growth - keep last 20 messages
  if (ctx.pendingMessages.length > 20) {
    ctx.pendingMessages = ctx.pendingMessages.slice(-20)
  }
}

export function consumeContextMessages(sessionId: string): string[] {
  const ctx = sessionContextCache.get(sessionId)
  if (!ctx || ctx.pendingMessages.length === 0) return []

  const messages = [...ctx.pendingMessages]
  ctx.pendingMessages = []
  ctx.lastUpdated = new Date().toISOString()
  return messages
}

export function clearSessionContext(sessionId: string): void {
  sessionContextCache.delete(sessionId)
}

// ============================================================================
// Session Start Logic
// ============================================================================

export function initializeJocState(directory: string): void {
  const stateDir = join(directory, '.opencode', 'state')
  const plansDir = join(stateDir, 'plans')
  const logsDir = join(stateDir, 'logs')
  const artifactsDir = join(stateDir, 'artifacts')

  const dirs = [stateDir, plansDir, logsDir, artifactsDir]
  for (const dir of dirs) {
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true })
    }
  }
}

/** Lazy-import from modes to avoid circular dependency at module level */
let _readState: ((directory: string, stateName: string, sessionId?: string) => Record<string, unknown> | null) | null = null

function getReadState() {
  if (!_readState) {
    // Dynamic require to break circular deps
    _readState = require('./modes').readState
  }
  return _readState!
}

export function getSessionRestoreMessages(directory: string, sessionId?: string): string[] {
  const messages: string[] = []

  const readStateFn = getReadState()

  const ultraworkState = readStateFn(directory, 'ultrawork', sessionId)
  if (ultraworkState?.active) {
    messages.push(`<session-restore>
[ULTRAWORK MODE RESTORED]
You have an active ultrawork session from ${ultraworkState.started_at}.
Original task: ${ultraworkState.original_prompt}
Treat this as prior-session context only. Prioritize the user's newest request.
</session-restore>`)
  }

  const ralphState = readStateFn(directory, 'ralph', sessionId)
  if (ralphState?.active) {
    messages.push(`<session-restore>
[RALPH LOOP RESTORED]
You have an active ralph-loop session.
Original task: ${ralphState.prompt || 'Task in progress'}
Iteration: ${ralphState.iteration || 1}/${ralphState.max_iterations || 10}
Treat this as prior-session context only. Prioritize the user's newest request.
</session-restore>`)
  }

  const todoFile = join(directory, '.opencode', 'state', 'todos.json')
  if (existsSync(todoFile)) {
    const todos = readJsonFile<{ todos?: Array<{ status: string }> }>(todoFile)
    if (todos?.todos) {
      const incompleteCount = todos.todos.filter(t =>
        t.status !== 'completed' && t.status !== 'cancelled'
      ).length

      if (incompleteCount > 0) {
        messages.push(`<session-restore>
[PENDING TASKS DETECTED]
You have ${incompleteCount} incomplete tasks from a previous session.
Treat this as prior-session context only. Prioritize the user's newest request.
</session-restore>`)
      }
    }
  }

  return messages
}

// ============================================================================
// Todo Status Cache
// ============================================================================

export const TODO_CACHE_TTL = 1000 // 1 second
const todoCache = new Map<string, { status: string; timestamp: number }>()

export function getTodoStatus(directory: string): string {
  const cacheKey = directory
  const cached = todoCache.get(cacheKey)
  if (cached && Date.now() - cached.timestamp < TODO_CACHE_TTL) {
    return cached.status
  }

  const todoFile = join(directory, '.opencode', 'state', 'todos.json')
  if (!existsSync(todoFile)) {
    todoCache.set(cacheKey, { status: '', timestamp: Date.now() })
    return ''
  }

  const todos = readJsonFile<{ todos?: Array<{ status: string }> }>(todoFile)
  if (!todos?.todos) {
    todoCache.set(cacheKey, { status: '', timestamp: Date.now() })
    return ''
  }

  const pending = todos.todos.filter(t => t.status === 'pending').length
  const inProgress = todos.todos.filter(t => t.status === 'in_progress').length

  let status = ''
  if (pending + inProgress > 0) {
    status = `[${inProgress} active, ${pending} pending] `
  }

  todoCache.set(cacheKey, { status, timestamp: Date.now() })
  return status
}

// ============================================================================
// Pre-Tool Enforcer Logic
// ============================================================================

export function generatePreToolMessage(toolName: string, todoStatus: string, modeActive: boolean): string {
  if (QUIET_LEVEL >= 1 && ['Bash', 'Edit', 'Write', 'Read', 'Grep', 'Glob'].includes(toolName)) {
    return ''
  }
  if (QUIET_LEVEL >= 2 && toolName === 'TodoWrite') {
    return ''
  }

  // No pre-tool reminders — stall detection handles nudging, agents own their task management
  return ''
}

// ============================================================================
// Post-Tool Verifier Logic
// ============================================================================

function detectBashFailure(output: string): boolean {
  const errorPatterns = [
    /error:/i,
    /failed/i,
    /cannot/i,
    /permission denied/i,
    /command not found/i,
    /no such file/i,
    /exit code: [1-9]/i,
    /exit status [1-9]/i,
    /fatal:/i,
    /abort/i,
  ]

  return errorPatterns.some(pattern => pattern.test(output))
}

function detectWriteFailure(output: string): boolean {
  const errorPatterns = [
    /\berror:/i,
    /\bfailed to\b/i,
    /\bwrite failed\b/i,
    /\boperation failed\b/i,
    /permission denied/i,
    /read-only/i,
    /\bno such file\b/i,
    /\bdirectory not found\b/i,
  ]

  return errorPatterns.some(pattern => pattern.test(output))
}

function detectBackgroundOperation(output: string): boolean {
  const bgPatterns = [
    /started/i,
    /running/i,
    /background/i,
    /async/i,
    /task_id/i,
    /spawned/i,
  ]

  return bgPatterns.some(pattern => pattern.test(output))
}

export function generatePostToolMessage(toolName: string, toolOutput: string, toolCount: number): string {
  // Skip function call overhead for tools that never produce reminders
  // Only Bash/Edit/Write (failure detection) and Grep/Glob (empty results) need checking
  const RELEVANT_TOOLS = new Set(['Bash', 'Edit', 'Write', 'Grep', 'Glob'])
  if (!RELEVANT_TOOLS.has(toolName)) return ''

  // Only check for failure on mutation tools — skip on success (no regex matching needed)
  if (toolName === 'Bash' || toolName === 'Edit' || toolName === 'Write') {
    const hasError = toolName === 'Bash'
      ? /error:|failed|cannot|permission denied|command not found|no such file/i.test(toolOutput)
      : /\berror:|\bfailed to\b|\boperation failed\b|permission denied/i.test(toolOutput)
    if (hasError) {
      return toolName === 'Bash'
        ? 'Command failed. Investigate and fix before continuing.'
        : 'Write/Edit failed. Verify file exists and content matches.'
    }
    return ''
  }

  // Grep/Glob: only remind on empty results at QUIET_LEVEL 0
  if (QUIET_LEVEL === 0) {
    if (toolName === 'Grep' && /^0$|no matches/i.test(toolOutput)) {
      return 'No matches found. Verify pattern syntax or try broader search.'
    }
    if (toolName === 'Glob' && (!toolOutput.trim() || /no files/i.test(toolOutput))) {
      return 'No files matched pattern. Verify glob syntax and directory.'
    }
  }

  return ''
}

// ============================================================================
// Smart Stall Detection — Heartbeat-Based Progress Monitor
// ============================================================================

export interface HeartbeatEntry {
  lastToolCall: string
  lastToolName: string
  lastOutputTruncated: string
  toolCount: number
  recentTools: Array<{ name: string; time: string }>
  todoProgress: {
    lastChange: string
    completed: number
    remaining: number
    pending: number
    inProgress: number
  }
}

export const STALL_CONFIG = {
  activeThreshold: 15000,       // 15s — actively making tool calls
  slowThreshold: 60000,         // 60s — might be a long-running tool
  warnThreshold: 120000,        // 120s — no progress → soft nudge
  hardThreshold: 300000,        // 300s — no activity → hard nudge
  nudgeCooldown: 90000,         // 90s — min time between nudges
  knownLongOps: ['build', 'test', 'deploy', 'install', 'compile', 'npm install'],
  maxSoftNudges: 1,             // per stall period
  maxHardNudgesPerSession: 3,   // per session lifetime
}

export const STALL_NUDGE_CACHE = new Map<string, { lastNudge: number; softCount: number; hardCount: number }>()

export function getHeartbeatPath(directory: string, sessionId: string): string {
  return join(directory, '.opencode', 'state', 'sessions', sessionId, 'heartbeat.json')
}

// Batched heartbeat write counter — write to disk every 5th call
let _heartbeatCounter = 0

export function recordHeartbeat(directory: string, sessionId: string, toolName: string, toolOutput: string, todoStatus: string): void {
  const hbPath = getHeartbeatPath(directory, sessionId)
  const existing = readJsonFile<HeartbeatEntry>(hbPath) || {
    lastToolCall: '',
    lastToolName: '',
    lastOutputTruncated: '',
    toolCount: 0,
    recentTools: [],
    todoProgress: { lastChange: '', completed: 0, remaining: 0, pending: 0, inProgress: 0 },
  }

  // Parse todo status like "[2 active, 3 pending] "
  const todoMatch = todoStatus.match(/\[(\d+)\s+active,\s*(\d+)\s+pending\]/)
  const active = todoMatch ? parseInt(todoMatch[1]) : 0
  const pending = todoMatch ? parseInt(todoMatch[2]) : 0
  const completed = existing.todoProgress.completed
  const nowRemaining = active + pending
  // Detect if progress was made (completed increased or remaining decreased)
  const progressMade = completed > existing.todoProgress.completed || nowRemaining < existing.todoProgress.remaining

  const now = new Date().toISOString()

  const entry: HeartbeatEntry = {
    lastToolCall: now,
    lastToolName: toolName,
    lastOutputTruncated: toolOutput.substring(0, 200).replace(/\n/g, ' '),
    toolCount: existing.toolCount + 1,
    recentTools: [
      { name: toolName, time: now },
      ...existing.recentTools.slice(0, 4),
    ],
    todoProgress: {
      lastChange: progressMade ? now : existing.todoProgress.lastChange,
      completed: existing.todoProgress.completed + (progressMade ? 1 : 0),
      remaining: nowRemaining,
      pending,
      inProgress: active,
    },
  }

  // Batch writes to reduce disk I/O — write every 5th heartbeat
  _heartbeatCounter++
  if (_heartbeatCounter % 5 === 0) {
    writeJsonFile(hbPath, entry)
  }
}

export type StallStatus = 'ACTIVE' | 'SLOW_POSSIBLE' | 'STALLED_SOFT' | 'STALLED_HARD' | 'SESSION_RESET'

export function classifyStall(directory: string, sessionId: string): StallStatus {
  const hbPath = getHeartbeatPath(directory, sessionId)
  const heartbeat = readJsonFile<HeartbeatEntry>(hbPath)
  if (!heartbeat?.lastToolCall) return 'ACTIVE' // no heartbeat yet → assume active

  const now = Date.now()
  const lastCall = new Date(heartbeat.lastToolCall).getTime()
  const elapsed = now - lastCall

  // Check for known long ops
  const isLongOp = STALL_CONFIG.knownLongOps.some(op =>
    heartbeat.lastToolName === 'Bash' && heartbeat.lastOutputTruncated.toLowerCase().includes(op)
  )

  if (elapsed < STALL_CONFIG.activeThreshold) return 'ACTIVE'
  if (isLongOp && elapsed < STALL_CONFIG.slowThreshold * 2) return 'SLOW_POSSIBLE' // double threshold for known long ops
  if (elapsed < STALL_CONFIG.slowThreshold) return 'SLOW_POSSIBLE'

  // Check if todos have changed recently
  const progressTime = heartbeat.todoProgress.lastChange
    ? new Date(heartbeat.todoProgress.lastChange).getTime()
    : 0
  const progressRecent = (now - progressTime) < STALL_CONFIG.warnThreshold

  if (elapsed < STALL_CONFIG.warnThreshold && progressRecent) return 'SLOW_POSSIBLE'
  if (elapsed < STALL_CONFIG.warnThreshold) return 'STALLED_SOFT'
  if (elapsed < STALL_CONFIG.hardThreshold) return 'STALLED_SOFT'

  return 'STALLED_HARD'
}

export function shouldCheckStall(sessionId: string, directory: string): boolean {
  // Check every 5th tool call or every 30 seconds, whichever is more frequent
  const hbPath = getHeartbeatPath(directory, sessionId)
  const heartbeat = readJsonFile<HeartbeatEntry>(hbPath)
  if (!heartbeat) return false

  // Every 10 tool calls
  if (heartbeat.toolCount % 10 === 0) return true

  // Or if last check was > 30s ago
  const nudgeState = STALL_NUDGE_CACHE.get(sessionId)
  if (!nudgeState) return true
  if (Date.now() - nudgeState.lastNudge > 30000) return true

  return false
}

export function generateStallNudge(status: StallStatus, sessionId: string, directory: string): string | null {
  const hbPath = getHeartbeatPath(directory, sessionId)
  const heartbeat = readJsonFile<HeartbeatEntry>(hbPath)
  if (!heartbeat) return null

  const nudgeState = STALL_NUDGE_CACHE.get(sessionId) || { lastNudge: 0, softCount: 0, hardCount: 0 }

  // Cooldown check
  if (Date.now() - nudgeState.lastNudge < STALL_CONFIG.nudgeCooldown) return null

  if (status === 'STALLED_SOFT') {
    if (nudgeState.softCount >= STALL_CONFIG.maxSoftNudges) return null
    nudgeState.softCount++
    nudgeState.lastNudge = Date.now()
    STALL_NUDGE_CACHE.set(sessionId, nudgeState)

    const elapsed = Math.round((Date.now() - new Date(heartbeat.lastToolCall).getTime()) / 1000)
    return `<stall-detection>
Last tool call (${heartbeat.lastToolName}) was ${elapsed}s ago. No progress detected.
Last output: "${heartbeat.lastOutputTruncated.substring(0, 80)}"
Todos: ${heartbeat.todoProgress.completed} completed, ${heartbeat.todoProgress.remaining} remaining
Are you stuck, or is a long operation in progress?
</stall-detection>`
  }

  if (status === 'STALLED_HARD') {
    if (nudgeState.hardCount >= STALL_CONFIG.maxHardNudgesPerSession) return null
    nudgeState.hardCount++
    nudgeState.lastNudge = Date.now()
    nudgeState.softCount = 0 // reset soft counter since we escalated
    STALL_NUDGE_CACHE.set(sessionId, nudgeState)

    const elapsed = Math.round((Date.now() - new Date(heartbeat.lastToolCall).getTime()) / 1000)
    return `<stall-recovery>
No activity detected in ${elapsed}s. Last tool: ${heartbeat.lastToolName}.
Last state: ${heartbeat.todoProgress.completed} completed, ${heartbeat.todoProgress.remaining} remaining.
Original task context may still be relevant.

Options:
- Resume: continue from your last checkpoint
- Reassess: review progress and adjust approach
- Cancel: stop this operation entirely
</stall-recovery>`
  }

  return null
}