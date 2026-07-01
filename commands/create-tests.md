---
description: Generate comprehensive 8-type test suite for a module, function, or endpoint — happy path, edge cases, errors, integration, concurrency, performance, regression, property-based
argument-hint: "<target>"
---

# Create Tests

Generates a comprehensive test suite covering 8 test types per unit under test. Invoked via `/project tests <target>`.

## Workflow

1. **Identify the target**: parse `$ARGUMENTS` to determine what to test — a file path, function name, module directory, or API endpoint. If no argument given, ask the user what to test.

2. **Read the code under test**: load the target source. Understand its contract — inputs, outputs, side effects, error modes, dependencies.

3. **Locate the test directory**: detect existing test conventions (co-located `*.test.ts`, `__tests__/`, `test/`, `spec/`). Follow existing patterns — don't invent a new test layout.

4. **Generate 8 test types**:

   | Type | What it covers |
   |------|----------------|
   | **Happy path** | Expected input → expected output. The normal case. |
   | **Edge cases** | Empty, null, undefined, max, min, boundary values, empty strings, zero, large inputs. |
   | **Error cases** | Invalid input, missing required fields, type mismatches, failure responses, exceptions. |
   | **Integration** | Interaction with dependencies (DB, API, filesystem). Mock or stub per existing conventions. |
   | **Concurrency** | Race conditions, ordering (where applicable). Skip if the target is purely synchronous. |
   | **Performance** | Timing/complexity assertions (where applicable). Skip for trivial functions. |
   | **Regression** | Tests for known bugs — check issue tracker or git history for prior fixes. |
   | **Property-based** | Invariant testing (where applicable) — use fast-check, hypothesis, or equivalent. Skip if no meaningful invariant. |

5. **Match existing test style**: detect the test framework (Vitest, Jest, pytest, Go testing, etc.) and match its idioms — `describe/it`, `test()`, `assert`, etc. Match assertion style (`expect` vs `assert`), mock style, and fixture patterns.

6. **Write tests to the correct location**: co-locate with source if that's the convention, or use the existing test directory.

7. **Run the tests**: execute the test runner and verify all generated tests pass (or fail for expected reasons if the target has known bugs). Fix any test issues (bad imports, wrong paths) before reporting.

8. **Report**: summarize what was generated — file paths, test count per type, any types skipped and why (e.g. "skipped concurrency: target is a pure function with no shared state").

## Constraints

- Do NOT modify the source code under test. If you find a bug, note it but don't fix it here.
- Do NOT refactor existing tests. Only add new ones.
- If a test type doesn't apply (e.g. property-based for a simple CRUD endpoint), skip it and note the reason in the report.
- Match the existing test framework, assertion style, and file layout. Never introduce a new framework.
- Run tests after generation and fix any test-side issues (bad mocks, missing imports). The generated suite must execute.

## Output

- New test file(s) written to the detected test directory.
- Test run result (pass/fail count).
- Summary of 8 types: which were generated, which skipped, why.