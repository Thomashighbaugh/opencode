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
