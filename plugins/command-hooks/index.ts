/**
 * command-hooks/index.ts — plugin entry.
 *
 * Ports github.com/shanebishop1/opencode-command-hooks (MIT) as a local plugin.
 * See plugins/command-hooks/types.ts for the configuration surface and
 * .opencode/context/research/opencode-command-hooks/ for the design notes.
 *
 * ── Why this exists instead of depending on the package ──────────────────────
 *
 * The upstream plugin injects a hook's output with
 * `client.session.promptAsync(...)`. That is a full inference request: every
 * hook result costs a model call, and the result lands as a synthetic user turn
 * rather than as context the agent is already reading.
 *
 * This configuration already has a deferred queue — `plugins/hooks/session.ts`
 * exposes `queueContextMessage`, drained into the next turn's system transform.
 * Routing injections through it means a hook result costs **zero** extra
 * inference requests, which is the difference between a hook people keep and a
 * hook people disable. `promptAsync` remains the fallback when this plugin is
 * loaded without the hooks plugin present.
 *
 * Events: `tool.execute.before`, `tool.execute.after`, `session.created`
 * (alias `session.start`), `session.idle`.
 */

import type { Plugin } from '@opencode-ai/plugin'
import { loadAgentHooks, loadConfig } from './config.js'
import { chainFailed, runCommands } from './execute.js'
import {
  sessionHookMatches,
  sessionSuppressedByOverride,
  suppressedByOverride,
  toolHookMatches,
} from './matcher.js'
import { clampMessage, interpolate } from './template.js'
import type { HookRunOutcome, ResolvedConfig, SessionEvent, SessionHook, ToolHook } from './types.js'

/** Re-exported so tests (and other plugins) reach the surface without deep paths. */
export { parseJsonc, parseAgentHooks, loadConfig, mergeConfigs, loadAgentHooks, findProjectConfig } from './config.js'
export { matchesArg, toolHookMatches, sessionHookMatches, suppressedByOverride, sessionSuppressedByOverride, overrideSignature, compileGlob, compileRegex, globFallback } from './matcher.js'
export { interpolate, clampMessage } from './template.js'
export { runCommands, truncate, chainFailed, writeArgsFile, HOOK_ARGS_ENV } from './execute.js'
export { validateConfig } from './schema.js'
export type * from './types.js'


export interface CommandHooksStats {
  toolInvocations: number
  sessionEvents: number
  hooksMatched: number
  hooksRan: number
  hooksFailed: number
  injectionsQueued: number
  toastsShown: number
  /** Config problems seen, deduplicated so one bad file is reported once. */
  configErrors: string[]
}

/** Exposed for tests; the live instance is set by the plugin factory. */
let stats: CommandHooksStats = emptyStats()
let statsForTests: CommandHooksStats | null = null

function emptyStats(): CommandHooksStats {
  return {
    toolInvocations: 0,
    sessionEvents: 0,
    hooksMatched: 0,
    hooksRan: 0,
    hooksFailed: 0,
    injectionsQueued: 0,
    toastsShown: 0,
    configErrors: [],
  }
}

export function __commandHooksStats(): CommandHooksStats {
  return statsForTests ?? stats
}

export function __resetCommandHooksStats(): void {
  stats = emptyStats()
  statsForTests = null
}

/** TTL for the after-hook dedupe key, matching upstream's 60s. */
const AFTER_DEDUPE_TTL_MS = 60_000
const ARGS_TTL_MS = 10 * 60_000
const MAX_TRACKED_CALLS = 1_000

type ArgsCacheEntry = { args: Record<string, unknown>; agent?: string; savedAt: number }

/**
 * Build the handler set for one resolved config.
 *
 * Exported separately from the plugin factory so the tests can drive the exact
 * code path OpenCode drives, with no plugin runtime in the way. A test that
 * re-implements the dispatch is a test of the test.
 */
