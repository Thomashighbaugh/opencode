# Skills Reference

> Complete reference for all 57 JOC workflow skills

## Table of Contents

- [Overview](#overview)
- [Skill Architecture](#skill-architecture)
- [Skill Levels](#skill-levels)
- [Execution Modes](#execution-modes)
- [Planning & Analysis](#planning--analysis)
- [Code Quality & Refactoring](#code-quality--refactoring)
- [Development & Generation](#development--generation)
- [Project Management](#project-management)
- [Setup & Configuration](#setup--configuration)
- [Documentation & Knowledge](#documentation--knowledge)
- [React & TypeScript](#react--typescript)
- [CSS & Design](#css--design)
- [Utilities](#utilities)
- [Skill Definition Format](#skill-definition-format)
- [Creating Custom Skills](#creating-custom-skills)
- [Best Practices](#best-practices)

## Overview

Skills are reusable workflows that provide specialized capabilities. Each skill has:

- **Name**: Unique identifier
- **Description**: What the skill does
- **Level**: Complexity/autonomy rating (1-7)
- **Argument Hint**: Expected arguments (optional)
- **User-Invocable**: Whether users can directly invoke it

## Skill Architecture

### How Skills Work

```
┌─────────────────────────────────────────────────────────────────┐
│                     User Request                                 │
│                           │                                       │
│                           ▼                                       │
│              ┌─────────────────────┐                              │
│              │  Skill Invocation   │                              │
│              │  (loadSkill tool)   │                              │
│              └─────────────────────┘                              │
│                           │                                       │
│                           ▼                                       │
│              ┌─────────────────────┐                              │
│              │  SKILL.md Parsing   │                              │
│              │  (YAML frontmatter) │                              │
│              └─────────────────────┘                              │
│                           │                                       │
│                           ▼                                       │
│              ┌─────────────────────┐                              │
│              │  Skill Execution    │                              │
│              │  (Following steps)  │                              │
│              └─────────────────────┘                              │
│                           │                                       │
│          ┌───────────────┴───────────────┐                        │
│          ▼                 ▼                 ▼                  │
│    ┌──────────┐     ┌──────────┐     ┌──────────┐              │
│    │ Agent 1  │     │ Agent 2  │     │ Agent N  │              │
│    │(if needed)│    │(if needed)│    │(if needed)│              │
│    └──────────┘     └──────────┘     └──────────┘              │
│          │                 │                 │                  │
│          └─────────────────┴─────────────────┘                  │
│                            ▼                                      │
│              ┌─────────────────────┐                              │
│              │  Artifact Storage   │                              │
│              │  (optional)         │                              │
│              └─────────────────────┘                              │
│                            │                                       │
│                            ▼                                       │
│              ┌─────────────────────┐                              │
│              │  Completion Report  │                              │
│              └─────────────────────┘                              │
└─────────────────────────────────────────────────────────────────┘
```

### Skill Invocation

Skills can be invoked in multiple ways:

```bash
# Command invocation
/ralph fix all TypeScript errors
/autopilot build a REST API

# Skill tool invocation
loadSkill({ skillName: "ralph", args: { task: "fix errors" } })

# Magic keyword detection
"ralph fix the bugs"  # Triggers ralph skill
"build me an API"     # Triggers autopilot skill
```

## Skill Levels

Skills are rated on a complexity/autonomy scale from 1 to 7:

| Level | Autonomy | Complexity | Read-Only? | Example |
|-------|----------|------------|------------|---------|
| 1 | Lowest | Simple utilities | Yes | joc-reference |
| 2 | Low | Standard workflows | Mostly | conventional-commit |
| 3 | Medium | Complex workflows | No | ai-slop-cleaner |
| 4 | High | Autonomous execution | No | ralph, autopilot |
| 5 | Very High | Architectural changes | No | ccg |
| 6 | Max | Complete rewrites | No | (reserved) |
| 7 | Max | Learning/system | No | learner, writer-memory |

**Level Guidelines:**
- **Level 1-2**: Safe operations, minimal side effects
- **Level 3-4**: Standard development work
- **Level 5-7**: Significant autonomy, use with care

## Execution Modes

### ralph

| Property | Value |
|----------|-------|
| **Level** | 4 |
| **User-Invocable** | Yes |
| **Description** | Self-referential loop until task completion with configurable verification reviewer |

**Purpose:**

Ralph mode persists until a task is verified complete. It executes, verifies, and loops until success or maximum iterations.

**Argument Hint:** `<task description>`

**When to Use:**
- Tasks that must complete fully
- Bug fixes where all instances need resolution
- Refactoring that requires all files to be updated
- Any task where "good enough" is not acceptable

**Workflow:**

```
1. INITIALIZE: Set iteration=1, max=100, task=user_input
2. EXECUTE: Perform task using appropriate agent
3. VERIFY: Call verification_reviewer (default: verifier)
4. CHECK: Is task complete?
   - YES: Clear state, report success, exit
   - NO: Increment iteration, analyze failure, goto 2
5. LIMIT: If iteration > max, warn and preserve state
```

**Configuration:**

```json
{
  "ralph": {
    "max_iterations": 100,
    "verification_reviewer": "verifier",
    "auto_verify": true
  }
}
```

**Example:**

```bash
/ralph fix all TypeScript errors
# Iterates until all errors are resolved
```

---

### autopilot

| Property | Value |
|----------|-------|
| **Level** | 4 |
| **User-Invocable** | Yes |
| **Description** | Full autonomous execution from idea to working code |

**Purpose:**

Autopilot handles the complete software development lifecycle autonomously. From a brief description, it analyzes requirements, designs architecture, plans tasks, implements, and verifies.

**Argument Hint:** `<product idea or task description>`

**When to Use:**
- New feature development from scratch
- Prototyping ideas quickly
- End-to-end implementations
- When you want minimal involvement

**Phases:**

1. **Requirements Analysis**: Clarify intent, define acceptance criteria
2. **Technical Design**: Architecture, components, interfaces
3. **Task Planning**: Break into subtasks, prioritize
4. **Implementation**: Execute tasks, handle errors
5. **QA Cycling**: Test, fix, repeat until pass
6. **Verification**: Check requirements met

**Example:**

```bash
/autopilot build a REST API for managing tasks
# Goes through all 6 phases autonomously
```

---

### ultrawork

| Property | Value |
|----------|-------|
| **Level** | 4 |
| **User-Invocable** | Yes |
| **Description** | Parallel execution engine for high-throughput task completion |

**Purpose:**

Ultrawork maximizes throughput by executing multiple independent tasks in parallel.

**Argument Hint:** `<task description>`

**When to Use:**
- Multiple independent tasks
- Large-scale refactoring
- Bulk file operations
- When speed is critical

**Workflow:**

```
1. DECOMPOSE: Split request into independent tasks
2. ANALYZE: Identify dependencies (parallel-safe tasks)
3. ASSIGN: Map tasks to worker agents
4. EXECUTE: Run up to max_parallel_tasks concurrently
5. AGGREGATE: Collect results
6. REINFORCE: Re-run failed tasks if needed
```

**Configuration:**

```json
{
  "ultrawork": {
    "max_parallel_tasks": 5,
    "task_timeout": 300000,
    "retry_failed_tasks": true
  }
}
```

**Example:**

```bash
/ultrawork fix all lint errors in src/
# Fixes files in parallel
```

---

### team

| Property | Value |
|----------|-------|
| **Level** | 4 |
| **User-Invocable** | Yes |
| **Description** | N coordinated agents on shared task list using OpenCode native teams |

**Purpose:**

Team mode orchestrates multiple agents working on shared tasks with coordination.

**Argument Hint:** `<count>:<agent> "<task description>"`

**When to Use:**
- Complex multi-step workflows
- Tasks requiring different expertise
- Code review + implementation workflows

**Example:**

```bash
/team 3:executor "add feature X"
/team 1:architect 2:executor "design and implement auth"
```

---

### ultraqa

| Property | Value |
|----------|-------|
| **Level** | 3 |
| **User-Invocable** | Yes |
| **Description** | QA cycling workflow - test, verify, fix, repeat until goal met |

**Purpose:**

UltraQA cycles through testing, verification, and fixing until all tests pass.

**Argument Hint:** `<qa goal>`

**When to Use:**
- Making all tests pass
- Fixing CI/CD failures
- Achieving coverage targets

**Workflow:**

```
1. TEST: Run test suite
2. VERIFY: Check results against goal
3. FIX: Address failures
4. REPEAT: Until success or max_cycles
```

**Example:**

```bash
/ultraqa verify all tests pass
# Cycles until all tests pass
```

---

### cancel

| Property | Value |
|----------|-------|
| **Level** | 2 |
| **User-Invocable** | Yes |
| **Description** | Cancel any active OMC mode (autopilot, ralph, ultrawork, ultraqa, team) |

**Purpose:**

Stops any active execution mode and clears state.

**Example:**

```bash
/cancel
# Or magic keyword: "stop" or "cancelomc"
```

## Planning & Analysis

### omc-plan

| Property | Value |
|----------|-------|
| **Level** | 4 |
| **User-Invocable** | Yes |
| **Description** | Strategic planning with optional interview workflow |

**Purpose:**

Creates strategic plans with optional clarification interview.

**Workflow:**
1. Analyze request
2. Ask clarifying questions (optional)
3. Generate structured plan
4. Save to artifacts

---

### ralplan

| Property | Value |
|----------|-------|
| **Level** | 4 |
| **User-Invocable** | Yes |
| **Description** | Consensus planning entrypoint that auto-gates vague requests before execution |

**Purpose:**

Entry point for planning that ensures requests are clear before execution.

---

### deep-interview

| Property | Value |
|----------|-------|
| **Level** | 3 |
| **User-Invocable** | Yes |
| **Description** | Socratic deep interview with mathematical ambiguity gating before autonomous execution |

**Purpose:**

Conducts Socratic interviews to clarify requirements before execution.

**Workflow:**
1. Ask clarifying questions
2. Gate on ambiguity resolution
3. Proceed when requirements are clear

---

### deep-dive

| Property | Value |
|----------|-------|
| **Level** | 4 |
| **User-Invocable** | Yes |
| **Description** | 2-stage pipeline: trace (causal investigation) -> deep-interview (requirements crystallization) |

**Purpose:**

Two-stage analysis pipeline for complex problems.

---

### planning-and-task-breakdown

| Property | Value |
|----------|-------|
| **Level** | 3 |
| **User-Invocable** | Yes |
| **Description** | Break work into ordered tasks with explicit acceptance criteria |

**Purpose:**

Creates ordered task lists with acceptance criteria.

---

### sciomc

| Property | Value |
|----------|-------|
| **Level** | 4 |
| **User-Invocable** | Yes |
| **Description** | Orchestrate parallel scientist agents for comprehensive analysis with AUTO mode |

**Purpose:**

Parallel research orchestration for comprehensive analysis.

---

### trace

| Property | Value |
|----------|-------|
| **Level** | 2 |
| **User-Invocable** | Yes |
| **Description** | Evidence-driven tracing lane that orchestrates competing tracer hypotheses |

**Purpose:**

Investigates issues with competing hypotheses and evidence tracking.

---

### external-context

| Property | Value |
|----------|-------|
| **Level** | 4 |
| **User-Invocable** | Yes |
| **Description** | Invoke parallel document-specialist agents for external web searches and documentation lookup |

**Purpose:**

Fetches external documentation and performs web searches.

---

## Code Quality & Refactoring

### ai-slop-cleaner

| Property | Value |
|----------|-------|
| **Level** | 3 |
| **User-Invocable** | Yes |
| **Description** | Clean AI-generated code slop with regression-safe, deletion-first workflow |

**Purpose:**

Removes AI-generated code patterns that reduce code quality.

**Workflow:**
1. Identify AI-generated patterns
2. Plan deletion strategy
3. Remove safely with tests
4. Verify no regression

---

### self-improve

| Property | Value |
|----------|-------|
| **Level** | 4 |
| **User-Invocable** | Yes |
| **Description** | Autonomous evolutionary code improvement engine with tournament selection |

**Purpose:**

Evolves code improvements through tournament selection.

---

### verify

| Property | Value |
|----------|-------|
| **Level** | 3 |
| **User-Invocable** | Yes |
| **Description** | Verify that a change really works before you claim completion |

**Purpose:**

Verification workflow for changes.

---

### agent-md-refactor

| Property | Value |
|----------|-------|
| **Level** | 3 |
| **User-Invocable** | Yes |
| **Description** | Refactor bloated AGENTS.md files to follow progressive disclosure principles |

**Purpose:**

Restructures large AGENTS.md files into organized, linked documentation.

---

### visual-verdict

| Property | Value |
|----------|-------|
| **Level** | 2 |
| **User-Invocable** | Yes |
| **Description** | Structured visual QA verdict for screenshot-to-reference comparisons |

**Purpose:**

Compares screenshots against references for QA.

---

## Development & Generation

### deepinit

| Property | Value |
|----------|-------|
| **Level** | 4 |
| **User-Invocable** | Yes |
| **Description** | Deep codebase initialization with hierarchical AGENTS.md documentation |

**Purpose:**

Creates comprehensive AGENTS.md documentation for codebases.

---

### changelog-generator

| Property | Value |
|----------|-------|
| **Level** | 2 |
| **User-Invocable** | Yes |
| **Description** | Automatically creates user-facing changelogs from git commits |

**Purpose:**

Generates changelogs from git history.

---

### icon-generator

| Property | Value |
|----------|-------|
| **Level** | 2 |
| **User-Invocable** | Yes |
| **Description** | Generate web UI/UX icon assets from a single source |

**Purpose:**

Creates favicon, apple-touch-icon, PWA icons from SVG/PNG.

---

### skillify

| Property | Value |
|----------|-------|
| **Level** | 3 |
| **User-Invocable** | Yes |
| **Description** | Turn a repeatable workflow from the current session into a reusable skill draft |

**Purpose:**

Extracts workflows into reusable skills.

---

### learner

| Property | Value |
|----------|-------|
| **Level** | 7 |
| **User-Invocable** | Yes |
| **Description** | Extract a learned skill from the current conversation |

**Purpose:**

Learning system for extracting skills from conversations.

---

### skill-creator

| Property | Value |
|----------|-------|
| **Level** | 3 |
| **User-Invocable** | Yes |
| **Description** | Guide for creating effective skills |

**Purpose:**

Guides users through skill creation process.

---

### opencode-agent-creator

| Property | Value |
|----------|-------|
| **Level** | 3 |
| **User-Invocable** | Yes |
| **Description** | Create specialized OpenCode agents with proper configuration |

**Purpose:**

Guides creation of agent definitions.

---

### design-system-starter

| Property | Value |
|----------|-------|
| **Level** | 3 |
| **User-Invocable** | Yes |
| **Description** | Create and evolve design systems with design tokens and component architecture |

**Purpose:**

Sets up design system infrastructure.

---

## Project Management

### project-session-manager

| Property | Value |
|----------|-------|
| **Level** | 2 |
| **User-Invocable** | Yes |
| **Description** | Worktree-first dev environment manager for issues, PRs, and features |

**Purpose:**

Manages git worktrees and development sessions.

---

### release

| Property | Value |
|----------|-------|
| **Level** | 3 |
| **User-Invocable** | Yes |
| **Description** | Automated release workflow for OpenCode JOC |

**Purpose:**

Handles version bumping, changelogs, and releases.

---

### remember

| Property | Value |
|----------|-------|
| **Level** | 2 |
| **User-Invocable** | Yes |
| **Description** | Review reusable project knowledge and decide what belongs in project memory |

**Purpose:**

Manages project memory and knowledge persistence.

---

### configure-notifications

| Property | Value |
|----------|-------|
| **Level** | 2 |
| **User-Invocable** | Yes |
| **Description** | Configure notification integrations (Telegram, Discord, Slack) |

**Purpose:**

Sets up notification channels.

---

## Setup & Configuration

### joc-setup

| Property | Value |
|----------|-------|
| **Level** | 2 |
| **User-Invocable** | Yes |
| **Description** | Install or refresh OpenCode JOC for plugin, npm, and local-dev setups |

**Purpose:**

Installation and setup workflow.

---

### joc-doctor

| Property | Value |
|----------|-------|
| **Level** | 3 |
| **User-Invocable** | Yes |
| **Description** | Diagnose and fix OpenCode JOC installation issues |

**Purpose:**

Diagnostic tool for JOC issues.

---

### joc-reference

| Property | Value |
|----------|-------|
| **Level** | 1 |
| **User-Invocable** | No |
| **Description** | OAS agent catalog, available tools, team pipeline routing, commit protocol |

**Purpose:**

Auto-loads for reference when delegating to agents. Read-only.

---

### setup

| Property | Value |
|----------|-------|
| **Level** | 2 |
| **User-Invocable** | Yes |
| **Description** | Use first for install/update routing |

**Purpose:**

Routes to appropriate setup flow.

---

### mcp-setup

| Property | Value |
|----------|-------|
| **Level** | 2 |
| **User-Invocable** | Yes |
| **Description** | Configure popular MCP servers for enhanced agent capabilities |

**Purpose:**

Sets up MCP (Model Context Protocol) servers.

---

### config-orchestrator

| Property | Value |
|----------|-------|
| **Level** | - |
| **User-Invocable** | Yes |
| **Description** | Orchestrate OpenCode configurations (via agent) |

**Purpose:**

Manages opencode.jsonc and config files.

---

## Documentation & Knowledge

### wiki

| Property | Value |
|----------|-------|
| **Level** | 4 |
| **User-Invocable** | Yes |
| **Description** | LLM Wiki — persistent markdown knowledge base that compounds across sessions |

**Purpose:**

Creates persistent knowledge base (Karpathy model).

---

### writer-memory

| Property | Value |
|----------|-------|
| **Level** | 7 |
| **User-Invocable** | Yes |
| **Description** | Agentic memory system for writers - track characters, relationships, scenes |

**Purpose:**

Writing project memory management.

---

### context7-docs

| Property | Value |
|----------|-------|
| **Level** | 2 |
| **User-Invocable** | Yes |
| **Description** | Fetch official library docs via Context7 MCP |

**Purpose:**

Fetches library documentation.

---

### github-ops

| Property | Value |
|----------|-------|
| **Level** | 2 |
| **User-Invocable** | Yes |
| **Description** | GitHub operations via gh CLI |

**Purpose:**

GitHub PR, issues, releases operations.

---

### crafting-effective-readmes

| Property | Value |
|----------|-------|
| **Level** | 2 |
| **User-Invocable** | Yes |
| **Description** | Use when writing or improving README files |

**Purpose:**

README writing guidance.

---

### professional-communication

| Property | Value |
|----------|-------|
| **Level** | 2 |
| **User-Invocable** | Yes |
| **Description** | Guide technical communication for software developers |

**Purpose:**

Email, messaging, meeting communication guide.

---

## React & TypeScript

### react-key-prop

| Property | Value |
|----------|-------|
| **Level** | 1 |
| **User-Invocable** | Yes |
| **Description** | Proper key prop usage in React lists |

**Purpose:**

Guides correct key usage in React.

---

### react-use-callback

| Property | Value |
|----------|-------|
| **Level** | 1 |
| **User-Invocable** | Yes |
| **Description** | useCallback hook guidance |

**Purpose:**

Explains useCallback best practices.

---

### react-use-client-boundary

| Property | Value |
|----------|-------|
| **Level** | 1 |
| **User-Invocable** | Yes |
| **Description** | "use client" directive guidance |

**Purpose:**

Guides Next.js client boundary usage.

---

### react-use-state

| Property | Value |
|----------|-------|
| **Level** | 1 |
| **User-Invocable** | Yes |
| **Description** | useState hook guidance |

**Purpose:**

Explains useState patterns.

---

### react-useeffect-avoid

| Property | Value |
|----------|-------|
| **Level** | 1 |
| **User-Invocable** | Yes |
| **Description** | When NOT to use useEffect |

**Purpose:**

Guides away from useEffect misuse.

---

### typescript-advanced-types

| Property | Value |
|----------|-------|
| **Level** | 1 |
| **User-Invocable** | Yes |
| **Description** | Advanced TypeScript types |

**Purpose:**

Explains generics, conditionals, mapped types.

---

### typescript-best-practices

| Property | Value |
|----------|-------|
| **Level** | 1 |
| **User-Invocable** | Yes |
| **Description** | TypeScript best practices |

**Purpose:**

General TypeScript guidance.

---

### typescript-interface-vs-type

| Property | Value |
|----------|-------|
| **Level** | 1 |
| **User-Invocable** | Yes |
| **Description** | Interface vs type guidance |

**Purpose:**

Explains when to use each.

---

### typescript-satisfies-operator

| Property | Value |
|----------|-------|
| **Level** | 1 |
| **User-Invocable** | Yes |
| **Description** | satisfies operator usage |

**Purpose:**

Explains TypeScript satisfies operator.

---

## CSS & Design

### tailwind-v4-configuration

| Property | Value |
|----------|-------|
| **Level** | 1 |
| **User-Invocable** | Yes |
| **Description** | Configure Tailwind CSS v4 with CSS-first approach |

**Purpose:**

Tailwind v4 setup guide.

---

### code-architecture-tailwind-v4-best-practices

| Property | Value |
|----------|-------|
| **Level** | 1 |
| **User-Invocable** | Yes |
| **Description** | Tailwind CSS v4 patterns |

**Purpose:**

Tailwind v4 best practices.

---

### css-container-queries

| Property | Value |
|----------|-------|
| **Level** | 1 |
| **User-Invocable** | Yes |
| **Description** | CSS container queries for component-based responsive design |

**Purpose:**

Container query usage.

---

### cognitive-fluency-psychology

| Property | Value |
|----------|-------|
| **Level** | 1 |
| **User-Invocable** | Yes |
| **Description** | Apply cognitive fluency principles for better UX |

**Purpose:**

UX psychology principles.

---

### humanizer

| Property | Value |
|----------|-------|
| **Level** | 1 |
| **User-Invocable** | Yes |
| **Description** | Remove signs of AI-generated writing from text |

**Purpose:**

Makes text sound more human.

---

### code-architecture-wrong-abstraction

| Property | Value |
|----------|-------|
| **Level** | 1 |
| **User-Invocable** | Yes |
| **Description** | When to abstract vs duplicate code |

**Purpose:**

Guides abstraction decisions.

---

## Utilities

### ask

| Property | Value |
|----------|-------|
| **Level** | 3 |
| **User-Invocable** | Yes |
| **Description** | Process-first advisor routing for multi-model consultation |

**Purpose:**

Routes questions to appropriate models.

---

### ccg

| Property | Value |
|----------|-------|
| **Level** | 5 |
| **User-Invocable** | Yes |
| **Description** | Multi-model orchestration via ask commands for alternative perspectives |

**Purpose:**

OpenCode-Codex-Gemini tri-model orchestration.

---

### debug

| Property | Value |
|----------|-------|
| **Level** | 2 |
| **User-Invocable** | Yes |
| **Description** | Diagnose the current OMC session or repo state |

**Purpose:**

Session/repo diagnostics.

---

### hud

| Property | Value |
|----------|-------|
| **Level** | 2 |
| **User-Invocable** | Yes |
| **Description** | Configure HUD display options |

**Purpose:**

HUD configuration.

---

### file-organizer

| Property | Value |
|----------|-------|
| **Level** | 2 |
| **User-Invocable** | Yes |
| **Description** | Intelligently organizes files and folders |

**Purpose:**

File organization automation.

---

### naming-cheatsheet

| Property | Value |
|----------|-------|
| **Level** | 2 |
| **User-Invocable** | Yes |
| **Description** | Language-agnostic naming conventions using A/HC/LC pattern |

**Purpose:**

Naming convention guide.

---

### conventional-commit

| Property | Value |
|----------|-------|
| **Level** | 2 |
| **User-Invocable** | Yes |
| **Description** | Structure commit messages following the Conventional Commits specification |

**Purpose:**

Conventional commit formatting.

---

### graph-thinking

| Property | Value |
|----------|-------|
| **Level** | 3 |
| **User-Invocable** | Yes |
| **Description** | Graph-based thinking for visualizing complex relationships |

**Purpose:**

Graph analysis methodology.

---

### deliberate-practice

| Property | Value |
|----------|-------|
| **Level** | 3 |
| **User-Invocable** | Yes |
| **Description** | Apply deliberate practice principles for skill acquisition |

**Purpose:**

Learning methodology.

---

### skill

| Property | Value |
|----------|-------|
| **Level** | 2 |
| **User-Invocable** | Yes |
| **Description** | Manage local skills - list, add, remove, search, edit |

**Purpose:**

Skill management commands.

---

### idea-refine

| Property | Value |
|----------|-------|
| **Level** | 3 |
| **User-Invocable** | Yes |
| **Description** | Refines ideas iteratively through structured thinking |

**Purpose:**

Idea refinement workflow.

---

### web-to-markdown

| Property | Value |
|----------|-------|
| **Level** | 2 |
| **User-Invocable** | Yes |
| **Description** | Converts webpage URLs to clean Markdown |

**Purpose:**

Web content conversion.

---

### autoresearch-agent

| Property | Value |
|----------|-------|
| **Level** | 3 |
| **User-Invocable** | Yes |
| **Description** | Delegate autoresearch tasks to a headless sub-agent process |

**Purpose:**

Background research execution.

---

## Skill Definition Format

Skills are defined in `SKILL.md` files:

```markdown
---
name: my-skill
description: Brief description. Use when [trigger context].
argument-hint: "<expected arguments>"
level: 3
user-invocable: true
---

<Purpose>
Detailed explanation of what the skill does and why.
</Purpose>

<Workflow>
Step-by-step instructions for execution.
</Workflow>

<Examples>
Concrete usage examples.
</Examples>

<Configuration>
Optional configuration options.
</Configuration>

<Scripts>
Optional bundled shell scripts.
</Scripts>

<Artifacts>
Expected output artifacts.
</Artifacts>
```

### Required Fields

```yaml
name: skill-name              # Unique identifier
description: What it does     # Brief description
level: 3                      # 1-7 complexity
```

### Optional Fields

```yaml
argument-hint: "<args>"       # Expected arguments
user-invocable: true          # Can be directly invoked (default: true)
```

## Creating Custom Skills

### Directory Structure

```
.opencode/skills/my-skill/
├── SKILL.md           # Required: Skill definition
├── scripts/           # Optional: Bundled scripts
│   ├── setup.sh
│   └── validate.sh
└── templates/         # Optional: Templates
    └── component.tsx
```

### Step 1: Create Directory

```bash
mkdir -p .opencode/skills/my-skill
```

### Step 2: Write SKILL.md

```markdown
---
name: my-skill
description: Brief description. Use when [trigger context].
level: 2
---

<Purpose>
This skill does X and Y.
</Purpose>

<Workflow>
1. First step
2. Second step
3. Return results
</Workflow>

<Triggers>
- "my-skill"
- "trigger phrase"
</Triggers>
```

### Step 3: Add Scripts (Optional)

```bash
# scripts/setup.sh
#!/bin/bash
echo "Setting up..."
```

### Step 4: Test

```bash
# Invoke skill
loadSkill({ skillName: "my-skill" })

# Or via command
/my-skill
```

## Best Practices

### Skill Level Selection

| Task Type | Recommended Level |
|-----------|-----------------|
| Read-only queries | 1-2 |
| Minor modifications | 2-3 |
| Standard development | 3-4 |
| Autonomous execution | 4-5 |
| Architectural changes | 5-6 |
| Learning/evolution | 6-7 |

### Writing Good Descriptions

```yaml
# Good
description: Clean AI-generated code slop with regression-safe, deletion-first workflow

# Bad
description: Clean code

# Good
description: Full autonomous execution from idea to working code

# Bad
description: Build things
```

### Trigger Patterns

Include trigger patterns for magic keyword detection:

```markdown
<Triggers>
- "my-skill": Direct invocation
- "trigger phrase": Natural language
- "another trigger": Alternative phrasing
</Triggers>
```

### Workflow Guidelines

1. Always include Purpose section
2. Number workflow steps
3. Include examples
4. Document configuration options
5. List expected artifacts

## See Also

- [Execution Modes](./execution-modes.md) - Mode skills (ralph, autopilot, etc.)
- [Agents](./agents.md) - Agents that skills may invoke
- [Tools](./tools.md) - Tools for skill development
- [Commands](./commands.md) - Command invocations