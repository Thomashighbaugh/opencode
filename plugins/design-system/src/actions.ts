/**
 * Design-system action implementations.
 *
 * Each subcommand maps to an action type:
 *   impeccable  → run skills/impeccable/scripts/impeccable <cmd> [target]
 *   taste       → run node skills/taste-skill/scripts/gate.mjs [target]
 *   skill       → run skill script via bash
 *   agent       → return dispatch instructions for the agent
 *   inline      → run inline bash/node command
 *
 * All actions use child_process (execFileSync) like runSkillScript tool.
 * The plugin's design_system tool calls these and returns { content }.
 */

import { execFileSync } from "child_process"
import * as fs from "fs"
import * as path from "path"
import { homedir } from "os"
import { actionFor, buildMenuItems, MenuItem } from "./menu"

const USER_CONFIG_DIR = process.env.OPENCODE_CONFIG_DIR || path.join(homedir(), ".config", "opencode")

// Resolve the project root from the plugin context (directory injected at registration)
let PROJECT_ROOT = process.cwd()

export function setProjectRoot(dir: string) {
  PROJECT_ROOT = dir
}

/** Resolve a skill script path, preferring project-level over user-level. */
function findSkillScript(skillName: string, scriptName?: string): { path: string; name: string } | null {
  const searchPaths = [
    path.join(PROJECT_ROOT, ".opencode", "skills", skillName, "scripts"),
    path.join(USER_CONFIG_DIR, "skills", skillName, "scripts"),
  ]

  for (const basePath of searchPaths) {
    if (!fs.existsSync(basePath)) continue
    const files = fs.readdirSync(basePath).filter((f) => f.endsWith(".sh") || f.endsWith(".ts"))
    for (const file of files) {
      const base = file.replace(/\.(sh|ts)$/, "")
      if (!scriptName || base === scriptName || file === scriptName) {
        return { path: path.join(basePath, file), name: base }
      }
    }
  }
  return null
}

/** Run a bash command synchronously, returning stdout. */
function bash(cmd: string, args: string[] = []): { ok: boolean; output: string; error?: string } {
  try {
    const output = execFileSync("bash", ["-c", `${cmd} ${args.join(" ")}`], {
      encoding: "utf-8",
      timeout: 120000,
      cwd: PROJECT_ROOT,
    })
    return { ok: true, output: output.trim() }
  } catch (e: any) {
    return {
      ok: false,
      output: "",
      error: e.message,
      ...(e.stderr ? { stderr: e.stderr.toString().slice(-2000) } : {}),
    }
  }
}

/** Run the impeccable launcher for a given subcommand. */
function runImpeccable(cmd: string, target?: string): { ok: boolean; output: string; error?: string } {
  const launcher = path.join(USER_CONFIG_DIR, "skills", "impeccable", "scripts", "impeccable")
  if (!fs.existsSync(launcher)) {
    // Try project-level
    const projLauncher = path.join(PROJECT_ROOT, ".opencode", "skills", "impeccable", "scripts", "impeccable")
    if (fs.existsSync(projLauncher)) {
      return bash(projLauncher, [cmd, target || ""])
    }
    return { ok: false, output: "", error: "impeccable launcher not found at skills/impeccable/scripts/impeccable" }
  }
  return bash(launcher, [cmd, target || ""])
}

/** Run the taste-skill gate. */
function runTasteGate(target?: string): { ok: boolean; output: string; error?: string } {
  const gate = path.join(USER_CONFIG_DIR, "skills", "taste-skill", "scripts", "gate.mjs")
  if (!fs.existsSync(gate)) {
    const projGate = path.join(PROJECT_ROOT, ".opencode", "skills", "taste-skill", "scripts", "gate.mjs")
    if (fs.existsSync(projGate)) {
      return bash("node", [projGate, target || ""])
    }
    return { ok: false, output: "", error: "taste-skill gate.mjs not found" }
  }
  return bash("node", [gate, target || ""])
}

