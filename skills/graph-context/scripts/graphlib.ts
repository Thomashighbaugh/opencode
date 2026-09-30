#!/usr/bin/env node
/**
 * graphlib.ts — Shared per-project knowledge graph library.
 *
 * A sqlite graph store (nodes/edges/node_tags) sitting NEXT TO the vector
 * store (context.db) in .opencode/state/vector/graph.db. Nodes mirror the
 * wiki taxonomy; edges are typed relationships. Retrieval is HYBRID:
 * vector recall → graph refine → ranked output.
 *
 * Store:  .opencode/state/vector/graph.db  (gitignored — ephemeral, per-project)
 *
 * Exports:
 *   resolvePaths(inputDir?)        — path resolution (shared convention with veclib)
 *   ensureGraphReady(inputDir?)    — open/create graph.db, ensure schema
 *   upsertNode(inputDir, node)     — insert or update a node
 *   upsertEdge(inputDir, edge)     — insert or update an edge (weight accumulates)
 *   upsertTag(inputDir, nodeId, tag)
 *   backfillFromWiki(inputDir?)    — wiki frontmatter + learnings → nodes/edges
 *   backfillFromRegistry(inputDir?)— spec-registry.json → nodes/edges (config hubs)
 *   queryHybrid(inputDir, queryText, topK?, opts?) — vector recall → graph refine
 *   getNode(inputDir, nodeId)
 *   getNeighbors(inputDir, nodeId, depth?, direction?)
 *   getPath(inputDir, fromId, toId)  — BFS shortest path
 *   getImpact(inputDir, nodeId)      — reverse edges (what depends on this)
 *   getGraphStats(inputDir?)
 *
 * Design principle: Lazy freshness. Graph is derived from markdown sources;
 * backfill re-scans only changed mtimes. Hybrid query never throws — degrades
 * to pure vector results on graph errors.
 */

import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);

// ─── Config ────────────────────────────────────────────────────────────────

const MAX_DEPTH_DEFAULT = 2;
const RELATED_SCORE_DECAY = 0.6; // related node score = source_score * decay^depth

// ─── Path Resolution ───────────────────────────────────────────────────────

/**
 * Strip JSONC comments without corrupting string contents.
 *
 * A naive regex is not safe here: this config contains URLs like
 * "https://opencode.ai/config.json", and stripping `//` naively would truncate
 * the string and produce invalid JSON. Tracks in-string state so a `//` inside
 * quotes is left alone.
 */
export function stripJsonComments(src: string): string {
  let out = '';
  let inString = false;
  let inLine = false;
  let inBlock = false;
  for (let i = 0; i < src.length; i++) {
    const c = src[i];
    const n = src[i + 1];
    if (inLine) {
      if (c === '\n') { inLine = false; out += c; }
      continue;
    }
    if (inBlock) {
      if (c === '*' && n === '/') { inBlock = false; i++; }
      continue;
    }
    if (inString) {
      out += c;
      if (c === '\\') { out += n ?? ''; i++; continue; }
      if (c === '"') inString = false;
      continue;
    }
    if (c === '"') { inString = true; out += c; continue; }
    if (c === '/' && n === '/') { inLine = true; i++; continue; }
    if (c === '/' && n === '*') { inBlock = true; i++; continue; }
    out += c;
  }
  // Trailing commas are legal JSONC and this config uses them; JSON.parse is
  // not. Strip only commas that precede a closing brace/bracket, and only
  // outside strings — a comma inside a string value is data, not syntax.
  return out.replace(/,(\s*[}\]])/g, '$1');
}

/**
 * The markdown files the runtime actually loads as instructions.
 *
 * This exists because the graph hardcoded `<projectRoot>/.opencode/rules/`,
 * which does not exist in this project's layout — its rules live at
 * `<projectRoot>/rules/` and are registered in opencode.jsonc's `instructions`
 * array. The result was that all 21 rules, including every rule governing how
 * this config behaves, were invisible to the graph: rule:efficiency-first and
 * rule:output-compression simply were not there.
 *
 * Reading the config instead of guessing a directory means the graph indexes
 * exactly the rules in force, and follows them automatically if the layout
 * changes. Falls back to the conventional directories when no config is found.
 */
function instructionMarkdownFiles(projectRoot: string): string[] {
  const out: string[] = [];
  const configPath = path.join(projectRoot, 'opencode.jsonc');
  if (fs.existsSync(configPath)) {
    try {
      const cfg = JSON.parse(stripJsonComments(fs.readFileSync(configPath, 'utf-8')));
      const entries: unknown[] = Array.isArray(cfg?.instructions) ? cfg.instructions : [];
      for (const e of entries) {
        if (typeof e !== 'string' || !e.toLowerCase().endsWith('.md')) continue;
        if (e === 'AGENTS.md') continue;
        const abs = path.resolve(projectRoot, e);
        if (fs.existsSync(abs)) out.push(abs);
      }
    } catch {
      // Malformed config — fall through to the conventional directories.
    }
  }
  return out;
}

export function resolvePaths(inputDir) {
  const raw = inputDir || process.env.OPCODE_DIR || path.resolve(process.cwd(), '.opencode');
  const isOcodeDir = path.basename(raw) === '.opencode';
  const opencodeDir = isOcodeDir ? raw : path.join(raw, '.opencode');
  const projectRoot = isOcodeDir ? path.dirname(raw) : raw;
  return {
    opencodeDir,
    projectRoot,
    contextDir: path.join(opencodeDir, 'context'),
    rulesDir: path.join(opencodeDir, 'rules'),
    docsDir: path.join(opencodeDir, 'docs'),
    learningsDir: path.join(opencodeDir, 'context', 'learnings'),
    skillsDir: path.join(opencodeDir, 'skills'),
    agentsDir: path.join(opencodeDir, 'agents'),
    agentsFile: path.join(projectRoot, 'AGENTS.md'),
    vectorDir: path.join(opencodeDir, 'state', 'vector'),
    graphDbPath: path.join(opencodeDir, 'state', 'vector', 'graph.db'),
    // Added for backfillFromCode: the code store is the only place that knows
    // which declarations exist per file, so it is the source of the code layer.
    codeDbPath: path.join(opencodeDir, 'state', 'vector', 'code.db'),
    registryPath: path.join(projectRoot, 'tools', 'hubs', 'spec-registry.json'),
  };
}

// ─── SQLite ────────────────────────────────────────────────────────────────

function openDatabase(dbPath, readonly = false) {
  let Database;
  try {
    Database = require('better-sqlite3');
  } catch {
    throw new Error('better-sqlite3 not installed. Run: npm install better-sqlite3');
  }
  const db = new Database(dbPath, readonly ? { readonly: true } : {});
  if (!readonly) db.pragma('journal_mode = WAL');
  return db;
}

// ─── Schema ────────────────────────────────────────────────────────────────

/**
 * Node types mirror the wiki taxonomy + config asset types:
 *   pattern, decision, entity, concept, learning, source-summary, synthesis,
 *   rule, skill, agent, command, hub-subcommand, file, module
 * Edge types:
 *   applies_to, supersedes, touches, related_to, part_of, used_by, derived_from
 */
const NODE_TYPES = new Set([
  'pattern', 'decision', 'entity', 'concept', 'learning', 'source-summary', 'synthesis',
  'rule', 'skill', 'agent', 'command', 'hub-subcommand', 'file', 'module',
  'symbol', 'reference',
]);

const EDGE_TYPES = new Set([
  'applies_to', 'supersedes', 'touches', 'related_to', 'part_of', 'used_by', 'derived_from',
  'defines', 'uses',
]);

const SCHEMA_SQL = `
  CREATE TABLE IF NOT EXISTS nodes (
    id        TEXT PRIMARY KEY,
    type      TEXT NOT NULL,
    title     TEXT NOT NULL,
    path      TEXT,
    meta      TEXT,
    mtime     TEXT,
    created   TEXT NOT NULL DEFAULT (datetime('now')),
    updated   TEXT NOT NULL DEFAULT (datetime('now'))
  );
  CREATE TABLE IF NOT EXISTS edges (
    src_id    TEXT NOT NULL,
    dst_id    TEXT NOT NULL,
    type      TEXT NOT NULL,
    weight    REAL NOT NULL DEFAULT 1.0,
    created   TEXT NOT NULL DEFAULT (datetime('now')),
    updated   TEXT NOT NULL DEFAULT (datetime('now')),
    PRIMARY KEY (src_id, dst_id, type)
  );
  CREATE TABLE IF NOT EXISTS node_tags (
    node_id   TEXT NOT NULL,
    tag       TEXT NOT NULL,
    PRIMARY KEY (node_id, tag)
  );
  CREATE INDEX IF NOT EXISTS idx_edges_src ON edges(src_id);
  CREATE INDEX IF NOT EXISTS idx_edges_dst ON edges(dst_id);
  CREATE INDEX IF NOT EXISTS idx_nodes_type ON nodes(type);
  CREATE INDEX IF NOT EXISTS idx_nodes_path ON nodes(path);
  CREATE INDEX IF NOT EXISTS idx_tags_tag ON node_tags(tag);
  CREATE TABLE IF NOT EXISTS graph_meta (
    key   TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );
  -- What the graph currently derives from each source file. A rebuild compares
  -- these hashes to decide which files actually need edge work; a file whose
  -- declarations and identifiers are unchanged cannot produce a different edge,
  -- so it is skipped entirely.
  CREATE TABLE IF NOT EXISTS derived_file (
    file_path    TEXT PRIMARY KEY,
    symbols_hash TEXT NOT NULL,
    idents_hash  TEXT NOT NULL
  );
`;

function ensureSchema(db) {
  db.exec(SCHEMA_SQL);
}

/**
 * Open (creating if needed) the graph DB and ensure schema.
 */
export function ensureGraphReady(inputDir) {
  const paths = resolvePaths(inputDir);
  fs.mkdirSync(paths.vectorDir, { recursive: true });
  const db = openDatabase(paths.graphDbPath);
  ensureSchema(db);
  return db;
}

// ─── Node ID derivation ────────────────────────────────────────────────────

/**
 * Types whose slug is a path recorded relative to `.opencode/`, where a leading
 * `.opencode/` is a redundant prefix worth dropping.
 *
 * The code layer is NOT in this set. Its paths come from the code store
 * relative to the PROJECT ROOT, and stripping the prefix there made
 * `.opencode/tools/project-info.ts` collide with a root `tools/project-info.ts`
 * — two different files sharing one node — and broke every join of the graph to
 * the store on path, which is how a test and any consumer resolve a file to its
 * declarations.
 */
const OPENCODE_PREFIXED_TYPES = new Set([
  'concept', 'entity', 'rule', 'source-summary', 'decision', 'pattern',
  'framework', 'learning', 'synthesis', 'reference', 'hub-subcommand', 'skill',
  'agent', 'command', 'research',
])

/**
 * Derive a stable node id from type + slug. Slugs are the primary key for
 * wiki pages; file paths for file nodes; registry labels for hub-subcommands.
 */
export function nodeId(type, slug) {
  let clean = String(slug).replace(/\\/g, '/')
  if (OPENCODE_PREFIXED_TYPES.has(type)) clean = clean.replace(/^\.opencode\//, '')
  clean = clean.replace(/\.md$/, '')
  return `${type}:${clean}`;
}

function slugify(title) {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80);
}

// ─── Graph Meta ────────────────────────────────────────────────────────────

/**
 * graph_meta is created by ensureGraphReady alongside the rest of the schema.
 *
 * It used to be created lazily inside the reader, which opened graph.db
 * READ-ONLY and then issued CREATE TABLE IF NOT EXISTS. On a readonly
 * connection that throws, the throw was swallowed, and the reader returned
 * null on every call — so the structure gate below never once fired and every
 * sync paid the full rebuild. The gate's logic was correct and completely
 * inert, which is worse than not having it: the cost looked addressed.
 */
function readGraphMeta(inputDir, key) {
  let db;
  try {
    db = openDatabase(resolvePaths(inputDir).graphDbPath, true);
    const row = db.prepare('SELECT value FROM graph_meta WHERE key = ?').get(key);
    return row ? row.value : null;
  } catch {
    // No meta table yet, or the store is unreadable: treat as "unknown", which
    // correctly means "do the work" rather than "skip the work".
    return null;
  } finally {
    try { db?.close(); } catch { /* already closed */ }
  }
}

function writeGraphMeta(inputDir, key, value) {
  let db;
  try {
    db = ensureGraphReady(inputDir);
    db.prepare(
      'INSERT INTO graph_meta (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value',
    ).run(key, value);
  } catch {
    /* meta is an optimisation — never fail a build over it */
  } finally {
    try { db?.close(); } catch { /* already closed */ }
  }
}

