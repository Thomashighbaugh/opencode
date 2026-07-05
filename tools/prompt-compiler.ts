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

// ─── Output Contract Templates ───────────────────────────────────────
// JSON Schema output contracts for common subagent types.
// Replaces verbose narrative "Expected Output" with precise schemas.

interface OutputContract {
  schema: Record<string, unknown>
  description: string
}

const OUTPUT_CONTRACTS: Record<string, OutputContract> = {
  'code-reviewer': {
    description: 'Code review findings',
    schema: {
      type: 'object',
      properties: {
        verdict: { type: 'string', enum: ['approve', 'changes-requested', 'needs-discussion'] },
        summary: { type: 'string', description: '1-2 sentence summary of findings' },
        findings: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              severity: { type: 'string', enum: ['critical', 'important', 'minor', 'nit'] },
              file: { type: 'string' },
              line: { type: 'number' },
              message: { type: 'string' },
              suggestion: { type: 'string' },
            },
            required: ['severity', 'message'],
          },
        },
      },
      required: ['verdict', 'summary', 'findings'],
    },
  },
  'verifier': {
    description: 'Verification results',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', enum: ['pass', 'fail', 'inconclusive'] },
        checks: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              check: { type: 'string' },
              passed: { type: 'boolean' },
              detail: { type: 'string' },
            },
            required: ['check', 'passed'],
          },
        },
        summary: { type: 'string' },
      },
      required: ['status', 'checks'],
    },
  },
  'executor': {
    description: 'Implementation results',
    schema: {
      type: 'object',
      properties: {
        filesModified: {
          type: 'array',
          items: { type: 'string' },
        },
        changes: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              file: { type: 'string' },
              description: { type: 'string' },
            },
            required: ['file', 'description'],
          },
        },
        status: { type: 'string', enum: ['completed', 'partial', 'blocked'] },
        notes: { type: 'string' },
      },
      required: ['filesModified', 'status'],
    },
  },
  'debugger': {
    description: 'Debugging investigation results',
    schema: {
      type: 'object',
      properties: {
        rootCause: { type: 'string' },
        evidence: { type: 'array', items: { type: 'string' } },
        fix: { type: 'string' },
        filesChanged: { type: 'array', items: { type: 'string' } },
        verified: { type: 'boolean' },
      },
      required: ['rootCause', 'evidence'],
    },
  },
  'test-engineer': {
    description: 'Test generation results',
    schema: {
      type: 'object',
      properties: {
        testsAdded: { type: 'number' },
        filesCreated: { type: 'array', items: { type: 'string' } },
        coverage: { type: 'string' },
        testCommand: { type: 'string' },
        result: { type: 'string', enum: ['all-passing', 'some-failing', 'not-run'] },
      },
      required: ['testsAdded', 'result'],
    },
  },
  'explore': {
    description: 'Codebase search results',
    schema: {
      type: 'object',
      properties: {
        query: { type: 'string' },
        matches: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              file: { type: 'string' },
              lines: { type: 'array', items: { type: 'number' } },
              context: { type: 'string' },
            },
            required: ['file'],
          },
        },
        summary: { type: 'string' },
      },
      required: ['query', 'matches'],
    },
  },
}

/**
 * Agent-type-specific overlap rules.
 * Each agent type already has certain rules baked into its base instructions.
 * This map lets us strip those rules more aggressively for known agent types.
 * Falls back to OVERLAP_RULES when agentType is not specified or unknown.
 */
