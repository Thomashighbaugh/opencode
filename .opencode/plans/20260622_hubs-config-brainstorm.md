# Hubs Configuration Brainstorm

**Method:** brainstorm
**Topic:** Hubs configuration improvements — interoperability, API/token efficiency, new features, current functionality polish
**Status:** saved
**Created:** 2026-06-22

---

## Overview

Comprehensive brainstorm across the full OpenCode Hubs stack: 29 agents, 87 skills, 14 tools, 13 rules, 2 plugins, 5 hub commands, multi-tier cache, mode management, stall detection, heartbeat system, and state/context infrastructure.

---

## 1. Interoperability — Making Components Work Together

### A. Skill Dependency & Composition System

Skills are currently standalone — they don't declare what other skills, agents, or tools they need. Loading `ralph` doesn't auto-load `verify`. Loading `swarm` doesn't tell you it needs 11 agents available.

**Proposal:** Add `depends_on: [verify, conventional-commit]` frontmatter to skill SKILL.md files. `loadSkill()` would auto-resolve the dependency graph and load prerequisites.

**Impact:** Skills become composable building blocks rather than opaque blobs.

### B. Hub-to-Hub State Bridge (Structured Handoffs)

All cross-hub handoffs are "manual only" — the user must remember to run `/harvest-context` after `/orchestrate`. Instead, each hub could write structured output manifests that other hubs can discover:

```
/ideation finalizes → writes .opencode/state/ideation/manifests/plan-auth-v2.json
/orchestrate loads → says "Found 3 plans from ideation, pick one to execute"
/harvest-context detects → "New orchestration output available, extract context?"
```

This is NOT auto-execution. It's structured discoverability. The user still chooses what to do.

### C. Unified Agent Capability Registry

Agent definitions are free-text `.md` files. There's no structured query like "find me an agent that can review TypeScript and generate tests." The `listAgents` tool does full-text search against descriptions only.

**Proposal:** Add a structured capability field to agent frontmatter:
```yaml
capabilities:
  - code-review
  - security-audit
  - typescript
  - react
```

Skills can then dynamically route to agents by capability match rather than hardcoded names.

### D. Plugin → Skill Communication Channel

Plugins (hooks.ts) handle low-level lifecycle events but can't invoke skills. Skills handle user workflows but can't listen to plugin events.

**Proposal:** A lightweight event bus (`.opencode/state/events/`) where plugins can emit events that skills can subscribe to. Examples:
- Plugin emits `mode.stalled` → skill subscribes and auto-generates recovery context
- Plugin emits `session.compacting` → skill saves work products
- Plugin emits `tool.error` → skill triggers debug workflow

### E. Agent Definition Validation & Schema

The `agent-format-enforcer` skill checks for `<Agent_Prompt>` XML wrappers, but there's no validation that agent prompts actually work — that referenced agents exist, tools exist, and all cross-references are valid. Integrate into `/init-project verify`.

### F. Cross-Project Skill Registry

Skills live under `~/.config/opencode/skills/` or `.opencode/skills/`. No way to share a skill between two projects without copying files.

**Proposal:** A symlink/registry pattern — `~/.config/opencode/skills/` as canonical source, projects reference via symlink or config map.

---

## 2. API Efficiency & Token Optimization

### A. Wire Up the LLM Semantic Cache (Biggest Win)

The `llm-cache` skill exists but is **never loaded** during normal operation. It's a dormant feature. The hooks plugin's cache tiers (tool, MCP, agent) are all functional, but the LLM response cache is not integrated.

**Proposal:** In `hooks.ts` `tool.execute.before`, before any LLM call, check the LLM cache for semantically similar prompts (via vector similarity). On hit → inject cached response as context, skip the API call.

**Estimated savings:** 30-50% on iterative loops (ralph/ultrawork).

### B. Cache Hit Visibility & HUD Integration

Users have no idea caching is working. The multi-tier cache hums along silently.

