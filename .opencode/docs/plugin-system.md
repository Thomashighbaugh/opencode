# Plugin System

> Complete reference for the Hubs hook system plugin — now split into focused modules under `plugins/core/`

## Table of Contents

- [Overview](#overview)
- [Plugin Architecture](#plugin-architecture)
- [Module Breakdown](#module-breakdown)
- [Hook Types](#hook-types)
- [Keyword Detection](#keyword-detection)
- [State Management](#state-management-1)
- [Context Injection](#context-injection)
- [Permission Auto-Approval](#permission-auto-approval)
- [Session Restoration](#session-restoration)
- [Creating Custom Plugins](#creating-custom-plugins)
- [Best Practices](#best-practices)

## Overview

The Hubs plugin system was refactored from a single 1711-line monolith (`hubs-plugin.ts`) into four focused modules under `plugins/core/`:

| Module | Lines | Responsibility |
|--------|-------|----------------|
| `session.ts` | 638 | Session lifecycle, stats tracking, file tracking, heartbeat, context messages |
| `modes.ts` | 258 | Mode state CRUD, orphan detection, active mode caching |
| `keywords.ts` | 230 | Magic keyword patterns, detection, conflict resolution, mode messages |
| `hooks.ts` | 683 | All hook handlers — this is the plugin entry point |

The original `plugins/hubs-plugin.ts` is preserved for reference.

### Performance Optimizations

- **`getProjectRoot()` cached** — avoids forking `git rev-parse` on every tool invocation
- **State directory scans depth-limited** — `MAX_SCAN_DEPTH=3` prevents O(n) scans on large state directories
- **Index.json auto-updater** — state writes update a lightweight index, avoiding full directory rescans

## Plugin Architecture

### Plugin Structure

The plugin is now split into four modules under `plugins/core/`:

```typescript
// plugins/core/session.ts — Session lifecycle, stats, file tracking
export function readSessionStats(directory: string): SessionStats { ... }
export function writeSessionStats(directory: string, stats: SessionStats): void { ... }
export function getSessionRestoreMessages(directory: string, sessionId?: string): string[] { ... }

// plugins/core/modes.ts — Mode state CRUD
export function readState(directory: string, stateName: string, sessionId?: string): ModeState | null { ... }
export function writeState(directory: string, stateName: string, state: ModeState, sessionId?: string): void { ... }
export function clearState(directory: string, stateName: string, sessionId?: string): void { ... }

// plugins/core/keywords.ts — Magic keyword detection
export function detectKeywords(prompt: string): KeywordMatch[] { ... }
export function resolveConflicts(matches: KeywordMatch[]): KeywordMatch[] { ... }

// plugins/core/hooks.ts — Plugin entry point (imports from the other three)
export default JocPlugin: Plugin = async ({ project, client, directory, worktree }) => { ... }
```

### Hook Registration

```typescript
hooks.event = async ({ event }) => { /* ... */ }
hooks["tool.execute.before"] = async (input, output) => { /* ... *// }
hooks["tool.execute.after"] = async (input, output) => { /* ... *// }
hooks["chat.message"] = async (input, output) => { /* ... *// }
// ... more hooks
```

## Hook Types

### Session Lifecycle Hooks

#### session.created

Called when a new session starts.

```typescript
hooks.event = async ({ event }) => {
  switch (event.type) {
    case 'session.created': {
      const sessionId = event.properties.info.id
      
      // Restore previous session state
      const messages = getSessionRestoreMessages(directory, sessionId)
      
      if (messages.length > 0) {
        for (const msg of messages) {
          queueContextMessage(sessionId, msg)
        }
      }
      break
    }
  }
}
```

#### session.deleted

Called when a session ends.

```typescript
case 'session.deleted': {
  const sessionId = event.properties.info.id
  
  // Clean up session context
  clearSessionContext(sessionId)
  
  // Clean up session state files
  const sessionDir = join(directory, '.opencode', 'state', 'sessions', sessionId)
  if (existsSync(sessionDir)) {
    // Remove session state files
    readdirSync(sessionDir)
      .filter(f => f.endsWith('-state.json'))
      .forEach(f => unlinkSync(join(sessionDir, f)))
  }
  break
}
```

### Tool Lifecycle Hooks

#### tool.execute.before

Called before a tool is executed.

```typescript
hooks["tool.execute.before"] = async (input, output) => {
  const toolName = input.tool || 'unknown'
  const sessionId = input.sessionID
  
  // Update tool statistics
  if (sessionId) {
    updateToolStats(toolName, sessionId)
  }
  
  // Check for active modes
  const modeActive = hasActiveMode(directory, sessionId)
  const todoStatus = getTodoStatus(directory)
  
  // Generate pre-tool message
  const message = generatePreToolMessage(toolName, todoStatus, modeActive)
  
  if (message && sessionId) {
    queueContextMessage(sessionId, `<pre-tool-reminder tool="${toolName}">\n${message}\n</pre-tool-reminder>`)
  }
  
  // Track skill activation
  if (toolName === 'Skill' || toolName === 'skill') {
    const skillName = input.args?.skill
    if (skillName) {
      writeState(directory, 'skill-active', {
        active: true,
        started_at: new Date().toISOString(),
        skill: skillName,
        session_id: sessionId
      }, sessionId)
    }
  }
}
```

**Pre-Tool Messages:**

| Tool | Message |
|------|---------|
| TodoWrite | Mark todos in_progress BEFORE starting, completed IMMEDIATELY after finishing |
| Bash | Use parallel execution for independent tasks. Use run_in_background for long operations |
| Edit | Verify changes work after editing. Test functionality before marking complete |
| Write | Verify changes work after editing. Test functionality before marking complete |
| Read | Read multiple files in parallel when possible for faster analysis |
| Grep | Combine searches in parallel when investigating multiple patterns |
| Generic (mode active) | The boulder never stops. Continue until all tasks complete |

#### tool.execute.after

Called after a tool execution completes.

```typescript
hooks["tool.execute.after"] = async (input, output) => {
  const toolName = input.tool || 'unknown'
  const sessionId = input.sessionID
  const toolOutput = output.output || ''
  
  // Update tool count
  const toolCount = sessionId ? updateToolStats(toolName, sessionId) : 1
  
  // Detect failures
  let message = ''
  
  switch (toolName) {
    case 'Bash':
      if (detectBashFailure(toolOutput)) {
        message = 'Command failed. Please investigate the error and fix before continuing.'
      }
      break
    
    case 'Edit':
      if (detectWriteFailure(toolOutput)) {
        message = 'Edit operation failed. Verify file exists and content matches exactly.'
      }
      break
    
    case 'Write':
      if (detectWriteFailure(toolOutput)) {
        message = 'Write operation failed. Check file permissions and directory existence.'
      }
      break
  }
  
  if (message && sessionId) {
    queueContextMessage(sessionId, `<post-tool-reminder tool="${toolName}">\n${message}\n</post-tool-reminder>`)
  }
  
  // Clear skill active state
  if (toolName === 'Skill' || toolName === 'skill') {
    clearState(directory, 'skill-active', sessionId)
  }
}
```

### Chat Hooks

#### chat.message

Called for each chat message.

```typescript
hooks["chat.message"] = async (input, output) => {
  const sessionId = input.sessionID
  
  // Get restore messages
  const restoreMessages = getSessionRestoreMessages(directory, sessionId)
  if (restoreMessages.length > 0) {
    for (const msg of restoreMessages) {
      queueContextMessage(sessionId, msg)
    }
  }
  
  // Continuation messages for active modes
  const ralphState = readState(directory, 'ralph', sessionId)
  if (ralphState?.active && ralphState.prompt) {
    queueContextMessage(sessionId, `
      <ralph-continuation>
      [RALPH LOOP ACTIVE - Iteration ${ralphState.iteration || 1}/${ralphState.max_iterations || 10}]
      Original task: ${ralphState.prompt}
      Continue until complete. Run /cancel when done.
      </ralph-continuation>
    `)
  }
  
  const ultraworkState = readState(directory, 'ultrawork', sessionId)
  if (ultraworkState?.active && ultraworkState.original_prompt) {
    queueContextMessage(sessionId, `
      <ultrawork-continuation>
      [ULTRAWORK MODE ACTIVE]
      Original task: ${ultraworkState.original_prompt}
      Reinforcement: ${ultraworkState.reinforcement_count || 0}
      Continue with maximum parallelism.
      </ultrawork-continuation>
    `)
  }
}
```

### Permission Hooks

#### permission.ask

Called when a permission is requested.

```typescript
hooks["permission.ask"] = async (input, output) => {
  const permissionType = input.type
  const sessionId = input.sessionID
  const pattern = input.pattern
  
  if (permissionType === 'bash' && pattern) {
    const command = typeof pattern === 'string' ? pattern : pattern.join(' ')
    
    // Define safe patterns
    const safePatterns = [
      /^git (status|diff|log|branch|show|fetch)/,
      /^npm (test|run (test|lint|build|check|typecheck))/,
      /^pnpm (test|run (test|lint|build|check|typecheck))/,
      /^yarn (test|run (test|lint|build|check|typecheck))/,
      /^tsc( |$)/,
      /^eslint /,
      /^prettier /,
      /^cargo (test|check|clippy|build)/,
      /^pytest/,
      /^python -m pytest/,
      /^ls( |$)/,
    ]
    
    const isSafe = safePatterns.some(p => p.test(command.trim()))
    const hasDangerousChars = /[;&|`$()<>\n\r\t\0\\{}[\]*?~!#]/.test(command)
    
    if (isSafe && !hasDangerousChars) {
      output.status = 'allow'
      if (sessionId) {
        queueContextMessage(sessionId, `
          <permission-auto-approved type="bash">
          Safe command auto-approved: ${command.substring(0, 100)}
          </permission-auto-approved>
        `)
      }
    }
  }
}
```

### Command Hooks

#### command.execute.before

Called before a command is executed.

```typescript
hooks["command.execute.before"] = async (input, output) => {
  const command = input.command
  const sessionId = input.sessionID
  
  // Mode commands
  if (command === 'ralph-loop' || command === 'ulw-loop' || command === 'ultrawork') {
    const state = {
      active: true,
      started_at: new Date().toISOString(),
      session_id: sessionId,
      project_path: directory
    }
    writeState(directory, command === 'ralph-loop' ? 'ralph' : 'ultrawork', state, sessionId)
    
    if (sessionId) {
      queueContextMessage(sessionId, `
        <mode-activated mode="${command}">
        ${command} mode is now active. Follow the mode's workflow instructions.
        </mode-activated>
      `)
    }
  }
  
  // Cancel commands
  if (command === 'cancel-ralph' || command === 'stop-continuation') {
    clearModeStates(directory, ['ralph', 'autopilot', 'ultrawork', 'ralplan'], sessionId)
    
    if (sessionId) {
      queueContextMessage(sessionId, `
        <mode-cancelled>
        All active modes have been cancelled. You may proceed normally.
        </mode-cancelled>
      `)
    }
  }
}
```

### Experimental Hooks

#### experimental.chat.system.transform

Transforms the system prompt before sending to LLM.

```typescript
hooks["experimental.chat.system.transform"] = async (input, output) => {
  const sessionId = input.sessionID
  if (!sessionId) return
  
  // Get queued context messages
  const messages = consumeContextMessages(sessionId)
  if (messages.length === 0) return
  
  // Inject into system prompt
  const contextBlock = `
    <hubs-plugin-context>
    ${messages.join('\n\n')}
    </hubs-plugin-context>
  `
  output.system.push(contextBlock)
}
```

#### experimental.session.compacting

Called when session is compacted (context trimmed). Preserves critical state in the compacted context and, for long sessions, saves a structured artifact to disk.

```typescript
hooks["experimental.session.compacting"] = async (input, output) => {
  const sessionId = input.sessionID
  
  // Preserve ralph state
  const ralphState = readState(directory, 'ralph', sessionId)
  if (ralphState?.active) {
    output.context.push(`
      ## Ralph Loop State
      - Iteration: ${ralphState.iteration || 1}/${ralphState.max_iterations || 10}
      - Original Task: ${ralphState.prompt || 'Unknown'}
      - Started: ${ralphState.started_at || 'Unknown'}
    `)
  }
  
  // Preserve ultrawork state
  const ultraworkState = readState(directory, 'ultrawork', sessionId)
  if (ultraworkState?.active) {
    output.context.push(`
      ## Ultrawork State
      - Original Task: ${ultraworkState.original_prompt || 'Unknown'}
      - Reinforcement Count: ${ultraworkState.reinforcement_count || 0}
      - Started: ${ultraworkState.started_at || 'Unknown'}
    `)
  }
  
  // Preserve todo status
  const todoStatus = getTodoStatus(directory)
  if (todoStatus) {
    output.context.push(`## Pending Tasks\n${todoStatus}\n`)
  }
  
  // Preserve project memory
  const projectMemoryPath = join(directory, '.opencode', 'state', 'project-memory.json')
  if (existsSync(projectMemoryPath)) {
    const memory = readJsonFile(projectMemoryPath)
    if (memory) {
      const langs = memory.techStack?.languages?.map(l => l.name).join(', ') || 'Unknown'
      const notes = memory.customNotes?.map(n => `- ${n.note}`).join('\n') || ''
      output.context.push(`
        ## Project Memory
        - Languages: ${langs}
        ${notes ? `### Custom Notes:\n${notes}` : ''}
      `)
    }
  }

  // ── Compaction Artifact Saving ──────────────────────────────────
  // For long sessions (>50 tool calls, >10 min, or >3 subagent
  // invocations), save a structured JSON artifact to disk so work
  // products survive compaction. Zero API calls — pure file I/O.
  if (sessionId) {
    const hb = readJsonFile(getHeartbeatPath(directory, sessionId))
    const stats = loadSessionStatsPruned()
    const sessionStats = stats.sessions[sessionId]
    
    const toolCalls = hb?.toolCount || 0
    const durationSec = sessionStats
      ? ((sessionStats.updated_at || sessionStats.started_at) - sessionStats.started_at)
      : 0
    const subagentCalls = sessionStats?.tool_counts?.Task || 0
    
    if (toolCalls > 100 || durationSec > 1200 || subagentCalls > 6) {
      const artifact = {
        sessionId,
        compactedAt: new Date().toISOString(),
        toolCalls,
        durationSeconds: durationSec,
        subagentInvocations: subagentCalls,
        modeState: {
          ralph: ralphState?.active ? { active: true, iteration: ralphState.iteration, prompt: ralphState.prompt } : null,
          ultrawork: ultraworkState?.active ? { active: true, originalPrompt: ultraworkState.original_prompt, reinforcementCount: ultraworkState.reinforcement_count } : null,
        },
        todoProgress: hb?.todoProgress || null,
        recentTools: hb?.recentTools?.slice(0, 10) || [],
        preservedContext: output.context,
      }
      writeJsonFile(
        join(directory, '.opencode', 'state', 'sessions', sessionId, `compaction-${new Date().toISOString().replace(/[:.]/g, '-')}.json`),
        artifact
      )
    }
  }
}
```

**Compaction Artifact Schema:**

```json
{
  "sessionId": "ses_xxx",
  "compactedAt": "2026-06-20T14:30:00.000Z",
  "toolCalls": 87,
  "durationSeconds": 1247,
  "subagentInvocations": 5,
  "modeState": {
    "ralph": { "active": true, "iteration": 4, "prompt": "fix all TypeScript errors" },
    "ultrawork": null
  },
  "todoProgress": { "completed": 12, "remaining": 3, "pending": 2, "inProgress": 1 },
  "recentTools": [
    { "name": "Write", "time": "2026-06-20T14:29:55.000Z" }
  ],
  "preservedContext": ["## Ralph Loop State\n...", "## Pending Tasks\n..."]
}
```

**Long session threshold** — artifact saved only when any of: >100 tool calls, >20 min duration, or >6 subagent invocations. See [State Management](./state-management.md#compaction-artifacts) for full details.

## Keyword Detection

### Pattern Definitions

```typescript
const KEYWORD_PATTERNS = {
  // Cancel
  cancel: /\b(cancelomc|stopomc)\b/i,
  
  // Ralph
  ralph: /\b(ralph|don't stop|must complete|until done)\b/i,
  
  // Autopilot
  autopilot: /\b(autopilot|auto pilot|auto-pilot|autonomous|full auto|fullsend)\b/i,
  autopilotBuild: /\b(build|create|make)\s+me\s+(an?\s+)?(app|feature|project|tool|plugin|website|api|server|cli|script|system|service|dashboard|bot|extension)\b/i,
  autopilotWant: /\bi\s+want\s+a\s+/i,
  
  // Ultrawork
  ultrawork: /\b(ultrawork|ulw|uw)\b/i,
  
  // Ralplan
  ralplan: /\b(ralplan)\b/i,
  
  // Deep interview
  deepInterview: /\b(deep[\s-]interview|ouroboros)\b/i,
  
  // AI slop cleaner
  aiSlopCleaner: /\b(ai[\s-]?slop|anti[\s-]?slop|deslop|de[\s-]?slop)\b/i,
  
  // TDD
  tdd: /\b(tdd)\b/i,
  tddTestFirst: /\btest\s+first\b/i,
  
  // Code review
  codeReview: /\b(code\s+review|review\s+code)\b/i,
  
  // Security review
  securityReview: /\b(security\s+review|review\s+security)\b/i,
  
  // Ultrathink
  ultrathink: /\b(ultrathink|think hard|think deeply)\b/i,
  
  // Deepsearch
  deepsearch: /\b(deepsearch)\b/i,
  
  // Analyze
  analyze: /\b(deep[\s-]?analyze|deepanalyze)\b/i,
  
  // New agent
  newAgent: /\b(create[\s-]?agent|new[\s-]?agent|agent[\s-]?creator)\b/i,
}
```

### Detection Flow

```typescript
function detectKeywords(prompt: string): KeywordMatch[] {
  const matches: KeywordMatch[] = []
  const cleanPrompt = sanitizeForKeywordDetection(prompt).toLowerCase()
  
  // Check each pattern
  for (const [keyword, pattern] of Object.entries(KEYWORD_PATTERNS)) {
    if (hasActionableKeyword(cleanPrompt, pattern)) {
      matches.push({ name: keyword, args: '' })
    }
  }
  
  // Resolve conflicts
  return resolveConflicts(matches)
}

function resolveConflicts(matches: KeywordMatch[]): KeywordMatch[] {
  // Cancel takes highest priority
  if (matches.some(m => m.name === 'cancel')) {
    return [matches.find(m => m.name === 'cancel')!]
  }
  
  // Priority order
  const priorityOrder = [
    'cancel', 'ralph', 'autopilot', 'ultrawork', 'ralplan',
    'deep-interview', 'ai-slop-cleaner', 'tdd', 'code-review',
    'security-review', 'ultrathink', 'deepsearch', 'analyze', 'new-agent'
  ]
  
  // Sort by priority
  return matches.sort((a, b) => 
    priorityOrder.indexOf(a.name) - priorityOrder.indexOf(b.name)
  )
}
```

### Mode Messages

```typescript
const MODE_MESSAGES: Record<string, string> = {
  ultrathink: `
    <think-mode>
    **ULTRATHINK MODE ENABLED** - Extended reasoning activated.
    You are now in deep thinking mode. Take your time to:
    1. Thoroughly analyze the problem from multiple angles
    2. Consider edge cases and potential issues
    3. Think through the implications of each approach
    4. Reason step-by-step before acting
    </think-mode>
  `,
  
  deepsearch: `
    <search-mode>
    MAXIMIZE SEARCH EFFORT. Launch multiple background agents IN PARALLEL:
    - explore agents (codebase patterns, file structures)
    - librarian agents (remote repos, official docs, GitHub examples)
    Plus direct tools: Grep, Glob
    NEVER stop at first result - be exhaustive.
    </search-mode>
  `,
  
  // ... more mode messages
}
```

## State Management

### State Directory

```typescript
const STATE_DIR = join(directory, '.opencode', 'state')
const SESSIONS_DIR = join(STATE_DIR, 'sessions')
```

### State Files

```typescript
const MODE_STATE_FILES = [
  'autopilot-state.json',
  'ralph-state.json',
  'ultrawork-state.json',
  'ralplan-state.json',
  'team-state.json',
  'ultraqa-state.json',
]
```

### Read/Write Operations

```typescript
function readState(directory: string, stateName: string, sessionId?: string): ModeState | null {
  const paths = [
    getStatePath(directory, stateName, sessionId),
    getStatePath(directory, stateName),
  ]
  
  for (const path of paths) {
    const state = readJsonFile<ModeState>(path)
    if (state) {
      if (sessionId && state.session_id && state.session_id !== sessionId) {
        continue
      }
      return state
    }
  }
  return null
}

function writeState(directory: string, stateName: string, state: ModeState, sessionId?: string): void {
  const path = getStatePath(directory, stateName, sessionId)
  writeJsonFile(path, state)
}

function clearState(directory: string, stateName: string, sessionId?: string): void {
  const paths = [
    getStatePath(directory, stateName, sessionId),
    getStatePath(directory, stateName),
  ]
  
  for (const path of paths) {
    try {
      if (existsSync(path)) {
        unlinkSync(path)
      }
    } catch { /* best-effort cleanup */ }
  }
}
```

## Context Injection

### Session Context Cache

```typescript
interface SessionContext {
  pendingMessages: string[]
  lastUpdated: string
}

const sessionContextCache = new Map<string, SessionContext>()

function queueContextMessage(sessionId: string, message: string): void {
  if (!message.trim()) return
  
  const ctx = getSessionContext(sessionId)
  ctx.pendingMessages.push(message)
  ctx.lastUpdated = new Date().toISOString()
  
  // Prevent unbounded growth
  if (ctx.pendingMessages.length > 20) {
    ctx.pendingMessages = ctx.pendingMessages.slice(-20)
  }
}

function consumeContextMessages(sessionId: string): string[] {
  const ctx = sessionContextCache.get(sessionId)
  if (!ctx || ctx.pendingMessages.length === 0) return []
  
  const messages = [...ctx.pendingMessages]
  ctx.pendingMessages = []
  ctx.lastUpdated = new Date().toISOString()
  return messages
}
```

## Permission Auto-Approval

### Safe Patterns

Commands matching these patterns are auto-approved:

| Pattern | Example |
|---------|---------|
| `git status/diff/log/branch/show/fetch` | `git status` |
| `npm test/run test/lint/build/check/typecheck` | `npm test` |
| `pnpm test/run ...` | `pnpm test` |
| `yarn test/run ...` | `yarn test` |
| `tsc` | `tsc --noEmit` |
| `eslint` | `eslint src/` |
| `prettier` | `prettier --check .` |
| `cargo test/check/clippy/build` | `cargo test` |
| `pytest` | `pytest tests/` |
| `python -m pytest` | `python -m pytest` |
| `ls` | `ls -la` |

### Dangerous Characters

Commands with these characters are NOT auto-approved:

```typescript
const hasDangerousChars = /[;&|`$()<>\n\r\t\0\\{}[\]*?~!#]/.test(command)
```

## Session Restoration

### Restoration Flow

1. **Session Start**: Check for active mode states
2. **Generate Messages**: Create context messages for each active mode
3. **Queue Messages**: Add to session context
4. **Inject**: Messages injected into LLM on next turn

### Restoration Messages

```typescript
function getSessionRestoreMessages(directory: string, sessionId?: string): string[] {
  const messages: string[] = []
  
  // Check ultrawork
  const ultraworkState = readState(directory, 'ultrawork', sessionId)
  if (ultraworkState?.active) {
    messages.push(`
      <session-restore>
      [ULTRAWORK MODE RESTORED]
      You have an active ultrawork session from ${ultraworkState.started_at}.
      Original task: ${ultraworkState.original_prompt}
      Treat this as prior-session context only. Prioritize the user's newest request.
      </session-restore>
    `)
  }
  
  // Check ralph
  const ralphState = readState(directory, 'ralph', sessionId)
  if (ralphState?.active) {
    messages.push(`
      <session-restore>
      [RALPH LOOP RESTORED]
      You have an active ralph-loop session.
      Original task: ${ralphState.prompt || 'Task in progress'}
      Iteration: ${ralphState.iteration || 1}/${ralphState.max_iterations || 10}
      Treat this as prior-session context only. Prioritize the user's newest request.
      </session-restore>
    `)
  }
  
  // Check todos
  const todoFile = join(directory, '.opencode', 'state', 'todos.json')
  if (existsSync(todoFile)) {
    const todos = readJsonFile<{ todos?: Array<{ status: string }> }>(todoFile)
    if (todos?.todos) {
      const incompleteCount = todos.todos.filter(t => 
        t.status !== 'completed' && t.status !== 'cancelled'
      ).length
      
      if (incompleteCount > 0) {
        messages.push(`
          <session-restore>
          [PENDING TASKS DETECTED]
          You have ${incompleteCount} incomplete tasks from a previous session.
          Treat this as prior-session context only. Prioritize the user's newest request.
          </session-restore>
        `)
      }
    }
  }
  
  return messages
}
```

## Creating Custom Plugins

### Basic Plugin Structure

```typescript
// .opencode/plugins/my-plugin.ts

import type { Plugin, Hooks } from "@opencode-ai/plugin"

export const MyPlugin: Plugin = async ({ project, client, directory, worktree }) => {
  const hooks: Hooks = {}
  
  // Add custom hooks
  hooks["tool.execute.before"] = async (input, output) => {
    // Your logic here
  }
  
  return hooks
}

export default MyPlugin
```

### Register Plugin

Add to `opencode.jsonc`:

```jsonc
{
  "plugin": [
    "./plugins/my-plugin.ts"
  ]
}
```

## Best Practices

### Hook Performance

1. **Keep hooks fast**: Avoid slow operations
2. **Use async appropriately**: Don't block unnecessarily
3. **Cache frequently**: Reduce redundant operations

### State Management

1. **Clean up after yourself**: Remove state when modes complete
2. **Use session IDs**: Scope state to sessions
3. **Handle missing state**: Graceful degradation

### Error Handling

```typescript
// Good: Graceful error handling
try {
  const state = readState(directory, 'ralph', sessionId)
  if (state?.active) {
    // Process state
  }
} catch (error) {
  // Log but don't crash
  console.error('Failed to read state:', error)
}

// Bad: Let errors propagate
const state = readState(directory, 'ralph', sessionId)
// Might throw, crash plugin
```

## See Also

- [Installation](./installation.md) - Plugin installation
- [Execution Modes](./execution-modes.md) - Mode state details
- [State Management](./state-management.md) - State persistence
- [Tools](./tools.md) - TypeScript tools