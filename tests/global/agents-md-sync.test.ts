/**
 * agents-md-sync.test.ts — AGENTS.md is the contract; the disk is the implementation.
 *
 * AGENTS.md is loaded into every session as an instruction. It declares: the
 * hub menus and their subcommands, the rule files in instructions[], the agent
 * roster, the skill count, the plugin list. When the disk and the document
 * disagree, the agent acts on stale instructions — routes to a subcommand that
 * was renamed, counts a skill that was deleted, or misses a rule that was added.
 *
 * The failure mode this catches: an edit to the config that updates the code
 * but forgets the document. The agent then spends a session reasoning from a
 * lie.
 *
 * Tests assert:
 *   1. every hub subcommand listed in AGENTS.md exists on disk (spec file)
 *   2. every subcommand on disk is listed in AGENTS.md (no orphan specs)
 *   3. the subcommand counts in the AGENTS.md table match the disk count
 *   4. every rule in instructions[] exists
 *   5. every agent named in the subagent roster exists on disk
 *   6. every plugin path in the config resolves to a real file
 */

import { describe, it, expect } from 'vitest'
import * as fs from 'fs'
import * as path from 'path'
import { loadConfig } from '../helpers/load-config'

const CONFIG_DIR = path.resolve(__dirname, '..', '..')
const AGENTS_MD = path.join(CONFIG_DIR, 'AGENTS.md')

const root = loadConfig(CONFIG_DIR)
if (!root) throw new Error(`No opencode.json(c) in ${CONFIG_DIR}`)
const { config } = root

const agentsMd = fs.readFileSync(AGENTS_MD, 'utf-8')

// Parse the hub table rows: | `/hub-name` | N | sub1, sub2, ... |
const HUB_ROW = /^\|\s*`\/([a-z0-9-]+)`\s*\|\s*(\d+)\s*\|\s*([^|]+)\|/gm

function getHubTable(): Array<{ hub: string; count: number; subs: string[] }> {
  const rows: Array<{ hub: string; count: number; subs: string[] }> = []
  let m: RegExpExecArray | null
  while ((m = HUB_ROW.exec(agentsMd)) !== null) {
    rows.push({
      hub: m[1],
      count: parseInt(m[2], 10),
      subs: m[3].split(',').map((s) => s.trim()).filter(Boolean),
    })
  }
  return rows
}

function getSpecFiles(hub: string): string[] {
  const dir = path.join(CONFIG_DIR, 'tools', 'hubs', hub)
  if (!fs.existsSync(dir)) return []
  return fs.readdirSync(dir)
    .filter((f) => f.endsWith('.ts') && f !== 'index.ts' && f !== 'shared-spec-fragments.ts')
    .map((f) => f.replace(/\.ts$/, ''))
}

function getAgentFiles(): string[] {
  const dir = path.join(CONFIG_DIR, 'agents')
  if (!fs.existsSync(dir)) return []
  return fs.readdirSync(dir).filter((f) => f.endsWith('.md')).map((f) => f.replace(/\.md$/, ''))
}

describe('AGENTS.md hub table matches the disk', () => {
  const rows = getHubTable()

  it('finds the hub table in AGENTS.md', () => {
    expect(rows.length).toBeGreaterThan(0)
  })

  it.each(rows)('`/%s`: AGENTS.md count matches the number of spec files on disk', ({ hub, count, subs }) => {
    const specs = getSpecFiles(hub)
    expect(specs.length, `${hub}: AGENTS.md says ${count} subcommands but disk has ${specs.length} specs`).toBe(count)
  })

  it.each(rows)('`/%s`: every subcommand listed in AGENTS.md has a spec file', ({ hub, subs }) => {
    const specs = getSpecFiles(hub)
    const missing = subs.filter((s) => !specs.includes(s))
    expect(missing, `${hub}: listed but missing spec: ${missing.join(', ')}`).toEqual([])
  })

  it.each(rows)('`/%s`: every spec file on disk is listed in AGENTS.md', ({ hub, subs }) => {
    const specs = getSpecFiles(hub)
    const orphans = specs.filter((s) => !subs.includes(s))
    expect(orphans, `${hub}: spec on disk but not in AGENTS.md: ${orphans.join(', ')}`).toEqual([])
  })

  it('the table covers every hub directory on disk', () => {
    const hubsOnDisk = fs.readdirSync(path.join(CONFIG_DIR, 'tools', 'hubs'), { withFileTypes: true })
      .filter((d) => d.isDirectory() && d.name !== 'spec-registry.json' && d.name !== 'shared-spec-fragments.ts')
      .map((d) => d.name)
    const hubsInTable = rows.map((r) => r.hub)
    const missing = hubsOnDisk.filter((h) => !hubsInTable.includes(h))
    expect(missing, `hub directories not in the AGENTS.md table: ${missing.join(', ')}`).toEqual([])
  })
})

