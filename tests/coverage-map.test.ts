import { describe, it, expect } from 'vitest'
import * as fs from 'fs'
import * as path from 'path'

const ROOT_DIR = path.resolve(__dirname, '..')
const TESTS_DIR = path.join(ROOT_DIR, 'tests')

/** Recursively list files matching a pattern in a directory. */
function findFiles(dir: string, pattern: RegExp): string[] {
  const results: string[] = []
  if (!fs.existsSync(dir)) return results

  const entries = fs.readdirSync(dir, { withFileTypes: true })
  for (const entry of entries) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      results.push(...findFiles(full, pattern))
    } else if (entry.isFile() && pattern.test(entry.name)) {
      results.push(full)
    }
  }
  return results
}

const SOURCE_AREAS: Array<{
  name: string
  dir: string
  filePattern: string
  testMatch: string
  minExpected: number
}> = [
  { name: 'agents', dir: 'agents', filePattern: '.md', testMatch: 'agent-format', minExpected: 1 },
  { name: 'tools', dir: 'tools', filePattern: '.ts', testMatch: 'delegation', minExpected: 1 },
  { name: 'rules', dir: 'rules', filePattern: '.md', testMatch: 'file-integrity', minExpected: 1 },
  { name: 'global config', dir: '.', filePattern: 'opencode.jsonc', testMatch: 'schema', minExpected: 1 },
  { name: 'project fixtures', dir: 'tests/project/fixtures', filePattern: '', testMatch: 'resolution', minExpected: 1 },
]

describe('test coverage map', () => {
  for (const area of SOURCE_AREAS) {
    it(`${area.name} has at least ${area.minExpected} corresponding test file(s)`, () => {
      const testFiles = findFiles(TESTS_DIR, /\.test\.ts$/)
      const matching = testFiles.filter((f) => f.includes(area.testMatch))
      expect(
        matching.length,
        `${area.name}: expected >= ${area.minExpected} test(s) matching "${area.testMatch}", found ${matching.length}. Available tests: ${testFiles.map(f => path.relative(TESTS_DIR, f)).join(', ')}`,
      ).toBeGreaterThanOrEqual(area.minExpected)
    })
  }

  it('reports uncovered source areas as info', () => {
    const testFiles = findFiles(TESTS_DIR, /\.test\.ts$/)
    const relativeTests = testFiles.map((f) => path.relative(ROOT_DIR, f))

    console.log(`\n[coverage-map] ${testFiles.length} test files:\n${relativeTests.map((f) => `  - ${f}`).join('\n')}`)

    // Count skills — informational only
    const skillsDir = path.join(ROOT_DIR, 'skills')
    if (fs.existsSync(skillsDir)) {
      const skillDirs = fs.readdirSync(skillsDir).filter((f) =>
        fs.statSync(path.join(skillsDir, f)).isDirectory(),
      )
      console.log(`[coverage-map] ${skillDirs.length} skill directories (not individually tested)`)
    }

    expect(true).toBe(true) // informational only
  })
})
