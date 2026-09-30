/**
 * embedder.ts — local ONNX embeddings.
 *
 * Replaces the Ollama `/api/embed` round-trip. Three consequences, all of them
 * the point:
 *
 *   - **No daemon.** Embeddings no longer require Ollama to be running. Retrieval
 *     previously failed silently — an unreachable daemon produced zero vectors,
 *     which looked like "no results", not like "the embedder was down".
 *   - **No network.** Once cached, nothing leaves the machine.
 *   - **Batched in-process.** One session, many texts, no per-text request.
 *
 * The model is `Xenova/bge-small-en-v1.5` at int8: 384 dimensions, ~33 MB, and
 * trained for retrieval rather than classification. Pooling is CLS (see
 * `clsPool`) because that is how the bge family was trained — mean-pooling it
 * retrieves plausibly and ranks badly, which is the hardest failure to notice.
 *
 * The dimension changes from 1024 to 384, so `veclib` drops and re-embeds the
 * vector tables on first run. That path already existed and is versioned on
 * `embedding_model`/`embedding_dim`.
 */

import { clsPool, isCached, loadModel, REQUIRED_MODELS } from './onnx-runtime.ts'

export const EMBED_MODEL_ID = process.env.EMBED_ONNX_MODEL || REQUIRED_MODELS.embedder
export const EMBED_DIM = 384

/**
 * Model identifier stored in the database alongside the dimension.
 *
 * Keyed on the ONNX id, not the Ollama tag, so a store built by the previous
 * embedder is recognised as incompatible and rebuilt rather than compared against
 * 1024-dimension vectors it can never satisfy.
 */
export const EMBED_MODEL_KEY = `onnx:${EMBED_MODEL_ID}:q8`

/** Texts per forward pass. Amortizes the session call without exhausting memory. */
export const EMBED_BATCH = 32

let counter = 0

/**
 * Embed a batch of texts.
 *
 * Index-time, so `allowDownload` is true: a first run fetches ~33 MB once and an
 * index that cannot run is worse than one that fetched a model. Query paths use
 * `embedQuery`, which does not allow downloads.
 */
export async function embed(texts: string[]): Promise<number[][]> {
  if (!texts.length) return []
  const { tokenizer, model } = await loadModel(EMBED_MODEL_ID, { allowDownload: true })
  const out: number[][] = []
  for (let i = 0; i < texts.length; i += EMBED_BATCH) {
    const slice = texts.slice(i, i + EMBED_BATCH)
    const enc = await tokenizer(slice, { padding: true, truncation: true, max_length: 512 })
    const result = await model(enc)
    out.push(...clsPool(result.last_hidden_state))
  }
  counter += texts.length
  return out
}

/** Embed a single query string. */
export async function embedQuery(text: string): Promise<number[]> {
  const [v] = await embed([text])
  return v ?? []
}

/** Vectors produced this process, for diagnostics. */
export function embeddedCount(): number {
  return counter
}

export function embedderInfo() {
  return {
    backend: 'onnx',
    model: EMBED_MODEL_ID,
    key: EMBED_MODEL_KEY,
    dim: EMBED_DIM,
    cached: isCached(EMBED_MODEL_ID),
    embedded: counter,
  }
}

/** Exported for tests: the dimension must match what veclib writes into vec0. */
export const __EMBED_DIM = EMBED_DIM
