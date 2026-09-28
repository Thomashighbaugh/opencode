import { HubSubcommandSpec } from "../../hub-data"

import { TOOLS_LOADSKILL_BASH } from "../shared-spec-fragments"
const spec: HubSubcommandSpec = {
  label: "tag",
  description: "Audit and fix resource tags on global skills, agents, rules, and archetypes for resource_tags filtering — scan, classify, suggest, and apply tags via tag-resources skill",
  reminder: "Audit and fix resource tags for filtering.",
  skill: "tag-resources",

  detailedDescription: `Audits and fixes resource tags on global OpenCode resources (skills, agents, rules, archetypes). Tags enable resource_tags filtering — the mechanism that lets stack-recommender match resources to a detected stack.

Each archetype contains four subdirectories: agents/, rules/, skills/, and tools/. When provisioning a project, all four must be included: agents/ and rules/ are referenced in opencode.jsonc (via the agent and instructions keys), while skills/ and tools/ must be copied or linked into the project's .opencode/ directory so that agents and rules which reference them resolve correctly.

Process:
1. Scan all resources for existing tags.
2. Classify: are tags accurate? Missing? Incorrect?
3. Suggest: propose tags based on resource content and metadata.
4. Apply: write corrected tags to resource frontmatter.

Properly tagged resources are discoverable by stack-recommender. Untagged or mis-tagged resources are invisible to recommendation. Use when setting up resources or when recommendations seem to miss obvious matches.`,

  tools: TOOLS_LOADSKILL_BASH,
  relatedSkills: ["stack-recommender"],
}

export default spec