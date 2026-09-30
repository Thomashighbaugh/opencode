# Knowledge Plane

Hybrid retrieval over the codebase and the durable context. Local, incremental, and governed by
invariants rather than by good intentions.

This is the component most capable of looking correct while doing nothing. An edge type that is
never emitted, a rebuild that recomputes identical values, a store that is written but never read
— all of them report healthy counts. So every claim on this page is an invariant with a test
behind it.

---

## The three stores

| Store         | Size  | Holds                                                                  |
| ------------- | ----- | ---------------------------------------------------------------------- |
| `code.db`     | 25 MB | 2,261 chunks · 4,720 symbols · 70,868 identifier postings · 404 files |
| `context.db`  | 11 MB | Embedded durable-context chunks                                          |
| `graph.db`    | 6.7 MB | 3,596 nodes · 20,992 edges · structural metadata                       |

```bash
npx tsx skills/graph-context/scripts/graph.ts build
npx tsx skills/graph-context/scripts/graph.ts stats
```

**Measured state:** 0 dangling edges · 0 edgeless nodes · 0 files without a `part_of` edge.

---

## Retrieval: graph first, vectors second

```
  query
    │
    ├─▶ session cache ────────────────▶ hit?  return (0 inference, 0 child)
    │
    ├─▶ graph recall (pure SQL) ──────▶ entity/relation neighbourhood
    │        < 5 ms, no child process, no model load
    │
    ├─▶ vector recall ────────────────▶ Ollama embeddings + cosine
    │
    └─▶ BGE rerank ───────────────────▶ cross-encoder ordering
             └─ on failure: degrade to distance ordering, never to an error
```

Graph-only recall is deliberately a **pure-SQL** path. When the vector stores are cold, or the
embedding daemon is down, structural recall still answers. A retrieval layer that returns nothing
when a sidecar is unavailable is not a fallback.

### Negative caching

A query that matches nothing is remembered. Without it, every miss re-runs the full embed and
rerank pipeline, and a repeated "nothing found" costs as much as a successful search.

---

## Graph schema

| Edge type    | Meaning                                                        |
| ------------ | -------------------------------------------------------------- |
| `part_of`    | membership — file → module, symbol → enclosing scope, ref → skill |
| `defines`    | declaration — file → symbol                                     |
| `uses`       | reference — file → symbol                                       |
| `related_to` | semantic link between any two nodes                             |
| `used_by`    | hub subcommand → the skill or agent it delegates to            |
| `derived_from` | node → the source it was extracted from                      |
| `touches`    | learning → the area it concerns                                 |
| `applies_to` / `supersedes` | decision → scope / predecessor                       |

### The two structural invariants

1. **Every file is `part_of` a module.** Unconditional, which is why a `package.json` with no
   declarations is still connected.
2. **Every declaration is `defines`-linked to its file.** A file's node therefore always has an
   outgoing edge, so "edgeless leaf" is impossible by construction rather than by cleanup.

Both are enforced in the backfill and asserted by SQL in
`tests/global/knowledge-plane.test.ts`.

---

## Incremental rebuilds, and why they were broken

The backfill is partial: only files whose fingerprint changed are reprocessed. A settled rebuild
reports `skipped: "structure unchanged"` and does no work.

**The bug that made every rebuild partial-and-wrong.** The structure signature hashed only the
symbol table. Editing the *rules that derive edges* left the signature identical, so the partial
rebuild saw "structure unchanged", skipped, and the graph kept serving edges the new rules would
never produce. Five root-level files sat without a `part_of` edge for exactly this reason: no
file had changed, only the logic that derives their edges had.

Two mechanisms fix the class:

```ts
/** Bump when a change alters how edges are DERIVED from the symbol table. */
const DERIVATION_EPOCH = 2
```

1. The epoch participates in the signature, so a rule change alters it.
2. A stored-epoch mismatch **widens the partial rebuild to a full one** — the derived graph is
   suspect as a whole, so it is reprocessed as a whole.

