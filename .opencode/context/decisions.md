# ADR: Hub Subcommand Selection — Toast + AppendPrompt Pattern

**Status:** Accepted  
**Date:** 2026-05-01

## Context
Hub subcommand clicks from the TUI dialog were submitting directly to `session.command()` or `session.prompt()`, causing a 3+ minute LLM inference wait before any feedback to the user.

## Decision
Subcommand clicks will:
1. Show a toast notification instantly (pure TUI rendering, zero latency)
2. Use `appendPrompt()` to pre-fill the prompt bar with the command text
3. NOT call `session.command()`, `session.prompt()`, or any LLM-involved API

The user then presses Enter when ready, which triggers the normal LLM pipeline.

## Rationale
- Instant feedback for the click action
- User controls when the 90-second LLM wait starts
- No way to bypass LLM inference in the current SDK — this is the best achievable UX

## Limitations
- `appendPrompt()` may not work visually in all OpenCode versions
- The 90+ second LLM wait is still unavoidable when the user presses Enter
- A proper fix requires an SDK-level API for tool/command execution without AI

## Alternatives Considered
- **session.command()**: Still calls LLM, 3+ minute wait
- **session.prompt()**: Still calls LLM, 3+ minute wait
- **Pre-warming sessions**: Doesn't help with cloud API cold-start
- **Plugin hook short-circuit**: `command.execute.before` cannot skip execution

---

# ADR: Lazy Freshness Vector Indexing

**Status:** Accepted  
**Date:** 2026-05-04

## Context
The vectorize-context skill required manual invocation (`node vectorize.mjs`) to index `.opencode/context/` files into sqlite-vec. Users had to remember to trigger it, and the DB could get stale between runs.

## Decision
Vector indexing uses **lazy freshness** — `ensureIndexed()` is called automatically on every `queryChunks()` call. It stats all files, re-indexes only stale ones, and returns instantly if nothing changed. The ML model (~200MB) only loads when there's actual indexing work.

## Rationale
- Users never need to remember to index
- Fast path (no changes) costs only filesystem stats (~8-20ms)
- Write operations (hub context saves, direct edits, file deletions) all get picked up automatically on next query
- The common case (no change) is nearly free

## Implementation
- `skills/vectorize-context/scripts/veclib.mjs` — shared library exporting `ensureIndexed()`, `queryChunks()`, `getIndexStats()`
- CLI scripts became thin wrappers
- File paths stored as relative paths in DB for cross-project portability
- Deleted files have their chunks cleaned up automatically

---

# ADR: Intent Router for Hub Subcommands

**Status:** Accepted  
**Date:** 2026-05-04

## Context
When a user types `/orchestrate fix this bug` without specifying a subcommand, there was no mechanism to route them to `deep` or `remediate`. Same for `/ideation` and `/harvest-context`.

## Decision
Create intent-detecting router scripts that classify user requests across multi-dimensional profiles and score against subcommand profiles. Each profile covers 5-8 dimensions with normalized 0-1 scores.

## Rationale
- Subcommand profiles as data make adding new subcommands trivial
- Multi-dimensional scoring handles ambiguous inputs naturally
- Anti-keywords prevent false positives
- stderr/stdout separation (diagnostics vs machine output) lets CLI and agents use the same scripts

## Affected
- `skills/orchestrate-router/scripts/route-orchestrate.mjs` — 27 subcommands
- `skills/orchestrate-router/scripts/route-ideation.mjs` — 21 subcommands
- `skills/orchestrate-router/scripts/route-harvest.mjs` — 13 subcommands + auto-vectorize

---

# ADR: Plugin Creator Skill from Real Codebase Analysis

**Status:** Accepted  
**Date:** 2026-05-04

## Context
OpenCode has a plugin system with 10 hook types, 2 independent context injection mechanisms, and stateful patterns — but no consolidated skill existed to guide users through plugin creation.

## Decision
Create `opencode-plugin-creator` skill with:
- Hook API reference extracted from `plugins/hubs-plugin.ts` (the production plugin)
- Templates for minimal hook, stateful, and TUI plugins
- Documentation of the two distinct context injection mechanisms

## Key Finding
OpenCode has **two independent context injection mechanisms**:
1. `experimental.chat.system.transform` — injected into system prompt every turn via `output.system[]`. Requires `queueContextMessage()`/`consumeContextMessages()` async pattern.
2. `experimental.session.compacting` — survives context window compression via `output.context[]` (plain markdown). Both mechanisms can be used in the same plugin and serve different purposes.

---

# ADR: Configure Skill as Coordinator Over Creator Skills

**Status:** Accepted  
**Date:** 2026-05-04

## Context
Existing skills cover specific creation tasks (agent-creator, skill-creator, command-creator, plugin-creator) but there was no holistic config management skill for validation, inspection, cross-surface integration, and project `.opencode/` setup.

## Decision
Create `opencode-configure` as a **coordinator skill** that covers all 8 config surfaces. It delegates to existing creator skills for focused tasks and provides:
- 20-item validation checklist covering JSONC, paths, frontmatter, plugins, MCP, gitignore
- Config inspection and repair workflows
- Project `.opencode/` directory structure setup
- Cross-surface integration verification

## Rationale
Single-creation skills (agent, skill, command, plugin) are well-covered by existing creators. What was missing was the holistic view — someone who says "fix my config" or "set up a project .opencode/" needs to touch multiple surfaces at once.

---

# ADR: Add NVIDIA Nemotron 3 Ultra as Available Cloud Model

**Status:** Accepted  
**Date:** 2026-06-08

## Context
The existing model lineup lacked a model specialized for agent orchestration and long-running agent workflows. Available models were either general-purpose, fast-reasoning, or extended-context, but none specifically targeted multi-step agentic loops with tool calling at scale.

## Decision
Add `nemotron-3-ultra:cloud` (NVIDIA Nemotron 3 Ultra) as an available Ollama cloud model with:
- 256K context window / 131K output limit
- Best For: agent orchestration, long-running agents, deep research
- 550B parameters (55B active per token) — efficient for its class

## Rationale
- Built for long-running agents — tuned for orchestration, coding agents, and complex enterprise workflows
- 1M token native context (cloud version limited to 256K)
- Optimized for tool calling across hundreds of steps — directly relevant to Hubs orchestration patterns
- The existing model mix (pro/flash/glm/kimi/minimax/qwen) had no specific "agent orchestration" specialist

## Consequences
- Users can now select a model optimized for `/orchestrate` workloads
- 256K context is smaller than the pro/flash 1M models, but output of 131K matches flash
- Model is listed prominently as the third entry (after flash) in the AGENTS.md table
