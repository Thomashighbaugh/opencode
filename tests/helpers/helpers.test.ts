/**
 * helpers.test.ts — unit tests for the test helpers themselves.
 *
 * load-config.parseJsonc and resolve-refs are the foundation every other test
 * builds on. A bug in parseJsonc means every config test is reading a different
 * object than OpenCode will. A bug in resolveRef means a file-exists test
 * reports a false pass. These tests pin the helper behaviour so the rest of the
 * suite can trust it.
 */

import { describe, it, expect } from 'vitest'
import * as fs from 'fs'
import * as os from 'os'
import * as path from 'path'
import { parseJsonc, findConfig, loadConfig, getGlobalConfigDir } from '../helpers/load-config'
import { resolveRef, resolveInstruction, resolvePlugin, scanEntities } from '../helpers/resolve-refs'

// ─── parseJsonc ──────────────────────────────────────────────────────────────

describe('parseJsonc', () => {
  it('parses plain JSON', () => {
    expect(parseJsonc('{"a":1,"b":[2,3]}')).toEqual({ a: 1, b: [2, 3] })
  })

  it('strips // line comments', () => {
    expect(parseJsonc('{ // comment\n"a": 1 }')).toEqual({ a: 1 })
  })

  it('strips trailing commas', () => {
    expect(parseJsonc('{"a": [1, 2,], "b": {"c": 3,},}')).toEqual({ a: [1, 2], b: { c: 3 } })
  })

  it('does not strip a // inside a string', () => {
    expect(parseJsonc('{"url": "https://x.dev//y"}')).toEqual({ url: 'https://x.dev//y' })
  })

  it('does not strip a // after an escaped quote in a string', () => {
    expect(parseJsonc('{"s": "a\\"b // not comment"}')).toEqual({ s: 'a"b // not comment' })
  })

  it('handles a comment on the same line as a value', () => {
    expect(parseJsonc('{"a": 1, // one\n"b": 2}')).toEqual({ a: 1, b: 2 })
  })

  it('handles a comment at the start of a line', () => {
    expect(parseJsonc('// header\n{"a": 1}')).toEqual({ a: 1 })
  })

  it('throws on invalid JSON after cleaning', () => {
    expect(() => parseJsonc('{ "a": }')).toThrow()
  })

  it('handles empty object', () => {
    expect(parseJsonc('{}')).toEqual({})
  })

  it('handles nested objects with comments at every level', () => {
    const raw = `{
      // top
      "a": {
        // nested
        "b": 1, // trailing
      },
    }`
    expect(parseJsonc(raw)).toEqual({ a: { b: 1 } })
  })
})

// ─── findConfig ──────────────────────────────────────────────────────────────

describe('findConfig', () => {
  it('finds opencode.jsonc in a directory', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'findcfg-'))
    fs.writeFileSync(path.join(dir, 'opencode.jsonc'), '{}')
    expect(findConfig(dir)).toBe(path.join(dir, 'opencode.jsonc'))
    fs.rmSync(dir, { recursive: true, force: true })
  })

  it('finds opencode.json when jsonc is absent', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'findcfg-'))
    fs.writeFileSync(path.join(dir, 'opencode.json'), '{}')
    expect(findConfig(dir)).toBe(path.join(dir, 'opencode.json'))
    fs.rmSync(dir, { recursive: true, force: true })
  })

  it('finds .opencode/opencode.jsonc', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'findcfg-'))
    fs.mkdirSync(path.join(dir, '.opencode'))
    fs.writeFileSync(path.join(dir, '.opencode', 'opencode.jsonc'), '{}')
    expect(findConfig(dir)).toBe(path.join(dir, '.opencode', 'opencode.jsonc'))
    fs.rmSync(dir, { recursive: true, force: true })
  })

  it('returns null when no config exists', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'findcfg-'))
    expect(findConfig(dir)).toBeNull()
    fs.rmSync(dir, { recursive: true, force: true })
  })

  it('prefers opencode.jsonc over opencode.json', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'findcfg-'))
    fs.writeFileSync(path.join(dir, 'opencode.json'), '{}')
    fs.writeFileSync(path.join(dir, 'opencode.jsonc'), '{}')
    expect(findConfig(dir)).toBe(path.join(dir, 'opencode.jsonc'))
    fs.rmSync(dir, { recursive: true, force: true })
  })
})

// ─── loadConfig ─────────────────────────────────────────────────────────────

describe('loadConfig', () => {
  it('loads and parses a config', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'loadcfg-'))
    fs.writeFileSync(path.join(dir, 'opencode.jsonc'), '{ "a": 1 }')
    const r = loadConfig(dir)
    expect(r).not.toBeNull()
    expect(r!.config).toEqual({ a: 1 })
    expect(r!.configDir).toBe(dir)
    fs.rmSync(dir, { recursive: true, force: true })
  })

  it('returns null when no config exists', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'loadcfg-'))
    expect(loadConfig(dir)).toBeNull()
    fs.rmSync(dir, { recursive: true, force: true })
  })
})

// ─── getGlobalConfigDir ─────────────────────────────────────────────────────

describe('getGlobalConfigDir', () => {
  it('defaults to ~/.config/opencode', () => {
    delete process.env.OPENCODE_CONFIG_DIR
    expect(getGlobalConfigDir()).toBe(path.join(os.homedir(), '.config', 'opencode'))
  })

  it('honours OPENCODE_CONFIG_DIR', () => {
    process.env.OPENCODE_CONFIG_DIR = '/tmp/x'
    expect(getGlobalConfigDir()).toBe('/tmp/x')
    delete process.env.OPENCODE_CONFIG_DIR
  })
})

