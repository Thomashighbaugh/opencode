/**
 * todo — TUI entrypoint (OpenCode 2).
 *
 * `/todo` and the command palette open a hub-style menu over the human's
 * project list (`.opencode/todo/todos.json`, committed; archived items append
 * to `archive.jsonl`).
 *
 * Pressing Enter on an item hands it to the agent and leaves it in the list —
 * the human's list only shrinks when they archive or delete something. The
 * earlier behaviour completed on Enter, so a keystroke silently removed work
 * the user had not finished; and the menu reopened over the confirmation toast,
 * which is why the "sent" popup was never visible.
 *
 * Footer actions: add, insert into the prompt, delete, archive, open archive.
 *
 * Composer access (insert) uses the renderer tree — V2 publishes no prompt
 * handle — see `./composer.ts`.
 */

import type { Plugin } from "@opencode/plugin/tui"

import { add, archive, archiveItem, remove, resolveId } from "./ops"
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

    const shorten = (text: string, limit = 48) =>
      text.length > limit ? `${text.slice(0, limit - 1)}…` : text

    /** Hand a todo to the agent. Returns false when it could not be submitted. */
    async function sendToAgent(text: string): Promise<boolean> {
      const route = ctx.ui.router.current()
      const sessionID = route?.type === "session" ? route.sessionID : undefined
      if (!sessionID) {
        toast("No active session — open one, then send again", "warning")
        return false
      }
      try {
        await ctx.client.session.prompt({ sessionID, text, resume: true, delivery: "steer" })
        return true
      } catch (error) {
        toast(`Send failed: ${error instanceof Error ? error.message : String(error)}`, "error")
        return false
      }
    }

    async function openMenu(): Promise<void> {
      const items = refresh()
      // Read before the dialog opens (dialog input becomes the focused editor).
      const drafted = readComposer(ctx).trim()

      /**
       * Redraw the menu after a mutation. Footer actions do not close the
       * dialog, and opening a second select on top of the first leaves the
       * stale list visible underneath — so clear the stack first.
       */
      const reopen = () => {
        ctx.ui.dialog.clear()
        void openMenu()
      }

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
          bind: "ctrl+d",
          title: "Delete",
          selection: "required" as const,
          onTrigger: (id: string) => {
            const resolved = resolveId(directory(), id) ?? id
            toast(remove(directory(), resolved).message, "warning")
            reopen()
          },
        },
        {
          bind: "ctrl+r",
          title: "Archive",
          selection: "required" as const,
          onTrigger: (id: string) => {
            const resolved = resolveId(directory(), id) ?? id
            const result = archiveItem(directory(), resolved)
            toast(result.message, result.ok ? "info" : "error")
            reopen()
          },
        },
        {
          bind: "ctrl+o",
          title: "Open archive",
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
        title: `Todo — ${items.length} open · Enter sends to the agent`,
        placeholder: "Filter",
        options: items.map((item) => ({
          title: item.text,
          value: item.id,
          description: item.id.length > 12 ? `${item.id.slice(0, 8)}…` : item.id,
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
      // Enter hands the item to the agent. It is NOT removed: only Delete and
      // Archive take an item out of the list, and both are explicit.
      const resolved = resolveId(directory(), choice) ?? choice
      const item = refresh().find((entry) => entry.id === resolved)
      if (!item) {
        toast(`No open item with id ${resolved}`, "warning")
        return
      }
      if (await sendToAgent(item.text)) {
        toast(`Sent to the agent — "${shorten(item.text)}" stays open until you archive it`)
      }
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
      ctx.ui.dialog.clear()
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
