<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-05-01 | Updated: 2026-05-01 -->

# skills

## Purpose
137 specialized workflow skills organized into functional hubs. Each skill provides domain-specific instructions, workflows, and bundled resources (scripts, references, templates) that agents load at runtime. Includes the 14 skills the former per-specialty agent roster (`agents/*.md`) was folded into on 2026-09-27 — see the **Specialist (ex-agents)** row below and `claude/knowledge-claude-config/agents-to-skills-2026-09-27.md`.

## For AI Agents

### Working In This Directory
- Each subdirectory contains a `SKILL.md` entry point with the skill definition
- Skills are loaded via the `Skill` tool or `loadSkill` function
- Skill metadata (name, description, location) is registered in the system prompt's `<available_skills>` block
- Use the `hubs-reference` skill for the OAS catalog and tools reference

### Skill Categories

| Hub | Skills |
|-----|--------|
| **Init** | `init-project`, `hubs-setup`, `deepinit`, `hubs-doctor`, `provision` |
| **Ideation** | `ideation`, `plan`, `deep-interview`, `graph-thinking`, `idea-refine`, `ralplan` |
| **Orchestrate** | `orchestrate`, `ralph`, `autopilot`, `ultrawork`, `team`, `ccg`, `sciomc`, `deep-dive`, `trace`, `cancel` |
| **Harvest** | `harvest-context`, `remember`, `wiki`, `skill-creator`, `opencode-agent-creator`, `opencode-command-creator`, `skillify`, `conventional-commit`, `humanizer` |
| **Project** | `project`, `changelog-generator`, `file-organizer`, `icon-generator`, `github-ops`, `release`, `conventional-commit`, `ai-slop-cleaner` |
| **UX/Design** | `design-system-starter`, `mui`, `geometric-abstract` |
| **External** | `context7-docs`, `context7-mcp`, `external-context`, `mcp-setup`, `autoresearch-agent` |
| **Meta** | `self-improve`, `learner`, `agent-md-refactor`, `agent-format-enforcer`, `config-sync`, `hubs-reference`, `hubs-teams`, `project-session-manager` |
| **QA/Verify** | `verify`, `visual-verdict`, `ultraqa`, `debug` |
| **Docs** | `crafting-effective-readmes`, `writer-memory`, `naming-cheatsheet`, `web-to-markdown`, `professional-communication`, `deliberate-practice`, `hud`, `dependency-updater`, `configure-notifications` |
| **Specialist (ex-agents)** | `architect-review`, `plan-critic`, `requirements-analysis`, `deep-thinker`, `data-analysis`, `effort-estimator`, `prompt-simplifier`, `stack-detector`, `git-master`, `implementation-discipline`, `interactive-cli-testing`, `technical-documentation`, `convention-extractor`, `distinctive-frontend-design` |

### Testing Requirements
- Skill consistency validated by Hubs doctor
- Each skill should be independently testable via its documented workflow

### Common Patterns
- `SKILL.md` is the entry point with YAML frontmatter (name, description)
- `scripts/` subdirectory for executable automation
- `references/` for bundled knowledge
- `templates/` for file generation templates

## Dependencies

### Internal
- `tools/` — TypeScript tools invoked by skills
- `agents/` — Agents delegated to by skills
- `rules/` — Shared rules loaded into skill context

### External
- `~/.agents/skills/` — External skills (e.g., `context7-mcp`)
- Context7 MCP — Remote documentation fetching

<!-- MANUAL: -->
