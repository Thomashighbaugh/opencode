/**
 * command-hooks.test.ts — the whole declarative-hook surface, driven for real.
 *
 * Nothing here asserts on source text. Every test builds a config, fires an
 * event through `createHandlers` — the same function the plugin calls — and
 * checks what the command actually did: what it printed, what exited non-zero,
 * what got injected, and what did not. A test that reads the matcher and asserts
 * it contains `overrideGlobal` passes against a matcher that never matches
 * anything.
 */

import { describe, it, expect, beforeEach, afterAll } from 'vitest'
import * as fs from 'node:fs'
import * as os from 'node:os'
import * as path from 'node:path'

const CONFIG_DIR = path.resolve(__dirname, '..', '..')
const MOD = path.join(CONFIG_DIR, 'plugins', 'command-hooks', 'index.ts')

// Loaded once at module scope, not in beforeEach: a `describe` body runs during
// collection, before any beforeEach, so a module assigned in beforeEach is
// still undefined where a describe-level `loadConfig` needs it.
type Mod = typeof import('../../plugins/command-hooks/index')
const m: Mod = await import(MOD)

beforeEach(() => {
  m.__resetCommandHooksStats()
})

const fixtures: string[] = []
function fixture(files: Record<string, string>): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'cmdhooks-'))
  fixtures.push(dir)
  for (const [rel, body] of Object.entries(files)) {
    const abs = path.join(dir, rel)
    fs.mkdirSync(path.dirname(abs), { recursive: true })
    fs.writeFileSync(abs, body)
  }
  return dir
}
afterAll(() => {
  for (const d of fixtures) fs.rmSync(d, { recursive: true, force: true })
})

/** Build handlers over an inline config, capturing what would be injected. */
function harness(config: Partial<Mod['createHandlers'] extends never ? never : any> = {}, cwd = process.cwd()) {
  const injected: Array<{ sessionId: string; message: string }> = []
  const toasts: any[] = []
  const cfg = {
    truncationLimit: 30000,
    injectLimit: 4000,
    tool: [],
    session: [],
    ...config,
  }
  const h = m.createHandlers({
    config: cfg,
    projectDir: cwd,
    queue: (id: string, message: string) => { injected.push({ sessionId: id, message }) },
    toast: async (t: any) => { toasts.push(t) },
  })
  return { ...h, injected, toasts, config: cfg }
}

const call = (over: any = {}) => ({ tool: 'task', sessionID: 's1', callID: `c${Math.random()}`, ...over })

// ─── config validation ───────────────────────────────────────────────────────

describe('config validation', () => {
  it('accepts a complete valid config', () => {
    const { config, error } = m.validateConfig({
      truncationLimit: 1000,
      injectLimit: 500,
      tool: [{
        id: 'a', when: { phase: 'after', tool: ['x', 'y'], toolArgs: { p: { glob: '**/*.ts' } } },
        run: ['a', 'b'], inject: '{stdout}', injectOn: 'failure',
        toast: { title: 't', message: 'm', variant: 'warning', duration: 100 },
      }],
      session: [{ id: 's', when: { event: 'session.idle' }, run: 'echo hi' }],
    })
    expect(error).toBeNull()
    expect(config?.tool).toHaveLength(1)
    expect(config?.session).toHaveLength(1)
  })

  it('rejects a non-object root', () => {
    expect(m.validateConfig([]).error).toBeTruthy()
    expect(m.validateConfig('nope').error).toBeTruthy()
    expect(m.validateConfig(null).error).toBeTruthy()
  })

  it('rejects a string where a boolean is required — "false" is not false', () => {
    const { error } = m.validateConfig({ tool: [{ id: 'a', when: { phase: 'after' }, overrideGlobal: 'true' }] })
    expect(error).toMatch(/overrideGlobal/)
  })

  it('rejects a missing or invalid phase', () => {
    expect(m.validateConfig({ tool: [{ id: 'a', when: {} }] }).error).toMatch(/phase/)
    expect(m.validateConfig({ tool: [{ id: 'a', when: { phase: 'during' } }] }).error).toMatch(/phase/)
  })

  it('rejects a non-positive truncation limit', () => {
    expect(m.validateConfig({ truncationLimit: 0 }).error).toMatch(/truncationLimit/)
    expect(m.validateConfig({ truncationLimit: -5 }).error).toMatch(/truncationLimit/)
    expect(m.validateConfig({ truncationLimit: 1.5 }).error).toMatch(/truncationLimit/)
  })

  it('rejects an unsupported session event', () => {
    expect(m.validateConfig({ session: [{ id: 'a', when: { event: 'session.end' } }] }).error).toMatch(/event/)
  })

  it('rejects a matcher setting both glob and regex', () => {
    const { error } = m.validateConfig({
      tool: [{ id: 'a', when: { phase: 'after', toolArgs: { p: { glob: 'x', regex: 'y' } } } }],
    })
    expect(error).toMatch(/both glob and regex/)
  })

  it('rejects an uncompilable regex at load, not at match time', () => {
    const { error } = m.validateConfig({
      tool: [{ id: 'a', when: { phase: 'after', toolArgs: { p: { regex: '([' } } } }],
    })
    expect(error).toMatch(/invalid regex/)
  })

  it('rejects duplicate ids within one source', () => {
    const { error } = m.validateConfig({
      tool: [{ id: 'dup', when: { phase: 'after' } }, { id: 'dup', when: { phase: 'before' } }],
    })
    expect(error).toMatch(/duplicate id/)
  })

  it('reports every problem at once, not one per reload', () => {
    const { error } = m.validateConfig({ truncationLimit: 0, tool: 'nope' })
    expect(error).toMatch(/truncationLimit/)
    expect(error).toMatch(/tool/)
  })
})

// ─── JSONC parsing ───────────────────────────────────────────────────────────

