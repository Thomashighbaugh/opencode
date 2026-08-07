---
title: "LLM Wiki Operation Log"
type: concept
tags: [wiki, log, changelog]
created: 2026-07-04
updated: 2026-08-07
status: active
---

# LLM Wiki Operation Log

Chronological record of all wiki operations. Append-only.

## [2026-07-04] consume | OpenLoops (@hasna/loops)

- **Operation**: Ingested npm package documentation for `@hasna/loops` (OpenLoops)
- **Source**: npm registry API + GitHub README
- **Files created**:
  - `research/openloops.md` — full source summary with YAML frontmatter
- **Wiki infrastructure created**:
  - `wiki-schema.md` — schema definition
  - `index.md` — catalog of all wiki pages
  - `log.md` — this file
- **Cross-references**: None yet — first wiki page with proper frontmatter
- **Notes**: Existing context files lack YAML frontmatter; added what could be inferred from filenames and directory structure

## [2026-07-04] consume | opencode-dux

- **Operation**: Ingested npm package documentation for `opencode-dux`
- **Source**: npm registry API + GitHub README
- **Files created**:
  - `research/opencode-dux.md` — full source summary with YAML frontmatter
- **Index updated**: Added `opencode-dux` entry to research section
- **Cross-references**: None — standalone plugin documentation

## [2026-07-04] consume | Arcanum (@runecraft/*)

- **Operation**: Ingested monorepo documentation for Runecraft's Arcanum ecosystem
- **Source**: GitHub README + CONTRIBUTING guide + npm registry (spells, summon, runes)
- **Files created**:
  - `research/arcanum.md` — full ecosystem summary covering all 6 packages
- **Cross-references**: Related to OpenCode plugin ecosystem (opencode-dux, fractal-memory, deep-memory)

## [2026-07-04] consume | opencode-deep-memory (@bd7pil)

- **Operation**: Ingested npm package documentation for `@bd7pil/opencode-deep-memory`
- **Source**: GitHub README + npm registry
- **Files created**:
  - `research/opencode-deep-memory.md` — full source summary with V5.1 architecture
- **Cross-references**: Related to memory/context plugins (fractal-memory, runes, opencode-dux)

## [2026-07-05] consume | opencode-websearch-cited

- **Operation**: Ingested npm package documentation for `opencode-websearch-cited`
- **Source**: GitHub README + npm registry
- **Files created**:
  - `research/opencode-websearch-cited.md` — full source summary
- **Cross-references**: Related to OpenCode plugin ecosystem (opencode-dux, websearch ecosystem)

## [2026-07-05] consume | lit-search-cite

- **Operation**: Ingested npm package + GitHub README for `lit-search-cite`
- **Source**: npm registry API + GitHub README (Chinese, translated to English summary)
- **Files created**:
  - `research/lit-search-cite.md` — full source summary with YAML frontmatter, covering 10+ academic sources, journal ranking, PDF download, citation formatting, and cross-platform scripts
- **Index updated**: Added `lit-search-cite` entry to research section
- **Cross-references**: Related to academic research tooling; distinct from plugin-based sources consumed previously

## [2026-07-05] consume | opencode-manifold

- **Operation**: Ingested npm package + README for `opencode-manifold` (Open Manifold)
- **Source**: npm registry API + npm tarball README
- **Files created**:
  - `research/opencode-manifold.md` — full source summary covering plugin-driven state machine, 7 agents (Planner/Todo/Clerk/SeniorDev/JuniorDev/Debug/Manifold), three-tier template architecture, planning → implementation phase flow, and 6 subcommands
- **Key findings**:
  - Plugin-as-conductor (v2) — orchestration logic in TypeScript code, not agent prompts
  - Requires `opencode-codebase-index` plugin for semantic search
  - GPL 3+ license (not MIT like most other opencode plugins)
  - No public GitHub repo in npm metadata; published by "twine_network"
- **Index updated**: Added `opencode-manifold` entry to research section
- **Cross-references**: Orchestration plugin (similar to opencode-dux); persistent memory (related to opencode-deep-memory)

## [2026-07-07] consume | opencode-goal-plugin

- **Operation**: Ingested GitHub README + source code (`src/goal-plugin.js`) for `willytop8/OpenCode-goal-plugin`
- **Source**: GitHub README + source code
- **Files created**:
  - `research/opencode-goal-plugin.md` — full source summary with YAML frontmatter
