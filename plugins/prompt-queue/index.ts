/**
 * prompt-queue — server entrypoint (OpenCode 2).
 *
 * Same contract as the V1 hooks plugin: hold queued prompts until the assistant
 * finishes a turn without ending on a question, then release the FIFO as one
 * prompt. State is one atomically-written JSON file under
 * `.opencode/state/prompt-queue/`, shared with the TUI half.
 *
 * The pure decision/queue logic is unchanged (`queue.ts`, `gate.ts`,
 * `classifier.ts`); only the host surface moved: `event` → `ctx.event.subscribe`,
 * `client.session.promptAsync` → `ctx.session.prompt`.
 */

import { decide, extractDeferred, type Classifier } from "./gate.ts"
import * as onnxClassifier from "./classifier.ts"
import {
  carryDeferred,
  drain,
  load,
  pendingFireRequests,
  recordDecision,
  renderPrompt,
  size,
  type QueueState,
} from "./queue.ts"
import { claimFire, finishFire } from "./queue.ts"

export const DEFAULT_MAX_HOLD_TURNS = 3

type Messages = any[]

/**
 * The V2 plugin context has no `session.messages`; `session.context({ sessionID })`
 * is the documented call and returns the model-visible message list
 * (packages/client/src/promise/generated/types.ts: `SessionContextOutput =
 * Array<SessionMessageInfo>`).
 */
async function readMessages(ctx: any, sessionID: string): Promise<Messages> {
  try {
    const value = await ctx.session.context({ sessionID })
    if (Array.isArray(value)) return value
    if (Array.isArray(value?.data)) return value.data
  } catch {}
  return []
}

function completionFromMessages(messages: Messages): { tools: string[]; finalText: string } {
  const tools = new Set<string>()
  let finalText = ""
  for (const message of messages ?? []) {
    for (const part of message?.parts ?? []) {
      if (part?.type === "tool") {
        const name = part?.tool?.name ?? part?.tool
        if (name) tools.add(String(name))
      } else if (part?.type === "text" && typeof part?.text === "string" && part.text.trim()) {
        finalText = part.text
      }
    }
  }
  return { tools: [...tools], finalText }
}

function resolveClassifier(): Classifier | undefined {
  if (process.env.PROMPT_QUEUE_DISABLE_MODEL === "1") return undefined
  try {
    const classifier = (onnxClassifier as any).classifier
    return typeof classifier === "function" ? classifier : undefined
  } catch {
    return undefined
  }
}

export default {
  id: "prompt-queue",
  async setup(ctx: any) {
    const directory: string = ctx.location?.directory ?? process.cwd()
    const controller = new AbortController()
    let lastSessionID: string | undefined
    const lastSeen: Record<string, number> = {}

    async function release(sessionID: string, text: string) {
      await ctx.session.prompt({ sessionID, text })
    }

    async function handleFireRequests() {
      for (const { file, req } of pendingFireRequests(directory)) {
        const claimed = claimFire(directory, file)
        if (!claimed) continue
        const state = load(directory)
        const items = drain(directory)
        recordDecision(directory, false)
        const sessionID = lastSessionID
        const text = items.length && sessionID ? renderPrompt(items, "manual") : ""
        let error: string | undefined
        if (items.length && sessionID) {
          try {
            await release(sessionID, text)
          } catch (cause) {
            error = cause instanceof Error ? cause.message : String(cause)
          }
        }
        finishFire(directory, claimed, { fired: items.length, rendered: text, error })
      }
    }

    const poll = setInterval(() => void handleFireRequests().catch(() => {}), 1_500)
    poll.unref?.()

    void (async () => {
      try {
        for await (const event of ctx.event.subscribe({ signal: controller.signal })) {
          if (event?.type === "file.edited" || event?.type === "file.watcher.updated") {
            await handleFireRequests()
            continue
          }

          const data = event?.data ?? event?.properties ?? {}
          const isIdle = event?.type === "session.idle" || (event?.type === "session.status" && data?.status?.type === "idle")
          if (!isIdle) continue

          const sessionID: string | undefined = data?.sessionID ?? data?.sessionId ?? data?.info?.id
          if (!sessionID) continue
          const seenAt = lastSeen[sessionID] ?? 0
          if (Date.now() - seenAt < 1_000) continue
          lastSeen[sessionID] = Date.now()
          lastSessionID = sessionID

          const state: QueueState = load(directory)
          if (size(state) === 0 && !state.manual) {
            if (state.consecutiveHolds !== 0) recordDecision(directory, false)
            continue
          }

          const messages = await readMessages(ctx, sessionID)
          const facts = completionFromMessages(messages)
          const held = await decide(
            { tools: facts.tools, finalText: facts.finalText, manual: state.manual },
            state.consecutiveHolds,
            DEFAULT_MAX_HOLD_TURNS,
            resolveClassifier(),
          )

          if (held.holds) {
            const deferred = extractDeferred(facts.finalText)
            if (deferred.length) carryDeferred(directory, deferred)
            recordDecision(directory, true)
            continue
          }

          const items = drain(directory)
          recordDecision(directory, false)
          if (!items.length) continue
          try {
            await release(sessionID, renderPrompt(items, held.deadlockBreak ? "deadlock-break" : held.reason))
          } catch {}
        }
      } catch {
        // Aborted on unload; nothing to report.
      }
    })()

    return () => {
      controller.abort()
      clearInterval(poll)
    }
  },
}