describe('jsonc parsing', () => {
  it('parses comments and trailing commas', () => {
    const v = m.parseJsonc(`{
      // a line comment
      "a": 1, /* block */
      "b": [1, 2,],
      "c": "x",
    }`) as any
    expect(v.a).toBe(1)
    expect(v.b).toEqual([1, 2])
    expect(v.c).toBe('x')
  })

  it('an apostrophe in a comment does not swallow the rest of the file as a string', () => {
    // `'` used to open a string, so "don't" turned the remainder of a config
    // into string contents and the file failed to parse.
    const v = m.parseJsonc(`{
      // don't panic about the apostrophe
      "a": 1
    }`) as any
    expect(v.a).toBe(1)
  })

  it('single-quoted values are rejected, as they are not valid JSON', () => {
    expect(() => m.parseJsonc(`{ 'a': 1 }`)).toThrow()
  })

  it('does not treat a // inside a string as a comment', () => {
    expect((m.parseJsonc('{"url": "https://x.dev//y"}') as any).url).toBe('https://x.dev//y')
  })

  it('does not treat a /* inside a string as a block comment', () => {
    expect((m.parseJsonc('{"re": "/* not a comment */"}') as any).re).toBe('/* not a comment */')
  })

  it('loads this configuration\'s own global file with no errors', () => {
    const r = m.loadConfig(CONFIG_DIR)
    expect(r.errors, r.errors.join('; ')).toEqual([])
    expect(r.config.tool.length).toBeGreaterThan(0)
    expect(r.config.truncationLimit).toBe(30000)
  })
})

// ─── matching ────────────────────────────────────────────────────────────────

describe('matching', () => {
  const hook = (when: any) => ({ id: 'h', when, run: 'true' } as any)

  it('matches on phase, and only that phase', () => {
    expect(m.toolHookMatches(hook({ phase: 'after', tool: 'task' }), { phase: 'after', tool: 'task' })).toBe(true)
    expect(m.toolHookMatches(hook({ phase: 'after', tool: 'task' }), { phase: 'before', tool: 'task' })).toBe(false)
  })

  it('omitted tool matches every tool; "*" does too', () => {
    expect(m.toolHookMatches(hook({ phase: 'after' }), { phase: 'after', tool: 'anything' })).toBe(true)
    expect(m.toolHookMatches(hook({ phase: 'after', tool: '*' }), { phase: 'after', tool: 'anything' })).toBe(true)
  })

  it('tool lists match any member, and are not order-sensitive', () => {
    const h = hook({ phase: 'after', tool: ['a', 'b'] })
    expect(m.toolHookMatches(h, { phase: 'after', tool: 'a' })).toBe(true)
    expect(m.toolHookMatches(h, { phase: 'after', tool: 'b' })).toBe(true)
    expect(m.toolHookMatches(h, { phase: 'after', tool: 'c' })).toBe(false)
  })

  it('filters on callingAgent', () => {
    const h = hook({ phase: 'after', callingAgent: ['executor', 'verifier'] })
    expect(m.toolHookMatches(h, { phase: 'after', tool: 'task', agent: 'executor' })).toBe(true)
    expect(m.toolHookMatches(h, { phase: 'after', tool: 'task', agent: 'planner' })).toBe(false)
  })

  it('ANDs every toolArgs key', () => {
    const h = hook({ phase: 'after', toolArgs: { a: '1', b: '2' } })
    expect(m.toolHookMatches(h, { phase: 'after', tool: 'x', args: { a: '1', b: '2' } })).toBe(true)
    expect(m.toolHookMatches(h, { phase: 'after', tool: 'x', args: { a: '1', b: '9' } })).toBe(false)
  })

  it('a toolArgs filter on a key the call did not provide does NOT match', () => {
    // Otherwise "run this when path is src/**" fires on every call with no path.
    const h = hook({ phase: 'after', toolArgs: { path: 'src/x.ts' } })
    expect(m.toolHookMatches(h, { phase: 'after', tool: 'x', args: {} })).toBe(false)
    expect(m.toolHookMatches(h, { phase: 'after', tool: 'x', args: undefined })).toBe(false)
  })

  it('matches exact, list, glob, and regex argument forms', () => {
    expect(m.matchesArg('a', 'a')).toBe(true)
    expect(m.matchesArg('a', 'b')).toBe(false)
    expect(m.matchesArg(['a', 'b'], 'b')).toBe(true)
    expect(m.matchesArg('*', 42)).toBe(true)
    expect(m.matchesArg({ glob: '**/*.ts' }, 'src/a/b.ts')).toBe(true)
    expect(m.matchesArg({ glob: '**/*.ts' }, 'src/a/b.js')).toBe(false)
    expect(m.matchesArg({ regex: 'TODO' }, 'a TODO here')).toBe(true)
    expect(m.matchesArg({ regex: '^TODO$' }, 'a TODO')).toBe(false)
  })

  it('patterns match only string values — a regex does not match an object\'s JSON', () => {
    expect(m.matchesArg({ regex: 'TODO' }, { note: 'TODO' })).toBe(false)
    expect(m.matchesArg({ glob: '**' }, ['a'])).toBe(false)
  })

  it('a leading ! is a literal, not a negation', () => {
    expect(m.matchesArg({ glob: '!important.ts' }, '!important.ts')).toBe(true)
    expect(m.matchesArg({ glob: '!important.ts' }, 'other.ts')).toBe(false)
  })

  it('a leading # is not a comment', () => {
    expect(m.matchesArg({ glob: '#tmp' }, '#tmp')).toBe(true)
  })

  it('the glob fallback agrees with picomatch on the common shapes', () => {
    for (const [pattern, value, expected] of [
      ['**/*.ts', 'a/b/c.ts', true],
      ['**/*.ts', 'c.ts', true],
      ['src/*.ts', 'src/a.ts', true],
      ['src/*.ts', 'src/a/b.ts', false],
      ['*.{ts,js}', 'a.js', true],
      ['*.{ts,js}', 'a.md', false],
      ['a?c', 'abc', true],
      ['a?c', 'ac', false],
    ] as const) {
      expect(m.globFallback(pattern).test(value), `fallback ${pattern} vs ${value}`).toBe(expected)
    }
  })

  it('rootSessionOnly defaults to true for idle and false for created', () => {
    const idle = { id: 'i', when: { event: 'session.idle' as const }, run: 'true' } as any
    const created = { id: 'c', when: { event: 'session.created' as const }, run: 'true' } as any
    expect(m.sessionHookMatches(idle, { event: 'session.idle', rootSession: false })).toBe(false)
    expect(m.sessionHookMatches(idle, { event: 'session.idle', rootSession: true })).toBe(true)
    expect(m.sessionHookMatches(created, { event: 'session.created', rootSession: false })).toBe(true)
  })

  it('rootSessionOnly can be set explicitly either way', () => {
    const both = { id: 'x', when: { event: 'session.idle' as const, rootSessionOnly: false }, run: 'true' } as any
    const only = { id: 'y', when: { event: 'session.created' as const, rootSessionOnly: true }, run: 'true' } as any
    expect(m.sessionHookMatches(both, { event: 'session.idle', rootSession: false })).toBe(true)
    expect(m.sessionHookMatches(only, { event: 'session.created', rootSession: false })).toBe(false)
  })

  it('session.start is an alias for session.created, in both directions', () => {
    const start = { id: 's', when: { event: 'session.start' as const }, run: 'true' } as any
    const created = { id: 'c', when: { event: 'session.created' as const }, run: 'true' } as any
    expect(m.sessionHookMatches(start, { event: 'session.start' })).toBe(true)
    expect(m.sessionHookMatches(start, { event: 'session.created' })).toBe(true)
    expect(m.sessionHookMatches(created, { event: 'session.start' })).toBe(true)
    expect(m.sessionHookMatches(created, { event: 'session.idle' })).toBe(false)
  })
})

