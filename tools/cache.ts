import { tool } from "@opencode-ai/plugin"
import { getCache, CacheManager, CACHE_CONFIGS, invalidateAllToolCaches } from "./cache-utils"

const VALID_ACTIONS = ['stats', 'clear', 'invalidate', 'invalidate-tool', 'clear-all'] as const

export default tool({
  description: "Manage the multi-tier prompt cache system — view stats, clear caches, or invalidate specific entries. Namespaces: tool (30s TTL), mcp (7d TTL), llm (1h TTL), agent (30m TTL), session (24h memory-only)",
  args: {
    action: tool.schema.string().describe(`Action to perform. Valid: ${VALID_ACTIONS.join(', ')}`),
    namespace: tool.schema.string().optional().describe("Cache namespace: tool, mcp, llm, agent, session"),
    key: tool.schema.string().optional().describe("Specific cache key to invalidate"),
  },
  async execute(args, context) {
    const projectRoot = context.directory || process.cwd()

    switch (args.action) {
      case 'stats': {
        const namespaces = Object.keys(CACHE_CONFIGS)
        const allStats = namespaces.map(ns => {
          try {
            const cache = getCache(ns, projectRoot)
            return cache.getStats()
          } catch {
            return { namespace: ns, entries: 0, diskEntries: 0, hits: 0, misses: 0, memoryEntries: 0 }
          }
        })
        const totalHits = allStats.reduce((s, st) => s + st.hits, 0)
        const totalMisses = allStats.reduce((s, st) => s + st.misses, 0)
        const hitRate = totalHits + totalMisses > 0
          ? Math.round((totalHits / (totalHits + totalMisses)) * 100)
          : 0
        return JSON.stringify({
          hitRate: `${hitRate}%`,
          totalHits,
          totalMisses,
          namespaces: allStats,
        })
      }

      case 'clear': {
        if (!args.namespace) return JSON.stringify({ error: "namespace required for clear action" })
        try {
          const cache = getCache(args.namespace, projectRoot)
          cache.clear()
          return JSON.stringify({ cleared: args.namespace })
        } catch (e: any) {
          return JSON.stringify({ error: e.message })
        }
      }

      case 'invalidate': {
        if (!args.namespace || !args.key) return JSON.stringify({ error: "namespace and key required for invalidate" })
        try {
          const cache = getCache(args.namespace, projectRoot)
          cache.invalidate(args.key)
          return JSON.stringify({ invalidated: `${args.namespace}:${args.key}` })
        } catch (e: any) {
          return JSON.stringify({ error: e.message })
        }
      }

      case 'invalidate-tool': {
        invalidateAllToolCaches()
        return JSON.stringify({ invalidated: "all tool caches" })
      }

      case 'clear-all': {
        const namespaces = Object.keys(CACHE_CONFIGS)
        for (const ns of namespaces) {
          try {
            const cache = getCache(ns, projectRoot)
            cache.clear()
          } catch {}
        }
        return JSON.stringify({ cleared: "all namespaces" })
      }

      default:
        return JSON.stringify({ error: `Unknown action '${args.action}'. Valid: ${VALID_ACTIONS.join(', ')}` })
    }
  },
})
