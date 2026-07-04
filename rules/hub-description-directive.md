# Hub Subcommand Description Directive

## The Problem

When the TUI dialog lists hub subcommands, the hub name (`/orchestrate`, `/harvest-context`, etc.) is **not visually present** as context. The user sees a flat list of 20-30 subcommand names at once. A name like `docs`, `context`, `scan`, or `purge` might seem obvious within the hub's context, but that context is invisible to the user at the moment of selection.

The TUI dialog has limited horizontal space — descriptions beyond ~80 characters get truncated mid-sentence, becoming unintelligible.

## The Solution: Two-Tier Descriptions

There are **two** description fields, each with a different purpose:

### `description` — Menu display (MUST be short)

Shown in the TUI dialog next to the subcommand name. Space is limited.

- **Max 80 characters** (ideally 50-70).
- **No tool names.** The user doesn't need to know HOW it works to choose it.
- **No buzzwords.** Just say what it does in plain terms.
- **Self-contained.** Don't assume the hub name is visible.
- **Distinctive.** Must be obviously different from every other subcommand in the list.

Format: `{What it does} — {key differentiator}`

```
GOOD (short, self-contained, recognizable):
  "Architectural friction analysis — propose deep-module refactors"
  "Stress-test a plan with relentless one-at-a-time questioning"
  "Competitive landscape — feature comparison matrix"
  "Multi-source web research — parallel searches, synthesize findings"

BAD (too long, gets truncated):
  "Analyze codebase for architectural friction, propose module-deepening refactors via John Ousterhout's deep module principle — parallel sub-agents explore, generate candidate refactors, produce markdown tables for comparison, then grill through your pick"
  "Stress-test a plan or design via relentless one-at-a-time questioning — walk down each branch of the design tree, resolve dependencies between decisions, provide recommended answers. Use before building to surface hidden assumptions"
```

### `detailedDescription` — Route payload (can be detailed)

Inlined into the prompt ONLY when a specific subcommand is selected (via `route` action). This has plenty of room.

- **No length limit.** Explain the full process, when to use it, what it produces.
- **Can include tool names, buzzwords, methodology references.**
- **Can include step-by-step workflow, output format, state paths.**
- The user has already chosen the subcommand — now they need the details.

### `reminder` — Invocation hint (keep terse)

A 1-line reminder shown to the user when the subcommand is invoked. Already short — keep it that way.

## Enforcement

This is a **convention, not a hard rule**. The bar for `description` is: if a user sees it in a 30-item TUI list, they should immediately understand what it does — without the hub name, without scrolling, without truncation.

## Scope

Applies to:
- `tools/hubs/<hub>/<subcommand>.ts` `description` field (menu display — SHORT) and `detailedDescription` field (route payload — detailed)
- `tools/hub-<name>.ts` thin manifests (re-export the identity slice containing `description`)
- SKILL.md subcommand section headers and descriptions (same two-tier pattern)
- AGENTS.md hub command reference tables (summary only)
