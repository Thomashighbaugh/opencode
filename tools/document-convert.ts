/**
 * document-convert.ts — mechanical document → markdown/JSON conversion.
 *
 * Everything here runs locally in-process: no network calls, no model calls, no
 * tokens. PDF text comes from unpdf (pdf.js), DOCX from mammoth, legacy DOC and
 * ODT from their container formats, EPUB from its OPF spine, RTF from a small
 * control-word stripper, and HTML through Turndown.
 *
 * Two deliberate shapes:
 *
 *   - `format: "markdown"` returns the converted document **verbatim**, not a
 *     JSON envelope. Wrapping markdown in JSON escapes every newline and roughly
 *     doubles the tokens the caller has to read.
 *   - `format: "json"` returns page/chapter structure for callers that need it.
 *
 * Large documents are truncated at `maxChars` (default 150k) with an explicit
 * marker, so a 900-page PDF cannot silently swallow a context window. Pass
 * `output` to write the full conversion to disk and get a small summary back.
 */

import { tool } from "@opencode-ai/plugin"
import * as fs from "fs"
import * as path from "path"
import { extractText, getDocumentProxy, getMeta } from "unpdf"
import mammoth from "mammoth"
import TurndownService from "turndown"
// @ts-ignore — ships no types
import { gfm } from "turndown-plugin-gfm"
import JSZip from "jszip"
// @ts-ignore — ships no types
import WordExtractor from "word-extractor"
import { XMLParser } from "fast-xml-parser"

type OutputFormat = "markdown" | "json"

interface Page {
  page: number
  text: string
}

interface Chapter {
  index: number
  title: string
  text: string
}

interface ConvertedDoc {
  kind: string
  metadata: Record<string, unknown>
  text: string
  pages?: Page[]
  chapters?: Chapter[]
  warnings?: string[]
}

const SUPPORTED = new Map<string, string>([
  [".pdf", "pdf"],
  [".epub", "epub"],
  [".docx", "docx"],
  [".doc", "doc"],
  [".odt", "odt"],
  [".rtf", "rtf"],
  [".html", "html"],
  [".htm", "html"],
  [".xhtml", "html"],
  [".md", "markdown"],
  [".markdown", "markdown"],
  [".txt", "text"],
])

const XML = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
  removeNSPrefix: true,
  trimValues: true,
  parseTagValue: false,
})

// ODT body order matters — paragraphs and headings interleave. The default
// parser groups repeated tags by name, which moves every heading to the end, so
// content.xml uses preserveOrder and a small ordered walker.
const XML_ORDERED = new XMLParser({
  preserveOrder: true,
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
  removeNSPrefix: true,
  // Trimming here deletes the spaces that sit in their own text nodes around
  // inline spans, turning "a test document" into "atestdocument".
  trimValues: false,
  parseTagValue: false,
})

const TURNDOWN = new TurndownService({
  headingStyle: "atx",
  codeBlockStyle: "fenced",
  bulletListMarker: "-",
  emDelimiter: "*",
  hr: "---",
})
TURNDOWN.use(gfm)
TURNDOWN.remove(["script", "style", "noscript", "iframe", "object"])

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

function arr<T>(value: T | T[] | undefined | null): T[] {
  if (value === undefined || value === null) return []
  return Array.isArray(value) ? value : [value]
}

function text(value: unknown): string {
  if (value === undefined || value === null) return ""
  if (typeof value === "string") return value
  if (typeof value === "number" || typeof value === "boolean") return String(value)
  if (Array.isArray(value)) return value.map(text).join("")
  if (typeof value === "object") {
    const node = value as Record<string, unknown>
    if ("#text" in node) return String(node["#text"])
  }
  return ""
}

function clean(input: string): string {
  return input
    .replace(/\r\n?/g, "\n")
    // PDFs with broken font maps emit NULs and other C0 controls into the text
    // stream; they are never content and they poison JSON consumers.
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
}

function unwrapTableCells(html: string): string {
  // Turndown's GFM table rule treats a block element inside a cell as a new
  // row. Mammoth (and many HTML sources) wrap every cell in <p>, so strip those
  // wrappers before conversion or the table collapses into empty cells.
  return html.replace(/<(t[dh])\b([^>]*)>([\s\S]*?)<\/\1>/gi, (_match, tag, attrs, inner) => {
    const unwrapped = String(inner)
      .replace(/<\/?p\b[^>]*>/gi, "")
      .replace(/<br\s*\/?>/gi, " ")
      .trim()
    return `<${tag}${attrs}>${unwrapped}</${tag}>`
  })
}

