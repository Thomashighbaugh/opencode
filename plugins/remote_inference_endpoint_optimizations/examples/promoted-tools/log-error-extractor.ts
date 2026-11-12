/**
 * Promoted project-scoped tool: log-error-extractor
 * 
 * Mechanical alternative to asking the model to parse log files and find errors.
 * Scans a log file locally for error patterns, extracts context lines, and
 * returns structured results — zero inference tokens.
 * 
 * Promote to: <project>/.opencode/tools/log-error-extractor.ts
 */

import { z } from "zod"
import { readFileSync } from "node:fs"

export default {
  id: "log_error_extractor",
  name: "log_error_extractor",
  description: "Extract errors from log files mechanically — pattern match + context, no inference",
  parameters: z.object({
    file: z.string().describe("Path to log file"),
    pattern: z.string().optional().default("error|exception|failed|critical|fatal").describe("Regex pattern to match"),
    contextLines: z.number().optional().default(2).describe("Lines of context around each match"),
    maxResults: z.number().optional().default(20).describe("Maximum results to return"),
  }),
  async execute(input: { file: string; pattern?: string; contextLines?: number; maxResults?: number }) {
    const { file, pattern = "error|exception|failed|critical|fatal", contextLines = 2, maxResults = 20 } = input
    
    let content: string
    try {
      content = readFileSync(file, "utf8")
    } catch (err) {
      return {
        content: `Error reading file ${file}: ${err instanceof Error ? err.message : String(err)}`,
        error: true,
      }
    }
    
    const lines = content.split("\n")
    const regex = new RegExp(pattern, "i")
    const matches: Array<{ line: number; text: string; context: string[] }> = []
    
    for (let i = 0; i < lines.length; i++) {
      if (regex.test(lines[i])) {
        const start = Math.max(0, i - contextLines)
        const end = Math.min(lines.length, i + contextLines + 1)
        matches.push({
          line: i + 1,
          text: lines[i],
          context: lines.slice(start, end),
        })
        if (matches.length >= maxResults) break
      }
    }
    
    return {
      content: [
        `Log error extraction: ${file}`,
        `Pattern: ${pattern}`,
        `Matches found: ${matches.length}`,
        "",
        ...matches.flatMap((m) => [
          `--- Line ${m.line} ---`,
          m.context.map((c, idx) => {
            const actualLine = m.line - contextLines + idx
            const isMatch = actualLine === m.line ? ">> " : "   "
            return `${isMatch}${c}`
          }).join("\n"),
          "",
        ]).join("\n"),
      ],
      matches,
      totalMatches: matches.length,
      tokensSaved: Math.round(matches.length * 300), // estimated tokens not spent asking model
    }
  },
}
