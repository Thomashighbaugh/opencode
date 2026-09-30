---
name: test
description: Run tests using vitest — run all, single file, watch mode, or coverage
level: 1
---

# Test

Test execution for the project using vitest.

## Commands

| Command | Description |
|---------|-------------|
| `npx vitest run` | Run all tests |
| `npx vitest run -- --coverage` | Run with coverage report |
| `npx vitest run -- --watch` | Watch mode |
| `npx vitest run -- <file-path>` | Specific test file |

## Conventions

- Test location: tests
- File naming: `*.test.*` or `*.spec.*`
- 

## Coverage Targets

- Aim for 80%+ coverage on business logic
- Critical paths require 100% coverage
