import { tool } from "@opencode-ai/plugin"
import * as fs from "fs"
import * as path from "path"

// ─── Constants ──────────────────────────────────────────────────────────

const METHOD_KEYWORDS = [
  "bug", "fix", "refactor", "test", "review", "implement", "build",
  "deploy", "debug", "optimize", "simplify", "modernize", "secure",
  "migrate", "auth", "api", "database", "db", "cache", "ui", "ux",
  "performance", "security", "config",
]

const STOP_WORDS = new Set([
  "the", "this", "that", "with", "from", "have", "will", "your",
  "what", "when", "where", "which", "there", "their", "about",
  "into", "some", "them", "then", "than", "also", "just", "like",
  "need", "make", "more", "only", "over", "such", "take", "well",
  "were", "been", "does", "each", "want", "here", "much", "give",
  "most", "back",
])

const CONTEXT_DIRS = [
  ".opencode/context/frameworks",
  ".opencode/context/patterns",
]

const RESEARCH_DIR = ".opencode/context/research"
const DECISIONS_FILE = ".opencode/context/decisions.md"

// ─── Keyword Extraction ─────────────────────────────────────────────────

function extractKeywords(task: string, filePaths: string[]): string[] {
  const lowerTask = task.toLowerCase()

  // 1. Split on non-word characters, filter to words > 3 chars, remove stop words
  const rawWords = lowerTask
    .split(/[^a-z0-9]+/)
    .filter(w => w.length > 3 && !STOP_WORDS.has(w))

  // 2. Match against METHOD_KEYWORDS
  const methodMatches = METHOD_KEYWORDS.filter(kw => rawWords.includes(kw))

  // 3. Domain nouns from raw words (excluding method keywords to avoid dupes)
  const domainNouns = rawWords.filter(w => !methodMatches.includes(w))

  // 4. Extract path segments from filePaths (directory basenames + file basenames)
  const pathSegments = new Set<string>()
  for (const fp of filePaths) {
    const normalized = fp.replace(/\\/g, "/")
    const parts = normalized.split("/")
    for (const p of parts) {
      const clean = p.replace(/\.[a-z0-9]+$/i, "").toLowerCase()
      if (clean.length > 3 && !STOP_WORDS.has(clean)) {
        pathSegments.add(clean)
      }
    }
  }

  // 5. Combine, deduplicate, cap at 10
  const combined = [...new Set([...methodMatches, ...domainNouns, ...pathSegments])]
  return combined.slice(0, 10)
}

// ─── Context File Scanning ──────────────────────────────────────────────

function scanDirectory(
  dirPath: string,
  keyword: string,
  recurse: boolean,
): string[] {
  const results: string[] = []
  const absDir = path.resolve(dirPath)

  if (!fs.existsSync(absDir)) return results

  try {
    const entries = fs.readdirSync(absDir, { withFileTypes: true })

    for (const entry of entries) {
      const fullPath = path.join(absDir, entry.name)

      if (entry.isDirectory() && recurse) {
        results.push(...scanDirectory(fullPath, keyword, recurse))
        continue
      }

      if (entry.isFile()) {
        const nameWithoutExt = path.basename(entry.name, path.extname(entry.name))
        if (
          nameWithoutExt.toLowerCase().startsWith(keyword) ||
          nameWithoutExt.toLowerCase().includes(keyword)
        ) {
          results.push(fullPath)
        }
      }
    }
  } catch {
    // Silently skip unreadable directories
  }

  return results
}

function checkDecisionsFile(
  decisionsPath: string,
  keywords: string[],
): boolean {
  const absPath = path.resolve(decisionsPath)
  if (!fs.existsSync(absPath)) return false

  try {
    const content = fs.readFileSync(absPath, "utf-8")
    const lines = content.split("\n")
    return lines.some(line => {
      const adrMatch = line.match(/^#\s+ADR:/i)
      if (!adrMatch) return false
      const lowerLine = line.toLowerCase()
      return keywords.some(
        kw => new RegExp(`\\b${kw}\\b`, "i").test(lowerLine),
      )
    })
  } catch {
    return false
  }
}

function findContextFiles(
  keywords: string[],
  projectRoot: string,
): string[] {
  const found = new Set<string>()

  // Scan frameworks/ and patterns/ directories
  for (const dir of CONTEXT_DIRS) {
    const fullDir = path.join(projectRoot, dir)
    for (const kw of keywords) {
      for (const fp of scanDirectory(fullDir, kw, false)) {
        if (fs.existsSync(fp)) found.add(fp)
      }
    }
  }

  // Scan research/ with recursion (subdirectories for library slugs)
  const researchDir = path.join(projectRoot, RESEARCH_DIR)
  for (const kw of keywords) {
    for (const fp of scanDirectory(researchDir, kw, true)) {
      if (fs.existsSync(fp)) found.add(fp)
    }
  }

  // Check decisions.md
  const decisionsPath = path.join(projectRoot, DECISIONS_FILE)
  if (checkDecisionsFile(decisionsPath, keywords)) {
    found.add(path.resolve(decisionsPath))
  }

  return [...found]
}

// ─── Tool Export ────────────────────────────────────────────────────────

export default tool({
  description:
    "Extract keywords from a task prompt and return relevant context file paths based on the context-strategy frame convention. Scans .opencode/context/ subdirectories for files matching task keywords.",
  args: {
    task: tool.schema
      .string()
      .describe("The task prompt to analyze for keywords"),
    filePaths: tool.schema
      .array(tool.schema.string())
      .optional()
      .describe("File paths involved in the task (for domain hints)"),
    projectRoot: tool.schema
      .string()
      .optional()
      .describe("Project root directory (defaults to cwd)"),
  },
  async execute(args, context) {
    const projectRoot =
      args.projectRoot || context?.directory || process.cwd()
    const keywords = extractKeywords(args.task, args.filePaths || [])
    const contextPaths = findContextFiles(keywords, projectRoot)

    return JSON.stringify({
      keywords,
      contextPaths,
      scope: contextPaths.length > 0 ? "matched" : "none",
    })
  },
})
