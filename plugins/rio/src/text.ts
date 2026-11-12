/** Small text helpers shared across the plugin. */

export function words(text: string): number {
  return text.split(/\s+/).filter((w) => w.length > 0).length
}

export function oneLine(text: string): string {
  return String(text ?? "").replace(/\s+/g, " ").trim()
}

export function redact(text: string): string {
  return String(text ?? "").replace(/(sk-[A-Za-z0-9]{20,}|sk-proj-[A-Za-z0-9_-]{20,}|ghp_[A-Za-z0-9]{20,}|[A-Za-z0-9+/]{40,})/g, "[redacted]")
}

export function safePath(p: string): string {
  return String(p ?? "").replace(/\/\.\.\//g, "/_")
}

export function round1(n: number): number { return Math.round(n * 10) / 10 }
