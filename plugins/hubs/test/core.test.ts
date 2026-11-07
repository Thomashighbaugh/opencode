import { describe, expect, test } from "bun:test"

import { hubNames, hubSummaries, render, renderIndex, resume, route, status } from "../src/core"

describe("registry", () => {
  test("exposes all 13 hubs", () => {
    expect(hubNames()).toHaveLength(13)
    expect(hubNames()).toContain("git-hub")
    expect(hubNames()).toContain("hub-setup")
  })

  test("summaries carry subcommand lists", () => {
    const summaries = hubSummaries()
    expect(summaries).toHaveLength(13)
    const git = summaries.find((entry) => entry.name === "git-hub")
    expect(git?.subcommands).toContain("commit")
  })
})

describe("route", () => {
  test("returns the full spec payload", () => {
    const result = route("git-hub", "commit")
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.payload.hub).toBe("git-hub")
    expect(result.payload.subcommand).toBe("commit")
    expect(result.payload.reminder).toBeTruthy()
    expect(result.payload.detailedDescription).toBeTruthy()
    expect(result.payload.delegation).toBeTruthy()
    expect(result.payload.canResume).toBe(false)
  })

  test("inlines rules and skill metadata", () => {
    const result = route("verify-hub", "audit")
    expect(result.ok).toBe(true)
    if (!result.ok) return
    const rules = result.payload.rulesContent as Array<{ name: string; content: string }> | null
    expect(rules?.some((rule) => rule.name === "security")).toBe(true)
  })

  test("resolves legacy hub/subcommand pairs", () => {
    const result = route("skills-hub", "add")
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.payload.hub).toBe("resource-hub")
  })

  test("reports unknown hubs and subcommands without throwing", () => {
    const unknownHub = route("nope-hub", "x")
    expect(unknownHub.ok).toBe(false)
    const unknownSub = route("git-hub", "nope")
    expect(unknownSub.ok).toBe(false)
    if (!unknownSub.ok) expect(unknownSub.available).toContain("commit")
  })

  test("render is parseable JSON", () => {
    const text = render(route("git-hub", "commit"))
    expect(typeof JSON.parse(text)).toBe("object")
    expect(JSON.parse(renderIndex()).hubs).toHaveLength(13)
  })
})

describe("state", () => {
  test("status lists subcommands with delegation", () => {
    const result = status("git-hub")
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(Array.isArray(result.payload.subcommands)).toBe(true)
  })

  test("resume on a stateless hub reports statelessness", () => {
    const hub = hubSummaries().find((entry) => entry.name === "git-hub")
    expect(hub?.hasState).toBe(false)
    const result = resume("git-hub")
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.error).toContain("stateless")
  })
})
