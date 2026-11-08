# Hub Library (`hubDocs`)

The hub package's captured-document store. It keeps source material the agent has
already fetched, so a later run reads locally instead of re-fetching, and so the
material is versioned, deduplicated and reachable from the wiki, the graph and the
vector index.

Owned by `plugins/hubs/`:

```
plugins/hubs/tools/library/
├── index.ts     registerLibraryTool(editor, directory) → tool "hubDocs"
├── store.ts     ingest · get · list · search · annotate · refresh · prune · migrate
├── schema.ts    frontmatter parse/serialize, hashing, identity, summary
├── search.ts    metadata + full-text scoring
└── paths.ts     context/library + state/context-library roots
```

There is no CLI, no npm package and no standalone plugin. The tool ships in the
hubs package because the hub subcommands and the skills bundled with them are its
only consumers.

## Layout

```
.opencode/context/library/
├── <collection>/
│   ├── <slug>.md                 # frontmatter + markdown body
│   └── <slug>/                   # only when > 40 KB
│       ├── index.md
│       └── part-01.md …
└── archive/                      # pruned pages (status: stale)
```

`<collection>` is the vendor, product or domain (`openai`, `stripe`,
`acme-platform`). `<slug>` is `kebab(title)` plus a short hash of the canonical URL.

The derived lookup cache lives at `.opencode/state/context-library/index.json`.
Losing it costs one directory scan, never data — the same state-vs-context split
the rest of the configuration follows.

## Frontmatter

```yaml
---
title: "OpenAI Chat Completions"
type: document
collection: openai
source_url: "https://platform.openai.com/docs/api-reference/chat"
source_type: official          # official | maintainer | community | first-party
retrieved_at: 2026-11-07
content_sha256: "3f9c…"
content_type: text/markdown
language: python
version: "2.38.0"
revision: 1
tags: [api, chat, llm]
summary: "One paragraph readable without the body."
status: active
refresh_after_days: 90
document: null
part: null
created: 2026-11-07
updated: 2026-11-07
sources: ["https://platform.openai.com/docs/api-reference/chat"]
---
```

Identity is `source_url + language + version`. `content_sha256` is computed over
whitespace-normalised markdown, so cosmetic churn is not a revision. Revisions are
git history; there is no `.revisions/` tree.

`license` is not a field. If the source states one, it arrives as a single line in
the body.

## Actions

| Action | Behaviour |
| --- | --- |
| `ingest` | Dedupe by hash (timestamp only), revision bump on change, notes preserved, H2 split above 40 KB, log entry |
| `get` | By id or URL (+language/version), optional `part` |
| `list` | collection / tag / source_type / stale filters |
| `search` | Title, tags, summary, headings, body hits — no embeddings |
| `annotate` | Appends a dated bullet under `## Local notes`; survives refresh |
| `refresh` | Re-ingest by id/url; bumps revision or dedupes |
| `prune` | `dry_run` listing; archives stale pages (split-safe), sets `status: stale` |
| `migrate` | `dry_run`; converts single-source research pages into `document` records |

## Fetch boundary

The tool never performs HTTP. The agent fetches with `ax` (`--md`, `--body`) or an
MCP (Context7) and passes markdown plus metadata to `ingest`. One HTTP path, ax's
caps and TOON compaction intact.

## No content gates

Documents are stored and returned as supplied. Exploit notes, bypass recipes and
pentest transcripts are ordinary documents; nothing classifies, quarantines,
redacts or warns. The only confirmation in the path is the normal permission
prompt before a command executes.

## Integration

| System | Effect |
| --- | --- |
| Wiki | `type: document`; catalogue section **Library (Captured Sources)**; parts and `archive/` excluded |
| `log.md` | ingest / refresh / prune append one parseable line |
| Graph | `document` nodes with edges to tags and directory grouping |
| Vector index | `vectorize-hook` syncs `context/**` on `file.edited`; no extra wiring |
| Hubs | `research-hub/{library-docs,web-research,deep-research}`, `memory-hub/{consume,search,prune}` call the tool |
| Compaction | `summary` is what survives; `get` returns it by default |

## Freshness

`official` 30 days, `maintainer` 60, `community` 120, `first-party` 365.
`list({ stale: true })` reports due pages; `prune` archives rather than deletes.
