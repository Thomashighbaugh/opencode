import { describe, expect, test } from "vitest"
import fs from "node:fs"
import os from "node:os"
import path from "node:path"

import CommandHooks from "../../plugins/command-hooks/index"

describe("command-hooks v2 registration", () => {
  test("registers native tool hooks and an event subscription", async () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "command-hooks-v2-"))
    const registered = new Map<string, unknown>()
    let subscribed = false

    const ctx = {
      location: { directory: dir },
      session: { get: async () => ({}) },
      tool: {
        hook: async (name: string, fn: unknown) => {
          registered.set(name, fn)
        },
      },
      event: {
        subscribe: async function* () {
          subscribed = true
        },
      },
    }

    const cleanup = await (CommandHooks as any).setup(ctx)

    expect(registered.has("execute.before")).toBe(true)
    expect(registered.has("execute.after")).toBe(true)
    expect(subscribed).toBe(true)
    expect(typeof cleanup).toBe("function")

    // A before-hook call on an unmatched tool must be a no-op, not a throw.
    await (registered.get("execute.before") as any)({ tool: "read", sessionID: "s", id: "c", input: {} })

    fs.rmSync(dir, { recursive: true, force: true })
  })
})
