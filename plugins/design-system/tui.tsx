/**
 * design-system TUI. Renders a `/design-system` slash command palette entry
 * that opens a hub-like menu of all design subcommands. Selecting one runs
 * it via the design_system tool and submits the result to the session.
 *
 * Self-contained: imports nothing from hubs. Mirrors rio/tui.tsx structure.
 */
import { createEffect, createSignal, onCleanup } from "solid-js"
import { buildMenuItems, expandSubcommand, formatMenu } from "./src/menu.ts"
import { executeSubcommand } from "./src/actions.ts"

export default {
  id: "design_system_tui",
  setup(ctx: any) {
    const directory: string = ctx?.location?.directory ?? process.cwd()

    const [line, setLine] = createSignal("design-system · —")

    // Sidebar quality indicator (lightweight, no inference)
    ctx.ui.slot({
      prepend: "sidebar.content",
      render: (input: any) => {
        const sessionID = () => String(input?.sessionID ?? input?.session_id ?? ctx.ui.router.current()?.sessionID ?? "")
        const refresh = () => {
          try { ctx.data.session.message.list(sessionID()) } catch {}
          setLine(`design-system · ${directory.split("/").pop()}`)
        }
        createEffect(() => {
          refresh()
          const timer = setInterval(refresh, 5000)
          onCleanup(() => clearInterval(timer))
        })
        return (
          <box flexDirection="column">
            <text fg={ctx.theme.text.muted}>{line()}</text>
          </box>
        )
      },
    })

    const toast = (message: string, variant: "info" | "warning" | "error" = "info") =>
      ctx.ui.toast.show({ title: "design-system", message, variant })

    const submit = async (text: string) => {
      let route = ctx.ui.router.current()
      let sessionID = route?.type === "session" ? route.sessionID : undefined
      if (!sessionID) {
        // No active session: create one and deliver the payload there.
        try {
          const created = await (ctx.client.session.create as any)({ directory, title: "design-system" })
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

    // ── /design-system slash command: hub-like subcommand picker ─────
    ctx.keymap.layer(() => ({
      mode: "global",
      commands: [
        {
          id: "design_system.menu",
          title: "Design system - design subcommands",
          group: "Design system",
          palette: true,
          slash: { name: "design-system" },
          run: () => void openDesignSystemMenu(),
        },
      ],
    }))

    async function openDesignSystemMenu() {
      try {
        const items = buildMenuItems()
        let showDefFor: string | null = null
        const choice = await (ctx.ui.dialog.select as any)({
          title: `design-system - ${items.length} subcommands`,
          placeholder: "Filter design subcommands",
          options: items.map((it) => ({
            title: it.label,
            value: it.id,
            description: `${it.category} - ${it.detail}`,
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
              title: "Back to design-system",
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
          await openDesignSystemMenu()
          return
        }
        if (choice === "back") {
          await openDesignSystemMenu()
          return
        }

        // Run the selected subcommand via the design_system tool
        const result = executeSubcommand(choice)
        await submit(
          `design-system ${choice}: ${result.ok ? result.output : `error: ${result.error}`}`,
        )
      } catch (error) {
        toast(`design-system menu error: ${error instanceof Error ? error.message : String(error)}`, "error")
      }
    }
  },
}
