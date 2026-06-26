# Agent Tiers Reference

> Maps each of the 29 Hubs agents to a recommended model tier based on their role complexity and current model assignment. Referenced by ralph, ultrawork, and orchestration skills for agent selection.

## Model Tiers

| Tier | Primary (opencode zen) | Fallback 1 (ollama) | Fallback 2 (opencode-go) | Context | Output | Best For |
|------|----------------------|---------------------|--------------------------|---------|--------|----------|
| **Top** | `opencode/deepseek-v4-flash-free` | `ollama/deepseek-v4-pro:cloud` | `opencode-go/deepseek-v4-pro` | 1M | 131K | Complex reasoning, architecture, security review |
| **Mid** | `opencode/deepseek-v4-flash-free` | `ollama/deepseek-v4-flash:cloud` | `opencode-go/deepseek-v4-flash` | 1M | 131K | Implementation, execution, general work |
| **Fast** | `opencode/deepseek-v4-flash-free` | `ollama/glm-5.2:cloud` | `opencode-go/glm-5.2` | 202K | 131K | Exploration, documentation, simple tasks |

- **Top tier** agents need deep reasoning, nuanced analysis, or read-only review authority. Fallback 1: `ollama/deepseek-v4-pro:cloud`. Fallback 2: `opencode-go/deepseek-v4-pro`.
- **Mid tier** agents implement, execute, or orchestrate — they need strong coding and moderate reasoning. Fallback 1: `ollama/deepseek-v4-flash:cloud`. Fallback 2: `opencode-go/deepseek-v4-flash`.
- **Fast tier** agents search, summarize, draft, or estimate — they need speed over deep reasoning. Fallback 1: `ollama/glm-5.2:cloud`. Fallback 2: `opencode-go/glm-5.2`.

## Fallback Behavior

When a subagent fails with a provider-level error (connection refused, model unavailable, timeout, 502/503/504), the orchestrating agent retries with Fallback 1 (ollama cloud), then Fallback 2 (opencode-go hosted). After 3 fallback retries, the orchestrating agent escalates to the user via the `question` tool. Task-level errors (wrong output, incorrect implementation) do NOT trigger provider fallback — fix the task prompt instead.

## Agent-to-Tier Mapping

### Top Tier — opencode/deepseek-v4-flash-free (fallback 1: ollama/deepseek-v4-pro:cloud, fallback 2: opencode-go/deepseek-v4-pro)

Deep reasoning, architectural judgment, security analysis, and critical review.

| Agent | Current Model | Rationale |
|-------|---------------|-----------|
| **architect** | `opencode/deepseek-v4-flash-free` | READ-ONLY strategic advisor. Diagnoses bugs, provides architectural guidance with file:line evidence. Requires deep reasoning and nuanced analysis. |
| **planner** | `opencode/deepseek-v4-flash-free` | Strategic planning consultant. Runs structured interviews, generates multi-step work plans with acceptance criteria. Needs strong reasoning for plan quality. |
| **code-reviewer** | `opencode/deepseek-v4-flash-free` | READ-ONLY code smell detector and deep-dive reviewer. Must identify subtle security, performance, and architecture issues across many smell categories. |
| **security-reviewer** | `opencode/deepseek-v4-flash-free` | READ-ONLY OWASP Top 10 specialist. Identifies vulnerabilities, assesses severity by exploitability and blast radius. Errors have high cost. |
| **scientist** | `opencode/deepseek-v4-flash-free` | READ-ONLY data analyst. Requires statistical rigor — confidence intervals, effect sizes, hypothesis testing. Errors in analysis propagate to decisions. |
| **deep-thinker** | `opencode/deepseek-v4-flash-free` | Structured thinking partner for ambiguous problems. Applies mental models, cross-framework analysis. Needs deep reasoning capacity. |
| **requirements-analyzer** | `opencode/deepseek-v4-flash-free` | READ-ONLY requirements analyst. Evaluates clarity, scope, feasibility, risk. Gap analysis requires thorough reasoning. |
| **tracer** | `opencode/deepseek-v4-flash-free` | Evidence-driven causal tracer with competing hypotheses. Must rank evidence by strength, avoid premature convergence. Deep reasoning essential. |
| **analyst** | `opencode/deepseek-v4-flash-free` | READ-ONLY pre-planning consultant. Catches requirement gaps, undefined guardrails, scope risks. Thoroughness demands strong reasoning. |
| **critic** | `opencode/deepseek-v4-flash-free` | READ-ONLY final quality gate. Multi-perspective review, gap analysis, pre-commitment predictions. Maximum effort required. |

