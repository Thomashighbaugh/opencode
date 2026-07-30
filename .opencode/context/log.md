---
title: "LLM Wiki Operation Log"
type: concept
tags: [wiki, log, changelog]
created: 2026-07-04
updated: 2026-07-19
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
