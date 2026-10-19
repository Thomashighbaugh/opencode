/**
 * codeSearch.ts — hybrid semantic code search, the grep+read replacement.
 *
 * A TypeScript port of Semble (github.com/MinishLab/semble) re-targeted at this
 * config's existing retrieval stack instead of its Python dependencies:
 *
 *   Semble (Python)               This tool (config stack)
 *   ---------------------------   ------------------------------------------
 *   model2vec static embeddings   embedder.ts — Xenova/bge-small-en-v1.5 q8
 *   vicinity dense index          in-memory cosine over the persisted matrix
 *   code-tuned rerank heuristics  rerank.ts — rerankOnnx (bge-reranker-base)
 *   tree-sitter chunking          veclib chunkCode / chunkMarkdown
 *   orjson disk cache             .opencode/state/vector/codesearch/*.json
 *
 * The pipeline is Semble's, kept faithful because the heuristics are tuned:
 *
 *   1. Walk (skip dirs + .gitignore + .sembleignore), chunk, embed, persist.
 *      Per-file mtime+size manifest: reindex only changed files.
 *   2. Hybrid retrieval: dense cosine + BM25 (Semble's tokenizer: camelCase /
 *      snake_case / PascalCase sub-token splitting), merged with RRF at an
 *      alpha auto-resolved from query shape (symbol-like -> lean BM25 0.3,
 *      natural language -> balanced 0.5).
 *   3. Boosts: multi-chunk-file coherence, definition-of-symbol boost,
 *      file-stem match, embedded-symbol boost; path penalties (test/, docs/,
 *      generated) when BM25 is in play.
 *   4. Cross-encoder rerank (never downloads on the query path) over the top
 *      candidates, snippet truncation, location-first output.
 *
 * The index lives in STATE, not context — it is derived data, gitignored, and
 * rebuilt on demand, per context-strategy.md. "Not indexed" and "no results"
 * are different return values; a failed build surfaces the error, never an
 * empty result set that looks like a negative answer.
 */

import { tool } from "@opencode-ai/plugin"
import * as fs from "node:fs"
import * as os from "node:os"
import * as path from "node:path"
import { pathToFileURL } from "node:url"

// ---------------------------------------------------------------------------
// Config-stack module loading (same dynamic-import pattern as graphQuery.ts:
// prefer the project-local provisioned copy, fall back to the global config).
// ---------------------------------------------------------------------------

const CONFIG_ROOT = path.join(os.homedir(), ".config", "opencode")
const VECLIB_REL = path.join("skills", "vectorize-context", "scripts", "veclib.ts")
const EMBEDDER_REL = path.join("skills", "vectorize-context", "scripts", "embedder.ts")
const RERANK_REL = path.join("tools", "rerank.ts")

function resolveModule(projectRoot: string, projectRel: string, globalRel: string): string {
  const candidates = [path.join(projectRoot, projectRel), path.join(CONFIG_ROOT, globalRel)]
  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) return candidate
  }
  throw new Error(`codeSearch: cannot resolve ${globalRel} (looked in ${candidates.join(", ")})`)
}

/* eslint-disable @typescript-eslint/no-explicit-any */
const mod: { veclib?: any; embedder?: any; rerank?: any } = {}

async function libs(projectRoot: string) {
  if (!mod.veclib) {
    mod.veclib = await import(
      pathToFileURL(resolveModule(projectRoot, path.join(".opencode", VECLIB_REL), VECLIB_REL)).href
    )
  }
  if (!mod.embedder) {
    mod.embedder = await import(
      pathToFileURL(resolveModule(projectRoot, path.join(".opencode", EMBEDDER_REL), EMBEDDER_REL)).href
    )
  }
  if (!mod.rerank) {
    mod.rerank = await import(pathToFileURL(resolveModule(projectRoot, RERANK_REL, RERANK_REL)).href)
  }
  return mod as {
    veclib: any
    embedder: {
      embed: (t: string[]) => Promise<number[][]>
      embedQuery: (t: string) => Promise<number[]>
      EMBED_MODEL_KEY: string
    }
    rerank: {
      rerankOnnx: (q: string, docs: string[]) => Promise<Array<{ index: number; relevance_score: number }>>
    }
  }
}
/* eslint-enable @typescript-eslint/no-explicit-any */

