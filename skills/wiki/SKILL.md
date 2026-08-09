---
name: wiki
description: LLM Wiki compliance layer — index, log, frontmatter, and cross-references for .opencode/context/ (Karpathy model)
relatedSkills: harvest-context, vectorize-context, remember
level: 4
license: MIT
triggers: ["wiki", "llm-wiki", "karpathy wiki"]
---

# LLM Wiki — Compliance Layer

Persistent, self-maintained markdown knowledge base inspired by [Karpathy's LLM Wiki pattern](https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f).

**This is not a separate workflow.** It is a compliance layer woven into the existing `.opencode/context/`-populating commands (`consume`, `docs`, `web-research`, `memory`, `session`, `compare`, `context`, `secondbrain`, etc.). When those commands run, they automatically ensure the wiki infrastructure stays healthy.

## What the Compliance Layer Does

Every time a command writes to `.opencode/context/`, it also:

1. **Ensures `index.md` exists and is up to date** — catalog of all pages with links, summaries, and metadata
2. **Appends to `log.md`** — chronological record of the operation
3. **Ensures `wiki-schema.md` exists** — tells future LLM sessions how the wiki is structured
4. **Adds YAML frontmatter** to any new files it creates
5. **Scans for cross-reference opportunities** — links new content to existing pages

## Storage

The wiki co-opts the existing `.opencode/context/` structure. No parallel directories.

```
.opencode/context/
├── index.md              # Wiki catalog (auto-maintained)
├── log.md                # Chronological operation record (append-only)
├── wiki-schema.md        # Schema — tells the LLM how to maintain the wiki
├── research/             # Raw sources + source summaries (consume, context7, web-research)
├── frameworks/           # Entity/concept pages (architecture, design, conventions)
├── patterns/             # Pattern pages (discovered patterns, anti-patterns, solutions)
├── decisions.md          # Decision records (ADRs)
└── theory.md             # Living synthesis / overview
```

## Compliance Procedures

### After any file write to `.opencode/context/`

Run these steps after every write (file creation, update, or deletion):

```
1. UPDATE index.md
   - Scan .opencode/context/ for all .md files (excluding index.md, log.md, wiki-schema.md)
   - For each: extract title from frontmatter, note category from subdirectory, write one-line summary
   - Rebuild the catalog organized by category

2. APPEND to log.md
   - Add entry: ## [YYYY-MM-DD] {operation} | {title}
   - Include: what was done, which files were touched, any notable cross-references added

3. ENSURE wiki-schema.md exists
   - If missing: generate it from the current state of .opencode/context/
   - Schema describes: directory structure, frontmatter conventions, cross-reference syntax, operation workflows

4. ADD YAML frontmatter to new files
   - title, type (entity|concept|source-summary|decision|pattern|synthesis), tags, created/updated dates, status
   - For existing files missing frontmatter: add it (best-effort, don't overwrite existing content)

5. SCAN for cross-references
   - Check if the new content mentions any existing page by name/concept
   - Add [[page-slug]] links where appropriate
   - Check if existing pages should link to the new content

6. SYNC references in opencode.jsonc
   - Ensure the project's opencode.jsonc has a `references` key with a `context` entry
     pointing to `./.opencode/context` (local path reference) so the durable
     knowledge base is accessible to agents via the references system
     (see https://opencode.ai/docs/references/ for schema)
   - Scan the new content for GitHub repository references (github.com/owner/repo)
   - For each substantive project reference (not gists, not forks, not passing
     mentions), add or update a `references` entry with `repository` set to
     `owner/repo` and a `description` explaining when to use it
   - Deduplicate variant names to the primary repo
   - If `references` already exists, merge new entries without removing existing ones
```

### YAML Frontmatter Convention

```yaml
---
title: "Page Title"
type: entity | concept | source-summary | decision | pattern | synthesis
tags: [tag1, tag2]
created: 2026-07-04
updated: 2026-07-04
sources: [source-slug-1, source-slug-2]
status: active | needs-review | stale
---
```

### Cross-Reference Syntax

Use `[[page-slug]]` wiki-link syntax. The LLM maintains these on every write. Cross-references work across all `.opencode/context/` subdirectories.

## Why This Works

The tedious part of maintaining a knowledge base is the bookkeeping — updating cross-references, keeping summaries current, maintaining consistency across dozens of pages. Humans abandon wikis because the maintenance burden grows faster than the value. LLMs don't get bored, don't forget to update a cross-reference, and can touch 15 files in one pass.

By weaving compliance into existing workflows, the wiki stays maintained automatically — no separate commands to remember, no extra steps for the user. Every `consume`, `docs`, `web-research`, `memory`, or `session` call keeps the wiki healthy as a side effect.

## Hard Constraints
- NO vector embeddings — query uses index + keyword + tag matching only
- Raw sources in `research/` are immutable — LLM reads but never modifies them
- Wiki pages are committed (durable context) — they compound across sessions
- The wiki-schema.md is the key configuration — co-evolve it with the LLM
- **Any file already in `.opencode/context/` is part of the wiki** — compliance procedures account for everything
- **Files placed by other tools are automatically wiki pages** — no migration needed
