import type { PartEntry } from "./db/opencode.ts"
import { oneLine } from "./text.ts"

/** Post-compaction digest of large tool results: recent, unreferenced, bounded. */
export function buildIntelDigest(entries: PartEntry[], max = 5): string {
  const results = entries
    .filter((e) => e.type === "tool" && (e.output?.length ?? 0) >= 4000)
    .slice(-40)
  const picked = results.slice(-max)
  if (!picked.length) return ""
  const lines = ["## Tool Result Digest (post-compaction)"]
  for (const r of picked) {
    const status = r.status ?? "completed"
    lines.push(`- ${r.tool} [${status}] ${(r.output?.length ?? 0)} chars: ${oneLine(r.output ?? "", 220)}`)
  }
  return lines.join("\n")
}
