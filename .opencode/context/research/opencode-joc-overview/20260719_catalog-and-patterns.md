---
title: "Opencode_JOC — Catalog & Pattern Analysis"
type: source-summary
tags: [hubs, orchestration, agents, skills, commands, patterns]
created: 2026-07-19
updated: 2026-07-19
sources: [Data/Projects/Notes/Opencode_JOC]
status: active
---

# Opencode_JOC Directory — Full Catalog & Hub Subcommand Pattern Analysis

> Source: `~/Data/Projects/Notes/Opencode_JOC/` — a collection of cloned agent/skill registries and reference materials for OpenCode Hubs development.

## 1. Component Overview

| # | Directory | Origin | What It Is | Size |
|---|-----------|--------|------------|------|
| 1 | `agents/` | wshobson/agents | Multi-harness agentic plugin marketplace | 94 plugins, 203 agents, 175 skills, 109 commands, 16 orchestrators |
| 2 | `agent-skills/` | addyosmani/agent-skills | Production-grade engineering workflow skills | 24 skills, 8 slash commands |
| 3 | `skills/` | antfu/skills | Vue/Vite/Nuxt opinionated skills collection | 19 skills |
| 4 | `SKG/` | jdevalk/skills | GitHub/WordPress/SEO auditing skills | 8 skills |
| 5 | `astro/` | (jdevalk split) | Astro SEO tooling | 6 sub-skills |
| 6 | `awesome-copilot/` | awesome-copilot/awesome-copilot | Community GitHub Copilot customizations | 220 agents, 70 plugins, 7 hooks, 8 workflows |
| 7 | `addem/` | (misc) | CSS snippets, web design references, general refs | 4 directories |
| 8 | `Files_To_Add/` | (hubs dev) | Pre-assembled agents, commands, rules, docs for OCH | 10 agents, 14 commands, 1 rule, 1 doc |

---

## 2. Pattern Discovery: New Hub Subcommand Candidates

Each pattern below describes something NOT currently in OpenCode Hubs that could be added.

### Pattern A: Lifecycle Slash Commands (addyosmani/agent-skills)

**Source:** `agent-skills/` — 8 commands: `/spec`, `/plan`, `/build`, `/test`, `/review`, `/webperf`, `/code-simplify`, `/ship`

**What it does:** Defines a complete development lifecycle as discrete commands. Each command loads the right skill(s), enforces a workflow, and produces output. The lifecycle is: DEFINE → PLAN → BUILD → VERIFY → REVIEW → SHIP.

**Gap:** OpenCode Hubs has `/init-project` for setup and `/orchestrate` for general execution, but no dedicated `/lifecycle` or `/dev` hub with subcommands matching the phases of development. The existing `/project` hub has some overlapping subcommands (create-tests, refactor, simplify, code-review, audit) but lacks a structured lifecycle framing.

**Candidate new hub:** `/dev` with subcommands:
- `/dev spec` — spec-driven development (wraps addyosmani spec-driven-development skill)
- `/dev plan` — planning and task breakdown
- `/dev build` — incremental implementation
- `/dev test` — test-driven development / test generation
- `/dev review` — code review with multi-axis quality
- `/dev webperf` — web performance audit
- `/dev ship` — shipping and launch workflow

### Pattern B: Plugin Ecosystem & Marketplace (wshobson/agents + awesome-copilot)

**Source:** `agents/` (wshobson) — 94 composable plugins with auto-discovery; `awesome-copilot/` — 70 plugins with marketplace.json

**What it does:** Each plugin is a self-contained directory (`plugins/<name>/`) containing agents, commands, and skills. Plugins are discoverable via a marketplace manifest and installable individually. The wshobson system uses an adapter framework to transpile the same source to 6 different harnesses (Claude Code, Codex, Cursor, OpenCode, Gemini, Copilot).

**Gap:** OCH currently installs skills individually via `npx skills add`. There is no `/plugin` hub for managing composable plugin bundles that group related agents + commands + skills + rules together.

**Candidate new hub:** `/plugin` with subcommands:
- `/plugin add <name>` — install a plugin from a marketplace/source
- `/plugin remove <name>` — uninstall a plugin
- `/plugin list` — list installed plugins
- `/plugin info <name>` — show plugin contents (agents, commands, skills)
- `/plugin create` — scaffold a new plugin
- `/plugin sync` — sync plugin manifests