// ---------------------------------------------------------------------------
// Types & constants
// ---------------------------------------------------------------------------

interface Chunk {
  id: number
  filePath: string // repo-relative
  startLine: number
  endLine: number
  heading: string
  content: string
  embedding?: number[]
}

interface FileEntry {
  mtimeMs: number
  size: number
  chunkIds: number[]
}

interface IndexFile {
  version: number
  root: string
  modelKey: string
  embedDim: number
  builtAt: string
  files: Record<string, FileEntry>
  chunks: Chunk[]
}

const INDEX_VERSION = 1
const TOP_K_DEFAULT = 5
const MAX_SNIPPET_LINES_DEFAULT = 10
const MAX_FILE_BYTES = 1_000_000
const RRF_K = 60
const RERANK_CANDIDATES = 20

// Semble's blending weights: symbol queries lean on exact matching, NL on semantics.
const ALPHA_SYMBOL = 0.3
const ALPHA_NL = 0.5

const SKIP_DIRS = new Set([
  // `dist` is deliberately absent: this config's TUI plugin keeps source under
  // plugins/hubs-tui/dist/. .gitignore handles repos that generate dist/.
  ".git", ".hg", ".svn", "node_modules", "__pycache__", ".venv", "venv", ".tox",
  ".mypy_cache", ".pytest_cache", ".ruff_cache", ".cache", ".semble", ".next",
  "coverage", ".turbo", ".parcel-cache", "out", "target", "vendor",
])

const CODE_EXTS = new Set([
  ".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs", ".py", ".go", ".rs", ".java",
  ".c", ".h", ".cpp", ".hpp", ".cc", ".cs", ".rb", ".php", ".swift", ".kt",
  ".kts", ".scala", ".lua", ".sh", ".bash", ".zsh", ".fish", ".ps1", ".sql",
  ".ex", ".exs", ".erl", ".hrl", ".clj", ".cljs", ".hs", ".ml", ".fs", ".r",
  ".jl", ".dart", ".vue", ".svelte", ".astro", ".zig", ".nim", ".pl", ".pm",
  ".groovy", ".gradle", ".tf", ".hcl", ".proto", ".graphql", ".gql",
])
const DOCS_EXTS = new Set([".md", ".mdx", ".txt", ".rst", ".adoc", ".org"])
const CONFIG_EXTS = new Set([
  ".json", ".jsonc", ".json5", ".yaml", ".yml", ".toml", ".ini", ".cfg",
  ".conf", ".env", ".xml", ".properties",
])

type ContentKind = "code" | "docs" | "config" | "all"

function extsFor(kind: ContentKind): Set<string> {
  switch (kind) {
    case "code": return CODE_EXTS
    case "docs": return DOCS_EXTS
    case "config": return CONFIG_EXTS
    case "all": return new Set([...CODE_EXTS, ...DOCS_EXTS, ...CONFIG_EXTS])
  }
}

// ---------------------------------------------------------------------------
// Tokenizer (faithful port of semble/tokens.py — BM25 recall depends on it)
// ---------------------------------------------------------------------------

const TOKEN_RE = /[a-zA-Z_][a-zA-Z0-9_]*/g
const CAMEL_RE = /[A-Z]+(?=[A-Z][a-z])|[A-Z]?[a-z]+|[A-Z]+|[0-9]+/g

function splitIdentifier(token: string): string[] {
  const lower = token.toLowerCase()
  const parts = token.includes("_")
    ? lower.split("_").filter(Boolean)
    : (token.match(CAMEL_RE) ?? []).map((p) => p.toLowerCase())
  return parts.length >= 2 ? [lower, ...parts] : [lower]
}

function tokenize(text: string): string[] {
  const out: string[] = []
  for (const tok of text.match(TOKEN_RE) ?? []) out.push(...splitIdentifier(tok))
  return out
}

// ---------------------------------------------------------------------------
// BM25 (k1=1.5, b=0.75 — Semble's parameters)
// ---------------------------------------------------------------------------

