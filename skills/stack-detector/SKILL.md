---
name: stack-detector
description: Deep codebase stack analysis — detect languages, frameworks, build tools, testing frameworks, ORMs, CSS approach, CI/CD, and containerization, producing a structured stack fingerprint. Use before recommending skills/rules/tools for a project, or whenever downstream config decisions need a reliable picture of what a codebase actually uses.
level: 2
license: MIT
allowed-tools: Read, Glob, Grep, Bash
---

# Stack Detector

Detection only — never modify code, generate configs, or make recommendations from here (that's `stack-recommender`'s job downstream). An incomplete or wrong fingerprint cascades into every config decision that reads it, so check every dimension below even when the codebase looks obviously single-stack.

## Detection dimensions

Check file existence, file content, and dependency manifests for each:

| Dimension | Look at |
|---|---|
| Language & runtime | `tsconfig.json`, `pyproject.toml`, `Cargo.toml`, `go.mod`, `build.gradle`, `Gemfile`, `composer.json`, `.csproj` |
| Framework | package.json deps, framework config files, directory conventions (e.g. Next.js `app/` vs `pages/`) |
| Build tools | `vite.config.*`, `webpack.config.*`, `next.config.*`, `.babelrc`, `nx.json`, `turbo.json` |
| Package manager | lockfile format (`package-lock.json`, `pnpm-lock.yaml`, `bun.lock`, `poetry.lock`, `Cargo.lock`, `go.sum`) |
| CSS/styling | `tailwind.config.*`, `postcss.config.*`, CSS import patterns |
| Testing | `vitest.config.*`, `jest.config.*`, `playwright.config.*`, `pytest.ini`; unit vs. integration vs. e2e |
| Database/ORM | `schema.prisma`, `drizzle.config.*`, `ormconfig.*`, `models/`/`migrations/` |
| API/networking | tRPC routers, `schema.graphql`, `openapi.yaml`, REST conventions |
| Auth | NextAuth/Auth.js/Lucia/Clerk/Supabase/Firebase config, package.json deps |
| CI/CD | `.github/workflows/`, `.gitlab-ci.yml`, `Jenkinsfile`, deploy platform config |
| Containerization/IaC | `Dockerfile`, `docker-compose.yml`, `k8s/`, `*.tf`, `serverless.yml` |
| Monorepo tooling | `nx.json`, `turbo.json`, `lerna.json`, `pnpm-workspace.yaml`, workspaces field |
| Linting/formatting | `.eslintrc.*`, `.prettierrc*`, `biome.json`, `pyproject.toml` lint config |
| Mobile (if applicable) | `app.json`/Expo config, `pubspec.yaml`, `Podfile`, `android/`/`ios/` |

## Output format

Return **only** the JSON fingerprint — no commentary, no markdown outside the code block:

```json
{
  "detected": true,
  "projectType": "webapp | cli | library | api | mobile | monorepo | unknown",
  "fingerprint": {
    "language": { "primary": "typescript", "runtimes": ["node"], "versionConstraints": {} },
    "framework": { "name": "nextjs", "version": "15.0", "mode": { "appDir": true } },
    "buildTool": { "name": "turbopack", "configFiles": [] },
    "packageManager": { "name": "pnpm", "lockfile": "pnpm-lock.yaml" },
    "styling": { "approach": "tailwind", "version": "4" },
    "testing": { "frameworks": [{ "name": "vitest", "type": "unit", "configFile": "" }] },
    "database": { "orm": "prisma", "database": "postgresql" },
    "cicd": { "platforms": ["github-actions"], "workflowCount": 3 },
    "containerization": { "docker": true, "compose": true, "kubernetes": false },
    "monorepo": { "tool": null, "workspaceCount": 0 },
    "codeQuality": { "linter": "eslint", "formatter": "prettier" },
    "detectedFiles": [],
    "configRoot": "/absolute/path"
  }
}
```
Empty/undetectable project → `{ "detected": false, "projectType": "unknown", "fingerprint": null, "note": "..." }`.
Any dimension you couldn't check goes in a `_warnings` array under `evidence`, not silently omitted.

## Rules

- Always absolute paths.
- Version info captured wherever a lockfile or config exposes it (especially major-version-sensitive cases like Tailwind v3 vs v4).
- Caller should be able to proceed without asking a follow-up question about the stack.

## Related

- `stack-recommender` — consumes this fingerprint to recommend skills/agents/rules
- `convention-extractor` — the companion pass for *how* the code is written, not *what* it uses