- **Cross-references**: Goal/auto-continue pattern relevant to our orchestration modes (ralph, autopilot). State persistence + ledger reconstruction patterns relevant to our state management.
- **Notes**: 162-star plugin adding `/goal` command with auto-continue, multi-goal support, ordered (sisyphus) sequences, append-only lifecycle ledger, fail-closed persistence, compaction survival, prompt safety via XML tag injection prevention. Key patterns: marker-based completion, user-message preemption, no-progress/no-tool-call heuristics.

## [2026-07-07] consume | opencode-dispatcher

- **Operation**: Ingested GitHub README + docs (workflow, agents, configuration) for `louisemalvin/opencode-dispatcher`
- **Source**: GitHub README + docs/workflow.md + docs/agents.md + docs/configuration.md + opencode.jsonc
- **Files created**:
  - `research/opencode-dispatcher.md` — full source summary with YAML frontmatter
- **Cross-references**: Permission model patterns relevant to our own agent permission design
- **Notes**: 11-agent workflow pack with file-based task artifacts, deny-by-default permission model, docs-first routing, 6-state orchestrator state machine. Notable: escape hatch sealing pattern (edit: deny not subvertable through shell), rich handoff concept (10-field structured handoff materialized as file), agy integration for quota-split across models.

## [2026-07-07] consume | opencode-memoir

- **Operation**: Ingested GitHub README for `disafronov/opencode-memoir`
- **Source**: GitHub README
- **Files created**:
  - `research/opencode-memoir.md` — full source summary with YAML frontmatter
- **Cross-references**: None yet — first entry for this plugin
- **Notes**: Plugin registers memoir-mcp as dynamic MCP server via `uvx`. No manual CLI install needed. Git-versioned, taxonomy-structured memory for coding agents.

## [2026-07-05] consume | caveman

- **Operation**: Ingested GitHub README for `JuliusBrussee/caveman`
- **Source**: GitHub README (web fetch)
- **Files created**:
  - `research/caveman.md` — full source summary covering 6 compression levels, 7 commands, 5 agent benchmarks (avg 65% output reduction), 5-tool ecosystem, and sibling skills pack
- **Key findings**:
  - 84.1k ⭐, v1.9.1, MIT license
  - Works with 30+ agents (Claude Code, Codex, Gemini, OpenCode, Cursor, etc.)
  - Zero telemetry — no network calls after install
  - Ecosystem includes caveman-code (full agent), cavemem (memory), cavekit (build loop), cavegemma (fine-tuned weights)
  - Cited in March 2026 paper on brevity constraints improving accuracy
  - Sibling skills pack: grill-me, interface-kit, junior-to-senior, loop-factory
- **Index updated**: Added `caveman` entry to research section
- **Cross-references**: Referenced as dependency by opencode-manifold (uses Caveman for compressed communication); related to all token-compression tooling
2026-07-12 19:12:36 - Harvested OpenHands, Ponytail, Karpathy Guidelines into durable context

## [2026-07-29] migrate | docs → context/docs (wiki integration)

- **Operation**: Migrated all documentation files from `.opencode/docs/` (14 files) and `docs/shared/` (1 file) into `.opencode/context/docs/` with full wiki compliance
- **Source**: `.opencode/docs/` (14 files) + `docs/shared/agent-tiers.md`
- **Files created/migrated** (15 files):
  - `docs/AGENTS.md` — docs directory index stub
  - `docs/agents.md` — agent catalog reference (841 lines)
  - `docs/agent-tiers.md` — model tier assignments (176 lines)
  - `docs/commands.md` — command system reference (741 lines)
  - `docs/execution-modes.md` — ralph/autopilot/ultrawork modes (973 lines)
  - `docs/installation.md` — installation guide (406 lines)
  - `docs/model-configuration.md` — model config reference (565 lines)
  - `docs/new-agents.md` — research-backed agent creation (373 lines)
  - `docs/path-conventions.md` — file system conventions (434 lines)
  - `docs/plugin-system.md` — hooks/plugin architecture (871 lines)
  - `docs/routing.md` — hub routing model (214 lines)
  - `docs/skills.md` — skills catalog (1216 lines)
  - `docs/state-management.md` — state persistence (784 lines)
  - `docs/testing.md` — config integrity test suite (55 lines)
  - `docs/tools.md` — TypeScript tools reference (934 lines)
