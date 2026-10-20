/**
 * findSubcommand — search all hub subcommand specs by keyword.
 *
 * hubMenu menu returns one hub at a time; when you don't know which hub owns
 * a subcommand ("postmortem", "benchmark", "provision"), you probe serially.
 * This tool searches every hub's subcommand specs in one call and returns
 * ranked matches with hub/subcommand/description — enough to route directly.
 */

import { tool } from "@opencode-ai/plugin"
import { loadAllHubs } from "./hub-data"
import { withToolCache } from "./cache-utils"

export default tool({
  description:
    "Search all 173 hub subcommand specs by keyword. Returns matching hub/subcommand pairs ranked by relevance (label match > description match). Use when you know what you want to do but not which hub owns it — avoids probing hubMenu menu serially.",
  args: {
    query: tool.schema.string().describe("Search term, e.g. 'postmortem', 'provision', 'benchmark'"),
    limit: tool.schema.number().optional().describe("Max results (default 10)"),
  },
  async execute(args, _context) {
    return withToolCache("findSubcommand", args, () => {
      const hubs = loadAllHubs()
      const needle = args.query.toLowerCase()
      const limit = args.limit ?? 10

      interface Match {
        hub: string
        subcommand: string
        description: string
        score: number
      }

      const matches: Match[] = []
      for (const hub of hubs) {
        for (const sub of hub.subcommands ?? []) {
          const label = sub.label.toLowerCase()
          const desc = sub.description.toLowerCase()
          const hubName = hub.name.toLowerCase()

          let score = 0
          if (label === needle) score += 100
          else if (label.startsWith(needle)) score += 80
          else if (label.includes(needle)) score += 60
          if (desc.includes(needle)) score += 30
          if (hubName.includes(needle)) score += 10

          if (score > 0) {
            matches.push({
              hub: hub.name,
              subcommand: sub.label,
              description: sub.description,
              score,
            })
          }
        }
      }

      matches.sort((a, b) => b.score - a.score)
      return JSON.stringify({ query: args.query, total: matches.length, results: matches.slice(0, limit) }, null, 2)
    }, 86_400_000) // 24h — specs are static between edits
  },
})
