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

### 4. Manual Context Operations
- Context harvesting, saving, and loading are MANUAL ONLY — triggered by explicit user hub commands
- No auto-checkpoints, no auto-loads, no auto-saves
- The user controls when context is created, loaded, or persisted

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

All context loading is MANUAL ONLY — triggered by explicit user hub commands (`/harvest-context`, `/ideation`, `/orchestrate resume`, `/project commit`). No automatic context loading on session start or hub invocation.

## When Context is Saved

All context saving is MANUAL ONLY — triggered by explicit user hub commands (`/harvest-context`, `/project commit`). No automatic saving on phase completion, gate pass, or error discovery.

## Security-Aware Storage Rules

| Content Type | Git Status | Rationale |
|-------------|------------|-----------|
| Session transcripts | Gitignored | May contain PII, secrets in context |
| Active mode state | Gitignored | Contains session IDs, timestamps |
| Checkpoint data | Gitignored | Contains full agent state |
| Chat history | Gitignored | Raw conversation data may contain secrets |
| Web-extracted docs | Committed | Public information |
| Architecture patterns | Committed | Design knowledge, no secrets |
| ADRs | Committed | Design decisions, no secrets |
| Pattern catalogs | Committed | Reusable knowledge |
| Project memory | Conditionally committed | Strip sensitive facts before commit |

## Privacy Scan Integration

Privacy scanning is MANUAL ONLY — run via `/harvest-context sweep` or explicitly when saving to committed context. No automatic routing or interactive review pauses.

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
