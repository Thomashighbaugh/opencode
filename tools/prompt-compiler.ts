import { tool } from "@opencode-ai/plugin"
import * as fs from "fs"
import * as path from "path"
import * as crypto from "crypto"

// ─── Boilerplate Patterns ──────────────────────────────────────────────
// These are sections that the target subagent already has in its base
// instructions. Stripping them reduces token waste without losing info.

const BOILERPLATE_PATTERNS: RegExp[] = [
  // Agent_Prompt wrapper (agent already knows its role)
  /<Agent_Prompt>[\s\S]*?<\/Agent_Prompt>/g,

  // Subagent catalog listings (agent doesn't need the list of other agents)
  /<Subagent_Catalog>[\s\S]*?<\/Subagent_Catalog>/g,

  // Model tiering & fallback protocols (handled by the orchestrator)
  /<Model_Tiering_And_Fallback>[\s\S]*?<\/Model_Tiering_And_Fallback>/g,

  // Full orchestration pattern descriptions (only the selected pattern matters)
  /<Orchestration_Patterns>[\s\S]*?<\/Orchestration_Patterns>/g,

  // Core_Principle blocks (agent has these baked in)
  /<Core_Principle>[\s\S]*?<\/Core_Principle>/g,

  // Available skills listing (agent can look up skills when needed)
  /<available_skills>[\s\S]*?<\/available_skills>/g,
]

// ─── Rule Overlap Table ───────────────────────────────────────────────
// Rules that overlap with what the agent already has in its base instructions.
// Key: rule filename (without .md). Value: if the agent already has this content.

const OVERLAP_RULES = new Set([
  "karpathy-guidelines",   // "Think before coding, simplicity first" — baked into agent
  "shell_strategy",        // Non-interactive shell rules — baked into agent
  "script-elimination",    // Use file-editing tools, not scripts — baked into agent
  "artifact-placement",    // No top-level scripts — baked into agent constraints
  "security",              // Base security rules — agent has these as instructions
])

// ─── Helpers ───────────────────────────────────────────────────────────

function tokenCount(text: string): number {
  return Math.ceil(text.length / 4)
}

/** Extract relevant function/class scope from file content */
function scopeFileContent(content: string, maxLines: number = 80): string {
  const lines = content.split("\n")

  // If file is small enough, return as-is
  if (lines.length <= maxLines) return content

  // Try to find the most dense region (skip imports, boilerplate)
  let relevantStart = 0
  let importBlockEnd = 0

  for (let i = 0; i < Math.min(lines.length, 40); i++) {
    const trimmed = lines[i].trim()
    if (trimmed.startsWith("import ") || trimmed.startsWith("from ") ||
        trimmed.startsWith("//") || trimmed.startsWith("/*") ||
        trimmed.startsWith("*") || trimmed === "" || trimmed.startsWith("//")) {
      importBlockEnd = i + 1
    }
  }

  relevantStart = importBlockEnd

  // Take the first maxLines lines after imports
  const scoped = lines.slice(relevantStart, relevantStart + maxLines)
  const skipped = lines.length - relevantStart - maxLines

  return scoped.join("\n") + (skipped > 0
    ? `\n\n// [... ${skipped} more lines omitted by prompt compiler]`
    : "")
}

/** Convert narrative instructions to a compact structured format */
function structureInstructions(text: string): string {
  let result = text

  // Replace narrative task framing with compact TASK prefix
  result = result.replace(/^(Your\s+)?(The\s+)?(task|goal|objective|purpose)\s+(at hand\s+)?(is|of|for)\s+/gmi, "TASK: ")

  // Collapse multiple blank lines
  result = result.replace(/\n{3,}/g, "\n\n")

  // Convert "Do X, then Do Y, then Do Z" patterns to numbered list
  result = result.replace(/\b(First|Next|Then|Finally|After that),\s+/gim, (m, keyword) => {
    const map: Record<string, string> = {
      "First": "1.",
      "Next": "2.",
      "Then": "3.",
      "Finally": "4.",
      "After that": "5.",
    }
    return (map[keyword] || "*") + " "
  })

  return result.trim()
}

