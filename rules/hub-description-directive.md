# Hub Subcommand Description Directive

## The Problem

When the TUI dialog lists hub subcommands, the hub name (`/orchestrate`, `/harvest-context`, etc.) is **not visually present** as context. The user sees a flat list of 20-30 subcommand names at once. A name like `docs`, `context`, `scan`, or `purge` might seem obvious within the hub's context, but that context is invisible to the user at the moment of selection.

Rearranging menus, adding nested categories, or splitting hubs creates debugging nightmares and configuration breakage with almost no measurable improvement in discoverability. **This directive is the alternative.**

## The Solution

Every hub subcommand **description** (the line shown in the TUI menu next to the subcommand name) MUST embed:

1. **External tool names** — the actual CLI tool, API or service it invokes (e.g., `Context7 MCP`, `gh`, `git`, `npm`)
2. **Recognizable buzzwords** — the domain-specific terms a user would search for (e.g., `library docs`, `fetch`, `scan`, `deploy`, `secrets`, `vulnerability`)
3. **Concrete action verb** — what actually happens (e.g., `fetches`, `scans`, `generates`, `repairs`, `validates`)

## Format

```
{action verb} {what it does} via {tool/service} — {buzzwords}
```

**Examples:**
- `docs`: `Fetch official library docs via Context7 MCP API — React, Next.js, Tailwind, Prisma, Express, Django, any npm/PyPI package`
- `scan`: `Run security vulnerability scan via SAST rules — secrets detection, dependency audit, compliance checks`
- `pr`: `Create, view, merge pull requests via GitHub CLI — diff, list, checks, review`
- `purge`: `Clean up stale orchestration state — remove old runs, free disk space`
- `git-cleanup`: `Fix orphaned CHANGELOG entries after .git/ rebuild — preserves entries, removes bad refs`

## Anti-Patterns

| BAD (hub-name-dependent) | GOOD (self-contained) |
|---|---|
| `Fetch library documentation` | `Fetch official library docs via Context7 MCP API` |
| `Analyze code patterns` | `Analyze codebase patterns and anti-patterns via static analysis` |
| `Validate configuration` | `Validate configuration via OpenCode schema — file existence, syntax, refs` |
| `Create a skill` | `Create a reusable skill from session knowledge — YAML frontmatter, workflow steps` |

## Enforcement

This is a **convention, not a hard rule**. The bar is: if a user who has never seen this hub before reads the description, they should understand:
- What tool/service does the work (if any)
- What recognizable outcome to expect
- That it's distinct from every other subcommand in the list

## Scope

Applies to:
- `hubMenu.ts` subcommand `description` fields (shown in TUI dialogs)
- `SKILL.md` subcommand section headers and descriptions
- `AGENTS.md` hub command reference tables