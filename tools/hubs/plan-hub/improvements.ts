import { HubSubcommandSpec } from "../../hub-data"

import { TOOLS_BASH, RULES_COMPLETION_GUARDRAIL } from "../shared-spec-fragments"

const spec: HubSubcommandSpec = {
  label: "improvements",
  description: "Project audit — major & minor improvement items with proposed fixes, ordered for approval",
  reminder: "Audit project and present improvement proposals for approve/deny.",
  inline: true,

  detailedDescription: `Audits the project you are running in and produces a list of improvement items — each with a proposed solution — ending with an ordered proposal list for the user to approve or deny.

**Phase 1 — Initial audit (breadth-first scan):**

1. Map the project: language, framework, entry points, module layout, build/test commands.
2. Scan each dimension quickly (evidence over vibes — cite files/lines):
   - Architecture — coupling, layering, circular deps, dead modules
   - Code quality — complexity hotspots, duplication, naming, error handling gaps
   - Testing — coverage gaps, brittle tests, missing integration/e2e
   - Dependencies — outdated, vulnerable, unused
   - Developer experience — build speed, tooling friction, onboarding docs
   - Config — project .opencode/ assets (rules, skills, agents) that are stale, missing, or mis-wired
3. Keep the audit proportionate: 5–15 minutes of scanning, not an exhaustive review.

**Phase 2 — Itemize findings (major vs minor):**

- **Major**: structural impact — security vulnerabilities, architectural problems, systemic test gaps, broken workflows, stale config assets.
- **Minor**: contained impact — naming, small refactors, doc gaps, single-file issues, one-line config fixes.

Every item has the shape:

\`\`\`
- [MAJOR|MINOR] <short title>
  - Evidence: <file:line or observed behavior>
  - Proposed solution: <concrete, file-specific fix — what would be changed>
  - Impact: <what improves>
  - Effort: <S / M / L>
\`\`\`

**Phase 3 — Ordered proposal list:**

At the end of the audit, present the **ordered list** — sorted by impact/effort ratio (highest first), majors before minors within the same ratio tier. Number the items 1..N.

**Phase 4 — User approve/deny:**

1. Present the ordered list to the user.
2. Ask for approval item-by-item (or as a batch) via the \`question\` tool: Approve / Deny per item.
3. Record decisions: approved items are the actionable backlog; denied items are dropped or deferred with the reason noted.
4. **STOP after the approval pass** — do NOT implement anything. Per the completion-guardrail, implementation starts only when the user explicitly says so (e.g., "/orchestrate" or "implement item 1-3").

**Output & state:**

- Write the audit + proposal list to \`.opencode/state/ideation/work-products/YYYYMMDD_HHMMSS_improvements_{topic-slug}_{stage}.md\` using the ideation naming convention.
- Terminal summary table: item # | severity | title | effort | status (approved/denied).

**Pairs with:** /build-hub overhaul (8-dimension phased plan), /plan-hub quality (code quality deep-dive), /build-hub optimize, /build-hub refactor. Use this when the user wants a quick "what should I improve?" sweep with a decision gate; use overhaul when they want the full phased plan.`,

  tools: TOOLS_BASH,
  rules: RULES_COMPLETION_GUARDRAIL,
  relatedSkills: [],
  examples: [
    {
      input: "what should I improve in this project?",
      approach: "Audit dimensions, find e.g. 2 majors (unpinned deps with CVE, no e2e tests) + 3 minors (naming in utils/, stale README, dead code in legacy/). Ordered list: 1. pin deps, 2. e2e smoke, 3. README update, 4. rename utils, 5. delete legacy. Ask approve/deny per item, then stop."
    },
    {
      input: "/ideation improvements",
      approach: "Run the 4-phase flow: audit → itemize major/minor → ordered proposal list → approve/deny gate. Save work-product to state; do not implement approved items without explicit go-ahead."
    }
  ],
  warnings: [
    "Audit is evidence-based — every item must cite files/lines, no vague 'the codebase feels' claims",
    "STOP after the approve/deny pass — implementation requires a separate explicit command",
    "Proportionate depth: this is a sweep, not an exhaustive review (use /build-hub overhaul for that)",
  ],
}

export default spec