A settled rebuild is still free, and a derivation change can never be skipped. Both properties
are tested.

---

## Referential integrity

SQLite enforces no foreign keys here, so a deleted or re-keyed node leaves its edges behind
pointing at nothing. The graph then keeps reporting relationships it can no longer resolve: a
traversal walks into a dead end and `impact` names a dependency that does not exist.

```ts
pruneDanglingEdges(inputDir)   // runs on every build, reports its count
```

It **probes read-only first**. Opening the graph for writing to run a `DELETE` that matches zero
rows still takes an exclusive lock, and on a 20,992-edge table that was long enough to stall a
concurrent reader — which is how a maintenance function became a source of multi-second hangs for
queries happening at the same moment.

This is how the current 0 was reached: 88 wiki links to non-existent pages, then 26 edges from
hub subcommands to agents that had never been indexed, then agents indexed under path-keyed ids
that no edge target matched.

---

## Node id derivation

```ts
nodeId(type, slug)
```

Slugs for wiki pages and config assets; **file paths** for file nodes; registry labels for
hub subcommands.

`nodeId` strips a leading `.opencode/` for knowledge types. It deliberately does **not** for
`file`, `module`, or `symbol` — those paths come from the code store relative to the *project
root*, and stripping made `.opencode/tools/project-info.ts` collide with a root
`tools/project-info.ts`: two different files sharing one node, and no way to join the graph to
the store on path.

---

## Cross-references

Wiki links are buffered during pass 1 and written in pass 2, only when the target exists. An edge
to a page that does not exist is not a pending edge — it is a false one.

Resolution is tried in order: exact id → path relative to the linking page → path relative to the
context root → bare slug suffix (matching both `skill:vectorize-context` and
`source-summary:context/research/arcanum`).

Three classes of text are **not** links, and treating them as links was the bulk of a 205-link
false alarm:

| Not a link                                    | Why it mattered |
| --------------------------------------------- | --------------- |
| Fenced code and inline code spans             | the schema's own `[[page-slug]]` example |
| External URLs, including GitHub links ending `.md` | a page of good citations counted as broken |
| `[[ ! -f ~/.psm/projects.json ]]`             | bash double-bracket tests, not wiki links |
| Anything not a path-like slug                 | `!`, `~`, `$`, spaces, quotes |

Templates and worked examples opt out with `resolveLinks: false` in frontmatter: their links are
correct in the project they generate, not here.

---

## Code indexing

`veclib.ts` extracts symbols at every indentation level — top-level declarations, function-local
consts, and class methods — with a scope stack, so a method records its enclosing class.

**The bug that lost every short-named class's methods.** `name.length < 3` rejected a declaration
*before* it was pushed onto the scope stack, so `class K { doThing() {} }` recorded `doThing` with
`parent: null`. The minimum-length rule exists to keep single-letter noise out of the symbol
table; applying it first also broke scope tracking. The fix separates the two concerns: the scope
opens regardless of name length, and only *indexing* is filtered.

The symbol sidecar also builds a reverse index (`code_identifiers`, 70,868 postings) so "which
files mention X" is a SQL lookup rather than a project scan.

---

## Runtime constraint

**Children run under Node, never Bun.** Bun 1.3.14 hard-crashes with a NAPI `FATAL ERROR` on
`require('better-sqlite3')`, which every vector child loads. Under Bun the child dies at startup
and queries silently return nothing.

`runtime.ts` resolves the interpreter Node-first. The query path is also strictly read-only — two
processes writing the same SQLite file deadlocked on `SQLITE_BUSY` long enough to blow the query
timeout.

---

## Interdependencies

| This system uses | From |
| ---------------- | ---- |
| Ollama (embeddings, rerank) | local daemon |
| `better-sqlite3` | run under Node |
| `child-registry.ts` supervision | [Event Interception](plugins-hooks.md) |
| Markdown source of truth | [Memory System](memory-system.md) |
| Injected into the next turn | [Event Interception](plugins-hooks.md) |

→ Next: [Orchestration](subagent-orchestration.md)