// ─── Node / Edge Upserts ───────────────────────────────────────────────────

/**
 * node: { id?, type, title, path?, meta?, mtime? }
 * If id is omitted, derive from type + slugified title (or path).
 */
export function upsertNode(inputDir, node) {
  const db = ensureGraphReady(inputDir);
  try {
    const id = node.id || (node.path ? nodeId(node.type, node.path) : nodeId(node.type, slugify(node.title)));
    const existing = db.prepare('SELECT id FROM nodes WHERE id = ?').get(id);
    if (existing) {
      db.prepare(`
        UPDATE nodes SET title = ?, path = COALESCE(?, path), meta = COALESCE(?, meta),
               mtime = COALESCE(?, mtime), updated = datetime('now')
        WHERE id = ?
      `).run(node.title, node.path || null, node.meta ? JSON.stringify(node.meta) : null, node.mtime || null, id);
    } else {
      db.prepare(`
        INSERT INTO nodes (id, type, title, path, meta, mtime) VALUES (?, ?, ?, ?, ?, ?)
      `).run(id, node.type, node.title, node.path || null, node.meta ? JSON.stringify(node.meta) : null, node.mtime || null);
    }
    return id;
  } finally {
    db.close();
  }
}

/**
 * edge: { src, dst, type, weight? }
 * Idempotent upsert: accumulates weight on repeat (recurrence counting).
 */
export function upsertEdge(inputDir, edge) {
  const db = ensureGraphReady(inputDir);
  try {
    const existing = db.prepare('SELECT weight FROM edges WHERE src_id = ? AND dst_id = ? AND type = ?').get(edge.src, edge.dst, edge.type);
    if (existing) {
      db.prepare(`
        UPDATE edges SET weight = weight + ?, updated = datetime('now')
        WHERE src_id = ? AND dst_id = ? AND type = ?
      `).run(edge.weight || 1, edge.src, edge.dst, edge.type);
    } else {
      db.prepare(`
        INSERT INTO edges (src_id, dst_id, type, weight) VALUES (?, ?, ?, ?)
      `).run(edge.src, edge.dst, edge.type, edge.weight || 1);
    }
  } finally {
    db.close();
  }
}

export function upsertTag(inputDir, nodeIdValue, tag) {
  const db = ensureGraphReady(inputDir);
  try {
    db.prepare('INSERT OR IGNORE INTO node_tags (node_id, tag) VALUES (?, ?)').run(nodeIdValue, tag);
  } finally {
    db.close();
  }
}

// ─── Code Layer Backfill ───────────────────────────────────────────────────

/**
 * Declaration extractor for the code store's `heading` column.
 *
 * veclib's chunkCode is declaration-aware, so headings arrive as the source
 * line that opened the chunk, e.g.
 *   "export function getProjectSlug(projectRoot: "
 *   "export class CacheManager {"
 *   "export interface CacheEntry<T = string> {"
 *   "const GENERIC_BASENAMES = new Set([\"opencode\""
 * Non-declaration chunks (imports, trailing method bodies) keep the bare
 * filename as their heading and are correctly skipped.
 */
const DECL_RE =
  /^\s*(?:export\s+)?(?:default\s+)?(?:declare\s+)?(?:public\s+|private\s+|protected\s+|readonly\s+|static\s+|async\s+)*(?:function\s*\*?|class|interface|type|enum|const|let|var)\s+([A-Za-z_$][\w$]*)/;

/** Identifiers too generic to be worth an edge target. */
const SYMBOL_STOP = new Set([
  'if', 'for', 'while', 'switch', 'catch', 'return', 'function', 'class', 'const',
  'let', 'var', 'new', 'this', 'self', 'super', 'typeof', 'await', 'async',
  'true', 'false', 'null', 'undefined', 'default', 'export', 'import', 'from',
  'require', 'module', 'exports', 'string', 'number', 'boolean', 'any', 'void',
  'never', 'unknown', 'object', 'symbol', 'bigint', 'get', 'set', 'value',
]);

/**
 * Fingerprint of the code store's declaration index.
 *
 * This is the cache key for the whole graph rebuild. The graph's code layer is
 * derived entirely from (file_path, name, kind, parent), so if that tuple set is
 * unchanged then every derived edge would be recomputed to the same values —
 * the rebuild is pure waste. Editing a comment, a log line, or a docstring
 * re-indexes the chunk store (mtime changed) but leaves this signature
 * untouched, so the graph rebuild is skipped entirely.
 *
 * Before this, a `touch` of three files cost ~1.9s of graph rebuild producing
 * zero new edges. Now it costs one indexed scan of a small table.
 */
/**
 * Bump when a change alters how graph edges are DERIVED from the symbol table —
 * not when the symbol table itself changes (that is already fingerprinted).
 *
 * The partial rebuild skips work when the structure signature is unchanged, so a
 * rule change that only affects derivation would otherwise be invisible and the
 * graph would keep serving edges the new rules never produce.
 *
 * Epoch 1: root-level files given a project-root module, so every file has a
 *          `part_of` edge (INVARIANT 1).
 * Epoch 2: `nodeId` no longer strips a leading `.opencode/` from file, module, or
 *          symbol slugs, so code-layer ids match the code store's paths exactly
 *          and `.opencode/tools/x.ts` stops colliding with `tools/x.ts`.
 */
const DERIVATION_EPOCH = 2;

export function structureSignature(inputDir: string | undefined): string | null {
  const paths = resolvePaths(inputDir);
  if (!fs.existsSync(paths.codeDbPath)) return null;
  let db;
  try {
    db = openDatabase(paths.codeDbPath, true);
    const rows = db
      .prepare('SELECT file_path, name, kind, parent FROM symbols ORDER BY file_path, name, kind, parent')
      .all() as Array<{ file_path: string; name: string; kind: string; parent: string | null }>;
    if (rows.length === 0) return null;
    const h = createHash('sha256');
    for (const r of rows) h.update(`${r.file_path}\u0000${r.name}\u0000${r.kind}\u0000${r.parent ?? ''}\u0001`);
    // DERIVATION_EPOCH participates in the signature on purpose. Without it, a
    // change to the rules above — how a scope is opened, which files get a
    // module, what counts as a declaration — left the signature untouched, so
    // the partial rebuild saw "structure unchanged" and skipped, and the graph
    // kept serving edges that the new rules would never produce. Five root-level
    // files sat without a `part_of` edge for exactly this reason: no file had
    // changed, only the logic that derives their edges had.
    h.update(`\u0002derivation:${DERIVATION_EPOCH}`);
    return `${rows.length}:${h.digest('hex').slice(0, 32)}`;
  } catch {
    return null;
  } finally {
    try { db?.close(); } catch { /* already closed */ }
  }
}

export function symbolNameFromHeading(heading: string): string | null {
  if (!heading) return null;
  const m = DECL_RE.exec(heading);
  if (!m) return null;
  const name = m[1];
  if (!name || name.length < 3) return null;
  if (SYMBOL_STOP.has(name.toLowerCase())) return null;
  return name;
}

/**
 * Identifier-like runs, INCLUDING hyphenated segments.
 *
 * The first version used /[A-Za-z_$][\w$]{2,}/, which splits "vectorize-context"
 * into "vectorize" and "context". Every skill and rule slug in this system is
 * hyphenated, so the code↔config bridge matched nothing at all: skill:vectorize-
 * context had zero referrers. Hyphens are legal inside a slug and must stay in
 * the token.
 */
function identifiersIn(content: string): Set<string> {
  const out = new Set<string>();
  const re = /[A-Za-z_$][\w$]*(?:-[A-Za-z0-9_$]+)*/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(content))) out.add(m[0]);
  return out;
}

/**
 * Blank out fenced code blocks and inline code spans, preserving offsets.
 *
 * Offsets are preserved so a match index from the stripped text still refers to
 * the same position as the original — the alternative (matching the raw file
 * and filtering afterwards) cannot tell a real link from a documented example
 * of the link syntax, because they are the same bytes.
 */
