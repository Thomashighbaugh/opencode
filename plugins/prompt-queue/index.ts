/**
 * prompt-queue/index.ts — the hooks side.
 *
 * Holds the queue state and the gate; drains when a turn concludes without a
 * question. The **ctrl+p palette entry that enqueues** lives in
 * `plugins/hubs-tui/src/queue-commands.tsx` — a TUI plugin and a hooks plugin are
 * different processes, and only the hooks side can observe turn completion.
 *
 * ── Why the split ───────────────────────────────────────────────────────────
 *
 * The user-visible action (capture what is in the composer) belongs in the TUI,
 * because that is where the composer is. Deciding *when* to release belongs in
 * the hooks, because that is where turn boundaries and message text live. They
 * meet at one atomically-written JSON file under `.opencode/state/`, which is
 * session state and therefore gitignored.
 *
 * ── The release condition ───────────────────────────────────────────────────
 *
 * Fire only when the assistant's output did NOT end on a question. Injecting
 * during a question hides the question the user is being asked, and it tells the
 * model to start something new while it is mid-decision — losing focus on the
 * task in front of it. The whole point of queueing is to defer without derailing.
 */

import type { Plugin } from '@opencode-ai/plugin'
import { decide, extractDeferred, type Classifier } from './gate.ts'
import * as onnxClassifier from './classifier.ts'
import {
  carryDeferred,
  claimFire,
  drain,
  drainIds,
  finishFire,
  load,
  pendingFireRequests,
  recordDecision,
  renderPrompt,
  save,
  size,
  type QueueState,
} from './queue.ts'

export { decide, evaluateTurn, extractDeferred } from './gate.ts'
export * as queue from './queue.ts'

/**
 * Consecutive held turns tolerated before the gate releases anyway.
 *
 * A gate that only ever holds is a feature that silently does nothing: the queue
 * grows, nothing runs, and it looks broken. Three is enough that a legitimate
 * multi-turn decision exchange still holds, and few enough that a stuck gate
 * resolves itself. The break is reported (`deadlockBreak`) rather than hidden.
 */
export const DEFAULT_MAX_HOLD_TURNS = 3

export interface PromptQueueStats {
  completionsSeen: number
  held: number
  released: number
  drained: number
  deadlockBreaks: number
  lastReason: string | null
  /** Turns held by the classifier that the phrase list had released. */
  modelHolds: number
  /** Classifier calls that returned no opinion (model absent or failed). */
  classifierUnavailable: number
}

/** Test seam, mirroring the pattern used by the other plugins. */
let stats: PromptQueueStats = blankStats()
function blankStats(): PromptQueueStats {
  return {
    completionsSeen: 0, held: 0, released: 0, drained: 0, deadlockBreaks: 0,
    lastReason: null, modelHolds: 0, classifierUnavailable: 0,
  }
}
export function __promptQueueStats(): PromptQueueStats {
  return stats
}
export function __resetPromptQueueStats(): void {
  stats = blankStats()
}

interface Completion {
  sessionId: string
  tools: string[]
  finalText: string
}

/**
 * Reduce a session's message list to the facts the gate needs.
 *
 * Extracted so the gate can be exercised against real message shapes without a
 * client, and so the "what counts as the final text" decision is in one place.
 */
export function completionFromMessages(messages: any[]): { tools: string[]; finalText: string } {
  const tools = new Set<string>()
  let finalText = ''

  for (const m of messages ?? []) {
    const parts = (m as any)?.parts ?? []
    for (const p of parts) {
      const t = p?.type
      if (t === 'tool') {
        if (p?.tool?.name) tools.add(String(p.tool.name))
        else if (p?.tool) tools.add(String(p.tool))
      } else if (t === 'text' && typeof p?.text === 'string') {
        if (p.text.trim()) finalText = p.text
      }
    }
  }
  return { tools: [...tools], finalText }
}

/**
 * The live classifier, or `undefined` when ONNX is not usable.
 *
 * `PROMPT_QUEUE_DISABLE_MODEL=1` removes it entirely, which is the switch to
 * reach for when comparing the gate's behaviour with and without the model.
 */
function resolveClassifier(): Classifier | undefined {
  if (process.env.PROMPT_QUEUE_DISABLE_MODEL === '1') return undefined
  if (!onnxClassifier.CLASSIFIER_MODEL_ID) return undefined
  return {
    askProbability: onnxClassifier.askProbability,
    reconcile: onnxClassifier.reconcile,
  }
}

