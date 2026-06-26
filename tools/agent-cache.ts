import { tool } from "@opencode-ai/plugin"
import * as fs from "fs"
import * as path from "path"
import * as crypto from "crypto"
import { getCache, CacheManager } from "./cache-utils"

const VALID_ACTIONS = ["save", "load", "invalidate", "stats"] as const

/**
 * Agent output cache — caches subagent results by {agent_type, task_hash, file_hashes}.
 * If the same agent is asked the same task on the same files, return cached result.
 * Eliminates redundant subagent API requests.
 */
export default tool({
  description: "Cache subagent outputs by task hash — save, load, invalidate. Eliminates redundant subagent API requests when the same task is repeated on unchanged files.",
  args: {
    action: tool.schema.string().describe(`Action. Valid: ${VALID_ACTIONS.join(", ")}`),
    agentType: tool.schema.string().optional().describe("Agent type (e.g., 'executor', 'code-reviewer')"),
    taskPrompt: tool.schema.string().optional().describe("The task prompt sent to the subagent"),
    filePaths: tool.schema.array(tool.schema.string()).optional().describe("File paths the subagent worked on (for invalidation on file change)"),
    output: tool.schema.string().optional().describe("Subagent output to cache (for save action)"),
    key: tool.schema.string().optional().describe("Specific cache key to invalidate (for invalidate action)")
  },
  async execute(args, context) {
    const projectRoot = context.directory || process.cwd()
    const cache = getCache("agent", projectRoot)

    switch (args.action) {
      case "save": {
        if (!args.agentType || !args.taskPrompt) {
          return JSON.stringify({ success: false, error: "agentType and taskPrompt required for save" })
        }
        const key = buildKey(args.agentType, args.taskPrompt, args.filePaths || [])
        const entry = {
          agentType: args.agentType,
          taskPrompt: args.taskPrompt.slice(0, 200),
          fileHashes: hashFiles(args.filePaths || []),
          output: args.output || "",
          savedAt: new Date().toISOString()
        }
        cache.set(key, JSON.stringify(entry))
        return JSON.stringify({ success: true, action: "save", key, agentType: args.agentType })
      }

      case "load": {
        if (!args.agentType || !args.taskPrompt) {
          return JSON.stringify({ success: false, error: "agentType and taskPrompt required for load" })
        }
        const key = buildKey(args.agentType, args.taskPrompt, args.filePaths || [])
        const cached = cache.get<string>(key)
        if (!cached) {
          return JSON.stringify({ success: true, action: "load", hit: false, reason: "no-cache-entry" })
        }

        try {
          const entry = JSON.parse(cached)
          // Verify files haven't changed since cache was created
          if (args.filePaths && args.filePaths.length > 0) {
            const currentHashes = hashFiles(args.filePaths)
            if (currentHashes !== entry.fileHashes) {
              cache.invalidate(key)
              return JSON.stringify({ success: true, action: "load", hit: false, reason: "files-changed" })
            }
          }
          return JSON.stringify({ success: true, action: "load", hit: true, output: entry.output, savedAt: entry.savedAt })
        } catch {
          cache.invalidate(key)
          return JSON.stringify({ success: true, action: "load", hit: false, reason: "parse-error" })
        }
      }

      case "invalidate": {
        if (args.key) {
          cache.invalidate(args.key)
          return JSON.stringify({ success: true, action: "invalidate", key: args.key })
        }
        if (args.agentType) {
          cache.invalidatePrefix(args.agentType)
          return JSON.stringify({ success: true, action: "invalidate", agentType: args.agentType, message: "All entries for this agent type cleared" })
        }
        return JSON.stringify({ success: false, error: "key or agentType required for invalidate" })
      }

      case "stats": {
        const stats = cache.getStats()
        return JSON.stringify({ success: true, action: "stats", ...stats })
      }

      default:
        return JSON.stringify({ success: false, error: `Unknown action: ${args.action}` })
    }
  }
})

// ── Helpers ──────────────────────────────────────────────────────────────

function buildKey(agentType: string, taskPrompt: string, filePaths: string[]): string {
  const taskHash = crypto.createHash("sha256").update(taskPrompt).digest("hex").substring(0, 16)
  const fileHash = hashFiles(filePaths)
  return CacheManager.key(agentType, taskHash, fileHash)
}

function hashFiles(paths: string[]): string {
  if (paths.length === 0) return "no-files"
  const hashes = paths.map(p => {
    try {
      const content = fs.readFileSync(p, "utf-8")
      return crypto.createHash("sha256").update(content).digest("hex").substring(0, 12)
    } catch {
      return "missing"
    }
  })
  return crypto.createHash("sha256").update(hashes.join(",")).digest("hex").substring(0, 16)
}
