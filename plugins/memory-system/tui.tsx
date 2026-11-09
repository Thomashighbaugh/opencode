/** Live memory-system bar. Reads the local vector-backed store; no inference. */
import { createEffect, createSignal, onCleanup } from "solid-js"
import { MemoryService } from "./src/service.ts"

export default {
  id: "memory-system",
  setup(ctx: any) {
    const directory: string = ctx?.location?.directory ?? process.cwd()
    const service = new MemoryService(directory)
    const [line, setLine] = createSignal("Memory · —")
    ctx.ui.slot({
      append: "sidebar.content",
      render: (input: any) => {
        const refresh = () => {
          try {
            const s = service.stats()
            setLine(`Memory · ${s.active} active · ${s.stale} stale · ${s.pendingProposals} pending`)
          } catch {
            setLine("Memory · no data")
          }
        }
        createEffect(() => {
          try { ctx.data.session.message.list(input?.sessionID ?? input?.session_id) } catch {}
          refresh()
          const timer = setInterval(refresh, 3000)
          onCleanup(() => clearInterval(timer))
        })
        return <text fg={ctx.theme.text.muted}>{line()}</text>
      },
    })
  },
}
