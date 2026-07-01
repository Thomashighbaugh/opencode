---
description: Analyze and optimize code for performance and security — N+1 queries, unnecessary allocations, missing indexes, injection vectors, unsafe patterns
argument-hint: "<target> [--perf] [--security]"
---

# Optimize Code

Analyzes code for performance and security issues, then applies targeted fixes. Invoked via `/project optimize <target> [--perf] [--security]`.

## Workflow

1. **Identify the target**: parse `$ARGUMENTS` for the file, directory, or module to optimize. If no target given, ask the user.

2. **Read the target code**: load the source file(s). Understand what the code does, its data flow, dependencies, and hot paths.

3. **Performance scan** (unless `--security` only):
   - **N+1 queries**: loops that execute DB queries per iteration. Flag the loop and suggest batch fetching or eager loading.
   - **Unnecessary allocations**: objects/arrays created inside hot loops that could be hoisted. Redundant copies.
   - **Missing indexes**: if the code does DB queries, check for obvious missing indexes on filter/join columns.
   - **O(n²) or worse**: nested loops over the same data structure. Suggest hash maps or sorted-then-merge.
   - **Redundant work**: repeated computations that could be memoized. Repeated regex compilations that could be hoisted. Repeated JSON parses of the same string.
   - **Lazy evaluation opportunities**: generators instead of materialized arrays, early returns before expensive work.

4. **Security scan** (unless `--perf` only):
   - **Injection vectors**: string concatenation in queries (SQL, NoSQL, shell), unsanitized input in templates, dynamic eval.
   - **Auth bypass**: missing auth checks, IDOR (insecure direct object reference), missing ownership verification.
   - **Secret exposure**: secrets in error messages, logs, or responses. Hardcoded secrets.
   - **Unsafe deserialization**: JSON.parse on untrusted input without validation. YAML.load without safe loader.
   - **Path traversal**: user input in file paths without normalization.
   - **CSRF**: state-changing endpoints without CSRF tokens.
   - **Rate limiting**: sensitive endpoints without rate limits.

5. **For each finding**: 
   - Classify: performance issue or security issue, severity (critical/high/medium/low).
   - Propose a fix: the minimal change that addresses the root cause. No refactoring theater.
   - Apply the fix (unless `--dry-run` flag): edit the source file with the targeted change only.

6. **Verify** (after applying): run tests if they exist. Run linter. Confirm the fix doesn't break behavior.

7. **Report**: list all findings (found + fixed, found + skipped), severity, location (file:line), and what was changed.

## Constraints

- Surgical changes only — fix the finding, don't "improve" adjacent code (Karpathy guideline #3).
- Do NOT change behavior. The optimized code must produce the same outputs for the same inputs.
- Do NOT add features or abstractions. This is optimization, not enhancement.
- If a fix would change behavior or is risky (e.g. changing a query might affect other consumers), flag it but don't apply — ask the user.
- Security findings classified as critical (exposed secrets, auth bypass) get fixed immediately per security.md rule.
- Performance fixes that trade readability for speed: only apply if the gain is meaningful. Note the tradeoff in the report.

## Output

- Source file(s) modified with targeted optimizations.
- Test/lint verification result.
- Report: each finding with location, severity, fix applied (or skipped with reason).