/**
 * hooks — server entrypoint (OpenCode 2).
 *
 * The V1 implementation in this directory is one factory returning a hook map.
 * Rather than rewrite 4k lines, this adapter boots that factory and
 * re-registers each hook on the V2 domain that owns it:
 *
 *   event                         → ctx.event.subscribe
 *   tool.execute.before/after     → ctx.tool.hook
 *   chat.message                  → ctx.session.hook("prompt")
 *   experimental.chat.system.*    → ctx.session.hook("context")
 *   experimental.session.compacting → ctx.session.hook("compaction")
 *   permission.ask                → ctx.permission.hook("evaluate")
 *   command.execute.before        → ctx.command.transform (the five mode commands)
 *
 * The vectorize indexer, tool cache, mode detection, keyword injection and
 * telemetry all live inside the V1 modules and keep running through this map.
 */

import legacy from "./hooks.ts"
import { queueContextMessage } from "./session.ts"


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

function promptText(prompt: any): string {
  if (!prompt) return ""
  if (typeof prompt.text === "string") return prompt.text
  if (Array.isArray(prompt.parts)) {
    return prompt.parts
      .filter((part: any) => part && part.type === "text" && typeof part.text === "string")
      .map((part: any) => part.text)
      .join("\n")
  }
  if (Array.isArray(prompt.content)) return promptText({ parts: prompt.content })
  return ""
}

const MODE_COMMANDS = ["ralph-loop", "ulw-loop", "ultrawork", "cancel-ralph", "stop-continuation"]

export default {
  id: "hooks",
  async setup(ctx: any) {
    const directory: string = ctx.location?.directory ?? process.cwd()
    let hooks: any
    try {
      hooks = await (legacy as any)({
        project: ctx.location?.project,
        client: {},
        directory,
        worktree: undefined,
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
      await ctx.tool.hook("execute.before", async (event: any) => {
        const output = { args: event.input }
        await hooks["tool.execute.before"](
          { tool: event.tool, sessionID: event.sessionID, callID: event.id, args: event.input },
          output,
        )
      })
    }

    if (typeof hooks?.["tool.execute.after"] === "function") {
      await ctx.tool.hook("execute.after", async (event: any) => {
        if (event.status !== "completed") return
        const before = textOf(event.result)
        const output: any = { output: before, metadata: event.result?.metadata ?? {} }
        await hooks["tool.execute.after"](
          { tool: event.tool, sessionID: event.sessionID, callID: event.id, args: event.input },
          output,
        )
        if (typeof output.output === "string" && output.output !== before && event.result) {
          event.result.content = output.output
        }
      })
    }

    if (typeof hooks?.["chat.message"] === "function") {
      await ctx.session.hook("prompt", async (event: any) => {
        const message = {
          role: "user",
          content: promptText(event.prompt),
          parts: event.prompt?.parts ?? [],
        }
        await hooks["chat.message"]({ sessionID: event.sessionID, messageID: event.messageID, message }, {})
      })
    }

    if (typeof hooks?.["experimental.chat.system.transform"] === "function") {
      await ctx.session.hook("context", async (event: any) => {
        const output = { system: [] as string[] }
        await hooks["experimental.chat.system.transform"](
          { sessionID: event.sessionID, model: event.model, messages: event.messages },
          output,
        )
        for (const text of output.system) {
          if (typeof text === "string" && text.length > 0) event.system.push({ type: "text", text })
        }
      })
    }

    if (typeof hooks?.["experimental.session.compacting"] === "function") {
      await ctx.session.hook("compaction", async (event: any) => {
        const output = { context: [] as string[] }
        await hooks["experimental.session.compacting"](
          { sessionID: event.sessionID, model: event.model, messages: event.messages },
          output,
        )
        if (output.context.length === 0) return
        if (event.result) {
          event.result.summary = [event.result.summary, ...output.context].filter(Boolean).join("\n\n")
        } else {
          // No model bypass: carry the state notes into the next turn instead.
          for (const text of output.context) queueContextMessage(event.sessionID, text)
        }
      })
    }

    if (typeof hooks?.["permission.ask"] === "function") {
      await ctx.permission.hook("evaluate", async (event: any) => {
        const output: any = {}
        const action = String(event.action ?? "")
        await hooks["permission.ask"](
          {
            type: action === "shell" ? "bash" : action,
            sessionID: event.sessionID,
            pattern: Array.isArray(event.resources) ? event.resources.join(" ") : event.resources,
          },
          output,
        )
        if (output.status === "allow") event.effect = "allow"
      })
    }

    if (typeof hooks?.["command.execute.before"] === "function") {
      await ctx.command.transform((editor: any) => {
        for (const name of MODE_COMMANDS) {
          editor.add({
            name,
            description: `Legacy mode command (${name})`,
            async execute(invocation: any) {
              try {
                await hooks["command.execute.before"]({ command: name, sessionID: invocation.sessionID }, {})
              } catch {}
            },
          })
        }
      })
    }

    return () => controller.abort()
  },
}
