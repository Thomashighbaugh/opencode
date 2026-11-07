/**
 * command-hooks — server entrypoint (OpenCode 2).
 *
 * The matcher, config loader, executor and template logic are host-agnostic and
 * stay as they were; only the registration surface moved. This adapter boots the
 * V1 factory with the V2 context and re-registers its two tool hooks and its
 * event listener on the V2 domains.
 */

import v1 from "./v1.ts"


/** V2 events carry fields under `data`; the V1 modules read `properties`. */
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
    let hooks: any
    try {
      hooks = await (v1 as any)({
        project: ctx.location?.project,
        client: ctx.client ?? ctx,
        directory,
        $: undefined,
      })
    } catch {
      return
    }

    const controller = new AbortController()

    if (typeof hooks?.event === "function") {
      void (async () => {
        try {
          for await (const event of ctx.event.subscribe({ signal: controller.signal })) {
            try {
              await hooks.event({ event: legacyEvent(event) })
            } catch {}
          }
        } catch {}
      })()
    }

    if (typeof hooks?.["tool.execute.before"] === "function") {
      await ctx.tool.hook("execute.before", (event: any) => {
        const input = { tool: event.tool, sessionID: event.sessionID, callID: event.id, args: event.input }
        const output = { args: event.input }
        return hooks["tool.execute.before"](input, output)
      })
    }

    if (typeof hooks?.["tool.execute.after"] === "function") {
      await ctx.tool.hook("execute.after", (event: any) => {
        const input = { tool: event.tool, sessionID: event.sessionID, callID: event.id, args: event.input }
        const output = {
          output: event.status === "completed" ? textOf(event.result) : "",
          metadata: event.status === "completed" ? (event.result?.metadata ?? event.result?.output ?? {}) : {},
        }
        return hooks["tool.execute.after"](input, output)
      })
    }

    return () => controller.abort()
  },
}
