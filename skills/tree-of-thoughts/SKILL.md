---
name: tree-of-thoughts
description: Explore multiple solution branches in parallel, evaluate each, and recommend the best path. Use when the user explicitly invokes /ideation tree-of-thoughts or asks for "tree of thought" / "branching exploration".
---

# Tree-of-Thoughts

Explore multiple distinct approaches to a problem in parallel, evaluate each
against criteria, and recommend the best path forward.

## ⚠️ Cost Warning

Tree-of-Thoughts explores 3-5 branches simultaneously. Each branch requires
multiple reasoning steps. **This costs ~10× a normal API call.** The user must
explicitly confirm before proceeding.

## When to Use

- User invokes `/ideation tree-of-thoughts`
- User asks for "tree of thought" or "branching exploration"
- **Never auto-invoke** — always get confirmation

## Workflow

1. **Show warning** — Present the cost warning to the user:
   > "Tree-of-Thoughts explores multiple solution branches in parallel. This
   > costs ~10× a normal API call. Proceed? (yes/no)"

2. **On confirmation** — Identify the problem and generate 3-5 distinct
   approaches. Each branch should be genuinely different, not minor variations.

3. **Explore each branch** — For each approach:
   - What is the core idea?
   - What are the pros?
   - What are the cons?
   - What assumptions does it make?
   - What would it look like implemented?

4. **Evaluate** — Score each branch against:
   - Feasibility (can we build this?)
   - Impact (how well does it solve the problem?)
   - Risk (what could go wrong?)
   - Cost (effort, maintenance, complexity)

5. **Recommend** — Rank the branches. State the best approach and why it
   outranks the alternatives. Acknowledge what's given up by not choosing
   the other branches.

6. **Save** — Write the exploration to `.opencode/state/ideation/` for later
   reference.

## Output Format

```
## Tree-of-Thoughts: [Problem]

**Branches explored:** N

| # | Approach | Feasibility | Impact | Risk | Cost | Rank |
|---|----------|-------------|--------|------|------|------|
| 1 | ...      | High/Med/Low | High/Med/Low | High/Med/Low | High/Med/Low | 1st |

### Branch 1: [Name]
**Core idea:** [description]
**Pros:** [list]
**Cons:** [list]
**Assumptions:** [list]

### Branch 2: [Name]
...

### Recommendation
**Best approach:** [Branch X]
**Why:** [evidence-based justification]
**What's sacrificed:** [what the other branches offered]

**Saved to:** `.opencode/state/ideation/tree-of-thoughts-{topic}-{timestamp}.md`
```

## Anti-Patterns

- **Auto-running**: Starting ToT without user confirmation. Always warn first.
- **Shallow branches**: Generating 3 variations of the same idea instead of 3
  genuinely different approaches. Each branch should be a distinct strategy.
- **Evaluation bias**: Ranking your preferred approach higher without evidence.
  Score each branch objectively against the same criteria.
- **No trade-off acknowledgment**: Recommending the best approach without
  noting what's lost by not choosing alternatives.
