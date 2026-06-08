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
  
  const messages: Record<string, string> = {
    TodoWrite: `${todoStatus}Mark todos in_progress BEFORE starting, completed IMMEDIATELY after finishing.`,
    Bash: `${todoStatus}Use parallel execution for independent tasks. Use run_in_background for long operations.`,
    Edit: `${todoStatus}Verify changes work after editing. Test functionality before marking complete.`,
    Write: `${todoStatus}Verify changes work after editing. Test functionality before marking complete.`,
    Read: `${todoStatus}Read multiple files in parallel when possible for faster analysis.`,
    Grep: `${todoStatus}Combine searches in parallel when investigating multiple patterns.`,
    Glob: `${todoStatus}Combine searches in parallel when investigating multiple patterns.`,
  }
  
  if (messages[toolName]) return messages[toolName]
  if (modeActive) return `${todoStatus}The boulder never stops. Continue until all tasks complete.`
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
        message = 'Command failed. Please investigate the error and fix before continuing.'
      } else if (QUIET_LEVEL < 2 && detectBackgroundOperation(toolOutput)) {
        message = 'Background operation detected. Remember to verify results before proceeding.'
      }
      break
    
    case 'Edit':
      if (detectWriteFailure(toolOutput)) {
        message = 'Edit operation failed. Verify file exists and content matches exactly.'
      } else if (QUIET_LEVEL === 0) {
        message = 'Code modified. Verify changes work as expected before marking complete.'
      }
      break
    
    case 'Write':
      if (detectWriteFailure(toolOutput)) {
        message = 'Write operation failed. Check file permissions and directory existence.'
      } else if (QUIET_LEVEL === 0) {
        message = 'File written. Test the changes to ensure they work correctly.'
      }
      break
    
    case 'TodoWrite':
      if (QUIET_LEVEL === 0) {
        if (/created|added/i.test(toolOutput)) {
          message = 'Todo list updated. Proceed with next task on the list.'
        } else if (/completed|done/i.test(toolOutput)) {
          message = 'Task marked complete. Continue with remaining todos.'
        } else if (/in_progress/i.test(toolOutput)) {
          message = 'Task marked in progress. Focus on completing this task.'
        }
      }
      break
    
    case 'Read':
      if (QUIET_LEVEL === 0 && toolCount > 10) {
        message = `Extensive reading (${toolCount} files). Consider using Grep for pattern searches.`
      }
      break
    
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
// Main Plugin Export
// ============================================================================

export const JocPlugin: Plugin = async ({ project, client, directory, worktree }) => {
  initializeJocState(directory)
  
  const hooks: Hooks = {}

  hooks.event = async ({ event }) => {
    switch (event.type) {
      case 'session.created': {
        const sessionId = event.properties.info.id
        const messages = getSessionRestoreMessages(directory, sessionId)
        
        if (messages.length > 0) {
          for (const msg of messages) {
            queueContextMessage(sessionId, msg)
          }
          await client.app.log({
            body: {
              service: 'hubs-plugin',
              level: 'info',
              message: 'Session restored with context',
              extra: { messages }
            }
          })
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
    const message = generatePostToolMessage(toolName, toolOutput, toolCount)
    
    if (message && sessionId) {
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
    
    const restoreMessages = getSessionRestoreMessages(directory, sessionId)
    if (restoreMessages.length > 0) {
      for (const msg of restoreMessages) {
        queueContextMessage(sessionId, msg)
      }
    }
    
    const ralphState = readState(directory, 'ralph', sessionId)
    if (ralphState?.active && ralphState.prompt) {
      queueContextMessage(sessionId, `<ralph-continuation>
[RALPH LOOP ACTIVE - Iteration ${ralphState.iteration || 1}/${ralphState.max_iterations || 10}]
Original task: ${ralphState.prompt}
Continue until complete. Run /cancel-ralph when done.
</ralph-continuation>`)
    }
    
    const ultraworkState = readState(directory, 'ultrawork', sessionId)
    if (ultraworkState?.active && ultraworkState.original_prompt) {
      queueContextMessage(sessionId, `<ultrawork-continuation>
[ULTRAWORK MODE ACTIVE]
Original task: ${ultraworkState.original_prompt}
Reinforcement: ${ultraworkState.reinforcement_count || 0}
Continue with maximum parallelism.
</ultrawork-continuation>`)
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
