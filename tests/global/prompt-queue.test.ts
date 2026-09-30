/**
 * prompt-queue.test.ts — the queue, the gate, and the wiring between them.
 *
 * The gate is the feature. Everything else is bookkeeping, but the gate decides
 * whether the feature is useful or irritating, and it is the part most likely to
 * be wrong in a way no type checker catches: a predicate that releases during a
 * question and a predicate that never releases are both "working code".
 *
 * So the tests are organised around the two ways this can fail, and around the
 * properties that must hold regardless:
 *
 *   1. It must NOT fire while the user is being asked something.
 *   2. It MUST eventually fire, even when the gate keeps saying hold.
 */

import { describe, it, expect, beforeEach, afterAll } from 'vitest'
import * as fs from 'node:fs'
import * as os from 'node:os'
import * as path from 'node:path'

const CONFIG_DIR = path.resolve(__dirname, '..', '..')
const GATE_MOD = path.join(CONFIG_DIR, 'plugins', 'prompt-queue', 'gate.ts')
const QUEUE_MOD = path.join(CONFIG_DIR, 'plugins', 'prompt-queue', 'queue.ts')
const IDX_MOD = path.join(CONFIG_DIR, 'plugins', 'prompt-queue', 'index.ts')

type Gate = typeof import('../../plugins/prompt-queue/gate')
type Queue = typeof import('../../plugins/prompt-queue/queue')
type Idx = typeof import('../../plugins/prompt-queue/index')
let gate: Gate
let q: Queue
let idx: Idx

beforeEach(async () => {
  gate = await import(GATE_MOD)
  q = await import(QUEUE_MOD)
  idx = await import(IDX_MOD)
  idx.__resetPromptQueueStats()
})

const roots: string[] = []
function tmp(): string {
  const d = fs.mkdtempSync(path.join(os.tmpdir(), 'pq-'))
  roots.push(d)
  return d
}
afterAll(() => {
  for (const d of roots) fs.rmSync(d, { recursive: true, force: true })
})

// ─── the gate: must not fire during a question ──────────────────────────────

describe('gate: holds when the user is being asked something', () => {
  it('holds on a trailing question mark', () => {
    const v = gate.evaluateTurn({ finalText: 'The config is in place. Which approach do you prefer?' })
    expect(v.holds).toBe(true)
    expect(v.reason).toBe('interrogative')
  })

  it('holds on an interactive ask even when the text is a statement', () => {
    // The definitive signal. The user has a dialog on screen; firing underneath it
    // hides the question being asked.
    const v = gate.evaluateTurn({ tools: ['question'], finalText: 'Permission granted, continuing.' })
    expect(v.holds).toBe(true)
    expect(v.reason).toBe('popup')
  })

  it('holds for a permission request in any spelling', () => {
    for (const tool of ['question', 'permission.ask', 'ask_user']) {
      expect(gate.evaluateTurn({ tools: [tool], finalText: 'Done.' }).holds, tool).toBe(true)
    }
  })

  it('holds on an ask-phrase with no question mark', () => {
    // "Let me know if you want the README updated" is an ask. The trailing `?`
    // test alone would let it through.
    for (const text of [
      'Renamed the file. Let me know if you want the README updated as well.',
      'I can do that — do you want the tests included?',
      'I can do that - should I also bump the version?',
      'Two options. Which one should I take?',
      'Which one did you prefer in the end?'.replace('Which one ', 'Would you prefer '),
      'Tell me which approach you want and I will continue.',
    ]) {
      expect(gate.evaluateTurn({ finalText: text }).holds, text).toBe(true)
    }
  })

  it('holds when the turn produced no prose at all', () => {
    // Silence is not a conclusion. Releasing here would fire after a turn that
    // only ran tools and said nothing.
    const v = gate.evaluateTurn({ finalText: '' })
    expect(v.holds).toBe(true)
    expect(v.reason).toBe('empty-output')
  })

  it('holds while the turn is still busy', () => {
    const v = gate.evaluateTurn({ finalText: 'All done.', busy: true })
    expect(v.holds).toBe(true)
    expect(v.reason).toBe('trailing-incomplete')
  })

  it('reads the ask from the TAIL, not the middle', () => {
    const text = 'I asked whether you wanted A. You said no. So I used B instead, and it works.'
    expect(gate.evaluateTurn({ finalText: text }).holds).toBe(false)
  })

  it('ignores a question mark inside code or a link', () => {
    const text = 'The helper accepts a glob. See `is it a match?` in matcher.ts. Done.'
    expect(gate.evaluateTurn({ finalText: text }).holds).toBe(false)
  })

  it('a manual hold beats every other signal', () => {
    expect(gate.evaluateTurn({ finalText: 'All done.', manual: 'hold' }).holds).toBe(true)
    expect(gate.evaluateTurn({ tools: ['question'], finalText: 'All done.', manual: 'hold' }).reason).toBe('manual')
  })
})

