---
name: self-improvement
description: Per-project self-optimization loop — capture learnings, triage failures, promote recurring fixes into the project's own .opencode/ config (rules, skills, AGENTS.md). Use when a tool failed, the user corrected an agent, a capability was missing, knowledge went stale, or a better approach emerged for a recurring task.
relatedSkills: remember, learner, self-improve, graph-context
level: 3
license: MIT
---

# Self-Improvement

The capture + triage + promotion layer for per-project self-optimization. Every project's `.opencode/` config should self-optimize as it is utilized: failures and corrections are **captured**, recurring patterns are **triaged** to a root cause, and stable fixes are **promoted** into the project's own rules, skills, or AGENTS.md — bounded, evidence-gated, and human-approved.

This skill is the capture layer of a loop whose other stages live in:

| Stage | Mechanism |
|-------|-----------|
| Capture (this skill) | `.opencode/context/learnings/` — typed entries with Pattern-Key dedup |
| Measure | `.opencode/state/telemetry.ndjson` (SRCL hook, deterministic) → `/project consolidate-telemetry` |
| Retro | `/project retrospect` — post-run lessons + workflow-asset improvements |
| Triage | This skill §Triage — config-vs-agent root buckets before proposing fixes |
| Promote | This skill §Promotion — Recurrence-Count >= 3 → project rules/AGENTS.md |
| Evolve code | `self-improve` skill — evolutionary engine with tournament selection |

## When to Capture

Trigger immediately when **any** of these happens during a session:

- A tool, skill, rule, agent, or hub subcommand **failed** or produced wrong output
- The **user corrected** an agent (rejected output, edited a file, redirected an approach)
- A **capability did not exist** (had to work around a missing skill/tool/command)
- **Knowledge went stale** (a rule, skill, or doc contradicts observed behavior)
- A **better approach** emerged for a recurring task (faster, fewer steps, more robust)

## Capture Structure

Project-scoped, committed to git alongside the project config (durable knowledge — lives in the wiki tree, indexed via `wiki` skill):

```
.opencode/context/learnings/
├── LEARNINGS.md          # corrections, knowledge gaps, best practices
├── ERRORS.md             # failures — tool, skill, config, environment
└── FEATURE_REQUESTS.md   # missing capabilities the project config should provide
```

### Entry Format

Every entry gets a stable ID and a **Pattern-Key** (the dedupe key — a short lowercase
slug of the underlying pattern, NOT the symptom). Use the same Pattern-Key when the
same pattern recurs, and increment its `Recurrence-Count` instead of adding a new entry.

```markdown
## LRN-20260808-000001 — <short title>          (ERR-/FEAT- for the other files)
- **Type**: correction | knowledge_gap | best_practice | integration | config | flaky | environmental
- **Pattern-Key**: <slug, e.g. `spec-registry-rebuild-missing`>
- **Recurrence-Count**: 1
- **Status**: open | in_review | promoted | wont_fix
- **Priority**: low | medium | high | critical
- **Source**: user_feedback | error | conversation
- **Area**: <skill/tool/rule/hub subcommand/agent it touches>
- **Logged**: 2026-08-08
- **Why it will matter later**: <write this FIRST — the future value, not the past event>
- **Summary**: <what happened, one paragraph>
- **Reproduce clues**: <error message fragments, file paths, trigger conditions>
- **Fix direction**: <what a fix looks like — do NOT apply yet>
- **See Also**: <other entry IDs or files with the same Pattern-Key>
```

### Do NOT Log

- Obvious one-off errors (transient, unrepeatable, no pattern value)
- Tiny cosmetic issues
- Generic knowledge that belongs in documentation, not project learnings

**Anti-rationalization guard:** "It's a one-off" is NOT a reason to skip logging — log
it anyway; the pattern shows after recurrence, not before. "I'll remember" is NOT a
reason to skip — you won't; the next session has no memory of this one.

## Triage

Before proposing ANY change, classify the failure into one of two root buckets
(eval-setup vs agent-quality — the config analog):

| Bucket | Meaning | Example | Fix location |
|--------|---------|---------|--------------|
| **Config problem** | The project `.opencode/` asset (skill/rule/command/spec) is wrong, stale, or missing | A hub subcommand spec routes to a skill that doesn't exist; a rule contradicts current behavior | The asset itself — fix the spec/skill/rule |
| **Agent problem** | The asset is fine; the agent misused it | Agent ignored a rule; agent hallucinated a tool | The agent's behavior — no config change |

**Pre-triage infrastructure check:** verify the asset exists, is registered, and loads
before diagnosing the agent. A spec-registry rebuild, missing skill dir, or stale rule
is a config problem 90% of the time.

