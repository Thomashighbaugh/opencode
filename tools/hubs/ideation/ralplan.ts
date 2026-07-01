import { HubSubcommandSpec } from "../../hub-data"

const spec: HubSubcommandSpec = {
  label: "ralplan",
  description: "Consensus planning gate — validate plan is concrete enough to execute",
  reminder: "Validate plan concreteness via consensus.",
  skill: "ralplan",

  detailedDescription: `Consensus planning gate that validates a plan is concrete enough to execute before any implementation begins. Multiple agents independently evaluate the plan's concreteness, then consensus is reached on whether it's ready.

The gate checks for: vague tasks ("improve X" without criteria), missing dependencies, unverified assumptions, undefined edge cases, and unclear acceptance criteria. If the plan fails the gate, the specific weaknesses are reported so the plan can be refined.

Use after /ideation plan (or any planning step) and before /orchestrate. It's the quality gate between planning and execution — prevents executing a plan that's too vague to succeed. This is especially important for hub-to-hub handoffs where a vague plan would cause the executor to flounder.`,

  tools: ["loadSkill", "bash"],
  relatedSkills: ["self-consistency"],

  examples: [
    {
      input: "/ideation ralplan --plan=.opencode/state/ideation/plan.md",
      approach: "3 agents evaluate the plan. Agent 1: 'task 3 is vague — no acceptance criteria'. Agent 2: 'missing dependency: task 5 needs task 2 done first'. Agent 3: 'looks good'. Consensus: fail, fix tasks 3 and 5. User refines, re-runs ralplan. Pass."
    }
  ]
}

export default spec