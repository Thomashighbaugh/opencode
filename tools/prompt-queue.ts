/**
 * prompt-queue.ts — agent-facing control of the prompt queue.
 *
 * The queue's palette entry lives in the TUI plugin (`plugins/hubs-tui/src/
 * queue-commands.ts`), which is a *different process* from the hooks plugin that
 * drains it. That leaves a gap: when the TUI is unreachable — a headless run, a
 * remote session, or an agent that was told to work through the queue — there is
 * no way to see or fire it. This tool is that way in.
 *
 * `fire` is the redundancy the queue was missing. The normal trigger is
 * `session.idle`, which only fires on a *transition* into idle, so anything that
 * arms a release while the session is already idle waits indefinitely for the
 * next message. `fire` writes a request file that the hooks plugin handles on the
 * next `file.edited` event — an event of its own, independent of turn state.
 *
 * It writes a file rather than sending a prompt directly because a tool has no
 * session context: `session.promptAsync` needs a session id, and guessing one
 * would send the batch at whatever conversation happened to be most recent.
 */

import { tool } from '@opencode-ai/plugin'
import * as path from 'node:path'
import {
  clear,
  duplicate,
  lastFire,
  load,
  move,
  pendingFireRequests,
  remove,
  requestFire,
  save,
  size,
  update,
  type QueueItem,
} from '../plugins/prompt-queue/queue.ts'

type Action =
  | 'list'
  | 'add'
  | 'remove'
  | 'edit'
  | 'duplicate'
  | 'move'
  | 'clear'
  | 'fire'
  | 'fire-one'
  | 'hold'
  | 'release'
  | 'status'

const ACTIONS: Action[] = [
  'list', 'add', 'remove', 'edit', 'duplicate', 'move', 'clear',
  'fire', 'fire-one', 'hold', 'release', 'status',
]

/**
 * Compact one-line rendering, so `list` stays readable when the queue is long.
 *
 * The id is included because every mutating action takes one; an item the agent
 * cannot refer to is an item it cannot edit, reorder, or fire on its own.
 */
function describe(items: QueueItem[], deferred: QueueItem[]): string[] {
  const out: string[] = []
  items.forEach((i, n) => {
    const flags = [i.source === 'deferred' ? 'deferred' : 'manual', i.editedAt ? 'edited' : '', i.copiedFrom ? 'copy' : '']
      .filter(Boolean)
      .join(',')
    out.push(`${n + 1}. [${i.id}] ${i.text}${flags ? `  (${flags})` : ''}`)
  })
  deferred.forEach((i, n) => {
    out.push(`${items.length + n + 1}. [${i.id}] ${i.text}  (deferred)`)
  })
  return out
}

/** Resolve a user-facing selector to an item: exact id, 1-based index, or text prefix. */
function resolveItem(state: ReturnType<typeof load>, selector?: string, index?: number): QueueItem | null {
  const all = [...state.items, ...state.deferred]
  if (!all.length) return null
  if (typeof index === 'number' && Number.isInteger(index)) {
    return all[index - 1] ?? null
  }
  if (!selector) return null
  const byId = all.find((i) => i.id === selector)
  if (byId) return byId
  const asNumber = Number(selector)
  if (Number.isInteger(asNumber) && asNumber > 0) return all[asNumber - 1] ?? null
  // Prefix match on text, case-insensitive — what a person or an agent
  // realistically has to hand, since the id is machine-generated.
  const needle = selector.trim().toLowerCase()
  return all.find((i) => i.text.toLowerCase().startsWith(needle)) ?? null
}

