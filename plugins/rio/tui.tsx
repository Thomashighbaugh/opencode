/** Live rio quality bar. Reads the local DB; renders without an inference turn.
 *  Fill % uses per-message usage ÷ context window — never cumulative session
 *  totals, which would pin fill at 100%. Cache reads/writes excluded.
 */
import { createEffect, createSignal, onCleanup } from "solid-js"
import { Service, config } from "./src/service.ts"
import { MemoryService } from "./src/memory.ts"
import { memorySidebarLine, readMemoryState } from "./src/inject.ts"
import { buildMenuItems, expandSubcommand, runMenuAction } from "./src/menu.ts"

export default {
  id: "remote_inference_endpoint_optimizations",
  setup(ctx: any) {
    const directory: string = ctx?.location?.directory ?? process.cwd()
    const projectID: string = ctx?.location?.project?.id ?? ""
    const service = new Service(directory, projectID, config())
    const memory = new MemoryService(directory, projectID)
    const [line, setLine] = createSignal("rio · —")
    const [memLine, setMemLine] = createSignal("memory · —")

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
          try {
            const state = readMemoryState(directory, id)
            const total = state?.total ?? memory.stats(projectID || null).total
            setMemLine(memorySidebarLine(state?.loaded ?? 0, total))
          } catch {
            setMemLine("memory · —")
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
            <text fg={ctx.theme.text.muted}>{memLine()}</text>
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
          title: "Rio — token compression & memory options",
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
      let route = ctx.ui.router.current()
      let sessionID = route?.type === "session" ? route.sessionID : undefined
      if (!sessionID) {
        try {
          const created = await (ctx.client.session.create as any)({ directory, title: "rio" })
          sessionID = (created as any)?.data?.id ?? (created as any)?.id
          if (sessionID && typeof (ctx.ui.router as any).navigate === "function") {
            try { (ctx.ui.router as any).navigate({ type: "session", sessionID }) } catch {}
          }
        } catch (error) {
          toast(`Could not create session: ${error instanceof Error ? error.message : String(error)}`, "error")
          return
        }
      }
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
        let showDefFor: string | null = null
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
          actions: [
            {
              bind: "ctrl+s",
              title: "Full definition",
              onTrigger: (subLabel: any) => { showDefFor = subLabel; return "back" as const },
            },
            {
              bind: "ctrl+," ,
              title: "Back to rio",
              side: "right",
              selection: "none",
              onTrigger: () => "back" as const,
            },
          ],
        })
        if (!choice) return

        if (showDefFor) {
          const expanded = expandSubcommand(showDefFor) ?? `No definition for "${showDefFor}"`
          ctx.ui.dialog.show(() => (
            <scrollbox width="100%" height="100%" scrollY>
              <box flexDirection="column" padding={1}>
                <text fg={ctx.theme.text.muted}>{expanded}</text>
              </box>
            </scrollbox>
          ))
          ctx.ui.dialog.set({ size: "xlarge", centered: true })
          // Reopen the menu after viewing the expanded definition
          await openRioMenu()
          return
        }
        if (choice === "back") {
          await openRioMenu()
          return
        }
        const result = await runMenuAction(choice, service, memory, ctx)
        await submit(result)
      } catch (error) {
        toast(`Rio menu error: ${error instanceof Error ? error.message : String(error)}`, "error")
      }
    }

  },
}