function htmlToMarkdown(html: string): string {
  const stripped = html.replace(/<\?xml[^>]*\?>/gi, "").replace(/<!DOCTYPE[^>]*>/gi, "")
  // XHTML documents carry a <title> in <head>; converting the whole document
  // leaks the filename into the body as text.
  const bodyMatch = /<body\b[^>]*>([\s\S]*?)<\/body>/i.exec(stripped)
  const body = unwrapTableCells(bodyMatch ? bodyMatch[1] : stripped)
  const markdown = TURNDOWN.turndown(body)
  return clean(markdown.replace(/!\[[^\]]*\]\([^)]*\)/g, "")) // drop images
}

function safeMeta(input: unknown): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  if (!input || typeof input !== "object") return out
  for (const [key, value] of Object.entries(input as Record<string, unknown>)) {
    if (value === null || value === undefined) continue
    const kind = typeof value
    if (kind === "string" || kind === "number" || kind === "boolean") {
      const v = String(value)
      if (v.length <= 500) out[key] = value
    }
  }
  return out
}

function parsePageRange(spec: string | undefined, total: number): number[] {
  if (!spec || !spec.trim()) return Array.from({ length: total }, (_, i) => i + 1)
  const picked = new Set<number>()
  for (const part of spec.split(",")) {
    const chunk = part.trim()
    if (!chunk) continue
    const range = /^(\d+)\s*-\s*(\d+)$/.exec(chunk)
    if (range) {
      const start = Math.max(1, Number(range[1]))
      const end = Math.min(total, Number(range[2]))
      for (let p = start; p <= end; p++) picked.add(p)
    } else if (/^\d+$/.test(chunk)) {
      const p = Number(chunk)
      if (p >= 1 && p <= total) picked.add(p)
    }
  }
  return [...picked].sort((a, b) => a - b)
}

// ---------------------------------------------------------------------------
// PDF
// ---------------------------------------------------------------------------

async function convertPdf(buffer: Buffer, pageSpec?: string): Promise<ConvertedDoc> {
  // verbosity 0 keeps pdf.js font warnings off stdout — a tool's output must be
  // the conversion, not the extractor's diagnostics.
  const pdf = await getDocumentProxy(new Uint8Array(buffer), { verbosity: 0 })
  let metadata: Record<string, unknown> = {}
  try {
    const meta = await getMeta(pdf)
    metadata = { ...safeMeta(meta.info), ...safeMeta(meta.metadata) }
  } catch {
    // Metadata is optional; text extraction is not.
  }

  const extracted = await extractText(pdf, { mergePages: false })
  const total = extracted.totalPages
  const selected = parsePageRange(pageSpec, total)
  const all = extracted.text
  const pages: Page[] = selected.map((page) => ({
    page,
    text: clean(all[page - 1] ?? ""),
  }))
  const text = pages.map((p) => p.text).filter(Boolean).join("\n\n")

  return { kind: "pdf", metadata: { ...metadata, pages: total }, pages, text }
}

// ---------------------------------------------------------------------------
// DOCX / DOC
// ---------------------------------------------------------------------------

async function docxMetadata(buffer: Buffer): Promise<Record<string, unknown>> {
  try {
    const zip = await JSZip.loadAsync(buffer)
    const core = zip.file("docProps/core.xml")
    if (!core) return {}
    const parsed = XML.parse(await core.async("text"))
    const props = parsed?.coreProperties ?? {}
    const metadata: Record<string, unknown> = {}
    for (const key of ["title", "subject", "creator", "description", "keywords", "created", "modified", "lastModifiedBy"]) {
      const value = text(props[key])
      if (value) metadata[key] = value
    }
    return metadata
  } catch {
    return {}
  }
}

async function convertDocx(buffer: Buffer): Promise<ConvertedDoc> {
  const warnings: string[] = []
  const metadata = await docxMetadata(buffer)
  const result = await mammoth.convertToHtml(
    { buffer },
    {
      ignoreEmptyParagraphs: true,
      convertImage: mammoth.images.imgElement(async () => ({ src: "", alt: "" })),
    },
  )
  for (const message of result.messages) {
    if (message.type === "warning" || message.type === "error") {
      warnings.push(`${message.type}: ${message.message}`)
    }
  }
  return {
    kind: "docx",
    metadata,
    text: htmlToMarkdown(result.value),
    warnings: warnings.length ? warnings.slice(0, 10) : undefined,
  }
}

