/**
 * OpenCode Hubs Plugin
 * 
 * A TypeScript plugin for OpenCode that implements the hook system for multi-agent orchestration.
 * Provides hub command routing, session state management, and context persistence including:
 * - Magic keyword detection (ralph, autopilot, ultrawork, etc.)
 * - Session state management and restoration
 * - Tool execution validation and reminders
 * - File modification tracking
 * 
 * Path conventions:
 * - User-wide config: ~/.config/opencode/ (agents, skills, settings shared across projects)
 * - Project-level config: .opencode/ (project-specific agents, skills, commands, state)
 * - State stored in .opencode/state/ (gitignored via .gitignore)
 * 
 * @module hubs-plugin
 */

import type { Plugin, Hooks } from "@opencode-ai/plugin"
import type { Event } from "@opencode-ai/sdk"
import { existsSync, mkdirSync, readFileSync, writeFileSync, unlinkSync, readdirSync } from "fs"
import { join, dirname } from "path"
import { homedir } from "os"

// User-wide configuration directory (Linux: ~/.config/opencode/)
const USER_CONFIG_DIR = process.env.OPENCODE_CONFIG_DIR || join(homedir(), '.config', 'opencode')

// ============================================================================
// Types and Interfaces
// ============================================================================

interface ModeState {
  active: boolean
  started_at?: string
  completed_at?: string
  iteration?: number
  max_iterations?: number
  current_phase?: string
  prompt?: string
  original_prompt?: string
  session_id?: string
  project_path?: string
  reinforcement_count?: number
  awaiting_confirmation?: boolean
  last_checked_at?: string
  linked_ultrawork?: boolean
  linked_team?: boolean
  linked_ralph?: boolean
}

interface SessionStats {
  sessions: Record<string, {
    tool_counts: Record<string, number>
    last_tool: string
    total_calls: number
    started_at: number
    updated_at?: number
  }>
}

interface QueuedPrompt {
  id: string
  text: string
  timestamp: string
  status: 'queued' | 'submitted' | 'completed' | 'failed'
  error?: string
}

interface PromptQueue {
  items: QueuedPrompt[]
  lastSubmittedId?: string
  lastSubmittedAt?: string
  paused: boolean
  pausedReason?: string
}

interface KeywordMatch {
  name: string
  args: string
}

// ============================================================================
// Constants
// ============================================================================

const SESSION_ID_PATTERN = /^[a-zA-Z0-9][a-zA-Z0-9_-]{0,255}$/
const MODE_STATE_FILES = [
  'autopilot-state.json',
  'ralph-state.json',
  'ultrawork-state.json',
  'ralplan-state.json',
  'team-state.json',
  'ultraqa-state.json',
]

const QUIET_LEVEL = getQuietLevel()

