---
name: architect-review
description: Get an independent, evidence-based architectural or debugging second opinion, uncontaminated by the main conversation's assumptions. Use for cross-checking a design decision, diagnosing a stubborn bug, or verifying an implementation's architectural soundness before committing to it.
level: 3
license: MIT
context: fork
agent: general-purpose
---

# Architect Review

An independent architecture/debugging pass, deliberately run in a forked context so it isn't anchored to whatever the main conversation has already concluded. Ported from the OpenCode "architect" agent — this is the one role in the old roster that genuinely needed isolation rather than just procedure, so it kept the fork.

## When to Use

- A second opinion on a design decision before committing to it
- A bug that's resisted 2+ fix attempts and needs fresh eyes on the root cause
- Verifying an implementation is architecturally sound, not just "it compiles"
- Consensus/ralplan-style reviews needing a steelman antithesis

## The brief for the forked pass

Give the fork:
1. **The question** — the specific decision or bug, not "review this file"
2. **The relevant files** — paths, not pasted content; let it read them itself
3. **What's already been tried or assumed** — so it can deliberately hold those assumptions at arm's length rather than rubber-stamping them

Tell the fork to follow this protocol:

1. **Gather context first, in parallel.** Map project structure, find relevant implementations, check manifests, find existing tests.
2. **For debugging**: read the full error, check `git log`/`git blame` for recent changes, find a working comparison case, diff broken vs. working to isolate the delta.
3. **Form a hypothesis and write it down before digging further.**
4. **Cross-reference the hypothesis against actual code.** Every claim needs a `file:line` citation — never judge code that wasn't opened and read.
5. **Circuit breaker**: after 3 failed fix hypotheses, stop trying variations and question the architecture itself instead.

## Output format

```
## Summary
[2-3 sentences: finding + main recommendation]

## Analysis
[Findings with file:line references]

## Root Cause
[The fundamental issue, not the symptom]

## Recommendations
1. [priority] - [effort] - [impact]

## Trade-offs
| Option | Pros | Cons |
|--------|------|------|

## References
- `path/file.ts:42` - [what it shows]
```

For a consensus/ralplan review, append: **Antithesis** (strongest counterargument against the favored direction), **Tradeoff tension**, **Synthesis** (if one exists that preserves both sides' strengths).

## Rules

- No advice without having read the code — an unread-code recommendation is a guess, not a finding.
- Every recommendation must be concrete and implementable ("extract the validation logic from `auth.ts:42-80` into `validateToken()`"), never generic ("consider refactoring this").
- Always name the trade-off. A recommendation with no acknowledged cost hasn't been thought through.
- Stay in scope — answer the specific question, don't drift into reviewing adjacent code nobody asked about.
- This pass is read-only in spirit even when the fork technically has write tools: it recommends, the main conversation implements.

## Related

- `plan-critic` — the equivalent isolation pattern for reviewing a plan or finished diff, adversarially rather than architecturally
- `systematic-debugging` — the non-forked version of the debugging protocol above, for when isolation isn't needed