- **Operations performed on each file**:
  - Added YAML frontmatter (title, type: entity, tags, created/updated, status: active)
  - Rewrote internal cross-reference links: `](./xxx.md)` → `](../docs/xxx.md)`
- **Cross-references updated**:
  - `skills/readme-updater/SKILL.md` — `.opencode/docs/` → `.opencode/context/docs/`
  - `.opencode/CHANGELOG.md` — `.opencode/docs/` → `.opencode/context/docs/`
  - `.opencode/context/research/opencode-joc-overview/20260719_catalog-and-patterns.md` — `Files_To_Add/docs/` → `.opencode/context/docs/`
- **Index updated**: Added `docs/` section listing all migrated pages
- **Old source removed**: `.opencode/docs/` directory and `docs/shared/agent-tiers.md` deleted

## [2026-07-19] consume | opencode-joc-overview

- **Operation**: Ingested and analyzed `~/Data/Projects/Notes/Opencode_JOC/` directory
- **Source**: Directory containing 8 cloned skill/agent registries and reference materials
- **Files created**:
  - `research/opencode-joc-overview/20260719_catalog-and-patterns.md` — catalog of 9 pattern discoveries with cross-reference to existing hub subcommands
- **Key findings**:
  - 220 agents (awesome-copilot), 203 agents (wshobson), 94 plugins, 175 skills, 109 commands
  - 9 new hub subcommand patterns identified: lifecycle `/dev` hub, hooks system, scored audits, domain orchestrators, agent quality evaluation, agent testing methodology, plugin bundle management, agentic workflows, GitHub profile audit
  - addyosami/agent-skills provides 24 skills with 8 lifecycle commands
  - wshobson/agents has 16 multi-agent orchestrators + adapter framework for 6 harnesses
  - Files_To_Add/docs/new-agents.md has research-backed agent creation methodology with 8-test-type validation
- **Cross-references**: Links to existing `/project`, `/orchestrate`, `/harvest-context`, `/init-project` hub subcommands

## [2026-08-07] consume | recursive-self-improvement

- **Operation**: Ingested David R. Oliver's Medium article on building a self-improving agent with Claude Code
- **Source**: Medium article (via freedium mirror — `https://freedium-mirror.cfd/...`)
- **Files created**:
  - `research/recursive-self-improvement.md` — full source summary with YAML frontmatter
- **Key findings**:
  - Confidence-scored graduation mechanism: pattern keys `{strategy}:{context}`, start score 0, +1 per approval, −2 per rejection, graduate at ≥5, instant demotion on post-graduation rejection; 7 fix strategies with priority order
  - Results: 1,308 broken links over 4 batches → ~850 remaining; 0% → 95% autonomous fix rate; per-pattern trust, `learnings.json` persistence
  - Prevention layer: pre-commit hook requiring ≥2 inbound references to catch recurrence
  - Lessons: trust earned not configured; asymmetric rejection (−2) vs approval (+1); prevention beats repair; loop is the product
  - Future directions: trust decay (lastSeen), hierarchical trust transfer (80% variant rule → warm-start at score 3), rollback chains (git SHA), cross-domain transfer
  - 2026 landscape: MiniMax M2.7 (+30% after 100+ RL iterations), OpenAI Codex 5.3 (first self-creating model claim), Google AlphaEvolve (first improvement on Strassen 1969 matrix multiplication), Claude Code authored 70–90% of Anthropic's training code, Karpathy's autoresearch (630-line script)
  - Series roadmap: Part 2 (Auto MoC system), Part 3 (prompt that improves itself)
- **Cross-references**: [[short-leash-ai-method-okturtles]], [[opencode-dispatcher]], [[observational-memory-mastra]]

## [2026-08-07] web-research | agentic-self-improvement-2026

- **Operation**: Multi-source web research on agentic coding agent self-improvement methodologies and mechanisms (3 parallel searches + 2 parallel fetches)
- **Source**: datasciencedojo.com, arxiv.org (AgentTrust 2606.08539), curvelabs.org, claudepluginhub.com, mcpmarket.com, medium.com, zylos.ai, mindstudio.ai, borghei/claude-skills, alirezarezvani/claude-skills, weco.ai, ICLR 2026 workshop
- **Files created**:
  - `research/agentic-self-improvement-2026.md` — multi-source synthesis report with YAML frontmatter
