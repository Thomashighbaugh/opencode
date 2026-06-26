---
name: testing-conventions
description: Vitest testing conventions — test placement, mocking, coverage, patterns
tags: [testing, vitest, typescript, conventions]
---

# Testing Conventions (Vitest)

## Test Placement
- Co-locate tests with source files: `Button.tsx` → `Button.test.tsx`
- Integration tests in `tests/` directory at project root
- E2E tests in `e2e/` directory

## Naming
- Test files: `*.test.ts` or `*.test.tsx`
- Describe blocks: `describe('ComponentName')`
- Test cases: `it('should [behavior] when [condition]')`
- Group tests by user-facing behavior, not by function name

## Mocking
- Use `vi.mock()` at module level for module mocks
- Use `vi.spyOn()` for specific function interception
- Mock at the module boundary, not implementation details
- Use `msw` for HTTP request mocking over `nock` or `fetch` mocking

## Coverage
- Threshold: 80% lines, 70% branches
- Run with `--reporter=html` for visual reports
- Coverage excludes: test files, config files, `*.d.ts`
- Run in CI: `vitest run --coverage`

## Patterns
- Arrange → Act → Assert
- One logical assertion per test case
- Use `describe.each` / `it.each` for parameterized tests
- Use `test.skip` sparingly — use `test.todo` for planned tests
