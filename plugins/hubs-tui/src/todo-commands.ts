import type { TuiPluginApi, TuiDialogSelectOption } from '@opencode-ai/plugin/tui'
import { execFileSync } from 'node:child_process'
import {
  addTodo,
  completeTodo,
  deleteTodo,
  readArchive,
  readTodos,
  renderItem,
  renderOpen,
  todoDir,
  type TodoItem,
} from './todo-store'

/**
 * todo-commands.ts — the `/todo` slash command and ctrl+p palette entry.
 *
 * Registered through `api.command.register` with a `slash` name, so the entry is
 * reachable **both** as `/todo` and from the ctrl+p palette — the hub pattern.
 *
 * This is the human's list, distinct from the agent's in-session `taskTodos`
 * (`.opencode/state/todos.json`). There is deliberately no agent tool and no
 * system-prompt injection: the point is that the human owns it and the agent
 * does not silently mutate it. It opens as a hub-style `DialogSelect` menu.
 */

/** Best-effort clipboard. Prefers the renderer's OSC 52; falls back to tools. */
function copyToClipboard(text: string, renderer: any): boolean {
  if (!text) return false
  try {
    if (renderer && typeof renderer.copyToClipboardOSC52 === 'function') {
      if (typeof renderer.isOsc52Supported !== 'function' || renderer.isOsc52Supported()) {
        if (renderer.copyToClipboardOSC52(text)) return true
      }
    }
  } catch {
    /* fall through to the platform tools */
  }
  const tools: Array<[string, string[]]> = [
    ['wl-copy', []],
    ['xclip', ['-selection', 'clipboard']],
    ['xsel', ['--clipboard', '--input']],
    ['pbcopy', []],
    ['clip', []],
  ]
  for (const [cmd, args] of tools) {
    try {
      execFileSync(cmd, args, { input: text, stdio: ['pipe', 'ignore', 'ignore'] })
      return true
    } catch {
      /* try the next tool */
    }
  }
  return false
}

