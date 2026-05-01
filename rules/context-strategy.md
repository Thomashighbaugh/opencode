# Context Strategy — Durable Project Memory

**Inspired by StackMemory's operating theory**: context windows vanish, but disk doesn't. This system ensures knowledge compounds across sessions.

## Core Principles

### 1. Context is a Call Stack, Not a Log
Frames nest hierarchically by domain. A "security fix" frame lives inside an "auth system" frame. Retrieval is scoped — ask about "auth" and get the relevant subtree, not a flat dump of everything.

### 2. State != Context (The Separation)
| Type | Location | Git | Lifecycle |
|------|----------|-----|-----------|
| **State** (session data) | `.opencode/state/` | Gitignored | Ephemeral — deleted between sessions or compacted |
| **Context** (durable knowledge) | `.opencode/context/` | Committed | Accumulates — compounds across sessions |
| **Secrets/Sensitive** | `.opencode/state/sessions/` | Gitignored | Short-lived — session lifetime only |

### 3. Serialize to Disk, Not to Context Window
Context windows compress and vanish. State serialized to Markdown/JSON on disk survives indefinitely. Any fresh session can resume from serialized state — compaction-proof by design.

### 4. Automate the Tedious
- Auto-checkpoint after significant milestones (phase completions, gate passes)
- Auto-load relevant context on process start (based on process type/domain)
- Never require manual "save" commands — everything worth keeping is kept

### 5. Reject Complexity
- Markdown + JSON files. No databases. No servers. No native bindings.
- Single-user, local-first. No multi-user scenarios.
- Feature flags > feature removal. Disable before deleting.

## Directory Structure

```
.opencode/
├── state/                    # SESSION DATA — gitignored
│   ├── init/                 # /init-project state
│   ├── ideation/             # /ideation work products
│   ├── orchestration/       # /orchestrate progress + checkpoints
│   ├── harvest/              # /harvest-context output
│   ├── sessions/             # Per-session state (secrets, active modes)
│   ├── project-memory.json   # Cross-session durable facts
│   └── notepad.md            # High-signal session notes
│
├── context/                  # DURABLE KNOWLEDGE — committed
│   ├── frameworks/           # Architecture patterns, design systems, conventions
│   ├── patterns/             # Discovered patterns, anti-patterns, solutions
│   ├── research/             # Web-extracted docs, papers, references
│   ├── decisions.md          # Architecture Decision Records (ADRs)
│   └── theory.md             # Living documentation — THEORY.MD equivalent
│
└── rules/                    # AGENT INSTRUCTIONS — committed
    └── context-strategy.md   # This file
```

## When Context is Loaded

| Trigger | What's Loaded | Scope |
|---------|---------------|-------|
| Session start | `project-memory.json`, `notepad.md`, `decisions.md` | Full, compacted |
| `/init-project setup` | `frameworks/`, `patterns/` | Relevant subtree |
| `/ideation plan` | `research/`, `decisions.md` | Domain-filtered |
| `/orchestrate execute` | Previous phase checkpoints, `patterns/` | Phase-scoped |
| `/orchestrate resume` | Latest checkpoint from state dir | Full checkpoint |
| `/harvest-context session` | Full session to extract into context dirs | New frame creation |
| `/project commit` | `decisions.md` for recent ADRs | Decisions only |

## When Context is Saved

| Trigger | What's Saved | Where |
|---------|-------------|-------|
| Phase completion | Phase summary + patterns discovered | `state/orchestration/`, `context/patterns/` |
| Gate passed | Evidence + quality report | `state/orchestration/progress/` |
| `harvest context session` | Session decisions, patterns, lessons | `context/frameworks/`, `context/patterns/`, `context/decisions.md` |
| Web doc extraction | Fetched documentation | `context/research/` |
| Error pattern discovered | Root cause + fix | `context/patterns/` |
| Architectural decision | ADR entry | `context/decisions.md` |

## Security-Aware Storage Rules

| Content Type | Git Status | Rationale |
|-------------|------------|-----------|
| Session transcripts | Gitignored | May contain PII, secrets in context |
| Active mode state | Gitignored | Contains session IDs, timestamps |
| Checkpoint data | Gitignored | Contains full agent state |
| Web-extracted docs | Committed | Public information |
| Architecture patterns | Committed | Design knowledge, no secrets |
| ADRs | Committed | Design decisions, no secrets |
| Pattern catalogs | Committed | Reusable knowledge |
| Project memory | Conditionally committed | Strip sensitive facts before commit |

## Frame Retrieval Convention

When an agent needs context, it queries by scope:

```
"Load context about auth" → reads:
  .opencode/context/frameworks/auth*/
  .opencode/context/decisions.md (auth entries only)
  .opencode/context/patterns/auth*/

"Load context for this phase" → reads:
  .opencode/state/orchestration/checkpoints/{phase}*/
  .opencode/context/frameworks/* (related subsystems)
```

Never load everything. Always scope to the relevant subtree.

## Anti-Patterns to Avoid

- Don't serialize full chat history to disk — extract decisions and patterns instead
- Don't store secrets in committed context files — they go in session state
- Don't build multi-user features — we're single-user, local-first
- Don't add databases or servers — files are sufficient
- Don't compact durable context — it's already curated; state is what gets compacted
