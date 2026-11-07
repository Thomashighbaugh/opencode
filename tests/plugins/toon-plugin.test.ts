import { describe, expect, test } from "vitest"

import ToonPlugin from "../../plugins/toon/index"

type Hook = (event: any) => Promise<void> | void

async function hooks() {
  const registered = new Map<string, Hook>()
  const ctx = {
    tool: {
      hook: async (name: string, fn: Hook) => {
        registered.set(name, fn)
      },
    },
  }
  await (ToonPlugin as any).setup(ctx)
  return registered
}

function payload(rows = 40) {
  return JSON.stringify(
    Array.from({ length: rows }, (_, index) => ({
      id: index,
      title: `item-${index}`,
      state: index % 2 ? "open" : "closed",
    })),
  )
}

async function after(tool: string, content: string, status: "completed" | "error" = "completed") {
  const event: any = { tool, status, input: {}, result: status === "completed" ? { content } : undefined }
  await (await hooks()).get("execute.after")!(event)
  return event.result?.content as string
}

async function before(command: string) {
  const event: any = { tool: "bash", input: { command } }
  await (await hooks()).get("execute.before")!(event)
  return event.input.command as string
}

describe("toon execute.after", () => {
  test("compacts long JSON bash output", async () => {
    const json = payload()
    const output = await after("bash", json)
    expect(output).not.toBe(json)
    expect(output).toContain("[40]")
    expect(output.length).toBeLessThan(json.length)
  })

  test("leaves short JSON untouched", async () => {
    const json = JSON.stringify({ a: 1 })
    expect(await after("bash", json)).toBe(json)
  })

  test("leaves non-JSON untouched", async () => {
    const text = "plain text ".repeat(50)
    expect(await after("bash", text)).toBe(text)
  })

  test("ignores tools that are not eligible", async () => {
    const json = payload()
    expect(await after("read", json)).toBe(json)
  })

  test("ignores failed calls", async () => {
    const event: any = { tool: "bash", status: "error", input: {}, error: { message: "boom" } }
    await (await hooks()).get("execute.after")!(event)
    expect(event.result).toBeUndefined()
  })

  test("never emits TOON longer than the JSON", async () => {
    const json = JSON.stringify(Array.from({ length: 60 }, (_, index) => ({ ["k" + index]: index })))
    const output = await after("bash", json)
    expect(output === json || output.length < json.length).toBe(true)
  })
})

describe("toon execute.before", () => {
  test("restores JSON from a remembered payload in single quotes", async () => {
    const json = payload(20)
    const toon = await after("bash", json)
    expect(toon).not.toBe(json)
    const restored = await before(`printf '%s' '${toon}'`)
    expect(restored).toContain(json.slice(0, 40))
    expect(restored).not.toContain(toon)
  })

  test("restores a TOON heredoc body", async () => {
    const json = payload(20)
    const toon = await after("bash", json)
    const restored = await before(["cat <<'EOF'", toon, "EOF"].join("\n"))
    expect(restored).toContain('"title"')
    expect(JSON.parse(restored.split("\n").slice(1, -1).join("\n"))).toEqual(JSON.parse(json))
  })

  test("leaves ordinary commands untouched", async () => {
    const command = "git status --short"
    expect(await before(command)).toBe(command)
  })
})

describe("ax integration", () => {
  test("compacts an ax JSON envelope from a bash call", async () => {
    const envelope = JSON.stringify({
      status: 200,
      ok: true,
      url: "https://api.example/v1/items",
      redirected: false,
      ms: 142,
      headers: { "content-type": "application/json" },
      body: Array.from({ length: 40 }, (_, index) => ({ id: index, name: `row-${index}`, state: index % 2 ? "open" : "closed" })),
    })
    const output = await after("bash", envelope)
    expect(output).toContain("[40]")
    expect(output.length).toBeLessThan(envelope.length)
  })

  test("compacts an ax --body JSON payload", async () => {
    const body = JSON.stringify(
      Array.from({ length: 30 }, (_, index) => ({ id: index, label: `entry-${index}`, value: index * 3 })),
    )
    const output = await after("bash", body)
    expect(output).toContain("[30]")
    expect(output.length).toBeLessThan(body.length)
  })
})
