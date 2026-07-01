import { HubSubcommandSpec } from "../../hub-data"

const spec: HubSubcommandSpec = {
  label: "tag",
  description: "Audit and fix resource tags on global skills, agents, rules, and archetypes for resource_tags filtering — scan, classify, suggest, and apply tags via tag-resources skill",
  reminder: "Audit and fix resource tags for filtering.",
  skill: "tag-resources",

  detailedDescription: `Audits and fixes resource tags on global OpenCode resources (skills, agents, rules, archetypes). Tags enable resource_tags filtering — the mechanism that lets stack-recommender match resources to a detected stack.

Process:
1. Scan all resources for existing tags.
2. Classify: are tags accurate? Missing? Incorrect?
3. Suggest: propose tags based on resource content and metadata.
4. Apply: write corrected tags to resource frontmatter.

Properly tagged resources are discoverable by stack-recommender. Untagged or mis-tagged resources are invisible to recommendation. Use when setting up resources or when recommendations seem to miss obvious matches.`,

  tools: ["loadSkill", "bash"],
  relatedSkills: ["stack-recommender"],
}

export default spec