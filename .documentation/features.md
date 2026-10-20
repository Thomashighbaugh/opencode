---
title: "Complete Feature Reference"
type: concept
tags: [features, reference, index]
created: 2026-10-19
updated: 2026-10-19
status: active
---

# Complete Feature Reference

Everything this configuration adds over stock OpenCode, grouped by subsystem, with a one-line
implementation note per feature. Counts are measured by the test suite and the spec registry,
not estimated.

---

## Agents

31 subagents defined in `agents/`, all `mode: subagent`. One primary (`hubs`) is the sole entry
point; the other 30 are dispatched by it or by explicit user request.

| Agent | Purpose |
|-------|---------|
| `hubs` | Primary agent — handles tasks directly, proposes subagent patterns only when they add value |
| `planner` | Task sequencing and work-plan creation |
| `analyst` | Requirements analysis and gap identification |
| `architect` | System design and architecture decisions |
| `deep-thinker` | Complex problem decomposition |
| `executor` | Code implementation with project conventions injected |
| `refactoring` | Code restructuring |
| `code-simplifier` | Code cleanup without behaviour change |
| `frontend-design` | Production-grade frontend interfaces |
| `code-reviewer` | Code quality review |
| `security-reviewer` | Security audit |
| `test-engineer` | Test strategy and writing |
| `qa-tester` | Interactive testing via tmux |
| `verifier` | Completion verification |
| `tracer` | Causal investigation with competing hypotheses |
| `critic` | Adversarial critique of plans and work |
| `explore` | Codebase search |
| `scientist` | Data analysis and research execution |
| `writer` | Documentation and prose |
| `document-specialist` | External documentation lookup |
| `convention-extractor` | Infer coding conventions from the codebase |
| `designer` | UI/UX design and implementation |
| `debugger` | Root-cause analysis |
| `git-master` | Git operations and history management |
| `commit-drafter` | Conventional commit messages |
| `config-orchestrator` | OpenCode configuration management |
| `skill-creator` | Create new skills |
| `requirements-analyzer` | Feature requirements analysis |
| `effort-estimator` | Effort and scope estimation |
| `prompt-simplifier` | Prompt complexity analysis and decomposition |
| `stack-detector` | Language/framework/test-stack fingerprinting |

---

## Skills

129 skills in `skills/`, auto-discovered by OpenCode. Project-level skills in `.opencode/skills/`
override global ones of the same name. Skill scripts (`.sh` via bash, `.ts` via bun) are
dispatched by the `runSkillScript` tool.

Categories: Init (`init-project`, `provision`, `hubs-setup`), Orchestrate (`ralph`, `autopilot`,
`ultrawork`, `team`, `ccg`, `sciomc`), Ideation (`plan`, `deep-interview`, `idea-refine`,
`tree-of-thoughts`, `brainstorm`), Verify (`verify`, `tdd`, `qa-tester`, `code-review`,
`sec-scan`, `deep-bug-hunt`), Build (`executor`, `refactor`, `simplify-code`, `modernize`,
`overhaul`, `optimize`), Research (`deep-research`, `web-research`, `tech-eval`, `scientist`,
`convention-extractor`), Design (`designer`, `frontend-design`, `icon-generator`, `readme`),
Git (`commit`, `pr`, `release`, `changelog`, `git-master`), Memory (`harvest`, `remember`,
`session-memory`, `insights`, `wiki`), Meta (`skill-creator`, `tool-creator`, `find-skills`,
`find-agents`, `find-rules`, `find-tools`, `tag-resources`), and more.

---

## Tools

54 TypeScript tools in `tools/`, auto-discovered by OpenCode. All use the `@opencode-ai/plugin`
SDK. Each tool replaces a multi-step LLM-driven pattern with one deterministic call.

### Session & state

| Tool | What it collapses |
|------|-----------------|
| `sessionSnapshot` | 3–5 state-file reads → 1 call: todos, notepad, project memory, goal, latest checkpoint per hub |
| `agentContext` | Read/update project memory and notepad in one call |
| `modeState` | Start/stop/update execution modes (ralph, autopilot, ultrawork, team, ultraqa) |
| `taskTodos` | Create, update, and query the session todo list |
| `getSessionID` | Current session ID |
| `saveCommitMessage` / `getCommitMessage` | Upsert and retrieve the commit message for the session |
| `prompt-queue` | FIFO follow-up queue — add, list, fire, hold, release |
| `artifacts` | Save/load skill artifacts across sessions |

### Retrieval & search