- **Key findings**:
  - All 2026 RSI is bounded/supervised — agents rewrite prompts/tools/code around a fixed model; no self-weight modification
  - Convergent design principles: act→measure→adjust autonomy, trust earned not configured, separate evaluation from generation (hidden scores, corroboration guards), persist what worked, prevention before repair
  - AgentTrust v2: lexical threats → distilled deterministic rules (cheaper over time, judge rate 50%→44%); semantic threats → guarded RAG memory (smarter over time, 71%→80%); never hard-block benign actions; 0 benign hard-blocks across 45k actions
  - Autonomy taxonomies (Zylos): L2 = Claude Code tiered permission rules; March 2026 Auto Mode two-layer classifier (0.4% FPR/5.7% FNR), 3 consecutive denials → human escalation
  - Concrete systems: Weco AIDE2 (outer/inner loop, public+hidden scores, ~9/10 rewrites rejected), Karpathy AutoResearch (630-line, 700 experiments/2 days, 20 genuine speedups), Agent0 (adversarial task generator + solver, +18% math), SICA, AlphaEvolve (48-vs-49 matrix multiplication), OpenAI RSI Index (GPT-5.6 Sol +16.2), MiniMax M2.7
  - Learning stores: learnings.md with binary evals (7/10 subjective scoring fails), builder-validator chains, memory curation → promotion ladder (2–3× recurrences → MEMORY.md → user approval → CLAUDE.md enforced rule)
  - Guardrails: hard iteration caps, token budgets, circuit breakers, stopping conditions BEFORE loop starts; weak self-evaluation compounds
- **Cross-references**: [[recursive-self-improvement]], [[short-leash-ai-method-okturtles]], [[observational-memory-mastra]], [[opencode-dispatcher]]

## [2026-08-07] web-research | opencode-self-improvement-2026

- **Operation**: Multi-source web research on OpenCode self-improvement methodologies and mechanisms (3 parallel searches + 1 targeted fetch)
- **Source**: github.com (Svtter/opencode-self-improve, mittalsuraj18/opencode-auto-research, rajibmahata/opencode, Tah10n/opencode-harness, joshuadavidthomas/opencode-agent-memory, different-ai/agent-bank), skillsmp.com, gist.github.com, hindsight.vectorize.io, arxiv.org
- **Files created**:
  - `research/opencode-self-improvement-2026.md` — multi-source synthesis report with YAML frontmatter
- **Key findings**:
  - 6 distinct mechanisms identified: skill lifecycle loop (SkillForge/Curator/SkillInjector), benchmark-driven optimization (autoresearch), config/rules evolution (evolve skill), evidence-gated prompt engineering (agent-self-improvement workflow), memory blocks (Letta-style), guarded self-improvement harness (opencode-learning-guard)
  - Convergent principles: evidence-gating before promotion, queues separate capture from promotion, asymmetric removal (demotion cheaper than promotion), injection at system-prompt point, structural (not advisory) guardrails, measurement closes the loop, separation of concerns, manual-by-default autonomy-by-graduation
  - evolve v2 (twidxuga): capture → queue → lint → promote → measure pipeline; rule_id Reflexion feedback; demotion to queue for no-impact rules; public/private dual logs
  - rajibmahata workflow: gate failures logged inline to MEMORY.md → periodic Prompt Engineer review → prompt changes with rationale → measured recurrence; never bypasses quality gates; incremental edits only
  - Tah10n harness: `oc_learning_*` deny at root / ask only on improver agent; toolset narrowing (memory-read/write, skills-write, improver, none); persistence rules ban secrets/raw logs; audit-first cleanup
  - autoresearch plugin: MAD-based confidence, auto-compaction per iteration, git commit-on-keep/reset-on-discard, METRIC/ASI structured protocol
  - Context: this report complements [[agentic-self-improvement-2026]] (general RSI survey) — opencode-specific angle
- **Cross-references**: [[agentic-self-improvement-2026]], [[recursive-self-improvement]], [[short-leash-ai-method-okturtles]], [[opencode-dispatcher]], [[observational-memory-mastra]]
