/**
 * loadSkillRefs — load a skill's SKILL.md body plus all reference files inlined.
 *
 * loadSkill returns only the names of a skill's references/*.md files; reading
 * each one is a separate Read call. When a skill's workflow says "read
 * references/foo.md during phase N", the agent spends N round-trips. This tool
 * inlines every reference file in one response, keyed by filename, so a
 * subagent prompt can carry the whole skill in a single payload.
 */

import { tool } from "@opencode-ai/plugin"
import * as fs from "fs"
import * as path from "path"
import { homedir } from "os"
import { withToolCache } from "./cache-utils"

const USER_CONFIG_DIR = process.env.OPENCODE_CONFIG_DIR || path.join(homedir(), ".config", "opencode")

function findSkillDir(skill: string, projectRoot: string): { dir: string; source: "project" | "user" } | null {
  const candidates: Array<{ dir: string; source: "project" | "user" }> = [
    { dir: path.join(projectRoot, ".opencode", "skills", skill), source: "project" },
    { dir: path.join(USER_CONFIG_DIR, "skills", skill), source: "user" },
  ]
  for (const c of candidates) {
    if (fs.existsSync(path.join(c.dir, "SKILL.md"))) return c
  }
  return null
}

function stripFrontmatter(raw: string): string {
  const m = raw.match(/^---\n[\s\S]*?\n---\n?/)
  return m ? raw.slice(m[0].length) : raw
}

export default tool({
  description:
    "Load a skill's SKILL.md body plus every references/*.md file inlined in one response. Use when dispatching a subagent that needs the full skill (all phases) so the prompt is self-contained and no follow-up Read calls are needed.",
  args: {
    skill: tool.schema.string().describe("Skill name (directory under skills/)"),
    only: tool.schema
      .array(tool.schema.string())
      .optional()
      .describe("Subset of reference filenames to inline (without .md). Default: all."),
  },
  async execute(args, context) {
    const projectRoot = context.directory || process.cwd()
    const loc = findSkillDir(args.skill, projectRoot)
    if (!loc) return JSON.stringify({ error: `Skill '${args.skill}' not found` })

    return withToolCache("loadSkillRefs", args, () => {
      const skillRaw = fs.readFileSync(path.join(loc.dir, "SKILL.md"), "utf-8")
      const refsDir = path.join(loc.dir, "references")
      const refs: Record<string, string> = {}

      if (fs.existsSync(refsDir)) {
        for (const f of fs.readdirSync(refsDir).filter((f) => f.endsWith(".md"))) {
          const key = f.replace(/\.md$/, "")
          if (args.only && !args.only.includes(key)) continue
          try {
            refs[key] = stripFrontmatter(fs.readFileSync(path.join(refsDir, f), "utf-8")).trim()
          } catch {
            // skip unreadable file
          }
        }
      }

      return JSON.stringify(
        {
          skill: args.skill,
          source: loc.source,
          body: stripFrontmatter(skillRaw).trim(),
          references: refs,
          referenceCount: Object.keys(refs).length,
        },
        null,
        2
      )
    }, 86_400_000)
  },
})
