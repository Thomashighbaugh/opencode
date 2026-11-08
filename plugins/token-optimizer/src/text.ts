import { scrubControl } from "./redact.ts"

export const CHARS_PER_TOKEN = 4
export const RESUME_CHARS_PER_TOKEN = 3.3

export function truncate(text: string, max: number, marker = "\n[... truncated]"): string {
  if (text.length <= max) return text
  let end = max
  const code = text.charCodeAt(end - 1)
  if (code >= 0xd800 && code <= 0xdbff) end--
  return text.slice(0, end) + marker
}

export function safePath(text: string, max = 512): string {
  return text
    .replace(/[^a-zA-Z0-9 /._-]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max)
}

export function oneLine(text: string, max = 200): string {
  return scrubControl(text).replace(/[\r\n]+/g, " ").slice(0, max)
}

export function words(text: string): number {
  return text.split(/\s+/).filter(Boolean).length
}

export function round1(n: number): number {
  return Math.round(n * 10) / 10
}

export function percent(n: number): string {
  return `${round1(n * 100)}%`
}

export function formatTokens(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${Math.round(n / 1_000)}K`
  return String(Math.round(n))
}