const KEYWORD_PATTERNS = {
  cancel: /\b(cancelomc|stopomc)\b/i,
  ralph: /\b(ralph|don't stop|must complete|until done)\b/i,
  autopilot: /\b(autopilot|auto pilot|auto-pilot|autonomous|full auto|fullsend)\b/i,
  autopilotBuild: /\b(build|create|make)\s+me\s+(an?\s+)?(app|feature|project|tool|plugin|website|api|server|cli|script|system|service|dashboard|bot|extension)\b/i,
  autopilotWant: /\bi\s+want\s+a\s+/i,
  ultrawork: /\b(ultrawork|ulw|uw)\b/i,
  ralplan: /\b(ralplan)\b/i,
  deepInterview: /\b(deep[\s-]interview|ouroboros)\b/i,
  aiSlopCleaner: /\b(ai[\s-]?slop|anti[\s-]?slop|deslop|de[\s-]?slop)\b/i,
  tdd: /\b(tdd)\b/i,
  tddTestFirst: /\btest\s+first\b/i,
  codeReview: /\b(code\s+review|review\s+code)\b/i,
  securityReview: /\b(security\s+review|review\s+security)\b/i,
  ultrathink: /\b(ultrathink|think hard|think deeply)\b/i,
  deepsearch: /\b(deepsearch)\b/i,
  analyze: /\b(deep[\s-]?analyze|deepanalyze)\b/i,
  newAgent: /\b(create[\s-]?agent|new[\s-]?agent|agent[\s-]?creator)\b/i,
}

const MODE_MESSAGES: Record<string, string> = {
  ultrathink: `<think-mode>
**ULTRATHINK MODE ENABLED** - Extended reasoning activated.
You are now in deep thinking mode. Take your time to:
1. Thoroughly analyze the problem from multiple angles
2. Consider edge cases and potential issues
3. Think through the implications of each approach
4. Reason step-by-step before acting
</think-mode>`,
  
  deepsearch: `<search-mode>
MAXIMIZE SEARCH EFFORT. Launch multiple background agents IN PARALLEL:
- explore agents (codebase patterns, file structures)
- librarian agents (remote repos, official docs, GitHub examples)
Plus direct tools: Grep, Glob
NEVER stop at first result - be exhaustive.
</search-mode>`,
  
  analyze: `<analyze-mode>
ANALYSIS MODE. Gather context before diving deep:
- Search relevant code paths first
- Compare working vs broken behavior
- Synthesize findings before proposing changes
</analyze-mode>`,
  
  tdd: `<tdd-mode>
[TDD MODE ACTIVATED]
Write or update tests first when practical, confirm they fail for the right reason, then implement the minimal fix and re-run verification.
</tdd-mode>`,
  
  codeReview: `<code-review-mode>
[CODE REVIEW MODE ACTIVATED]
Perform a comprehensive code review of the relevant changes or target area. Focus on correctness, maintainability, edge cases, regressions, and test adequacy before recommending changes.
</code-review-mode>`,
  
  securityReview: `<security-review-mode>
[SECURITY REVIEW MODE ACTIVATED]
Perform a focused security review of the relevant changes or target area. Check trust boundaries, auth/authz, data exposure, input validation, command/file access, secrets handling, and escalation risks before recommending changes.
</security-review-mode>`,
  
  newAgent: `<new-agent-mode>
[NEW AGENT CREATOR MODE ACTIVATED]
Create a new agent following research-backed best practices:
1. Gather agent requirements (name, purpose, use cases)
2. Create minimal system prompt (~500 tokens)
3. Define tool usage patterns
4. Generate test suite (8 essential tests)
5. Register and validate
Use /new-agents create-agent command for the full workflow.
</new-agent-mode>`,
}

// ============================================================================
// Utility Functions
// ============================================================================

function getQuietLevel(): number {
  const parsed = Number.parseInt(process.env.OMC_QUIET || '0', 10)
  return Number.isNaN(parsed) ? 0 : Math.max(0, parsed)
}

function isValidSessionId(sessionId: string | undefined): boolean {
  return typeof sessionId === 'string' && SESSION_ID_PATTERN.test(sessionId)
}

function readJsonFile<T>(filePath: string): T | null {
  try {
    if (!existsSync(filePath)) return null
    return JSON.parse(readFileSync(filePath, 'utf-8')) as T
  } catch {
    return null
  }
}

// ─── Hub Menu Route Cache ──────────────────────────────────────────────
// Caches hubMenu route results to avoid redundant tool execution per session.
const _hubRouteCache = new Map<string, string>()

function getHubRoute(hub: string, subcommand: string): string | null {
  return _hubRouteCache.get(`${hub}:${subcommand}`) || null
}

function setHubRoute(hub: string, subcommand: string, result: string): void {
  _hubRouteCache.set(`${hub}:${subcommand}`, result)
}

function writeJsonFile<T>(filePath: string, data: T): void {
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

function getStateDir(directory: string, sessionId?: string): string {
  if (sessionId && isValidSessionId(sessionId)) {
    return join(directory, '.opencode', 'state', 'sessions', sessionId)
  }
  return join(directory, '.opencode', 'state')
}

function getStatePath(directory: string, stateName: string, sessionId?: string): string {
  return join(getStateDir(directory, sessionId), `${stateName}-state.json`)
}

function getOmcConfigDir(): string {
  return USER_CONFIG_DIR
}

function getProjectStateDir(projectDir: string): string {
  return join(projectDir, '.opencode', 'state')
}

function isProjectInitialized(projectDir: string): boolean {
  return existsSync(join(projectDir, '.opencode', 'opencode.jsonc')) || 
         existsSync(join(projectDir, '.opencode', 'AGENTS.md'))
}

// ============================================================================
// State Management
// ============================================================================

function readState(directory: string, stateName: string, sessionId?: string): ModeState | null {
  const paths = [
    getStatePath(directory, stateName, sessionId),
    getStatePath(directory, stateName),
  ]
  
  for (const path of paths) {
    const state = readJsonFile<ModeState>(path)
    if (state) {
      if (sessionId && state.session_id && state.session_id !== sessionId) {
        continue
      }
      return state
    }
  }
  return null
}

function writeState(directory: string, stateName: string, state: ModeState, sessionId?: string): void {
  const path = getStatePath(directory, stateName, sessionId)
  writeJsonFile(path, state)
}

function clearState(directory: string, stateName: string, sessionId?: string): void {
  const paths = [
    getStatePath(directory, stateName, sessionId),
    getStatePath(directory, stateName),
  ]
  
  for (const path of paths) {
    try {
      if (existsSync(path)) {
        unlinkSync(path)
      }
    } catch {
      // Best-effort cleanup
    }
  }
}

// ============================================================================
// Active Mode Detection — With In-Memory Cache
// ============================================================================

const MODE_CACHE_TTL = 2000 // invalidate after 2 seconds
const modeActiveCache = new Map<string, { result: boolean; timestamp: number }>()

function getModeCacheKey(directory: string, sessionId?: string): string {
  return `${directory}:${sessionId || 'global'}`
}

function hasActiveMode(directory: string, sessionId?: string): boolean {
  const cacheKey = getModeCacheKey(directory, sessionId)
  const cached = modeActiveCache.get(cacheKey)
  if (cached && Date.now() - cached.timestamp < MODE_CACHE_TTL) {
    return cached.result
  }
  
  const stateDir = join(directory, '.opencode', 'state')
  
  if (sessionId && isValidSessionId(sessionId)) {
    const sessionDir = join(stateDir, 'sessions', sessionId)
    for (const file of MODE_STATE_FILES) {
      const state = readJsonFile<ModeState>(join(sessionDir, file))
      if (state?.active === true) {
        modeActiveCache.set(cacheKey, { result: true, timestamp: Date.now() })
        return true
      }
    }
  }
  
  for (const file of MODE_STATE_FILES) {
    const state = readJsonFile<ModeState>(join(stateDir, file))
    if (state?.active === true && !state.session_id) {
      modeActiveCache.set(cacheKey, { result: true, timestamp: Date.now() })
      return true
    }
  }
  
  modeActiveCache.set(cacheKey, { result: false, timestamp: Date.now() })
  return false
}

/** Invalidate mode cache (call when mode state changes). */
function invalidateModeCache(directory: string, sessionId?: string): void {
  const cacheKey = getModeCacheKey(directory, sessionId)
  modeActiveCache.delete(cacheKey)
  // Also clear the global key since modes can affect all
  modeActiveCache.delete(getModeCacheKey(directory))
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

function queueContextMessage(sessionId: string, message: string): void {
  if (!message.trim()) return
  const ctx = getSessionContext(sessionId)
  ctx.pendingMessages.push(message)
  ctx.lastUpdated = new Date().toISOString()
  
  // Prevent unbounded growth - keep last 20 messages
  if (ctx.pendingMessages.length > 20) {
    ctx.pendingMessages = ctx.pendingMessages.slice(-20)
  }
}

function consumeContextMessages(sessionId: string): string[] {
  const ctx = sessionContextCache.get(sessionId)
  if (!ctx || ctx.pendingMessages.length === 0) return []
  
  const messages = [...ctx.pendingMessages]
  ctx.pendingMessages = []
  ctx.lastUpdated = new Date().toISOString()
  return messages
}

function clearSessionContext(sessionId: string): void {
  sessionContextCache.delete(sessionId)
}

// ============================================================================
// Smart Stall Detection — Heartbeat-Based Progress Monitor
// ============================================================================

interface HeartbeatEntry {
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

interface OrphanedMode {
  name: string
  state: ModeState
}

const STALL_CONFIG = {
  activeThreshold: 15000,       // 15s — actively making tool calls
  slowThreshold: 60000,         // 60s — might be a long-running tool
  warnThreshold: 120000,        // 120s — no progress → soft nudge
  hardThreshold: 300000,        // 300s — no activity → hard nudge
  nudgeCooldown: 90000,         // 90s — min time between nudges
  knownLongOps: ['build', 'test', 'deploy', 'install', 'compile', 'npm install'],
  maxSoftNudges: 1,             // per stall period
  maxHardNudgesPerSession: 3,   // per session lifetime
}

const STALL_NUDGE_CACHE = new Map<string, { lastNudge: number; softCount: number; hardCount: number }>()

function getHeartbeatPath(directory: string, sessionId: string): string {
  return join(directory, '.opencode', 'state', 'sessions', sessionId, 'heartbeat.json')
}

function recordHeartbeat(directory: string, sessionId: string, toolName: string, toolOutput: string, todoStatus: string): void {
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
  const wasProgress = existing.todoProgress.remaining
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

  writeJsonFile(hbPath, entry)
}

type StallStatus = 'ACTIVE' | 'SLOW_POSSIBLE' | 'STALLED_SOFT' | 'STALLED_HARD' | 'SESSION_RESET'

function classifyStall(directory: string, sessionId: string): StallStatus {
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

function shouldCheckStall(sessionId: string, directory: string): boolean {
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

function generateStallNudge(status: StallStatus, sessionId: string, directory: string): string | null {
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

function detectOrphanedModes(directory: string, sessionId?: string): OrphanedMode[] {
  const stateDir = join(directory, '.opencode', 'state')
  const orphaned: OrphanedMode[] = []

  // Check session-scoped state files
  if (sessionId && isValidSessionId(sessionId)) {
    const sessionDir = join(stateDir, 'sessions', sessionId)
    for (const file of MODE_STATE_FILES) {
      const state = readJsonFile<ModeState>(join(sessionDir, file))
      if (state?.active === true) {
        // Check if there's a recent heartbeat
        const hbPath = getHeartbeatPath(directory, sessionId)
        const heartbeat = readJsonFile<HeartbeatEntry>(hbPath)
        const modeName = file.replace('-state.json', '')
        if (!heartbeat || (Date.now() - new Date(heartbeat.lastToolCall).getTime()) > STALL_CONFIG.hardThreshold) {
          orphaned.push({ name: modeName, state })
        }
      }
    }
  }

  // Check global state files
  for (const file of MODE_STATE_FILES) {
    const state = readJsonFile<ModeState>(join(stateDir, file))
    if (state?.active === true && !state.session_id) {
      const modeName = file.replace('-state.json', '')
      orphaned.push({ name: modeName, state })
    }
  }

  return orphaned
}

function generateRecoveryContext(orphaned: OrphanedMode[]): string {
  if (orphaned.length === 0) return ''

  const details = orphaned.map(o => {
    const age = o.state.last_checked_at
      ? Math.round((Date.now() - new Date(o.state.last_checked_at).getTime()) / 1000)
      : 'unknown'
    return `- Mode: ${o.name} (active as of ${o.state.last_checked_at || 'unknown'}, ~${age}s ago)
  Original task: ${(o.state.prompt || o.state.original_prompt || 'Unknown').substring(0, 200)}`
  }).join('\n')

  return `<session-recovery>
Previous session was interrupted. Found orphaned mode state:
${details}

The state has been preserved. You can:
- Resume by continuing the original task
- Use /cancel to clear the state and start fresh
- Proceed with a new request (orphaned state will be ignored)
</session-recovery>`
}

// ============================================================================
// Session Statistics — In-Memory Cache (Avoid Sync I/O on Hot Path)
// ============================================================================

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
function flushSessionStats(): void {
  if (statsDirty && statsCache) {
    writeJsonFile(SESSION_STATS_FILE, statsCache)
    statsDirty = false
  }
}

let statsUpdateCounter = 0

function updateToolStats(toolName: string, sessionId: string): number {
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

/** Prune sessions older than 7 days on load to prevent unbounded file growth. */
function loadSessionStatsPruned(): SessionStats {
  const stats = loadSessionStats()
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
// Keyword Detection
// ============================================================================

function sanitizeForKeywordDetection(text: string): string {
  return text
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<(\w[\w-]*)[\s>][\s\S]*?<\/\1>/g, '')
    .replace(/<\w[\w-]*(?:\s[^>]*)?\s*\/>/g, '')
    .replace(/https?:\/\/[^\s)>\]]+/g, '')
    .replace(/(?<=^|[\s"'`(])(?:\/)?(?:[\w.-]+\/)+[\w.-]+/gm, '')
    .replace(/```[\s\S]*?```/g, '')
    .replace(/`[^`]+`/g, '')
}

function isAntiSlopCleanupRequest(text: string): boolean {
  const explicitPattern = /\b(ai[\s-]?slop|anti[\s-]?slop|deslop|de[\s-]?slop)\b/i
  const actionPattern = /\b(clean(?:\s*up)?|cleanup|refactor|simplify|dedupe|de-duplicate|prune)\b/i
  const smellPattern = /\b(slop|duplicate(?:d|s)?|duplication|dead\s+code|unused\s+code|over[\s-]?abstract(?:ion|ed)?|wrapper\s+layers?|boundary\s+violations?|needless\s+abstractions?|unnecessary\s+abstractions?|ai[\s-]?generated|generated\s+code|tech\s+debt)\b/i
  
  return explicitPattern.test(text) || (actionPattern.test(text) && smellPattern.test(text))
}

const INFORMATIONAL_INTENT_PATTERNS = [
  /\b(?:what(?:'s|\s+is)|what\s+are|how\s+(?:to|do\s+i)\s+use|explain|explanation|tell\s+me\s+about|describe)\b/i,
]

function isInformationalKeywordContext(text: string, position: number, keywordLength: number): boolean {
  const CONTEXT_WINDOW = 80
  const start = Math.max(0, position - CONTEXT_WINDOW)
  const end = Math.min(text.length, position + keywordLength + CONTEXT_WINDOW)
  const context = text.slice(start, end)
  
  return INFORMATIONAL_INTENT_PATTERNS.some(pattern => pattern.test(context))
}

function hasActionableKeyword(text: string, pattern: RegExp): boolean {
  const flags = pattern.flags.includes('g') ? pattern.flags : `${pattern.flags}g`
  const globalPattern = new RegExp(pattern.source, flags)
  
  for (const match of text.matchAll(globalPattern)) {
    if (match.index === undefined) continue
    if (isInformationalKeywordContext(text, match.index, match[0].length)) continue
    return true
  }
  
  return false
}

function detectKeywords(prompt: string): KeywordMatch[] {
  const matches: KeywordMatch[] = []
  const cleanPrompt = sanitizeForKeywordDetection(prompt).toLowerCase()
  
  if (hasActionableKeyword(cleanPrompt, KEYWORD_PATTERNS.cancel)) {
    matches.push({ name: 'cancel', args: '' })
  }
  
  if (hasActionableKeyword(cleanPrompt, KEYWORD_PATTERNS.ralph)) {
    matches.push({ name: 'ralph', args: '' })
  }
  
  if (hasActionableKeyword(cleanPrompt, KEYWORD_PATTERNS.autopilot) ||
      hasActionableKeyword(cleanPrompt, KEYWORD_PATTERNS.autopilotBuild) ||
      hasActionableKeyword(cleanPrompt, KEYWORD_PATTERNS.autopilotWant)) {
    matches.push({ name: 'autopilot', args: '' })
  }
  
  if (hasActionableKeyword(cleanPrompt, KEYWORD_PATTERNS.ultrawork)) {
    matches.push({ name: 'ultrawork', args: '' })
  }
  
  if (hasActionableKeyword(cleanPrompt, KEYWORD_PATTERNS.ralplan)) {
    matches.push({ name: 'ralplan', args: '' })
  }
  
  if (hasActionableKeyword(cleanPrompt, KEYWORD_PATTERNS.deepInterview)) {
    matches.push({ name: 'deep-interview', args: '' })
  }
  
  if (isAntiSlopCleanupRequest(cleanPrompt)) {
    matches.push({ name: 'ai-slop-cleaner', args: '' })
  }
  
  if (hasActionableKeyword(cleanPrompt, KEYWORD_PATTERNS.tdd) ||
      hasActionableKeyword(cleanPrompt, KEYWORD_PATTERNS.tddTestFirst)) {
    matches.push({ name: 'tdd', args: '' })
  }
  
  if (hasActionableKeyword(cleanPrompt, KEYWORD_PATTERNS.codeReview)) {
    matches.push({ name: 'code-review', args: '' })
  }
  
  if (hasActionableKeyword(cleanPrompt, KEYWORD_PATTERNS.securityReview)) {
    matches.push({ name: 'security-review', args: '' })
  }
  
  if (hasActionableKeyword(cleanPrompt, KEYWORD_PATTERNS.ultrathink)) {
    matches.push({ name: 'ultrathink', args: '' })
  }
  
  if (hasActionableKeyword(cleanPrompt, KEYWORD_PATTERNS.deepsearch)) {
    matches.push({ name: 'deepsearch', args: '' })
  }
  
  if (hasActionableKeyword(cleanPrompt, KEYWORD_PATTERNS.analyze)) {
    matches.push({ name: 'analyze', args: '' })
  }
  
  if (hasActionableKeyword(cleanPrompt, KEYWORD_PATTERNS.newAgent)) {
    matches.push({ name: 'new-agent', args: '' })
  }
  
  return matches
}

function resolveConflicts(matches: KeywordMatch[]): KeywordMatch[] {
  const names = matches.map(m => m.name)
  
  if (names.includes('cancel')) {
    return [matches.find(m => m.name === 'cancel')!]
  }
  
  const priorityOrder = [
    'cancel', 'ralph', 'autopilot', 'ultrawork', 'ralplan',
    'deep-interview', 'ai-slop-cleaner', 'tdd', 'code-review',
    'security-review', 'ultrathink', 'deepsearch', 'analyze', 'new-agent'
  ]
  
  const resolved = [...matches]
  resolved.sort((a, b) => priorityOrder.indexOf(a.name) - priorityOrder.indexOf(b.name))
  
  return resolved
}

function activateModeState(directory: string, prompt: string, stateName: string, sessionId?: string): void {
  const now = new Date().toISOString()
  
  let state: ModeState
  
  if (stateName === 'ralph') {
    state = {
      active: true,
      iteration: 1,
      max_iterations: 100,
      started_at: now,
      prompt,
      session_id: sessionId,
      project_path: directory,
      linked_ultrawork: true,
      awaiting_confirmation: true,
      last_checked_at: now
    }
  } else if (stateName === 'ralplan') {
    state = {
      active: true,
      started_at: now,
      session_id: sessionId,
      project_path: directory,
      awaiting_confirmation: true,
      last_checked_at: now
    }
  } else {
    state = {
      active: true,
      started_at: now,
      original_prompt: prompt,
      session_id: sessionId,
      project_path: directory,
      reinforcement_count: 0,
      awaiting_confirmation: true,
      last_checked_at: now
    }
  }
  
  writeState(directory, stateName, state, sessionId)
}

function clearModeStates(directory: string, modeNames: string[], sessionId?: string): void {
  for (const name of modeNames) {
    clearState(directory, name, sessionId)
  }
}

// ============================================================================
// Session Start Logic
// ============================================================================

function initializeJocState(directory: string): void {
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

function getSessionRestoreMessages(directory: string, sessionId?: string): string[] {
  const messages: string[] = []
  
  const ultraworkState = readState(directory, 'ultrawork', sessionId)
  if (ultraworkState?.active) {
    messages.push(`<session-restore>
[ULTRAWORK MODE RESTORED]
You have an active ultrawork session from ${ultraworkState.started_at}.
Original task: ${ultraworkState.original_prompt}
Treat this as prior-session context only. Prioritize the user's newest request.
</session-restore>`)
  }
  
  const ralphState = readState(directory, 'ralph', sessionId)
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
// Pre-Tool Enforcer Logic
// ============================================================================

const todoCache = new Map<string, { status: string; timestamp: number }>()
const TODO_CACHE_TTL = 1000 // 1 second

function getTodoStatus(directory: string): string {
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

function generatePreToolMessage(toolName: string, todoStatus: string, modeActive: boolean): string {
  if (QUIET_LEVEL >= 1 && ['Bash', 'Edit', 'Write', 'Read', 'Grep', 'Glob'].includes(toolName)) {
    return ''
  }
  if (QUIET_LEVEL >= 2 && toolName === 'TodoWrite') {
    return ''
  }
  
  // No pre-tool reminders in active mode — stall detection handles nudging
  if (modeActive) return ''
  
  // Only remind on TodoWrite (for task management discipline)
  if (toolName === 'TodoWrite') {
    return `${todoStatus}Keep task list current — mark in_progress before starting, completed after finishing.`
  }
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

function generatePostToolMessage(toolName: string, toolOutput: string, toolCount: number): string {
  let message = ''
  
  switch (toolName) {
    case 'Bash':
      if (detectBashFailure(toolOutput)) {
        message = 'Command failed. Investigate and fix before continuing.'
      }
      break
    
    case 'Edit':
      if (detectWriteFailure(toolOutput)) {
        message = 'Edit failed. Verify file exists and content matches.'
      }
      break
    
    case 'Write':
      if (detectWriteFailure(toolOutput)) {
        message = 'Write failed. Check file permissions and directory.'
      }
      break
    
    // Removed success reminders (TodoWrite, Read, success paths).
    // These spam context without adding value. Stall detection handles
    // "are you stuck?" while agents already know to verify their work.
    
    case 'Grep':
      if (QUIET_LEVEL === 0 && /^0$|no matches/i.test(toolOutput)) {
        message = 'No matches found. Verify pattern syntax or try broader search.'
      }
      break
    
    case 'Glob':
      if (QUIET_LEVEL === 0 && (!toolOutput.trim() || /no files/i.test(toolOutput))) {
        message = 'No files matched pattern. Verify glob syntax and directory.'
      }
      break
  }
  
  return message
}

// ============================================================================
// Smart Prompt Queue — Complements Stall Detection
// ============================================================================
// When the LLM is actively working (tool calls happening, todos advancing),
// user-submitted prompts are queued instead of interrupting. When the current
// task completes (no more tool calls, all todos done, stall detected), the
// next queued prompt is auto-submitted.
//
// This is NOT a "continue" mechanism — it only queues prompts the user
// explicitly typed. It does NOT generate synthetic prompts.

const PROMPT_QUEUE_FILE = 'prompt-queue.json'

function getQueuePath(directory: string, sessionId: string): string {
  return join(directory, '.opencode', 'state', 'sessions', sessionId, PROMPT_QUEUE_FILE)
}

function readQueue(directory: string, sessionId: string): PromptQueue {
  const path = getQueuePath(directory, sessionId)
  return readJsonFile<PromptQueue>(path) || { items: [], paused: false }
}

function writeQueue(directory: string, sessionId: string, queue: PromptQueue): void {
  writeJsonFile(getQueuePath(directory, sessionId), queue)
}

function enqueuePrompt(directory: string, sessionId: string, text: string): QueuedPrompt {
  const queue = readQueue(directory, sessionId)
  const entry: QueuedPrompt = {
    id: `q-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    text,
    timestamp: new Date().toISOString(),
    status: 'queued',
  }
  queue.items.push(entry)
  writeQueue(directory, sessionId, queue)
  return entry
}

function dequeueNext(directory: string, sessionId: string): QueuedPrompt | null {
  const queue = readQueue(directory, sessionId)
  const idx = queue.items.findIndex(i => i.status === 'queued')
  if (idx === -1) return null
  queue.items[idx].status = 'submitted'
  queue.items[idx].timestamp = new Date().toISOString()
  queue.lastSubmittedId = queue.items[idx].id
  queue.lastSubmittedAt = queue.items[idx].timestamp
  writeQueue(directory, sessionId, queue)
  return queue.items[idx]
}

function markQueueItem(directory: string, sessionId: string, id: string, status: QueuedPrompt['status'], error?: string): void {
  const queue = readQueue(directory, sessionId)
  const item = queue.items.find(i => i.id === id)
  if (!item) return
  item.status = status
  if (error) item.error = error
  writeQueue(directory, sessionId, queue)
}

function getQueueStatus(directory: string, sessionId: string): { queued: number; submitted: number; completed: number; failed: number; paused: boolean } {
  const queue = readQueue(directory, sessionId)
  return {
    queued: queue.items.filter(i => i.status === 'queued').length,
    submitted: queue.items.filter(i => i.status === 'submitted').length,
    completed: queue.items.filter(i => i.status === 'completed').length,
    failed: queue.items.filter(i => i.status === 'failed').length,
    paused: queue.paused,
  }
}

function clearCompletedQueueItems(directory: string, sessionId: string): void {
  const queue = readQueue(directory, sessionId)
  queue.items = queue.items.filter(i => i.status === 'queued' || i.status === 'submitted')
  writeQueue(directory, sessionId, queue)
}

/**
 * Determine if the LLM is currently busy processing a task.
 * Uses the same heartbeat data as stall detection.
 */
function isLlmBusy(directory: string, sessionId: string): boolean {
  const stallStatus = classifyStall(directory, sessionId)
  // ACTIVE or SLOW_POSSIBLE means the LLM is working
  return stallStatus === 'ACTIVE' || stallStatus === 'SLOW_POSSIBLE'
}

/**
 * Determine if the current task has completed.
 * A task is complete when:
 * 1. No tool calls in the warn threshold (120s) — STALLED_SOFT or worse
 * 2. All todos are completed (0 remaining)
 * 3. The last tool was not a long-running operation
 */
function isTaskComplete(directory: string, sessionId: string): boolean {
  const stallStatus = classifyStall(directory, sessionId)
  if (stallStatus === 'ACTIVE' || stallStatus === 'SLOW_POSSIBLE') return false

  const hbPath = getHeartbeatPath(directory, sessionId)
  const heartbeat = readJsonFile<HeartbeatEntry>(hbPath)
  if (!heartbeat) return false

  // All todos completed
  if (heartbeat.todoProgress.remaining === 0 && heartbeat.todoProgress.completed > 0) return true

  // Stalled hard — no activity for 5+ minutes
  if (stallStatus === 'STALLED_HARD') return true

  // Stalled soft with no remaining todos
  if (stallStatus === 'STALLED_SOFT' && heartbeat.todoProgress.remaining === 0) return true

  return false
}

/**
 * Try to submit the next queued prompt.
 * Returns the prompt text if submitted, null if nothing to submit or LLM is busy.
 */
function trySubmitNextQueued(directory: string, sessionId: string): string | null {
  const queue = readQueue(directory, sessionId)
  if (queue.paused) return null
  if (queue.items.filter(i => i.status === 'queued').length === 0) return null

  // Don't submit if LLM is still busy
  if (isLlmBusy(directory, sessionId)) return null

  // Don't submit if there's already a submitted item waiting
  if (queue.items.some(i => i.status === 'submitted')) return null

  const next = dequeueNext(directory, sessionId)
  return next?.text || null
}

/**
 * Generate a queue status context message for the LLM.
 * Injected when there are queued prompts waiting.
 */
function generateQueueContext(directory: string, sessionId: string): string | null {
  const status = getQueueStatus(directory, sessionId)
  if (status.queued === 0 && status.submitted === 0) return null

  const queue = readQueue(directory, sessionId)
  const queuedItems = queue.items.filter(i => i.status === 'queued').slice(0, 5)
  const submittedItem = queue.items.find(i => i.status === 'submitted')

  let msg = `<prompt-queue>\n`
  if (submittedItem) {
    msg += `Current: "${submittedItem.text.substring(0, 100)}"\n`
  }
  if (queuedItems.length > 0) {
    msg += `Queued (${status.queued}):\n`
    for (const item of queuedItems) {
      msg += `  - "${item.text.substring(0, 80)}"\n`
    }
  }
  if (status.completed > 0) {
    msg += `Completed: ${status.completed}\n`
  }
  msg += `</prompt-queue>`
  return msg
}
// ============================================================================

export const JocPlugin: Plugin = async ({ project, client, directory, worktree }) => {
  initializeJocState(directory)
  
  const hooks: Hooks = {}

  hooks.event = async ({ event }) => {
    switch (event.type) {
      case 'session.created': {
        const sessionId = event.properties.info.id
        
        // NEW: Detect orphaned mode states (from crashed/disconnected sessions)
        // Inject a single recovery block instead of multiple continuation messages
        const orphaned = detectOrphanedModes(directory, sessionId)
        if (orphaned.length > 0) {
          const recoveryMsg = generateRecoveryContext(orphaned)
          if (recoveryMsg && sessionId) {
            queueContextMessage(sessionId, recoveryMsg)
            await client.app.log({
              body: {
                service: 'hubs-plugin',
                level: 'info',
                message: `Orphaned mode state detected: ${orphaned.map(o => o.name).join(', ')}`,
                extra: { modes: orphaned.map(o => ({ name: o.name, prompt: o.state.prompt })) }
              }
            })
          }
        }

        // Inject hub state summary into session context on creation
        // avoids redundant hubMenu("status") calls for each hub
        try {
          const stateDir = join(directory, '.opencode', 'state')
          const hubDirs = ['init', 'ideation', 'orchestration', 'harvest']
          const stateItems: string[] = []
          for (const dir of hubDirs) {
            const hubStateDir = join(stateDir, dir)
            if (existsSync(hubStateDir)) {
              const entries = readdirSync(hubStateDir, { recursive: true })
                .filter(e => typeof e === 'string' && !(e as string).endsWith('index.json'))
              if (entries.length > 0) {
                stateItems.push(`- /${dir === 'orchestration' ? 'orchestrate' : dir === 'init' ? 'init-project' : dir === 'harvest' ? 'harvest-context' : dir}: ${entries.length} file(s)`)
              }
            }
          }
          if (stateItems.length > 0 && sessionId) {
            queueContextMessage(sessionId, `<hub-state-summary>\nActive hub state files found:\n${stateItems.join('\n')}\n</hub-state-summary>`)
          }
        } catch {}
        break
      }
      
      case 'session.deleted': {
        const sessionId = event.properties.info.id
        
        clearSessionContext(sessionId)
        
        if (sessionId && isValidSessionId(sessionId)) {
          // ... session restoration logic
          const sessionDir = join(directory, '.opencode', 'state', 'sessions', sessionId)
          try {
            if (existsSync(sessionDir)) {
              const files = readdirSync(sessionDir)
              for (const file of files) {
                if (file.endsWith('-state.json')) {
                  unlinkSync(join(sessionDir, file))
                }
              }
            }
          } catch {
            // Best-effort cleanup
          }
        }
        break
      }
      
      case 'tui.prompt.append': {
        const prompt = event.properties.text || ''
        
        if (!prompt.trim()) return
        
        // ── Smart Prompt Queue ──────────────────────────────────────────
        // If the LLM is actively working (tool calls happening, todos advancing),
        // queue the user's prompt instead of submitting it. When the current
        // task completes, the next queued prompt is auto-submitted.
        //
        // This only applies to substantive user prompts — NOT to "continue" or
        // "..." prompts which are handled by stall detection.
        const isContinuePrompt = /^(\.\.\.|continue|go on|proceed)$/i.test(prompt.trim())
        const sessionIdForQueue = event.properties.info?.id || ''
        
        if (!isContinuePrompt && sessionIdForQueue && isLlmBusy(directory, sessionIdForQueue)) {
          enqueuePrompt(directory, sessionIdForQueue, prompt)
          return  // Don't process further — prompt is queued
        }
        
        // ── Normal keyword detection (only for non-queued prompts) ──────
        const matches = detectKeywords(prompt)
        
        if (matches.length === 0) return
        
        const seen = new Set<string>()
        const uniqueMatches = matches.filter(m => {
          if (seen.has(m.name)) return false
          seen.add(m.name)
          return true
        })
        
        const resolved = resolveConflicts(uniqueMatches)
        
        if (resolved.length > 0 && resolved[0].name === 'cancel') {
          clearModeStates(directory, ['ralph', 'autopilot', 'ultrawork', 'ralplan'])
          await client.app.log({
            body: {
              service: 'hubs-plugin',
              level: 'info',
              message: '[CANCEL] Active modes have been cleared.'
            }
          })
          return
        }
        
        for (const mode of resolved.filter(m => 
          ['ralph', 'autopilot', 'ultrawork', 'ralplan'].includes(m.name)
        )) {
          activateModeState(directory, prompt, mode.name)
        }
        
        if (resolved.some(m => m.name === 'ralph')) {
          activateModeState(directory, prompt, 'ultrawork')
        }
        
        const additionalContext: string[] = []
        
        for (const [keywordName, message] of Object.entries(MODE_MESSAGES)) {
          const index = resolved.findIndex(m => m.name === keywordName)
          if (index !== -1) {
            resolved.splice(index, 1)
            additionalContext.push(message)
          }
        }
        
        if (resolved.length > 0) {
          const skillNames = resolved.map(m => m.name.toUpperCase()).join(', ')
          additionalContext.push(`[MAGIC KEYWORDS DETECTED: ${skillNames}]
Invoke the corresponding skill/command to activate the mode:
${resolved.map(m => `- ${m.name}: Use /${m.name === 'ralph' ? 'ralph-loop' : m.name}`).join('\n')}`)
        }
        
        if (additionalContext.length > 0) {
          await client.app.log({
            body: {
              service: 'hubs-plugin',
              level: 'info',
              message: 'Keywords detected',
              extra: { context: additionalContext.join('\n') }
            }
          })
        }

        // Hub command pre-resolution — detect /hub subcommand patterns
        // and log the detection so the next LLM turn has routing context
        const hubPattern = /^\/(init-project|ideation|orchestrate|harvest-context|project)\s+(\S+)/
        const hubMatch = prompt.match(hubPattern)
        if (hubMatch) {
          const [, hubName, subName] = hubMatch
          await client.app.log({
            body: {
              service: 'hubs-plugin',
              level: 'info',
              message: `hub-route-detected: /${hubName} ${subName}`
            }
          })
        }
        break
      }
    }
  }
  
  hooks["tool.execute.before"] = async (input, output) => {
    const toolName = input.tool || 'unknown'
    const sessionId = input.sessionID
    
    if (sessionId) {
      updateToolStats(toolName, sessionId)
    }
    
    const modeActive = hasActiveMode(directory, sessionId)
    const todoStatus = getTodoStatus(directory)
    const message = generatePreToolMessage(toolName, todoStatus, modeActive)
    
    if (message && sessionId) {
      queueContextMessage(sessionId, `<pre-tool-reminder tool="${toolName}">\n${message}\n</pre-tool-reminder>`)
    }
    
    if (toolName === 'Skill' || toolName === 'skill') {
      const skillName = (output.args as Record<string, unknown>)?.skill as string || ''
      if (skillName) {
        const state: ModeState = {
          active: true,
          started_at: new Date().toISOString(),
          last_checked_at: new Date().toISOString(),
          session_id: sessionId,
        }
        writeState(directory, 'skill-active', state, sessionId)
        
        if (sessionId) {
          queueContextMessage(sessionId, `<skill-activated name="${skillName}">\nSkill ${skillName} is now active. Follow its instructions.\n</skill-activated>`)
        }
      }
    }
  }
  
  hooks["tool.execute.after"] = async (input, output) => {
    const toolName = input.tool || 'unknown'
    const sessionId = input.sessionID
    const toolOutput = output.output || ''
    
    const toolCount = sessionId ? updateToolStats(toolName, sessionId) : 1
    
    // NEW: Record heartbeat for stall detection (silent, no context message)
    if (sessionId) {
      const todoStatus = getTodoStatus(directory)
      recordHeartbeat(directory, sessionId, toolName, toolOutput, todoStatus)
    }
    
    // NEW: Check for stalled agent (only periodically, not every call)
    if (sessionId && shouldCheckStall(sessionId, directory)) {
      const stallStatus = classifyStall(directory, sessionId)
      if (stallStatus !== 'ACTIVE' && stallStatus !== 'SLOW_POSSIBLE') {
        const nudge = generateStallNudge(stallStatus, sessionId, directory)
        if (nudge) {
          queueContextMessage(sessionId, nudge)
        }
      }
    }
    
    // NEW: Prompt queue — when task completes, submit next queued prompt
    if (sessionId && isTaskComplete(directory, sessionId)) {
      const nextPrompt = trySubmitNextQueued(directory, sessionId)
      if (nextPrompt) {
        // Mark the current submitted item as completed
        const queue = readQueue(directory, sessionId)
        const submitted = queue.items.find(i => i.status === 'submitted')
        if (submitted) {
          markQueueItem(directory, sessionId, submitted.id, 'completed')
        }
        // Inject queue context so the LLM knows what's next
        const queueCtx = generateQueueContext(directory, sessionId)
        if (queueCtx) {
          queueContextMessage(sessionId, queueCtx)
        }
        await client.app.log({
          body: {
            service: 'hubs-plugin',
            level: 'info',
            message: `[QUEUE] Auto-submitting next queued prompt: "${nextPrompt.substring(0, 80)}"`,
            extra: { queueStatus: getQueueStatus(directory, sessionId) }
          }
        })
      }
    }
    
    // Only remind on actual failures (not on routine operations)
    const message = generatePostToolMessage(toolName, toolOutput, toolCount)
    if (message && sessionId && toolName !== 'TodoWrite' && !toolName.startsWith('Read')) {
      queueContextMessage(sessionId, `<post-tool-reminder tool="${toolName}">\n${message}\n</post-tool-reminder>`)
    }
    
    if (toolName === 'Skill' || toolName === 'skill') {
      clearState(directory, 'skill-active', sessionId)
    }
    
    // Periodic flush of cached stats to disk
    flushSessionStats()
  }
  
  hooks["experimental.chat.system.transform"] = async (input, output) => {
    const sessionId = input.sessionID
    if (!sessionId) return
    
    const messages = consumeContextMessages(sessionId)
    
    // NEW: Inject prompt queue status so the LLM knows about queued prompts
    const queueCtx = generateQueueContext(directory, sessionId)
    if (queueCtx) {
      messages.push(queueCtx)
    }
    
    if (messages.length === 0) return
    
    const contextBlock = `<hubs-plugin-context>\n${messages.join('\n\n')}\n</hubs-plugin-context>`
    output.system.push(contextBlock)
  }
  
  hooks["experimental.session.compacting"] = async (input, output) => {
    const sessionId = input.sessionID
    
    const ralphState = readState(directory, 'ralph', sessionId)
    if (ralphState?.active) {
      output.context.push(`## Ralph Loop State
- Iteration: ${ralphState.iteration || 1}/${ralphState.max_iterations || 10}
- Original Task: ${ralphState.prompt || 'Unknown'}
- Started: ${ralphState.started_at || 'Unknown'}
`)
    }
    
    const ultraworkState = readState(directory, 'ultrawork', sessionId)
    if (ultraworkState?.active) {
      output.context.push(`## Ultrawork State
- Original Task: ${ultraworkState.original_prompt || 'Unknown'}
- Reinforcement Count: ${ultraworkState.reinforcement_count || 0}
- Started: ${ultraworkState.started_at || 'Unknown'}
`)
    }
    
    const todoStatus = getTodoStatus(directory)
    if (todoStatus) {
      output.context.push(`## Pending Tasks\n${todoStatus}\n`)
    }
    
    // NEW: Preserve prompt queue state across context compression
    if (sessionId) {
      const queueStatus = getQueueStatus(directory, sessionId)
      if (queueStatus.queued > 0 || queueStatus.submitted > 0) {
        const queueCtx = generateQueueContext(directory, sessionId)
        if (queueCtx) {
          output.context.push(`## Prompt Queue\n${queueCtx}\n`)
        }
      }
    }
    
    const projectMemoryPath = join(directory, '.opencode', 'state', 'project-memory.json')
    if (existsSync(projectMemoryPath)) {
      try {
        const memory = readJsonFile<{ techStack?: { languages?: { name: string }[] }; customNotes?: { note: string }[] }>(projectMemoryPath)
        if (memory) {
          const langs = memory.techStack?.languages?.map(l => l.name).join(', ') || 'Unknown'
          const notes = memory.customNotes?.map(n => `- ${n.note}`).join('\n') || ''
          output.context.push(`## Project Memory
- Languages: ${langs}
${notes ? `### Custom Notes:\n${notes}` : ''}
`)
        }
      } catch {}
    }
  }
  
  hooks["permission.ask"] = async (input, output) => {
    const permissionType = input.type
    const sessionId = input.sessionID
    const pattern = input.pattern
    
    if (permissionType === 'bash' && pattern) {
      const command = typeof pattern === 'string' ? pattern : Array.isArray(pattern) ? pattern.join(' ') : ''
      const safePatterns = [
        /^git (status|diff|log|branch|show|fetch)/,
        /^npm (test|run (test|lint|build|check|typecheck))/,
        /^pnpm (test|run (test|lint|build|check|typecheck))/,
        /^yarn (test|run (test|lint|build|check|typecheck))/,
        /^tsc( |$)/,
        /^eslint /,
        /^prettier /,
        /^cargo (test|check|clippy|build)/,
        /^pytest/,
        /^python -m pytest/,
        /^ls( |$)/,
      ]
      
      const isSafe = safePatterns.some(p => p.test(command.trim()))
      const hasDangerousChars = /[;&|`$()<>\n\r\t\0\\{}[\]*?~!#]/.test(command)
      
      if (isSafe && !hasDangerousChars) {
        output.status = 'allow'
        if (sessionId) {
          queueContextMessage(sessionId, `<permission-auto-approved type="bash">\nSafe command auto-approved: ${command.substring(0, 100)}\n</permission-auto-approved>`)
        }
      }
    }
  }
  
  hooks["chat.message"] = async (input, output) => {
    const sessionId = input.sessionID
    
    // Only inject mode context if we detect a stall — not on every chat message
    // This prevents the "dumb continue" spam that consumed subagent context
    if (sessionId) {
      const stallStatus = classifyStall(directory, sessionId)
      if (stallStatus === 'STALLED_SOFT' || stallStatus === 'STALLED_HARD') {
        // Only inject mode context when actually stalled
        const ralphState = readState(directory, 'ralph', sessionId)
        if (ralphState?.active && ralphState.prompt) {
          queueContextMessage(sessionId, `<stall-info mode="ralph">
Iteration ${ralphState.iteration || 1}/${ralphState.max_iterations || 10}
Original task: ${ralphState.prompt}
</stall-info>`)
        }
        
        const ultraworkState = readState(directory, 'ultrawork', sessionId)
        if (ultraworkState?.active && ultraworkState.original_prompt) {
          queueContextMessage(sessionId, `<stall-info mode="ultrawork">
Original task: ${ultraworkState.original_prompt}
</stall-info>`)
        }
      }
    }
  }
  
  hooks["command.execute.before"] = async (input, output) => {
    const command = input.command
    const sessionId = input.sessionID
    
    if (command === 'ralph-loop' || command === 'ulw-loop' || command === 'ultrawork') {
      const state: ModeState = {
        active: true,
        started_at: new Date().toISOString(),
        last_checked_at: new Date().toISOString(),
        session_id: sessionId,
        project_path: directory,
      }
      writeState(directory, command === 'ralph-loop' ? 'ralph' : 'ultrawork', state, sessionId)
      
      if (sessionId) {
        queueContextMessage(sessionId, `<mode-activated mode="${command}">
${command} mode is now active. Follow the mode's workflow instructions.
</mode-activated>`)
      }
    }
    
    if (command === 'cancel-ralph' || command === 'stop-continuation') {
      clearModeStates(directory, ['ralph', 'autopilot', 'ultrawork', 'ralplan'], sessionId)
      
      if (sessionId) {
        queueContextMessage(sessionId, `<mode-cancelled>
All active modes have been cancelled. You may proceed normally.
</mode-cancelled>`)
      }
    }
  }
  
  return hooks
}

export default JocPlugin