async function convertDoc(buffer: Buffer): Promise<ConvertedDoc> {
  const extractor = new WordExtractor()
  const doc = await extractor.extract(buffer)
  const parts = [
    clean(doc.getBody() ?? ""),
    clean(doc.getFootnotes() ?? ""),
    clean(doc.getEndnotes() ?? ""),
    clean(doc.getHeaders() ?? ""),
  ].filter(Boolean)
  return { kind: "doc", metadata: {}, text: parts.join("\n\n") }
}

// ---------------------------------------------------------------------------
// EPUB
// ---------------------------------------------------------------------------

function resolveHref(baseFile: string, href: string): string {
  const decoded = decodeURIComponent(href.split("#")[0])
  return path.posix.normalize(path.posix.join(path.posix.dirname(baseFile), decoded))
}

async function convertEpub(buffer: Buffer): Promise<ConvertedDoc> {
  const zip = await JSZip.loadAsync(buffer)

  const containerFile = zip.file("META-INF/container.xml")
  if (!containerFile) throw new Error("EPUB is missing META-INF/container.xml")
  const container = XML.parse(await containerFile.async("text"))
  const rootfile = arr(container?.container?.rootfiles?.rootfile)[0] as Record<string, unknown> | undefined
  const opfPath = rootfile?.["@_full-path"]
  if (typeof opfPath !== "string" || !opfPath) throw new Error("EPUB container has no rootfile path")

  const opfFile = zip.file(opfPath)
  if (!opfFile) throw new Error(`EPUB OPF not found: ${opfPath}`)
  const pkg = XML.parse(await opfFile.async("text"))?.package as Record<string, any> | undefined
  if (!pkg) throw new Error("EPUB OPF is empty or unreadable")

  const rawMeta = pkg.metadata ?? {}
  const metadata: Record<string, unknown> = {}
  for (const key of ["title", "creator", "language", "publisher", "date", "identifier", "description", "rights"]) {
    const value = text(rawMeta[key])
    if (value) metadata[key] = value
  }

  const manifest = new Map<string, { href: string; mediaType?: string }>()
  for (const item of arr(pkg.manifest?.item) as Record<string, any>[]) {
    const id = item?.["@_id"]
    const href = item?.["@_href"]
    if (typeof id === "string" && typeof href === "string") {
      manifest.set(id, { href, mediaType: item?.["@_media-type"] })
    }
  }

  const chapters: Chapter[] = []
  let index = 0
  for (const itemref of arr(pkg.spine?.itemref) as Record<string, any>[]) {
    const idref = itemref?.["@_idref"]
    if (typeof idref !== "string") continue
    const entry = manifest.get(idref)
    if (!entry) continue
    if (entry.mediaType && !/xhtml|html|xml/i.test(entry.mediaType)) continue

    const file = zip.file(resolveHref(opfPath, entry.href))
    if (!file) continue

    const html = await file.async("text")
    const markdown = htmlToMarkdown(html)
    if (!markdown) continue

    index += 1
    const heading = /^#{1,6}\s+(.+)$/m.exec(markdown)
    chapters.push({
      index,
      title: heading?.[1]?.trim() || path.posix.basename(entry.href, path.posix.extname(entry.href)),
      text: markdown,
    })
  }

  const body = chapters
    .map((chapter) => {
      const startsWithHeading = new RegExp(`^#{1,6}\\s+${escapeRegex(chapter.title)}\\s*$`, "m").test(chapter.text)
      return startsWithHeading ? chapter.text : `## ${chapter.title}\n\n${chapter.text}`
    })
    .join("\n\n")

  return { kind: "epub", metadata, chapters, text: body, warnings: chapters.length ? undefined : ["No readable spine documents found"] }
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}

// ---------------------------------------------------------------------------
// ODT
// ---------------------------------------------------------------------------

