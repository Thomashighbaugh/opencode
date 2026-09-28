---
name: requirements-analysis
description: Catch requirement gaps, undefined guardrails, and untestable acceptance criteria before planning or implementation begins. Use when starting a new feature, reviewing a spec, or when a request is vague enough that "but I thought you meant..." is a real risk.
level: 2
license: MIT
---

# Requirements Analysis

Converts a request into implementable, testable acceptance criteria and surfaces the gaps before they become production surprises. Merges the OpenCode "analyst" and "requirements-analyzer" agents — both did the same job at different ceremony levels; this skill scales the depth to the change.

Catching a requirement gap here is roughly 100x cheaper than discovering it after implementation. Stay in "can we build this clearly?" territory — this is not a market/value judgment pass.

## Pick a depth

| Depth | When | Skip |
|---|---|---|
| **Quick** | Bug fix, small change | Risk matrix, NFR table |
| **Standard** | A feature, a medium change | — |
| **Deep** | Large feature, architectural change | Nothing — do all of it |

## Process

1. **Scope check**: is this too large for one PR? Target 50-200 LOC (max ~400). If it's bigger, recommend a split: foundation (types/interfaces) → API layer → UI → integration.
2. **Discovery questions** (ask when genuinely ambiguous, not as ritual): What triggers this? What does success/failure look like? What's explicitly out of scope? What happens at the boundaries (first item, last item, empty state)? Which words are vague ("fast", "seamless") and what do they actually mean here?
3. **Acceptance criteria validation** — every requirement needs to be: **Testable** (can write an automated test), **Specific** (no undefined vague terms), **Independent** (verifiable in isolation), **Measurable** (clear pass/fail).
4. **Edge cases**: empty/null/max-value inputs, concurrent access, unusual state orderings.
5. **Technical analysis** (Standard/Deep): classify the change (feat/fix/refactor/chore/docs/test/perf), map the data flow, identify what's reusable vs. new, and check non-functional requirements — accessibility, performance targets, security/auth needs, retry/degradation behavior, logging/metrics, i18n.
6. **Risk assessment** (Standard/Deep): technical risk (new tech, complex integration), scope risk (moving target, stakeholder misalignment), schedule risk (external dependencies), quality risk (hard-to-test edges). For Deep, build a Likelihood × Impact × Mitigation matrix.
7. **Scope-creep watch**: "while we're at it..." / "it would be nice if..." / requirements that keep expanding after analysis starts — flag these explicitly and defer to a follow-up.

## Output format

```markdown
## Who
- [who consumes this change]

## What
- [high-level description]

## Why
- [problem solved, value delivered]

## Requirements
- **Given** [precondition] **When** [action] **Then** [outcome]

## Missing Questions / Undefined Guardrails / Scope Risks / Unvalidated Assumptions
- [item] — [why it matters / how to validate]

## Edge Cases
- [scenario] — [expected handling]

## Definition of Done
- [ ] [checklist item]

## Open Questions
- [ ] [question or decision needed] — [why it matters]
```

## Rules

- Stay in implementability, not market strategy — "is this testable?" not "is this valuable?"
- Findings must be specific: "the error handling for `createUser()` on duplicate email is unspecified — 409 or silent update?", never "requirements are unclear."
- Prioritize by impact — don't produce 50 edge cases for a trivial feature.
- Don't miss the obvious to chase the subtle: check the happy path is actually defined before hunting exotic edges.

## Related

- `planning-and-task-breakdown` — once requirements are solid, turn them into ordered implementation tasks
- `deep-interview` — for genuinely ambiguous requests that need a Socratic back-and-forth before this skill's checklist is even applicable
