import { describe, expect, test } from "bun:test"
import fs from "node:fs"
import os from "node:os"
import path from "node:path"

import { agentsRoot, installAgents, loadVendoredAgents, normalizeAgent } from "../src/agents"

describe("vendored agents", () => {
  test("ships the agents the hub specs delegate to", () => {
    const agents = loadVendoredAgents()
    expect(agents.length).toBeGreaterThanOrEqual(30)
    for (const agent of agents) {
      expect(agent.content.length).toBeGreaterThan(0)
      expect(fs.existsSync(agent.path)).toBe(true)
    }
    expect(agents.map((agent) => agent.id)).toContain("executor")
    expect(agents.map((agent) => agent.id)).toContain("hubs")
    expect(agents.map((agent) => agent.id)).toContain("critic")
    expect(agentsRoot()).toContain("data/agents")
  })

  test("hubs is the only primary agent after normalization", () => {
    for (const agent of loadVendoredAgents()) {
      const normalized = normalizeAgent(agent.id, agent.content)
      const mode = /^mode:\s*(\w+)/m.exec(normalized.split("---")[1] ?? "")?.[1]
      expect(mode, agent.id).toBe(agent.id === "hubs" ? "primary" : "subagent")
    }
  })

  test("installs into a config dir idempotently", () => {
    const destination = fs.mkdtempSync(path.join(os.tmpdir(), "hubs-agents-"))
    const first = installAgents(destination)
    expect(first.written.length).toBe(loadVendoredAgents().length)
    expect(first.unchanged.length).toBe(0)

    const second = installAgents(destination)
    expect(second.written.length).toBe(0)
    expect(second.unchanged.length).toBe(first.written.length)

    for (const id of first.written) {
      expect(fs.existsSync(path.join(destination, `${id}.md`))).toBe(true)
    }
    fs.rmSync(destination, { recursive: true, force: true })
  })
})
