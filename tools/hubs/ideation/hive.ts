import { HubSubcommandSpec } from "../../hub-data"

const spec: HubSubcommandSpec = {
  label: "hive",
  description: "Agent Hive planning — Architect Bee phase: interview, discover, context-gather, produce plan.md with approval gate before execution",
  reminder: "Architect Bee: plan with approval gate.",
  inline: true,

  detailedDescription: `Agent Hive "Architect Bee" planning phase. The architect:

1. Interviews the user to understand the goal.
2. Discovers the codebase structure and constraints.
3. Gathers context (relevant files, patterns, conventions).
4. Produces plan.md — a complete execution plan with task breakdown for the Swarm Bee phase (/orchestrate hive).
5. Approval gate: the user must approve plan.md before execution begins. The architect does NOT auto-proceed.

The approved plan.md becomes the input for /orchestrate hive (Swarm Bee phase). This is the planning half of the Hive methodology.

Use for large features where you want a structured plan with an explicit approval gate before parallel execution. The gate ensures the user signs off on the plan before agents start building.`,

  tools: ["bash", "listAgents"],
  rules: ["completion-guardrail"],
  relatedSkills: [],

  examples: [
    {
      input: "/ideation hive 'implement the notification system: in-app, email, push'",
      approach: "Architect interviews (channels? priorities? opt-out?). Discovers existing event system. Plan.md: 5 tasks (notification model, dispatcher, in-app UI, email adapter, push adapter). User approves. Hand off to /orchestrate hive."
    }
  ]
}

export default spec