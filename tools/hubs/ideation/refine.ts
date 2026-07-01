import { HubSubcommandSpec } from "../../hub-data"

const spec: HubSubcommandSpec = {
  label: "refine",
  description: "Diverge/converge iteration — expand ideas, then sharpen them",
  reminder: "Diverge and converge to sharpen ideas.",
  skill: "idea-refine",

  detailedDescription: `Iterative refinement through diverge/converge cycles. Each cycle:

1. Diverge: take the current idea and expand it — explore adjacent possibilities, variations, and implications.
2. Converge: evaluate the expanded set and sharpen the idea — keep the strongest elements, cut the rest.

Multiple cycles progressively sharpen a rough idea into a concrete, actionable concept. The number of cycles is configurable (default: 2-3).

Use when you have a rough idea that needs sharpening before it's actionable. Different from brainstorm (which generates from scratch) — refine starts with an existing idea and improves it.`,

  tools: ["loadSkill", "bash"],
  relatedSkills: [],
}

export default spec