/** Deterministic shell-output compression. Never truncates failures. */

const ANSI = /\u001b\[[0-9;?]*[ -/]*[@-~]/g

export function compressShellOutput(input: string, maxLines = 120): { text: string; savedChars: number } {
  if (input.length < 8192) return { text: input, savedChars: 0 }
  if (/\b(error|exception|failed|denied|ENOENT|Traceback)\b/i.test(input)) return { text: input, savedChars: 0 }
  const clean = input.replace(ANSI, "")
  const lines = clean.split("\n")
  const deduped: string[] = []
  let previous = ""
  let repeats = 0
  for (const line of lines) {
    if (line === previous) {
      repeats++
      continue
    }
    if (repeats > 0) deduped.push(`[... ${repeats} duplicate line(s)]`)
    repeats = 0
    previous = line
    deduped.push(line)
  }
  if (repeats > 0) deduped.push(`[... ${repeats} duplicate line(s)]`)
  const result = deduped.length > maxLines
    ? [...deduped.slice(0, Math.floor(maxLines * 0.7)), `[... ${deduped.length - maxLines} lines omitted ...]`, ...deduped.slice(-Math.floor(maxLines * 0.3))].join("\n")
    : deduped.join("\n")
  return { text: result, savedChars: Math.max(0, input.length - result.length) }
}
