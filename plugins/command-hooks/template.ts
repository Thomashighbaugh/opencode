/**
 * command-hooks/template.ts — placeholder interpolation.
 *
 * Only the LAST command's output is exposed as {stdout}/{stderr}/{exitCode},
 * matching upstream. For a chain like lint → typecheck → test, the value that
 * matters is the one that failed last, and concatenating every stream makes a
 * passing lint swamp the typecheck error buried underneath it.
 *
 * {results.N.*} is a LOCAL addition: the per-command view, for the case where a
 * chain's whole point is that each step reported something.
 */

import type { CommandResult, TemplateContext } from './types.js'

/** A value rendered into a template. Objects become JSON; missing becomes "". */
function format(value: unknown): string {
  if (value === undefined || value === null) return ''
  if (typeof value === 'string') return value
  if (typeof value === 'number' || typeof value === 'boolean') return String(value)
  if (typeof value === 'object') {
    try {
      return JSON.stringify(value) ?? ''
    } catch {
      return ''
    }
  }
  return String(value)
}

const last = (results: CommandResult[]): CommandResult | undefined =>
  results.length ? results[results.length - 1] : undefined

/**
 * Replace every `{placeholder}` in `template`.
 *
 * Never throws: a template is user text, and a hook that crashes while building
 * its own message is indistinguishable from a hook that crashed while running
 * the command.
 */
export function interpolate(template: string | undefined, ctx: TemplateContext): string {
  if (!template) return ''
  const l = last(ctx.results)

  return template.replace(
    /\{(id|agent|tool|event|cmd|stdout|stderr|exitCode|args\.[^{}]+|results\.[0-9]+\.(cmd|stdout|stderr|exitCode))\}/g,
    (_whole, name: string) => {
      if (name === 'id') return ctx.id
      if (name === 'agent') return format(ctx.agent)
      if (name === 'tool') return format(ctx.tool)
      if (name === 'event') return format(ctx.event)
      if (name === 'cmd') return format(l?.cmd)
      if (name === 'stdout') return format(l?.stdout)
      if (name === 'stderr') return format(l?.stderr)
      if (name === 'exitCode') return format(l?.exitCode)

      if (name.startsWith('args.')) {
        const key = name.slice('args.'.length)
        const args = ctx.args
        // Own properties only, so `{args.toString}` does not render a function
        // body and `{args.constructor}` does not leak internals.
        if (!args || !Object.prototype.hasOwnProperty.call(args, key)) return ''
        return format(args[key])
      }

      if (name.startsWith('results.')) {
        const m = /^results\.(\d+)\.(cmd|stdout|stderr|exitCode)$/.exec(name)
        if (!m) return ''
        const r = ctx.results[Number(m[1])]
        if (!r) return ''
        return format(r[m[2] as 'cmd' | 'stdout' | 'stderr' | 'exitCode'])
      }

      return ''
    },
  )
}

/**
 * Trim a rendered message to `limit`, keeping the head.
 *
 * The head, not the tail: the first lines of a compiler or linter failure are
 * the file and the error, and a truncated-to-the-last-N version routinely drops
 * them and leaves only a stack trace.
 */
export function clampMessage(text: string, limit: number): string {
  if (limit <= 0 || text.length <= limit) return text
  const kept = text.slice(0, limit)
  return `${kept}\n[truncated: ${text.length - limit} more characters]`
}