### Pattern C: Agent-Driven Architecture (wshobson/agents — 16 orchestrators)

**Source:** `agents/` architecture — "16 orchestrators" for multi-agent coordination workflows

**What it does:** The wshobson marketplace explicitly tracks "orchestrators" as a first-class resource type alongside agents, skills, and commands. These are multi-agent coordination patterns for specific domains (full-stack, security, ML, incident response).

**Gap:** OCH has `/orchestrate` with ~30 subcommands already (ralph, team, swarm, pipeline, etc.), but these are execution patterns, not domain-specific orchestration workflows. Having domain-tuned orchestrators (e.g., `/orchestrate security-audit` that deploys security-reviewer + code-reviewer + tracer in a pipeline) could provide higher-level capabilities.

**Candidate additions to `/orchestrate`:**
- `/orchestrate domain <name>` — domain-specific orchestration (loads a bundled orchestrator profile)
- `/orchestrate incident` — incident-response pipeline (triage → analyze → fix → verify)
- `/orchestrate fullstack` — full-stack feature orchestration (frontend + backend + db)

### Pattern D: Hooks System (awesome-copilot)

**Source:** `awesome-copilot/hooks/` — 7 hooks: dependency-license-checker, fix-broken-links, governance-audit, secrets-scanner, session-auto-commit, session-logger, tool-guardian

**What it does:** Hooks are automated workflows triggered by specific events during development (session start, pre-commit, post-build, etc.). Each hook is a folder with a README.md (frontmatter) and hooks.json configuration.

**Gap:** OCH doesn't have a hooks system. The existing `plugins/hooks/hooks.ts` is a mode-detection plugin, not a user-configurable hook system triggered by lifecycle events.

**Candidate additions:**
- `/project hook create` — scaffold a new hook
- `/project hook list` — list active hooks
- `/project hook enable/disable` — toggle hooks
- Hook triggers: `session-start`, `pre-commit`, `post-commit`, `pre-build`, `post-build`, `pre-deploy`

### Pattern E: Agentic Workflows for GitHub Actions (awesome-copilot + SKG)

**Source:** `awesome-copilot/workflows/` — 8 agentic-workflow .md files for GitHub Actions automation; `SKG/` — 6+ CI/CD workflows

**What it does:** GitHub Actions workflows that use AI agents as part of CI/CD pipelines. Agentic Workflows is a GitHub feature (currently in preview) where `.github/workflows/*.md` files define agentic automation.

**Gap:** OCH doesn't have any GitHub Actions workflow templates or agentic-workflow generation.

**Candidate addition:**
- `/project workflow` — scaffold an agentic GitHub Actions workflow

### Pattern F: Research-Backed Agent Creation (.opencode/context/docs/new-agents.md)

**Source:** `.opencode/context/docs/new-agents.md` (384 lines) — Anthropic 2025 research-backed agent creation methodology

**What it does:** Prescribes minimal prompts (~500 tokens), single-agent + tools architecture, just-in-time context loading, comprehensive 8-test-type validation. Includes commands: `/create-agent`, `/create-tests`.

**Gap:** OCH's `/harvest-context agent` routes to `opencode-agent-creator` skill, but doesn't enforce the research-backed methodology. The new-agents.md document explicitly calls out principles that OCH agents don't always follow (e.g., prompt size, tool definitions).

**Candidate additions to `/harvest-context agent`:**
- Add agent-size validation (warn if prompt exceeds 500 tokens)
- Add tool definition validation (check that every tool has purpose/when-to-use/when-not-to-use)
- Add agent-test generation phase (generate 8 essential test types)

### Pattern G: Agent Quality Evaluation Framework (wshobson/agents — plugin-eval)

**Source:** `agents/docs/plugin-eval.md` — three-layer quality evaluation framework for plugins/agents

**What it does:** Scores agents/plugins across three layers: structural validity, behavioral correctness, and harness portability.

**Gap:** OCH has no agent quality scoring. `validate-delegation` checks that skill/agent/command references resolve, but doesn't score agents for completeness, tool coverage, or prompt quality.