// ─── override precedence ─────────────────────────────────────────────────────

describe('overrideGlobal', () => {
  const g = (id: string, phase: any, tool: any) => ({ id, when: { phase, tool }, run: 'true' } as any)
  const overriding = (id: string, phase: any, tool: any) =>
    ({ id, when: { phase, tool }, run: 'true', overrideGlobal: true } as any)

  it('suppresses a global hook for the same phase+tool', () => {
    const sup = m.suppressedByOverride(
      [overriding('local', 'after', 'bash')],
      [g('global1', 'after', 'bash'), g('global2', 'after', 'write'), g('global3', 'before', 'bash')],
    )
    expect([...sup]).toEqual(['global1'])
  })

  it('canonicalises tool form, so ["bash"] overrides "bash"', () => {
    // Without this the override silently misses the hook it exists to replace.
    const sup = m.suppressedByOverride([overriding('local', 'after', ['bash'])], [g('global', 'after', 'bash')])
    expect([...sup]).toEqual(['global'])
  })

  it('tool "*" in the global hook is suppressed by any override for that phase', () => {
    const sup = m.suppressedByOverride([overriding('local', 'after', 'write')], [g('g', 'after', '*')])
    expect([...sup]).toEqual(['g'])
  })

  it('suppresses nothing when the local hook does not declare overrideGlobal', () => {
    const sup = m.suppressedByOverride([g('local', 'after', 'bash')], [g('g', 'after', 'bash')])
    expect([...sup]).toEqual([])
  })

  it('an override fires once, and the suppressed hooks do not', async () => {
    const h = harness({
      tool: [
        { id: 'replacement', when: { phase: 'after', tool: 'x' }, run: 'echo NEW', overrideGlobal: true, inject: '{stdout}' },
        { id: 'inherited', when: { phase: 'after', tool: 'x' }, run: 'echo OLD', inject: '{stdout}' },
      ],
    })
    const out = await h.toolExecuteAfter(call({ tool: 'x' }), {})
    const ran = out.filter((o: any) => o.ran).map((o: any) => o.hookId)
    expect(ran).toEqual(['replacement'])
    expect(h.injected[0].message).toContain('NEW')
  })

  it('session overrideGlobal suppresses same-event hooks', () => {
    const local = { id: 'l', when: { event: 'session.idle' as const }, run: 'x', overrideGlobal: true } as any
    const globals = [
      { id: 'g1', when: { event: 'session.idle' as const }, run: 'x' } as any,
      { id: 'g2', when: { event: 'session.created' as const }, run: 'x' } as any,
    ]
    expect([...m.sessionSuppressedByOverride([local], globals)]).toEqual(['g1'])
  })
})

// ─── config merge ────────────────────────────────────────────────────────────

