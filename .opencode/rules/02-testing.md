# Testing Conventions

Auto-generated from codebase analysis.

## Test Framework

- Framework: vitest
- Command: `npx vitest run`


## Test Organization

- Tests live in tests
- Test files mirror source structure (`Component.test.tsx` next to `Component.tsx`)
- Use `*.test.*` or `*.spec.*` naming

## Coverage Targets

- Business logic: 80%+ coverage
- Critical paths: 100% coverage
- UI components: Smoke tests for rendering

## Mocking

- Mock external services and API calls
- Use dependency injection where possible
- Prefer integration tests over heavy mocking
