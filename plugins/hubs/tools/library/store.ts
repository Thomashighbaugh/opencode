/**
 * library/store.ts — capture, dedupe, revisions, splitting, search and prune.
 *
 * The durable record is the markdown page under `.opencode/context/library/`.
 * Everything else (the lookup cache, the wiki catalogue, the graph, the vector
 * index) is derived. There are no content gates: a document is stored and
 * returned exactly as supplied, apart from whitespace normalisation used for
 * hashing.
 */

import fs from "node:fs"
import path from "node:path"

import {
  contentHash,
  deriveSummary,
  identityHash,
  identityKey,
  normalizeMarkdown,
  parseDocument,
  slugify,
  stringifyDocument,
  today,
  urlHash,
  type Frontmatter,
} from "./schema.ts"
import {
  archiveRoot,
  indexFile,
  libraryRoot,
  logFile,
  relativeId,
  researchRoot,
  stateDir,
} from "./paths.ts"
import { scorePage, type SearchHit } from "./search.ts"

const MAX_PAGE_BYTES = 40_000
const MAX_PARTS = 99

export interface Page {
  id: string
  path: string
  data: Frontmatter
  body: string
}

export interface IngestInput {
  directory?: string
  url: string
  markdown: string
  title?: string
  collection: string
  source_type?: string
  language?: string
  version?: string
  tags?: string[]
  summary?: string
  retrieved_at?: string
}

export interface IngestResult {
  id: string
  path: string
  revision: number
  deduped: boolean
  parts: number
}

function ensureDir(dir: string) {
  fs.mkdirSync(dir, { recursive: true })
}

function write(file: string, content: string) {
  ensureDir(path.dirname(file))
  fs.writeFileSync(file, content)
}

function walk(dir: string, out: string[] = []): string[] {
  if (!fs.existsSync(dir)) return out
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      if (entry.name === "archive") continue
      walk(full, out)
    } else if (entry.isFile() && entry.name.endsWith(".md")) {
      out.push(full)
    }
  }
  return out
}

function readPage(directory: string, file: string): Page {
  const { data, body } = parseDocument(fs.readFileSync(file, "utf-8"))
  return { id: relativeId(directory, file), path: file, data, body }
}

/** Parents only: a split document's parts are reached through `get({part})`. */
export function pages(directory?: string): Page[] {
  return walk(libraryRoot(directory))
    .map((file) => readPage(directory ?? "", file))
    .filter((page) => page.data.part === null || page.data.part === undefined)
}

export function findById(directory: string | undefined, id: string): Page | null {
  const root = libraryRoot(directory)
  const file = path.join(root, `${id}.md`)
  if (fs.existsSync(file)) return readPage(directory ?? "", file)
  const index = path.join(root, id, "index.md")
  if (fs.existsSync(index)) return readPage(directory ?? "", index)
  return null
}

export function findByIdentity(
  directory: string | undefined,
  url: string,
  language?: string,
  version?: string,
): Page | null {
  const key = identityKey(url, language, version)
  return (
    pages(directory).find(
      (page) =>
        identityKey(String(page.data.source_url ?? ""), page.data.language as string | undefined, page.data.version as string | undefined) === key,
    ) ?? null
  )
}

export function get(
  directory: string | undefined,
  input: { id?: string; url?: string; language?: string; version?: string; part?: number },
): { id: string; path: string; frontmatter: Frontmatter; body: string; part?: number } {
  const page = input.id
    ? findById(directory, input.id)
    : input.url
      ? findByIdentity(directory, input.url, input.language, input.version)
      : null
  if (!page) throw new Error(`No document for ${input.id ?? input.url ?? "(nothing)"}`)

  if (input.part !== undefined) {
    const file = path.join(path.dirname(page.path), `part-${String(input.part).padStart(2, "0")}.md`)
    if (!fs.existsSync(file)) throw new Error(`No part ${input.part} for ${page.id}`)
    const { data, body } = parseDocument(fs.readFileSync(file, "utf-8"))
    return { id: page.id, path: file, frontmatter: data, body, part: input.part }
  }

  return { id: page.id, path: page.path, frontmatter: page.data, body: page.body }
}

function firstHeading(body: string): string | undefined {
  const match = /^#\s+(.+)$/m.exec(body)
  return match?.[1]?.trim()
}

