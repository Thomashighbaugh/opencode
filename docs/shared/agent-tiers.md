# Agent Tiers Reference

> Maps each of the 29 Hubs agents to a recommended model tier based on their role complexity and current model assignment. Referenced by ralph, ultrawork, and orchestration skills for agent selection.

## Model Tiers

| Tier | Model | Context | Output | Best For |
|------|-------|---------|--------|----------|
| **Top** | `deepseek-v4-pro:cloud` | 1M | 131K | Complex reasoning, architecture, security review |
| **Mid** | `deepseek-v4-flash:cloud` | 1M | 131K | Implementation, execution, general work |
| **Mid** | `nemotron-3-ultra:cloud` | 256K | 131K | Orchestration, long-running agents |
| **Fast** | `glm-5.1:cloud` | 202K | 131K | Exploration, documentation, simple tasks |

- **Top tier** agents need deep reasoning, nuanced analysis, or read-only review authority.
- **Mid tier** agents implement, execute, or orchestrate — they need strong coding and moderate reasoning.
- **Fast tier** agents search, summarize, draft, or estimate — they need speed over deep reasoning.

The `nemotron-3-ultra:cloud` model is an alternative mid-tier option optimized for orchestration and long-running agent loops. Override to `nemotron-3-ultra:cloud` when an agent runs as a persistent orchestrator or needs sustained context across many turns.

## Agent-to-Tier Mapping

### Top Tier — deepseek-v4-pro:cloud

Deep reasoning, architectural judgment, security analysis, and critical review.

| Agent | Current Model | Rationale |
|-------|---------------|-----------|
| **architect** | `deepseek-v4-pro:cloud` | READ-ONLY strategic advisor. Diagnoses bugs, provides architectural guidance with file:line evidence. Requires deep reasoning and nuanced analysis. |
| **planner** | `deepseek-v4-pro:cloud` | Strategic planning consultant. Runs structured interviews, generates multi-step work plans with acceptance criteria. Needs strong reasoning for plan quality. |
| **code-reviewer** | `deepseek-v4-pro:cloud` | READ-ONLY code smell detector and deep-dive reviewer. Must identify subtle security, performance, and architecture issues across many smell categories. |
| **security-reviewer** | `deepseek-v4-pro:cloud` | READ-ONLY OWASP Top 10 specialist. Identifies vulnerabilities, assesses severity by exploitability and blast radius. Errors have high cost. |
| **scientist** | `deepseek-v4-pro:cloud` | READ-ONLY data analyst. Requires statistical rigor — confidence intervals, effect sizes, hypothesis testing. Errors in analysis propagate to decisions. |
| **deep-thinker** | `deepseek-v4-pro:cloud` | Structured thinking partner for ambiguous problems. Applies mental models, cross-framework analysis. Needs deep reasoning capacity. |
| **requirements-analyzer** | `deepseek-v4-pro:cloud` | READ-ONLY requirements analyst. Evaluates clarity, scope, feasibility, risk. Gap analysis requires thorough reasoning. |
| **tracer** | `deepseek-v4-pro:cloud` | Evidence-driven causal tracer with competing hypotheses. Must rank evidence by strength, avoid premature convergence. Deep reasoning essential. |
| **analyst** | `deepseek-v4-pro:cloud` | READ-ONLY pre-planning consultant. Catches requirement gaps, undefined guardrails, scope risks. Thoroughness demands strong reasoning. |
| **critic** | `deepseek-v4-pro:cloud` | READ-ONLY final quality gate. Multi-perspective review, gap analysis, pre-commitment predictions. Maximum effort required. |

### Mid Tier — deepseek-v4-flash:cloud

Implementation, execution, configuration, and interactive testing.

