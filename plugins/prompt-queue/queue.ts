/**
 * prompt-queue/queue.ts — the queue itself.
 *
 * Acts as a to-do list the user writes to as thoughts arrive, not in advance.
 * Items are appended in the order they were thought of and released in that same
 * order, at a moment chosen by the [gate](gate.ts) rather than by the user.
 *
 * State lives in one JSON file, written atomically, because the two processes
 * that touch it are the TUI (which enqueues, when the user picks an item from the
 * ctrl+p palette) and the hooks plugin (which drains). A half-written file read
 * by the other side would silently drop a queued task, which is the one failure
 * a to-do list must not have.
 */

import * as fs from 'node:fs'
import * as path from 'node:path'

export interface QueueItem {
  id: string
  text: string
  enqueuedAt: string
  /** `manual` came from the palette; `deferred` was carried out of held output. */
  source: 'manual' | 'deferred'
  /** Set when the text was edited, so the UI can mark a changed item. */
  editedAt?: string
  /** Set on a duplicate, pointing at the item it was copied from. */
  copiedFrom?: string
}

export interface QueueState {
  /** FIFO. Drained in insertion order. */
  items: QueueItem[]
  /** Items lifted out of held turns, appended after the FIFO on release. */
  deferred: QueueItem[]
  /** Consecutive gate decisions that held. Drives the anti-deadlock guard. */
  consecutiveHolds: number
  /** One-shot human override consumed by the next decision. */
  manual: 'hold' | 'release' | null
  updatedAt: string
}

/**
 * A pristine state. A FACTORY, not a constant.
 *
 * This started life as an exported `EMPTY_STATE` object that `load()` spread on
 * failure — and a spread is shallow, so every "no queue file yet" result shared
 * ONE `items` array with the module. Enqueuing to a fresh project therefore
 * appended to the default: the first directory created would come back holding
 * everything every other directory had queued, and the first real save would
 * write it all out. It looked like test pollution and was not — it was a shared
 * mutable singleton on the write path.
 */
export function emptyState(): QueueState {
  return {
    items: [],
    deferred: [],
    consecutiveHolds: 0,
    manual: null,
    updatedAt: new Date(0).toISOString(),
  }
}

/** Queue state is ephemeral session data — it lives under `.opencode/state/`. */
export function queuePath(directory: string): string {
  return path.join(directory, '.opencode', 'state', 'prompt-queue', 'queue.json')
}

/**
 * The manual-fire request file.
 *
 * Separate from `queue.json` on purpose. Writing it is how *anything* asks for an
 * immediate drain — a tool, a shell command, a script — without going through the
 * TUI. It lives beside the queue rather than inside it because a fire request is
 * an event, not state: it is consumed and deleted, while the queue persists.
 *
 * The reason this exists at all: the queue's normal trigger is `session.idle`,
 * and `session.idle` only fires on a *transition* into idle. Arming a release flag
 * while the session is already idle produces no new event, so "run the queue now"
 * silently did nothing until the user happened to send another message. This file
 * gives that request an event of its own.
 */
export function fireRequestPath(directory: string): string {
  return path.join(directory, '.opencode', 'state', 'prompt-queue', 'fire-now.json')
}

export interface FireRequest {
  /** Why the fire was requested — surfaced in the rendered prompt for audit. */
  reason: string
  /** Ids to fire. Empty or absent means "everything queued". */
  ids?: string[]
  requestedAt: string
  /** Set once a drain has consumed this request, so it is not handled twice. */
  consumedAt?: string
  /** What the drain produced, kept for inspection after the fact. */
  result?: { fired: number; rendered: string; error?: string }
}

let fireCounter = 0
/**
 * Ask for an immediate drain.
 *
 * Returns the token embedded in the filename. The token makes each request a
 * distinct file, so two requests in quick succession cannot collapse into one
 * `file.edited` event and silently drop a request — the coalescing hazard that
 * makes a single fixed filename wrong here even though the queue file itself is
 * fine to share.
 */
export function requestFire(
  directory: string,
  opts: { reason?: string; ids?: string[] } = {},
): string {
  const dir = path.dirname(fireRequestPath(directory))
  fs.mkdirSync(dir, { recursive: true })
  fireCounter = (fireCounter + 1) % 100000
  const token = `${Date.now().toString(36)}-${fireCounter.toString(36)}`
  const body: FireRequest = {
    reason: opts.reason || 'manual',
    ids: opts.ids ?? [],
    requestedAt: new Date().toISOString(),
  }
  fs.writeFileSync(path.join(dir, `fire-now.${token}.json`), JSON.stringify(body, null, 2))
  return token
}

