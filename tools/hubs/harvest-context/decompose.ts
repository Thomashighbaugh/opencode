import { HubSubcommandSpec } from "../../hub-data"

const spec: HubSubcommandSpec = {
  label: "decompose",
  description: "Break down a concept or goal into smaller actionable units",
  reminder: "Decompose concept into actionable tasks.",
  agent: "planner",

  detailedDescription: `Decomposes a concept or goal into smaller actionable units via the @planner agent. The planner breaks the concept into a tree of sub-concepts or tasks, each small enough to be independently actionable.

Output: a decomposition tree (markdown) saved to .opencode/state/harvest/. Use when a concept is too abstract to act on directly and needs to be broken into concrete steps.`,

  tools: ["listAgents", "bash"],
  relatedSkills: ["planning-and-task-breakdown"],
}

export default spec