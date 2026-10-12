import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import * as fs from 'node:fs'
import * as os from 'node:os'
import * as path from 'node:path'
import {
  addTodo,
  archiveFile,
  completeTodo,
  deleteTodo,
  readArchive,
  readTodos,
  renderItem,
  renderOpen,
  todoFile,
} from '../../plugins/hubs-tui/src/todo-store'

/**
 * The `/todo` store is pure fs + strings, so it is tested directly — the TUI
 * menu that drives it is not exercised here, only the durable behaviour the
 * human relies on: save, complete (archive), delete, and read back.
 */

let dir: string

beforeEach(() => {
  dir = fs.mkdtempSync(path.join(os.tmpdir(), 'todo-store-'))
})

afterEach(() => {
  fs.rmSync(dir, { recursive: true, force: true })
})

describe('todo store', () => {
  it('reads an absent store as empty', () => {
    expect(readTodos(dir)).toEqual({ version: 1, items: [] })
    expect(readArchive(dir)).toEqual([])
  })

  it('saves an item and reads it back', () => {
    const item = addTodo(dir, '  ship the todo plugin  ')
    expect(item).not.toBeNull()
    expect(item!.text).toBe('ship the todo plugin')

    const store = readTodos(dir)
    expect(store.items).toHaveLength(1)
    expect(store.items[0].text).toBe('ship the todo plugin')
    expect(store.items[0].id).toBe(item!.id)
  })

  it('refuses an empty or whitespace-only item', () => {
    expect(addTodo(dir, '')).toBeNull()
    expect(addTodo(dir, '    ')).toBeNull()
    expect(readTodos(dir).items).toHaveLength(0)
  })

  it('assigns distinct ids', () => {
    const ids = new Set([addTodo(dir, 'a')!.id, addTodo(dir, 'b')!.id, addTodo(dir, 'c')!.id])
    expect(ids.size).toBe(3)
  })

  it('completes an item: removes it from the active list, appends to the archive', () => {
    const a = addTodo(dir, 'first')!
    addTodo(dir, 'second')

    const entry = completeTodo(dir, a.id)
    expect(entry).not.toBeNull()
    expect(entry!.text).toBe('first')
    expect(entry!.completedAt).toBeTruthy()

    expect(readTodos(dir).items.map((i) => i.text)).toEqual(['second'])
    const archive = readArchive(dir)
    expect(archive).toHaveLength(1)
    expect(archive[0].text).toBe('first')
  })

  it('completing a missing id is a no-op returning null', () => {
    expect(completeTodo(dir, 'nope')).toBeNull()
  })

  it('deletes an item, and reports a miss', () => {
    const item = addTodo(dir, 'delete me')!
    expect(deleteTodo(dir, item.id)).toBe(true)
    expect(readTodos(dir).items).toHaveLength(0)
    expect(deleteTodo(dir, item.id)).toBe(false)
  })

  it('tolerates a truncated archive line without losing the rest', () => {
    const a = addTodo(dir, 'one')!
    completeTodo(dir, a.id)
    // Simulate a torn append (crash mid-write) by hand.
    fs.appendFileSync(archiveFile(dir), '{"text":"two","completedAt":"2026-01-01T00:00:00Z"}\n{bad json\n')
    const archive = readArchive(dir)
    expect(archive.map((e) => e.text)).toEqual(['one', 'two'])
  })

  it('writes the store atomically (no leftover temp file)', () => {
    addTodo(dir, 'atomic')
    const stray = fs.readdirSync(path.dirname(todoFile(dir))).filter((f) => f.endsWith('.tmp'))
    expect(stray).toEqual([])
  })

  it('renders the open list and a single item as an ingestible checklist', () => {
    const a = addTodo(dir, 'alpha')!
    addTodo(dir, 'beta')
    expect(renderOpen(readTodos(dir).items)).toBe('- [ ] alpha\n- [ ] beta')
    expect(renderItem(a)).toBe('- [ ] alpha')
  })
})
