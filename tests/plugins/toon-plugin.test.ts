import { describe, expect, test } from "vitest"

import ToonPlugin from "../../plugins/toon/index"

type Hook = (input: { tool: string; sessionID?: string; callID?: string }, output: Record<string, unknown>) => Promise<void>

async function hooks() {
  const plugin = await ToonPlugin({} as never)
  return plugin as unknown as Record<string, Hook>
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

async function after(tool: string, output: string) {
  const hook = (await hooks())["tool.execute.after"]!
  const box = { title: "", output, metadata: {} }
  await hook({ tool, sessionID: "s", callID: "c" }, box)
  return box.output as string
}

async function before(command: string) {
  const hook = (await hooks())["tool.execute.before"]!
  const box = { args: { command } }
  await hook({ tool: "bash", sessionID: "s", callID: "c" }, box)
  return (box.args as { command: string }).command
}

describe("tool.execute.after", () => {
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

  test("ignores invalid JSON that looks like JSON", async () => {
    const text = `{${"x".repeat(300)}}`
    expect(await after("bash", text)).toBe(text)
  })

  test("never emits TOON that is longer than the JSON", async () => {
    const json = JSON.stringify(Array.from({ length: 60 }, (_, index) => ({ ["k" + index]: index })))
    const output = await after("bash", json)
    expect(output === json || output.length < json.length).toBe(true)
  })
})

describe("tool.execute.before", () => {
  test("restores JSON from a remembered TOON payload in single quotes", async () => {
    const json = payload(20)
    const toon = await after("bash", json)
    expect(toon).not.toBe(json)

    const command = `printf '%s' '${toon}'`
    const restored = await before(command)
    expect(restored).toContain(json.slice(0, 40))
    expect(restored).not.toContain(toon)
  })

  test("restores a TOON heredoc body", async () => {
    const json = payload(20)
    const toon = await after("bash", json)
    const command = ["cat <<'EOF'", toon, "EOF"].join("\n")
    const restored = await before(command)
    expect(restored).toContain('"title"')
    expect(JSON.parse(restored.split("\n").slice(1, -1).join("\n"))).toEqual(JSON.parse(json))
  })

  test("leaves ordinary commands untouched", async () => {
    const command = "git status --short"
    expect(await before(command)).toBe(command)
  })

  test("leaves non-bash tool arguments untouched", async () => {
    const hook = (await hooks())["tool.execute.before"]!
    const box = { args: { command: "echo hi" } }
    await hook({ tool: "write", sessionID: "s", callID: "c" }, box)
    expect((box.args as { command: string }).command).toBe("echo hi")
  })
})
