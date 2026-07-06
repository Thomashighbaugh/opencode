---
title: "LLM Wiki Schema"
type: concept
tags: [wiki, schema, meta]
created: 2026-07-04
updated: 2026-07-04
status: active
---

# LLM Wiki Schema

This directory (`/home/tlh/.config/opencode/.opencode/context/`) is a self-maintained markdown knowledge base following the [Karpathy LLM Wiki pattern](https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f).

## Directory Structure

```
.opencode/context/
├── index.md              # Wiki catalog (auto-maintained)
├── log.md                # Chronological operation record (append-only)
├── wiki-schema.md        # This file — schema definition
├── research/             # Raw sources + source summaries (consume, context7, web-research)
├── frameworks/           # Entity/concept pages (architecture, design, conventions)
├── patterns/             # Pattern pages (discovered patterns, anti-patterns, solutions)
├── decisions.md          # Decision records (ADRs)
└── theory.md             # Living synthesis / overview
```

## YAML Frontmatter Convention

Every `.md` file in the wiki MUST have YAML frontmatter:

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

## Cross-Reference Syntax

Use `[[page-slug]]` wiki-link syntax. Cross-references work across all subdirectories.

## Compliance Procedures

After every write to `.opencode/context/`:

1. **Update `index.md`** — scan all `.md` files, extract frontmatter, rebuild catalog by category
2. **Append to `log.md`** — chronological record of the operation
3. **Ensure `wiki-schema.md` exists** — this file
4. **Add YAML frontmatter** to new files
5. **Scan for cross-references** — link new content to existing pages

## File Types

| Type | Description | Location |
|------|-------------|----------|
| `source-summary` | Summary of an external source (docs, paper, article) | `research/` |
| `entity` | A concept, tool, or component | `frameworks/` or root |
| `concept` | Abstract concept or design principle | `frameworks/` or root |
| `decision` | Architecture Decision Record | `decisions.md` |
| `pattern` | Discovered pattern or anti-pattern | `patterns/` |
| `synthesis` | Living synthesis / overview | `theory.md` |

## Hard Constraints

- No vector embeddings — query uses index + keyword + tag matching only
- Raw sources in `research/` are immutable — LLM reads but never modifies them
- Wiki pages are committed (durable context) — they compound across sessions
