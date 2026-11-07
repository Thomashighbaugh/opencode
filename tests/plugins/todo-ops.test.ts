import { describe, expect, test } from "vitest"
import fs from "node:fs"
import os from "node:os"
import path from "node:path"

import { add, archive, complete, list, remove, resolveId } from "../../plugins/todo/ops"

function temp(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), "todo-ops-"))
}

describe("todo ops", () => {
  test("add → list → complete → archive", () => {
    const dir = temp()
    expect(add(dir, "write the port").ok).toBe(true)
    expect(add(dir, "   ").ok).toBe(false)

    const open = list(dir)
    expect(open.ok).toBe(true)
    expect(open.items).toHaveLength(1)
    const id = open.items![0]!.id

    expect(complete(dir, id).ok).toBe(true)
    expect(list(dir).items).toHaveLength(0)
    expect(archive(dir).message).toContain("write the port")

    fs.rmSync(dir, { recursive: true, force: true })
  })

  test("resolveId accepts a unique prefix", () => {
    const dir = temp()
    add(dir, "alpha")
    const id = list(dir).items![0]!.id
    expect(resolveId(dir, id)).toBe(id)
    expect(resolveId(dir, id.slice(0, 4))).toBe(id)
    expect(resolveId(dir, "zzzz")).toBeUndefined()
    fs.rmSync(dir, { recursive: true, force: true })
  })

  test("delete removes only the named item", () => {
    const dir = temp()
    add(dir, "one")
    add(dir, "two")
    const first = list(dir).items![0]!.id
    expect(remove(dir, first).ok).toBe(true)
    expect(list(dir).items).toHaveLength(1)
    expect(remove(dir, "nope").ok).toBe(false)
    fs.rmSync(dir, { recursive: true, force: true })
  })

  test("archive is empty on a fresh project", () => {
    const dir = temp()
    expect(archive(dir).message).toBe("Archive is empty")
    fs.rmSync(dir, { recursive: true, force: true })
  })
})