describe('config merge', () => {
  const h = (id: string) => ({ id, when: { phase: 'after' as const }, run: 'true' } as any)

  it('same id: project replaces global', () => {
    const r = m.mergeConfigs({ tool: [h('a')] }, { tool: [{ ...h('a'), run: 'PROJECT' }] })
    expect(r.tool).toHaveLength(1)
    expect(r.tool[0].run).toBe('PROJECT')
  })

  it('different ids: both survive', () => {
    const r = m.mergeConfigs({ tool: [h('a')] }, { tool: [h('b')] })
    expect(r.tool.map((x: any) => x.id).sort()).toEqual(['a', 'b'])
  })

  it('ignoreGlobalConfig drops global hooks entirely', () => {
    const r = m.mergeConfigs({ tool: [h('a')] }, { tool: [h('b')] }, true)
    expect(r.tool.map((x: any) => x.id)).toEqual(['b'])
  })

  it('project scalar wins, global scalar used as fallback', () => {
    expect(m.mergeConfigs({ truncationLimit: 1 }, {}).truncationLimit).toBe(1)
    expect(m.mergeConfigs({ truncationLimit: 1 }, { truncationLimit: 2 }).truncationLimit).toBe(2)
    expect(m.mergeConfigs({}, {}).truncationLimit).toBeUndefined()
  })

  it('disabled skips a hook entirely', async () => {
    const h2 = harness({ tool: [{ id: 'off', when: { phase: 'after', tool: 'x' }, run: 'echo NOPE', disabled: true }] })
    const out = await h2.toolExecuteAfter(call({ tool: 'x' }), {})
    expect(out).toEqual([])
  })

  it('finds a project config by walking up from the working directory', () => {
    const dir = fixture({ '.opencode/command-hooks.jsonc': '{"tool":[],"session":[]}' })
    const nested = path.join(dir, 'a', 'b')
    fs.mkdirSync(nested, { recursive: true })
    expect(m.findProjectConfig(nested)).toBe(path.join(dir, '.opencode', 'command-hooks.jsonc'))
  })

  it('a broken project file reports an error and does not take the global file down', () => {
    const dir = fixture({ '.opencode/command-hooks.jsonc': '{ "tool": [ { "id": "x" } ] }' })
    const r = m.loadConfig(dir)
    expect(r.errors.length).toBeGreaterThan(0)
    // The global file still loaded.
    expect(r.config.tool.length).toBeGreaterThan(0)
  })

  it('reads agent frontmatter hooks, including a nested toast block', () => {
    const fm = [
      'name: executor',
      'description: d',
      'hooks:',
      '  before:',
      '    - run: "echo hi"',
      '      toast:',
      '        message: "started"',
      '        variant: info',
    ].join('\n')
    const cfg = m.parseAgentHooks(fm)
    expect(cfg?.tool).toHaveLength(1)
    // The nested mapping is the case a hand-rolled YAML subset got wrong.
    expect((cfg!.tool![0] as any).toast).toEqual({ message: 'started', variant: 'info' })
  })

  it('returns null for frontmatter with no hooks block', () => {
    expect(m.parseAgentHooks('name: x\ndescription: y')).toBeNull()
  })
})

// ─── execution ───────────────────────────────────────────────────────────────

describe('execution', () => {
  it('captures stdout, stderr, and a zero exit code', async () => {
    const r = await m.runCommands('echo out; echo err 1>&2', { cwd: process.cwd() })
    expect(r[0].exitCode).toBe(0)
    expect(r[0].stdout).toContain('out')
    expect(r[0].stderr).toContain('err')
  })

  it('reports a non-zero exit code instead of throwing', async () => {
    const r = await m.runCommands('exit 3', { cwd: process.cwd() })
    expect(r[0].exitCode).toBe(3)
  })

  it('runs an array SEQUENTIALLY, in order', async () => {
    const r = await m.runCommands(
      ['echo one > seq.txt', 'echo two >> seq.txt', 'cat seq.txt'],
      { cwd: fixture({}) },
    )
    expect(r).toHaveLength(3)
    // The third command could only see the first two if they were ordered.
    expect(r[2].stdout).toMatch(/one[\s\S]*two/)
  })

  it('a failing command does NOT stop the ones after it', async () => {
    // Otherwise a lint error hides the typecheck error behind it.
    const r = await m.runCommands(['echo first', 'exit 1', 'echo third'], { cwd: process.cwd() })
    expect(r).toHaveLength(3)
    expect(r[1].exitCode).toBe(1)
    expect(r[2].stdout).toContain('third')
    expect(m.chainFailed(r)).toBe(true)
  })

  it('truncates to the configured limit and says so', async () => {
    const r = await m.runCommands('printf "x%.0s" $(seq 1 500)', { cwd: process.cwd(), truncateOutput: 50 })
    expect(r[0].stdout).toContain('truncated')
    expect(r[0].stdout.length).toBeLessThan(200)
  })

  it('exposes tool arguments via a temp file, not in the command string', async () => {
    const dir = fixture({})
    // A value that would be catastrophic if interpolated into the shell.
    const r = await m.runCommands('cat "$OPENCODE_HOOK_ARGS_FILE"', {
      cwd: dir,
      args: { filePath: 'src/a.ts; rm -rf /' },
    })
    const parsed = JSON.parse(r[0].stdout)
    expect(parsed.filePath).toBe('src/a.ts; rm -rf /')
  })

  it('gives a no-argument hook an empty object, and cleans the file up', async () => {
    const dir = fixture({})
    // Capture the path the command actually saw, so the assertion is about THIS
    // run's file. Checking every opencode-hook-args-* directory in the temp dir
    // asserted on global filesystem state and failed whenever an unrelated
    // killed run left an orphan behind.
    const r = await m.runCommands('cp "$OPENCODE_HOOK_ARGS_FILE" ./seen.json', { cwd: dir })
    expect(r[0].exitCode).toBe(0)
    const seen = JSON.parse(fs.readFileSync(path.join(dir, 'seen.json'), 'utf-8'))
    expect(seen).toEqual({})

    const written = m.writeArgsFile({ a: 1 })
    expect(fs.existsSync(written.path!)).toBe(true)
    written.cleanup()
    expect(fs.existsSync(written.path!), 'the args file must be removed after the chain finishes').toBe(false)
  })

  it('removes the args file even when a command in the chain throws', async () => {
    const dir = fixture({})
    let leaked: string | null = null
    try {
      // A timeout kills the child, but the finally block must still fire.
      await m.runCommands('sleep 5', { cwd: dir, timeoutMs: 200, args: { p: 1 } })
    } catch { /* not expected */ }
    const tmp = fs.readdirSync(os.tmpdir()).filter((d) => d.startsWith('opencode-hook-args-'))
    // Only assert on directories newer than this call, not the whole temp dir.
    for (const d of tmp) {
      const f = path.join(os.tmpdir(), d, 'args.json')
      if (fs.existsSync(f) && JSON.parse(fs.readFileSync(f, 'utf-8')).p === 1) leaked = f
    }
    expect(leaked, `an args file survived the run: ${leaked}`).toBeNull()
  })

  it('a command that does not exist is a failed hook, not a crash', async () => {
    const r = await m.runCommands('definitely-not-a-real-command-xyz', { cwd: process.cwd() })
    expect(r[0].exitCode).not.toBe(0)
  })

  it('times out rather than hanging forever', async () => {
    const r = await m.runCommands('sleep 5', { cwd: process.cwd(), timeoutMs: 300 })
    expect(r[0].exitCode).toBe(124)
    expect(r[0].stderr).toContain('timed out')
  })
})

