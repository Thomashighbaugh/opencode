import { HubSubcommandSpec } from "../../hub-data"

import { TOOLS_LOADSKILL_BASH } from "../shared-spec-fragments"
const spec: HubSubcommandSpec = {
  label: "tag",
  description: "Audit and repair resource tags used by stack filtering",
  reminder: "Audit and fix resource tags for filtering.",
  skill: "tag-resources",

  detailedDescription: `Audits and fixes resource tags on global OpenCode resources (skills, agents, rules, hint packs). Tags are the metadata stack-recommender matches against a detected stack.

Archetypes are hint packs (templates/projects/*/manifest.json) carrying hints, research pointers, and preferences. Their manifest tags must accurately describe the stack so matching works; nothing is copied from a pack — provisioning synthesizes the project config.

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