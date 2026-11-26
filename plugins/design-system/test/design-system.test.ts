/**
 * Comprehensive tests for the design-system plugin.
 *
 * Covers: config defaults + env overrides, menu items (all subcommands,
 * categories, ordering, no impeccable- prefix), action dispatch mapping
 * (impeccable/taste/skill/agent/inline), isImpeccableCmd, expandSubcommand
 * full definitions, executeSubcommand (inline design-md creation, agent
 * dispatch, error paths), formatMenu grouping.
 */

import { describe, test, expect } from "bun:test"
import * as fs from "fs"
import * as path from "path"
import { config } from "../src/config.ts"
import {
  buildMenuItems,
  formatMenu,
  expandSubcommand,
  actionFor,
  isImpeccableCmd,
} from "../src/menu.ts"
import { executeSubcommand, setProjectRoot, listMenuItems } from "../src/actions.ts"

// ── Config ──────────────────────────────────────────────────────────────

describe("config defaults", () => {
  test("all feature flags default true", () => {
    const cfg = config()
    expect(cfg.tasteGate).toBe(true)
    expect(cfg.impeccable).toBe(true)
    expect(cfg.agentDelegation).toBe(true)
    expect(cfg.skillDelegation).toBe(true)
  })

  test("flags overridable via env", () => {
    const origTaste = process.env.DESIGN_TASTE_GATE
    const origImp = process.env.DESIGN_IMPECCABLE
    process.env.DESIGN_TASTE_GATE = "false"
    process.env.DESIGN_IMPECCABLE = "false"
    expect(config().tasteGate).toBe(false)
    expect(config().impeccable).toBe(false)
    if (origTaste === undefined) delete process.env.DESIGN_TASTE_GATE
    else process.env.DESIGN_TASTE_GATE = origTaste
    if (origImp === undefined) delete process.env.DESIGN_IMPECCABLE
    else process.env.DESIGN_IMPECCABLE = origImp
  })

  test("any non-'false' value is treated as true", () => {
    const orig = process.env.DESIGN_TASTE_GATE
    process.env.DESIGN_TASTE_GATE = "0"
    expect(config().tasteGate).toBe(true)
    process.env.DESIGN_TASTE_GATE = "yes"
    expect(config().tasteGate).toBe(true)
    if (orig === undefined) delete process.env.DESIGN_TASTE_GATE
    else process.env.DESIGN_TASTE_GATE = orig
  })
})

// ── Menu items ──────────────────────────────────────────────────────────

describe("menu items", () => {
  test("returns exactly 30 subcommands", () => {
    const items = buildMenuItems()
    expect(items.length).toBe(30)
  })

  test("every item has id, label, detail, category", () => {
    for (const it of buildMenuItems()) {
      expect(typeof it.id).toBe("string")
      expect(typeof it.label).toBe("string")
      expect(typeof it.detail).toBe("string")
      expect(typeof it.category).toBe("string")
      expect(it.id.length).toBeGreaterThan(0)
    }
  })

  test("no subcommand id starts with 'impeccable-'", () => {
    for (const it of buildMenuItems()) {
      expect(it.id).not.toMatch(/^impeccable-/)
    }
  })

  test("all expected impeccable subcommand IDs present (no prefix)", () => {
    const ids = new Set(buildMenuItems().map((it) => it.id))
    const expected = [
      "shape", "init", "document", "extract",
      "critique", "audit",
      "polish", "bolder", "quieter", "distill", "harden", "onboard",
      "animate", "colorize", "typeset", "layout", "delight", "overdrive",
      "clarify", "adapt", "optimize",
      "live", "generate",
      "craft",
    ]
    for (const id of expected) expect(ids.has(id)).toBe(true)
  })

  test("taste subcommands present", () => {
    const ids = new Set(buildMenuItems().map((it) => it.id))
    expect(ids.has("taste")).toBe(true)
    expect(ids.has("design-md")).toBe(true)
  })

  test("delegation subcommands present", () => {
    const ids = new Set(buildMenuItems().map((it) => it.id))
    expect(ids.has("redesign")).toBe(true)
    expect(ids.has("icon")).toBe(true)
    expect(ids.has("designer")).toBe(true)
    expect(ids.has("frontend-design")).toBe(true)
  })

  test("no docs commands (docs/readme/writer/agents-md live in knowledge-hub)", () => {
    const ids = new Set(buildMenuItems().map((it) => it.id))
    expect(ids.has("docs")).toBe(false)
    expect(ids.has("readme")).toBe(false)
    expect(ids.has("writer")).toBe(false)
    expect(ids.has("agents-md")).toBe(false)
  })

  test("categories cover all expected groups", () => {
    const cats = new Set(buildMenuItems().map((it) => it.category))
    expect(cats).toEqual(
      new Set(["Steer", "Evaluate", "Refine", "Enhance", "Fix", "Iterate", "Build", "Taste", "Delegation"]),
    )
  })

  test("ordering: Steer first, Delegation last", () => {
    const items = buildMenuItems()
    const firstCat = items[0]?.category
    const lastCat = items[items.length - 1]?.category
    expect(firstCat).toBe("Steer")
    expect(lastCat).toBe("Delegation")
  })

  test("each impeccable command detail mentions 'impeccable'", () => {
    const impeccableIds = [
      "shape", "init", "document", "extract", "critique", "audit", "polish",
      "bolder", "quieter", "distill", "harden", "onboard", "animate",
      "colorize", "typeset", "layout", "delight", "overdrive", "clarify",
      "adapt", "optimize", "live", "generate", "craft",
    ]
    for (const it of buildMenuItems()) {
      if (impeccableIds.includes(it.id)) {
        expect(it.detail).toContain("impeccable")
      }
    }
  })

  test("listMenuItems equals buildMenuItems", () => {
    expect(listMenuItems()).toEqual(buildMenuItems())
  })
})

