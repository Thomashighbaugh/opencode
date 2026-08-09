import { HubSubcommandSpec } from "../../hub-data"

import { TOOLS_LOADSKILL_BASH, RULES_KARPAHTY_GUIDELINES } from "../shared-spec-fragments"

const spec: HubSubcommandSpec = {
  label: "self-improve",
  description: "Per-project self-optimization — capture learnings, triage failures, promote recurring fixes into .opencode/ config",
  reminder: "Run the self-improvement capture/triage/promotion loop for this project.",
  skill: "self-improvement",

  detailedDescription: `Runs the per-project self-optimization loop: the project's own .opencode/ config (rules, skills, AGENTS.md) adapts as it is used, so that recurring failures and corrections compound into durable, evidence-gated improvements.

Load the \`self-improvement\` skill and follow its workflow:

**1. Capture** — append typed entries to .opencode/context/learnings/ (LEARNINGS.md / ERRORS.md / FEATURE_REQUESTS.md) for anything that failed, was corrected, went stale, or lacks a capability. Dedupe by Pattern-Key; increment Recurrence-Count on repeats. Entry ID format: LRN-/ERR-/FEAT-YYYYMMDD-NNNNNN.

**2. Triage** — classify each failure into one of two root buckets BEFORE proposing changes:
   - **Config problem**: the project .opencode/ asset (skill/rule/command/spec) is wrong, stale, or missing → fix the asset.
   - **Agent problem**: the asset is fine; the agent misused it → no config change.
   Pre-triage: verify the asset exists, is registered, and loads before blaming the agent.

**3. Promote (bounded, human-approved)** — only when Recurrence-Count >= 3 across 2+ tasks within 30 days, with verified before/after evidence:
   - Promotion targets, in order: project AGENTS.md / rules/*.md (prevention rule), project skills/ (reusable workflow), FEATURE_REQUESTS.md → provision.
   - Guardrail format: BEFORE <op>: <checks> / TRIGGERED BY / ADDED BECAUSE: <entry ID> / EFFECTIVENESS: <tracked>.
   - Promotions are bounded edits (one surface, minimal delta) and are NEVER auto-applied — present to the user for approval.

**4. Validate** — mark entries promoted, track EFFECTIVENESS. Every 10 sessions run /project retrospect + /project consolidate-telemetry to fold telemetry into the loop.

**Signals to act on (rolling 10 sessions):** first-attempt success < 80%, avg revisions >= 1.5, error recurrence >= 10%, user corrections >= 5%, time-to-completion accuracy outside 0.8–1.2.

**Anti-patterns:** no measurement without thresholds, no config change on a single error, no >5-item checklists, no promotion without 2+ examples, no monolithic rule rewrites, no same-agent self-evaluation.

**Validation commands:**
- \`ls .opencode/context/learnings/\` — capture files exist
- \`grep -c "Recurrence-Count: 3" .opencode/context/learnings/LEARNINGS.md\` — promotion candidates

See the \`self-improvement\` skill for the full capture format, triage table, and promotion rules. Related: \`remember\` (memory surfaces), \`learner\` (skill extraction), \`self-improve\` (evolutionary code engine), /project retrospect, /project consolidate-telemetry.`,

  tools: TOOLS_LOADSKILL_BASH,
  rules: RULES_KARPAHTY_GUIDELINES,
  relatedSkills: ["remember", "learner", "self-improve"],
  examples: [
    { input: "Tool keeps failing the same way", approach: "/project self-improve — capture the error, triage to config vs agent bucket, promote if Recurrence-Count >= 3" },
    { input: "User keeps correcting the same thing", approach: "/project self-improve — log corrections to LEARNINGS.md, check for a knowledge gap in project rules" },
  ],
  warnings: [
    "Never auto-apply config changes — promotions require user approval",
    "Do not log one-off errors or generic knowledge — high-signal entries only",
    "Triage to config-vs-agent bucket before editing any asset",
  ],
}

export default spec
