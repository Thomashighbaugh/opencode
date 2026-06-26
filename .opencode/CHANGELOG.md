# Changelog

> Release log for the OpenCode Hubs configuration.

## 2026-06-21

- **feat(hubs): model tiering fallback — ollama → opencode-go provider switching**
  - Added 4 opencode-go hosted models (`deepseek-v4-pro`, `deepseek-v4-flash`, `glm-5.2`, `nemotron-3-ultra`) to `opencode` provider in `opencode.jsonc`
  - Added `hubs.modelTiering` config with primary/fallback chains for all three tiers (top/mid/fast) plus retry settings (`max_attempts_per_provider: 3`)
  - Added `<Model_Tiering_And_Fallback>` protocol to Hubs agent (`agents/hubs.md`): 4-step error classification, retry state tracking per subagent, escalation gate after 4 total attempts
  - Updated `docs/shared/agent-tiers.md`: all tables now include Fallback Model (opencode-go) columns, added Fallback Guidelines section
  - Updated `.opencode/docs/model-configuration.md`: added Model Tiering & Fallback section with config reference and protocol table
  - **Fallback behavior**: subagent errors classified as Provider/Agent → retry with opencode-go fallback (3 retries), then escalate to user via `question` tool. Task/Tool errors → fix prompt/environment, no provider switch.

- **chore(compact): session compaction artifact for ses_1172fb** — 110 tool calls, 6.5min duration, 5 modified files

- **fix(hubs): remove invalid top-level key and fix model provider IDs** (`b231a98`)
  - Removed invalid `hubs` top-level key from `opencode.jsonc` — not in OpenCode's schema, caused 4 of 6 startup requests to fail (config.providers, provider.list, app.agents, config.get)
  - Stripped model definitions from built-in `opencode` provider — models are pre-loaded, explicit definitions conflicted
  - Fixed all model ID references: `opencode/deepseek-v4-pro` → `opencode-go/deepseek-v4-pro`, `opencode/deepseek-v4-flash` → `opencode-go/deepseek-v4-flash`, `opencode/glm-5.2` → `opencode-go/glm-5.2`
  - Fixed nemotron fallback: `opencode/nemotron-3-ultra` → `opencode/nemotron-3-ultra-free`
  - Verified all 13 `opencode-go` model IDs against `opencode models opencode-go` output

- **docs(readme): comprehensive feature list with implementation pointers** (`ac505a8`, `e88109b`)
  - Expanded README features from 6 terse bullets to 10 thorough entries (4-6 lines each)
  - Each entry now includes exact file paths to implementation code, behavioral details, and architectural rationale
  - New entries: Per-Project Agent & Skill Genesis (Provisioning), Self-Learning Context Compounding (Harvest-Context), Poly-Pattern Execution Topology (30 `/orchestrate` patterns), Multi-Method Ideation Engine (26 `/ideation` methods), Organic Configuration Integration (native composition without plugins or agent renames)
  - All entries given AI-buzzword names that actually explain what they mean

- **chore(compact): second session compaction artifact for ses_1172fb** — 258 tool calls, 58.8min duration, 1 subagent invocation

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