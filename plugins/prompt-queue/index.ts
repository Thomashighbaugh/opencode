/**
 * prompt-queue — server entrypoint (OpenCode 2).
 *
 * Holds queued prompts until the assistant finishes a turn without ending on a
 * question, then releases the FIFO as one prompt. The gate, fire requests and
 * failure-restore live in `runtime.ts`; this entry binds the runtime to the V2
 * domains:
 *
 *   ctx.event.subscribe          → runtime.event (idle, file.edited, session.status)
 *   ctx.session.prompt           → release
 *   ctx.session.context          → model-visible messages (Array<SessionMessageInfo>)
 *   ctx.session.list             → fire-request session lookup
 */

import { createQueueRuntime } from "./runtime.ts"

/** V2 events carry fields under `data`; the runtime reads `properties`. */
function legacyEvent(event: any): any {
  if (!event || event.properties) return event
  const data = event.data ?? {}
  return {
    type: event.type,
    properties: {
      ...data,
      info: data.info ?? (data.id ? { id: data.id } : undefined),
      sessionID: data.sessionID ?? data.sessionId ?? data.info?.id,
      file: data.file,
      status: data.status,
    },
  }
}

export default {
  id: "prompt-queue",
  async setup(ctx: any) {
    const directory: string = ctx.location?.directory ?? process.cwd()

    const runtime = await createQueueRuntime({
      directory,
      release: (sessionId, text) => ctx.session.prompt({ sessionID: sessionId, text }),
      messages: async (sessionId) => {
        const value = await ctx.session.context({ sessionID: sessionId })
        return Array.isArray(value) ? value : (value?.data ?? [])
      },
      sessions: async () => {
        try {
          const value = await ctx.session.list({})
          return Array.isArray(value) ? value : (value?.data ?? [])
        } catch {
          return []
        }
      },
    })

    const controller = new AbortController()
    void (async () => {
      try {
        for await (const event of ctx.event.subscribe({ signal: controller.signal })) {
          try {
            await runtime.event({ event: legacyEvent(event) })
          } catch {}
        }
      } catch {}
    })()

    return () => {
      controller.abort()
      runtime.dispose()
    }
  },
}
