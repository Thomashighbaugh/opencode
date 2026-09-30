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
import { decide, extractDeferred } from './gate.js'
import {
  carryDeferred,
  drain,
  load,
  recordDecision,
  renderPrompt,
  size,
  type QueueState,
} from './queue.js'

export { decide, evaluateTurn, extractDeferred } from './gate.js'
export * as queue from './queue.js'

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
}

/** Test seam, mirroring the pattern used by the other plugins. */
let stats: PromptQueueStats = blankStats()
function blankStats(): PromptQueueStats {
  return { completionsSeen: 0, held: 0, released: 0, drained: 0, deadlockBreaks: 0, lastReason: null }
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

export const PromptQueuePlugin: Plugin = async ({ client, directory }) => {
  stats = blankStats()
  const dir = directory || process.cwd()
  let lastSeen: Record<string, number> = {}

  /**
   * Evaluate the gate for a completed turn and drain if it releases.
   *
   * Returns the outcome rather than firing silently, so a caller (or a test) can
   * see why the queue did or did not run.
   */
  async function onCompletion(input: { sessionId: string; tools: string[]; finalText: string }) {
    const { sessionId, tools, finalText } = input
    const before: QueueState = load(dir)
    if (size(before) === 0 && !before.manual) {
      // Nothing queued and no override pending. Still record, so a turn that ends
      // on a question cannot leave a stale hold count that later mis-fires.
      recordDecision(dir, false)
      return { released: false, reason: 'empty-queue' as const, drained: 0 }
    }

    stats.completionsSeen++
    const held = decide({ tools, finalText, manual: before.manual }, before.consecutiveHolds, DEFAULT_MAX_HOLD_TURNS)
    stats.lastReason = held.evidence ?? held.reason

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
      const restored = load(dir)
      restored.items = [...items.filter((i) => i.source === 'manual'), ...restored.items]
      restored.deferred = [...items.filter((i) => i.source === 'deferred'), ...restored.deferred]
      require('node:fs').writeFileSync(
        require('node:path').join(dir, '.opencode', 'state', 'prompt-queue', 'queue.json'),
        JSON.stringify({ ...restored, updatedAt: new Date().toISOString() }, null, 2),
      )
      return { released: true, reason: 'send-failed', error: String(e), drained: 0 }
    }

    return { released: true, reason: held.reason, drained: items.length, text }
  }

  return {
    event: async ({ event }: any) => {
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

      const state = load(dir)
      if (size(state) === 0 && !state.manual) return

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
      await onCompletion({ sessionId, tools: facts.tools, finalText: facts.finalText })
    },
  } as any
}

export default PromptQueuePlugin