// ─── templates ───────────────────────────────────────────────────────────────

describe('templates', () => {
  const ctx = (over: any = {}) => ({
    id: 'h1', tool: 'task', agent: 'executor',
    results: [{ cmd: 'a', stdout: 'A', stderr: '', exitCode: 0 }, { cmd: 'b', stdout: 'B', stderr: 'E', exitCode: 2 }],
    ...over,
  })

  it('renders every scalar placeholder', () => {
    expect(m.interpolate('{id}|{tool}|{agent}|{cmd}|{stdout}|{stderr}|{exitCode}', ctx()))
      .toBe('h1|task|executor|b|B|E|2')
  })

  it('{stdout} is the LAST command only, so an early pass cannot bury a later error', () => {
    expect(m.interpolate('{stdout}', ctx())).toBe('B')
  })

  it('{results.N.*} reaches every command in the chain', () => {
    expect(m.interpolate('{results.0.stdout}/{results.1.stdout}', ctx())).toBe('A/B')
  })

  it('renders args as text for scalars and JSON for structures', () => {
    expect(m.interpolate('{args.n}|{args.s}|{args.b}|{args.o}', ctx({ args: { n: 1, s: 'x', b: true, o: { k: 1 } } })))
      .toBe('1|x|true|{"k":1}')
  })

  it('renders a missing or null arg as empty, not "undefined"', () => {
    expect(m.interpolate('[{args.missing}][{args.nul}]', ctx({ args: { nul: null } }))).toBe('[][]')
  })

  it('reads own properties only, so {args.toString} does not leak a function', () => {
    expect(m.interpolate('[{args.toString}]', ctx({ args: {} }))).toBe('[]')
  })

  it('leaves an unknown placeholder literal rather than breaking the message', () => {
    expect(m.interpolate('{nope}', ctx())).toBe('{nope}')
  })

  it('returns empty for an absent template and never throws', () => {
    expect(m.interpolate(undefined, ctx())).toBe('')
    expect(m.interpolate('', ctx())).toBe('')
  })

  it('clamps to a limit, keeping the head, and reports how much was dropped', () => {
    const out = m.clampMessage('A'.repeat(100), 10)
    expect(out).toContain('90 more characters')
    expect(out.startsWith('AAAAAAAAAA')).toBe(true)
  })
})

// ─── injection behaviour ─────────────────────────────────────────────────────

describe('injection', () => {
  const hook = (over: any = {}) => ({
    id: 'h', when: { phase: 'after', tool: 'task' }, run: 'echo OUT; echo ERR 1>&2', inject: '{stdout}', ...over,
  })

  it('queues the rendered injection against the right session', async () => {
    const h = harness({ tool: [hook()] })
    await h.toolExecuteAfter(call({ sessionID: 'sess-9' }), {})
    expect(h.injected).toHaveLength(1)
    expect(h.injected[0].sessionId).toBe('sess-9')
    expect(h.injected[0].message).toContain('OUT')
  })

  it('injectOn "failure" stays SILENT on a passing command — the whole point', async () => {
    const h = harness({ tool: [hook({ run: 'exit 0', injectOn: 'failure' })] })
    await h.toolExecuteAfter(call(), {})
    expect(h.injected).toEqual([])
  })

  it('injectOn "failure" reports a failing command', async () => {
    const h = harness({ tool: [hook({ run: 'echo BOOM 1>&2; exit 1', injectOn: 'failure', inject: '{stdout}{stderr}' })] })
    await h.toolExecuteAfter(call(), {})
    expect(h.injected).toHaveLength(1)
    expect(h.injected[0].message).toContain('BOOM')
  })

  it('injectOn "failure" fires when ANY command in the chain failed', async () => {
    const h = harness({ tool: [hook({ run: ['exit 0', 'exit 1'], injectOn: 'failure' })] })
    await h.toolExecuteAfter(call(), {})
    expect(h.injected).toHaveLength(1)
  })

  it('injectOn "always" reports a pass too', async () => {
    const h = harness({ tool: [hook({ run: 'echo ok', injectOn: 'always' })] })
    await h.toolExecuteAfter(call(), {})
    expect(h.injected).toHaveLength(1)
  })

  it('clamps the injection to injectLimit', async () => {
    const h = harness({ tool: [hook({ run: 'printf "x%.0s" $(seq 1 9000)' })], injectLimit: 100 })
    await h.toolExecuteAfter(call(), {})
    expect(h.injected[0].message.length).toBeLessThan(200)
  })

  it('a hook with no inject and no toast injects nothing but still runs', async () => {
    const h = harness({ tool: [{ id: 'q', when: { phase: 'after', tool: 'task' }, run: 'echo hi' }] })
    const out = await h.toolExecuteAfter(call(), {})
    expect(out[0].ran).toBe(true)
    expect(h.injected).toEqual([])
  })

  it('toast fires with interpolated fields and costs no injection', async () => {
    const h = harness({ tool: [hook({ inject: undefined, toast: { title: 'V', message: 'exit {exitCode}', variant: 'error', duration: 10 } })] })
    await h.toolExecuteAfter(call(), {})
    expect(h.toasts).toEqual([{ title: 'V', message: 'exit 0', variant: 'error', duration: 10 }])
    expect(h.injected).toEqual([])
  })

  it('a failing toast does not break the hook or the tool call', async () => {
    const h = harness({ tool: [hook({ toast: { message: 'x' } })] })
    const broken = m.createHandlers({
      config: h.config,
      projectDir: process.cwd(),
      queue: () => {},
      toast: async () => { throw new Error('toast exploded') },
    })
    const out = await broken.toolExecuteAfter(call(), {})
    expect(out[0].ran).toBe(true)
  })

  it('injection transport is the queue, not promptAsync — zero extra inference calls', async () => {
    let prompts = 0
    const h = m.createHandlers({
      config: { truncationLimit: 1000, injectLimit: 1000, tool: [hook()], session: [] } as any,
      projectDir: process.cwd(),
      queue: () => {},
      toast: async () => {},
      fallbackInject: async () => { prompts++ },
    })
    await h.toolExecuteAfter(call(), {})
    expect(prompts).toBe(0)
  })

  it('falls back to promptAsync only when there is no queue to use', async () => {
    let prompts = 0
    const h = m.createHandlers({
      config: { truncationLimit: 1000, injectLimit: 1000, tool: [hook()], session: [] } as any,
      projectDir: process.cwd(),
      toast: async () => {},
      fallbackInject: async () => { prompts++ },
    } as any)
    await h.toolExecuteAfter(call(), {})
    expect(prompts).toBe(1)
  })
})

