# Living Documentation — THEORY.MD

> Serialize to disk, not to context window. Context windows vanish — this file survives.

## Core Operating Theory

OpenCode Hubs is a multi-agent orchestration system. Agents are stateless workers. Hubs coordinate work. Skills encode repeatable workflows. State is ephemeral session data. Context is durable, compiled knowledge.

## Design Principles

### 1. Context is a Call Stack, Not a Log
Frames nest hierarchically. A "ralph bugfix" frame lives inside an "orchestrate" frame. Scoped retrieval — query "orchestrate" and get the relevant subtree.

### 2. State != Context
- **State** → `.opencode/state/` → gitignored → ephemeral session data
- **Context** → `.opencode/context/` → committed → durable knowledge compounds across sessions
- **Secrets** → session state only, never committed

### 3. Serialize to Disk
Every significant decision, pattern discovery, and architecture choice writes to context/ immediately. Fresh sessions load from disk, not from context window history.

### 4. Automate Capture
Hooks handle mechanical work: checkpointing at phase transitions, capturing ADRs on architectural decisions, syncing context on harvest. The agent decides what to work on; the system ensures nothing is lost.

### 5. Reject Complexity
- No databases — Markdown + JSON files
- No servers — local-first file I/O
- No multi-user — single developer
- No native bindings — pure Node.js fs operations

## Architecture Decisions

| Decision | Rationale | Date |
|----------|-----------|------|
| Six hub commands over monolithic system | Separation of concerns: init/ideate/orchestrate/harvest/operate/manage-skills | 2026-04-20 |
| Inline delegation for methodology patterns | Patterns are instructions, not separate tools — keeps hub menus flat | 2026-04-28 |
| TUI plugin for hub dialogs (server.config removed) | Triple registration caused crashes; single TUI registration via api.command.register only | 2026-04-28 |
| Context files committed, state files gitignored | Context = public design knowledge; state = ephemeral session data (may contain PII) | 2026-04-28 |

## Learned Patterns

- Don't register commands via both plugin server.config AND markdown invoke — collision causes dispatch errors
- Feature flags before feature removal — disable first, delete later
- Never compact durable context — only compact session state
- Context loading should be subtree-scoped, never load entire context/

## Current Direction

- Pattern catalog growing from babysitter methodologies (103 hub subcommands and counting)
- Durable context auto-capture: decisions.md on ADRs, patterns/ on discoveries, research/ on web extraction
- Progressive context loading: start with compact summary, expand on demand
- Living theory: this file updates when architectural decisions are made

## Emerging Ideas

### Craftsman Agent Pattern (Conscientious Internal Loop)

A proposed pattern where agents internalize quality standards rather than relying on external reviewers. Inspired by the biological distinction between ants (single-purpose, no self-preservation) and human craftsmen (self-critique before presenting work).

**Key principle:** "Never submit work you wouldn't approve yourself." — the agent runs an internal execute→critique→revise cycle before outputting results.

**Status:** Design analysis complete (2026-06-09). Not yet implemented. See `context/patterns/craftsman-agent.md` and `context/decisions.md` (ADR: Conscientious Craftsman Agent Pattern).
