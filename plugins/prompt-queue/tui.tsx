/**
 * prompt-queue — TUI entrypoint (OpenCode 2).
 *
 * `/queue` and the palette open a menu over the queue file the server half
 * drains: add, list, reorder, remove, fire now, and hold/release override.
 * The composer-capture trick from V1 has no V2 equivalent (no composer-text API
 * in the TUI plugin context), so adding uses a prompt dialog.
 */

import type { Plugin } from "@opencode/plugin/tui"

import {
  enqueue,
  load,
  move,
  remove,
  requestFire,
  save,
  size,
  update,
} from "./queue.ts"

const definePlugin = (plugin: Plugin.Definition): Plugin.Definition => plugin

export default definePlugin({
  id: "prompt-queue",
  setup(ctx) {
    const directory = () => ctx.location?.directory ?? process.cwd()
    const toast = (message: string, variant: "info" | "warning" | "error" = "info") =>
      ctx.ui.toast.show({ title: "Prompt Queue", message, variant })

    async function menu(): Promise<void> {
      const state = load(directory())

      const choice = await ctx.ui.dialog.select<string>({
        title: `Prompt Queue — ${size(state)} item${size(state) === 1 ? "" : "s"}`,
        placeholder: "Filter",
        options: state.items.map((item, index) => ({
          title: `${index + 1}. ${item.text}`,
          value: item.id,
          description: item.source === "deferred" ? "deferred" : "manual",
          category: item.editedAt ? "edited" : undefined,
        })),
        search: (query, options) => {
          const needle = query.trim().toLowerCase()
          if (!needle) return options
          return options.filter((option) => option.title.toLowerCase().includes(needle))
        },
        actions: [
          { bind: "ctrl+a", title: "Add", selection: "none", onTrigger: () => void addFlow() },
          {
            bind: "ctrl+enter",
            title: "Fire now",
            selection: "none",
            onTrigger: () => {
              requestFire(directory(), { reason: "manual" })
              toast("Release requested")
            },
          },
          {
            bind: "ctrl+h",
            title: state.manual === "hold" ? "Unhold" : "Hold",
            side: "right",
            selection: "none",
            onTrigger: () => {
              const next = load(directory())
              next.manual = next.manual === "hold" ? null : "hold"
              save(directory(), next)
              toast(next.manual === "hold" ? "Holding" : "Hold cleared")
            },
          },
          {
            bind: "ctrl+d",
            title: "Remove",
            onTrigger: (id: string) => {
              remove(directory(), id)
              toast("Removed", "warning")
              void menu()
            },
          },
          {
            bind: "ctrl+up",
            title: "Up",
            selection: "required",
            onTrigger: (id: string) => {
              move(directory(), id, -1)
              void menu()
            },
          },
          {
            bind: "ctrl+down",
            title: "Down",
            selection: "required",
            onTrigger: (id: string) => {
              move(directory(), id, 1)
              void menu()
            },
          },
        ],
      })

      if (!choice) return
      const edit = await ctx.ui.dialog.prompt({
        title: "Edit item",
        placeholder: "Enter to keep, or type a replacement",
      })
      if (edit?.trim()) {
        update(directory(), choice, edit.trim())
        toast("Updated")
      }
      await menu()
    }

    async function addFlow(): Promise<void> {
      const text = await ctx.ui.dialog.prompt({ title: "Queue a prompt", placeholder: "What should run next?" })
      if (!text?.trim()) return
      enqueue(directory(), text.trim(), "manual")
      toast("Queued")
      await menu()
    }

    ctx.keymap.layer(() => ({
      mode: "global",
      commands: [
        {
          id: "prompt-queue.menu",
          title: "Prompt Queue",
          group: "Prompt Queue",
          palette: true,
          slash: { name: "queue" },
          run: () => void menu(),
        },
      ],
    }))
  },
})
