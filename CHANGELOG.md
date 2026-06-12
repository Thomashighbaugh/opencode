# Changelog

> User-facing release log for the OpenCode Hubs configuration.
> Auto-commit log (per-session granularity) lives in `.opencode/CHANGELOG.md`.

## 2026-06-12

- **fix: remove invalid top-level config keys from opencode.jsonc** (`3d39ec9`)
  - Removed `agents`, `commands`, `agentPaths` keys that broke OpenCode's config loader
  - Fixed in templates, provision script, and documentation files

- **feat(init-project): add provision subcommand** (`ddd0ccd`)
  - New `/init-project provision` — analyzes codebase and generates 10 project-aware agent wrappers, 6 skills, 3 tools, 8 rules
  - 2170-line `provision.mjs` engine with codebase scanner and template system

## 2026-06-10

- **feat(ideation): add decomposition as third /ideation subcommand** (`6a7d8f1`)

## 2026-06-09

- **docs: rewrite README with comprehensive hub subcommand reference tables** (`425bb06`)
- **docs(patterns): add Craftsman Agent pattern analysis** (`999d6b8`)

## 2026-06-08

- **feat(models): add NVIDIA Nemotron 3 Ultra** (`f86da55`)
- **chore: ingest Agent Systems Handbook** (`08a1987`)