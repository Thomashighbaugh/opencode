/** Embeddings through the existing in-process ONNX runtime. No model name is pinned here. */
import { embed, embedQuery, EMBED_DIM, EMBED_MODEL_ID, embedderInfo } from "../../../skills/vectorize-context/scripts/embedder.ts"
import { isCached } from "../../../skills/vectorize-context/scripts/onnx-runtime.ts"

export { EMBED_DIM }

export async function embedTexts(texts: string[]): Promise<number[][]> {
  return embed(texts)
}

export async function embedOne(text: string): Promise<number[] | null> {
  try {
    // Query-time must never download a model. Learning may populate it first.
    if (!isCached(EMBED_MODEL_ID)) return null
    const v = await embedQuery(text)
    return v.length ? v : null
  } catch {
    return null
  }
}

export function embeddingMeta() {
  return embedderInfo()
}
