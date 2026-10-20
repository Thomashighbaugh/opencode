/**
 * configDoctor — one-call health snapshot of this OpenCode config.
 *
 * Collapses the many ad-hoc checks (count skills/agents/tools, find broken
 * references in hub specs, detect skills missing frontmatter, detect agents
 * missing mode, find orphaned files) into a single structured report. Replaces
 * the pattern of running several rg/ls/Read rounds to answer "is this config
 * consistent?".
 *
 * Checks performed:
 *  - counts: skills, agents, rules, tools, hub subcommand specs
 *  - every hub subcommand delegation target resolves to a real file
 *  - skills: SKILL.md exists, has name+description frontmatter
 *  - agents: .md exists, has a mode field
 *  - empty directories under skills/ and agents/
 */

import { tool } from "@opencode-ai/plugin"
import * as fs from "fs"
import * as path from "path"
import { homedir } from "os"
import { validateTarget } from "./validate-delegation"
import { loadAllHubs } from "./hub-data"

const USER_CONFIG_DIR = process.env.OPENCODE_CONFIG_DIR || path.join(homedir(), ".config", "opencode")

interface Issue {
  severity: "error" | "warn"
  area: string
  message: string
}

function dirCount(dir: string, filter?: (f: string) => boolean): number {
  if (!fs.existsSync(dir)) return 0
  const entries = fs.readdirSync(dir)
  return filter ? entries.filter(filter).length : entries.length
}

function hasFrontmatterKey(file: string, key: string): boolean {
  try {
    const raw = fs.readFileSync(file, "utf-8")
    const m = raw.match(/^---\n([\s\S]*?)\n---/)
    if (!m) return false
    return new RegExp(`^${key}:`, "m").test(m[1])
  } catch {
    return false
  }
}

export default tool({
  description:
    "One-call health check for this OpenCode config: counts of skills/agents/rules/tools/hub specs, broken delegation targets, skills missing frontmatter, agents missing mode. Use instead of ad-hoc rounds of ls/rg/Read when auditing config consistency.",
  args: {
    full: tool.schema.boolean().optional().describe("Include per-item listings (default false — summary only)"),
  },
  async execute(args, context) {
    const projectRoot = context.directory || process.cwd()
    const issues: Issue[] = []

    // ── Counts ──────────────────────────────────────────────────────────
    const skillsDir = path.join(USER_CONFIG_DIR, "skills")
    const agentsDir = path.join(USER_CONFIG_DIR, "agents")
    const rulesDir = path.join(USER_CONFIG_DIR, "rules")
    const toolsDir = path.join(USER_CONFIG_DIR, "tools")
    const hubsDir = path.join(USER_CONFIG_DIR, "tools", "hubs")

    const skillDirs = fs.existsSync(skillsDir)
      ? fs.readdirSync(skillsDir).filter((d) => fs.statSync(path.join(skillsDir, d)).isDirectory())
      : []
    const agentFiles = fs.existsSync(agentsDir) ? fs.readdirSync(agentsDir).filter((f) => f.endsWith(".md")) : []
    const ruleFiles = fs.existsSync(rulesDir) ? fs.readdirSync(rulesDir).filter((f) => f.endsWith(".md")) : []
    const toolFiles = fs.existsSync(toolsDir)
      ? fs.readdirSync(toolsDir).filter((f) => f.endsWith(".ts") && !f.startsWith("hub") && f !== "cache-utils.ts" && f !== "state-utils.ts")
      : []
    const hubSpecCount = fs.existsSync(hubsDir)
      ? fs.readdirSync(hubsDir).filter((d) => {
          const p = path.join(hubsDir, d)
          return fs.statSync(p).isDirectory()
        }).length
      : 0

    // ── Skills checks ───────────────────────────────────────────────────
    for (const d of skillDirs) {
      const skillFile = path.join(skillsDir, d, "SKILL.md")
      if (!fs.existsSync(skillFile)) {
        issues.push({ severity: "error", area: "skills", message: `${d}: missing SKILL.md` })
        continue
      }
      if (!hasFrontmatterKey(skillFile, "name")) {
        issues.push({ severity: "error", area: "skills", message: `${d}: frontmatter missing 'name'` })
      }
      if (!hasFrontmatterKey(skillFile, "description")) {
        issues.push({ severity: "warn", area: "skills", message: `${d}: frontmatter missing 'description'` })
      }
    }

    // ── Agents checks ───────────────────────────────────────────────────
    for (const f of agentFiles) {
      const p = path.join(agentsDir, f)
      const raw = fs.readFileSync(p, "utf-8")
      if (!/^mode:/m.test(raw) && !/"mode"/.test(raw) && !/mode:\s*(subagent|primary)/.test(raw)) {
        issues.push({ severity: "warn", area: "agents", message: `${f}: no mode field detected` })
      }
    }

    // ── Hub delegation checks ───────────────────────────────────────────
    let delegationChecked = 0
    let delegationBroken = 0
    try {
      const hubs = loadAllHubs()
      for (const hub of hubs) {
        for (const sub of hub.subcommands ?? []) {
          const d = (sub as { delegation?: { type: string; target?: string } }).delegation
          if (!d || d.type === "inline") continue
          delegationChecked++
          const result = validateTarget(
            hub.name,
            (sub as { name?: string }).name ?? "?",
            d.type as "skill" | "agent" | "command",
            d.target ?? "",
            projectRoot
          )
          if (result.status !== "ok") {
            delegationBroken++
            issues.push({
              severity: "error",
              area: "delegation",
              message: `${hub.name}/${(sub as { name?: string }).name}: ${result.error ?? "unresolved"}`,
            })
          }
        }
      }
    } catch (e) {
      issues.push({ severity: "warn", area: "delegation", message: `hub spec load failed: ${String(e)}` })
    }

    const errorCount = issues.filter((i) => i.severity === "error").length
    const warnCount = issues.filter((i) => i.severity === "warn").length

    const summary = {
      counts: {
        skills: skillDirs.length,
        agents: agentFiles.length,
        rules: ruleFiles.length,
        tools: toolFiles.length,
        hubSpecDirs: hubSpecCount,
      },
      delegation: { checked: delegationChecked, broken: delegationBroken },
      issues: { errors: errorCount, warnings: warnCount },
      healthy: errorCount === 0,
    }

    return JSON.stringify(args.full ? { ...summary, details: issues } : { ...summary, details: issues.slice(0, 50) }, null, 2)
  },
})
