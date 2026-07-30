---
name: testing-conventions
description: Testing conventions for Next.js projects with Vitest and Playwright
tags: [testing, vitest, playwright, nextjs]
---

# Testing Conventions

## Unit Tests (Vitest)
- Co-locate tests with source files: `component.tsx` → `component.test.tsx`
- Use `@testing-library/react` for component tests
- Use `vitest` mock functions over manual mocks
- Test behavior, not implementation

## E2E Tests (Playwright)
- Tests in `e2e/` directory at project root
- Page Object Model for reusable selectors and actions
- Use `data-testid` attributes over CSS classes for selectors
- One spec file per feature/user flow

## Test Naming
- `describe('ComponentName')` for component test suites
- `it('should [expected behavior] when [condition]')` for test cases
- Group tests by user-facing behavior, not by function name
