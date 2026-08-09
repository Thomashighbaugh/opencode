---
name: graph-context
description: Per-project knowledge graph — entity/relationship store for retrieval, expertise compounding, and config-asset navigation. Hybrid retrieval (vector recall → graph refine). Use when retrieval precision matters, when mapping what touches what, or when checking what breaks if an asset changes.
relatedSkills: vectorize-context, self-improvement, graph-thinking, wiki
level: 3
license: MIT
---

# Graph Context

Per-project knowledge graph. A sqlite store (`.opencode/state/vector/graph.db`) of **nodes** (knowledge entities: patterns, decisions, concepts, learnings, rules, skills, agents, hub-subcommands, files) and typed **edges** (relationships: `applies_to`, `supersedes`, `touches`, `related_to`, `part_of`, `used_by`, `derived_from`). Sits beside the vector store (`context.db`) and refines its fuzzy recall with structural knowledge.

## Why a Graph

The vector store answers *"what is semantically similar?"* but not:

- *"What else touches this module?"* (traverse `touches` edges)
- *"Which decision superseded this one?"* (follow `supersedes` edges)
- *"What breaks if I edit this rule?"* (reverse `used_by` edges — impact analysis)
- *"How is this learning connected to the files it affects?"* (learnings → `touches`)

The graph turns per-project knowledge into a *navigable structure* that compounds across sessions: each harvested decision, pattern, and learning adds nodes + edges, so retrieval gets more precise as the project is used.

## Store Schema

```
.opencode/state/vector/graph.db   (gitignored, per-project, sqlite + WAL)

nodes(id PK, type, title, path, meta, mtime, created, updated)
edges(src_id, dst_id, type, weight, created, updated)   PK(src,dst,type)
node_tags(node_id, tag)                                 PK(node_id, tag)
```

| Node types | Edge types |
|-----------|-----------|
| pattern, decision, entity, concept, learning, source-summary, synthesis, rule, skill, agent, command, hub-subcommand, file, module | applies_to, supersedes, touches, related_to, part_of, used_by, derived_from |

Node id convention: `{type}:{slug-or-path}` (e.g. `pattern:context-strategy`, `hub-subcommand:project/self-improve`). Edge weights accumulate on repeat upserts (recurrence counting).

## CLI

```bash
node skills/graph-context/scripts/graph.mjs build          # backfill from wiki+rules+learnings+registry
node skills/graph-context/scripts/graph.mjs query "cache strategy"   # hybrid retrieval
node skills/graph-context/scripts/graph.mjs neighbors pattern:cache   # traverse
node skills/graph-context/scripts/graph.mjs impact rule:context-strategy  # who uses it
node skills/graph-context/scripts/graph.mjs path skill:vectorize-context hub-subcommand:project/graph
node skills/graph-context/scripts/graph.mjs stats
node skills/graph-context/scripts/graph.mjs probe          # precision probe vs vector-only
```

Flags: `--dir PATH` (project root or .opencode dir), `--depth N`, `--topK N`, `--queries "a|b|c"` (probe).

## Workflow

### 1. Build the graph (first use / after harvest)

```
node <skill-dir>/scripts/graph.mjs build
```

Backfill is **idempotent and lazy** — mtime-skipped re-runs; safe to call any time. Sources:
- `.opencode/context/**` wiki pages (node per page, type from frontmatter, tags from `tags:`, `derived_from` edges from `sources:`)
- `.opencode/context/learnings/**` (LRN/ERR/FEAT entries → `learning` nodes)
- `.opencode/rules/**` (rule nodes)
- `.opencode/skills/**/SKILL.md` (skill nodes — global + project)
- `tools/hubs/spec-registry.json` (hub-subcommand nodes + `used_by` edges → skills/agents) — config-hub projects only
- Markdown `[[wikilinks]]` / `[text](file.md)` → `related_to` edges

### 2. Query (hybrid retrieval)

```
node <skill-dir>/scripts/graph.mjs query "what is the caching strategy?"
```

Two-stage: vector recall (top-K candidates) → graph refine (BFS depth ≤ 2 from matched nodes, decaying score `0.6^depth`) → merged ranked list with `kind=vector|graph` and the edge type that connected each graph hit.

### 3. Impact analysis (config self-maintenance)

```
node <skill-dir>/scripts/graph.mjs impact rule:context-strategy
node <skill-dir>/scripts/graph.mjs path skill:self-improvement hub-subcommand:harvest-context/session
```

Use before editing rules/skills/hub specs — reveals what depends on the asset.

### 4. Compounding (harvest-time edge writing)

Every mechanism that already writes durable markdown feeds the graph:

| Mechanism | Contribution |
|-----------|-------------|
| `/harvest-context` (session/pattern/decision writes) | nodes + derived_from edges on next `build` |
| `self-improvement` skill learnings capture | learning nodes, `touches` edges, weight = Recurrence-Count |
| `/project consolidate-telemetry` (ADRs) | decision nodes, `supersedes` edges |
| `/project retrospect` | lesson nodes |
| `/ideation` finalize | plan nodes, derived_from → sources |

Run `graph build` after any of these to fold new knowledge into the graph.

## Design Constraints

- **Markdown stays canonical** — the wiki is the source of truth; the graph is a derived index. Never hand-edit `graph.db`.
- **Local-only, zero provider API** — sqlite + WAL, same pattern as vectorize-context. No graph servers, no network.
- **Lazy freshness** — rebuild on demand; no hooks in the hot path (MVP).
- **Never throws in query** — hybrid query degrades to vector-only results on graph errors.
- **Bounded traversal** — depth ≤ 2 keeps hot-path queries fast; `WITH RECURSIVE` style BFS in JS.
- **Dangling edges allowed** — edges to not-yet-indexed nodes are fine; they resolve on the next build.

## Anti-Patterns

- Hand-editing graph.db instead of the markdown sources
- Expecting depth > 3 traversals in hot-path queries (use `path`/`neighbors` for deep analysis)
- Replacing the vector store — graph refines, doesn't replace fuzzy recall
- Hook-driven auto-edge creation (noise; harvest-time writing covers the valuable paths)
- LLM-generated edges (deterministic extraction only in MVP)

## Validation

- `node <skill-dir>/scripts/graph.mjs stats` — counts by type/edge
- `node <skill-dir>/scripts/graph.mjs probe` — precision probe vs vector-only baseline
- `node <skill-dir>/scripts/graph.mjs query "<known phrase>"` — spot-check a known wiki page surfaces with its related nodes

## Related

- `vectorize-context` skill — sibling vector store, same sqlite pattern; graph refines its recall
- `self-improvement` skill — learnings capture is the primary edge source
- `wiki` skill — frontmatter schema is the node-extraction contract
- `graph-thinking` skill — mental model for structuring the graph
- `/project consolidate-telemetry` — ADR → supersedes edges
- `/ideation improvements` — cluster-density edges can order audit proposals
