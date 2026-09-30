import { describe, it, expect } from 'vitest'
import * as fs from 'fs'
import * as path from 'path'
import * as glob from 'glob'
import { loadConfig } from '../helpers/load-config'

/**
 * feature-package.test.ts — inventory integrity.
 *
 * The recurring failure mode in this configuration was not a crash. It was
 * something that LOOKS wired up and quietly does nothing: a cache probe that
 * reads a value and discards it, an invalidation keyed on a hash so it never
 * matches, a gate whose short-circuit was never taken, documentation naming a
 * file at a path that had moved. All of those pass a "does it exist?" test and
 * fail a "does it DO anything?" one.
 *
 * So this layer asserts three things for every part of the package:
 *   1. it exists,
 *   2. it is registered (nothing on disk is orphaned from the config),
 *   3. it is internally consistent (its own declared references resolve).
 */

const CONFIG_DIR = path.resolve(__dirname, '..', '..')
const root = loadConfig(CONFIG_DIR)!
const { config } = root

const readJson = <T = any>(p: string): T => JSON.parse(fs.readFileSync(p, 'utf-8'))
const registry = readJson(path.join(CONFIG_DIR, 'tools', 'hubs', 'spec-registry.json'))

const HUB_DIRS = fs
  .readdirSync(path.join(CONFIG_DIR, 'tools', 'hubs'), { withFileTypes: true })
  .filter((d) => d.isDirectory() && d.name !== 'spec-registry.json')
  .map((d) => d.name)
  .sort()

/**
 * Skills with no SKILL.md frontmatter, and therefore invisible to the skill
 * loader. Each is a legacy directory that the *-hub menus replaced (see
 * LEGACY_ROUTE_MAP in tools/hub-data.ts); nothing routes to them.
 *
 * They are deliberately NOT given frontmatter. Doing so would advertise them in
 * the system prompt on every session — roughly 60 tokens each, permanently —
 * for a skill no hub can reach. That is a token-efficiency regression for zero
 * benefit, which is the same trade rules/efficiency-first.md is written to
 * prevent. Removing the directories is the cleaner fix and is left as a
 * deliberate decision rather than taken unilaterally.
 */
const FRONTMATTER_LESS_ALLOWLIST = ['harvest-context', 'ideation', 'orchestrate', 'project']

