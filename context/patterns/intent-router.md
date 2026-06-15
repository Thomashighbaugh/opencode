# Intent Router Pattern

Multi-dimensional scoring classifiers that route natural language requests to the correct subcommand.

## Problem

Users express desires in natural language, not subcommand names. Without a router, ambiguous inputs like `/orchestrate fix this bug` or `/ideation compare databases` have no mechanism to find the right subcommand.

## Solution

Build classifiers that profile each subcommand across shared dimensions, extract signals from user text, and rank matches by total score.

**Subcommand profile structure:**
```javascript
{
  name: "deep",
  tagline: "2-stage: causal trace → deep interview → requirements",
  taskType:   { build: 0.1, fix: 0.9, refactor: 0.3, analyze: 0.8 },
  autonomy:   { guided: 0.8, periodic: 0.3, fireAndForget: 0.1 },
  complexity: { simple: 0.2, moderate: 0.5, complex: 0.8, multi: 0.7 },
  confidence: { clear: 0.3, vague: 0.5, bugReport: 0.9 },
  scale:      { solo: 0.8, smallTeam: 0.5, swarm: 0.2 },
  quality:    { draft: 0.2, production: 0.5, critical: 0.8 },
  time:       { asap: 0.1, balanced: 0.4, thorough: 0.9 },
  keywords: ["root cause", "trace", "debug", "investigate", "why"],
  antiKeywords: ["build", "create", "implement"],
  description: "Best for: debugging complex issues where root cause is unclear..."
}
```

**Classification logic:**
1. Extract signals from user text using regex patterns
2. Each signal multiplies the relevant profile dimension by a weight
3. Keywords add a flat boost, anti-keywords apply a penalty
4. Sort subcommands by total score, return top-K

## When to Use

- Any hub with multiple subcommands where users may type freeform intent
- Any system where the command/subcommand boundary should feel natural
- When adding new subcommands — just add a profile entry, no if/else chain

## Anti-Pattern

Don't use binary if/else chains for routing. The multi-dimensional scoring approach naturally handles ambiguous inputs and provides ranked alternatives.

## Implementations

- `skills/orchestrate-router/scripts/route-orchestrate.mjs` — 27 profiles, 8 dimensions
- `skills/orchestrate-router/scripts/route-ideation.mjs` — 21 profiles, 6 dimensions
- `skills/orchestrate-router/scripts/route-harvest.mjs` — 13 profiles, 5 dimensions + auto-vectorize