class BM25 {
  private tf: Array<Map<string, number>> = []
  private df = new Map<string, number>()
  private docLen: number[] = []
  private avgdl = 0
  private n = 0
  constructor(private k1 = 1.5, private b = 0.75) {}

  add(tokens: string[]): void {
    const counts = new Map<string, number>()
    for (const t of tokens) counts.set(t, (counts.get(t) ?? 0) + 1)
    this.tf.push(counts)
    this.docLen.push(tokens.length)
    this.n++
    for (const t of counts.keys()) this.df.set(t, (this.df.get(t) ?? 0) + 1)
  }

  finalize(): void {
    this.avgdl = this.n ? this.docLen.reduce((a, x) => a + x, 0) / this.n : 0
  }

  /** Scores aligned with insertion order; zero for docs matching nothing. */
  scores(queryTokens: string[]): Float32Array {
    const out = new Float32Array(this.n)
    if (!queryTokens.length || !this.n || !this.avgdl) return out
    const qtf = new Map<string, number>()
    for (const t of queryTokens) qtf.set(t, (qtf.get(t) ?? 0) + 1)
    for (const [term, qf] of qtf) {
      const df = this.df.get(term)
      if (!df) continue
      const idf = Math.log(1 + (this.n - df + 0.5) / (df + 0.5))
      for (let d = 0; d < this.n; d++) {
        const tf = this.tf[d].get(term)
        if (!tf) continue
        const norm = this.k1 * (1 - this.b + (this.b * this.docLen[d]) / this.avgdl)
        out[d] += idf * ((tf * (this.k1 + 1)) / (tf + norm)) * Math.min(qf, 3)
      }
    }
    return out
  }
}

// ---------------------------------------------------------------------------
// File walking — skip dirs + .gitignore/.sembleignore. Negation patterns that
// carry a file extension (!*.proto) force-include that extension, Semble's
// escape hatch. The compiler covers the common subset and fails toward
// indexing, never toward hiding files.
// ---------------------------------------------------------------------------

interface IgnoreRule {
  pattern: RegExp
  negate: boolean
  forceInclude: boolean
}

function compileIgnore(lines: string[]): IgnoreRule[] {
  const rules: IgnoreRule[] = []
  for (const raw of lines) {
    const line = raw.trim()
    if (!line || line.startsWith("#")) continue
    const negate = line.startsWith("!")
    const pat = negate ? line.slice(1) : line
    if (!pat) continue
    const dirOnly = pat.endsWith("/")
    const body = pat.replace(/^\//, "").replace(/\/$/, "")
    if (!body) continue
    const esc = body
      .replace(/[.+^${}()|[\]\\]/g, "\\$&")
      .replace(/\*\*/g, "@GLOBSTAR@")
      .replace(/\*/g, "[^/]*")
      .replace(/@GLOBSTAR@/g, ".*")
      .replace(/\?/g, "[^/]")
    // gitignore semantics: a pattern without a slash matches any path
    // component (filename or dir name); a pattern with a slash matches the
    // repo-relative path. Both get an implicit search inside the rel path.
    const re = body.includes("/")
      ? new RegExp(`(^|/)${esc}(/|$)`)
      : dirOnly
        ? new RegExp(`(^|/)${esc}/`)
        : new RegExp(`(^|/)${esc}$`)
    rules.push({ pattern: re, negate, forceInclude: negate && /\.[A-Za-z0-9]+$/.test(body) })
  }
  return rules
}

function ignoredBy(rel: string, isDir: boolean, rules: IgnoreRule[]): { ignored: boolean; forceInclude: boolean } {
  let ignored = false
  let forceInclude = false
  for (const r of rules) {
    if (r.pattern.test(rel + (isDir ? "/" : ""))) {
      ignored = !r.negate
      if (r.negate && r.forceInclude) forceInclude = true
    }
  }
  return { ignored, forceInclude }
}

function* walk(root: string, exts: Set<string>, extraIgnore: string[]): Generator<string> {
  const stack: Array<{ dir: string; rules: IgnoreRule[] }> = [{ dir: root, rules: compileIgnore(extraIgnore) }]
  while (stack.length) {
    const { dir, rules } = stack.pop()!
    let localRules = rules
    for (const name of [".gitignore", ".sembleignore"]) {
      const p = path.join(dir, name)
      if (fs.existsSync(p)) {
        try {
          localRules = [...localRules, ...compileIgnore(fs.readFileSync(p, "utf8").split("\n"))]
        } catch {
          // unreadable ignore file — proceed with inherited rules
        }
      }
    }
    let entries: fs.Dirent[]
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true })
    } catch {
      continue
    }
    for (const entry of entries) {
      if (entry.isSymbolicLink()) continue
      const full = path.join(dir, entry.name)
      const rel = path.relative(root, full).split(path.sep).join("/")
      if (entry.isDirectory()) {
        if (SKIP_DIRS.has(entry.name)) continue
        if (entry.name.startsWith(".") && entry.name !== ".opencode") continue
        // Session data may contain PII; caches are not source (veclib's rule).
        if (/^\.opencode\/(state|cache)(\/|$)/.test(rel)) continue
        if (ignoredBy(rel, true, localRules).ignored) continue
        stack.push({ dir: full, rules: localRules })
      } else if (entry.isFile()) {
        const { ignored, forceInclude } = ignoredBy(rel, false, localRules)
        if (ignored) continue
        if (forceInclude || exts.has(path.extname(entry.name).toLowerCase())) yield full
      }
    }
  }
}

