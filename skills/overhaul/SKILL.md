---
name: overhaul
description: Analyze an existing project across multiple dimensions and produce a prioritized implementation plan for targeted refinement
level: 3
---

# Overhaul — Project Refinement Planning

Analyzes an existing codebase across configurable dimensions (architecture, performance, security, code quality, testing, dependencies, tech debt, developer experience) and produces a concrete, prioritized implementation plan for targeted improvement.

## When to Use

- An existing project feels "messy" and you want a systematic plan to clean it up
- You're preparing for a major release and need to harden the codebase
- You're inheriting a codebase and need to map what needs fixing
- Performance, security, or quality concerns have accumulated
- You want to reduce tech debt before adding new features

## No-Argument Behavior

When invoked without arguments (`/ideation overhaul`), start an interactive session:
1. List the available refinement dimensions
2. Ask which dimensions to analyze (choose one or many)
3. Run analysis on selected dimensions
4. Synthesize a prioritized implementation plan

## With Dimension Argument

When invoked with a dimension filter (`/ideation overhaul:arch`, `/ideation overhaul:perf`, etc.), skip the dimension selection and analyze only that dimension.

## Refinement Dimensions

Each dimension analyzes distinct concerns and produces a dedicated section in the final plan. The subcommand name following the colon determines which dimension to run:

| Subcommand Pattern | Dimension | What It Analyzes |
|---|---|---|
| `/ideation overhaul` or `overhaul:full` | **Comprehensive** | All 8 dimensions |
| `overhaul:arch` | **Architecture** | Project structure, layering, coupling, patterns, boundaries |
| `overhaul:perf` | **Performance** | Bottlenecks, N+1 queries, caching, bundle size, algorithmic efficiency |
| `overhaul:sec` | **Security** | OWASP Top 10, secrets exposure, input validation, auth patterns, dependency CVEs |
| `overhaul:quality` | **Code Quality & Tech Debt** | Style consistency, naming, complexity, duplication, TODOs, dead code |
| `overhaul:testing` | **Testing** | Coverage gaps, test quality, missing test types, CI integration |
| `overhaul:deps` | **Dependencies** | Outdated packages, unused deps, vulnerability scanning, peer dep conflicts |
| `overhaul:dx` | **Developer Experience** | Build times, config complexity, documentation gaps, onboarding friction, tooling |

## Workflow

### Phase 1: Scan & Analyze

For each selected dimension, use the codebase analysis techniques listed below. Use `@explore`, `Glob`, `Grep`, and `Read` tools to gather evidence. Focus on concrete findings — specific files, patterns, and metrics — not general impressions.

#### Architecture (`arch`)
- Map the project's directory structure and top-level module organization
- Identify layers: are they cleanly separated? Any circular dependencies?
- Check for god objects, god modules, or files > 800 lines
- Evaluate import/export patterns: barrel files, re-exports, deep import chains
- Look for missing or stale architectural boundaries (e.g., mixed concerns in a single module)
- Check for adherence to chosen framework conventions (Next.js pages vs app dir, Django apps, etc.)

**Output for this dimension:**
- Current architecture diagram (text-based)
- 3-5 specific architectural issues with file references
- For each: severity (low/med/high), impact description, recommended change

#### Performance (`perf`)
- Scan for common performance anti-patterns in the detected tech stack
- Check for N+1 query patterns (ORM usage without eager loading)
- Identify large bundle imports (look for `import *` or full library imports)
- Scan for missing caching, repeated computations, expensive operations in hot paths
- Check for synchronous blocking operations in async contexts
- Look for oversized assets, unoptimized images, missing lazy loading

**Output for this dimension:**
- 3-5 specific performance issues with file references
- For each: severity, expected improvement magnitude, recommended change
- Quick wins (low effort, high impact) flagged separately

#### Security (`sec`)
- Scan for hardcoded secrets, API keys, tokens, passwords in code and config files
- Check for SQL injection vectors (raw SQL queries, string interpolation in queries)
- Look for XSS vulnerabilities (unsafe HTML rendering, missing sanitization)
- Check authentication/authorization patterns (missing guards, hardcoded roles, insecure defaults)
- Scan for command injection (shell execution with user input)
- Check dependency security (look for known-vulnerable versions)
- Check for missing input validation on user-facing endpoints

**Output for this dimension:**
- 3-5 specific security issues with file references
- For each: severity (critical/high/med/low), exploit scenario, recommended fix
- Critical/high items MUST be actionable and precise

#### Code Quality & Tech Debt (`quality`)
- Scan for files exceeding size thresholds (800+ lines, 400+ lines warning)
- Check for deep nesting (4+ levels of indentation)
- Identify duplicated code blocks (similar patterns across files)
- Scan for TODOs, FIXMEs, HACKs, XXX comments
- Check naming conventions consistency across the codebase
- Look for dead code (unused exports, commented-out code, orphaned files)
- Check for missing error handling (bare `try {} catch {}`, unhandled promise rejections)
- Assess mutation patterns vs immutability

**Output for this dimension:**
- Summary metrics (file count by category, TODO count, avg complexity)
- 5-8 specific quality issues with file references
- For each: severity, refactoring effort (small/medium/large), recommended change
- Quick wins flagged separately

