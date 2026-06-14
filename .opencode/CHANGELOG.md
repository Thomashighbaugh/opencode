# Changelog

## 2026-06-14 (2)

- **chore(hubs): remove JOC branding, add per-repo deployment architecture** (`4348078`)
  - Cleaned 35+ JOC (Joint Operations Center) branding references across 16 files
  - `joc team` → `opencode team` in hubs-teams skill (14 occurrences)
  - `joc-plugin.ts` → `hubs-plugin.ts` in init-project template
  - `.joc/**` permission entry removed from opencode.jsonc
  - `joc-tui-hubs` → `hubs-tui-hubs` in bun.lock
  - All `joc/opencode-hubs` URLs → `Thomashighbaugh/opencode`
  - `Yeachan-Heo/opencode-joc` → `Thomashighbaugh/opencode` in PSM config
  - JOC comment references → OpenCode across veclib.mjs, .gitignore, docs
  - "Joint Operations Center" → "Hub-driven" in hubs-doctor skill
  - "military field command post" → "hub-and-spoke orchestration" in README
- **docs: per-repo deployment architecture proposal** (`4348078`)
  - ADR: Self-Deploying Per-Repo Agentic Configuration Architecture
  - Framework document: `.opencode/context/frameworks/per-repo-deployment-architecture.md`
  - 9-phase zero-to-context pipeline: scan → research → synthesize → generate → vectorize
  - Global engine vs per-repo brain separation eliminating global config bloat
  - ADR entry documenting the architecture and migration path

## 2026-06-14

- **feat: add privacy-scan skill and gitignore protections for chat history and secrets** (`72c0e75`)
  - Added `.opencode/state/sessions/`, `.opencode/chat-history/`, `.opencode/chat/` to `.gitignore` (both global and `.opencode/`)
  - Created `privacy-scan` skill with `scan-privacy.mjs` script for dynamic secret/PII detection
  - Distinguishes derived knowledge (ADRs, patterns — safe to commit) from raw data (sessions, logs — risky)
  - Updated `init-project` Phase 3 to add gitignore entries + run privacy scan during setup/refresh
  - Updated `init-project` Phase 8 verification to check all privacy gitignore entries
  - Updated `harvest-context` to run privacy scan before saving any file to `.opencode/context/`
  - Updated `harvest-context sweep` to scan existing context files for privacy issues
  - Updated `rules/context-strategy.md` with privacy scan integration documentation
  - ADR and pattern doc saved to durable context

## 2026-06-10

- **feat(ideation): add decomposition as third /ideation subcommand** (`6a7d8f1`)
  - New inline subcommand at position 3 (after brainstorm, before refine) for breaking complex tasks into actionable subtasks with dependencies and acceptance criteria
  - Registered in hubMenu.ts, documented in ideation/SKILL.md, intent-routing profile added to route-ideation.mjs
  - ADR added to decisions.md

- **docs: reorder hub menus by project lifecycle** (`61bac08`)
  - Reordered all hub listings in README and AGENTS.md to follow the project development lifecycle: init-project → ideation → orchestrate → harvest-context → project
  - Updated subcommand reference sections, quick reference table, quick start examples, and commands table
  - Updated architecture overview to describe the lifecycle ordering
  - Added `decomposition` to ideation subcommand lists across AGENTS.md

## 2026-06-09

- **docs(patterns): add Craftsman Agent pattern analysis and ADR** (`999d6b8`)
  - Explored the "craftsman agent" pattern: agents with internal self-critique loops
  - Biological framing: ant-agents (external reviewer required) vs. human craftsmen (self-correct first)
  - Analysis covers: risks (over-engineering, under-critique, blind spots), composition with ralph/ultrawork/team, incentive mechanisms, bootstrap design
  - Saved to `.opencode/context/patterns/craftsman-agent.md` + ADR in `decisions.md` + entry in `theory.md`

- **docs: rewrite README with comprehensive hub subcommand reference tables** (`425bb06`)
  - Restructured README: quick-reference hub menus first, then detailed subcommand tables for all 5 hubs (103 total subcommands)
  - Applied proper title-case capitalization to headings throughout all documentation files
  - Replaced informal prose with thorough technical documentation with dry humor
  - Added "Critical Instruction: README Maintenance" to `.opencode/AGENTS.md` ensuring docs stay in sync

## 2026-06-08

- **feat(models): add NVIDIA Nemotron 3 Ultra (nemotron-3-ultra:cloud)** (`f86da55`)
  - 550B params (55B active), 256K context window, 131K output
  - Built for agent orchestration, long-running agents, deep research
  - Added to `opencode.jsonc` model list and AGENTS.md documentation

- **chore(hubs): auto-save context after harvesting Prompthon agent-systems-handbook** (`08a1987`)
  - Ingested the full Agent Systems Handbook from Prompthon-IO into `.opencode/context/research/agent-systems-handbook-prompthon.md`
  - Covers: agent foundations, planning/reflection patterns, MCP/A2A/ANP protocols, context engineering, agent memory, evaluation/observability, multi-agent architecture, trend radar, and skill packages