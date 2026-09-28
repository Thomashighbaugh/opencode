# Global instructions

Personal, user-scope instructions for every project. Project-level `CLAUDE.md`/`AGENTS.md` files layer on top of this, not instead of it. `~/.claude/rules/` (symlinked from `~/.config/opencode/rules/`) loads alongside this file every session — see those files for coding-style, git-workflow, security, and testing conventions; this file only covers things specific to how Claude Code itself should behave, ported and adapted from the OpenCode "Hubs" configuration this machine used before Claude Code.

## Single-shot vs. subagent decomposition

Default to doing work directly, yourself, in the current context. Before starting a non-trivial multi-step task, make one explicit assessment: would splitting this into independent subagent tasks produce a **meaningfully** better result — through parallelism, distinct specialization, or an isolated review pass — than doing it in a straight shot?

- **No meaningful advantage** (the common case): just do the work yourself. Don't propose decomposition for its own sake.
- **Yes, meaningful advantage**: decompose into scoped, independent tasks and dispatch subagents for them, per the normal biases already in force this session (act, don't ask, unless genuinely blocked).

When you do decompose across subagents, the one discipline that matters most is **write-scope isolation**: partition the work so no two subagents in flight can write to the same file. Two ways to achieve that:
- **Disjoint scopes**: give each subagent its own set of files/directories and tell it explicitly not to touch anything outside that set.
- **Serialize the shared parts**: if two subagents' work genuinely must touch the same file, don't run them concurrently — sequence them, with the second given the first's diff as context.

A subagent silently overwriting another's edit to the same file is the single most expensive failure mode in this pattern (lost work, no error surfaced) — treat avoiding it as a hard constraint on any decomposition, not a nice-to-have.

## Prefer fewer, denser requests over many small ones

This is a standing ethic, independent of whatever usage headroom happens to be available right now — optimize for it by default, not only under pressure.

- When an edit is **mechanical and repeats** — the same rename across a file, the same key bumped across many config files, a consistent pattern-based refactor — prefer one batched edit over a sequence of individual ones. The `opencode-edit-tools` MCP server (ported from this machine's prior OpenCode config, registered via `claude mcp add`) provides tools for exactly this: `regex_edit` (line/pattern operations within one file), `json_edit` / `yaml_edit` (path-based edits, no ad hoc scripts), `conf_edit` (.env/INI/key=value files), and `multi_edit` (one regex applied across a glob of files — defaults to a dry run so you can check the diff before committing to it).
- Batch independent tool calls (reads, greps, lookups) into a single message rather than serializing them across turns.
- Don't ask a clarifying question a file, a `git log`, or a quick look at existing conventions would answer.

## The prior OpenCode agent roster is now skills

The OpenCode config's 31-agent specialist roster (architect, critic, planner, executor, and so on)
was folded into skills, so it auto-selects by description here exactly the same as on the OpenCode
side — no bridging plugin needed. Two of them, `architect-review` and `plan-critic`, are worth
running as an isolated subagent rather than loading inline: they explicitly need a perspective
uncontaminated by the current conversation's assumptions, so use the Agent tool with a
`general-purpose` type and the skill's own content as the brief, rather than loading the skill in
place. Everything else in the old roster is a plain skill now — load it like any other. See
`~/.claude/knowledge-base/agents-to-skills-2026-09-27.md` for the full retirement mapping.

## Maintaining `~/.claude/knowledge-base/`

`~/.claude/knowledge-base/` (symlinked from `~/.config/opencode/claude/knowledge-claude-config/`) is a **human-readable** knowledge base about Claude Code's own configuration surface — its SDK, hooks, skills, plugins, MCP, CLAUDE.md/memory behavior, and the specifics of how this machine's setup uses them. It exists so the user can read what you learned without having to ask you — write for a human reader, not as a compressed note-to-self. This is a different system from Claude Code's own auto memory (`~/.claude/projects/<project>/memory/`): auto memory is per-project and mostly about the user's preferences and corrections; this knowledge base is specifically about **Claude Code's own configuration mechanics**, applies globally, and is committed to `~/.config/opencode`'s git history like everything else in that repo.

**When this applies**: any time you're working on Claude Code's own global configuration (this file, `~/.claude/settings.json`, hooks, MCP registration, or anything else under `~/.claude/`) and you learn something non-obvious — a spec detail that surprised you, a gotcha you hit and worked around, a decision and why it was made that way.

**How**: follow the same convention as `~/.config/opencode/.opencode/context/wiki-schema.md` (the "LLM Wiki" pattern) — every `.md` file gets YAML frontmatter:

```yaml
---
title: "Page Title"
type: entity | concept | decision | pattern
tags: [tag1, tag2]
created: YYYY-MM-DD
updated: YYYY-MM-DD
status: active | needs-review | stale
---
```

Update `~/.claude/knowledge-base/index.md` (a catalog table, same shape as the OpenCode wiki's `index.md`) whenever you add or materially change a page. Use `[[page-slug]]` for cross-references. Don't record what's derivable from the docs or the code on demand — record what you had to *discover* (surprising behavior, an undocumented interaction, why a particular setting was chosen over the obvious alternative).