describe('feature package: hubs', () => {
  it('has hub directories', () => {
    expect(HUB_DIRS.length).toBeGreaterThan(0)
  })

  it.each(HUB_DIRS)('%s has an index.ts exporting an identity slice', (hub) => {
    const idx = path.join(CONFIG_DIR, 'tools', 'hubs', hub, 'index.ts')
    expect(fs.existsSync(idx), `missing ${idx}`).toBe(true)
    const src = fs.readFileSync(idx, 'utf-8')
    expect(src).toMatch(/export\s+(const|default)/)
  })

  it.each(HUB_DIRS)('%s thin manifest exists in tools/hub-<name>.ts', (hub) => {
    const manifest = path.join(CONFIG_DIR, 'tools', `hub-${hub}.ts`)
    expect(fs.existsSync(manifest), `missing ${manifest} for hub dir ${hub}`).toBe(true)
  })

  it('every spec-registry entry belongs to a real hub directory', () => {
    const bad: string[] = []
    for (const key of Object.keys(registry)) {
      const hub = key.split('/')[0]
      if (!HUB_DIRS.includes(hub)) bad.push(`${key} -> ${hub}`)
    }
    expect(bad, `orphan registry keys:\n${bad.join('\n')}`).toEqual([])
  })

  it('every spec-registry entry has the fields the TUI needs', () => {
    const bad: string[] = []
    for (const [key, spec] of Object.entries<any>(registry)) {
      if (!spec.label) bad.push(`${key}: no label`)
      if (spec.label && String(spec.label).length > 40) bad.push(`${key}: label ${String(spec.label).length} chars`)
      if (!spec.description) bad.push(`${key}: no description`)
    }
    expect(bad.slice(0, 10), `${bad.length} malformed specs`).toEqual([])
  })

  it('TUI descriptions fit the dialog and are distinguishable', () => {
    // The hub name is not visible in the TUI list, so a description must be
    // self-contained. Two subcommands with the same description are
    // indistinguishable to a user choosing between them.
    const byHub = new Map<string, Map<string, string>>()
    const bad: string[] = []
    for (const [key, spec] of Object.entries<any>(registry)) {
      const hub = key.split('/')[0]
      if (!byHub.has(hub)) byHub.set(hub, new Map())
      const m = byHub.get(hub)!
      const prev = m.get(spec.description)
      if (prev) bad.push(`${hub}: "${spec.description}" shared by ${prev} and ${key}`)
      // Length conformance is measured in the dedicated gap test below; this
      // one covers the property that cannot be measured numerically — two
      // subcommands in the same hub reading identically to a user choosing
      // between them.
      m.set(spec.description, key)
    }
    expect(bad.slice(0, 10), `${bad.length} indistinguishable descriptions`).toEqual([])
  })

  it('every on-demand rule is named by something that can load it', () => {
    // The orphan problem in one assertion: a rule nobody references is a file
    // no agent will ever read, however good its advice.
    const onDemand = ['coding-style.md', 'git-workflow.md', 'performance.md', 'testing.md',
      'global-reference.md', 'hub-routing.md', 'hub-state.md', 'resource-tags.md']
    // Referrers live in more than skills: the on-demand hub rules are named from
    // the hub specs and from rules/AGENTS.md, and `hub-state`/`resource-tags` are
    // reached through `global-reference`. Scanning only skills reported three
    // perfectly-wired rules as orphans.
    //
    // Matched on the bare FILENAME, because that is how these are written in
    // practice — `hub-routing.md`, not `rules/hub-routing.md` — and requiring the
    // prefix reported rules that are referenced three times as dead. A rule
    // naming itself is excluded: self-reference is not wiring.
    const consumerFiles = [
      ...glob.sync(path.join(CONFIG_DIR, 'skills', '*', 'SKILL.md')),
      ...glob.sync(path.join(CONFIG_DIR, 'skills', '*', 'references', '*.md')),
      ...glob.sync(path.join(CONFIG_DIR, 'agents', '*.md')),
      ...glob.sync(path.join(CONFIG_DIR, 'rules', '*.md')),
      ...glob.sync(path.join(CONFIG_DIR, 'tools', 'hubs', '*', '*.ts')),
    ]
    const orphans = onDemand.filter((rule) => {
      const self = path.join(CONFIG_DIR, 'rules', rule)
      return !consumerFiles.some((f) => f !== self && fs.readFileSync(f, 'utf-8').includes(rule))
    })
    expect(orphans, `on-demand rules with no referrer: ${orphans.join(', ')}`).toEqual([])
  })

  it('the on-demand rules are documented where a reader will look', () => {
    const doc = fs.readFileSync(path.join(CONFIG_DIR, 'rules', 'AGENTS.md'), 'utf-8')
    for (const r of ['coding-style.md', 'git-workflow.md', 'performance.md', 'testing.md']) {
      expect(doc, `${r} is not in the on-demand table`).toContain(r)
    }
  })

  it('every subcommand description fits the dialog and is self-contained', () => {
    // Was: 95 of 183 over the 80-char target, 70 of them over 100, the longest
    // 243. rules/hub-description-directive.md set the limit and the TUI truncated
    // past it, so the descriptions that were supposed to help a user choose were
    // the part of the line they could not read. Every one was rewritten to say
    // what the subcommand does plus what distinguishes it, without naming its
    // hub — the hub name is not visible in the dialog.
    const over = Object.entries<any>(registry)
      .filter(([, v]) => String(v.description).length > 80)
      .map(([k, v]) => `${k} (${String(v.description).length})`)
    expect(over, `${over.length} description(s) exceed 80 chars: ${over.slice(0, 5).join(', ')}`).toEqual([])
  })

  it('a description does not lean on the hub name being visible', () => {
    // The dialog shows the subcommand name in a flat list; "Configure X" is
    // ambiguous when three hubs have a configure.
    const leaning = Object.entries<any>(registry)
      .filter(([key, v]) => {
        const text = String(v.description).toLowerCase()
        const hub = key.split('/')[0]
        return new RegExp(`^\\s*${hub}\\b`).test(text) || new RegExp(`\\b${hub}\\b`).test(text)
      })
      .map(([k, v]) => `${k}: ${v.description}`)
    expect(leaning.slice(0, 5), `${leaning.length} description(s) assume the hub name is visible`).toEqual([])
  })

  it('the generated TUI bundle contains every registered subcommand', () => {
    // hub-menu-rebuild rule: a new subcommand is invisible until the generated
    // bundle is regenerated. This is the check that rule exists to enforce.
    //
    // The comparison is against each spec's `label`, NOT the registry key. The
    // two are deliberately different namespaces — the key is the file
    // (ideate-hub/interview) while the label is what the dialog shows
    // ("deep") — and an earlier version of this test compared against the key
    // and reported five phantom stale subcommands that had been correct all
    // along.
    const generated = path.join(CONFIG_DIR, 'plugins', 'hubs-tui', 'src', 'generated-hubs.ts')
    if (!fs.existsSync(generated)) return
    const src = fs.readFileSync(generated, 'utf-8')
    const missing: string[] = []
    for (const key of Object.keys(registry)) {
      const [hubDir, file] = key.split('/')
      const specFile = path.join(CONFIG_DIR, 'tools', 'hubs', hubDir, `${file}.ts`)
      if (!fs.existsSync(specFile)) { missing.push(`${key} (no spec file)`); continue }
      const specSrc = fs.readFileSync(specFile, 'utf-8')
      const label = specSrc.match(/label:\s*["']([^"']+)["']/)?.[1]
      if (!label) { missing.push(`${key} (no label)`); continue }
      if (!src.includes(`"${label}"`)) missing.push(`${key} (label "${label}")`)
    }
    expect(missing.slice(0, 15), `generated-hubs.ts is stale — missing ${missing.length}:\n${missing.join('\n')}`).toEqual([])
  })

  it('every subcommand label is unique within its hub', () => {
    // The label is the token the user types after the hub name, so two
    // subcommands sharing one is an ambiguous command. Distinctness matters far
    // more than whether the label happens to match the source filename — which
    // it usually does, and should.
    const byHub = new Map<string, Map<string, string[]>>()
    for (const key of Object.keys(registry)) {
      const [hub, file] = key.split('/')
      const specFile = path.join(CONFIG_DIR, 'tools', 'hubs', hub, `${file}.ts`)
      if (!fs.existsSync(specFile)) continue
      const label = fs.readFileSync(specFile, 'utf-8').match(/label:\s*["']([^"']+)["']/)?.[1]
      if (!label) continue
      if (!byHub.has(hub)) byHub.set(hub, new Map())
      const m = byHub.get(hub)!
      m.set(label, [...(m.get(label) || []), key])
    }
    const clashes: string[] = []
    for (const [hub, m] of byHub) {
      for (const [label, keys] of m) if (keys.length > 1) clashes.push(`${hub}: "${label}" -> ${keys.join(', ')}`)
    }
    expect(clashes, `ambiguous subcommand labels: ${clashes.join('; ')}`).toEqual([])
  })
})

