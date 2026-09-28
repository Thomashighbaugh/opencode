---
name: prompt-simplifier
description: Decompose an instruction set or prompt into a logic graph, find dead paths and unhandled edge cases, and produce concrete simplifications that preserve intent. Use when a prompt, agent definition, or skill has grown unwieldy and needs a structural pass rather than line edits.
level: 2
license: MIT
---

# Prompt Simplifier

Read-only logical analysis first, then apply the recommended simplifications — graph decomposition must complete before any improvement is proposed, and simplification must never change core behavior.

## Workflow

### 1. Parse
Extract conditions, actions, states, dependencies, and assumptions from the instructions.

### 2. Decompose into a graph
Nodes: condition | action | state | decision. Edges: transitions, dependencies, causation.
```
Node A (condition): "If X"
  -> "then" -> Node B (action): "Do Y"
  -> "else" -> Node C (state): "Error state"
```

### 3. Analyze by category
- **Structural**: dead paths, missing branches, unhandled edge cases
- **Logical**: contradictions, impossible transitions, negating logic
- **Quality**: redundancy, nesting deeper than 3 levels, logic that could be inverted for clarity

### 4. Check edge cases
Input boundaries (empty, null, max, special characters), state permutations, order dependencies, failure paths.

### 5. Extract improvements
```markdown
**[Improvement N]**
- Type: structural | logical | quality
- Location: [line/section]
- Current: [existing logic, or "Not handled"]
- Proposed: [recommendation]
- Benefit: [clarity/maintainability/reliability]
- Confidence: high | medium | low
```

## Output format

```markdown
## Prompt Analysis: [Name]

### Graph Summary
- Nodes: X   Edges: Y   Max depth: Z   Decision points: N

### Complexity Score: X/10
[one-sentence assessment]

### Issues Found
- [Type] at [Location] - [Description]

### Improvements
[as above, one per finding]

### Questions/Clarifications Needed
- [anything genuinely ambiguous — flag it, don't guess]
```

## Rules

- Flag ambiguities; never guess at intent to fill a gap.
- Every improvement is tied to a specific location — no vague "this section is confusing."
- Simplification must preserve behavior. If a change would alter what the instructions actually do, that's a redesign proposal, not a simplification, and must be labeled as such.
- Prioritize high-impact, low-effort improvements first.

## Related

- `agent-md-refactor` — for the specific case of splitting a monolithic AGENTS.md/CLAUDE.md via progressive disclosure, rather than analyzing one prompt's internal logic
