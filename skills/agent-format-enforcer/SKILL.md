---
name: agent-format-enforcer
description: Enforce the <Agent_Prompt> XML wrapper convention across all agent definition files. Scan, validate, and auto-fix non-compliant agents.
level: 2
---

# Agent Format Enforcer

Enforce the `<Agent_Prompt>` XML wrapper convention on all agent `.md` files in `agents/`.

## Standard Format

Every agent file MUST follow this structure:

```yaml
---
description: Description of the agent's role
model: ollama/deepseek-v4-flash:cloud
mode: subagent
---
<Agent_Prompt>
  <Role>
    ...agent instructions...
  </Role>
</Agent_Prompt>
```

## When to Use

- After creating or modifying an agent
- When onboarding agents from external sources
- During code review to catch format drift
- As part of `/project review` or CI checks

## Usage

```
# Scan all agents for compliance
/init-project doctor  # delegates to this skill for agent check

# Or manually:
loadSkill agent-format-enforcer
```

## What It Checks

| Check | Detail |
|-------|--------|
| YAML frontmatter | `---` delimiters present |
| `description` | Required field |
| `model` | Required field |
| `mode` | Required field (subagent or primary) |
| `<Agent_Prompt>` | Opening wrapper tag present |
| `<Role>` | Sub-tag inside Agent_Prompt |
| `</Agent_Prompt>` | Closing wrapper tag present |

## Script

`scripts/check-agent-format.mjs` — Standalone validation script that:
- Reads all `agents/*.md` files
- Validates each against the standard format
- Reports per-agent compliance
- Exits 0 if all compliant, 1 if issues found
- Supports `--fix` to auto-wrap non-compliant files

## Related

- `agent-md-refactor` skill — For larger-scale agent file restructuring
- `hubs-doctor` skill — Diagnostic health check that includes agent format validation