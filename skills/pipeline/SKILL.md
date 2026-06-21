---
name: pipeline
description: Declarative multi-stage pipeline — Stage 1: lint → Stage 2: test → Stage 3: build → Stage 4: deploy, each stage gates the next
---

# Pipeline

Declarative multi-stage pipeline with hard gates between stages. Each stage must pass before the next begins. Stages are: lint → test → build → deploy. Failed stages produce actionable diagnostics, not silent failures.

## When to Use

- You need a reliable, repeatable delivery pipeline
- Changes must pass quality gates before reaching production
- You want to automate the lint → test → build → deploy workflow
- CI/CD-style execution within the agent session
- Deploying code changes with confidence that each stage was verified

**Do not use when:**
- You need iterative development with feedback loops — use `ralph` or `tdd` instead
- The task is exploratory or research-oriented — use `/ideation` instead
- There is no deploy target or build step — use `plan-execute` instead
- You need parallel execution of independent tasks — use `ultrawork` instead

## Workflow

### Stage 1: Lint

Run all linting and formatting checks:

1. Identify the project's linter (ESLint, Prettier, ruff, black, etc.)
2. Run the linter with project configuration
3. If linting fails:
   - Collect all lint errors
   - Delegate to `@executor` to auto-fix fixable issues
   - Re-run linter
   - If unfixable issues remain, report them and **gate blocks** — do not proceed to Stage 2
4. If linting passes, proceed to Stage 2

**Gate rule:** Lint must pass with zero errors. Warnings are acceptable but should be noted.

### Stage 2: Test

Run the full test suite:

1. Identify the project's test runner (Jest, Vitest, pytest, etc.)
2. Run all tests with coverage reporting
3. If tests fail:
   - Collect all failing test names and error messages
   - Delegate to `@debugger` to diagnose and fix failures
   - Re-run tests
   - If tests still fail after fix attempts, report and **gate blocks**
4. If all tests pass, proceed to Stage 3

**Gate rule:** All tests must pass. Coverage thresholds should be checked but are advisory (not a hard gate unless configured).

### Stage 3: Build

Run the production build:

1. Identify the build system (tsc, webpack, vite, cargo build, etc.)
2. Run the build with production configuration
3. If build fails:
   - Collect build errors
   - Delegate to `@debugger` to diagnose
   - Re-run build
   - If build still fails, report and **gate blocks**
4. If build succeeds, proceed to Stage 4

**Gate rule:** Build must succeed with zero errors. Warnings should be noted but do not block.

### Stage 4: Deploy

Deploy the built artifacts:

1. Identify the deploy target (npm publish, docker push, gh release, rsync, etc.)
2. Confirm deploy target and credentials are available
3. Run the deploy command
4. Verify deployment succeeded (check status, health endpoint, etc.)
5. Report deployment summary

**Gate rule:** Deploy only runs if Stages 1-3 all passed. If deploy fails, roll back if possible and report.

## Stage Failure Protocol

When a stage fails:

1. **Diagnose**: Collect all error output from the failed stage
2. **Fix**: Delegate to the appropriate agent (`@executor` for lint fixes, `@debugger` for test/build failures)
3. **Re-verify**: Re-run the failed stage from scratch
4. **Escalate**: If the same stage fails 3 times, report to the user with full diagnostics and stop

## Pipeline State

Track pipeline progress in `.opencode/state/orchestration/pipeline/{slug}-pipeline.json`:

```json
{
  "stages": {
    "lint": { "status": "passed", "output": "...", "duration": 12 },
    "test": { "status": "passed", "output": "...", "duration": 45 },
    "build": { "status": "failed", "output": "...", "duration": 30, "attempts": 2 },
    "deploy": { "status": "blocked", "output": null, "duration": null }
  },
  "started_at": "2026-06-20T10:00:00Z",
  "completed_at": null
}
```

## Constraints

- **Hard gates**: No stage proceeds until the prior stage passes. No exceptions.
- **No skipping**: All four stages run in order. No stage can be skipped unless explicitly configured.
- **Idempotent re-runs**: Re-running a stage should produce the same result (given the same code).
- **Diagnostic output**: Every stage failure must produce actionable error messages, not just "stage failed".
- **No silent failures**: If a stage tool/command is missing, report it immediately — do not silently skip.

## Reminder

Multi-stage pipeline with hard gates.
