import { tool } from "@opencode-ai/plugin"
import { getCache, CacheManager } from "./cache-utils"

const VALID_ACTIONS = ['save', 'load', 'invalidate', 'stats'] as const

export default tool({
  description: "Tier 4: Agent output cache — cache and retrieve subagent outputs keyed by agent type + task hash. TTL: 30 minutes. Use to avoid re-executing identical subagent tasks.",
  args: {
    action: tool.schema.string().describe(`Action to perform. Valid: ${VALID_ACTIONS.join(', ')}`),
    agentType: tool.schema.string().optional().describe("Agent type (e.g., executor, planner, code-reviewer)"),
    taskHash: tool.schema.string().optional().describe("SHA256 hash of the task description"),
    output: tool.schema.string().optional().describe("Agent output to cache (for save action)"),
    ttl: tool.schema.number().optional().describe("TTL in ms (default: 1800000 = 30 min)"),
  },
  async execute(args, context) {
    const projectRoot = context.projectRoot || process.cwd()
    const cache = getCache("agent", projectRoot)

    switch (args.action) {
      case 'save': {
        if (!args.agentType || !args.taskHash || !args.output) {
          return JSON.stringify({ error: "agentType, taskHash, and output required for save" })
        }
        const key = CacheManager.key(args.agentType, args.taskHash)
        cache.set(key, args.output, args.ttl || 1_800_000)
        return JSON.stringify({ cached: true, key, agentType: args.agentType, ttl: args.ttl || 1_800_000 })
      }

      case 'load': {
        if (!args.agentType || !args.taskHash) {
          return JSON.stringify({ error: "agentType and taskHash required for load" })
        }
        const key = CacheManager.key(args.agentType, args.taskHash)
        const cached = cache.get<string>(key)
        if (cached !== null) {
          return JSON.stringify({ hit: true, key, output: cached })
        }
        return JSON.stringify({ hit: false, key })
      }

      case 'invalidate': {
        if (!args.agentType || !args.taskHash) {
          return JSON.stringify({ error: "agentType and taskHash required for invalidate" })
        }
        const key = CacheManager.key(args.agentType, args.taskHash)
        cache.invalidate(key)
        return JSON.stringify({ invalidated: true, key })
      }

      case 'stats': {
        const stats = cache.getStats()
        return JSON.stringify(stats)
      }

      default:
        return JSON.stringify({ error: `Unknown action '${args.action}'. Valid: ${VALID_ACTIONS.join(', ')}` })
    }
  },
})
