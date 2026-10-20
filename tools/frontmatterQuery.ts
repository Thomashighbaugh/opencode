/**
 * frontmatterQuery — query YAML frontmatter across agents/, skills/, rules/.
 *
 * Discovery questions like "which skills have tag X", "which agents are
 * subagents", "which rules mention caching" currently require reading many
 * files. This tool parses only the frontmatter block of each file and returns
 * compact rows, collapsing N Reads into one call.
 */

import { tool } from "@opencode-ai/plugin"
import * as fs from "fs"
import * as path from "path"
import { homedir } from "os"
import { withToolCache } from "./cache-utils"

const USER_CONFIG_DIR = process.env.OPENCODE_CONFIG_DIR || path.join(homedir(), ".config", "opencode")

interface FrontmatterRow {
  id: string
  path: string
  frontmatter: Record<string, unknown>
}

function parseFrontmatter(raw: string): Record<string, unknown> | null {
  const m = raw.match(/^---\n([\s\S]*?)\n---/)
  if (!m) return null
  const out: Record<string, unknown> = {}
  let currentKey = ""
  for (const line of m[1].split("\n")) {
    if (/^\s/.test(line) && currentKey) {
      // continuation (list item or folded scalar)
      const prev = out[currentKey]
      const cont = line.trim().replace(/^-\s*/, "")
      if (Array.isArray(prev)) (prev as string[]).push(cont)
      else if (typeof prev === "string") out[currentKey] = `${prev} ${cont}`
      continue
    }
    const kv = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/)
    if (!kv) continue
    currentKey = kv[1]
    let value: unknown = kv[2].trim()
    if (typeof value === "string" && value.startsWith("[") && value.endsWith("]")) {
      value = value
        .slice(1, -1)
        .split(",")
        .map((s) => s.trim().replace(/^["']|["']$/g, ""))
        .filter(Boolean)
    } else if (typeof value === "string") {
      value = value.replace(/^["']|["']$/g, "")
    }
    out[currentKey] = value
  }
  return out
}

function collect(dir: string, pattern: "dir-skill" | "md-file"): FrontmatterRow[] {
  const rows: FrontmatterRow[] = []
  if (!fs.existsSync(dir)) return rows
  if (pattern === "dir-skill") {
    for (const d of fs.readdirSync(dir)) {
      const p = path.join(dir, d, "SKILL.md")
      if (!fs.existsSync(p)) continue
      const fm = parseFrontmatter(fs.readFileSync(p, "utf-8"))
      if (fm) rows.push({ id: d, path: p, frontmatter: fm })
    }
  } else {
    for (const f of fs.readdirSync(dir)) {
      if (!f.endsWith(".md")) continue
      const p = path.join(dir, f)
      const fm = parseFrontmatter(fs.readFileSync(p, "utf-8"))
      if (fm) rows.push({ id: f.replace(/\.md$/, ""), path: p, frontmatter: fm })
    }
  }
  return rows
}

export default tool({
  description:
    "Query YAML frontmatter across agents/, skills/, rules/ without reading whole files. Filter by key=value or free-text match against any frontmatter value. Returns compact rows (id, path, matched fields). Use for discovery questions like 'which skills are tagged X' or 'which agents are subagents' instead of reading files one by one.",
  args: {
    scope: tool.schema.enum(["skills", "agents", "rules", "all"]).describe("Which directories to scan"),
    key: tool.schema.string().optional().describe("Frontmatter key to filter on (e.g. 'mode', 'level', 'tags')"),
    value: tool.schema.string().optional().describe("Value to match (substring, case-insensitive). Omit to return all rows with the key present."),
  },
  async execute(args, context) {
    const projectRoot = context.directory || process.cwd()

    return withToolCache("frontmatterQuery", args, () => {
      const scopes = args.scope === "all" ? ["skills", "agents", "rules"] : [args.scope]
      const rows: Array<FrontmatterRow & { scope: string }> = []

      for (const s of scopes) {
        let dirRows: FrontmatterRow[] = []
        if (s === "skills") {
          dirRows = [
            ...collect(path.join(projectRoot, ".opencode", "skills"), "dir-skill"),
            ...collect(path.join(USER_CONFIG_DIR, "skills"), "dir-skill"),
          ]
        } else if (s === "agents") {
          dirRows = collect(path.join(USER_CONFIG_DIR, "agents"), "md-file")
        } else {
          dirRows = [
            ...collect(path.join(projectRoot, ".opencode", "rules"), "md-file"),
            ...collect(path.join(USER_CONFIG_DIR, "rules"), "md-file"),
          ]
        }
        for (const r of dirRows) rows.push({ ...r, scope: s })
      }

      const needle = args.value?.toLowerCase()
      const filtered = rows.filter((r) => {
        if (!args.key) return true
        const v = r.frontmatter[args.key]
        if (v === undefined) return false
        if (!needle) return true
        const hay = Array.isArray(v) ? v.join(" ").toLowerCase() : String(v).toLowerCase()
        return hay.includes(needle)
      })

      const compact = filtered.map((r) => ({
        id: r.id,
        scope: r.scope,
        path: r.path,
        ...(args.key ? { [args.key]: r.frontmatter[args.key] } : {}),
        name: r.frontmatter.name,
        description: typeof r.frontmatter.description === "string" ? (r.frontmatter.description as string).slice(0, 120) : undefined,
      }))

      return JSON.stringify({ total: filtered.length, rows: compact }, null, 2)
    }, 900_000) // 15 min — frontmatter changes as files are edited
  },
})
