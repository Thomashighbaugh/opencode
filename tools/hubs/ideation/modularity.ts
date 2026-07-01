import { HubSubcommandSpec } from "../../hub-data"

const spec: HubSubcommandSpec = {
  label: "modularity",
  description: "Analyze module boundaries, coupling and cohesion — detect circular dependencies, suggest reorganization for cleaner module isolation",
  reminder: "Analyze module boundaries and coupling.",
  agent: "architect",

  detailedDescription: `Module boundary analysis via the @architect agent. Examines:

- Coupling: which modules depend on which (dependency graph).
- Cohesion: are module contents related (high cohesion = good) or grab-bags (low cohesion = bad)?
- Circular dependencies: A→B→A cycles that make changes cascade and testing hard.
- Boundary clarity: are module interfaces well-defined or leaky?

The architect produces a modularity report with: the dependency graph, circular dependency hotspots, low-cohesion modules, and reorganization recommendations (extract this, merge these, break that cycle).

Use when the codebase feels "tangled" — changes in one place break unrelated things, tests require extensive mocking, or adding a feature touches many modules.`,

  tools: ["listAgents", "bash"],
  relatedSkills: ["improve-codebase-architecture"],
}

export default spec