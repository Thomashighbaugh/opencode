/**
 * memory-system — long-term memory backed by the same local sqlite-vec/ONNX
 * runtime as the context and code vector stores.
 */
import { execFileSync } from "node:child_process"
import { MemoryService } from "./src/service.ts"
import { buildTools } from "./src/tools.ts"

function lastUserText(messages: any): string {
  if (!Array.isArray(messages)) return ""
  for (let i = messages.length - 1; i >= 0; i--) {
    const m = messages[i]
    const role = m?.info?.role ?? m?.role
    if (role !== "user") continue
    if (typeof m?.content === "string") return m.content
    const parts = Array.isArray(m?.parts) ? m.parts : Array.isArray(m?.content) ? m.content : []
    const text = parts.filter((p: any) => p?.type === "text" && typeof p.text === "string").map((p: any) => p.text).join(" ")
    if (text) return text
  }
  return ""
}

export default {
  id: "memory-system",
  async setup(ctx: any) {
    const directory: string = ctx?.location?.directory ?? ctx?.directory ?? process.cwd()
    const service = new MemoryService(directory)
    const cleanups: Array<() => void | Promise<void>> = []

    await ctx.tool.transform((editor: any) => {
      for (const tool of buildTools(service)) {
        editor.add({
          ...tool,
          async execute(input: any, toolCtx: any) {
            try {
              return await tool.execute(input, toolCtx)
            } catch (error) {
              return { content: `memory-system error: ${error instanceof Error ? error.message : String(error)}` }
            }
          },
        })
      }
    })

    if (ctx.session?.hook) {
      cleanups.push(await ctx.session.hook("prompt", async (event: any) => {
        const text = event?.prompt?.text
        if (typeof text === "string" && text.trim()) service.notePrompt(text)
      }))

      cleanups.push(await ctx.session.hook("context", async (event: any) => {
        if (!event?.sessionID) return
        try {
          const prompt = service.currentPrompt() || lastUserText(event.messages)
          if (prompt) service.notePrompt(prompt)
          const prefill = await service.prefill(15)
          const recall = await service.promptRecall(prompt, 5)
          const block = [prefill, recall].filter(Boolean).join("\n\n")
          if (block) event.system.push({ type: "text", text: block })
        } catch (error) {
          console.warn("[memory-system] context hook:", error)
        }
      }))

      cleanups.push(await ctx.session.hook("compaction", async (event: any) => {
        if (!event?.sessionID) return
        try {
          service.recordSessionSummary(String(event.sessionID))
          const context = service.context()
          if (!context) return
          const block = `## LTM Active Memories (${service.project})\n\n${context}`
          if (event.result) event.result.summary = [event.result.summary, block].filter(Boolean).join("\n\n")
          else if (Array.isArray(event.system)) event.system.push({ type: "text", text: block })
        } catch (error) {
          console.warn("[memory-system] compaction hook:", error)
        }
      }))
    }

    if (ctx.tool?.hook) {
      cleanups.push(await ctx.tool.hook("execute.after", async (event: any) => {
        if (event?.status !== "completed") return
        const command = typeof event?.input?.command === "string" ? event.input.command : ""
        if (!/\bgit\s+commit\b/.test(command)) return
        try {
          const changed = execFileSync("git", ["show", "--name-only", "--pretty=format:"], {
            cwd: directory, encoding: "utf8", timeout: 2000,
          }).split("\n").map((line) => line.trim()).filter(Boolean)
          if (changed.length) service.markStale(changed, "git commit touched anchored file")
        } catch {}
      }))
    }

    if (ctx.event?.subscribe) {
      const abort = new AbortController()
      ;(async () => {
        try {
          for await (const event of ctx.event.subscribe({ signal: abort.signal })) {
            const data: any = event?.data ?? {}
            if (event?.type === "session.deleted" && data.sessionID) {
              try { service.recordSessionSummary(String(data.sessionID)) } catch {}
            }
          }
        } catch (error) {
          if (!abort.signal.aborted) console.warn("[memory-system] event loop:", error)
        }
      })()
      cleanups.push(() => abort.abort())
    }

    return async () => {
      for (const cleanup of cleanups.reverse()) {
        try { await cleanup() } catch {}
      }
      service.close()
    }
  },
}
