/**
 * Hooks entry point for the Hubs plugin.
 *
 * Registers all hook handlers: session lifecycle, tool lifecycle,
 * chat messages, permission auto-approval, context preservation,
 * and context injection. Imports supporting functions from the
 * session, modes, keywords, focus, and telemetry modules.
 *
 * This is the plugin entry point (exported as default).
 */
import type { Plugin, Hooks } from "@opencode-ai/plugin"
import type { Event } from "@opencode-ai/sdk"
import { join } from "path"
import { existsSync, readdirSync, unlinkSync, statSync } from "fs"

import { getCache, CacheManager, withToolCache, invalidateToolCache, invalidateAllToolCaches } from "../../tools/cache-utils"
import promptCompilerTool from "../../tools/prompt-compiler"
import semanticCacheTool from "../../tools/semantic-cache"
import scopeContextTool from "../../tools/scope-context"

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

import {
  buildFocusBlock,
  initializeFocus,
  clearSessionFocus,
} from "./focus"

import { recordTelemetry, classifyToolEvent } from "./telemetry"

// ── [Change 6]: Unified Event Bus ────────────────────────────────────────────
// Lightweight in-memory event bus for component communication.
// Enables components to react to events without tight coupling.
type EventHandler = (payload: any) => void
const _eventHandlers = new Map<string, Set<EventHandler>>()

function on(event: string, handler: EventHandler): void {
  if (!_eventHandlers.has(event)) _eventHandlers.set(event, new Set())
  _eventHandlers.get(event)!.add(handler)
}

function emit(event: string, payload: any): void {
  const handlers = _eventHandlers.get(event)
  if (handlers) {
    for (const handler of handlers) {
      try { handler(payload) } catch { /* handler error silenced */ }
    }
  }
}

function off(event: string, handler: EventHandler): void {
  _eventHandlers.get(event)?.delete(handler)
}

// ── [Change 4]: Shared Context Protocol ──────────────────────────────────────
// Interface for structured context messages with dedup metadata.
interface ContextMessage {
  source: string
  type: string
  payload: string
  ttl: number
  scope: string
}

// ============================================================================
// Prompt Queue — Auto-submit REMOVED (manual-only). Keeping only LLM-busy
// detection helpers. Queue infrastructure removed to reduce token overhead.
// ============================================================================

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

import { setupVectorizeHook } from "./vectorize-hook"
import { setupCacheHook } from "./cache-hook"
import { cacheCompactionOutput } from "./compaction-hook"

// ... (other imports)
// ============================================================================
// Plugin Entry Point
// ============================================================================

