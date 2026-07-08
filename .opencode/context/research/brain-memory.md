---
title: "Brain Memory — Hierarchical File-System Memory Plugin for AI Coding Agents"
type: source-summary
tags: [opencode, plugin, memory, mcp, brain, neuroscience, spaced-repetition, file-system, agent-memory]
created: 2026-07-07
updated: 2026-07-07
sources: [github-readme]
status: active
---

# Brain Memory (omelas-tech/brain)

Hierarchical, file-system-based memory plugin for AI coding agents. Inspired by human neuroscience — memories organized into deep nested life-domain categories, connected via associative networks, strengthened through spaced recall, naturally decay over time.

## Two Install Paths

| Path | Reaches | Storage | Cost |
|------|---------|---------|------|
| **Hosted MCP connector** | Every MCP-capable host (Claude Code, Codex CLI, OpenCode, Copilot CLI, Kilo, Claude.ai apps, ChatGPT, Antigravity, OpenClaw, Hermes, Goose) | Brain Cloud (hosted) | account |
| **Local-first native plugin** | Current CLIs (Claude Code, Codex CLI, OpenCode, Copilot CLI, Kilo, Antigravity) | `~/.brain/` on machine | free |

## Core Architecture

```
~/.brain/
├── index.json              # Memory inventory — fast lookup
├── config.json             # Working-memory token budgets (session-start injection)
├── associations.json       # Weighted associative network between memories
├── contexts.json           # Session context snapshots for context-dependent recall
├── review-queue.json       # Spaced repetition scheduling (SM-2)
├── pinned.json             # Always-present tier manifest
├── skills-index.json       # Advertised procedural skills (L0)
├── _skills/                # Procedural skills (SKILL.md + resources/)
├── professional/           # Work, career, technical skills
├── personal/               # Education, health, hobbies, goals
├── social/                 # Communities, networks, collaborations
├── family/                 # Family relationships and events
├── _consolidated/          # Merged memories from consolidation
├── _archived/              # Decayed memories (recoverable + searchable)
└── .sync/                  # Sync state (local only, never pushed)
```

## Key Design Principles

- **Directory tree IS semantic structure** — `professional/companies/acme/projects/` tells agent context without vector search
- **Human-inspectable** — browse brain in any file explorer
- **Git-friendly** — full version history of memory evolution
- **Strength + decay** — recalled memories strengthen, forgotten ones fade
- **Recall receipts** — every answer shaped by memory ends with attributable receipt (`◉ memory: "<title>" (<type>, <age>)`)
- **Associative network** — weighted edges between memories, spreading activation
- **Context-dependent recall** — memories encoded in similar context score higher
- **Spaced reinforcement** — longer gaps = bigger boosts, cramming = diminishing returns
- **Cognitive types** — episodic, semantic, procedural each decay differently
- **Always-present knowledge (pinning)** — critical conventions load every session, never decay
- **Procedural skills** — reusable how-to workflows with 3-level progressive disclosure
- **Consolidation** — weak related memories merge into stronger combined knowledge
- **Zero dependencies** — pure file I/O, no databases, no servers, no embeddings

## Commands

| Command | Description |
|---------|-------------|
| `/brain:remember [query]` | Recall with spreading activation + context matching |
| `/brain:memorize [topic] [--sync]` | Store memories from session context |
| `/brain:status` | Dashboard with brain health metrics |
| `/brain:pin [id\|query]` | Pin to always-present tier (never decays, toggles) |
| `/brain:forget [target]` | Decay, archive, or remove. `--deep` forensic erasure |
| `/brain:sync [subcommand]` | Sync via Brain Cloud, Git remote, or export/import |
| `/brain:skills [list\|show\|add\|use\|remove\|export]` | Manage procedural skills |
| `/brain:sleep [scope]` | 9-phase maintenance cycle (replay, consolidation, review, pruning, dreaming, ...) |

## Session Lifecycle

**Session start**: single `brain session-start` call returns token-budget-bounded payload:
1. Pinned memories (always-present)
2. Skills index (L0 — name + description, ~100 tokens each)
3. Context recall (top memories relevant to current project)
4. Review queue + low-confidence alerts

**Ambient tracking**: agent maintains mental log of notable events (no file writes). Every ~10 substantive interactions, appends reminder: `◉ Notable decisions and learnings this session — /brain:memorize when ready`

**Session end**: saves context to `~/.brain/contexts.json` (always). Suggests memorization if meaningful content exists. Never auto-memorizes without consent.

## Memory Lifecycle

