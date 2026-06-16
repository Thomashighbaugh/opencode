# Execution Modes

> Comprehensive guide to Hubs execution modes for multi-agent orchestration

## Table of Contents

- [Overview](#overview)
- [Mode Architecture](#mode-architecture)
- [Ralph Mode](#ralph-mode)
- [Autopilot Mode](#autopilot-mode)
- [Ultrawork Mode](#ultrawork-mode)
- [Team Mode](#team-mode)
- [UltraQA Mode](#ultraqa-mode)
- [Cancel Mode](#cancel-mode)
- [Magic Keywords](#magic-keywords)
- [State Management](#state-management)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)

## Overview

Hubs provides execution modes that control how tasks are processed. Each mode offers different trade-offs between autonomy, parallelism, and verification.

| Mode | Level | Autonomy | Parallelism | Verification | Use Case |
|------|-------|----------|-------------|---------------|----------|
| **ralph** | 4 | High | Low | Configurable | Tasks that must complete fully |
| **autopilot** | 4 | Highest | Medium | Built-in | End-to-end feature development |
| **ultrawork** | 4 | Medium | Highest | Manual | Burst parallel fixes |
| **team** | 4 | High | High | Per-agent | Complex multi-step workflows |
| **ultraqa** | 3 | Medium | Low | Automated | Testing and verification loops |
| **cancel** | 2 | N/A | N/A | N/A | Stop active modes |

## Mode Architecture

### Execution Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    User Request                                  │
│                         │                                        │
│                         ▼                                        │
│              ┌─────────────────────┐                             │
│              │  Keyword Detection │                             │
│              │  (hubs-plugin.ts)    │                             │
│              └─────────────────────┘                             │
│                         │                                        │
│                         ▼                                        │
│              ┌─────────────────────┐                             │
│              │  Mode Activation    │                             │
│              │  (state writing)    │                             │
│              └─────────────────────┘                             │
│                         │                                        │
│          ┌──────────────┼──────────────┐                        │
│          ▼              ▼              ▼                        │
│    ┌──────────┐  ┌──────────┐  ┌──────────┐                    │
│    │  ralph   │  │autopilot │  │ultrawork │                    │
│    │  loop    │  │pipeline  │  │parallel  │                    │
│    └──────────┘  └──────────┘  └──────────┘                    │
│          │              │              │                        │
│          ▼              ▼              ▼                        │
│    ┌─────────────────────────────────────────┐                  │
│    │         Agent Execution                 │                  │
│    │   (executor, architect, planner, etc.)   │                  │
│    └─────────────────────────────────────────┘                  │
│                         │                                        │
│                         ▼                                        │
│              ┌─────────────────────┐                             │
│              │  Verification       │                             │
│              │  (mode-specific)    │                             │
│              └─────────────────────┘                             │
│                         │                                        │
│                         ▼                                        │
│              ┌─────────────────────┐                             │
│              │  State Update       │                             │
│              │  (iteration/phase)  │                             │
│              └─────────────────────┘                             │
│                         │                                        │
│                         ▼                                        │
│              ┌─────────────────────┐                             │
│              │  Completion Check   │                             │
│              └─────────────────────┘                             │
│                         │                                        │
│            ┌────────────┴────────────┐                         │
│            ▼                         ▼                         │
│      [Continue]                [Complete]                      │
│            │                         │                          │
│            └──────────┬──────────────┘                          │
│                       ▼                                         │
│              ┌─────────────────────┐                            │
│              │  State Cleared      │                            │
│              │  Mode Deactivated   │                            │
│              └─────────────────────┘                            │
└─────────────────────────────────────────────────────────────────┘
```

### State Files

Each mode maintains state in `.opencode/state/`:

| File | Mode | Purpose |
|------|------|---------|
| `ralph-state.json` | ralph | Loop iteration and task tracking |
| `autopilot-state.json` | autopilot | Pipeline phase and progress |
| `ultrawork-state.json` | ultrawork | Task queue and reinforcement |
| `team-state.json` | team | Agent coordination and shared tasks |
| `ultraqa-state.json` | ultraqa | QA cycle status and test results |

## Ralph Mode

> Self-referential loop until task completion with configurable verification

### Overview

Ralph mode is named after the "don't stop" persistence pattern. It executes a task repeatedly until verified complete, with configurable maximum iterations and verification reviewers.

### When to Use

- Tasks that must complete fully (no partial completion)
- Bug fixes where all instances need resolution
- Refactoring that requires all files to be updated
- Any task where "good enough" is not acceptable

### Activation

```bash
# Command
/ralph fix all TypeScript errors

# Magic keyword
"ralph fix the authentication bug"
"fix the tests - don't stop until they pass"
"must complete the refactoring"
```

### Configuration

```json
{
  "ralph": {
    "max_iterations": 100,
    "verification_reviewer": "verifier",
    "auto_verify": true,
    "stop_on_first_failure": false
  }
}
```

| Option | Default | Description |
|--------|---------|-------------|
| `max_iterations` | 100 | Maximum loop iterations |
| `verification_reviewer` | `verifier` | Agent to verify completion |
| `auto_verify` | `true` | Automatically verify after execution |
| `stop_on_first_failure` | `false` | Stop loop on first failure |

### Execution Flow

```
┌──────────────────────────────────────────────────────┐
│                    RALPH LOOP                         │
│                                                      │
│   SET iteration = 1                                  │
│   SET max_iterations = 100                           │
│   SET task = user_request                             │
│                                                      │
│   WHILE iteration <= max_iterations:                 │
│     │                                                │
│     ├─► EXECUTE task                                 │
│     │    └─► Use appropriate agent                   │
│     │                                                │
│     ├─► VERIFY completion                             │
│     │    └─► Call verification_reviewer              │
│     │                                                │
│     ├─► IF verified_complete:                        │
│     │    └─► CLEAR state, EXIT with success          │
│     │                                                │
│     ├─► IF verification_failed:                      │
│     │    ├─► ANALYZE failure                          │
│     │    ├─► ADJUST approach if needed                │
│     │    └─► INCREMENT iteration                     │
│     │                                                │
│     └─► CONTINUE loop                                │
│                                                      │
│   IF max_iterations reached:                         │
│     └─► EXIT with warning, state preserved          │
│                                                      │
└──────────────────────────────────────────────────────┘
```

### State Structure

```json
{
  "active": true,
  "started_at": "2025-04-18T10:00:00Z",
  "iteration": 5,
  "max_iterations": 100,
  "prompt": "fix all TypeScript errors",
  "original_prompt": "fix all TypeScript errors",
  "session_id": "abc123",
  "project_path": "/path/to/project",
  "verification_results": [
    { "iteration": 1, "status": "failed", "errors": 15 },
    { "iteration": 2, "status": "failed", "errors": 8 },
    { "iteration": 3, "status": "failed", "errors": 3 },
    { "iteration": 4, "status": "failed", "errors": 1 },
    { "iteration": 5, "status": "passed", "errors": 0 }
  ]
}
```

### Examples

#### TypeScript Error Fixing

```bash
/ralph fix all TypeScript errors
```

```
[Iteration 1/100] Found 15 errors, fixing...
[Iteration 1] Fixed 7 errors, 8 remaining
[Iteration 2/100] Verifying... 8 errors found
[Iteration 2] Fixed 5 errors, 3 remaining
[Iteration 3/100] Verifying... 3 errors found
[Iteration 3] Fixed 2 errors, 1 remaining
[Iteration 4/100] Verifying... 1 error found
[Iteration 4] Fixed 1 error, 0 remaining
[Iteration 5/100] Verifying... SUCCESS
[RALPH COMPLETE] All TypeScript errors fixed in 5 iterations
```

#### Test Suite Repair

```bash
"don't stop until all tests pass"
/ralph fix the test suite
```

### Verification

Ralph mode uses the `verifier` agent by default:

```yaml
# In skill invocation
verification_reviewer: verifier  # Default
verification_reviewer: test-engineer  # For test tasks
verification_reviewer: security-reviewer  # For security tasks
```

### Cancellation

```bash
# Stop ralph loop
/cancel
"stop"
"cancelomc"
```

## Autopilot Mode

> Full autonomous execution from idea to working code

### Overview

Autopilot mode handles the complete software development lifecycle autonomously. From a brief description, it analyzes requirements, designs architecture, plans tasks, implements, and verifies.

### When to Use

- New feature development from scratch
- Prototyping ideas quickly
- End-to-end implementations
- When you want minimal involvement

### Activation

```bash
# Command
/autopilot build a REST API for managing tasks

# MagicKeywords
"autopilot create a user authentication system"
"build me an e-commerce checkout flow"
"I want a dashboard for analytics"
```

### Configuration

```json
{
  "autopilot": {
    "phases": [
      "requirements",
      "design",
      "planning",
      "implementation",
      "qa",
      "verification"
    ],
    "verification_required": true,
    "max_phase_retries": 3,
    "parallel_implementation": true
  }
}
```

### Execution Flow

```
┌──────────────────────────────────────────────────────┐
│                  AUTOPIPELINE                        │
│                                                      │
│   PHASE 1: REQUIREMENTS ANALYSIS                     │
│   ├─► Clarify user intent                            │
│   ├─► Identify constraints                           │
│   ├─► Define acceptance criteria                     │
│   └─► Output: Requirements Document                   │
│                                                      │
│   PHASE 2: TECHNICAL DESIGN                          │
│   ├─► Analyze architecture                            │
│   ├─► Design components                               │
│   ├─► Define interfaces                               │
│   └─► Output: Design Document                        │
│                                                      │
│   PHASE 3: TASK PLANNING                             │
│   ├─► Break into subtasks                             │
│   ├─► Identify dependencies                          │
│   ├─► Prioritize and sequence                        │
│   └─► Output: Task List                              │
│                                                      │
│   PHASE 4: IMPLEMENTATION                            │
│   ├─► Execute tasks in sequence                      │
│   ├─► Use parallel execution when possible           │
│   ├─► Handle errors and retry                        │
│   └─► Output: Working Code                            │
│                                                      │
│   PHASE 5: QA CYCLING                                │
│   ├─► Run tests                                       │
│   ├─► Fix failures                                    │
│   ├─► Repeat until pass                               │
│   └─► Output: Test Results                           │
│                                                      │
│   PHASE 6: VERIFICATION                              │
│   ├─► Verify requirements met                        │
│   ├─► Check acceptance criteria                      │
│   ├─► Multi-perspective review                       │
│   └─► Output: Completion Status                      │
│                                                      │
└──────────────────────────────────────────────────────┘
```

### State Structure

```json
{
  "active": true,
  "started_at": "2025-04-18T10:00:00Z",
  "original_prompt": "build a REST API for managing tasks",
  "session_id": "abc123",
  "project_path": "/path/to/project",
  "current_phase": "implementation",
  "phase_status": {
    "requirements": "completed",
    "design": "completed",
    "planning": "completed",
    "implementation": "in_progress",
    "qa": "pending",
    "verification": "pending"
  },
  "artifacts": {
    "requirements_doc": ".opencode/state/artifacts/autopilot/abc123/requirements.md",
    "design_doc": ".opencode/state/artifacts/autopilot/abc123/design.md",
    "task_list": ".opencode/state/artifacts/autopilot/abc123/tasks.json"
  }
}
```

### Examples

#### Feature Development

```bash
/autopilot build a user authentication system with OAuth2 support
```

```
[AUTOPILOT] Phase 1: Requirements Analysis...
[AUTOPILOT] ├─ Identified: OAuth2, session management, token refresh
[AUTOPILOT] └─ Acceptance criteria: 5 items defined

[AUTOPILOT] Phase 2: Technical Design...
[AUTOPILOT] ├─ Architecture: JWT-based auth with refresh tokens
[AUTOPILOT] └─ Components: AuthProvider, TokenService, SessionManager

[AUTOPILOT] Phase 3: Task Planning...
[AUTOPILOT] ├─ Generated: 12 tasks across 3 phases
[AUTOPILOT] └─ Dependencies mapped

[AUTOPILOT] Phase 4: Implementation...
[AUTOPILOT] ├─ Task 1/12: Create AuthProvider interface... ✓
[AUTOPILOT] ├─ Task 2/12: Implement TokenService... ✓
[AUTOPILOT] └─ ...

[AUTOPILOT] Phase 5: QA Cycling...
[AUTOPILOT] ├─ Running tests... 8/8 passed
[AUTOPILOT] └─ All tests passing

[AUTOPILOT] Phase 6: Verification...
[AUTOPILOT] ├─ Requirements: All met
[AUTOPILOT] └─ Status: COMPLETE
```

### Phase Details

#### Phase 1: Requirements Analysis

The `analyst` agent:
- Parses user intent
- Asks clarifying questions if needed
- Defines acceptance criteria
- Identifies constraints and assumptions

#### Phase 2: Technical Design

The `architect` agent:
- Analyzes existing codebase
- Designs component architecture
- Defines interfaces and data models
- Creates design document

#### Phase 3: Task Planning

The `planner` agent:
- Breaks design into implementable tasks
- Identifies task dependencies
- Prioritizes tasks by criticality
- Creates task list with estimates

#### Phase 4: Implementation

The `executor` agents:
- Execute tasks in dependency order
- Use parallel execution for independent tasks
- Handle errors gracefully
- Report progress

#### Phase 5: QA Cycling

The `test-engineer` agent:
- Runs existing tests
- Writes new tests for new code
- Fixes failing tests
- Loops until all pass

#### Phase 6: Verification

The `verifier` agent:
- Checks acceptance criteria
- Verifies requirements met
- Performs multi-perspective review
- Confirms completion

## Ultrawork Mode

> Parallel execution engine for high-throughput task completion

### Overview

Ultrawork mode maximizes task throughput by executing multiple independent tasks in parallel. It's designed for burst workloads and high-volume operations.

### When to Use

- Multiple independent tasks
- Large-scale refactoring
- Bulk file operations
- Parallel bug fixes
- When speed is critical

### Activation

```bash
# Command
/ultrawork implement auth in parallel

# Magic Keywords
"ultrawork fix all the lint errors"
"ulw update dependencies across all packages"
```

### Configuration

```json
{
  "ultrawork": {
    "max_parallel_tasks": 5,
    "task_timeout": 300000,
    "retry_failed_tasks": true,
    "max_retries": 3,
    "coordination_strategy": "independent"
  }
}
```

### Execution Flow

```
┌──────────────────────────────────────────────────────┐
│                  ULTRAWORK ENGINE                    │
│                                                      │
│   PARSE task description                             │
│   IDENTIFY independent subtasks                       │
│                                                      │
│   ┌─────────────────────────────────────────────┐   │
│   │          TASK QUEUE                          │   │
│   │  ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐  │   │
│   │  │ T1  │ │ T2  │ │ T3  │ │ T4  │ │ T5  │  │   │
│   │  └─────┘ └─────┘ └─────┘ └─────┘ └─────┘  │   │
│   └─────────────────────────────────────────────┘   │
│                         │                            │
│          ┌──────────────┼──────────────┐            │
│          ▼              ▼              ▼            │
│    ┌──────────┐  ┌──────────┐  ┌──────────┐        │
│    │ Worker 1 │  │ Worker 2 │  │ Worker 3 │        │
│    │ (T1, T4) │  │ (T2, T5) │  │ (T3)     │        │
│    └──────────┘  └──────────┘  └──────────┘        │
│          │              │              │            │
│          └──────────────┼──────────────┘            │
│                         ▼                            │
│              ┌─────────────────────┐                 │
│              │  RESULT AGGREGATION │                 │
│              └─────────────────────┘                 │
│                         │                            │
│                         ▼                            │
│              ┌─────────────────────┐                 │
│              │  COMPLETION CHECK   │                 │
│              └─────────────────────┘                 │
│                                                      │
└──────────────────────────────────────────────────────┘
```

### State Structure

```json
{
  "active": true,
  "started_at": "2025-04-18T10:00:00Z",
  "original_prompt": "fix all lint errors in parallel",
  "session_id": "abc123",
  "reinforcement_count": 2,
  "task_queue": [
    { "id": 1, "status": "completed", "agent": "executor", "result": "Fixed eslint errors in src/auth.ts" },
    { "id": 2, "status": "completed", "agent": "executor", "result": "Fixed eslint errors in src/api.ts" },
    { "id": 3, "status": "in_progress", "agent": "executor", "started_at": "2025-04-18T10:05:00Z" }
  ],
  "completed_count": 2,
  "failed_count": 0,
  "total_count": 5
}
```

### Parallelism Model

Ultrawork uses a worker pool model:

1. **Task Decomposition**: Split request into independent tasks
2. **Dependency Analysis**: Identify which tasks can run in parallel
3. **Worker Assignment**: Assign tasks to available workers (agents)
4. **Parallel Execution**: Execute up to `max_parallel_tasks` concurrently
5. **Result Aggregation**: Collect and merge results
6. **Reinforcement**: Re-run failed tasks with different approach

### Examples

#### Lint Error Fixes

```bash
/ultrawork fix all lint errors in src/
```

```
[ULTRAWORK] Decomposing task... 15 independent fixes identified
[ULTRAWORK] Spawning 5 parallel workers...

[Worker 1] Fixing src/auth.ts... ✓ (3 fixes)
[Worker 2] Fixing src/api.ts... ✓ (4 fixes)
[Worker 3] Fixing src/db.ts... ✓ (3 fixes)
[Worker 4] Fixing src/utils.ts... ✓ (2 fixes)
[Worker 5] Fixing src/config.ts... ✓ (3 fixes)

[ULTRAWORK] Aggregating results... 15/15 fixes complete
[ULTRAWORK] Verification... All lint errors resolved
```

## Team Mode

> N coordinated agents on shared task list using OpenCode native teams

### Overview

Team mode orchestrates multiple agents working on shared tasks. Unlike ultrawork's independent execution, team mode coordinates agents with shared context and progress tracking.

### When to Use

- Complex multi-step workflows
- Tasks requiring different expertise
- Code review + implementation workflows
- Parallel work with coordination needs

### Activation

```bash
# Command format
/team <count>:<agent> "task description"

# Examples
/team 3:executor "add feature X with tests"
/team 2:code-reviewer "review all changes in PR #123"
/team 1:architect 2:executor "design and implement auth system"
```

### Configuration

```json
{
  "team": {
    "default_agent_count": 3,
    "default_agent_type": "executor",
    "coordination_strategy": "shared_task_list",
    "progress_tracking": true,
    "artifact_sharing": true
  }
}
```

### Execution Flow

```
┌──────────────────────────────────────────────────────┐
│                    TEAM MODE                         │
│                                                      │
│   CREATE shared task list                            │
│   ASSIGN agents                                      │
│                                                      │
│   ┌─────────────────────────────────────────────┐   │
│   │          SHARED TASK LIST                    │   │
│   │  ○ Task 1: Create interface                 │   │
│   │  ○ Task 2: Implement core logic             │   │
│   │  ○ Task 3: Add tests                        │   │
│   │  ○ Task 4: Write documentation               │   │
│   │  ○ Task 5: Code review                       │   │
│   └─────────────────────────────────────────────┘   │
│                         │                            │
│          ┌──────────────┼──────────────┐            │
│          ▼              ▼              ▼            │
│    ┌──────────┐  ┌──────────┐  ┌──────────┐        │
│    │ Agent 1  │  │ Agent 2  │  │ Agent 3  │        │
│    │ Executor │  │ Executor │  │ Executor │        │
│    │          │  │          │  │          │        │
│    │ Claim:   │  │ Claim:   │  │ Claim:   │        │
│    │ Task 1   │  │ Task 2   │  │ Task 3   │        │
│    └──────────┘  └──────────┘  └──────────┘        │
│          │              │              │            │
│          └──────────────┼──────────────┘            │
│                         ▼                            │
│              ┌─────────────────────┐                 │
│              │  PROGRESS SYNC      │                 │
│              │  (shared state)     │                 │
│              └─────────────────────┘                 │
│                                                      │
└──────────────────────────────────────────────────────┘
```

### State Structure

```json
{
  "active": true,
  "started_at": "2025-04-18T10:00:00Z",
  "session_id": "abc123",
  "team_size": 3,
  "agent_type": "executor",
  "shared_tasks": [
    { "id": 1, "description": "Create interface", "status": "completed", "assigned_to": "agent-1" },
    { "id": 2, "description": "Implement core logic", "status": "in_progress", "assigned_to": "agent-2" },
    { "id": 3, "description": "Add tests", "status": "pending", "assigned_to": null },
    { "id": 4, "description": "Write documentation", "status": "pending", "assigned_to": null },
    { "id": 5, "description": "Code review", "status": "pending", "assigned_to": null }
  ],
  "progress": {
    "completed": 1,
    "in_progress": 1,
    "pending": 3,
    "total": 5
  }
}
```

## UltraQA Mode

> QA cycling workflow - test, verify, fix, repeat until goal met

### Overview

UltraQA mode cycles through testing, verification, and fixing until all tests pass. It's designed for test-driven workflows and quality assurance.

### When to Use

- Making all tests pass
- Fixing CI/CD pipeline failures
- Achieving code coverage targets
- Quality gate enforcement

### Activation

```bash
# Command
/ultraqa verify all tests pass

# Magic Keywords
"ultraqa fix the test failures"
"qa cycle until coverage > 80%"
```

### Configuration

```json
{
  "ultraqa": {
    "max_cycles": 50,
    "test_command": "npm test",
    "coverage_target": 80,
    "fix_strategy": "incremental",
    "verification_agent": "test-engineer"
  }
}
```

### Execution Flow

```
┌──────────────────────────────────────────────────────┐
│                    ULTRAQA CYCLE                     │
│                                                      │
│   CYCLE 1                                            │
│   ├─► RUN tests                                      │
│   │    └─► Result: 5 failures, 12 passing          │
│   ├─► ANALYZE failures                               │
│   │    └─► Identify: 3 assertion errors, 2 timeouts│
│   ├─► FIX failures                                   │
│   │    └─► Apply targeted fixes                      │
│   └─► VERIFY fixes                                   │
│        └─► Result: 2 failures, 15 passing            │
│                                                      │
│   CYCLE 2                                            │
│   ├─► RUN tests                                      │
│   │    └─► Result: 2 failures, 15 passing          │
│   ├─► ANALYZE failures                               │
│   │    └─► Identify: 1 mock issue, 1 async issue    │
│   ├─► FIX failures                                   │
│   │    └─► Apply targeted fixes                      │
│   └─► VERIFY fixes                                   │
│        └─► Result: 0 failures, 17 passing           │
│                                                      │
│   SUCCESS: All tests passing                         │
│                                                      │
└──────────────────────────────────────────────────────┘
```

### State Structure

```json
{
  "active": true,
  "started_at": "2025-04-18T10:00:00Z",
  "session_id": "abc123",
  "goal": "all tests pass",
  "current_cycle": 2,
  "max_cycles": 50,
  "cycles": [
    {
      "cycle": 1,
      "test_result": { "passed": 12, "failed": 5 },
      "fixes_applied": 5,
      "verification": { "passed": 15, "failed": 2 }
    },
    {
      "cycle": 2,
      "test_result": { "passed": 15, "failed": 2 },
      "fixes_applied": 2,
      "verification": { "passed": 17, "failed": 0 }
    }
  ],
  "status": "success"
}
```

## Cancel Mode

> Cancel any active OMC mode

### Overview

Cancel mode stops any active execution mode and clears its state.

### Activation

```bash
# Command
/cancel

# Magic Keywords
"stop"
"cancelomc"
"stop all modes"
```

### What It Does

1. Checks for active modes (ralph, autopilot, ultrawork, team, ultraqa)
2. Clears all state files
3. Resets session context
4. Returns to normal operation

### State After Cancellation

```json
{
  "active": false,
  "completed_at": "2025-04-18T10:30:00Z",
  "cancelled": true,
  "final_status": "cancellation_requested"
}
```

## Magic Keywords

Natural language triggers that activate modes without explicit commands.

| Keyword | Mode | Examples |
|---------|------|----------|
| `ralph`, `don't stop`, `must complete`, `until done` | ralph | "ralph fix the bugs", "don't stop until tests pass" |
| `autopilot`, `autonomous`, `full auto`, `build me`, `I want` | autopilot | "autopilot create an API", "build me a dashboard" |
| `ultrawork`, `ulw`, `uw` | ultrawork | "ulw fix all files", "ultrawork update imports" |
| `cancel`, `stop`, `cancelomc`, `stopomc` | cancel | "stop", "cancel current mode" |

### Detection Logic

The plugin (`hubs-plugin.ts`) uses regex patterns:

```typescript
const KEYWORD_PATTERNS = {
  cancel: /\b(cancelomc|stopomc)\b/i,
  ralph: /\b(ralph|don't stop|must complete|until done)\b/i,
  autopilot: /\b(autopilot|auto pilot|auto-pilot|autonomous|full auto|fullsend)\b/i,
  autopilotBuild: /\b(build|create|make)\s+me\s+(an?\s+)?(app|feature|project|tool|plugin|website|api|server|cli|script|system|service|dashboard|bot|extension)\b/i,
  autopilotWant: /\bi\s+want\s+a\s+/i,
  ultrawork: /\b(ultrawork|ulw|uw)\b/i,
}
```

### Conflict Resolution

When multiple keywords are detected:

1. `cancel` takes highest priority (stops everything)
2. Priority order: `cancel` > `ralph` > `autopilot` > `ultrawork`
3. Only one execution mode can be active

## State Management

### State Directory

```
.opencode/state/
├── ralph-state.json         # Ralph loop state
├── autopilot-state.json     # Autopilot pipeline state
├── ultrawork-state.json     # Ultrawork parallel state
├── team-state.json          # Team coordination state
├── ultraqa-state.json       # QA cycling state
├── todos.json               # Task list state
├── project-memory.json      # Cross-session knowledge
├── notepad.md               # Session notes
├── plans/                   # Planning documents
├── logs/                    # Audit logs
└── artifacts/               # Skill outputs
    └── {skill-name}/
        └── {session-id}/
```

### State Persistence

States persist across sessions:

- On session start: Previous state restored
- On mode activation: State created
- On mode completion: State cleared
- On session compact: Critical state preserved

### Cross-Session Restoration

```typescript
// In hubs-plugin.ts
function getSessionRestoreMessages(directory, sessionId) {
  const messages = []
  
  const ralphState = readState(directory, 'ralph', sessionId)
  if (ralphState?.active) {
    messages.push(`
      [RALPH LOOP RESTORED]
      Original task: ${ralphState.prompt}
      Iteration: ${ralphState.iteration}/${ralphState.max_iterations}
    `)
  }
  
  // ... other modes
  
  return messages
}
```

## Best Practices

### Mode Selection

| Scenario | Recommended Mode |
|----------|-----------------|
| Bug fixing (must complete) | ralph |
| Feature development | autopilot |
| Multiple independent tasks | ultrawork |
| Complex multi-agent workflow | team |
| Making tests pass | ultraqa |
| Stop everything | cancel |

### Performance Tips

1. **Use ultrawork for parallel tasks**: Independent tasks benefit most
2. **Set reasonable max_iterations**: Prevent infinite loops
3. **Configure appropriate timeouts**: Balance thoroughness and speed
4. **Use verification reviewers wisely**: Match to task type

### Common Patterns

```bash
# Fix all issues and verify
/ralph fix all TypeScript errors

# Build complete feature
/autopilot build a user settings page with form validation

# Parallel refactoring
/ultrawork update all imports to use new module structure

# Multi-expertise task
/team 1:architect 2:executor 1:test-engineer "create payment integration"

# QA cycle
/ultraqa achieve 90% code coverage
```

## Troubleshooting

### Mode Stuck

If a mode appears stuck:

```bash
# Check state
cat .opencode/state/ralph-state.json

# Cancel and restart
/cancel
/ralph fix the issue
```

### State Corruption

If state becomes corrupted:

```bash
# Clear all state
rm .opencode/state/*.json

# Restart OpenCode session
```

### Mode Not Activating

If magic keywords don't trigger:

1. Check if another mode is active (only one at a time)
2. Verify plugin is loaded in `opencode.jsonc`
3. Check for conflicting patterns in your input

### Performance Issues

If modes are slow:

1. Reduce `max_parallel_tasks` in ultrawork
2. Lower `max_iterations` in ralph
3. Use more specific task descriptions
4. Break large tasks into smaller ones

## See Also

- [Skills](./skills.md) - Workflow skills including mode skills
- [Agents](./agents.md) - Available agents for task execution
- [Tools](./tools.md) - TypeScript tools for state management
- [Plugin System](./plugin-system.md) - Hook system implementation