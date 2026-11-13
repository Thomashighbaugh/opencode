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

import { For, createMemo, createSignal } from "solid-js"
import type { Plugin } from "@opencode/plugin/tui"

import { add, archive, archiveItem, remove, resolveId } from "./ops"
import { readTodos } from "./todo-store"
import { appendComposer, clearComposer, readComposer } from "./composer"

const definePlugin = (plugin: Plugin.Definition): Plugin.Definition => plugin

function themeColor(color: any, fallback: string): string | undefined {
  try {
    if (color == null) return fallback
    return color
  } catch {
    return fallback
  }
}

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
       * Redraw the menu after a mutation. Clear the dialog stack first so a
       * stale list isn't left visible underneath.
       */
      const reopen = () => {
        ctx.ui.dialog.clear()
        void openMenu()
      }

      const actions = [
        {
          bind: "ctrl+a",
          title: "Add",
          onTrigger: () => void addFlow(drafted),
        },
        {
          bind: "ctrl+i",
          title: "Insert",
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
          onTrigger: (id: string) => {
            const resolved = resolveId(directory(), id) ?? id
            toast(remove(directory(), resolved).message, "warning")
            reopen()
          },
        },
        {
          bind: "ctrl+r",
          title: "Archive",
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
          onTrigger: () => {
            const result = archive(directory())
            ctx.ui.dialog.clear()
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

      // Search state + filtered list
      const [search, setSearch] = createSignal("")
      const [selectedId, setSelectedId] = createSignal<string | null>(null)
      const filtered = createMemo(() => {
        const needle = search().trim().toLowerCase()
        if (!needle) return items
        return items.filter((item) => `${item.text} ${item.id}`.toLowerCase().includes(needle))
      })

      const handleItem = (id: string) => {
        ctx.ui.dialog.clear()
        setSelectedId(id)
        const resolved = resolveId(directory(), id) ?? id
        const item = refresh().find((entry) => entry.id === resolved)
        if (!item) return
        void sendToAgent(item.text)
      }

      const handleAction = (bind: string) => {
        ctx.ui.dialog.clear()
        const id = selectedId()
        const action = actions.find((a) => a.bind === bind)
        if (!action) return
        if (bind === "ctrl+a" || bind === "ctrl+o") {
          ;(action as any).onTrigger()
          return
        }
        if (!id) {
          toast("No item selected", "warning")
          return
        }
        ;(action as any).onTrigger(id)
      }

      ctx.ui.dialog.show(() => (
        <box flexDirection="column" padding={1} gap={1}>
          <text fg={themeColor(ctx.theme.current?.text, "#ffffff")}>
            {`Todo — ${items.length} open · Enter sends to agent`}
          </text>
          <input
            placeholder="Filter"
            value={search()}
            onInput={(value: string) => setSearch(value)}
          />
          <scrollbox height="100%" scrollY>
            <For each={filtered()}>
              {(item: any) => (
                <text
                  fg={themeColor(ctx.theme.current?.text, "#ffffff")}
                  paddingLeft={1}
                  onMouseUp={() => {
                    setSelectedId(item.id)
                    handleItem(item.id)
                  }}
                >
                  {`  ${item.id === selectedId() ? "▸ " : ""}${item.text}`}
                </text>
              )}
            </For>
          </scrollbox>
          <text fg={themeColor(ctx.theme.current?.textMuted, "#666666")}>
            {`  ─────────────────────────────────────────`}
          </text>
          <box flexDirection="row" justifyContent="space-between" padding={1} gap={2}>
            <text
              fg={themeColor(ctx.theme.current?.textMuted, "#888888")}
              onMouseUp={() => handleAction("ctrl+a")}
            >
              Add (ctrl+a)
            </text>
            <text
              fg={themeColor(ctx.theme.current?.textMuted, "#888888")}
              onMouseUp={() => handleAction("ctrl+i")}
            >
              Insert (ctrl+i)
            </text>
            <text
              fg={themeColor(ctx.theme.current?.textMuted, "#888888")}
              onMouseUp={() => handleAction("ctrl+d")}
            >
              Delete (ctrl+d)
            </text>
            <text
              fg={themeColor(ctx.theme.current?.textMuted, "#888888")}
              onMouseUp={() => handleAction("ctrl+r")}
            >
              Archive (ctrl+r)
            </text>
            <text
              fg={themeColor(ctx.theme.current?.textMuted, "#888888")}
              onMouseUp={() => handleAction("ctrl+o")}
            >
              Open archive (ctrl+o)
            </text>
          </box>
        </box>
      ))
      ctx.ui.dialog.set({ size: "xlarge" })
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