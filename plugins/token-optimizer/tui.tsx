/** Live quality bar. Reads the local DB; renders without an inference turn. */
import { createEffect, createSignal, onCleanup } from "solid-js"
import { Service, config } from "./src/service.ts"

export default {
  id: "token-optimizer",
  setup(ctx: any) {
    const directory: string = ctx?.location?.directory ?? process.cwd()
    const projectID: string = ctx?.location?.project?.id ?? ""
    const service = new Service(directory, projectID, config())
    const [line, setLine] = createSignal("Token Optimizer · —")

    ctx.ui.slot({
      append: "sidebar.content",
      render: (input: any) => {
        const sessionID = () => String(input?.sessionID ?? input?.session_id ?? ctx.ui.router.current()?.sessionID ?? "")
        const refresh = () => {
          const id = sessionID()
          if (!id) return
          try {
            // Force a fresh score on the sidebar clock, bypassing the 2-minute
            // scorer cache so the line actually changes as the session runs.
            service.invalidate(id)
            const q = service.quality(id)
            const warn = q.fillWarning?.level ?? q.toolCallWarning?.level ?? ""
            setLine(`Token Optimizer · ${Math.round(q.resourceHealth)} ${q.resourceHealthGrade} · fill ${Math.round(q.fillPct * 100)}% · ${q.toolCalls} tools${warn ? ` · ${warn}` : ""}`)
          } catch {
            setLine("Token Optimizer · no data")
          }
        }
        createEffect(() => {
          try { ctx.data.session.message.list(sessionID()) } catch {}
          refresh()
          const timer = setInterval(refresh, 3000)
          onCleanup(() => clearInterval(timer))
        })
        return (
          <box flexDirection="column">
            <text fg={ctx.theme.text.muted}>{line()}</text>
          </box>
        )
      },
    })
  },
}
