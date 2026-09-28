---
title: "Retiring the OpenCode agent roster into skills (2026-09-27)"
type: decision
tags: [agents, skills, opencode-bridge, retirement, claude-code, opencode]
created: 2026-09-27
updated: 2026-09-27
status: active
sources: [[[opencode-port-2026-09-27]]]
---

# Retiring the OpenCode agent roster into skills (2026-09-27)

Follow-up to [[opencode-port-2026-09-27]]. That port built `opencode-bridge`, a Claude Code plugin
bundling the 31-agent OpenCode roster (namespaced `opencode-bridge:<name>`) plus an MCP server for
five mass-edit tools. This entry records why that plugin was fully retired days later, in favor of
folding the agents directly into `skills/` — a location both OpenCode and Claude Code already read
identically, so nothing needs bridging at all.

## The governing distinction

An agent earns a separate context for one of two reasons: it needs to run in parallel without
polluting the main thread, or its entire value is being a second, uncontaminated opinion on
something the main thread already has assumptions about. Everything else in a 31-agent roster like
this one is procedural knowledge — a checklist, a methodology — and Skills already do exactly that:
auto-selected by description, running inline by default, restrictable via `allowed-tools`/
`disallowed-tools` without needing isolation at all. A skill can still fork (`context: fork` +
`agent: general-purpose`) when isolation is genuinely the point, so even the "needs a second
opinion" cases don't require a bespoke named agent — just a skill that forks a generic one and
supplies its own body as the brief.

Under that lens, of the 31 original agents (30 once `hubs`, the primary/default agent, is set
aside — it was never a dispatchable subagent to begin with), only **2** still needed to be
isolation-worthy: `architect-review` and `plan-critic`. The other 28 sorted into:

- **14 pure or trusted eliminations** — either a native Claude Code equivalent already exists
  (`explore` → the built-in `Explore` agent type; `code-reviewer`/`security-reviewer` → native
  `code-review`/`security-review` skills), or an existing skill in this repo already did the same
  job (`planner` → `plan`/`plan-execute`/`planning-and-task-breakdown`; `verifier` → `verify`;
  `tracer` → `trace`; `debugger` → `systematic-debugging`/`debug`; `commit-drafter` →
  `conventional-commit`; `skill-creator` agent → `skill-creator` skill; `test-engineer` →
  `tdd`/`test-coverage-improver`/`vitest`; `document-specialist` →
  `context7-docs`/`external-context`; `refactoring`/`code-simplifier` → `code-simplification`).
  `config-orchestrator` was dropped with no replacement — it was entirely OpenCode-specific
  (opencode.jsonc/agents/skills/tools/plugins management), and the Claude Code equivalent is the
  native `update-config` skill plus `claude/install.sh` itself.
- **14 new skills**, one per remaining agent, with two pairs merged where the source agents were
  near-duplicates of each other (`analyst` + `requirements-analyzer` → `requirements-analysis`;
  `frontend-design` + `designer` → `distinctive-frontend-design`).
- **2 fork-skills** (`architect-review`, `plan-critic`) using `context: fork` + `agent:
  general-purpose`, replacing the isolation that a named agent used to provide.

## What this made possible

- `opencode-bridge`'s `agents/` component and `claude/build-agents.mjs` are gone entirely.
- The `opencode-edit-tools` MCP server survives, decoupled from the plugin — registered directly
  via `claude mcp add --scope user --transport stdio opencode-edit-tools -- node
  /home/tlh/.claude/tool-wrapper/server.mjs`. It never depended on the agent roster; only the
  packaging happened to bundle them together at first.
- `claude/install.sh` no longer has a plugin-symlink step — every remaining piece is a plain
  symlink (`rules/`, `skills/<name>/`, `hooks/`, `knowledge-claude-config/`, `CLAUDE.md`).
- On the OpenCode side, `agents/hubs.md`'s `<Specialist_Skills>` section and `AGENTS.md`'s model/
  fallback section were rewritten to route to skill names instead of `@agent-name` dispatch, and
  the old per-agent model-tier/timeout tables (which no longer had anything to route) were replaced
  with a much shorter note covering just the two fork-worthy skills.

## A real trade-off worth flagging, not hiding

OpenCode's own Task-tool dispatch model may or may not support spawning a generic/unnamed subagent
type the way Claude Code's `general-purpose` does — this wasn't confirmed either way during the
port. If it doesn't, `architect-review` and `plan-critic` lose true isolation when OpenCode itself
runs them (the `context: fork` frontmatter is simply an unrecognized key OpenCode ignores, so the
skill still loads and still works — just inline, not forked). Worth checking directly against
OpenCode's own docs before assuming parity; this entry deliberately doesn't paper over the
uncertainty.

## Related

- [[opencode-port-2026-09-27]] — the original global-config port this follows up on
- [[schema]] — this knowledge base's own conventions