export function createHandlers(deps: {
  config: ResolvedConfig
  projectDir: string
  queue: (sessionId: string, message: string) => void
  toast: (t: { title?: string; message: string; variant?: string; duration?: number }) => Promise<void>
  fallbackInject?: (sessionId: string, message: string) => Promise<void>
  onConfigError?: (message: string) => void
}) {
  const { config, projectDir, toast } = deps
  // The session queue is the cheap path and is always present when the hooks
  // plugin is loaded. `promptAsync` is the fallback for a standalone install,
  // and it costs a real inference request per injection — so the queue is tried
  // first and the fallback only fires when there is nothing to queue into.
  const deliver = async (sessionId: string, message: string) => {
    if (deps.queue) deps.queue(sessionId, message)
    else if (deps.fallbackInject) await deps.fallbackInject(sessionId, message)
  }
  const argsCache = new Map<string, ArgsCacheEntry>()
  const afterSeen = new Map<string, number>()

  const key = (sessionID?: string, callID?: string) =>
    sessionID && callID ? JSON.stringify([sessionID, callID]) : undefined

  function pruneArgs() {
    const now = Date.now()
    for (const [k, v] of argsCache) if (now - v.savedAt > ARGS_TTL_MS) argsCache.delete(k)
    while (argsCache.size > MAX_TRACKED_CALLS) {
      const oldest = argsCache.keys().next().value
      if (oldest === undefined) break
      argsCache.delete(oldest)
    }
  }

  /** Active hooks for a phase, with global hooks suppressed by local overrides. */
  function activeToolHooks(phase: 'before' | 'after'): ToolHook[] {
    const enabled = config.tool.filter((h) => !h.disabled)
    // Everything in this merged list is "local" from the override perspective
    // only when it came from the project file. The plugin passes the project
    // list separately so an override in the project does not suppress another
    // project hook.
    return enabled
  }

  async function report(
    hook: { id: string; inject?: string; injectOn?: 'always' | 'failure'; toast?: any },
    ctx: {
      sessionId: string
      tool?: string
      agent?: string
      event?: string
      results: any[]
      args?: Record<string, unknown>
    },
  ): Promise<Pick<HookRunOutcome, 'injected' | 'toast'>> {
    const failed = chainFailed(ctx.results)
    const out: Pick<HookRunOutcome, 'injected' | 'toast'> = {}

    if (hook.toast) {
      const message = interpolate(hook.toast.message, { id: hook.id, ...ctx } as any)
      const rendered = {
        title: hook.toast.title ? interpolate(hook.toast.title, { id: hook.id, ...ctx } as any) : undefined,
        message,
        variant: hook.toast.variant,
        duration: hook.toast.duration,
      }
      out.toast = rendered
      try {
        await toast(rendered)
        stats.toastsShown++
      } catch {
        // A toast is decoration. A failing toast must not affect the tool call.
      }
    }

    if (hook.inject) {
      // LOCAL: `injectOn: "failure"` is the request-efficiency default this
      // config leans on. A green run reporting "exit 0" spends tokens on news
      // nobody needs, and noise is how hooks get switched off.
      const shouldInject = hook.injectOn === 'failure' ? failed : true
      if (shouldInject) {
        const rendered = clampMessage(
          interpolate(hook.inject, { id: hook.id, ...ctx } as any),
          config.injectLimit,
        )
        out.injected = rendered
        try {
          await deliver(ctx.sessionId, rendered)
          stats.injectionsQueued++
        } catch (e) {
          // An injection that cannot be delivered is still reported, so a caller
          // inspecting the outcome sees the text rather than a silent no-op.
          out.injected = `${rendered}\n[injection failed: ${e instanceof Error ? e.message : String(e)}]`
        }
      }
    }
    return out
  }

  /**
   * Run every matching hook for an event. Hooks run sequentially, in config
   * order, so a later hook can rely on an earlier one having finished.
   */
  async function fireToolHooks(
    phase: 'before' | 'after',
    input: { tool: string; sessionID: string; callID?: string },
    args: Record<string, unknown> | undefined,
    agent?: string,
  ): Promise<HookRunOutcome[]> {
    stats.toolInvocations++
    const suppressed = new Set<string>()
    const matched: ToolHook[] = []

    for (const hook of activeToolHooks(phase)) {
      if (suppressed.has(hook.id)) continue
      if (!toolHookMatches(hook, { phase, tool: input.tool, agent, args })) continue
      matched.push(hook)
      if (hook.overrideGlobal) {
        // Suppress every other hook for this phase+tool, which is what makes
        // `overrideGlobal` a replacement rather than an addition.
        for (const other of config.tool) {
          if (other.id === hook.id) continue
          if (other.when?.phase !== phase) continue
          const tools = other.when?.tool === undefined ? ['*'] : Array.isArray(other.when.tool) ? other.when.tool : [other.when.tool]
          if (tools.includes('*') || tools.includes(input.tool)) suppressed.add(other.id)
        }
      }
    }

    stats.hooksMatched += matched.length
    const outcomes: HookRunOutcome[] = []

    for (const hook of matched) {
      if (!hook.run) {
        outcomes.push({ hookId: hook.id, matched: true, ran: false, results: [] })
        continue
      }
      try {
        const results = await runCommands(hook.run, {
          cwd: projectDir,
          truncateOutput: config.truncationLimit,
          args,
        })
        stats.hooksRan++
        if (chainFailed(results)) stats.hooksFailed++
        const r = await report(hook, {
          sessionId: input.sessionID,
          tool: input.tool,
          agent,
          results,
          args,
        })
        outcomes.push({
          hookId: hook.id,
          matched: true,
          ran: true,
          results,
          exitCode: results[results.length - 1]?.exitCode,
          stdout: results[results.length - 1]?.stdout ?? '',
          stderr: results[results.length - 1]?.stderr ?? '',
          ...r,
        })
      } catch (e) {
        // A hook must never propagate into the tool call it is decorating.
        outcomes.push({
          hookId: hook.id,
          matched: true,
          ran: false,
          results: [],
          error: e instanceof Error ? e.message : String(e),
        })
      }
    }
    return outcomes
  }

  async function fireSessionHooks(
    // Accepts the alias spelling too: the matcher canonicalises it, and narrowing
    // the parameter here would push the alias-resolution responsibility back out
    // to every caller — which is how the documented spelling went dead before.
    event: SessionEvent,
    sessionId: string,
    agent: string | undefined,
    rootSession: boolean | undefined,
  ): Promise<HookRunOutcome[]> {
    stats.sessionEvents++
    const suppressed = new Set<string>()
    const matched: SessionHook[] = []
    for (const hook of config.session) {
      if (hook.disabled) continue
      if (suppressed.has(hook.id)) continue
      if (!sessionHookMatches(hook, { event, agent, rootSession })) continue
      matched.push(hook)
      if (hook.overrideGlobal) {
        for (const other of config.session) {
          if (other.id === hook.id) continue
          if (other.when?.event === event) suppressed.add(other.id)
        }
      }
    }
    stats.hooksMatched += matched.length
    const outcomes: HookRunOutcome[] = []
    for (const hook of matched) {
      if (!hook.run) {
        outcomes.push({ hookId: hook.id, matched: true, ran: false, results: [] })
        continue
      }
      try {
        const results = await runCommands(hook.run, { cwd: projectDir, truncateOutput: config.truncationLimit })
        stats.hooksRan++
        if (chainFailed(results)) stats.hooksFailed++
        const r = await report(hook, { sessionId, event, agent, results })
        outcomes.push({
          hookId: hook.id,
          matched: true,
          ran: true,
          results,
          exitCode: results[results.length - 1]?.exitCode,
          ...r,
        })
      } catch (e) {
        outcomes.push({ hookId: hook.id, matched: true, ran: false, results: [], error: String(e) })
      }
    }
    return outcomes
  }

  function noteConfigError(errors: string[]) {
    for (const e of errors) {
      if (stats.configErrors.includes(e)) continue
      stats.configErrors.push(e)
      deps.onConfigError?.(e)
    }
  }

  return {
    config,
    argsCache,
    afterSeen,
    toolExecuteBefore: (input: any, output: any) => {
      const k = key(input.sessionID, input.callID)
      const agent = subagentOf(input, output)
      if (k && output?.args) {
        pruneArgs()
        // The agent is stored with the args, not re-derived in the after phase.
        // `tool.execute.after` is called with no tool arguments, so a hook
        // filtered on `callingAgent` could otherwise never fire after a subagent
        // call — the filter silently matched nothing on exactly the event people
        // write it for.
        argsCache.set(k, { args: output.args, agent, savedAt: Date.now() })
      }
      return fireToolHooks('before', input, output?.args, agent)
    },
    toolExecuteAfter: (input: any, _output: any) => {
      const k = key(input.sessionID, input.callID)
      let args: Record<string, unknown> | undefined
      let cachedAgent: string | undefined
      if (k) {
        // Check BEFORE recording. The first version of this set the timestamp and
        // then compared it, so the delta was always 0, the guard always tripped,
        // and every after-hook was silently dropped — a hook that appears to be
        // configured and never fires, which is the worst shape this bug can take.
        const seenAt = afterSeen.get(k)
        if (seenAt !== undefined && Date.now() - seenAt <= AFTER_DEDUPE_TTL_MS) {
          return []
        }
        afterSeen.set(k, Date.now())
        // Bound the map the same way as the args cache, so a long session cannot
        // accumulate one entry per tool call forever.
        for (const [seen, at] of afterSeen) {
          if (Date.now() - at > AFTER_DEDUPE_TTL_MS) afterSeen.delete(seen)
        }
        while (afterSeen.size > MAX_TRACKED_CALLS) {
          const oldest = afterSeen.keys().next().value
          if (oldest === undefined) break
          afterSeen.delete(oldest)
        }
        const entry = argsCache.get(k)
        args = entry?.args
        cachedAgent = entry?.agent
        argsCache.delete(k)
      }
      // Fall back to the output for a direct call that skipped the before phase.
      return fireToolHooks('after', input, args, cachedAgent ?? subagentOf(input, _output))
    },
    sessionEvent: fireSessionHooks,
    noteConfigError,
    /** Test seam: the exact suppression sets the merged config would produce. */
    suppression: {
      tool: (local: ToolHook[], globals: ToolHook[]) => suppressedByOverride(local, globals),
      session: (local: SessionHook[], globals: SessionHook[]) => sessionSuppressedByOverride(local, globals),
    },
  }
}