```
Create → Store → Decay → Recall → Reinforce → Review → Sleep → Archive
                                      ↑                   │
                                      └── Associations ────┘
```

## Scoring Formula

```
score = 0.38 * relevance + 0.18 * decayed_strength + 0.08 * recency_bonus
      + 0.14 * spreading_bonus + 0.14 * context_match + 0.08 * salience
```

Relevance calibrated in absolute terms (BM25 × IDF-weighted query coverage). Relevance floor prevents confident-looking noise. Context-mode recall (session start) exempt — strength-ranked topical padding is intended.

## Memory Types

| Type | Base Strength | Daily Decay | Use Case |
|------|:---:|:---:|---|
| insight | 0.90 | 0.997 | Deep realizations, patterns |
| decision | 0.85 | 0.995 | Choices made + rationale |
| goal | 0.80 | 0.993 | Objectives |
| experience | 0.75 | 0.985 | Notable events |
| learning | 0.70 | 0.990 | New knowledge |
| relationship | 0.70 | 0.997 | Connections |
| preference | 0.60 | 0.998 | Style/preferences |
| observation | 0.40 | 0.950 | Casual facts |

## Cognitive Types

| Type | Strength Modifier | Decay | Example |
|------|:-:|---|---|
| Episodic | +0.10 | Faster | "Deploy failed Tuesday because of X" |
| Semantic | default | Standard | "React hooks must follow rules of hooks" |
| Procedural | -0.10 | Very slow | "Steps to debug memory leaks" |

During sleep, frequently-recalled episodic memories crystallize into semantic memories.

## Spaced Reinforcement

```
spacingMultiplier = min(3.0, 1.0 + log2(1 + daysSinceLastAccess))
diminishingFactor = 1.0 / (1.0 + 0.1 * recallCount)
boost = 0.05 * spacingMultiplier * diminishingFactor
```

| Gap | Boost |
|-----|:---:|
| 1 day, first recall | +0.05 |
| 7 day gap | +0.08 |
| 30 day gap | +0.10 |
| Same day, 20th recall (cramming) | +0.02 |

## Sleep Cycle (9 Phases)

1. **Replay** — compute decayed strengths, categorize tiers
2. **Synaptic Homeostasis** — scale down ALL strengths if mean > 0.5, re-boost high-salience/recent/frequent
3. **Knowledge Propagation** — evaluate recent memories against hierarchy, update existing (enrichment, contradiction, validation, obsolescence)
4. **Semantic Crystallization** — frequent episodic → new semantic memories
5. **Reorganize** — detect flat clusters, restructure into deeper sub-categories
6. **Consolidate** — merge weak related memories with salience anchoring
7. **Prune** — archive memories below 0.1 strength (salience-protected exempt)
8. **REM Dreaming** — random cross-domain connections via analogical reasoning
9. **Expertise Detection** — identify dense knowledge areas, generate profiles, populate review queue

## Working-Memory Budget

```json
{
  "working_memory_budget_tokens": 3000,
  "pin_budget_tokens": 1500,
  "skills_index_budget_tokens": 800,
  "recall_budget_tokens": 700
}
```

Token counts use dependency-free heuristic stored on each memory at write time.

## Cross-Agent Memory Sharing

Single `~/.brain/` directory shared across all projects and agents. Plain Markdown files with YAML frontmatter — model-agnostic. Switch agent or model, memory unaffected.

## Portable Sync

- Any synced folder via `BRAIN_DIR` env var
- Git remote via `/brain:sync push/pull`
- Export/import single encrypted file
- Brain Cloud (optional hosted hub)
- AES-256-GCM encryption, manual push/pull, merge mode

## Benchmark

6 scenarios grounded in CoALA agent-memory model. Agent under test: DeepSeek V4 Pro. Cross-family judge panel (Gemini + Gemma-4 + Qwen-3.5, majority vote). Results: brain-full passes Scenario A (1000 distractors) at 100% with leanest tokens-per-success (3,199). BM25 and vector store both 0%.

## References

- CoALA (arxiv 2309.02427) — agent-memory taxonomy Brain implements
- MemGPT (arxiv 2310.08560) — paging-style memory management
- Generative Agents (arxiv 2304.03442) — recency/importance/relevance blend
- Ebbinghaus forgetting curve, Spreading activation, Hebbian theory, SHY hypothesis, SM-2 algorithm
- LongMemEval, MemoryAgentBench, SWE-Bench-CL benchmarks
- Cross-family judging methodology (Preference Leakage 2502.01534, PoLL 2404.18796)
