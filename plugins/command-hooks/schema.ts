/**
 * command-hooks/schema.ts — validation for untrusted config.
 *
 * Each config SOURCE is validated independently. A project file with a bad type
 * invalidates that file only; the global file and any agent frontmatter still
 * load. The alternative — one bad key anywhere disabling every hook in the
 * session — is the behaviour that gets a plugin uninstalled.
 *
 * Validated here rather than trusted because these files are hand-edited and,
 * for projects, authored by someone else.
 */

import type {
  CommandHooksConfig,
  HookToast,
  SessionHook,
  ToolArgMatcher,
  ToolHook,
} from './types.js'

const TOAST_VARIANTS = new Set(['info', 'success', 'warning', 'error'])
const SESSION_EVENTS = new Set(['session.created', 'session.start', 'session.idle'])

export interface ValidationResult<T> {
  config: T | null
  error: string | null
}

const isPlainObject = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v)

/** Accepts a string, or an array of strings. Rejects everything else. */
const asStringList = (v: unknown): string | null => {
  if (typeof v === 'string') return v
  if (Array.isArray(v) && v.every((x) => typeof x === 'string')) return v.join('\u0000')
  return null
}

const asPositiveInt = (v: unknown): number | null =>
  typeof v === 'number' && Number.isInteger(v) && v > 0 ? v : null

/**
 * A boolean field must be a real JSON boolean. `"true"` is a common slip and
 * silently coercing it hides a broken config until the behaviour is wrong.
 */
const asBoolean = (v: unknown): boolean | null =>
  typeof v === 'boolean' ? v : null

function validateMatcher(key: string, v: unknown): string | null {
  if (typeof v === 'string' || Array.isArray(v)) {
    return asStringList(v) === null ? `${key}: must be a string or array of strings` : null
  }
  if (!isPlainObject(v)) return `${key}: must be a string, array, {glob}, or {regex}`
  const hasGlob = typeof v.glob === 'string'
  const hasRegex = typeof v.regex === 'string'
  if (hasGlob && hasRegex) return `${key}: matcher cannot set both glob and regex`
  if (!hasGlob && !hasRegex) return `${key}: matcher must set exactly one of glob or regex`
  // Reject a bad regex now rather than at match time, where one malformed
  // pattern would throw on every tool call and take the hook down with it.
  if (hasRegex) {
    try {
      new RegExp(v.regex as string)
    } catch (e) {
      return `${key}: invalid regex — ${e instanceof Error ? e.message : String(e)}`
    }
  }
  return null
}

function validateToast(id: string, v: unknown, errs: string[]): HookToast | undefined {
  if (v === undefined) return undefined
  if (!isPlainObject(v)) {
    errs.push(`${id}.toast: must be an object`)
    return undefined
  }
  if (typeof v.message !== 'string') errs.push(`${id}.toast.message: required string`)
  if (v.title !== undefined && typeof v.title !== 'string') errs.push(`${id}.toast.title: must be a string`)
  if (v.variant !== undefined && (typeof v.variant !== 'string' || !TOAST_VARIANTS.has(v.variant))) {
    errs.push(`${id}.toast.variant: must be one of ${[...TOAST_VARIANTS].join(', ')}`)
  }
  if (v.duration !== undefined && (typeof v.duration !== 'number' || v.duration <= 0)) {
    errs.push(`${id}.toast.duration: must be a positive number`)
  }
  return v as unknown as HookToast
}

function validateReport(id: string, src: Record<string, unknown>, errs: string[]): void {
  if (src.inject !== undefined && typeof src.inject !== 'string') errs.push(`${id}.inject: must be a string`)
  if (src.injectOn !== undefined && src.injectOn !== 'always' && src.injectOn !== 'failure') {
    errs.push(`${id}.injectOn: must be "always" or "failure"`)
  }
  validateToast(id, src.toast, errs)
  if (src.run !== undefined) {
    const list = asStringList(src.run)
    if (list === null) errs.push(`${id}.run: must be a string or array of strings`)
    else if (list.length === 0) errs.push(`${id}.run: must not be empty`)
  }
}