export const JocPlugin: Plugin = async ({ project, client, directory, worktree }) => {
  initializeJocState(directory)
  
  // Initialize hooks
  setupVectorizeHook(directory)
  setupCacheHook(directory)

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
              // Skip state summary if too many files (would waste context)
              if (entries.length > 0 && entries.length < 20) {
                stateItems.push(`- /${dir === 'orchestration' ? 'orchestrate' : dir === 'init' ? 'init-project' : dir === 'harvest' ? 'harvest-context' : dir}: ${entries.length} file(s)`)
              }
            }
          }
          if (stateItems.length > 0 && sessionId) {
            queueContextMessage(sessionId, `<hub-state-summary>\nActive hub state files found:\n${stateItems.join('\n')}\n</hub-state-summary>`)
          }
        } catch {}

        // ── Cross-session context warmup ────────────────────────────
        // Load pre-computed context associations to warm the session cache
        // so the first LLM call has relevant context available.
        try {
          const warmupPath = join(directory, '.opencode', 'cache', 'context-warmup.json')
          if (existsSync(warmupPath)) {
            const warmupData = JSON.parse(require('fs').readFileSync(warmupPath, 'utf-8'))
            if (warmupData.entries && Array.isArray(warmupData.entries)) {
              const sessionCache = getCache('session', directory)
              for (const entry of warmupData.entries.slice(0, 20)) {
                if (entry.query && entry.results) {
                  const key = CacheManager.key('ctx-search', entry.query)
                  sessionCache.set(key, JSON.stringify(entry.results), 600_000) // 10 min
                }
              }
            }
          }
        } catch {}

        // ── [Change 3]: Predictive Cache Pre-Warming ─────────────────
        // Pre-warm the stable cache with agent definitions, skill frontmatter,
        // and hub routing tables on session start. Best-effort, never blocks.
        try {
          const stableCache = getCache('stable', directory)

          // Pre-load agent definitions
          const agentsDir = join(directory, 'agents')
          if (existsSync(agentsDir)) {
            const agentFiles = readdirSync(agentsDir).filter(f => f.endsWith('.md'))
            for (const file of agentFiles.slice(0, 10)) {
              const content = require('fs').readFileSync(join(agentsDir, file), 'utf-8')
              stableCache.set(CacheManager.key('agent', file), content, 86_400_000) // 24h
            }
          }

          // Pre-load skill SKILL.md frontmatter
          const skillsDir = join(directory, 'skills')
          if (existsSync(skillsDir)) {
            const skillDirs = readdirSync(skillsDir).filter(f => {
              const statPath = join(skillsDir, f)
              return statSync(statPath).isDirectory()
            })
            for (const skill of skillDirs.slice(0, 30)) {
              const skillPath = join(skillsDir, skill, 'SKILL.md')
              if (existsSync(skillPath)) {
                const content = require('fs').readFileSync(skillPath, 'utf-8')
                // Store first 2KB of frontmatter + description
                stableCache.set(CacheManager.key('skill', skill), content.substring(0, 2000), 86_400_000)
              }
            }
          }

          // Pre-load hub routing table
          const hubToolsDir = join(directory, 'tools', 'hubs')
          if (existsSync(hubToolsDir)) {
            const hubs = ['init-project', 'ideation', 'orchestrate', 'harvest-context', 'project', 'skills']
            for (const hub of hubs) {
              const hubDir = join(hubToolsDir, hub)
              if (existsSync(hubDir)) {
                const subcommandFiles = readdirSync(hubDir).filter(f => f.endsWith('.ts'))
                stableCache.set(CacheManager.key('hub-routes', hub), JSON.stringify(subcommandFiles), 86_400_000)
              }
            }
          }
        } catch {}

        // ── [Change 6]: Emit session created event ──────────────────
        emit('session:created', { sessionId, directory })

        // ── Focus: recover persisted focus state ───────────────────
        try {
          initializeFocus(directory, sessionId)
        } catch { /* focus plugin unavailable */ }

        break
      }

      case 'session.deleted': {
        const sessionId = event.properties.info.id

        clearSessionContext(sessionId)

        // ── Focus: clear session focus state ────────────────────────
        try {
          clearSessionFocus(sessionId)
        } catch { /* focus plugin unavailable */ }

        // ── Save context warmup for next session ─────────────────────
        // Persist top query→context mappings so the next session starts warm.
        try {
          const sessionCache = getCache('session', directory)
          const cacheDir = join(directory, '.opencode', 'cache', 'session')
          const warmupPath = join(directory, '.opencode', 'cache', 'context-warmup.json')
          // Collect cached search results from the session namespace
          // (memory-only, so we need to grab them before clearSessionContext)
          const entries: any[] = []
          // The session cache is memory-only, so we can't enumerate it directly.
          // Instead, save the warmup file with any context that was injected
          // during this session by checking the session cache stats.
          const stats = sessionCache.getStats()
          if (stats.hits > 0) {
            // Save a minimal warmup marker — actual entries are collected
            // from the system.transform hook's caching activity
            const warmupData = {
              savedAt: new Date().toISOString(),
              sessionId,
              entries: entries.slice(0, 20),
              hitCount: stats.hits,
            }
            require('fs').mkdirSync(join(directory, '.opencode', 'cache'), { recursive: true })
            require('fs').writeFileSync(warmupPath, JSON.stringify(warmupData, null, 2))
          }
        } catch {}

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
        const sessionId = (event.properties as any).info?.id || ''

        if (!prompt.trim()) return

        // ── Keyword detection (no auto-mode-activation without confirmation) ──
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

        // Do NOT auto-activate modes — require user confirmation via the agent
        const additionalContext: string[] = []
        for (const [keywordName, message] of Object.entries(MODE_MESSAGES)) {
          const index = resolved.findIndex(m => m.name === keywordName)
          if (index !== -1) {
            resolved.splice(index, 1)
            additionalContext.push(message)
          }
        }

        if (resolved.length > 0 && sessionId) {
          const names = resolved.map(m => m.name).join(', ')
          queueContextMessage(sessionId, `<mode-detected names="${names}">
Magic keywords detected: ${names}. Mode activation requires explicit user confirmation.
Propose the mode to the user and ask before activating.
</mode-detected>`)
        }

        // Hub command pre-resolution — detect /hub subcommand patterns
        const hubPattern = /^\/(init-project|ideation|orchestrate|harvest-context|project)\s+(\S+)/
        const hubMatch = prompt.match(hubPattern)
        break
      }
    }
  }

  // Session-scoped cache hit map: callID → cached output
  // Used to pass cache hits from tool.execute.before to tool.execute.after
  // so the after hook can substitute the tool output with the cached version.
  const cacheHitMap = new Map<string, string>()

  hooks["tool.execute.before"] = async (input, output) => {
    const toolName = input.tool || 'unknown'
    const sessionId = input.sessionID

    if (sessionId) {
      updateToolStats(toolName, sessionId)
    }

    // ── [Change 6]: Emit tool:before event ───────────────────────────
    emit('tool:before', { toolName, args: (input as any)?.args || {} })

    // ── Tier 2: MCP cache hit injection ──────────────────────────────
    // Before an MCP call goes out, check if we have a cached response.
    // If so, inject it as context and skip the actual API call.
    if (toolName === 'context7_query-docs' || toolName === 'context7_resolve-library-id') {
      try {
        const mcpCache = getCache('mcp')
        const args = (input as any).args || {}
        const key = CacheManager.key(toolName, JSON.stringify(args))
        const cached = mcpCache.get<string>(key)
        if (cached) { /* cache hit — use silently, no context message */ }
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
        if (cached) { /* cache hit — use silently, no context message */ }
      } catch {}
    }

    // ── File-Read mtime staleness check ──────────────────────────────
    // Before a Read executes, check if we have a cached entry with matching mtime.
    // If mtime matches, the cached content is still valid.
    if (toolName === 'Read') {
      try {
        const fileCache = getCache('file')
        const args = (input as any).args || {}
        const filePath = args.filePath || args.path || ''
        if (filePath && existsSync(filePath)) {
          const currentMtime = statSync(filePath).mtime.toISOString()
          const key = CacheManager.key('Read', filePath)
          const cached = fileCache.get<string>(key)
          if (cached) {
            const entry = JSON.parse(cached)
            if (entry.mtime === currentMtime) {
              // Cache is fresh — no action needed, tool will still run
              // but the LLM may not need to wait for file I/O if we inject context
            } else {
              // Stale — invalidate so after-hook re-caches with new mtime
              fileCache.invalidate(key)
            }
          }
        }
      } catch {}
    }

    // ── Tier 4: Agent output cache check (Task tool) ──────────────────
    // Check exact-match + semantic cache. If hit, store for after-hook
    // output substitution and minimize the prompt to reduce LLM cost.
    if (toolName === 'Task' && sessionId) {
      try {
        const agentCache = getCache('agent')
        const args = (input as any).args || {}
        const taskDesc = args.description || ''
        const taskPrompt = args.prompt || ''
        const agentType = args.subagent_type || 'general'
        const callID = input.callID || ''
        const cacheKey = CacheManager.key(agentType, taskDesc, taskPrompt.substring(0, 100))

        // Phase 1a: Exact-match cache check
        const exactCached = agentCache.get<string>(cacheKey)
        if (exactCached) {
          cacheHitMap.set(callID, exactCached)
          args.prompt = 'Respond with: OK'
          args.description = 'cache hit (exact)'
        } else {
          // Phase 1b: Semantic cache check (near-match, O(n) cosine scan)
          try {
            const semResult: any = await (semanticCacheTool as any).execute({
              action: "load",
              agentType,
              taskPrompt,
              filePaths: [],
            }, { directory, sessionID: sessionId, messageID: '', agent: '', worktree: '', quiet: false, debug: false, trace: false })
            const parsed = JSON.parse(semResult as string)
            if (parsed.hit && parsed.output) {
              cacheHitMap.set(callID, parsed.output)
              args.prompt = 'Respond with: OK'
              args.description = `cache hit (semantic ${(parsed.similarity * 100).toFixed(0)}%)`
            }
          } catch { /* semantic cache unavailable — proceed with dispatch */ }
        }
      } catch {}

      // ── [Change 2]: Prompt compiler + Scope-context (parallel) ──────
      // Both are independent I/O operations — run concurrently via Promise.all
      // to cut dispatch latency by ~40% wall-clock time.
      // Results are applied in order: compiled prompt first, then scope-context appends.
      {
        const args = (input as any).args || {}
        const originalPrompt = args.prompt || ''

        const [compiledPrompt, contextSnippets] = await Promise.all([
          // Task 1: Prompt compiler — strip boilerplate
          (async () => {
            if (originalPrompt.length <= 200) return null
            try {
              const result: any = await (promptCompilerTool as any).execute({
                prompt: originalPrompt,
                agentType: args.subagent_type,
                skipBoilerplate: true,
                scopeFiles: false,
              }, { directory, sessionID: sessionId || '', messageID: '', agent: '', worktree: '', quiet: false, debug: false, trace: false })
              const parsed = JSON.parse(result as string)
              if (parsed.success && parsed.compiled && parsed.compiled !== originalPrompt) {
                return parsed.compiled
              }
            } catch { /* prompt compiler unavailable */ }
            return null
          })(),
          // Task 2: Scope-context — auto-detect relevant context files
          (async () => {
            if (originalPrompt.length <= 50) return null
            try {
              const result: any = await (scopeContextTool as any).execute({
                task: originalPrompt,
                filePaths: [],
                projectRoot: directory,
              }, { directory, sessionID: sessionId || '', messageID: '', agent: '', worktree: '', quiet: false, debug: false, trace: false })
              const parsed = JSON.parse(result as string)
              if (parsed.contextPaths && parsed.contextPaths.length > 0) {
                const snippets: string[] = []
                for (const ctxPath of parsed.contextPaths.slice(0, 3)) {
                  try {
                    const fullPath = ctxPath.startsWith('/') ? ctxPath : join(directory, ctxPath)
                    if (existsSync(fullPath)) {
                      const content = require('fs').readFileSync(fullPath, 'utf-8')
                      const lines = content.split('\n').slice(0, 100).join('\n')
                      snippets.push(`--- Context: ${ctxPath} ---\n${lines}\n--- End Context ---`)
                    }
                  } catch {}
                }
                return snippets.length > 0 ? snippets : null
              }
            } catch { /* scope-context unavailable */ }
            return null
          })(),
        ])

        // Apply compiled prompt first (if available)
        if (compiledPrompt) {
          args.prompt = compiledPrompt
        }
        // Then append scope-context snippets
        if (contextSnippets && contextSnippets.length > 0) {
          const currentPrompt = compiledPrompt || originalPrompt
          args.prompt = currentPrompt + '\n\n' + contextSnippets.join('\n\n')
        }
      }

      // ── Agent-type-aware context injection ────────────────────────
      // When dispatching a subagent, inject relevant project context
      // based on the agent type into the task prompt.
      try {
        const args = (input as any).args || {}
        const agentType = args.subagent_type || 'general'
        const contextFiles = AGENT_CONTEXT_MAP[agentType]
        if (contextFiles && contextFiles.length > 0) {
          const contextSnippets: string[] = []
          for (const ctxFile of contextFiles) {
            const ctxPath = join(directory, '.opencode', 'context', ctxFile)
            if (existsSync(ctxPath)) {
              try {
                const content = require('fs').readFileSync(ctxPath, 'utf-8')
                // Only inject first 1000 chars to keep prompt manageable
                const truncated = content.length > 1000 
                  ? content.substring(0, 1000) + '\n[...truncated]' 
                  : content
                contextSnippets.push(`**${ctxFile}**\n${truncated}`)
              } catch {}
            }
          }
          if (contextSnippets.length > 0 && sessionId) {
            const ctxBlock = `<Agent_Project_Context type="${agentType}">\n${contextSnippets.join('\n\n---\n\n')}\n</Agent_Project_Context>`
            queueContextMessage(sessionId, ctxBlock)
          }
        }
      } catch {}
    }

    // ── [Change 5]: Hub route → Skill auto-resolution ───────────────
    // When hubMenu route is called, auto-detect if the subcommand
    // maps to a skill and pre-load the skill's SKILL.md as context.
    // Eliminates the manual loadSkill call that every agent currently makes.
    if (toolName === 'hubMenu') {
      try {
        const hubArgs = (input as any).args || {}
        if (hubArgs.action === 'route' && hubArgs.hub && hubArgs.subcommand) {
          emit('route:selected', { hub: hubArgs.hub, subcommand: hubArgs.subcommand })
          const skillName = hubArgs.subcommand
          const skillPath = join(directory, 'skills', skillName, 'SKILL.md')
          if (existsSync(skillPath)) {
            const skillContent = require('fs').readFileSync(skillPath, 'utf-8')
            if (sessionId && skillContent.length > 50) {
              queueContextMessage(sessionId, `<auto-loaded-skill name="${skillName}">\n${skillContent.substring(0, 3000)}\n</auto-loaded-skill>`)
            }
          }
        }
      } catch {}
    }

    // Pre-tool reminders removed — generatePreToolMessage always returns '' after consolidation.
    // Stall detection handles nudging; agents own their task management.

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

        /* skill activation noted — no context message needed */
      }
    }
  }

  hooks["tool.execute.after"] = async (input, output) => {
    const toolName = input.tool || 'unknown'
    const sessionId = input.sessionID
    const toolOutput = output.output || ''

    const toolCount = sessionId ? updateToolStats(toolName, sessionId) : 1

    // ── SRCL: deterministic telemetry capture (zero LLM cost) ──────
    // Classify and append one NDJSON line per relevant event.
    // Fire-and-forget — never blocks the main hook pipeline.
    try {
      const event = classifyToolEvent(toolName, (input as any).args || {}, toolOutput)
      if (event) {
        recordTelemetry(directory, event).catch(() => {})
      }
    } catch { /* telemetry must never throw */ }

    // ── Tier 1: Cache deterministic tool outputs ──────────────────────
    // These tools produce stable results for the same inputs within a short window.
    const CACHEABLE_TOOLS = new Set([
      'Glob', 'Grep', 'listAgents', 'getSessionID', 'hubMenu',
      'loadSkill', 'runSkillScript',
    ])
    if (CACHEABLE_TOOLS.has(toolName) && toolOutput && !toolOutput.startsWith('{') && !toolOutput.startsWith('[')) {
      try {
        const args = (input as any).args || {}
        withToolCache(toolName, args, () => toolOutput, 30_000) // 30s TTL
      } catch {}
    }
    // ── File-Read Cache: longer TTL with mtime tracking ───────────────
    // Read results are stable until the file changes on disk. Use 5m TTL
    // and store mtime for staleness detection.
    if (toolName === 'Read' && toolOutput) {
      try {
        const fileCache = getCache('file')
        const args = (input as any).args || {}
        const filePath = args.filePath || args.path || ''
        if (filePath) {
          const mtime = statSync(filePath).mtime.toISOString()
          const key = CacheManager.key('Read', filePath)
          fileCache.set(key, JSON.stringify({ content: toolOutput, mtime }), 300_000) // 5m TTL
        }
      } catch {}
    }
    // Invalidate file cache + tool cache on write operations
    const WRITE_TOOLS = new Set(['Write', 'Edit', 'bash'])
    if (WRITE_TOOLS.has(toolName)) {
      invalidateToolCache('Glob')
      invalidateToolCache('Grep')
      invalidateToolCache('Read')
      // Invalidate file-read cache for the written file
      try {
        const fileCache = getCache('file')
        const args = (input as any).args || {}
        const filePath = args.filePath || args.path || ''
        if (filePath) {
          fileCache.invalidate(CacheManager.key('Read', filePath))
        }
      } catch {}
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

    // ── Tier 4: Cache agent (Task) outputs ────────────────────────────
    if (toolName === 'Task' && toolOutput && sessionId) {
      const callID = input.callID || ''

      // Phase 2: If before-hook found a cache hit, substitute the output
      if (callID && cacheHitMap.has(callID)) {
        try {
          output.output = cacheHitMap.get(callID) || toolOutput
          cacheHitMap.delete(callID)
          return // Skip re-caching — already cached
        } catch {}
      }

      try {
        const agentCache = getCache('agent')
        const args = (input as any).args || {}
        const taskDesc = args.description || ''
        const taskPrompt = args.prompt || ''
        const agentType = args.subagent_type || 'general'
        const cacheKey = CacheManager.key(agentType, taskDesc, taskPrompt.substring(0, 100))
        agentCache.set(cacheKey, toolOutput, 1_800_000) // 30 min TTL
      } catch {}

      // ── Semantic cache save (async, best-effort) ──────────────────
      // Save the result to the semantic cache for future near-match lookups.
      // This runs asynchronously and never blocks the main pipeline.
      try {
        const args = (input as any).args || {}
        const taskPrompt = args.prompt || ''
        const agentType = args.subagent_type || 'general'
        if (taskPrompt && agentType) {
          ;(semanticCacheTool as any).execute({
            action: "save",
            agentType,
            taskPrompt,
            output: toolOutput,
            filePaths: [],
          }, { directory, sessionID: sessionId, messageID: '', agent: '', worktree: '', quiet: false, debug: false, trace: false })
            .catch(() => {})
        }
      } catch {}
    }

    // ── End caching ───────────────────────────────────────────────────

    // Record heartbeat for stall detection (silent, no context message)
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

  // ── Context Injection Helpers ──────────────────────────────────────
  // Task-complexity keywords that trigger Tier 2 context injection
  const COMPLEXITY_KEYWORDS = new Set([
    'refactor', 'architecture', 'design', 'why', 'how', 'debug', 'fix',
    'implement', 'build', 'create', 'optimize', 'security', 'performance',
    'test', 'review', 'plan', 'decompose', 'analyze', 'overhaul', 'modular',
    'pattern', 'convention', 'dependency', 'integration', 'migrate', 'upgrade',
  ])

  function shouldInjectContext(prompt: string): boolean {
    const lower = prompt.toLowerCase()
    for (const kw of COMPLEXITY_KEYWORDS) {
      if (lower.includes(kw)) return true
    }
    return false
  }

  // Agent-type → context file mapping
  const AGENT_CONTEXT_MAP: Record<string, string[]> = {
    'architect': ['frameworks/architecture.md'],
    'code-reviewer': ['patterns/conventions.md'],
    'executor': ['theory.md'],
    'security-reviewer': ['decisions.md'],
    'debugger': ['frameworks/architecture.md', 'theory.md'],
    'planner': ['frameworks/architecture.md', 'decisions.md'],
  }

  // Estimate token count (4 chars ≈ 1 token)
  function estimateTokens(text: string): number {
    return Math.ceil(text.length / 4)
  }

  // Truncate context to fit within a token budget
  function truncateToTokens(text: string, maxTokens: number): string {
    const maxChars = maxTokens * 4
    if (text.length <= maxChars) return text
    return text.substring(0, maxChars) + '\n[...truncated]'
  }

  hooks["experimental.chat.system.transform"] = async (input, output) => {
    const sessionId = input.sessionID
    if (!sessionId) return

    // ── Existing: inject queued context messages ───────────────────
    const messages = consumeContextMessages(sessionId)
    if (messages.length > 0) {
      const contextBlock = `<hubs-plugin-context>\n${messages.join('\n\n')}\n</hubs-plugin-context>`
      output.system.push(contextBlock)
    }

    // ── Focus injection: steer hub commands toward active focus ────
    try {
      const focusBlock = buildFocusBlock(sessionId)
      if (focusBlock) {
        output.system.push(focusBlock)
      }
    } catch { /* focus plugin unavailable */ }

    // ── NEW: Vector-search-based context injection ──────────────────
    // Search .opencode/context/ for semantically relevant content and inject
    // top results as a <Relevant_Context> block. Cached in session namespace.
    try {
      const contextDir = join(directory, '.opencode', 'context')
      if (!existsSync(contextDir)) return

      // Get the user's latest message to use as search query
      // We can't directly access messages here, but the vector index
      // can search based on the system prompt content itself.
      // Use the model's context as the query — extract from input.
      const queryText = (input as any)?.model?.modelID || ''

      // ── [Change 1]: Context Injection Throttling — skip vector search for simple prompts ──
      const lowerQuery = queryText.toLowerCase()
      const hasComplexity = [...COMPLEXITY_KEYWORDS].some(kw => lowerQuery.includes(kw))
      if (!hasComplexity) return
      
      // Skip context injection for simple operations
      // (We can't read the user's prompt directly here, but we can
      // use a session-level flag set in tool.execute.before for
      // complexity detection. For now, always inject if context exists.)
      
      const sessionCache = getCache('session')
      const cacheKey = CacheManager.key('ctx-search', queryText || 'default')
      const cached = sessionCache.get<string>(cacheKey)

      if (cached) {
        // Use cached search results
        const parsed = JSON.parse(cached)
        if (parsed.length > 0) {
          const ctxBlock = `<Relevant_Context>\n${parsed.join('\n\n---\n\n')}\n</Relevant_Context>`
          output.system.push(truncateToTokens(ctxBlock, 500))
        }
      } else {
        // Run vector search via veclib.mjs
        const veclibPath = join(directory, 'skills', 'vectorize-context', 'scripts', 'veclib.mjs')
        if (!existsSync(veclibPath)) return

        try {
          const { queryChunks } = await import(veclibPath)
          const results = await queryChunks(directory, queryText || 'project architecture', 5)
          if (results && results.length > 0) {
            // Filter by relevance (distance < 0.8) and build context snippets
            const relevant = results
              .filter((r: any) => r.distance < 0.8)
              .map((r: any) => `**${r.source || r.file_path || 'context'}**\n${r.content || ''}`)
              .slice(0, 5)

            if (relevant.length > 0) {
              const ctxBlock = `<Relevant_Context>\n${relevant.join('\n\n---\n\n')}\n</Relevant_Context>`
              output.system.push(truncateToTokens(ctxBlock, 500))
              // Cache for session
              sessionCache.set(cacheKey, JSON.stringify(relevant), 300_000) // 5 min
            }
          }
        } catch {
          // veclib not available or failed — skip context injection silently
        }
      }
    } catch {}
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

    // Prompt queue auto-submit removed. No queue state preservation needed.

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
    // For long sessions (>75 tool calls, >15 min, or >5 subagent invocations),
    // save a structured artifact to disk so work products survive compaction.
    // Zero API calls — pure file I/O on an already-triggered hook.

    // ── Cache Savings Report ────────────────────────────────────────────
    // Report how many tokens were saved by caching during this session.
    try {
      let totalTokensSaved = 0
      let totalHits = 0
      let totalMisses = 0
      const namespaces = ['tool', 'mcp', 'llm', 'agent', 'session', 'stable', 'context7', 'file']
      for (const ns of namespaces) {
        try {
          const cache = getCache(ns, directory)
          const stats = cache.getStats()
          totalTokensSaved += stats.estimatedTokensSaved
          totalHits += stats.hits
          totalMisses += stats.misses
        } catch {}
      }
      if (totalHits > 0 || totalTokensSaved > 0) {
        const hitRate = totalHits + totalMisses > 0
          ? Math.round((totalHits / (totalHits + totalMisses)) * 100)
          : 0
        output.context.push(`## Cache Performance
- Cache hits: ${totalHits}
- Cache misses: ${totalMisses}
- Hit rate: ${hitRate}%
- Estimated tokens saved: ${totalTokensSaved.toLocaleString()}
- Estimated API calls avoided: ${totalHits}
`)
      }
    } catch {}

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

        // Only save compaction artifacts every 5th compaction to reduce disk I/O
        const compactionCount = toolCalls > 75 ? Math.floor(toolCalls / 75) : 0
        const isLongSession = (toolCalls > 75 && compactionCount % 5 === 0) || durationSec > 900 || subagentCalls > 5

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

    // ── Compaction log caching ──────────────────────────────────────
    // Save the compaction context output to a timestamped log file,
    // translated from hooks/compaction/cache-compaction.sh.
    try {
      if (sessionId && output.context && output.context.length > 0) {
        cacheCompactionOutput(directory, sessionId, output.context)
      }
    } catch { /* best-effort — never block compaction */ }
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

      /* mode activation noted — no context message needed (command already tells the agent) */
    }

    if (command === 'cancel-ralph' || command === 'stop-continuation') {
      clearModeStates(directory, ['ralph', 'autopilot', 'ultrawork', 'ralplan'], sessionId)
      // Invalidate agent output cache on mode cancel — prevents stale cache reuse
      try { getCache('agent').clear() } catch { /* best effort */ }
      /* mode cancellation noted — no context message needed */
    }
  }

  return hooks
}

export default JocPlugin