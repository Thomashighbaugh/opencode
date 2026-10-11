import { HubSubcommandSpec } from "../../hub-data"

const spec: HubSubcommandSpec = {
  label: "sciomc",
  description: "Parallel scientist agents for comprehensive analysis",
  reminder: "Parallel scientist agents for analysis.",
  skill: "sciomc",

  detailedDescription: `Orchestrates parallel @scientist agents for comprehensive data analysis or research. Each scientist agent gets a slice of the analysis problem, works independently, and the orchestrator synthesizes their findings.

Use for research-heavy analysis: "analyze the performance characteristics of these 5 caching strategies", "compare these 3 ORM options across all criteria". Each scientist takes one slice, produces a structured analysis, and the orchestrator merges them into a single report with a recommendation.

AUTO mode: the orchestrator decides the decomposition automatically based on the task. You can override the slice count via flags.`,

  tools: ["loadSkill", "listAgents", "taskTodos"],
  relatedSkills: ["ccg"],
}

export default spec