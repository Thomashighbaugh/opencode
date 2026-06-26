---
name: stack-recommender
description: Maps a stack fingerprint (from @stack-detector or direct input) to recommended global OpenCode resources — skills, agents, rules, commands, archetypes. Used by /init-project setup and refresh to provision per-project configs.
tags: [init, config, detection, stack, provisioning]
---

# Stack Recommender

Maps a technology stack fingerprint to recommended OpenCode global resources — skills, agents, rules, commands, and archetypes — that should be activated for a project.

## When to Use

- After `@stack-detector` has produced a stack fingerprint for `/init-project detect`
- During `/init-project setup` and `/init-project refresh` to compose the right resource set
- When the user says "recommend skills for my [language/framework] project"
- Any time you need to know "what global resources apply to this tech stack?"

## Input

A stack fingerprint JSON object (as produced by `@stack-detector` or manually specified):

```json
{
  "fingerprint": {
    "language": { "primary": "typescript" },
    "framework": { "name": "nextjs", "version": "15", "mode": { "appDir": true } },
    "styling": { "approach": "tailwind" },
    "testing": { "frameworks": [{ "name": "vitest", "type": "unit" }, { "name": "playwright", "type": "e2e" }] },
    "database": { "orm": "prisma", "database": "postgresql" },
    "api": { "paradigm": "trpc" },
    "auth": { "library": "next-auth" },
    "buildTool": { "name": "turbopack" },
    "packageManager": { "name": "pnpm" },
    "monorepo": { "tool": "turborepo" },
    "cicd": { "platforms": ["github-actions"] }
  }
}
```

## Output

A resource recommendation object:

```json
{
  "recommends": {
    "archetype": "nextjs-webapp",
    "skills": [
      { "name": "mui", "reason": "React component library pattern guide" },
      { "name": "react-key-prop", "reason": "React list rendering best practices" },
      { "name": "typescript-interface-vs-type", "reason": "TypeScript type system conventions" },
      { "name": "context7-docs", "reason": "Framework docs lookup (Next.js, React)" },
      { "name": "naming-cheatsheet", "reason": "Language-agnostic naming conventions" }
    ],
    "agents": [
      { "name": "test-engineer", "reason": "Vitest + Playwright testing strategy" },
      { "name": "code-reviewer", "reason": "Code quality enforcement" }
    ],
    "rules": [
      "coding-style.md",
      "testing.md",
      "security.md"
    ],
    "commands": [],
    "notes": [
      "Consider creating a project-specific rule for Next.js app router conventions",
      "Prisma schema validation rule recommended but not available globally"
    ],
    "gaps": [
      { "type": "skill", "name": "nextjs-app-router", "reason": "No global skill for Next.js app router patterns" },
      { "type": "rule", "name": "prisma-conventions", "reason": "No global rule for Prisma schema conventions" }
    ]
  }
}
```

## Recommendation Mapping Tables

### Language → Resources

| Language    | Skills                                         | Agents             | Rules                     |
|-------------|------------------------------------------------|---------------------|---------------------------|
| TypeScript  | typescript-interface-vs-type, naming-cheatsheet | code-reviewer      | coding-style.md            |
| JavaScript  | naming-cheatsheet                              | code-reviewer      | coding-style.md            |
| Python      | —                                              | —                  | coding-style.md            |
| Rust        | —                                              | —                  | coding-style.md            |
| Go          | —                                              | —                  | coding-style.md            |

### Framework → Resources

| Framework    | Skills                                      | Agents               | Rules          | Archetype       |
|--------------|---------------------------------------------|-----------------------|----------------|-----------------|
| Next.js      | react-key-prop, context7-docs, mui           | test-engineer         | testing.md     | nextjs-webapp   |
| Nuxt         | context7-docs                               | test-engineer         | testing.md     | —               |
| SvelteKit    | context7-docs                               | test-engineer         | testing.md     | —               |
| FastAPI      | —                                           | test-engineer         | testing.md     | python-api      |
| Django       | —                                           | test-engineer         | testing.md     | python-api      |
| Rails        | —                                           | test-engineer         | testing.md     | —               |
| Express/Fastify | —                                        | test-engineer         | testing.md     | —               |

### CSS Approach → Skills

| CSS Approach | Skills                                       |
|--------------|----------------------------------------------|
| Tailwind     | (Tailwind v4 docs via context7-docs)          |
| MUI          | mui                                          |
| CSS Modules  | —                                            |
| styled-components | —                                       |
| Emotion      | —                                            |

### Build Tool → Skills

| Build Tool    | Skills                                        |
|---------------|-----------------------------------------------|
| Turborepo/Nx  | —                                              |
| Vite          | —                                              |
| Webpack       | —                                              |

### Testing → Agents

| Testing Framework | Agents       |
|-------------------|--------------|
| Vitest            | test-engineer |
| Jest              | test-engineer |
| Playwright        | test-engineer |
| Cypress           | test-engineer |
| Pytest            | test-engineer |

