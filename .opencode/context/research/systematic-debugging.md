# Systematic Debugging Methodology

> Ingested from: https://www.skills.sh/obra/superpowers/systematic-debugging
> Source: obra/superpowers (GitHub: https://github.com/obra/superpowers)
> Installs: 157.8K | Stars: 236.9K
> Ingested: 2026-06-24

## Summary

A structured debugging methodology that mandates **root cause investigation before attempting any fixes**. Four-phase process that blocks symptom-based patching and enforces architectural questioning after repeated failures.

## The Iron Law

```
NO FIXES WITHOUT ROOT CAUSE INVESTIGATION FIRST
```

If you haven't completed Phase 1, you cannot propose fixes.

## The Four Phases

### Phase 1: Root Cause Investigation

**BEFORE attempting ANY fix:**
1. **Read error messages carefully** — stack traces, line numbers, error codes
2. **Reproduce consistently** — exact steps; if not reproducible, gather more data
3. **Check recent changes** — git diff, recent commits, new dependencies, config changes, environment differences
4. **Gather evidence in multi-component systems** — add diagnostic instrumentation at each component boundary
5. **Trace data flow backward** — find where bad values originate, trace up to source

### Phase 2: Pattern Analysis
1. Find working examples in the same codebase
2. Compare against reference implementations (read completely)
3. Identify every difference between working and broken
4. Understand all dependencies, assumptions, and configuration

### Phase 3: Hypothesis & Testing (Scientific Method)
1. Form a single, specific hypothesis
2. Make the smallest possible change to test it (one variable at a time)
3. Verify before continuing — if it worked, proceed to Phase 4; otherwise, form a new hypothesis
4. If you don't understand, say so — don't pretend

### Phase 4: Implementation
1. **Create a failing test case first** (simplest possible reproduction)
2. Implement a single fix addressing the root cause
3. Verify fix (test passes, no other tests broken, issue resolved)
4. If fix doesn't work: < 3 attempts → return to Phase 1; ≥ 3 attempts → **STOP and question the architecture**

## Red Flags (Stop and Follow Process)

- "Quick fix for now, investigate later"
- "Just try changing X and see if it works"
- "Add multiple changes, run tests"
- "Skip the test, I'll manually verify"
- "One more fix attempt" (after already trying 2+)
- Each fix reveals a new problem in a different place

## 3+ Failed Fixes → Question Architecture

Pattern indicating architectural problems:
- Each fix reveals new shared state/coupling in different places
- Fixes require "massive refactoring" to implement
- Each fix creates new symptoms elsewhere

In this case: **STOP**, question fundamentals, discuss with your human partner.

## Success Criteria

| Phase | Key Activities | Success Criteria |
|-------|---------------|------------------|
| 1. Root Cause | Read errors, reproduce, check changes, gather evidence | Understand WHAT and WHY |
| 2. Pattern | Find working examples, compare | Identify differences between working and broken |
| 3. Hypothesis | Form theory, test minimally | Confirmed or new hypothesis |
| 4. Implementation | Create test, fix, verify | Bug resolved, tests pass |

## Common Rationalizations

| Excuse | Reality |
|--------|---------|
| "Issue is simple, don't need process" | Simple bugs have root causes too. Process is fast for simple bugs. |
| "Emergency, no time for process" | Systematic debugging is FASTER than guess-and-check thrashing. |
| "Just try this first, then investigate" | First fix sets the pattern. Do it right from the start. |
| "Multiple fixes at once saves time" | Can't isolate what worked. Causes new bugs. |
| "One more fix attempt" (after 2+ failures) | 3+ failures = architectural problem. Question pattern, don't fix again. |

## Real-World Impact

- Systematic approach: 15-30 minutes to fix
- Random fixes approach: 2-3 hours of thrashing
- First-time fix rate: 95% vs 40%
- New bugs introduced: Near zero vs common

## Related Skills

- `root-cause-tracing.md` — Trace bugs backward through call stack
- `defense-in-depth.md` — Add validation at multiple layers after finding root cause
- `condition-based-waiting.md` — Replace arbitrary timeouts with condition polling
- `test-driven-development` — Creating failing test cases
- `verification-before-completion` — Verify fix worked before claiming success

## Relevance

This methodology is directly applicable to OpenCode Hubs development. When debugging agent interactions, skill failures, or orchestration issues, following this structured process prevents thrashing and ensures durable fixes. The Phase 4.5 rule (question architecture after 3+ failed fixes) is particularly relevant for complex agent workflows.
