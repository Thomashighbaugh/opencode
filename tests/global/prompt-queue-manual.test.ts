/**
 * prompt-queue-manual.test.ts — the manual control surface.
 *
 * Written in response to "the queue never fires prompts". The mechanism behind
 * that report is specific and worth pinning, because nothing throws and nothing
 * logs:
 *
 *   - The only trigger was `session.idle`, which fires on a *transition* into
 *     idle. Arming a release while already idle produced no new event, so
 *     "Run queued prompts now" waited for a message that might never come.
 *   - The idle handler returned early on an empty queue *without* resetting the
 *     hold counter, so `consecutiveHolds` stayed frozen and the anti-deadlock
 *     budget was already spent by the time anything was queued.
 *   - The send-failure restore called `require()` inside an ES module, so the one
 *     path whose only job was to avoid losing queued work was itself the thing
 *     that threw.
 *
 * The fire-request tests assert the *mechanism*, not the happy path: a request
 * file exists, is per-request, is consumable exactly once, and survives a failed
 * send with the items back in order.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import * as fs from 'node:fs'
import * as os from 'node:os'
import * as path from 'node:path'

const CONFIG_DIR = path.resolve(__dirname, '..', '..')

const q: typeof import('../../plugins/prompt-queue/queue') = await import(
  path.join(CONFIG_DIR, 'plugins', 'prompt-queue', 'queue.ts')
)

let tmp: string
beforeEach(() => {
  tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'pq-'))
})
afterEach(() => {
  fs.rmSync(tmp, { recursive: true, force: true })
})

// ─── the regression: an arm-then-wait control does nothing ────────────────

describe('fire requests: an event of its own', () => {
  it('requestFire writes a request the hooks plugin can watch for', () => {
    const token = q.requestFire(tmp, { reason: 'test' })
    const pending = q.pendingFireRequests(tmp)
    expect(pending).toHaveLength(1)
    expect(pending[0].req.reason).toBe('test')
    expect(pending[0].file).toContain(token)
  })

  it('two requests in quick succession do not collapse into one', () => {
    // The coalescing hazard that rules out a single fixed filename: `file.edited`
    // is debounced, so two writes to one path can produce one event and the
    // second request would vanish.
    q.requestFire(tmp, { reason: 'first' })
    q.requestFire(tmp, { reason: 'second' })
    const pending = q.pendingFireRequests(tmp)
    expect(pending).toHaveLength(2)
    expect(pending.map((p) => p.req.reason)).toEqual(['first', 'second'])
  })

  it('requests are returned oldest first', () => {
    q.requestFire(tmp, { reason: 'older' })
    q.requestFire(tmp, { reason: 'newer' })
    expect(q.pendingFireRequests(tmp)[0].req.reason).toBe('older')
  })

  it('a request carries ids so one item can be fired alone', () => {
    q.requestFire(tmp, { reason: 'one', ids: ['abc', 'def'] })
    expect(q.pendingFireRequests(tmp)[0].req.ids).toEqual(['abc', 'def'])
  })

  it('an empty id list means everything queued, not nothing', () => {
    // Stated explicitly because the alternative reading — "fire nothing" — would
    // make the common case silently do the wrong thing.
    q.requestFire(tmp, { reason: 'all' })
    expect(q.pendingFireRequests(tmp)[0].req.ids).toEqual([])
  })

  it('claiming a request removes it from the pending set', () => {
    q.requestFire(tmp, { reason: 'once' })
    const pending = q.pendingFireRequests(tmp)
    const claimed = q.claimFire(tmp, pending[0].file)
    expect(claimed).toBeTruthy()
    // The point of the rename: a second pass must see nothing, whatever order
    // the file events arrive in.
    expect(q.pendingFireRequests(tmp)).toHaveLength(0)
  })

  it('claiming twice yields null the second time', () => {
    q.requestFire(tmp, { reason: 'once' })
    const { file } = q.pendingFireRequests(tmp)[0]
    expect(q.claimFire(tmp, file)).toBeTruthy()
    expect(q.claimFire(tmp, file)).toBeNull()
  })

  it('the claim happens before the drain, so a drain-triggered event cannot re-fire', () => {
    // Draining writes queue.json, which is itself a file.edited event. If the
    // request were still pending at that moment the batch would fire twice.
    q.enqueue(tmp, 'the task')
    q.requestFire(tmp, { reason: 'once' })
    const { file } = q.pendingFireRequests(tmp)[0]

    q.claimFire(tmp, file)
    q.drain(tmp) // writes queue.json — the nested event this guards against

    expect(q.pendingFireRequests(tmp)).toHaveLength(0)
  })

  it('a finished request is removed from disk, not left to accumulate', () => {
    q.requestFire(tmp, { reason: 'x' })
    const claimed = q.claimFire(tmp, q.pendingFireRequests(tmp)[0].file)!
    q.finishFire(tmp, claimed, { fired: 1, rendered: 'r' })
    const dir = path.join(tmp, '.opencode', 'state', 'prompt-queue')
    expect(fs.readdirSync(dir).filter((n) => n.startsWith('fire-now.') || n.startsWith('fired.'))).toEqual([])
  })

  it('a corrupt request file is skipped, not acted on', () => {
    q.requestFire(tmp, { reason: 'good' })
    // Simulates a read landing while the writer is mid-write. Firing a truncated
    // request could send a partial batch, so skipping is the safe direction.
    fs.writeFileSync(path.join(tmp, '.opencode', 'state', 'prompt-queue', 'fire-now.zzz.json'), '{trunc', 'utf-8')
    const pending = q.pendingFireRequests(tmp)
    expect(pending).toHaveLength(1)
    expect(pending[0].req.reason).toBe('good')
  })

  it('no request directory means no pending requests, not a throw', () => {
    expect(q.pendingFireRequests(path.join(tmp, 'nope'))).toEqual([])
  })

  it('clearing the queue also clears pending fire requests', () => {
    // Otherwise a request written before a clear resurrects the queue afterwards.
    q.enqueue(tmp, 'do the thing')
    q.requestFire(tmp, { reason: 'x' })
    q.clear(tmp)
    expect(q.pendingFireRequests(tmp)).toHaveLength(0)
    expect(q.size(q.load(tmp))).toBe(0)
  })

  it('lastFire reports what happened, including a failure', () => {
    // A claimed-but-unfinished file stands in for the window between claiming
    // and finishing, which is exactly when a crash would leave the record.
    q.requestFire(tmp, { reason: 'failing' })
    const { file, req } = q.pendingFireRequests(tmp)[0]
    const claimed = q.claimFire(tmp, file)!
    const dir = path.join(tmp, '.opencode', 'state', 'prompt-queue')
    fs.writeFileSync(
      path.join(dir, claimed),
      JSON.stringify({ ...req, consumedAt: new Date().toISOString(), result: { fired: 0, rendered: 'r', error: 'send failed' } }),
    )
    const last = q.lastFire(tmp)
    expect(last?.result?.error).toBe('send failed')
    expect(last?.reason).toBe('failing')
  })
})

// ─── draining a subset ────────────────────────────────────────────────────

describe('drainIds', () => {
  it('fires only the named items and leaves the rest queued', () => {
    q.enqueue(tmp, 'first')
    q.enqueue(tmp, 'second')
    q.enqueue(tmp, 'third')
    const target = q.load(tmp).items[1]

    const fired = q.drainIds(tmp, [target.id])
    expect(fired.map((i) => i.text)).toEqual(['second'])
    // The order of what remains must survive — firing one item is not a licence
    // to reshuffle the rest.
    expect(q.load(tmp).items.map((i) => i.text)).toEqual(['first', 'third'])
  })

  it('an empty id list drains nothing rather than everything', () => {
    q.enqueue(tmp, 'a')
    q.enqueue(tmp, 'b')
    expect(q.drainIds(tmp, [])).toEqual([])
    expect(q.size(q.load(tmp))).toBe(2)
  })

  it('unknown ids drain nothing', () => {
    q.enqueue(tmp, 'a')
    expect(q.drainIds(tmp, ['not-a-real-id'])).toEqual([])
    expect(q.size(q.load(tmp))).toBe(1)
  })

  it('drains deferred items too', () => {
    q.enqueue(tmp, 'manual one')
    q.carryDeferred(tmp, ['carried one'])
    const carried = q.load(tmp).deferred[0]
    const fired = q.drainIds(tmp, [carried.id])
    expect(fired).toHaveLength(1)
    expect(q.load(tmp).deferred).toHaveLength(0)
    expect(q.load(tmp).items).toHaveLength(1)
  })

  it('emptying the queue by id resets the hold counter, as a full drain does', () => {
    q.enqueue(tmp, 'a')
    q.recordHold(tmp, true)
    q.recordHold(tmp, true)
    expect(q.load(tmp).consecutiveHolds).toBe(2)
    const id = q.load(tmp).items[0].id
    q.drainIds(tmp, [id])
    expect(q.load(tmp).consecutiveHolds).toBe(0)
  })
})

// ─── edit ─────────────────────────────────────────────────────────────────

describe('update: edit in place', () => {
  it('rewrites the text without changing position', () => {
    // The reason this is not remove-then-enqueue: re-adding at the end silently
    // reorders someone's plan.
    q.enqueue(tmp, 'alpha')
    q.enqueue(tmp, 'beta')
    q.enqueue(tmp, 'gamma')
    const middle = q.load(tmp).items[1]

    q.update(tmp, middle.id, 'beta corrected')
    expect(q.load(tmp).items.map((i) => i.text)).toEqual(['alpha', 'beta corrected', 'gamma'])
  })

  it('keeps the id, so the item stays referenceable', () => {
    q.enqueue(tmp, 'original')
    const id = q.load(tmp).items[0].id
    q.update(tmp, id, 'edited')
    expect(q.load(tmp).items[0].id).toBe(id)
  })

  it('stamps editedAt so the UI can mark a changed item', () => {
    q.enqueue(tmp, 'original')
    const id = q.load(tmp).items[0].id
    q.update(tmp, id, 'edited')
    expect(q.load(tmp).items[0].editedAt).toBeTruthy()
  })

  it('rejects a blank edit rather than emptying the item', () => {
    q.enqueue(tmp, 'keep me')
    const id = q.load(tmp).items[0].id
    q.update(tmp, id, '   ')
    expect(q.load(tmp).items[0].text).toBe('keep me')
  })

  it('trims the replacement text', () => {
    q.enqueue(tmp, 'before')
    const id = q.load(tmp).items[0].id
    q.update(tmp, id, '  after  ')
    expect(q.load(tmp).items[0].text).toBe('after')
  })

  it('edits a deferred item too', () => {
    q.carryDeferred(tmp, ['carried'])
    const id = q.load(tmp).deferred[0].id
    q.update(tmp, id, 'carried, edited')
    expect(q.load(tmp).deferred[0].text).toBe('carried, edited')
  })

  it('an unknown id changes nothing', () => {
    q.enqueue(tmp, 'untouched')
    q.update(tmp, 'nope', 'changed')
    expect(q.load(tmp).items[0].text).toBe('untouched')
  })
})

// ─── duplicate ────────────────────────────────────────────────────────────

describe('duplicate', () => {
  it('places the copy directly after the original', () => {
    // "Run this one again, right here" is the usual intent; a copy at the end of
    // the list is a different instruction.
    q.enqueue(tmp, 'a')
    q.enqueue(tmp, 'b')
    q.enqueue(tmp, 'c')
    const first = q.load(tmp).items[0]
    q.duplicate(tmp, first.id)
    expect(q.load(tmp).items.map((i) => i.text)).toEqual(['a', 'a', 'b', 'c'])
  })

  it('gives the copy a distinct id so removing one keeps the other', () => {
    q.enqueue(tmp, 'only')
    const original = q.load(tmp).items[0].id
    q.duplicate(tmp, original)
    const items = q.load(tmp).items
    expect(items).toHaveLength(2)
    expect(items[0].id).not.toBe(items[1].id)

    q.remove(tmp, items[0].id)
    expect(q.load(tmp).items).toHaveLength(1)
    expect(q.load(tmp).items[0].text).toBe('only')
  })

  it('records what the copy came from', () => {
    q.enqueue(tmp, 'source')
    const original = q.load(tmp).items[0].id
    q.duplicate(tmp, original)
    expect(q.load(tmp).items[1].copiedFrom).toBe(original)
  })

  it('preserves the source label', () => {
    q.carryDeferred(tmp, ['carried'])
    const id = q.load(tmp).deferred[0].id
    q.duplicate(tmp, id)
    expect(q.load(tmp).deferred[1].source).toBe('deferred')
  })

  it('duplicating the last item does not run off the end', () => {
    q.enqueue(tmp, 'solo')
    q.duplicate(tmp, q.load(tmp).items[0].id)
    expect(q.load(tmp).items).toHaveLength(2)
  })

  it('an unknown id adds nothing', () => {
    q.enqueue(tmp, 'a')
    q.duplicate(tmp, 'nope')
    expect(q.load(tmp).items).toHaveLength(1)
  })
})

// ─── reorder ──────────────────────────────────────────────────────────────

describe('move', () => {
  const seed = () => {
    q.enqueue(tmp, 'a')
    q.enqueue(tmp, 'b')
    q.enqueue(tmp, 'c')
    return q.load(tmp).items
  }

  it('moves an item earlier', () => {
    const items = seed()
    q.move(tmp, items[2].id, -1)
    expect(q.load(tmp).items.map((i) => i.text)).toEqual(['a', 'c', 'b'])
  })

  it('moves an item later', () => {
    const items = seed()
    q.move(tmp, items[0].id, 1)
    expect(q.load(tmp).items.map((i) => i.text)).toEqual(['b', 'a', 'c'])
  })

  it('moving the first item earlier is a no-op, not an error', () => {
    const items = seed()
    q.move(tmp, items[0].id, -1)
    expect(q.load(tmp).items.map((i) => i.text)).toEqual(['a', 'b', 'c'])
  })

  it('moving the last item later is a no-op, not an error', () => {
    const items = seed()
    q.move(tmp, items[2].id, 1)
    expect(q.load(tmp).items.map((i) => i.text)).toEqual(['a', 'b', 'c'])
  })

  it('does not reorder across the deferred boundary', () => {
    // Deferred items are appended after the FIFO on release by contract; letting
    // a manual move cross that line would break the documented drain order.
    q.enqueue(tmp, 'manual')
    q.carryDeferred(tmp, ['carried'])
    const carried = q.load(tmp).deferred[0]
    q.move(tmp, carried.id, -1)
    expect(q.load(tmp).items).toHaveLength(1)
    expect(q.load(tmp).deferred).toHaveLength(1)
  })

  it('an unknown id changes nothing', () => {
    seed()
    q.move(tmp, 'nope', -1)
    expect(q.load(tmp).items.map((i) => i.text)).toEqual(['a', 'b', 'c'])
  })

  it('preserves the drain order after reordering', () => {
    const items = seed()
    q.move(tmp, items[0].id, 1)
    expect(q.drain(tmp).map((i) => i.text)).toEqual(['b', 'a', 'c'])
  })
})

// ─── the ESM restore bug ──────────────────────────────────────────────────

describe('send-failure restore', () => {
  it('the hooks plugin is ESM and must not use require()', () => {
    // `require` is not defined in an ES module. The previous restore path called
    // it, so the one branch existing to avoid losing queued work threw a
    // ReferenceError instead — losing the work by a different route.
    //
    // Comments are stripped first: the fix is *documented* by naming the old
    // call, so a naive substring scan fails on its own explanation.
    const raw = fs.readFileSync(path.join(CONFIG_DIR, 'plugins', 'prompt-queue', 'index.ts'), 'utf-8')
    const code = raw.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '')
    expect(code).not.toMatch(/\brequire\(/)
    // And it must go through the atomic saver, not a hand-rolled write.
    expect(code).toMatch(/save\(dir, restored\)/)
  })

  it('restored items keep their original order ahead of anything queued since', () => {
    // The exact sequence the failed-send path has to reproduce.
    const failed = [
      { id: '1', text: 'first', enqueuedAt: '', source: 'manual' as const },
      { id: '2', text: 'second', enqueuedAt: '', source: 'manual' as const },
    ]
    q.drain(tmp)
    q.enqueue(tmp, 'queued meanwhile')
    const state = q.load(tmp)
    state.items = [...failed, ...state.items]
    q.save(tmp, state)
    expect(q.load(tmp).items.map((i) => i.text)).toEqual(['first', 'second', 'queued meanwhile'])
  })

  it('manual items are restored before deferred ones', () => {
    const items = [
      { id: '1', text: 'm1', enqueuedAt: '', source: 'manual' as const },
      { id: '2', text: 'd1', enqueuedAt: '', source: 'deferred' as const },
    ]
    const state = q.load(tmp)
    state.items = items.filter((i) => i.source === 'manual')
    state.deferred = items.filter((i) => i.source === 'deferred')
    q.save(tmp, state)
    const out = q.drain(tmp).map((i) => i.text)
    expect(out).toEqual(['m1', 'd1'])
  })
})

// ─── hold-counter hygiene ─────────────────────────────────────────────────

describe('hold counter', () => {
  it('recordDecision resets it on a clean turn', () => {
    q.recordHold(tmp, true)
    q.recordHold(tmp, true)
    expect(q.load(tmp).consecutiveHolds).toBe(2)
    q.recordDecision(tmp, false)
    expect(q.load(tmp).consecutiveHolds).toBe(0)
  })

  it('the idle handler resets a stale counter even with nothing queued', () => {
    // The bug: returning early on an empty queue left the counter frozen, so the
    // anti-deadlock budget was spent before the user queued anything and the
    // first decision could deadlock-break and fire immediately.
    q.recordHold(tmp, true)
    q.recordHold(tmp, true)
    expect(q.load(tmp).consecutiveHolds).toBe(2)
    // Mirrors the handler's empty-queue branch.
    const state = q.load(tmp)
    if (q.size(state) === 0 && !state.manual) q.recordDecision(tmp, false)
    expect(q.load(tmp).consecutiveHolds).toBe(0)
  })

  it('recordDecision consumes the one-shot manual override', () => {
    q.setManual(tmp, 'release')
    expect(q.load(tmp).manual).toBe('release')
    q.recordDecision(tmp, false)
    expect(q.load(tmp).manual).toBeNull()
  })
})

// ─── rendering ────────────────────────────────────────────────────────────

describe('renderPrompt', () => {
  it('names the reason so the model can tell a manual fire from a gate release', () => {
    q.enqueue(tmp, 'the task')
    const text = q.renderPrompt(q.drain(tmp), 'manual:tui:run-all')
    expect(text).toContain('reason="manual:tui:run-all"')
  })

  it('numbers items so the FIFO order is explicit', () => {
    q.enqueue(tmp, 'alpha')
    q.enqueue(tmp, 'beta')
    const text = q.renderPrompt(q.drain(tmp), 'clear')
    expect(text).toContain('1. alpha')
    expect(text).toContain('2. beta')
  })

  it('marks carried items as such', () => {
    q.carryDeferred(tmp, ['from a held turn'])
    const text = q.renderPrompt(q.drain(tmp), 'clear')
    expect(text).toContain('carried from a held turn')
  })

  it('an empty batch renders nothing rather than an empty instruction', () => {
    expect(q.renderPrompt([], 'clear')).toBe('')
  })
})
// ─── trigger redundancy ───────────────────────────────────────────────────

describe('fire trigger: belt and braces', () => {
  it('the plugin registers both an event trigger and a poll', () => {
    // `file.edited` alone is not sufficient: it is raised for edits the runtime
    // observes, and a request written by a tool or another process may not
    // produce one. Without the poll, "fire" would silently do nothing in exactly
    // the case it exists for.
    const src = fs.readFileSync(path.join(CONFIG_DIR, 'plugins', 'prompt-queue', 'index.ts'), 'utf-8')
    expect(src).toMatch(/event\.type === 'file\.edited'/)
    expect(src).toMatch(/setInterval\(/)
    // And the timer must never keep the process alive on shutdown.
    expect(src).toMatch(/unref/)
  })

  it('the idle path is still the automatic trigger, not the only one', () => {
    const src = fs.readFileSync(path.join(CONFIG_DIR, 'plugins', 'prompt-queue', 'index.ts'), 'utf-8')
    expect(src).toMatch(/session\.idle/)
  })

  it('the poll and the event path share one handler, so they cannot diverge', () => {
    const src = fs.readFileSync(path.join(CONFIG_DIR, 'plugins', 'prompt-queue', 'index.ts'), 'utf-8')
    const calls = src.match(/handleFireRequests\(/g) ?? []
    // Definition plus both call sites (event and poll).
    expect(calls.length).toBeGreaterThanOrEqual(3)
  })
})

describe('fire request: survives an interleaved queue write', () => {
  it('a request is still pending after the queue file is rewritten', () => {
    // The drain writes queue.json. If the request file shared that path — or a
    // handler rewrote the directory — the request would be destroyed by its own
    // handling. Separate namespaced files, atomic writes.
    q.enqueue(tmp, 'task')
    q.requestFire(tmp, { reason: 'interleaved' })
    q.drain(tmp)
    q.enqueue(tmp, 'queued during')
    expect(q.pendingFireRequests(tmp)).toHaveLength(1)
    expect(q.pendingFireRequests(tmp)[0].req.reason).toBe('interleaved')
  })
})
