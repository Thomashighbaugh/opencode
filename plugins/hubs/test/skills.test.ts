import { describe, expect, test } from "bun:test"

import {
  estimateTokens,
  extractLoadedSkills,
  formatTokenCount,
  loadVendoredSkills,
  skillHubMap,
  totalTokens,
  visibleSkills,
} from "../src/skills"

describe("vendored skills", () => {
  test("loads the full cited corpus", () => {
    const skills = loadVendoredSkills()
    expect(skills.length).toBeGreaterThanOrEqual(45)
    for (const skill of skills) {
      expect(skill.content.length).toBeGreaterThan(0)
      expect(skill.listTokens).toBeGreaterThan(0)
      expect(skill.loadTokens).toBeGreaterThan(0)
    }
  })

  test("maps skills back to the hubs that cite them", () => {
    const map = skillHubMap()
    expect(map.size).toBeGreaterThan(30)
    expect(map.get("conventional-commit")).toContain("git-hub")
  })

  test("every cited skill id resolves to a vendored directory", () => {
    const ids = new Set(loadVendoredSkills().map((skill) => skill.id))
    for (const [skill, hubs] of skillHubMap()) {
      expect(ids.has(skill), `${skill} cited by ${hubs.join(",")}`).toBe(true)
    }
  })
})

describe("views", () => {
  test("loaded skills sort first and are filtered by scope", () => {
    const all = loadVendoredSkills()
    const loaded = new Set([all[all.length - 1]!.id])
    const hubs = visibleSkills("hubs", loaded)
    expect(hubs.length).toBeGreaterThan(0)
    expect(hubs[0]!.id).toBe(all[all.length - 1]!.id)

    const onlyLoaded = visibleSkills("loaded", loaded)
    expect(onlyLoaded).toHaveLength(1)
  })

  test("token helpers are stable", () => {
    expect(estimateTokens("abcd")).toBe(1)
    expect(formatTokenCount(1200)).toBe("1.2k")
    expect(totalTokens(loadVendoredSkills())).toBeGreaterThan(0)
  })
})

describe("load-state extraction", () => {
  test("reads skill tool calls out of message shapes", () => {
    const messages = [
      { role: "assistant", parts: [{ type: "tool", tool: "skill", input: { id: "tdd" } }] },
      { role: "assistant", parts: [{ type: "tool", name: "skill", state: { name: "autopilot" } }] },
      { role: "assistant", parts: [{ type: "text", text: "hello" }] },
    ]
    const loaded = extractLoadedSkills(messages)
    expect(loaded.has("tdd")).toBe(true)
    expect(loaded.has("autopilot")).toBe(true)
  })

  test("degrades to an empty set on unexpected shapes", () => {
    expect(extractLoadedSkills([null, 1, "x", { deep: { deeper: [{}] } }]).size).toBe(0)
  })
})
