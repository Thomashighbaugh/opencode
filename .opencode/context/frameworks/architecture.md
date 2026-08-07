# OpenCode Hubs Architecture

> Generated: 2026-07-02 by /init-project refresh --full Phase 6
> Source: @architect agent analysis

## System Structure

The hub menu router (`tools/hubMenu.ts` + `tools/hub-data.ts`) implements a two-stage routing model to minimize API requests:

- **Direct selection**: When user invokes with subcommand (`/orchestrate ralph`), `route` action loads full `HubSubcommandSpec` — detailedDescription, inlined rules, related skill metadata, examples, warnings — all in one response. No follow-up calls needed.
- **Routing required**: When user invokes bare hub with NL task, `menu` action returns slim identity slice (label, description, reminder, delegation pointer). Model picks subcommand, then `route` loads full spec.

**154 subcommands** across 6 hubs (init-project: 18, ideation: 40, orchestrate: 34, harvest-context: 22, project: 26, skills: 14). Subcommands delegate via 4 types: skill (primary), agent, command, inline.

**Per-hub state tracking**: 4 hubs maintain persistent state (init, ideation, orchestration, harvest); project is stateless. State in `.opencode/state/` (gitignored); durable context in `.opencode/context/` (committed). All context operations are MANUAL ONLY.

## Caching System (8 Namespaces)

`CacheManager` in `tools/cache-utils.ts` — dual-layer: memory LRU (hot entries) + disk persistence.

| Namespace | TTL | Persist | Purpose |
|-----------|-----|---------|---------|
| `tool` | 15m | yes | Deterministic tool outputs (Glob, Grep, hubMenu) |
| `mcp` | 7d | yes | Context7 documentation queries |
| `llm` | 1h | yes | LLM response cache |
| `agent` | 30m | yes | Subagent output cache (Layer 4) |
| `session` | 24h | no | Session-level, memory-only |
| `stable` | 24h | yes | Agent definitions, skill content, routing tables |
| `context7` | 7d | yes | Documentation queries (separate from mcp) |
| `file` | 24h | no | File read cache, memory-only, mtime-tracked |

**`withToolCache` pattern**: Wraps tool execution with SHA256-derived cache key (tool name + serialized args). Mutation invalidation on Write/Edit/bash.

**Agent output cache** (`tools/agent-cache.ts`, Layer 4): Caches subagent results by `{agent_type, task_hash, file_hashes}`. Auto-invalidates on file content changes.

## Plugin Hooks System

Main plugin: `plugins/hooks/hooks.ts`. Registered in `opencode.jsonc`.

| Hook | Purpose |
|------|---------|
| `session.created` | Orphaned mode detection + recovery; hub state summary injection; cross-session context warmup |
| `session.deleted` | Save context warmup for next session; cleanup session state files |
| `tool.execute.before` | Cache hit checks (MCP, tool, file, agent); agent-type-aware context injection via AGENT_CONTEXT_MAP |
| `tool.execute.after` | Write deterministic outputs to Layer 1 cache; mtime-tracked file read cache; write invalidation; cache MCP/agent outputs; heartbeat; stall detection |
| `experimental.chat.system.transform` | Vector search context injection — queries veclib.mjs, finds top 5 results with distance < 0.8, injects as `<Relevant_Context>` block. Cached in session namespace (5m TTL). |
| `experimental.session.compacting` | Save compaction artifacts for long sessions; report cache performance across all 8 namespaces; inject active mode state and todo state |
| `permission.ask` | Auto-approve safe bash commands (git status, npm test, etc.) |
| `chat.message` | Inject mode context only on stall detection |
| `command.execute.before` | Track mode state for ralph-loop/ultrawork; clear agent cache on mode cancel |

## New Patterns (This Session)

1. **Vector search context injection**: `transform` hook queries `.opencode/context/` semantic chunks via `veclib.mjs`, injects top 5 relevant chunks per system prompt. Session-cached (5m TTL).
2. **Cross-session warmup**: `session.deleted` serializes query→context map to `.opencode/cache/context-warmup.json`. `session.created` loads top 20 entries into session cache (10m TTL) for instant context availability.
3. **Agent-type-aware context injection**: `AGENT_CONTEXT_MAP` maps agent types to context files (architect→architecture.md, code-reviewer→conventions.md, etc.). Injected via `queueContextMessage` in `tool.execute.before` for Task tool.
4. **Cache savings reporting**: `experimental.session.compacting` now reports total hits, misses, hit rate, estimated tokens saved, and API calls avoided across all 8 cache namespaces.
5. **File-read cache with mtime tracking**: Read tool results cached in `file` namespace (5m TTL) with mtime. `tool.execute.before` checks staleness — invalidates if file changed on disk. Write/Edit/bash invalidate affected file paths.

## Model Tier System

Three tiers, each with failover chain (Primary → F1 → F2 → F3):

| Tier | Primary | F1 | F2 | F3 | Agents |
|------|---------|----|----|----|--------|
| **Pro** | `ollama/dsv4-pro:cloud` | `opencode-go/dsv4-pro` | `opencode/dsv4-flash-free` | NVIDIA NIM | architect, planner, security-reviewer, requirements-analyzer, tracer, analyst, critic |
| **Default** | `opencode/dsv4-flash-free` | `ollama/dsv4-flash:cloud` | `opencode-go/dsv4-flash` | NVIDIA NIM | hubs, executor, debugger, test-engineer, designer, frontend-design, git-master, config-orchestrator, skill-creator, refactoring, code-simplifier, qa-tester, code-reviewer, scientist, deep-thinker |
| **Fast** | `opencode/dsv4-flash-free` | `ollama/glm-5.2:cloud` | `opencode-go/glm-5.2` | — | writer, verifier, document-specialist, effort-estimator, explore, commit-drafter, prompt-simplifier, convention-extractor |

**Failover protocol**: Each subagent invocation starts at Primary. Provider/agent errors within 60s advance chain. Task errors (wrong output) do NOT advance — fix prompt. Chain exhausted → escalate via `question` tool.

**Session model**: `agents/hubs.md` frontmatter sets session model (currently `ollama/deepseek-v4-flash:0731-cloud`). Falls back to `opencode/deepseek-v4-flash-free` if unreachable.

## Architectural Evolution

1. **Single-layer → Multi-tier cache**: Evolved from simple tool cache to 8 namespaces with differentiated TTLs, memory/disk strategies, targeted invalidation.
2. **Lazy-full spec loading**: Full subcommand specs loaded on-demand, eliminating follow-up API calls for subcommand selection.
3. **Autonomous context injection**: Vector search + cross-session warmup shift from "user must request context" to "system proactively seeds relevant context".
4. **Stall detection as infrastructure**: Heartbeat system with todo progress tracking and classifiable stall (hard/soft) for resilient execution.
5. **Security + no-script enforcement**: Safe command auto-approval in `permission.ask` + `artifact-placement.md` rule against root-level scripts.
6. **Two-tier delegation in hub menu**: 154 subcommands delegate via skill/agent/command/inline in a consistent type system.