export function registerTodoCommands(api: TuiPluginApi, directory: string): () => void {
  const DS = api.ui.DialogSelect
  const DP = api.ui.DialogPrompt
  const DC = api.ui.DialogConfirm

  const toast = (title: string, message: string, variant: any = 'info') =>
    api.ui.toast({ title, message, variant, duration: 3000 })

  const items = () => readTodos(directory).items
  const archive = () => readArchive(directory)

  const itemOptions = (list: TodoItem[]): TuiDialogSelectOption<string>[] =>
    list.map((i, n) => ({
      title: `${n + 1}. ${i.text.length > 60 ? i.text.slice(0, 57) + '…' : i.text}`,
      value: i.id,
      description: i.createdAt ? `added ${i.createdAt.slice(0, 10)}` : undefined,
    }))

  const inject = (text: string, label: string) => {
    api.client.tui
      .appendPrompt({ text })
      .then(() => toast('Todo', `${label} added to the input box`, 'success'))
      .catch((e: any) => toast('Todo', `Could not reach the input box: ${e?.message ?? e}`, 'error'))
  }

  const copy = (text: string, label: string) => {
    const ok = copyToClipboard(text, api.renderer)
    if (ok) toast('Todo', `${label} copied to the clipboard`, 'success')
    else inject(text, label) // clipboard unavailable — fall back to the composer
  }

  /** Replace the dialog with a picker over `list`, then hand the id to `onPick`. */
  const pick = (list: TodoItem[], title: string, onPick: (id: string) => void) => {
    api.ui.dialog.replace(() =>
      DS<string>({
        title,
        placeholder: 'Choose…',
        options: itemOptions(list),
        onSelect: (sel) => {
          api.ui.dialog.clear()
          onPick(String(sel?.value ?? ''))
        },
      }),
    )
  }

  /** Per-item actions, reached from "List todos". */
  const itemMenu = (item: TodoItem) => {
    api.ui.dialog.replace(() =>
      DS<string>({
        title: item.text.length > 60 ? item.text.slice(0, 57) + '…' : item.text,
        options: [
          { title: 'Mark complete', value: 'complete', description: 'Move it to the completed archive' },
          { title: 'Delete', value: 'delete', description: 'Remove it without completing it' },
          { title: 'Inject into the input box', value: 'inject' },
          { title: 'Copy to clipboard', value: 'copy' },
        ],
        onSelect: (sel) => {
          api.ui.dialog.clear()
          const action = String(sel?.value ?? '')
          if (action === 'complete') {
            const done = completeTodo(directory, item.id)
            toast('Todo', done ? 'Completed' : 'Already gone', done ? 'success' : 'warning')
          } else if (action === 'delete') {
            confirmDelete(item, () => deleteTodo(directory, item.id))
          } else if (action === 'inject') {
            inject(renderItem(item), 'Todo item')
          } else if (action === 'copy') {
            copy(renderItem(item), 'Todo item')
          }
        },
      }),
    )
  }

  const confirmDelete = (item: TodoItem, run: () => void) => {
    api.ui.dialog.replace(() =>
      DC({
        title: 'Delete todo?',
        message: item.text,
        onConfirm: () => {
          api.ui.dialog.clear()
          run()
          toast('Todo', 'Deleted', 'info')
        },
        onCancel: () => api.ui.dialog.clear(),
      }),
    )
  }

  const openTodo = () => {
    const list = items()
    const archiveCount = archive().length
    const head = list.length ? `${list.length} open · ${archiveCount} done` : 'No open todos'

    const opts: TuiDialogSelectOption<string>[] = [
      { title: 'Add todo', value: 'add', description: 'Write a new item to this project’s list' },
      { title: 'List todos', value: 'list', description: head, disabled: !list.length },
      { title: 'Complete a todo', value: 'complete', description: 'Move an item to the completed archive', disabled: !list.length },
      { title: 'Delete a todo', value: 'delete', description: 'Remove an item without completing it', disabled: !list.length },
      { title: 'Inject into the input box', value: 'inject', description: 'Paste all (or one) item into the composer', disabled: !list.length },
      { title: 'Copy to clipboard', value: 'copy', description: 'Copy all (or one) item to the clipboard', disabled: !list.length },
      { title: 'View completed archive', value: 'archive', description: `${archiveCount} completed`, disabled: !archiveCount },
    ]

    api.ui.dialog.setSize('large')
    api.ui.dialog.replace(() =>
      DS<string>({
        title: `Todo — ${head}`,
        placeholder: 'Choose an action…',
        options: opts,
        onSelect: (sel) => {
          api.ui.dialog.clear()
          const value = String(sel?.value ?? '')

          if (value === 'add') {
            api.ui.dialog.replace(() =>
              DP({
                title: 'Add todo — what needs doing?',
                placeholder: 'e.g. wire the archive into the release checklist',
                value: '',
                onConfirm: (text: string) => {
                  api.ui.dialog.clear()
                  const item = addTodo(directory, text)
                  if (!item) {
                    toast('Todo', 'Nothing saved — the item was empty', 'warning')
                    return
                  }
                  toast('Todo', `Added (${items().length} open)`, 'success')
                },
                onCancel: () => api.ui.dialog.clear(),
              }),
            )
            return
          }

          if (value === 'list') {
            pick(list, 'Open todos — select one for actions', (id) => {
              const item = items().find((i) => i.id === id)
              if (item) itemMenu(item)
            })
            return
          }

          if (value === 'complete') {
            pick(list, 'Complete which?', (id) => {
              const done = completeTodo(directory, id)
              toast('Todo', done ? `Completed (${items().length} open)` : 'Already gone', done ? 'success' : 'warning')
            })
            return
          }

          if (value === 'delete') {
            pick(list, 'Delete which?', (id) => {
              const item = items().find((i) => i.id === id)
              if (item) confirmDelete(item, () => deleteTodo(directory, item.id))
            })
            return
          }

          if (value === 'inject' || value === 'copy') {
            const isCopy = value === 'copy'
            api.ui.dialog.replace(() =>
              DS<string>({
                title: isCopy ? 'Copy to clipboard' : 'Inject into the input box',
                options: [
                  { title: 'All open items', value: 'all', description: renderOpen(list) || '' },
                  { title: 'A single item', value: 'one', description: 'Choose one item' },
                ],
                onSelect: (how) => {
                  api.ui.dialog.clear()
                  const mode = String(how?.value ?? '')
                  if (mode === 'all') {
                    const text = renderOpen(list)
                    isCopy ? copy(text, 'Todo list') : inject(text, 'Todo list')
                    return
                  }
                  pick(list, 'Which item?', (id) => {
                    const item = items().find((i) => i.id === id)
                    if (!item) return
                    isCopy ? copy(renderItem(item), 'Todo item') : inject(renderItem(item), 'Todo item')
                  })
                },
              }),
            )
            return
          }

          if (value === 'archive') {
            const done = archive()
            api.ui.dialog.replace(() =>
              DS<string>({
                title: `Completed — ${done.length}`,
                options: done.map((e, n) => ({
                  title: `${n + 1}. ${e.text.length > 60 ? e.text.slice(0, 57) + '…' : e.text}`,
                  value: e.id,
                  description: e.completedAt ? `done ${e.completedAt.slice(0, 10)}` : undefined,
                })),
                onSelect: () => api.ui.dialog.clear(),
              }),
            )
            return
          }
        },
      }),
    )
  }

  return api.command!.register(() => [
    {
      title: 'Todo',
      value: 'todo',
      description: `Manage this project's todo list (${todoDir(directory)})`,
      category: 'Hubs Hubs',
      slash: { name: 'todo' },
      onSelect: openTodo,
    },
  ])
}