function defaultRefresh(sourceType: string | undefined): number {
  switch (sourceType) {
    case "official":
      return 30
    case "maintainer":
      return 60
    case "community":
      return 120
    case "first-party":
      return 365
    default:
      return 90
  }
}

function isStale(data: Frontmatter): boolean {
  const retrieved = Date.parse(String(data.retrieved_at ?? ""))
  if (Number.isNaN(retrieved)) return false
  const days = Number(data.refresh_after_days ?? 90)
  return Date.now() - retrieved > days * 24 * 60 * 60 * 1000
}

function notesSpan(body: string): { start: number; end: number } | null {
  const start = body.search(/^## Local notes\s*$/m)
  if (start === -1) return null
  const rest = body.slice(start + 1)
  const next = rest.search(/^## /m)
  return { start, end: next === -1 ? body.length : start + 1 + next }
}

function extractNotes(body: string): string | null {
  const span = notesSpan(body)
  return span ? body.slice(span.start, span.end).trim() : null
}

function mergeNotes(next: string, previous: string): string {
  const notes = extractNotes(previous)
  if (!notes) return next
  const span = notesSpan(next)
  const withoutNotes = (span ? next.slice(0, span.start) + next.slice(span.end) : next).trimEnd()
  return `${withoutNotes}\n\n${notes}`.trim()
}

function uniqueSlug(directory: string, collection: string, title: string, url: string, existing?: Page | null): string {
  if (existing) return existing.id.split("/").slice(1).join("/")
  const base = `${slugify(title)}-${urlHash(url)}`
  let slug = base
  let counter = 2
  while (
    fs.existsSync(path.join(libraryRoot(directory), collection, `${slug}.md`)) ||
    fs.existsSync(path.join(libraryRoot(directory), collection, slug))
  ) {
    slug = `${base}-${counter++}`
  }
  return slug
}

function appendLog(directory: string | undefined, action: string, id: string, detail: string) {
  const file = logFile(directory)
  ensureDir(path.dirname(file))
  const entry = `\n## [${today()}] library | ${action} | ${id}\n\n- **Operation**: ${detail}\n`
  fs.appendFileSync(file, entry)
}

function writeIndexCache(directory: string | undefined) {
  const entries: Record<string, unknown> = {}
  for (const page of pages(directory)) {
    const key = identityHash(
      String(page.data.source_url ?? ""),
      page.data.language as string | undefined,
      page.data.version as string | undefined,
    )
    entries[key] = {
      id: page.id,
      path: path.relative(libraryRoot(directory), page.path).replace(/\\/g, "/"),
      sha: page.data.content_sha256,
      revision: page.data.revision,
    }
  }
  const file = indexFile(directory)
  ensureDir(stateDir(directory))
  write(file, JSON.stringify({ version: 1, updated: new Date().toISOString(), entries }, null, 2))
}

function splitSections(body: string): string[] {
  return body
    .split(/(?=^## )/m)
    .map((section) => section.trim())
    .filter(Boolean)
}

function writeSplit(directory: string | undefined, collection: string, slug: string, data: Frontmatter, body: string): number {
  const root = libraryRoot(directory)
  const target = path.join(root, collection, slug)
  fs.rmSync(target, { recursive: true, force: true })

  const sections = splitSections(body)
  const intro = sections[0] && !sections[0].startsWith("## ") ? sections.shift()! : ""
  const groups: string[] = []
  let current = ""
  for (const section of sections) {
    if (current && current.length + section.length > MAX_PAGE_BYTES) {
      groups.push(current)
      current = section
    } else {
      current = current ? `${current}\n\n${section}` : section
    }
  }
  if (current) groups.push(current)
  if (groups.length === 0) groups.push(intro || body)
  if (groups.length === 1) {
    write(path.join(root, collection, `${slug}.md`), stringifyDocument(data, groups[0]!))
    return 1
  }
  if (groups.length > MAX_PARTS) throw new Error(`Document needs ${groups.length} parts (max ${MAX_PARTS}); split it upstream`)

  const contents = groups.map((_, index) => `- [Part ${index + 1}](./part-${String(index + 1).padStart(2, "0")}.md)`).join("\n")
  const indexBody = [intro, "## Contents", contents].filter(Boolean).join("\n\n")
  write(path.join(target, "index.md"), stringifyDocument({ ...data, document: null, part: null }, indexBody))

  groups.forEach((group, index) => {
    const part = index + 1
    const partData = {
      ...data,
      document: slug,
      part,
      summary: deriveSummary(group),
    }
    write(path.join(target, `part-${String(part).padStart(2, "0")}.md`), stringifyDocument(partData, group))
  })
  return groups.length
}

export function ingest(input: IngestInput): IngestResult {
  if (!input.url || !input.markdown || !input.collection) throw new Error("ingest needs url, markdown and collection")
  const directory = input.directory
  const normalized = normalizeMarkdown(input.markdown)
  const sha = contentHash(normalized)
  const existing = findByIdentity(directory, input.url, input.language, input.version)
  const retrieved = input.retrieved_at ?? today()

  if (existing && String(existing.data.content_sha256 ?? "") === sha) {
    const data: Frontmatter = { ...existing.data, retrieved_at: retrieved, updated: today() }
    write(existing.path, stringifyDocument(data, existing.body))
    writeIndexCache(directory)
    return { id: existing.id, path: existing.path, revision: Number(data.revision ?? 1), deduped: true, parts: 0 }
  }

  const title: string = input.title ?? String(existing?.data.title ?? "")
  const resolvedTitle: string = title || firstHeading(normalized) || input.url
  const slug = uniqueSlug(directory, input.collection, resolvedTitle, input.url, existing)
  const revision = existing ? Number(existing.data.revision ?? 1) + 1 : 1
  const body = existing ? mergeNotes(normalized, existing.body) : normalized

  const data: Frontmatter = {
    title: resolvedTitle,
    type: "document",
    collection: input.collection,
    source_url: input.url,
    source_type: input.source_type ?? String(existing?.data.source_type ?? "community"),
    retrieved_at: retrieved,
    content_sha256: sha,
    content_type: "text/markdown",
    language: input.language ?? (existing?.data.language as string | undefined) ?? null,
    version: input.version ?? (existing?.data.version as string | undefined) ?? null,
    revision,
    tags: input.tags ?? ((existing?.data.tags as string[] | undefined) ?? []),
    summary: input.summary ?? (String(existing?.data.summary ?? "") || deriveSummary(body)),
    status: "active",
    refresh_after_days: Number(existing?.data.refresh_after_days ?? defaultRefresh(input.source_type)),
    document: null,
    part: null,
    created: String(existing?.data.created ?? today()),
    updated: today(),
    sources: [input.url],
  }

  const id = `${input.collection}/${slug}`
  let parts = 0
  if (body.length > MAX_PAGE_BYTES && /^## /m.test(body)) {
    if (existing) fs.rmSync(existing.path, { force: true })
    parts = writeSplit(directory, input.collection, slug, data, body)
  } else {
    if (existing) fs.rmSync(existing.path, { recursive: true, force: true })
    write(path.join(libraryRoot(directory), input.collection, `${slug}.md`), stringifyDocument(data, body))
  }

  appendLog(directory, existing ? "refresh" : "ingest", id, `${resolvedTitle} — revision ${revision}${parts > 1 ? `, ${parts} parts` : ""}`)
  writeIndexCache(directory)
  return { id, path: path.join(libraryRoot(directory), input.collection, `${slug}.md`), revision, deduped: false, parts }
}

export function list(
  directory: string | undefined,
  filter: { collection?: string; tag?: string; source_type?: string; stale?: boolean } = {},
) {
  return pages(directory)
    .filter((page) => (filter.collection ? page.data.collection === filter.collection : true))
    .filter((page) => (filter.source_type ? page.data.source_type === filter.source_type : true))
    .filter((page) =>
      filter.tag ? (Array.isArray(page.data.tags) ? page.data.tags.includes(filter.tag) : false) : true,
    )
    .filter((page) => (filter.stale === undefined ? true : isStale(page.data) === filter.stale))
    .map((page) => ({
      id: page.id,
      title: String(page.data.title ?? page.id),
      collection: String(page.data.collection ?? ""),
      source_type: String(page.data.source_type ?? ""),
      revision: Number(page.data.revision ?? 1),
      retrieved_at: String(page.data.retrieved_at ?? ""),
      status: String(page.data.status ?? ""),
      stale: isStale(page.data),
    }))
}

export function search(
  directory: string | undefined,
  input: { query: string; collection?: string; tag?: string; limit?: number },
): SearchHit[] {
  const hits = pages(directory)
    .filter((page) => (input.collection ? page.data.collection === input.collection : true))
    .filter((page) => (input.tag ? (Array.isArray(page.data.tags) ? page.data.tags.includes(input.tag) : false) : true))
    .map((page) => scorePage({ id: page.id, data: page.data, body: page.body }, input.query))
    .filter((hit): hit is SearchHit => hit !== null)
    .sort((left, right) => right.score - left.score)
  return hits.slice(0, input.limit ?? 10)
}

export function annotate(directory: string | undefined, input: { id: string; note: string }) {
  const page = findById(directory, input.id)
  if (!page) throw new Error(`No document ${input.id}`)
  const note = `- ${today()}: ${input.note.trim()}`
  const body = /^## Local notes\s*$/m.test(page.body)
    ? page.body.replace(/^## Local notes\s*$/m, `## Local notes\n\n${note}`)
    : `${page.body.trimEnd()}\n\n## Local notes\n\n${note}\n`
  const data = { ...page.data, updated: today() }
  write(page.path, stringifyDocument(data, body))
  writeIndexCache(directory)
  return { id: page.id, path: page.path }
}

export function refresh(directory: string | undefined, input: { id?: string; url?: string; markdown: string; retrieved_at?: string }) {
  const page = input.id ? findById(directory, input.id) : input.url ? findByIdentity(directory, input.url) : null
  if (!page) throw new Error(`No document ${input.id ?? input.url ?? "(nothing)"}`)
  return ingest({
    directory,
    url: String(page.data.source_url ?? input.url ?? ""),
    markdown: input.markdown,
    title: String(page.data.title ?? ""),
    collection: String(page.data.collection ?? page.id.split("/")[0]),
    source_type: String(page.data.source_type ?? "community"),
    language: page.data.language as string | undefined,
    version: page.data.version as string | undefined,
    tags: page.data.tags as string[] | undefined,
    summary: String(page.data.summary ?? ""),
    retrieved_at: input.retrieved_at,
  })
}

export function prune(directory: string | undefined, input: { dry_run?: boolean } = {}) {
  const stale = pages(directory).filter((page) => isStale(page.data))
  if (input.dry_run) return { dry_run: true, stale: stale.map((page) => page.id) }

  const archived: string[] = []
  for (const page of stale) {
    const split = page.path.endsWith(`${path.sep}index.md`) || page.path.endsWith("/index.md")
    const source = split ? path.dirname(page.path) : page.path
    const target = path.join(archiveRoot(directory), page.id) + (split ? "" : ".md")
    ensureDir(path.dirname(target))
    fs.rmSync(target, { recursive: true, force: true })
    fs.renameSync(source, target)
    const file = split ? path.join(target, "index.md") : target
    const { data, body } = parseDocument(fs.readFileSync(file, "utf-8"))
    write(file, stringifyDocument({ ...data, status: "stale", updated: today() }, body))
    archived.push(page.id)
    appendLog(directory, "prune", page.id, "moved to library/archive")
  }
  writeIndexCache(directory)
  return { dry_run: false, archived }
}

function inferCollection(file: string, url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "").split(".").slice(-2, -1)[0] ?? "imported"
  } catch {
    const relative = path.relative(researchRoot(), file).replace(/\\/g, "/")
    return relative.split("/")[0] || "imported"
  }
}

export function migrate(directory: string | undefined, input: { dry_run?: boolean } = {}) {
  const changes: Array<{ path: string; id?: string }> = []
  const root = researchRoot(directory)
  if (!fs.existsSync(root)) return { dry_run: input.dry_run ?? false, changes }

  for (const file of walk(root)) {
    const { data, body } = parseDocument(fs.readFileSync(file, "utf-8"))
    if (data.type !== "source-summary") continue
    const sources = Array.isArray(data.sources) ? data.sources : []
    if (sources.length !== 1 || data.source_url) continue
    const url = String(sources[0])
    const next: Frontmatter = {
      ...data,
      type: "document",
      collection: data.collection ?? inferCollection(file, url),
      source_url: url,
      source_type: data.source_type ?? "community",
      retrieved_at: data.retrieved_at ?? data.updated ?? data.created ?? today(),
      content_sha256: data.content_sha256 ?? contentHash(body),
      content_type: "text/markdown",
      revision: data.revision ?? 1,
      updated: today(),
    }
    changes.push({ path: file, id: String(next.collection) + "/" + path.basename(file, ".md") })
    if (!input.dry_run) write(file, stringifyDocument(next, body))
  }
  if (!input.dry_run && changes.length > 0) writeIndexCache(directory)
  return { dry_run: input.dry_run ?? false, changes }
}
