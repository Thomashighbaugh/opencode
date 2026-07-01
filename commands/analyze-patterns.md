---
description: Analyze code patterns and anti-patterns in the codebase — repeated patterns, inconsistencies, convention violations, with recommendations
argument-hint: "<scope>"
---

# Analyze Patterns

Analyzes code patterns and anti-patterns across a scope (file, directory, or module). Invoked via `/project analyze <scope>`.

## Workflow

1. **Identify the scope**: parse `$ARGUMENTS` for the file, directory, or module to analyze. If no scope given, analyze the whole `src/` directory (or equivalent).

2. **Scan for pattern categories**:

   | Category | What to detect |
   |----------|---------------|
   | **Repeated patterns** | Same logic implemented multiple times — a candidate for extraction (DRY). E.g. error wrapping in every route handler, same validation in every service. |
   | **Anti-patterns** | Known-bad patterns: God objects, deep inheritance hierarchies, global mutable state, tight coupling via imports, circular dependencies. |
   | **Inconsistent patterns** | Same problem solved different ways — e.g. some routes use try/catch, others use middleware; some modules export a class, others a factory function. |
   | **Convention violations** | Naming (camelCase vs snake_case mixed), file organization (utils in different places), error handling (some throw, some return null, some return Result), testing style mismatches. |
   | **Dead patterns** | Patterns that exist but are no longer used — deprecated abstractions, unused interfaces, old-style code that new code doesn't follow. |

3. **For each finding**:
   - Location: file:line(s) where the pattern appears.
   - Classification: repeated / anti-pattern / inconsistent / convention violation / dead.
   - Severity: high (causes bugs or major confusion), medium (maintenance friction), low (cosmetic).
   - Recommendation: what to do — extract, refactor, standardize, or document as intentional.

4. **Generate report**: organize findings by category, then by severity within each category. Include:
   - Pattern summary (what the pattern is).
   - Occurrences (where it appears, with file:line).
   - Recommendation (extract to X, standardize on Y, refactor to Z).
   - Effort estimate: quick fix (< 30 min), moderate (hours), significant (days).

5. **Save report**: write to `.opencode/state/project-patterns-{timestamp}.md` for reference.

## Constraints

- This is analysis only — do NOT modify any code. Read-only.
- Do NOT flag patterns as bad just because they differ from the agent's preference. Only flag genuine issues: actual repetition, actual anti-patterns, actual inconsistencies. Respect the project's established conventions — if the whole codebase uses pattern X, that's the convention, not an inconsistency.
- Distinguish "intentional inconsistency" (different contexts warrant different approaches) from "accidental inconsistency" (someone forgot the convention). When unclear, note both interpretations.
- Effort estimates should be rough but realistic — don't estimate "5 minutes" for a refactor that touches 20 files.

## Output

- Pattern analysis report saved to `.opencode/state/`.
- Console summary: count per category, top 5 highest-severity findings.
- No code changes (read-only analysis).