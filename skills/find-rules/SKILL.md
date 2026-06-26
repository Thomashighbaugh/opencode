---
name: find-rules
description: Discover, vet, and generate project-relevant OpenCode rules by searching registries (GitHub, skills.sh) and local template catalog. Used by /init-project setup/refresh to provision project-specific rules alongside skills and agents.
tags: [init, config, provisioning, rules, scaffolding]
---

# Find Rules

Find and generate the right OpenCode rules for a project's tech stack by searching registries, scanning local templates, and presenting candidates for installation.

## When to Use

- During `/init-project setup` or `/init-project refresh` to scaffold project rules
- When the user asks "find a rule for X" or "is there a rule for X"
- After `@stack-detector` has produced a stack fingerprint, before `project-config-composer` runs
- To extend project conventions with stack-specific guidance

## Multi-Source Search Strategy

| Source | Search Method | Signal |
|--------|--------------|--------|
| **Local templates** | `ls ~/.config/opencode/rule-templates/*/` | Known-good templates |
| **GitHub** | `gh search repos --topic opencode-rules --topic agent-rules` | Stars, description |
| **skills.sh** | `npx skills search <term>` | Install count |

## Output

A list of rule candidates with installation status:

```json
{
  "rules": {
    "from_templates": [
      { "name": "coding-style", "template": "coding-style/typescript.md", "status": "available" },
      { "name": "framework", "template": "framework/nextjs.md", "status": "available" },
      { "name": "testing", "template": "testing/vitest.md", "status": "available" }
    ],
    "from_registries": [
      { "name": "prisma-conventions", "source": "github:user/rules", "status": "found" }
    ],
    "selected": [
      "coding-style", "framework", "testing", "api-design"
    ]
  }
}
```

## Integration with /init-project

After `stack-recommender` produces the rule recommendations, `find-rules` is called to:
1. Check which recommended rules have local templates
2. Search registries for rules without local templates
3. Present findings for user selection
4. Pass selected rule list to `project-config-composer` for generation

## How to Choose the Right Rule

1. **Fit** — Does the rule address an actual convention need for this stack?
2. **Specificity** — Prefer rules that are specific to the framework/library over generic ones
3. **Template quality** — Local templates are preferred

## Installation

Rules are generated (not installed from registries) by `project-config-composer` into `.opencode/rules/`.

## Security & Privacy

- Issues read-only HTTP GETs to public APIs
- Local template scanning reads files only
