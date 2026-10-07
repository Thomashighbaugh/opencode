/**
 * prompt-queue-tool.test.ts — the `prompt-queue` tool.
 *
 * The tool exists because the queue's only control surface was a ctrl+p palette
 * entry in a TUI plugin — a different process from the hooks plugin that drains
 * the queue, and unreachable in a headless run or from an agent. This is the
 * path that works when the TUI is not there.
 *
 * The behaviour worth protecting is mostly about *not* doing the wrong thing:
 * firing one item must not consume the rest, an unmatched selector must not fall
 * back to "fire everything", and a queue that is empty must say so rather than
 * emitting an empty prompt for the model to interpret.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import * as fs from 'node:fs'
import * as os from 'node:os'
import * as path from 'node:path'

const CONFIG_DIR = path.resolve(__dirname, '..', '..')
const q: typeof import('../../plugins/prompt-queue/queue') = await import(
  path.join(CONFIG_DIR, 'plugins', 'prompt-queue', 'queue.ts')
)
const toolMod: any = await import(path.join(CONFIG_DIR, 'tools', 'prompt-queue.ts'))

let tmp: string
beforeEach(() => {
  tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'pqt-'))
})
afterEach(() => {
  fs.rmSync(tmp, { recursive: true, force: true })
})

async function call(args: Record<string, unknown>): Promise<any> {
  const handler = toolMod.default?.execute ?? toolMod.execute
  return JSON.parse(await handler(args, { directory: tmp }))
}

describe('prompt-queue tool: read', () => {
  it('lists queued items with ids an agent can act on', async () => {
    // An item that cannot be referred to is an item that cannot be edited,
    // reordered, or fired on its own.
    q.enqueue(tmp, 'first task')
    q.enqueue(tmp, 'second task')
    const out = await call({ action: 'list' })
    expect(out.ok).toBe(true)
    expect(out.count).toBe(2)
    expect(out.items).toHaveLength(2)
    expect(out.items[0]).toContain(q.load(tmp).items[0].id)
    expect(out.items[0]).toContain('first task')
  })

  it('reports an empty queue without erroring', async () => {
    const out = await call({ action: 'list' })
    expect(out.ok).toBe(true)
    expect(out.count).toBe(0)
    expect(out.items).toEqual([])
  })

  it('status includes the hold counter and any pending fire request', async () => {
    q.enqueue(tmp, 'task')
    q.recordHold(tmp, true)
    q.requestFire(tmp, { reason: 'pending-one' })
    const out = await call({ action: 'status' })
    expect(out.consecutiveHolds).toBe(1)
    expect(out.pendingFireRequests).toHaveLength(1)
    expect(out.pendingFireRequests[0].reason).toBe('pending-one')
  })
})

describe('prompt-queue tool: add', () => {
  it('appends to the end of the queue', async () => {
    q.enqueue(tmp, 'existing')
    const out = await call({ action: 'add', text: 'brand new' })
    expect(out.ok).toBe(true)
    expect(q.load(tmp).items.map((i) => i.text)).toEqual(['existing', 'brand new'])
  })

  it('rejects a blank task', async () => {
    // A to-do list must not gain empty entries; the count is the tell.
    const out = await call({ action: 'add', text: '   ' })
    expect(out.ok).toBe(false)
    expect(out.error).toMatch(/text is required/)
    expect(q.size(q.load(tmp))).toBe(0)
  })

  it('trims stored text', async () => {
    await call({ action: 'add', text: '  padded  ' })
    expect(q.load(tmp).items[0].text).toBe('padded')
  })
})

describe('prompt-queue tool: item selection', () => {
  beforeEach(() => {
    q.enqueue(tmp, 'alpha task')
    q.enqueue(tmp, 'beta task')
    q.enqueue(tmp, 'gamma task')
  })

  it('selects by id', async () => {
    const id = q.load(tmp).items[1].id
    const out = await call({ action: 'remove', id })
    expect(out.ok).toBe(true)
    expect(q.load(tmp).items.map((i) => i.text)).toEqual(['alpha task', 'gamma task'])
  })

  it('selects by 1-based position', async () => {
    const out = await call({ action: 'remove', id: '2' })
    expect(out.ok).toBe(true)
    expect(q.load(tmp).items.map((i) => i.text)).toEqual(['alpha task', 'gamma task'])
  })

  it('selects by explicit index argument', async () => {
    await call({ action: 'remove', index: 3 })
    expect(q.load(tmp).items.map((i) => i.text)).toEqual(['alpha task', 'beta task'])
  })

  it('selects by text prefix, case-insensitively', async () => {
    // What a person or an agent realistically has to hand: the id is
    // machine-generated and never seen.
    const out = await call({ action: 'remove', id: 'BETA' })
    expect(out.ok).toBe(true)
    expect(q.load(tmp).items.map((i) => i.text)).toEqual(['alpha task', 'gamma task'])
  })

  it('an unmatched selector removes nothing and says why', async () => {
    const out = await call({ action: 'remove', id: 'does not match anything' })
    expect(out.ok).toBe(false)
    expect(out.error).toMatch(/no queued item matches/)
    expect(q.size(q.load(tmp))).toBe(3)
  })

  it('an out-of-range index removes nothing', async () => {
    const out = await call({ action: 'remove', index: 99 })
    expect(out.ok).toBe(false)
    expect(q.size(q.load(tmp))).toBe(3)
  })

  it('no selector at all removes nothing rather than defaulting to the first', async () => {
    const out = await call({ action: 'remove' })
    expect(out.ok).toBe(false)
    expect(q.size(q.load(tmp))).toBe(3)
  })
})

describe('prompt-queue tool: edit', () => {
  it('rewrites in place and reports the position was kept', async () => {
    q.enqueue(tmp, 'alpha')
    q.enqueue(tmp, 'beta')
    q.enqueue(tmp, 'gamma')
    const id = q.load(tmp).items[1].id

    const out = await call({ action: 'edit', id, text: 'beta corrected' })
    expect(out.ok).toBe(true)
    expect(out.before).toBe('beta')
    expect(out.after).toBe('beta corrected')
    expect(out.positionPreserved).toBe(true)
    expect(q.load(tmp).items.map((i) => i.text)).toEqual(['alpha', 'beta corrected', 'gamma'])
  })

  it('requires text', async () => {
    q.enqueue(tmp, 'alpha')
    const out = await call({ action: 'edit', id: '1' })
    expect(out.ok).toBe(false)
    expect(q.load(tmp).items[0].text).toBe('alpha')
  })

  it('an unknown id edits nothing', async () => {
    q.enqueue(tmp, 'alpha')
    const out = await call({ action: 'edit', id: 'nope', text: 'changed' })
    expect(out.ok).toBe(false)
    expect(q.load(tmp).items[0].text).toBe('alpha')
  })
})

describe('prompt-queue tool: duplicate and move', () => {
  it('duplicate reports the new id', async () => {
    q.enqueue(tmp, 'original')
    const id = q.load(tmp).items[0].id
    const out = await call({ action: 'duplicate', id })
    expect(out.ok).toBe(true)
    expect(out.newId).toBeTruthy()
    expect(out.newId).not.toBe(id)
    expect(q.size(q.load(tmp))).toBe(2)
  })

  it('move up swaps with the previous item', async () => {
    q.enqueue(tmp, 'a')
    q.enqueue(tmp, 'b')
    q.enqueue(tmp, 'c')
    const out = await call({ action: 'move', id: '3', direction: 'up' })
    expect(out.ok).toBe(true)
    expect(out.from).toBe(3)
    expect(out.to).toBe(2)
    expect(out.moved).toBe(true)
    expect(q.load(tmp).items.map((i) => i.text)).toEqual(['a', 'c', 'b'])
  })

  it('move down defaults to up when direction is omitted', async () => {
    q.enqueue(tmp, 'a')
    q.enqueue(tmp, 'b')
    await call({ action: 'move', id: '2' })
    expect(q.load(tmp).items.map((i) => i.text)).toEqual(['b', 'a'])
  })

  it('moving off the end reports moved:false rather than a fake position', async () => {
    // Saying "moved to 1" when nothing changed is worse than saying nothing.
    q.enqueue(tmp, 'a')
    q.enqueue(tmp, 'b')
    const out = await call({ action: 'move', id: '1', direction: 'up' })
    expect(out.ok).toBe(true)
    expect(out.moved).toBe(false)
    expect(out.from).toBe(out.to)
  })

  it('direction "down" moves the other way', async () => {
    q.enqueue(tmp, 'a')
    q.enqueue(tmp, 'b')
    q.enqueue(tmp, 'c')
    await call({ action: 'move', id: '1', direction: 'down' })
    expect(q.load(tmp).items.map((i) => i.text)).toEqual(['b', 'a', 'c'])
  })
})

describe('prompt-queue tool: clear', () => {
  it('removes everything including a pending fire request', async () => {
    // A pending request would otherwise resurrect the cleared queue.
    q.enqueue(tmp, 'a')
    q.requestFire(tmp, { reason: 'x' })
    const out = await call({ action: 'clear' })
    expect(out.ok).toBe(true)
    expect(out.count).toBe(0)
    expect(q.pendingFireRequests(tmp)).toHaveLength(0)
  })
})

describe('prompt-queue tool: hold and release', () => {
  it('hold arms the flag and warns that the deadlock guard still applies', async () => {
    const out = await call({ action: 'hold' })
    expect(out.ok).toBe(true)
    expect(out.manual).toBe('hold')
    expect(out.note).toMatch(/anti-deadlock/)
  })

  it('release points at fire when the session may already be idle', async () => {
    // The failure this documents: arming a release while idle produces no
    // session.idle event, so nothing happens until the next message.
    const out = await call({ action: 'release' })
    expect(out.ok).toBe(true)
    expect(out.manual).toBe('release')
    expect(out.note).toMatch(/fire/)
  })
})

describe('prompt-queue tool: fire', () => {
  it('refuses to fire an empty queue', async () => {
    // Draining nothing would send a prompt with zero tasks, which the model
    // reads as an instruction with no content.
    const out = await call({ action: 'fire' })
    expect(out.ok).toBe(false)
    expect(out.error).toMatch(/empty/)
    expect(q.pendingFireRequests(tmp)).toHaveLength(0)
  })

  it('writes a request the hooks plugin will handle', async () => {
    q.enqueue(tmp, 'do the thing')
    const out = await call({ action: 'fire' })
    expect(out.ok).toBe(true)
    expect(out.token).toBeTruthy()
    expect(out.requestFile).toContain(out.token)
    const pending = q.pendingFireRequests(tmp)
    expect(pending).toHaveLength(1)
    expect(pending[0].req.reason).toBe('tool')
  })

  it('does not drain on request — the handler owns that', async () => {
    // Draining here would lose the items if the request were never handled.
    q.enqueue(tmp, 'do the thing')
    await call({ action: 'fire' })
    expect(q.size(q.load(tmp))).toBe(1)
  })

  it('fire-one names only the selected item', async () => {
    q.enqueue(tmp, 'keep this')
    q.enqueue(tmp, 'fire this one')
    const target = q.load(tmp).items[1].id

    const out = await call({ action: 'fire-one', id: target })
    expect(out.ok).toBe(true)
    expect(out.id).toBe(target)
    const pending = q.pendingFireRequests(tmp)
    expect(pending).toHaveLength(1)
    expect(pending[0].req.ids).toEqual([target])
  })

  it('fire-one leaves the whole queue intact for the handler to select from', async () => {
    q.enqueue(tmp, 'keep this')
    q.enqueue(tmp, 'fire this one')
    const target = q.load(tmp).items[1].id
    await call({ action: 'fire-one', id: target })
    // Nothing removed and nothing reordered — a partial drain here would be the
    // one irreversible mistake this tool could make.
    expect(q.load(tmp).items.map((i) => i.text)).toEqual(['keep this', 'fire this one'])
  })

  it('fire-one with an unmatched selector fires nothing', async () => {
    q.enqueue(tmp, 'a')
    q.enqueue(tmp, 'b')
    const out = await call({ action: 'fire-one', id: 'nothing matches' })
    expect(out.ok).toBe(false)
    expect(q.pendingFireRequests(tmp)).toHaveLength(0)
    expect(q.size(q.load(tmp))).toBe(2)
  })
})

describe('prompt-queue tool: fire lifecycle end to end', () => {
  it('a handled request drains everything once and leaves the queue empty', () => {
    // Drives the same calls `handleFireRequests` makes, minus the client.
    q.enqueue(tmp, 'first')
    q.enqueue(tmp, 'second')
    call({ action: 'fire' })

    const { file } = q.pendingFireRequests(tmp)[0]
    const claimed = q.claimFire(tmp, file)!
    const items = q.drain(tmp)
    expect(items).toHaveLength(2)
    q.finishFire(tmp, claimed, { fired: 2, rendered: q.renderPrompt(items, 'manual:tool') })

    expect(q.size(q.load(tmp))).toBe(0)
    expect(q.pendingFireRequests(tmp)).toHaveLength(0)
  })

  it('a failed send puts the items back, in order, at the front', () => {
    // The failure path is the one that matters: work must not be lost because
    // the request could not be delivered.
    q.enqueue(tmp, 'first')
    q.enqueue(tmp, 'second')
    call({ action: 'fire' })

    const drained = q.drain(tmp)
    expect(q.size(q.load(tmp))).toBe(0)

    // Simulate the restore in the plugin's catch block.
    const state = q.load(tmp)
    state.items = [...drained, ...state.items]
    q.save(tmp, state)

    expect(q.load(tmp).items.map((i) => i.text)).toEqual(['first', 'second'])
  })

  it('the rendered fire names the manual reason', () => {
    q.enqueue(tmp, 'the task')
    call({ action: 'fire' })
    const { req } = q.pendingFireRequests(tmp)[0]
    const text = q.renderPrompt(q.drain(tmp), `manual:${req.reason}`)
    expect(text).toContain('reason="manual:tool"')
  })
})

describe('prompt-queue tool: wiring', () => {
  it('is discoverable as an OpenCode tool', () => {
    const src = fs.readFileSync(path.join(CONFIG_DIR, 'tools', 'prompt-queue.ts'), 'utf-8')
    expect(src).toMatch(/export default tool\(\{/)
  })

  it('every declared action is handled', async () => {
    // An action in the schema with no branch would return the "unknown action"
    // error at runtime, which is only discoverable by trying it.
    const src = fs.readFileSync(path.join(CONFIG_DIR, 'tools', 'prompt-queue.ts'), 'utf-8')
    const declared = src.match(/const ACTIONS: Action\[\] = \[([\s\S]*?)\]/)?.[1] ?? ''
    const actions = declared.match(/'[a-z-]+'/g)?.map((s) => s.replace(/'/g, '')) ?? []
    expect(actions.length).toBeGreaterThan(5)
    for (const a of actions) {
      expect(src, `action "${a}" has no case branch`).toMatch(new RegExp(`case '${a}'`))
    }
  })

  it('imports the real queue module rather than reimplementing it', () => {
    // A copy is how the delegation suite stayed green through a shipped bug.
    const src = fs.readFileSync(path.join(CONFIG_DIR, 'tools', 'prompt-queue.ts'), 'utf-8')
    expect(src).toContain('plugins/prompt-queue/queue.ts')
    expect(src).not.toMatch(/writeFileSync\(.*queue\.json/)
  })
})