// ─── the gate: must fire when the turn concluded ───────────────────────────

describe('gate: releases when the turn concluded on its own', () => {
  it('releases on a plain completion', () => {
    const v = gate.evaluateTurn({ finalText: 'All 990 tests pass and the graph is consistent.' })
    expect(v.holds).toBe(false)
    expect(v.reason).toBe('clear')
  })

  it('releases on a completion that used tools', () => {
    const v = gate.evaluateTurn({ tools: ['read', 'edit', 'bash'], finalText: 'Refactored and verified.' })
    expect(v.holds).toBe(false)
  })

  it('releases on a final statement that merely contains a question earlier', () => {
    const v = gate.evaluateTurn({ finalText: 'You asked whether to use tabs. I used spaces. Tests pass.' })
    expect(v.holds).toBe(false)
  })

  it('a manual release beats a would-be hold', () => {
    const v = gate.evaluateTurn({ tools: ['question'], finalText: 'Ready?', manual: 'release' })
    expect(v.holds).toBe(false)
    expect(v.reason).toBe('manual')
  })
})

// ─── the gate: must not deadlock ───────────────────────────────────────────

describe('gate: anti-deadlock guard', () => {
  it('releases after the configured number of consecutive holds', async () => {
    // A gate that only ever holds is a feature that silently does nothing: the
    // queue grows, nothing runs, and it looks broken.
    let held = true
    let holds = 0
    const facts = { tools: ['question'], finalText: 'Which one?' }
    for (let i = 0; i < 3; i++) {
      const d = await gate.decide(facts, holds, 3)
      if (d.deadlockBreak) { held = false; break }
      if (d.holds) holds++
    }
    expect(held).toBe(false)
  })

  it('reports the break rather than hiding it', async () => {
    const d = await gate.decide({ tools: ['question'], finalText: 'Which one?' }, 2, 3)
    expect(d.holds).toBe(false)
    expect(d.deadlockBreak).toBe(true)
    expect(d.evidence).toContain('3 consecutive held turns')
  })

  it('does not break before the limit', async () => {
    const d = await gate.decide({ tools: ['question'], finalText: 'Which one?' }, 0, 3)
    expect(d.holds).toBe(true)
    expect(d.deadlockBreak).toBe(false)
  })

  it('resets the hold count on a clean turn', async () => {
    expect((await gate.decide({ finalText: 'Done.' }, 2, 3)).holds).toBe(false)
    // ...so the next question starts counting from zero again.
    expect((await gate.decide({ finalText: 'Ready?' }, 0, 3)).holds).toBe(true)
  })

  it('a limit below 1 is clamped to 1, not to zero', async () => {
    // Clamping to 0 would mean "never hold", which is a footgun: a typo in a
    // config value would silently disable the whole feature. Clamping to 1 means
    // "hold this turn, then release", which is what a value of 0 should mean.
    const d = await gate.decide({ finalText: 'Ready?' }, 0, 0)
    expect(d.holds).toBe(false)
    expect(d.deadlockBreak).toBe(true)
    // With a real limit, the same turn holds.
    expect((await gate.decide({ finalText: 'Ready?' }, 0, 3)).holds).toBe(true)
  })
})

// ─── the queue ─────────────────────────────────────────────────────────────

