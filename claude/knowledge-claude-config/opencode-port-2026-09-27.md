---
title: "Porting the OpenCode Hubs config to Claude Code (2026-09-27)"
type: decision
tags: [opencode-bridge, plugins, hooks, mcp, skills, agents, claude-md, agents-md]
created: 2026-09-27
updated: 2026-09-27
status: active
sources: [https://code.claude.com/docs/en/sub-agents, https://code.claude.com/docs/en/skills, https://code.claude.com/docs/en/hooks, https://code.claude.com/docs/en/memory, https://code.claude.com/docs/en/plugins-reference, https://code.claude.com/docs/en/plugins/loading, https://code.claude.com/docs/en/mcp, https://code.claude.com/docs/en/commands]
---

# Porting the OpenCode Hubs config to Claude Code (2026-09-27)

Record of what carried over cleanly from `~/.config/opencode` (a large OpenCode multi-agent "Hubs" setup: 31 agents, 123 skills, a 155-file hub-subcommand registry, a custom TUI plugin, and an in-process hook/cache system) into Claude Code's global config, what didn't, and the non-obvious facts that decided each call. See `~/.config/opencode/claude/` for the actual artifacts this describes.

## What ported directly (symlinks, no edits)

- **Skills** (`skills/<name>/SKILL.md`) → `~/.claude/skills/<name>`. The Agent Skills frontmatter OpenCode already used (`name`, `description`, plus extras like `level`, `license`, `user-invocable`) is a strict subset of what Claude Code accepts — **every SKILL.md frontmatter field is optional**, and unrecognized keys are silently ignored, never an error.
- **Rules** (`rules/*.md`) → `~/.claude/rules/`. This is a real, natively auto-loaded location — not a convention that needs `@import` wiring. It loads every session, before project-level rules. `paths:` is the only frontmatter key Claude Code actually reads from a rule file; everything else is ignored.

## What needed a real port, and why

- **Agents** (`agents/*.md`, 31 files) needed two changes, nothing more: inject `name:` (Claude Code **requires** it; a file missing `name` is silently skipped, "treated as documentation" — not an error, just inert) and strip `model:`/`mode:` (OpenCode model IDs like `opencode-go/deepseek-v4.1-flash` don't match Claude's `sonnet`/`opus`/`haiku`/`fable`/`inherit`/real-model-ID enum, and both harnesses already fall back to their own configured default without an explicit model — so dropping it is strictly simpler than remapping it). `disallowedTools:` needed no change at all — it's the exact same field name and shape on both sides. See `claude/build-agents.mjs`.
- **The mass-edit tools** (`tools/regex-edit.ts`, `json-edit.ts`, `yaml-edit.ts`, `conf-edit.ts`, `multi-edit.ts`) were rebuilt as a standalone MCP server (`claude/tool-wrapper/`) rather than symlinked, because they were originally registered via `@opencode-ai/plugin`'s `tool()` API, which has no equivalent for defining an arbitrary in-process tool in Claude Code's main loop. MCP is the actual equivalent mechanism. The other 14 OpenCode tools (hub routing, skill/agent listing, mode state, task todos, the multi-tier cache) were **not** ported — they either duplicate a Claude Code built-in (TodoWrite, the Skill tool, ListAgents) or only made sense atop infrastructure (the hub registry, Ralph/Autopilot/Ultrawork modes) that isn't being ported at all.
- **Two hooks** were worth porting out of ~10 in the original `plugins/hooks/hooks.ts`: the Bash safelist auto-approval (`PreToolUse`, matcher `Bash`) and the semantic-retrieval context injection (`UserPromptSubmit`), which shells out to the already-SDK-independent `skills/vectorize-context/scripts/query-hook.mjs`. Everything else in the original hook file (stall/heartbeat detection, telemetry, focus management, tool-output cache substitution) only made sense in service of infrastructure that isn't being ported, so porting it would just be recreating dead weight.

## Facts that would have produced a worse port if missed

- **`~/.claude/skills/<name>/` can be a full plugin, not just a skill**: if that directory contains its own `.claude-plugin/plugin.json`, Claude Code loads it as a `@skills-dir` plugin — agents, hooks, and MCP servers included — with no marketplace and no `--plugin-dir` flag to remember on every launch. This is what `opencode-bridge` uses; it's a strictly better drop-in mechanism than raw `~/.claude/agents/` symlinks for anything that's more than "just an agent."
- **Plugin component paths can't escape the plugin root** — including via a symlink. This is why the 31 transformed agent files are real, generated files inside `claude/plugins/opencode-bridge/agents/` rather than symlinks back into the top-level `agents/` directory. It's also why the tool-wrapper MCP server is referenced by an absolute path in `plugin.json`'s inline `mcpServers` map rather than nested inside the plugin directory — an inline command string isn't a "declared component path," so the containment rule doesn't apply to it, and it can live in its own `claude/tool-wrapper/` symlink instead.
- **A plugin's agents get namespaced** (`opencode-bridge:executor`, not bare `executor`) — an unavoidable trade-off of the plugin-bundle path over raw `~/.claude/agents/`.
- **`/import` exists but doesn't support OpenCode** — only `codex`, `gemini`, `cursor` are valid sources. No shortcut available there.
- **Claude Code reads a bare `AGENTS.md` natively** (v2.1.277+) when there's no `CLAUDE.md` above the working directory — irrelevant to this global port, but means opening `~/.config/opencode` itself as a Claude Code project needs no extra setup to pick up its `AGENTS.md`.

## Still not ported, deliberately

- **The 155-file hub-subcommand registry and the hub-routing two-tier loading model** — Claude Code's Skills already do description-based auto-discovery and progressive disclosure natively, which is what that registry existed to work around in OpenCode.
- **Model-tier failover chains** (Pro/Default/Fast × Primary/F1/F2/F3) — no equivalent concept exists (one `model:` per agent, no cross-provider failover), and OpenCode needed it partly because of Ollama API flakiness that doesn't apply here anyway.
- **The `hubs-tui` plugin** (custom terminal UI for hub menus) — nothing in the plugin component list (skills, commands, agents, hooks, MCP, LSP, output-styles, themes, workflows) provides a custom terminal UI surface. `[[claude-code-plugin-components]]` has more on what plugins actually can and can't render.
- **The multi-tier tool-output cache** — `PostToolUse` can only add `additionalContext`/`systemMessage`, it can't substitute a tool's return value the way OpenCode's `tool.execute.after` hook could. Native Anthropic prompt caching covers a meaningful chunk of what that system existed for anyway.

## Related

- `[[claude-code-plugin-components]]` — not yet written; would cover what each plugin component (skills/commands/agents/hooks/mcpServers/lspServers/outputStyles/workflows/themes/monitors) actually does at runtime, in more depth than needed for this port.
- `[[claude-code-hooks-reference]]` — not yet written; would be the full ~28-event hook reference. The repo's own `skills/hook-developer/SKILL.md` was refreshed in this same session to cover this instead of duplicating it here.
