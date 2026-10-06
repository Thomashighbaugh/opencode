---
name: stack-recommender
description: Maps a stack fingerprint (from @stack-detector or direct input) to recommended global OpenCode resources — skills, agents, rules, commands — and a hint pack. Hint packs are starting points; provisioning researches the codebase. Used by /hub-setup setup and refresh to provision per-project configs.
level: 2
license: MIT
tags: [init, config, detection, stack, provisioning]
---

# Stack Recommender

Maps a technology stack fingerprint to recommended OpenCode global resources — skills, agents, rules, commands — and selects a **hint pack**. A hint pack is a starting point, never a copy payload: see "Hint Packs, Research & Local Availability".

## When to Use

- After `@stack-detector` has produced a stack fingerprint for `/hub-setup detect`
- During `/hub-setup setup` and `/hub-setup refresh` to compose the right resource set
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
    "hint_pack": "nextjs-webapp",
    "hints": [
      "Default to the App Router and React Server Components.",
      "TypeScript strict; no implicit any."
    ],
    "research": [
      "Context7: Next.js App Router + Tailwind",
      "SearXNG: \"next.js app router best practices 2026\""
    ],
    "preferences": ["preferences/language-selection", "preferences/package-managers-runtimes"],
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

| Framework         | Skills                                              | Agents               | Rules          | Hint pack       |
|-------------------|-----------------------------------------------------|-----------------------|----------------|-----------------|
| Next.js           | react-key-prop, context7-docs, mui                   | test-engineer         | testing.md     | nextjs-webapp   |
| Nuxt              | context7-docs                                       | test-engineer         | testing.md     | —               |
| SvelteKit         | context7-docs                                       | test-engineer         | testing.md     | —               |
| FastAPI           | —                                                   | test-engineer         | testing.md     | python-api      |
| Django            | —                                                   | test-engineer         | testing.md     | python-api      |
| Rails             | —                                                   | test-engineer         | testing.md     | —               |
| Express/Fastify   | —                                                   | test-engineer         | testing.md     | —               |
| OpenCode config   | opencode-configure, opencode-plugin-creator           | —                     | —              | —               |
| OpenCode plugin   | opencode-plugin-creator, hooks, hook-developer        | —                     | —              | —               |

### CSS Approach → Skills

| CSS Approach | Skills                                       |
|--------------|----------------------------------------------|
| Tailwind     | (Tailwind v4 docs via context7-docs)          |
| MUI          | mui                                          |
| CSS Modules  | —                                            |
| styled-components | —                                       |
| Emotion      | —                                            |

### TUI/CLI Framework → Skills

| Framework      | Skills         |
|----------------|----------------|
| OpenTUI/Ink    | opentui        |
| Blessed/blessed | opentui       |
| Textual        | —              |

### Build Tool → Skills

| Build Tool    | Skills                                        |
|---------------|-----------------------------------------------|
| Turborepo/Nx  | —                                              |
| Vite          | —                                              |
| Webpack       | —                                              |

### Testing → Resources

| Testing Framework | Agents        | Skills                                        |
|-------------------|---------------|-----------------------------------------------|
| Vitest            | test-engineer | vitest, test-coverage-improver                |
| Jest              | test-engineer | test-coverage-improver                        |
| Playwright        | test-engineer | —                                              |
| Cypress           | test-engineer | —                                              |
| Pytest            | test-engineer | —                                              |

### Monorepo → Hint pack

| Tool       | Hint pack              |
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

### CI/CD → Resources

| Platform        | Skills                                          |
|-----------------|-------------------------------------------------|
| GitHub Actions  | ci-cd-and-automation, github-actions, devops-engineer |
| GitLab CI       | devops-engineer                                 |
| CircleCI        | devops-engineer                                 |

### Agent/Tool Development → Skills

| System              | Skills                                                       |
|---------------------|--------------------------------------------------------------|
| Agent definitions   | custom-agent-definitions, opencode-agent-creator               |
| SDK/Tool dev        | opencode-sdk-development                                      |

### Hook/Plugin Development → Skills

| System   | Skills                                    |
|----------|-------------------------------------------|
| Hooks    | hooks, hook-developer, scaffold-hooks      |
| Plugins  | opencode-plugin-creator, opencode-sdk-development |

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
    "hint_pack": "nextjs-webapp",
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

## Hint Packs, Research & Local Availability

Hint packs live at `templates/projects/*/manifest.json` and carry three things:

| Field         | Meaning                                                                    |
|---------------|----------------------------------------------------------------------------|
| `hints`       | Generalized conventions — a starting point, never a terminus                |
| `research`    | Pointers: docs URLs, query templates, registries (Context7 / SearXNG / gh_grep) |
| `preferences` | The user's opinionated set for this domain (see `.opencode/context/preferences/`) |

Rules:

1. **A hint pack is non-terminal.** If the specific you need is not in the pack, research it — do not stop, and do not silently fall back to bare defaults.
2. **Local availability is checked explicitly.** Before researching, enumerate `templates/projects/*` and record `{found: [...], none: bool}` in the recommendations so provisioning knows whether a local starting point existed.
3. **Nothing is copied.** Provisioning synthesizes project config from the codebase + hints + research; the pack never ships as-is.
4. **Research lands in `.opencode/context/research/`** — the existing research cache, never a new namespace.

## Workflow

1. **Receive the fingerprint** — either from `@stack-detector` output or direct user input
2. **Apply mapping tables** — iterate through each detection dimension and collect matching resources (skills, agents, rules, tools, fine_rules, hint_pack)
3. **Detect gaps** — identify stacks with no matching global resources and flag them in `gaps`
4. **Select a hint pack** — choose the best-matching pack from `templates/projects/*/manifest.json` (see the matching tables above). A hint pack is a **starting point, not a copy payload**: its `hints`, `research`, and `preferences` inform what to generate, but no `agents/`, `rules/`, `skills/`, or `tools/` directories are copied. If the pack lacks the specific you need, continue to step 5.
5. **Check local availability, then research** — enumerate local hint packs and record `{found: [...], none: bool}`. Where the pack is absent, silent, or insufficient, research the actual setup: Context7 (framework/convention docs), SearXNG (stack best practices), gh_grep (real-world config precedents). Cache findings under `.opencode/context/research/`.
6. **De-duplicate and prioritize** — remove duplicate resource references and order by relevance.
7. **Return recommendations** — structured JSON with `hint_pack`, `hints`, `research`, `preferences`, skills, agents, rules, tools, fine_rules, commands, gaps, and notes. `project-config-composer` **synthesizes** from these; it never copies a pack.
8. If calling from `/init-project`, pass the recommendations to `project-config-composer` for `.opencode/` generation
9. If `tools` or `fine_rules` are present, `find-tools` and `find-rules` can be called to search registries for additional resources not in the local template catalog

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
3. If description is too vague, use `/ideate-hub grill` to sharpen it first
