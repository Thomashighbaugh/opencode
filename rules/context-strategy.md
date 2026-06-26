# Context Strategy — Durable Project Memory & Hub State

**Inspired by StackMemory's operating theory**: context windows vanish, but disk doesn't. This system ensures knowledge compounds across sessions.

## State vs Context (The Separation)

| Type | Location | Git | Lifecycle |
|------|----------|-----|-----------|
| **State** (session data) | `.opencode/state/` | Gitignored | Ephemeral — deleted between sessions or compacted |
| **Context** (durable knowledge) | `.opencode/context/` | Committed | Accumulates — compounds across sessions |
| **Secrets/Sensitive** | `.opencode/state/sessions/` | Gitignored | Short-lived — session lifetime only |

## Hub State Paths

| Hub | In-Progress | Final Output | Checkpoints |
|-----|-------------|-------------|-------------|
| `/init-project` | — | `.opencode/state/init/` | `.opencode/state/init/init-checkpoint.json` |
| `/ideation` | `.opencode/state/ideation/work-products/` | `.opencode/state/ideation/` | — |
| `/orchestrate` | `.opencode/state/orchestration/progress/` | `.opencode/state/orchestration/` | `.opencode/state/orchestration/checkpoints/` |
| `/harvest-context` | — | `.opencode/state/harvest/` | — |
| `/project` | — (stateless) | — | — |

## Durable Context Paths

| Category | Location | What Goes There |
|----------|----------|----------------|
| Architecture | `.opencode/context/frameworks/` | Design patterns, conventions, system structure |
| Patterns | `.opencode/context/patterns/` | Discovered patterns, anti-patterns, solutions |
| Research | `.opencode/context/research/` | Web-extracted docs, papers, references, Context7 cache |
| Decisions | `.opencode/context/decisions.md` | Architecture Decision Records (ADRs) |
| Theory | `.opencode/context/theory.md` | Living documentation |
| Memory | `.opencode/state/project-memory.json` | Cross-session durable facts (conditionally committed) |

## Core Principles

### Manual Context Operations
- Context harvesting, saving, and loading are MANUAL ONLY — triggered by explicit user hub commands
- No auto-checkpoints, no auto-loads, no auto-saves
- The user controls when context is created, loaded, or persisted

### Serialize to Disk, Not to Context Window
Context windows compress and vanish. State serialized to Markdown/JSON on disk survives indefinitely. Any fresh session can resume from serialized state.

### Frame Retrieval Convention
When an agent needs context, it queries by scope:
```
"Load context about auth" → reads:
  .opencode/context/frameworks/auth*/
  .opencode/context/decisions.md (auth entries only)
  .opencode/context/patterns/auth*/
```
Never load everything. Always scope to the relevant subtree.

### File Naming Convention
All state files use ISO date prefixes: `YYYYMMDD_HHMMSS_{method}_{topic-slug}_{stage}.{md|json}`

### Cross-Hub Hand-Off
Hub hand-offs are MANUAL ONLY — the user invokes the next hub explicitly. No automatic offers or suggestions after completion.

### Resume Behavior
Each hub checks for existing state on `resume` and `status` subcommands. Resume loads latest checkpoint/work-product and continues immediately.

## Security-Aware Storage

| Content Type | Git Status | Rationale |
|-------------|------------|-----------|
| Session transcripts | Gitignored | May contain PII, secrets |
| Active mode state | Gitignored | Contains session IDs, timestamps |
| Checkpoint data | Gitignored | Contains full agent state |
| Web-extracted docs | Committed | Public information |
| Architecture patterns | Committed | Design knowledge, no secrets |
| ADRs | Committed | Design decisions, no secrets |
| Project memory | Conditionally committed | Strip sensitive facts before commit |

## Anti-Patterns to Avoid

- Don't serialize full chat history to disk — extract decisions and patterns instead
- Don't store secrets in committed context files — they go in session state
- Don't build multi-user features — we're single-user, local-first
- Don't add databases or servers — files are sufficient
- Don't compact durable context — it's already curated; state is what gets compacted
