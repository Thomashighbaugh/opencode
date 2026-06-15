#!/usr/bin/env node
/**
 * route-harvest.mjs — Harvest Context Router
 *
 * Analyzes a user's natural language request and routes it to the best
 * /harvest-context subcommand. After extraction/writing, automatically
 * triggers the vector DB to stay fresh via lazy indexing.
 *
 * Usage:
 *   node route-harvest.mjs "save what we learned from this session"
 *   node route-harvest.mjs "create a reusable workflow from this"
 *   REQUEST="document the codebase" node route-harvest.mjs
 */

// ─── veclib integration (lazy-loaded) ────────────────────────────────────────
// After any harvest subcommand writes to .opencode/context/, the vectored
// cache is lazily refreshed. We call ensureIndexed() after write operations
// so the next query sees the new content immediately.

let _veclibPromise = null;

async function getVeclib() {
  if (_veclibPromise) return _veclibPromise;
  _veclibPromise = (async () => {
    // Try sibling path first (standard install layout: skills/vectorize-context/ is sibling of skills/orchestrate-router/)
    const siblingPath = new URL('../../vectorize-context/scripts/veclib.mjs', import.meta.url).pathname;
    try {
      const mod = await import(siblingPath);
      return mod;
    } catch {}
    // Try project-local path
    try {
      const opDir = process.env.OPCODE_DIR || process.cwd() + '/.opencode';
      const fs = await import('node:fs');
      const localPath = opDir + '/skills/vectorize-context/scripts/veclib.mjs';
      if (fs.existsSync(localPath)) {
        return await import(localPath);
      }
    } catch {}
    // Try env var
    if (process.env.VECLIB_PATH) {
      try { return await import(process.env.VECLIB_PATH); } catch {}
    }
    return null;
  })();
  return _veclibPromise;
}

// ─── Subcommand Profiles ───────────────────────────────────────────────────