/**
 * Drain and send for every pending fire request, oldest first.
 *
 * The explicit path: no gate, no idle event, no waiting. Whatever the user
 * asked for is what runs, which is the whole point of having a manual override —
 * if it still had to pass a heuristic, the failures would be indistinguishable
 * from the gate misbehaving.
 *
 * One request that names ids fires only those, so "run this one" cannot consume
 * the rest. A send failure restores exactly what was drained, through the same
 * atomic `save` the idle path uses.
 */
async function handleFireRequests(dir: string, client: any): Promise<number> {
  const pending = pendingFireRequests(dir)
  if (!pending.length) return 0

  // Resolved once, before any send, so a request that arrives before any idle
  // event still has a destination. An empty id would make `promptAsync` fail
  // with a path error that looks like a send failure rather than "no session".
  const sessionId = lastSessionId ?? (await firstSessionId(client))
  if (!sessionId) {
    // Claimed then finished rather than left pending: a request that could not be
    // delivered must not sit and be retried on every subsequent file event.
    for (const { file } of pending) {
      const claimed = claimFire(dir, file)
      if (claimed) finishFire(dir, claimed, { fired: 0, rendered: '', error: 'no session available' })
    }
    return 0
  }

  let sent = 0
  for (const { file, req } of pending) {
    const ids = (req.ids ?? []).filter(Boolean)
    // An empty id list means "everything queued" — but only if there is
    // something. Draining an empty queue would send a prompt containing zero
    // tasks, which reads to the model as an instruction with no content.
    if (!ids.length && size(load(dir)) === 0) {
      const claimed = claimFire(dir, file)
      if (claimed) finishFire(dir, claimed, { fired: 0, rendered: '', error: 'queue was empty' })
      continue
    }

    // Claim before touching the queue. Draining writes queue.json, which is
    // itself a file.edited event; without the rename the nested event would see
    // this same request still pending and fire the batch a second time.
    const claimed = claimFire(dir, file)
    if (!claimed) continue

    const items = ids.length ? drainIds(dir, ids) : drain(dir)
    if (!items.length) {
      finishFire(dir, claimed, { fired: 0, rendered: '', error: 'no matching items' })
      continue
    }

    const text = renderPrompt(items, `manual:${req.reason || 'fire'}`)
    try {
      await client.session.promptAsync({
        path: { id: sessionId },
        body: { parts: [{ type: 'text', text }] },
      })
      sent += items.length
      stats.released++
      stats.drained += items.length
      finishFire(dir, claimed, { fired: items.length, rendered: text })
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      // Restore before reporting, so the recorded result describes the queue as
      // it ends up rather than as it was mid-flight.
      const restored = load(dir)
      restored.items = [...items.filter((i) => i.source === 'manual'), ...restored.items]
      restored.deferred = [...items.filter((i) => i.source === 'deferred'), ...restored.deferred]
      save(dir, restored)
      stats.lastReason = `send-failed: ${msg}`
      finishFire(dir, claimed, { fired: 0, rendered: text, error: msg })
    }
  }
  return sent
}

/** Best-effort session lookup for a fire request that predates any idle event. */
async function firstSessionId(client: any): Promise<string | null> {
  try {
    const res = await client.session.list()
    const list = (res as any)?.data
    const first = Array.isArray(list) ? list[0] : null
    return first?.id ?? null
  } catch {
    return null
  }
}

let lastSessionId: string | null = null

