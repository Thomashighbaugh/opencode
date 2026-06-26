<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-05-01 | Updated: 2026-05-01 -->

# tools

## Purpose
TypeScript tool implementations (19 tools) that extend the OpenCode runtime. Tools provide structured APIs for session management, state persistence, agent listing, skill loading, hub menu routing, multi-tier prompt caching, and file editing.

## Key Files

| File | Description |
|------|-------------|
| `hubMenu.ts` | Hub menu router — parses subcommands, checks state, provides routing for all 5 hub commands |
| `loadSkill.ts` | Load a skill's content, metadata, scripts, and references for agent use |
| `listAgents.ts` | List available agents or get details about a specific agent |
| `agentContext.ts` | Get or update agent context including project memory, notepad, active modes |
| `modeState.ts` | Manage execution modes — start, stop, update, check status (ralph, autopilot, ultrawork, etc.) |
| `runSkillScript.ts` | List or execute shell scripts bundled with skills |
| `taskTodos.ts` | Manage task todos — create list, add items, update status |
| `artifacts.ts` | Manage skill artifacts — save, load, list, delete |
| `getSessionID.ts` | Get current session ID |
| `saveCommitMessage.ts` | Upsert commit message to session temp directory |
| `getCommitMessage.ts` | Get the upserted commit message from session temp directory |
| `cache-utils.ts` | Shared multi-tier cache infrastructure — SHA256 keying, TTL, disk+memory LRU, 5 namespaces |
| `cache.ts` | Cache management tool — view stats, clear caches, invalidate entries across all tiers |
| `agent-cache.ts` | Tier 4 agent output cache — save/load/invalidate subagent outputs by agent type + task hash |
| `regex-edit.ts` | Edit text files using regex patterns and line operations — replace, insert, delete lines. No scripts needed. |
| `json-edit.ts` | Edit JSON/JSONC by JSON Path — get, set, delete, merge, array ops. No jq pipelines. |
| `yaml-edit.ts` | Edit YAML by dot-path — get, set, delete, merge, array ops. No yq or sed-on-YAML. |
| `conf-edit.ts` | Edit config files (.env, INI, key=value) — get, set, delete, comment/uncomment. No sed. |
| `multi-edit.ts` | Batch operations across files by glob — find, replace. No find+xargs+sed. |

## For AI Agents

### Working In This Directory
- All tools are TypeScript files using the `@opencode-ai/plugin` SDK
- Each tool exports a schema and handler function
- Tools are registered in `opencode.jsonc` for runtime discovery
- Tools are validated by the Hubs doctor diagnostic

### Testing Requirements
- Run `/hubs-doctor` to verify tool integration

### Common Patterns
- Each tool defines a JSON Schema for parameters
- Handler functions return structured results
- Tools interact with filesystem state in `.opencode/state/`

## Dependencies

### Internal
- `.opencode/state/` — Persistent state read/written by tools
- `rules/hub-state.md` — State path conventions
- `rules/hub-routing.md` — Hub routing conventions

### External
- `@opencode-ai/plugin` — Tool development SDK
- Node.js 18+ — Runtime environment
- TypeScript 5.x — Compilation

<!-- MANUAL: -->