#### Testing (`testing`)
- Scan for test files and map test types present (unit, integration, e2e)
- Calculate approximate test file to source file ratio
- Check for missing tests on critical paths (auth, payments, data mutation)
- Look for test quality issues: snapshot-only tests, missing assertions, over-mocking
- Check for flaky test patterns (timeouts, shared mutable state, date-dependent tests)
- Evaluate CI integration (is testing automated? what's the feedback time?)
- Check edge case coverage (null inputs, empty states, error conditions, boundary values)

**Output for this dimension:**
- Test coverage assessment (estimated, not exact)
- 3-5 specific testing gaps with file references
- For each: risk level, recommended test type, what scenarios to cover
- CI improvement suggestions if applicable

#### Dependencies (`deps`)
- Scan `package.json`, `requirements.txt`, `go.mod`, `Cargo.toml`, `Gemfile`, etc.
- Identify outdated major/patch versions
- Check for unused dependencies (import scan vs declared deps)
- Look for duplicate or conflicting dependencies
- Check peer dependency alignment
- Identify dependencies with known security issues
- Assess dependency count: are there too many? Can any be replaced with native APIs?
- Check for pinned vs ranged versions — is the project too strict or too loose?

**Output for this dimension:**
- Full dependency inventory categorized (up-to-date, outdated, unused, vulnerable)
- 3-5 specific dependency actions with rationale
- For each: effort, risk, benefit, recommended version/alternative

#### Developer Experience (`dx`)
- Check build times and build config complexity
- Look for missing or stale README, CONTRIBUTING, local development docs
- Check linting/prettier configuration and consistency
- Evaluate dev server / hot reload setup
- Check for missing or broken tooling (Docker, Makefile, pre-commit hooks)
- Look for environment variable documentation and .env.example
- Assess onboarding steps: what would a new developer need to do?
- Check for missing or outdated scripts in package.json or Makefile

**Output for this dimension:**
- 3-5 specific DX friction points
- For each: friction level, affected audience (new devs / all devs), recommended change
- Quick wins (5-minute fixes) flagged separately

### Phase 2: Prioritize

After gathering findings across all selected dimensions, synthesize them into a prioritized plan:

1. **Triage by severity**: critical/blocker → high → medium → low → nice-to-have
2. **Group by effort**: quick wins (minutes), short (hours), medium (days), large (weeks)
3. **Identify dependencies**: some fixes must precede others (e.g., upgrade Node before adopting new async patterns)
4. **Propose phases**: 3-4 implementation phases with clear scope and estimated effort

### Phase 3: Produce Implementation Plan

Generate a structured, actionable plan stored to `.opencode/state/ideation/work-products/`:

```markdown
# Overhaul Plan: [Project Name]

**Generated:** {timestamp}
**Dimensions analyzed:** [list of dimensions]

## Executive Summary
[2-3 paragraph overview of key findings and recommended approach]

## Critical Issues (Must Fix)
| Issue | Dimension | Severity | Effort | File(s) |
|-------|-----------|----------|--------|---------|
| ...   | ...       | critical | 2h     | ...     |

## Quick Wins (High Impact, Low Effort)
| Issue | Dimension | Effort | Impact | File(s) |
|-------|-----------|--------|--------|---------|
| ...   | ...       | 15m    | high   | ...     |

## Implementation Phases

### Phase 1: Foundation (Estimated: {effort})
- [ ] Issue 1 — {recommended change}
- [ ] Issue 2 — {recommended change}
- [ ] Issue 3 — {recommended change}

### Phase 2: Core Improvements (Estimated: {effort})
- [ ] Issue 4 — {recommended change}
- [ ] Issue 5 — {recommended change}
- [ ] Issue 6 — {recommended change}

### Phase 3: Polish (Estimated: {effort})
- [ ] Issue 7 — {recommended change}
- [ ] Issue 8 — {recommended change}

## Dimension Reports
{one section per analyzed dimension with the detail from Phase 1}

## Deferred Items
- [ ] Item 1 — why deferred
- [ ] Item 2 — why deferred

## Orchestration Handoff
This plan can be executed via `/orchestrate`:
- `/orchestrate plan-execute "Phase 1: Foundation tasks"`
- `/orchestrate ralph "fix all critical security issues"`
- `/orchestrate ultrawork "run all quick wins in parallel"`
```

### Step 4: Iterate Until Approved

Present the plan to the user. At each checkpoint:
- Summarize key findings
- Ask: "Does this plan capture everything? Any dimensions to add or remove? Shall I finalize?"
- Only proceed to finalization when user explicitly approves

### Step 5: Finalize and Report

On user approval:
1. Save the plan to `.opencode/state/ideation/` as a final artifact
2. Report inline with the plan summary
3. Offer to hand off to `/orchestrate` for execution

## Resume Behavior

`/ideation resume` checks `.opencode/state/ideation/work-products/` for in-progress overhaul plans and offers to continue.

## Output

The final output is a markdown implementation plan saved to `.opencode/state/ideation/` containing:
- Executive summary
- Critical and high-priority findings
- Quick wins
- Phased implementation plan with estimated effort
- Per-dimension detail sections
- Orchestration hand-off recommendations

## Red Flags

- **Don't fabricate findings** — if you can't find evidence for an issue, say so. Cite specific files.
- **Don't produce a vague plan** — every recommendation must include a specific file path, change description, and rationale.
- **Don't skip severity triage** — not everything is critical. Be honest about what matters and what doesn't.
- **Don't propose architectural rewrites** unless the current architecture is genuinely blocking development. Incremental > big bang.
- **Don't analyze dimensions the user didn't ask for** — respect the scope.

## Verification Checklist

- [ ] Concrete findings with file paths for every issue
- [ ] Severity and effort estimates for each issue
- [ ] Phased implementation plan (3-4 phases)
- [ ] Quick wins section (high impact, low effort)
- [ ] Deferred items section with rationale
- [ ] User approved the plan before finalization
- [ ] Plan saved to `.opencode/state/ideation/`
- [ ] Orchestration hand-off options included

## Related

- `/orchestrate` — Execute the overhaul plan
- `/harvest-context` — Extract overhaul context for documentation
- `/ideation deep` — Deep-dive specific issues identified in the plan
- `/project converge` — Quality gate convergence after implementation