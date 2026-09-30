import { describe, it, expect } from 'vitest'
import * as fs from 'fs'
import * as path from 'path'
import { getGlobalConfigDir } from '../helpers/load-config'
import { HUB_FILE_MAP, LEGACY_ROUTE_MAP, loadSubcommandSpec } from '../../tools/hub-data'

// Import each hub manifest directly (vitest resolves .ts imports via vite)
import hubSetupHub from '../../tools/hub-hub-setup'
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

const hubs = [hubSetupHub, resourceHub, memoryHub, researchHub, designHub, ideateHub, planHub, verifyHub, swarmHub, buildHub, orchestrateHub, gitHub, maintainHub, skillsHub]

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
    expect(names).toEqual(['build-hub', 'design-hub', 'git-hub', 'ideate-hub', 'maintain-hub', 'memory-hub', 'orchestrate-hub', 'plan-hub', 'research-hub', 'hub-setup', 'resource-hub', 'skills-hub', 'swarm-hub', 'verify-hub'].sort())
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

// ─── scaffold-hub was erased into hub-setup ─────────────────────────────
// `/scaffold-hub` named one phase of a job with twelve phases, so a user
// looking for "refresh my project config" had no reason to open it. It was
// merged into `/hub-setup` wholesale. These tests pin the merge: the full
// subcommand set carried across, the old menu is really gone, and both
// superseded names still resolve.

describe('scaffold-hub merged into hub-setup', () => {
  const SCAFFOLD_LABELS = [
    'config', 'detect', 'doctor', 'map-codebase', 'provision', 'recommend',
    'refresh', 'reset', 'setup', 'status', 'tag', 'verify',
  ]

  it('hub-setup carries all twelve scaffold-hub subcommands', () => {
    expect(hubSetupHub.subcommands.map(s => s.label).sort()).toEqual([...SCAFFOLD_LABELS].sort())
  })

  it('the erased menu has no manifest, no route entry, and no spec directory', () => {
    expect(Object.keys(HUB_FILE_MAP)).not.toContain('scaffold-hub')
    expect(fs.existsSync(path.join(GLOBAL_DIR, 'tools', 'hub-scaffold-hub.ts'))).toBe(false)
    expect(fs.existsSync(path.join(GLOBAL_DIR, 'tools', 'hubs', 'scaffold-hub'))).toBe(false)
  })

  it.each(SCAFFOLD_LABELS)('hub-setup %s loads a real spec', (label) => {
    const spec = loadSubcommandSpec('hub-setup', label)
    expect(spec, `hub-setup/${label} has no spec`).not.toBeNull()
    expect(spec!.label).toBe(label)
  })

  it.each(SCAFFOLD_LABELS)('the old /scaffold-hub %s still routes to hub-setup', (label) => {
    expect(loadSubcommandSpec('scaffold-hub', label)).toEqual(loadSubcommandSpec('hub-setup', label))
  })

  it.each(['setup', 'refresh', 'provision', 'status', 'verify'])(
    'the original /init-project %s still resolves', (label) => {
      expect(loadSubcommandSpec('init-project', label)).not.toBeNull()
    })

  it('every legacy route points at a hub that exists', () => {
    // A rename that leaves a route aimed at a deleted hub fails only when a user
    // types the old name — the worst possible moment to discover it.
    const dead = Object.entries(LEGACY_ROUTE_MAP)
      .map(([, target]) => target.slice(0, target.indexOf('/')))
      .filter(h => !HUB_FILE_MAP[h])
    expect([...new Set(dead)]).toEqual([])
  })

  it('hub-setup keeps scaffold-hub state dir so old checkpoints still resolve', () => {
    expect(hubSetupHub.stateDir).toBe('init')
  })
})