export const PromptQueuePlugin: Plugin = async ({ client, directory }) => {
  stats = blankStats()
  const dir = directory || process.cwd()
  let lastSeen: Record<string, number> = {}

  /**
   * Poll for fire requests, as a backstop to the `file.edited` trigger.
   *
   * The event path is the fast one, but it cannot be the only one: `file.edited`
   * is raised for edits the runtime observes, and a request written by a tool, a
   * shell command, or another process may not produce one reliably. The vectorize
   * hook keeps its own poll for the same reason. One-and-a-half seconds is fast
   * enough to feel immediate and slow enough to cost a single `readdir`.
   *
   * `unref` so the timer never holds the process open on shutdown.
   */
  const poll = setInterval(() => {
    void handleFireRequests(dir, client).catch(() => {})
  }, 1_500)
  poll.unref?.()

  /**
   * Evaluate the gate for a completed turn and drain if it releases.
   *
   * Returns the outcome rather than firing silently, so a caller (or a test) can
   * see why the queue did or did not run.
   */
  async function onCompletion(
    input: { sessionId: string; tools: string[]; finalText: string },
    classifier?: Classifier,
  ) {
    const { sessionId, tools, finalText } = input
    const before: QueueState = load(dir)
    if (size(before) === 0 && !before.manual) {
      // Nothing queued and no override pending. Still record, so a turn that ends
      // on a question cannot leave a stale hold count that later mis-fires.
      recordDecision(dir, false)
      return { released: false, reason: 'empty-queue' as const, drained: 0 }
    }

    stats.completionsSeen++
    // The ONNX classifier is passed in rather than imported here so this function
    // stays drivable with a stub, and so a missing model degrades to the regex
    // gate instead of failing the turn.
    const held = await decide(
      { tools, finalText, manual: before.manual },
      before.consecutiveHolds,
      DEFAULT_MAX_HOLD_TURNS,
      classifier,
    )
    stats.lastReason = held.evidence ?? held.reason

    if (held.reason === 'model') stats.modelHolds++
    if (held.holds) {
      // Rollover: anything the model explicitly deferred in a held turn rides
      // along with the next drain instead of being forgotten when the user
      // answers the question.
      const deferred = extractDeferred(finalText)
      if (deferred.length) carryDeferred(dir, deferred)
      recordDecision(dir, true)
      stats.held++
      return { released: false, reason: held.reason, evidence: held.evidence, deferred: deferred.length, drained: 0 }
    }

    if (held.deadlockBreak) stats.deadlockBreaks++

    const items = drain(dir)
    recordDecision(dir, false)
    if (!items.length) {
      stats.released++
      return { released: false, reason: 'empty-queue' as const, drained: 0 }
    }

    const text = renderPrompt(items, held.deadlockBreak ? 'deadlock-break' : held.reason)
    stats.released++
    stats.drained += items.length

    try {
      await client.session.promptAsync({
        path: { id: sessionId },
        body: { parts: [{ type: 'text', text }] },
      })
    } catch (e) {
      // The drain already emptied the queue. Losing the text on a failed send
      // would be the worst outcome, so it is put back at the front, in order.
      //
      // Restored through `save()`, not a hand-rolled write. This file is an ES
      // module and the previous `require('node:fs')` here was a ReferenceError
      // waiting to happen — meaning the one path that exists purely to avoid
      // losing queued work was itself the thing that threw. `save` is also
      // atomic, which the inline write was not.
      const restored = load(dir)
      restored.items = [...items.filter((i) => i.source === 'manual'), ...restored.items]
      restored.deferred = [...items.filter((i) => i.source === 'deferred'), ...restored.deferred]
      save(dir, restored)
      return { released: true, reason: 'send-failed', error: String(e), drained: 0 }
    }

    return { released: true, reason: held.reason, drained: items.length, text }
  }

  return {
    event: async ({ event }: any) => {
      // ── Immediate, explicit fire ──────────────────────────────────────────
      // Handled before the idle path and independent of it. `session.idle` only
      // fires on a *transition* into idle, so a release armed while the session
      // was already idle waited for the next message — which is why "run the
      // queue now" looked like it did nothing. A fire request is its own event.
      if (event.type === 'file.edited' || event.type === 'file.watcher.updated') {
        await handleFireRequests(dir, client)
        return
      }

      if (event.type !== 'session.idle') return
      const sessionId: string | undefined = event.properties?.sessionID ?? event.properties?.info?.id
      if (!sessionId) return
      // A retried idle event for the same session must not double-drain; the
      // queue is empty afterwards so this is belt-and-braces, but an empty
      // second drain would still fire a prompt with no items if the restore path
      // above had run.
      const seenAt = lastSeen[sessionId] ?? 0
      if (Date.now() - seenAt < 1_000) return
      lastSeen[sessionId] = Date.now()
      // Recorded before the queue checks below: a fire request may arrive while
      // the queue is empty and the session idle, which is precisely when the
      // manual path needs to know where to send.
      lastSessionId = sessionId

      const state = load(dir)
      // Reset the hold counter even when there is nothing to fire. Returning
      // early without recording left `consecutiveHolds` frozen at whatever it
      // was, so the anti-deadlock budget was already spent by the time the user
      // queued something — the first decision after a long clear stretch could
      // deadlock-break and fire immediately, which is the opposite of the intent.
      if (size(state) === 0 && !state.manual) {
        if (state.consecutiveHolds !== 0) recordDecision(dir, false)
        return
      }

      let messages: any[] = []
      try {
        const res = await client.session.messages({ path: { id: sessionId } })
        messages = (res as any)?.data ?? []
      } catch {
        // No message history means no evidence of an ask. Releasing is the safe
        // direction only because the anti-deadlock guard bounds the damage; with
        // no text at all the gate would otherwise hold forever.
        messages = []
      }

      const facts = completionFromMessages(messages)
      await onCompletion({ sessionId, tools: facts.tools, finalText: facts.finalText }, resolveClassifier())
    },
  } as any
}

export default PromptQueuePlugin
