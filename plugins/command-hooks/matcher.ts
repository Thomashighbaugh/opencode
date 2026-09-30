/**
 * command-hooks/matcher.ts — deciding which hooks fire.
 *
 * Two decisions live here: whether a hook's `when` block matches the current
 * event, and which hooks a project config suppresses via `overrideGlobal`.
 * Kept separate from execution so both are testable without spawning a process.
 */

import type { SessionEvent, SessionHook, ToolArgMatcher, ToolHook, ToolHookWhen } from './types.js'

/**
 * Glob and regex options are pinned rather than inherited from the library
 * default. A leading `!` is a literal character, not an implicit negation, and a
 * leading `#` is not a comment — both are plausible things to type in a config
 * file, and silently flipping the meaning of `!important.ts` is worse than
 * reporting that the pattern never matches.
 */
const GLOB_OPTIONS = { nonegate: true, strictBrackets: true } as const

const globCache = new Map<string, RegExp | null>()

/** Compile a glob, caching both hits and misses so a bad pattern costs once. */
export function compileGlob(pattern: string): RegExp | null {
  if (globCache.has(pattern)) return globCache.get(pattern)!
  let re: RegExp | null = null
  try {
    // picomatch is the matcher OpenCode's own Glob tool uses, so a pattern that
    // works here works there. Resolved lazily: this module is imported by the
    // config validator, which must not require the dependency to be present.
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const pm = requirePicomatch()
    re = pm ? pm.makeRe(pattern, GLOB_OPTIONS) : globFallback(pattern)
  } catch {
    re = null
  }
  globCache.set(pattern, re)
  return re
}

function requirePicomatch(): { makeRe: (p: string, o: object) => RegExp } | null {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require('picomatch')
  } catch {
    return null
  }
}

/**
 * Minimal glob → RegExp for the common cases, used only when picomatch cannot be
 * resolved. Supports `*`, `**`, `?`, and `{a,b}` alternation — enough that a
 * missing optional dependency degrades matching rather than breaking it.
 */
export function globFallback(pattern: string): RegExp {
  let out = ''
  for (let i = 0; i < pattern.length; i++) {
    const c = pattern[i]
    if (c === '*') {
      if (pattern[i + 1] === '*') {
        // `**/` should also match zero directories, so `**/x` matches `x`.
        if (pattern[i + 2] === '/') { out += '(?:.*/)?'; i += 2 } else { out += '.*'; i += 1 }
      } else {
        out += '[^/]*'
      }
    } else if (c === '?') out += '[^/]'
    else if (c === '{') {
      const close = pattern.indexOf('}', i)
      if (close === -1) { out += '\\{' ; continue }
      const alts = pattern.slice(i + 1, close).split(',')
      out += `(?:${alts.map((a) => a.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`
      i = close
    } else out += c.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  }
  return new RegExp(`^${out}$`)
}

export function compileRegex(pattern: string): RegExp | null {
  try {
    return new RegExp(pattern)
  } catch {
    return null
  }
}

/** `undefined` matches everything; `"*"` matches everything; arrays match any member. */
function matchesName(pattern: string | string[] | undefined, value: string | undefined): boolean {
  if (pattern === undefined) return true
  if (typeof pattern === 'string') {
    if (pattern === '*') return true
    return value !== undefined && pattern === value
  }
  if (!Array.isArray(pattern)) return false
  if (pattern.includes('*')) return true
  if (value === undefined) return false
  return pattern.includes(value)
}

/**
 * Match one tool argument.
 *
 * A runtime value that is not a string can only satisfy an exact match. A glob
 * or regex against, say, an array silently matching `String(value)` would make
 * `{content: {regex: "TODO"}}` match an object whose JSON happens to contain
 * TODO, which is not what a pattern in a config file is understood to mean.
 */
export function matchesArg(matcher: ToolArgMatcher, value: unknown): boolean {
  if (typeof matcher === 'string') {
    if (matcher === '*') return true
    return typeof value === 'string' && value === matcher
  }
  if (Array.isArray(matcher)) {
    if (matcher.includes('*')) return true
    return typeof value === 'string' && matcher.includes(value)
  }
  if (matcher && typeof matcher === 'object') {
    if (typeof value !== 'string') return false
    if (typeof matcher.glob === 'string') {
      const re = compileGlob(matcher.glob)
      return re ? re.test(value) : false
    }
    if (typeof matcher.regex === 'string') {
      const re = compileRegex(matcher.regex)
      return re ? re.test(value) : false
    }
  }
  return false
}

export interface ToolMatchContext {
  phase: 'before' | 'after'
  tool?: string
  agent?: string
  args?: Record<string, unknown>
}

