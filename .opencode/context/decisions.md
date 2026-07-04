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

# ADR: Remove Invalid Top-Level Config Keys from opencode.jsonc

**Status:** Accepted
**Date:** 2026-06-12

## Context
The `opencode.jsonc` templates and provision script were injecting invalid top-level keys (`agents: { paths: [...] }`, `commands: { paths: [...] }`, `agentPaths: [...]`) that are not part of the OpenCode config schema. These caused OpenCode's config loader to reject the file, preventing OpenCode from running in projects initialized with `/init-project`.

## Decision
Remove all invalid top-level keys from templates and generation code. Agents, commands, tools, and rules are **auto-discovered** from their respective `.opencode/` subdirectories — no config registration needed. The only valid key for pointing to additional directories is `skills: { paths: [...] }`.

## Rationale
- The official schema at `https://opencode.ai/config.json` has `additionalProperties: false` on the Config object — any unrecognized key causes rejection
- OpenCode auto-discovers agents from `agents/`, commands from `commands/`, tools from `tools/`, rules from `rules/` — no config needed
- The `skills` key is the exception because skill directories can be at arbitrary paths

## Consequences
- Fixed in: `03-configuration.md` template, `opencode.jsonc.template`, `provision.mjs` Phase 6, `provision/SKILL.md`, and 3 `.documentation/` files
- Created `config-sync` skill to prevent future drift — fetches schema from `opencode.ai/config.json` and validates

---

# ADR: Agent Format Normalization — All Agents Must Use `<Agent_Prompt>` Wrapper

**Status:** Accepted
**Date:** 2026-06-12

## Context
10 of 29 agent definition files used plain markdown without the `<Agent_Prompt>` XML wrapper convention. This created an inconsistency where some agents had structured prompt sections (`<Role>`, `<Constraints>`, `<Success_Criteria>`) and others had free-form text. The non-compliant agents were: code-reviewer, code-simplifier, commit-drafter, config-orchestrator, deep-thinker, effort-estimator, prompt-simplifier, refactoring, requirements-analyzer, skill-creator.

## Decision
All 29 agents must use the `<Agent_Prompt>` wrapper with `<Role>` sub-tag. Created `agent-format-enforcer` skill with `check-agent-format.mjs` script that validates compliance and can auto-fix.

## Rationale
- Consistent structure ensures all agents load correctly into OpenCode's agent system
- The `<Agent_Prompt>` wrapper is the documented convention — non-compliance was an oversight
- Automated enforcement prevents future drift

## Consequences
- 10 agents wrapped in `<Agent_Prompt>` tags
- `agent-format-enforcer` skill created with validation script
- `package.json` scripts added: `check-agents`, `fix-agents`

---

# ADR: Eliminate `.opencode/` Config Redundancy in Global Config Directory

**Status:** Accepted
**Date:** 2026-06-12

## Context
The `~/.config/opencode/` directory IS the global OpenCode config directory. Having a `.opencode/` subdirectory inside it with duplicate config files (`opencode.json`, `package.json`, `tui.json`, `node_modules/`) was conceptually wrong — `.opencode/` is a project-scoped pattern, not something that should nest inside the global config.

## Decision
Remove all redundant config files from `.opencode/`:
- `opencode.json` — redundant with root `opencode.jsonc`
- `package.json` + `package-lock.json` — redundant with root `package.json`
- `tui.json` — redundant with root `tui.json`
- `node_modules/` — redundant with root `node_modules/`

Keep only: `context/`, `state/`, `CHANGELOG.md`, `AGENTS.md`, `.vector/`, `.gitignore`

## Rationale
- Eliminates duplicate version pinning (root had `@opencode-ai/plugin@1.14.30`, `.opencode/` had `1.14.25`)
- Removes conceptual confusion about where config lives
- Saves 58MB of duplicated `node_modules/`

