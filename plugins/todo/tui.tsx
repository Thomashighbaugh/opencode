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
  setup(ctx) {
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
       * Redraw the menu after a mutation. Clear the dialog stack first so a
       * stale list isn't left visible underneath.
       */
      const reopen = () => {
        ctx.ui.dialog.clear()
        void openMenu()
      }

      if (items.length === 0) {
        const addNow = await ctx.ui.dialog.confirm({
          title: "Todo",
          message: drafted ? "Add the current prompt text as a todo?" : "The list is empty. Add an item?",
          label: { confirm: "Add", cancel: "Close" },
        })
        if (addNow) await addFlow(drafted)
        return
      }

      /**
       * Native select, so the host owns sizing, scrolling, search and footer
       * justification. The earlier hand-rolled JSX menu reimplemented all four
       * and got them wrong.
       */
      const pending = ctx.ui.dialog.select<string>({
        title: `Todo — ${items.length} open`,
        placeholder: "Filter · Enter sends to agent",
        options: items.map((item) => ({
          title: shorten(item.text, 64),
          value: item.id,
          category: item.id,
        })),
        search: (query, options) => {
          const needle = query.trim().toLowerCase()
          if (!needle) return options
          return options.filter((option) => {
            const item = items.find((entry) => entry.id === option.value)
            return `${item?.text ?? ""} ${option.value}`.toLowerCase().includes(needle)
          })
        },
        actions: [
          {
            bind: "ctrl+a",
            title: "Add",
            side: "left",
            selection: "none",
            onTrigger: () => {
              ctx.ui.dialog.clear()
              void addFlow(drafted)
            },
          },
          {
            bind: "ctrl+i",
            title: "Insert",
            side: "left",
            selection: "required",
            onTrigger: (id: string) => {
              const item = refresh().find((entry) => entry.id === resolveId(directory(), id))
              if (!item) return
              const ok = appendComposer(ctx, item.text)
              toast(ok ? "Inserted into prompt" : "Could not reach the prompt input", ok ? "info" : "warning")
              reopen()
            },
          },
          {
            bind: "ctrl+d",
            title: "Delete",
            side: "right",
            selection: "required",
            onTrigger: (id: string) => {
              toast(remove(directory(), resolveId(directory(), id) ?? id).message, "warning")
              reopen()
            },
          },
          {
            bind: "ctrl+r",
            title: "Archive",
            side: "right",
            selection: "required",
            onTrigger: (id: string) => {
              const result = archiveItem(directory(), resolveId(directory(), id) ?? id)
              toast(result.message, result.ok ? "info" : "error")
              reopen()
            },
          },
          {
            bind: "ctrl+o",
            title: "Archive view",
            side: "right",
            selection: "none",
            onTrigger: () => {
              const result = archive(directory())
              ctx.ui.dialog.clear()
              void ctx.ui.dialog.alert({ title: "Todo archive", message: result.message })
            },
          },
        ],
      })
      // `set` acts on the active dialog, so it must run after `select` has opened it.
      ctx.ui.dialog.set({ size: "xlarge" })

      const choice = await pending
      if (!choice) return
      const item = refresh().find((entry) => entry.id === (resolveId(directory(), choice) ?? choice))
      if (!item) return
      await sendToAgent(item.text)
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