// ---------------------------------------------------------------------------
// Chunking — veclib's chunkCode/chunkMarkdown where they apply, a line-window
// fallback elsewhere. Every chunk gets real 1-indexed line numbers.
// ---------------------------------------------------------------------------

const LINE_CHUNK_MAX = 120
const LINE_CHUNK_OVERLAP = 15

function lineChunks(content: string): Array<{ heading: string; content: string }> {
  const lines = content.split("\n")
  const out: Array<{ heading: string; content: string }> = []
  for (let i = 0; i < lines.length; i += LINE_CHUNK_MAX - LINE_CHUNK_OVERLAP) {
    const text = lines.slice(i, i + LINE_CHUNK_MAX).join("\n").trim()
    if (text.length >= 50) out.push({ heading: `lines ${i + 1}-${Math.min(i + LINE_CHUNK_MAX, lines.length)}`, content: text })
  }
  return out
}

/* eslint-disable-next-line @typescript-eslint/no-explicit-any */
function chunkContent(content: string, rel: string, kind: ContentKind, veclib: any): Chunk[] {
  const isCode = CODE_EXTS.has(path.extname(rel).toLowerCase())
  const isDocs = DOCS_EXTS.has(path.extname(rel).toLowerCase())
  let raw: Array<{ heading: string; content: string }>
  if ((kind === "code" || kind === "all") && isCode) {
    raw = veclib.chunkCode(content, rel)
  } else if ((kind === "docs" || kind === "all") && isDocs) {
    raw = veclib.chunkMarkdown(content, rel)
  } else {
    raw = lineChunks(content)
  }

  // Resolve each chunk's true line range by locating its text in the file.
  const out: Chunk[] = []
  let cursor = 0
  let id = 0
  for (const c of raw) {
    const probe = c.content.slice(0, 200)
    const at = content.indexOf(probe, cursor)
    const start = at >= 0 ? at : cursor
    const startLine = content.slice(0, start).split("\n").length
    const endLine = startLine + c.content.split("\n").length - 1
    cursor = start + c.content.length
    out.push({ id: id++, filePath: rel, startLine, endLine, heading: c.heading, content: c.content })
  }
  return out
}

// ---------------------------------------------------------------------------
// Ranking — Semble's boost/penalty stack, then the cross-encoder.
// ---------------------------------------------------------------------------

const SYMBOL_QUERY_RE =
  /^(?:[A-Za-z_][A-Za-z0-9_]*(?:(?:::|\\|->|\.)[A-Za-z_][A-Za-z0-9_]*)+|_[A-Za-z0-9_]*|[A-Za-z][A-Za-z0-9]*[A-Z_][A-Za-z0-9_]*|[A-Z][A-Za-z0-9]*)$/
