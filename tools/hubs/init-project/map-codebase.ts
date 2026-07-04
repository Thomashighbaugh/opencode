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

The parallel agents produce a comprehensive codebase map that informs the subsequent setup phases. Use when taking over an existing codebase — you need to understand it before you can configure Hubs for it.

## Relationship to setup --full Phase 6

This subcommand is a standalone subset of Phase 6 (Context Capture) from the \`setup --full\` pipeline. The difference:

- \`map-codebase\` (standalone): Runs the parallel agent analysis only, outputs to state. Does NOT synthesize context files or upgrade agents. Use for one-off analysis.
- \`setup --full\` Phase 6: Runs the same parallel agents, THEN synthesizes their output into .opencode/context/ files, THEN upgrades Phase 4 agent wrappers with deep project knowledge. Full integration.

Use \`map-codebase\` when you want analysis without committing to a full setup. Use \`setup --full\` when you want the complete pipeline including agent upgrade.`,

  tools: ["listAgents", "bash"],
  relatedSkills: ["stack-recommender", "provision"],

  examples: [
    {
      input: "/init-project map-codebase",
      approach: "Spawns 3 parallel agents: @stack-detector for tech stack, @architect for module structure and patterns, @convention-extractor for coding conventions. Saves combined analysis to .opencode/state/init/codebase-map.json. Does NOT synthesize context or upgrade agents — use /init-project setup --full for that."
    }
  ]
}

export default spec