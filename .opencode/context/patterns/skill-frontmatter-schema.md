---
name: skill-frontmatter-schema
tags: [frontmatter, schema, skills]
---

# Skill Frontmatter Schema

Standard frontmatter for all `skills/*/SKILL.md` files.

## Schema (fields in order)

```yaml
---
name: <string>                  # REQUIRED — matches directory name
description: <string>           # REQUIRED — max 80 chars for menu display
level: <1|2|3|4|5>              # RECOMMENDED — default 2
license: MIT                    # RECOMMENDED — default MIT
tags: [comma, separated]        # RECOMMENDED — topic tags
argument-hint: <string>         # IF hub subcommand — subcommand routing hint
---
```

## Field Details

| Field | Required | Default | Description |
|-------|----------|---------|-------------|
| `name` | **Yes** | — | Lowercase kebab-case, matches directory name |
| `description` | **Yes** | — | Short description (max 120 chars for agent listings) |
| `level` | No | `2` | Complexity: 1=basic, 3=intermediate, 5=expert |
| `license` | No | `MIT` | License identifier |
| `tags` | No | — | Array of topic tags for categorization |
| `argument-hint` | No | — | Hub subcommand identification string |

## Enforcement

Applied by `/init-project doctor` and `/skills validate`. The `tag-resources` skill uses these fields for categorization.

## History

- 2026-07-29: Defined and batch-applied across all skills
