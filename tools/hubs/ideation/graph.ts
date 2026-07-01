import { HubSubcommandSpec } from "../../hub-data"

const spec: HubSubcommandSpec = {
  label: "graph",
  description: "Visual relationship mapping — dependencies, components, tradeoffs",
  reminder: "Map relationships as visual graphs.",
  skill: "graph-thinking",

  detailedDescription: `Applies graph-based thinking to visualize complex relationships. Maps entities (components, modules, concepts) as nodes and their relationships (dependencies, data flow, constraints) as edges. The resulting graph reveals structure that linear descriptions hide: cycles, hubs, isolated clusters, critical paths.

Use for: dependency analysis, architecture mapping, concept relationship exploration, and system design where understanding structure matters. The graph is rendered as a text/markdown diagram (Mermaid or ASCII) since this is a non-interactive environment.

Output: a graph diagram + analysis (key nodes, cycles, clusters, recommendations) saved to .opencode/state/ideation/work-products/.`,

  tools: ["loadSkill", "bash"],
  relatedSkills: [],
}

export default spec