---
title: "Claude Config Knowledge Base Schema"
type: concept
tags: [schema, meta, claude-code]
created: 2026-09-27
updated: 2026-09-27
status: active
---

# Claude Config Knowledge Base Schema

This directory (`~/.claude/knowledge-base/`, symlinked from `~/.config/opencode/claude/knowledge-claude-config/`) is a human-readable knowledge base about Claude Code's own configuration surface — its SDK, hooks, skills, plugins, MCP, and CLAUDE.md/memory behavior — and the specifics of how this machine's setup uses them. It follows the same convention as `~/.config/opencode/.opencode/context/wiki-schema.md` (the Karpathy LLM Wiki pattern), adapted for a single subject (Claude Code configuration) rather than a whole project.

## Why this exists, distinct from auto memory

Claude Code's own auto memory (`~/.claude/projects/<project>/memory/`) is per-project, mostly about the user's preferences and corrections, and not meant to be read as prose. This knowledge base is the opposite on every axis: global (not per-project), about Claude Code's own configuration mechanics (not the user), and written to be read by a human without them needing to ask first.

## Directory structure

```
knowledge-base/
├── index.md      # Catalog of every page — table with title, type, tags, status
├── schema.md     # This file
└── *.md          # Individual knowledge pages, flat (no subdirectories needed at this scale)
```

## YAML frontmatter convention

Every `.md` file MUST have YAML frontmatter:

```yaml
---
title: "Page Title"
type: entity | concept | decision | pattern
tags: [tag1, tag2]
created: YYYY-MM-DD
updated: YYYY-MM-DD
status: active | needs-review | stale
sources: [optional, list, of, doc, urls, or, other, page, slugs]
---
```

| Type | Description |
|------|-------------|
| `entity` | A concrete Claude Code component (a hook event, a settings key, a plugin field) |
| `concept` | An abstract mechanic (how CLAUDE.md loading order works, how plugin versioning is computed) |
| `decision` | Why this machine's setup does something a particular way, with the alternative it rejected |
| `pattern` | A reusable approach discovered while working on this config (e.g. "how to bundle an MCP server inside a skills-dir plugin without hitting path-containment errors") |

## Cross-reference syntax

Use `[[page-slug]]` wiki-link syntax, same as the OpenCode wiki.

## Compliance procedure

After writing or materially updating a page:
1. Update `index.md` — add or refresh its row in the catalog table.
2. Add/refresh YAML frontmatter, bumping `updated`.
3. Link related pages with `[[page-slug]]` where relevant.

## Hard constraints

- No vector embeddings for this one — it's small enough that plain reading + grep suffices. If it ever grows past what fits in a few reads, consider pointing `skills/vectorize-context` at it instead.
- Write for a human reader first. If a page reads like an internal note-to-self, rewrite it.
