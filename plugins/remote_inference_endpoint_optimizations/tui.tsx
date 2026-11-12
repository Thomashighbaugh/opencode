/** Live rio quality bar. Reads the local DB; renders without an inference turn.
 *  Fill % uses per-message usage ÷ context window — never cumulative session
 *  totals, which would pin fill at 100%. Cache reads/writes excluded.
 */
import { createEffect, createSignal, onCleanup } from "solid-js"
import { Service, config } from "./src/service.ts"

export default {
  id: "remote_inference_endpoint_optimizations",
  setup(ctx: any) {
    const directory: string = ctx?.location?.directory ?? process.cwd()
    const projectID: string = ctx?.location?.project?.id ?? ""
    const service = new Service(directory, projectID, config())
    const [line, setLine] = createSignal("rio · —")

    ctx.ui.slot({
      prepend: "sidebar.content",
      render: (input: any) => {
        const sessionID = () => String(input?.sessionID ?? input?.session_id ?? ctx.ui.router.current()?.sessionID ?? "")
        const refresh = async () => {
          const id = sessionID()
          if (!id) return
          try {
            service.invalidate(id)
            const q = await service.quality(id)
            const warn = q.fillWarning?.level ?? q.toolCallWarning?.level ?? ""
            setLine(`rio · ${Math.round(q.resourceHealth)}/${q.resourceHealthGrade} · fill ${Math.round(q.fillPct * 100)}% · ${q.toolCalls} tools${warn ? ` · ${warn}` : ""}`)
          } catch {
            setLine("rio · no data")
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
