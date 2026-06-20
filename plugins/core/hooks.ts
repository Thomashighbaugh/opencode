/**
 * Hooks entry point for the Hubs plugin.
 *
 * Registers all hook handlers: session lifecycle, tool lifecycle,
 * chat messages, permission auto-approval, context preservation,
 * and context injection. Imports supporting functions from the
 * session, modes, and keywords modules.
 *
 * This is the plugin entry point (exported as default).
 */
import type { Plugin, Hooks } from "@opencode-ai/plugin"
import type { Event } from "@opencode-ai/sdk"
import { join } from "path"
import { existsSync, readdirSync, unlinkSync } from "fs"
import { getCache, CacheManager, withToolCache, invalidateToolCache, invalidateAllToolCaches } from "../../tools/cache-utils"

import {
  isValidSessionId,
  readJsonFile,
  writeJsonFile,
  QUIET_LEVEL,
  queueContextMessage,
  consumeContextMessages,
  clearSessionContext,
  initializeJocState,
  getTodoStatus,
  updateToolStats,
  flushSessionStats,
  generatePreToolMessage,
  generatePostToolMessage,
  recordHeartbeat,
  classifyStall,
  shouldCheckStall,
  generateStallNudge,
  getHeartbeatPath,
  loadSessionStatsPruned,
  type StallStatus,
  type HeartbeatEntry,
} from "./session"

import {
  readState,
  writeState,
  clearState,
  hasActiveMode,
  invalidateModeCache,
  detectOrphanedModes,
  generateRecoveryContext,
  activateModeState,
  clearModeStates,
  type ModeState,
} from "./modes"

import {
  detectKeywords,
  resolveConflicts,
  MODE_MESSAGES,
} from "./keywords"

// ============================================================================
// Prompt Queue — Only used in hooks (keep local)
// ============================================================================

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
// Plugin Entry Point
// ============================================================================

