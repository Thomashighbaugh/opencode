<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-05-01 | Updated: 2026-05-01 -->

# tools

## Purpose
TypeScript tool definitions (29 tools) that extend the OpenCode runtime. Tools provide structured APIs for session management, state persistence, agent listing, skill loading, hub menu routing, multi-tier prompt caching, and file editing.

## OpenCode 2 contract

OpenCode 2 removed file-based tool discovery: a file under `tools/` is inert until a plugin registers it. These files are V2 **tool definitions**, not standalone tools.

- `types.ts` — the V2 contract (`ToolDefinition`, `ToolContext`, `ToolResult`). Imported as a type only; never import `@opencode/plugin` at runtime (it pulls `@opencode/schema` against the host binary's embedded effect and breaks plugin loading).
- Each file declares `const input = z.object({...})` (zod/v4) and exports `{ name, description, input, async execute(args, context) → { content } }` with `satisfies ToolDefinition<z.infer<typeof input>>`.
- `plugins/tools/index.ts` is the plugin that registers all 29 through `await ctx.tool.transform(editor => editor.add(...))`, converting each zod schema with `z.toJSONSchema(schema, { io: "input", unrepresentable: "any" })`.
- The V2 tool context carries no path, so the registering plugin injects the project root from `ctx.location.directory` as `context.directory`.

## Key Files

| File | Description |
|------|-------------|
| `types.ts` | V2 tool contract — `ToolDefinition`, `ToolContext`, `ToolResult`, `JsonSchema`. Shared library, not a tool. |
| *(hub routing moved)* | Hub router, specs, rules, skills and agents now live in `plugins/hubs/` (see `plugins/hubs/AGENTS.md`). |
| `loadSkill.ts` | Load a skill's content, metadata, scripts, and references for agent use |
| `listAgents.ts` | List available agents or get details about a specific agent |
| `agentContext.ts` | Get or update agent context including project memory, notepad, active modes |
| `modeState.ts` | Manage execution modes — start, stop, update, check status (ralph, autopilot, ultrawork, etc.) |
| `runSkillScript.ts` | List or execute skill scripts (`.sh` via bash, `.ts` via bun) bundled with skills |
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
| `document-convert.ts` | Convert PDF, EPUB, DOC, DOCX, ODT, RTF, HTML, or text to markdown/JSON — local unpdf + mammoth + Turndown, no model calls. |
| `codeSearch.ts` | Semantic code search — the grep+read replacement. Hybrid dense (bge-small) + BM25 with RRF, Semble-style symbol/definition boosts, and a bge-reranker cross-encoder. Index persisted under `.opencode/state/vector/codesearch/`, mtime-invalidated. |

## For AI Agents

### Working In This Directory
- A tool file is a plain object, not a `tool({...})` call — OpenCode 2 ignored the V1 shape after removing the directory scan
- Every tool declares its input as a zod/v4 schema named `input` and returns `{ content }`
- Registration lives in `plugins/tools/index.ts` — add a new tool there too, or it never reaches the model
- Tools are validated by the Hubs doctor diagnostic and by `tests/global/feature-package.test.ts`

### Testing Requirements
- Run `/hubs-doctor` to verify tool integration
- `bun test plugins/hubs` and `npx vitest run` both exercise the tool contract

### Common Patterns
- Input schema: zod/v4, converted to JSON Schema at registration
- Handler returns `{ content: string }`; JSON payloads are `JSON.stringify`d into it
- Tools interact with filesystem state in `.opencode/state/`

## Dependencies

### Internal
- `.opencode/state/` — Persistent state read/written by tools
- `rules/hub-state.md` — State path conventions
- `rules/hub-routing.md` — Hub routing conventions

### External
- `zod/v4` — Input-schema validation
- Node.js 18+ — Runtime environment
- TypeScript 5.x — Compilation

<!-- MANUAL: -->