const EMBEDDED_SYMBOL_RE = /\b(?:[A-Z][a-z][a-zA-Z0-9]*[A-Z][a-zA-Z0-9]*|[a-z][a-zA-Z0-9]*[A-Z][a-zA-Z0-9]+)\b/g
const DEFINITION_KEYWORDS = [
  "class", "module", "defmodule", "def", "interface", "struct", "enum", "trait",
  "type", "func", "function", "object", "abstract class", "data class", "fn",
  "fun", "package", "namespace", "protocol", "record", "typedef",
]
const STOPWORDS = new Set(
  "a an and are as at be by do does for from has have how if in is it not of on or the to was what when where which who why with".split(" "),
)
const PENALTY_PATH_RE = /(^|\/)(test|tests|__tests__|spec|specs|fixtures|examples?|docs?|benchmarks?|generated|vendor|third_party|migrations?)(\/|\.)/i

function isSymbolQuery(query: string): boolean {
  return SYMBOL_QUERY_RE.test(query.trim())
}

function extractSymbolName(query: string): string {
  for (const sep of ["::", "\\", "->", "."]) {
    if (query.includes(sep)) return query.split(sep).pop()!
  }
  return query.trim()
}

function escapeRe(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}

const defPatternCache = new Map<string, RegExp>()
function definitionPattern(symbol: string): RegExp {
  let re = defPatternCache.get(symbol)
  if (!re) {
    const ns = "(?:[A-Za-z_][A-Za-z0-9_]*(?:\\.|::))*"
    re = new RegExp(
      `(?:^|(?<=\\s))(?:${DEFINITION_KEYWORDS.map(escapeRe).join("|")})\\s+${ns}${escapeRe(symbol)}(?:\\s|[<({:\\[;]|$)`,
      "m",
    )
    defPatternCache.set(symbol, re)
  }
  return re
}

function cosine(a: number[], b: number[]): number {
  let dot = 0, na = 0, nb = 0
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i]
    na += a[i] * a[i]
    nb += b[i] * b[i]
  }
  return na && nb ? dot / (Math.sqrt(na) * Math.sqrt(nb)) : 0
}

/** 1/(k+rank) — Semble's RRF normalization, so alpha means the same in both lanes. */
function rrf(order: number[]): Map<number, number> {
  const out = new Map<number, number>()
  order.forEach((chunkIdx, rank) => out.set(chunkIdx, 1 / (RRF_K + rank + 1)))
  return out
}

// ---------------------------------------------------------------------------
// Index persistence — .opencode/state/vector/codesearch/<base64url(root)>.json
// ---------------------------------------------------------------------------

function indexPath(root: string): string {
  const dir = path.join(root, ".opencode", "state", "vector", "codesearch")
  fs.mkdirSync(dir, { recursive: true })
  const key = Buffer.from(path.resolve(root)).toString("base64url")
  return path.join(dir, `${key}.json`)
}

function loadIndex(root: string): IndexFile | null {
  const p = indexPath(root)
  if (!fs.existsSync(p)) return null
  try {
    const idx = JSON.parse(fs.readFileSync(p, "utf8")) as IndexFile
    if (idx.version !== INDEX_VERSION || idx.root !== path.resolve(root)) return null
    return idx
  } catch {
    return null
  }
}

function saveIndex(root: string, idx: IndexFile): void {
  fs.writeFileSync(indexPath(root), JSON.stringify(idx))
}

