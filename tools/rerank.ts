/**
 * rerank.ts — cross-encoder reranking, local ONNX by default.
 *
 * This tool was the last Ollama-dependent surface in an otherwise daemon-free
 * retrieval stack. The embedder, the gate classifier, and veclib's internal
 * reranker all run in-process on ONNX Runtime, so with Ollama stopped they kept
 * working — but `rerank`, the tool an agent calls directly, failed with
 * `ECONNREFUSED`. Retrieval that works until you ask it a question directly is
 * the worst failure shape: the gap only shows up on the path that matters.
 *
 * Two backends, one contract:
 *
 *   - **onnx** (default) — `Xenova/bge-reranker-base` in-process, q8, sigmoid on
 *     the single logit per pair. Same convention as `veclib.rerankDocuments`, so
 *     scores from this tool and from `graphQuery` are comparable. Never
 *     downloads: a model fetch inside a turn is indistinguishable from a hang.
 *   - **ollama** (opt-in) — POSTs to `/api/rerank`. Kept for recall comparison
 *     against a different checkpoint, not as a silent fallback: an automatic
 *     fallback would hide a broken ONNX path behind a working-but-different
 *     scorer, which is how a regression survives.
 *
 * Every return value is a JSON string, and every failure is `{ok: false, error}`
 * with the real message — never an empty result set. "No results" and "the
 * scorer was down" must stay distinguishable.
 */

import { tool } from "@opencode-ai/plugin"
import { loadModel, REQUIRED_MODELS } from "../skills/vectorize-context/scripts/onnx-runtime.ts"

interface RerankArgs {
  query: string
  documents: string[]
  model?: string
  topK?: number
  backend?: "onnx" | "ollama"
  ollamaUrl?: string
}

/**
 * Logit → relevance, clamped so the result is strictly inside (0, 1).
 *
 * The clamp is not cosmetic. `Math.exp(10000)` is `Infinity`, so an unclamped
 * sigmoid returns exactly 0 for a strongly-negative logit and exactly 1 for a
 * strongly-positive one. Both are then indistinguishable from a genuine
 * "no confidence" and get sorted as if they were real scores. Clamping the
 * input to ±60 keeps the value finite (≈1e-26 at the extremes) at no cost to
 * ordering, because no logit anywhere near ±60 occurs in practice.
 */
export function sigmoid(x: number): number {
  const z = Math.max(-60, Math.min(60, x))
  return 1 / (1 + Math.exp(-z))
}

export const RERANK_ONNX_MODEL = process.env.RERANK_MODEL || REQUIRED_MODELS.reranker

/** Pairs per forward pass. bge-reranker scores every pair jointly, so this trades memory for latency. */
export const RERANK_BATCH = 16

/**
 * Score with the in-process cross-encoder.
 *
 * Throws on failure rather than degrading: the caller decides what a missing
 * scorer means, and for a tool call the honest answer is an error, not a
 * silently distance-ordered list the caller cannot distinguish from a rerank.
 */
export async function rerankOnnx(
  query: string,
  documents: string[],
  modelId = RERANK_ONNX_MODEL,
): Promise<Array<{ index: number; relevance_score: number }>> {
  const { tokenizer, model } = await loadModel(modelId, { allowDownload: false })

  const scored: Array<{ index: number; relevance_score: number }> = []
  for (let i = 0; i < documents.length; i += RERANK_BATCH) {
    const slice = documents.slice(i, i + RERANK_BATCH)
    // bge-reranker is a cross-encoder: the query is repeated per candidate and
    // paired with it. Passing documents as the primary sequence would score each
    // document in isolation and quietly return something that looks like a rerank.
    const enc = await tokenizer(slice.map(() => query), {
      text_pair: slice,
      padding: true,
      truncation: true,
    })
    const { logits } = await model(enc)
    const data = Array.from(logits.data as ArrayLike<number>)
    if (data.length !== slice.length) {
      throw new Error(
        `reranker returned ${data.length} logits for ${slice.length} pairs — ` +
          `checkpoint does not match the single-logit cross-encoder contract`,
      )
    }
    for (let k = 0; k < slice.length; k++) {
      scored.push({ index: i + k, relevance_score: sigmoid(data[k]) })
    }
  }

  return scored.sort((a, b) => b.relevance_score - a.relevance_score)
}