/** Every unconsumed fire request, oldest first. */
export function pendingFireRequests(directory: string): Array<{ file: string; req: FireRequest }> {
  const dir = path.dirname(fireRequestPath(directory))
  let names: string[]
  try {
    names = fs.readdirSync(dir)
  } catch {
    return []
  }
  const out: Array<{ file: string; req: FireRequest }> = []
  for (const name of names.sort()) {
    if (!name.startsWith('fire-now.') || !name.endsWith('.json')) continue
    try {
      const req = JSON.parse(fs.readFileSync(path.join(dir, name), 'utf-8')) as FireRequest
      if (!req.consumedAt) out.push({ file: name, req })
    } catch {
      // Half-written by the writer, or corrupt. Skipping is right: acting on a
      // truncated request could fire a partial batch.
    }
  }
  return out
}

/**
 * Take ownership of a fire request by renaming it out of the pending namespace.
 *
 * The rename is the claim. Draining writes `queue.json`, and that write is itself
 * a `file.edited` event — the very event this request is handled on. Marking the
 * request consumed only after the drain leaves a window in which the nested event
 * sees the same request still pending and fires it a second time, consuming the
 * batch twice. Renaming first makes the second pass see nothing, whatever order
 * the events arrive in.
 *
 * The claimed file is kept (as `fired.<token>.json`) so the outcome is inspectable
 * after the fact, then removed by `finishFire` once the result is recorded.
 */
export function claimFire(directory: string, file: string): string | null {
  const dir = path.dirname(fireRequestPath(directory))
  const from = path.join(dir, file)
  const to = path.join(dir, file.replace(/^fire-now\./, 'fired.'))
  try {
    fs.renameSync(from, to)
    return path.basename(to)
  } catch {
    // Another handler got there first, or the file is gone. Either way this
    // request is not ours to fire.
    return null
  }
}

/**
 * Record what a claimed fire produced, then delete the claimed file.
 *
 * Called after the send so a failure is still visible in the return value and in
 * `lastFire`. The queued items are restored by the caller before this runs, so
 * the ordering matters: restore first, then report.
 */
export function finishFire(directory: string, claimed: string, result: FireRequest['result']): void {
  const dir = path.dirname(fireRequestPath(directory))
  const full = path.join(dir, claimed)
  try {
    const req = JSON.parse(fs.readFileSync(full, 'utf-8')) as FireRequest
    fs.writeFileSync(
      full,
      JSON.stringify({ ...req, consumedAt: new Date().toISOString(), result }, null, 2),
    )
  } catch {
    // Unreadable — the result is still returned to the caller.
  }
  try {
    fs.rmSync(full, { force: true })
  } catch {
    // Best effort; a leftover claimed file is inert.
  }
}

/** Most recent completed fire, for diagnostics. */
export function lastFire(directory: string): FireRequest | null {
  const dir = path.dirname(fireRequestPath(directory))
  try {
    const names = fs
      .readdirSync(dir)
      .filter((n) => (n.startsWith('fired.') || n.startsWith('fire-now.')) && n.endsWith('.json'))
      .sort()
    for (const name of names.reverse()) {
      const req = JSON.parse(fs.readFileSync(path.join(dir, name), 'utf-8')) as FireRequest
      if (req.consumedAt) return req
    }
  } catch {
    // No history yet.
  }
  return null
}

/** Remove every fire request and every claimed leftover. Part of `clear`. */
export function clearFireRequests(directory: string): void {
  const dir = path.dirname(fireRequestPath(directory))
  try {
    for (const name of fs.readdirSync(dir)) {
      if ((name.startsWith('fire-now.') || name.startsWith('fired.')) && name.endsWith('.json')) {
        fs.rmSync(path.join(dir, name), { force: true })
      }
    }
  } catch {
    // Nothing to clear.
  }
}

let counter = 0
/** Monotonic within a process; the timestamp disambiguates across processes. */
function nextId(): string {
  counter = (counter + 1) % 100000
  return `${Date.now().toString(36)}-${counter.toString(36)}`
}

