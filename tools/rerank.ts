import { tool } from "@opencode-ai/plugin"

interface RerankArgs {
  query: string
  documents: string[]
  model?: string
  topK?: number
  ollamaUrl?: string
}

interface RerankResponse {
  results: Array<{
    index: number
    relevance_score: number
  }>
}

export default tool({
  description: "Rerank documents against a query using Ollama's /api/rerank endpoint. Takes query + document list, returns scored+ranked results. Uses locally-hosted reranker model (e.g. bge-reranker-v2-m3).",
  args: {
    query: tool.schema.string().describe("The query to score documents against"),
    documents: tool.schema.array(tool.schema.string()).describe("Array of document texts to rerank"),
    model: tool.schema.string().optional().describe("Ollama reranker model name (default: hans-tech/bge-reranker-v2-m3:260522)"),
    topK: tool.schema.number().optional().describe("Return only top K results (default: all, sorted by score descending)"),
    ollamaUrl: tool.schema.string().optional().describe("Ollama API base URL (default: http://127.0.0.1:11434)"),
  },
  async execute(args: RerankArgs, context) {
    const model = args.model || "hans-tech/bge-reranker-v2-m3:260522"
    const baseUrl = (args.ollamaUrl || "http://127.0.0.1:11434").replace(/\/+$/, "")
    const url = `${baseUrl}/api/rerank`
    const topK = args.topK ?? args.documents.length

    if (!args.query.trim()) {
      return JSON.stringify({ ok: false, error: "query is required" })
    }
    if (!args.documents.length) {
      return JSON.stringify({ ok: false, error: "at least one document required" })
    }

    const body = JSON.stringify({
      model,
      query: args.query,
      documents: args.documents,
    })

    let res: globalThis.Response
    try {
      res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body,
      })
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      return JSON.stringify({ ok: false, error: `Ollama connection failed: ${msg}` })
    }

    if (!res.ok) {
      const text = await res.text().catch(() => "unknown")
      return JSON.stringify({ ok: false, error: `Ollama rerank error (${res.status}): ${text}` })
    }

    let data: RerankResponse
    try {
      data = await res.json() as RerankResponse
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      return JSON.stringify({ ok: false, error: `Failed to parse Ollama response: ${msg}` })
    }

    if (!data.results || !Array.isArray(data.results)) {
      return JSON.stringify({ ok: false, error: "Ollama returned malformed rerank response" })
    }

    // Sort by relevance_score descending, take topK
    const sorted = data.results
      .sort((a, b) => b.relevance_score - a.relevance_score)
      .slice(0, topK)

    // Attach original document text to each result
    const enriched = sorted.map(r => ({
      index: r.index,
      score: r.relevance_score,
      text: args.documents[r.index] || "",
    }))

    return JSON.stringify({
      ok: true,
      model,
      query: args.query,
      total_input: args.documents.length,
      returned: enriched.length,
      results: enriched,
    })
  },
})
