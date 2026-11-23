---
name: code-reviewer
description: Perform focused code review by detecting smells and deep-diving concerns
level: 3
license: MIT
---

# Code Reviewer

Use this skill when you need confidence that a change is free of real defects before it ships — security holes, performance smells, broken UX, bugs, and missing coverage.

## Goal

Turn "looks good" into concrete, prioritized findings: what's wrong, where (file:line), and why it matters.

## When to Use

- Reviewing a PR or diff before merge
- Reviewing your own output after implementing a feature
- Auditing a file or module for defects
- Checking that a refactor didn't introduce regressions

## Workflow

1. **Load context** — get the git diff or the file(s) to review
2. **Detect smells** — run through the smell tables below, prioritizing security → performance → broken UX → bugs → nits
3. **Load related skills** based on file types:
   - `.ts`, `.tsx` → `typescript-interface-vs-type`
   - `.tsx`, `.jsx` → `react-key-prop`
   - Any refactoring → `code-simplification`
4. **Delegate deep dives** — for each top-5 area, spawn a `code-reviewer` agent to investigate
5. **Synthesize** — one finding per line: What / Where (file:line) / Why (impact)

## Smell Categories

| Category | What to check |
|---|---|
| Security | Broken access control, injection, crypto failures, insecure design, misconfiguration, auth failures, data integrity, logging failures, SSRF, secret exposure |
| Performance | N+1 queries, missing indexes, blocking sync calls, unbounded collections, no connection pooling, no rate limiting |
| Architecture | SRP/OCP violations, god objects (>500 lines / >20 methods), anemic models, shotgun surgery, feature envy |
| Code Quality | Cyclomatic complexity > 10, nested conditionals, functions > 50 lines, DRY violations, missing error handling, unclear naming |
| Testing | Missing coverage for changed paths, no edge cases, error scenarios untested |
| API | Breaking changes without deprecation, missing schema validation, inconsistent error responses |
| Concurrency | Race conditions, deadlocks, thread-unsafe singletons, missing await, resource leaks, unhandled rejections |
| Error Handling | Swallowed exceptions, generic catch-all, missing error context, silent failures |
| Data & State | Mutable global state, magic numbers, missing null checks, stale cached data |
| Accessibility | Missing ARIA labels, keyboard gaps, color-only indicators, missing alt text, focus management |
| Dependencies | Unused imports, outdated packages with CVEs, duplicate functionality, missing peer deps, version conflicts |
| Observability | Missing logging, no metrics, hardcoded values, no feature flags, no health checks, unstructured logs |

## Context-Aware Priorities

Detect file types from the diff and prioritize:

| Detected | Prioritize |
|---|---|
| `.test.ts`, `.spec.ts`, `__tests__` | Testing, Coverage, Error Handling |
| `async`, `await`, `Promise` | Concurrency, Error Handling, Performance |
| React components (`.tsx`, `.jsx`) | Accessibility, State, Performance, Hooks |
| Database queries (SQL, ORM) | Performance (N+1), Security (injection), Transactions |
| API routes, endpoints | Security, API Contract, Error Handling, Observability |
| `try/catch` blocks | Error Handling, Logging |
| Configuration files | Dependency, Security (hardcoded secrets) |
| `any` type | Code Quality, Type Safety |

## Output

- **What** — The issue
- **Where** — File:line
- **Why** — Why it matters / impact

Prioritize: security → performance → broken UX → bugs → nits/suggestions. Max 1500 tokens. One finding per line, no narrative.

## Artifact Placement Check

Flag as a **smell** any standalone executable files at the project root:
- `./*.sh`, `./*.ts`, `./*.mjs`, `./*.py` at project root
- `./tools/` at project root (should be `.opencode/tools/`)
- `./scripts/` at project root (should be `.opencode/skills/{name}/scripts/`)

## Delegation

Delegates to the `code-reviewer` agent (subagent, read-only: `edit: deny`, `write: deny`) for systematic smell detection using the reasoning template at `templates/reasoning/cot-reviewer.md`.

## Related

- `code-simplification` — refactor code for clarity without changing behavior
- `ultraqa` — QA cycling: test, verify, fix, repeat until goal met
- `test-engineer` — test strategy and coverage scaffolding
