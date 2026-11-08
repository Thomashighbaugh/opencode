/**
 * library/schema.ts — frontmatter parsing, normalisation and identity.
 *
 * Deliberately no YAML dependency: the document frontmatter is a flat map of
 * scalars and string arrays that this module both writes and reads. Keeping the
 * parser here means the hub package stays self-contained.
 */

import { createHash } from "node:crypto"

export type Frontmatter = Record<string, unknown>

export interface ParsedDocument {
  data: Frontmatter
  body: string
}

const NUMERIC_KEYS = new Set(["revision", "part", "refresh_after_days"])

function unquote(value: string): string {
  const trimmed = value.trim()
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    if (trimmed.startsWith('"')) {
      try {
        return JSON.parse(trimmed)
      } catch {
        return trimmed.slice(1, -1)
      }
    }
    return trimmed.slice(1, -1)
  }
  return trimmed
}

function parseValue(key: string, raw: string): unknown {
  const value = raw.trim()
  if (value === "null" || value === "~") return null
  if (value === "true") return true
  if (value === "false") return false
  if (value.startsWith("[") && value.endsWith("]")) {
    const inner = value.slice(1, -1).trim()
    if (!inner) return []
    return inner.split(",").map((item) => unquote(item))
  }
  if (NUMERIC_KEYS.has(key) && /^-?\d+$/.test(value)) return Number(value)
  return unquote(value)
}

export function parseDocument(text: string): ParsedDocument {
  const match = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/.exec(text)
  if (!match) return { data: {}, body: text }
  const data: Frontmatter = {}
  for (const line of match[1]!.split(/\r?\n/)) {
    if (!line.trim() || /^\s*#/.test(line)) continue
    const entry = /^([A-Za-z0-9_-]+):\s*(.*)$/.exec(line)
    if (!entry) continue
    data[entry[1]!] = parseValue(entry[1]!, entry[2] ?? "")
  }
  return { data, body: match[2] ?? "" }
}

function scalar(key: string, value: unknown): string {
  if (value === null || value === undefined) return "null"
  if (Array.isArray(value)) {
    return `[${value.map((item) => JSON.stringify(String(item))).join(", ")}]`
  }
  if (typeof value === "number" || typeof value === "boolean") return String(value)
  const text = String(value)
  if (text === "" || /[:#[\]{}]/.test(text) || text !== text.trim()) return JSON.stringify(text)
  return text
}

const ORDER = [
  "title",
  "type",
  "collection",
  "source_url",
  "source_type",
  "retrieved_at",
  "content_sha256",
  "content_type",
  "language",
  "version",
  "revision",
  "tags",
  "summary",
  "status",
  "refresh_after_days",
  "document",
  "part",
  "created",
  "updated",
  "sources",
]

export function stringifyDocument(data: Frontmatter, body: string): string {
  const keys = [...ORDER.filter((key) => key in data), ...Object.keys(data).filter((key) => !ORDER.includes(key))]
  const lines = keys.map((key) => `${key}: ${scalar(key, data[key])}`)
  return `---\n${lines.join("\n")}\n---\n\n${body.replace(/^\n+/, "")}`
}

/** Whitespace-only normalisation, for hash stability. Content is otherwise untouched. */
export function normalizeMarkdown(body: string): string {
  return body
    .replace(/\r\n/g, "\n")
    .replace(/[ \t]+$/gm, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
}

export function contentHash(body: string): string {
  return createHash("sha256").update(normalizeMarkdown(body), "utf8").digest("hex")
}

export function urlHash(url: string): string {
  return createHash("sha1").update(url, "utf8").digest("hex").slice(0, 6)
}

export function slugify(title: string): string {
  const base = title
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64)
    .replace(/-+$/g, "")
  return base || "document"
}

export function identityKey(url: string, language?: string, version?: string): string {
  return `${url.trim()}|${(language ?? "").trim()}|${(version ?? "").trim()}`
}

export function identityHash(url: string, language?: string, version?: string): string {
  return createHash("sha256").update(identityKey(url, language, version), "utf8").digest("hex")
}

export function today(): string {
  return new Date().toISOString().slice(0, 10)
}

/** First prose paragraph, for `summary` when the caller did not supply one. */
export function deriveSummary(body: string, limit = 240): string {
  for (const block of normalizeMarkdown(body).split(/\n{2,}/)) {
    if (/^#{1,6}\s/.test(block) || /^```/.test(block) || /^[-*|]/.test(block)) continue
    const text = block.replace(/\s+/g, " ").trim()
    if (text) return text.length > limit ? `${text.slice(0, limit - 1)}…` : text
  }
  return "Untitled document"
}

export const REQUIRED_FIELDS = [
  "title",
  "collection",
  "source_url",
  "source_type",
  "retrieved_at",
  "content_sha256",
  "summary",
  "status",
] as const

export function missingFields(data: Frontmatter): string[] {
  return REQUIRED_FIELDS.filter((field) => data[field] === undefined || data[field] === null || data[field] === "")
}
