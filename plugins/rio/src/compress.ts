/**
 * Mechanical compression of large bash/shell output. Local alternative to
 * asking the model to re-read or re-summarize voluminous command output.
 */

export function compressShellOutput(text: string): { text: string; savedChars: number } {
  const trimmed = text.trim()
  if (trimmed.length <= 4096) return { text: trimmed, savedChars: 0 }
  const lines = trimmed.split("\n")
  const head = lines.slice(0, 30).join("\n")
  const tail = lines.slice(-10).join("\n")
  const compressed = [
    `... (${lines.length} lines, ${trimmed.length} chars) ...`,
    head,
    "...",
    tail,
  ].join("\n")
  return { text: compressed, savedChars: trimmed.length - compressed.length }
}