## Consequences
- `.opencode/` now serves as a pure durable knowledge store (context + changelog + state)
- `.opencode/.gitignore` updated to only ignore `state/` and `.vector/`
- `init-project` scaffold now adds `.opencode/node_modules/` to project `.gitignore`

---

# ADR: Hubs Must Parallel-Dispatch Multi-Item Raw Text Instructions

**Status:** Accepted
**Date:** 2026-06-12

## Context
When given raw text with multiple work items (numbered lists, "and" clauses, compound requests), the Hubs agent was serial-executing them itself instead of decomposing and dispatching to parallel subagents. This violated the core "orchestrate, don't execute" principle and made multi-item tasks take much longer than necessary.

## Decision
Added a `<Critical_Behavior>` section to the Hubs agent prompt that mandates:
- Raw text with 3+ implicit work items → ALWAYS decompose and parallelize
- Numbered lists, "and" clauses, compound requests → extract N discrete work items
- Dispatch each item to its own subagent via concurrent `task()` calls
- No serial self-execution for multi-item tasks

## Rationale
- The orchestrator's job is to dispatch, monitor, and integrate — not to implement
- Parallel dispatch reduces wall-clock time for N items from O(N) to O(max(N))
- The existing `ultrawork` and `team` patterns already support this — the gap was in the Hubs prompt itself

## Consequences
- `agents/hubs.md` updated with `<Critical_Behavior>` section
- Multi-Item Batch pattern added to `<Orchestration_Patterns>`
- Workflow step 2 hardened: "if 3+ implicit work items, ALWAYS decompose and parallelize"

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

---

# ADR: Privacy Scan for Context Files — Dynamic Secret Detection Before Commit

**Status:** Accepted
**Date:** 2026-06-14

## Context
Context files saved to `.opencode/context/` are committed to git and accumulate across sessions. There was no mechanism to prevent secrets, API keys, PII, or privacy-compromising content from being committed as durable context. The existing `.gitignore` only covered `.opencode/state/` — not session transcripts, chat history, or dynamically-identified sensitive files.

## Decision
Implement a two-pronged approach:

1. **Preventive `.gitignore` entries**: Add `.opencode/state/sessions/`, `.opencode/chat-history/`, and `.opencode/chat/` to `.gitignore` in both the global config and project `.opencode/` directories.

2. **Dynamic privacy scan**: Create a `privacy-scan` skill with a `scan-privacy.mjs` script that:
   - Scans content for API keys, tokens, passwords, private keys, connection strings, PII, and session/chat indicators
   - Classifies risk as HIGH/MEDIUM/LOW/UNCERTAIN
   - Distinguishes **derived knowledge** (ADRs, patterns, decisions — safe to commit) from **raw data** (session transcripts, logs, config dumps — may contain secrets)
   - Routes HIGH risk → `.gitignore` + `.opencode/state/`, MEDIUM/UNCERTAIN → `.opencode/state/` for review, LOW → `.opencode/context/` as normal

## Rationale
- Static `.gitignore` entries alone are insufficient — new types of sensitive content can appear dynamically
- The derived-vs-raw distinction prevents false positives on legitimate context files (ADRs, patterns, lessons)
- The scan is integrated into both `init-project` (setup/refresh) and `harvest-context` (before saving) for comprehensive coverage

## Consequences
- `init-project` Phase 3 now adds 4 gitignore entries + runs privacy scan during setup/refresh
- `init-project` Phase 8 verifies gitignore entries exist
- `harvest-context` runs privacy scan before saving any file to `.opencode/context/`
- `harvest-context sweep` scans existing context files for privacy issues
- `rules/context-strategy.md` updated with privacy scan documentation
- New skill: `skills/privacy-scan/` with SKILL.md and scan-privacy.mjs script

---

# ADR: Remove JOC (Joint Operations Center) Branding — Eliminate Legacy References

**Status:** Accepted
**Date:** 2026-06-14

