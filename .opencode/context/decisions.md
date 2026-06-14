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
The global configuration (`~/.config/opencode/`) serves as a runtime engine with 29 agents, 67 skills, 6 commands, 10 tools, and 11 rules. However, every project has unique domain language, architecture patterns, coding conventions, testing practices, and external dependencies. Users currently must manually decompose their project architecture and wrestle with domain jargon before they can productively use AI assistance. There is no mechanism for `/init-project setup --full` to:

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
