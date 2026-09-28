---
name: effort-estimator
description: Quick, consistent development effort estimates from lines of code, complexity factors, and risk modifiers. Use when sizing a task before starting, planning capacity, deciding whether to split a large feature, or comparing two implementation approaches.
level: 1
license: MIT
---

# Effort Estimator

## Base sizes

| Size | LOC | Duration | Confidence |
|---|---|---|---|
| XS | <30 | 1 hour max | High |
| S | 30-100 | 0.5 day | High |
| M | 100-200 | max 1 day | Medium |
| L | 200-400 | 2-3 days | Low — consider splitting |
| XL | >400 | Must split | — |

## Modifiers (multiplicative)

| Modifier | Impact | When |
|---|---|---|
| New tech/pattern | +50% | Unfamiliar tech, real learning curve |
| External dependencies | +30% | Waiting on other teams/APIs/services |
| Unclear requirements | +50% | Ambiguous spec, missing acceptance criteria |
| Complex testing | +30% | Hard-to-test scenarios, integration tests needed |

`Base Duration × (1 + sum of applicable modifiers) = Final Estimate`. Example: M (1 day) + new tech (+50%) + unclear reqs (+50%) → 1 day × 2.0 = 2 days.

## Process

1. Scope: count/estimate LOC, files touched, existing patterns to reuse.
2. Ask: unfamiliar tech? external dependency? unclear requirements? complex testing?
3. Apply the formula.
4. If L or XL, recommend a split: foundation (types/utilities) → API layer → UI → integration.

## Quick reference for fast estimates

| Task | Typical size |
|---|---|
| Isolated bug fix | XS-S |
| Config change | XS |
| New utility function | S |
| New component (simple / complex) | S-M / M-L |
| New feature (full stack) | L-XL |
| Refactor (single file / cross-cutting) | S-M / L-XL |
| API integration | M-L |

## Output format

```
**Size**: [XS-XL]   **Base Duration**: [time]   **Confidence**: [High/Medium/Low]

Modifiers applied: [x] New tech (+50%)  [ ] External deps (+30%)  [x] Unclear reqs (+50%)  [ ] Complex testing (+30%)

**Final Estimate**: [adjusted time]

**Recommendation**: [split plan if L/XL, else "Proceed"]
```
