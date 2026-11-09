/** Local cross-encoder rerank over the shared ONNX cache. Optional; ANN order is the fallback. */
import path from "node:path"
import fs from "node:fs"
import { cacheRoot, isCached, REQUIRED_MODELS } from "../../../skills/vectorize-context/scripts/onnx-runtime.ts"

const MODEL = process.env.RERANK_MODEL || REQUIRED_MODELS.reranker
const DISABLED = process.env.RERANK_DISABLED === "1"
let loading: Promise<{ tokenizer: any; model: any }> | null = null

function cached(): boolean {
  return isCached(MODEL)
}

async function get() {
  if (DISABLED) throw new Error("RERANK_DISABLED=1")
  if (!cached()) throw new Error(`rerank model not cached: ${MODEL}`)
  if (!loading) {
    loading = (async () => {
      const { AutoTokenizer, AutoModel, env } = await import("@huggingface/transformers")
      env.cacheDir = cacheRoot()
      const tokenizer = await AutoTokenizer.from_pretrained(MODEL)
      const model = await AutoModel.from_pretrained(MODEL, { dtype: "q8" })
      return { tokenizer, model }
    })()
  }
  return loading
}

export async function rerank(query: string, documents: string[]): Promise<number[]> {
  if (documents.length < 2) return documents.map(() => 0)
  const { tokenizer, model } = await get()
  const enc = await tokenizer(documents.map(() => query), { text_pair: documents, padding: true, truncation: true })
  const { logits } = await model(enc)
  const data = Array.from(logits.data as Float32Array)
  return data.map((v) => 1 / (1 + Math.exp(-Number(v))))
}

export function rerankInfo() {
  return { model: MODEL, cached: cached(), disabled: DISABLED }
}