const SUBCMDS = [
  {
    name: "session",
    tagline: "Extract decisions, patterns, learnings from the current conversation",
    intent:     { extract: 0.9, create: 0.2, fetch: 0.3, organize: 0.4 },
    action:     { save: 0.9, read: 0.2, search: 0.1, generate: 0.2 },
    content:    { decisions: 0.9, patterns: 0.8, learnings: 0.9, docs: 0.3 },
    writes:     true, // writes to .opencode/context/ → triggers vector refresh
    keywords: ["session", "conversation", "chat", "learned", "discuss", "talked about", "what we did", "extract from this"],
    antiKeywords: ["codebase", "library", "docs", "file"],
    description: "Extract key decisions, patterns, and learnings from the current session conversation."
  },
  {
    name: "codebase",
    tagline: "Generate hierarchical AGENTS.md documentation across the codebase",
    intent:     { extract: 0.3, create: 0.9, fetch: 0.2, organize: 0.9 },
    action:     { save: 0.7, read: 0.3, search: 0.1, generate: 0.9 },
    content:    { decisions: 0.2, patterns: 0.3, learnings: 0.2, docs: 0.9 },
    writes:     true,
    keywords: ["codebase", "document", "agents.md", "hierarchy", "directory", "generate docs", "project structure", "documentation"],
    antiKeywords: ["session", "conversation", "library"],
    description: "Generate hierarchical AGENTS.md files across all codebase directories, preserving manual sections."
  },
  {
    name: "skill",
    tagline: "Create a reusable skill from session knowledge",
    intent:     { extract: 0.6, create: 0.9, fetch: 0.1, organize: 0.4 },
    action:     { save: 0.8, read: 0.1, search: 0.1, generate: 0.8 },
    content:    { decisions: 0.3, patterns: 0.8, learnings: 0.7, docs: 0.4 },
    writes:     true,
    keywords: ["skill", "reusable", "workflow", "procedure", "automate", "repeatable", "recipe"],
    antiKeywords: ["rule", "command", "agent"],
    description: "Extract a repeatable workflow from the session into a reusable skill."
  },
  {
    name: "agent",
    tagline: "Create a project-specific agent definition",
    intent:     { extract: 0.3, create: 0.9, fetch: 0.1, organize: 0.3 },
    action:     { save: 0.8, read: 0.1, search: 0.1, generate: 0.9 },
    content:    { decisions: 0.3, patterns: 0.4, learnings: 0.3, docs: 0.6 },
    writes:     false,
    keywords: ["agent", "specialized", "persona", "role", "assistant definition"],
    antiKeywords: ["skill", "command", "rule"],
    description: "Define a specialized agent with role, instructions, tools, and model preference."
  },
  {
    name: "rule",
    tagline: "Create a project rule (.opencode/rules/) that agents auto-load",
    intent:     { extract: 0.4, create: 0.9, fetch: 0.1, organize: 0.5 },
    action:     { save: 0.9, read: 0.1, search: 0.0, generate: 0.7 },
    content:    { decisions: 0.5, patterns: 0.7, learnings: 0.3, docs: 0.3 },
    writes:     false,
    keywords: ["rule", "convention", "constraint", "policy", "guideline", "standard"],
    antiKeywords: ["skill", "agent", "command"],
    description: "Capture a convention or constraint as a project rule. Agents auto-load rules at session start."
  },
  {
    name: "command",
    tagline: "Create a project slash command from a repeatable workflow",
    intent:     { extract: 0.3, create: 0.9, fetch: 0.1, organize: 0.4 },
    action:     { save: 0.8, read: 0.1, search: 0.1, generate: 0.8 },
    content:    { decisions: 0.2, patterns: 0.6, learnings: 0.4, docs: 0.4 },
    writes:     false,
    keywords: ["command", "slash", "/command", "shortcut", "invocation"],
    antiKeywords: ["skill", "agent", "rule"],
    description: "Create a slash command wrapping a repeatable workflow — single invocation."
  },
  {
    name: "memory",
    tagline: "Promote durable knowledge — project memory, notepad, or wiki articles",
    intent:     { extract: 0.8, create: 0.4, fetch: 0.2, organize: 0.7 },
    action:     { save: 0.9, read: 0.3, search: 0.1, generate: 0.3 },
    content:    { decisions: 0.8, patterns: 0.7, learnings: 0.9, docs: 0.2 },
    writes:     true,
    keywords: ["memory", "remember", "save", "promote", "notepad", "wiki", "project memory", "durable", "persist"],
    antiKeywords: ["new", "create from scratch"],
    description: "Classify session knowledge and promote to project memory, notepad, or wiki articles."
  },
  {
    name: "docs",
    tagline: "Fetch official library documentation via Context7 MCP",
    intent:     { extract: 0.2, create: 0.1, fetch: 1.0, organize: 0.2 },
    action:     { save: 0.4, read: 0.9, search: 0.9, generate: 0.1 },
    content:    { decisions: 0.1, patterns: 0.2, learnings: 0.3, docs: 1.0 },
    writes:     true,
    keywords: ["docs", "documentation", "library", "api docs", "how to use", "reference", "fetch", "context7", "npm docs"],
    antiKeywords: ["my code", "session", "build"],
    description: "Fetch up-to-date library documentation. Optionally save to .opencode/context/research/."
  },
  {
    name: "decompose",
    tagline: "Break down a concept or goal into smaller actionable units with dependencies",
    intent:     { extract: 0.5, create: 0.6, fetch: 0.1, organize: 0.9 },
    action:     { save: 0.5, read: 0.3, search: 0.1, generate: 0.4 },
    content:    { decisions: 0.5, patterns: 0.3, learnings: 0.3, docs: 0.3 },
    writes:     true,
    keywords: ["decompose", "break down", "actionable", "units", "tasks", "smaller pieces", "split", "divide"],
    antiKeywords: ["document", "create", "build"],
    description: "Break a concept, problem, or goal into independently actionable units with dependencies and effort estimates."
  },
  {
    name: "context",
    tagline: "Manage context files — harvest, extract, organize, compact, map",
    intent:     { extract: 0.6, create: 0.3, fetch: 0.3, organize: 0.9 },
    action:     { save: 0.5, read: 0.5, search: 0.4, generate: 0.3 },
    content:    { decisions: 0.4, patterns: 0.3, learnings: 0.3, docs: 0.5 },
    writes:     true,
    keywords: ["manage context", "organize context", "compact", "harvest", "context files", "map context", "context structure"],
    antiKeywords: [],
    description: "Manage context files — scan, harvest summaries, extract from docs, organize by function, compact verbose files."
  },
  {
    name: "consume",
    tagline: "Ingest a file, directory, or URL — extract text and save as durable context",
    intent:     { extract: 0.9, create: 0.3, fetch: 0.7, organize: 0.3 },
    action:     { save: 0.9, read: 0.7, search: 0.1, generate: 0.2 },
    content:    { decisions: 0.2, patterns: 0.3, learnings: 0.4, docs: 0.7 },
    writes:     true,
    keywords: ["ingest", "file", "url", "import", "read file", "consume", "pdf", "markdown", "extract text", "save as context"],
    antiKeywords: [],
    description: "Read a file/directory/URL, extract text, summarize, and save to .opencode/context/research/ as durable context."
  },
  {
    name: "compress",
    tagline: "Token compression — density filtering, command output, library cache",
    intent:     { extract: 0.2, create: 0.1, fetch: 0.1, organize: 0.7 },
    action:     { save: 0.3, read: 0.5, search: 0.2, generate: 0.1 },
    content:    { decisions: 0.1, patterns: 0.1, learnings: 0.1, docs: 0.1 },
    writes:     false,
    keywords: ["compress", "token", "density filter", "compact context", "reduce tokens", "save space", "context budget"],
    antiKeywords: ["create", "write", "new"],
    description: "Apply 4-layer token compression: density filtering, command output compression, sentence extraction, library cache."
  },
  {
    name: "secondbrain",
    tagline: "Privacy-first local knowledge base — markdown+Git with role packs",
    intent:     { extract: 0.3, create: 0.8, fetch: 0.1, organize: 0.8 },
    action:     { save: 0.7, read: 0.2, search: 0.1, generate: 0.6 },
    content:    { decisions: 0.6, patterns: 0.5, learnings: 0.7, docs: 0.3 },
    writes:     true,
    keywords: ["second brain", "knowledge base", "personal wiki", "local knowledge", "markdown git", "role pack", "collect knowledge"],
    antiKeywords: [],
    description: "Set up a privacy-first local knowledge management system with markdown+Git, evolution cycles, and self-healing cross-references."
  },
  {
    name: "journal",
    tagline: "Event-sourced journal for orchestration runs — deterministic replay",
    intent:     { extract: 0.2, create: 0.8, fetch: 0.1, organize: 0.5 },
    action:     { save: 0.8, read: 0.2, search: 0.1, generate: 0.6 },
    content:    { decisions: 0.5, patterns: 0.3, learnings: 0.5, docs: 0.2 },
    writes:     true,
    keywords: ["journal", "log", "audit", "event source", "replay", "time travel", "checksum", "tracing"],
    antiKeywords: [],
    description: "Set up event-sourced journaling for orchestration runs — append-only, SHA-256, deterministic replay."
  }
];

