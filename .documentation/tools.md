# Tools Reference

> Complete reference for all 10 JOC TypeScript tools

## Table of Contents

- [Overview](#overview)
- [Tool Architecture](#tool-architecture)
- [Skill Management Tools](#skill-management-tools)
- [Agent Context Tools](#agent-context-tools)
- [Session Management Tools](#session-management-tools)
- [Workflow State Tools](#workflow-state-tools)
- [Tool Development Guide](#tool-development-guide)
- [Best Practices](#best-practices)

## Overview

JOC includes TypeScript tools that provide programmatic access to core functionality. Each tool is a TypeScript file using the `@opencode-ai/plugin` SDK.

| Tool | Purpose |
|------|---------|
| **loadSkill** | Load skill content, metadata, and scripts |
| **runSkillScript** | Execute skill-bundled shell scripts |
| **agentContext** | Manage project memory, notepad, and modes |
| **listAgents** | List and filter agents by capability |
| **modeState** | Start/stop/update/list execution modes |
| **taskTodos** | Create and manage task lists |
| **artifacts** | Save and load skill artifacts |
| **getSessionID** | Get current session ID |
| **saveCommitMessage** | Save commit message for later |
| **getCommitMessage** | Retrieve saved commit message |

## Tool Architecture

### How Tools Work

```
┌─────────────────────────────────────────────────────────────────┐
│                     OpenCode Session                             │
│                           │                                       │
│                           ▼                                       │
│              ┌─────────────────────┐                              │
│              │  Tool Invocation    │                              │
│              │  (via agent/tool)  │                              │
│              └─────────────────────┘                              │
│                           │                                       │
│                           ▼                                       │
│              ┌─────────────────────┐                              │
│              │  TypeScript Tool    │                              │
│              │  (execute function) │                              │
│              └─────────────────────┘                              │
│                           │                                       │
│          ┌────────────────┴────────────────┐                      │
│          ▼                 ▼                 ▼                    │
│    ┌──────────┐     ┌──────────┐     ┌──────────┐                │
│    │File Ops  │     │State Ops │     │Context   │                │
│    └──────────┘     └──────────┘     └──────────┘                │
│                           │                                       │
│                           ▼                                       │
│              ┌─────────────────────┐                              │
│              │  Return Result       │                              │
│              └─────────────────────┘                              │
└─────────────────────────────────────────────────────────────────┘
```

### Tool Definition Pattern

```typescript
import { tool } from "@opencode-ai/plugin"

export default tool({
  description: "Tool description",
  args: {
    argName: {
      type: "string",
      description: "Argument description"
    }
  },
  async execute(args, context) {
    // Implementation
    return result
  }
})
```

## Skill Management Tools

### loadSkill

Loads skill content, metadata, and bundled scripts.

**Tool File:** `loadSkill.ts`

**Arguments:**

| Argument | Type | Required | Description |
|----------|------|----------|-------------|
| `skillName` | string | Yes | Name of the skill to load |
| `loadContent` | boolean | No | Whether to load full content (default: true) |
| `loadScripts` | boolean | No | Whether to load bundled scripts (default: false) |

**Returns:**

```typescript
{
  name: string;
  description: string;
  level: number;
  content: string;        // If loadContent: true
  scripts: Script[];      // If loadScripts: true
  metadata: {
    userInvocable: boolean;
    argumentHint: string;
  };
  path: string;
}
```

**Example:**

```typescript
// Load skill with content
const skill = await loadSkill({
  skillName: "autopilot",
  loadContent: true,
  loadScripts: false
})

console.log(skill.description)  // "Full autonomous execution..."
console.log(skill.level)         // 4
console.log(skill.content)       // Full SKILL.md content
```

**Search Order:**

1. Project-level: `.opencode/skills/{skillName}/SKILL.md`
2. User-wide: `~/.config/opencode/skills/{skillName}/SKILL.md`

---

### runSkillScript

Executes skill-bundled shell scripts.

**Tool File:** `runSkillScript.ts`

**Arguments:**

| Argument | Type | Required | Description |
|----------|------|----------|-------------|
| `skillName` | string | Yes | Name of the skill |
| `scriptPath` | string | Yes | Path to script relative to skill directory |
| `args` | object | No | Arguments to pass to script |
| `env` | object | No | Environment variables |

**Returns:**

```typescript
{
  success: boolean;
  stdout: string;
  stderr: string;
  exitCode: number;
  duration: number;
}
```

**Example:**

```typescript
// Run setup script
const result = await runSkillScript({
  skillName: "joc-setup",
  scriptPath: "scripts/setup.sh",
  args: { mode: "global" }
})

if (result.success) {
  console.log("Setup complete")
} else {
  console.error("Setup failed:", result.stderr)
}
```

**Script Security:**

- Scripts run in non-interactive mode
- Environment variables are sanitized
- Scripts must be in skill's `scripts/` directory
- Exit codes are captured

---

## Agent Context Tools

### agentContext

Manages project memory, notepad, and active modes.

**Tool File:** `agentContext.ts`

**Arguments:**

| Argument | Type | Required | Description |
|----------|------|----------|-------------|
| `action` | string | Yes | Action to perform |
| `data` | object | No | Data for the action |

**Actions:**

| Action | Description |
|--------|-------------|
| `getMemory` | Get project memory |
| `setMemory` | Set project memory |
| `updateMemory` | Update memory fields |
| `getNotepad` | Get notepad content |
| `setNotepad` | Set notepad content |
| `appendNotepad` | Append to notepad |
| `getActiveModes` | List active modes |
| `clearContext` | Clear all context |

**Returns:**

```typescript
// getMemory
{
  techStack: {
    languages: [{ name: string, version: string }],
    frameworks: [{ name: string, version: string }],
    databases: [{ name: string, type: string }]
  },
  customNotes: [{ note: string, timestamp: string }],
  createdAt: string,
  updatedAt: string
}

// getNotepad
{
  content: string,
  updatedAt: string
}

// getActiveModes
{
  modes: [{
    name: string,
    active: boolean,
    startedAt: string
  }]
}
```

**Example:**

```typescript
// Get project memory
const memory = await agentContext({ action: "getMemory" })

// Update memory
await agentContext({
  action: "updateMemory",
  data: {
    techStack: {
      languages: [{ name: "TypeScript", version: "5.7" }],
      frameworks: [{ name: "React", version: "19.0" }]
    }
  }
})

// Append to notepad
await agentContext({
  action: "appendNotepad",
  data: { content: "\n- Task completed: auth" }
})

// List active modes
const modes = await agentContext({ action: "getActiveModes" })
```

**Storage Location:**

- Memory: `.opencode/state/project-memory.json`
- Notepad: `.opencode/state/notepad.md`

---

### listAgents

Lists and filters agents by capability.

**Tool File:** `listAgents.ts`

**Arguments:**

| Argument | Type | Required | Description |
|----------|------|----------|-------------|
| `filter` | object | No | Filter criteria |
| `includeDetails` | boolean | No | Include full details (default: false) |

**Filter Options:**

| Property | Type | Description |
|-----------|------|-------------|
| `model` | string | Filter by model (sonnet, opus, etc.) |
| `capability` | string | Filter by capability (implementation, review, etc.) |
| `name` | string | Filter by name (regex supported) |

**Returns:**

```typescript
{
  agents: [{
    name: string;
    description: string;
    model: string;
    mode: string;
    capabilities?: string[];
    permissions?: Record<string, string>;
  }],
  total: number,
  filtered: number
}
```

**Example:**

```typescript
// List all agents
const allAgents = await listAgents({})

// Filter by model
const sonnetAgents = await listAgents({
  filter: { model: "sonnet" }
})

// Filter by capability
const reviewAgents = await listAgents({
  filter: { capability: "review" },
  includeDetails: true
})

// Search by name
const matchingAgents = await listAgents({
  filter: { name: "test" }
})
```

**Capability Categories:**

| Category | Agents |
|----------|--------|
| implementation | executor, code-simplifier, refactoring, frontend-design |
| architecture | architect, planner, analyst |
| review | code-reviewer, security-reviewer, critic, verifier |
| testing | test-engineer, qa-tester |
| documentation | writer, document-specialist |
| research | scientist, explore |
| debugging | debugger, tracer |

---

## Session Management Tools

### getSessionID

Gets the current session identifier.

**Tool File:** `getSessionID.ts`

**Arguments:** None

**Returns:**

```typescript
string  // Session ID (e.g., "abc123def456")
```

**Example:**

```typescript
const sessionId = await getSessionID()
console.log(`Current session: ${sessionId}`)
```

**Usage:**

- Used to track session-specific state
- Passed to other tools that need session context
- Logs and debugging

---

### saveCommitMessage

Saves a commit message for later retrieval.

**Tool File:** `saveCommitMessage.ts`

**Arguments:**

| Argument | Type | Required | Description |
|----------|------|----------|-------------|
| `commitMessage` | string | Yes | Commit message to save |

**Returns:**

```typescript
{
  success: boolean;
  savedAt: string;
  sessionId: string;
}
```

**Example:**

```typescript
await saveCommitMessage({
  commitMessage: "feat(auth): add OAuth2 support"
})

// Later, in another part of workflow
const message = await getCommitMessage()
```

---

### getCommitMessage

Retrieves the saved commit message.

**Tool File:** `getCommitMessage.ts`

**Arguments:** None

**Returns:**

```typescript
{
  message: string | null;
  savedAt: string | null;
  sessionId: string;
}
```

**Example:**

```typescript
const { message } = await getCommitMessage()

if (message) {
  console.log("Saved message:", message)
} else {
  console.log("No message saved")
}
```

**Use Case:**

Draft commit message early in workflow, use during actual commit:

```typescript
// In planning phase
await saveCommitMessage({
  commitMessage: "feat(auth): add OAuth2 support\n\n- Implement flow\n- Add refresh tokens"
})

// Later, during commit
const { message } = await getCommitMessage()
if (message) {
  await git.commit(message)
}
```

---

## Workflow State Tools

### modeState

Manages execution mode state (ralph, autopilot, etc.).

**Tool File:** `modeState.ts`

**Arguments:**

| Argument | Type | Required | Description |
|----------|------|----------|-------------|
| `action` | string | Yes | Action to perform |
| `mode` | string | No | Mode name (for start/stop/update) |
| `data` | object | No | Additional data |

**Actions:**

| Action | Description |
|--------|-------------|
| `start` | Start a mode |
| `stop` | Stop a mode |
| `update` | Update mode state |
| `list` | List all mode states |
| `get` | Get specific mode state |

**Returns:**

```typescript
// start/stop/update
{
  success: boolean;
  mode: string;
  state: {
    active: boolean;
    started_at?: string;
    completed_at?: string;
    iteration?: number;
    max_iterations?: number;
    current_phase?: string;
    [key: string]: any;
  }
}

// list
{
  modes: [{
    name: string;
    active: boolean;
    state: object;
  }]
}

// get
{
  mode: string;
  state: object | null;
}
```

**Example:**

```typescript
// Start ralph mode
await modeState({
  action: "start",
  mode: "ralph",
  data: {
    prompt: "fix all TypeScript errors",
    max_iterations: 100
  }
})

// Update state (increment iteration)
await modeState({
  action: "update",
  mode: "ralph",
  data: {
    iteration: 5,
    current_phase: "fixing errors"
  }
})

// Check if mode is active
const { state } = await modeState({
  action: "get",
  mode: "ralph"
})

if (state?.active) {
  console.log(`Ralph iteration: ${state.iteration}`)
}

// List all active modes
const { modes } = await modeState({ action: "list" })

// Stop mode
await modeState({
  action: "stop",
  mode: "ralph"
})
```

**State Persistence:**

States are persisted to `.opencode/state/{mode}-state.json`.

---

### taskTodos

Creates and manages task lists.

**Tool File:** `taskTodos.ts`

**Arguments:**

| Argument | Type | Required | Description |
|----------|------|----------|-------------|
| `action` | string | Yes | Action to perform |
| `todos` | array | No | Todo items (for create) |
| `id` | string | No | Todo ID (for update) |
| `status` | string | No | New status (for update) |

**Actions:**

| Action | Description |
|--------|-------------|
| `create` | Create new todo list |
| `update` | Update todo status |
| `list` | List all todos |
| `get` | Get specific todo |
| `clear` | Clear all todos |

**Todo Item Structure:**

```typescript
{
  id: string;           // Auto-generated
  content: string;      // Task description
  status: "pending" | "in_progress" | "completed" | "cancelled";
  priority: "high" | "medium" | "low";
  created_at: string;
  updated_at: string;
}
```

**Returns:**

```typescript
{
  todos: Todo[];
  total: number;
  pending: number;
  in_progress: number;
  completed: number;
}
```

**Example:**

```typescript
// Create todo list
await taskTodos({
  action: "create",
  todos: [
    { content: "Implement auth", priority: "high" },
    { content: "Add tests", priority: "medium" },
    { content: "Update docs", priority: "low" }
  ]
})

// Update status to in_progress
await taskTodos({
  action: "update",
  id: "todo-1",
  status: "in_progress"
})

// Mark as completed
await taskTodos({
  action: "update",
  id: "todo-1",
  status: "completed"
})

// List all todos
const { todos } = await taskTodos({ action: "list" })

// Clear all
await taskTodos({ action: "clear" })
```

---

### artifacts

Saves and loads skill artifacts.

**Tool File:** `artifacts.ts`

**Arguments:**

| Argument | Type | Required | Description |
|----------|------|----------|-------------|
| `action` | string | Yes | Action to perform |
| `skillName` | string | Yes | Skill name |
| `artifact` | object | No | Artifact data (for save) |
| `filename` | string | No | Specific file to load |

**Actions:**

| Action | Description |
|--------|-------------|
| `save` | Save artifact |
| `load` | Load artifact |
| `list` | List artifacts for skill |
| `delete` | Delete artifact |

**Returns:**

```typescript
// save
{
  success: boolean;
  path: string;
}

// load
{
  data: any;
  path: string;
  createdAt: string;
}

// list
{
  artifacts: [{
    name: string;
    path: string;
    size: number;
    createdAt: string;
  }]
}
```

**Example:**

```typescript
// Save artifact
await artifacts({
  action: "save",
  skillName: "planning",
  artifact: {
    plan: "Implementation plan...",
    tasks: ["task1", "task2"],
    estimated_time: "2 hours"
  }
})

// Load artifact
const { data } = await artifacts({
  action: "load",
  skillName: "planning",
  filename: "plan.json"
})

// List artifacts
const { artifacts } = await artifacts({
  action: "list",
  skillName: "planning"
})
```

**Storage Location:**

`.opencode/state/artifacts/{skillName}/{sessionId}/{filename}`

---

## Tool Development Guide

### Creating a New Tool

#### Step 1: Create File

```bash
touch .opencode/tools/my-tool.ts
```

#### Step 2: Implement Tool

```typescript
import { tool } from "@opencode-ai/plugin"
import { z } from "zod"  // Optional: for validation

// Define arguments schema
const ArgsSchema = z.object({
  arg1: z.string().describe("First argument"),
  arg2: z.string().optional().default("default").describe("Second argument")
})

// Define return type
interface MyToolResult {
  success: boolean
  data?: any
  error?: string
}

export default tool({
  description: "My custom tool description",
  args: {
    arg1: {
      type: "string",
      description: "First argument"
    },
    arg2: {
      type: "string",
      description: "Second argument (default: 'default')",
      default: "default"
    }
  },
  async execute(args, context): Promise<MyToolResult> {
    const { arg1, arg2 } = args
    const { sessionID, projectRoot } = context
    
    // Implementation
    const result = await doSomething(arg1, arg2)
    
    // Return result
    return {
      success: true,
      data: result
    }
  }
})
```

#### Step 3: Register Tool

Add to `opencode.jsonc`:

```jsonc
{
  "tools": {
    "myTool": "./tools/my-tool.ts"
  }
}
```

### Context Properties

The `context` object provides:

```typescript
interface ToolContext {
  sessionID: string;       // Current session ID
  projectRoot: string;     // Project root directory
  workingDirectory: string; // Current working directory
  // ... additional context
}
```

### File Operations

```typescript
import { readFileSync, writeFileSync } from "fs"
import { join } from "path"

export default tool({
  // ...
  async execute(args, context) {
    const filePath = join(context.projectRoot, ".opencode", "state", "my-file.json")
    
    // Read
    const data = JSON.parse(readFileSync(filePath, "utf-8"))
    
    // Write
    writeFileSync(filePath, JSON.stringify(data, null, 2))
    
    return { success: true }
  }
})
```

### Error Handling

```typescript
export default tool({
  // ...
  async execute(args, context) {
    try {
      const result = await riskyOperation(args)
      return { success: true, data: result }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error"
      }
    }
  }
})
```

## Best Practices

### Tool Naming

- Use camelCase: `loadSkill`, `agentContext`
- Be descriptive: `getSessionID` not `gsi`
- Match action: `getState` not `state`

### Argument Design

- Keep minimal required arguments
- Provide sensible defaults
- Use consistent naming patterns
- Document all arguments

### Return Values

- Always return success/failure status
- Include relevant data
- Make errors actionable
- Keep consistent structure

### Performance

- Cache expensive operations
- Use lazy loading
- Batch operations when possible
- Avoid redundant file reads

## See Also

- [Execution Modes](./execution-modes.md) - Modes that use these tools
- [Skills](./skills.md) - Skills that invoke tools
- [Plugin System](./plugin-system.md) - How tools hook into the system