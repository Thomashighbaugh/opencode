---
title: "Claude Code & AI Agents: Three Levels of Recursive Self-Improvement — The Auto MoC System"
type: source-summary
tags: [recursive-self-improvement, rsi, maps-of-content, moc, zettelkasten, taxonomy-learning, quality-scoring, rule-improvement, trust-scoring, autonomy, evidence-gating]
created: 2026-08-07
updated: 2026-08-07
sources: [medium, freedium]
status: active
---

# Three Levels of Recursive Self-Improvement — The Auto MoC System

**Author**: David R Oliver — March 31, 2026 (Part 2 of the Recursive Self-Improvement Series)
**Source**: [Medium](https://medium.com/@davidroliver/claude-code-ai-agents-three-levels-of-recursive-self-improvement-the-auto-moc-system-2eb7b8c3d305)
**Series**: Part 1 — [Building a Self-Improving Agent (link fixer)](https://medium.com/@davidroliver/recursive-self-improvement-building-a-self-improving-agent-with-claude-code-d2d2ae941282) · Part 3 — [The Prompt That Improves Itself](https://medium.com/@davidroliver/the-prompt-that-improves-itself-and-its-simple-855730351172)

## Core Thesis

Extends the trust-earning link fixer (Part 1) into **three deeper levels of self-improvement**, implemented in a tool called **auto-moc** that auto-generates Maps of Content (MOCs) for an Obsidian vault of ~11,700 notes. The key idea: earning trust varies across the stack — earning the right to *act* (L1) is different from earning the right to *modify what you know* (L2), which is different from earning the right to *propose how you reason* (L3).

## The Three Levels (the central framework)

| Level | What it learns | What it modifies | Mechanism | Safeguard |
|-------|---------------|------------------|-----------|-----------|
| **L1 — Autonomy learning** (link fixer) | *When* it's allowed to act | Its own permission boundary | Confidence scoring + graduation threshold | Scoring threshold |
| **L2 — Domain learning** (auto-moc Phase 5) | *What exists in its domain* | Its model of the world (config mapping types/tags → categories) | Detect taxonomy patterns in the unclassified bucket, auto-patch config | Evidence threshold (≥5 notes) |
| **L3 — Rule improvement** (auto-moc Phase 7) | *How it could work better* | Its own generation code | Analyze quality history trend → generate code-change proposal | Human-in-the-loop, always |

## Historical Lineage of Maps of Content

- **Vannevar Bush (1945)** — "As We May Think" memex: associative trails through information
- **Ted Nelson (1960s)** — hypertext theory: non-linear linked documents; the web is his idea scaled
- **Niklas Luhmann** — Zettelkasten: 90,000 index cards linked by connection, not topic; a "thinking partner" that surfaces unexpected relationships
- **Nick Milo (~2019–2020)** — coined "MOC" in the Linking Your Thinking (LYT) framework for Obsidian. A MOC is not a category page or TOC — it's a *thinking tool* gathering notes sharing a *relationship worth naming*, distinct from folder-based organization.

## auto-moc Architecture

7 phases; Phases 1–4 are standard generation (scan → taxonomy tree → write MOC files → patch dashboard). The self-improvement lives in Phases 5–7.

```
auto-moc/
├── auto-moc.js              # CLI entry point
├── auto-moc.config.js       # Per-repo config (typeHierarchy, tagHierarchy)
├── core/
│   ├── indexer.js           # Scan markdown, extract frontmatter + links
│   ├── taxonomy.js          # Walk config hierarchy → MOC tree
│   ├── writer.js            # Render MOC markdown (static + Dataview)
│   ├── watcher.js           # Incremental update on single file change
│   ├── taxonomy-learner.js  # Phase 5 — detect taxonomy changes
│   ├── config-patcher.js    # Phase 5 — patch config.js in place
│   ├── quality-scorer.js    # Phase 6 — 5-dimension quality rubric
│   ├── quality-history.js   # Phase 6 — persist run history, detect regressions
│   ├── rule-improver.js     # Phase 7 — generate code change proposals
│   └── proposal-writer.js   # Phase 7 — write proposal markdown
└── adapters/
    ├── markdown.js          # Pure filesystem adapter
    └── obsidian.js          # Obsidian adapter (graph index + Dataview)
```

## Phase 5 — Taxonomy Learning (Domain Learning / L2)

The `unclassifiedMoc` (`_MOC - Unclassified`) bucket is **Phase 5's sensor** — the holding pen for notes matching no configured type/tag.

- **Additions**: if ≥5 unclassified notes share a `type` value OR a tag prefix (tag must contain `/`), auto-moc patches `auto-moc.config.js` directly — no proposal, no approval gate — adds the missing entry, rebuilds, writes the new MOC.
- **Removals**: a configured entry with zero matching notes in the current tree = dead weight; auto-removed.
- **Config patcher** uses brace-counting string insertion (no eval, no re-import) + cache-busted re-import via `?t=` query.
- **The five-note threshold is the graduation mechanism in a different form**: one novel unclassified note could be a typo; five is evidence of a real pattern. *Require evidence before acting* (same principle as link fixer's graduation threshold).

This is qualitatively distinct from L1: it modifies **domain knowledge** (its own model of the categories), not just its permission level.

## Phase 6 — Quality Feedback

Scores its own output against a 5-dimension rubric, each 0–3 (max 15):

| Dimension | Scores 3 | Scores 0 |
|-----------|----------|----------|
| **Coverage** | <10% notes unclassified | >30% unclassified |
| **Balance** | 11–50 notes/MOC | 100+ notes |
| **Depth** | 3+ hierarchy levels | all flat |
| **Connectivity** | ≥6 backlinks/MOC | 0 backlinks |
| **Freshness** | <10% stale (>12mo untouched) | >50% stale |

- Result appended to `.auto-moc/state/quality-history.json` with per-dimension scores, total, weakest dimension, recommendations.
- **Regression detection**: any dimension dropping across two consecutive transitions (requires ≥3 runs) is flagged.
- **Distinction from error handling**: this measures "is the output any good?" not "did the write succeed?" — it has a model of *good* and applies it to its own work.

## Phase 7 — Generative Rule Improvement (Rule Improvement / L3)

The deepest layer. After **five full runs** of quality history, it finds the weakest-average dimension, selects the relevant module, and writes a proposal to `.auto-moc/proposals/rule-improvement-YYYY-MM-DD.md` (dimension, target file, expected impact, description, rationale, diff, apply command).

- Proposal templates are **conservative** and per-dimension: connectivity (add `_See also: [[parent]]`), freshness (add modified column to Dataview), balance (warn on 50+ notes no children), depth (add sub-hierarchy config), coverage (run auto-tag).

**Stricter safeguards than any other phase:**
1. **Never auto-applied** — proposals sit until a human runs `--apply-rule-improvement`
2. **Max one proposal per run** — prevents accumulation
3. **Min five runs of history** — one bad score isn't a trend; five is
4. **Full audit log** — `.auto-moc/state/applied-improvements.json` records original code snapshot for reversion
5. **Regression detection** — score drop after an applied change flags it as regression

**Why the human gate is by design, not a concession**: Phase 5 can validate immediately (patch → rebuild → does the new MOC have notes?). Phase 7 *cannot* — it proposes a diff it can't run against the corpus before applying. It *reasons* about what should help (a different kind of claim from "five notes share a tag prefix"). Code that rewrites generation logic is in a different category from code that fixes a broken link.

**The limit being watched**: next improvement would be a **test-before-apply** mechanism — run the proposed change in dry-run against the current corpus, score the output, include predicted score improvement in the proposal. Would make Phase 7 evidence-based rather than reasoned-only.

## Example Run Output

```
auto-moc full rebuild
  Indexed 1,697 notes
  Patched: _Dashboard.md
  Auto-added: _MOC - Tools, _MOC - Frameworks
  Created: 2 MOCs
  Updated: 23 MOCs
  Quality: 9/15 (weakest: connectivity)
    → _MOC - Concepts has 63 notes — consider sub-MOCs
    → _MOC - AXIA has no backlinks from other notes
  Removed: 1 stale MOC
```

## Generalizable Lessons / What to Try

1. **Find your `_MOC - Unclassified` equivalent** — every automation has an output bucket for unclassifiable things. That bucket is your *sensor*. Instrument it; when things pile up in the same corner, that's a signal worth acting on automatically.
2. **Phase 6 starts by deciding what good output looks like** — the 5 dimensions are domain-specific; the *mechanism* (score → record history → detect trends) is generic. The rubric is where domain knowledge lives.
3. **Phase 7 needs a stable rubric + enough history** — the minimum-history gate isn't arbitrary caution; it's the same evidence-before-act principle as the graduation threshold.
4. **Levels require escalating safeguards** — L1 automatable with a scoring threshold; L2 with an evidence threshold; L3 always human-in-the-loop. Labs automate what they can measure and verify; they keep humans in the loop on what they can't.

## Cross-References

- [[recursive-self-improvement]] — Part 1: the link fixer (Level 1 autonomy learning) and the same author's series
- [[agentic-self-improvement-2026]] — 2026 RSI landscape survey (MiniMax, Codex 5.3, AlphaEvolve, etc.)
- [[opencode-self-improvement-2026]] — OpenCode-specific self-improvement mechanisms
- [[observational-memory-mastra]] — agent feedback loops
- [[opencode-dispatcher]] — permission models for agent tools
- Related to evidence-gated promotion and manual-by-default autonomy-by-graduation patterns
