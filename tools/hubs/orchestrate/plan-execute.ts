import { HubSubcommandSpec } from "../../hub-data"

const spec: HubSubcommandSpec = {
  label: "plan-execute",
  description: "Classic plan-then-execute — architect builds complete plan, executor implements step by step",
  reminder: "Plan first, then execute step by step.",
  skill: "plan-execute",

  detailedDescription: `Two-phase orchestration:

Phase 1 — Plan: an architect agent (or the orchestrator itself for simple tasks) produces a complete, ordered implementation plan. The plan lists every step with its expected outcome and verification method. Saved to .opencode/state/orchestration/plan-{session}/plan.md.

Phase 2 — Execute: an executor agent (or the orchestrator) implements the plan step by step. Each step is verified against its expected outcome before proceeding to the next. If a step fails, the executor either fixes it or escalates.

Unlike autopilot (which runs distinct phases with different roles), plan-execute is simpler: one plan, one executor, sequential steps. Use for tasks where the full plan can be known upfront and execution is mostly linear.

The plan document is the contract — the executor shouldn't deviate without reason. If reality diverges from the plan, the executor stops and replans.`,

  tools: ["loadSkill", "listAgents", "taskTodos", "modeState", "bash"],
  rules: ["completion-guardrail"],
  relatedSkills: ["verify"],

  examples: [
    {
      input: "/orchestrate plan-execute 'migrate the auth module from JWT to session cookies'",
      approach: "Plan: 1) inventory current JWT usage, 2) add session middleware, 3) update login route, 4) update auth middleware, 5) remove JWT code, 6) update tests. Execute: do each step, run tests after each."
    }
  ]
}

export default spec