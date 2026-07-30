/**
 * compaction-hook.ts — Cache session compaction output to disk
 *
 * Translated from hooks/compaction/cache-compaction.sh.
 * Called from hooks.ts via the experimental.session.compacting hook.
 *
 * Saves the compaction context output to a timestamped log file under
 * .opencode/cache/compaction-logs/ so compaction artifacts survive and
 * can be inspected or replayed later.
 */
import { mkdirSync, writeFileSync } from "fs"
import { join } from "path"

/**
 * Save compaction output to a timestamped log file.
 *
 * @param directory - The project root directory
 * @param sessionId - The session ID
 * @param contextLines - The context lines that were pushed into the compaction output
 */
export function cacheCompactionOutput(
  directory: string,
  sessionId: string,
  contextLines: string[],
): string | null {
  const cacheDir = join(directory, ".opencode", "cache", "compaction-logs")
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-")
  const fileName = `compaction_${timestamp}.log`
  const filePath = join(cacheDir, fileName)

  try {
    mkdirSync(cacheDir, { recursive: true })

    const header = [
      `# Compaction Log`,
      `# Session: ${sessionId}`,
      `# Timestamp: ${new Date().toISOString()}`,
      `# Context lines: ${contextLines.length}`,
      ``,
    ].join("\n")

    const body = contextLines.join("\n\n")
    writeFileSync(filePath, `${header}\n${body}\n`)
    return filePath
  } catch {
    // Best-effort — compaction logging must never block the hook pipeline
    return null
  }
}