// ── formatMenu ──────────────────────────────────────────────────────────

describe("formatMenu", () => {
  test("groups items under category headers", () => {
    const out = formatMenu(buildMenuItems())
    for (const cat of ["Steer", "Evaluate", "Refine", "Enhance", "Fix", "Iterate", "Build", "Taste", "Delegation"]) {
      expect(out).toContain(`\n## ${cat}`)
    }
  })

  test("lists every item as a bullet", () => {
    const out = formatMenu(buildMenuItems())
    for (const it of buildMenuItems()) {
      expect(out).toContain(`• ${it.label} -`)
    }
  })
})

// ── isImpeccableCmd ─────────────────────────────────────────────────────

describe("isImpeccableCmd", () => {
  test("returns true for every impeccable command", () => {
    const impeccable = [
      "shape", "init", "document", "extract", "critique", "audit", "polish",
      "bolder", "quieter", "distill", "harden", "onboard", "animate",
      "colorize", "typeset", "layout", "delight", "overdrive", "clarify",
      "adapt", "optimize", "live", "generate", "craft",
    ]
    for (const id of impeccable) expect(isImpeccableCmd(id)).toBe(true)
  })

  test("returns false for non-impeccable commands", () => {
    expect(isImpeccableCmd("taste")).toBe(false)
    expect(isImpeccableCmd("design-md")).toBe(false)
    expect(isImpeccableCmd("redesign")).toBe(false)
    expect(isImpeccableCmd("designer")).toBe(false)
    expect(isImpeccableCmd("nonexistent")).toBe(false)
  })
})

// ── actionFor dispatch ──────────────────────────────────────────────────

describe("actionFor", () => {
  test("taste maps to taste gate command", () => {
    expect(actionFor("taste")).toEqual({ type: "taste", command: "gate" })
  })

  test("design-md maps to inline design-md command", () => {
    expect(actionFor("design-md")).toEqual({ type: "inline", command: "design-md" })
  })

  test("every impeccable command maps to type impeccable with target=id", () => {
    const impeccable = [
      "shape", "init", "document", "extract", "critique", "audit", "polish",
      "bolder", "quieter", "distill", "harden", "onboard", "animate",
      "colorize", "typeset", "layout", "delight", "overdrive", "clarify",
      "adapt", "optimize", "live", "generate", "craft",
    ]
    for (const id of impeccable) {
      expect(actionFor(id)).toEqual({ type: "impeccable", target: id })
    }
  })

  test("redesign maps to skill redesign-existing-projects", () => {
    expect(actionFor("redesign")).toEqual({
      type: "skill",
      skill: "redesign-existing-projects",
    })
  })

  test("icon maps to skill icon-generator", () => {
    expect(actionFor("icon")).toEqual({ type: "skill", skill: "icon-generator" })
  })

  test("designer maps to agent @designer", () => {
    expect(actionFor("designer")).toEqual({ type: "agent", agent: "@designer" })
  })

  test("frontend-design maps to agent @frontend-design", () => {
    expect(actionFor("frontend-design")).toEqual({ type: "agent", agent: "@frontend-design" })
  })

  test("unknown id maps to inline with command=id", () => {
    expect(actionFor("unknown-cmd")).toEqual({ type: "inline", command: "unknown-cmd" })
  })
})

// ── expandSubcommand ────────────────────────────────────────────────────