function orderedText(children: unknown): string {
  if (!Array.isArray(children)) return ""
  let out = ""
  for (const child of children) {
    if (!child || typeof child !== "object") continue
    const node = child as Record<string, unknown>
    if ("#text" in node) {
      out += String(node["#text"])
      continue
    }
    const attrs = (node[":@"] as Record<string, unknown> | undefined) ?? {}
    for (const [tag, value] of Object.entries(node)) {
      if (tag === "#text" || tag === ":@" || tag.startsWith("@_")) continue
      if (tag === "s") out += " ".repeat(Math.max(1, Number(attrs["@_c"] ?? 1)))
      else if (tag === "tab") out += "\t"
      else if (tag === "line-break") out += "\n"
      else if (tag === "a") {
        const href = attrs["@_href"]
        const label = orderedText(value)
        out += typeof href === "string" && href ? `[${label}](${href})` : label
      } else {
        out += orderedText(value)
      }
    }
  }
  return out
}

function walkOdt(nodes: unknown, out: string[], bullet = ""): void {
  if (!Array.isArray(nodes)) return
  for (const child of nodes) {
    if (!child || typeof child !== "object") continue
    const node = child as Record<string, unknown>
    if ("#text" in node) continue
    const attrs = (node[":@"] as Record<string, unknown> | undefined) ?? {}
    for (const [tag, value] of Object.entries(node)) {
      if (tag === "#text" || tag === ":@" || tag.startsWith("@_")) continue
      if (tag === "p") {
        const line = clean(orderedText(value))
        if (line) out.push(`${bullet}${line}`)
      } else if (tag === "h") {
        const level = Math.min(6, Math.max(1, Number(attrs["@_outline-level"] ?? 1)))
        const line = clean(orderedText(value))
        if (line) out.push(`${"#".repeat(level)} ${line}`)
      } else if (tag === "list") {
        walkOdt(value, out, `${bullet}- `)
      } else {
        walkOdt(value, out, bullet)
      }
    }
  }
}

async function convertOdt(buffer: Buffer): Promise<ConvertedDoc> {
  const zip = await JSZip.loadAsync(buffer)
  const content = zip.file("content.xml")
  if (!content) throw new Error("ODT is missing content.xml")
  const parsed = XML_ORDERED.parse(await content.async("text"))
  const lines: string[] = []
  walkOdt(parsed, lines)
  const body = lines.reduce((acc, line) => {
    if (!acc) return line
    const previous = acc.slice(acc.lastIndexOf("\n") + 1)
    const separator = line.startsWith("- ") && previous.startsWith("- ") ? "\n" : "\n\n"
    return `${acc}${separator}${line}`
  }, "")

  let metadata: Record<string, unknown> = {}
  const metaFile = zip.file("meta.xml")
  if (metaFile) {
    const meta = XML.parse(await metaFile.async("text"))?.document_meta ?? {}
    for (const key of ["title", "creator", "subject", "description", "creation_date", "generator"]) {
      const value = text(meta[key])
      if (value) metadata[key] = value
    }
  }
  return { kind: "odt", metadata, text: clean(body) }
}

// ---------------------------------------------------------------------------
// RTF
// ---------------------------------------------------------------------------

const RTF_SKIP = new Set([
  "fonttbl", "colortbl", "stylesheet", "info", "pict", "object", "header", "footer",
  "footnote", "endnote", "fldinst", "listtable", "listoverridetable",
  "rsidtbl", "generator", "xmlnstbl", "themedata", "colorschememapping",
  "latentstyles", "datastore", "mmathPr", "filetbl", "revtbl", "pn",
])

function rtfToText(source: string): string {
  let out = ""
  let i = 0
  while (i < source.length) {
    const ch = source[i]

    if (ch === "{") {
      const rest = source.slice(i + 1)
      const destination = /^\\\*?([a-zA-Z]+)/.exec(rest)
      const unicodeSkip = /^\\u(-?\d+)/.exec(rest)
      if (unicodeSkip) {
        const code = Number(unicodeSkip[1])
        out += String.fromCharCode(code < 0 ? code + 65536 : code)
        i += 1 + unicodeSkip[0].length
        // Skip the ANSI fallback character, if present.
        if (source[i] === "?") i += 1
        continue
      }
      if (rest.startsWith("\\*") || (destination && RTF_SKIP.has(destination[1]))) {
        let depth = 0
        while (i < source.length) {
          if (source[i] === "{") depth += 1
          else if (source[i] === "}") {
            depth -= 1
            if (depth === 0) {
              i += 1
              break
            }
          }
          i += 1
        }
        continue
      }
      i += 1
      continue
    }

    if (ch === "}") {
      i += 1
      continue
    }

    if (ch === "\\") {
      const word = /^\\([a-zA-Z]+)(-?\d+)? ?/.exec(source.slice(i))
      if (word) {
        const name = word[1]
        i += word[0].length
        if (name === "par" || name === "line" || name === "page") out += "\n"
        else if (name === "tab") out += "\t"
        else if (name === "u") {
          const code = Number(word[2] ?? 0)
          out += String.fromCharCode(code < 0 ? code + 65536 : code)
        }
        continue
      }
      if (source[i + 1] === "'") {
        out += String.fromCharCode(parseInt(source.slice(i + 2, i + 4), 16))
        i += 4
        continue
      }
      if (source[i + 1] === "\\" || source[i + 1] === "{" || source[i + 1] === "}") {
        out += source[i + 1]
        i += 2
        continue
      }
      i += 2
      continue
    }

    if (ch !== "\r" && ch !== "\n") out += ch
    i += 1
  }
  return clean(out)
}

