---
name: graph-context
description: Per-project knowledge graph — entity/relationship store for retrieval, expertise compounding, and config-asset navigation. Hybrid retrieval (vector recall → graph refine). Use when retrieval precision matters, when mapping what touches what, or when checking what breaks if an asset changes.
relatedSkills: vectorize-context, self-improvement, graph-thinking, wiki
level: 3
license: MIT
---

# Graph Context

Per-project knowledge graph. A sqlite store (`.opencode/state/vector/graph.db`) of **nodes** (knowledge entities: patterns, decisions, concepts, learnings, rules, skills, agents, hub-subcommands, files) and typed **edges** (relationships: `applies_to`, `supersedes`, `touches`, `related_to`, `part_of`, `used_by`, `derived_from`, `defines`, `uses`). Sits beside the vector store (`context.db`) and refines its fuzzy recall with structural knowledge.

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
| pattern, decision, entity, concept, learning, source-summary, synthesis, rule, skill, agent, command, hub-subcommand, file, module, **symbol** | applies_to, supersedes, touches, related_to, part_of, used_by, derived_from, **defines**, **uses** |

Node id convention: `{type}:{slug-or-path}` (e.g. `pattern:context-strategy`, `hub-subcommand:project/self-improve`). **`rule` and `skill` are keyed by bare name** (`rule:efficiency-first`, not `rule:rules/efficiency-first`) so lookups don't have to guess the path. Edge weights accumulate on repeat upserts (recurrence counting).

### The code layer, and why leaves always have edges

The code layer is **derived** from `code.db`, not authored. `graph build` reads every chunk's declaration heading and emits:

| Edge | Meaning | Source |
|------|---------|--------|
| `file --part_of--> module` | a file belongs to a directory | invariant — emitted for **every** file |
| `file --defines--> symbol` | a file declares a function/class/const | the `symbols` sidecar in `code.db` |
| `symbol --part_of--> symbol` | a declaration's enclosing scope | `symbols.parent` — methods hang off their class |
| `file --uses--> symbol` | a file references a symbol defined in another file | cross-file identifier match |
| `file --related_to--> rule\|skill\|concept` | code references a config asset | slug match against identifiers |
| `rule/skill/knowledge --part_of--> module` | provenance of an unlinked knowledge node | adopted during backfill |

Declarations come from a **`symbols` sidecar table** in `code.db`, not from chunk headings.
`chunkCode` treats an indented line as inside a block and never starts a chunk there, so headings
only ever named top-level declarations — function-local consts and class methods were absent from the
graph entirely. Widening the chunker would re-embed every file in the project, so the sidecar is
written during indexing from the same text read that feeds chunking: one regex pass, no extra I/O, no
re-embedding. It self-heals by **coverage** (any indexed file with no symbol rows), not by emptiness.

The first two are **structural invariants**, not things anyone remembers to add:

1. `part_of` is emitted unconditionally, so a `.json`, a lockfile, or a file with zero declarations is still connected.
2. `defines` is emitted for every declaration, so the graph is navigable at declaration granularity, not just file granularity.

The consequence: **there are no edgeless leaves by construction.** `graph build` verifies this and reports `knowledgeOrphans`; the code-layer prune only ever deletes `file`/`symbol`/`module` nodes, never knowledge nodes, because an edgeless decision is missing a link rather than being junk.

| Question | How to answer it |
|----------|------------------|
| Where is `X` defined? | `neighbors symbol:X --in` filtered on `defines` |
| What breaks if I change `X`? | `neighbors symbol:X --in` filtered on `uses` |
| What code implements rule `Y`? | `neighbors rule:Y --in` |
| What's in this directory / hub? | `neighbors module:<path> --in` |

### The rebuild is partial, not just gated

A gate that skips the work when nothing changed is not enough — when something
*did* change, the old code re-derived every edge in the project. Three pieces make
the rebuild proportional to the change:

| Piece | Where | What it removes |
|-------|-------|-----------------|
| `code_files` fingerprints | `code.db` | Re-hashing 64,000 identifier rows in JS (~220ms every rebuild) to discover 4 files moved. Now one row per file. |
| `code_identifiers` reverse index | `code.db` | Scanning the project to answer "which files mention symbol S". Now one indexed lookup. |
| `derived_file` bookkeeping | `graph.db` | Edge deletes and node upserts for files whose declarations and identifiers are unchanged. |

The reverse index is what makes correctness tractable rather than merely fast. A
`uses` edge is cross-file: a symbol declared in one file is referenced from
others, so **adding a symbol in file B changes the correct output for files A and
Z even though neither was touched**. Those edges are found through the reverse
index and added; symbols that vanish lose every edge pointing at them, including
from files that were never rebuilt.

| Change | Wall clock |
|--------|-----------:|
| nothing changed (gated) | 45ms |
| one file edited | 20–250ms |
| every file changed (cold) | ~1,500ms |

**The fan-out caps are guards, not selections, and must never bind.** A binding cap
makes the derivation history-dependent — a full rebuild deletes and re-adds a
file's edges so it ends up with exactly the cap, while a partial rebuild leaves an
unchanged file's edges alone so it keeps whatever it had. The original cap of 6 was
exceeded by 69 sources, which is how partial and from-scratch builds came to
disagree while each was internally consistent. A test asserts no source exceeds
the cap, so one that starts binding fails loudly.

### The rebuild is gated on a structure fingerprint

`structure_signature` is a hash of the sidecar's `(file_path, name, kind, parent)` tuples, stored in
`graph_meta`. If it is unchanged, `backfillFromCode` returns immediately.

