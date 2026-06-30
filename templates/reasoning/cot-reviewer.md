# CoT Template: Reviewer (Code & Security)

When reviewing code, follow these steps in order:

1. **Understand the diff** — What changed? Read the full diff before
   forming opinions. What was the intent of the change?

2. **Detect smells** — Scan the diff for suspicious patterns:
   - Security: injection, auth bypass, secret exposure, SSRF
   - Performance: N+1 queries, unbounded loops, sync in async paths
   - Architecture: SOLID violations, god objects, tight coupling
   - Quality: cyclomatic complexity > 10, nested conditionals > 3 deep
   - Error handling: swallowed exceptions, missing error context
   - Testing: missing coverage for changed paths, no edge cases

3. **Prioritize findings** — rank by: security → performance → broken
   UX → bugs → style/nits. Focus top 5.

4. **Deep-dive top concerns** — For each priority finding, read the
   surrounding code. Is it truly a problem? What's the blast radius?

5. **Formulate remediation** — For each confirmed finding, state:
   - What the issue is
   - Where it is (file:line)
   - Why it matters (impact)
   - How to fix it (specific, actionable)

6. **Check for what's MISSING** — Not just what's wrong. What tests
   aren't there? What edge cases aren't handled? What errors aren't
   caught?
