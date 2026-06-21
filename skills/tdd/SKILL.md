---
name: tdd
description: Test-driven development loop — red-green-refactor: write failing test, make it pass, refactor, repeat until all features covered
---

# TDD

Test-driven development following the red-green-refactor loop. Write a failing test first, make it pass with minimal implementation, then refactor for quality. Repeat until all features are covered.

## When to Use

- Building new features where correctness is critical
- Fixing bugs — write a test that reproduces the bug first, then fix
- Adding functionality to existing code with poor test coverage
- Any task where you want test coverage to be a first-class deliverable
- Refactoring with safety — tests ensure you don't break existing behavior

**Do not use when:**
- The task is purely exploratory or research-oriented
- You need rapid prototyping with throwaway code — use `vibe-code` instead
- The codebase has no test framework and adding one is out of scope
- You're making trivial, well-understood changes (typo fixes, simple renames)

## Workflow

### Phase 1: Understand & Plan

1. Read the relevant code and understand what needs to change
2. Identify the test framework and conventions used in the project
3. Break the work into small, testable units
4. For each unit, define:
   - What behavior needs to exist
   - What the acceptance criteria are
   - What edge cases exist

### Phase 2: RED — Write a Failing Test

1. Write a test for the **next unit of behavior** — one test at a time
2. The test should be specific and test one thing
3. Run the test — it **must fail** (RED)
4. If the test passes without new implementation, it's not testing the right thing

**Test quality checklist:**
- [ ] Tests one specific behavior
- [ ] Has a descriptive name explaining what's being tested
- [ ] Covers the happy path
- [ ] Covers at least one edge case
- [ ] Is independent (no shared mutable state with other tests)

### Phase 3: GREEN — Make It Pass

1. Write the **minimum implementation** needed to make the test pass
2. Do not add features the test doesn't call for
3. Do not refactor yet — focus on passing the test
4. Run the test — it **must pass** (GREEN)
5. Run the full test suite to ensure no regressions

**Implementation rules:**
- Write the simplest code that makes the test pass
- Hardcode values if that's the simplest path (you'll refactor in the next phase)
- Do not add error handling for scenarios not covered by tests
- Do not optimize prematurely

### Phase 4: REFACTOR — Improve Quality

1. Refactor both the implementation and the test
2. Improve naming, extract duplication, simplify logic
3. Run the test suite after each refactoring step
4. All tests must still pass after refactoring

**Refactoring checklist:**
- [ ] Remove duplication
- [ ] Improve naming
- [ ] Extract helper functions where appropriate
- [ ] Add error handling for edge cases (if covered by tests)
- [ ] Ensure the test still tests the right thing

### Phase 5: Repeat

1. Go back to Phase 2 for the next unit of behavior
2. Continue until all features are implemented and all tests pass
3. Each cycle should be small — typically 5-15 minutes per red-green-refactor loop

### Phase 6: Final Verification

1. Run the full test suite — all tests pass
2. Run build/typecheck — no errors
3. Review test coverage — ensure critical paths are covered
4. Report summary: what was implemented, how many tests added, coverage metrics

## Agent Delegation

- **Primary executor**: `@executor` runs the red-green-refactor loop
- **Test review**: `@code-reviewer` can review test quality and coverage
- **Architecture review**: `@architect` can review design decisions after implementation

## Constraints

- **One test at a time**: Never write multiple tests before making the first one pass. The loop is tight for a reason.
- **Minimum implementation**: GREEN phase should produce the simplest possible passing code. No speculative features.
- **Tests must be meaningful**: A test that always passes (e.g., `expect(true).toBe(true)`) is not a valid RED phase.
- **No skipping refactor**: The REFACTOR phase is mandatory, not optional. Skipping it accumulates technical debt.
- **Full suite on every cycle**: Run the full test suite (not just the new test) in every GREEN and REFACTOR phase to catch regressions.

## Reminder

Red-green-refactor TDD loop.
