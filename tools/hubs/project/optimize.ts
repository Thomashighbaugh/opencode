import { HubSubcommandSpec } from "../../hub-data"

const spec: HubSubcommandSpec = {
  label: "optimize",
  description: "Analyze code for performance and security issues, then apply targeted fixes",
  reminder: "Analyze and optimize code for performance/security.",
  inline: true,

  detailedDescription: `Analyzes code for performance and security issues, then applies targeted fixes. Invoked via /project optimize <target> [--perf] [--security].

## Workflow

1. **Identify the target**: parse the file, directory, or module to optimize from **the user's project codebase** (not the global OpenCode configuration). If no target is given, **ask the user** what to optimize — do NOT default to the current working directory (~/.config/opencode/). The user's project is the workspace root, not the OpenCode config directory.

2. **Read the target code**: load the source file(s). Understand what the code does, its data flow, dependencies, and hot paths.

3. **Performance scan** (unless --security only):
   - **N+1 queries**: loops that execute DB queries per iteration. Flag the loop and suggest batch fetching or eager loading.
   - **Unnecessary allocations**: objects/arrays created inside hot loops that could be hoisted. Redundant copies.
   - **Missing indexes**: if the code does DB queries, check for obvious missing indexes on filter/join columns.
   - **O(n²) or worse**: nested loops over the same data structure. Suggest hash maps or sorted-then-merge.
   - **Redundant work**: repeated computations that could be memoized. Repeated regex compilations that could be hoisted. Repeated JSON parses of the same string.
   - **Lazy evaluation opportunities**: generators instead of materialized arrays, early returns before expensive work.

4. **Security scan** (unless --perf only):
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
   - Apply the fix (unless --dry-run flag): edit the source file with the targeted change only.

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
- Report: each finding with location, severity, fix applied (or skipped with reason).`,

  tools: ["bash"],
  rules: ["security", "karpathy-guidelines"],
  relatedSkills: [],

  examples: [
    {
      input: "/project optimize src/api/users.ts --perf",
      approach: "Performance scan only. Finds N+1 query in user list endpoint (loop calling User.find inside map). Fix: switch to eager loading with JOIN. Verify: tests pass. Report: 1 finding (high), fixed."
    },
    {
      input: "/project optimize src/ --security",
      approach: "Security scan only across src/. Finds hardcoded API key in config.ts (critical — fix immediately). Finds SQL injection in search endpoint (high — parameterize query). Report: 2 findings (1 critical fixed, 1 high fixed)."
    },
    {
      input: "/project optimize src/payment.ts --dry-run",
      approach: "Full scan in dry-run mode. Finds 3 performance issues (redundant JSON.parse in hot path, O(n²) loop, unnecessary allocation) and 1 security issue (unsafe deserialization). Reports all findings with proposed fixes but applies nothing."
    }
  ],

  warnings: [
    "Performance fixes that change query patterns may affect other consumers — risky changes are flagged but not auto-applied.",
    "Security critical findings (exposed secrets, auth bypass) are fixed immediately per security.md — no dry-run override for critical security issues."
  ]
}

export default spec
