/**
 * Context Intel Digest — post-compaction re-orientation without re-reads.
 * Summarizes what the model already processed so it doesn't re-read everything.
 */

import type { PartEntry } from "./db/opencode.ts"

export function buildIntelDigest(entries: PartEntry[]): string {
  const paths = new Set<string>()
  const errors: string[] = []
  const tools: string[] = []
  for (const e of entries) {
    if (e.type === "tool" && e.tool) tools.push(e.tool)
    if (e.error) errors.push(e.error)
    if (e.input?.filePath) paths.add(String(e.input.filePath))
    if (e.input?.path) paths.add(String(e.input.path))
  }
  const lines = [
    "## Context Intel",
    `Files touched: ${paths.size}`,
    `Errors: ${errors.length}`,
    `Tools used: ${[...new Set(tools)].slice(0, 10).join(", ")}`,
  ]
  if (errors.length) lines.push("", "Recent errors:", ...errors.slice(0, 3).map((e) => `- ${e}`))
  return lines.join("\n")
}