This is the single biggest cost control in the graph: editing a comment, a log line, or a docstring
re-indexes the chunk store (mtime moved) but leaves the declaration index untouched, so there is
nothing to recompute. Measured: a three-file `touch` cost ~1.9s of graph work producing zero new
edges before the gate, and 23–57ms after. Real structural changes still pay the full ~1.4s rebuild.

The gate is conservative by construction: no `code.db`, or an empty symbol set, yields no signature and
therefore no skip.

### Idempotence

`defines`, `uses`, and both flavours of `related_to` are **deleted and recomputed** on every build, never
accumulated. This is load-bearing: the sync child runs the rebuild on every code change, so an
accumulating rebuild grows the graph without bound (measured: 2197 → 2301 edges over two identical
builds). Slug → node resolution is first-wins with `ORDER BY id` for the same reason — an unstable
winner re-targets edges on every run. `used_by` (registry) and curated `touches` / `applies_to` are
never deleted.

### Staying current

The vector sync child rebuilds the code layer automatically, **gated on the code store actually having changed** (`filesIndexed > 0`), so a source edit flows through to the graph without a manual `graph build`. Set `SYNC_SKIP_GRAPH=1` to disable. Rules are discovered from `opencode.jsonc`'s `instructions` array, not a hardcoded directory, so the graph follows the config.

## CLI

```bash
node skills/graph-context/scripts/graph.ts build          # backfill from wiki+rules+learnings+registry
node skills/graph-context/scripts/graph.ts query "cache strategy"   # hybrid retrieval
node skills/graph-context/scripts/graph.ts neighbors pattern:cache   # traverse
node skills/graph-context/scripts/graph.ts impact rule:context-strategy  # who uses it
node skills/graph-context/scripts/graph.ts path skill:vectorize-context hub-subcommand:project/graph
node skills/graph-context/scripts/graph.ts stats
node skills/graph-context/scripts/graph.ts probe          # precision probe vs vector-only
node skills/graph-context/scripts/graph.ts propose        # propose supersedes edges for review (never writes)
node skills/graph-context/scripts/graph.ts accept-candidates  # promote reviewed proposals to real edges
```

Flags: `--dir PATH` (project root or .opencode dir), `--depth N`, `--topK N`, `--maxPages N` (propose), `--queries "a|b|c"` (probe).

### Knowledge-node type resolution

A page's type is resolved in a fixed order, cheapest and most authoritative first:

1. **structural** — where it lives (`rules/`, `SKILL.md`, `agents/`, `learnings/`, `references/`).
2. **frontmatter** — an explicit `type:` the wiki schema recognises.
3. **directory** — the schema's own mapping: `research/` → `source-summary`, `patterns/` → `pattern`, `decisions.md` → `decision`, `theory.md` → `synthesis`.
4. **model** — only for the genuinely ambiguous `entity | concept` slot (`frameworks/` and root), via the local NLI classifier.

The model is a refinement, never the primary mechanism. It runs only when nothing above pinned the type, scores a short lead of the page, and keeps the safe `concept` default unless it clears a margin. Provenance is recorded in each node's `meta.typeSource` (`structural` | `frontmatter` | `directory` | `inferred` | `default`) so an inferred type is never mistaken for a declared one. `GRAPH_INFER_TYPES=0` disables step 4.

### Proposed edges (review-gated)

`supersedes` is the one relationship the graph cannot derive structurally, so `propose` generates **candidates**, never edges: it asks the classifier whether each page *claims* to replace an earlier document, resolves the target by title mention (deterministically — the model cannot do it, as measured), and writes the result to `.opencode/state/graph/edge-candidates.json`. `accept-candidates` promotes reviewed proposals to real edges; nothing else writes them. This is deliberately not auto-edge creation — a wrong inferred edge is a traversal that answers confidently with the wrong page.

## Workflow

### 1. Build the graph (first use / after harvest)

```
node <skill-dir>/scripts/graph.ts build
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
node <skill-dir>/scripts/graph.ts query "what is the caching strategy?"
```

Two-stage: vector recall (top-K candidates) → graph refine (BFS depth ≤ 2 from matched nodes, decaying score `0.6^depth`) → merged ranked list with `kind=vector|graph` and the edge type that connected each graph hit.

### 3. Impact analysis (config self-maintenance)

```
node <skill-dir>/scripts/graph.ts impact rule:context-strategy
node <skill-dir>/scripts/graph.ts path skill:self-improvement hub-subcommand:harvest-context/session
```

Use before editing rules/skills/hub specs — reveals what depends on the asset.

### 4. Compounding (harvest-time edge writing)

Every mechanism that already writes durable markdown feeds the graph:

| Mechanism | Contribution |
|-----------|-------------|
| `/memory-hub` (session/pattern/decision writes) | nodes + derived_from edges on next `build` |
| `self-improvement` skill learnings capture | learning nodes, `touches` edges, weight = Recurrence-Count |
| `/maintain-hub consolidate-telemetry` (ADRs) | decision nodes, `supersedes` edges |
| `/maintain-hub retrospect` | lesson nodes |
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

- `node <skill-dir>/scripts/graph.ts stats` — counts by type/edge
- `node <skill-dir>/scripts/graph.ts probe` — precision probe vs vector-only baseline
- `node <skill-dir>/scripts/graph.ts query "<known phrase>"` — spot-check a known wiki page surfaces with its related nodes

## Related

- `vectorize-context` skill — sibling vector store, same sqlite pattern; graph refines its recall
- `self-improvement` skill — learnings capture is the primary edge source
- `wiki` skill — frontmatter schema is the node-extraction contract
- `graph-thinking` skill — mental model for structuring the graph
- `/maintain-hub consolidate-telemetry` — ADR → supersedes edges
- `/plan-hub improvements` — cluster-density edges can order audit proposals
