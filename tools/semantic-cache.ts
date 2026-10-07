import { tool } from "@opencode-ai/plugin"
import * as fs from "fs"
import * as path from "path"
import * as crypto from "crypto"
import { getCache, CacheManager, getProjectSlug } from "./cache-utils"
import { embedQuery, EMBED_DIM, EMBED_MODEL_KEY } from "../skills/vectorize-context/scripts/embedder.ts"

const VALID_ACTIONS = ["save", "load", "invalidate", "stats"] as const
const SIMILARITY_THRESHOLD = 0.92
const CACHE_TTL_MS = 86_400_000 // 24h (matches stable namespace)

/**
 * Index schema version.
 *
 * Bumped from 1 when the embedder moved from a 1024-dim Ollama model to the
 * shared 384-dim ONNX one. Vectors from the two are not comparable — see
 * `cosineSimilarity` — so an old index is discarded rather than silently
 * contributing NaN similarities that would look like "no match" forever.
 */
export const INDEX_VERSION = 2

// ─── Types ─────────────────────────────────────────────────────────────

interface SemanticEntry {
  key: string
  agentType: string
  prompt: string
  vectorB64: string
  output: string
  fileHashes: string
  savedAt: string
  lastAccess: string  // last time this entry was accessed (read); defaults to savedAt for legacy entries
}

interface SemanticIndex {
  version: number
  entries: SemanticEntry[]
  lastScanMs?: number
  candidatesConsidered?: number
}

// ─── Helpers ───────────────────────────────────────────────────────────

function getIndexPath(projectRoot: string): string {
  return path.join(projectRoot, ".opencode", "cache", "semantic", getProjectSlug(projectRoot), "index.json")
}

function ensureDir(p: string) {
  fs.mkdirSync(path.dirname(p), { recursive: true })
}

export function loadIndex(projectRoot: string): SemanticIndex {
  const indexPath = getIndexPath(projectRoot)
  try {
    const index: SemanticIndex = JSON.parse(fs.readFileSync(indexPath, "utf-8"))
    // A version-1 index holds 1024-dim vectors from the retired Ollama embedder.
    // They cannot be compared against the current 384-dim ones, so the whole
    // index is dropped instead of carried forward as permanently-unmatchable
    // entries. Cheap: the semantic tier is a cache, and the exact-match tier in
    // agentCache survives untouched.
    if (index.version !== INDEX_VERSION) {
      return { version: INDEX_VERSION, entries: [] }
    }
    // Backward compatibility: ensure all entries have lastAccess
    for (const entry of index.entries) {
      if (!entry.lastAccess) {
        entry.lastAccess = entry.savedAt
      }
    }
    return index
  } catch {
    return { version: INDEX_VERSION, entries: [] }
  }
}

function saveIndex(projectRoot: string, index: SemanticIndex) {
  const indexPath = getIndexPath(projectRoot)
  ensureDir(indexPath)
  fs.writeFileSync(indexPath, JSON.stringify(index, null, 2), "utf-8")
}

function hashFiles(paths: string[]): string {
  if (!paths || paths.length === 0) return "no-files"
  const hashes = paths.map(p => {
    try {
      const content = fs.readFileSync(p, "utf-8")
      return crypto.createHash("sha256").update(content).digest("hex").substring(0, 12)
    } catch { return "missing" }
  })
  return crypto.createHash("sha256").update(hashes.join(",")).digest("hex").substring(0, 16)
}

/** Float32Array → base64 string */
export function vectorToBase64(vec: number[]): string {
  const buf = new Float32Array(vec)
  const bytes = new Uint8Array(buf.buffer)
  return Buffer.from(bytes).toString("base64")
}

/**
 * base64 string → Float32Array.
 *
 * The `byteOffset`/`length` pair is load-bearing, not defensive. Node allocates
 * small Buffers as views into a shared 8 KB pool, so `bytes.buffer` is the *pool*,
 * not this string's bytes — `new Float32Array(bytes.buffer)` yielded a 16384-float
 * array for a 4-float vector. The extra 16380 values are whatever else landed in
 * the pool, so every stored vector came back as mostly garbage: the cosine loop
 * read real data in the first few slots and uninitialized memory after, and the
 * semantic tier silently never cleared its threshold. Nothing errored.
 */
export function base64ToVector(b64: string): Float32Array {
  const bytes = Buffer.from(b64, "base64")
  if (bytes.byteLength % 4 !== 0) {
    throw new Error(`stored vector is ${bytes.byteLength} bytes, not a whole number of float32s`)
  }
  return new Float32Array(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength))
}

/** Cosine similarity between two vectors */
export function cosineSimilarity(a: Float32Array, b: Float32Array): number {
  // Length guard is load-bearing, not defensive padding. Entries written by an
  // older embedder are a different width; the loop below would read past `a`
  // into `undefined`, produce NaN, and fail the `>= 0.92` threshold for every
  // candidate — the cache would report "no match" forever with no error.
  if (a.length !== b.length || a.length === 0) return 0
  let dot = 0, normA = 0, normB = 0
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i]
    normA += a[i] * a[i]
    normB += b[i] * b[i]
  }
  const denom = Math.sqrt(normA) * Math.sqrt(normB)
  return denom === 0 ? 0 : dot / denom
}

