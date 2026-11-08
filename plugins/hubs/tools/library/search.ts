/**
 * library/search.ts — metadata + full-text scoring.
 *
 * No embeddings and no BM25 index: semantic retrieval is `graphQuery`'s job.
 * This ranks captured pages by where the query appears so `library-docs` can
 * decide whether a fetch is necessary at all.
 */

import type { Frontmatter } from "./schema.ts"

export interface SearchablePage {
  id: string
  data: Frontmatter
  body: string
}

export interface SearchHit {
  id: string
  title: string
  collection: string
  source_url: string
  source_type: string
  revision: number
  retrieved_at: string
  summary: string
  score: number
  headings: string[]
}

function count(haystack: string, needle: string): number {
  if (!needle) return 0
  let total = 0
  let index = haystack.indexOf(needle)
  while (index !== -1) {
    total++
    index = haystack.indexOf(needle, index + needle.length)
  }
  return total
}

export function scorePage(page: SearchablePage, query: string): SearchHit | null {
  const needle = query.trim().toLowerCase()
  if (!needle) return null

  const title = String(page.data.title ?? page.id).toLowerCase()
  const summary = String(page.data.summary ?? "").toLowerCase()
  const tags = (Array.isArray(page.data.tags) ? page.data.tags : []).join(" ").toLowerCase()
  const body = page.body.toLowerCase()

  const headings = page.body
    .split(/\r?\n/)
    .filter((line) => /^#{2,3}\s/.test(line))
    .map((line) => line.replace(/^#{2,3}\s+/, "").trim())
  const headingMatches = headings.filter((heading) => heading.toLowerCase().includes(needle))

  const score =
    (title.includes(needle) ? 10 : 0) +
    (tags.includes(needle) ? 3 : 0) +
    (summary.includes(needle) ? 4 : 0) +
    headingMatches.length * 2 +
    Math.min(count(body, needle), 8)

  if (score === 0) return null

  return {
    id: page.id,
    title: String(page.data.title ?? page.id),
    collection: String(page.data.collection ?? page.id.split("/")[0]),
    source_url: String(page.data.source_url ?? ""),
    source_type: String(page.data.source_type ?? ""),
    revision: Number(page.data.revision ?? 1),
    retrieved_at: String(page.data.retrieved_at ?? ""),
    summary: String(page.data.summary ?? ""),
    score,
    headings: headingMatches.slice(0, 8),
  }
}