describe('feature package: skills', () => {
  const skillDirs = fs
    .readdirSync(path.join(CONFIG_DIR, 'skills'), { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .sort()

  it('has skills', () => {
    expect(skillDirs.length).toBeGreaterThan(0)
  })

  it.each(skillDirs.filter((s) => FRONTMATTER_LESS_ALLOWLIST.includes(s)))(
    '%s is a known legacy skill with no frontmatter',
    (skill) => {
      const raw = fs.readFileSync(path.join(CONFIG_DIR, 'skills', skill, 'SKILL.md'), 'utf-8')
      expect(raw, `${skill} is on the legacy allowlist but now has frontmatter — remove it from the list`)
        .not.toMatch(/^---\r?\n/)
    },
  )

  it('every skill has frontmatter unless it is on the legacy allowlist', () => {
    // The skill loader derives name/description from frontmatter, so a skill
    // without it is INVISIBLE: it never appears in the system prompt and cannot
    // be loaded by name. That is only acceptable for a skill nothing routes to.
    // init-project had no frontmatter while four hub specs delegated to it.
    const noFrontmatter = skillDirs.filter((s) => {
      const f = path.join(CONFIG_DIR, 'skills', s, 'SKILL.md')
      if (!fs.existsSync(f)) return false
      return !/^---\r?\n/.test(fs.readFileSync(f, 'utf-8'))
    })
    const unexpected = noFrontmatter.filter((s) => !FRONTMATTER_LESS_ALLOWLIST.includes(s))
    expect(unexpected, `skills with no frontmatter and not on the legacy allowlist: ${unexpected.join(', ')}`).toEqual([])
  })

  it('no hub spec delegates to a skill the loader cannot see', () => {
    // The concrete failure this catches: a delegation pointing at a skill with
    // no frontmatter is a dead reference the resolver cannot catch, because the
    // directory exists.
    const noFrontmatter = new Set(
      skillDirs.filter((s) => {
        const f = path.join(CONFIG_DIR, 'skills', s, 'SKILL.md')
        if (!fs.existsSync(f)) return false
        return !/^---\r?\n/.test(fs.readFileSync(f, 'utf-8'))
      }),
    )
    const dead: string[] = []
    for (const hub of HUB_DIRS) {
      const dir = path.join(CONFIG_DIR, 'tools', 'hubs', hub)
      for (const f of fs.readdirSync(dir).filter((x) => x.endsWith('.ts') && x !== 'index.ts')) {
        const src = fs.readFileSync(path.join(dir, f), 'utf-8')
        for (const m of src.matchAll(/skill:\s*["']([\w.-]+)["']/g)) {
          if (noFrontmatter.has(m[1])) dead.push(`${hub}/${f.replace(/\.ts$/, '')} -> ${m[1]}`)
        }
      }
    }
    expect(dead, `hub specs delegating to skills the loader cannot see:\n${dead.join('\n')}`).toEqual([])
  })

  it('every skill frontmatter name, when present, matches its directory', () => {
    // A name that disagrees with the directory is a live hazard: the system
    // prompt advertises `plan` (directory) while the file says `omc-plan`, so
    // anything that resolves a skill by directory and looks it up by name — or
    // the reverse — silently finds nothing.
    const mismatched: string[] = []
    const missing: string[] = []
    for (const skill of skillDirs) {
      const file = path.join(CONFIG_DIR, 'skills', skill, 'SKILL.md')
      if (!fs.existsSync(file)) continue
      const m = fs.readFileSync(file, 'utf-8').match(/^---\r?\n([\s\S]*?)\r?\n---/)!
      if (!m) continue
      const nm = m[1].match(/^name:\s*(.+)$/m)?.[1]?.trim()
      if (!nm) { missing.push(skill); continue }
      if (nm !== skill) mismatched.push(`${skill} -> "${nm}"`)
    }
    expect(mismatched, `frontmatter name != directory: ${mismatched.join(', ')}`).toEqual([])
    expect(missing, `skills with no frontmatter name: ${missing.join(', ')}`).toEqual([])
  })

  it('every script a SKILL.md names actually exists', () => {
    // The .mjs -> .ts conversion moved 22 files. A doc naming the old
    // extension is a silently broken instruction to the agent reading it.
    const bad: string[] = []
    for (const skill of skillDirs) {
      const file = path.join(CONFIG_DIR, 'skills', skill, 'SKILL.md')
      if (!fs.existsSync(file)) continue
      const raw = fs.readFileSync(file, 'utf-8')
      for (const m of raw.matchAll(new RegExp(`skills/${skill}/scripts/([\\w.-]+\\.[a-z]+)`, 'g'))) {
        const rel = `skills/${skill}/scripts/${m[1]}`
        if (!fs.existsSync(path.join(CONFIG_DIR, rel))) bad.push(`${skill}/SKILL.md -> ${rel}`)
      }
    }
    expect(bad.slice(0, 20), `${bad.length} SKILL.md script references do not resolve:\n${bad.join('\n')}`).toEqual([])
  })

  it('no SKILL.md names a .mjs script from its OWN scripts/ dir (tree was converted)', () => {
    // Scoped to `skills/<name>/scripts/`: a skill may legitimately reference an
    // external plugin's .mjs (team/cancel reference cleanup-orphans.mjs from
    // OPENCODE_PLUGIN_ROOT, which is not ours).
    const offenders: string[] = []
    for (const skill of skillDirs) {
      const file = path.join(CONFIG_DIR, 'skills', skill, 'SKILL.md')
      if (!fs.existsSync(file)) continue
      for (const m of fs.readFileSync(file, 'utf-8').matchAll(new RegExp(`skills/${skill}/scripts/[\\w.-]*\\.mjs`, 'g'))) {
        offenders.push(`${skill}: ${m[0]}`)
      }
    }
    expect(offenders, `stale .mjs references: ${offenders.join(', ')}`).toEqual([])
  })

  it('every skill with a scripts/ dir has at least one script', () => {
    const empty: string[] = []
    for (const skill of skillDirs) {
      const dir = path.join(CONFIG_DIR, 'skills', skill, 'scripts')
      if (!fs.existsSync(dir)) continue
      const files = fs.readdirSync(dir).filter((f) => !['package.json', 'bun.lock', 'node_modules', 'tsconfig.json'].includes(f))
      if (files.length === 0) empty.push(skill)
    }
    expect(empty, `empty scripts/ dirs: ${empty.join(', ')}`).toEqual([])
  })
})

describe('feature package: agents, rules, tools', () => {
  const agentFiles = fs.readdirSync(path.join(CONFIG_DIR, 'agents')).filter((f) => f.endsWith('.md'))

  it('has agents', () => {
    expect(agentFiles.length).toBeGreaterThan(0)
  })

  it.each(agentFiles)('%s has frontmatter with name, description, mode', (file) => {
    const raw = fs.readFileSync(path.join(CONFIG_DIR, 'agents', file), 'utf-8')
    const m = raw.match(/^---\r?\n([\s\S]*?)\r?\n---/)
    expect(m, `${file}: no frontmatter`).toBeTruthy()
    // `name` is derived from the filename by OpenCode, so it is optional. What
    // is NOT optional is description and mode: a subagent without `mode:
    // subagent` is a primary agent, which would break the one-primary invariant.
    expect(m![1], `${file}: no description`).toMatch(/^description:/m)
    expect(m![1], `${file}: no mode`).toMatch(/^mode:/m)
  })

  it('exactly one agent is a primary; the rest are subagents', () => {
    const primaries: string[] = []
    for (const file of agentFiles) {
      const raw = fs.readFileSync(path.join(CONFIG_DIR, 'agents', file), 'utf-8')
      const m = raw.match(/^---\r?\n([\s\S]*?)\r?\n---/)!
      const mode = m[1].match(/^mode:\s*(.+)$/m)?.[1].trim()
      if (mode !== 'subagent') primaries.push(`${file} (mode: ${mode})`)
    }
    // Model policy: one primary (hubs) is the sole entry point.
    expect(primaries, `non-subagent agents: ${primaries.join(', ')}`).toEqual(['hubs.md (mode: primary)'])
  })

  it('no agent or profile hardcodes a model (model policy)', () => {
    const offenders: string[] = []
    for (const file of agentFiles) {
      const raw = fs.readFileSync(path.join(CONFIG_DIR, 'agents', file), 'utf-8')
      const m = raw.match(/^---\r?\n([\s\S]*?)\r?\n---/)!
      if (/^\s*model:/m.test(m[1])) offenders.push(file)
    }
    expect(offenders, `agents pinning a model: ${offenders.join(', ')}`).toEqual([])
  })

  it('every instruction file is registered in opencode.jsonc', () => {
    const rulesDir = path.join(CONFIG_DIR, 'rules')
    if (!fs.existsSync(rulesDir)) return
    const registered = new Set(((config.instructions as string[]) ?? []).map((i) => path.basename(i)))
    const unregistered = fs
      .readdirSync(rulesDir)
      .filter((f) => f.endsWith('.md') && !registered.has(f))
    // Rules reachable ON DEMAND: not in `instructions`, but named by a skill,
    // agent, or tool that needs them, and documented in the On-demand rules
    // table in rules/AGENTS.md.
    //
    // These five were previously orphans — present, referenced by nothing, and
    // therefore loaded by nothing. They are not in `instructions` on purpose
    // (five more files on every turn is a permanent cost for content only some
    // workflows need); they are reachable because the consumers name them.
    const onDemand = [
      'global-reference.md', 'hub-routing.md', 'hub-state.md', 'resource-tags.md',
      'coding-style.md', 'git-workflow.md', 'performance.md', 'testing.md',
    ]
    const real = unregistered.filter((f) => !onDemand.includes(f))
    expect(real, `rule files not in instructions and not known on-demand: ${real.join(', ')}`).toEqual([])
  })

  it('every tool file exports a default tool definition', () => {
    const toolsDir = path.join(CONFIG_DIR, 'tools')
    const bad: string[] = []
    for (const f of fs.readdirSync(toolsDir)) {
      if (!f.endsWith('.ts')) continue
      // hub-*.ts are identity-slice manifests, and these are libraries — none
      // of them is an OpenCode tool.
      if (f.startsWith('hub-') || ['cache-utils.ts', 'state-utils.ts', 'hub-data.ts', 'build-spec-registry.ts', 'gen-routing-docs.ts', 'audit-density.ts'].includes(f)) continue
      const src = fs.readFileSync(path.join(toolsDir, f), 'utf-8')
      if (!/export\s+default\s+tool\(/.test(src)) bad.push(f)
    }
    expect(bad, `tools without a default export: ${bad.join(', ')}`).toEqual([])
  })

  it('every tool declares args via tool.schema (no unvalidated args)', () => {
    const toolsDir = path.join(CONFIG_DIR, 'tools')
    const bad: string[] = []
    for (const f of fs.readdirSync(toolsDir)) {
      if (!f.endsWith('.ts') || f.startsWith('hub-') || f === 'cache-utils.ts' || f === 'state-utils.ts' || f === 'hub-data.ts' || f === 'audit-density.ts' || f === 'build-spec-registry.ts' || f === 'gen-routing-docs.ts') continue
      const src = fs.readFileSync(path.join(toolsDir, f), 'utf-8')
      if (!/export\s+default\s+tool\(/.test(src)) continue
      if (!/args:\s*\{/.test(src)) bad.push(f)
    }
    expect(bad, `tools with no args schema: ${bad.join(', ')}`).toEqual([])
  })
})