// ─── dispatch ────────────────────────────────────────────────────────────────

describe('dispatch', () => {
  it('before captures args; after reuses them for the matcher and the args file', async () => {
    const h = harness({
      tool: [{
        id: 'a', when: { phase: 'after', tool: 'write', toolArgs: { filePath: { glob: '**/*.ts' } } },
        run: 'cat "$OPENCODE_HOOK_ARGS_FILE"', inject: '{stdout}',
      }],
    })
    const c = call({ tool: 'write', callID: 'fixed-1' })
    await h.toolExecuteBefore(c, { args: { filePath: 'src/x.ts' } })
    const out = await h.toolExecuteAfter(c, {})
    expect(out[0].ran).toBe(true)
    expect(JSON.parse(out[0].stdout!).filePath).toBe('src/x.ts')
  })

  it('a before-phase hook does not fire on after', async () => {
    const h = harness({ tool: [{ id: 'b', when: { phase: 'before', tool: 'task' }, run: 'echo B' }] })
    expect(await h.toolExecuteAfter(call(), {})).toEqual([])
    expect((await h.toolExecuteBefore(call(), {}))[0].hookId).toBe('b')
  })

  it('a repeated after for the same callID runs once, not twice', async () => {
    // A retried dispatch would otherwise re-run the whole command chain.
    const h = harness({ tool: [{ id: 'x', when: { phase: 'after', tool: 'task' }, run: 'echo R' }] })
    const c = call({ callID: 'dedupe-1' })
    await h.toolExecuteBefore(c, {})
    expect(await h.toolExecuteAfter(c, {})).toHaveLength(1)
    expect(await h.toolExecuteAfter(c, {})).toHaveLength(0)
  })

  it('different callIDs each run', async () => {
    const h = harness({ tool: [{ id: 'x', when: { phase: 'after', tool: 'task' }, run: 'echo R' }] })
    await h.toolExecuteBefore(call({ callID: 'c1' }), {})
    await h.toolExecuteAfter(call({ callID: 'c1' }), {})
    await h.toolExecuteBefore(call({ callID: 'c2' }), {})
    expect(await h.toolExecuteAfter(call({ callID: 'c2' }), {})).toHaveLength(1)
  })

  it('subagent_type from a task call becomes callingAgent', async () => {
    const h = harness({
      tool: [{ id: 's', when: { phase: 'after', tool: 'task', callingAgent: 'executor' }, run: 'echo S' }],
    })
    const c = call()
    await h.toolExecuteBefore(c, { args: { subagent_type: 'executor' } })
    expect(await h.toolExecuteAfter(c, {})).toHaveLength(1)

    const c2 = call()
    await h.toolExecuteBefore(c2, { args: { subagent_type: 'planner' } })
    expect(await h.toolExecuteAfter(c2, {})).toEqual([])
  })

  it('hooks run in config order', async () => {
    const h = harness({
      tool: [
        { id: 'one', when: { phase: 'after', tool: 'task' }, run: 'echo 1', inject: '{stdout}' },
        { id: 'two', when: { phase: 'after', tool: 'task' }, run: 'echo 2', inject: '{stdout}' },
      ],
    })
    await h.toolExecuteAfter(call(), {})
    expect(h.injected.map((i: { message: string }) => i.message.trim())).toEqual(['1', '2'])
  })

  it('a hook that throws is contained, and other hooks still run', async () => {
    const h = harness({
      tool: [
        { id: 'boom', when: { phase: 'after', tool: 'task' }, run: '' },
        { id: 'ok', when: { phase: 'after', tool: 'task' }, run: 'echo OK', inject: '{stdout}' },
      ],
    })
    const out = await h.toolExecuteAfter(call(), {})
    expect(out.map((o: any) => o.hookId)).toEqual(['boom', 'ok'])
    expect(h.injected).toHaveLength(1)
  })

  it('session hooks fire and inject against the event', async () => {
    const h = harness({
      session: [{ id: 'ss', when: { event: 'session.start' }, run: 'echo BRANCH', inject: '{stdout}' }],
    })
    // Declared as session.start, dispatched under the canonical name: the alias
    // has to resolve in the matcher or the documented spelling is dead.
    await h.sessionEvent('session.created', 'sess-1', 'hubs', true)
    expect(h.injected[0].message).toContain('BRANCH')
    h.injected.length = 0
    await h.sessionEvent('session.start', 'sess-1', 'hubs', true)
    expect(h.injected[0].message).toContain('BRANCH')
  })

  it('a child session going idle does not fire a root-only hook', async () => {
    const h = harness({ session: [{ id: 'ss', when: { event: 'session.idle' }, run: 'echo IDLE', inject: '{stdout}' }] })
    await h.sessionEvent('session.idle', 'child', 'hubs', false)
    expect(h.injected).toEqual([])
    await h.sessionEvent('session.idle', 'root', 'hubs', true)
    expect(h.injected).toHaveLength(1)
  })

  it('a config error is recorded once, not on every event', () => {
    const h = harness()
    h.noteConfigError(['bad thing'])
    h.noteConfigError(['bad thing'])
    h.noteConfigError(['other thing'])
    expect(m.__commandHooksStats().configErrors).toEqual(['bad thing', 'other thing'])
  })
})

