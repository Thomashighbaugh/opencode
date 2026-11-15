/** Live rio quality bar. Reads the local DB; renders without an inference turn.
 *  Fill % uses per-message usage ÷ context window — never cumulative session
 *  totals, which would pin fill at 100%. Cache reads/writes excluded.
 */
import { createEffect, createSignal, onCleanup } from "solid-js"
import { Service, config } from "./src/service.ts"
import { MemoryService } from "./src/memory.ts"
import { buildMenuItems, runMenuAction } from "./src/menu.ts"

export default {
  id: "remote_inference_endpoint_optimizations",
  setup(ctx: any) {
    const directory: string = ctx?.location?.directory ?? process.cwd()
    const projectID: string = ctx?.location?.project?.id ?? ""
    const service = new Service(directory, projectID, config())
    const memory = new MemoryService(directory, projectID)
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

    // ── /rio slash command: hub-like subcommand picker ─────────────
    ctx.keymap.layer(() => ({
      mode: "global",
      commands: [
        {
          id: "rio.menu",
          title: "Rio",
          group: "Rio",
          palette: true,
          slash: { name: "rio" },
          run: () => void openRioMenu(),
        },
      ],
    }))

    const toast = (message: string, variant: "info" | "warning" | "error" = "info") =>
      ctx.ui.toast.show({ title: "Rio", message, variant })

    const submit = async (text: string) => {
      const route = ctx.ui.router.current()
      const sessionID = route?.type === "session" ? route.sessionID : undefined
      if (!sessionID) {
        toast("Open a session first", "warning")
        return
      }
      try {
        await ctx.client.session.prompt({ sessionID, text, resume: true, delivery: "steer" })
      } catch (error) {
        toast(`Could not submit: ${error instanceof Error ? error.message : String(error)}`, "error")
      }
    }

    async function openRioMenu() {
      try {
        const items = buildMenuItems()
        const choice = await (ctx.ui.dialog.select as any)({
          title: `Rio — ${items.length} subcommands`,
          placeholder: "Filter subcommands",
          options: items.map((it) => ({
            title: it.label,
            value: it.id,
            description: it.detail,
          })),
          search: (query: string, options: any[]) => {
            const needle = query.trim().toLowerCase()
            if (!needle) return options
            return options.filter((option: any) =>
              `${option.title} ${option.description ?? ""}`.toLowerCase().includes(needle),
            )
          },
        })
        if (!choice) return
        const result = await runMenuAction(choice, service, memory, ctx)
        await submit(result)
      } catch (error) {
        toast(`Rio menu error: ${error instanceof Error ? error.message : String(error)}`, "error")
      }
    }

  },
}
