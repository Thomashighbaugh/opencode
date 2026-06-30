import { tool } from "@opencode-ai/plugin"
import * as fs from "fs"
import * as path from "path"
import { homedir } from "os"
import { loadAllHubs } from './hub-data'

const USER_CONFIG_DIR = process.env.OPENCODE_CONFIG_DIR || path.join(homedir(), '.config', 'opencode')

interface ValidationResult {
  hub: string
  subcommand: string
  delegationType: 'skill' | 'agent' | 'command' | 'inline'
  target: string
  status: 'ok' | 'missing' | 'ambiguous' | 'empty'
  resolvedPath?: string
  error?: string
}

function validateTarget(
  hubName: string,
  subcommand: string,
  delegationType: 'skill' | 'agent' | 'command' | 'inline',
  target: string,
  projectRoot: string
): ValidationResult {
  const base: ValidationResult = {
    hub: hubName,
    subcommand,
    delegationType,
    target,
    status: 'ok',
  }

  if (!target && delegationType !== 'inline') {
    base.status = 'empty'
    base.error = 'No delegation target set'
    return base
  }

  if (delegationType === 'inline') {
    return base
  }

  // Build the relative path under user config or project .opencode/
  let relativePath: string
  switch (delegationType) {
    case 'skill':
      relativePath = path.join('skills', target, 'SKILL.md')
      break
    case 'agent':
      relativePath = path.join('agents', `${target}.md`)
      break
    case 'command':
      relativePath = path.join('commands', `${target}.md`)
      break
    default:
      base.status = 'empty'
      base.error = `Unknown delegation type: ${delegationType}`
      return base
  }

  // Check project-level .opencode/ first, then user config dir
  const projectPath = path.join(projectRoot, '.opencode', relativePath)
  const userConfigPath = path.join(USER_CONFIG_DIR, relativePath)

  if (fs.existsSync(projectPath)) {
    base.status = 'ok'
    base.resolvedPath = projectPath
  } else if (fs.existsSync(userConfigPath)) {
    base.status = 'ok'
    base.resolvedPath = userConfigPath
  } else {
    base.status = 'missing'
    base.error = `Not found at project path ${projectPath} or user config path ${userConfigPath}`
  }

  return base
}

export default tool({
  description:
    "Validate delegation targets in hubMenu.ts — check that all skill/agent/command references resolve to existing files",
  args: {
    action: tool.schema
      .string()
      .describe("Action: 'validate' runs all checks, 'stats' shows summary count"),
  },
  async execute(args, context) {
    const projectRoot = context.directory || process.cwd()
    const action = args.action as string

    if (action === 'stats') {
      let total = 0
      let ok = 0
      let missing = 0
      let warnings = 0

      for (const hub of loadAllHubs()) {
        for (const sub of hub.subcommands) {
          total++

          const types: string[] = []
          if (sub.skill) types.push('skill')
          if (sub.agent) types.push('agent')
          if (sub.command) types.push('command')
          if (sub.inline) types.push('inline')

          if (types.length === 0 || types.length > 1) {
            warnings++
            continue
          }

          const primaryType = types.find(t => t !== 'inline') || 'inline'
          if (primaryType === 'inline') {
            ok++
            continue
          }

          const target = sub.skill || sub.agent || sub.command || ''
          const result = validateTarget(hub.name, sub.label, primaryType as any, target, projectRoot)
          if (result.status === 'missing') {
            missing++
          } else {
            ok++
          }
        }
      }

      return JSON.stringify({ valid: missing === 0, total, ok, missing, warnings }, null, 2)
    }

    if (action === 'validate') {
      const results: ValidationResult[] = []

      for (const hub of loadAllHubs()) {
        for (const sub of hub.subcommands) {
          // Collect all delegation types set on this subcommand
          const types: string[] = []
          if (sub.skill) types.push('skill')
          if (sub.agent) types.push('agent')
          if (sub.command) types.push('command')
          if (sub.inline) types.push('inline')

          // No delegation type at all
          if (types.length === 0) {
            results.push({
              hub: hub.name,
              subcommand: sub.label,
              delegationType: 'inline',
              target: '',
              status: 'empty',
              error: 'No delegation type set — must have one of: skill, agent, command, inline',
            })
            continue
          }

          // Multiple delegation types — ambiguous
          const ambiguous = types.length > 1

          // Use the first non-inline type for file checking
          const primaryType = (types.find(t => t !== 'inline') || 'inline') as 'skill' | 'agent' | 'command' | 'inline'
          const target = sub.skill || sub.agent || sub.command || ''

          const result = validateTarget(hub.name, sub.label, primaryType, target, projectRoot)

          if (ambiguous) {
            result.status = 'ambiguous'
            result.error = `Multiple delegation types set: ${types.join(', ')}`
          }

          results.push(result)
        }
      }

      const total = results.length
      const okCount = results.filter(r => r.status === 'ok').length
      const missingCount = results.filter(r => r.status === 'missing').length
      const warningsCount = results.filter(r => r.status === 'ambiguous' || r.status === 'empty').length

      return JSON.stringify(
        {
          valid: missingCount === 0,
          total,
          ok: okCount,
          missing: missingCount,
          warnings: warningsCount,
          results,
        },
        null,
        2
      )
    }

    return JSON.stringify({ error: `Unknown action '${action}'. Valid: validate, stats` })
  },
})