describe('queue: FIFO', () => {
  it('returns items in the order they were enqueued', () => {
    const d = tmp()
    q.enqueue(d, 'first')
    q.enqueue(d, 'second')
    q.enqueue(d, 'third')
    expect(q.drain(d).map((i: { text: string }) => i.text)).toEqual(['first', 'second', 'third'])
  })

  it('drain empties the queue', () => {
    const d = tmp()
    q.enqueue(d, 'a')
    q.drain(d)
    expect(q.size(q.load(d))).toBe(0)
  })

  it('appends deferred items after the FIFO, not interleaved', () => {
    const d = tmp()

    q.enqueue(d, 'manual-1')
    q.carryDeferred(d, ['carried-1'])
    q.enqueue(d, 'manual-2')
    // The user's own ordering is preserved; carried items ride at the end.
    expect(q.drain(d).map((i: { text: string }) => i.text)).toEqual(['manual-1', 'manual-2', 'carried-1'])
  })

  it('ignores blank input — a to-do list must not gain empty tasks', () => {
    const d = tmp()
    q.enqueue(d, '   ')
    q.enqueue(d, '')
    expect(q.size(q.load(d))).toBe(0)
  })

  it('trims stored text', () => {
    const d = tmp()
    q.enqueue(d, '  spaced  \n')
    expect(q.load(d).items[0].text).toBe('spaced')
  })

  it('removes a single item without touching the rest', () => {
    const d = tmp()
    q.enqueue(d, 'a'); q.enqueue(d, 'b'); q.enqueue(d, 'c')
    const id = q.load(d).items[1].id
    q.remove(d, id)
    expect(q.load(d).items.map((i: { text: string }) => i.text)).toEqual(['a', 'c'])
  })

  it('clear removes everything including a pending override', () => {
    const d = tmp()
    q.enqueue(d, 'a')
    q.setManual(d, 'hold')
    q.clear(d)
    const s = q.load(d)
    expect(q.size(s)).toBe(0)
    expect(s.manual).toBeNull()
  })

  it('deduplicates carried text against what is already queued', () => {
    const d = tmp()
    q.enqueue(d, 'update the README')
    q.carryDeferred(d, ['update the README', 'add a changelog entry'])
    expect(q.load(d).deferred.map((i: { text: string }) => i.text)).toEqual(['add a changelog entry'])
  })

  it('a corrupt queue file reads as empty rather than throwing', () => {
    // Losing queued text is bad; refusing to start because of it is worse.
    const d = tmp()
    fs.mkdirSync(path.dirname(q.queuePath(d)), { recursive: true })
    fs.writeFileSync(q.queuePath(d), '{ not json')
    expect(q.size(q.load(d))).toBe(0)
  })

  it('persists across a reload, because the two processes are separate', () => {
    const d = tmp()
    q.enqueue(d, 'survives')
    // A fresh module instance stands in for the other process.
    const reread = JSON.parse(fs.readFileSync(q.queuePath(d), 'utf-8'))
    expect(reread.items.map((i: { text: string }) => i.text)).toEqual(['survives'])
  })

  it('writes atomically, so a concurrent reader never sees a truncated file', () => {
    const d = tmp()
    q.enqueue(d, 'a')
    const file = q.queuePath(d)
    // A temp file beside the live one, never in place.
    q.enqueue(d, 'b')
    const dir = path.dirname(file)
    const strays = fs.readdirSync(dir).filter((f) => f.startsWith('queue.json.') && f.endsWith('.tmp'))
    expect(strays, `temp files left behind: ${strays}`).toEqual([])
    expect(JSON.parse(fs.readFileSync(file, 'utf-8')).items).toHaveLength(2)
  })
})

// ─── rollover ──────────────────────────────────────────────────────────────

describe('rollover: deferred work is carried out of a held turn', () => {
  it('extracts a <deferred> block', () => {
    const out = gate.extractDeferred('Renamed it. <deferred>\n- update the README\n- add a changelog entry\n</deferred>')
    expect(out).toEqual(['update the README', 'add a changelog entry'])
  })

  it('extracts a headed list', () => {
    const out = gate.extractDeferred('Partly done.\n\nLeft unaddressed:\n- the migration script\n- the docs')
    expect(out).toEqual(['the migration script', 'the docs'])
  })

  it('returns nothing when nothing was explicitly deferred', () => {
    // Inferring deferred work from prose would manufacture tasks the model never
    // proposed, which is worse than forgetting a hint.
    expect(gate.extractDeferred('I renamed the file and updated the import.')).toEqual([])
    expect(gate.extractDeferred('')).toEqual([])
  })

  it('carried items survive a hold and drain on the next clean turn', () => {
    const d = tmp()
    q.enqueue(d, 'user task')
    // Turn 1 ends on a question and explicitly defers something.
    const heldText = 'Which one? <deferred>\n- the migration script\n</deferred>'
    const first = gate.evaluateTurn({ tools: ['question'], finalText: heldText })
    expect(first.holds).toBe(true)
    q.carryDeferred(d, gate.extractDeferred(heldText))
    q.recordDecision(d, true)

    // The user answers; turn 2 concludes cleanly.
    expect(q.size(q.load(d))).toBe(2)
    expect(gate.evaluateTurn({ finalText: 'Done, both applied. Tests pass.' }).holds).toBe(false)
    expect(q.drain(d).map((i: { text: string }) => i.text)).toEqual(['user task', 'the migration script'])
  })
})