/* eslint-disable-next-line @typescript-eslint/no-explicit-any */
async function buildIndex(
  root: string,
  kind: ContentKind,
  embed: (t: string[]) => Promise<number[][]>,
  modelKey: string,
  embedDim: number,
  veclib: any,
): Promise<IndexFile> {
  const prev = loadIndex(root)
  const reusable = prev && prev.modelKey === modelKey && prev.embedDim === embedDim ? prev : null

  const exts = extsFor(kind)
  const files = [...walk(root, exts, [])]
  const filesNext: Record<string, FileEntry> = {}
  const reusedByFile = new Map<string, Chunk[]>()
  const freshByFile = new Map<string, Chunk[]>()

  for (const full of files) {
    const rel = path.relative(root, full).split(path.sep).join("/")
    const stat = fs.statSync(full)
    if (stat.size > MAX_FILE_BYTES || stat.size < 1) continue
    const prior = reusable?.files[rel]
    if (prior && prior.mtimeMs === stat.mtimeMs && prior.size === stat.size) {
      const chunks = prior.chunkIds
        .map((id) => reusable!.chunks[id])
        .filter((c): c is Chunk => Boolean(c))
      if (chunks.length === prior.chunkIds.length) {
        filesNext[rel] = { ...prior }
        reusedByFile.set(rel, chunks)
        continue
      }
      // Manifest pointed at chunks that no longer exist — treat as changed.
    }
    let content: string
    try {
      content = fs.readFileSync(full, "utf8")
    } catch {
      continue
    }
    if (!content.trim()) continue
    const chunked = chunkContent(content, rel, kind, veclib)
    freshByFile.set(rel, chunked)
  }

  // Re-number contiguously per file, so chunkIds are stable and never collide.
  const renumbered: Chunk[] = []
  const freshAssigned: Array<{ assignedId: number; embeddingSrc: Chunk }> = []
  let nextId = 0
  const allFiles = [...reusedByFile.keys(), ...freshByFile.keys()]
  for (const rel of allFiles) {
    const reusedChunks = reusedByFile.get(rel)
    const source = reusedChunks ?? freshByFile.get(rel)!
    const ids: number[] = []
    for (const c of source) {
      const id = nextId++
      ids.push(id)
      renumbered.push({ ...c, id })
      if (!reusedChunks) freshAssigned.push({ assignedId: id, embeddingSrc: c })
    }
    const stat = fs.statSync(path.join(root, rel))
    filesNext[rel] = { mtimeMs: stat.mtimeMs, size: stat.size, chunkIds: ids }
  }
  const fresh = freshAssigned

  if (fresh.length) {
    const BATCH = 32
    for (let i = 0; i < fresh.length; i += BATCH) {
      const slice = fresh.slice(i, i + BATCH)
      const vectors = await embed(slice.map((f) => `${f.embeddingSrc.heading}\n${f.embeddingSrc.content}`))
      slice.forEach((f, k) => {
        renumbered[f.assignedId].embedding = vectors[k]
      })
    }
  }

  const idx: IndexFile = {
    version: INDEX_VERSION,
    root: path.resolve(root),
    modelKey,
    embedDim,
    builtAt: new Date().toISOString(),
    files: filesNext,
    chunks: renumbered,
  }
  saveIndex(root, idx)
  return idx
}

// ---------------------------------------------------------------------------
// Search
// ---------------------------------------------------------------------------

interface SearchHit {
  chunk: Chunk
  score: number
  rerankScore?: number
}