export function load(directory: string): QueueState {
  const file = queuePath(directory)
  try {
    const raw = JSON.parse(fs.readFileSync(file, 'utf-8')) as Partial<QueueState>
    return {
      items: Array.isArray(raw.items) ? raw.items.filter(isItem) : [],
      deferred: Array.isArray(raw.deferred) ? raw.deferred.filter(isItem) : [],
      consecutiveHolds: Number.isInteger(raw.consecutiveHolds) ? Number(raw.consecutiveHolds) : 0,
      manual: raw.manual === 'hold' || raw.manual === 'release' ? raw.manual : null,
      updatedAt: typeof raw.updatedAt === 'string' ? raw.updatedAt : new Date().toISOString(),
    }
  } catch {
    // A missing or corrupt file is an empty queue, not a crash. Losing queued
    // text is bad; refusing to start because of it is worse.
    return { ...emptyState(), updatedAt: new Date().toISOString() }
  }
}

function isItem(v: unknown): v is QueueItem {
  if (!v || typeof v !== 'object') return false
  const o = v as Record<string, unknown>
  return typeof o.id === 'string' && typeof o.text === 'string' && o.text.trim().length > 0
}

/**
 * Write atomically: temp file in the same directory, then rename.
 *
 * `rename` within a directory is atomic, so a reader sees either the old file or
 * the new one — never a truncated one. A plain `writeFileSync` on the live path
 * would let the drain half-read the file and drop the tail of the queue.
 */
export function save(directory: string, state: QueueState): void {
  const file = queuePath(directory)
  fs.mkdirSync(path.dirname(file), { recursive: true })
  const tmp = `${file}.${process.pid}.tmp`
  fs.writeFileSync(tmp, JSON.stringify({ ...state, updatedAt: new Date().toISOString() }, null, 2))
  fs.renameSync(tmp, file)
}

export function enqueue(
  directory: string,
  text: string,
  source: QueueItem['source'] = 'manual',
): QueueState {
  const state = load(directory)
  const trimmed = String(text ?? '').trim()
  // Empty input is not a task. The palette action can fire with a blank
  // composer, and silently adding a blank item would make the queue look like
  // it is working while delivering nothing.
  if (!trimmed) return state
  state.items.push({ id: nextId(), text: trimmed, enqueuedAt: new Date().toISOString(), source })
  save(directory, state)
  return state
}

/** Append items lifted out of a held turn. Deduped against what is already queued. */
export function carryDeferred(directory: string, texts: string[]): QueueState {
  const state = load(directory)
  let added = 0
  for (const t of texts) {
    const trimmed = String(t ?? '').trim()
    if (!trimmed) continue
    if (state.items.some((i) => i.text === trimmed)) continue
    if (state.deferred.some((i) => i.text === trimmed)) continue
    state.deferred.push({ id: nextId(), text: trimmed, enqueuedAt: new Date().toISOString(), source: 'deferred' })
    added++
  }
  if (added) save(directory, state)
  return state
}

export function remove(directory: string, id: string): QueueState {
  const state = load(directory)
  state.items = state.items.filter((i) => i.id !== id)
  state.deferred = state.deferred.filter((i) => i.id !== id)
  save(directory, state)
  return state
}

/**
 * Rewrite an item's text in place, keeping its position and id.
 *
 * Editing is a distinct operation from remove-then-enqueue because position is
 * the whole point of a queue: re-adding an edited item at the end silently
 * reorders someone's plan. An empty edit is rejected rather than applied — an
 * item that becomes blank would render as a numbered line with no text.
 */
export function update(directory: string, id: string, text: string): QueueState {
  const state = load(directory)
  const trimmed = String(text ?? '').trim()
  if (!trimmed) return state
  for (const bucket of [state.items, state.deferred]) {
    const hit = bucket.find((i) => i.id === id)
    if (hit) {
      hit.text = trimmed
      hit.editedAt = new Date().toISOString()
      break
    }
  }
  save(directory, state)
  return state
}

/**
 * Copy an item, placing the copy directly after the original.
 *
 * Adjacent rather than appended: "run this one again, right here" is the usual
 * intent, and a copy at the end of a list is a different instruction.
 * The copy gets a fresh id so removing one does not remove both.
 */
export function duplicate(directory: string, id: string): QueueState {
  const state = load(directory)
  const buckets: Array<QueueItem[]> = [state.items, state.deferred]
  for (const bucket of buckets) {
    const at = bucket.findIndex((i) => i.id === id)
    if (at === -1) continue
    const src = bucket[at]
    bucket.splice(at + 1, 0, {
      id: nextId(),
      text: src.text,
      enqueuedAt: new Date().toISOString(),
      source: src.source,
      copiedFrom: src.id,
    })
    break
  }
  save(directory, state)
  return state
}

