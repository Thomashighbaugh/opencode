import { HubSubcommandSpec } from "../../hub-data"

import { TOOLS_BASH, RULES_COMPLETION_KARPAHTY } from "../shared-spec-fragments"

const spec: HubSubcommandSpec = {
  label: "deep-bug-hunt",
  description: "Critical bug hunt on recent changes — regressions, data loss, security holes",
  reminder: "Hunt recent commits for critical correctness bugs.",
  inline: true,

  detailedDescription: `Deep bug hunt — inspect recent changes and find critical correctness bugs that escaped review. Synthesizes three methodologies: post-merge blast-radius triage (deep-bug-hunt), engagement-mode confirmation + false-positive discipline (bb-methodology), and the 4-phase Root Cause → Pattern → Hypothesis → Fix investigation (bug-hunt).

## Modes

| Invocation | Mode | Use when |
|------------|------|----------|
| \`deep-bug-hunt\` (no args) | Recent-commit sweep | Auditing what merged recently |
| \`deep-bug-hunt <symptom>\` | Investigation | A known bug or failure needs root cause |
| \`deep-bug-hunt --audit <scope>\` | Proactive audit | Sweeping a package/dir for unreported bugs |

## Step 0: Mode confirmation (before anything else)

State what counts as a finding. Default is **internal audit** discipline: only issues with a concrete trigger scenario and meaningful blast radius (data loss, security hole, crash on critical path, silent truncation, race that loses writes, auth/permission bypass, resource leak). Reject: style, minor edge cases, theoretical concerns without a concrete trigger, low-severity UX degradation.

**Confidence bar:** you must be able to write a concrete trigger scenario (precondition → action → expected → actual). If you cannot construct a plausible trigger, do NOT fix or open a PR — report uncertainty instead.

## Workflow

### 1. Scope recent changes
Default: commits merged in the last 24 hours on the default branch.
\`\`\`bash
git log --oneline --since="24 hours ago" origin/main
git diff origin/main~N..origin/main   # N = commits in scope
\`\`\`
For a branch/PR: diff against the merge base:
\`\`\`bash
git merge-base HEAD origin/main
git diff <merge-base>..HEAD
git log --oneline <merge-base>..HEAD
\`\`\`
For --audit <scope>: list files in scope; if broad (>50 files), narrow to recently changed ones:
\`\`\`bash
git log --since="2 weeks ago" --name-only --pretty=format: -- <scope> | sort -u
\`\`\`

### 2. Triage by blast radius
Prioritize changes touching: persistence/migrations/sync/serialization; auth/permissions/multi-tenant boundaries; concurrency and shared mutable state; error handling on critical paths (startup, save, payment, delete); public API contracts and IPC boundaries.
Read surrounding code — not just the diff hunk — until you can state who calls the changed code and what happens on failure.

### 3. Investigation mode: 4-phase structure
- **Phase 1 Root Cause**: reproduce first (expected vs actual, consistently?). Then locate the symptom (grep error text / names), git archaeology (git log <file>, git blame, git log --grep), trace the execution path from entry point backward to the bad data/state origin. Identify what/where (file:line)/when (commit)/why.
- **Phase 2 Pattern**: find similar functionality that WORKS; document ALL differences between broken code and working reference.
- **Phase 3 Hypothesis**: ONE hypothesis at a time ("I think X is wrong because Y"). Test with the SMALLEST possible change. After 3 countable failures, escalate to architecture review — do not keep guessing.
- **Phase 4 Fix**: design the fix first (edge cases, breakage, tests to update); write a failing test BEFORE fixing; implement at the ROOT CAUSE, not symptoms; verify the test passes.

### 4. Audit mode: systematic read
Read every file in scope line by line — do not skim (proven methodology: careful reading finds bugs, heuristic scanning does not). Check per file: resource leaks (unclosed handles, missing cleanup), string safety (UTF-8 truncation, unsanitized input), dead code, hardcoded values (paths/URLs/repo assumptions), edge cases (empty/nil/boundary), concurrency (unprotected shared state, leaked goroutines), error handling (swallowed errors, wrong types).
Classify severity: **HIGH** = data loss, security, resource leak, process orphaning. **MEDIUM** = wrong output, incorrect defaults, silent corruption. **LOW** = dead code, cosmetic.
Also check missing failure-injection test coverage (BF4): for every file making external calls, verify timeout/connection-failure/permission-denied/corrupt-input tests exist — flag gaps as findings.

### 5. False-positive discipline (hard rules)
- **Statistical-sample rule**: timing-based claims (user-enum, blind injection) need n≥10 interleaved trials per group; signal = suspect group mean ≥2σ above control. Single outliers are jitter.
- **Body-diff rule**: a bypass/reflection claim requires response BODY differential, not just status code. Diff baseline vs claim side-by-side.
- **Shell-loop ban**: >5 iterations → use Python with try/except per iteration, never zsh for-loops (zsh array expansion fails silently). Always count results.
- **Marker discipline**: any injected marker must be unique, 8+ random alphanumeric chars — never "test"/"marker"/domain words; verify it does not appear in the baseline.

### 6. Act on findings
| Outcome | Action |
|---------|--------|
| No critical bug | Post short "no critical bugs found" summary (expected most days) — scope, areas checked, notes |
| Possible bug, low confidence | Report with scenario + open questions — NO fix, NO PR |
| Confirmed critical bug | Minimal fix + test, then report. Keep changes scoped to the bug only. |

Present findings as a summary table (\`# | Bug | Severity | File | Fix\`). If a durable report is wanted, save to \`.opencode/state/project/\` or the repo's \`.agents/research/YYYY-MM-DD-bug-<scope>.md\`. Report includes: root cause (or "not yet"), file:line, proposed fix, and failure count (hypothesis tests that didn't confirm).

STOP after reporting — do not continue into unrelated refactors. Per karpathy-guidelines: surgical changes only, fix verified before claiming done.`,

  tools: TOOLS_BASH,
  rules: RULES_COMPLETION_KARPAHTY,
  relatedSkills: ["systematic-debugging", "verify", "trace"],
  examples: [
    {
      input: "/project deep-bug-hunt",
      approach: "Sweep last 24h commits on the default branch for critical correctness bugs; report a summary table; fix only confirmed high-severity issues.",
    },
    {
      input: "/project deep-bug-hunt 'feature X broke after yesterday's deployment'",
      approach: "Reproduce, git-archaeology to find the breaking commit (git log --since, git bisect), compare against working reference, single-hypothesis test, minimal root-cause fix with a failing test first.",
    },
    {
      input: "/project deep-bug-hunt --audit src/auth/",
      approach: "Line-by-line systematic read of the auth package; classify findings HIGH/MEDIUM/LOW; check failure-injection test coverage; report summary table with file:line and proposed fixes.",
    },
  ],
  warnings: [
    "⚠️ --audit on large scopes (>50 files) is expensive — narrow to recently changed files first.",
  ],
}

export default spec