describe('AGENTS.md references resolve', () => {
  it('every rule file named in instructions[] exists', () => {
    const instructions = (config.instructions as string[]) ?? []
    const missing = instructions.filter((p) => !fs.existsSync(path.join(CONFIG_DIR, p)))
    expect(missing, `instructions[] files missing: ${missing.join(', ')}`).toEqual([])
  })

  it('every plugin path in the config resolves to a real file', () => {
    const plugins = (config.plugin as string[]) ?? []
    const missing = plugins.filter((p) => {
      if (p.startsWith('@')) return false // npm package
      return !fs.existsSync(path.join(CONFIG_DIR, p))
    })
    expect(missing, `plugin paths missing: ${missing.join(', ')}`).toEqual([])
  })
})

describe('subagent roster matches the agents/ directory', () => {
  // The canonical subagent roster is the <Subagent_Catalog> block in
  // agents/hubs.md — the primary agent's own prompt. AGENTS.md only states the
  // count ("30 subagents"). Read the roster from hubs.md, not AGENTS.md.
  const hubsMd = fs.readFileSync(path.join(CONFIG_DIR, 'agents', 'hubs.md'), 'utf-8')
  const roster = [...hubsMd.matchAll(/^\s*-\s*`@([a-z0-9-]+)`/gm)].map((m) => m[1])

  it('hubs.md declares a subagent roster', () => {
    expect(roster.length, 'no @agent roster found in agents/hubs.md').toBeGreaterThan(0)
  })

  it('every agent named in the hubs.md roster exists on disk', () => {
    const onDisk = getAgentFiles()
    const missing = roster.filter((a) => !onDisk.includes(a))
    expect(missing, `roster agents missing on disk: ${missing.join(', ')}`).toEqual([])
  })

  it('every agent on disk is in the hubs.md roster (no orphan agents)', () => {
    const rosterSet = new Set(roster)
    const onDisk = getAgentFiles()
    // hubs is the primary, not a subagent, so it is allowed to be absent.
    const orphans = onDisk.filter((a) => a !== 'hubs' && !rosterSet.has(a))
    expect(orphans, `agents on disk not in the hubs.md roster: ${orphans.join(', ')}`).toEqual([])
  })

  it('the AGENTS.md subagent count matches the roster size', () => {
    const match = agentsMd.match(/(\d+)\s+subagents/)
    expect(match, 'AGENTS.md does not state a subagent count').toBeTruthy()
    const claimed = parseInt(match![1], 10)
    expect(claimed, `AGENTS.md claims ${claimed} subagents but hubs.md roster has ${roster.length}`).toBe(roster.length)
  })
})

describe('AGENTS.md numeric claims are accurate', () => {
  it('the skill count claim matches the actual directory count', () => {
    const match = agentsMd.match(/(\d+)\s+workflow skills/)
    expect(match, 'AGENTS.md does not state a skill count').toBeTruthy()
    const claimed = parseInt(match![1], 10)
    const actual = fs.readdirSync(path.join(CONFIG_DIR, 'skills'), { withFileTypes: true })
      .filter((d) => d.isDirectory()).length
    expect(claimed, `AGENTS.md claims ${claimed} skills but disk has ${actual} — update the count`).toBe(actual)
  })

  it('the subagent count claim matches the agents/ directory', () => {
    const match = agentsMd.match(/(\d+)\s+subagents/)
    expect(match, 'AGENTS.md does not state a subagent count').toBeTruthy()
    const claimed = parseInt(match![1], 10)
    const actual = getAgentFiles().filter((a) => a !== 'hubs').length
    expect(claimed, `AGENTS.md claims ${claimed} subagents but disk has ${actual}`).toBe(actual)
  })

  it('the hub subcommand total claim matches the table sum', () => {
    const match = agentsMd.match(/(\d+)\s+hub subcommand specs/)
    expect(match, 'AGENTS.md does not state a subcommand total').toBeTruthy()
    const claimed = parseInt(match![1], 10)
    const tableSum = getHubTable().reduce((sum, r) => sum + r.count, 0)
    expect(claimed, `AGENTS.md claims ${claimed} subcommands but the table sums to ${tableSum}`).toBe(tableSum)
  })
})
