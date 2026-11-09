/** Regex-first scrubbing; optional local ONNX PII/injection heads when already cached. */
import { classifySequence, extractEntities, isInjection, sensitiveSpans } from "../../../skills/vectorize-context/scripts/classifiers.ts"
import { isCached, OPTIONAL_MODELS } from "../../../skills/vectorize-context/scripts/onnx-runtime.ts"

const PATTERNS: Array<[RegExp, string]> = [
  [/\b(sk-[A-Za-z0-9_-]{16,})\b/g, "[REDACTED_KEY]"],
  [/\b(gh[pousr]_[A-Za-z0-9]{20,})\b/g, "[REDACTED_TOKEN]"],
  [/\b(xox[baprs]-[A-Za-z0-9-]{10,})\b/g, "[REDACTED_TOKEN]"],
  [/\b(AKIA[0-9A-Z]{16})\b/g, "[REDACTED_KEY]"],
  [/\b(Bearer\s+)[A-Za-z0-9._~+/=-]{20,}/gi, "$1[REDACTED]"],
  [/\b(password|passwd|pwd|secret|token|api[_-]?key)\s*[:=]\s*["']?[^\s"']{6,}/gi, "$1=[REDACTED]"],
  [/\b-----BEGIN [A-Z ]*PRIVATE KEY-----[\s\S]*?-----END [A-Z ]*PRIVATE KEY-----/g, "[REDACTED_PRIVATE_KEY]"],
  [/\b[\w.+-]+@[\w-]+\.[\w.-]+\b/g, "[REDACTED_EMAIL]"],
]

export function scrub(text: string): string {
  let out = text
  for (const [re, replacement] of PATTERNS) out = out.replace(re, replacement)
  return out
}

export async function inspect(text: string): Promise<{ text: string; private: boolean; untrusted: boolean }> {
  let out = scrub(text)
  let privateFlag = false
  if (isCached(OPTIONAL_MODELS.pii.id, OPTIONAL_MODELS.pii.cachedFile)) {
    try {
      const spans = await extractEntities(out)
      const sensitive = sensitiveSpans(spans)
      if (sensitive.length) {
        privateFlag = true
        for (const span of sensitive) {
          if (span.text) out = out.split(span.text).join("[REDACTED_PII]")
        }
      }
    } catch {}
  }
  let untrusted = false
  if (isCached(OPTIONAL_MODELS.injection.id, OPTIONAL_MODELS.injection.cachedFile)) {
    try {
      untrusted = isInjection(await classifySequence(out))
    } catch {}
  }
  return { text: out, private: privateFlag, untrusted }
}