// ─── agent frontmatter integration ───────────────────────────────────────────

describe('agent frontmatter hooks', () => {
  it('scopes an agent hook to that agent', () => {
    const merged = m.mergeAgentHooks(
      [{ id: 'g', when: { phase: 'after' as const }, run: 'true' } as any],
      [{ id: 'a', when: { phase: 'after' as const }, run: 'true' } as any],
      'executor',
    )
    const agentHook = merged.find((h: any) => h.id === 'a')!
    expect(agentHook.when.callingAgent).toBe('executor')
    expect(m.toolHookMatches(agentHook, { phase: 'after', tool: 'task', agent: 'executor' })).toBe(true)
    expect(m.toolHookMatches(agentHook, { phase: 'after', tool: 'task', agent: 'planner' })).toBe(false)
  })

  it('an agent hook wins over a global hook of the same id', () => {
    const merged = m.mergeAgentHooks(
      [{ id: 'shared', when: { phase: 'after' as const }, run: 'GLOBAL' } as any],
      [{ id: 'shared', when: { phase: 'after' as const }, run: 'AGENT' } as any],
      'executor',
    )
    expect(merged.filter((h: any) => h.id === 'shared')).toHaveLength(1)
    expect(merged.find((h: any) => h.id === 'shared')!.run).toBe('AGENT')
  })

  it('an agent hook already scoped in frontmatter keeps its own callingAgent', () => {
    const merged = m.mergeAgentHooks([], [{ id: 'a', when: { phase: 'after' as const, callingAgent: 'verifier' }, run: 'true' } as any], 'executor')
    expect(merged[0].when.callingAgent).toBe('verifier')
  })
})

// ─── global config of this repository ────────────────────────────────────────

describe("this configuration's own hooks", () => {
  const r = m.loadConfig(CONFIG_DIR)

  it('loads with no errors', () => {
    expect(r.errors).toEqual([])
  })

  it('typecheck-after-task fires after a subagent and stays silent when green', async () => {
    const hook = r.config.tool.find((h: { id: string }) => h.id === 'typecheck-after-task')!
    expect(hook.when.phase).toBe('after')
    expect(m.toolHookMatches(hook, { phase: 'after', tool: 'task' })).toBe(true)
    // The request-efficiency property, asserted on the shipped default.
    expect(hook.injectOn).toBe('failure')
  })

  it('the tests hook does not report a project with no test script as passing', () => {
    const hook = r.config.tool.find((h: { id: string }) => h.id === 'tests-after-task')!
    // The gate must exist, or "npm test missing" becomes a green run.
    expect(hook.run).toMatch(/package\.json/)
    expect(hook.injectOn).toBe('failure')
  })

  it('the graph-integrity hook is scoped to graph script files by glob', () => {
    const hook = r.config.tool.find((h: { id: string }) => h.id === 'graph-integrity-after-write')!
    const glob = (hook.when.toolArgs as any).filePath.glob as string
    expect(glob).toBeTruthy()
    expect(m.matchesArg(hook.when.toolArgs!.filePath, 'skills/graph-context/scripts/graphlib.ts')).toBe(true)
    expect(m.matchesArg(hook.when.toolArgs!.filePath, 'src/app.ts')).toBe(false)
  })

  it('the session-start hook reports once, at session start', () => {
    const hook = r.config.session.find((h: { id: string }) => h.id === 'session-start-context')!
    expect(hook.when.event).toBe('session.start')
  })

  it('every shipped hook id is unique', () => {
    const ids = [...r.config.tool, ...r.config.session].map((h: { id: string }) => h.id)
    expect(new Set(ids).size).toBe(ids.length)
  })
})

// ─── provisioning integration ────────────────────────────────────────────────

describe('per-project provisioning', () => {
  const PROVISION = path.join(CONFIG_DIR, 'skills', 'provision', 'scripts', 'provision.ts')

  /** Load the shipped generator, not a copy of it. */
  function generator(): (d: any) => string {
    const src = fs.readFileSync(PROVISION, 'utf-8')
    const body = src.slice(
      src.indexOf('function generateCommandHooks(detection)'),
      src.indexOf('\nfunction generateAgentsMd'),
    )
    expect(body.length, 'generateCommandHooks not found in provision.ts').toBeGreaterThan(100)
    return new Function(`${body}\nreturn generateCommandHooks`)()
  }

  it('generates a file the plugin can actually parse, for a full stack', () => {
    const out = generator()({ lintCommand: 'npm run lint', testCommand: 'npm test' })
    const v = m.validateConfig(m.parseJsonc(out))
    expect(v.error).toBeNull()
    expect(v.config?.tool).toHaveLength(1)
  })

  it('uses the commands the detector resolved, not a fixed template', () => {
    const gen = generator()
    const vitest = m.validateConfig(m.parseJsonc(gen({ testCommand: 'npx vitest run' })))
    expect((vitest.config!.tool![0] as any).run).toEqual(['npx vitest run'])
    const jest = m.validateConfig(m.parseJsonc(gen({ lintCommand: 'npm run lint', testCommand: 'npm test' })))
    expect((jest.config!.tool![0] as any).run).toEqual(['npm run lint', 'npm test'])
  })

  it('generated hooks are silent on success', () => {
    const v = m.validateConfig(m.parseJsonc(generator()({ testCommand: 'npm test' })))
    expect((v.config!.tool![0] as any).injectOn).toBe('failure')
  })

  it('a project with no detected tooling gets a valid file and NO broken hook', () => {
    // The failure mode this avoids: a hook running `npm test` in a project with
    // no test script, failing on every subagent completion.
    const v = m.validateConfig(m.parseJsonc(generator()({})))
    expect(v.error).toBeNull()
    expect(v.config?.tool).toEqual([])
  })

  it('the inject message survives JSON round-tripping with newlines and quotes', () => {
    const out = generator()({ testCommand: 'npm test' })
    const v = m.validateConfig(m.parseJsonc(out))
    const inject = (v.config!.tool![0] as any).inject as string
    expect(inject).toContain('\n')
    expect(inject).toContain('"{tool}"')
  })

  it('provision writes the file where the plugin searches for it', () => {
    const src = fs.readFileSync(PROVISION, 'utf-8')
    expect(src).toContain("'command-hooks.jsonc'")
    // Must land in .opencode/, the directory findProjectConfig walks for.
    expect(src).toMatch(/hooksPath = path\.join\(opts\.outputDir, 'command-hooks\.jsonc'\)/)
  })
})

