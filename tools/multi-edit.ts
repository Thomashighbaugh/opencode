import { tool } from "@opencode-ai/plugin"
import * as fs from "fs"
import * as path from "path"
import { globSync } from "glob"

const VALID_ACTIONS = ["find", "replace", "replaceAll"] as const

export default tool({
  description: "Batch operations across multiple files by glob pattern — find, replace, replaceAll. No find+xargs+sed pipelines needed.",
  args: {
    glob: tool.schema.string().describe("Glob pattern to match files, e.g. 'src/**/*.ts', '*.json'"),
    action: tool.schema.string().describe(`Operation. Valid: ${VALID_ACTIONS.join(", ")}`),
    pattern: tool.schema.string().describe("Regex or string pattern to search for"),
    replacement: tool.schema.string().optional().describe("Replacement text (for replace/replaceAll)"),
    flags: tool.schema.string().optional().describe("Regex flags (default: '' for replace, 'g' for replaceAll)"),
    encoding: tool.schema.string().optional().describe("File encoding (default: 'utf-8')"),
    dryRun: tool.schema.boolean().optional().describe("Preview changes without applying (default: true for safety)"),
    maxFiles: tool.schema.number().optional().describe("Safety limit on files processed (default: 50)"),
    cwd: tool.schema.string().optional().describe("Working directory for glob resolution (default: cwd)"),
    binaryExts: tool.schema.array(tool.schema.string()).optional().describe("File extensions to skip (default: ['.png','.jpg','.gif','.ico','.woff','.woff2','.ttf','.eot','.pdf','.zip','.gz','.tar'])")
  },
  async execute(args) {
    const { glob: globPattern, action, pattern, replacement, flags, dryRun, maxFiles, cwd, encoding } = args
    const enc = (encoding || "utf-8") as BufferEncoding

    if (!globPattern) return err("glob is required (e.g. 'src/**/*.ts')")
    if (!action) return err("action is required")
    if (!pattern) return err("pattern is required")
    if (!VALID_ACTIONS.includes(action as any)) {
      return err(`Invalid action. Valid: ${VALID_ACTIONS.join(", ")}`)
    }
    if ((action === "replace" || action === "replaceAll") && replacement === undefined) {
      return err("replacement is required for replace/replaceAll")
    }

    const effectiveDryRun = dryRun !== false // default true for safety

    // Resolve files
    const workDir = cwd || process.cwd()
    let files: string[]
    try {
      files = globSync(globPattern, { cwd: workDir, nodir: true, dot: false })
    } catch (e: any) {
      return err(`Glob error: ${e.message}`)
    }

    if (files.length === 0) {
      return ok({ action, glob: globPattern, dryRun: effectiveDryRun, totalFiles: 0, message: "No files matched" })
    }

    const max = maxFiles ?? 50
    if (files.length > max) {
      return err(`Glob matched ${files.length} files (max: ${max}). Narrow your glob pattern or increase maxFiles.`)
    }

    // Convert to absolute paths
    files = files.map(f => path.resolve(workDir, f))

    // Filter out binaries
    const skipExts = new Set(args.binaryExts || [
      ".png", ".jpg", ".jpeg", ".gif", ".ico", ".svg",
      ".woff", ".woff2", ".ttf", ".eot",
      ".pdf", ".zip", ".gz", ".tar", ".tgz",
      ".mp3", ".mp4", ".avi", ".mov",
      ".o", ".a", ".so", ".dylib", ".exe", ".dll"
    ])

    // ── Find ─────────────────────────────────────────────────────────────
    if (action === "find") {
      const re = new RegExp(pattern, flags || "gm")
      const matches: Array<{ file: string; line: number; content: string; match: string }> = []

      for (const file of files) {
        const ext = path.extname(file).toLowerCase()
        if (skipExts.has(ext)) continue

        try {
          const content = fs.readFileSync(file, enc)
          const lines = content.split("\n")
          for (let i = 0; i < lines.length; i++) {
            re.lastIndex = 0
            if (re.test(lines[i])) {
              matches.push({ file, line: i + 1, content: lines[i].trim(), match: lines[i].match(re)?.[0] || "" })
            }
          }
        } catch {
          // Skip unreadable files
          continue
        }
      }

      return ok({
        action: "find",
        glob: globPattern,
        scannedFiles: files.length - matches.filter(m => m.file).length,
        totalMatches: matches.length,
        matches
      })
    }

    // ── Replace / ReplaceAll ─────────────────────────────────────────────
    const isReplaceAll = action === "replaceAll"
    const re = new RegExp(pattern, flags || (isReplaceAll ? "g" : ""))

    const results: Array<{
      file: string
      status: "changed" | "no-match" | "error"
      changes?: number
      diff?: string
      error?: string
    }> = []

    for (const file of files) {
      const ext = path.extname(file).toLowerCase()
      if (skipExts.has(ext)) {
        results.push({ file, status: "error", error: "Skipped binary file" })
        continue
      }

      let original: string
      try {
        original = fs.readFileSync(file, enc)
      } catch (e: any) {
        results.push({ file, status: "error", error: e.message })
        continue
      }

      const after = original.replace(re, replacement!)

      if (after === original) {
        results.push({ file, status: "no-match", changes: 0 })
        continue
      }

      const changedLines = countChangedLines(original, after)
      const diff = buildDiff(original, after)

      if (!effectiveDryRun) {
        try {
          fs.writeFileSync(file, after, enc)
        } catch (e: any) {
          results.push({ file, status: "error", error: e.message })
          continue
        }
      }

      results.push({ file, status: "changed", changes: changedLines, diff })
    }

    const changed = results.filter(r => r.status === "changed").length
    const noMatch = results.filter(r => r.status === "no-match").length
    const errors = results.filter(r => r.status === "error")

    return ok({
      action,
      glob: globPattern,
      dryRun: effectiveDryRun,
      totalFiles: files.length,
      changed,
      noMatch,
      errors: errors.length,
      results
    })
  }
})

// ── Helpers ──────────────────────────────────────────────────────────────

function countChangedLines(before: string, after: string): number {
  const b = before.split("\n")
  const a = after.split("\n")
  let n = 0
  for (let i = 0; i < Math.max(b.length, a.length); i++) {
    if (b[i] !== a[i]) n++
  }
  return n
}

function buildDiff(before: string, after: string): string {
  const b = before.split("\n")
  const a = after.split("\n")
  const parts: string[] = []
  for (let i = 0; i < Math.max(b.length, a.length); i++) {
    if (b[i] !== a[i]) {
      if (b[i] !== undefined) parts.push(`- ${b[i]}`)
      if (a[i] !== undefined) parts.push(`+ ${a[i]}`)
    }
  }
  return parts.join("\n")
}

function ok(data: Record<string, unknown>) {
  return JSON.stringify({ success: true, ...data })
}

function err(msg: string) {
  return JSON.stringify({ success: false, error: msg })
}