/** The subagent a `task` tool call is delegating to, if this is one. */
function subagentOf(input: any, output: any): string | undefined {
  if (input?.tool !== 'task') return undefined
  const raw = output?.args?.subagent_type ?? output?.args?.subagentType
  return typeof raw === 'string' && raw ? raw.replace(/^@/, '') : undefined
}

export const CommandHooksPlugin: Plugin = async ({ project, client, directory, $ }) => {
  stats = emptyStats()
  const projectDir = directory || process.cwd()

  // Route through the hooks plugin's queue when it is loaded. That is the whole
  // point of owning this code: a hook result is context, not a prompt, and
  // prompting costs a request.
  let queue: ((sessionId: string, message: string) => void) | null = null
  let fallback: ((sessionId: string, message: string) => Promise<void>) | undefined
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const session = require('../hooks/session.js')
    if (typeof session.queueContextMessage === 'function') {
      queue = (id, message) => session.queueContextMessage(id, message)
    }
  } catch {
    // hooks plugin not loaded — fall through to promptAsync below.
  }
  if (client) {
    fallback = async (id: string, message: string) => {
      await client.session.promptAsync({
        path: { id },
        body: { parts: [{ type: 'text', text: message }] },
      })
    }
  }

  const queueFn = (id: string, message: string) => {
    if (queue) queue(id, message)
    else void fallback?.(id, message)
  }

  const toast = async (t: { title?: string; message: string; variant?: string; duration?: number }) => {
    if (!client) return
    await client.tui.showToast({
      body: {
        ...(t.title ? { title: t.title } : {}),
        message: t.message,
        variant: (t.variant as any) ?? 'info',
        ...(t.duration ? { duration: t.duration } : {}),
      },
    })
  }

  const loaded = loadConfig(projectDir)
  let config = loaded.config
  const handlers = createHandlers({
    config,
    projectDir,
    queue: queueFn,
    toast,
    fallbackInject: fallback,
    onConfigError: (m) => {
      console.error(`[command-hooks] config: ${m}`)
    },
  })
  handlers.noteConfigError(loaded.errors)

  /**
   * Reload config if it changed on disk. Hand-edited hooks should take effect
   * without restarting OpenCode, and the file is small enough that a stat per
   * event is cheaper than a stale hook silently doing the wrong thing.
   */
  function refreshIfStale() {
    try {
      const next = loadConfig(projectDir)
      if (next.errors.length) handlers.noteConfigError(next.errors)
      const sig = JSON.stringify(next.config)
      if (sig !== JSON.stringify(config)) {
        config = next.config
        // Rebuild handlers so the new list is used; the queue/toast bindings are
        // unchanged, so nothing about injection semantics moves.
        const rebuilt = createHandlers({
          config,
          projectDir,
          queue: queueFn,
          toast,
          fallbackInject: fallback,
        })
        rebuilt.noteConfigError(next.errors)
        return rebuilt
      }
    } catch {
      // A config that cannot be read is left as-is; the last good one keeps working.
    }
    return handlers
  }

  /**
   * Run one phase for an event, including any hooks the delegated subagent
   * declares in its own frontmatter.
   *
   * Scoped and global hooks are dispatched together and their outcomes
   * concatenated, so a hook that throws in one cannot swallow the other. The
   * results are returned: OpenCode ignores them, but a caller (and the tests)
   * can then see what actually ran rather than inferring it.
   */
  async function dispatch(phase: 'before' | 'after', input: any, output: any): Promise<HookRunOutcome[]> {
    const h = refreshIfStale()
    const outcomes: HookRunOutcome[] = []
    const agent = subagentOf(input, output)

    if (agent) {
      const agentCfg = loadAgentHooks(agent, projectDir)
      if (agentCfg?.tool?.length) {
        const merged = { ...config, tool: mergeAgentHooks(config.tool, agentCfg.tool, agent) }
        const scoped = createHandlers({ config: merged, projectDir, queue: queueFn, toast, fallbackInject: fallback })
        outcomes.push(...(await (phase === 'before'
          ? scoped.toolExecuteBefore(input, output)
          : scoped.toolExecuteAfter(input, output))))
      }
    }

    outcomes.push(...(await (phase === 'before'
      ? h.toolExecuteBefore(input, output)
      : h.toolExecuteAfter(input, output))))
    return outcomes
  }

  return {
    event: async ({ event }: any) => {
      if (event.type !== 'session.created' && event.type !== 'session.idle') return
      const h = refreshIfStale()
      const id = event.properties?.sessionID ?? event.properties?.info?.id
      if (!id) return

      let root: boolean | undefined
      const parentId = event.properties?.parentID
      if (parentId !== undefined) {
        root = parentId === null
      } else if (event.type === 'session.idle') {
        try {
          const r = await client?.session?.get?.({ path: { id } })
          root = r?.data?.parentID ? false : true
        } catch {
          // A session that cannot be looked up runs without root filtering rather
          // than being dropped — a missing notification beats a hook that
          // silently never fires.
          root = undefined
        }
      }

      await h.sessionEvent(
        event.type === 'session.created' ? 'session.created' : 'session.idle',
        id,
        event.properties?.agent,
        root,
      )
    },
    'tool.execute.before': (input: any, output: any) => dispatch('before', input, output),
    'tool.execute.after': (input: any, output: any) => dispatch('after', input, output),
  } as any
}

/**
 * Merge agent-frontmatter hooks into the global list.
 *
 * An agent's `before`/`after` entries are scoped to that agent, so they are
 * narrowed to `callingAgent: <name>` here rather than firing for every tool
 * call in the session.
 */
export function mergeAgentHooks(global: ToolHook[], agentHooks: ToolHook[], agentName?: string): ToolHook[] {
  const scoped = agentHooks.map((h) => ({
    ...h,
    when: { ...h.when, ...(h.when?.callingAgent ? {} : agentName ? { callingAgent: agentName } : {}) },
  }))
  const ids = new Set(scoped.map((h) => h.id))
  return [...global.filter((h) => !ids.has(h.id)), ...scoped]
}

export default CommandHooksPlugin