export const JocPlugin: Plugin = async ({ project, client, directory, worktree }) => {
  initializeJocState(directory)

  const hooks: Hooks = {}

  hooks.event = async ({ event }) => {
    switch (event.type) {
      case 'session.created': {
        const sessionId = event.properties.info.id

        // Orphaned mode detection — file I/O only, no API calls
        const orphaned = detectOrphanedModes(directory, sessionId)
        if (orphaned.length > 0) {
          const recoveryMsg = generateRecoveryContext(orphaned)
          if (recoveryMsg && sessionId) {
            queueContextMessage(sessionId, recoveryMsg)
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
        const sessionIdForQueue = (event.properties as any).info?.id || ''

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

        // Hub command pre-resolution — detect /hub subcommand patterns
        // (regex only, no API calls)
        const hubPattern = /^\/(init-project|ideation|orchestrate|harvest-context|project)\s+(\S+)/
        const hubMatch = prompt.match(hubPattern)
        if (hubMatch) {
          // Pattern detected — routing handled by agent instructions
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

    // ── Tier 2: MCP cache hit injection ──────────────────────────────
    // Before an MCP call goes out, check if we have a cached response.
    // If so, inject it as context and skip the actual API call.
    if (toolName === 'context7_query-docs' || toolName === 'context7_resolve-library-id') {
      try {
        const mcpCache = getCache('mcp')
        const args = (input as any).args || {}
        const key = CacheManager.key(toolName, JSON.stringify(args))
        const cached = mcpCache.get<string>(key)
        if (cached && sessionId) {
          queueContextMessage(sessionId, `<mcp-cache-hit tool="${toolName}">\nUsing cached MCP response (7-day TTL).\n${cached.substring(0, 2000)}\n</mcp-cache-hit>`)
        }
      } catch {}
    }

    // ── Tier 1: Tool cache hit injection ──────────────────────────────
    // For deterministic tools, check cache and inject cached result as context.
    const CACHEABLE_TOOLS = new Set([
      'Glob', 'Grep', 'listAgents', 'getSessionID', 'hubMenu',
      'loadSkill', 'runSkillScript',
    ])
    if (CACHEABLE_TOOLS.has(toolName)) {
      try {
        const toolCache = getCache('tool')
        const args = (input as any).args || {}
        const key = CacheManager.key(toolName, JSON.stringify(args))
        const cached = toolCache.get<string>(key)
        if (cached && sessionId) {
          queueContextMessage(sessionId, `<tool-cache-hit tool="${toolName}">\nUsing cached result (30s TTL).\n${cached.substring(0, 1000)}\n</tool-cache-hit>`)
        }
      } catch {}
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

    // ── Tier 1: Cache deterministic tool outputs ──────────────────────
    // These tools produce stable results for the same inputs within a short window.
    const CACHEABLE_TOOLS = new Set([
      'Glob', 'Grep', 'listAgents', 'getSessionID', 'hubMenu',
      'Read', 'loadSkill', 'runSkillScript',
    ])
    if (CACHEABLE_TOOLS.has(toolName) && toolOutput && !toolOutput.startsWith('{') && !toolOutput.startsWith('[')) {
      try {
        const args = (input as any).args || {}
        withToolCache(toolName, args, () => toolOutput, 30_000) // 30s TTL
      } catch {}
    }
    // Invalidate tool cache on write operations
    const WRITE_TOOLS = new Set(['Write', 'Edit', 'bash'])
    if (WRITE_TOOLS.has(toolName)) {
      invalidateToolCache('Glob')
      invalidateToolCache('Grep')
      invalidateToolCache('Read')
    }

    // ── Tier 2: Cache MCP responses ───────────────────────────────────
    if (toolName === 'context7_query-docs' || toolName === 'context7_resolve-library-id') {
      try {
        const mcpCache = getCache('mcp')
        const args = (input as any).args || {}
        const key = CacheManager.key(toolName, JSON.stringify(args))
        mcpCache.set(key, toolOutput, 604_800_000) // 7 days
      } catch {}
    }

    // ── End caching ───────────────────────────────────────────────────

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

    // Prompt queue auto-submit REMOVED — manual-only per API call reduction directive.
    // Queue state is still maintained for manual /orchestrate resume operations.

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

    // ── Compaction Artifact Saving ──────────────────────────────────────
    // For long sessions (>100 tool calls, >20 min, or >6 subagent invocations),
    // save a structured artifact to disk so work products survive compaction.
    // Thresholds are doubled from the original design because modern models
    // have huge context windows and the compaction hook already fires at ~70%
    // capacity — we only want artifacts for sessions that did substantial work.
    // Zero API calls — pure file I/O on an already-triggered hook.
    if (sessionId) {
      try {
        const hbPath = getHeartbeatPath(directory, sessionId)
        const hb = readJsonFile<HeartbeatEntry>(hbPath)
        const stats = loadSessionStatsPruned()
        const sessionStats = stats.sessions[sessionId]

        const toolCalls = hb?.toolCount || 0
        const durationSec = sessionStats
          ? ((sessionStats.updated_at || sessionStats.started_at) - sessionStats.started_at)
          : 0
        const subagentCalls = sessionStats?.tool_counts?.Task || 0

        const isLongSession = toolCalls > 100 || durationSec > 1200 || subagentCalls > 6

        if (isLongSession) {
          const artifact = {
            sessionId,
            compactedAt: new Date().toISOString(),
            toolCalls,
            durationSeconds: durationSec,
            subagentInvocations: subagentCalls,
            modeState: {
              ralph: ralphState?.active ? {
                active: true,
                iteration: ralphState.iteration,
                prompt: ralphState.prompt,
              } : null,
              ultrawork: ultraworkState?.active ? {
                active: true,
                originalPrompt: ultraworkState.original_prompt,
                reinforcementCount: ultraworkState.reinforcement_count,
              } : null,
            },
            todoProgress: hb?.todoProgress || null,
            recentTools: hb?.recentTools?.slice(0, 10) || [],
            preservedContext: output.context,
          }
          const artifactPath = join(
            directory, '.opencode', 'state', 'sessions', sessionId,
            `compaction-${new Date().toISOString().replace(/[:.]/g, '-')}.json`
          )
          writeJsonFile(artifactPath, artifact)
        }
      } catch {
        // Best-effort artifact saving — never block compaction
      }
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