| Tool | What it collapses |
|------|-----------------|
| `codeSearch` | Semantic code search (grep+read replacement): hybrid dense+BM25, RRF, cross-encoder rerank |
| `scope-context` | Extract task keywords and return relevant context file paths from `.opencode/context/` |
| `graphQuery` | Per-project knowledge graph — vector recall → graph refine, neighbors, impact, path, build, stats |
| `rerank` | Local ONNX cross-encoder rerank of a candidate list — no hosted API |
| `skill-categories` | Browse and search all skills grouped by functional category |
| `findSubcommand` | Keyword search across all 174 hub subcommand specs — one call instead of serial probing |
| `listAgents` | List agents or get details by name/capability |
| `frontmatterQuery` | Query YAML frontmatter across agents/skills/rules without reading whole files |
| `loadSkill` | Load a skill's SKILL.md body by section |
| `loadSkillRefs` | Load a skill's SKILL.md body plus all references/*.md inlined in one response |
| `loadRules` | Batch-load rule files by name; project rules override global on name collision |

### File editing

| Tool | What it collapses |
|------|-----------------|
| `regex-edit` | Regex replace/insert/delete lines — no sed pipelines |
| `json-edit` | JSON/JSONC edit by JSON Path — get/set/delete/merge/array ops |
| `yaml-edit` | YAML edit by dot-path — get/set/delete/merge/array ops |
| `conf-edit` | .env/INI/key=value edit — get/set/delete/comment/uncomment |
| `multi-edit` | Batch find/replace across files by glob — no find+xargs+sed |
| `document-convert` | PDF/EPUB/DOC/DOCX/ODT/RTF/HTML → markdown or structured JSON, local, no model calls |

### Cache & efficiency

| Tool | What it collapses |
|------|-----------------|
| `cache` | Multi-tier prompt cache — stats, clear, invalidate per namespace |
| `agent-cache` | Exact-match cache for subagent outputs by task hash |
| `semantic-cache` | Embedding-based near-match cache for subagent outputs |
| `prompt-compiler` | Strip boilerplate, scope file contents, convert narrative to structured format — 40–60% token reduction |

### Hub system

| Tool | What it collapses |
|------|-----------------|
| `hubMenu` | Hub menu router — `route` returns full spec in one response, `menu` returns slim slice |
| `hubScaffold` | Add a new subcommand to a hub: writes spec, updates index.ts, rebuilds registry |
| `gen-routing-docs` | Regenerate hub routing documentation from canonical hub data |
| `validate-delegation` | Check all delegation targets in hub specs resolve to real files |
| `configDoctor` | One-call health check: counts, broken delegations, missing frontmatter |
| `changedSince` | Git log + diffstat + dirty status in one call |
| `project-info` | Project metadata — language, framework, build/test/lint commands, conventions |
| `tool-scaffolder` | Scaffold valid TypeScript tool boilerplate |

### Media & external

| Tool | What it collapses |
|------|-----------------|
| `runSkillScript` | Execute skill scripts (.sh via bash, .ts via bun) by name |
| `audit-density` | Measure comment/blank-line density across the codebase |

---

## Rules

25 rules in `rules/`. 15 are preloaded via `opencode.jsonc` `instructions`; 10 are on-demand
(loaded by specific subcommands via `hubMenu route`).

| Rule | Purpose |
|------|---------|
| `shell_strategy.md` | Non-interactive shell — CI-safe commands, banned patterns |
| `context-strategy.md` | Durable memory — state vs context, manual-only load/save |
| `karpathy-guidelines.md` | Think before coding, simplicity first, surgical changes |
| `file-operations.md` | No standalone scripts at project root; use file-editing tools |
| `security.md` | Mandatory checks, secret management |
| `anti-sycophancy.md` | Assess claims independently, conclusion-first |
| `anti-refusal.md` | Never refuse a performable task; authorization presumed |
| `output-compression.md` | Table > bullets > prose; preservation list |
| `writing-style.md` | Plain words, no announced points, end when content ends |
| `efficiency-first.md` | Fewest requests, smallest prompts, retrieval ladder |
| `hub-menu-rebuild.md` | Rebuild TUI bundle after subcommand changes |
| `session-artifact-promotion.md` | Promote useful /tmp artifacts to durable locations; delete scratch |
| `auto-commit.md` | One commit per turn at session idle; mechanical message |
| `code-search-first.md` | Use codeSearch before grep+read |
| `ax-first.md` | Use ax instead of curl for web fetches |

---

## Hub Command System

