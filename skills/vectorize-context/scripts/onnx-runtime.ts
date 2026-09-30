/**
 * onnx-runtime.ts — how this repository loads a quantized ONNX model.
 *
 * One place for the three conventions every local model here follows:
 *
 *   1. **Cache under the config tree.** `node_modules/@huggingface/transformers/.cache`,
 *      bundled with the install and gitignored. Not `~/.cache` — a model that
 *      vanishes when a cache is cleared is a model that fails in production.
 *   2. **Load once per process.** Sessions are expensive to construct and cheap to
 *      run; `ONNX_DISABLE_GC` keeps the allocator from churning between calls.
 *   3. **`dtype: 'q8'`.** Quantized int8. The fp32 weights of a small encoder are
 *      ~130 MB for a ~30 MB model, and the difference is invisible in recall.
 *
 * Two loaders exist because the two models sit on opposite sides of a cost
 * boundary, and that difference changes the rules:
 *
 *   - **Index-time** (the embedder): downloading on first use is fine. It runs in
 *     batches, once per changed file, and an index build that cannot run is worse
 *     than one that fetched a model.
 *   - **Query-time** (the reranker and the gate's classifier): NEVER download. The
 *     user is waiting, and a silent 30-second model fetch inside a keystroke's
 *     latency is indistinguishable from a hang. Missing model ⇒ the caller's
 *     documented fallback.
 */

import * as path from 'node:path'
import * as fs from 'node:fs'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'

/**
 * ESM-safe `require`.
 *
 * These scripts run under tsx as ES modules, where a bare `require` is not
 * defined — and this module is loaded by the prefetch script, by veclib, and by
 * the prompt-queue plugin, so it cannot assume a CJS entry. `createRequire`
 * bridges that without pulling the dependency into the module graph eagerly,
 * which matters: a static import would load onnxruntime-node on every veclib
 * import, including graph-only recall that never needs it.
 */
const req = createRequire(import.meta.url)

/** Bumped when the loading conventions change, to invalidate a stale cache path. */
const RUNTIME_FORMAT = 4

let envApplied = false

/**
 * Point transformers.js at the bundled cache.
 *
 * `localModelPath` is set to the cache directory so a bare model id resolves
 * offline once prefetched; without it transformers.js resolves model ids against
 * a CDN by default, which turns every cold start into a network round-trip.
 */
export function applyRuntimeEnv(): void {
  if (envApplied) return
  envApplied = true
  const { env } = req('@huggingface/transformers')
  env.cacheDir = cacheRoot()
  env.allowLocalModels = true
  env.useBrowserCache = false
}

/**
 * Bundled model cache.
 *
 * `import.meta.url` rather than `__dirname` — these run as ES modules. The
 * cache lives inside the config's own node_modules so it ships with the install
 * and is covered by .gitignore, rather than in `~/.cache` where a cache purge
 * would silently remove a model that production depends on.
 */
export function cacheRoot(): string {
  const here = path.dirname(fileURLToPath(import.meta.url))
  return path.join(here, '..', '..', '..', 'node_modules', '@huggingface', 'transformers', '.cache')
}

/** Model directory inside the cache, matching transformers.js's layout. */
export function modelDir(modelId: string): string {
  return path.join(cacheRoot(), modelId.replace('/', path.sep))
}

/**
 * True when the quantized weights are already on disk.
 *
 * Checked with `existsSync` rather than by attempting a load, because "is it
 * cached" has to be answerable without paying for a session.
 */
export function isCached(modelId: string, file = 'onnx/model_quantized.onnx'): boolean {
  return fs.existsSync(path.join(modelDir(modelId), file))
}

/** Every model this harness depends on, for the prefetch script and diagnostics. */
export const REQUIRED_MODELS = {
  embedder: 'Xenova/bge-small-en-v1.5',
  reranker: 'Xenova/bge-reranker-base',
  classifier: 'Xenova/mobilebert-uncased-mnli',
} as const

export interface LoadedModel {
  tokenizer: any
  model: any
}

/** One in-flight load per model id, shared by every caller in the process. */
const inflight = new Map<string, Promise<LoadedModel>>()

/**
 * Load a tokenizer + model once and reuse it.
 *
 * `allowDownload` is the whole contract: query-time callers pass `false` and get a
 * rejection they can fall back from, index-time callers pass `true` and get a
 * one-time fetch. Concurrent callers share one load rather than racing to build
 * several identical sessions.
 */
