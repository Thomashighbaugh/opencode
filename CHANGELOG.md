# Changelog

> Release log for the OpenCode Hubs configuration.

## 2026-06-14

- **feat(provision): LSP auto-detection and configuration** (`78fec7b`)
  - Global opencode.jsonc gets `lsp` section for instant type checking
  - Init-project template includes LSP config
  - Provision scanner detects installed language servers (typescript-language-server, rust-analyzer, gopls, etc.)
  - Agent prompts updated to prefer `lsp_diagnostics` over build commands

- **feat(plugin): smart prompt queue** (`6967cd4`)
  - Queues user prompts when LLM is busy, auto-submits on task completion
  - Complements stall detection without generating synthetic prompts
  - Persists queue to disk across sessions

- **docs(provision): per-repo customization engine — 11 approaches** (`a9eb5ae`)
  - A1-A11: multi-pass scanner, dependency research, convention detection, domain language extraction, etc.

- **feat(rules): artifact-placement rule** (`40ba315`)
  - No top-level scripts — all executables go into `.opencode/tools/` or `.opencode/skills/{name}/scripts/`
  - Enforced across Hubs, Executor, Skill-creator, Refactoring, Code-reviewer, Verifier agents

- **feat(plugin): smart stall detection** (`f095511`)
  - Heartbeat-based 5-tier stall classification (ACTIVE → SLOW_POSSIBLE → STALLED_SOFT → STALLED_HARD → SESSION_RESET)
  - Anti-spam: 90s cooldown, max 1 soft + 3 hard nudges per session
  - Session recovery on reconnect

- **chore: eliminate JOC branding** (`4348078`)
  - 35+ references cleaned across 16 files
  - Per-repo deployment architecture proposal

- **chore: remove .opencode/ from global config**
  - `context/` and `CHANGELOG.md` moved to root
  - `.opencode/` directory eliminated from global config entirely
  - `.opencode/` remains the correct location for per-project repos
  - API request minimization: hub agent defaults to single-agent execution, no auto-decompose

## 2026-06-12

- **fix: remove invalid top-level config keys from opencode.jsonc** (`3d39ec9`)
- **feat(init-project): add provision subcommand** (`ddd0ccd`)
- **feat: privacy-scan skill + gitignore protections** (`72c0e75`)

## 2026-06-10

- **feat(ideation): add decomposition subcommand** (`6a7d8f1`)

## 2026-06-09

- **docs: rewrite README** (`425bb06`)
- **docs(patterns): Craftsman Agent analysis** (`999d6b8`)

## 2026-06-08

- **feat(models): NVIDIA Nemotron 3 Ultra** (`f86da55`)
- **chore: ingest Agent Systems Handbook** (`08a1987`)