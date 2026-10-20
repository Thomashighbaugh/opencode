/**
 * loadRules — batch-load rule files by name or glob.
 *
 * Agents and subagents repeatedly read rules/*.md one file at a time (N Read
 * calls for N rules). This tool collapses that to one call: pass rule names,
 * get back concatenated, frontmatter-stripped bodies keyed by rule name.
 *
 * Lookup order: project .opencode/rules/ then global rules/ — project wins on
 * name collision, same convention as skills.
 */

import { tool } from "@opencode-ai/plugin"
import * as fs from "fs"
import * as path from "path"
import { homedir } from "os"
import { withToolCache } from "./cache-utils"

const USER_CONFIG_DIR = process.env.OPENCODE_CONFIG_DIR || path.join(homedir(), ".config", "opencode")

interface RuleResult {
  name: string
  path: string
  source: "project" | "user"
  content: string
}

function ruleDirs(projectRoot: string) {
  return [
    { type: "project" as const, dir: path.join(projectRoot, ".opencode", "rules") },
    { type: "user" as const, dir: path.join(USER_CONFIG_DIR, "rules") },
  ]
}

function listRules(projectRoot: string): Map<string, { path: string; source: "project" | "user" }> {
  const found = new Map<string, { path: string; source: "project" | "user" }>()
  // User first so project overwrites on collision
  for (const { type, dir } of ruleDirs(projectRoot).reverse()) {
    if (!fs.existsSync(dir)) continue
    for (const f of fs.readdirSync(dir)) {
      if (!f.endsWith(".md")) continue
      found.set(f.replace(/\.md$/, ""), { path: path.join(dir, f), source: type })
    }
  }
  return found
}

function stripFrontmatter(raw: string): string {
  const m = raw.match(/^---\n[\s\S]*?\n---\n?/)
  return m ? raw.slice(m[0].length) : raw
}

export default tool({
  description:
    "Batch-load rule files by name. Pass an array of rule names (without .md); get back all bodies concatenated, frontmatter stripped, project rules overriding global on name collision. Use instead of N separate Read calls when a task or subcommand needs several rules.",
  args: {
    names: tool.schema
      .array(tool.schema.string())
      .describe("Rule names to load, e.g. ['efficiency-first', 'output-compression']. Use 'all' to list available rules without bodies."),
    includeFrontmatter: tool.schema
      .boolean()
      .optional()
      .describe("Keep YAML frontmatter in returned bodies (default false)"),
  },
  async execute(args, context) {
    const projectRoot = context.directory || process.cwd()
    const all = listRules(projectRoot)

    if (args.names.length === 1 && args.names[0] === "all") {
      const rows = [...all.entries()].map(([name, r]) => `${name}\t${r.source}\t${r.path}`)
      return JSON.stringify({ available: rows }, null, 2)
    }

    return withToolCache("loadRules", args, () => {
      const results: RuleResult[] = []
      const missing: string[] = []
      for (const name of args.names) {
        const hit = all.get(name)
        if (!hit) {
          missing.push(name)
          continue
        }
        try {
          const raw = fs.readFileSync(hit.path, "utf-8")
          results.push({
            name,
            path: hit.path,
            source: hit.source,
            content: args.includeFrontmatter ? raw : stripFrontmatter(raw).trim(),
          })
        } catch {
          missing.push(name)
        }
      }
      return JSON.stringify({ rules: results, missing }, null, 2)
    }, 86_400_000)
  },
})
