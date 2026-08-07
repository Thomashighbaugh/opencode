---
title: "Recursive Self-Improvement: Building a Self-Improving Agent with Claude Code"
type: source-summary
tags: [recursive-self-improvement, rsi, agent, claude-code, trust, autonomy, feedback-loop, graduation, confidence-scoring]
created: 2026-08-07
updated: 2026-08-07
sources: [medium, freedium]
status: active
---

# Recursive Self-Improvement: Building a Self-Improving Agent with Claude Code

**Author**: David R Oliver — March 26, 2026 (Part 1 of the Recursive Self-Improvement Series)
**Source**: [Medium](https://medium.com/@davidroliver/recursive-self-improvement-building-a-self-improving-agent-with-claude-code-d2d2ae941282)
**Series**: Part 2 — [Three Levels of RSI: The Auto MoC system](https://medium.com/@davidroliver/claude-code-ai-agents-three-levels-of-recursive-self-improvement-the-auto-moc-system-2eb7b8c3d305) · Part 3 — [The Prompt That Improves Itself](https://medium.com/@davidroliver/the-prompt-that-improves-itself-and-its-simple-855730351172)

## Core Thesis

A small, practical feedback loop — fix, measure, earn trust, fix faster — is the same architecture frontier labs use for RSI, scaled down to a JSON file and a wiki-link fixer. **The system didn't modify its own code; it modified its own autonomy boundary based on demonstrated accuracy within a human-supervised harness.**

By batch 4, a broken-link repair tool handled 95% of fixes autonomously without authored logic — it *earned* that authority through a confidence-scoring system.

## Key Distinction: All Current RSI Is Supervised

- Humans direct goals, review results, maintain the kill switch
- Models improve *within* a harness, not *outside* it
- OpenAI clarified Codex 5.3's self-creation was "far removed from AI models building new models completely autonomously"

## 2026 RSI Landscape (as reported)

| System | Claim |
|--------|-------|
| MiniMax M2.7 | Autonomously updated its own RL harness over 100+ iterations, +30% performance — modified the loop, not just ran it |
| OpenAI Codex 5.3 | "First model instrumental in creating itself" — early checkpoints debugged later checkpoints |
| Google AlphaEvolve | Discovered 48 vs 49 scalar multiplications for 4×4 complex matrices — first improvement on Strassen (1969), found by AI |
| Anthropic Claude Code | Reportedly writes 70–90% of code used to train new Claude models |
| Karpathy autoresearch | 630-line Python script, single GPU, autonomously designs/executes/evaluates ML experiments, retains improvements (open-sourced March 2026) |

## The Mechanism: Confidence-Scored Graduation

**7 fix strategies (priority order)**: case mismatch → alias redirect → archived redirect → git restore → MOC cleanup → stub creation → link removal.

**Pattern keys**: `{strategy}:{context}` — e.g. `case-mismatch:moc`, `git-restore:meeting`. Same strategy in different contexts = different trust profiles, because risk profiles differ.

**Scoring rules**:
- Every pattern starts at score 0, every fix starts as PROMPTED
- Approval: `score += 1`
- Rejection: `score -= 2` (asymmetric — conservative by design)
- Score ≥ 5 (threshold): pattern graduates to AUTONOMOUS
- One rejection after graduation → immediate demotion back to prompted
- Trust is per-pattern, not global
- Learnings persist in a JSON file between batches (`learnings.json` with `graduationThreshold`, `patterns`, `stats`)

**Prevention layer**: pre-commit hook blocking deletion of any file with ≥2 inbound references — "the best fix is the one you never need."

## Results (4 batches, 1,308 broken links)

- Batch 1: 20 fixes, all prompted, 19 approved, 0 rejections, 9 patterns at score 1 (one approval fixed 107 `chi`/`Ch` case-mismatch files ≈ 300 links)
- Batch 2: 94 more files fixed, scores 1→2, still all prompted
- Batch 3: deliberate manual graduation — 16/17 patterns promoted based on 59 fixes / 0 rejections evidence (only `stub-creation:incubator` stayed prompted — creating content deserves more caution than correcting references)
- Batch 4: 19/20 fixes autonomous (95%); 1 novel alias redirect still prompted and approved
- Net: 1,308 → ~850 broken links; autonomous-to-prompted ratio 0% → 95%

## Four Lessons

1. **Trust should be earned, not configured** — start with zero trust; the graduation threshold forces evidence-gathering
2. **Rejections should cost more than approvals reward** (-2 vs +1) — trust builds slowly, breaks fast; models how people trust
3. **Prevention beats repair** — the 10-minute pre-commit hook outvalues the hours-long repair system; build the guardrail before the recovery mechanism
4. **The loop is the product** — 16 graduated patterns are compressed judgment, reusable across runs; each cycle starts further along than the last

## Future Directions (Part 1)

1. **Trust decay** — `lastSeen` timestamps; unexercised patterns decay 1 point per period until demoted (like pilot licences)
2. **Hierarchical trust transfer** — graduating `case-mismatch:*` variants should warm-start new contexts (score 3, not 0) when 80% of a strategy's variants are graduated
3. **Rollback chains** — tag every autonomous fix with its git commit SHA; on demotion, surface the full action list for review
4. **Cross-domain application** — auto-tagging, database enrichment, skill optimisation (rubric-scored prompt tweaks); each domain gets its own learnings file; the mechanism is identical

## Starter Prompt (reusable bootstrap)

The article includes a full Claude Code prompt to bootstrap the system for any domain: learnings file structure (version, graduationThreshold, stats, patterns), pattern keys `{strategy}:{context}`, scoring rules, batch processing (batches of 20, graduated → autonomous + log, else prompt), optional prevention hook, requirements (zero trust, asymmetric rejection, per-pattern trust, audit logging, per-batch summary), and explicit "what NOT to do" (no default autonomy, no skipped approvals, threshold ≥5, asymmetric rejection).

## Cross-References

- [[short-leash-ai-method-okturtles]] — constrained AI execution
- [[opencode-dispatcher]] — permission models for agent tools
- [[observational-memory-mastra]] — agent feedback loops
- Related to trust-earning permission models in `/orchestrate` hub subcommands