### Mid Tier — opencode/deepseek-v4-flash-free (fallback 1: ollama/deepseek-v4-flash:cloud, fallback 2: opencode-go/deepseek-v4-flash)

Implementation, execution, configuration, and interactive testing.

| Agent | Current Model | Rationale |
|-------|---------------|-----------|
| **hubs** | `opencode/deepseek-v4-flash-free` | Generalist primary agent. Handles most tasks directly, suggests subagent patterns when beneficial. Needs strong coding and breadth, not maximum depth. |
| **executor** | `opencode/deepseek-v4-flash-free` | Focused task executor. Implements code changes precisely. Needs strong coding and fast execution, not architectural reasoning. |
| **debugger** | `opencode/deepseek-v4-flash-free` | Root-cause analysis and build error resolution. Needs systematic investigation and code fixes — practical coding over deep theory. |
| **test-engineer** | `opencode/deepseek-v4-flash-free` | Test strategy and TDD workflows. Writes tests, runs suites, diagnoses flaky tests. Implementation-focused. |
| **designer** | `opencode/deepseek-v4-flash-free` | UI/UX designer-developer. Creates production-grade visual implementations. Needs strong frontend coding skills. |
| **frontend-design** | `opencode/deepseek-v4-flash-free` | Distinctive frontend interfaces with high design quality. Implementation-heavy, needs fast iteration on visual code. |
| **git-master** | `opencode/deepseek-v4-flash-free` | Git operations specialist. Atomic commits, style detection, rebasing. Practical git execution over deep reasoning. |
| **config-orchestrator** | `opencode/deepseek-v4-flash-free` | OpenCode configuration specialist. Manages jsonc, skills, agents, plugins. Practical configuration work. |
| **skill-creator** | `opencode/deepseek-v4-flash-free` | Creates custom skills with proper structure. Template-driven work requiring coding and documentation. |
| **refactoring** | `opencode/deepseek-v4-flash-free` | Plans and implements code refactoring. Needs strong coding to restructure code while preserving behavior. |
| **code-simplifier** | `opencode/deepseek-v4-flash-free` | Simplifies code for clarity and maintainability. Implementation-focused, needs practical coding skill. |
| **qa-tester** | `opencode/deepseek-v4-flash-free` | Interactive CLI testing via tmux. Practical test execution, session management, output capture. |

### Fast Tier — opencode/deepseek-v4-flash-free (fallback 1: ollama/glm-5.2:cloud, fallback 2: opencode-go/glm-5.2)

Search, summarization, drafting, estimation — speed over depth.

| Agent | Current Model | Rationale |
|-------|---------------|-----------|
| **writer** | `opencode/deepseek-v4-flash-free` | Technical documentation. Needs clear writing, code example verification, and style matching. Speed and clarity over deep reasoning. |
| **verifier** | `opencode/deepseek-v4-flash-free` | Verification strategy and evidence-based completion checks. Runs tests, checks builds, compares results. Structured verification over creative reasoning. |
| **document-specialist** | `opencode/deepseek-v4-flash-free` | External documentation lookup. Searches docs, synthesizes findings, cites sources. Search and summarization task. |
| **effort-estimator** | `opencode/deepseek-v4-flash-free` | Development effort estimation. Applies size tables and modifiers. Structured, formulaic work. |
| **explore** | `opencode/deepseek-v4-flash-free` | Codebase search specialist. Finds files and patterns, returns structured results. READ-ONLY, speed-critical search. |
| **commit-drafter** | `opencode/deepseek-v4-flash-free` | Structures commit messages from intent. Follows conventional commit format. Lightweight, structured drafting. |
| **prompt-simplifier** | `opencode/deepseek-v4-flash-free` | Analyzes prompt logic and simplifies. READ-ONLY analysis, structured output. |