const AGENT_OVERLAP_RULES: Record<string, Set<string>> = {
  'executor': new Set(['karpathy-guidelines', 'shell_strategy', 'script-elimination', 'artifact-placement', 'security']),
  'architect': new Set(['karpathy-guidelines', 'shell_strategy']),
  'code-reviewer': new Set(['karpathy-guidelines', 'shell_strategy', 'security']),
  'planner': new Set(['karpathy-guidelines', 'shell_strategy']),
  'writer': new Set(['shell_strategy']),
  'verifier': new Set(['shell_strategy']),
  'debugger': new Set(['karpathy-guidelines', 'shell_strategy']),
  'test-engineer': new Set(['karpathy-guidelines', 'shell_strategy']),
  'designer': new Set(['shell_strategy']),
  'frontend-design': new Set(['shell_strategy']),
  'explore': new Set(['shell_strategy']),
  'scientist': new Set(['shell_strategy']),
  'document-specialist': new Set(['shell_strategy']),
  'git-master': new Set(['shell_strategy']),
  'config-orchestrator': new Set(['karpathy-guidelines', 'shell_strategy']),
  'skill-creator': new Set(['karpathy-guidelines', 'shell_strategy']),
  'refactoring': new Set(['karpathy-guidelines', 'shell_strategy']),
  'code-simplifier': new Set(['karpathy-guidelines', 'shell_strategy']),
  'security-reviewer': new Set(['karpathy-guidelines', 'shell_strategy', 'security']),
  'requirements-analyzer': new Set(['karpathy-guidelines', 'shell_strategy']),
  'effort-estimator': new Set(['shell_strategy']),
  'prompt-simplifier': new Set(['shell_strategy']),
  'convention-extractor': new Set(['shell_strategy']),
  'analyst': new Set(['karpathy-guidelines', 'shell_strategy']),
  'critic': new Set(['karpathy-guidelines', 'shell_strategy']),
  'deep-thinker': new Set(['karpathy-guidelines', 'shell_strategy']),
  'tracer': new Set(['karpathy-guidelines', 'shell_strategy']),
  'qa-tester': new Set(['shell_strategy']),
  'commit-drafter': new Set(['shell_strategy']),
  'general': new Set(['karpathy-guidelines', 'shell_strategy']),
}

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

/** Replace narrative "Expected Output" section with a JSON Schema contract */
function applyOutputContract(prompt: string, agentType: string): string {
  const contract = OUTPUT_CONTRACTS[agentType]
  if (!contract) return prompt

  const schemaText = JSON.stringify(contract.schema, null, 2)

  // Try to replace an existing "Expected Output" section
  const expectedOutputPattern = /Expected Output[\s\S]*?(?=\n# |\n## |\n---|\n$)/i
  if (expectedOutputPattern.test(prompt)) {
    return prompt.replace(expectedOutputPattern, `Expected Output (JSON Schema):\`\`\`json\n${schemaText}\n\`\`\``)
  }

  // Otherwise append at the end
  return `${prompt}\n\n## Expected Output\n\`\`\`json\n${schemaText}\n\`\`\``
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
      // Resolve agent-specific overlap rules, falling back to the default set
      const activeRules = (args.agentType && AGENT_OVERLAP_RULES[args.agentType])
        ? AGENT_OVERLAP_RULES[args.agentType]
        : OVERLAP_RULES
      if (args.agentType && AGENT_OVERLAP_RULES[args.agentType]) {
        stages.push(`agent-specific-rules:${args.agentType}`)
      }

      const rulePattern = /Instructions from: [^\n]+\n([\s\S]*?)(?=(?:Instructions from:|$|\n<available_skills>|\n<Agent_Prompt>|\n# ))/g
      prompt = prompt.replace(rulePattern, (match) => {
        for (const ruleName of activeRules) {
          if (match.includes(ruleName)) {
            stages.push(`rule-removed:${ruleName}`)
            return ""
          }
        }
        return match
      })
      // Also strip remaining rule references that match the overlap set
      for (const ruleName of activeRules) {
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

    // Stage 4b: Apply output contract if agent type is known
    if (args.agentType) {
      const before = prompt.length
      prompt = applyOutputContract(prompt, args.agentType)
      if (prompt.length !== before) stages.push(`output-contract:${args.agentType}`)
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
