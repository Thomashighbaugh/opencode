import { HubSubcommandSpec } from "../../hub-data"

const spec: HubSubcommandSpec = {
  label: "brainstorm",
  description: "Free-form idea generation — throw ideas at the wall on any topic, then cluster and prioritize",
  reminder: "Generate, cluster, and prioritize ideas.",
  inline: true,

  detailedDescription: `Free-form idea generation followed by clustering and prioritization. Two phases:

1. Diverge: generate many ideas on the topic without judgment. Quantity over quality — the goal is breadth. No idea is rejected during generation.
2. Converge: cluster related ideas, identify themes, and prioritize. Ideas are grouped by theme, ranked by impact/feasibility, and the top candidates are highlighted.

Use at the very start of a project or feature when you don't yet know what you want — exploration before commitment. NOT for tasks where you already know the goal (use /ideation plan or /ideation decomposition for those).

Output: a prioritized list of ideas grouped by theme, saved to .opencode/state/ideation/work-products/.`,

  tools: ["bash"],
  relatedSkills: [],
}

export default spec