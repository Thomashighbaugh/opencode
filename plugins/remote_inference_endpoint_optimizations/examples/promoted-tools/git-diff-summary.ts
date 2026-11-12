/**
 * Promoted project-scoped tool: git-diff-summary
 * 
 * Mechanical alternative to asking the model to summarize a git diff.
 * Parses `git diff --stat` output locally and returns a structured
 * summary of changed files, insertions, deletions — zero inference tokens.
 * 
 * Promote to: <project>/.opencode/tools/git-diff-summary.ts
 */

import { z } from "zod"
import { execSync } from "child_process"

export default {
  id: "git_diff_summary",
  name: "git_diff_summary",
  description: "Summarize git diff mechanically — files changed, insertions, deletions, no inference",
  parameters: z.object({
    from: z.string().optional().default("HEAD~1").describe("Start commit/ref"),
    to: z.string().optional().default("HEAD").describe("End commit/ref"),
    path: z.string().optional().describe("Limit to specific path"),
  }),
  async execute(input: { from?: string; to?: string; path?: string }) {
    const { from = "HEAD~1", to = "HEAD", path } = input
    try {
      let cmd = `git diff --stat ${from}...${to}`
      if (path) cmd += ` -- ${path}`
      const output = execSync(cmd, { encoding: "utf8", cwd: process.cwd() })
      
      const files: Array<{ path: string; insertions: number; deletions: number; total: number }> = []
      let totalInsertions = 0
      let totalDeletions = 0
      
      for (const line of output.split("\n").slice(0, -1)) {
        const match = line.match(/\s*(\d+)\s+insertion|deletion|(\d+)\s+deletion/)
        const pathMatch = line.match(/^(.*?)\s*\|\s*\d+/)
        if (pathMatch) {
          const insMatch = line.match(/(\d+)\s+insertion/)
          const delMatch = line.match(/(\d+)\s+deletion/)
          const insertions = insMatch ? parseInt(insMatch[1], 10) : 0
          const deletions = delMatch ? parseInt(delMatch[1], 10) : 0
          files.push({
            path: pathMatch[1].trim(),
            insertions,
            deletions,
            total: insertions + deletions,
          })
          totalInsertions += insertions
          totalDeletions += deletions
        }
      }
      
      files.sort((a, b) => b.total - a.total)
      
      return {
        content: [
          `Git diff summary: ${from} → ${to}`,
          `Files changed: ${files.length}`,
          `Insertions: ${totalInsertions}`,
          `Deletions: ${totalDeletions}`,
          `Net: ${totalInsertions - totalDeletions > 0 ? "+" : ""}${totalInsertions - totalDeletions}`,
          "",
          "Top changed files:",
          ...files.slice(0, 10).map((f) => 
            `  ${f.path}: +${f.insertions} -${f.deletions} (${f.total})`
          ),
        ].join("\n"),
        files,
        totalInsertions,
        totalDeletions,
        tokensSaved: Math.round(files.length * 500), // estimated tokens not spent asking model
      }
    } catch (err) {
      return {
        content: `Error running git diff: ${err instanceof Error ? err.message : String(err)}`,
        error: true,
      }
    }
  },
}
