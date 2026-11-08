/**
 * Redaction at the persistence boundary. Checkpoints and savings rows are
 * written to disk and may later be injected into a prompt, so credentials are
 * removed before they are stored, not when they are read.
 */

const PATTERNS: Array<[RegExp, string]> = [
  [/\b(sk-[A-Za-z0-9_-]{16,})\b/g, "[REDACTED_KEY]"],
  [/\b(gh[pousr]_[A-Za-z0-9]{20,})\b/g, "[REDACTED_TOKEN]"],
  [/\b(xox[baprs]-[A-Za-z0-9-]{10,})\b/g, "[REDACTED_TOKEN]"],
  [/\b(AKIA[0-9A-Z]{16})\b/g, "[REDACTED_KEY]"],
  [/\b(Bearer\s+)[A-Za-z0-9._~+/=-]{20,}/gi, "$1[REDACTED]"],
  [/\b(password|passwd|pwd|secret|token|api[_-]?key)\s*[:=]\s*["']?[^\s"']{6,}/gi, "$1=[REDACTED]"],
  [/\b-----BEGIN [A-Z ]*PRIVATE KEY-----[\s\S]*?-----END [A-Z ]*PRIVATE KEY-----/g, "[REDACTED_PRIVATE_KEY]"],
]

export function redact(text: string): string {
  let out = text
  for (const [pattern, replacement] of PATTERNS) out = out.replace(pattern, replacement)
  return out
}

/** Remove control characters that can forge prompt fences. */
export function scrubControl(text: string): string {
  return text.replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, " ")
}
