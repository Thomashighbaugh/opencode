#!/usr/bin/env node
/**
 * graph.mjs — Per-project knowledge graph CLI.
 *
 * Subcommands:
 *   build            — backfill graph from wiki + rules + learnings + registry
 *   query "text"     — hybrid retrieval: vector recall → graph refine → ranked list
 *   node <id>        — show a node (id like pattern:xyz or "pattern:xyz")
 *   neighbors <id>   — traverse edges (depth 1-2)
 *   impact <id>      — what depends on this node (reverse edges)
 *   path <from> <to> — BFS shortest path
 *   stats            — node/edge counts by type
 *   probe            — precision probe: N queries, vector-only vs hybrid
 *
 * Options:
 *   --depth N        — traversal depth for neighbors/query (default 2)
 *   --dir PATH       — project root or .opencode dir (default: cwd)
 *   --topK N         — results for query (default 8)
 *   --queries "a|b|c" — probe queries (default: built-in set)
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
import * as g from './graphlib.mjs';

function parseArgs(argv) {
  const args = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--depth') { args.depth = parseInt(argv[++i], 10); }
    else if (a === '--dir') { args.dir = argv[++i]; }
    else if (a === '--topK') { args.topK = parseInt(argv[++i], 10); }
    else if (a === '--queries') { args.queries = argv[++i]; }
    else if (a.startsWith('--')) { args[a.slice(2)] = true; }
    else { args._.push(a); }
  }
  return args;
}

function fmtNode(n, indent = '') {
  return `${indent}${n.type}: ${n.title}${n.path ? `  (${n.path})` : ''}`;
}

async function main() {
  const argv = process.argv.slice(2);
  const args = parseArgs(argv);
  const cmd = args._[0];
  const dir = args.dir;

  switch (cmd) {
    case 'build': {
      const wikiStats = await g.backfillFromWiki(dir);
      const regStats = await g.backfillFromRegistry(dir);
      console.log('Backfill complete.');
      console.log('  wiki:', JSON.stringify(wikiStats));
      console.log('  registry:', JSON.stringify(regStats));
      console.log('  overall:', JSON.stringify(g.getGraphStats(dir)));
      break;
    }

    case 'query': {
      const query = args._.slice(1).join(' ');
      if (!query) { console.error('Usage: graph query "text" [--topK N] [--depth D]'); process.exit(1); }
      const results = await g.queryHybrid(dir, query, args.topK || 8, { depth: args.depth });
      console.log(`Hybrid results for: ${query}`);
      for (const r of results) {
        const kind = r.kind === 'graph' ? `graph:${r.via || ''}${r.depth ? `@d${r.depth}` : ''}` : 'vector';
        console.log(`  ${String(r.rank).padStart(2)}. [${kind.padEnd(14)}] ${r.type}: ${r.title}${r.path ? `  (${r.path})` : ''}`);
      }
      if (results.length === 0) console.log('  (no results — run `graph build` first)');
      break;
    }

    case 'node': {
      const id = args._[1];
      if (!id) { console.error('Usage: graph node <id>'); process.exit(1); }
      const node = g.getNode(dir, id);
      if (!node) { console.error(`Node not found: ${id}`); process.exit(1); }
      console.log(`id:     ${node.id}`);
      console.log(`type:   ${node.type}`);
      console.log(`title:  ${node.title}`);
      console.log(`path:   ${node.path || '-'}`);
      console.log(`tags:   ${(node.tags || []).join(', ') || '-'}`);
      console.log(`meta:   ${node.meta ? JSON.stringify(node.meta) : '-'}`);
      console.log('neighbors:');
      for (const nb of g.getNeighbors(dir, id, 1)) console.log(`  ${fmtNode(nb)}  [${nb.edge_type}]`);
      break;
    }

    case 'neighbors': {
      const id = args._[1];
      if (!id) { console.error('Usage: graph neighbors <id> [--depth N]'); process.exit(1); }
      const nbs = g.getNeighbors(dir, id, args.depth || 2);
      console.log(`Neighbors of ${id} (depth ${args.depth || 2}):`);
      for (const nb of nbs) console.log(`  d${nb.depth} [${nb.edge_type}] ${fmtNode(nb)}`);
      if (nbs.length === 0) console.log('  (none)');
      break;
    }

    case 'impact': {
      const id = args._[1];
      if (!id) { console.error('Usage: graph impact <id>'); process.exit(1); }
      const rows = g.getImpact(dir, id);
      console.log(`Impact on ${id} (who uses it):`);
      for (const r of rows) console.log(`  [${r.edge_type}] ${r.type}: ${r.title}`);
      if (rows.length === 0) console.log('  (nothing depends on it)');
      break;
    }

    case 'path': {
      const from = args._[1], to = args._[2];
      if (!from || !to) { console.error('Usage: graph path <from-id> <to-id>'); process.exit(1); }
      const p = g.getPath(dir, from, to);
      if (!p) { console.log(`No path from ${from} to ${to}`); break; }
      console.log(`Path (${p.length - 1} hops):`);
      p.forEach((n, i) => console.log(`  ${i === 0 ? '●' : '→'} ${fmtNode(n)}`));
      break;
    }

    case 'stats': {
      const s = g.getGraphStats(dir);
      console.log(`Graph: ${s.nodes} nodes, ${s.edges} edges, ${s.tags} tags`);
      console.log('nodes by type:');
      for (const r of s.byType) console.log(`  ${r.type}: ${r.c}`);
      console.log('edges by type:');
      for (const r of s.byEdge) console.log(`  ${r.type}: ${r.c}`);
      break;
    }

    case 'probe': {
      const queries = (args.queries || 'caching strategy|vector search|hub routing|memory system|self improvement loop|spec registry|learnings capture|hooks plugin|skill creation|git workflow')
        .split('|').map(s => s.trim()).filter(Boolean);
      console.log(`Precision probe: ${queries.length} queries — vector-only vs hybrid\n`);
      const { queryChunks } = await import(path.join(__dirname, '..', '..', 'vectorize-context', 'scripts', 'veclib.mjs'));
      const STOP = new Set(['the', 'and', 'for', 'with', 'from', 'into', 'onto', 'that', 'this', 'your', 'you', 'how', 'what', 'when', 'where', 'why', 'who', 'are', 'was', 'via', 'use', 'used', 'new', 'is', 'of', 'in', 'to', 'a', 'on', 'it']);
      let vecHits = 0, hybHits = 0, vecTop1 = 0, hybTop1 = 0;
      for (const q of queries) {
        const tokens = q.toLowerCase().split(/[^a-z0-9-]+/).filter(t => t.length >= 3 && !STOP.has(t));
        const hyb = await g.queryHybrid(dir, q, 5, { depth: 2 });
        const hybTop = hyb.slice(0, 5).map(r => (r.title + ' ' + (r.path || '') + ' ' + (r.heading || '')).toLowerCase());
        // Honest vector-only baseline: direct veclib call, no graph involvement
        const vecOnly = await queryChunks(dir, q, 5, { useReranker: false });
        const vecTop = vecOnly.slice(0, 5).map(r => (r.heading + ' ' + (r.file_path || '')).toLowerCase());
        const anyToken = t => tokens.some(tok => t.includes(tok));
        const hybMatch = hybTop.some(anyToken);
        const vecMatch = vecTop.some(anyToken);
        if (hybMatch) { hybHits++; if (hybTop[0] && tokens.some(t => hybTop[0].includes(t))) hybTop1++; }
        if (vecMatch) { vecHits++; if (vecTop[0] && tokens.some(t => vecTop[0].includes(t))) vecTop1++; }
        console.log(`  "${q}"`);
        console.log(`    vector: ${vecMatch ? 'HIT' : 'miss'} ${vecTop.slice(0, 3).join(' | ') || '(no vector results)'}`);
        console.log(`    hybrid: ${hybMatch ? 'HIT' : 'miss'} ${hybTop.slice(0, 3).join(' | ') || '(no results)'}`);
      }
      console.log(`\nSummary: hybrid ${hybHits}/${queries.length} (top-1: ${hybTop1}), vector-only ${vecHits}/${queries.length} (top-1: ${vecTop1})`);
      break;
    }

    default:
      console.log(`Usage: graph <build|query|node|neighbors|impact|path|stats|probe> [args]`);
      process.exit(1);
  }
}

main().catch(err => {
  console.error('graph.mjs error:', err.message);
  process.exit(1);
});