## Context
The project was originally branded "JOC" (Joint Operations Center) — a military metaphor. Over time, the project was renamed to "OpenCode Hubs" with a hub-and-spoke metaphor. However, 35+ references to the old branding remained scattered across the codebase in comments, documentation, config files, templates, scripts, and lockfiles, creating confusion and an inconsistent identity.

## Decision
Remove all JOC branding references from the codebase and replace with "OpenCode" or "OpenCode Hubs" as appropriate:

| Location | Change |
|----------|--------|
| `opencode.jsonc` | Remove `.joc/**` legacy permission entry |
| `init-project` template | `joc-plugin.ts` → `hubs-plugin.ts` |
| `veclib.mjs` | "JOC context" → "OpenCode context" |
| `state/.gitignore` | "JOC State" → "State" |
| `installation.md` | 5 URL changes + subtitle fix |
| `README.md` | Title + origin story update |
| `hubs-teams/SKILL.md` | `joc team` → `opencode team` (14 occurrences) |
| `hubs-reference/SKILL.md` | `joc` → `opencode` (2 occurrences) |
| `hub-doctor/SKILL.md` | "Joint Operations Center" → "Hub-driven" |
| `route-harvest.mjs` | "JOC install layout" → "install layout" |
| PSM files | repo/alias reference fixes |
| `hubs-tui/bun.lock` | package name fix |

## Rationale
- Consistent branding across all documentation, code, and configuration
- Eliminates confusion for new users encountering the old name
- Removes dead code path (`.joc/**` permission no longer referenced anywhere)
- The hub-and-spoke metaphor better reflects the architecture

## Consequences
- All legacy `joc` references removed from tracked files
- Some `joc` references may remain in git history — they're inert
- The `opencode team` CLI command is the correct invocation going forward

---

# ADR: Self-Deploying Per-Repository Agentic Configuration Architecture

**Status:** Proposed
**Date:** 2026-06-14

## Context
The global configuration (`~/.config/opencode/`) serves as a runtime engine with 29 agents, 67 skills, 10 tools, and 11 rules. However, every project has unique domain language, architecture patterns, coding conventions, testing practices, and external dependencies. Users currently must manually decompose their project architecture and wrestle with domain jargon before they can productively use AI assistance. There is no mechanism for `/init-project setup --full` to:

- Auto-analyze a project's domain language, architecture, and conventions
- Research detected dependencies via Context7 MCP and synthesize structured knowledge
- Generate project-specific agents, rules, commands, tools, and skills
- Vectorize synthesized context for semantic retrieval

## Decision
Adopt a **self-deploying agentic configuration** architecture where `/init-project setup --full` becomes a zero-to-context pipeline:

### Global Engine vs Per-Repo Brain

- **Global** (`~/.config/opencode/`): The compiler — generic agents, skills, commands, tools, rules. Never bloated with project-specific artifacts.
- **Per-Repo** (`./.opencode/`): The compiled binary — project-specific agents, rules, commands, tools, skills, context, and vector index. Deployed fresh for each project.

### Pipeline (9 Phases)

1. **Phase 0: Verify Global Engine** — Check `~/.config/opencode/` is healthy
2. **Phase 1: Deep Codebase Scan** — 6-pass scanner: file enumeration, language detection, framework detection, architecture detection, domain extraction, pattern extraction
3. **Phase 2: Architecture Analysis** — Delegate to `@architect` for dependency mapping, boundary detection, and pattern classification
4. **Phase 3: Context Research** — Fetch docs for every detected dependency via Context7 MCP
5. **Phase 4: Context Synthesis** — Combine analysis + research into frameworks/, patterns/, decisions.md, theory.md
6. **Phase 5: Agent Generation** — Generate project-aware agent wrappers in `.opencode/agents/`
7. **Phase 6: Rule Generation** — Generate project-specific rules in `.opencode/rules/`
8. **Phase 7: Tool + Command Generation** — Generate project-specific tools and commands
9. **Phase 8: Skill Generation** — Generate project-specific reusable skills
10. **Phase 9: Verification** — Validate all artifacts, compile tools, index vector DB

