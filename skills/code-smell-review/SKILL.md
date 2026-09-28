---
name: code-smell-review
description: Focused code review by smell-taxonomy and file-type context — security, performance, architecture, concurrency, error handling, accessibility, and dependency smells, prioritized by severity. Use for a systematic pass distinct from Claude Code's own general code-review, when a structured smell checklist matters more than a free-form review.
level: 2
license: MIT
---

# Code Smell Review

Recovered from the OpenCode "code-reviewer" agent — its value wasn't the review itself, it was the smell taxonomy below. Assume the code has issues and hunt for them systematically; a review that finds nothing but never looked for what's missing isn't a review.

## Process

1. Get the diff (`git diff` on the current branch, or the specified files).
2. Detect file-type/pattern context and prioritize the matching smell categories (table below).
3. Scan against every smell table, not just the context-prioritized ones.
4. Select the top 5 most concerning findings — security → performance → broken UX → bugs → nits.
5. Synthesize: **What** (the issue), **Where** (file:line), **Why** (impact).

## Context-aware prioritization

| Context detected | Prioritize |
|---|---|
| `.test.ts`/`.spec.ts`/`__tests__` | Testing, coverage, error handling |
| `async`/`await`/`Promise` | Concurrency, error handling, performance |
| React components (`.tsx`/`.jsx`) | Accessibility, state, performance, hooks |
| Database queries (SQL/ORM) | Performance (N+1), security (injection), transactions |
| API routes/endpoints | Security, API contract, error handling, observability |
| `try/catch` blocks | Error handling, logging |
| Config files | Dependency, security (hardcoded secrets) |
| Any `any` type | Code quality, type safety |

## Smell tables

**Security** (OWASP-shaped): broken access control (missing authz, IDOR), cryptographic failures (weak hashing/random), injection (SQL/NoSQL/command via user input), insecure design, security misconfiguration (defaults, verbose errors), auth failures (weak sessions), data integrity (unsigned JWTs), logging failures (sensitive data in logs), SSRF (unvalidated URLs). Also: input validation, secret exposure, timing attacks.

**Performance**: N+1 queries, missing indexes, synchronous external calls blocking threads, in-memory state that won't scale horizontally, unbounded collections without pagination, missing connection pooling/rate limiting.

**Architecture** (SOLID): multiple reasons to change, requires modification to extend, god objects (>500 lines or >20 methods), anemic domain models, shotgun surgery, feature envy.

**Code quality**: cyclomatic complexity >10, nested conditionals (use guard clauses), functions >50 lines, DRY violations that actually hurt maintainability, missing error handling, unclear naming.

**Concurrency**: race conditions (shared state without locks), deadlocks (lock ordering, circular waits), thread-unsafe singletons, missing await/async error handling, resource leaks, unhandled promise rejection, mutable shared state in async functions.

**Error handling**: swallowed exceptions (empty catch), overly generic catch-all, missing error context, inconsistent error types, silent failures, errors caught and ignored without justification, missing `finally` cleanup.

**Data & state**: mutable global state, mutable function arguments, magic numbers/strings, missing null/undefined checks, state mutation in getters, shallow-copy-when-deep-needed, stale cached data without invalidation.

**Accessibility** (frontend): missing ARIA labels, keyboard navigation gaps, color-only indicators, missing alt text, focus-management issues, insufficient contrast, unlabeled form inputs, missing skip links.

**Dependency**: unused imports, outdated packages with known CVEs, duplicate functionality (lodash vs native), missing peer deps, monorepo version conflicts, side effects from imports.

**Observability**: missing logging in critical paths, no metrics/monitoring hooks, hardcoded values that should be config, no feature flags for risky changes, missing health checks, unstructured log messages.

**Testing**: missing coverage for changed paths, no edge cases tested, error scenarios untested.

**API**: breaking changes without deprecation, missing schema validation, inconsistent error responses.

## Output

```
**What** — the issue
**Where** — file:line
**Why** — impact
```
Ordered: security → performance → broken UX → bugs → nits/suggestions.

## Rules

- Flag any standalone executable file at a project root or top-level directory (`./*.sh`, `./*.ts`, `./*.mjs`, `./*.py`, a root `./tools/` or `./scripts/`) as a smell — see `rules/file-operations.md`.
- Don't pad findings with praise; a clean file gets a one-line note, not silence and not manufactured nitpicks.

## Related

- Claude Code's native `code-review` skill — for a general-purpose review pass; use this skill instead when the smell taxonomy's structure is specifically what's wanted
- `security-review` (native) — for a security-only deep dive
- `plan-critic` — for adversarial review of a plan or proposal rather than code
