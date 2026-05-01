# Agents Reference

> Complete reference for all 28 JOC agents

## Table of Contents

- [Overview](#overview)
- [Agent Architecture](#agent-architecture)
- [Implementation Agents](#implementation-agents)
- [Architecture & Design Agents](#architecture--design-agents)
- [Review & Quality Agents](#review--quality-agents)
- [Research & Documentation Agents](#research--documentation-agents)
- [Workflow & Debugging Agents](#workflow--debugging-agents)
- [Specialized Agents](#specialized-agents)
- [Agent Definition Format](#agent-definition-format)
- [Model Selection](#model-selection)
- [Creating Custom Agents](#creating-custom-agents)
- [Best Practices](#best-practices)

## Overview

Agents are specialized subagents that handle specific task types. Each agent has:

- **Name**: Unique identifier
- **Description**: What the agent does
- **Model**: The AI model used (opus, sonnet, haiku, glm-5.1:cloud, etc.)
- **Mode**: Always `subagent` for JOC agents
- **Permissions**: Tool access restrictions

## Agent Architecture

### How Agents Work

```
┌─────────────────────────────────────────────────────────────────┐
│                     OpenCode Session                             │
│                           │                                       │
│                           ▼                                       │
│              ┌─────────────────────┐                              │
│              │   Task Analysis     │                              │
│              │   (Model Selection) │                              │
│              └─────────────────────┘                              │
│                           │                                       │
│          ┌────────────────────────────────────┐                  │
│          ▼                 ▼                 ▼                  │
│    ┌──────────┐     ┌──────────┐     ┌──────────┐              │
│    │ executor │     │architect │     │ planner  │              │
│    │ (sonnet) │     │ (opus)   │     │ (opus)   │              │
│    └──────────┘     └──────────┘     └──────────┘              │
│          │                 │                 │                  │
│          └─────────────────┼─────────────────┘                  │
│                            ▼                                      │
│              ┌─────────────────────┐                              │
│              │   Result Synthesis  │                              │
│              └─────────────────────┘                              │
│                            │                                       │
│                            ▼                                       │
│              ┌─────────────────────┐                              │
│              │   Final Response    │                              │
│              └─────────────────────┘                              │
└─────────────────────────────────────────────────────────────────┘
```

### Agent Selection

Agents are selected based on:

1. **Explicit invocation**: `/agent:executor "implement auth"`
2. **Skill delegation**: Skills invoke appropriate agents
3. **Mode orchestration**: Execution modes spawn agents
4. **Automatic**: OpenCode matches agent to task

## Implementation Agents

Agents focused on code implementation and modification.

### executor

| Property | Value |
|----------|-------|
| **Model** | sonnet |
| **Mode** | subagent |
| **Description** | Focused task executor for implementation work |

**Capabilities:**
- Code implementation and refactoring
- Bug fixing
- Feature development
- File operations (read, write, edit)

**Best For:**
- "Implement the authentication flow"
- "Fix the TypeScript error in auth.ts"
- "Add unit tests for UserService"
- "Refactor the database layer"

**Permissions:**
```yaml
permission:
  loadSkill: allow
  agentContext: allow
  listAgents: allow
  modeState: allow
```

**Example Usage:**
```
The user wants to implement a new feature. You should use the executor agent to:
1. Analyze the existing codebase
2. Implement the feature
3. Test implementation
```

### code-simplifier

| Property | Value |
|----------|-------|
| **Model** | glm-5.1:cloud |
| **Mode** | subagent |
| **Description** | Simplifies and refines code for clarity, consistency, and maintainability while preserving all functionality |

**Capabilities:**
- Code simplification
- Dead code removal
- Pattern consolidation
- Readability improvements

**Best For:**
- "Simplify this complex function"
- "Clean up redundant code patterns"
- "Improve code readability"
- "Remove unused variables"

### refactoring

| Property | Value |
|----------|-------|
| **Model** | glm-5.1:cloud |
| **Mode** | subagent |
| **Description** | Plans and implements code refactoring with intelligent skill loading |

**Capabilities:**
- Architecture analysis
- Refactoring planning
- Incremental implementation
- Behavior preservation

**Best For:**
- "Refactor the auth module to use dependency injection"
- "Extract shared logic into utilities"
- "Convert class components to hooks"
- "Restructure the project layout"

### frontend-design

| Property | Value |
|----------|-------|
| **Model** | sonnet |
| **Mode** | subagent |
| **Description** | Create distinctive, production-grade frontend interfaces with high design quality |

**Capabilities:**
- React/Vue/Svelte components
- CSS/Styling systems
- Accessibility implementation
- Responsive design

**Best For:**
- "Create a responsive navbar component"
- "Build a dashboard layout"
- "Design a form with validation UI"
- "Implement dark mode toggle"

## Architecture & Design Agents

Agents focused on system design and planning.

### architect

| Property | Value |
|----------|-------|
| **Model** | opus |
| **Mode** | subagent |
| **Description** | Strategic Architecture & Debugging Advisor |

**Capabilities:**
- System architecture design
- Technical decision guidance
- Debugging strategy
- Performance analysis

**Best For:**
- "Design the microservices architecture"
- "How should we structure the data layer?"
- "Debug this production issue"
- "Optimize the database schema"

**Note**: READ-ONLY - Does not make changes, only advises.

### planner

| Property | Value |
|----------|-------|
| **Model** | opus |
| **Mode** | subagent |
| **Description** | Strategic planning consultant with interview workflow |

**Capabilities:**
- Task breakdown
- Dependency analysis
- Priority sequencing
- Effort estimation

**Best For:**
- "Plan the sprint 5 implementation"
- "Break down this feature into tasks"
- "What order should we implement these?"
- "Create a project roadmap"

### analyst

| Property | Value |
|----------|-------|
| **Model** | opus |
| **Mode** | subagent |
| **Description** | Pre-planning consultant for requirements analysis |

**Capabilities:**
- Requirements gathering
- Stakeholder analysis
- Constraint identification
- Acceptance criteria definition

**Best For:**
- "Analyze requirements for the payment system"
- "What questions should I ask stakeholders?"
- "Define acceptance criteria for this feature"
- "Document the system boundaries"

### deep-thinker

| Property | Value |
|----------|-------|
| **Model** | glm-5.1:cloud |
| **Mode** | subagent |
| **Description** | Structured thinking partner for complex problems |

**Capabilities:**
- Complex problem analysis
- Decision framework application
- Trade-off evaluation
- Structured reasoning

**Best For:**
- "Think through this architecture decision"
- "What are the trade-offs of approach A vs B?"
- "Help me reason through this edge case"
- "Analyze potential failure modes"

### designer

| Property | Value |
|----------|-------|
| **Model** | sonnet |
| **Mode** | subagent |
| **Description** | UI/UX Designer-Developer for stunning interfaces |

**Capabilities:**
- UI/UX design
- Component design
- User flow mapping
- Accessibility compliance

**Best For:**
- "Design the user onboarding flow"
- "Create a component for data visualization"
- "Improve the form UX"
- "Design for screen readers"

## Review & Quality Agents

Agents focused on code quality and verification.

### code-reviewer

| Property | Value |
|----------|-------|
| **Model** | glm-5.1:cloud |
| **Mode** | subagent |
| **Description** | Perform focused code review by detecting smells and deep-diving concerns |

**Capabilities:**
- Code smell detection
- Pattern analysis
- SOLID principle checks
- Style consistency

**Best For:**
- "Review this PR"
- "Find code smells in this module"
- "Check SOLID compliance"
- "Analyze the code quality"

### security-reviewer

| Property | Value |
|----------|-------|
| **Model** | opus |
| **Mode** | subagent |
| **Description** | Security vulnerability detection (OWASP Top 10, secrets, unsafe patterns) |

**Capabilities:**
- OWASP Top 10 vulnerability checks
- Secret detection
- Unsafe pattern identification
- Authentication/authorization auditing

**Best For:**
- "Security audit this API endpoint"
- "Check for secrets in the codebase"
- "Review authentication implementation"
- "Find potential security vulnerabilities"

### critic

| Property | Value |
|----------|-------|
| **Model** | opus |
| **Mode** | subagent |
| **Description** | Work plan and code review expert — thorough, structured, multi-perspective |

**Capabilities:**
- Multi-perspective analysis
- Plan critique
- Risk identification
- Improvement suggestions

**Best For:**
- "Critique this implementation plan"
- "What could go wrong with this approach?"
- "Challenge these architectural decisions"
- "Review from a different perspective"

### verifier

| Property | Value |
|----------|-------|
| **Model** | sonnet |
| **Mode** | subagent |
| **Description** | Verification strategy, evidence-based completion checks, test adequacy |

**Capabilities:**
- Completion verification
- Test adequacy analysis
- Evidence collection
- Success criteria checking

**Best For:**
- "Verify this task is complete"
- "Check if requirements are met"
- "Are there enough tests?"
- "Validate the implementation"

### qa-tester

| Property | Value |
|----------|-------|
| **Model** | sonnet |
| **Mode** | subagent |
| **Description** | Interactive CLI testing specialist using tmux for session management |

**Capabilities:**
- Interactive testing
- CLI testing
- Session management
- Test scenario execution

**Best For:**
- "Test the CLI commands"
- "Run interactive e2e tests"
- "Validate the user flow"
- "Execute test scenarios"

### test-engineer

| Property | Value |
|----------|-------|
| **Model** | sonnet |
| **Mode** | subagent |
| **Description** | Test strategy, integration/e2e coverage, flaky test hardening, TDD workflows |

**Capabilities:**
- Test strategy design
- Integration test creation
- E2E test implementation
- Flaky test diagnosis

**Best For:**
- "Create a test strategy"
- "Write integration tests"
- "Fix flaky tests"
- "Improve test coverage"

## Research & Documentation Agents

Agents focused on research and documentation.

### scientist

| Property | Value |
|----------|-------|
| **Model** | sonnet |
| **Mode** | subagent |
| **Description** | Data analysis and research execution specialist |

**Capabilities:**
- Data analysis
- Research synthesis
- Hypothesis testing
- Evidence gathering

**Best For:**
- "Analyze these performance metrics"
- "Research best practices for X"
- "Compare these libraries"
- "Evaluate the evidence"

### explore

| Property | Value |
|----------|-------|
| **Model** | haiku |
| **Mode** | subagent |
| **Description** | Codebase search specialist for finding files and code patterns |

**Capabilities:**
- Fast codebase search
- Pattern matching
- File discovery
- Code navigation

**Best For:**
- "Find all uses of this function"
- "Where is X defined?"
- "Show files matching pattern Y"
- "Locate the config for Z"

### writer

| Property | Value |
|----------|-------|
| **Model** | haiku |
| **Mode** | subagent |
| **Description** | Technical documentation writer for README, API docs, and comments |

**Capabilities:**
- README writing
- API documentation
- Code comments
- Docstring generation

**Best For:**
- "Update the README"
- "Write API docs for this module"
- "Add docstrings"
- "Create usage examples"

### document-specialist

| Property | Value |
|----------|-------|
| **Model** | sonnet |
| **Mode** | subagent |
| **Description** | External Documentation & Reference Specialist |

**Capabilities:**
- External doc retrieval
- Library documentation lookup
- API reference fetching
- Framework guides

**Best For:**
- "Fetch the React 18 docs for useEffect"
- "Look up the Tailwind CSS grid utilities"
- "Find the Next.js routing docs"
- "Get the TypeScript handbook for generics"

## Workflow & Debugging Agents

Agents focused on workflows and debugging.

### tracer

| Property | Value |
|----------|-------|
| **Model** | sonnet |
| **Mode** | subagent |
| **Description** | Evidence-driven causal tracing with competing hypotheses |

**Capabilities:**
- Causal analysis
- Hypothesis testing
- Evidence tracking
- Root cause investigation

**Best For:**
- "Trace how this bug occurs"
- "What caused this regression?"
- "Find the source of this error"
- "Investigate this issue"

### git-master

| Property | Value |
|----------|-------|
| **Model** | sonnet |
| **Mode** | subagent |
| **Description** | Git expert for atomic commits, rebasing, and history management |

**Capabilities:**
- Atomic commits
- Rebase workflows
- History management
- Branch strategies

**Best For:**
- "Create atomic commits for these changes"
- "Rebase this branch onto main"
- "Clean up git history"
- "Resolve merge conflicts"

### debugger

| Property | Value |
|----------|-------|
| **Model** | sonnet |
| **Mode** | subagent |
| **Description** | Root-cause analysis, regression isolation, stack trace analysis |

**Capabilities:**
- Stack trace analysis
- Error diagnosis
- Regression isolation
- Debug strategy

**Best For:**
- "Debug this error"
- "Why is this failing?"
- "Analyze this stack trace"
- "Find the root cause"

### config-orchestrator

| Property | Value |
|----------|-------|
| **Model** | glm-5.1:cloud |
| **Mode** | subagent |
| **Description** | Orchestrate OpenCode configurations |

**Capabilities:**
- Config validation
- Setting management
- Skill configuration
- Agent configuration

**Best For:**
- "Configure JOC"
- "Update opencode.jsonc"
- "Validate the configuration"
- "Set up MCP servers"

## Specialized Agents

Agents with specific domain expertise.

### effort-estimator

| Property | Value |
|----------|-------|
| **Model** | glm-5.1:cloud |
| **Mode** | subagent |
| **Description** | Estimate development effort for tasks and features |

**Capabilities:**
- Effort estimation
- Complexity analysis
- Sprint planning
- Risk assessment

**Best For:**
- "Estimate this feature"
- "How long will this take?"
- "Break this into story points"
- "Assess the complexity"

### prompt-simplifier

| Property | Value |
|----------|-------|
| **Model** | glm-5.1:cloud |
| **Mode** | subagent |
| **Description** | Analyzes prompts for logical complexity and outputs simplification recommendations |

**Capabilities:**
- Prompt analysis
- Complexity reduction
- Recommendation generation
- Path identification

**Best For:**
- "Simplify this prompt"
- "Analyze prompt complexity"
- "Identify edge cases"
- "Reduce unnecessary paths"

### skill-creator

| Property | Value |
|----------|-------|
| **Model** | glm-5.1:cloud |
| **Mode** | subagent |
| **Description** | Create custom skills with proper structure and metadata |

**Capabilities:**
- Skill creation
- Metadata definition
- Skill packaging
- Skill documentation

**Best For:**
- "Create a skill for X"
- "Document this skill"
- "Package my workflow as a skill"
- "Add metadata to this skill"

### requirements-analyzer

| Property | Value |
|----------|-------|
| **Model** | glm-5.1:cloud |
| **Mode** | subagent |
| **Description** | Analyze feature requirements and break down tasks |

**Capabilities:**
- Requirements analysis
- Feature breakdown
- Acceptance criteria
- Task decomposition

**Best For:**
- "Analyze these requirements"
- "Break down this feature"
- "Define acceptance criteria"
- "Create task list"

### commit-drafter

| Property | Value |
|----------|-------|
| **Model** | glm-5.1:cloud |
| **Mode** | subagent |
| **Description** | Structures conventional commit messages based on user intent |

**Capabilities:**
- Commit message formatting
- Convention application
- Intent parsing
- Change summarization

**Best For:**
- "Draft a commit message"
- "Format this commit conventionally"
- "Summarize these changes"
- "Create a commit for X"

## Agent Definition Format

Agents are defined in `.opencode/agent/*.md` files with YAML frontmatter:

```yaml
---
name: executor
description: Focused task executor for implementation work (Sonnet)
model: opencode/sonnet
mode: subagent
permission:
  loadSkill: allow
  agentContext: allow
  listAgents: allow
  modeState: allow
---

## Purpose

You are an executor agent specialized in focused implementation work. Your role is to:

1. Understand the task requirements
2. Analyze the existing codebase
3. Implement the requested changes
4. Verify the implementation works
5. Report completion status

## Capabilities

- Code implementation and refactoring
- Bug fixing
- Feature development
- File operations (read, write, edit)

## Constraints

- Do not make architectural decisions (delegate to architect)
- Do not skip verification steps
- Always preserve existing functionality
- Report any blockers immediately

## Workflow

1. Analyze: Understand the task and existing code
2. Plan: Break down into steps
3. Implement: Make changes incrementally
4. Verify: Test the changes
5. Document: Update relevant comments/docs
6. Report: Summarize what was done

## Example Usage

When invoked with "Implement user authentication":
1. Analyze existing auth-related code
2. Identify required components
3. Implement each component
4. Write tests
5. Verify functionality
6. Report completion
```

## Model Selection

### Available Models

| Model | Use Case | Context | Output |
|-------|----------|---------|--------|
| **opus** | Complex reasoning, architecture, security | Variable | Variable |
| **sonnet** | Balanced performance, implementation | 200K | 8K |
| **haiku** | Fast, simple tasks, search | 200K | 8K |
| **glm-5.1:cloud** | Cost-effective, most tasks | 202K | 131K |
| **kimi-k2.5:cloud** | Extended context | 262K | 262K |
| **minimax-m2.7:cloud** | High performance | 205K | 128K |
| **qwen3.5:cloud** | Long documents | 262K | 32K |

### Model Assignment by Agent Type

| Agent Type | Recommended Model | Reason |
|------------|-------------------|--------|
| Implementation | sonnet | Balanced, reliable |
| Architecture | opus | Deep reasoning |
| Search | haiku | Fast, efficient |
| Documentation | haiku | Simple generation |
| Security | opus | Critical analysis |
| Review | glm-5.1:cloud | Cost-effective |

## Creating Custom Agents

### Step 1: Create Definition File

```bash
# Create agent file
touch .opencode/agent/my-agent.md
```

### Step 2: Define Frontmatter

```yaml
---
name: my-agent
description: Brief description of what this agent does
model: opencode/sonnet
mode: subagent
permission:
  loadSkill: allow
  agentContext: allow
---
```

### Step 3: Write Instructions

```markdown
---
name: my-agent
description: Custom agent for specific tasks
model: opencode/sonnet
mode: subagent
---

## Purpose

[Describe the agent's purpose and scope]

## Capabilities

[List what the agent can do]

## Constraints

[List what the agent should NOT do]

## Workflow

[Step-by-step process]

## Example Usage

[Concrete examples of how to use the agent]
```

### Step 4: Register (if needed)

The agent is automatically available after creation. No additional registration needed.

## Best Practices

### Choosing the Right Agent

1. **Implementation** → `executor`, `code-simplifier`, `refactoring`
2. **Architecture** → `architect`, `planner`
3. **Review** → `code-reviewer`, `security-reviewer`, `critic`
4. **Testing** → `test-engineer`, `qa-tester`, `verifier`
5. **Documentation** → `writer`, `document-specialist`
6. **Research** → `scientist`, `explore`
7. **Debugging** → `debugger`, `tracer`
8. **Planning** → `analyst`, `planner`, `deep-thinker`

### Agent Invocation Patterns

```typescript
// Via skill (automatic)
// Skills invoke appropriate agents based on task

// Via mode (orchestrated)
// Modes coordinate multiple agents

// Direct invocation (explicit)
// Use the agent subagent_type directly
{
  "subagent_type": "executor",
  "prompt": "Implement authentication"
}
```

### Avoiding Common Mistakes

1. **Don't use wrong model type**: Security agents need opus for deep analysis
2. **Don't skip constraints**: Constraints prevent scope creep
3. **Don't ignore permissions**: Limit tool access appropriately
4. **Don't create overlapping agents**: Keep responsibilities clear

## See Also

- [Skills](./skills.md) - Workflow skills that invoke agents
- [Execution Modes](./execution-modes.md) - How modes coordinate agents
- [Tools](./tools.md) - Tools agents can use