/** Run a skill script. */
function runSkill(skillName: string, scriptName?: string, args: string[] = []): { ok: boolean; output: string; error?: string } {
  const found = findSkillScript(skillName, scriptName)
  if (!found) {
    return { ok: false, output: "", error: `Skill script not found: ${skillName}/${scriptName || ""}` }
  }
  const runner = found.path.endsWith(".ts") ? "bun" : "bash"
  return bash(runner, [found.path, ...args])
}

/** Create DESIGN.md inline. */
function createDesignMd(target?: string): { ok: boolean; output: string; error?: string } {
  const dest = target || path.join(PROJECT_ROOT, "DESIGN.md")
  const content = `# DESIGN.md

## Page Type & Site Kind
- Page type: software
- Site kind: software
- Category: (fill in — what is sold)
- Primary action: (fill in — main user action)

## Visual Direction
- Tone: (quiet / bold / playful / technical)
- Color strategy: (describe)
- Typography approach: (describe)
- Photography stance: (real photographs over illustration)

## Brand
- Name: (fill in)
- Real icon reference: (if any)
- Edge treatment: equal left/right content edges
- Hover micro-interactions: lift 2px cards, photo zoom 1.02–1.03, button step on hover

## Constraints
- No shader scenes on non-tech pages
- Real photographs over illustration
- Equal left/right content edges
- Hero enters on load (data-enter)
- One dealt moment per page (two on long pages)

*Generated by /design-system design-md — edit to reflect your project's actual design intent.*
`
  try {
    fs.writeFileSync(dest, content, "utf-8")
    return { ok: true, output: `Wrote DESIGN.md to ${dest}` }
  } catch (e: any) {
    return { ok: false, output: "", error: e.message }
  }
}

/** Dispatch instructions for agent-based subcommands. */
function agentDispatch(agentName: string, subcommand: string): { ok: boolean; output: string; error?: string } {
  const instructions: Record<string, string> = {
    "@designer": `You are the Designer agent. Your mission is to create visually stunning, production-grade UI implementations. Detect the frontend framework from project files before implementing. Use distinctive fonts (not Arial, Inter, Roboto, system fonts, Space Grotesk). Color palette uses CSS variables with dominant colors and sharp accents. Animations focus on high-impact moments.`,
    "@frontend-design": `You are the Frontend Designer agent. Handle production-grade frontend work: UI/UX implementation, component patterns, visual polish, responsive design, accessible markup.`,
  }
  return {
    ok: true,
    output: `Dispatch to ${agentName}:\n\n${instructions[agentName]}\n\nSubcommand: ${subcommand}\nTarget: (user-specified)\n\nProceed with the work as the ${agentName} agent.`,
  }
}

/** Execute a design-system subcommand. */
export function executeSubcommand(
  subcommand: string,
  target?: string,
): { ok: boolean; output: string; error?: string } {
  const action = actionFor(subcommand)

  switch (action.type) {
    case "impeccable":
      if (!action.target) {
        return { ok: false, output: "", error: `No impeccable command for ${subcommand}` }
      }
      return runImpeccable(action.target, target)

    case "taste":
      return runTasteGate(target)

    case "skill":
      if (!action.skill) {
        return { ok: false, output: "", error: `No skill for ${subcommand}` }
      }
      // For redesign, the skill takes a target directory
      return runSkill(action.skill, undefined, target ? [target] : [])

    case "agent":
      if (!action.agent) {
        return { ok: false, output: "", error: `No agent for ${subcommand}` }
      }
      return agentDispatch(action.agent, subcommand)

    case "inline":
      if (action.command === "design-md") {
        return createDesignMd(target)
      }
      return { ok: false, output: "", error: `Unknown inline command: ${action.command}` }

    default:
      return { ok: false, output: "", error: `Unknown action type for ${subcommand}` }
  }
}

/** List all menu items. */
export function listMenuItems(): MenuItem[] {
  return buildMenuItems()
}