**Proposal:** Surface cache stats in the TUI HUD:
```
⚡ cache: 67% hit (tool) | 92% (mcp) | 0% (llm)
```
Also add `/cache stats` as a project command for detailed view.

### C. Adaptive Context Window Budgeting

All 9 rules are always loaded into every session. For a task purely about TypeScript configuration, loading `shell_strategy.md`, `hub-routing.md`, and `context-strategy.md` is wasted tokens. AGENTS.md alone is ~5K tokens.

**Proposal:** Tag rules with relevance domains. When the user's prompt doesn't reference shell commands, git, or hub routing, skip those rules. On first relevant action (e.g., the user types a bash command), inject the shell rules at that point.

**Estimated savings:** 30-40% of instruction overhead per session.

### D. Deduplicate Skill Content in Loads

When loading a skill, the entire SKILL.md plus all scripts are read. Many skills share reference material.

**Proposal:** Add a "resolved skill cache" at the MCP cache tier (7-day TTL). The first load of a skill is full; subsequent loads in any session retrieve from cache.

### E. Selective Hub State Loading

When a session starts, the plugin scans all 4 hub state directories. For established projects with many state files, this gets expensive.

**Proposal:** Lazy scan — only scan state dirs that have been modified since last session.

### F. Prompt Template Registry

Each skill builds its workflow prompts from scratch. A centralized prompt registry with parameterized templates would reduce token duplication. Instead of each skill re-describing the same orchestration patterns, they'd reference template IDs.

---

## 3. Additional Features — Complementary Capabilities

### A. TUI Execution Dashboard