| Agent | Current Model | Rationale |
|-------|---------------|-----------|
| **hubs** | `deepseek-v4-flash:cloud` | Generalist primary agent. Handles most tasks directly, suggests subagent patterns when beneficial. Needs strong coding and breadth, not maximum depth. |
| **executor** | `deepseek-v4-flash:cloud` | Focused task executor. Implements code changes precisely. Needs strong coding and fast execution, not architectural reasoning. |
| **debugger** | `deepseek-v4-flash:cloud` | Root-cause analysis and build error resolution. Needs systematic investigation and code fixes — practical coding over deep theory. |
| **test-engineer** | `deepseek-v4-flash:cloud` | Test strategy and TDD workflows. Writes tests, runs suites, diagnoses flaky tests. Implementation-focused. |
| **designer** | `deepseek-v4-flash:cloud` | UI/UX designer-developer. Creates production-grade visual implementations. Needs strong frontend coding skills. |
| **frontend-design** | `deepseek-v4-flash:cloud` | Distinctive frontend interfaces with high design quality. Implementation-heavy, needs fast iteration on visual code. |
| **git-master** | `deepseek-v4-flash:cloud` | Git operations specialist. Atomic commits, style detection, rebasing. Practical git execution over deep reasoning. |
| **config-orchestrator** | `deepseek-v4-flash:cloud` | OpenCode configuration specialist. Manages jsonc, skills, agents, plugins. Practical configuration work. |
| **skill-creator** | `deepseek-v4-flash:cloud` | Creates custom skills with proper structure. Template-driven work requiring coding and documentation. |
| **refactoring** | `deepseek-v4-flash:cloud` | Plans and implements code refactoring. Needs strong coding to restructure code while preserving behavior. |
| **code-simplifier** | `deepseek-v4-flash:cloud` | Simplifies code for clarity and maintainability. Implementation-focused, needs practical coding skill. |
| **qa-tester** | `deepseek-v4-flash:cloud` | Interactive CLI testing via tmux. Practical test execution, session management, output capture. |

### Fast Tier — glm-5.1:cloud

Search, summarization, drafting, estimation — speed over depth.

| Agent | Current Model | Rationale |
|-------|---------------|-----------|
| **writer** | `glm-5.1:cloud` | Technical documentation. Needs clear writing, code example verification, and style matching. Speed and clarity over deep reasoning. |
| **verifier** | `glm-5.1:cloud` | Verification strategy and evidence-based completion checks. Runs tests, checks builds, compares results. Structured verification over creative reasoning. |
| **document-specialist** | `glm-5.1:cloud` | External documentation lookup. Searches docs, synthesizes findings, cites sources. Search and summarization task. |
| **effort-estimator** | `glm-5.1:cloud` | Development effort estimation. Applies size tables and modifiers. Structured, formulaic work. |
| **explore** | `glm-5.1:cloud` | Codebase search specialist. Finds files and patterns, returns structured results. READ-ONLY, speed-critical search. |
| **commit-drafter** | `glm-5.1:cloud` | Structures commit messages from intent. Follows conventional commit format. Lightweight, structured drafting. |
| **prompt-simplifier** | `glm-5.1:cloud` | Analyzes prompt logic and simplifies. READ-ONLY analysis, structured output. |

## Summary Table

