import { describe, it, expect } from 'vitest'
import * as fs from 'fs'
import * as path from 'path'
import { getGlobalConfigDir } from '../helpers/load-config'

// Import each hub manifest directly (vitest resolves .ts imports via vite)
import scaffoldHub from '../../tools/hub-scaffold-hub'
import resourceHub from '../../tools/hub-resource-hub'
import memoryHub from '../../tools/hub-memory-hub'
import researchHub from '../../tools/hub-research-hub'
import designHub from '../../tools/hub-design-hub'
import ideateHub from '../../tools/hub-ideate-hub'
import planHub from '../../tools/hub-plan-hub'
import verifyHub from '../../tools/hub-verify-hub'
import swarmHub from '../../tools/hub-swarm-hub'
import buildHub from '../../tools/hub-build-hub'
import orchestrateHub from '../../tools/hub-orchestrate-hub'
import gitHub from '../../tools/hub-git-hub'
import maintainHub from '../../tools/hub-maintain-hub'
import skillsHub from '../../tools/hub-skills-hub'

const GLOBAL_DIR = getGlobalConfigDir()

const hubs = [scaffoldHub, resourceHub, memoryHub, researchHub, designHub, ideateHub, planHub, verifyHub, swarmHub, buildHub, orchestrateHub, gitHub, maintainHub, skillsHub]

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
  it('loads all 14 hub definitions', () => {
    expect(hubs.length).toBe(14)
    const names = hubs.map((h) => h.name).sort()
    expect(names).toEqual(['build-hub', 'design-hub', 'git-hub', 'ideate-hub', 'maintain-hub', 'memory-hub', 'orchestrate-hub', 'plan-hub', 'research-hub', 'resource-hub', 'scaffold-hub', 'skills-hub', 'swarm-hub', 'verify-hub'].sort())
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
