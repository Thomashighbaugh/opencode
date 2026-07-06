---
title: "opencode-dux — Agent Orchestration Plugin for OpenCode"
type: source-summary
tags: [opencode, plugin, orchestration, agents, llm, claude, gpt, gemini]
created: 2026-07-04
updated: 2026-07-04
sources: [npm-registry, github-readme]
status: active
---

# opencode-dux

Agent orchestration, management, and operations plugin for OpenCode. Routes tasks to specialized agents automatically.

- **Package**: `opencode-dux` on npm
- **Repository**: [bakhtiar-personal-work/opencode-dux](https://github.com/bakhtiar-personal-work/opencode-dux)
- **License**: MIT
- **Latest Version**: 1.4.26

## Quick Start

Add to `~/.config/opencode/opencode.json` and `~/.config/opencode/tui.json`:

```json
{ "plugin": ["opencode-dux@latest"] }
```

Create `~/.config/opencode/opencode-dux.jsonc` with preset configuration.

## Agents

| Agent | Role | When Used |
|-------|------|-----------|
| **Orchestrator** | Master delegator | Routes tasks, strategic coordination |
| **Explorer** | Codebase search | File discovery, pattern matching |
| **Oracle** | Architecture & debug | Trade-offs, root cause analysis |
| **Librarian** | External research | Documentation lookup, web search |
| **Designer** | UI/UX | Frontend, styling, accessibility |
| **Fixer** | Implementation | Scoped code changes, tests |
| **Steward** | Repository rules | Manages `.docs/`, `.opencode/`, `.cursor/rules/`, etc. |
| **Interpreter** | Image analysis | Vision-capable model for attached screenshots |

### Routing Rules

- Bug fixes go to `@oracle` first for diagnosis/root-cause analysis. `@fixer` implements the approved plan.
- Before any non-mechanical `@fixer` implementation, the orchestrator must present the proposed fix/plan to the user and get explicit approval.
- Only purely mechanical edits (typos, obvious single-line fixes, user-specified exact changes) may bypass `@oracle` and go straight to `@fixer`.

## Configuration

Config file: `~/.config/opencode/opencode-dux.jsonc`. Merged from two locations (project overrides user):

| Location | Path |
|----------|------|
| **User** | `~/.config/opencode/opencode-dux.jsonc` |
| **Project** | `<project>/.opencode/opencode-dux.jsonc` |

### Key Config Options

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `preset` | `string` | — | Active preset name |
| `customInstruction` | `string` | — | Text prepended verbatim to orchestrator system prompt |
| `presets` | `object` | `{}` | Named model configurations per agent |
| `agents` | `object` | `{}` | Per-agent overrides on top of active preset |
| `sessionManager.maxSessionsPerAgent` | `number` | `2` | Max concurrent sessions per agent type (1-10) |
| `todoContinuation.maxContinuations` | `number` | `5` | Max consecutive auto-continuations (1-50) |
| `contextPressure.enabled` | `boolean` | `true` | Warn when context usage is high |
| `handoffArtifacts.location` | `"project"` or `"cache"` | `"project"` | Where to store delegation artifacts |
| `websearch.provider` | `string` | `"exa"` | `"exa"` or `"tavily"` |
| `autoUpdate` | `boolean` | `true` | Auto-update when loaded via npm name |
| `disabledMcps` | `string[]` | `[]` | Disable built-in MCPs by name |

### Per-Agent Options

| Field | Type | Description |
|-------|------|-------------|
| `model` | `string` | Model identifier |
| `thinking` | `boolean` | Enable/disable thinking variants |
| `variants` | `string[]` | Ordered allowed thinking variants |
| `temperature` | `number` (0-2) | Model temperature |
| `options` | `object` | Provider-specific model options |

`oracle` is special — it has a `smart` tier for higher-capability routing on top of the default tier.

## Automatic Skill & MCP Discovery

Before delegating to subagents on non-trivial tasks, the orchestrator calls `discover_skills` and `discover_mcp_servers` in parallel (results cached 24h):

1. Checks locally installed skills (`~/.config/opencode/skills/`, `~/.agents/skills/`) and MCPs
2. If enough relevant local results, returns them and skips online search
3. Otherwise searches online: `npx skills find <keywords>` for skills, npm registry for MCPs
4. Installed items are injected into delegation prompts with name, description, relevance, and usage instructions
5. Useful uninstalled items are recommended with install commands

## Handoff Artifacts

Delegated subagent runs persist handoff artifacts:

- **Project mode** (default): `.opencode-dux/<agent>/<sessionId>_<timestamp>_<slug>.md`
- **Cache mode**: `~/.cache/opencode-dux/artifacts/`
- Artifacts retained for 7 days, then pruned

## Subscriptions / Account Commands

Manage API accounts via `/subscriptions` slash commands:

| Command | Description |
|---------|-------------|
| `/subscriptions list` | View all accounts and usage |
| `/subscriptions add-opencode-go <name> <workspace-id> <auth-cookie> <api-key>` | Add OpenCode Go account |
| `/subscriptions add-neuralwatt <name> <api-key>` | Add Neuralwatt account |
| `/subscriptions add-deepseek <name> <api-key>` | Add DeepSeek account |
| `/subscriptions add-mimo <name> <api-key> <cookie-values...>` | Add MiMo (Xiaomi) account |
| `/subscriptions add-codex-device <name>` | Add Codex (OpenAI) account via device auth |
| `/subscriptions switch <provider> <name>` | Activate an account for a provider |
| `/subscriptions remove <provider> <name>` | Delete an account |
| `/subscriptions refresh` | Force refresh usage data |

Supported providers: OpenCode Go, Neuralwatt, DeepSeek, MiMo (Xiaomi), Codex (OpenAI). All credentials stored locally — no external service.

## Prompt Overrides

Place Markdown files in `~/.config/opencode/opencode-dux/`:

- `<agent>.md` — Replace default prompt
- `<agent>_append.md` — Append to default prompt
- `<preset>/<agent>.md` — Preset-scoped prompts

## Built-in MCPs

| MCP | Description |
|-----|-------------|
| `websearch` | Web search (Exa or Tavily) |
| `context7` | Library documentation lookup |
| `grep_app` | GitHub code search |

Disable any with `disabledMcps` config.

## Key Concepts

- **Orchestrator-first**: All tasks route through the orchestrator agent, which delegates to specialists
- **Approval gates**: Non-mechanical `@fixer` runs require explicit user approval before implementation
- **Skill/MCP discovery**: Automatic discovery before delegation, with local-first caching
- **Multi-provider subscriptions**: Manage API accounts across 5 providers from within OpenCode
- **Handoff artifacts**: Persisted delegation outputs for traceability and reuse