async function rerankViaOllama(
  query: string,
  documents: string[],
  model: string,
  baseUrl: string,
): Promise<Array<{ index: number; relevance_score: number }>> {
  const url = `${baseUrl}/api/rerank`
  let res: globalThis.Response
  try {
    res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model, query, documents }),
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    throw new Error(`Ollama connection failed: ${msg}`)
  }

  if (!res.ok) {
    const text = await res.text().catch(() => "unknown")
    throw new Error(`Ollama rerank error (${res.status}): ${text}`)
  }

  let data: { results?: Array<{ index: number; relevance_score: number }> }
  try {
    data = (await res.json()) as typeof data
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    throw new Error(`Failed to parse Ollama response: ${msg}`)
  }

  if (!data.results || !Array.isArray(data.results)) {
    throw new Error("Ollama returned malformed rerank response")
  }
  return data.results
}

export default tool({
  description:
    "Rerank documents against a query with a local in-process cross-encoder (ONNX Runtime, Xenova/bge-reranker-base q8, sigmoid scoring). No daemon and no network. Set backend=ollama to compare against an Ollama-served checkpoint instead.",
  args: {
    query: tool.schema.string().describe("The query to score documents against"),
    documents: tool.schema.array(tool.schema.string()).describe("Array of document texts to rerank"),
    model: tool.schema
      .string()
      .optional()
      .describe(
        "ONNX model id (default: Xenova/bge-reranker-base) or Ollama model tag when backend=ollama",
      ),
    topK: tool.schema
      .number()
      .optional()
      .describe("Return only top K results (default: all, sorted by score descending)"),
    backend: tool.schema
      .enum(["onnx", "ollama"])
      .optional()
      .describe("Scoring backend (default: onnx — in-process, no daemon)"),
    ollamaUrl: tool.schema
      .string()
      .optional()
      .describe("Ollama API base URL, only used when backend=ollama (default: http://127.0.0.1:11434)"),
  },
  async execute(args: RerankArgs) {
    const backend = args.backend ?? "onnx"
    const topK = args.topK ?? args.documents.length

    if (!args.query.trim()) {
      return JSON.stringify({ ok: false, error: "query is required" })
    }
    if (!args.documents.length) {
      return JSON.stringify({ ok: false, error: "at least one document required" })
    }

    let scored: Array<{ index: number; relevance_score: number }>
    let model: string
    try {
      if (backend === "ollama") {
        model = args.model || "hans-tech/bge-reranker-v2-m3:260522"
        const baseUrl = (args.ollamaUrl || "http://127.0.0.1:11434").replace(/\/+$/, "")
        scored = await rerankViaOllama(args.query, args.documents, model, baseUrl)
      } else {
        model = args.model || RERANK_ONNX_MODEL
        scored = await rerankOnnx(args.query, args.documents, model)
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      const hint =
        backend === "onnx" && /not cached/.test(msg)
          ? " Run: npx tsx skills/vectorize-context/scripts/prefetch-models.ts"
          : ""
      return JSON.stringify({ ok: false, backend, error: msg + hint })
    }

    const enriched = scored
      .sort((a, b) => b.relevance_score - a.relevance_score)
      .slice(0, topK)
      .map((r) => ({
        index: r.index,
        score: r.relevance_score,
        text: args.documents[r.index] ?? "",
      }))

    return JSON.stringify({
      ok: true,
      backend,
      model,
      query: args.query,
      total_input: args.documents.length,
      returned: enriched.length,
      results: enriched,
    })
  },
})