function classify(text) {
  const lower = text.toLowerCase();

  const results = SUBCMDS.map(scmd => {
    let score = 0;

    // Keyword matches
    for (const kw of scmd.keywords) {
      if (lower.includes(kw)) score += 0.15;
    }
    for (const akw of scmd.antiKeywords) {
      if (lower.includes(akw)) score -= 0.1;
    }

    // Intent signals
    if (/\bextract\b|\bpull\b|\bgrab\b|\bget\b|\bcapture\b/.test(lower)) score += scmd.intent.extract * 0.12;
    if (/\bcreate\b|\bnew\b|\bgenerate\b|\bmake\b|\bbuild\b|\bcraft\b/.test(lower)) score += scmd.intent.create * 0.12;
    if (/\bfetch\b|\blookup\b|\bfind\b|\bsearch\b|\bget docs\b|\bhow to\b/.test(lower)) score += scmd.intent.fetch * 0.12;
    if (/\borganize\b|\barrange\b|\bcompact\b|\bcompress\b|\bmanage\b|\bstructure\b/.test(lower)) score += scmd.intent.organize * 0.12;

    // Content signals
    if (/\bdecision\b|\bwhy\b|\breason\b|\brationale\b/.test(lower)) score += scmd.content.decisions * 0.08;
    if (/\bpattern\b|\btemplate\b|\bapproach\b|\bway\b|\btechnique\b/.test(lower)) score += scmd.content.patterns * 0.08;
    if (/\blearn\b|\blesson\b|\btakeaway\b|\binsight\b|\bdiscover\b/.test(lower)) score += scmd.content.learnings * 0.08;
    if (/\bdoc\b|\bdocumentation\b|\breference\b|\bmanual\b|\bguide\b/.test(lower)) score += scmd.content.docs * 0.08;

    // Action signals
    if (/\bsave\b|\bstore\b|\bkeep\b|\bpreserve\b|\bpromote\b/.test(lower)) score += scmd.action.save * 0.08;
    if (/\bread\b|\bshow\b|\bdisplay\b|\bview\b|\bsee\b|\bwhat.*is\b/.test(lower)) score += scmd.action.read * 0.08;
    if (/\bsearch\b|\bfind\b|\blookup\b|\bquery\b/.test(lower)) score += scmd.action.search * 0.08;
    if (/\bgenerate\b|\bproduce\b|\bcreate\b|\bwrite\b|\bmake\b/.test(lower)) score += scmd.action.generate * 0.08;

    return { name: scmd.name, tagline: scmd.tagline, score, description: scmd.description, writes: scmd.writes };
  });

  results.sort((a, b) => b.score - a.score);
  return results;
}

