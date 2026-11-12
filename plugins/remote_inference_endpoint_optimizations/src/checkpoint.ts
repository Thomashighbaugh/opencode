/**
 * Checkpoint content builder — serializes session state for pre-compaction
 * capture and post-compaction restore.
 */

import type { SessionRow } from "./db/opencode.ts"
import { oneLine, redact, safePath } from "./text.ts"

export function buildCheckpointContent(input: {
  trigger: string
  sessionID: string
  mode: string
  quality: number | null
  fillPct: number | null
  activeFiles: string[]
  userTexts: string[]
}): string {
  const topics = input.userTexts.slice(-5).reverse().map((m) =>
    redact(m).replace(/<[^>]*>/g, " ").replace(/[^\w\s.,;:!?()'"-]/g, " ").replace(/\s+/g, " ").trim().slice(0, 300),
  ).filter((m) => m.length > 10)
  const lines = [
    `# Checkpoint: ${input.trigger}`,
    `Session: ${input.sessionID.replace(/[^a-zA-Z0-9_-]/g, "_")}`,
    `Mode: ${input.mode}`,
    `Quality: ${input.quality === null ? "N/A" : Math.round(input.quality)}/100`,
    `Fill: ${input.fillPct === null ? "N/A" : Math.round(input.fillPct * 100)}%`,
  ]
  if (topics.length) lines.push("", "## Topic Summary", topics.join(" | "))
  lines.push("", "## Active Files", ...input.activeFiles.slice(0, 15).map((f) => `- ${safePath(redact(f))}`))
  return lines.join("\n")
}
