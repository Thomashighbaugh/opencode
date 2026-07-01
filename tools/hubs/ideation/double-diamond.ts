import { HubSubcommandSpec } from "../../hub-data"

const spec: HubSubcommandSpec = {
  label: "double-diamond",
  description: "Design Council framework — discover, define, develop, deliver",
  reminder: "Discover, define, develop, deliver.",
  inline: true,

  detailedDescription: `Double Diamond design framework with four phases arranged as two diamonds (diverge→converge, diverge→converge):

1. Discover (diverge): explore the problem space broadly — user research, existing solutions, constraints, pain points. Don't narrow yet.
2. Define (converge): synthesize findings into a clear problem statement. What exactly are we solving?
3. Develop (diverge): explore the solution space broadly — multiple approaches, prototypes, alternatives. Don't commit yet.
4. Deliver (converge): select and refine the best solution into a deliverable spec.

The two diamonds ensure you don't jump to a solution before understanding the problem (common LLM mistake). Use for product/design tasks where understanding the problem is as important as the solution.`,

  tools: ["bash"],
  relatedSkills: [],
}

export default spec