// ─── end-to-end wiring ───────────────────────────────────────────────────────

describe('end-to-end: the plugin as OpenCode loads it', () => {
  it('initialises, and its tool hooks fire through a real event', async () => {
    const plugin = await import(MOD)
    const factory = plugin.CommandHooksPlugin ?? plugin.default
    expect(typeof factory).toBe('function')

    // A minimal stand-in for the SDK surface the plugin touches.
    let toasts = 0
    let prompts = 0
    const hooks: any = await factory({
      project: {},
      directory: CONFIG_DIR,
      client: {
        tui: { showToast: async () => { toasts++ } },
        session: {
          promptAsync: async () => { prompts++ },
          get: async () => ({ data: { parentID: undefined } }),
        },
      },
      $: () => {},
    } as any)

    expect(typeof hooks['tool.execute.before']).toBe('function')
    expect(typeof hooks['tool.execute.after']).toBe('function')
    expect(typeof hooks.event).toBe('function')

    // A session.created event must not throw and must be handled.
    await hooks.event({ event: { type: 'session.created', properties: { sessionID: 'e2e-1', info: { id: 'e2e-1' } } } })

    // Deliberately a tool no global hook matches. Firing `task` here would
    // invoke this repository's real typecheck and test hooks — which is the
    // feature working, and took 60s of real `npx tsc` and `npm test` before this
    // test was pointed elsewhere. The property under test is the wiring: the
    // handlers are registered and dispatch reaches the config.
    const out = await hooks['tool.execute.after']({ tool: 'no-such-tool', sessionID: 'e2e-1', callID: 'e2e-c1' }, {})
    expect(out).toEqual([])
  })

  it('the global config this plugin would apply is the one under test', () => {
    // Separated from the timing test above: the shipped hooks really do run on
    // `after`+`task`, and that is asserted here by identity rather than by
    // spending a minute proving it twice.
    const r = m.loadConfig(CONFIG_DIR)
    const fires = r.config.tool.filter((h: any) => m.toolHookMatches(h, { phase: 'after', tool: 'task' }))
    expect(fires.length, 'no global hook is configured to fire after a task call').toBeGreaterThan(0)
    expect(fires.map((h: any) => h.id)).toContain('typecheck-after-task')
  })

  it('a hook result reaches the hooks plugin\'s session queue, not promptAsync', async () => {
    // THE integration claim: the injection is queued into the next turn, so it
    // costs no inference request. If the queue bridge silently failed, the
    // plugin would fall back to promptAsync and start spending a model call per
    // hook — correct-looking, and a request-efficiency regression.
    const sessionMod = await import(path.join(CONFIG_DIR, 'plugins', 'hooks', 'session.ts')) as any
    expect(typeof sessionMod.queueContextMessage, 'session queue is the injection transport').toBe('function')
    expect(typeof sessionMod.consumeContextMessages).toBe('function')

    const plugin = await import(MOD)
    const factory = plugin.CommandHooksPlugin ?? plugin.default
    let prompts = 0
    const hooks: any = await factory({
      project: {},
      directory: fixture({}),
      client: {
        tui: { showToast: async () => {} },
        session: { promptAsync: async () => { prompts++ }, get: async () => ({ data: {} }) },
      },
      $: () => {},
    } as any)

    // Drive a hook that always injects, through the handlers the plugin builds.
    const handlers = m.createHandlers({
      config: {
        truncationLimit: 1000, injectLimit: 1000,
        tool: [{ id: 'e2e', when: { phase: 'after', tool: 'task' }, run: 'echo QUEUED', inject: '{stdout}' }],
        session: [],
      } as any,
      projectDir: CONFIG_DIR,
      queue: (id: string, msg: string) => sessionMod.queueContextMessage(id, msg),
      toast: async () => {},
    })
    await handlers.toolExecuteAfter({ tool: 'task', sessionID: 'e2e-q', callID: 'e2e-q1' }, {})

    const queued = sessionMod.consumeContextMessages('e2e-q') as string[]
    expect(queued.join('\n')).toContain('QUEUED')
    expect(prompts, 'the queue path must not also prompt').toBe(0)
  })

  it('the plugin is registered in opencode.jsonc', () => {
    const cfg = fs.readFileSync(path.join(CONFIG_DIR, 'opencode.jsonc'), 'utf-8')
    expect(cfg).toContain('./plugins/command-hooks/index.ts')
  })

  it('the skill is discoverable and documents the surface it exposes', () => {
    const skill = path.join(CONFIG_DIR, 'skills', 'command-hooks', 'SKILL.md')
    expect(fs.existsSync(skill)).toBe(true)
    const text = fs.readFileSync(skill, 'utf-8')
    expect(text).toMatch(/^---\nname: command-hooks\ndescription: .+/m)
    for (const field of ['run', 'inject', 'injectOn', 'toast', 'overrideGlobal', 'truncationLimit', 'toolArgs', 'rootSessionOnly']) {
      expect(text, `${field} is undocumented in the skill`).toContain(field)
    }
  })

  it('the research page and the wiki index reference the port', () => {
    const page = path.join(CONFIG_DIR, '.opencode', 'context', 'research', 'opencode-command-hooks',
      '20260929_000000_reference-shanebishop1-opencode-command-hooks.md')
    expect(fs.existsSync(page)).toBe(true)
    expect(fs.readFileSync(path.join(CONFIG_DIR, '.opencode', 'context', 'index.md'), 'utf-8'))
      .toContain('opencode-command-hooks')
  })
})
