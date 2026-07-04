import { tool } from "@opencode-ai/plugin"
import { getCache, CacheManager, CACHE_CONFIGS, invalidateAllToolCaches } from "./cache-utils"

const VALID_ACTIONS = ['stats', 'clear', 'invalidate', 'invalidate-tool', 'clear-all', 'report'] as const

export default tool({
  description: "Manage the multi-tier prompt cache system — view stats, clear caches, invalidate entries, or generate a savings report. Namespaces: tool (15m), mcp (7d), llm (1h), agent (30m), session (24h memory-only), stable (24h), context7 (7d), file (24h memory-only). Actions: stats, clear, invalidate, invalidate-tool, clear-all, report",
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

      case 'report': {
        const namespaces = Object.keys(CACHE_CONFIGS)
        const report: any[] = []
        let totalHits = 0
        let totalMisses = 0
        let totalTokensSaved = 0

        for (const ns of namespaces) {
          try {
            const cache = getCache(ns, projectRoot)
            const stats = cache.getStats()
            report.push({
              namespace: ns,
              hits: stats.hits,
              misses: stats.misses,
              hitRate: stats.hits + stats.misses > 0 
                ? `${Math.round((stats.hits / (stats.hits + stats.misses)) * 100)}%` 
                : '0%',
              entries: stats.entries,
              diskEntries: stats.diskEntries,
              tokensSaved: stats.estimatedTokensSaved,
            })
            totalHits += stats.hits
            totalMisses += stats.misses
            totalTokensSaved += stats.estimatedTokensSaved
          } catch {
            report.push({ namespace: ns, error: 'failed to load' })
          }
        }

        const overallHitRate = totalHits + totalMisses > 0
          ? `${Math.round((totalHits / (totalHits + totalMisses)) * 100)}%`
          : '0%'

        return JSON.stringify({
          summary: {
            totalHits,
            totalMisses,
            overallHitRate,
            estimatedTokensSaved: totalTokensSaved,
            estimatedCostSaved: `${Math.round(totalTokensSaved / 1000)}K tokens`,
          },
          namespaces: report,
          recommendations: totalTokensSaved < 1000
            ? ['Low cache utilization — ensure tools use withToolCache for read-only operations']
            : [],
        }, null, 2)
      }

      default:
        return JSON.stringify({ error: `Unknown action '${args.action}'. Valid: ${VALID_ACTIONS.join(', ')}` })
    }
  },
})
