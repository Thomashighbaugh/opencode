---
name: orchestrate-router
description: Natural language intent router — takes amorphous user requests and routes to the correct /orchestrate, /ideation, or /harvest-context subcommand
level: 3
---

# Orchestrate Router

Routes amorphous user requests to the correct hub subcommand. When a user enters something like `/orchestrate build me a login system` or `/ideation think about database tradeoffs`, this skill classifies their intent across multiple dimensions and recommends the best subcommand.

## When to Use

- User enters `/orchestrate [text about what to implement]` — route to the right execution pattern
- User enters `/ideation [text about what to think about]` — route to the right planning methodology
- User enters `/harvest-context [text about what to save/fetch]` — route to the right extraction method
- The `/cc10x` subcommand also acts as an intent-detecting router for BUILD/DEBUG/REVIEW/PLAN

## Scripts

| Script | Hub | Purpose |
|--------|-----|---------|
| `scripts/route-orchestrate.mjs` | `/orchestrate` | Routes to 27 execution patterns |
| `scripts/route-ideation.mjs` | `/ideation` | Routes to 21 planning/research methods |
| `scripts/route-harvest.mjs` | `/harvest-context` | Routes to 13 extraction/context methods + auto-vectorize |

## How Routing Works

Each subcommand has a **profile** scored across multiple dimensions:

| Dimension | What It Measures |
|-----------|-----------------|
| **Task type** | build, fix, refactor, analyze |
| **Autonomy** | guided, periodic, fire-and-forget |
| **Complexity** | simple, moderate, complex, multi |
| **Confidence** | clear, vague, bug report |
| **Scale** | solo, small team, swarm |
| **Quality** | draft, production, critical |
| **Time** | asap, balanced, thorough |
| **Keywords** | Strong signals (e.g., "fire and forget" → ralph) |
| **Anti-keywords** | Negative signals (e.g., "research" → not build patterns) |

The classifier extracts signals from the user's natural language and scores each subcommand. The highest-scoring match is recommended with a confidence percentage.

## Orchestrate Router Examples

| User says | Routes to | Why |
|-----------|-----------|-----|
| `build me a login system` | `autopilot` | Full autonomy from idea to code |
| `fix this TypeScript error` | `deep` | Root-cause trace + requirements |
| `research auth tradeoffs` | `ccg` | Multi-model synthesis |
| `CI build is broken` | `remediate` | Auto-fix CI failures |
| `prototype an app idea` | `vibe-code` | Conversational rapid prototyping |
| `ship the feature end to end` | `gsd` | Full pipeline to PR |
| `complex multi-file with quality` | `swarm` | Gated QA pipeline |
| `keep working on this until it passes` | `ralph` | Persistent loop |
| `refactor the utils module` | `evolutionary` | Incremental with fitness |
| `add a feature to existing codebase` | `brownfield` | Integration-aware |

## Ideation Router Examples

| User says | Routes to | Why |
|-----------|-----------|-----|
| `plan the auth system` | `plan` | Goals → ordered tasks |
| `brainstorm landing page ideas` | `brainstorm` | Free divergence |
| `vague idea about notifications` | `deep` | Socratic interview |
| `compare Postgres vs SQLite` | `research` | Multi-model synthesis |
| `model the payment domain` | `ddd` | Bounded contexts, aggregates |
| `map system dependencies` | `graph` | Visual relationship mapping |
| `stress-test this API design` | `adversarial-debate` | Oppositional critique |
| `set coding standards` | `constitution` | Governance principles |
| `break down into small tasks` | `plan` | Ordered with acceptance criteria |

## Harvest Context Router Examples

| User says | Routes to | Why |
|-----------|-----------|-----|
| `save what we learned` | `session` | Extract session knowledge |
| `document the codebase` | `codebase` | Hierarchical AGENTS.md |
| `create a reusable workflow` | `skill` | SKILL.md from pattern |
| `fetch React hooks docs` | `docs` | Context7 MCP lookup |
| `ingest this PDF` | `consume` | File/URL → context |
| `compress to save tokens` | `compress` | 4-layer compression |
| `set up a knowledge base` | `secondbrain` | Local markdown+Git |
| `save this as a convention` | `rule` | Project rule |

## Auto-Vectorization (Harvest Context Only)

The harvest router integrates with the `vectorize-context` skill. After routing to any subcommand with `writes: true` (session, codebase, memory, consume, secondbrain, journal), the router automatically calls `ensureIndexed()` from `veclib.mjs` to refresh the vector DB.

This means:
- A user harvests session knowledge → context files written → vector DB auto-updated → next semantic query sees new content
- No manual triggering needed
- If no files changed, `ensureIndexed()` returns instantly (no model load)
- If files changed, only stale files are re-indexed

## Usage

```bash
# Route an orchestration request
node {skill_dir}/scripts/route-orchestrate.mjs "build me a login system"

# Route an ideation request
node {skill_dir}/scripts/route-ideation.mjs "compare database options"

# Route a harvest request (auto-vectorizes on write subcommands)
node {skill_dir}/scripts/route-harvest.mjs "save what we learned"

# Environment variable for all three
REQUEST="fix the broken CI pipeline" node {skill_dir}/scripts/route-orchestrate.mjs
```

## Output Format

All routers output JSON on stdout with the same shape:

```json
{
  "request": "build me a login system",
  "recommended": "autopilot",
  "confidence": 26,
  "reason": "Full autonomy — idea to working code",
  "description": "Best for: building something from scratch...",
  "autoVectorize": false,
  "ranked": [
    { "subcommand": "autopilot", "score": 26 },
    { "subcommand": "vibe-code", "score": 21 },
    { "subcommand": "plan-execute", "score": 15 }
  ]
}
```

The `autoVectorize` field is only present in the harvest router output.

## Integration

To wire into a hub subcommand (`/orchestrate`, `/ideation`, `/harvest-context`):

1. When user enters `/orchestrate [text]` without a recognized subcommand name:
   - Run `route-orchestrate.mjs` with the text
   - Take `recommended` from output
   - Route to that subcommand via `hubMenu(action: "route", hub: "orchestrate", subcommand: recommended)`
2. Same pattern for `/ideation` and `/harvest-context`
3. For harvest with `autoVectorize: true`, call `ensureIndexed()` after the extraction/save completes

## Dependencies

- Node.js 18+
- `vectorize-context` skill (optional, for auto-vectorize in harvest router)
