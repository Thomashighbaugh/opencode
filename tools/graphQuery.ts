import { tool } from "@opencode-ai/plugin"
import * as fs from "fs"
import * as os from "os"
import * as path from "path"
import { pathToFileURL } from "url"

// Resolve the graph-context library: prefer a project-local copy (provisioned
// into .opencode/skills/), fall back to the global config install.
const PROJECT_REL = path.join(".opencode", "skills", "graph-context", "scripts", "graphlib.ts")
const GLOBAL_REL = path.join(".config", "opencode", "skills", "graph-context", "scripts", "graphlib.ts")

function resolveGraphlib(projectRoot: string): string | null {
  const candidates = [
    path.join(projectRoot, PROJECT_REL),
    path.join(os.homedir(), GLOBAL_REL),
  ]
  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) return candidate
  }
  return null
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let libCache: any = null

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function loadGraphlib(projectRoot: string): Promise<any> {
  const libPath = resolveGraphlib(projectRoot)
  if (!libPath) throw new Error("graph-context library not found (project .opencode/skills/ or global config)")
  if (!libCache) libCache = await import(pathToFileURL(libPath).href)
  return libCache
}

export default tool({
  description:
    "Per-project knowledge graph — hybrid retrieval (vector recall → graph refine) plus structural navigation. Actions: query (hybrid search), neighbors (traverse edges), impact (what depends on a node), path (shortest connection), build (backfill from wiki+rules+learnings+registry), stats, node.",
  args: {
    action: tool.schema
      .string()
      .describe("Operation: query | neighbors | impact | path | build | stats | node"),
    query: tool.schema
      .string()
      .optional()
      .describe("Search text (for action=query)"),
    id: tool.schema
      .string()
      .optional()
      .describe("Node id, e.g. 'rule:context-strategy' or 'skill:graph-context' (for neighbors/impact/node)"),
    to: tool.schema
      .string()
      .optional()
      .describe("Destination node id (for action=path)"),
    depth: tool.schema
      .number()
      .optional()
      .describe("Traversal depth, default 2 (for neighbors/query)"),
    topK: tool.schema
      .number()
      .optional()
      .describe("Max results, default 8 (for query)"),
    dir: tool.schema
      .string()
      .optional()
      .describe("Project root or .opencode directory (defaults to session directory)"),
  },
  async execute(args, context) {
    const dir = args.dir || context?.directory || process.cwd()
    try {
      const g = await loadGraphlib(dir)
      switch (args.action) {
        case "query": {
          if (!args.query?.trim()) return JSON.stringify({ ok: false, error: "query is required" })
          const results = await g.queryHybrid(dir, args.query, args.topK || 8, { depth: args.depth })
          return JSON.stringify({ ok: true, action: "query", query: args.query, results })
        }
        case "build": {
          const wiki = await g.backfillFromWiki(dir)
          const registry = await g.backfillFromRegistry(dir)
          const decisions = g.backfillFromDecisions ? await g.backfillFromDecisions(dir) : { skipped: "unavailable" }
          const code = g.backfillFromCode ? await g.backfillFromCode(dir) : { skipped: "unavailable" }
          return JSON.stringify({ ok: true, action: "build", wiki, registry, decisions, code, stats: g.getGraphStats(dir) })
        }
        case "neighbors": {
          if (!args.id) return JSON.stringify({ ok: false, error: "id is required" })
          return JSON.stringify({ ok: true, action: "neighbors", id: args.id, neighbors: g.getNeighbors(dir, args.id, args.depth || 2) })
        }
        case "impact": {
          if (!args.id) return JSON.stringify({ ok: false, error: "id is required" })
          return JSON.stringify({ ok: true, action: "impact", id: args.id, impact: g.getImpact(dir, args.id) })
        }
        case "path": {
          if (!args.id || !args.to) return JSON.stringify({ ok: false, error: "id and to are required" })
          return JSON.stringify({ ok: true, action: "path", from: args.id, to: args.to, path: g.getPath(dir, args.id, args.to) })
        }
        case "node": {
          if (!args.id) return JSON.stringify({ ok: false, error: "id is required" })
          return JSON.stringify({ ok: true, action: "node", node: g.getNode(dir, args.id) })
        }
        case "stats": {
          return JSON.stringify({ ok: true, action: "stats", stats: g.getGraphStats(dir) })
        }
        default:
          return JSON.stringify({ ok: false, error: `unknown action: ${args.action}` })
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      return JSON.stringify({ ok: false, error: msg })
    }
  },
})