// ─── resolveRef ──────────────────────────────────────────────────────────────

describe('resolveRef', () => {
  it('resolves a project-level .opencode/ file before the global one', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'resref-'))
    fs.mkdirSync(path.join(dir, '.opencode', 'agents'), { recursive: true })
    fs.writeFileSync(path.join(dir, '.opencode', 'agents', 'x.md'), '')
    expect(resolveRef('agent', 'x', dir, '/nonexistent')).toBe(path.join(dir, '.opencode', 'agents', 'x.md'))
    fs.rmSync(dir, { recursive: true, force: true })
  })

  it('falls back to the global config dir', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'resref-'))
    const global = fs.mkdtempSync(path.join(os.tmpdir(), 'resref-global-'))
    fs.mkdirSync(path.join(global, 'agents'), { recursive: true })
    fs.writeFileSync(path.join(global, 'agents', 'x.md'), '')
    expect(resolveRef('agent', 'x', dir, global)).toBe(path.join(global, 'agents', 'x.md'))
    fs.rmSync(dir, { recursive: true, force: true })
    fs.rmSync(global, { recursive: true, force: true })
  })

  it('returns null when the ref exists nowhere', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'resref-'))
    expect(resolveRef('agent', 'nope', dir, '/nonexistent')).toBeNull()
    fs.rmSync(dir, { recursive: true, force: true })
  })

  it('resolves a skill to its SKILL.md', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'resref-'))
    fs.mkdirSync(path.join(dir, '.opencode', 'skills', 's'), { recursive: true })
    fs.writeFileSync(path.join(dir, '.opencode', 'skills', 's', 'SKILL.md'), '')
    expect(resolveRef('skill', 's', dir, '/nonexistent')).toBe(path.join(dir, '.opencode', 'skills', 's', 'SKILL.md'))
    fs.rmSync(dir, { recursive: true, force: true })
  })

  it('resolves a tool to its .ts file', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'resref-'))
    fs.mkdirSync(path.join(dir, '.opencode', 'tools'), { recursive: true })
    fs.writeFileSync(path.join(dir, '.opencode', 'tools', 't.ts'), '')
    expect(resolveRef('tool', 't', dir, '/nonexistent')).toBe(path.join(dir, '.opencode', 'tools', 't.ts'))
    fs.rmSync(dir, { recursive: true, force: true })
  })
})

// ─── resolveInstruction / resolvePlugin ──────────────────────────────────────

describe('resolveInstruction', () => {
  it('resolves relative to the config dir', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'resinst-'))
    fs.writeFileSync(path.join(dir, 'AGENTS.md'), '')
    expect(resolveInstruction('AGENTS.md', dir)).toBe(path.join(dir, 'AGENTS.md'))
    fs.rmSync(dir, { recursive: true, force: true })
  })

  it('falls back to the global dir', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'resinst-'))
    const global = fs.mkdtempSync(path.join(os.tmpdir(), 'resinst-global-'))
    fs.writeFileSync(path.join(global, 'AGENTS.md'), '')
    expect(resolveInstruction('AGENTS.md', dir, global)).toBe(path.join(global, 'AGENTS.md'))
    fs.rmSync(dir, { recursive: true, force: true })
    fs.rmSync(global, { recursive: true, force: true })
  })

  it('returns null when the file exists nowhere', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'resinst-'))
    expect(resolveInstruction('nope.md', dir, '/nonexistent')).toBeNull()
    fs.rmSync(dir, { recursive: true, force: true })
  })
})

describe('resolvePlugin', () => {
  it('treats an npm package starting with @ as resolved', () => {
    expect(resolvePlugin('@scope/pkg', '/nonexistent')).toBe('@scope/pkg')
  })

  it('resolves a relative plugin path', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'resplug-'))
    fs.mkdirSync(path.join(dir, 'plugins', 'p'), { recursive: true })
    fs.writeFileSync(path.join(dir, 'plugins', 'p', 'plugin.ts'), '')
    expect(resolvePlugin('./plugins/p/plugin.ts', dir)).toBe(path.join(dir, 'plugins', 'p', 'plugin.ts'))
    fs.rmSync(dir, { recursive: true, force: true })
  })
})

// ─── scanEntities ───────────────────────────────────────────────────────────

describe('scanEntities', () => {
  it('finds agents in a directory', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'scan-'))
    fs.mkdirSync(path.join(dir, 'agents'), { recursive: true })
    fs.writeFileSync(path.join(dir, 'agents', 'a.md'), '')
    fs.writeFileSync(path.join(dir, 'agents', 'b.md'), '')
    const found = scanEntities('agent', dir)
    expect(found.map((f) => f.name).sort()).toEqual(['a', 'b'])
    fs.rmSync(dir, { recursive: true, force: true })
  })

  it('finds skills by SKILL.md presence', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'scan-'))
    fs.mkdirSync(path.join(dir, 'skills', 's1'), { recursive: true })
    fs.writeFileSync(path.join(dir, 'skills', 's1', 'SKILL.md'), '')
    fs.mkdirSync(path.join(dir, 'skills', 's2'), { recursive: true }) // no SKILL.md
    const found = scanEntities('skill', dir)
    expect(found.map((f) => f.name)).toEqual(['s1'])
    fs.rmSync(dir, { recursive: true, force: true })
  })

  it('returns empty for a missing directory', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'scan-'))
    expect(scanEntities('agent', dir)).toEqual([])
    fs.rmSync(dir, { recursive: true, force: true })
  })
})