/**
 * Embed a prompt with the shared local ONNX embedder.
 *
 * Same model as the vector store and the knowledge graph, so one 33 MB download
 * covers all three and the cosine here means the same thing it means there.
 * The exact-match tier is unaffected by failure, so an embed error degrades to
 * exact-only rather than failing the call.
 */
async function getEmbedding(text: string): Promise<number[]> {
  const v = await embedQuery(text)
  if (v.length !== EMBED_DIM) {
    throw new Error(`embedder returned ${v.length} dims, expected ${EMBED_DIM}`)
  }
  return v
}

function tokenCount(text: string): number {
  return Math.ceil(text.length / 4)
}

/** Build a canonical key for exact-match check */
function buildExactKey(agentType: string, taskPrompt: string, filePaths: string[]): string {
  const taskHash = crypto.createHash("sha256").update(taskPrompt).digest("hex").substring(0, 16)
  const fileHash = hashFiles(filePaths)
  return CacheManager.key(agentType, taskHash, fileHash)
}

// ─── Tool Definition ─────────────────────────────────────────────────────

export default tool({
  description: "Semantic similarity cache for subagent outputs — embedding-based near-match detection via the local in-process ONNX embedder (Xenova/bge-small-en-v1.5, 384-dim, no daemon). Two-tier: exact SHA-256 match first, then 0.92 cosine fallback. Saves API calls by returning cached results for semantically similar task prompts on unchanged files.",
  args: {
    action: tool.schema.string().describe(`Action. Valid: ${VALID_ACTIONS.join(", ")}`),
    agentType: tool.schema.string().optional().describe("Agent type (e.g., 'executor', 'code-reviewer')"),
    taskPrompt: tool.schema.string().optional().describe("The task prompt sent to the subagent"),
    output: tool.schema.string().optional().describe("Subagent output to cache (for save action)"),
    filePaths: tool.schema.array(tool.schema.string()).optional().describe("File paths the subagent worked on (for invalidation on file change)"),
  },
  async execute(args, context) {
    const projectRoot = context.directory || process.cwd()
    const agentCache = getCache("agent", projectRoot)

    switch (args.action) {
      // ── SAVE ──────────────────────────────────────────────────────────
      case "save": {
        if (!args.agentType || !args.taskPrompt || !args.output) {
          return JSON.stringify({ success: false, error: "agentType, taskPrompt, and output required for save" })
        }
        const filePaths = args.filePaths || []
        const exactKey = buildExactKey(args.agentType, args.taskPrompt, filePaths)

        // Also save to the exact-match agent cache (fast path for exact repeats)
        agentCache.set(exactKey, args.output, 1_800_000)

        // Save to semantic cache
        try {
          const vector = await getEmbedding(args.taskPrompt)
          const index = loadIndex(projectRoot)

          // Remove any existing entry with the same exact key
          index.entries = index.entries.filter(e => e.key !== exactKey)

          index.entries.push({
            key: exactKey,
            agentType: args.agentType,
            prompt: args.taskPrompt,
            vectorB64: vectorToBase64(vector),
            output: args.output,
            fileHashes: hashFiles(filePaths),
            savedAt: new Date().toISOString(),
            lastAccess: new Date().toISOString(),
          })

          // Keep max 500 entries (prune least recently used first)
          if (index.entries.length > 500) {
            index.entries.sort((a, b) => new Date(a.lastAccess || a.savedAt).getTime() - new Date(b.lastAccess || b.savedAt).getTime())
            index.entries = index.entries.slice(-500)
          }

          saveIndex(projectRoot, index)
          return JSON.stringify({ success: true, action: "save", key: exactKey, agentType: args.agentType })
        } catch (err: any) {
          // Embedding failed — exact-match cache is still saved, that's fine
          return JSON.stringify({ success: true, action: "save", key: exactKey, semanticFallback: false, warning: err.message })
        }
      }

      // ── LOAD ──────────────────────────────────────────────────────────
      case "load": {
        if (!args.agentType || !args.taskPrompt) {
          return JSON.stringify({ success: false, error: "agentType and taskPrompt required for load" })
        }
        const filePaths = args.filePaths || []
        const exactKey = buildExactKey(args.agentType, args.taskPrompt, filePaths)

        // Tier 1: Exact-match check (fast path)
        const exactCached = agentCache.get<string>(exactKey)
        if (exactCached) {
          try {
            const parsed = JSON.parse(exactCached)
            if (parsed.output) {
              return JSON.stringify({ success: true, action: "load", hit: true, tier: "exact", output: parsed.output })
            }
          } catch {
            return JSON.stringify({ success: true, action: "load", hit: true, tier: "exact", output: exactCached })
          }
        }

        // Tier 2: Semantic similarity check
        try {
          const vector = await getEmbedding(args.taskPrompt)
          const index = loadIndex(projectRoot)
          const candidates = index.entries.filter(e => e.agentType === args.agentType)

          if (candidates.length === 0) {
            return JSON.stringify({ success: true, action: "load", hit: false, tier: "none", reason: "no-candidates" })
          }

          let best: { entry: SemanticEntry; similarity: number } | null = null
          const vec = new Float32Array(vector)
          const scanStart = Date.now()

          for (const entry of candidates) {
            const entryVec = base64ToVector(entry.vectorB64)
            const sim = cosineSimilarity(vec, entryVec)
            if (sim >= SIMILARITY_THRESHOLD && (!best || sim > best.similarity)) {
              best = { entry, similarity: sim }
            }
          }

          // Record scan metrics for stats/monitoring (deferred-HNSW trigger)
          const scanMs = Date.now() - scanStart
          try {
            const statsPath = path.join(projectRoot, ".opencode", "cache", "semantic", "scan-stats.json")
            ensureDir(statsPath)
            fs.writeFileSync(statsPath, JSON.stringify({
              lastScanMs: scanMs,
              candidatesConsidered: candidates.length,
              timestamp: new Date().toISOString(),
            }), "utf-8")
          } catch { /* best-effort — don't block load on stats write */ }

          if (best) {
            // Verify files haven't changed
            const currentHashes = hashFiles(filePaths)
            if (currentHashes === best.entry.fileHashes) {
              // Promote to exact-match cache for faster future lookups
              agentCache.set(exactKey, best.entry.output, 1_800_000)

              // Update lastAccess time for LRU tracking
              best.entry.lastAccess = new Date().toISOString()
              saveIndex(projectRoot, index)

              return JSON.stringify({
                success: true, action: "load", hit: true, tier: "semantic",
                similarity: Math.round(best.similarity * 1000) / 1000,
                output: best.entry.output,
                savedAt: best.entry.savedAt,
              })
            } else {
              // Files changed — remove stale entry
              index.entries = index.entries.filter(e => e.key !== best!.entry.key)
              saveIndex(projectRoot, index)
            }
          }
        } catch (err: any) {
          // Embedding failed — fall through to miss
          return JSON.stringify({ success: true, action: "load", hit: false, tier: "none", reason: `embed-error: ${err.message}` })
        }

        return JSON.stringify({ success: true, action: "load", hit: false, tier: "none", reason: "no-match" })
      }

      // ── INVALIDATE ────────────────────────────────────────────────────
      case "invalidate": {
        if (!args.agentType && !args.taskPrompt) {
          // Clear everything
          saveIndex(projectRoot, { version: INDEX_VERSION, entries: [] })
          agentCache.clear()
          return JSON.stringify({ success: true, action: "invalidate", cleared: "all" })
        }

        if (args.taskPrompt) {
          const key = buildExactKey(args.agentType || "general", args.taskPrompt, args.filePaths || [])
          // Remove from semantic index
          const index = loadIndex(projectRoot)
          index.entries = index.entries.filter(e => e.key !== key)
          saveIndex(projectRoot, index)
          // Invalidate from exact-match cache
          if (args.agentType) agentCache.invalidatePrefix(args.agentType)
          return JSON.stringify({ success: true, action: "invalidate", key })
        }

        if (args.agentType) {
          // Invalidate all entries for this agent type
          const index = loadIndex(projectRoot)
          index.entries = index.entries.filter(e => e.agentType !== args.agentType)
          saveIndex(projectRoot, index)
          agentCache.invalidatePrefix(args.agentType)
          return JSON.stringify({ success: true, action: "invalidate", agentType: args.agentType })
        }

        return JSON.stringify({ success: false, error: "provide agentType, taskPrompt, or neither (clear all) to invalidate" })
      }

      // ── STATS ─────────────────────────────────────────────────────────
      case "stats": {
        const index = loadIndex(projectRoot)
        const agentStats = agentCache.getStats()
        const totalTokens = index.entries.reduce((sum, e) => sum + tokenCount(e.output), 0)

        // Read scan metrics (last load scan timing)
        let scanStats: { lastScanMs?: number; candidatesConsidered?: number; timestamp?: string } | null = null
        try {
          const statsPath = path.join(projectRoot, ".opencode", "cache", "semantic", "scan-stats.json")
          scanStats = JSON.parse(fs.readFileSync(statsPath, "utf-8"))
        } catch { /* no stats yet */ }

        return JSON.stringify({
          success: true,
          action: "stats",
          semanticEntries: index.entries.length,
          // Naming the model and width in `stats` is what makes a dimension
          // mismatch diagnosable instead of looking like a cache that never hits.
          semanticModel: EMBED_MODEL_KEY,
          semanticDim: EMBED_DIM,
          estimatedTokensCached: totalTokens,
          exactMatchHits: agentStats.hits,
          exactMatchMisses: agentStats.misses,
          lastScanMs: scanStats?.lastScanMs ?? null,
          candidatesConsidered: scanStats?.candidatesConsidered ?? null,
          lastScanTimestamp: scanStats?.timestamp ?? null,
          hnswRecommended: scanStats?.lastScanMs !== undefined && scanStats.lastScanMs > 100,
        })
      }

      default:
        return JSON.stringify({ success: false, error: `Unknown action: ${args.action}` })
    }
  }
})