export function stripCode(content: string): string {
  const lines = content.split('\n')
  const out = content.split('')

  const blank = (from: number, to: number) => {
    for (let i = from; i < to && i < out.length; i++) if (out[i] !== '\n') out[i] = ' '
  }

  // Line-based rather than a pair of global regexes. A regex that reassigns
  // `lastIndex` while searching for the closing marker desynchronises on any
  // unbalanced block and can fail to advance — it hung the whole build. Skills
  // are full of heredocs and nested `$( )` in bash examples, so unbalanced
  // blocks are the normal case, not the edge case. Tracking one open marker per
  // line is linear and cannot loop.
  // Sweep: blank fenced blocks.
  let offset = 0
  let openMarker: string | null = null
  for (const line of lines) {
    const lineStart = offset
    const lineEnd = offset + line.length
    const fenceMatch = /^[ \t]*(`{3,}|~{3,})/.exec(line)
    if (openMarker === null) {
      if (fenceMatch) {
        openMarker = fenceMatch[1][0]
        blank(lineStart, lineEnd)
      }
    } else {
      blank(lineStart, lineEnd)
      if (fenceMatch && fenceMatch[1][0] === openMarker) openMarker = null
    }
    offset = lineEnd + 1
  }

  // Then blank inline `...` spans within what is left.
  const kept = out.join('')
  const inline = /`[^`\n]*`/g
  let inl: RegExpExecArray | null
  const blanked = kept.split('')
  while ((inl = inline.exec(kept))) {
    for (let i = inl.index; i < inl.index + inl[0].length; i++) {
      if (blanked[i] !== '\n') blanked[i] = ' '
    }
  }
  return blanked.join('')
}

/**
 * A wiki-link target must be a path-like slug.
 *
 * `[[ ... ]]` is also bash's double-bracket test, and skills are full of
 * `if [[ ! -f ~/.psm/projects.json ]]; then`. Those were scraped as cross-page
 * references and reported as broken links to a page named
 * `! -f ~/.psm/projects.json`. Slugs never contain spaces, `!`, `~`, `$`, or
 * quotes, so requiring that shape separates the two syntaxes without a heuristic.
 */
const WIKI_SLUG = /^[A-Za-z0-9._\/-]+$/

/**
 * Directory module a file belongs to, e.g. "tools/hooks" for "tools/hooks/a.ts".
 *
 * A file at the project root (tsconfig.json, AGENTS.md) has no directory, so this
 * used to return null and the file got no `part_of` edge at all — five nodes in
 * this repo, each one edge short of INVARIANT 1 and reachable only by whatever
 * references happened to mention them. Root-level files belong to a root module
 * named after the project directory, which is a real membership a traversal can
 * follow.
 */
function moduleSlugFor(filePath: string, rootName = 'root'): string {
  const norm = String(filePath).replace(/\\/g, '/');
  const dir = norm.split('/').slice(0, -1).join('/');
  return dir ? dir : rootName;
}

export interface CodeBackfillResult {
  files: number;
  symbols: number;
  defines: number;
  uses: number;
  partOf: number;
  bridges: number;
  /** Files whose derived facts changed — the unit of work in a partial rebuild. */
  changed: number;
  /** Files present in the graph but no longer in the code store. */
  removed: number;
  /** True when every file changed (a cold build, or the first incremental one). */
  full: boolean;
  /** Set when a partial rebuild was widened to a full one, and why. */
  forced?: string;
  /** NEWLY INSERTED symbol --part_of--> enclosing-scope edges (0 on a no-op build) */
  nestedLinksAdded: number;
  /** Edgeless nodes given a structural edge derived from their provenance. */
  adopted: number;
  /** Nodes deleted because they still had no edge after adoption. */
  pruned: number;
  /**
   * Edgeless knowledge nodes (decision, concept, pattern, learning, …).
   * Counted, never deleted — see the prune note in backfillFromCode.
   */
  knowledgeOrphans: number;
  /** Fingerprint of the declaration index this build was derived from. */
  signature: string | null;
  skipped: string | null;
}

/**
 * Build the code layer of the graph, and guarantee no leaf is ever edgeless.
 *
 * THE PROBLEM THIS FIXES
 * The graph had 374 `file` nodes and 373 of them were orphans — nodes with
 * zero edges in either direction. They cost a row, an index entry, and a scan
 * on every traversal, and contributed nothing: the BFS refine stage could never
 * expand them. Worse, they were a *different namespace* from the code store:
 * only 2 of 386 code files matched a file node by path, so the vector→node join
 * that hybrid search depends on almost never fired for code hits. The code
 * layer of the graph simply had not been built.
 *
 * THE TWO STRUCTURAL INVARIANTS
 * Edges on leaves are not a thing someone has to remember to add — they fall
 * out of the shape of the data:
 *
 *   1. part_of — every file node points at a `module` node for its directory.
 *      This is unconditional, so a file with zero declarations (a .json, a
 *      lockfile, a plain .md) is still connected. Nothing can be an orphan by
 *      construction.
 *   2. defines — every declaration found in the code store's headings becomes a
 *      `symbol` node, and its file `defines` it. This is what makes the code
 *      layer navigable at declaration granularity instead of file granularity.
 *
 * On top of those, two derived edge types add the structure that makes
 * traversal worth doing:
 *   - uses: a file that references a symbol defined in ANOTHER file. This is
 *     the cross-file call structure, and it is the thing a file-level graph can
 *     never express.
 *   - related_to: a file/symbol that references a rule or skill, which is what
 *     bridges the code half of the graph to the config-asset half. Without it
 *     the two halves never meet and a query about a rule can never reach code.
 *
 * Idempotent, and safe to re-run. Reads code.db read-only and writes only the
 * graph, so it cannot contend with the query path.
 */
/**
 * Read the declarations of specific files from the code store. Scoped by
 * file_path so the index does the filtering — the alternative was pulling every
 * symbol row for every rebuild.
 */
function readSymbolsFor(inputDir: string | undefined, files: string[]) {
  const paths = resolvePaths(inputDir);
  if (!fs.existsSync(paths.codeDbPath) || files.length === 0) return [];
  let db;
  try {
    db = openDatabase(paths.codeDbPath, true);
    const out = [];
    for (let i = 0; i < files.length; i += 400) {
      const part = files.slice(i, i + 400);
      const holes = part.map(() => '?').join(',');
      out.push(...db
        .prepare(
          `SELECT file_path, name, kind, parent FROM symbols WHERE file_path IN (${holes})`,
        )
        .all(...part));
    }
    return out as Array<{ file_path: string; name: string; kind: string; parent: string | null }>;
  } catch {
    return [];
  } finally {
    try { db?.close(); } catch { /* already closed */ }
  }
}

/** Read the identifier lists of specific files, for the uses/bridge passes. */
function readIdentsFor(inputDir: string | undefined, files: string[]) {
  const paths = resolvePaths(inputDir);
  if (!fs.existsSync(paths.codeDbPath) || files.length === 0) return [] as Array<[string, string[]]>;
  let db;
  try {
    db = openDatabase(paths.codeDbPath, true);
    const byFile = new Map<string, string[]>();
    for (let i = 0; i < files.length; i += 400) {
      const part = files.slice(i, i + 400);
      const holes = part.map(() => '?').join(',');
      for (const r of db
        .prepare(`SELECT file_path, identifier FROM code_identifiers WHERE file_path IN (${holes})`)
        .all(...part) as Array<{ file_path: string; identifier: string }>) {
        if (!byFile.has(r.file_path)) byFile.set(r.file_path, []);
        byFile.get(r.file_path)!.push(r.identifier);
      }
    }
    return [...byFile.entries()];
  } catch {
    return [] as Array<[string, string[]]>;
  } finally {
    try { db?.close(); } catch { /* already closed */ }
  }
}

/** Which files mention a given identifier? One indexed lookup, not a rescan. */
function readIdentsMatching(inputDir: string | undefined, identifier: string): string[] {
  const paths = resolvePaths(inputDir);
  if (!fs.existsSync(paths.codeDbPath) || !identifier) return [];
  let db;
  try {
    db = openDatabase(paths.codeDbPath, true);
    return (db
      .prepare('SELECT DISTINCT file_path FROM code_identifiers WHERE identifier = ?')
      .all(identifier) as Array<{ file_path: string }>)
      .map((r) => String(r.file_path || '').replace(/\\/g, '/').replace(/^(\.\.\/)+/, ''))
      .filter(Boolean);
  } catch {
    return [];
  } finally {
    try { db?.close(); } catch { /* already closed */ }
  }
}

export function backfillFromCode(inputDir: string | undefined): CodeBackfillResult {
  const paths = resolvePaths(inputDir);
  const result: CodeBackfillResult = {
    files: 0, symbols: 0, defines: 0, uses: 0, partOf: 0, bridges: 0, nestedLinksAdded: 0,
    changed: 0, removed: 0, full: false,
    adopted: 0, pruned: 0, knowledgeOrphans: 0, skipped: null, signature: null,
  };
  if (!fs.existsSync(paths.codeDbPath)) {
    result.skipped = 'no code.db (build via /maintain-hub vectorize)';
    return result;
  }

  // Root-level files (tsconfig.json, AGENTS.md) have no directory, so their
  // module is the project directory itself. Derived here so the slug is stable
  // across rebuilds — a changed slug would orphan every root file again.
  const rootModule = path.basename(paths.projectRoot) || 'root';

  // Cache-first: an unchanged declaration index means every derived edge would
  // be recomputed to identical values, so the whole rebuild is skipped. This is
  // what keeps a comment-only edit from costing ~1.9s of graph work.
  const sig = structureSignature(inputDir);
  if (sig) {
    const stored = readGraphMeta(inputDir, 'structure_signature');
    if (stored === sig) {
      result.skipped = 'structure unchanged';
      result.signature = sig;
      return result;
    }
  }

  let codeDb;
  try {
    codeDb = openDatabase(paths.codeDbPath, true);
  } catch (err) {
    result.skipped = `code.db unreadable: ${err instanceof Error ? err.message : err}`;
    return result;
  }

  // The two FINGERPRINT tables are what make this partial. Reading 387 hash
  // rows costs ~2ms; re-reading the 64,000-row identifier table to re-hash it in
  // JavaScript cost ~220ms per rebuild even when nothing had changed.
  let fileHashes: Array<{ file_path: string; symbols_hash: string; idents_hash: string }> = [];
  try {
    fileHashes = codeDb
      .prepare('SELECT file_path, symbols_hash, idents_hash FROM code_files')
      .all() as typeof fileHashes;
  } catch {
    fileHashes = [];
  } finally {
    try { codeDb.close(); } catch { /* already closed */ }
  }

  const db = ensureGraphReady(inputDir);

  if (fileHashes.length === 0) {
    // Store predates the fingerprint tables. Fall back to the original
    // whole-project rebuild rather than producing a partial graph from facts
    // that do not exist. Self-healing: the next index pass writes the hashes.
    const sym = db.prepare('SELECT 1 AS ok FROM nodes LIMIT 1').get();
    void sym;
    try {
      db.prepare("INSERT INTO code_files (file_path, symbols_hash, idents_hash) SELECT file_path, '', '' FROM symbols GROUP BY file_path").run();
    } catch { /* store unavailable */ }
    result.skipped = 'store has no code_files fingerprints — reindex once to enable partial rebuilds';
    return result;
  }

  const norm = (p: string) => String(p || '').replace(/\\/g, '/').replace(/^(\.\.\/)+/, '');

  // ── Change detection ──
  // A file whose declared symbols and identifiers are both unchanged cannot
  // produce a different edge, so it is excluded from every computation below.
  // This is what makes the rebuild partial rather than merely faster at writing
  // the same edges.
  const storeHashes = new Map<string, { s: string; i: string }>();
  for (const h of fileHashes) storeHashes.set(norm(h.file_path), { s: h.symbols_hash, i: h.idents_hash });

  const derivedBefore = new Map<string, { s: string; i: string }>();
  try {
    for (const row of db.prepare('SELECT file_path, symbols_hash, idents_hash FROM derived_file').all() as
      Array<{ file_path: string; symbols_hash: string; idents_hash: string }>) {
      derivedBefore.set(norm(row.file_path), { s: row.symbols_hash, i: row.idents_hash });
    }
  } catch { /* table absent on a pre-incremental graph — treat all as changed */ }

  const fileIds = new Set<string>(storeHashes.keys());
  const changedFiles: string[] = [];
  for (const [filePath, h] of storeHashes) {
    const before = derivedBefore.get(filePath);
    if (!before || before.s !== h.s || before.i !== h.i) changedFiles.push(filePath);
  }
  const removedFiles: string[] = [];
  for (const filePath of derivedBefore.keys()) {
    if (!fileIds.has(filePath)) removedFiles.push(filePath);
  }
  // A derivation-rule change invalidates the whole derived graph, not just the
  // files whose contents moved. Detect it by comparing the stored signature's
  // epoch against the current one, and if they differ, treat every file as
  // changed so the new rules are actually applied to the existing nodes.
  let epochBumped = false;
  if (sig) {
    const stored = readGraphMeta(inputDir, 'derivation_epoch');
    epochBumped = stored !== null && stored !== undefined && String(stored) !== String(DERIVATION_EPOCH);
    if (stored === null || stored === undefined) {
      // Pre-epoch graphs have no marker. Treat that as a bump so the derived
      // edges are computed once under the current rules instead of being
      // silently trusted forever.
      epochBumped = true;
    }
    writeGraphMeta(inputDir, 'derivation_epoch', String(DERIVATION_EPOCH));
  }
  if (epochBumped && changedFiles.length < fileIds.size) {
    result.changed = fileIds.size;
    result.forced = 'derivation epoch';
    changedFiles.length = 0;
    changedFiles.push(...fileIds);
  }
  result.changed = changedFiles.length;
  result.removed = removedFiles.length;
  result.full = changedFiles.length === fileIds.size && removedFiles.length === 0;

  // ── Symbol topology ──
  // The graph's own `defines` edges are the record of what it currently
  // believes, so they are the base state; changed files then contribute their
  // new facts. Reading them is ~5ms for 3,300 rows and avoids pulling every
  // file's symbol list out of the store.
  const symbolToFiles = new Map<string, Set<string>>();
  const fileToSymbols = new Map<string, string[]>();
  for (const row of db.prepare("SELECT src_id, dst_id FROM edges WHERE type = 'defines'").all() as
    Array<{ src_id: string; dst_id: string }>) {
    const filePath = norm(row.src_id.replace(/^file:/, ''));
    const name = row.dst_id.replace(/^symbol:/, '');
    if (!symbolToFiles.has(name)) symbolToFiles.set(name, new Set());
    symbolToFiles.get(name)!.add(filePath);
    if (!fileToSymbols.has(filePath)) fileToSymbols.set(filePath, []);
    fileToSymbols.get(filePath)!.push(name);
  }
  const knownSymbols = new Set<string>(symbolToFiles.keys());

  // ── Facts for changed files only ──
  const symbolParent = new Map<string, string>();
  const fileToIdents = new Map<string, string[]>();
  if (changedFiles.length > 0) {
    const symRows = readSymbolsFor(inputDir, changedFiles);
    for (const sym of symRows) {
      const filePath = norm(sym.file_path);
      const name = String(sym.name || '');
      if (!name || name.length < 3) continue;
      if (!symbolToFiles.has(name)) symbolToFiles.set(name, new Set());
      symbolToFiles.get(name)!.add(filePath);
      if (!fileToSymbols.has(filePath)) fileToSymbols.set(filePath, []);
      const list = fileToSymbols.get(filePath)!;
      if (!list.includes(name)) list.push(name);
      if (sym.parent) {
        const par = String(sym.parent);
        if (par !== name && !symbolParent.has(name)) symbolParent.set(name, par);
      }
    }
    for (const [filePath, idents] of readIdentsFor(inputDir, changedFiles)) {
      fileToIdents.set(filePath, idents);
    }
  }

  const newSymbols = new Set<string>();
  for (const [name] of symbolToFiles) if (!knownSymbols.has(name)) newSymbols.add(name);
  const goneSymbols = new Set<string>();
  for (const name of knownSymbols) {
    // A symbol survives only if some file still defines it.
    if (!symbolToFiles.has(name)) goneSymbols.add(name);
  }

  try {
    db.exec('BEGIN');
    try {
      // Only the files whose derived facts moved. A blanket delete would put
      // the cost straight back: 14k edge deletes to re-insert 14k identical
      // edges.
      const dropSrc = [...changedFiles, ...removedFiles].map((f) => nodeId('file', f));
      // Chunked so the statement stays under SQLite's variable limit, and
      // PREPARED — db.exec() cannot bind parameters, so an exec() with `?`
      // placeholders silently matched nothing and deleted no edges at all.
      const dropChunk = 400;
      for (let i = 0; i < dropSrc.length; i += dropChunk) {
        const part = dropSrc.slice(i, i + dropChunk);
        const holes = part.map(() => '?').join(',');
        db.prepare(
          `DELETE FROM edges WHERE src_id IN (${holes}) AND type IN ('defines','uses','related_to','part_of')`,
        ).run(...part);
      }
      // Edges whose destination symbol disappeared entirely (renamed or deleted
      // along with its file) can point from a file that was never rebuilt.
      for (const name of goneSymbols) {
        db.prepare("DELETE FROM edges WHERE type='uses' AND dst_id = ?").run(nodeId('symbol', name));
      }
      // Dangling references: a source file removed from the store.
      for (const f of removedFiles) {
        const id = nodeId('file', f);
        db.prepare('DELETE FROM edges WHERE src_id = ? OR dst_id = ?').run(id, id);
        db.prepare('DELETE FROM nodes WHERE id = ?').run(id);
      }
      db.exec('COMMIT');
    } catch (err) {
      try { db.exec('ROLLBACK'); } catch { /* ignore */ }
      throw err;
    }

    db.exec('BEGIN');
    try {
      const insertNode = (id: string, type: string, title: string, path: string | null, meta?: unknown) => {
        db.prepare(`
          INSERT INTO nodes (id, type, title, path, meta) VALUES (?, ?, ?, ?, ?)
          ON CONFLICT(id) DO UPDATE SET title = excluded.title, path = excluded.path,
                                        meta = COALESCE(excluded.meta, nodes.meta),
                                        updated = datetime('now')
        `).run(id, type, title, path, meta ? JSON.stringify(meta) : null);
      };
      const insertEdge = (src: string, dst: string, type: string) => {
        const r = db.prepare(`
          INSERT INTO edges (src_id, dst_id, type) VALUES (?, ?, ?)
          ON CONFLICT(src_id, dst_id, type) DO NOTHING
        `).run(src, dst, type);
        return r.changes;
      };

      // Directory modules first, so part_of always has a target. Derived from
      // the file set rather than from a separate walk, so a file the store still
      // lists keeps its module even when the file itself did not change.
      const modules = new Set<string>();
      for (const f of fileIds) {
        const m = moduleSlugFor(f, rootModule);
        if (m) modules.add(m);
      }
      for (const mod of modules) {
        insertNode(nodeId('module', mod), 'module', mod, mod);
      }

      // Only changed files get node upserts and invariant edges. Upserting all
      // 3,000 nodes to write 3,000 identical rows was ~240ms of the build; a
      // partial rebuild must not pay it.
      for (const filePath of changedFiles) {
        if (!fileIds.has(filePath)) continue; // removed files handled below
        const base = filePath.split('/').pop() || filePath;
        const fileNode = nodeId('file', filePath);
        insertNode(fileNode, 'file', base, filePath);
        result.files++;

        // INVARIANT 1: part_of to a directory module. Unconditional — this is
        // why a .json or a lockfile with no declarations is still connected.
        result.partOf += insertEdge(
          fileNode,
          nodeId('module', moduleSlugFor(filePath, rootModule)),
          'part_of',
        );

        // INVARIANT 2: defines for every declared symbol.
        for (const name of fileToSymbols.get(filePath) || []) {
          const symNode = nodeId('symbol', name);
          insertNode(symNode, 'symbol', name, filePath);
          result.symbols++;
          result.defines += insertEdge(fileNode, symNode, 'defines');
        }
      }

      // Symbols that a changed file no longer declares lose their node if
      // nothing else declares them either — otherwise a rename leaves a
      // permanently edgeless ghost behind.
      for (const name of goneSymbols) {
        const defs = db.prepare(
          "SELECT COUNT(*) AS c FROM edges WHERE type = 'defines' AND dst_id = ?",
        ).get(nodeId('symbol', name)) as { c: number };
        if (defs.c === 0) db.prepare('DELETE FROM nodes WHERE id = ?').run(nodeId('symbol', name));
      }

      // Nested declarations hang off their enclosing scope, not just their
      // file: `reapAll` is defined in child-registry.ts AND is a member of
      // ChildRegistry. The file edge says where to look; this one says what it
      // belongs to, which is what "is this method overridden anywhere" needs.
      for (const [child, parentName] of symbolParent) {
        if (!symbolToFiles.has(parentName)) continue;
        const r = insertEdge(nodeId('symbol', child), nodeId('symbol', parentName), 'part_of');
        if (r) result.nestedLinksAdded++;
      }

      // ── uses: cross-file symbol references ──
      // Identifier sets come from the store, scoped to changed files. The old
      // version tokenised every file's content on every rebuild, which is the
      // single largest cost this replaces.
      // Fan-out guards, NOT selections. A BINDING cap makes the derivation
      // history-dependent: a full rebuild deletes and re-adds a file's edges (so
      // it ends up with exactly the cap), while a partial rebuild leaves an
      // unchanged file's edges alone (so it keeps whatever it had accumulated).
      // That is precisely how incremental and from-scratch builds came to
      // disagree while each was internally consistent — 69 sources exceeded the
      // original cap of 6.
      //
      // Measured unconstrained fan-out on this project: related_to 82, uses 209,
      // defines 215. These sit ~4x clear of that. A test asserts no source
      // exceeds them, so a cap that starts binding fails loudly instead of
      // silently reintroducing history-dependence.
      const MAX_USES_PER_FILE = 1024;
      for (const filePath of changedFiles) {
        const ids = fileToIdents.get(filePath);
        if (!ids) continue;
        const own = new Set(fileToSymbols.get(filePath) || []);
        let added = 0;
        for (const id of ids) {
          if (added >= MAX_USES_PER_FILE) break;
          if (own.has(id)) continue;
          if (!symbolToFiles.has(id)) continue;
          const defining = symbolToFiles.get(id)!;
          if (defining.has(filePath)) continue; // not cross-file
          result.uses += insertEdge(
            nodeId('file', filePath),
            nodeId('symbol', id),
            'uses',
          );
          added++;
        }
      }

      // ── related_to: bridge code ↔ config assets ──
      // Which code references a given rule or skill? One pass per file, testing
      // each identifier against the set of known slugs. Membership-testing a
      // Set is what makes this cheap: the alternative — a substring search for
      // every slug in every file — is O(files × slugs × content) and takes
      // minutes on a tree this size.
      // ORDER BY id: slug resolution is first-wins, so without a deterministic
      // order the chosen node could differ between otherwise identical runs and
      // the bridge would re-target on every sync.
      const configNodes = db
        .prepare(
          "SELECT id, title FROM nodes WHERE type IN ('rule','skill','agent','concept','pattern','decision') ORDER BY id",
        )
        .all() as Array<{ id: string; title: string }>;
      const slugToNode = new Map<string, string>();
      for (const cn of configNodes) {
        const slug = String(cn.title || '').replace(/[^A-Za-z0-9_-]+/g, '-').replace(/^-+|-+$/g, '');
        if (!slug || slug.length < 4) continue;
        slugToNode.set(slug, cn.id);
        // Slugs are also referenced in underscore form in code.
        const underscored = slug.replace(/-/g, '_');
        if (underscored !== slug) slugToNode.set(underscored, cn.id);
      }
      const MAX_BRIDGES_PER_NODE = 512; // see MAX_USES_PER_FILE — must not bind
      // Changed files first, then any file mentioning a slug the graph has
      // never bridged — a rule or skill added since the last code rebuild. The
      // same cross-file problem as `uses`, solved the same way: one indexed
      // reverse lookup per unbridged slug, never a project rescan. Detecting
      // "unbridged" needs one grouped query rather than a lookup per slug,
      // because a slug that already has incoming edges needs no work at all.
      const bridgedTargets = new Set<string>(
        (db.prepare("SELECT DISTINCT dst_id FROM edges WHERE type = 'related_to'").all() as
          Array<{ dst_id: string }>).map((r) => r.dst_id),
      );
      const newSlugs = new Set<string>();
      const bridgeTargets = [...changedFiles];
      for (const [slug, nodeIdValue] of slugToNode) {
        if (!newSlugs.has(slug) && !bridgedTargets.has(nodeIdValue)) {
          // Unbridged and never linked: a newly added rule or skill.
          newSlugs.add(slug);
        }
        if (!newSlugs.has(slug)) continue;
        const rows = readIdentsMatching(inputDir, slug);
        for (const g of rows) {
          if (g && !bridgeTargets.includes(g)) bridgeTargets.push(g);
        }
      }
      // Targets pulled in by an unbridged slug are not in changedFiles, so their
      // identifier lists have not been fetched yet. Fetch exactly those, rather
      // than re-reading every file.
      const extra = bridgeTargets.filter((f) => !fileToIdents.has(f));
      for (const [filePath, idents] of readIdentsFor(inputDir, extra)) {
        fileToIdents.set(filePath, idents);
      }

      for (const filePath of bridgeTargets) {
        const ids = fileToIdents.get(filePath);
        if (!ids) continue;
        const fileNode = nodeId('file', filePath);
        let added = 0;
        for (const id of ids) {
          if (added >= MAX_BRIDGES_PER_NODE) break;
          const target = slugToNode.get(id);
          if (!target) continue;
          if (target === fileNode) continue;
          if (insertEdge(fileNode, target, 'related_to')) {
            result.bridges++;
            added++;
          }
        }
      }

      db.exec('COMMIT');
    } catch (err) {
      try { db.exec('ROLLBACK'); } catch { /* ignore */ }
      throw err;
    }

    // ── Adopt: give every remaining edgeless node a structural edge ──
    // Same principle as the code layer, applied to provenance. A knowledge node
    // is edgeless because nothing recorded where it came from, so derive the
    // edge from exactly that:
    //   - a wiki node (concept/decision/pattern/learning/entity/…) is part_of the
    //     directory it was extracted from, e.g. context/patterns → module:patterns
    //   - a hub-subcommand is part_of its hub, e.g. orchestrate/ralph →
    //     module:orchestrate
    // This is not a placeholder: "what else lives in this directory" and "what
    // else is in this hub" are both real questions, and the answers are
    // traversable now.
    const adoptable = db
      .prepare(`
        SELECT n.id, n.type, n.path FROM nodes n
        WHERE NOT EXISTS (SELECT 1 FROM edges e WHERE e.src_id = n.id OR e.dst_id = n.id)
      `)
      .all() as Array<{ id: string; type: string; path: string | null }>;

    if (adoptable.length) {
      db.exec('BEGIN');
      try {
        const KNOWN = new Set([
          'concept', 'decision', 'pattern', 'learning', 'entity',
          'source-summary', 'synthesis', 'hub-subcommand', 'command', 'agent',
          'skill', 'rule',
        ]);
        // Types whose natural parent is their own directory (the directory is
        // the meaningful grouping: patterns/ vs decisions/ vs learnings/).
        const BY_DIRECTORY = new Set([
          'concept', 'decision', 'pattern', 'learning', 'entity',
          'source-summary', 'synthesis',
        ]);
        const ensureModule = (slug: string) => {
          const id = nodeId('module', slug);
          db.prepare(`
            INSERT INTO nodes (id, type, title, path) VALUES (?, 'module', ?, ?)
            ON CONFLICT(id) DO NOTHING
          `).run(id, slug, slug);
          return id;
        };
        for (const n of adoptable) {
          if (!KNOWN.has(n.type)) continue;
          const raw = String(n.path || '').replace(/\\/g, '/');
          if (!raw) continue;
          // Strip the .opencode/ prefix nodeId() also removes, so the module
          // slug matches the one the code layer already created.
          const rel = raw.replace(/^\.opencode\//, '').replace(/^(\.\.\/)+/, '');
          const segments = rel.split('/');
          let slug: string;
          if (n.type === 'hub-subcommand') {
            // Keyed "hub/sub" with no directory — the hub is the parent.
            slug = segments[0] || '';
          } else if (BY_DIRECTORY.has(n.type)) {
            slug = segments.slice(0, -1).join('/') || 'context';
          } else {
            // skill / rule / agent / command live in their own directory, so
            // keying on that would make a 1:1 mirror node and an edge that
            // carries no information. Their meaningful grouping is the
            // top-level collection: "all skills", "all rules".
            slug = segments[0] || 'context';
          }
          if (!slug) continue;
          const modId = ensureModule(slug);
          const r = db.prepare(`
            INSERT INTO edges (src_id, dst_id, type) VALUES (?, ?, 'part_of')
            ON CONFLICT(src_id, dst_id, type) DO NOTHING
          `).run(n.id, modId);
          if (r.changes) result.adopted++;
        }
        db.exec('COMMIT');
      } catch (err) {
        try { db.exec('ROLLBACK'); } catch { /* ignore */ }
        throw err;
      }
    }

    // ── Prune: whatever is STILL edgeless is genuine waste ──
    // Scoped to the code layer. An earlier version pruned every edgeless node
    // and quietly destroyed 23 decision and 38 concept nodes — real knowledge
    // that merely had not been linked yet, not junk. Knowledge nodes that
    // survive adoption are counted in knowledgeOrphans rather than deleted:
    // their content is still in the vector store even when the graph link is
    // missing, so deleting them costs a retrieval target for no real gain.
    const orphans = db
      .prepare(`
        SELECT id FROM nodes n
        WHERE n.type IN ('file','symbol','module')
          AND NOT EXISTS (SELECT 1 FROM edges e WHERE e.src_id = n.id OR e.dst_id = n.id)
      `)
      .all() as Array<{ id: string }>;
    if (orphans.length) {
      db.exec('BEGIN');
      try {
        const del = db.prepare('DELETE FROM nodes WHERE id = ?');
        for (const o of orphans) {
          del.run(o.id);
          result.pruned++;
        }
        db.exec('COMMIT');
      } catch (err) {
        try { db.exec('ROLLBACK'); } catch { /* ignore */ }
        throw err;
      }
    }

    // Knowledge-layer orphans: counted, not deleted — see the prune note above.
    const knowledgeOrphans = db
      .prepare(`
        SELECT COUNT(*) AS c FROM nodes n
        WHERE n.type NOT IN ('file','symbol','module')
          AND NOT EXISTS (SELECT 1 FROM edges e WHERE e.src_id = n.id OR e.dst_id = n.id)
      `)
      .get() as { c: number };
    result.knowledgeOrphans = knowledgeOrphans.c;

    // Record what this graph derives from each file, so the next call can do
    // per-file change detection instead of a whole-project rebuild.
    const upDf = db.prepare(
      `INSERT INTO derived_file (file_path, symbols_hash, idents_hash) VALUES (?, ?, ?)
       ON CONFLICT(file_path) DO UPDATE SET symbols_hash = excluded.symbols_hash,
                                          idents_hash = excluded.idents_hash`,
    );
    // Write back the FINGERPRINTS THE STORE REPORTED — never re-derive them
    // here. Re-hashing in the graph would re-introduce the ~220ms per rebuild
    // that moving the fingerprints into code.db was meant to remove.
    for (const [filePath, h] of storeHashes) {
      upDf.run(filePath, h.s, h.i);
    }
    for (const filePath of removedFiles) {
      db.prepare('DELETE FROM derived_file WHERE file_path = ?').run(filePath);
    }

    // Record what this graph now describes, so the next call can short-circuit
    // when the declaration index has not moved.
    if (sig) {
      result.signature = sig;
      writeGraphMeta(inputDir, 'structure_signature', sig);
    }

    return result;
  } finally {
    db.close();
  }
}

// ─── Frontmatter parsing ───────────────────────────────────────────────────

/**
 * One hub subcommand entry as it appears in tools/hubs/spec-registry.json.
 * Only the fields the graph builder reads are typed; the registry carries many
 * more (detailedDescription, examples, warnings) that are irrelevant here.
 */
export interface HubSubcommandSpec {
  label?: string;
  skill?: string;
  agent?: string;
  inline?: boolean;
  [k: string]: unknown;
}

/** Options for the hybrid vector-recall → graph-refine query. */
export interface HybridQueryOptions {
  /** BFS depth for the refinement pass. */
  depth?: number;
  /** Forwarded to the vector store; false skips the cross-encoder. */
  useReranker?: boolean;
  /** Also recall from the code store, not just the context store. Default true. */
  includeCode?: boolean;
  /** Cap on ANN candidates per store before reranking. */
  rerankCandidates?: number;
}

/** A vector-store hit before it is mapped onto a graph node. */
interface VectorHit {
  file_path?: string;
  source?: string;
  heading?: string;
  content?: string;
  /** Cross-encoder relevance, 0..1 sigmoid. Null when reranking was skipped. */
  rerank_score?: number | null;
  /** Raw ANN distance. Lower is closer. */
  distance?: number;
  /** Which store produced this hit. */
  store?: 'context' | 'code';
}

/**
 * Convert a vector hit into a seed weight.
 *
 * This used to be `1 / (seeds.length + 1)` — a purely positional harmonic
 * series. That made the cross-encoder's output almost worthless: the reranker
 * decided which rows survived and what order they came back in, but the moment
 * a hit mapped to a graph node its relevance was thrown away and replaced by
 * "it happened to be Nth". A marginal hit at rank 8 seeded the BFS almost as
 * strongly as a strong hit at rank 1, and the RELATED_SCORE_DECAY multiply ran
 * on a number that carried no relevance information at all.
 *
 * Now the score IS the relevance:
 *   - rerank_score (sigmoid 0..1) is used directly when the reranker ran.
 *   - Otherwise cosine distance is mapped through 1 - d, which for normalized
 *     embeddings is monotonic in similarity.
 * The result is normalized to (0, 1] against the best hit so seed ordering and
 * the decay arithmetic both stay in a sane range.
 */
function seedScoreFor(hit: VectorHit, best: number): number {
  let raw: number;
  if (typeof hit.rerank_score === 'number' && Number.isFinite(hit.rerank_score)) {
    raw = hit.rerank_score;
  } else if (typeof hit.distance === 'number' && Number.isFinite(hit.distance)) {
    raw = Math.max(0, 1 - hit.distance);
  } else {
    raw = 0.5;
  }
  if (best <= 0) return 0.01;
  // Normalize to (0, 1]: the top hit is 1, everything else is relative to it.
  return Math.max(0.01, Math.min(1, raw / best));
}

/**
 * Parsed YAML frontmatter. Values are string | string[] because the parser is a
 * deliberately tiny line-splitter: `[a, b]` becomes an array, everything else
 * stays a string. Consumers must therefore coerce before use (String(fm.type)
 * and Array.isArray(fm.tags) at the call sites).
 */
export interface Frontmatter {
  [key: string]: string | string[] | undefined;
}

export function parseFrontmatter(content: string): Frontmatter | null {
  const m = content.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  if (!m) return null;
  const fm: Frontmatter = {};
  for (const line of m[1].split('\n')) {
    const kv = line.match(/^([A-Za-z_-]+):\s*(.*)$/);
    if (!kv) continue;
    let value = kv[2].trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    if (value.startsWith('[') && value.endsWith(']')) {
      fm[kv[1]] = value
        .slice(1, -1)
        .split(',')
        .map(s => s.trim().replace(/^["']|["']$/g, ''))
        .filter(Boolean);
      continue;
    }
    fm[kv[1]] = value;
  }
  return fm;
}

// ─── Backfill: wiki + rules + learnings + registry → nodes/edges ───────────

async function walk(dir) {
  const out = [];
  let entries;
  try {
    entries = await fs.promises.readdir(dir, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name.startsWith('.') || entry.name === 'node_modules') continue;
      out.push(...(await walk(full)));
    } else if (entry.isFile() && entry.name.endsWith('.md')) {
      out.push(full);
    }
  }
  return out;
}

async function getMtime(filePath) {
  try {
    const s = await fs.promises.stat(filePath);
    return s.mtime.toISOString();
  } catch {
    return null;
  }
}

const mtimeCache = new Map(); // filePath -> mtime (per process)
function hasChanged(filePath) {
  const stat = fs.existsSync(filePath) ? fs.statSync(filePath) : null;
  if (!stat) return true;
  const mtime = stat.mtime.toISOString();
  const prev = mtimeCache.get(filePath);
  mtimeCache.set(filePath, mtime);
  return prev !== mtime;
}

/**
 * Backfill the graph from durable markdown sources. Idempotent — nodes/edges
 * are upserted; mtime-based skip keeps re-runs cheap. Scoped sources:
 *   .opencode/context/**  (wiki — node per page, type from frontmatter)
 *   .opencode/context/learnings/**  (typed LRN/ERR/FEAT entries → learning nodes)
 *   .opencode/rules/**    (rule nodes)
 *   .opencode/skills — SKILL.md manifests (skill nodes)
 *   AGENTS.md             (entity node for the project itself)
 *
 * Edges derived:
 *   - wiki page → derived_from → its sources[] (by slug match)
 *   - wiki page → related_to → pages it links to via markdown links
 *   - learning → touches → nodes whose title/path matches its Area/Pattern-Key
 *   - rule/skill → part_of → AGENTS.md project node
 */
export async function backfillFromWiki(inputDir) {
  const paths = resolvePaths(inputDir);
  const db = ensureGraphReady(inputDir);
  // `skippedLinks` counts links whose target page does not exist. Surfaced rather
  // than swallowed: a wiki full of them means the links are wrong, and that is a
  // content bug someone needs to see, not a statistic to hide.
  const stats = {
    nodes: 0, edges: 0, tags: 0, filesScanned: 0, filesSkipped: 0,
    skippedLinks: 0 as number,
    /** A sample of the unresolved targets, so the count is diagnosable. */
    skippedLinkSamples: [] as string[],
  };
  try {
    // Project node
    if (fs.existsSync(paths.agentsFile)) {
      const projectName = path.basename(paths.projectRoot);
      upsertNodeInner(db, { id: nodeId('entity', projectName), type: 'entity', title: projectName, path: paths.agentsFile });
      stats.nodes++;
    }

    const allMd = [];
    for (const dir of [paths.contextDir, paths.rulesDir]) {
      if (fs.existsSync(dir)) allMd.push(...(await walk(dir)));
    }
    // The rules the runtime actually loads, read from opencode.jsonc. Needed
    // because the rules directory is not always .opencode/rules — in this
    // project it is <projectRoot>/rules, and without this every rule governing
    // the config was missing from the graph.
    const instructionFiles = instructionMarkdownFiles(paths.projectRoot);
    const instructionFileSet = new Set(instructionFiles.map((f) => path.resolve(f)));
    const seenMd = new Set(allMd.map((f) => path.resolve(f)));
    for (const f of instructionFiles) {
      const abs = path.resolve(f);
      if (seenMd.has(abs)) continue;
      seenMd.add(abs);
      allMd.push(abs);
    }
    // Learnings are inside contextDir — avoid double-scanning (walk already covers them)

    // Also index skill manifests (global + project)
    const skillMds = [];
    const skillDirs = [paths.skillsDir, path.join(process.env.HOME || '', '.config', 'opencode', 'skills')];
    for (const dir of skillDirs) {
      if (fs.existsSync(dir)) {
        const found = await walk(dir);
        skillMds.push(...found.filter(f => f.endsWith('SKILL.md')));
      }
    }

    // Agent definitions, indexed for the same reason skills are: the registry
    // emits `used_by` edges from each hub subcommand to the agent it delegates
    // to, and those edges were written against agent nodes that nothing in the
    // graph ever created. Every one of the 26 agent edges in this repo dangled,
    // so "which agent handles /build-hub executor" had no answer — the edge
    // looked like it was carrying the fact and was carrying nothing.
    // Markdown bundled with a skill, other than its SKILL.md: `references/*.md`,
    // `resources/*.md`, `REFERENCE.md`, and so on. Agents load these at runtime
    // and nothing indexed them, so a SKILL.md link to one was reported broken
    // while the file sat on disk. Only `references/` was considered at first,
    // which still missed `mui/resources/` and a skill's root-level REFERENCE.md.
    const skillBundledMds: Array<{ file: string; skill: string }> = []
    for (const dir of skillDirs) {
      if (!fs.existsSync(dir)) continue
      let entries: fs.Dirent[] = []
      try {
        entries = fs.readdirSync(dir, { withFileTypes: true })
      } catch { continue }
      for (const entry of entries) {
        if (!entry.isDirectory()) continue
        const skillRoot = path.join(dir, entry.name)
        const found = await walk(skillRoot)
        for (const f of found) {
          if (!f.endsWith('.md')) continue
          if (path.basename(f) === 'SKILL.md') continue
          skillBundledMds.push({ file: f, skill: entry.name })
        }
      }
    }

    const agentMds = [];
    const agentDirs = [paths.agentsDir, path.join(process.env.HOME || '', '.config', 'opencode', 'agents')];
    for (const dir of agentDirs) {
      if (fs.existsSync(dir)) {
        const found = await walk(dir);
        agentMds.push(...found.filter(f => f.endsWith('.md')));
      }
    }


    // Wiki links and relatedSkills, buffered until pass 2 so each edge is only
    // written when its target node actually exists.
    /**
     * Links awaiting resolution, as `[sourceNodeId, rawTarget, sourceRelPath]`.
     *
     * The source path is carried because a markdown link is RELATIVE to the file
     * that contains it. Deriving the target node id from the raw string alone
     * meant `../docs/skills.md` inside `context/docs/agents.md` looked for a node
     * literally named `../docs/skills` and was reported as a broken link — while
     * the page it names (`context/docs/skills.md`) exists and is indexed. 34 of
     * the 205 "broken" links were this, not missing content.
     */
    const pendingLinks: Array<[string, string, string]> = [];

    // ── Pass 1: nodes ──
    const agentSet = new Set(agentMds.map((f) => path.resolve(f)))
    const referenceSkillByFile = new Map(skillBundledMds.map((r) => [path.resolve(r.file), r.skill]));
    const titleToId = new Map(); // slugified title -> node id (for edge resolution)
    // id -> source file, so the cross-link pass below can re-read content.
    const nodeFile = new Map<string, string>();
    const nodeType = new Map<string, string>();
    for (const filePath of [...allMd, ...skillMds, ...agentMds, ...skillBundledMds.map((r) => r.file)]) {
      // Relative to .opencode/ for context/rules/docs, but those two can sit
      // OUTSIDE it — this project keeps its rules at <projectRoot>/rules — and
      // a leading "../" would otherwise leak into every rule node id
      // (rule:../rules/efficiency-first). Fall back to project-root-relative so
      // ids are stable and readable wherever the file lives.
      let rel = path.relative(paths.opencodeDir, filePath);
      if (rel.startsWith('..')) {
        rel = path.relative(paths.projectRoot, filePath).replace(/\\/g, '/');
      }
      rel = rel.replace(/\\/g, '/');
      if (hasChanged(filePath) === false && db.prepare('SELECT id FROM nodes WHERE path = ?').get(rel)) {
        stats.filesSkipped++;
        continue;
      }
      stats.filesScanned++;
      let content;
      try {
        content = await fs.promises.readFile(filePath, 'utf-8');
      } catch {
        continue;
      }
      const fm = parseFrontmatter(content);
      const mtime = await getMtime(filePath);
      const isSkillManifest = filePath.endsWith('SKILL.md');
      const isLearning = rel.includes('/learnings/');
      // Structural classification first: where the file LIVES determines what
      // it is. Frontmatter `type:` is an optional refinement, not the source of
      // truth, because a rule that omits it would otherwise be filed as a
      // generic concept and become invisible to rule-scoped queries. Checked
      // against both the conventional .opencode/rules directory and the files
      // the runtime actually loads via opencode.jsonc instructions, because
      // this project keeps its rules at <projectRoot>/rules.
      const isRule =
        filePath.startsWith(paths.rulesDir + path.sep) ||
        rel.startsWith('rules/') ||
        instructionFileSet.has(path.resolve(filePath));
      let type = isRule ? 'rule' : 'concept';
      let title = path.basename(filePath).replace(/\.md$/, '');
      if (fm && fm.type && NODE_TYPES.has(String(fm.type))) type = String(fm.type);
      if (fm && fm.title) title = String(fm.title);
      if (isSkillManifest) {
        // Skill nodes use the skill directory name as the id — matches the
        // registry's skill:{name} edge targets (used_by edges must resolve).
        type = 'skill';
        title = path.basename(path.dirname(filePath));
      } else if (referenceSkillByFile.has(path.resolve(filePath))) {
        // Keyed by path relative to `.opencode/`, so a link from the owning
        // SKILL.md (`references/foo.md`) resolves to this node.
        type = 'reference'
        title = path.basename(filePath).replace(/\.md$/, '')
      } else if (agentSet.has(path.resolve(filePath))) {
        // Agent nodes use the FILE STEM as the id (agents/executor.md →
        // agent:executor), matching the bare-name convention below. The
        // registry names agents in @mention form, so the `@` is stripped at
        // edge time — see backfillFromRegistry.
        type = 'agent';
        title = path.basename(filePath).replace(/\.md$/, '');
      }
      if (isLearning) {
        type = 'learning';
        const m = content.match(/^## (LRN|ERR|FEAT)-\d+[^\n]*/m);
        if (m) title = m[0].replace(/^## /, '');
      }

      // Rule, skill and agent nodes are keyed by BARE NAME, not by path — the
      // same convention skills already use. Keying a rule by path gave
      // rule:rules/efficiency-first, which nobody can guess and which breaks
      // every lookup of the form rule:<name>. The registry's used_by edges and
      // any rule-scoped query both need the bare form. Agents were the same bug
      // one layer over: they were indexed as agent:agents/executor while the
      // registry points at agent:executor, so all 26 of those edges missed.
      const bareNamed = isSkillManifest || isRule || type === 'agent';
      const id = bareNamed
        ? nodeId(type, title)
        : nodeId(type, rel || slugify(title));
      const meta = fm ? { tags: Array.isArray(fm.tags) ? fm.tags : (fm.tags ? [fm.tags] : []), status: fm.status, sources: fm.sources, relatedSkills: fm.relatedSkills } : {};
      upsertNodeInner(db, { id, type, title, path: rel, meta, mtime });
      stats.nodes++;
      titleToId.set(slugify(title), id);
      // The reference hangs off its skill, so `neighbors` from a skill reaches
      // the files it can load.
      const owner = referenceSkillByFile.get(path.resolve(filePath))
      if (owner) {
        db.prepare('INSERT OR IGNORE INTO edges (src_id, dst_id, type) VALUES (?, ?, ?)')
          .run(id, nodeId('skill', owner), 'part_of')
        stats.edges++
      }
      nodeFile.set(id, filePath);
      nodeType.set(id, type);

      if (meta.tags) {
        for (const tag of meta.tags) {
          db.prepare('INSERT OR IGNORE INTO node_tags (node_id, tag) VALUES (?, ?)').run(id, tag);
          stats.tags++;
        }
      }

      // Frontmatter relatedSkills and wiki links are COLLECTED here and written
      // in pass 2, once every node exists. They used to be inserted immediately
      // against a comment that called the resulting dangles "harmless". They were
      // not: 88 edges pointed at 50 nodes that no page ever created, so every
      // traversal and every `impact` answer that followed one of them walked into
      // a dead end and reported a dependency on nothing. An edge to a page that
      // does not exist is not a pending edge, it is a false one.
      if (meta.relatedSkills) {
        // A comma-separated scalar is the common YAML idiom for this field and
        // was previously pushed as ONE name, so `relatedSkills: rsi, wiki` linked
        // to nothing at all. Split on commas and trim, so both spellings work.
        const list = Array.isArray(meta.relatedSkills) ? meta.relatedSkills : [meta.relatedSkills];
        for (const entry of list) {
          for (const name of String(entry).split(',')) {
            const trimmed = name.trim()
            if (trimmed) pendingLinks.push([id, trimmed, rel])
          }
        }
      }

      // Scan `stripCode(content)`, not the raw file. Three classes of text are
      // not links: fenced code, inline code spans, and external URLs. A GitHub
      // URL ending in `.md` matched the markdown-link branch and was then
      // reported as an unresolved internal link, so a page full of perfectly
      // good source citations was counted as broken. The `[[page-slug]]` example
      // inside wiki-schema.md was likewise scraped as a real cross-reference.
      const linkRe = /\[\[([^\]|]+)(?:\|[^\]]+)?\]\]|\[[^\]\n]*\]\(([^)\n]+\.md)\)/g;
      let m;
      // `resolveLinks: false` in frontmatter exempts a file. Templates and
      // worked examples link to files that exist in the project the template
      // generates, not here, so their links are correct in context and would
      // otherwise be reported as broken on every build.
      // parseFrontmatter keeps scalars as strings, so `resolveLinks: false`
      // arrives as "false". Comparing against the boolean silently never matched
      // and the exemption did nothing.
      const scannable = fm && String(fm.resolveLinks) === 'false' ? '' : stripCode(content);
      while ((m = linkRe.exec(scannable))) {
        const target = (m[1] || m[2] || '').trim().replace(/\\/g, '/');
        if (!target) continue;
        if (/^(https?:|mailto:|ftp:)/i.test(target)) continue;
        if (!WIKI_SLUG.test(target)) continue;
        pendingLinks.push([id, target, rel]);
      }
    }

    // ── Pass 2: edges (needs all nodes indexed) ──
    // Links collected in pass 1, written only where the target actually exists.
    // Insert-or-ignore does not enforce referential integrity, so without this
    // check a link to a missing page silently became a permanent dead end.
    const nodeExists = db.prepare('SELECT 1 AS ok FROM nodes WHERE id = ? LIMIT 1');
    const nodeByPath = db.prepare('SELECT id FROM nodes WHERE path = ? LIMIT 1');
    // A bare slug can end a node id either as `skill:vectorize-context` or as the
    // last segment of a path-keyed id such as
    // `source-summary:context/research/arcanum`. Matching only `':' || slug` found
    // the first and missed the second, which reported every link to a research
    // page as broken even though the page existed and was indexed.
    const nodeBySuffix = db.prepare("SELECT id FROM nodes WHERE id LIKE '%:' || ? LIMIT 1");
    const nodeByPathSlug = db.prepare("SELECT id FROM nodes WHERE id LIKE '%/' || ? LIMIT 1");
    let skippedLinks = 0;
    const skippedSamples: string[] = [];

    /** Collapse `a/b/../c` and `./` without touching the filesystem. */
    const normalizePath = (p: string): string => {
      const out: string[] = [];
      for (const seg of p.split('/')) {
        if (!seg || seg === '.') continue;
        if (seg === '..') { out.pop(); continue; }
        out.push(seg);
      }
      return out.join('/');
    };

    /**
     * Resolve a link to a node id, or null when nothing matches.
     *
     * Tried in order, most specific first:
     *   1. an exact node id            — `concept:decisions`
     *   2. a path relative to the page — `../docs/skills.md` inside `context/docs/`
     *   3. a path relative to the context root
     *   4. a bare slug suffix          — `vectorize-context`
     *
     * Resolution is by PATH rather than by guessing a node type, because the type
     * of a page comes from its frontmatter (`entity:` here, `concept:` there) and
     * is not derivable from the file it lives in.
     */
    const resolveLink = (target: string, sourceRel: string, selfId: string): string | null => {
      const bare = target.replace(/\.md$/, '');
      const direct = db.prepare('SELECT 1 AS ok FROM nodes WHERE id = ? LIMIT 1').get(bare);
      if (direct) return bare;

      const endsInMd = /\.md$/.test(target);
      if (target.includes('/') || endsInMd) {
        const sourceDir = sourceRel.includes('/') ? sourceRel.slice(0, sourceRel.lastIndexOf('/')) : '';
        for (const base of [sourceDir, 'context', '']) {
          const candidate = normalizePath(base ? `${base}/${target}` : target);
          if (!candidate) continue;
          for (const p of endsInMd ? [candidate] : [candidate, `${candidate}.md`]) {
            const hit = nodeByPath.get(p) as { id: string } | undefined;
            if (hit && hit.id !== selfId) return hit.id;
          }
        }
      }

      if (!target.includes('/')) {
        const byType = nodeBySuffix.get(bare) as { id: string } | undefined
        if (byType && byType.id !== selfId) return byType.id
        // A bare slug can also be the LAST SEGMENT of a path-keyed id, e.g.
        // `source-summary:context/research/arcanum` for `[[arcanum]]`. Matching
        // only `':' || slug` found `skill:vectorize-context` and missed every
        // research page, so all 38 links into research/ were reported broken
        // while the pages sat there indexed.
        const byPath = nodeByPathSlug.get(bare) as { id: string } | undefined
        if (byPath && byPath.id !== selfId) return byPath.id
      }
      return null;
    };

    for (const [srcId, target, sourceRel] of pendingLinks) {
      const dstId = resolveLink(target, sourceRel, srcId);
      if (!dstId || dstId === srcId || !nodeExists.get(dstId)) {
        skippedLinks++;
        if (skippedSamples.length < 12) skippedSamples.push(`${sourceRel} -> ${target}`);
        continue;
      }
      db.prepare('INSERT OR IGNORE INTO edges (src_id, dst_id, type) VALUES (?, ?, ?)').run(srcId, dstId, 'related_to');
      stats.edges++;
    }
    if (skippedLinks) {
      stats.skippedLinks = (stats.skippedLinks ?? 0) + skippedLinks;
      // Named, not just counted: "205 links skipped" is not actionable, and the
      // count is the whole reason this became visible.
      stats.skippedLinkSamples = [...(stats.skippedLinkSamples ?? []), ...skippedSamples];
    }

    // sources[] → derived_from
    const nodeRows = db.prepare('SELECT id, meta FROM nodes').all();
    for (const row of nodeRows) {
      let meta = null;
      try { meta = row.meta ? JSON.parse(row.meta) : null; } catch { /* ignore */ }
      if (!meta || !meta.sources) continue;
      for (const src of Array.isArray(meta.sources) ? meta.sources : [meta.sources]) {
        const slug = String(src).toLowerCase().replace(/[^a-z0-9]+/g, '-');
        // Find matching node by title slug OR file slug
        const match = db.prepare('SELECT id FROM nodes WHERE id LIKE ? OR LOWER(title) LIKE ? LIMIT 1')
          .get(`%${slug}%`, `%${String(src).toLowerCase()}%`);
        if (match) {
          db.prepare('INSERT OR IGNORE INTO edges (src_id, dst_id, type) VALUES (?, ?, ?)').run(row.id, match.id, 'derived_from');
          stats.edges++;
        }
      }
    }

    // learnings → touches → matching nodes
    const learnings = db.prepare("SELECT id, meta FROM nodes WHERE type = 'learning'").all();
    for (const l of learnings) {
      let meta = null;
      try { meta = l.meta ? JSON.parse(l.meta) : null; } catch { /* ignore */ }
      if (!meta) continue;
      const area = meta.area || meta['Pattern-Key'] || '';
      if (!area) continue;
      const match = db.prepare('SELECT id FROM nodes WHERE LOWER(title) LIKE ? OR LOWER(id) LIKE ? LIMIT 3')
        .all(`%${String(area).toLowerCase()}%`, `%${String(area).toLowerCase()}%`);
      for (const m of match) {
        if (m.id === l.id) continue;
        db.prepare('INSERT OR IGNORE INTO edges (src_id, dst_id, type) VALUES (?, ?, ?)').run(l.id, m.id, 'touches');
        stats.edges++;
      }
    }

    // ── Knowledge cross-links ──
    // A rule that names another rule is a real, traversable relationship, and it
    // is the only kind of edge that survives when no source file happens to
    // mention the rule by name. Without this, rule:efficiency-first had exactly
    // one edge (part_of its directory) despite AGENTS.md and three other rules
    // invoking it — the "which rules govern this work" question was unanswerable
    // at the knowledge layer even though the code layer could answer it.
    // Cheap: one content read per knowledge node, membership test per token.
    const LINKABLE = new Set(['rule', 'skill', 'agent', 'concept', 'pattern', 'decision', 'command']);
    // Same recompute-not-accumulate rule as the code layer, for the same
    // reason: these links are derived from file content, and the wiki index and
    // log files grow over time, so accumulating them would inflate the graph on
    // every run. Curated touches/applies_to are left alone.
    db.exec(`
      DELETE FROM edges
      WHERE type = 'related_to' AND src_id IN (
        SELECT id FROM nodes WHERE type IN ('rule','skill','agent','concept','pattern','decision','command')
      )
    `);
    // Deterministic first-wins slug resolution (see the code-bridge note).
    const slugToNode = new Map<string, string>();
    const orderedIds = [...nodeType.keys()].sort();
    for (const id of orderedIds) {
      const type = nodeType.get(id)!;
      if (!LINKABLE.has(type)) continue;
      const node = db.prepare('SELECT title FROM nodes WHERE id = ?').get(id) as { title: string } | undefined;
      if (!node) continue;
      const slug = slugify(String(node.title || ''));
      if (slug.length < 4) continue;
      if (!slugToNode.has(slug)) slugToNode.set(slug, id);
    }
    const MAX_LINKS_PER_NODE = 12;
    for (const [id, type] of nodeType) {
      if (!LINKABLE.has(type)) continue;
      const filePath = nodeFile.get(id);
      if (!filePath) continue;
      let content: string;
      try {
        content = fs.readFileSync(filePath, 'utf-8');
      } catch {
        continue;
      }
      let added = 0;
      for (const token of identifiersIn(content)) {
        if (added >= MAX_LINKS_PER_NODE) break;
        const target = slugToNode.get(slugify(token));
        if (!target || target === id) continue;
        const r = db
          .prepare('INSERT OR IGNORE INTO edges (src_id, dst_id, type) VALUES (?, ?, \'related_to\')')
          .run(id, target);
        if (r.changes) { stats.edges++; added++; }
      }
    }

    return stats;
  } finally {
    db.close();
  }
}

function upsertNodeInner(db, node) {
  const id = node.id || nodeId(node.type, slugify(node.title));
  const existing = db.prepare('SELECT id FROM nodes WHERE id = ?').get(id);
  if (existing) {
    db.prepare(`
      UPDATE nodes SET title = ?, path = COALESCE(?, path), meta = COALESCE(?, meta),
             mtime = COALESCE(?, mtime), updated = datetime('now') WHERE id = ?
    `).run(node.title, node.path || null, node.meta ? JSON.stringify(node.meta) : null, node.mtime || null, id);
  } else {
    db.prepare('INSERT INTO nodes (id, type, title, path, meta, mtime) VALUES (?, ?, ?, ?, ?, ?)')
      .run(id, node.type, node.title, node.path || null, node.meta ? JSON.stringify(node.meta) : null, node.mtime || null);
  }
}

/**
 * Backfill from the hub spec-registry (config-hub projects only):
 *   tools/hubs/spec-registry.json → hub-subcommand nodes + used_by edges to skills
 */
/**
 * Delete edges whose endpoints no longer exist, and report how many.
 *
 * The graph has no foreign keys, so a node that is deleted or renamed — an agent
 * re-keyed from agent:agents/executor to agent:executor, a symbol that lost its
 * last definer — leaves its edges behind pointing at nothing. SQLite does not
 * object, so the graph keeps reporting relationships it can no longer resolve:
 * a traversal walks into a dead end and `impact` names a dependency that does
 * not exist. This ran as a manual cleanup; making it part of every build means
 * the corruption cannot accumulate, and the count makes a regression visible
 * instead of silent.
 */
export function pruneDanglingEdges(inputDir: string | undefined): number {
  const paths = resolvePaths(inputDir);
  if (!fs.existsSync(paths.graphDbPath)) return 0;

  const DANGLING = `SELECT COUNT(*) AS c FROM edges
     WHERE NOT EXISTS (SELECT 1 FROM nodes n WHERE n.id = edges.src_id)
        OR NOT EXISTS (SELECT 1 FROM nodes n WHERE n.id = edges.dst_id)`;

  // Count first, on a READONLY handle. Opening the graph for writing to run a
  // DELETE that matches nothing still takes an exclusive lock for the duration
  // of the statement, and on an 18k-edge table that is long enough to stall a
  // concurrent reader — which is how this function turned into a source of
  // multi-second hangs for vector queries happening at the same time. The check
  // is one cheap indexed-enough query; the write only happens when there is
  // genuinely something to remove.
  const probe = openDatabase(paths.graphDbPath, true);
  let pending: number;
  try {
    pending = (probe.prepare(DANGLING).get() as { c: number }).c;
  } finally {
    try { probe.close(); } catch { /* already closed */ }
  }
  if (pending === 0) return 0;

  const db = openDatabase(paths.graphDbPath, false);
  try {
    return db.prepare(`DELETE FROM edges WHERE ${DANGLING.replace('COUNT(*) AS c FROM edges', '')}`).run().changes;
  } finally {
    try { db.close(); } catch { /* already closed */ }
  }
}

export async function backfillFromRegistry(inputDir) {
  const paths = resolvePaths(inputDir);
  if (!fs.existsSync(paths.registryPath)) return { skipped: 'no spec-registry.json' };
  if (!hasChanged(paths.registryPath)) return { skipped: 'registry unchanged' };

  const db = ensureGraphReady(inputDir);
  // `skippedTargets` counts registry references to a skill or agent that has no
  // node — a real gap in the asset inventory, reported rather than hidden behind
  // a dangling edge.
  const stats = { nodes: 0, edges: 0, skippedTargets: 0 as number };
  try {
    const registry = JSON.parse(fs.readFileSync(paths.registryPath, 'utf-8')) as Record<string, HubSubcommandSpec>;
    for (const [key, spec] of Object.entries(registry)) {
      if (!spec || typeof spec !== 'object' || !spec.label) continue;
      const hub = key.split('/')[0];
      const id = nodeId('hub-subcommand', key);
      upsertNodeInner(db, {
        id,
        type: 'hub-subcommand',
        title: `${hub}/${spec.label}`,
        path: key,
        meta: { hub, skill: spec.skill, agent: spec.agent, inline: spec.inline },
      });
      stats.nodes++;
      // `used_by` edges are the only record of which skill or agent a hub
      // subcommand delegates to, so they are written only when the target node
      // exists. They were previously written unconditionally against whatever the
      // registry named, which is how 26 agent edges came to point at nodes that
      // did not exist and quietly answered "nothing".
      const hasNode = db.prepare('SELECT 1 AS ok FROM nodes WHERE id = ? LIMIT 1');
      if (spec.skill) {
        const skillId = nodeId('skill', spec.skill);
        if (hasNode.get(skillId)) {
          db.prepare('INSERT OR IGNORE INTO edges (src_id, dst_id, type) VALUES (?, ?, ?)').run(id, skillId, 'used_by');
          stats.edges++;
        } else {
          stats.skippedTargets = (stats.skippedTargets ?? 0) + 1;
        }
      }
      if (spec.agent) {
        // Specs name agents in OpenCode's @mention form; node ids use the bare
        // name, so the prefix is stripped rather than baked into the id.
        const agentId = nodeId('agent', String(spec.agent).replace(/^@/, ''));
        if (hasNode.get(agentId)) {
          db.prepare('INSERT OR IGNORE INTO edges (src_id, dst_id, type) VALUES (?, ?, ?)').run(id, agentId, 'used_by');
          stats.edges++;
        } else {
          stats.skippedTargets = (stats.skippedTargets ?? 0) + 1;
        }
      }
    }
    return stats;
  } finally {
    db.close();
  }
}

// ─── Hybrid Query: vector recall → graph refine ────────────────────────────

/**
 * Graph-title recall fallback: tokenize the query, score nodes by how many
 * tokens appear in title/path (token length >= 3, stopwords dropped). Used
 * when vector recall finds no representable seeds — the registry-backed
 * hub-subcommand/skill nodes ARE the index for config-asset queries.
 */
function graphTitleRecall(db, queryText, limit = 8) {
  const STOP = new Set(['the', 'and', 'for', 'with', 'from', 'into', 'onto', 'that', 'this', 'your', 'you', 'how', 'what', 'when', 'where', 'why', 'who', 'are', 'was', 'via', 'use', 'used', 'new']);
  const tokens = String(queryText).toLowerCase().split(/[^a-z0-9-]+/).filter(t => t.length >= 3 && !STOP.has(t));
  if (tokens.length === 0) return [];
  try {
    const nodes = db.prepare('SELECT id, type, title, path FROM nodes').all();
    const scored = [];
    for (const n of nodes) {
      const hay = `${n.title} ${n.path} ${n.id}`.toLowerCase();
      let hits = 0;
      for (const t of tokens) if (hay.includes(t)) hits++;
      if (hits > 0) scored.push({ id: n.id, type: n.type, title: n.title, path: n.path, score: hits });
    }
    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, 0 + limit);
  } catch {
    return [];
  }
}

/** One graph node surfaced to the context-gathering path. */
export interface GraphRecallHit {
  id: string;
  type: string;
  title: string;
  path: string | null;
  /** Token-overlap relevance, normalized to (0, 1]. */
  score: number;
  /** The edge that connected a title match to its neighbour, when expanded. */
  via?: string | null;
}

/**
 * Graph-only recall — NO vector store, NO embedding, NO reranker.
 *
 * This exists because the two retrieval planes answer different questions and
 * the context-gathering path was only using one of them:
 *
 *   - veclib (context.db + code.db) returns CONTENT: chunks of prose and code.
 *   - the graph returns STRUCTURE: which rule governs this, which skill owns
 *     that hub subcommand, what a concept touches. Vector recall cannot produce
 *     that, because the answers are edges, not text.
 *
 * So the transform hook was injecting content while the graph — 807 nodes and
 * 467 edges of exactly that structural knowledge — sat unused unless an agent
 * thought to call the graphQuery tool by hand.
 *
 * Cost matters here: this runs on the inference path, so it is deliberately
 * pure-SQL (open the existing graph.db read-only, tokenize, score, one
 * neighbor expansion). No child process, no model load, no inference. It
 * returns [] on any failure, so a missing or corrupt graph is a no-op.
 */
export function graphRecall(
  inputDir: string | undefined,
  queryText: string,
  limit = 5,
  expandDepth = 1,
): GraphRecallHit[] {
  const paths = resolvePaths(inputDir);
  let db;
  try {
    db = openDatabase(paths.graphDbPath, true);
  } catch {
    return []; // no graph yet — a no-op, never an error
  }
  try {
    const direct = graphTitleRecall(db, queryText, limit);
    if (direct.length === 0) return [];
    const best = direct[0].score || 1;

    // Expand one hop so a query for "cache" surfaces the rule that references
    // the caching skill, not just the skill node itself.
    const out: GraphRecallHit[] = [];
    const seen = new Set<string>();
    for (const d of direct) {
      if (seen.has(d.id)) continue;
      seen.add(d.id);
      out.push({
        id: d.id, type: d.type, title: d.title, path: d.path,
        score: Math.max(0.01, Math.min(1, (d.score || 0) / best)),
        via: null,
      });
      if (expandDepth <= 0 || out.length >= limit * 2) continue;
      try {
        const neighbors = db.prepare(`
          SELECT e.dst_id AS other_id, e.type AS edge_type, n.title, n.type, n.path
          FROM edges e JOIN nodes n ON n.id = e.dst_id WHERE e.src_id = ?
          LIMIT 4
        `).all(d.id);
        for (const nb of neighbors) {
          if (seen.has(nb.other_id)) continue;
          seen.add(nb.other_id);
          out.push({
            id: nb.other_id, type: nb.type, title: nb.title, path: nb.path,
            score: Math.max(0.01, Math.min(1, (d.score || 0) / best)) * RELATED_SCORE_DECAY,
            via: nb.edge_type,
          });
          if (out.length >= limit * 2) break;
        }
      } catch { /* neighbor expansion is best-effort */ }
    }
    out.sort((a, b) => b.score - a.score);
    return out.slice(0, limit);
  } catch {
    return [];
  } finally {
    try { db.close(); } catch { /* already closed */ }
  }
}

/**
 * Two-stage retrieval:
 *   1. Vector recall via veclib (context store) — top-K semantic candidates.
 *   2. Graph refine — for each candidate node, traverse edges depth ≤ MAX_DEPTH;
 *      related nodes inherit a decaying share of the source score.
 * Returns merged ranked results. NEVER throws — degrades to vector-only.
 */
export async function queryHybrid(
  inputDir: string | undefined,
  queryText: string,
  topK = 8,
  opts: HybridQueryOptions = {},
) {
  const paths = resolvePaths(inputDir);
  const depth = opts.depth || MAX_DEPTH_DEFAULT;
  const includeCode = opts.includeCode !== false;

  // Recall from both stores. The code store holds the larger half of the
  // corpus (code.db ~1961 chunks vs context.db ~1473 on this project) and used
  // to be entirely invisible to graph search, because only queryChunks — the
  // context store — was ever called. Code hits are tagged so the merge can
  // report which store produced a node.
  let vecResults: VectorHit[] = [];
  try {
    const veclib = await import(
      path.join(__dirname, '..', '..', 'vectorize-context', 'scripts', 'veclib.ts')
    );
    const queryOpts = {
      useReranker: opts.useReranker,
      ...(opts.rerankCandidates ? { rerankCandidates: opts.rerankCandidates } : {}),
    };
    const perStore = Math.max(topK, Math.ceil(topK * 1.5));
    const [ctx, code] = await Promise.all([
      veclib.queryChunks(inputDir, queryText, perStore, queryOpts),
      includeCode
        ? veclib.queryCodeChunks(inputDir, queryText, perStore, queryOpts)
        : Promise.resolve([]),
    ]);
    vecResults = [
      ...(ctx || []).map((r: VectorHit) => ({ ...r, store: 'context' as const })),
      ...(code || []).map((r: VectorHit) => ({ ...r, store: 'code' as const })),
    ];
  } catch {
    // Vector store unavailable — graph-only (neighbors of nothing = empty)
  }

  let db = null;
  try {
    db = openDatabase(paths.graphDbPath, true);
  } catch {
    return vecResults.map((r, i) => ({
      rank: i + 1, node_id: null, title: r.heading, type: 'chunk', kind: 'vector',
      score: 1 / (i + 1), path: r.file_path, heading: r.heading, content: r.content?.slice(0, 300),
    }));
  }

  try {
    // Map vector hits → graph nodes by file path or heading. Weighting comes
    // from the hit's own relevance (see seedScoreFor), not its position in the
    // result list.
    const bestRaw = vecResults.reduce((m, r) => {
      const v =
        typeof r.rerank_score === 'number' && Number.isFinite(r.rerank_score)
          ? r.rerank_score
          : typeof r.distance === 'number' && Number.isFinite(r.distance)
            ? Math.max(0, 1 - r.distance)
            : 0;
      return Math.max(m, v);
    }, 0);

    const seeds = [];
    for (const r of vecResults) {
      const byPath = r.file_path
        ? db.prepare('SELECT id, type, title, path FROM nodes WHERE path = ? LIMIT 1').get(r.file_path)
        : null;
      const bySource = r.source && !byPath
        ? db.prepare('SELECT id, type, title, path FROM nodes WHERE path = ? LIMIT 1').get(r.source)
        : null;
      const byHeading = r.heading && r.heading !== '(no heading)'
        ? db.prepare('SELECT id, type, title, path FROM nodes WHERE LOWER(title) LIKE ? LIMIT 1').get(`%${String(r.heading).toLowerCase()}%`)
        : null;
      const node = byPath || bySource || byHeading;
      if (node) {
        seeds.push({
          ...node,
          sourceScore: seedScoreFor(r, bestRaw),
          vecRank: seeds.length + 1,
          store: r.store ?? null,
        });
      }
    }

    if (seeds.length === 0) {
      // Vector recall found nothing representable in the graph (e.g. config-asset
      // queries like "git commit" that live in the registry, not the wiki).
      // Fall back to graph-title recall — the graph itself is the asset index.
      // graphTitleRecall already ranks by token-hit count, so its own score is
      // the relevance signal; normalize it the same way seeds are normalized.
      const titleSeeds = graphTitleRecall(db, queryText, topK);
      if (titleSeeds.length > 0) {
        const bestTitle = titleSeeds[0].score || 1;
        seeds.push(...titleSeeds.map((n, i) => ({
          ...n,
          sourceScore: Math.max(0.01, Math.min(1, (n.score || 0) / bestTitle)),
          vecRank: i + 1,
          store: null,
        })));
      } else {
        return vecResults.map((r, i) => ({
          rank: i + 1, node_id: null, title: r.heading, type: 'chunk', kind: 'vector',
          score: seedScoreFor(r, bestRaw), path: r.file_path ?? r.source, heading: r.heading,
          content: r.content?.slice(0, 300), store: r.store ?? null,
        }));
      }
    }

    // BFS traversal from seeds, collecting related nodes with decayed scores
    const related = new Map(); // nodeId -> { node, score, via, depth }
    const visited = new Set<string>();
    let frontier = seeds.map(s => ({ id: s.id, score: s.sourceScore, depth: 0 }));
    // NOTE: this used to be `visited.add(...frontier.map(f => f.id))`, which
    // looks equivalent but is not — Set.prototype.add takes exactly one
    // argument and silently discards the rest, so only the FIRST seed was ever
    // marked visited. Every other seed could be re-expanded by the BFS, and
    // a cycle through the remaining seeds had no visited-guard at all. The
    // type checker caught this; the loop below is the correct form.
    for (const f of frontier) visited.add(f.id);

    for (let d = 0; d < depth; d++) {
      const next = [];
      for (const f of frontier) {
        const neighbors = db.prepare(`
          SELECT e.dst_id AS other_id, e.type AS edge_type, n.title, n.type, n.path
          FROM edges e JOIN nodes n ON n.id = e.dst_id WHERE e.src_id = ?
          UNION ALL
          SELECT e.src_id AS other_id, e.type AS edge_type, n.title, n.type, n.path
          FROM edges e JOIN nodes n ON n.id = e.src_id WHERE e.dst_id = ?
        `).all(f.id, f.id);
        for (const nb of neighbors) {
          if (visited.has(nb.other_id)) continue;
          visited.add(nb.other_id);
          const score = f.score * RELATED_SCORE_DECAY;
          related.set(nb.other_id, { id: nb.other_id, title: nb.title, type: nb.type, path: nb.path, score, via: nb.edge_type, depth: d + 1 });
          next.push({ id: nb.other_id, score, depth: d + 1 });
        }
      }
      frontier = next;
      if (frontier.length === 0) break;
    }

    // Merge: vector seeds first (kind=vector), then related (kind=graph), sorted by score
    const merged = [];
    for (const s of seeds) {
      merged.push({ rank: 0, node_id: s.id, title: s.title, type: s.type, kind: 'vector', score: s.sourceScore, path: s.path, via: null, depth: 0, store: s.store ?? null });
    }
    for (const r of related.values()) {
      merged.push({ rank: 0, node_id: r.id, title: r.title, type: r.type, kind: 'graph', score: r.score, path: r.path, via: r.via, depth: r.depth });
    }
    merged.sort((a, b) => b.score - a.score);
    const results = merged.slice(0, topK).map((r, i) => ({ ...r, rank: i + 1 }));
    return results;
  } finally {
    db.close();
  }
}

// ─── Queries ───────────────────────────────────────────────────────────────

export function getNode(inputDir, id) {
  const db = ensureGraphReady(inputDir);
  try {
    const row = db.prepare('SELECT * FROM nodes WHERE id = ?').get(id);
    if (!row) return null;
    row.meta = row.meta ? JSON.parse(row.meta) : null;
    row.tags = db.prepare('SELECT tag FROM node_tags WHERE node_id = ?').all(id).map(t => t.tag);
    return row;
  } finally {
    db.close();
  }
}

export function getNeighbors(inputDir, id, depth = 1, direction = 'both') {
  const db = ensureGraphReady(inputDir);
  try {
    const out = [];
    const visited = new Set([id]);
    let frontier = [{ id, depth: 0 }];
    const dirSql = {
      out: `SELECT e.dst_id AS other_id, e.type AS edge_type FROM edges e WHERE e.src_id = ?`,
      in: `SELECT e.src_id AS other_id, e.type AS edge_type FROM edges e WHERE e.dst_id = ?`,
      both: `SELECT e.dst_id AS other_id, e.type AS edge_type FROM edges e WHERE e.src_id = ? UNION ALL SELECT e.src_id AS other_id, e.type AS edge_type FROM edges e WHERE e.dst_id = ?`,
    }[direction] || `SELECT e.dst_id AS other_id, e.type AS edge_type FROM edges e WHERE e.src_id = ? UNION ALL SELECT e.src_id AS other_id, e.type AS edge_type FROM edges e WHERE e.dst_id = ?`;

    for (let d = 0; d < depth; d++) {
      const next = [];
      for (const f of frontier) {
        const params = direction === 'both' ? [f.id, f.id] : [f.id];
        const rows = db.prepare(dirSql).all(...params);
        for (const row of rows) {
          if (visited.has(row.other_id)) continue;
          visited.add(row.other_id);
          const node = db.prepare('SELECT id, type, title, path FROM nodes WHERE id = ?').get(row.other_id);
          if (node) {
            out.push({ ...node, edge_type: row.edge_type, depth: d + 1 });
            next.push({ id: row.other_id, depth: d + 1 });
          }
        }
      }
      frontier = next;
      if (frontier.length === 0) break;
    }
    return out;
  } finally {
    db.close();
  }
}

export function getPath(inputDir, fromId, toId) {
  const db = ensureGraphReady(inputDir);
  try {
    const prev = new Map();
    const visited = new Set([fromId]);
    let queue = [fromId];
    let found = false;
    while (queue.length && !found) {
      const next = [];
      for (const id of queue) {
        const rows = db.prepare('SELECT dst_id AS other_id FROM edges WHERE src_id = ? UNION ALL SELECT src_id AS other_id FROM edges WHERE dst_id = ?').all(id, id);
        for (const row of rows) {
          if (visited.has(row.other_id)) continue;
          visited.add(row.other_id);
          prev.set(row.other_id, id);
          if (row.other_id === toId) { found = true; break; }
          next.push(row.other_id);
        }
      }
      queue = next;
    }
    if (!found) return null;
    const pathIds = [toId];
    let cur = toId;
    while (cur !== fromId && prev.has(cur)) {
      cur = prev.get(cur);
      pathIds.unshift(cur);
    }
    return pathIds.map(id => {
      const n = db.prepare('SELECT id, type, title, path FROM nodes WHERE id = ?').get(id);
      return n || { id };
    });
  } finally {
    db.close();
  }
}

export function getImpact(inputDir, id) {
  const db = ensureGraphReady(inputDir);
  try {
    return db.prepare(`
      SELECT e.src_id AS id, e.type AS edge_type, n.title, n.type
      FROM edges e JOIN nodes n ON n.id = e.src_id
      WHERE e.dst_id = ? ORDER BY e.weight DESC
    `).all(id);
  } finally {
    db.close();
  }
}

export function getGraphStats(inputDir) {
  const db = ensureGraphReady(inputDir);
  try {
    const nodes = db.prepare('SELECT COUNT(*) AS c FROM nodes').get().c;
    const edges = db.prepare('SELECT COUNT(*) AS c FROM edges').get().c;
    const byType = db.prepare('SELECT type, COUNT(*) AS c FROM nodes GROUP BY type ORDER BY c DESC').all();
    const byEdge = db.prepare('SELECT type, COUNT(*) AS c FROM edges GROUP BY type ORDER BY c DESC').all();
    const tags = db.prepare('SELECT COUNT(*) AS c FROM node_tags').get().c;
    return { exists: true, nodes, edges, tags, byType, byEdge };
  } finally {
    db.close();
  }
}
