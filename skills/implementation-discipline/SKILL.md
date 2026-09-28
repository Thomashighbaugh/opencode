---
name: implementation-discipline
description: The discipline checklist for implementation work — smallest viable diff, explore before implementing, verify with fresh output before claiming done, no scope creep. Use as a standing checklist for any non-trivial code change, especially multi-file ones.
level: 1
license: MIT
---

# Implementation Discipline

The most common failure mode in implementation work is doing too much, not too little. A small correct change beats a large clever one. This is the checklist form of that discipline — not a workflow to run once, a set of defaults to hold throughout.

## Before writing code

1. Classify the task: trivial (single file, obvious fix) / scoped (2-5 files, clear boundaries) / complex (multi-system, unclear scope).
2. For anything non-trivial, explore first: map files, find patterns, understand existing tests, check dependencies. Skipping this produces code that doesn't match the codebase's own conventions.
3. Discover the codebase's actual style — naming, error handling, import order, test patterns — and match it. New code should look like the team wrote it.

## While implementing

- Prefer the smallest viable change. Don't broaden scope beyond what was requested — "while I'm here" fixes to adjacent code are a separate task, not a freebie.
- Don't introduce a new abstraction for single-use logic.
- If tests fail, fix the root cause in production code, not the test.
- After 3 failed attempts on the same issue, stop varying the fix and question the approach itself.

## Before claiming done

- Show fresh verification output — a build/test run from *this* pass, never an assumption or a memory of an earlier run.
- Grep modified files for leftover debug code (`console.log`, `TODO`, `HACK`, stray `debugger`).
- Confirm no unrelated files were touched.

## Failure modes this exists to prevent

| Failure | Instead |
|---|---|
| Overengineering — helper functions/abstractions the task didn't ask for | Make the direct change |
| Scope creep — fixing adjacent issues "while in there" | Stay within the requested scope |
| Premature completion — saying "done" before running verification | Always show fresh output |
| Test hacks — editing the test to make it pass | Treat test failures as signal about the implementation |
| Skipping exploration on non-trivial tasks | Explore first, always |
| Looping on the same broken approach | After 3 failures, escalate or change strategy |

## Related

- `systematic-debugging` — when the "implementation" is actually fixing a bug and root-cause discipline matters more than diff size
- `verify` — the fuller evidence-based completion-verification pass, for when a second independent check is warranted beyond self-verification
