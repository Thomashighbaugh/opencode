import { HubSubcommandSpec } from "../../hub-data"

const spec: HubSubcommandSpec = {
  label: "rule",
  description: "Create a project rule (.opencode/rules/)",
  reminder: "Create a project rule file.",
  inline: true,

  detailedDescription: `Creates a project-specific rule file in .opencode/rules/. Rules are loaded as agent instructions at startup and constrain agent behavior within the project.

A rule file is a markdown document with:
- A description (what the rule enforces)
- The rule body (what agents must/must not do)
- BAD/GOOD examples where applicable
- Tags for resource filtering

Rules are project-scoped (loaded only for this project) vs global rules in ~/.config/opencode/rules/ (loaded for all projects). Use for conventions that are project-specific: "all API responses must include a request-id header", "database migrations must be reversible", "no direct DB access outside repositories".`,

  tools: ["bash"],
  relatedSkills: ["rule-generator"],
}

export default spec