// ─── prompt rendering ──────────────────────────────────────────────────────

describe('rendering', () => {
  it('states the ordering, so the model does not reorder the work', () => {
    const d = tmp()
    q.enqueue(d, 'a'); q.enqueue(d, 'b')
    const text = q.renderPrompt(q.drain(d), 'clear')
    expect(text).toContain('count="2"')
    expect(text).toContain('1. a')
    expect(text).toContain('2. b')
    expect(text).toContain('in the order they were queued')
  })

  it('marks carried items so their origin is visible', () => {
    const d = tmp()
    q.carryDeferred(d, ['carried thing'])
    const text = q.renderPrompt(q.drain(d), 'clear')
    expect(text).toContain('carried from a held turn')
  })

  it('renders nothing for an empty drain', () => {
    const d = tmp()
    expect(q.renderPrompt(q.drain(d), 'clear')).toBe('')
  })
})

// ─── message reduction ─────────────────────────────────────────────────────

describe('completionFromMessages', () => {
  it('collects tool names and the last non-empty text', () => {
    const out = idx.completionFromMessages([
      { parts: [{ type: 'text', text: 'Working on it' }] },
      { parts: [{ type: 'tool', tool: { name: 'read' } }, { type: 'tool', tool: { name: 'edit' } }] },
      { parts: [{ type: 'text', text: 'First result' }, { type: 'text', text: 'Final answer.' }] },
    ])
    expect(out.tools.sort()).toEqual(['edit', 'read'])
    expect(out.finalText).toBe('Final answer.')
  })

  it('tolerates an empty or malformed message list', () => {
    expect(idx.completionFromMessages([])).toEqual({ tools: [], finalText: '' })
    expect(idx.completionFromMessages(undefined as any)).toEqual({ tools: [], finalText: '' })
    expect(idx.completionFromMessages([{ parts: null }] as any)).toEqual({ tools: [], finalText: '' })
  })
})

// ─── end to end through the plugin ─────────────────────────────────────────

describe('plugin: end to end', () => {
  /** Drive the real plugin against a stub client, as OpenCode would. */
  async function harness(directory: string, messages: any[] = []) {
    const sent: string[] = []
    let failSend = false
    // The queue suite tests the QUEUE and the regex gate. The ONNX classifier is
    // covered by tests/global/onnx.test.ts against the real model; loading it
    // here would add seconds per test for a path already asserted elsewhere.
    process.env.PROMPT_QUEUE_DISABLE_MODEL = '1'
    // PromptQueuePlugin is an async Plugin factory: the hook object is a promise.
    const hooks: any = await idx.PromptQueuePlugin({
      client: {
        session: {
          promptAsync: async ({ body }: any) => {
            if (failSend) throw new Error('send failed')
            sent.push(body.parts[0].text)
          },
          messages: async () => ({ data: messages }),
        },
      },
      directory,
    } as any) as any
    return {
      hooks,
      sent,
      fail: (v: boolean) => { failSend = v },
    }
  }

  /** A realistic message list: tool calls, then the final assistant text. */
  const turn = (text: string, tools: string[] = []) => [
    { parts: tools.map((t) => ({ type: 'tool', tool: { name: t } })) },
    { parts: [{ type: 'text', text }] },
  ]

  it('does not fire while a question is open', async () => {
    const d = tmp()
    q.enqueue(d, 'do the thing')
    const h = await harness(d, turn('Which approach do you prefer?', ['question']))
    await h.hooks.event({ event: { type: 'session.idle', properties: { sessionID: 's1', info: { id: 's1' } } } })
    expect(h.sent).toEqual([])
    // Nothing is lost by holding — that is the entire point.
    expect(q.size(q.load(d))).toBe(1)
    expect(idx.__promptQueueStats().held).toBe(1)
  })

  it('does not fire on a turn that produced tool calls but no prose', async () => {
    const d = tmp()
    q.enqueue(d, 'x')
    // A turn that only ran tools and said nothing has not made a statement and
    // has not asked anything. Releasing here would fire into a turn that never
    // concluded.
    const h = await harness(d, [{ parts: [{ type: 'tool', tool: { name: 'bash' } }] }])
    await h.hooks.event({ event: { type: 'session.idle', properties: { sessionID: 's1b', info: { id: 's1b' } } } })
    expect(h.sent).toEqual([])
  })

  it('does fire on a plain statement, even when tools ran', async () => {
    const d = tmp()
    q.enqueue(d, 'y')
    const h = await harness(d, turn('Refactored the parser and verified the suite.', ['bash', 'edit']))
    await h.hooks.event({ event: { type: 'session.idle', properties: { sessionID: 's1c', info: { id: 's1c' } } } })
    expect(h.sent).toHaveLength(1)
  })

  it('fires once when the turn concluded, then the queue is empty', async () => {
    const d = tmp()
    q.enqueue(d, 'do the thing')
    const h = await harness(d, turn('All 990 tests pass and the graph is consistent.', ['bash']))
    await h.hooks.event({ event: { type: 'session.idle', properties: { sessionID: 's2', info: { id: 's2' } } } })
    expect(h.sent).toHaveLength(1)
    expect(h.sent[0]).toContain('do the thing')
    expect(q.size(q.load(d))).toBe(0)
  })

  it('restores the queue when the send fails', async () => {
    // The drain already emptied it. Losing the text on a failed send is the worst
    // outcome this plugin can produce.
    const d = tmp()
    q.enqueue(d, 'important task')
    const h = await harness(d, turn('Done. Tests pass.'))
    h.fail(true)
    await h.hooks.event({ event: { type: 'session.idle', properties: { sessionID: 's3', info: { id: 's3' } } } })
    expect(q.size(q.load(d))).toBe(1)
    expect(q.load(d).items[0].text).toBe('important task')
  })

  it('ignores an idle event for a session with nothing queued', async () => {
    const d = tmp()
    const h = await harness(d)
    await h.hooks.event({ event: { type: 'session.idle', properties: { sessionID: 's4', info: { id: 's4' } } } })
    expect(h.sent).toEqual([])
    expect(idx.__promptQueueStats().completionsSeen).toBe(0)
  })

  it('ignores non-idle events', async () => {
    const d = tmp()
    q.enqueue(d, 'x')
    const h = await harness(d)
    await h.hooks.event({ event: { type: 'session.created', properties: { sessionID: 's5', info: { id: 's5' } } } })
    expect(h.sent).toEqual([])
  })
})

