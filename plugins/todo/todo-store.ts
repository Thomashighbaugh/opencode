import * as fs from 'node:fs'
import * as path from 'node:path'

/**
 * todo-store.ts — the durable, per-project todo store behind the `/todo` menu.
 *
 * ── Why this is separate from the agent's todos ─────────────────────────────
 *
 * The `taskTodos` tool keeps the **agent's** in-session task list at
 * `.opencode/state/todos.json` (gitignored, ephemeral). This store is the
 * **human's** list: it lives at `.opencode/todo/` and is committed, because its
 * whole purpose is to outlive the chat history the agent keeps losing itself in.
 * The two never touch.
 *
 * ── Layout (`<project>/.opencode/todo/`) ────────────────────────────────────
 *
 *   todos.json     { version, items: [{ id, text, createdAt }] }
 *   archive.jsonl  one JSON object per line, appended on completion
 *
 * JSON (not markdown) so the store needs no wiki frontmatter and can be read and
 * rewritten atomically. The archive is JSONL so completion is an append — no
 * read-modify-write of a growing file, and a truncated tail line cannot corrupt
 * the completed history the way a truncated JSON array would.
 *
 * Pure fs + string work, no TUI imports, so it is unit-testable.
 */

export interface TodoItem {
  id: string
  text: string
  createdAt: string
}

export interface ArchiveEntry extends TodoItem {
  completedAt: string
}

export interface TodoStore {
  version: number
  items: TodoItem[]
}

const STORE_VERSION = 1

export function todoDir(directory: string): string {
  return path.join(directory, '.opencode', 'todo')
}

export function todoFile(directory: string): string {
  return path.join(todoDir(directory), 'todos.json')
}

export function archiveFile(directory: string): string {
  return path.join(todoDir(directory), 'archive.jsonl')
}

export function newId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`
}

export function readTodos(directory: string): TodoStore {
  try {
    const raw = JSON.parse(fs.readFileSync(todoFile(directory), 'utf-8'))
    const items = Array.isArray(raw?.items) ? raw.items : []
    // Defensive: drop anything that is not a usable item rather than let a
    // malformed entry crash the menu that exists to show it.
    const clean: TodoItem[] = items
      .filter((i: any) => i && typeof i.text === 'string' && i.text.trim())
      .map((i: any) => ({
        id: typeof i.id === 'string' && i.id ? i.id : newId(),
        text: String(i.text),
        createdAt: typeof i.createdAt === 'string' ? i.createdAt : new Date().toISOString(),
      }))
    return { version: STORE_VERSION, items: clean }
  } catch {
    // Missing file or a read racing another write — both mean "empty", not "fail".
    return { version: STORE_VERSION, items: [] }
  }
}

export function writeTodos(directory: string, store: TodoStore): void {
  const file = todoFile(directory)
  fs.mkdirSync(path.dirname(file), { recursive: true })
  // Temp-then-rename: a torn write would drop the user's list.
  const tmp = `${file}.${process.pid}.tmp`
  fs.writeFileSync(tmp, JSON.stringify({ version: STORE_VERSION, items: store.items }, null, 2))
  fs.renameSync(tmp, file)
}

export function addTodo(directory: string, text: string): TodoItem | null {
  const trimmed = String(text ?? '').trim()
  if (!trimmed) return null
  const store = readTodos(directory)
  const item: TodoItem = { id: newId(), text: trimmed, createdAt: new Date().toISOString() }
  store.items.push(item)
  writeTodos(directory, store)
  return item
}

export function deleteTodo(directory: string, id: string): boolean {
  const store = readTodos(directory)
  const before = store.items.length
  store.items = store.items.filter((i) => i.id !== id)
  if (store.items.length === before) return false
  writeTodos(directory, store)
  return true
}

/** Remove from the active list and append to the completed archive. */
export function completeTodo(directory: string, id: string): ArchiveEntry | null {
  const store = readTodos(directory)
  const idx = store.items.findIndex((i) => i.id === id)
  if (idx === -1) return null
  const [item] = store.items.splice(idx, 1)
  writeTodos(directory, store)
  const entry: ArchiveEntry = { ...item, completedAt: new Date().toISOString() }
  const file = archiveFile(directory)
  fs.mkdirSync(path.dirname(file), { recursive: true })
  fs.appendFileSync(file, JSON.stringify(entry) + '\n')
  return entry
}

export function readArchive(directory: string): ArchiveEntry[] {
  try {
    return fs
      .readFileSync(archiveFile(directory), 'utf-8')
      .split('\n')
      .filter(Boolean)
      .map((line) => {
        try {
          return JSON.parse(line)
        } catch {
          return null
        }
      })
      .filter((e: any): e is ArchiveEntry => !!e && typeof e.text === 'string')
      .map((e: any) => ({
        id: typeof e.id === 'string' ? e.id : newId(),
        text: String(e.text),
        createdAt: typeof e.createdAt === 'string' ? e.createdAt : '',
        completedAt: typeof e.completedAt === 'string' ? e.completedAt : '',
      }))
  } catch {
    return []
  }
}

/** Markdown checklist of the open items — re-ingestible by the agent as a plan. */
export function renderOpen(items: TodoItem[]): string {
  return items.map((i) => `- [ ] ${i.text}`).join('\n')
}

export function renderItem(item: TodoItem): string {
  return `- [ ] ${item.text}`
}
