---
title: "LLM Wiki Operation Log"
type: concept
tags: [wiki, log, changelog]
created: 2026-07-04
updated: 2026-07-05
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
