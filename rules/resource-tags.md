# Resource Tagging Convention

Tags provide metadata-based filtering for OpenCode global resources. They enable per-project configs to selectively activate only relevant skills, agents, rules, and commands — reducing context pollution.

## Tag Locations

Tags can appear in the frontmatter of any resource type:

| Resource Type | File                | Frontmatter Field     | Example                                                  |
|---------------|---------------------|------------------------|----------------------------------------------------------|
| Skill         | `SKILL.md`          | `tags` (YAML list)     | `tags: [typescript, react, nextjs, tailwind]`            |
| Agent         | `<name>.md`         | `tags` (YAML list)     | `tags: [testing, vitest, playwright]`                    |
| Rule          | `<name>.md`         | `tags` (YAML list)     | `tags: [conventions, nextjs]`                            |
| Archetype     | `manifest.json`     | `tags` (JSON array)    | `"tags": ["typescript", "react", "nextjs", "webapp"]`    |

## Tag Vocabulary

Use lowercase, single-word tags. Hyphens for compound terms.

### Language Tags
`typescript`, `javascript`, `python`, `rust`, `go`, `java`, `kotlin`, `ruby`, `php`, `csharp`, `swift`, `cpp`, `elixir`, `zig`

### Framework Tags
`react`, `nextjs`, `vue`, `nuxt`, `svelte`, `sveltekit`, `solid`, `solidstart`, `astro`, `angular`, `django`, `fastapi`, `flask`, `rails`, `spring`, `laravel`, `phoenix`, `express`, `fastify`, `hono`

### Domain Tags
`webapp`, `api`, `cli`, `library`, `mobile`, `desktop`, `monorepo`, `backend`, `frontend`, `fullstack`, `ui`, `database`, `devops`

### Tool Tags
`testing`, `vitest`, `jest`, `playwright`, `cypress`, `pytest`, `storybook`, `tailwind`, `prisma`, `docker`, `kubernetes`, `github-actions`, `ci-cd`, `nix`, `uv`, `just`

### Function Tags
`conventions`, `patterns`, `tutorial`, `reference`, `workflow`, `automation`, `scaffolding`, `review`, `security`, `performance`

### Meta Tags
`init`, `config`, `provisioning`, `stack`, `detection`, `skills-management`, `agents-management`

## Per-Project Filtering

A project's `opencode.jsonc` can include or exclude global resources by tag:

```jsonc
{
  "resource_tags": {
    "include": ["typescript", "react", "nextjs", "tailwind"],
    "exclude": ["python", "rust", "go"]
  }
}
```

- `include`: only resources with ANY matching tag are active
- `exclude`: resources with ANY matching tag are suppressed (takes precedence)
- If neither is specified, all global resources are available (current behavior)
- If only `include` is specified, resources with no tags are excluded
- If only `exclude` is specified, resources with no tags are included

## Validation Rules

1. Every skill SHOULD have at least 2 tags (language + domain at minimum)
2. Tags MUST be in the vocabulary above (or follow the same conventions)
3. Tags MUST be lowercase, no spaces, hyphens for compound terms
4. No duplicate tags within a single resource
5. Archetype tags should match the resource tags it would filter for

## Convention Enforcement

- `tag-resources` skill scans all resources and suggests missing tags
- `/harvest-context rule` uses tags to organize generated rules
- `stack-recommender` maps stack dimensions to tag-based resource recommendations
- `project-config-composer` uses `resource_tags` to generate per-project configs
