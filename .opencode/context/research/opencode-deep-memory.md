---
title: "opencode-deep-memory — Persistent Cross-Session Memory for OpenCode"
type: source-summary
tags: [opencode, plugin, memory, context, bm25, persistent-memory, compression]
created: 2026-07-04
updated: 2026-07-04
sources: [github-readme, npm-registry]
status: active
---

# opencode-deep-memory

Persistent cross-session memory for OpenCode — zero runtime dependencies. V5.1 architecture: three-layer optimization — deterministic noise reduction, intelligent context compression, and increment-based memory consolidation.

- **Package**: `@bd7pil/opencode-deep-memory` on npm
- **Repository**: [BD7PIL/opencode-deep-memory](https://github.com/BD7PIL/opencode-deep-memory)
- **License**: MIT
- **Latest Version**: 0.11.0

## Quick Start

Add to `opencode.json`:

```jsonc
{
  "plugin": [
    "oh-my-openagent",
    "@bd7pil/opencode-deep-memory"
  ]
}
```

Memory lives at `.deep-memory/` in your project root.

## Core Capabilities

| Capability | How |
|---|---|
| **Remember** decisions, constraints, gotchas, facts | `memory_store` → BM25-indexed `MEMORY.md` (200 line cap) |
| **Retrieve** across sessions | `memory_search` — BM25 + CJK bigram |
| **Forget** stale entries | `memory_forget` — by query + confirmation |
| **Recover** compressed content | `deep_expand` / `memory_expand` — SHA-256 CCR, 30min cache |
| **Compress** on demand (summary) | `context_compress(summary)` — main agent writes summary |
| **Compress** on demand (subagent) | `context_compress()` — main agent selects range, subagent generates summary |
| **Consolidate** memory quality | LLM subagent (increment-triggered on idle: +20 lines or +8 calls), mtime race-safe |
| **Notifications** | Subagent spawn/complete/discard via TUI Toast (zero LLM context pollution) |
| **Commands** | `/checkpoint` — manual memory capture + dedup |

## 6-Layer Architecture (V5.1)

All six layers backed by production evidence — not theory.

### Layer 1: Capture-time tool output limiting
Tool outputs capped once at capture time, not post-hoc:
- `bash`: 48K chars (head + error lines + tail 200)
- `read`: 50K chars (head + tail + key lines)
- `grep`/`search`: 20 files × 5 matches
- `task`/`background_output`: 30K chars
- `webfetch`: 20K chars (head + headings + tail)

### Layer 2: Stale-read rewriting
Identical repeated tool calls have older copies marked `[OUTDATED — superseded by newer identical call]`.

### Layer 3: Static memory file (byte-stable system prompt)
System prompt frozen across turns — TOOL_HINT + MEMORY.md injected once, only changes when `memory_store` writes to MEMORY.md. No volatile BM25 results, no per-turn search.

### Layer 4: Hybrid retrieval (one-time auto-search per session)
First turn only: quiet `memory_search(userQuery)` runs. If top-1 BM25 score ≥ 2.0, a ≤30-token whisper is appended. Turns 2+: byte-stable.

### Layer 5: Increment-based memory consolidation
When `memory_store` counter reaches 8 or MEMORY.md grows ≥20 lines, an LLM subagent processes it with Mem0-style ADD/UPDATE/DELETE. Triggered on `session.idle`.

### Layer 6: Agent-initiated compression with optional subagent summarization
`context_compress()` classifies tool outputs (transient/stale/summarize/preserve), truncates transient outputs, marks stale reads, injects summary as assistant message.

## Trigger Architecture (V5.1)

```
Layer 1 (every turn):   messages.transform → deterministic strip/throttle/compress
Layer 2 (main agent):   context_compress()  → optional subagent → summary injected via transform
Layer 3 (session.idle): check MEMORY.md growth → spawn consolidation subagent → apply on next idle
```

Three independent layers — Layer 1 runs every turn, Layer 2 fires when the main agent decides to compress, Layer 3 fires when enough memory changes accumulate.

## Tools

| Tool | Purpose |
|---|---|
| `memory_search` | BM25 + CJK bigram search across project and global memory |
| `memory_store` | Store one entry (decision/constraint/gotcha/fact/note) with 200-line cap |
| `memory_forget` | Find matching entries and remove them |
| `memory_expand` | Restore original content from compressed conversation messages |
| `deep_expand` | Restore original content from CCR-compressed tool output |
| `context_compress` | Content-aware compression with optional subagent summarization |

## Storage

```
<project>/.deep-memory/
├── MEMORY.md                  persistent memory (200 line cap, user curated)
├── MEMORY-archive.md          overflow when cap is reached
├── MEMORY.bak.md              backup before LLM consolidation overwrite
├── checkpoint.md              last compaction extraction
├── .compaction-log.jsonl      compaction audit trail
├── .index-state.json          BM25 index mtime tracker
└── .pending-consolidation.json   persistent LLM subagent state (survives restarts)
```

## Configuration

| Variable | Default | Purpose |
|---|---|---|
| `DEEP_MEMORY_DEBUG` | off | `1` = debug log, `trace` = +hook I/O |
| `DEEP_MEMORY_PROJECT_SUBDIR` | `.deep-memory` | Memory directory name |
| `DEEP_MEMORY_GLOBAL_ROOT` | `~/.local/share/opencode/deep-memory` | Cross-project memory |

## Evidence Base

Designed through 4 rounds of research against production systems and academic literature:

- **Production agents**: Claude Code, Cline, Aider, Cursor, Cody, Copilot, Continue
- **Memory systems**: Mem0, Letta, Magic Context, A-Mem, Cognee (30+ total)
- **Academic papers**: Lost in the Middle, Context Rot (Chroma), When2Tool, Self-RAG, Focus Agent, When Attention Closes
- **Compression projects**: DCP, Headroom, Focus Agent, Contextomizer, LLMLingua

## Key Design Principles

- No background/fire-and-forget patterns (V4 dream/distill failure post-mortem)
- Absolute token thresholds for nudges (not ratio-based) — Context Rot confirms degradation at ~200K
- Nudges injected into tool result (mid-conversation > system prompt persistence per When Attention Closes)
- Toast notifications only for subagent operations — zero LLM context pollution
- Consolidation trigger: increment-based not pressure-based (compaction is too late)
