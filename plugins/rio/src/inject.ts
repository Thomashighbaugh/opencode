/**
 * Memory injection and promotion helpers.
 *
 * These are pulled out of index.ts so each feature can be tested on its own,
 * in the shape the user actually hits it:
 *   - recall the memories relevant to THIS turn's prompt (not the first one)
 *   - inject them into context automatically, embedded + reranked via recall
 *   - promote extracted decisions to durable memory as they happen
 *   - report loaded / total for the sidebar row
 *
 * No inference happens here. Embedding and rerank are the local ONNX path used
 * by MemoryService.recall.
 */

import fs from "node:fs"
import path from "node:path"

import type { MemoryService } from "./memory.ts"

export type MemoryBlock = { text: string; loaded: number; total: number }

/** The most recent user prompt in a session's short history. */
export function latestPrompt(history: readonly string[] | undefined): string {
  if (!history || history.length === 0) return ""
  return String(history[history.length - 1] ?? "")
}

/**
 * Build the context block for the current prompt. Returns the block text plus
 * how many memories were loaded and how many exist, so the caller can both
 * inject and report. Empty prompt or no hits yields an empty block.
 */
export async function memoryContextBlock(
  memory: MemoryService,
  prompt: string,
  opts: { limit?: number; project?: string | null } = {},
): Promise<MemoryBlock & { hits: Awaited<ReturnType<MemoryService["recall"]>> }> {
  // Default to a global search. MemoryService.project falls back to "default"
  // while memories are stored under the real project id (or NULL/empty), so a
  // strict default-scoped recall silently missed every memory. Passing null
  // searches all projects; an explicit project still narrows it.
  const project = opts.project === undefined ? null : opts.project
  const total = memory.stats(project).total
  const query = (prompt ?? "").trim()
  if (!query) return { text: "", loaded: 0, total, hits: [] }

  const hits = await memory.recall({ query, limit: opts.limit ?? 5, project })
  const relevant = hits.filter((h) => h.score > 0)
  if (relevant.length === 0) return { text: "", loaded: 0, total, hits: [] }

  const text = [
    "## Active Memories (rio)",
    ...relevant.map((h) => `- [${h.category}] ${h.content.slice(0, 200)}`),
    "",
  ].join("\n")

  return { text, loaded: relevant.length, total, hits: relevant }
}

/**
 * Persist extracted decisions to durable memory as they occur, rather than
 * waiting for compaction. MemoryDb.addMemory dedups identical content by
 * reinforcing the existing row, so re-promoting the same decision is safe.
 */
export async function promoteDecisions(
  memory: MemoryService,
  decisions: readonly string[],
  project?: string | null,
): Promise<number> {
  let stored = 0
  const seen = new Set<string>()
  for (const raw of decisions) {
    const content = String(raw ?? "").trim()
    if (!content || seen.has(content)) continue
    seen.add(content)
    try {
      await memory.learn({
        content,
        title: `Decision: ${content.slice(0, 60)}${content.length > 60 ? "..." : ""}`,
        category: "architecture",
        origin: "agent-observation",
        project: project === undefined ? undefined : project,
      })
      stored++
    } catch {
      // Learning is additive; a failure never blocks the turn.
    }
  }
  return stored
}

/** Sidebar row text for the memory system. */
export function memorySidebarLine(loaded: number, total: number): string {
  const l = Math.max(0, Math.floor(loaded))
  const t = Math.max(0, Math.floor(total))
  return `memory · ${l}/${t} loaded`
}

export type MemoryState = { sessionID: string; loaded: number; total: number; at: number }

/** Where the server writes the per-session loaded/total counts for the TUI. */
export function memoryStatePath(directory: string): string {
  return path.join(directory, ".opencode", "state", "rio", "memory.json")
}

export function writeMemoryState(directory: string, state: MemoryState): void {
  try {
    const file = memoryStatePath(directory)
    fs.mkdirSync(path.dirname(file), { recursive: true })
    fs.writeFileSync(file, JSON.stringify(state))
  } catch {
    // A read-only state dir must not break the turn.
  }
}

export function readMemoryState(directory: string, sessionID?: string): MemoryState | null {
  try {
    const raw = fs.readFileSync(memoryStatePath(directory), "utf-8")
    const parsed = JSON.parse(raw) as MemoryState
    if (!parsed || typeof parsed.loaded !== "number" || typeof parsed.total !== "number") return null
    if (sessionID && parsed.sessionID && parsed.sessionID !== sessionID) return null
    return parsed
  } catch {
    return null
  }
}
