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
import { spawn } from "child_process"

import { getCache, CacheManager, withToolCache, invalidateToolCache, invalidateAllToolCaches, toolCacheKey, cacheStatsByNamespace } from "../../tools/cache-utils"
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
import { ChildRegistry } from "./child-registry"
import { resolveRuntime } from "./runtime"
import type { VectorizeHandle } from "./vectorize-hook"

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

// ── [Change 8]: Latest User Prompt Store ─────────────────────────────────────
// Captured in chat.message, consumed by experimental.chat.system.transform for
// vector-search injection. The transform hook cannot read the user's message
// directly (it only sees sessionID + model), so we bridge via this map.
// Cleared after each transform use to avoid stale-query injection.
const latestUserPromptBySession = new Map<string, string>()

function extractUserText(msg: any): string {
  if (!msg) return ''
  const content = msg.content
  if (typeof content === 'string') return content
  if (Array.isArray(content)) {
    return content
      .map((p: any) => {
        if (!p) return ''
        if (p.type === 'text') return p.text || ''
        return p.text || ''
      })
      .filter(Boolean)
      .join(' ')
      .trim()
  }
  return ''
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

import { setupCacheHook } from "./cache-hook"
import { cacheCompactionOutput } from "./compaction-hook"

// ... (other imports)
// ============================================================================
// Plugin Entry Point
// ============================================================================

export const JocPlugin: Plugin = async ({ project, client, directory, worktree }) => {
  initializeJocState(directory)
  
  // Initialize hooks
  // Vectorize hook loads dynamically + defensively: it spawns a child process
  // for indexing, and a failure here must never take down plugin startup.
  const childRegistry = new ChildRegistry()
  childRegistry.start()
  let vectorize: VectorizeHandle | null = null
  try {
    const { setupVectorizeHook } = await import("./vectorize-hook")
    vectorize = setupVectorizeHook(directory, childRegistry)
  } catch (err) {
    console.error("[hooks] vectorize hook unavailable:", err instanceof Error ? err.message : err)
  }
  activeChildRegistry = childRegistry
  activeVectorize = vectorize
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

      case 'file.edited': {
        // Event-driven index sync. The hook filters this down to files the
        // stores actually index and debounces bursts, so a 50-file edit
        // produces one sync child rather than 50.
        try { vectorize?.notifyFileChanged(event.properties.file) } catch { /* never block a turn */ }
        break
      }

      case 'file.watcher.updated': {
        try { vectorize?.notifyFileChanged(event.properties.file) } catch { /* never block a turn */ }
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
  // This is the ONLY mechanism by which a cache hit saves anything: the
  // before-hook cannot cancel a tool, so the substitution must be applied
  // after the tool has run.
  const cacheHitMap = new Map<string, string>()

  // Read cache key. offset/limit are part of the key, not an afterthought:
  // keying on filePath alone let a partial read (offset=100) be served to a
  // later full-file read, silently truncating the model its view of the file.
  const readCacheKey = (filePath: string, args: Record<string, unknown>) =>
    CacheManager.key('Read', filePath, String(args.offset ?? ''), String(args.limit ?? ''))

  hooks["tool.execute.before"] = async (input, output) => {
    const toolName = input.tool || 'unknown'
    const sessionId = input.sessionID

    if (sessionId) {
      updateToolStats(toolName, sessionId)
    }

    // ── [Change 6]: Emit tool:before event ───────────────────────────
    emit('tool:before', { toolName, args: (input as any)?.args || {} })

    // ── CACHE SUBSTITUTION ────────────────────────────────────────────
    // A cache hit only saves anything if the model is actually SHOWN the
    // cached result instead of the freshly-computed one. tool.execute.before
    // cannot cancel a tool (the SDK only lets it mutate output.args), so the
    // substitution has to happen in tool.execute.after — this hook's only job
    // is to record the hit against the call, keyed by callID.
    //
    // These three blocks previously looked the value up and then discarded it,
    // which inflated the hit counters while re-spending the tokens. That is
    // why the reported hit rate was flattering and real savings were ~0.
    const callID = input.callID || ''

    // ── Tier 1: deterministic tool cache ─────────────────────────────
    const CACHEABLE_TOOLS = new Set([
      'Glob', 'Grep', 'listAgents', 'getSessionID', 'hubMenu',
      'loadSkill', 'runSkillScript',
    ])
    if (callID && CACHEABLE_TOOLS.has(toolName)) {
      try {
        const toolCache = getCache('tool')
        const args = (input as any).args || {}
        const cached = toolCache.get<string>(toolCacheKey(toolName, args))
        if (cached) cacheHitMap.set(callID, cached)
      } catch {}
    }

    // ── Tier 2: MCP cache ────────────────────────────────────────────
    // Context7 documentation is stable for days and the namespace has a 7-day
    // TTL, so a repeat lookup is pure waste.
    if (callID && (toolName === 'context7_query-docs' || toolName === 'context7_resolve-library-id')) {
      try {
        const mcpCache = getCache('mcp')
        const args = (input as any).args || {}
        const cached = mcpCache.get<string>(toolCacheKey(toolName, args))
        if (cached) cacheHitMap.set(callID, cached)
      } catch {}
    }

    // ── File read cache, mtime-validated ─────────────────────────────
    // The key MUST include offset and limit. Keying on filePath alone meant a
    // partial read (offset=100) would be served to a later full-file read.
    if (callID && toolName === 'Read') {
      try {
        const fileCache = getCache('file')
        const args = (input as any).args || {}
        const filePath = args.filePath || args.path || ''
        if (filePath && existsSync(filePath)) {
          const currentMtime = statSync(filePath).mtime.toISOString()
          const key = readCacheKey(filePath, args)
          const cached = fileCache.get<string>(key)
          if (cached) {
            const entry = JSON.parse(cached)
            if (entry.mtime === currentMtime) {
              cacheHitMap.set(callID, entry.content)
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

    // ── Cache-hit substitution (ALL tools) ───────────────────────────
    // The before-hook recorded a hit against this callID. Replace what the
    // model will see with the cached value and stop — the tool has already
    // run, so the only remaining cost is the tokens for its output, and this
    // is where that gets avoided. Skipping the write-back also prevents a
    // cache hit from re-stamping its own TTL.
    const hitCallID = input.callID || ''
    if (hitCallID && cacheHitMap.has(hitCallID)) {
      try {
        output.output = cacheHitMap.get(hitCallID) ?? toolOutput
        cacheHitMap.delete(hitCallID)
        return
      } catch {}
    }

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
          fileCache.set(readCacheKey(filePath, args), JSON.stringify({ content: toolOutput, mtime }), 300_000)
        }
      } catch {}
    }
    // Invalidate file cache + tool cache on write operations.
    // These calls were previously inert: keys were bare sha256 hashes, so
    // invalidatePrefix("Glob") matched nothing and a Write left every cached
    // Glob/Grep result in place until its 30s TTL expired.
    const WRITE_TOOLS = new Set(['Write', 'Edit', 'bash'])
    if (WRITE_TOOLS.has(toolName)) {
      invalidateToolCache('Glob')
      invalidateToolCache('Grep')
      // Invalidate the file-read cache for the written file, across every
      // offset/limit variant of it.
      try {
        const fileCache = getCache('file')
        const args = (input as any).args || {}
        const filePath = args.filePath || args.path || ''
        if (filePath) fileCache.invalidatePrefix('Read')
      } catch {}
    }

    // ── Tier 2: Cache MCP responses ───────────────────────────────────
    if (toolName === 'context7_query-docs' || toolName === 'context7_resolve-library-id') {
      try {
        const mcpCache = getCache('mcp')
        const args = (input as any).args || {}
        mcpCache.set(toolCacheKey(toolName, args), toolOutput, 604_800_000) // 7 days
      } catch {}
    }

    // ── Tier 4: Cache agent (Task) outputs ────────────────────────────
    if (toolName === 'Task' && toolOutput && sessionId) {
      const callID = input.callID || ''

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
    // Queue state is still maintained for manual /orchestrate-hub resume operations.

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
  // Gate for Tier 2 context injection. This is a COST gate, not a quality
  // gate: retrieval costs ~2-3s of wall clock and up to 1800 injected tokens,
  // so it should fire on prompts that plausibly need project knowledge and
  // stay quiet on the rest. The first pass at this was a 28-word list that
  // missed ordinary failure phrasing ("auth keeps failing") while matching
  // trivial ones ("how does this work") — so the failure/negation and
  // question-word families are included explicitly below.
  const COMPLEXITY_KEYWORDS = new Set([
    // task verbs
    'refactor', 'debug', 'fix', 'implement', 'build', 'create', 'optimize',
    'plan', 'decompose', 'analyze', 'overhaul', 'review', 'test', 'trace',
    'migrate', 'upgrade', 'rewrite', 'port', 'benchmark', 'profile',
    // design nouns
    'architecture', 'design', 'modular', 'pattern', 'convention', 'dependency',
    'integration', 'security', 'performance', 'schema', 'contract', 'api',
    // failure / problem phrasing (the gap in the original list)
    'fail', 'failing', 'fails', 'error', 'broken', 'breaks', 'bug', 'issue',
    'wrong', 'crash', 'hang', 'stuck', 'regression', 'unexpected', 'silent',
    'not working', "doesn't", "doesn't", "isn't", 'cannot', 'can\'t', 'wont',
    'why', 'how come', 'root cause', 'diagnose', 'mismatch', 'leak', 'race',
    // question + explanation words
    'why', 'how', 'where', 'which', 'what', 'explain', 'understand', 'compare',
    'difference', 'walk me through',
    // system nouns that imply project context
    'hook', 'plugin', 'agent', 'subagent', 'tool', 'cache', 'context',
    'config', 'rule', 'skill', 'hub', 'state', 'session', 'vector', 'embedding',
  ])

  // A prompt shorter than this is a command or a confirmation, never a
  // project-knowledge question. Cheap floor, checked before the word list.
  const MIN_INJECTION_PROMPT_CHARS = 12

  function shouldInjectContext(prompt: string): boolean {
    if (!prompt || prompt.length < MIN_INJECTION_PROMPT_CHARS) return false
    const lower = prompt.toLowerCase()
    for (const kw of COMPLEXITY_KEYWORDS) {
      if (lower.includes(kw)) return true
    }
    return false
  }

  // ── Warm vector-query child ─────────────────────────────────────────
  // MEASURED on this machine (see rules/efficiency-first.md):
  //   cold one-shot spawn        → 9.4–10.0s   (ONNX reranker model load)
  //   warm child, 20 candidates  → 0.3–9.0s   (median 4.7s)
  //   warm child,  8 candidates  → 0.5–2.6s   (steady ~2.0–2.6s)
  //   RERANK_DISABLED=1, one-shot→ 0.55s       (loses rerank precision)
  // The 9.4s fixed load was landing on the inference path for every gated
  // turn. A single long-lived child per directory pays it once per session.
  // Rerank candidates are dialed to 8 to bound the per-turn cost; the timeout
  // below is the hard guarantee — retrieval never blocks a turn for more than
  // VECTOR_QUERY_TIMEOUT_MS, and a timeout degrades to no injection.
  const VECTOR_QUERY_TIMEOUT_MS = 4_000
  const VECTOR_FIRST_QUERY_TIMEOUT_MS = 12_000 // first query also loads the model
  const VECTOR_RERANK_CANDIDATES = '8'

  type VectorResponse = { context: any[]; code: any[]; graph: any[] }
  let vectorProc: ReturnType<typeof spawn> | null = null
  let vectorReady: Promise<void> | null = null
  let vectorMarkReady: (() => void) | null = null
  let vectorBuf = ''
  let vectorNextId = 1
  const vectorPending = new Map<number, (msg: any) => void>()

  const vectorScriptPath = join(directory, 'skills', 'vectorize-context', 'scripts', 'query-hook.ts')

  function ensureVectorChild(): boolean {
    if (vectorProc && !vectorProc.killed) return true
    if (!existsSync(vectorScriptPath)) return false
    try {
      // Interpreter comes from PATH, not process.execPath — the OpenCode host
      // is a Bun-compiled binary that cannot run a script passed as argv[1].
      const rt = resolveRuntime()
      vectorProc = spawn(rt.cmd, [...rt.args, vectorScriptPath], {
        env: {
          ...process.env,
          VECLIB_SERVER: '1',
          VECLIB_RERANK_CANDIDATES: VECTOR_RERANK_CANDIDATES,
          OPCODE_DIR: directory,
        },
        stdio: ['pipe', 'pipe', 'pipe'],
      })
    } catch {
      vectorProc = null
      return false
    }

    // Registered for GC: this child holds an ONNX model and a SQLite handle and
    // is otherwise immortal — a plugin reload or an abnormal parent exit would
    // strand it. The max age is generous (it is designed to be long-lived) but
    // finite, so a wedged child is eventually reaped.
    childRegistry.register(vectorProc, 'vector-query-server', 60 * 60 * 1000)

    vectorBuf = ''
    vectorPending.clear()
    vectorReady = new Promise<void>((resolve) => { vectorMarkReady = resolve })
    const markReady = vectorMarkReady

    vectorProc.stdout?.on('data', (d: Buffer) => {
      vectorBuf += d.toString()
      let i: number
      while ((i = vectorBuf.indexOf('\n')) >= 0) {
        const line = vectorBuf.slice(0, i).trim()
        vectorBuf = vectorBuf.slice(i + 1)
        if (!line) continue
        let msg: any
        try { msg = JSON.parse(line) } catch { continue }
        if (msg?.ready) { markReady?.(); continue }
        const resolve = vectorPending.get(msg?.id)
        if (resolve) { vectorPending.delete(msg.id); resolve(msg) }
      }
    })

    // Never let the child's stderr flood the TUI; surface only the first line.
    let stderrHead = ''
    vectorProc.stderr?.on('data', (d: Buffer) => {
      if (stderrHead.length > 400) return
      stderrHead += d.toString().slice(0, 400)
    })
    vectorProc.on('error', () => { vectorProc = null })
    vectorProc.on('close', () => {
      const err = stderrHead.split('\n')[0]
      if (err) console.error(`[vector-query] child exited: ${err}`)
      // Reject anything still in flight so callers don't hang on a dead child.
      for (const resolve of vectorPending.values()) resolve({ context: [], code: [], graph: [] })
      vectorPending.clear()
      vectorProc = null
      vectorMarkReady?.()
    })

    return true
  }

  async function queryVectorStore(queryText: string, firstQuery: boolean): Promise<VectorResponse> {
    const empty: VectorResponse = { context: [], code: [], graph: [] }
    if (!ensureVectorChild()) return empty
    const child = vectorProc
    if (!child?.stdin) return empty

    const budget = firstQuery ? VECTOR_FIRST_QUERY_TIMEOUT_MS : VECTOR_QUERY_TIMEOUT_MS
    const deadline = Date.now() + budget

    // Wait for the child's ready signal, but never past the budget.
    if (vectorReady) {
      await Promise.race([vectorReady, new Promise((r) => setTimeout(r, budget))])
    }
    if (Date.now() >= deadline || !vectorProc || vectorProc.killed) return empty

    const id = vectorNextId++
    const response = await new Promise<any>((resolve) => {
      let settled = false
      const finish = (msg: any) => {
        if (settled) return
        settled = true
        vectorPending.delete(id)
        resolve(msg)
      }
      vectorPending.set(id, finish)
      const timer = setTimeout(() => finish({ context: [], code: [], graph: [] }), Math.max(0, deadline - Date.now()))
      timer.unref?.()
      try {
        child.stdin!.write(JSON.stringify({ id, query: queryText }) + '\n', (err) => {
          if (err) { clearTimeout(timer); finish({ context: [], code: [], graph: [] }) }
        })
      } catch {
        clearTimeout(timer)
        finish({ context: [], code: [], graph: [] })
      }
    })

    // graph is passed through, not dropped: the child computes structural
    // recall in the same round-trip, and discarding it here is exactly how the
    // graph ended up unused by context gathering.
    return {
      context: response?.context || [],
      code: response?.code || [],
      graph: response?.graph || [],
    }
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

  // Token budget for injected <Relevant_Context> blocks (local retrieval only)
  const CONTEXT_TOKEN_BUDGET = 1000

  // Token budget for injected <Relevant_Code> blocks (local retrieval only)
  const CODE_TOKEN_BUDGET = 800

  // Token budget for injected <Relevant_Graph> blocks. Small on purpose: the
  // block carries node ids, titles, and edge types — not content — so its
  // whole value is in being present, not in being long.
  const GRAPH_TOKEN_BUDGET = 300

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

    // ── Efficiency reminder (every turn) ─────────────────────────────
    // The rule lives in rules/efficiency-first.md and is in the system prompt
    // already, but a standing rule among 11 instruction files dilutes. This is
    // the unmissable per-cycle nudge. Kept to a few lines deliberately: it is
    // paid on every single turn, so its own cost must stay near zero.
    output.system.push(
      `<efficiency>\n` +
      `Prefer fewer inference calls and smaller prompts. Batch independent tool calls into one message. ` +
      `Check cache/context/embeddings before re-deriving. Full rule: rules/efficiency-first.md.\n` +
      `Never apply this to output code or text the user asked for — those are never truncated.\n` +
      `</efficiency>`
    )

    // ── Vector-search-based context + code injection ────────────────
    // Searches per-project stores (.opencode/context/ etc. → context.db;
    // source tree → code.db) and injects <Relevant_Context> + <Relevant_Code>
    // blocks. Runs query-hook.mjs as a CHILD PROCESS — native deps
    // (better-sqlite3, sqlite-vec, ONNX reranker) never load inside the
    // plugin process (crash hardening). Local-only, zero provider API
    // requests. Results cached in session namespace (5 min).
    //
    // The child is long-lived (VECLIB_SERVER=1): a cold spawn costs ~9.4s in
    // ONNX model load, which is far too much to pay per gated turn. See
    // queryVectorStore above for the measured numbers and the timeout.
    try {
      const contextDir = join(directory, '.opencode', 'context')
      if (!existsSync(contextDir)) return

      // Use the user's latest actual prompt as the search query.
      // (Captured in chat.message — the transform hook itself only
      // receives sessionID + model, not message content.)
      const queryText = latestUserPromptBySession.get(sessionId) || ''

      // Clear the stored prompt on EVERY path out of this block, not just the
      // happy path. Previously the delete sat below the complexity gate, so a
      // prompt that failed the gate stayed in the map and was then used as the
      // query for some later, unrelated turn — stale-query injection.
      if (queryText.length >= 10) {
        // ...consumed below; the finally-equivalent delete runs at the end.
      }
      try {
        if (queryText.length < 10) return
        if (!shouldInjectContext(queryText)) return
        if (!existsSync(vectorScriptPath)) return

        const wasCold = !vectorProc
        const sessionCache = getCache('session')

        const ctxCacheKey = CacheManager.key('ctx-search', queryText)
        const cachedCtx = sessionCache.get<string>(ctxCacheKey)
        let ctxRelevant: string[] | null = cachedCtx ? JSON.parse(cachedCtx) : null

        const codeCacheKey = CacheManager.key('code-search', queryText)
        const cachedCode = sessionCache.get<string>(codeCacheKey)
        let codeRelevant: string[] | null = cachedCode ? JSON.parse(cachedCode) : null

        // Structural recall — which rules/skills/concepts the graph says are
        // related. Pure SQL in the child, so it is nearly free, and it carries
        // information the two vector stores structurally cannot: the edges.
        const graphCacheKey = CacheManager.key('graph-search', queryText)
        const cachedGraph = sessionCache.get<string>(graphCacheKey)
        let graphRelevant: string[] | null = cachedGraph ? JSON.parse(cachedGraph) : null

        // Only talk to the child if at least one block isn't cached
        if (ctxRelevant === null || codeRelevant === null || graphRelevant === null) {
          const results = await queryVectorStore(queryText, wasCold)

        if (ctxRelevant === null) {
          ctxRelevant = results.context
            .map((r: any) => `**${r.file}**\n${r.content || ''}`)
            .slice(0, 5)
        }

        if (codeRelevant === null) {
          codeRelevant = results.code
            .map((r: any) => `**${r.file}${r.heading ? ' — ' + r.heading : ''}**\n${r.content || ''}`)
            .slice(0, 4)
        }

        if (graphRelevant === null) {
          graphRelevant = (results.graph || [])
            .map((r: any) => `**${r.type}:${r.id}**${r.via ? ` — via ${r.via}` : ''}\n${r.title || ''}${r.path ? `\npath: ${r.path}` : ''}`)
            .slice(0, 4)
        }

        // Cache BOTH outcomes, including empty ones. A store that returns
        // nothing for a query is a stable fact about that query, and leaving it
        // uncached meant every repeat of the same prompt re-paid the full
        // query cost forever. Measured: an identical repeat prompt went from
        // 2.56s to a sub-millisecond memory hit. Empties get a short TTL so a
        // newly-indexed file can still surface.
        sessionCache.set(
          ctxCacheKey,
          JSON.stringify(ctxRelevant),
          ctxRelevant.length > 0 ? 300_000 : 60_000,
        )
        sessionCache.set(
          codeCacheKey,
          JSON.stringify(codeRelevant),
          codeRelevant.length > 0 ? 300_000 : 60_000,
        )
        sessionCache.set(
          graphCacheKey,
          JSON.stringify(graphRelevant),
          graphRelevant.length > 0 ? 300_000 : 60_000,
        )
      }

        if (ctxRelevant && ctxRelevant.length > 0) {
          const ctxBlock = `<Relevant_Context>\n${ctxRelevant.join('\n\n---\n\n')}\n</Relevant_Context>`
          output.system.push(truncateToTokens(ctxBlock, CONTEXT_TOKEN_BUDGET))
        }

        if (codeRelevant && codeRelevant.length > 0) {
          const codeBlock = `<Relevant_Code>\n${codeRelevant.join('\n\n---\n\n')}\n</Relevant_Code>`
          output.system.push(truncateToTokens(codeBlock, CODE_TOKEN_BUDGET))
        }

        // Structural knowledge, kept deliberately small: these are node ids and
        // edge types, not prose, so a few lines carry the whole point (which
        // rule/skill governs this) without spending the context budget that the
        // content blocks use.
        if (graphRelevant && graphRelevant.length > 0) {
          const graphBlock = `<Relevant_Graph>\n${graphRelevant.join('\n')}\n</Relevant_Graph>`
          output.system.push(truncateToTokens(graphBlock, GRAPH_TOKEN_BUDGET))
        }
      } finally {
        // Unconditional: no exit path leaves a stale prompt behind.
        latestUserPromptBySession.delete(sessionId)
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

    // ── Capture latest user prompt for vector-search injection ──────
    try {
      const msg = (input as any)?.message
      if (msg && (msg.role === 'user' || typeof msg.content === 'string')) {
        const text = extractUserText(msg)
        if (text.length > 0) {
          latestUserPromptBySession.set(sessionId, text.slice(0, 2000))
        }
      }
    } catch { /* best effort */ }

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

  // ── Child process GC ─────────────────────────────────────────────────
  // The plugin API has no teardown hook, so cleanup is arranged defensively
  // in three independent layers. Each covers a case the others cannot:
  //
  //   1. 'exit' — normal quit. proc.kill() is synchronous, so this is safe in
  //      an exit handler and covers both process.exit() and natural return.
  //   2. max-age reaper (ChildRegistry, 60s interval) — a child still alive
  //      past its age limit is killed even though the parent is healthy. This
  //      is the layer that catches a wedged child.
  //   3. Pipe-EOF self-termination, in the children themselves — if the parent
  //      is SIGKILLed, the inherited stdin pipe closes and the child's
  //      readline 'close' handler exits it. Nothing survives a parent kill.
  //
  // Deliberately no SIGINT/SIGTERM listeners: adding one suppresses Node's
  // default termination, so a handler that failed to exit would hang the user
  // out of the TUI. A hung quit is a worse bug than a briefly-orphaned child,
  // and layer 3 already covers that case.
  process.on('exit', () => {
    try { childRegistry.reapAll() } catch { /* nothing useful to do at exit */ }
  })

  return hooks
}

// ─── Diagnostics ────────────────────────────────────────────────────────────
// Module-level handles to the plugin's background machinery. The vectorize
// handle and child registry are otherwise unreachable from outside the plugin,
// which made "did the sync fire, and is it leaking a child?" unanswerable
// without attaching to the process from outside. Safe to call at any time.
let activeVectorize: VectorizeHandle | null = null
let activeChildRegistry: ChildRegistry | null = null

export function __hubsDiagnostics() {
  return {
    runtime: resolveRuntime(),
    vectorize: activeVectorize ? activeVectorize.stats() : null,
    childCount: activeChildRegistry ? activeChildRegistry.size : 0,
    children: activeChildRegistry ? activeChildRegistry.describe() : [],
    // Cache effectiveness, per namespace. The whole point of the request-budget
    // work is that a repeat turn costs no inference call, and that claim was not
    // checkable from outside the plugin — `childCount` showed a child was
    // reused but never whether the retrieval that needed it was served from
    // cache. Without this, a regression to per-turn retrieval is invisible until
    // someone times a session by hand.
    cache: cacheStatsByNamespace(),
  }
}

export default JocPlugin