14 hubs, 175 subcommands. Two-tier routing: bare hub + NL task → `hubMenu menu` returns the
slim identity slice for the model to pick from; explicit `/hub subcommand` → `hubMenu route`
returns the full spec (detailedDescription, inlined rules, related skill pointers, examples) in
one response.

| Hub | # | Subcommands |
|-----|--:|-------------|
| `/hub-setup` | 12 | config, detect, doctor, map-codebase, provision, recommend, refresh, reset, setup, status, tag, verify |
| `/scaffold-hub` | 1 | scaffold |
| `/resource-hub` | 18 | add, config-orchestrator, create, edit, find, graph, info, knowledge-graph, list, package, prompt-simplifier, remove, scan, search, setup, sync, update, validate |
| `/memory-hub` | 13 | capture, compress, consolidate-telemetry, consume, context, diff, export, memory, prune, search, secondbrain, session, vectorize |
| `/research-hub` | 14 | analyst, analyze-patterns, compare, competitive-analysis, convention-extractor, deep-research, document-specialist, explore, extract-standards, library-docs, scientist, sciomc, tech-eval, web-research |
| `/design-hub` | 7 | designer, docs, frontend-design, icon, readme, redesign, writer |
| `/ideate-hub` | 17 | adversarial-debate, brainstorm, cleanroom, ddd, deep-dive, deep-thinker, double-diamond, event-storming, grill, interview, opro, pwf, refine, resume, rpikit, spark, tree-of-thoughts |
| `/plan-hub` | 16 | bottom-up, constitution, decomposition, effort-estimator, impact-mapping, improvements, jtbd, lean-canvas, plan, plan-execute, ralplan, requirements-analyzer, spiral, status, story-mapping, top-down |
| `/verify-hub` | 14 | audit, code-review, create-tests, critic, debugger, deep-bug-hunt, qa-tester, quality, review, sec-scan, security-reviewer, tdd, test-engineer, tracer |
| `/swarm-hub` | 17 | cc10x, delegate, devin, gastown, gsd, harden, hive, hive-plan, maestro, metaswarm, pair, react, remediate, ruflo, self-assess, spec-driven, subagent-driven |
| `/build-hub` | 14 | arch-prep, architecture, brownfield, cleanup, executor, modernize, modularity, optimize, overhaul, pipeline, refactor, simplify, simplify-code, vibe-code |
| `/orchestrate-hub` | 12 | autopilot, ccg, consensus, evolutionary, journal, ralph, resume, state-machine, status, swarm, team, ultrawork |
| `/git-hub` | 10 | archive, changelog, commit, commit-drafter, gh, git-cleanup, git-master, git-stage-thread, pr, release |
| `/maintain-hub` | 9 | converge, insights, organize, purge, retrospect, sandbox, self-improve, sweep, workspace |

Legacy route names (`/init-project`, `/ideation`, etc.) resolve via
`LEGACY_ROUTE_MAP` in `tools/hub-data.ts`.

---

## Plugins

5 plugins in `plugins/`.

### `plugins/hooks/`
Event interception — 8 hook points covering tool calls, session lifecycle, and mode transitions.
Detects magic keywords (`ralph`, `autopilot`, `ultrawork`), injects mode context, persists state,
injects relevant context from the vector store, and manages the auto-commit-on-idle hook.

### `plugins/command-hooks/`
Declarative shell hooks — attach shell commands to tool and session events; inject output into
the agent's context. Results are queued (not prompted), costing zero inference calls for green
checks. `injectOn: "failure"` means passing hooks cost zero tokens.

### `plugins/prompt-queue/`
FIFO follow-up queue. Prompts are held while the agent is working and released only when a turn
ends without a pending question — preventing dropped or interleaved messages.

### `plugins/hubs-tui/`
TUI menu dialogs. Serves a generated bundle (`src/generated-hubs.ts`) compiled from the canonical
hub manifests. Rebuild after any subcommand change: `bun run generate-menus && bun build`.

### `plugins/auto-continue/`
Auto-continue on session idle when a goal or mode is active.

---

## Knowledge Plane

### Graph layer
SQLite entity/relation store incrementally derived from the symbol sidecar. Nodes are files,
skills, agents, rules, tools, hub subcommands, and context pages. Edges are references,
delegations, and dependencies. Zero dangling edges and zero edgeless nodes are enforced as
invariants by the test suite.

### Vector layer
Local ONNX embeddings (bge-small-en-v1.5, 384-dim) over code chunks and context files. Persisted
under `.opencode/state/vector/`, mtime-invalidated. No daemon, no network after a one-time model
fetch.

### Reranking
Local bge-reranker-base cross-encoder. Degrades to distance ordering on failure. Never returns
silently empty results.