function validateToolHook(src: unknown, errs: string[], index: number): ToolHook | null {
  if (!isPlainObject(src)) {
    errs.push(`tool[${index}]: must be an object`)
    return null
  }
  const id = typeof src.id === 'string' && src.id ? src.id : `tool[${index}]`
  if (typeof src.id !== 'string' || !src.id) errs.push(`tool[${index}].id: required non-empty string`)

  if (!isPlainObject(src.when)) {
    errs.push(`${id}.when: required object`)
    return null
  }
  const when = src.when
  if (when.phase !== 'before' && when.phase !== 'after') {
    errs.push(`${id}.when.phase: must be "before" or "after"`)
  }
  if (when.tool !== undefined && asStringList(when.tool) === null) {
    errs.push(`${id}.when.tool: must be a string or array of strings`)
  }
  if (when.callingAgent !== undefined && asStringList(when.callingAgent) === null) {
    errs.push(`${id}.when.callingAgent: must be a string or array of strings`)
  }
  if (when.toolArgs !== undefined) {
    if (!isPlainObject(when.toolArgs)) {
      errs.push(`${id}.when.toolArgs: must be an object`)
    } else {
      for (const [k, v] of Object.entries(when.toolArgs)) {
        const e = validateMatcher(`${id}.when.toolArgs.${k}`, v)
        if (e) errs.push(e)
      }
    }
  }
  if (src.overrideGlobal !== undefined && asBoolean(src.overrideGlobal) === null) {
    errs.push(`${id}.overrideGlobal: must be true or false (a string is not accepted)`)
  }
  if (src.disabled !== undefined && asBoolean(src.disabled) === null) {
    errs.push(`${id}.disabled: must be true or false (a string is not accepted)`)
  }
  validateReport(id, src, errs)

  return src as unknown as ToolHook
}

function validateSessionHook(src: unknown, errs: string[], index: number): SessionHook | null {
  if (!isPlainObject(src)) {
    errs.push(`session[${index}]: must be an object`)
    return null
  }
  const id = typeof src.id === 'string' && src.id ? src.id : `session[${index}]`
  if (typeof src.id !== 'string' || !src.id) errs.push(`session[${index}].id: required non-empty string`)

  if (!isPlainObject(src.when)) {
    errs.push(`${id}.when: required object`)
    return null
  }
  if (typeof src.when.event !== 'string' || !SESSION_EVENTS.has(src.when.event)) {
    errs.push(`${id}.when.event: must be one of ${[...SESSION_EVENTS].join(', ')}`)
  }
  if (src.when.agent !== undefined && asStringList(src.when.agent) === null) {
    errs.push(`${id}.when.agent: must be a string or array of strings`)
  }
  if (src.when.rootSessionOnly !== undefined && asBoolean(src.when.rootSessionOnly) === null) {
    errs.push(`${id}.when.rootSessionOnly: must be true or false`)
  }
  if (src.overrideGlobal !== undefined && asBoolean(src.overrideGlobal) === null) {
    errs.push(`${id}.overrideGlobal: must be true or false`)
  }
  if (src.disabled !== undefined && asBoolean(src.disabled) === null) {
    errs.push(`${id}.disabled: must be true or false`)
  }
  validateReport(id, src, errs)

  return src as unknown as SessionHook
}

/**
 * Validate one config source. Returns the config unchanged on success; on any
 * error returns `null` plus every problem found, so a user can fix the file in
 * one pass instead of one error per reload.
 */
export function validateConfig(raw: unknown): ValidationResult<CommandHooksConfig> {
  const errs: string[] = []
  if (!isPlainObject(raw)) {
    return { config: null, error: 'config must be a JSON object' }
  }

  if (raw.truncationLimit !== undefined && asPositiveInt(raw.truncationLimit) === null) {
    errs.push('truncationLimit: must be a positive integer')
  }
  if (raw.injectLimit !== undefined && asPositiveInt(raw.injectLimit) === null) {
    errs.push('injectLimit: must be a positive integer')
  }
  if (raw.ignoreGlobalConfig !== undefined && asBoolean(raw.ignoreGlobalConfig) === null) {
    errs.push('ignoreGlobalConfig: must be true or false (a string is not accepted)')
  }

  const tool: ToolHook[] = []
  if (raw.tool !== undefined) {
    if (!Array.isArray(raw.tool)) errs.push('tool: must be an array')
    else raw.tool.forEach((h, i) => { const v = validateToolHook(h, errs, i); if (v) tool.push(v) })
  }
  const session: SessionHook[] = []
  if (raw.session !== undefined) {
    if (!Array.isArray(raw.session)) errs.push('session: must be an array')
    else raw.session.forEach((h, i) => { const v = validateSessionHook(h, errs, i); if (v) session.push(v) })
  }

  // Duplicate ids within one source are an error, not a merge: two hooks with
  // the same id cannot both be overridden by id later, so the ambiguity has to
  // surface at the source rather than as a hook that silently wins.
  for (const [kind, list] of [['tool', tool], ['session', session]] as const) {
    const seen = new Set<string>()
    for (const h of list) {
      if (seen.has(h.id)) errs.push(`${kind}: duplicate id "${h.id}"`)
      seen.add(h.id)
    }
  }

  if (errs.length) return { config: null, error: errs.join('; ') }
  return { config: { tool, session, ...(raw as CommandHooksConfig) } as CommandHooksConfig, error: null }
}

/** Narrow a config value known to have passed `validateConfig`. */
export function matcherFrom(v: ToolArgMatcher): ToolArgMatcher {
  return v
}
