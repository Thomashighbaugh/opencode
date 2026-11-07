/**
 * todo — TUI entrypoint (OpenCode 2).
 *
 * `/todo` and the command palette open a hub-style menu over the human's
 * project list (`.opencode/todo/todos.json`, committed; completions append to
 * `archive.jsonl`). Selecting an item completes it; footer actions add, delete,
 * and show the archive.
 */


import type { Plugin } from "@opencode/plugin/tui"

import { add, archive, complete, remove, resolveId } from "./ops"
import { readTodos } from "./todo-store"

const definePlugin = (plugin: Plugin.Definition): Plugin.Definition => plugin

export default definePlugin({
  id: "todo",
  setup(ctx) {
    const directory = () => ctx.location?.directory ?? process.cwd()

    const toast = (message: string, variant: "info" | "warning" | "error" = "info") =>
      ctx.ui.toast.show({ title: "Todo", message, variant })

    const refresh = () => readTodos(directory()).items

    async function openMenu(): Promise<void> {
      const items = refresh()

      const actions = [
        {
          bind: "ctrl+a",
          title: "Add",
          selection: "none" as const,
          onTrigger: () => void addFlow(),
        },
        {
          bind: "ctrl+d",
          title: "Delete",
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
          message: "The list is empty. Add an item?",
          label: { confirm: "Add", cancel: "Close" },
        })
        if (addNow) await addFlow()
        return
      }

      const choice = await ctx.ui.dialog.select<string>({
        title: `Todo — ${items.length} open`,
        placeholder: "Filter",
        options: items.map((item) => ({
          title: item.text,
          value: item.id,
          description: item.id,
          category: "open",
        })),
        search: (query, options) => {
          const needle = query.trim().toLowerCase()
          if (!needle) return options
          return options.filter((option) => `${option.title} ${option.value}`.toLowerCase().includes(needle))
        },
        actions,
      })

      if (!choice) return
      const resolved = resolveId(directory(), choice) ?? choice
      toast(complete(directory(), resolved).message)
      await openMenu()
    }

    async function addFlow(): Promise<void> {
      const text = await ctx.ui.dialog.prompt({ title: "New todo", placeholder: "What needs doing?" })
      if (!text?.trim()) return
      toast(add(directory(), text).message)
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