/**
 * Move an item one slot earlier (`-1`) or later (`+1`) within its own bucket.
 *
 * Scoped to the bucket rather than the combined FIFO+deferred order, because
 * deferred items are appended after the queue on release by contract; letting a
 * manual move reorder across that boundary would break the documented ordering.
 * A move off either end is a no-op rather than an error — the user asked for
 * "up", not for a failure message.
 */
export function move(directory: string, id: string, delta: -1 | 1): QueueState {
  const state = load(directory)
  for (const bucket of [state.items, state.deferred]) {
    const at = bucket.findIndex((i) => i.id === id)
    if (at === -1) continue
    const to = at + delta
    if (to < 0 || to >= bucket.length) return load(directory)
    const [item] = bucket.splice(at, 1)
    bucket.splice(to, 0, item)
    break
  }
  save(directory, state)
  return state
}

export function setManual(directory: string, manual: 'hold' | 'release' | null): QueueState {
  const state = load(directory)
  state.manual = manual
  save(directory, state)
  return state
}

export function clear(directory: string): QueueState {
  const state = load(directory)
  state.items = []
  state.deferred = []
  state.consecutiveHolds = 0
  state.manual = null
  save(directory, state)
  // A pending fire request would resurrect the cleared queue on the next
  // handle — clearing must leave nothing behind that can still send something.
  clearFireRequests(directory)
  return state
}

/**
 * Remove and return everything, FIFO first, deferred appended.
 *
 * Draining is destructive and happens only on a release verdict, so a held turn
 * cannot lose work. The returned order is the contract: first-in, first-out for
 * what the user queued, then carried items.
 */
export function drain(directory: string): QueueItem[] {
  const state = load(directory)
  const out = [...state.items, ...state.deferred]
  state.items = []
  state.deferred = []
  state.consecutiveHolds = 0
  save(directory, state)
  return out
}

/**
 * Drain only the named ids, leaving the rest queued and in order.
 *
 * Backs "run just this one", which is the request that a plain drain cannot
 * express — firing everything when you meant one item is worse than not firing,
 * because the extra items are consumed and gone. An empty or unknown id list
 * drains nothing rather than everything: an empty selection is a no-op, never a
 * "fire all" by accident.
 */
export function drainIds(directory: string, ids: string[]): QueueItem[] {
  const want = new Set(ids ?? [])
  if (!want.size) return []
  const state = load(directory)
  const pick = (bucket: QueueItem[]) => bucket.filter((i) => want.has(i.id))
  const out = [...pick(state.items), ...pick(state.deferred)]
  if (!out.length) return []
  state.items = state.items.filter((i) => !want.has(i.id))
  state.deferred = state.deferred.filter((i) => !want.has(i.id))
  if (!state.items.length && !state.deferred.length) state.consecutiveHolds = 0
  save(directory, state)
  return out
}

/** Record a gate decision's effect on the hold counter without draining. */
export function recordHold(directory: string, held: boolean): QueueState {
  const state = load(directory)
  state.consecutiveHolds = held ? state.consecutiveHolds + 1 : 0
  save(directory, state)
  return state
}

/** Record a decision and consume any one-shot manual override. */
export function recordDecision(directory: string, held: boolean): QueueState {
  const state = load(directory)
  state.consecutiveHolds = held ? state.consecutiveHolds + 1 : 0
  state.manual = null
  save(directory, state)
  return state
}

export function size(state: QueueState): number {
  return state.items.length + state.deferred.length
}

/**
 * Render a drained batch as one prompt.
 *
 * The ordering is stated in the text itself. A model handed a bare list of five
 * tasks will pick whichever it can most easily start, which is not the order the
 * user thought them in — and FIFO is the entire reason the queue is a queue
 * rather than a set.
 */
export function renderPrompt(items: QueueItem[], reason: string): string {
  if (!items.length) return ''
  const body = items
    .map((it, i) => `${i + 1}. ${it.text}${it.source === 'deferred' ? '   (carried from a held turn)' : ''}`)
    .join('\n')
  return [
    `<prompt-queue drain count="${items.length}" reason="${reason}">`,
    'The following were queued while you worked, in the order they were queued.',
    'They run now because the previous turn concluded without asking a question.',
    'Work through them in order; if one depends on a decision, stop and ask.',
    '',
    body,
    '</prompt-queue>',
  ].join('\n')
}
