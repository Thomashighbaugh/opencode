import { describe, expect, test } from "vitest"
import fs from "node:fs"
import os from "node:os"
import path from "node:path"

import { add, archive, archiveItem, list, remove, resolveId } from "../../plugins/todo/ops"

function temp(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), "todo-ops-"))
}

/** The open items, or a failure if the list reported one. */
function open(dir: string): Array<{ id: string; text: string }> {
  const result = list(dir)
  if (!result.ok || !result.items) throw new Error(result.message)
  return result.items
}

describe("todo ops", () => {
  test("add → list → archive → archive list", () => {
    const dir = temp()
    expect(add(dir, "write the port").ok).toBe(true)
    expect(add(dir, "   ").ok).toBe(false)

    const items = open(dir)
    expect(items).toHaveLength(1)
    const id = items[0]!.id

    // Archiving is the only way an item leaves the open list — nothing else
    // removes it implicitly.
    expect(archiveItem(dir, id).ok).toBe(true)
    expect(open(dir)).toHaveLength(0)
    expect(archive(dir).message).toContain("write the port")

    fs.rmSync(dir, { recursive: true, force: true })
  })

  test("archiving one item leaves the others open", () => {
    const dir = temp()
    add(dir, "one")
    add(dir, "two")
    const [first, second] = open(dir)
    expect(archiveItem(dir, first!.id).ok).toBe(true)
    const remaining = open(dir)
    expect(remaining).toHaveLength(1)
    expect(remaining[0]!.id).toBe(second!.id)
    expect(archiveItem(dir, "nope").ok).toBe(false)
    fs.rmSync(dir, { recursive: true, force: true })
  })

  test("resolveId accepts a unique prefix", () => {
    const dir = temp()
    add(dir, "alpha")
    const id = open(dir)[0]!.id
    expect(resolveId(dir, id)).toBe(id)
    expect(resolveId(dir, id.slice(0, 4))).toBe(id)
    expect(resolveId(dir, "zzzz")).toBeUndefined()
    fs.rmSync(dir, { recursive: true, force: true })
  })

  test("delete removes only the named item", () => {
    const dir = temp()
    add(dir, "one")
    add(dir, "two")
    const first = open(dir)[0]!.id
    expect(remove(dir, first).ok).toBe(true)
    expect(open(dir)).toHaveLength(1)
    expect(remove(dir, "nope").ok).toBe(false)
    fs.rmSync(dir, { recursive: true, force: true })
  })

  test("archive is empty on a fresh project", () => {
    const dir = temp()
    expect(archive(dir).message).toBe("Archive is empty")
    fs.rmSync(dir, { recursive: true, force: true })
  })

  test("a failed archive write leaves the item on the list", () => {
    // The store appends before it removes. A failing append used to delete the
    // item without archiving it — silent loss. It must fail loudly and keep the
    // item open instead.
    const dir = temp()
    add(dir, "keep me")
    const id = open(dir)[0]!.id
    // A directory where the archive file belongs makes the append throw.
    fs.mkdirSync(path.join(dir, ".opencode", "todo", "archive.jsonl"), { recursive: true })
    const result = archiveItem(dir, id)
    expect(result.ok).toBe(false)
    expect(result.message).toContain("still on the list")
    expect(open(dir).map((item) => item.id)).toEqual([id])
    fs.rmSync(dir, { recursive: true, force: true })
  })
})