The TUI plugin is functional (dialog menus) but could be a real-time operations center showing:
- Active modes (ralph iteration 3/10, ultrawork 15 tasks done)
- Tool call count and rate per session
- Cache hit rates across all tiers
- Active skill (what's loaded right now)
- State file sizes (quickly identify bloat)
- Estimated tokens consumed this session

### B. Session Bookmarks & Named Restore Points

The auto-compaction artifact system exists but is opaque. Users can't say "save this point, I might want to come back."

**Proposal:**
- `/project bookmark "pre-refactor-auth"` — creates a named snapshot of current session state, todos, active modes, and working files.
- `/project restore "pre-refactor-auth"` — reloads that state.

### C. Intelligent Worktree Manager

The `project-session-manager` skill already creates git worktrees per feature. Promote to first-class hub capability:
- `/project worktree create <feature>`
- `/project worktree switch`
- `/project worktree list`

### D. Context Garbage Collection

Over months, `.opencode/context/` accumulates stale entries, redundant patterns, and orphaned files.

**Proposal:** `/harvest-context gc` — scans all context files, identifies:
- Duplicate/redundant entries (fuzzy match)
- Stale references (files mentioned that no longer exist)
- Unused patterns (no agent references them)
- Outdated theory entries

Generates a cleanup plan, asks for approval, then executes.

### E. Agent Performance Profiler

**Proposal:** `/project analyze agents` — shows:
- Most-used agents (ranked by invocations)
- Average response time per agent
- Cache effectiveness per agent type
- Most common failure modes per agent

### F. Universal Diff Preview Before Commits

When `/project commit` runs, show a formatted diff in the TUI with syntax highlighting before the user confirms.

---

## 4. Current Functionality Improvements

### A. Smarter Agent Model Failover

Current fallback: retry same provider → escalate. Problem: if `@executor` fails with `deepseek-v4-flash`, retrying with the same model on opencode-go won't help if the issue is prompt quality.

**Proposal:** On failure, try a DIFFERENT tier model first before escalating:
- flash tier fails → retry with pro tier (not just same model on different provider)
- 4 total attempts (2 models × 2 providers) → escalate
- Currently: 2 total attempts → escalate

### B. Configurable Stall Thresholds Per Mode

Stall detection uses hardcoded 120s soft / 300s hard thresholds. But `deep-interview` might legitimately pause for thinking, while `ralph` should resume aggressively.

**Proposal:** Mode-specific stall config:
```json
"stall": {
  "ralph": { "soft": 60000, "hard": 120000 },
  "ultrawork": { "soft": 120000, "hard": 300000 },
  "deep-interview": { "soft": 300000, "hard": 600000 }
}
```

### C. Auto-Cleanup Completed Mode State

When a mode (ralph, ultrawork, etc.) completes naturally, its state file persists as an orphan until the next session detects it. Modes should self-clean on natural completion.

### D. Priority-Based Context Message Queue

Context messages use FIFO queue with truncation on overflow. Important messages (mode recovery, errors, security warnings) should be preserved over routine notifications.

**Proposal:** Priority levels:
- HIGH: mode recovery, errors, security
- MEDIUM: permission approvals, checkpoint summaries
- LOW: routine notifications, stats

On overflow, drop LOW first, preserve HIGH at all costs.

### E. Surgical Tool Cache Invalidation

Currently any Write/Edit/bash invalidates ALL Glob/Grep/Read caches. On a large project, every file edit flushes every search cache.

**Proposal:** Track which files each cache entry covers. On `Write(path)`, only invalidate cache entries whose file paths intersect with that path. Saves ~90% of cache recomputation.

### F. Skill Run Timeout

Skills declare `max_runtime_seconds` in frontmatter. The runtime enforces it. Prevents skills like `provision` from blocking the session on million-line codebases.

### G. Overlapping Mode Detection

Running `ralph` and starting `ultrawork` can create conflicting mode states. Mode activation should detect already-active modes and either warn or queue.

### H. Async Task Progress in TUI

Background agents via the `Task` tool give no visible progress. Lightweight polling indicator showing "3 subagents running, 2 completed".

### I. Hub Command Completion Hooks

A standard `post_complete: [remember, compact, harvest-context session]` in skill frontmatter would let skills self-declare what should happen after they finish.

---

## Prioritized Roadmap (Impact × Feasibility)

| Priority | Item | Category | Why |
|----------|------|----------|-----|
| 🥇 | Wire up LLM semantic cache | Token efficiency | ~40% API call savings, skill already exists |
| 🥇 | Adaptive rule loading | Token efficiency | ~30% instruction overhead reduction, low complexity |
| 🥇 | Skill dependency system | Interoperability | Enables composable workflows, unlocks complex orchestrations |
| 🥈 | Cache hit HUD visibility | Token efficiency | Builds trust, surfaces optimization opportunities |
| 🥈 | Smarter model failover (cross-tier) | Efficiency | More robust, better UX on errors |
| 🥈 | Hub-to-hub state bridge | Interoperability | Eliminates "forgot to harvest" friction |
| 🥉 | Context GC (harvest-context gc) | Feature | Prevents context bloat over months of use |
| 🥉 | Surgical cache invalidation | Token efficiency | Faster iteration in large projects |
| 🥉 | Agent capability registry | Interoperability | Enables dynamic routing, reduces hardcoded names |

---

## Cross-Cutting Observations

- **Biggest leverage point:** The `llm-cache` skill exists but isn't integrated into any runtime path. Hooking it into `tool.execute.before` would save ~30-40% of API calls during iterative modes (ralph, ultrawork, swarm).

- **Second biggest:** Rule loading optimization. Currently all 9 rules + AGENTS.md are loaded every session regardless of task (~8K-10K tokens overhead). Adaptive loading would cut this dramatically.

- **TUI plugin is underutilized:** Currently handles dialog selection only. With cache stats, execution dashboards, diff previews, and async task progress, it could become a genuine operations center without adding any API overhead.

- **Interoperability improvements cost no API calls:** The skill dependency system and agent capability registry are purely organizational but unlock significant workflow improvements.

---

## Key Decisions

- Brainstorming session saved to `.opencode/plans/` for future reference
- `/orchestrate` can execute individual items from this roadmap
- All items are independent — can be implemented in any order

## Assumptions

- LLM semantic cache integration is the highest-ROI single change
- TUI dashboard work is additive and doesn't break existing plugin behavior
- Rule tagging requires no changes to the OpenCode runtime, only to rule file metadata