describe("expandSubcommand", () => {
  test("returns null for unknown subcommand", () => {
    expect(expandSubcommand("nope")).toBeNull()
    expect(expandSubcommand("")).toBeNull()
  })

  test("returns full definition for every subcommand", () => {
    for (const it of buildMenuItems()) {
      const def = expandSubcommand(it.id)
      expect(def).not.toBeNull()
      expect(def!).toContain(`${it.label} - ${it.id}`)
      expect(def!).toContain(`Category: ${it.category}`)
      expect(def!).toContain(`Description: ${it.detail}`)
      expect(def!).toContain("## Action")
      expect(def!).toContain(`Type:`)
    }
  })

  test("impeccable definition includes Target", () => {
    const def = expandSubcommand("shape")
    expect(def).toContain("Target: shape")
  })

  test("skill definition includes Skill", () => {
    const def = expandSubcommand("redesign")
    expect(def).toContain("Skill: redesign-existing-projects")
  })

  test("agent definition includes Agent", () => {
    const def = expandSubcommand("designer")
    expect(def).toContain("Agent: @designer")
  })

  test("taste definition includes Command: gate", () => {
    const def = expandSubcommand("taste")
    expect(def).toContain("Command: gate")
  })

  test("design-md definition includes Command: design-md", () => {
    const def = expandSubcommand("design-md")
    expect(def).toContain("Command: design-md")
  })
})

// ── executeSubcommand ───────────────────────────────────────────────────

describe("executeSubcommand", () => {
  const tmpDir = fs.mkdtempSync(path.join("/tmp", "design-system-test-"))

  test("design-md inline creates DESIGN.md at project root", () => {
    setProjectRoot(tmpDir)
    const result = executeSubcommand("design-md")
    expect(result.ok).toBe(true)
    expect(fs.existsSync(path.join(tmpDir, "DESIGN.md"))).toBe(true)
    const content = fs.readFileSync(path.join(tmpDir, "DESIGN.md"), "utf-8")
    expect(content).toContain("# DESIGN.md")
    expect(content).toContain("Page Type & Site Kind")
    expect(content).toContain("Generated by /design-system design-md")
    // cleanup
    fs.rmSync(path.join(tmpDir, "DESIGN.md"))
  })

  test("design-md inline creates DESIGN.md at target path", () => {
    setProjectRoot(tmpDir)
    const target = path.join(tmpDir, "custom", "DESIGN.md")
    fs.mkdirSync(path.dirname(target), { recursive: true })
    const result = executeSubcommand("design-md", target)
    expect(result.ok).toBe(true)
    expect(fs.existsSync(target)).toBe(true)
    fs.rmSync(target, { recursive: true })
  })

  test("agent dispatch for designer returns instructions", () => {
    const result = executeSubcommand("designer")
    expect(result.ok).toBe(true)
    expect(result.output).toContain("Dispatch to @designer")
    expect(result.output).toContain("Designer agent")
    expect(result.output).toContain("Subcommand: designer")
  })

  test("agent dispatch for frontend-design returns instructions", () => {
    const result = executeSubcommand("frontend-design")
    expect(result.ok).toBe(true)
    expect(result.output).toContain("Dispatch to @frontend-design")
    expect(result.output).toContain("Subcommand: frontend-design")
  })

  test("unknown inline command returns error", () => {
    const result = executeSubcommand("not-a-real-command")
    expect(result.ok).toBe(false)
    expect(result.error).toContain("Unknown inline command")
  })

  test("impeccable command dispatches to the skill", () => {
    const result = executeSubcommand("shape")
    expect(result.ok).toBe(true)
    expect(result.output).toContain("impeccable")
    expect(result.output).toContain("shape")
  })

  test("taste attempts to run (gate found) or reports not-found", () => {
    const result = executeSubcommand("taste")
    expect(typeof result.ok).toBe("boolean")
    expect(typeof result.output).toBe("string")
    if (!result.ok) {
      expect(typeof result.error).toBe("string")
      expect(result.error!.length).toBeGreaterThan(0)
    }
  })

  test("skill with a bundled script runs it", () => {
    const result = executeSubcommand("redesign")
    expect(result.ok).toBe(true)
    expect(result.output).toContain("Redesign audit")
  })
})

// ── setProjectRoot ──────────────────────────────────────────────────────

describe("setProjectRoot", () => {
  test("changes the project root used by design-md default target", () => {
    const dir1 = fs.mkdtempSync(path.join("/tmp", "ds-root1-"))
    const dir2 = fs.mkdtempSync(path.join("/tmp", "ds-root2-"))
    try {
      setProjectRoot(dir1)
      executeSubcommand("design-md")
      expect(fs.existsSync(path.join(dir1, "DESIGN.md"))).toBe(true)
      fs.rmSync(path.join(dir1, "DESIGN.md"))

      setProjectRoot(dir2)
      executeSubcommand("design-md")
      expect(fs.existsSync(path.join(dir2, "DESIGN.md"))).toBe(true)
      expect(fs.existsSync(path.join(dir1, "DESIGN.md"))).toBe(false)
      fs.rmSync(path.join(dir2, "DESIGN.md"))
    } finally {
      fs.rmSync(dir1, { recursive: true, force: true })
      fs.rmSync(dir2, { recursive: true, force: true })
    }
  })
})
