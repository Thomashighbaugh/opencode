/**
 * memory-system — live sidebar bar. Reads the local vector-backed store; no
 * inference turn, no network.
 *
 * `prepend`, not `append`: the sidebar's content is a scrollbox and the hub
 * panel can be dozens of lines long, so anything appended after it sits below
 * the fold. These lines were invisible for exactly that reason.
 */
import { createEffect, createSignal, onCleanup } from "solid-js"
import { MemoryService } from "./src/service.ts"

export default {
  id: "memory-system",
  setup(ctx: any) {
    const directory: string = ctx?.location?.directory ?? process.cwd()
    const service = new MemoryService(directory)
    const [line, setLine] = createSignal("Memory · …")

    // Short enough for the 38-column sidebar body: the pending count is
    // dropped rather than wrapped when there is nothing pending.
    const render = () => {
      try {
        const s = service.stats()
        const pending = s.pendingProposals > 0 ? ` · ${s.pendingProposals} pending` : ""
        setLine(`Memory · ${s.active} active · ${s.stale} stale${pending}`)
      } catch {
        setLine("Memory · no data")
      }
    }

    ctx.ui.slot({
      prepend: "sidebar.content",
      render: (input: any) => {
        createEffect(() => {
          // Tracking the message list keeps the bar honest: a session that
          // learns a memory updates the counts without waiting for the clock.
          try {
            ctx.data.session.message.list(input?.sessionID ?? input?.session_id)
          } catch {}
          render()
          const timer = setInterval(render, 3000)
          onCleanup(() => clearInterval(timer))
        })
        return <text fg={ctx.theme.text.muted}>{line()}</text>
      },
    })
  },
}