### Monorepo → Archetype

| Tool       | Archetype              |
|------------|------------------------|
| Turborepo  | nextjs-webapp (adjusted for monorepo) |
| Nx         | nextjs-webapp (adjusted for monorepo) |
| pnpm workspaces | —                |

### Language → Tools

| Language    | Recommended Tools                                      |
|-------------|--------------------------------------------------------|
| TypeScript  | universal/project-info, universal/run-checks, typescript/type-check |
| JavaScript  | universal/project-info, universal/run-checks           |
| Python      | universal/project-info, universal/run-checks, python/type-check |
| Rust        | universal/project-info, universal/run-checks, rust/type-check |
| Go          | universal/project-info, universal/run-checks, go/type-check |

### Database → Tools

| ORM/Tool | Recommended Tools |
|----------|-------------------|
| Prisma   | prisma/db-migrate |
| Drizzle  | drizzle/db-migrate |

### Containerization → Tools

| Tool    | Recommended Tools |
|---------|-------------------|
| Docker  | docker/docker-utils |

### Language → Fine-Grained Rules

| Language    | Recommended Rules                                              |
|-------------|---------------------------------------------------------------|
| TypeScript  | coding-style/typescript, testing/vitest (if vitest detected)   |
| JavaScript  | coding-style/typescript (subset)                               |
| Python      | coding-style/python, testing/pytest (if pytest detected)        |
| Rust        | coding-style/rust                                              |
| Go          | coding-style/go                                                |

### Framework → Fine-Grained Rules

| Framework | Recommended Rules |
|-----------|-------------------|
| Next.js   | framework/nextjs  |
| FastAPI   | framework/fastapi  |

### API Paradigm → Fine-Grained Rules

| Paradigm | Recommended Rules |
|----------|-------------------|
| REST     | api/rest          |
| tRPC     | api/trpc          |

### Database → Fine-Grained Rules

| ORM/Tool | Recommended Rules |
|----------|-------------------|
| Prisma   | database/prisma   |

### Testing → Fine-Grained Rules

| Framework  | Recommended Rules |
|------------|-------------------|
| Vitest     | testing/vitest    |
| Playwright | testing/playwright|

## Output Format (Extended)

The recommendation output now includes `tools` and `fine_rules` arrays:

```json
{
  "recommends": {
    "archetype": "nextjs-webapp",
    "skills": [...],
    "agents": [...],
    "rules": ["coding-style.md", "testing.md", "security.md"],
    "tools": [
      { "name": "universal/project-info", "reason": "TypeScript project info tool" },
      { "name": "universal/run-checks", "reason": "Universal check runner" },
      { "name": "typescript/type-check", "reason": "TypeScript type checking" },
      { "name": "prisma/db-migrate", "reason": "Prisma database migrations" }
    ],
    "fine_rules": [
      { "name": "coding-style/typescript", "reason": "TypeScript coding conventions" },
      { "name": "framework/nextjs", "reason": "Next.js framework conventions" },
      { "name": "api/trpc", "reason": "tRPC API conventions" },
      { "name": "database/prisma", "reason": "Prisma database conventions" },
      { "name": "testing/vitest", "reason": "Vitest testing conventions" },
      { "name": "testing/playwright", "reason": "Playwright e2e testing conventions" }
    ],
    "commands": [],
    "notes": [...],
    "gaps": [...]
  }
}
```

## Workflow

1. **Receive the fingerprint** — either from `@stack-detector` output or direct user input
2. **Apply mapping tables** — iterate through each detection dimension and collect matching resources (skills, agents, rules, tools, fine_rules, archetype)
3. **Detect gaps** — identify stacks with no matching global resources and flag them in `gaps`
4. **Select archetype** — choose the best-matching project archetype (see archetype matching table above)
5. **De-duplicate and prioritize** — remove duplicate resource references and order by relevance
6. **Return recommendations** — structured JSON with skills, agents, rules, tools, fine_rules, commands, archetype, gaps, and notes
7. If calling from `/init-project`, pass the recommendations to `project-config-composer` for `.opencode/` generation
8. If `tools` or `fine_rules` are present, `find-tools` and `find-rules` can be called to search registries for additional resources not in the local template catalog

## Integration

### From init-project hub

```mermaid
flowchart LR
    detect[@stack-detector] --> fingerprint[JSON Fingerprint]
    fingerprint --> recommender[stack-recommender]
    recommender --> recommendations[JSON Recommendations]
    recommendations --> composer[project-config-composer]
    composer --> dot_opencode[.opencode/ config files]
```

### From natural language

When a user says "I'm building a [description]" without a codebase:
1. Use `@stack-detector` with the description to construct a synthetic fingerprint
2. Pass through the same recommendation pipeline
3. If description is too vague, use `/ideation grill` to sharpen it first