export default tool({
  description:
    "Inspect and control the prompt queue. Actions: list, add, remove, edit, duplicate, move, clear, fire, fire-one, hold, release, status. 'fire' drains the queue immediately via a request the hooks plugin handles on its own event — use it when the queue appears stuck, since the automatic trigger only fires on a turn transition. Returns JSON.",
  args: {
    action: tool.schema
      .enum(ACTIONS)
      .describe(`Action. Valid: ${ACTIONS.join(', ')}`),
    text: tool.schema.string().optional().describe("Item text. Required for 'add' and 'edit'."),
    id: tool.schema.string().optional().describe("Item id, 1-based position, or text prefix. Required for remove/edit/duplicate/move/fire-one."),
    index: tool.schema.number().optional().describe("1-based position, as an alternative to 'id'."),
    direction: tool.schema.enum(['up', 'down']).optional().describe("Direction for 'move' (default: up)."),
    directory: tool.schema.string().optional().describe('Project directory (defaults to the session directory).'),
  },
  async execute(args, context: any) {
    const dir: string = args.directory || context?.directory || process.cwd()

    try {
      switch (args.action) {
        // ── read ───────────────────────────────────────────────────────────
        case 'list':
        case 'status': {
          const state = load(dir)
          const pending = pendingFireRequests(dir)
          const last = lastFire(dir)
          return JSON.stringify({
            ok: true,
            action: args.action,
            count: size(state),
            items: describe(state.items, state.deferred),
            consecutiveHolds: state.consecutiveHolds,
            manual: state.manual,
            pendingFireRequests: pending.map((p) => p.req),
            lastFire: last ? { reason: last.reason, fired: last.result?.fired ?? 0, at: last.consumedAt, error: last.result?.error } : null,
          })
        }

        // ── write ──────────────────────────────────────────────────────────
        case 'add': {
          const text = String(args.text ?? '').trim()
          if (!text) return JSON.stringify({ ok: false, error: "text is required for 'add'" })
          const state = load(dir)
          state.items.push({
            id: `${Date.now().toString(36)}-tool`,
            text,
            enqueuedAt: new Date().toISOString(),
            source: 'manual',
          })
          save(dir, state)
          return JSON.stringify({ ok: true, action: 'add', count: size(state), text })
        }

        case 'remove': {
          const state = load(dir)
          const item = resolveItem(state, args.id, args.index)
          if (!item) return JSON.stringify({ ok: false, error: `no queued item matches ${JSON.stringify(args.id ?? args.index ?? null)}` })
          const after = remove(dir, item.id)
          return JSON.stringify({ ok: true, action: 'remove', removed: item.text, count: size(after) })
        }

        case 'edit': {
          const text = String(args.text ?? '').trim()
          if (!text) return JSON.stringify({ ok: false, error: "text is required for 'edit'" })
          const state = load(dir)
          const item = resolveItem(state, args.id, args.index)
          if (!item) return JSON.stringify({ ok: false, error: `no queued item matches ${JSON.stringify(args.id ?? args.index ?? null)}` })
          const before = item.text
          update(dir, item.id, text)
          // Position is preserved by `update`, and the response says so, because
          // "edited and moved to the end" is the failure users actually hit.
          return JSON.stringify({ ok: true, action: 'edit', id: item.id, before, after: text, positionPreserved: true })
        }

        case 'duplicate': {
          const state = load(dir)
          const item = resolveItem(state, args.id, args.index)
          if (!item) return JSON.stringify({ ok: false, error: `no queued item matches ${JSON.stringify(args.id ?? args.index ?? null)}` })
          const after = duplicate(dir, item.id)
          const copy = after.items.find((i) => i.copiedFrom === item.id)
          return JSON.stringify({ ok: true, action: 'duplicate', sourceId: item.id, newId: copy?.id ?? null, count: size(after) })
        }

        case 'move': {
          const delta = args.direction === 'down' ? 1 : -1
          const state = load(dir)
          const item = resolveItem(state, args.id, args.index)
          if (!item) return JSON.stringify({ ok: false, error: `no queued item matches ${JSON.stringify(args.id ?? args.index ?? null)}` })
          const from = [...state.items, ...state.deferred].findIndex((i) => i.id === item.id) + 1
          move(dir, item.id, delta)
          const after = load(dir)
          const to = [...after.items, ...after.deferred].findIndex((i) => i.id === item.id) + 1
          return JSON.stringify({
            ok: true,
            action: 'move',
            id: item.id,
            from,
            to,
            // A move off either end is a no-op, not a failure — say which
            // happened rather than reporting a position change that did not occur.
            moved: from !== to,
          })
        }

        case 'clear': {
          const state = clear(dir)
          return JSON.stringify({ ok: true, action: 'clear', count: size(state), note: 'pending fire requests also cleared' })
        }

        case 'hold':
        case 'release': {
          const state = load(dir)
          state.manual = args.action === 'hold' ? 'hold' : 'release'
          save(dir, state)
          return JSON.stringify({
            ok: true,
            action: args.action,
            manual: state.manual,
            note:
              args.action === 'hold'
                ? 'the next gate decision will hold; the anti-deadlock guard still applies'
                : "arms a one-shot override — but if the session is already idle no new decision occurs, so prefer 'fire'",
          })
        }

        // ── fire ───────────────────────────────────────────────────────────
        case 'fire': {
          if (size(load(dir)) === 0) {
            return JSON.stringify({ ok: false, error: 'queue is empty — nothing to fire' })
          }
          const token = requestFire(dir, { reason: 'tool' })
          return JSON.stringify({
            ok: true,
            action: 'fire',
            token,
            requestFile: path.join(dir, '.opencode', 'state', 'prompt-queue', `fire-now.${token}.json`),
            note: 'the hooks plugin drains this on its next file event; use status to confirm',
          })
        }

        case 'fire-one': {
          const state = load(dir)
          const item = resolveItem(state, args.id, args.index)
          if (!item) return JSON.stringify({ ok: false, error: `no queued item matches ${JSON.stringify(args.id ?? args.index ?? null)}` })
          // No drain here. The handler drains by id when it handles the request,
          // so touching the queue now would only risk losing the item if the
          // request were never handled — and would reorder it besides.
          const token = requestFire(dir, { reason: 'tool:one', ids: [item.id] })
          return JSON.stringify({
            ok: true,
            action: 'fire-one',
            id: item.id,
            text: item.text,
            token,
            note: 'fires this item only; the rest of the queue stays queued and in order',
          })
        }

        default:
          return JSON.stringify({ ok: false, error: `unknown action: ${args.action}` })
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      return JSON.stringify({ ok: false, error: msg })
    }
  },
})