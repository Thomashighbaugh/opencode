/**
 * todo/ops.ts — pure operations over the human todo store.
 *
 * Shared by the V2 tool (`index.ts`), the V2 TUI (`tui.tsx`), and the V1 command
 * module (`todo-commands.ts`). No host imports, so it is drivable from tests.
 */

import { addTodo, completeTodo, deleteTodo, readArchive, readTodos, renderOpen } from "./todo-store"

export type TodoResult =
  | { ok: true; message: string; items?: Array<{ id: string; text: string }> }
  | { ok: false; message: string }

export function list(directory: string): TodoResult {
  const store = readTodos(directory)
  return {
    ok: true,
    message: renderOpen(store.items),
    items: store.items.map((item) => ({ id: item.id, text: item.text })),
  }
}

export function add(directory: string, text: string): TodoResult {
  const trimmed = text.trim()
  if (!trimmed) return { ok: false, message: "Nothing to add" }
  const item = addTodo(directory, trimmed)
  if (!item) return { ok: false, message: "Could not add the item" }
  return { ok: true, message: `Added ${item.id}: ${item.text}` }
}

export function complete(directory: string, id: string): TodoResult {
  const entry = completeTodo(directory, id)
  if (!entry) return { ok: false, message: `No open item with id ${id}` }
  return { ok: true, message: `Completed ${entry.id}: ${entry.text}` }
}

export function remove(directory: string, id: string): TodoResult {
  return deleteTodo(directory, id)
    ? { ok: true, message: `Deleted ${id}` }
    : { ok: false, message: `No item with id ${id}` }
}

export function archive(directory: string): TodoResult {
  const entries = readArchive(directory)
  if (entries.length === 0) return { ok: true, message: "Archive is empty" }
  return {
    ok: true,
    message: entries.map((entry) => `${entry.id}  ${entry.text}  (completed ${entry.completedAt})`).join("\n"),
  }
}

export function resolveId(directory: string, reference: string): string | undefined {
  const needle = reference.trim().toLowerCase()
  if (!needle) return undefined
  const ids = readTodos(directory).items.map((item) => item.id)
  return ids.find((id) => id.toLowerCase() === needle) ?? ids.find((id) => id.toLowerCase().startsWith(needle))
}
