/**
 * prompt-queue — TUI entrypoint (OpenCode 2).
 *
 * `/queue` and the palette open a menu over the queue file the server half
 * drains: add (including capture from the prompt), list, reorder, remove,
 * fire now, and hold/release override. Composer access uses the renderer tree
 * (V2 publishes no prompt handle) — see `./composer.ts`.
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
import { appendComposer, clearComposer, readComposer } from "./composer"

const definePlugin = (plugin: Plugin.Definition): Plugin.Definition => plugin

export default definePlugin({
  id: "prompt-queue",
  setup(ctx: any) {
    const directory = () => ctx.location?.directory ?? process.cwd()
    const toast = (message: string, variant: "info" | "warning" | "error" = "info") =>
      ctx.ui.toast.show({ title: "Prompt Queue", message, variant })

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

    async function itemMenu(id: string, text: string): Promise<void> {
      const action = await ctx.ui.dialog.select({
        title: text.length > 60 ? `${text.slice(0, 57)}…` : text,
        options: [
          { title: "Insert into prompt", value: "insert", description: "Append at the cursor" },
          { title: "Edit", value: "edit", description: "Rewrite in place" },
          { title: "Send to agent", value: "send", description: "Submit now" },
          { title: "Back", value: "back" },
        ],
      })
      if (!action || action === "back") {
        await menu()
        return
      }
      if (action === "insert") {
        const ok = appendComposer(ctx, text)
        toast(ok ? "Inserted into prompt" : "Could not reach the prompt input", ok ? "info" : "warning")
        return
      }
      if (action === "send") {
        await sendToAgent(text)
        return
      }
      if (action === "edit") {
        const edit = await ctx.ui.dialog.prompt({
          title: "Edit item",
          placeholder: "Replacement text",
          value: text,
        })
        if (edit?.trim()) {
          update(directory(), id, edit.trim())
          toast("Updated")
        }
        await menu()
      }
    }

    async function menu(): Promise<void> {
      const state = load(directory())

      // Read composer before opening the dialog (dialog input becomes focused).
      const drafted = readComposer(ctx).trim()

      const choice = await ctx.ui.dialog.select({
        title: `Prompt Queue — ${size(state)} item${size(state) === 1 ? "" : "s"}`,
        placeholder: "Filter",
        options: state.items.map((item, index) => ({
          title: `${index + 1}. ${item.text}`,
          value: item.id,
          description: item.source === "deferred" ? "deferred" : "manual",
          category: item.editedAt ? "edited" : undefined,
        })),
        search: (query: string, options: any[]) => {
          const needle = query.trim().toLowerCase()
          if (!needle) return options
          return options.filter((option: any) => option.title.toLowerCase().includes(needle))
        },
        actions: [
          { bind: "ctrl+a", title: "Add", selection: "none", onTrigger: () => void addFlow(drafted) },
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
            bind: "ctrl+i",
            title: "Insert",
            selection: "required",
            onTrigger: (id: string) => {
              const item = load(directory()).items.find((entry) => entry.id === id)
              if (!item) return
              const ok = appendComposer(ctx, item.text)
              toast(ok ? "Inserted into prompt" : "Could not reach the prompt input", ok ? "info" : "warning")
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
      const item = load(directory()).items.find((entry) => entry.id === choice)
      if (!item) {
        await menu()
        return
      }
      await itemMenu(item.id, item.text)
    }

    async function addFlow(prefill = ""): Promise<void> {
      const text = await ctx.ui.dialog.prompt({
        title: prefill ? "Queue (from prompt) — edit or confirm" : "Queue a prompt",
        placeholder: "What should run next?",
        value: prefill,
      })
      if (!text?.trim()) return
      enqueue(directory(), text.trim(), "manual")
      // If we captured from the prompt, clear it so it isn't sent twice.
      if (prefill && text.trim() === prefill) clearComposer(ctx)
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