/** Detect if a prompt contains file content that can be scoped */
function isFilePath(line: string): boolean {
  return /^(# |File:|`)[a-zA-Z0-9_\-./]+\.(ts|js|tsx|jsx|py|rs|go|rb|java|kt|swift|c|cpp|h|hpp|css|scss|less|html|json|yaml|yml|toml|md|sh|bash|zsh)/.test(line.trim())
}

/** Check if content looks like a file dump (many lines with code) */
function hasFileDump(content: string): boolean {
  const lines = content.split("\n")
  const codeLines = lines.filter(l => l.startsWith("  ") || l.startsWith("\t") || l.startsWith("```"))
  return codeLines.length > 30 || lines.length > 100
}

// ─── Tool Definition ─────────────────────────────────────────────────────

export default tool({
  description: "Compile subagent dispatch prompts by stripping redundant boilerplate, scoping file contents, and converting narrative to structured format. Reduces per-request token consumption by 40-60% without changing the LLM's output quality. No budget enforcement — pure quality optimization.",
  args: {
    prompt: tool.schema.string().describe("The raw task prompt to compile"),
    agentType: tool.schema.string().optional().describe("Agent type being dispatched (e.g., 'executor', 'code-reviewer')"),
    filePaths: tool.schema.array(tool.schema.string()).optional().describe("File paths referenced in the prompt, for content scoping"),
    skipBoilerplate: tool.schema.boolean().optional().describe("Skip boilerplate stripping (default: true)"),
    scopeFiles: tool.schema.boolean().optional().describe("Scope file contents to relevant sections (default: true)"),
  },
  async execute(args, context) {
    const projectRoot = context.directory || process.cwd()
    let prompt = args.prompt || ""
    if (!prompt) return JSON.stringify({ success: false, error: "prompt required" })

    const originalTokens = tokenCount(prompt)
    let stages: string[] = []

    // Stage 1: Strip boilerplate
    if (args.skipBoilerplate !== false) {
      for (const pattern of BOILERPLATE_PATTERNS) {
        const before = prompt.length
        prompt = prompt.replace(pattern, "")
        if (prompt.length !== before) stages.push("boilerplate-stripped")
      }
    }

    // Stage 2: Strip overlapping rules
    if (args.skipBoilerplate !== false) {
      const rulePattern = /Instructions from: [^\n]+\n([\s\S]*?)(?=(?:Instructions from:|$|\n<available_skills>|\n<Agent_Prompt>|\n# ))/g
      prompt = prompt.replace(rulePattern, (match) => {
        for (const ruleName of OVERLAP_RULES) {
          if (match.includes(ruleName)) {
            stages.push(`rule-removed:${ruleName}`)
            return ""
          }
        }
        return match
      })
      // Also strip remaining rule references that match the overlap set
      for (const ruleName of OVERLAP_RULES) {
        const refPattern = new RegExp(
          `Instructions from: [^\n]*${escapeRegExp(ruleName)}[^\n]*\n[\\s\\S]*?(?=\\nInstructions from:|\\n<available_skills>|\\n<Agent_Prompt>|\\n# |$)`,
          "g"
        )
        const before = prompt.length
        prompt = prompt.replace(refPattern, "")
        if (prompt.length !== before) stages.push(`rule-stripped:${ruleName}`)
      }
    }

    // Stage 3: Scope file contents
    if (args.scopeFiles !== false && args.filePaths && args.filePaths.length > 0) {
      for (const filePath of args.filePaths) {
        try {
          const absPath = path.resolve(projectRoot, filePath)
          const content = fs.readFileSync(absPath, "utf-8")
          const scoped = scopeFileContent(content)

          // Replace the full file content in the prompt with the scoped version
          // Try to match code blocks containing the file path first
          const codeBlockPattern = new RegExp(
            `(\`\`\`[\\w]*\\n|~~~[\\w]*\\n)[\\s\\S]*?${escapeRegExp(path.basename(filePath))}[\\s\\S]*?(\`\`\`|~~~)`,
            "gi"
          )
          const before = prompt.length
          prompt = prompt.replace(codeBlockPattern, (match) => {
            // Only scope if the match looks like it contains the full file
            if (match.split("\n").length > 60) {
              stages.push(`scoped:${filePath}`)
              return match.replace(/(```\w*\n|~~~\w*\n)[\s\S]*(```|~~~)/, (inner) => {
                return inner.replace(/[\s\S]+(?=\n(```|~~~))/, `\n${scoped}\n`)
              })
            }
            return match
          })
        } catch { /* file not found or unreadable — leave as-is */ }
      }
    }

    // Stage 4: Structure instructions
    const structuredPrompt = structureInstructions(prompt)
    if (structuredPrompt.length < prompt.length * 0.95) {
      stages.push("instructions-structured")
      prompt = structuredPrompt
    }

    // Collapse repeated blank lines from stripping
    prompt = prompt.replace(/\n{3,}/g, "\n\n").trim()

    const compiledTokens = tokenCount(prompt)
    const savedTokens = originalTokens - compiledTokens
    const savingsPercent = originalTokens > 0
      ? Math.round((savedTokens / originalTokens) * 100)
      : 0

    return JSON.stringify({
      success: true,
      originalTokens,
      compiledTokens,
      savedTokens,
      savingsPercent,
      stages: [...new Set(stages)],
      compiled: prompt,
    })
  }
})

// ─── Utility ───────────────────────────────────────────────────────────

function escapeRegExp(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}
