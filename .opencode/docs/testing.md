# Config Integrity Test Suite

## Overview

667 TypeScript eval tests (`vitest`) validating OpenCode Hubs configuration integrity — schema compliance, file existence, agent format, hub delegation, and per-project config inheritance. Runs in ~3s.

`npm test` — watch mode (development)  
`npm run test:run` — single run (CI)  
`npm run test:coverage` — single run with coverage report

## Test Structure

```
tests/
├── helpers/
│   ├── load-config.ts       # JSONC parser, config finder, global dir resolver
│   ├── resolve-refs.ts      # File ref resolver with global fallback chain
│   └── project-fixtures.ts  # Fixture loader for project-scoped tests
├── global/
│   ├── schema.test.ts       # 10 tests — opencode.jsonc key validity, deprecated detection
│   ├── file-integrity.test.ts  # 209 tests — all referenced paths exist
│   ├── agent-format.test.ts    # 280 tests — 31 agents × 9 format checks
│   └── delegation.test.ts      # 150 tests — 155+ hub subcommand targets
├── project/
│   ├── fixtures/sample-project/  # Minimal .opencode/ skeleton with overrides
│   └── resolution.test.ts       # 12 tests — config inheritance, global fallback
└── coverage-map.test.ts       # 6 tests — meta-check: all source areas have tests
```

## CI

GitHub Actions (`.github/workflows/config-test.yml`) runs a two-job matrix:

| Job | Scope | Runs |
|-----|-------|------|
| `global-config` | Real global config (the repo itself) | `npm run test:run` |
| `project-config` | Project fixture tests only | `npx vitest run tests/project/` |

Fails on: invalid config keys, missing files, broken delegation targets, malformed agent definitions, config resolution errors.

## Writing Tests

- Tests go in `tests/global/` or `tests/project/` depending on scope
- Use `it.each` for parameterized test cases (see agent-format.test.ts)
- Import helpers from `tests/helpers/` for JSONC loading and path resolution
- Use `describe` blocks to organize by area
- Use `expect` matchers (vitest globals are enabled)
