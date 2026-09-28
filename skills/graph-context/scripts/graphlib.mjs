#!/usr/bin/env node
/**
 * graphlib.mjs — Shared per-project knowledge graph library.
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
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);

// ─── Config ────────────────────────────────────────────────────────────────

const MAX_DEPTH_DEFAULT = 2;
const RELATED_SCORE_DECAY = 0.6; // related node score = source_score * decay^depth

// ─── Path Resolution ───────────────────────────────────────────────────────

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
    agentsFile: path.join(projectRoot, 'AGENTS.md'),
    vectorDir: path.join(opencodeDir, 'state', 'vector'),
    graphDbPath: path.join(opencodeDir, 'state', 'vector', 'graph.db'),
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
]);

const EDGE_TYPES = new Set([
  'applies_to', 'supersedes', 'touches', 'related_to', 'part_of', 'used_by', 'derived_from',
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
 * Derive a stable node id from type + slug. Slugs are the primary key for
 * wiki pages; file paths for file nodes; registry labels for hub-subcommands.
 */
export function nodeId(type, slug) {
  const clean = String(slug)
    .replace(/^\.opencode\//, '')
    .replace(/\.md$/, '')
    .replace(/\\/g, '/');
  return `${type}:${clean}`;
}

function slugify(title) {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80);
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

// ─── Frontmatter parsing ───────────────────────────────────────────────────

export function parseFrontmatter(content) {
  const m = content.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  if (!m) return null;
  const fm = {};
  for (const line of m[1].split('\n')) {
    const kv = line.match(/^([A-Za-z_-]+):\s*(.*)$/);
    if (!kv) continue;
    let value = kv[2].trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    if (value.startsWith('[') && value.endsWith(']')) {
      value = value.slice(1, -1).split(',').map(s => s.trim().replace(/^["']|["']$/g, '')).filter(Boolean);
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
  const stats = { nodes: 0, edges: 0, tags: 0, filesScanned: 0, filesSkipped: 0 };
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

    // ── Pass 1: nodes ──
    const titleToId = new Map(); // slugified title -> node id (for edge resolution)
    for (const filePath of [...allMd, ...skillMds]) {
      const rel = path.relative(paths.opencodeDir, filePath);
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
      let type = 'concept';
      let title = path.basename(filePath).replace(/\.md$/, '');
      if (fm && fm.type && NODE_TYPES.has(String(fm.type))) type = String(fm.type);
      if (fm && fm.title) title = String(fm.title);
      if (isSkillManifest) {
        // Skill nodes use the skill directory name as the id — matches the
        // registry's skill:{name} edge targets (used_by edges must resolve).
        type = 'skill';
        title = path.basename(path.dirname(filePath));
      }
      if (isLearning) {
        type = 'learning';
        const m = content.match(/^## (LRN|ERR|FEAT)-\d+[^\n]*/m);
        if (m) title = m[0].replace(/^## /, '');
      }

      const id = isSkillManifest ? nodeId('skill', title) : nodeId(type, rel || slugify(title));
      const meta = fm ? { tags: Array.isArray(fm.tags) ? fm.tags : (fm.tags ? [fm.tags] : []), status: fm.status, sources: fm.sources, relatedSkills: fm.relatedSkills } : {};
      upsertNodeInner(db, { id, type, title, path: rel, meta, mtime });
      stats.nodes++;
      titleToId.set(slugify(title), id);

      if (meta.tags) {
        for (const tag of meta.tags) {
          db.prepare('INSERT OR IGNORE INTO node_tags (node_id, tag) VALUES (?, ?)').run(id, tag);
          stats.tags++;
        }
      }

      // Frontmatter relatedSkills → related_to edges (targets may not exist yet;
      // edges dangle harmlessly until the target skill is indexed)
      if (meta.relatedSkills) {
        const list = Array.isArray(meta.relatedSkills) ? meta.relatedSkills : [meta.relatedSkills];
        for (const name of list) {
          const targetId = nodeId('skill', String(name).trim());
          try {
            db.prepare('INSERT OR IGNORE INTO edges (src_id, dst_id, type) VALUES (?, ?, ?)').run(id, targetId, 'related_to');
            stats.edges++;
          } catch { /* dangling ok */ }
        }
      }

      // Wiki links → related_to edges
      const linkRe = /\[\[([^\]|]+)(?:\|[^\]]+)?\]\]|\[[^\]]*\]\(([^)]+\.md)\)/g;
      let m;
      while ((m = linkRe.exec(content))) {
        const target = (m[1] || m[2] || '').trim().replace(/\\/g, '/');
        if (!target) continue;
        const targetId = nodeId(type, target.replace(/\.md$/, ''));
        try {
          db.prepare('INSERT OR IGNORE INTO edges (src_id, dst_id, type) VALUES (?, ?, ?)').run(id, targetId, 'related_to');
          stats.edges++;
        } catch { /* non-existent node ok — edges can dangle until the target is indexed */ }
      }
    }

    // ── Pass 2: edges (needs all nodes indexed) ──
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
export async function backfillFromRegistry(inputDir) {
  const paths = resolvePaths(inputDir);
  if (!fs.existsSync(paths.registryPath)) return { skipped: 'no spec-registry.json' };
  if (!hasChanged(paths.registryPath)) return { skipped: 'registry unchanged' };

  const db = ensureGraphReady(inputDir);
  const stats = { nodes: 0, edges: 0 };
  try {
    const registry = JSON.parse(fs.readFileSync(paths.registryPath, 'utf-8'));
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
      if (spec.skill) {
        const skillId = nodeId('skill', spec.skill);
        try {
          db.prepare('INSERT OR IGNORE INTO edges (src_id, dst_id, type) VALUES (?, ?, ?)').run(id, skillId, 'used_by');
          stats.edges++;
        } catch { /* dangling ok */ }
      }
      if (spec.agent) {
        const agentId = nodeId('agent', spec.agent);
        try {
          db.prepare('INSERT OR IGNORE INTO edges (src_id, dst_id, type) VALUES (?, ?, ?)').run(id, agentId, 'used_by');
          stats.edges++;
        } catch { /* dangling ok */ }
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
    return scored.slice(0, limit);
  } catch {
    return [];
  }
}

/**
 * Two-stage retrieval:
 *   1. Vector recall via veclib (context store) — top-K semantic candidates.
 *   2. Graph refine — for each candidate node, traverse edges depth ≤ MAX_DEPTH;
 *      related nodes inherit a decaying share of the source score.
 * Returns merged ranked results. NEVER throws — degrades to vector-only.
 */
export async function queryHybrid(inputDir, queryText, topK = 8, opts = {}) {
  const paths = resolvePaths(inputDir);
  const depth = opts.depth || MAX_DEPTH_DEFAULT;

  let vecResults = [];
  try {
    const { queryChunks } = await import(path.join(__dirname, '..', '..', 'vectorize-context', 'scripts', 'veclib.mjs'));
    vecResults = await queryChunks(inputDir, queryText, topK * 2, { useReranker: opts.useReranker });
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
    // Map vector hits → graph nodes by file path or heading
    const seeds = [];
    for (const r of vecResults) {
      const byPath = db.prepare('SELECT id, type, title FROM nodes WHERE path = ? LIMIT 1').get(r.file_path);
      const byHeading = r.heading && r.heading !== '(no heading)'
        ? db.prepare('SELECT id, type, title FROM nodes WHERE LOWER(title) LIKE ? LIMIT 1').get(`%${String(r.heading).toLowerCase()}%`)
        : null;
      const node = byPath || byHeading;
      if (node) {
        seeds.push({ ...node, sourceScore: 1 / (seeds.length + 1), vecRank: seeds.length + 1 });
      }
    }

    if (seeds.length === 0) {
      // Vector recall found nothing representable in the graph (e.g. config-asset
      // queries like "git commit" that live in the registry, not the wiki).
      // Fall back to graph-title recall — the graph itself is the asset index.
      const titleSeeds = graphTitleRecall(db, queryText, topK);
      if (titleSeeds.length > 0) {
        seeds.push(...titleSeeds.map((n, i) => ({ ...n, sourceScore: 1 / (i + 1), vecRank: i + 1 })));
      } else {
        return vecResults.map((r, i) => ({
          rank: i + 1, node_id: null, title: r.heading, type: 'chunk', kind: 'vector',
          score: 1 / (i + 1), path: r.file_path, heading: r.heading, content: r.content?.slice(0, 300),
        }));
      }
    }

    // BFS traversal from seeds, collecting related nodes with decayed scores
    const related = new Map(); // nodeId -> { node, score, via, depth }
    const visited = new Set();
    let frontier = seeds.map(s => ({ id: s.id, score: s.sourceScore, depth: 0 }));
    visited.add(...frontier.map(f => f.id));

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
      merged.push({ rank: 0, node_id: s.id, title: s.title, type: s.type, kind: 'vector', score: s.sourceScore, path: s.path, via: null, depth: 0 });
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
