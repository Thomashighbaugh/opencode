---
title: "Config Integrity Test Suite"
type: entity
tags: [docs, testing, config-integrity]
created: 2026-05-01
updated: 2026-10-20
status: active
---


# Config Integrity Test Suite

## Overview

2801 vitest tests across 27 files validating OpenCode Hubs configuration integrity — schema compliance, file existence, agent format, hub delegation, provider/MCP catalog shape, skill frontmatter, tools export contract, AGENTS.md↔disk sync, and per-project config inheritance. Runs in ~25s.

`npm test` — watch mode (development)  
`npm run test:run` — single run (CI)  
`npm run test:coverage` — single run with coverage report

## Test Structure

```
tests/
├── helpers/
│   ├── load-config.ts       # JSONC parser, config finder, global dir resolver
│   ├── resolve-refs.ts      # File ref resolver with global fallback chain
│   ├── project-fixtures.ts  # Fixture loader for project-scoped tests
│   └── helpers.test.ts      # Unit tests for the helpers themselves (parseJsonc, resolveRef, scanEntities)
├── global/
│   ├── schema.test.ts            # opencode.jsonc key validity, deprecated detection, no model pin
│   ├── provider-config.test.ts   # provider.profundo.models catalog — structure, limits, modality/attachment consistency, no secrets
│   ├── mcp-config.test.ts        # context7/searxng/gh_grep — transport shape, env-ref secrets, endpoint URLs
│   ├── file-integrity.test.ts    # all referenced paths exist
│   ├── agent-format.test.ts      # agents × format checks (frontmatter, Agent_Prompt, no model pin)
│   ├── skill-frontmatter.test.ts # every skills/*/SKILL.md — YAML parses, name matches dir, no model pin, script refs resolve
│   ├── tools-export.test.ts      # tools/*.ts import tool(), default export, description, execute; hub manifests excluded
│   ├── agents-md-sync.test.ts    # AGENTS.md hub table ↔ spec files on disk, roster ↔ agents/, plugin paths, numeric claims
│   ├── delegation.test.ts        # hub subcommand delegation targets resolve; scaffold-hub split; legacy routes
│   ├── command-hooks.test.ts     # declarative hook surface — config validation, matching, override, injection, dispatch
│   ├── auto-continue.test.ts     # auto-continue plugin config, matching, provider recovery
│   ├── classifiers.test.ts       # classifier degrade contract, label normalisation, sensitive-entity filter
│   ├── efficiency-request.test.ts# request-efficiency — cache substitution, gated injection, child reuse
│   ├── efficiency-token.test.ts  # token-efficiency — standing rule loaded, budgeted injection, retrieval ladder
│   ├── feature-package.test.ts   # inventory integrity — hubs, skills, agents/rules/tools registered and consistent
│   ├── graph-propose.test.ts     # graph supersede resolution, candidate review surface
│   ├── knowledge-plane.test.ts   # knowledge graph leaf edges, symbol sidecar, referential integrity
│   ├── onnx.test.ts              # ONNX runtime model availability, embedder, reranker
│   ├── prompt-queue.test.ts      # prompt queue ordering, manual fire, gate release
│   ├── prompt-queue-manual.test.ts # prompt queue manual-mode behaviour
│   ├── prompt-queue-tool.test.ts # prompt-queue tool surface
│   ├── rerank.test.ts            # reranker backend, model id, scoring convention
│   ├── semantic-cache.test.ts    # semantic-cache vector helpers, index versioning, base64 round-trip
│   └── todo-store.test.ts        # todo store CRUD
├── project/
│   ├── fixtures/sample-project/  # Minimal .opencode/ skeleton with overrides
│   └── resolution.test.ts        # config inheritance, global fallback
└── coverage-map.test.ts          # meta-check: all source areas have tests
```

## CI

GitHub Actions (`.github/workflows/config-test.yml`) runs a two-job matrix:

| Job | Scope | Runs |
|-----|-------|------|
| `global-config` | Real global config (the repo itself) | `npm run test:run` |
| `project-config` | Project fixture tests only | `npx vitest run tests/project/` |

Fails on: invalid config keys, missing files, broken delegation targets, malformed agent definitions, config resolution errors, malformed provider/MCP entries, unparseable skill frontmatter, AGENTS.md↔disk drift.

## Writing Tests

- Tests go in `tests/global/` or `tests/project/` depending on scope
- Use `it.each` for parameterized test cases (see agent-format.test.ts)
- Import helpers from `tests/helpers/` for JSONC loading and path resolution
- Use `describe` blocks to organize by area
- Use `expect` matchers (vitest globals are enabled)
- Assert behaviour or shape, never a copy of the source — a test that reads the matcher and asserts it contains a string passes against a matcher that never matches anything (see command-hooks.test.ts header)
