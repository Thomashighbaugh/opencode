# API Usage Minimization Strategy

> How to minimize Ollama Cloud API consumption across the entire Hubs lifecycle without degrading output quality to unusable levels.

## The Problem

OpenCode Hubs burns through API tokens because:

1. **Every hub subcommand invokes an LLM** — even trivial operations like listing files, running git commands, or updating documentation
2. **Auto-context generation** runs LLM analysis on every session, most of which produces dubious value
3. **Subagent churn** — dispatching 3+ subagents for simple tasks multiplies token consumption
4. **No caching** — the same library docs, the same code analysis, the same patterns get re-fetched every session
5. **Verbose output** — agents write long markdown when a single line would suffice

## Strategy: 5 Layers of Reduction

### Layer 1: Model Routing (Cheapest Model for the Job)

| Task Type | Model | Cost Multiplier | Why |
|-----------|-------|----------------|-----|
| File listing, git status, simple grep | **No model** — use tools directly | 0x | Don't invoke LLM at all |
| Documentation lookup, simple search | `deepseek-v4-flash:cloud` (cheap, fast) | 1x | 1M context, fast inference |
| Standard code generation | `deepseek-v4-flash:cloud` | 1x | Good enough for most tasks |
| Complex architecture decisions | `deepseek-v4-pro:cloud` | 3-5x | Only when flash fails |
| Test generation, code review | `deepseek-v4-flash:cloud` | 1x | Flash handles this fine |

**Rule**: Never use `pro` for anything that `flash` can do. Default all agents to `flash`. Only escalate to `pro` when flash fails 3 times.

### Layer 2: Caching (Never Re-Fetch)

| What to Cache | Cache Key | Storage | TTL |
|--------------|-----------|---------|-----|
| Project structure listing | `ls -R` output hash | `state/cache/project-structure.json` | Session |
| Library docs | dependency name + version | `context/research/{name}-{version}.md` | Forever |
| Code patterns | file glob + pattern hash | `state/cache/patterns.json` | 1 hour |
| Detection results | `.opencode/state/init/init-detection.json` | File on disk | Until re-run |
| Agent outputs | task hash | `state/cache/agent-outputs/` | 30 min |

### Layer 3: Subcommand Cost Classification

Every hub subcommand is classified by API cost:

```
🟢 FREE — No LLM invocation (tools only)
   /project stage, /project commit (with -m), git status, ls, grep
   
🟡 CHEAP — Single flash invocation, < 10K tokens
   /harvest-context docs (Context7 MCP — no LLM needed)
   /init-project detect (file scanning + model for summary)
   
🟠 MODERATE — Single flash invocation, 10-50K tokens
   Standard code generation, single-file edits
   
🔴 EXPENSIVE — Pro model or multi-agent chains
   Architecture decisions, multi-file refactoring
   Cross-agent orchestration (ralph, team, swarm)
```

### Layer 4: Aggressive Context Compression

| Technique | Savings | Implementation |
|-----------|---------|----------------|
| MVI format | 60-80% | Keep context files under 200 lines |
| Density filtering | 40-60% | Remove low-information-density sections |
| Token budget per file | 30-50% | Hard limit: 500 tokens per context file |
| Command output truncation | 90%+ | Only show last N lines of build/test output |

### Layer 5: Manual Gatekeeping

**FULLY MANUAL** (never auto-invoke):
- Context generation (`/harvest-context session`) — only when user explicitly requests
- Documentation regeneration (`/init-project docs`) — only on user request
- Changelog updates — only when committing
- ADR creation — only for significant decisions

**SEMI-AUTOMATED** (user confirms before LLM call):
- Git commits (stage + provide message manually)
- Code review (user selects files to review)
- Project analysis (user confirms detection results)

## Implementation

### 1. Plugin Changes

```typescript
// In tool.execute.before — skip context injection for cheap operations
const CHEAP_TOOLS = ['Bash', 'Read', 'Grep', 'Glob', 'Write', 'Edit']
if (CHEAP_TOOLS.includes(toolName) && !modeActive) {
  // Skip context queue injection — saves tokens on trivial operations
  return
}
```

### 2. Agent Prompt Changes

Every agent gets a token budget:

```markdown
<Token_Budget>
  - Default output: under 1000 tokens
  - File listing: 3 lines max per file
  - Error messages: first and last line only
  - Never repeat context already in the conversation
  - Use bullet points, not paragraphs
</Token_Budget>
```

### 3. Hub Subcommand Changes

| Subcommand | Before (API Cost) | After (API Cost) |
|-----------|-------------------|------------------|
| `/project stage` | LLM invocation (🔴) | **No LLM** — tools only (🟢) |
| `/project commit` | LLM generates message (🟠) | Use `-m` flag, no LLM (🟢) |
| `/harvest-context session` | Auto-runs on completion (🔴) | **Manual only** (never auto) |
| `/init-project docs` | Auto-runs after setup (🟠) | **Manual only** |
| `/orchestrate` commands | Full multi-agent chains (🔴) | Flash-only default, pro on escalation |

### 4. Context Generation: Manual Only

Remove ALL auto-context generation hooks:

```typescript
// REMOVED: auto-harvest on task completion
// REMOVED: auto-ADR on significant decisions  
// REMOVED: auto-pattern extraction on error discovery
// REMOVED: auto-changelog on context write

// KEPT: explicit /harvest-context session command
// KEPT: explicit /project commit for changelog
// KEPT: explicit CHANGELOG.md entry only on user commit
```

## Expected Savings

| Layer | Savings | Cumulative |
|-------|---------|------------|
| Model routing (flash over pro) | 60-80% | 60-80% |
| Caching | 30-50% of remaining | 72-90% |
| Context compression | 50-70% of remaining | 86-97% |
| Manual gatekeeping | 40-60% of remaining | 92-99% |
| Subcommand cost classification | 20-40% of remaining | 94-99% |

**Target: 95%+ reduction in API token consumption vs current usage.**

## File Location

This document: `context/frameworks/api-usage-minimization.md`