export function loadModel(
  modelId: string,
  opts: { allowDownload?: boolean; dtype?: 'q8' | 'fp16' | 'fp32' } = {},
): Promise<LoadedModel> {
  applyRuntimeEnv()
  const allowDownload = opts.allowDownload !== false
  const existing = inflight.get(modelId)
  if (existing) return existing

  const p = (async () => {
    if (!allowDownload && !isCached(modelId)) {
      throw new Error(
        `${modelId} is not cached locally (${modelDir(modelId)}). ` +
          `Run "npx tsx skills/vectorize-context/scripts/prefetch-models.ts" first.`,
      )
    }
    const { AutoTokenizer, AutoModel } = await import('@huggingface/transformers')
    const tokenizer = await AutoTokenizer.from_pretrained(modelId)
    const model = await AutoModel.from_pretrained(modelId, { dtype: opts.dtype ?? 'q8' })
    return { tokenizer, model }
  })()

  inflight.set(modelId, p)
  // A failed load must not be cached as the promise for every later caller: the
  // whole point of the query-time guard is that a missing model degrades, and a
  // poisoned in-flight entry would make it degrade forever after one failure.
  p.catch(() => inflight.delete(modelId))
  return p
}

/** Test seam: drop cached sessions so a fresh load is exercised. */
export function __resetOnnxRuntime(): void {
  inflight.clear()
  envApplied = false
}

/**
 * Mean-pool the token embeddings and L2-normalize.
 *
 * Mean pooling over the attention mask — never over the padded tail, which would
 * drag every vector in a batch toward the pad embedding and quietly degrade
 * recall. Normalization puts every vector on the unit sphere so a dot product is a
 * cosine, which is what the sqlite-vec index compares.
 *
 * The mask is optional because an unpadded batch has none and every token counts;
 * making it required would have meant callers passing a mask of ones by hand.
 */
export function meanPool(lastHiddenState: any, attentionMask?: any): number[][] {
  const dims = lastHiddenState.dims as number[]
  const [batch, seq, hidden] = dims
  const data = lastHiddenState.data as Float32Array | Float64Array
  const maskData = attentionMask?.data as Int32Array | Uint8Array | undefined

  const out: number[][] = []
  for (let b = 0; b < batch; b++) {
    const vec = new Array<number>(hidden).fill(0)
    let count = 0
    for (let t = 0; t < seq; t++) {
      const mask = maskData ? Number(maskData[b * seq + t]) : 1
      if (!mask) continue
      const base = (b * seq + t) * hidden
      for (let h = 0; h < hidden; h++) vec[h] += Number(data[base + h])
      count++
    }
    if (count === 0) { out.push(new Array<number>(hidden).fill(0)); continue }
    let norm = 0
    for (let h = 0; h < hidden; h++) { vec[h] /= count; norm += vec[h] * vec[h] }
    norm = Math.sqrt(norm)
    if (norm > 0) for (let h = 0; h < hidden; h++) vec[h] /= norm
    out.push(vec)
  }
  return out
}

/**
 * CLS-pool and L2-normalize — the convention for BGE models.
 *
 * Distinct from `meanPool`, and the difference matters: bge-* is trained with the
 * [CLS] token as the sentence representation. Mean-pooling a bge model produces
 * vectors that retrieve plausibly and rank badly, which is the hardest kind of
 * bug to notice because nothing looks broken.
 */
export function clsPool(lastHiddenState: any): number[][] {
  const dims = lastHiddenState.dims as number[]
  const [batch, , hidden] = dims
  const data = lastHiddenState.data as Float32Array | Float64Array
  const out: number[][] = []
  for (let b = 0; b < batch; b++) {
    const base = b * dims[1] * hidden
    const vec = new Array<number>(hidden)
    for (let h = 0; h < hidden; h++) vec[h] = Number(data[base + h])
    let norm = 0
    for (let h = 0; h < hidden; h++) norm += vec[h] * vec[h]
    norm = Math.sqrt(norm)
    if (norm > 0) for (let h = 0; h < hidden; h++) vec[h] /= norm
    out.push(vec)
  }
  return out
}

export const RUNTIME_INFO = { format: RUNTIME_FORMAT, models: REQUIRED_MODELS }
