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

---

# ADR: Conscientious Craftsman Agent Pattern (Design Analysis)

**Status:** Proposed — Design Analysis Complete  
**Date:** 2026-06-09

## Context
Current agent orchestration patterns treat agents as "ant-agents" — single-purpose workers that execute a task, then pass their raw output to a separate reviewer agent. This creates high overhead: 2+ handoffs per quality cycle, context serialization between agents, and a reviewer bottleneck when many agents produce output simultaneously.

The biological analogy is instructive: ants do not self-preserve or self-critique; they follow their assignment unquestioningly. Humans in skilled roles internalize quality standards and self-correct before presenting work.

## Analysis
A design analysis was conducted (via `deep-thinker` agent) evaluating whether a "craftsman agent" pattern — where each agent carries an internal self-critique loop — is theoretically sound and feasible.

### Key Findings

1. **The pattern is sound as a component**, not a standalone replacement. Self-critique improves quality per agent, but external verification is still required for convergence guarantees.

2. **"Incentivization" is achievable through structured prompt sequencing**, not true internal motivation. Five levers exist: role-identity framing, accountability hooks, structured generation protocols, contrastive examples, and orchestrator-level meta-incentives.

3. **Composition is key** — the craftsman pattern nests inside existing patterns:
   - `ralph + craftsman`: outer loop guarantees convergence, inner loop polishes each submission
   - `ultrawork + craftsman`: each parallel lane self-polishes independently
   - `team + craftsman`: reviewer focuses on composition, not individual quality

4. **Risks are manageable**: over-engineering (cap iterations), under-critique (require written critique), same-model blind spots (externally-authored checklists), false quality (never skip external verification for critical tasks).

## Recommended Name
`craftsman` — one word, self-evident in software engineering, pairs naturally with existing patterns.

## Next Steps
If adopted: implement as an orchestration pattern option that injects a self-critique quality charter into each agent's context, with configurable max_inner_iterations and an externally-authored checklist.

---

# ADR: Add "decomposition" as Third /ideation Subcommand

**Status:** Accepted  
**Date:** 2026-06-10

## Context
The /ideation hub had no dedicated method for breaking a complex task into smaller, actionable subtasks. Users had to use "top-down" or "plan" to approximate this, but neither is optimized for pure work breakdown with dependencies and acceptance criteria.

## Decision
Add "decomposition" as the 3rd menu option in /ideation (after brainstorm, before refine), implemented as an inline subcommand.

## Rationale
- Decomposition is a distinct cognitive operation from planning (which is interview-driven) and refining (which is diverge/converge)
- Inline execution is appropriate — no separate skill file needed since the workflow is straightforward: accept task → break down → output ordered subtasks with dependencies and criteria
- Positioning as 3rd option puts it early in the menu where users expect fundamental task-analysis tools

## Consequences
- hubMenu.ts: entry added at index 51 with `inline: true`
- ideation/SKILL.md: method documented under new section between brainstorm and refine
- route-ideation.mjs: profile added for intent-based routing with decomposition-specific keywords
- Users who type /ideation decompose or "break down this task" will now route correctly
