/**
 * command-hooks — server entrypoint (OpenCode 2).
 *
 * Registers the plugin's runtime directly on the V2 domains. No V1 plugin
 * factory is booted and no hook map is translated: the runtime exposes the same
 * three behaviours the V1 entry returned, and each is bound to the V2 hook that
 * now owns it.
 *
 * V2 event payloads carry fields under `data`; `legacyEvent` re-shapes them for
 * the matcher, which is the one translation that remains (the matcher reads
 * `event.properties`).
 */

import { createCommandHooksRuntime } from "./v1.ts"

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

function textOf(result: any): string {
  if (!result) return ""
  if (typeof result.content === "string") return result.content
  if (Array.isArray(result.content)) {
    return result.content
      .filter((part: any) => part && part.type === "text" && typeof part.text === "string")
      .map((part: any) => part.text)
      .join("\n")
  }
  if (typeof result.output === "string") return result.output
  return ""
}

export default {
  id: "command-hooks",
  async setup(ctx: any) {
    const directory: string = ctx.location?.directory ?? process.cwd()

    const client = {
      session: {
        get: async ({ path }: { path: { id: string } }) => {
          try {
            return { data: await ctx.session.get(path.id) }
          } catch {
            return undefined
          }
        },
      },
    }

    const runtime = await createCommandHooksRuntime({ client, directory })
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

    await ctx.tool.hook("execute.before", (event: any) => {
      const input = { tool: event.tool, sessionID: event.sessionID, callID: event.id, args: event.input }
      return runtime.before(input, { args: event.input })
    })

    await ctx.tool.hook("execute.after", (event: any) => {
      if (event.status !== "completed") return
      const input = { tool: event.tool, sessionID: event.sessionID, callID: event.id, args: event.input }
      const output = {
        output: textOf(event.result),
        metadata: event.result?.metadata ?? {},
      }
      return runtime.after(input, output)
    })

    return () => controller.abort()
  },
}
