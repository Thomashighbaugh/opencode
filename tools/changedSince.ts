/**
 * changedSince — what changed in this repo since a given point.
 *
 * Answering "what changed since my last session / last commit / yesterday"
 * costs several git calls pieced together (log, status, diff stat). This
 * tool runs them all and returns one compact summary.
 */

import { tool } from "@opencode-ai/plugin"
import { execSync } from "child_process"

function git(args: string, cwd: string): string {
  try {
    return execSync(`git ${args}`, { cwd, encoding: "utf-8", timeout: 10_000, env: { ...process.env, GIT_PAGER: "cat" } }).trim()
  } catch {
    return ""
  }
}

export default tool({
  description:
    "Summarize what changed in the current git repo since a given ref or date: commits, files changed, working tree status. Use at session start or when resuming to orient quickly without running multiple git commands.",
  args: {
    since: tool.schema
      .string()
      .optional()
      .describe("Git ref, date, or shorthand: 'HEAD~5', '2026-10-01', 'yesterday', 'last-tag'. Default: HEAD~1"),
    cwd: tool.schema.string().optional().describe("Repo root (default: session directory)"),
  },
  async execute(args, context) {
    const cwd = args.cwd ?? context.directory ?? process.cwd()
    let since = args.since ?? "HEAD~1"

    // Resolve shorthand
    if (since === "last-tag") {
      since = git("describe --tags --abbrev=0 2>/dev/null || echo HEAD~10", cwd) || "HEAD~10"
    } else if (since === "yesterday") {
      since = new Date(Date.now() - 86_400_000).toISOString().slice(0, 10)
    }

    // Commits since
    const commits = git(`log --oneline --no-decorate "${since}..HEAD" 2>/dev/null`, cwd)
    const commitList = commits ? commits.split("\n").filter(Boolean) : []

    // Files changed in commits
    const diffStat = git(`diff --stat "${since}..HEAD" 2>/dev/null`, cwd)

    // Working tree status
    const status = git("status --short 2>/dev/null", cwd)
    const dirtyFiles = status ? status.split("\n").filter(Boolean) : []

    // Current branch + last commit
    const branch = git("rev-parse --abbrev-ref HEAD 2>/dev/null", cwd)
    const lastCommit = git("log -1 --oneline 2>/dev/null", cwd)

    return JSON.stringify(
      {
        branch,
        lastCommit,
        since,
        commitsSince: commitList.length,
        commits: commitList.slice(0, 20),
        diffStat: diffStat.split("\n").slice(-5).join("\n"), // last 5 lines = summary
        workingTree: { dirty: dirtyFiles.length, files: dirtyFiles.slice(0, 20) },
      },
      null,
      2
    )
  },
})