// ---------------------------------------------------------------------------
// Dispatch
// ---------------------------------------------------------------------------

async function convertFile(file: string): Promise<ConvertedDoc> {
  const extension = path.extname(file).toLowerCase()
  const kind = SUPPORTED.get(extension)
  if (!kind) throw new Error(`Unsupported extension "${extension || "(none)"}". Supported: ${[...SUPPORTED.keys()].join(", ")}`)

  if (kind === "markdown" || kind === "text") {
    return { kind, metadata: {}, text: clean(fs.readFileSync(file, "utf8")) }
  }

  const buffer = fs.readFileSync(file)
  switch (kind) {
    case "pdf":
      return convertPdf(buffer)
    case "docx":
      return convertDocx(buffer)
    case "doc":
      return convertDoc(buffer)
    case "epub":
      return convertEpub(buffer)
    case "odt":
      return convertOdt(buffer)
    case "rtf":
      return { kind, metadata: {}, text: rtfToText(buffer.toString("latin1")) }
    case "html":
      return { kind, metadata: {}, text: htmlToMarkdown(buffer.toString("utf8")) }
    default:
      throw new Error(`No converter for ${kind}`)
  }
}

async function convertFileWithPages(file: string, pageSpec?: string): Promise<ConvertedDoc> {
  const extension = path.extname(file).toLowerCase()
  if (extension === ".pdf" && pageSpec) {
    return convertPdf(fs.readFileSync(file), pageSpec)
  }
  return convertFile(file)
}

function expandPath(input: string): string {
  if (input === "~") return process.env.HOME ?? input
  if (input.startsWith("~/")) return path.join(process.env.HOME ?? "", input.slice(2))
  return input
}

function listFiles(target: string, recursive: boolean): string[] {
  const stat = fs.statSync(target)
  if (stat.isFile()) return [target]
  if (!stat.isDirectory()) throw new Error(`Not a file or directory: ${target}`)

  const found: string[] = []
  const walk = (dir: string) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (entry.name.startsWith(".")) continue
      const full = path.join(dir, entry.name)
      if (entry.isDirectory()) {
        if (recursive) walk(full)
      } else if (SUPPORTED.has(path.extname(entry.name).toLowerCase())) {
        found.push(full)
      }
    }
  }
  walk(target)
  return found.sort()
}

function truncate(content: string, maxChars: number): { content: string; truncated: boolean; omitted: number } {
  if (content.length <= maxChars) return { content, truncated: false, omitted: 0 }
  const omitted = content.length - maxChars
  return {
    content: `${content.slice(0, maxChars)}\n\n[truncated: ${omitted} of ${content.length} characters omitted]`,
    truncated: true,
    omitted,
  }
}

function ok(data: Record<string, unknown>) {
  return JSON.stringify({ success: true, ...data })
}

function err(message: string) {
  return JSON.stringify({ success: false, error: message })
}

