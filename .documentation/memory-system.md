# Memory System

Durable knowledge, session state, and the wiki layer. This is the system that decides what
survives a session, what is regenerated, and what an agent is allowed to forget.

The governing rule is `rules/context-strategy.md`. The load-bearing distinction is **state vs
context**, and getting it wrong is how agent memory systems become unreadable.

---

## The three tiers

| Tier | Location                      | Git         | Lifecycle                | Purpose |
| ---- | ----------------------------- | ----------- | ------------------------ | ------- |
| **State**      | `.opencode/state/`    | gitignored  | ephemeral, deleted between sessions | mode state, checkpoints, caches, session data |
| **Context**    | `.opencode/context/`  | **committed** | accumulates, compounds | decisions, patterns, research, frameworks, theory |
| **Secrets**    | `.opencode/state/sessions/` | gitignored | session lifetime only | anything sensitive |

```bash
.opencode/
├── state/          # ephemeral — gitignored
│   ├── vector/     #   graph.db, code.db, context.db   ← the knowledge plane
│   ├── cache/      #   multi-tier prompt cache
│   ├── sessions/   #   per-session secrets
│   ├── orchestration/  # checkpoints, progress
│   └── harvest/    #   session transcripts (may contain PII)
└── context/        # durable — committed
    ├── research/   #   external sources, ingested docs
    ├── frameworks/ #   architecture and design
    ├── patterns/   #   discovered patterns and anti-patterns
    ├── decisions.md    # ADRs
    ├── theory.md       # living documentation
    ├── index.md        # generated catalog
    ├── log.md          # operation chronicle
    └── wiki-schema.md  # how to maintain all of the above
```

State is gitignored because it changes every turn. Context is committed because it is the
asset. Putting a session transcript in `context/` is how a private conversation ends up in git
history.

---

## The wiki layer

A self-maintaining knowledge base with three parts:

| File              | Role |
| ----------------- | ---- |
| `index.md`        | Catalog of every page, rebuilt from disk |
| `log.md`          | Append-only chronicle of every operation |
| `wiki-schema.md`  | The contract the other two must satisfy |

`index.md` is **generated**, by `skills/graph-context/scripts/regen-index.ts`:

```bash
npx tsx skills/graph-context/scripts/regen-index.ts
```

Every `[[slug]]` it emits resolves to a real page, because slugs are derived from files on disk
rather than typed by hand.

**The failure it prevents.** The catalog had drifted to 69 entries, 36 of which named pages that
did not exist — the research pages had moved into dated subdirectories and the slugs were never
updated. Every one of those produced a dangling edge in the knowledge graph. Hand-patching the
entries would have re-broken on the next move; regenerating cannot.

The check that keeps it honest is `skippedLinks` in `graph.ts build` output. A non-zero count
means some link in the tree names a page that does not exist.

---

## Frame retrieval

Agents do not load the whole knowledge base. Retrieval is **framed by topic**:

```
"Load context about auth"  →  context/frameworks/auth*
                           →  decisions.md, auth entries only
                           →  patterns/auth*
```

`scope-context` automates this: it extracts keywords from the task, then returns the matching
paths. Loading everything is how a context window becomes useless.

---

## `/memory-hub`

The user-facing interface. 18 subcommands across four intents.

| Intent      | Subcommands |
| ----------- | ----------- |
| **Capture** | `capture`, `consume`, `web-research`, `journal`, `decompose`, `compare` |
| **Retrieve**| `search`, `secondbrain`, `context`, `memory`, `resume` |
| **Curate**  | `prune`, `sweep`, `compress`, `diff`, `export`, `codebase` |
| **Compound**| `recall`, `consume`, `codebase` |

### `/memory-hub consume`

Ingests external content into durable context:

1. Extract text from a file, directory, or URL (JS-rendered pages included).
2. Clean and normalise to markdown.
3. Save to `context/research/{source-slug}/{timestamp}.md`.
4. **Privacy-scan** before anything is written.
5. **Wiki-compliance** — update `index.md`, append to `log.md`, add frontmatter, scan for
   cross-references.
6. **References sync** — any `github.com/owner/repo` mentioned becomes an `opencode.jsonc`
   reference so the repository is available to agents as a known resource.

**All context operations are manual.** No auto-harvest, no auto-commit, no auto-chaining. The
agent creates durable knowledge only when asked, because a memory system that writes on its own
becomes a memory system nobody trusts.

---

## Durable context in the knowledge graph

Context pages are not just files — they are graph nodes. The wiki backfill indexes them by
structure, not by frontmatter guesswork:

| Location                 | Node type         |
| ------------------------ | ----------------- |
| `context/frameworks/`    | `framework`       |
| `context/patterns/`      | `pattern`         |
| `context/research/`      | `source-summary`  |
| `context/decisions.md`   | `decision`        |
| `rules/` (registered)    | `rule`            |
| `skills/*/SKILL.md`      | `skill`           |
| `agents/*.md`            | `agent`           |
| `command-hooks.jsonc`    | `hub-subcommand`  |

A rule is classified by **where it lives**, checked against both the conventional
`.opencode/rules` directory and the files `opencode.jsonc` actually loads via `instructions`.
This project keeps its rules at `<root>/rules`, which made every rule invisible to
retrieval until that was fixed.

→ [Knowledge Plane](knowledge-plane.md) covers the graph invariants.

---

## Relationship to the knowledge plane

```
  .opencode/context/          .opencode/state/vector/
  ├── markdown knowledge  →   context.db   (embedded, chunked)
  ├── structured assets  →   graph.db     (entities + relations)
  └── wiki index/log     →   (the catalog is itself a graph node)
                              code.db      (symbols, identifiers, chunks)
```

Context is the **source of truth**; the vector store is a **derived index** over it. If the stores
disagree, the markdown wins and a rebuild reconciles them. The reverse — treating the index as
canonical — is how a knowledge base rots.

---

## Interdependencies

| This system uses | From |
| ---------------- | ---- |
| Embeddings + reranking, incremental sync | [Knowledge Plane](knowledge-plane.md) |
| `queueContextMessage` for injections | [Event Interception](plugins-hooks.md) |
| `readJsonc`, `json-edit` | [`tools/`](../tools/) |
| State vs context discipline | `rules/context-strategy.md` |
| Hub routing to reach it | [Hub Command System](hub-command-system.md) |

→ Next: [Knowledge Plane](knowledge-plane.md)