## Summary Table

| Agent | Tier | Primary Model | Fallback 1 (ollama) | Fallback 2 (opencode-go) | Role Category |
|-------|------|---------------|---------------------|--------------------------|--------------|
| architect | Top | `opencode/deepseek-v4-flash-free` | `ollama/deepseek-v4-pro:cloud` | `opencode-go/deepseek-v4-pro` | Strategic analysis (READ-ONLY) |
| planner | Top | `opencode/deepseek-v4-flash-free` | `ollama/deepseek-v4-pro:cloud` | `opencode-go/deepseek-v4-pro` | Strategic planning |
| code-reviewer | Top | `opencode/deepseek-v4-flash-free` | `ollama/deepseek-v4-pro:cloud` | `opencode-go/deepseek-v4-pro` | Quality review (READ-ONLY) |
| security-reviewer | Top | `opencode/deepseek-v4-flash-free` | `ollama/deepseek-v4-pro:cloud` | `opencode-go/deepseek-v4-pro` | Security audit (READ-ONLY) |
| scientist | Top | `opencode/deepseek-v4-flash-free` | `ollama/deepseek-v4-pro:cloud` | `opencode-go/deepseek-v4-pro` | Data analysis (READ-ONLY) |
| deep-thinker | Top | `opencode/deepseek-v4-flash-free` | `ollama/deepseek-v4-pro:cloud` | `opencode-go/deepseek-v4-pro` | Complex reasoning |
| requirements-analyzer | Top | `opencode/deepseek-v4-flash-free` | `ollama/deepseek-v4-pro:cloud` | `opencode-go/deepseek-v4-pro` | Requirements analysis (READ-ONLY) |
| tracer | Top | `opencode/deepseek-v4-flash-free` | `ollama/deepseek-v4-pro:cloud` | `opencode-go/deepseek-v4-pro` | Causal investigation |
| analyst | Top | `opencode/deepseek-v4-flash-free` | `ollama/deepseek-v4-pro:cloud` | `opencode-go/deepseek-v4-pro` | Gap analysis (READ-ONLY) |
| critic | Top | `opencode/deepseek-v4-flash-free` | `ollama/deepseek-v4-pro:cloud` | `opencode-go/deepseek-v4-pro` | Quality gate (READ-ONLY) |
| hubs | Mid | `opencode/deepseek-v4-flash-free` | `ollama/deepseek-v4-flash:cloud` | `opencode-go/deepseek-v4-flash` | Generalist primary |
| executor | Mid | `opencode/deepseek-v4-flash-free` | `ollama/deepseek-v4-flash:cloud` | `opencode-go/deepseek-v4-flash` | Implementation |
| debugger | Mid | `opencode/deepseek-v4-flash-free` | `ollama/deepseek-v4-flash:cloud` | `opencode-go/deepseek-v4-flash` | Debugging and build fixes |
| test-engineer | Mid | `opencode/deepseek-v4-flash-free` | `ollama/deepseek-v4-flash:cloud` | `opencode-go/deepseek-v4-flash` | Test writing and TDD |
| designer | Mid | `opencode/deepseek-v4-flash-free` | `ollama/deepseek-v4-flash:cloud` | `opencode-go/deepseek-v4-flash` | UI/UX implementation |
| frontend-design | Mid | `opencode/deepseek-v4-flash-free` | `ollama/deepseek-v4-flash:cloud` | `opencode-go/deepseek-v4-flash` | Frontend interfaces |
| git-master | Mid | `opencode/deepseek-v4-flash-free` | `ollama/deepseek-v4-flash:cloud` | `opencode-go/deepseek-v4-flash` | Git operations |
| config-orchestrator | Mid | `opencode/deepseek-v4-flash-free` | `ollama/deepseek-v4-flash:cloud` | `opencode-go/deepseek-v4-flash` | Configuration management |
| skill-creator | Mid | `opencode/deepseek-v4-flash-free` | `ollama/deepseek-v4-flash:cloud` | `opencode-go/deepseek-v4-flash` | Skill creation |
| refactoring | Mid | `opencode/deepseek-v4-flash-free` | `ollama/deepseek-v4-flash:cloud` | `opencode-go/deepseek-v4-flash` | Code restructuring |
| code-simplifier | Mid | `opencode/deepseek-v4-flash-free` | `ollama/deepseek-v4-flash:cloud` | `opencode-go/deepseek-v4-flash` | Code cleanup |
| qa-tester | Mid | `opencode/deepseek-v4-flash-free` | `ollama/deepseek-v4-flash:cloud` | `opencode-go/deepseek-v4-flash` | Interactive testing |
| writer | Fast | `opencode/deepseek-v4-flash-free` | `ollama/glm-5.2:cloud` | `opencode-go/glm-5.2` | Documentation |
| verifier | Fast | `opencode/deepseek-v4-flash-free` | `ollama/glm-5.2:cloud` | `opencode-go/glm-5.2` | Completion verification |
| document-specialist | Fast | `opencode/deepseek-v4-flash-free` | `ollama/glm-5.2:cloud` | `opencode-go/glm-5.2` | External docs lookup |
| effort-estimator | Fast | `opencode/deepseek-v4-flash-free` | `ollama/glm-5.2:cloud` | `opencode-go/glm-5.2` | Effort estimation |
| explore | Fast | `opencode/deepseek-v4-flash-free` | `ollama/glm-5.2:cloud` | `opencode-go/glm-5.2` | Codebase search (READ-ONLY) |
| commit-drafter | Fast | `opencode/deepseek-v4-flash-free` | `ollama/glm-5.2:cloud` | `opencode-go/glm-5.2` | Commit message drafting |
| prompt-simplifier | Fast | `opencode/deepseek-v4-flash-free` | `ollama/glm-5.2:cloud` | `opencode-go/glm-5.2` | Prompt analysis (READ-ONLY) |