| Agent | Tier | Model | Role Category |
|-------|------|-------|--------------|
| architect | Top | `deepseek-v4-pro:cloud` | Strategic analysis (READ-ONLY) |
| planner | Top | `deepseek-v4-pro:cloud` | Strategic planning |
| code-reviewer | Top | `deepseek-v4-pro:cloud` | Quality review (READ-ONLY) |
| security-reviewer | Top | `deepseek-v4-pro:cloud` | Security audit (READ-ONLY) |
| scientist | Top | `deepseek-v4-pro:cloud` | Data analysis (READ-ONLY) |
| deep-thinker | Top | `deepseek-v4-pro:cloud` | Complex reasoning |
| requirements-analyzer | Top | `deepseek-v4-pro:cloud` | Requirements analysis (READ-ONLY) |
| tracer | Top | `deepseek-v4-pro:cloud` | Causal investigation |
| analyst | Top | `deepseek-v4-pro:cloud` | Gap analysis (READ-ONLY) |
| critic | Top | `deepseek-v4-pro:cloud` | Quality gate (READ-ONLY) |
| hubs | Mid | `deepseek-v4-flash:cloud` | Generalist primary |
| executor | Mid | `deepseek-v4-flash:cloud` | Implementation |
| debugger | Mid | `deepseek-v4-flash:cloud` | Debugging and build fixes |
| test-engineer | Mid | `deepseek-v4-flash:cloud` | Test writing and TDD |
| designer | Mid | `deepseek-v4-flash:cloud` | UI/UX implementation |
| frontend-design | Mid | `deepseek-v4-flash:cloud` | Frontend interfaces |
| git-master | Mid | `deepseek-v4-flash:cloud` | Git operations |
| config-orchestrator | Mid | `deepseek-v4-flash:cloud` | Configuration management |
| skill-creator | Mid | `deepseek-v4-flash:cloud` | Skill creation |
| refactoring | Mid | `deepseek-v4-flash:cloud` | Code restructuring |
| code-simplifier | Mid | `deepseek-v4-flash:cloud` | Code cleanup |
| qa-tester | Mid | `deepseek-v4-flash:cloud` | Interactive testing |
| writer | Fast | `glm-5.1:cloud` | Documentation |
| verifier | Fast | `glm-5.1:cloud` | Completion verification |
| document-specialist | Fast | `glm-5.1:cloud` | External docs lookup |
| effort-estimator | Fast | `glm-5.1:cloud` | Effort estimation |
| explore | Fast | `glm-5.1:cloud` | Codebase search (READ-ONLY) |
| commit-drafter | Fast | `glm-5.1:cloud` | Commit message drafting |
| prompt-simplifier | Fast | `glm-5.1:cloud` | Prompt analysis (READ-ONLY) |

## Tier Distribution

| Tier | Count | Agents |
|------|-------|--------|
| **Top** | 10 | architect, planner, code-reviewer, security-reviewer, scientist, deep-thinker, requirements-analyzer, tracer, analyst, critic |
| **Mid** | 12 | hubs, executor, debugger, test-engineer, designer, frontend-design, git-master, config-orchestrator, skill-creator, refactoring, code-simplifier, qa-tester |
| **Fast** | 7 | writer, verifier, document-specialist, effort-estimator, explore, commit-drafter, prompt-simplifier |

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

The `nemotron-3-ultra:cloud` model is an alternative mid-tier model optimized for:

- **Persistent orchestration loops**: When an agent runs many turns in a loop (ralph cycles, team coordination), `nemotron-3-ultra:cloud` maintains context more efficiently.
- **Long-running agent coordination**: When the `hubs` agent is orchestrating multiple subagents over many turns, switch from `deepseek-v4-flash:cloud` to `nemotron-3-ultra:cloud`.
- **Cost-sensitive mid-tier work**: When budget constraints favor a different mid-tier model with sufficient capability.

Override the `hubs` agent to `nemotron-3-ultra:cloud` when running persistent orchestration patterns. Override `executor` to `nemotron-3-ultra:cloud` for long implementation sessions that need sustained context.

### Override Rules

1. **Default to the tier assignment** unless one of the above conditions applies.
2. **Never downgrade Top-tier agents below Mid tier.** The reasoning quality is non-negotiable for review, analysis, and security tasks.
3. **Never upgrade Fast-tier agents to Top tier.** If a task requires Top-tier reasoning, delegate to an appropriate Top-tier agent instead.
4. **Document overrides** in orchestration state so the team can audit model choices.
5. **One override at a time.** Do not stack multiple override conditions — pick the highest-priority reason.

---

*Generated from `agents/*.md` frontmatter model assignments. Last updated: 2026-06-20.*