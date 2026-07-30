---
name: testing-conventions
description: Testing conventions for React component libraries
tags: [testing, react, vitest, storybook]
---

# Testing Conventions

## Unit Tests (Vitest)
- Co-locate tests: `Button.tsx` → `Button.test.tsx`
- Use `@testing-library/react` — test user-visible behavior
- Use `userEvent` over `fireEvent` for realistic interactions
- Test accessibility with `jest-axe`

## Storybook Tests
- Every component has at least: default, variants, loading, error stories
- Interaction tests for user workflows
- Visual regression with Chromatic or Percy (CI integration)

## Coverage
- Aim for 80%+ coverage on components
- Test files and type definitions excluded from coverage
- Run coverage in CI, fail PRs below threshold
