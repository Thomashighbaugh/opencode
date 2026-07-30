---
name: hub-skill-patterns
tags: [hubs, frontmatter, prompts, skills]
---

# Hub SKILL.md Patterns

## Frontmatter Triggers Skill Context Injection

**Pattern:** Files in `skills/` with YAML frontmatter (`---\nname: ...\n---`) get loaded as skill context by OpenCode, injecting the entire file content into the prompt. Files without frontmatter are not auto-loaded.

**Apply:** Any file in `skills/` that should NOT be injected as a skill prompt must not have YAML frontmatter. Hub SKILL.md files are routing manifests, not skill prompts — they should never have frontmatter.

**Anti-pattern:** Adding frontmatter to hub SKILL.md files thinking it makes them "proper skills" — it causes prompt bloat.

## Two-Tier Description System

Hub subcommand descriptions use two tiers:

| Field | Length | Purpose |
|-------|--------|---------|
| `description` | ≤80 chars, no tool names, self-contained | TUI menu display |
| `detailedDescription` | Unlimited, can include tools/methodology | Route payload (inlined when subcommand is selected) |

**Apply:** When creating or editing any `tools/hubs/<hub>/<subcommand>.ts` spec file.

**Anti-pattern:** Writing a single long description that serves both purposes — gets truncated in TUI and wastes tokens in routing.

## Compact Routing Tables

Replace verbose per-subcommand subsections (`### /hub X — Y` with narrative) with compact markdown tables:

```
| Subcommand | Skill/Delegate | What It Does |
|------------|----------------|--------------|
```

Observed line reductions:
- ideation: 476 → 236 lines
- orchestrate: 187 → 148 lines
- project: 387 → 117 lines (−70%)
- harvest-context: 698 → 207 lines (−70%)

**Apply:** When creating or updating any hub SKILL.md file.
