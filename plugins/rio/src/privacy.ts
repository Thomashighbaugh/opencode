/**
 * Privacy inspection — scrub secrets/PII from text before memory storage.
 * No LLM calls, pure regex + heuristics.
 */

const SECRET_PATTERNS = [
  /sk-[A-Za-z0-9]{20,}/g,                    // OpenAI-style keys
  /sk-proj-[A-Za-z0-9_-]{20,}/g,             // OpenAI project keys
  /ghp_[A-Za-z0-9]{20,}/g,                   // GitHub personal tokens
  /gho_[A-Za-z0-9]{20,}/g,                   // GitHub OAuth tokens
  /ghu_[A-Za-z0-9]{20,}/g,                   // GitHub user tokens
  /ghs_[A-Za-z0-9]{20,}/g,                   // GitHub server tokens
  /[A-Za-z0-9+/]{40,}/g,                     // long base64 blobs (potential keys)
  /\b(?:AKIA)[A-Z0-9]{16}\b/g,               // AWS access keys
  /\b(?:xox[baprs]-)[A-Za-z0-9-]{10,}/g,     // Slack tokens
  /\b(?:pplx-)[A-Za-z0-9]{20,}/g,            // Perplexity keys
  /\b(?:sq0cs-)[A-Za-z0-9-]{20,}/g,          // Square keys
]

const REDACTED = "[redacted]"

export function inspect(text: string): {
  text: string
  private: boolean
  secrets: string[]
} {
  let cleaned = text
  const secrets: string[] = []

  for (const pat of SECRET_PATTERNS) {
    let m: RegExpExecArray | null
    while ((m = pat.exec(cleaned))) {
      secrets.push(m[0].slice(0, 8))
    }
    cleaned = cleaned.replace(pat, REDACTED)
  }

  const private_ = secrets.length > 0

  return { text: cleaned, private: private_, secrets }
}
