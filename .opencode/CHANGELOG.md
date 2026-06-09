# Changelog

## 2026-06-09

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