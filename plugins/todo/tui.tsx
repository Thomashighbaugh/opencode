/**
 * todo — TUI entrypoint (OpenCode 2).
 *
 * `/todo` and the command palette open a hub-style menu over the human's
 * project list (`.opencode/todo/todos.json`, committed; completions append to
 * `archive.jsonl`). Selecting an item completes it; footer actions add, delete,
 * insert into the prompt, and show the archive.
 *
 * Composer access (insert) uses the renderer tree — V2 publishes no prompt
 * handle — see `./composer.ts`.
 */

import type { Plugin } from "@opencode/plugin/tui"

import { add, archive, complete, remove, resolveId } from "./ops"
import { readTodos } from "./todo-store"
import { appendComposer, clearComposer, readComposer } from "./composer"

const definePlugin = (plugin: Plugin.Definition): Plugin.Definition => plugin

export default definePlugin({
  id: "todo",
  setup(ctx: any) {
    const directory = () => ctx.location?.directory ?? process.cwd()

    const toast = (message: string, variant: "info" | "warning" | "error" = "info") =>
      ctx.ui.toast.show({ title: "Todo", message, variant })

    const refresh = () => readTodos(directory()).items

    async function sendToAgent(text: string) {
      const route = ctx.ui.router.current()
      const sessionID = route.type === "session" ? route.sessionID : undefined
      if (!sessionID) {
        toast("No active session", "warning")
        return
      }
      try {
        await ctx.client.session.prompt({ sessionID, text })
        toast("Sent")
      } catch (error) {
        toast(`Send failed: ${error instanceof Error ? error.message : String(error)}`, "error")
      }
    }

    async function openMenu(): Promise<void> {
      const items = refresh()
      // Read before the dialog opens (dialog input becomes the focused editor).
      const drafted = readComposer(ctx).trim()

      const actions = [
        {
          bind: "ctrl+a",
          title: "Add",
          selection: "none" as const,
          onTrigger: () => void addFlow(drafted),
        },
        {
          bind: "ctrl+i",
          title: "Insert",
          selection: "required" as const,
          onTrigger: (id: string) => {
            const item = refresh().find((entry) => entry.id === resolveId(directory(), id))
            if (!item) return
            const ok = appendComposer(ctx, item.text)
            toast(ok ? "Inserted into prompt" : "Could not reach the prompt input", ok ? "info" : "warning")
          },
        },
        {
          bind: "ctrl+s",
          title: "Send",
          selection: "required" as const,
          onTrigger: (id: string) => {
            const item = refresh().find((entry) => entry.id === resolveId(directory(), id))
            if (item) void sendToAgent(item.text)
          },
        },
        {
          bind: "ctrl+d",
          title: "Delete",
          selection: "required" as const,
          onTrigger: (id: string) => {
            const resolved = resolveId(directory(), id) ?? id
            toast(remove(directory(), resolved).message, "warning")
            void openMenu()
          },
        },
        {
          bind: "ctrl+r",
          title: "Archive",
          side: "right" as const,
          selection: "none" as const,
          onTrigger: () => {
            const result = archive(directory())
            void ctx.ui.dialog.alert({ title: "Todo archive", message: result.message })
          },
        },
      ]

      if (items.length === 0) {
        const addNow = await ctx.ui.dialog.confirm({
          title: "Todo",
          message: drafted ? "Add the current prompt text as a todo?" : "The list is empty. Add an item?",
          label: { confirm: "Add", cancel: "Close" },
        })
        if (addNow) await addFlow(drafted)
        return
      }

      const choice = await ctx.ui.dialog.select({
        title: `Todo — ${items.length} open`,
        placeholder: "Filter",
        options: items.map((item) => ({
          title: item.text,
          value: item.id,
          description: item.id,
          category: "open",
        })),
        search: (query: string, options: any[]) => {
          const needle = query.trim().toLowerCase()
          if (!needle) return options
          return options.filter((option: any) => `${option.title} ${option.value}`.toLowerCase().includes(needle))
        },
        actions,
      })

      if (!choice) return
      // Primary action: complete the selected item.
      const resolved = resolveId(directory(), choice) ?? choice
      toast(complete(directory(), resolved).message)
      await openMenu()
    }

    async function addFlow(prefill = ""): Promise<void> {
      const text = await ctx.ui.dialog.prompt({
        title: prefill ? "New todo (from prompt)" : "New todo",
        placeholder: "What needs doing?",
        value: prefill,
      })
      if (!text?.trim()) return
      toast(add(directory(), text).message)
      if (prefill && text.trim() === prefill) clearComposer(ctx)
      await openMenu()
    }

    ctx.keymap.layer(() => ({
      mode: "global",
      commands: [
        {
          id: "todo.menu",
          title: "Todo",
          group: "Todo",
          palette: true,
          slash: { name: "todo" },
          run: () => void openMenu(),
        },
      ],
    }))
  },
})