## Rationale
- Eliminates global config bloat — each project gets exactly what it needs
- Zero manual decomposition — project mechanics are analyzed automatically
- Agents understand domain language from codebase analysis, not manual glossaries
- Vector-accelerated retrieval makes agents dramatically more effective for niche projects
- Language- and framework-agnostic — works for any project type
- Incrementally deployable — each phase adds capability without breaking existing workflows

## Consequences
- New sub-skills needed: `context-research`, `context-synthesize`, `deep-scanner`
- Enhanced `provision.mjs` for project-specific artifact generation
- `init-project` Phase 1-5 enhancements in 03-configuration.md, phases/*.md
- Framework document created: `context/frameworks/per-repo-deployment-architecture.md`
- Migration path: 5 phases over multiple iterations, each deployed incrementally

## See Also
- `.opencode/context/frameworks/per-repo-deployment-architecture.md` — Full architecture document

---

# ADR: Smart Stall Detection — Heartbeat-Based Progress Monitoring Without Spam

**Status:** Accepted
**Date:** 2026-06-14

## Context
The previous "continue" plugin pattern sent context-on-nudges on every tool call and every chat message without discriminating between active work, slow operations, or genuine stalls. This created three problems:

1. **Subagent spam**: Context messages were queued into every LLM turn, consuming tokens and forcing agents to process irrelevant nudges while they were actively working
2. **No stall detection**: The system could not distinguish between "agent is working" (tool calls happening) and "agent is stuck" (no tool calls for minutes)
3. **Network reset blind**: If a session disconnected and reconnected, orphaned mode states persisted with no recovery mechanism

## Decision
Implement a heartbeat-based stall detection system with 5-tier classification:

### Heartbeat Recording
Every `tool.execute.after` call records a heartbeat entry to `.opencode/state/sessions/{session-id}/heartbeat.json` containing:
- `lastToolCall` timestamp
- `lastToolName`
- Recent tool history (last 5 tools)
- Todo progress snapshot

### Stall Classification Algorithm
| Tier | Window | Criteria | Action |
|------|--------|----------|--------|
| `ACTIVE` | < 15s since last tool call | Tools are firing | Nothing |
| `SLOW_POSSIBLE` | 15-60s | No tool calls but could be a long build | Wait, extend threshold |
| `STALLED_SOFT` | 60-120s + no todo progress | No tool calls, no progress | Single gentle nudge (max 1) |
| `STALLED_HARD` | > 120s | No activity whatsoever | Stronger nudge + state summary |
| `SESSION_RESET` | Session restarts with orphaned mode | Pre-existing active state but no heartbeat | Recovery context block, don't auto-restart |

### Anti-Spam Safeguards
- Nudge cooldown: minimum 90s between nudges
- Max 1 soft nudge per stall period
- Max 3 hard nudges per session, then offer cancel
- Silent during known long ops (build, test, deploy, install)
- Never inject empty context messages

### Session Recovery
On `session.created`, scan for orphaned mode states (active true, no recent heartbeat). Inject a single `<session-recovery>` block with state summary. Do NOT auto-restart modes.

## Rationale
- Heartbeat-based detection is cheap (write a small JSON file per tool call) and reliable
- The 5-tier classification prevents nudging agents that are simply running long operations
- Session recovery without auto-restart prevents infinite loops on reconnection
- Anti-spam safeguards ensure the system gets quieter as it detects less progress, not louder

## Consequences
- `hubs-plugin.ts` updated with heartbeat recording, stall classification, and recovery logic
- Framework document created: `context/frameworks/stall-detection-and-recovery.md`
- ADR entry documenting the design and rationale
- Redundant "continue" plugin can be removed once this is deployed

## See Also
- `.opencode/context/frameworks/stall-detection-and-recovery.md` — Full architecture document

---

# ADR: Per-Repo Customization Engine — 11 Approaches for Zero-Touch Codebase Deployment

**Status:** Proposed
**Date:** 2026-06-14

## Context
The per-repo deployment architecture (ADR June 14) defines the high-level pipeline but lacks the specific mechanisms, reliability guarantees, and multifaceted approaches needed to make `/init-project setup --full` robust enough for diverse, niche, and highly specific projects. Users cannot be expected to decompose their project mechanics, translate jargon, or manually verify generated artifacts.

## Decision
Adopt an 11-approach architecture for the per-repo customization engine, each approach addressing a specific gap:

| # | Approach | Addresses |
|---|----------|-----------|
| A1 | Multi-Pass Codebase Scanner (6 passes) | Shallow detection → deep project profile |
| A2 | Dependency Graph + Version-Specific Research | Generic docs → exact-version context |
| A3 | Heuristic Convention Detector | Template rules → codebase-accurate rules |
| A4 | Domain Language Extraction (NLP-Lite) | Generic agents → domain-speaking agents |
| A5 | Architecture Pattern Classification | Flat prompts → architecture-aware prompts |
| A6 | Bootstrap Agent Generator | Manual agent creation → zero-shot agents |
| A7 | Checkpointed Multi-Stage Pipeline | Full re-runs → resume from any phase |
| A8 | Cross-Phase Consistency Verification | Blind generation → verified artifacts |
| A9 | Lazy Vector Index with Auto-Merge | Single-file retrieval → cross-file synthesis |
| A10 | Provision Dry-Run + Diff Review | Trust-the-process → preview-then-approve |
| A11 | Post-Production Feedback Loop | One-time generation → self-healing context |

## Rationale
- Each approach is independently shippable — incremental deployment without breaking existing workflows
- Combined, they address every failure mode: partial completion, broken references, stale context, wrong assumptions, missing docs, domain ignorance
- Priority tiers (P0-P4) let implementation start with the highest-value foundations (scanner + checkpoints + architecture detection) and iterate toward polish (dry-run + feedback loop)

## Consequences
- Framework document: `.opencode/context/frameworks/per-repo-customization-engine.md` (full design)
- Implementation priority: P0 (scanner + checkpoints) → P1 (architecture + conventions + verification) → P2 (research + vector) → P3 (domain language + agents) → P4 (dry-run + feedback)
- Estimated total effort: 15-25 days for complete implementation

## See Also
- `.opencode/context/frameworks/per-repo-customization-engine.md` — Full 11-approach design document
- `.opencode/context/frameworks/per-repo-deployment-architecture.md` — Parent architecture proposal

---

# ADR: Smart Prompt Queue — Non-Interrupting User Prompt Sequencing

**Status:** Accepted
**Date:** 2026-06-14

## Context
When the LLM is actively working (tool calls happening, todos advancing), any prompt the user types is submitted immediately — interrupting the current task mid-stream. If the user types multiple prompts while waiting, only the last one is processed. The stall detection system (ADR June 14) handles the "LLM is stuck" case but does nothing for the "LLM is busy, user has more to say" case.

## Decision
Implement a smart prompt queue that:
1. **Queues substantive user prompts** when the LLM is busy (heartbeat shows activity within 15-60s)
2. **Does NOT queue** continuation signals ("...", "continue", "go on") — those are handled by stall detection
3. **Auto-submits** the next queued prompt when the current task completes (no tool calls in 120s+ AND all todos done)
4. **Persists** the queue to `.opencode/state/sessions/{id}/prompt-queue.json` across sessions
5. **Injects queue context** into the LLM's system prompt so it knows more prompts are waiting

## Rationale
- Preserves user intent across task boundaries without interrupting active work
- Complements stall detection without overlapping (stall = stuck, queue = busy)
- No synthetic prompts — only what the user actually typed
- Survives context compression and session restarts

## Consequences
- `hubs-plugin.ts` updated with queue storage, enqueue/dequeue, completion detection
- `tui.prompt.append` hook intercepts prompts when LLM is busy
- `tool.execute.after` checks for task completion and auto-submits next prompt
- `experimental.chat.system.transform` injects queue status into LLM context
- `experimental.session.compacting` preserves queue state
- Framework document: `context/frameworks/smart-prompt-queue.md`

## See Also
- `.opencode/context/frameworks/smart-prompt-queue.md` — Full design document
- `.opencode/context/frameworks/stall-detection-and-recovery.md` — Complementary stall detection

---

# ADR: Inference Optimization Infrastructure — Semantic Cache + Prompt Compiler

**Status:** Accepted  
**Date:** 2026-07-03

## Context
The Hubs system dispatches subagents via OpenCode's `Task` tool, which calls an LLM API for each invocation. While the existing multi-tier cache (tool, mcp, llm, agent, session, stable, context7, file) handles **exact-repeat** work well, two significant inefficiencies remained:

1. **Near-repeat tasks miss the cache** — The agent output cache uses SHA-256 hashing of the task prompt + file contents. Rephrasing the same task (e.g., "fix button styling" vs "update button CSS") produces a different hash and a full cache miss, requiring a fresh LLM call. This is the single largest source of redundant API requests.

2. **Subagent prompts are bloated** — Every `Task` dispatch carries the full agent prompt template, all loaded rules, full file contents, and full skill dumps — even when only a small fraction is relevant to the task. This inflates per-request token consumption by an estimated 40-60%.

## Decisions

### D1: Semantic Similarity Cache (Embedding-Based)
Add a semantic cache layer alongside the existing exact-match SHA-256 agent cache:

- **Embedding model:** `ollama/nomic-embed-text` (137M params, ~300MB RAM, runs on CPU via local Ollama). No GPU needed. First inference cold-start ~2s, subsequent embeds ~50ms per prompt.
- **Storage:** Flat JSON index in `.opencode/cache/semantic/` — a simple array of `{ hash, vector, output, timestamp }` objects scannable by cosine similarity. At our scale (hundreds, not millions of entries), a full vector DB is overkill.
- **Similarity threshold:** 0.92 cosine similarity — tuned to catch paraphrased instructions without false positives on genuinely different tasks.
- **Two-tier lookup:** Exact SHA-256 match first (fast path, O(1)) → semantic fallback (O(n) cosine scan) → fresh dispatch.
- **File-hash verification:** On semantic hit, verify cached file hashes match current file state before returning (same as existing agent cache).
- **TTL:** 24 hours (matching the `stable` cache namespace), with file-change invalidation.
- **No degradation:** On miss, falls through to existing exact-match cache → fresh dispatch. Best-effort improvement, never worse than baseline.

### D2: Prompt Compiler (Boilerplate Stripping)
Add a pre-dispatch prompt compilation step that strips redundant boilerplate and scopes context to only what's needed:

- **What it strips:**
  - Role definitions and agent catalog sections that overlap with the target agent's built-in instructions — the subagent already knows who it is
  - Rules that duplicate the agent's base instructions (checked against a known-overlap table)
  - File content outside the relevant scope — function/class-level slices instead of full files
  - Narrative instructions converted to structured YAML bullet points (~30% fewer tokens)

- **What it preserves:**
  - All security rules — never strip security context
  - All task-specific instructions verbatim
  - All rule references that are relevant to the specific task

- **No budget enforcement:** The compiler is a pure quality optimization — it strips waste without imposing token budgets, caps, or size limits. If the compiled prompt is larger than the raw prompt (edge cases), it passes through unchanged.

### D3: Skill Content Compression (Integrated with Prompt Compiler)
The existing `loadSkill` tool gains two optional parameters:
- `section`: already exists, returns only the requested section
- `compress: true`: converts markdown workflow steps to compact YAML bullet lists

The prompt compiler calls `loadSkill(name, section, { compress: true })` when assembling context for a subagent dispatch. This covers skill compression without any separate infrastructure.

### D4: Verification Consolidation
Two changes to reduce per-step verify overhead in iterative patterns:

1. **Self-verify mode** — The executor agent runs its own verification (lint, test, typecheck) and only escalates to `@verifier` on failure. Built into the `ralph` and `harden` patterns as an optional flag.
2. **Batch verification gate** — In pipeline patterns, collect 3-5 changes before a single `@verifier` pass instead of verify-after-every-change.

## Rationale

- **Semantic cache** catches 80% of near-repeat tasks that miss the exact-match cache. Combined with the prompt compiler, this eliminates an estimated 40-50% of subagent dispatches entirely for iterative workflows (ralph loops, review cycles, test-fix cycles).
- **nomic-embed-text** is chosen over reusing the session model because: (a) It's a dedicated embedding model with much smaller memory footprint (137M vs 7B+ params), (b) It runs fully locally with no cloud API calls, (c) It produces consistent 768-dim vectors with well-understood cosine similarity behavior — no prompt engineering needed.
- **Prompt compiler** reduces per-dispatch token consumption by 40-60% without changing the LLM's output quality — it only removes what the agent already knows or doesn't need.
- **No budget enforcement** avoids the complexity of context window management and the risk of silently dropping critical context. The compiler is a filter, not a constraint.
- **Verification consolidation** directly reduces the dominant cost in iterative patterns (the verify loop) by 2-3x.

## Limitations

- **Semantic cache:** Cosine scan over a flat JSON index is O(n) — acceptable at current scale (~hundreds of entries per project) but would need a proper vector index (HNSW, IVF) if it grows to thousands+. Monitor cache hit performance and migrate if scan time exceeds 100ms.
- **Prompt compiler:** Stripping boilerplate requires knowing which rules overlap with the agent's built-in instructions. This overlap table must be maintained as agents evolve. A validation check in the `agent-format-enforcer` skill or a `hub-doctor` diagnostic can flag out-of-date entries.
- **Verification consolidation:** Self-verification relies on the executor agent correctly running its own checks. For critical paths (deploy, security-sensitive changes), external `@verifier` review should remain the default — self-verify is an optimization for non-critical iteration loops.

## Implementation Order

1. ADR (this document) — architecture decisions recorded
2. `tools/prompt-compiler.ts` — prompt compilation + skill compression integration
3. `tools/semantic-cache.ts` — embedding-based cache layer
4. `plugins/core/hooks.ts` — integrate both into the pre-dispatch pipeline
5. Verification consolidation — update ralph/harden skill files

## Consequences
- Two new tools: `prompt-compiler.ts` and `semantic-cache.ts`
- Modified: `plugins/core/hooks.ts` (pre-dispatch hook), `tools/loadSkill.ts` (compress mode), `skills/ralph/SKILL.md` (self-verify flag)
- `nomic-embed-text` becomes a required Ollama model — auto-pull in init-project setup
- ADR linked from global config README documentation table
- No change to the existing exact-match agent cache — it remains as the fast path O(1) lookup

## See Also
- `.opencode/context/frameworks/inference-optimization.md` (if created — full design details)
- `tools/prompt-compiler.ts` — Implementation
- `tools/semantic-cache.ts` — Implementation
- `tools/cache-utils.ts` — Existing multi-tier cache infrastructure
- `tools/agent-cache.ts` — Existing exact-match agent output cache
- `plugins/core/hooks.ts` — Hook integration (Tier 4 cache + pre-dispatch)

---

# ADR: Remove YAML Frontmatter from Hub SKILL.md Files

**Status:** Accepted
**Date:** 2026-07-03

## Context
Hub subcommand invocations were producing giant prompts — the entire SKILL.md file (200-700 lines) was being dumped into the LLM context. The `init-project/SKILL.md` file never had this issue.

## Decision
Strip YAML frontmatter (`---\nname: ...\n---`) from all 5 hub SKILL.md files (ideation, orchestrate, project, harvest-context, init-project). Hub SKILL.md files are routing manifests, not skill prompts — they must never have frontmatter.

## Rationale
OpenCode loads files with YAML frontmatter as skill context, injecting the entire file content into the prompt. Files without frontmatter are not auto-loaded. `init-project/SKILL.md` never had frontmatter and worked correctly — confirming frontmatter was the root cause, not the routing logic.

## Consequences
- Hub subcommand invocations now produce appropriately-sized prompts
- All 5 hub SKILL.md files start with `# Heading` instead of YAML frontmatter
- Convention documented in `rules/hub-description-directive.md` and `context/patterns/hub-skill-conventions.md`

---

# ADR: Two-Tier Description System for Hub Subcommands

**Status:** Accepted
**Date:** 2026-07-03

## Context
TUI dialogs have limited horizontal space (~80 chars). Long descriptions get truncated mid-sentence and become unintelligible. The hub name isn't visually present in the flat subcommand list, so descriptions must be self-contained.

## Decision
Hub subcommand specs use two description fields:
- `description` (≤80 chars, no tools/buzzwords, self-contained) — TUI menu display
- `detailedDescription` (unlimited, can include tools/methodology/steps) — route payload only

## Rationale
The two purposes have conflicting requirements. TUI needs short, distinctive, self-contained labels. Routing needs detailed workflows with tool names and methodology. A single field can't serve both without either truncating in TUI or being too sparse for routing.

## Consequences
- Rewrote `rules/hub-description-directive.md` for two-tier clarity
- Shortened all 154 subcommand spec `description` fields to ≤78 chars
- Shortened all 5 hub TUI description lists in `plugins/hubs-tui/src/tui.tsx`
- TUI dist rebuilt (16.82 KB)

---

# ADR: Compact Routing Table Format for Hub SKILL.md Files

**Status:** Accepted
**Date:** 2026-07-03

## Context
Hub SKILL.md files used individual `### /hub X — Y` subsections with `---` dividers. This caused agents to regurgitate content from multiple sections when loaded, inflating token consumption.

## Decision
Replace individual subsections with a single compact markdown table: `Subcommand | Skill/Delegate | What It Does`. Terse reminders moved to a separate table. Shared lifecycle steps preserved but stripped of per-subcommand verbosity.

## Rationale
`init-project/SKILL.md` already used this format and worked well. Compact tables are more parseable, reduce token consumption, and prevent agents from pulling content across multiple sections.

## Consequences
- ideation: 476 → 236 lines
- orchestrate: 187 → 148 lines
- project: 387 → 117 lines (−70%)
- harvest-context: 698 → 207 lines (−70%)
- Verification: no-arg lists match spec labels, routing table row counts match spec counts

---

# ADR: Multi-Language Tool Scaffolder — Python and Bash Output Paths

**Status:** Accepted
**Date:** 2026-07-03

## Context
The `tool-scaffolder` only supported TypeScript tool generation. Python and Bash scripts needed different output paths since OpenCode auto-discovers tools only from `tools/` / `.opencode/tools/` (TypeScript only).

## Decision
TypeScript tools go to `tools/` (global) or `.opencode/tools/` (project). Python and Bash scripts go to `skills/<name>/scripts/` (global) or `.opencode/skills/<name>/scripts/` (project). The `language` parameter (`typescript` | `python` | `bash`) controls output path and code generation.

## Rationale
Python/Bash scripts are skill-bundled automation, not standalone tools registered with OpenCode. Placing them in `skills/<name>/scripts/` follows the artifact-placement rule and ensures they're discovered as skill scripts, not misinterpreted as OpenCode tools.

## Consequences
- `tools/tool-scaffolder.ts` extended with `generatePython()`, `generateBash()`, `validatePython()`, `validateBash()`
- `skills/tool-creator/SKILL.md` updated with multi-language documentation, scope rules, parameter type mappings
- Five bash escaping bugs fixed during testing (documented in `context/patterns/template-literal-bash-generation.md`)