**Post-fix verification heuristics (si5):**
- Fix applied, same failure persists → wrong bucket, re-triage
- One symptom fixed, another appeared → instruction conflict between assets
- 80%+ of recent failures share a bucket → systemic, fix the bucket not the symptom

## Promotion

A learning gets promoted into the project's own config when **all** hold:

1. `Recurrence-Count >= 3` (same Pattern-Key, 2+ distinct tasks)
2. Within a 30-day window
3. The fix is verified (before/after evidence, not rationale)
4. It is non-obvious and project-specific (not generic knowledge)

**Promotion targets, in order of permanence:**

| Target | When |
|--------|------|
| Project `AGENTS.md` / `rules/*.md` | Prevention rule — short, one-paragraph "if X then Y" |
| Project `skills/` | Reusable workflow — 2+ steps, extracted as a skill |
| `FEATURE_REQUESTS.md` → provision | Missing capability the project should have |

**Promotion format (guardrail style, si7):**

```markdown
### Guardrail: <name>
BEFORE <operation>: <checks>
TRIGGERED BY: <error ID / pattern-key>
ADDED BECAUSE: <LRN-YYYYMMDD-XXXXXX>
EFFECTIVENESS: <tracked — revisit after N recurrences>
```

**Constraint (si6):** promotions are **bounded edits** — one surface at a time, minimal
delta, recorded with the evidence that motivated them. Never do a monolithic rewrite of
a rule or skill during promotion. The optimizer will find every gap between the metric
and the intent — so the metric is "recurrence stops", and promotion is only ever
proposed, never auto-applied: the user approves each promoted rule/skill.

## Metrics (ALWAYS-ON, si7)

Track per-project rolling signals (last 10 sessions) and act on thresholds:

| Metric | Threshold | Action if exceeded |
|--------|-----------|--------------------|
| First-attempt success | > 80% | Below → pre-flight checklist for the failing task |
| Avg revision count | < 1.5 | Above → check for missing knowledge in project rules |
| Error recurrence | < 10% | Above → triage + promote the recurring pattern |
| User correction rate | < 5% | Above → knowledge gap; capture the correction |
| Time-to-completion accuracy | 0.8–1.2 | Off → adjust estimation heuristics |

Same error > 2 times → guardrail. Same category > 3 times → pre-flight checklist
(max 5 items, retire unused ones). Success > 90% → strengthen, don't touch.

## Workflow (capture → triage → promote)

1. **Capture**: append the entry to the right `.opencode/context/learnings/` file (create dirs if missing). Dedupe by Pattern-Key; increment Recurrence-Count on repeat.
2. **Graph it**: run `node skills/graph-context/scripts/graph.mjs build` to fold the new learning into the knowledge graph as a `learning` node with `touches` edges to its Area/Pattern-Key matches (weight = Recurrence-Count). Keeps `/project graph` retrieval current.
3. **Triage**: classify into Config vs Agent bucket. If config, locate the exact asset.
4. **Fix (bounded)**: if Recurrence-Count >= 3 → draft the promotion (guardrail format) and present to the user for approval. If < 3 → leave as logged learning; suggest `/project retrospect` at session end.
5. **Validate**: after promotion, note the before/after in the entry (Status: promoted, EFFECTIVENESS tracker).
6. **Close**: every 10 sessions, run `/project retrospect` and `/project consolidate-telemetry` to fold the session log into the loop.

## Anti-Patterns (si6/si7)

- **Measurement theater**: metrics without action thresholds
- **Over-correction**: changing config on a single error (2+ occurrences required)
- **Checklist fatigue**: more than 5 pre-flight items; retire unused
- **Persisting without evidence**: no 2+ examples, no before/after
- **Blaming externals**: "the model was wrong" without checking the config bucket first
- **Stagnation disguised as stability**: plateau for 5+ sessions → the loop itself needs improvement (workflow-asset fix, si3)
- **Monolithic rewrite collapse**: promoting a full rewrite instead of a bounded edit
- **Same-model generator + evaluator**: don't let the agent that failed also judge its own fix

## Related

- `remember` skill — durable knowledge → memory surfaces
- `learner` skill — extract a reusable skill from a conversation
- `self-improve` skill — autonomous evolutionary code improvement engine
- `/project retrospect` — post-run retrospective analysis
- `/project consolidate-telemetry` — SRCL telemetry → ADR proposals
- `/project graph` (`graph-context` skill) — knowledge graph store; learnings feed `learning` nodes + `touches` edges