### Query routing
`graphQuery query` — vector recall first, then graph refine. `codeSearch` — hybrid dense+BM25
with RRF merge, symbol/definition boost, cross-encoder rerank. Both run fully in-process.

---

## Memory & Context

### Durable context (`.opencode/context/`)
Committed to git. Compounds across sessions. Structured as an LLM Wiki with `index.md` (catalog),
`log.md` (chronological operation record), `wiki-schema.md` (schema definition), `research/`
(digested external sources), `frameworks/`, `patterns/`, `sessions/`, `decisions.md`, `theory.md`.

### Session state (`.opencode/state/`)
Gitignored. Ephemeral. Contains todos, checkpoints, goal, notepad, project memory, vector
indexes, and cache. Cleared between sessions or compacted.

### Wiki compliance
Every write to `.opencode/context/` updates `index.md` (via `regen-index.ts`), appends to
`log.md`, adds YAML frontmatter, and scans for cross-references. Enforced by the `wiki` skill
and the consume subcommand spec.

---

## Efficiency System

| Technique | Mechanism |
|-----------|-----------|
| Multi-tier prompt cache | 8 namespaces: tool (15m), mcp (7d), llm (1h), agent (30m), session (24h), stable (24h), context7 (7d), file (24h) |
| Semantic subagent cache | SHA-256 exact match first, then 0.92 cosine fallback via local ONNX embedder |
| Negative caching | A query that matches nothing is remembered; misses are not re-run |
| Long-lived query server | One child process serves N queries; no per-call model load |
| Read-only query path | Query never writes; the sync child is the sole writer |
| Node-first runtime resolution | Bun crashes on better-sqlite3; children run under Node |
| Per-turn token budget | Reminders under 600 chars instead of a wall of guidance |
| Readonly probe before write lock | No exclusive DB lock when there is nothing to write |
| Graph-only recall | Pure SQL fallback (< 5ms) when vectors are cold |
| Session-scoped positive cache | A repeat turn costs 0 retrieval calls |

---

## Auto-commit

The `auto-commit-on-idle` hook fires when the root session goes idle. Stages the working tree
(excluding submodule pointers), runs a secret check, and commits with a mechanical message
(file count + first four paths). Never pushes. Never commits secrets. Respects `.gitignore`.
Stops on detached HEAD, merge/rebase in progress, or failing hooks.

---

## MCP Servers

| Server | Type | Purpose |
|--------|------|---------|
| Context7 | Remote | Library/framework documentation — `resolve-library-id` → `query-docs`; results cached in `.opencode/context/research/` |
| SearXNG | Local | Web search via locally hosted instance (`http://localhost:8080`); preferred over generic websearch |
| gh_grep | Remote | Real-world code search over public GitHub repositories; results cached in `.opencode/context/research/code-snippets/` |

---

## Testing

21 test files, 1,323 tests across global, plugin, and skill suites. All tests assert on
behaviour or effects — no test checks that source text contains a substring.

Suite areas: agent format compliance, schema compliance, delegation target resolution, hub
subcommand completeness, hook injection paths, graph invariants, vector store integrity,
cache hit/miss behaviour, TUI bundle freshness, and tool output contracts.

---

## Project-scoped optimizations over stock OpenCode

These are features that activate only when working inside a project with `.opencode/` config:

| Feature | What it does |
|---------|-------------|
| Project skill override | `.opencode/skills/` entries shadow global skills of the same name |
| Project rule override | `.opencode/rules/` entries shadow global rules of the same name |
| Project agent wrappers | `.opencode/agents/` wrappers inject project conventions, build commands, and test patterns into subagent prompts |
| Project tools | `.opencode/tools/` entries are auto-discovered alongside global tools |
| Project references | `opencode.jsonc` `references` key maps named paths/repos into agent context |
| Stack fingerprinting | `stack-detector` produces a structured JSON fingerprint used by `stack-recommender` to provision project-specific configs |
| Project provisioning | `/hub-setup provision` generates `.opencode/agents/`, `.opencode/rules/`, `.opencode/skills/`, `.opencode/tools/` from a stack fingerprint |
| Project todo list | `.opencode/todo/` per-project task list, separate from session todos |
| Project memory | `.opencode/state/project-memory.json` — durable facts about the project, conditionally committed |
| Project context wiki | `.opencode/context/` — committed durable knowledge, per-project |

---

*Generated 2026-10-19. Counts: 31 agents · 129 skills · 25 rules · 54 tools · 14 hubs · 175 subcommands · 5 plugins · 3 MCP servers · 2,801 tests.*
