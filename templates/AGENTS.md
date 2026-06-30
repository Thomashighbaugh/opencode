<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-05-01 | Updated: 2026-05-01 -->

# templates

## Purpose
File templates used by skills and agents for generating new files (agents, context docs, tests).

## Key Files

| File | Description |
|------|-------------|
| `agent-template.md` | Template for creating new agent definition files |
| `context-template.md` | Template for durable context documents |

## Subdirectories

| Directory | Purpose |
|-----------|---------|
| `agent-tests/` | Templates for agent testing scenarios |
| `reasoning/` | CoT (Chain-of-Thought) reasoning templates referenced by agent definitions — structured step-by-step guides for architect, planner, debugger, tracer, reviewer, verifier, and skill-creator agents |

## For AI Agents

### Working In This Directory
- Templates are referenced by skill-creator and agent-creator workflows
- Templates use placeholder syntax for variable substitution
- Keep templates minimal — only include structure, not example content that ages

### Testing Requirements
- Verify template renders correctly with sample values

### Common Patterns
- Markdown templates with `{PLACEHOLDER}` syntax
- Frontmatter templates for agent/command definitions

## Dependencies

### Internal
- `skills/skill-creator/` — Uses these templates
- `skills/opencode-agent-creator/` — Uses `agent-template.md`

<!-- MANUAL: -->
