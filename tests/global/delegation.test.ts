import { describe, it, expect } from 'vitest'
import * as fs from 'fs'
import * as path from 'path'
import { getGlobalConfigDir } from '../helpers/load-config'
import { HUB_FILE_MAP, LEGACY_ROUTE_MAP, loadSubcommandSpec } from '../../tools/hub-data'
import { validateTarget } from '../../tools/validate-delegation'

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

  const type = types[0] as 'skill' | 'agent' | 'command' | 'inline'
  const target = skill || agent || command || ''
  const result = validateTarget(hubName, label, type, target, GLOBAL_DIR)
  if (result.status === 'ok') return { ok: true }
  return {
    ok: false,
    message: `${hubName}/${label}: ${type} "${target}" — ${result.status}${result.error ? `: ${result.error}` : ''}`,
  }
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

// ─── validateTarget: the real function, not a copy ────────────────────────
//
// These exist because the suite above used to reimplement the path logic. The
// copy stripped `@` and the tool did not, so 21 routes read as `missing` in
// production while every test passed. Each case below runs the shipped function.

describe('validateTarget: @-prefixed agent targets', () => {
  it('resolves a bare agent name', () => {
    const r = validateTarget('ideate-hub', 'deep-thinker', 'agent', 'deep-thinker', GLOBAL_DIR)
    expect(r.status).toBe('ok')
    expect(r.resolvedPath).toBe(path.join(GLOBAL_DIR, 'agents', 'deep-thinker.md'))
  })

  it('resolves an @-prefixed agent name to the same file', () => {
    // The regression. `@analyst` names `agents/analyst.md`; probing for
    // `agents/@analyst.md` reports a route that dispatches perfectly well as
    // missing, which is how 11.5% of the manifest became a false failure.
    const bare = validateTarget('research-hub', 'analyst', 'agent', 'analyst', GLOBAL_DIR)
    const at = validateTarget('research-hub', 'analyst', 'agent', '@analyst', GLOBAL_DIR)
    expect(at.status).toBe('ok')
    expect(at.resolvedPath).toBe(bare.resolvedPath)
  })

  it('does not probe a literal @ in the filename', () => {
    const r = validateTarget('verify-hub', 'critic', 'agent', '@critic', GLOBAL_DIR)
    expect(r.resolvedPath).not.toContain('@')
  })

  it('every @-prefixed agent spec in the manifest resolves', () => {
    // The whole class, asserted against the real config rather than a sample.
    const atSpecs = hubs.flatMap((h) =>
      h.subcommands.filter((s) => s.agent?.startsWith('@')).map((s) => ({ hub: h.name, label: s.label, agent: s.agent! })),
    )
    expect(atSpecs.length).toBeGreaterThan(0)
    const broken = atSpecs
      .map((s) => validateTarget(s.hub, s.label, 'agent', s.agent, GLOBAL_DIR))
      .filter((r) => r.status !== 'ok')
    expect(broken.map((r) => `${r.hub}/${r.subcommand}`)).toEqual([])
  })
})

describe('validateTarget: other delegation types', () => {
  it('resolves a skill target to its SKILL.md', () => {
    const r = validateTarget('maintain-hub', 'self-improve', 'skill', 'self-improvement', GLOBAL_DIR)
    expect(r.status).toBe('ok')
    expect(r.resolvedPath).toMatch(/skills[\\/]self-improvement[\\/]SKILL\.md$/)
  })

  it('reports a genuinely missing target as missing', () => {
    // The other direction: the `@` fix must not turn the tool into a rubber stamp.
    const r = validateTarget('x', 'y', 'agent', '@definitely-not-a-real-agent-xyz', GLOBAL_DIR)
    expect(r.status).toBe('missing')
    expect(r.error).toBeTruthy()
  })

  it('an inline subcommand needs no target', () => {
    const r = validateTarget('build-hub', 'optimize', 'inline', '', GLOBAL_DIR)
    expect(r.status).toBe('ok')
  })

  it('an empty target on a real delegation is empty, not missing', () => {
    // Distinct statuses: "you forgot to set it" is a different bug from
    // "the file is not there", and conflating them hides the first.
    const r = validateTarget('x', 'y', 'skill', '', GLOBAL_DIR)
    expect(r.status).toBe('empty')
  })

  it('a skill target is not @-stripped into a false negative', () => {
    // The strip is agent-specific. `@skill` is not a convention, so it must
    // stay unresolved rather than silently resolving to a different skill.
    const r = validateTarget('x', 'y', 'skill', '@self-improvement', GLOBAL_DIR)
    expect(r.status).toBe('missing')
  })
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
