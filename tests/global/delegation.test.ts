import { describe, it, expect } from 'vitest'
import * as fs from 'fs'
import * as path from 'path'
import { getGlobalConfigDir } from '../helpers/load-config'

// Import each hub manifest directly (vitest resolves .ts imports via vite)
import initProjectHub from '../../tools/hub-init-project'
import ideationHub from '../../tools/hub-ideation'
import orchestrateHub from '../../tools/hub-orchestrate'
import harvestContextHub from '../../tools/hub-harvest-context'
import projectHub from '../../tools/hub-project'
import skillsHub from '../../tools/hub-skills'

const GLOBAL_DIR = getGlobalConfigDir()

const hubs = [initProjectHub, ideationHub, orchestrateHub, harvestContextHub, projectHub, skillsHub]

function checkDelegation(
  label: string,
  hubName: string,
  skill?: string,
  agent?: string,
  command?: string,
  inline?: boolean,
): { ok: boolean; message?: string } {
  const types: string[] = []
  if (skill) types.push('skill')
  if (agent) types.push('agent')
  if (command) types.push('command')
  if (inline) types.push('inline')

  if (types.length === 0) {
    return { ok: false, message: `${hubName}/${label}: no delegation type` }
  }

  if (types.length > 1) {
    return { ok: false, message: `${hubName}/${label}: ambiguous (${types.join(', ')})` }
  }

  if (inline) return { ok: true }

  const type = types[0]
  const target = skill || agent || command || ''

  if (!target) {
    return { ok: false, message: `${hubName}/${label}: ${type} target empty` }
  }

  let relativePath: string
  switch (type) {
    case 'skill':
      relativePath = path.join('skills', target, 'SKILL.md')
      break
    case 'agent':
      // Strip @ prefix if present (agent references use @name convention, but filenames don't)
      relativePath = path.join('agents', `${target.replace(/^@/, '')}.md`)
      break
    case 'command':
      relativePath = path.join('commands', `${target}.md`)
      break
    default:
      return { ok: false, message: `${hubName}/${label}: unknown type ${type}` }
  }

  const resolved = path.join(GLOBAL_DIR, relativePath)
  if (fs.existsSync(resolved)) return { ok: true }
  return { ok: false, message: `${hubName}/${label}: ${type} "${target}" missing at ${resolved}` }
}

describe('hub subcommand delegation', () => {
  it('loads all 6 hub definitions', () => {
    expect(hubs.length).toBe(6)
    const names = hubs.map((h) => h.name).sort()
    expect(names).toEqual([
      'harvest-context',
      'ideation',
      'init-project',
      'orchestrate',
      'project',
      'skills',
    ])
  })

  for (const hub of hubs) {
    describe(`${hub.name} (${hub.subcommands.length} subcommands)`, () => {
      it.each(hub.subcommands.map((s) => ({
        label: s.label,
        skill: s.skill,
        agent: s.agent,
        command: s.command,
        inline: s.inline,
      })))('$label resolves to valid target', ({ label, skill, agent, command, inline }) => {
        const result = checkDelegation(label, hub.name, skill, agent, command, inline)
        expect(result.ok, result.message || '').toBe(true)
      })
    })
  }
})
