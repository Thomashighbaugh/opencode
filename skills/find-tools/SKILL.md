---
name: find-tools
description: Discover, vet, and generate project-relevant OpenCode tools by searching registries (GitHub, npm) and local template catalog. Used by /init-project setup/refresh to provision project-specific tools alongside skills and agents.
tags: [init, config, provisioning, tools, scaffolding]
---

# Find Tools

Find and generate the right OpenCode tools for a project's tech stack by searching registries, scanning local templates, and presenting candidates for installation.

## When to Use

- During `/init-project setup` or `/init-project refresh` to scaffold project tools
- When the user asks "find a tool for X" or "is there a tool for X"
- After `@stack-detector` has produced a stack fingerprint, before `project-config-composer` runs
- To extend project capabilities with TypeScript-based utilities

## Multi-Source Search Strategy

| Source | Search Method | Signal |
|--------|--------------|--------|
| **Local templates** | `ls ~/.config/opencode/tool-templates/*/` | Known-good templates |
| **GitHub** | `gh search repos --topic opencode-tools --topic agent-tools --topic skills` | Stars, description |
| **npm** | `npm search opencode-tool` | Downloads, description |
| **skills.sh** | `npx skills search <term>` | Install count |

## Output

A list of tool candidates with installation status:

```json
{
  "tools": {
    "from_templates": [
      { "name": "project-info", "template": "universal/project-info.ts", "status": "available" },
      { "name": "run-checks", "template": "universal/run-checks.ts", "status": "available" },
      { "name": "type-check", "template": "typescript/type-check.ts", "status": "available" }
    ],
    "from_registries": [
      { "name": "db-migrate", "source": "github:user/tool", "status": "found" }
    ],
    "selected": [
      "project-info", "run-checks", "type-check"
    ]
  }
}
```

## Integration with /init-project

After `stack-recommender` produces the tool recommendations, `find-tools` is called to:
1. Check which recommended tools have local templates
2. Search registries for tools without local templates
3. Present findings for user selection
4. Pass selected tool list to `project-config-composer` for generation

## How to Choose the Right Tool

1. **Fit** — Does the tool's described behavior match the real need?
2. **Template quality** — Local templates are preferred over registry tools
3. **Maintenance** — Check recent updates for registry tools
4. **Safety** — Review tool permissions (what bash/edit access does it request?)

## Installation

Tools are generated (not installed from registries) by `project-config-composer` into `.opencode/tools/`. Registry tools are suggested for manual review.

## Security & Privacy

- Issues read-only HTTP GETs to public APIs
- Local template scanning reads files only
- Never executes tool code during search