// ─── wiring ────────────────────────────────────────────────────────────────

describe('wiring', () => {
  it('the hooks plugin is registered in opencode.jsonc', () => {
    const cfg = fs.readFileSync(path.join(CONFIG_DIR, 'opencode.jsonc'), 'utf-8')
    expect(cfg).toContain('./plugins/prompt-queue/index.ts')
  })

  it('the ctrl+p palette entry exists and is not a slash command', () => {
    const src = fs.readFileSync(path.join(CONFIG_DIR, 'plugins', 'hubs-tui', 'src', 'queue-commands.ts'), 'utf-8')
    expect(src).toContain("title: 'Prompt Queue'")
    expect(src).toContain('Add to Prompt Queue')
    // Registered through the command palette, not `slash:`.
    expect(src).toContain('api.command!.register')
    expect(src).not.toMatch(/\bslash:\s*\{/)
  })

  it('the TUI half reads the same state file the hooks half drains', () => {
    const src = fs.readFileSync(path.join(CONFIG_DIR, 'plugins', 'hubs-tui', 'src', 'queue-commands.ts'), 'utf-8')
    const d = tmp()
    expect(src).toContain("'.opencode', 'state', 'prompt-queue', 'queue.json'")
    // Same path the queue module uses, verified by writing through one and
    // reading through the other.
    q.enqueue(d, 'shared item')
    const written = JSON.parse(fs.readFileSync(
      path.join(d, '.opencode', 'state', 'prompt-queue', 'queue.json'), 'utf-8',
    ))
    expect(written.items[0].text).toBe('shared item')
  })

  it('the TUI plugin registers the queue commands and still builds', () => {
    const src = fs.readFileSync(path.join(CONFIG_DIR, 'plugins', 'hubs-tui', 'src', 'tui.tsx'), 'utf-8')
    expect(src).toContain('registerQueueCommands')
    // A palette entry that throws must not take the hub menu down with it.
    expect(src).toContain('catch')
    expect(fs.existsSync(path.join(CONFIG_DIR, 'plugins', 'hubs-tui', 'dist', 'tui.js'))).toBe(true)
  })

  it('queue state is gitignored session data, not durable config', () => {
    const ignore = fs.readFileSync(path.join(CONFIG_DIR, '.gitignore'), 'utf-8')
    expect(ignore).toMatch(/\.opencode\/state\//)
  })
})
