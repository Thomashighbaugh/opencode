/**
 * token-optimizer — live sidebar bar. Reads the local DB; renders without an
 * inference turn.
 *
 * `prepend`, not `append`: the sidebar's content is a scrollbox and the hub
 * panel can be dozens of lines long, so anything appended after it sits below
 * the fold. These lines were invisible for exactly that reason.
 */
import { createEffect, createSignal, onCleanup } from "solid-js"
import { Service, config } from "./src/service.ts"

export default {
  id: "token-optimizer",
  setup(ctx: any) {
    const directory: string = ctx?.location?.directory ?? process.cwd()
    const projectID: string = ctx?.location?.project?.id ?? ""
    const service = new Service(directory, projectID, config())
    const [line, setLine] = createSignal("Token · …")

    // One line, ≤38 columns: "Token · 100 S · 5% fill · 3 tools ⚠".
    const render = (sessionID: string) => {
      if (!sessionID) {
        setLine("Token · no session")
        return
      }
      try {
        // Force a fresh score on the sidebar clock, bypassing the 2-minute
        // scorer cache so the line actually changes as the session runs.
        service.invalidate(sessionID)
        const q = service.quality(sessionID)
        const warn = q.fillWarning?.level === "CRITICAL" || q.toolCallWarning?.level === "CRITICAL" ? " ⚠⚠" : q.fillWarning || q.toolCallWarning ? " ⚠" : ""
        setLine(`Token · ${Math.round(q.resourceHealth)} ${q.resourceHealthGrade} · ${Math.round(q.fillPct * 100)}% fill · ${q.toolCalls} tools${warn}`)
      } catch {
        setLine("Token · no data")
      }
    }

    ctx.ui.slot({
      prepend: "sidebar.content",
      render: (input: any) => {
        const sessionID = () => String(input?.sessionID ?? input?.session_id ?? ctx.ui.router.current()?.sessionID ?? "")
        createEffect(() => {
          try {
            ctx.data.session.message.list(sessionID())
          } catch {}
          render(sessionID())
          const timer = setInterval(() => render(sessionID()), 3000)
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
