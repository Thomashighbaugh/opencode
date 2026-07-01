import { HubSubcommandSpec } from "../../hub-data"

const spec: HubSubcommandSpec = {
  label: "architecture",
  description: "Analyze codebase for architectural friction, propose module-deepening refactors via John Ousterhout's deep module principle — parallel sub-agents explore, generate candidate refactors, produce markdown tables for comparison, then grill through your pick",
  reminder: "Surface deepening opportunities with markdown comparison tables.",
  skill: "improve-codebase-architecture",

  detailedDescription: `Architectural analysis applying John Ousterhout's "deep module" principle: modules should have small interfaces (shallow surface) hiding large implementations (deep capability). Shallow modules (large interface, tiny implementation) are architectural friction.

Process:
1. Parallel sub-agents explore the codebase, each looking for shallow modules — places where the interface is large relative to the implementation, or where coupling is high.
2. Each sub-agent generates candidate refactors that deepen the module (shrink the interface, grow the implementation).
3. Candidates are presented as markdown comparison tables for side-by-side evaluation.
4. The user picks a candidate, and it's grilled (via /ideation grill) to stress-test it before implementation.

Use for codebases that feel hard to change — where every change touches many files. The deepening refactors improve testability and navigability.`,

  tools: ["loadSkill", "listAgents", "bash"],
  relatedSkills: ["grilling"],
}

export default spec