import { HubSubcommandSpec } from "../../hub-data"

import { TOOLS_LOADSKILL_BASH, SKILLS_SELF_CONSISTENCY } from "../shared-spec-fragments"
const spec: HubSubcommandSpec = {
  label: "ralplan",
  description: "Consensus planning gate — validate plan is concrete enough to execute",
  reminder: "Validate plan concreteness via consensus. Asks: which plan.",
  skill: "ralplan",

  detailedDescription: `Consensus planning gate that validates a plan is concrete enough to execute before any implementation begins. Multiple agents independently evaluate the plan's concreteness, then consensus is reached on whether it's ready.

The gate checks for: vague tasks ("improve X" without criteria), missing dependencies, unverified assumptions, undefined edge cases, and unclear acceptance criteria. If the plan fails the gate, the specific weaknesses are reported so the plan can be refined.

Use after /plan-hub plan (or any planning step) and before /orchestrate-hub. It's the quality gate between planning and execution — prevents executing a plan that's too vague to succeed. This is especially important for hub-to-hub handoffs where a vague plan would cause the executor to flounder.

## Gatekeeping Question

Before validating, ask (passing the flag skips the question — non-interactive path):

> **Question — which plan to validate?**
> 1. Select an existing plan file (list .opencode/state/ideation/*.md)
> 2. Type a topic — generate the plan first via /plan-hub plan
> (or type a path)

Resolved answer maps to \`--plan=<file>\`.`,

  tools: TOOLS_LOADSKILL_BASH,
  relatedSkills: SKILLS_SELF_CONSISTENCY,

  examples: [
    {
      input: "/plan-hub ralplan",
      approach: "Asks which plan (selects .opencode/state/ideation/plan.md). 3 agents evaluate the plan. Agent 1: 'task 3 is vague — no acceptance criteria'. Agent 2: 'missing dependency: task 5 needs task 2 done first'. Agent 3: 'looks good'. Consensus: fail, fix tasks 3 and 5. User refines, re-runs ralplan. Pass."
    }
  ]
}

export default spec