export default tool({
  description:
    "Convert PDF, EPUB, DOC, DOCX, ODT, RTF, HTML, or text files to markdown or structured JSON locally and deterministically — no model calls, no tokens spent on parsing. Supports a single file or a whole directory.",
  args: {
    path: tool.schema.string().describe("File or directory to convert (absolute or relative to workspace)"),
    format: tool.schema
      .string()
      .optional()
      .describe(
        'Output format: "markdown" (default, returned raw) or "json" (structured; inline JSON truncates text and indexes pages/chapters — use output for the full structure)',
      ),
    output: tool.schema
      .string()
      .optional()
      .describe("Optional path to write the full conversion to. Returns a summary instead of the content"),
    pages: tool.schema.string().optional().describe('PDF page selection, e.g. "1-5,8,12-14" (default: all pages)'),
    maxChars: tool.schema.number().optional().describe("Maximum characters returned inline (default: 150000)"),
    recursive: tool.schema.boolean().optional().describe("Recurse into subdirectories when path is a directory (default: false)"),
  },
  async execute(args) {
    const target = args.path?.trim()
    if (!target) return err("path is required")

    const format = (args.format || "markdown").toLowerCase() as OutputFormat
    if (format !== "markdown" && format !== "json") return err('format must be "markdown" or "json"')

    const maxChars = Number.isFinite(args.maxChars) && (args.maxChars as number) > 0 ? Math.floor(args.maxChars as number) : 150000

    let files: string[]
    try {
      files = listFiles(expandPath(target), Boolean(args.recursive))
    } catch (error: any) {
      return err(`Cannot read path: ${error.message}`)
    }
    if (files.length === 0) return err(`No supported documents found in ${target}`)

    const documents: Array<{ path: string; doc: ConvertedDoc }> = []
    const failures: Array<{ path: string; error: string }> = []

    for (const file of files) {
      try {
        documents.push({ path: file, doc: await convertFileWithPages(file, args.pages) })
      } catch (error: any) {
        failures.push({ path: file, error: error?.message ?? String(error) })
      }
    }

    if (documents.length === 0) {
      return err(`No documents converted. ${failures.map((f) => `${f.path}: ${f.error}`).join("; ")}`)
    }

    if (format === "json") {
      if (args.output) {
        const payload = {
          success: true,
          documents: documents.map(({ path: file, doc }) => ({
            path: file,
            kind: doc.kind,
            metadata: doc.metadata,
            pages: doc.pages,
            chapters: doc.chapters,
            warnings: doc.warnings,
            chars: doc.text.length,
            text: doc.text,
          })),
          failures: failures.length ? failures : undefined,
        }
        const content = JSON.stringify(payload, null, 2)
        const resolved = path.resolve(expandPath(args.output))
        fs.mkdirSync(path.dirname(resolved), { recursive: true })
        fs.writeFileSync(resolved, content)
        return ok({
          output: resolved,
          documents: documents.length,
          failures: failures.length,
          chars: content.length,
        })
      }

      // Inline JSON must stay parseable, so text is truncated per document
      // rather than cutting the serialized payload mid-string.
      let budget = Math.max(200, Math.floor(maxChars / documents.length))
      let content = ""
      for (let attempt = 0; attempt < 6; attempt++) {
        const payload = {
          success: true,
          documents: documents.map(({ path: file, doc }) => {
            const cut = truncate(doc.text, budget)
            return {
              path: file,
              kind: doc.kind,
              metadata: doc.metadata,
              // Page/chapter arrays carry their own copy of the text. Inline we
              // return the index only; `output` writes the full structure.
              pageCount: doc.pages?.length,
              chapterCount: doc.chapters?.length,
              chapters: doc.chapters?.map((chapter) => ({ index: chapter.index, title: chapter.title })),
              warnings: doc.warnings,
              chars: doc.text.length,
              truncated: cut.truncated || undefined,
              omitted: cut.omitted || undefined,
              text: cut.content,
            }
          }),
          failures: failures.length ? failures : undefined,
        }
        content = JSON.stringify(payload, null, 2)
        if (content.length <= maxChars) break
        budget = Math.max(200, Math.floor(budget * 0.7))
      }
      return content
    }

    const combined = documents
      .map(({ path: file, doc }) => {
        if (documents.length === 1) return doc.text
        return `# ${path.basename(file)}\n\n${doc.text}`
      })
      .join("\n\n---\n\n")

    if (args.output) {
      const resolved = path.resolve(expandPath(args.output))
      fs.mkdirSync(path.dirname(resolved), { recursive: true })
      fs.writeFileSync(resolved, combined)
      return ok({
        output: resolved,
        documents: documents.length,
        failures: failures.length,
        chars: combined.length,
        words: combined.split(/\s+/).filter(Boolean).length,
      })
    }

    const result = truncate(combined, maxChars)
    let response = result.content
    if (failures.length > 0) {
      response += `\n\n[${failures.length} file(s) failed: ${failures.map((f) => `${path.basename(f.path)} (${f.error})`).join(", ")}]`
    }
    return response
  },
})
