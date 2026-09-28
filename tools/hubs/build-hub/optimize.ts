import { HubSubcommandSpec } from "../../hub-data"

import { TOOLS_BASH } from "../shared-spec-fragments"
const spec: HubSubcommandSpec = {
  label: "optimize",
  description: "Analyze code for performance and security issues, then apply targeted fixes",
  reminder: "Analyze and optimize code for performance/security.",
  inline: true,

  detailedDescription: `Analyzes code for performance and security issues, then applies targeted fixes. Invoked via /build-hub optimize <target> [--perf] [--security] [--dry-run] [--measure].

## Workflow

### 0. Pre-edit repo sync (mandatory before any file change)
1. Check the current branch — if already on a feature branch for this task, skip.
2. Check repo branch naming conventions; create one following the convention, fallback: feat/optimize-<target>.
3. Sync with remote: git fetch origin && git pull --rebase origin "$(git rev-parse --abbrev-ref HEAD)". If the working tree is dirty, stash first (git stash push -u -m "pre-sync"), sync, then pop.
4. If origin is missing, pull is unavailable, or rebase/stash conflicts occur — STOP and ask the user before continuing.

### 1. Identify the target
Parse the file, directory, or module to optimize from **the user's project codebase** (not the global OpenCode configuration). If no target is given, **ask the user** what to optimize — do NOT default to the current working directory (~/.config/opencode/). The user's project is the workspace root, not the OpenCode config directory.

### 2. Read and understand the code
Load the source file(s). Identify language, framework, and runtime context (Node.js, Python, Go, Rust, Java, browser, etc.). Understand data flow, dependencies, and hot paths before analyzing.

### 3. Analysis — priority order (analyze each category in this order)
1. **Performance bottlenecks** — O(n²)+ operations, inefficient loops, unnecessary iterations, blocking operations on hot paths.
2. **Memory leaks** — unreleased resources, circular references, growing collections. Distinguish caches from leaks: a collection with a trim/eviction mechanism is a cache, not a leak — don't "fix" it.
3. **Algorithm improvements** — better algorithms or data structures for the use case (hash maps vs nested scans, sorted-then-merge, etc.).
4. **Caching opportunities** — repeated computations, redundant I/O, memoization candidates, repeated regex compilation / JSON parsing of the same string that could be hoisted.
5. **Concurrency issues** — race conditions, deadlocks, thread-safety problems, goroutine/worker leaks, unprotected shared state.

**N+1 queries** (loops executing DB queries per iteration) and **missing indexes** on filter/join columns are checked wherever the code touches a database. For each issue found, **estimate the quantitative impact** (e.g., "reduces API response from ~500ms to ~50ms", "O(n²) → O(n log n)", "1000 round-trips → 1 batched query"). Report findings sorted by severity (Critical first).

### 4. Language-specific checklists (apply the matching one; never cross-apply)
- **JavaScript/TypeScript**: array methods inside loops (map/filter/find inside forEach), missing async/await causing blocking, event listener leaks, unbounded arrays/objects.
- **Python**: list comprehensions vs generator expressions for large data, GIL considerations, context manager usage for resources, N+1 query patterns.
- **Go**: goroutine leaks (unbounded go func() without context cancellation), unnecessary allocations in hot paths (sync.Pool, pre-allocated slices), string concatenation in loops (strings.Builder), missing defer for resource cleanup.
- **Rust**: unnecessary cloning (references or Cow<> instead), lock contention (RwLock vs Mutex), unbounded Vec growth without with_capacity, blocking operations in async contexts.
- **Java**: autoboxing in tight loops (primitive types), string concatenation with + in loops (StringBuilder), over-broad synchronized blocks, Stream API misuse (unnecessary intermediate collections).
- **General**: DB query patterns (N+1, missing indexes), I/O in hot paths.
- **Mixed-language projects**: analyze each language with its own checklist — do not apply JavaScript heuristics to Python code.

### 5. Root-cause discipline (measure-first, not symptom-patching)
- Use git blame / git log on the perf-critical or leaking code. Read the commit message, PR description, and linked issues — a guard like "if (this._isDisposed) return" may exist because removing it once caused crashes. Understand the original intent before changing it.
- Trace the full lifecycle, not just the leak/hot site. If cleanup is silently dropped, ask why the parent is disposed before the child — the answer determines whether to fix the guard, the disposal order, or add a different cleanup path.
- Check for prior art: sibling pools/services that handle the same lifecycle correctly — follow that pattern.
- Prefer a warmed-up baseline over startup measurements. Startup, first-use model loads, login, and extension activation are expected allocations — don't report them.

### 6. Security scan (unless --perf only)
- **Injection vectors**: string concatenation in queries (SQL, NoSQL, shell), unsanitized input in templates, dynamic eval.
- **Auth bypass**: missing auth checks, IDOR (insecure direct object reference), missing ownership verification.
- **Secret exposure**: secrets in error messages, logs, or responses. Hardcoded secrets.
- **Unsafe deserialization**: JSON.parse on untrusted input without validation. YAML.load without safe loader.
- **Path traversal**: user input in file paths without normalization.
- **CSRF**: state-changing endpoints without CSRF tokens.
- **Rate limiting**: sensitive endpoints without rate limits.

### 7. For each finding
- Classify: performance or security issue; severity (definitions below).
- Propose a fix: the minimal change that addresses the root cause, with a code example. No refactoring theater.
- Apply the fix (unless --dry-run): edit the source file with the targeted change only.
- **Run existing tests after each change** to verify no regressions. If a fix breaks tests, revert that change immediately and re-examine the approach. If no tests exist, warn the user before applying changes.

### 8. Verify (--measure flag, or whenever a memory/perf claim is made)
- Define the repeatable scenario: one warmup action, one repeatable iteration, one quiescent point where it is fair to measure.
- Before/after comparison: rerun the same scenario with the same labels/samples after the fix. A successful fix shows flat or decreasing memory / improved latency in the iteration phase — not just in the startup phase.
- Run all unit and integration tests for changed files; run the linter. A unit test failure after your change is your regression — fix it.

### 9. Report
For each issue: Location (file:line), Category (Performance | Memory | Algorithm | Caching | Concurrency | Security), Problem, Impact (quantitative), Fix. Findings sorted by severity; state which were fixed vs skipped (with reason). If no issues found, say the code is already well-optimized and suggest profiling with runtime tools (perf, py-spy, Chrome DevTools) — do NOT invent low-severity findings to fill the report.

## Severity levels
- **Critical**: crashes, severe memory leaks, O(n³)+ complexity, exposed secrets, auth bypass.
- **High**: significant performance impact (O(n²), blocking operations, resource exhaustion), injection, IDOR.
- **Medium**: noticeable impact under load (redundant operations, suboptimal algorithms), unsafe deserialization, path traversal.
- **Low**: minor improvements (micro-optimizations, style improvements with perf benefit).

## Constraints
- Surgical changes only — fix the finding, don't "improve" adjacent code (Karpathy guideline #3).
- Do NOT change behavior. The optimized code must produce the same outputs for the same inputs.
- Do NOT add features or abstractions. This is optimization, not enhancement.
- If a fix would change behavior or is risky (e.g. changing a query might affect other consumers), flag it but don't apply — ask the user.
- Security findings classified as critical (exposed secrets, auth bypass) get fixed immediately per security.md rule.
- Performance fixes that trade readability for speed: only apply if the gain is meaningful. Note the tradeoff in the report.
- Target file >2000 lines: ask the user which functions/sections to focus on; analyze the most performance-critical paths first. Do not silently truncate.
- Premature optimization: skip micro-optimizations unless a measurable hot path is identified — flag as Low only when a profile or benchmark backs the claim.

## Output
- Source file(s) modified with targeted optimizations, on a feature branch.
- Test/lint verification result.
- Report: each finding with location, severity, category, impact, and fix applied (or skipped with reason).`,

  tools: TOOLS_BASH,
  rules: ["security", "karpathy-guidelines"],
  relatedSkills: ["verify"],

  examples: [
    {
      input: "/project optimize src/api/users.ts --perf",
      approach: "Priority-ordered analysis finds N+1 query in listUsers (loop calling User.find inside map). Impact: 1000 users → ~1000 round-trips (~2000ms) → 1 batched query (~50ms), 40x. Fix with eager loading (JOIN or IN clause). Run tests after the change. Report: 1 finding (Critical), fixed, impact quantified."
    },
    {
      input: "/project optimize src/ --security",
      approach: "Security scan only across src/. Finds hardcoded API key in config.ts (Critical — fix immediately). Finds SQL injection in search endpoint (High — parameterize query). Report: 2 findings (1 critical fixed, 1 high fixed)."
    },
    {
      input: "/project optimize src/payment.ts --measure",
      approach: "Full scan with measurement. Defines the repeatable scenario (warmup + N iterations + quiescent point), measures baseline, applies fixes (redundant JSON.parse in hot path, O(n²) loop, missing memory cleanup), reruns the same scenario, compares before/after. Reports findings with quantitative before/after numbers."
    }
  ],

  warnings: [
    "Performance fixes that change query patterns may affect other consumers — risky changes are flagged but not auto-applied.",
    "Security critical findings (exposed secrets, auth bypass) are fixed immediately per security.md — no dry-run override for critical security issues.",
    "Memory claims without a before/after measurement on the same scenario are not verified — use --measure for reproducible evidence."
  ]
}

export default spec