## Tier Distribution

| Tier | Count | Primary Model | Fallback 1 (ollama) | Fallback 2 (opencode-go) | Agents |
|------|-------|---------------|---------------------|--------------------------|--------|
| **Top** | 10 | `opencode/deepseek-v4-flash-free` | `ollama/deepseek-v4-pro:cloud` | `opencode-go/deepseek-v4-pro` | architect, planner, code-reviewer, security-reviewer, scientist, deep-thinker, requirements-analyzer, tracer, analyst, critic |
| **Mid** | 12 | `opencode/deepseek-v4-flash-free` | `ollama/deepseek-v4-flash:cloud` | `opencode-go/deepseek-v4-flash` | hubs, executor, debugger, test-engineer, designer, frontend-design, git-master, config-orchestrator, skill-creator, refactoring, code-simplifier, qa-tester |
| **Fast** | 7 | `opencode/deepseek-v4-flash-free` | `ollama/glm-5.2:cloud` | `opencode-go/glm-5.2` | writer, verifier, document-specialist, effort-estimator, explore, commit-drafter, prompt-simplifier |

## Fallback Guidelines for Orchestrators

When a subagent fails with a provider-level error (connection refused, model unavailable, timeout, 502/503/504, rate limit), the orchestrating agent follows this fallback chain:

| Attempt | Provider | Model | Notes |
|---------|----------|-------|-------|
| 0 (initial) | Opencode Zen | `opencode/deepseek-v4-flash-free` | Default from agent definition |
| 1 (first retry) | ollama | `ollama/{model}:cloud` | Fallback 1 |
| 2 (second retry) | opencode-go | `opencode-go/{model}` | Fallback 2 |
| 3 (third retry) | opencode-go | `opencode-go/{model}` | Retry Fallback 2 |
| After 3 retries → | — | — | Escalate to user via `question` tool |