**Candidate addition:**
- `/project audit --agents` — run quality evaluation on agents (check prompt size, tool definitions, test coverage, cross-references)

### Pattern H: Score-Based CI/CD Audits (SKG)

**Source:** `SKG/` — each skill produces a scored audit with drop-in replacements (github-repo, github-profile, astro-seo, readability-check, etc.)

**What it does:** Skills that audit a target (repo, profile, website) across multiple categories, produce a score, and generate optimized replacements. Example: github-repo audits 6 categories and generates: README, CONTRIBUTING, SECURITY, issue/PR templates, CODEOWNERS.

**Gap:** OCH doesn't have score-based audit subcommands. `/project audit` exists but doesn't produce scored reports with fix recommendations.

**Candidate additions to `/project`:**
- `/project audit --score` — add scoring + fix recommendations to existing audit
- `/project github-profile` — audit and improve GitHub profile/bio/pinned repos
- `/project repo-makeover` — generate README/CONTRIBUTING/SECURITY/templates

---

## 3. Cross-Reference: Existing Hub Subcommands vs. Found Patterns

| Existing Subcommand | Matches Pattern | Gap |
|---------------------|----------------|-----|
| `/project create-tests` | F (agent testing) | Partial — doesn't generate 8-test-type suite |
| `/project audit` | G, H | Partial — no scoring, no fix recommendations |
| `/project refactor` | A (build) | Loose match — no lifecycle framing |
| `/project simplify` | A (code-simplify) | Loose match |
| `/orchestrate pipeline` | C, E | Generic — no domain-specific profiles |
| `/orchestrate team` | C | Generic — no domain-tuned teams |
| `/harvest-context agent` | F | Links to opencode-agent-creator but doesn't enforce methodology |
| `/init-project provision` | B | Generates config but no plugin management |
| `/init-project find-skills` | B | Installs individual skills, not plugin bundles |
| `/project changelog` | E | No workflow generation |
| (none) | A | No `/dev` hub for lifecycle commands |
| (none) | B | No `/plugin` hub for bundle management |
| (none) | D | No hooks system |
| (none) | C (domain) | No domain-specific orchestrator profiles |
| (none) | H (scoring) | No scored audit subcommands |

---

## 4. Key Resources Not Yet Integrated

The following skills/packages from this collection are directly relevant to OCH but are not yet installed or wired:

| Resource | Source | Why Add |
|----------|--------|---------|
| spec-driven-development | agent-skills | `/dev spec` would need this |
| planning-and-task-breakdown | agent-skills | Already a hub skill name, but addyosmani's version has workflow steps |
| incremental-implementation | agent-skills | `/dev build` would need this |
| code-review-and-quality | agent-skills | Five-axis code review (correctness, security, perf, maintainability, style) |
| shipping-and-launch | agent-skills | `/dev ship` — launch checklist |
| interview-me | agent-skills | Socratic requirements interrogation — complements `/ideation` |
| web-design-guidelines | antfu/skills | Antfu's design tokens + UI patterns |
| github-repo, github-profile | SKG | Scored audits with drop-in replacements |
| astro-seo, static-seo | SKG/astro | SEO optimization workflows |
| context-engineering | agent-skills | Just-in-time context loading methodology |

---

## 5. Summary of High-Value Gaps

**Highest value** (new hub or significant expansion):

1. **`/dev` hub** — lifecycle commands (spec → plan → build → test → review → ship)
2. **Hooks system** — event-triggered automation (session-start, pre-commit, etc.)
3. **Scored audits** — add scoring + fix-recommendation output to /project audit

**Medium value** (additions to existing hubs):

4. **Domain-specific orchestrators** — pre-tuned orchestrator profiles for common tasks
5. **Agent quality evaluation** — multi-axis scoring for agent definitions
6. **Agent testing methodology** — 8-test-type validation from new-agents.md

**Lower value / nice-to-have:**

7. **`/plugin` hub** — bundle management (agents + commands + skills grouped together)
8. **`/project workflow`** — agentic GitHub Actions workflow scaffolder
9. **`/project github-profile`** — scored GitHub profile audit
