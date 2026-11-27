/**
 * Rio -> hubs parity.
 *
 * The rio menu is retired; every rio command must resolve to exactly one hub
 * subcommand, the renamed resume labels must be unambiguous, and no label may
 * appear in two menus.
 */

import { describe, expect, test } from "bun:test"

import { hub, hubNames, route } from "../src/core"

describe("rio command parity", () => {
  const legacy: Array<[string, string]> = [
    ["rio/status", "runtime-status"],
    ["rio/config", "runtime-flags"],
    ["rio/doctor", "runtime-doctor"],
    ["rio/audit", "token-use-audit"],
    ["rio/report", "token-use-report"],
    ["rio/coach", "token-use-coach"],
    ["rio/savings", "token-use-savings"],
    ["rio/route", "token-use-route"],
    ["rio/recall", "recall"],
    ["rio/memory-review", "context-audit"],
    ["rio/compact", "compact"],
    ["rio/expand", "expand"],
    ["rio/resume", "resume-memory"],
    ["rio/resume-lean", "resume-memory-lean"],
  ]

  for (const [old, label] of legacy) {
    test(`${old} resolves to ${label}`, () => {
      const [h, s] = old.split("/")
      const r = route(h!, s!)
      expect(r.ok).toBe(true)
      if (r.ok) expect(r.payload.subcommand).toBe(label as string)
    })
  }
})

describe("renamed resume labels", () => {
  test("resume labels are unambiguous across menus", () => {
    expect(hub("knowledge-hub")?.subcommands.some((s) => s.label === "resume-memory")).toBe(true)
    expect(hub("knowledge-hub")?.subcommands.some((s) => s.label === "resume-memory-lean")).toBe(true)
    expect(hub("think-hub")?.subcommands.some((s) => s.label === "resume-thinking")).toBe(true)
    expect(hub("orchestrate-hub")?.subcommands.some((s) => s.label === "resume-orchestration")).toBe(true)
    for (const name of hubNames()) {
      for (const sub of hub(name)!.subcommands) {
        expect(sub.label === "resume").toBe(false)
      }
    }
  })
})

describe("runtime and knowledge absorption", () => {
  test("runtime-hub carries the runtime and token-use commands", () => {
    const labels = hub("runtime-hub")!.subcommands.map((s) => s.label)
    for (const l of [
      "runtime-status", "runtime-flags", "runtime-doctor",
      "token-use-audit", "token-use-report", "token-use-coach", "token-use-savings", "token-use-route",
    ]) {
      expect(labels).toContain(l)
    }
  })

  test("knowledge-hub carries the memory and context commands", () => {
    const labels = hub("knowledge-hub")!.subcommands.map((s) => s.label)
    for (const l of ["memory", "recall", "context-audit", "compact", "expand", "resume-memory", "resume-memory-lean"]) {
      expect(labels).toContain(l)
    }
  })
})

describe("no duplicate labels across menus", () => {
  test("every subcommand label is unique", () => {
    const seen = new Map<string, string>()
    const dups: string[] = []
    for (const name of hubNames()) {
      for (const sub of hub(name)!.subcommands) {
        if (seen.has(sub.label)) dups.push(`${sub.label}: ${seen.get(sub.label)} vs ${name}`)
        else seen.set(sub.label, name)
      }
    }
    expect(dups).toEqual([])
  })
})
