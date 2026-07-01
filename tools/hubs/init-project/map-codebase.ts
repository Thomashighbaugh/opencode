import { HubSubcommandSpec } from "../../hub-data"

const spec: HubSubcommandSpec = {
  label: "map-codebase",
  description: "Analyze existing brownfield codebase — spawn parallel agents to map stack, architecture, conventions, and integration points before init",
  reminder: "Map codebase via parallel agent analysis.",
  inline: true,

  detailedDescription: `Maps an existing brownfield codebase before full init. Spawns parallel agents to analyze:

- Stack detection (@stack-detector): languages, frameworks, tools.
- Architecture (@architect): module structure, patterns, coupling.
- Conventions (@convention-extractor): naming, file org, error handling, testing patterns.
- Integration points: external services, APIs, databases.

The parallel agents produce a comprehensive codebase map that informs the subsequent setup phases. Use when taking over an existing codebase — you need to understand it before you can configure Hubs for it.`,

  tools: ["listAgents", "bash"],
  relatedSkills: ["stack-recommender", "provision"],
}

export default spec