### Error Classification

| Error Type | Apply Fallback? | Action |
|-----------|----------------|--------|
| Provider connection refused / timeout | **Yes** | Retry with ollama (FB1), then opencode-go (FB2) |
| Model unavailable / 502/503/504 | **Yes** | Retry with ollama (FB1), then opencode-go (FB2) |
| Rate limit / quota exceeded | **Yes** | Retry with ollama (FB1), then opencode-go (FB2) |
| Wrong output / incorrect implementation | **No** | Fix the task prompt, re-invoke same agent |
| File not found / permission denied | **No** | Fix the environmental issue |
| Agent type not found | **Yes** | Retry with opencode-go fallback agent |

### Retry Counter Rules

- Counters are **per-subagent, per-workflow** — failures in `@executor` don't block `@verifier`
- After 4 total attempts (1 primary + 3 fallback) for a single subagent, escalate to user
- In parallel orchestration, other subagents continue normally while the stuck agent awaits user decision

## Override Guidance for Orchestrators

Orchestrators (ralph, ultrawork, team, autopilot) should use the default tier assignments above. Override only when:

### When to Upgrade (Fast → Mid, Mid → Top)

- **Critical security review**: Upgrade `code-reviewer` or `security-reviewer` tasks that involve authentication, cryptography, or data access — though they are already Top tier.
- **Complex debugging**: Upgrade `debugger` from Mid to Top when root cause is ambiguous across multiple systems or involves concurrency/race conditions.
- **Architecture-sensitive refactoring**: Upgrade `refactoring` or `code-simplifier` from Mid to Top when changes affect core abstractions or cross-module boundaries.
- **High-stakes writing**: Upgrade `writer` from Fast to Mid when producing security-sensitive documentation (auth flows, API contracts) where accuracy is critical.
- **Critical verification**: Upgrade `verifier` from Fast to Mid when verifying security fixes, data integrity changes, or release-blocking regressions.

### When to Downgrade (Top → Mid, Mid → Fast)

- **Simple code review**: Downgrade `code-reviewer` from Top to Mid for style-only or typo-level reviews with no architectural implications.
- **Routine testing**: Downgrade `test-engineer` from Mid to Fast for straightforward unit test generation with no edge case complexity.
- **Simple git operations**: Downgrade `git-master` from Mid to Fast for single-commit operations with no rebasing or history management.
- **Bulk exploration**: Downgrade `explore` stays at Fast — already optimized for speed. No further downgrade available.

### When to Use nemotron-3-ultra:cloud

The `ollama/nemotron-3-ultra:cloud` model is an alternative mid-tier model optimized for:

- **Persistent orchestration loops**: When an agent runs many turns in a loop (ralph cycles, team coordination), `ollama/nemotron-3-ultra:cloud` maintains context more efficiently.
- **Long-running agent coordination**: When the `hubs` agent is orchestrating multiple subagents over many turns, switch from `opencode/deepseek-v4-flash-free` to `ollama/nemotron-3-ultra:cloud`.
- **Cost-sensitive mid-tier work**: When budget constraints favor a different mid-tier model with sufficient capability.

Override the `hubs` agent to `ollama/nemotron-3-ultra:cloud` when running persistent orchestration patterns. Override `executor` to `ollama/nemotron-3-ultra:cloud` for long implementation sessions that need sustained context.

### Override Rules

1. **Default to the tier assignment** unless one of the above conditions applies.
2. **Never downgrade Top-tier agents below Mid tier.** The reasoning quality is non-negotiable for review, analysis, and security tasks.
3. **Never upgrade Fast-tier agents to Top tier.** If a task requires Top-tier reasoning, delegate to an appropriate Top-tier agent instead.
4. **Document overrides** in orchestration state so the team can audit model choices.
5. **One override at a time.** Do not stack multiple override conditions — pick the highest-priority reason.

---

*Generated from `agents/*.md` frontmatter model assignments. Last updated: 2026-06-22.*