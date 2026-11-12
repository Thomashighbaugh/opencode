/**
 * Simple local reranker for memory recall results.
 *
 * Uses sigmoid scoring over (query, document) pairs. If the ONNX runtime is
 * available it can be extended to use a cross-encoder model; for now it falls
 * back to a deterministic token-overlap score so recall always works without
 * any model.
 */

import { sigmoid } from "../../../skills/vectorize-context/scripts/zero-shot.ts"

const STOP = new Set("the a an is are was were be been being have has had do does did will would shall should may might must can could to of in for on with at by from as into about like through after over between out up down that this it its my your his her we they them what which who when where how not no but or and if then so than too very just i me let us".split(/\s+/))

function tokens(text: string): Set<string> {
  return new Set(
    text
      .toLowerCase()
      .replace(/[^a-z0-9\s_.-]/g, " ")
      .split(/\s+/)
      .filter((w) => w.length > 2 && !STOP.has(w)),
  )
}

export interface RerankResult {
  document: string
  score: number
}

/**
 * Score each document against the query. Returns results sorted by score desc.
 * Uses token overlap (Jaccard-like) as a cheap, dependency-free scorer.
 */
export function rerank(query: string, documents: string[]): RerankResult[] {
  const qTokens = tokens(query)
  if (qTokens.size === 0) {
    return documents.map((d, i) => ({ document: d, score: 1 - i * 0.01 }))
  }

  return documents
    .map((doc) => {
      const dTokens = tokens(doc)
      const intersection = [...qTokens].filter((t) => dTokens.has(t)).length
      const union = new Set([...qTokens, ...dTokens]).size
      const score = union === 0 ? 0 : intersection / union
      return { document: doc, score: sigmoid(score * 4 - 1) } // sigmoid centers ~0.25 overlap
    })
    .sort((a, b) => b.score - a.score)
}