async function hybridSearch(
  idx: IndexFile,
  query: string,
  topK: number,
  opts: { alpha?: number; useReranker: boolean },
  libsLoaded: Awaited<ReturnType<typeof libs>>,
): Promise<SearchHit[]> {
  const chunks = idx.chunks
  if (!chunks.length) return []

  const symbolQuery = isSymbolQuery(query)
  const alpha = opts.alpha ?? (symbolQuery ? ALPHA_SYMBOL : ALPHA_NL)
  const candidates = Math.min(chunks.length, topK * 5)

  // Dense lane
  const qv = await libsLoaded.embedder.embedQuery(query)
  const dense: Array<[number, number]> = []
  chunks.forEach((c, i) => {
    if (c.embedding) dense.push([i, cosine(qv, c.embedding)])
  })
  dense.sort((a, b) => b[1] - a[1])
  const denseRrf = rrf(dense.slice(0, candidates).map(([i]) => i))

  // BM25 lane
  const bm = new BM25()
  for (const c of chunks) bm.add(tokenize(`${c.heading}\n${c.content}`))
  bm.finalize()
  const bmScores = bm.scores(tokenize(query))
  const bmOrder = [...bmScores.keys()]
    .sort((a, b) => bmScores[b] - bmScores[a])
    .filter((i) => bmScores[i] > 0)
  const bmRrf = rrf(bmOrder.slice(0, candidates))

  // RRF merge
  const ids = new Set([...denseRrf.keys(), ...bmRrf.keys()])
  const scores = new Map<number, number>()
  for (const id of ids) {
    const s = alpha * (denseRrf.get(id) ?? 0) + (1 - alpha) * (bmRrf.get(id) ?? 0)
    if (s > 0) scores.set(id, s)
  }
  if (!scores.size) return []

  // Boost 1: file coherence — files with multiple candidates boost their top chunk.
  const maxScore = Math.max(...scores.values())
  const fileSum = new Map<string, number>()
  const best = new Map<string, number>()
  for (const [id, s] of scores) {
    const fp = chunks[id].filePath
    fileSum.set(fp, (fileSum.get(fp) ?? 0) + s)
    if (!best.has(fp) || s > scores.get(best.get(fp)!)!) best.set(fp, id)
  }
  const maxFileSum = Math.max(...fileSum.values())
  if (maxFileSum > 0) {
    for (const [fp, id] of best) {
      scores.set(id, scores.get(id)! + maxScore * 0.2 * (fileSum.get(fp)! / maxFileSum))
    }
  }

  // Boost 2: symbol definitions / stem matches / embedded symbols.
  if (symbolQuery) {
    const name = extractSymbolName(query)
    const defRe = definitionPattern(name)
    const stem = name.toLowerCase().replace(/_/g, "")
    for (const [id, s] of scores) {
      const c = chunks[id]
      if (defRe.test(c.content)) {
        const fileStem = path.basename(c.filePath).replace(/\.[^.]+$/, "").toLowerCase().replace(/_/g, "")
        const stemMatch = fileStem === stem || fileStem.replace(/s$/, "") === stem
        scores.set(id, s + maxScore * 3.0 * (stemMatch ? 1.5 : 1.0))
      }
    }
  } else {
    const words = new Set(tokenize(query).filter((w) => !STOPWORDS.has(w)))
    const embedded = query.match(EMBEDDED_SYMBOL_RE) ?? []
    for (const [id, s] of scores) {
      const c = chunks[id]
      const stem = path.basename(c.filePath).replace(/\.[^.]+$/, "").toLowerCase().replace(/_/g, "")
      if ([...words].some((w) => w.length >= 3 && stem.includes(w))) {
        scores.set(id, s + maxScore * 1.0)
      }
      for (const sym of embedded) {
        if (definitionPattern(sym).test(c.content)) {
          scores.set(id, scores.get(id)! + maxScore * 3.0 * 0.5)
        }
      }
    }
  }

  // Path penalties only when BM25 is in play (alpha < 1) — Semble's rule.
  if (alpha < 1) {
    for (const [id, s] of scores) {
      if (PENALTY_PATH_RE.test(chunks[id].filePath)) scores.set(id, s * 0.5)
    }
  }

  const ranked = [...scores.entries()].sort((a, b) => b[1] - a[1])

  // Cross-encoder rerank — never downloads; failure degrades to RRF order.
  if (opts.useReranker && ranked.length > 1) {
    try {
      const top = ranked.slice(0, RERANK_CANDIDATES)
      const docs = top.map(([id]) => `${chunks[id].heading}\n${chunks[id].content}`)
      const rr = await libsLoaded.rerank.rerankOnnx(query, docs)
      const byIdx = new Map(rr.map((r) => [r.index, r.relevance_score]))
      const reranked = top
        .map(([id, s], i) => ({ id, s, r: byIdx.get(i) ?? 0 }))
        .sort((a, b) => b.r - a.r)
      const rest = ranked.slice(RERANK_CANDIDATES).map(([id, s]) => ({ id, s, r: -1 }))
      return [...reranked, ...rest]
        .slice(0, topK)
        .map(({ id, s, r }) => ({ chunk: chunks[id], score: s, rerankScore: r >= 0 ? r : undefined }))
    } catch {
      // fall through to RRF order
    }
  }

  return ranked.slice(0, topK).map(([id, s]) => ({ chunk: chunks[id], score: s }))
}

// ---------------------------------------------------------------------------
// Output — Semble's contract: location first, snippet trimmed.
// ---------------------------------------------------------------------------

