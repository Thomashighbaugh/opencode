import { HubSubcommandSpec } from "../../hub-data"

import { TOOLS_LOADSKILL_BASH, RULES_COMPLETION_GUARDRAIL } from "../shared-spec-fragments"
const spec: HubSubcommandSpec = {
  label: "deep-dive",
  description: "2-stage pipeline: trace root cause, then crystallize requirements — evidence-first investigation",
  reminder: "Trace root cause then interview to concrete spec.",
  skill: "deep-dive",

  detailedDescription: `2-stage pipeline combining trace (causal investigation) with deep-interview (requirements crystallization) connected by a 3-point injection mechanism.

Stage 1 — Trace: Runs 3 parallel causal investigation lanes examining the problem from different angles. Each lane produces evidence, hypotheses, and confidence scores. Code-path, config/environment, and measurement lanes run concurrently.

Stage 2 — Deep-Interview: Takes the trace findings and runs a Socratic interview to crystallize concrete, implementable requirements. The interview starts enriched with trace context — no redundant exploration.

3-point injection: (1) enriched starting point, (2) system context from trace, (3) seeded initial questions based on trace uncertainties.

Output: a spec at .opencode/state/specs/deep-dive-{slug}.md ready for handoff to /orchestrate patterns.

Use when investigating a problem where both root cause AND requirements are unclear. Do NOT use when root cause is already known — use /ideation deep (deep-interview) directly instead.`,

  tools: TOOLS_LOADSKILL_BASH,
  rules: RULES_COMPLETION_GUARDRAIL,
  relatedSkills: [],

  examples: [
    {
      input: "/ideation deep-dive 'auth tokens expire randomly'",
      approach: "Phase 1: Initialize 3 trace lanes. Phase 2: Confirm with user. Phase 3: Trace runs autonomously — lane 1 finds JWT expiry not refreshed, lane 2 finds nginx timeout mismatch, lane 3 finds clock skew. Phase 4: Interview uses trace findings to scope fix requirements ('implement refresh token rotation, align nginx timeout to 3600s, add NTP sync check'). Phase 5: spec saved for orchestration handoff."
    }
  ]
}

export default spec
