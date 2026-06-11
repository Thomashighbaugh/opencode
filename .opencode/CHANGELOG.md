# Changelog

## 2026-06-10

- **feat(ideation): add decomposition as third /ideation subcommand** (`6a7d8f1`)
  - New inline subcommand at position 3 (after brainstorm, before refine) for breaking complex tasks into actionable subtasks with dependencies and acceptance criteria
  - Registered in hubMenu.ts, documented in ideation/SKILL.md, intent-routing profile added to route-ideation.mjs
  - ADR added to decisions.md

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