async function maybeVectorize(results) {
  const top = results[0];
  if (!top.writes) return;

  const veclib = await getVeclib();
  if (!veclib || typeof veclib.ensureIndexed !== 'function') return;

  try {
    const r = await veclib.ensureIndexed();
    if (r && r.totalChunks > 0) {
      process.stderr.write(`\n  ◇ Auto-vectorized: ${r.filesIndexed} file(s) → ${r.totalChunks} chunk(s)\n`);
    }
  } catch {
    // vector DB not configured — harmless
  }
}

async function main() {
  const query = process.argv.slice(2).join(' ') || process.env.REQUEST || '';
  if (!query) {
    console.error('Usage: node route-harvest.mjs "save what we learned"');
    console.error('   or: REQUEST="document the codebase" node route-harvest.mjs');
    process.exit(1);
  }

  process.stderr.write(`Routing request: "${query}"\n`);
  const veclib = await getVeclib();
  if (veclib) process.stderr.write('  Vector cache: available\n');
  process.stderr.write('\n');

  const results = classify(query);
  const top = results[0];

  const output = JSON.stringify({
    request: query,
    recommended: top.name,
    confidence: Math.round(top.score * 100),
    reason: top.tagline,
    description: top.description,
    autoVectorize: top.writes,
    ranked: results.slice(0, 5).map(r => ({
      subcommand: r.name,
      score: Math.round(r.score * 100),
    })),
  }, null, 2);

  // Write the result
  process.stdout.write(output + '\n');
}

main().catch(err => {
  process.stderr.write(`Fatal: ${err.message}\n`);
  process.exit(1);
});