function formatResults(hits: SearchHit[], maxSnippetLines: number | null) {
  return hits.map((h) => {
    const lines = h.chunk.content.split("\n")
    const snippet =
      maxSnippetLines === null
        ? h.chunk.content
        : maxSnippetLines === 0
          ? ""
          : lines.slice(0, maxSnippetLines).join("\n")
    return {
      location: `${h.chunk.filePath}:${h.chunk.startLine}-${h.chunk.endLine}`,
      heading: h.chunk.heading,
      score: Number(h.score.toFixed(4)),
      ...(h.rerankScore !== undefined ? { rerank: Number(h.rerankScore.toFixed(4)) } : {}),
      snippet,
    }
  })
}

// ---------------------------------------------------------------------------
// Tool
// ---------------------------------------------------------------------------

export default tool({
  description:
    "Semantic code search over the project — the grep+read replacement. Indexes the repo once (local bge-small embeddings + BM25, persisted under .opencode/state/vector/codesearch/, mtime-invalidated), then answers natural-language or symbol queries with ranked file:line locations and trimmed snippets. Hybrid RRF + symbol/definition boosts + bge-reranker cross-encoder. Runs fully in-process, no daemon, no network at query time.",
  args: {
    query: tool.schema.string().describe("Natural-language description or symbol name (e.g. 'authentication flow' or 'SessionManager')"),
    dir: tool.schema.string().optional().describe("Repo root to search (default: session directory)"),
    topK: tool.schema.number().optional().describe(`Results to return (default ${TOP_K_DEFAULT})`),
    maxSnippetLines: tool.schema
      .number()
      .optional()
      .describe("Lines of source per result. 0 = location only, omit = 10 (signature + first body lines). Use 0 to triage, then Read the winners."),
    content: tool.schema
      .enum(["code", "docs", "config", "all"])
      .optional()
      .describe("What to index/search (default: code)"),
    alpha: tool.schema
      .number()
      .optional()
      .describe("Dense-vs-BM25 blend 0..1. Omit for auto: 0.3 symbol-like queries, 0.5 natural language."),
    rerank: tool.schema.boolean().optional().describe("Cross-encoder rerank (default true). Disable for speed on huge repos."),
    reindex: tool.schema.boolean().optional().describe("Force a full rebuild, ignoring the mtime cache"),
    stats: tool.schema.boolean().optional().describe("Return index stats instead of searching"),
  },
  async execute(args, context) {
    const dir = path.resolve(args.dir || context?.directory || process.cwd())
    const kind = (args.content ?? "code") as ContentKind
    try {
      const L = await libs(dir)

      if (args.stats) {
        const idx = loadIndex(dir)
        if (!idx) return JSON.stringify({ ok: true, indexed: false, dir })
        return JSON.stringify({
          ok: true,
          indexed: true,
          dir,
          files: Object.keys(idx.files).length,
          chunks: idx.chunks.length,
          model: idx.modelKey,
          builtAt: idx.builtAt,
        })
      }

      if (!args.query?.trim()) return JSON.stringify({ ok: false, error: "query is required" })

      if (args.reindex) {
        const p = indexPath(dir)
        if (fs.existsSync(p)) fs.unlinkSync(p)
      }

      const t0 = Date.now()
      const idx = await buildIndex(dir, kind, L.embedder.embed, L.embedder.EMBED_MODEL_KEY, 384, L.veclib)
      const buildMs = Date.now() - t0

      if (!idx.chunks.length) {
        return JSON.stringify({ ok: true, indexed: false, results: [], note: `no ${kind} files found under ${dir}` })
      }

      const t1 = Date.now()
      const hits = await hybridSearch(
        idx,
        args.query,
        args.topK ?? TOP_K_DEFAULT,
        { alpha: args.alpha, useReranker: args.rerank !== false },
        L,
      )
      const searchMs = Date.now() - t1

      return JSON.stringify({
        ok: true,
        query: args.query,
        dir,
        kind,
        timing: { indexMs: buildMs, searchMs },
        counts: { files: Object.keys(idx.files).length, chunks: idx.chunks.length },
        results: formatResults(hits, args.maxSnippetLines ?? MAX_SNIPPET_LINES_DEFAULT),
      })
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      const hint = /not cached/.test(msg)
        ? " Run: npx tsx skills/vectorize-context/scripts/prefetch-models.ts"
        : ""
      return JSON.stringify({ ok: false, error: msg + hint })
    }
  },
})
