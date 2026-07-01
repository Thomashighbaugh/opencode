import { HubSubcommandSpec } from "../../hub-data"

const spec: HubSubcommandSpec = {
  label: "autopilot",
  description: "Full autonomous execution from idea to working code",
  reminder: "From idea to working code autonomously.",
  skill: "autopilot",

  detailedDescription: `Full autonomous execution pipeline: takes a natural-language idea/task description and drives it through ideation → planning → implementation → verification → delivery, all without user intervention between stages.

Unlike ralph (which loops a single verify-execute cycle), autopilot runs distinct phases with different agent roles per phase. The planner phase produces a structured plan; the executor phase implements it; the verifier phase confirms it works. Each phase's output feeds the next.

Use when you have a well-scoped feature or task and want end-to-end autonomous delivery. The task must be concrete enough that a plan can be derived without follow-up questions. For vague tasks, use /orchestrate deep or /ideation plan first to crystallize requirements.

State: .opencode/state/orchestration/autopilot-{session}/ holds the plan, implementation log, and verification report.`,

  tools: ["loadSkill", "modeState", "taskTodos", "listAgents", "bash"],
  rules: ["completion-guardrail", "karpathy-guidelines"],
  relatedSkills: ["plan-execute", "verify"],

  examples: [
    {
      input: "/orchestrate autopilot 'add a /health endpoint that returns 200 and DB connection status'",
      approach: "Plan: locate server entry, add route, add DB check. Execute: write the route. Verify: curl the endpoint, confirm 200 + JSON body."
    }
  ],

  warnings: [
    "Consumes many API requests across phases. Best for tasks where the cost of autonomy is less than the cost of manual hand-holding."
  ]
}

export default spec