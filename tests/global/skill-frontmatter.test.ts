/**
 * skill-frontmatter.test.ts — every skills/<name>/SKILL.md must be discoverable.
 *
 * The skill loader reads YAML frontmatter to decide: does this skill match the
 * user's intent? what tools does it need? is it safe to inject into the prompt?
 * A skill with malformed frontmatter, or a name that does not match its
 * directory, is invisible. It sits in the repo, counts toward the 129-skill
 * total, and never fires.
 *
 * The failure mode this catches: a skill that exists, is referenced by a hub
 * spec, and silently does not load because the frontmatter is broken or the
 * name field disagrees with the directory name.
 *
 * Tests assert:
 *   1. frontmatter exists and parses
 *   2. name matches the directory name (loader convention)
 *   3. description is present and non-trivial
 *   4. no frontmatter pins a model (config policy)
 *   5. referenced scripts/ files actually exist
 */

import { describe, it, expect } from 'vitest'
import * as fs from 'fs'
import * as path from 'path'
import * as yaml from 'js-yaml'

const SKILLS_DIR = path.resolve(__dirname, '..', '..', 'skills')

type SkillEntry = {
  name: string
  dir: string
  path: string
  content: string
  frontmatter: Record<string, unknown> | null
  parseError?: string
}

function extractFrontmatter(content: string): { raw: string; parsed: Record<string, unknown> | null; error?: string } {
  const match = content.match(/^---\n([\s\S]*?)\n---/)
  if (!match) return { raw: '', parsed: null, error: 'no frontmatter block' }
  try {
    const parsed = yaml.load(match[1]) as Record<string, unknown>
    return { raw: match[1], parsed: typeof parsed === 'object' && parsed !== null ? parsed : null }
  } catch (e) {
    return { raw: match[1], parsed: null, error: e instanceof Error ? e.message : String(e) }
  }
}

function getSkills(): SkillEntry[] {
  if (!fs.existsSync(SKILLS_DIR)) return []
  return fs.readdirSync(SKILLS_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => {
      const dir = path.join(SKILLS_DIR, d.name)
      const skillPath = path.join(dir, 'SKILL.md')
      if (!fs.existsSync(skillPath)) {
        return { name: d.name, dir, path: skillPath, content: '', frontmatter: null, parseError: 'SKILL.md missing' }
      }
      const content = fs.readFileSync(skillPath, 'utf-8')
      const { parsed, error } = extractFrontmatter(content)
      return { name: d.name, dir, path: skillPath, content, frontmatter: parsed, parseError: error }
    })
}

// Directories under skills/ that are not loadable skills. Mirrors the allowlist
// in feature-package.test.ts — keep the two in sync.
//   - the four legacy hubs: superseded by *-hub menus (LEGACY_ROUTE_MAP), deliberately
//     given no frontmatter so they never advertise in the system prompt
//   - types/: a shared TypeScript declaration directory (bun-runtime.d.ts), not a skill
const NON_SKILL_DIRS = new Set(['harvest-context', 'ideation', 'orchestrate', 'project', 'types'])

describe('skill frontmatter', () => {
  const skills = getSkills().filter((s) => !NON_SKILL_DIRS.has(s.name))

  it('finds skills to test', () => {
    expect(skills.length).toBeGreaterThan(0)
  })

  it.each(skills)('$name has a SKILL.md', ({ name, path: p, content }) => {
    expect(content.length, `${name}: SKILL.md is missing or empty at ${p}`).toBeGreaterThan(0)
  })

  it.each(skills)('$name has parseable YAML frontmatter', ({ name, frontmatter, parseError }) => {
    expect(frontmatter, `${name}: frontmatter did not parse — ${parseError ?? 'empty'}`).not.toBeNull()
  })

  it.each(skills)('$name frontmatter name matches the directory name', ({ name, frontmatter }) => {
    if (!frontmatter) return
    const fmName = frontmatter.name
    expect(fmName, `${name}: frontmatter missing "name" field`).toBeDefined()
    // The loader keys skills by directory. A mismatch means the skill registers
    // under a name nobody can invoke, or collides with another skill.
    expect(fmName, `${name}: frontmatter name "${fmName}" does not match directory "${name}"`).toBe(name)
  })

  it.each(skills)('$name has a non-trivial description', ({ name, frontmatter }) => {
    if (!frontmatter) return
    const desc = frontmatter.description
    expect(desc, `${name}: missing description`).toBeDefined()
    expect(typeof desc, `${name}: description is not a string`).toBe('string')
    expect((desc as string).length, `${name}: description is too short to route by`).toBeGreaterThan(10)
  })

  it.each(skills)('$name does not pin a model in frontmatter', ({ name, frontmatter }) => {
    if (!frontmatter) return
    // Config policy: no model pins anywhere. Model choice is runtime/user.
    expect(frontmatter.model, `${name}: pins a model in frontmatter`).toBeUndefined()
    expect(frontmatter['small_model'], `${name}: pins small_model in frontmatter`).toBeUndefined()
  })

  it.each(skills)('$name: every referenced own-skill script file exists', ({ name, dir, content }) => {
    // Only assert on references that are unambiguously THIS skill's own scripts:
    //   ./scripts/<file>            — relative to the skill dir
    //   skills/<name>/scripts/<file> — explicit own-skill path
    // Cross-skill absolute refs (skills/<other>/scripts/...), env-var paths
    // (${OPENCODE_PLUGIN_ROOT}/scripts/...), and prose examples
    // (scripts/rotate-pdf.sh in skill-creator's docs) are out of scope — they
    // resolve against a different root or name a file the reader creates.
    const refs = new Set<string>()
    for (const m of content.matchAll(/\.\/scripts\/([A-Za-z0-9._-]+\.(?:sh|ts|js|mjs|py))/g)) {
      refs.add(m[1])
    }
    const ownPrefix = new RegExp(`skills/${name}/scripts/([A-Za-z0-9._-]+\\.(?:sh|ts|js|mjs|py))`, 'g')
    for (const m of content.matchAll(ownPrefix)) {
      refs.add(m[1])
    }
    for (const ref of refs) {
      const p = path.join(dir, 'scripts', ref)
      expect(fs.existsSync(p), `${name}: referenced script missing: scripts/${ref}`).toBe(true)
    }
  })
})

describe('skill frontmatter: the allowlist of non-skill directories', () => {
  it('only allowlisted directories may lack a SKILL.md', () => {
    const dirs = fs.readdirSync(SKILLS_DIR, { withFileTypes: true }).filter((d) => d.isDirectory())
    const missing = dirs
      .map((d) => d.name)
      .filter((n) => !fs.existsSync(path.join(SKILLS_DIR, n, 'SKILL.md')))
      .filter((n) => !NON_SKILL_DIRS.has(n))
    // Every directory in skills/ is a loadable skill unless it is explicitly
    // allowlisted above. A missing SKILL.md outside the allowlist is a bug.
    expect(missing, `directories without SKILL.md and not allowlisted: ${missing.join(', ')}`).toEqual([])
  })

  it('every allowlisted non-skill directory is documented', () => {
    // The allowlist exists so a directory can be skipped without a test failing.
    // An entry that no longer exists on disk is dead weight — remove it.
    for (const n of NON_SKILL_DIRS) {
      const exists = fs.existsSync(path.join(SKILLS_DIR, n))
      expect(exists, `allowlisted directory "${n}" no longer exists under skills/`).toBe(true)
    }
  })
})