export function toolHookMatches(hook: ToolHook, ctx: ToolMatchContext): boolean {
  const when: ToolHookWhen = hook.when
  if (when.phase !== ctx.phase) return false
  if (!matchesName(when.tool, ctx.tool)) return false
  if (when.callingAgent !== undefined && !matchesName(when.callingAgent, ctx.agent)) return false
  if (when.toolArgs) {
    const args = ctx.args
    // Every configured key must match. A filter on a key the tool did not
    // receive fails rather than passes: "inject only when path is src/**" must
    // not fire for a call that had no path at all.
    for (const [key, matcher] of Object.entries(when.toolArgs)) {
      if (!args || !Object.prototype.hasOwnProperty.call(args, key)) return false
      if (!matchesArg(matcher, args[key])) return false
    }
  }
  return true
}

export interface SessionMatchContext {
  /** Accepts either spelling of the start event; the alias is resolved here. */
  event: SessionEvent | 'session.start'
  agent?: string
  rootSession?: boolean
}

/**
 * `session.start` is an alias for `session.created`, and the alias is resolved
 * HERE rather than at the one call site that dispatches it. Resolving it in the
 * plugin's event switch meant a hook declaring `session.start` was dead whenever
 * the event arrived under the canonical name — the documented spelling silently
 * matched nothing.
 */
function canonicalEvent(event: string): string {
  return event === 'session.start' ? 'session.created' : event
}

export function sessionHookMatches(hook: SessionHook, ctx: SessionMatchContext): boolean {
  const { event, agent, rootSession } = ctx
  if (canonicalEvent(hook.when.event) !== canonicalEvent(event)) return false
  if (hook.when.agent !== undefined && !matchesName(hook.when.agent, agent)) return false
  // `rootSessionOnly` defaults to true for idle and false elsewhere: a finished
  // subagent's child session going idle is not the user being prompted, and
  // notifying on it produces a notification storm mid-fan-out.
  const rootOnly = hook.when.rootSessionOnly ?? canonicalEvent(event) === 'session.idle'
  if (rootOnly && rootSession === false) return false
  return true
}

/**
 * Ids of global hooks suppressed by a local `overrideGlobal`.
 *
 * The canonical key is phase+tool rather than the raw declaration, so a global
 * hook written against `"bash"` is suppressed by a project hook written against
 * `["bash"]`. Without that normalisation the override silently misses the hooks
 * it exists to replace, which is the worst possible failure mode for a
 * replacement mechanism.
 */
export function overrideSignature(phase: string, tool: string | string[] | undefined): string {
  const tools = tool === undefined ? '*' : Array.isArray(tool) ? [...tool].sort().join(',') : tool
  return `${phase}::${tools}`
}

export function suppressedByOverride(local: ToolHook[], globals: ToolHook[]): Set<string> {
  const signatures = new Set<string>()
  for (const h of local) {
    if (h.overrideGlobal && h.when) {
      signatures.add(overrideSignature(h.when.phase, h.when.tool))
    }
  }
  if (!signatures.size) return new Set()
  const out = new Set<string>()
  for (const g of globals) {
    if (!g.when) continue
    // Intersection, not a one-way signature lookup. A global hook on tool "*"
    // matches every tool, so an override naming any one of them replaces it —
    // checking only the global's own tool names against the override signature
    // left "*" unsuppressable, which is precisely the hook a project is most
    // likely to want to replace.
    const globalTools = toolList(g.when.tool)
    for (const sig of signatures) {
      const [phase, tools] = splitSignature(sig)
      if (phase !== g.when.phase) continue
      const overrideTools = toolList(tools as any)
      // "*" is universal on either side: a hook on every tool overlaps a hook on
      // one tool, and vice versa.
      const overlaps =
        globalTools.includes('*') ||
        overrideTools.includes('*') ||
        globalTools.some((t) => overrideTools.includes(t))
      if (overlaps) {
        out.add(g.id)
        break
      }
    }
  }
  return out
}

const toolList = (tool: string | string[] | undefined): string[] =>
  tool === undefined ? ['*'] : Array.isArray(tool) ? tool : [tool]

function splitSignature(sig: string): [string, string] {
  const i = sig.indexOf('::')
  return [sig.slice(0, i), sig.slice(i + 2)]
}

export function sessionSuppressedByOverride(local: SessionHook[], globals: SessionHook[]): Set<string> {
  const events = new Set<string>()
  for (const h of local) {
    if (h.overrideGlobal && h.when) events.add(canonicalEvent(h.when.event))
  }
  if (!events.size) return new Set()
  const out = new Set<string>()
  for (const g of globals) if (g.when && events.has(canonicalEvent(g.when.event))) out.add(g.id)
  return out
}
