import { HubSubcommandSpec } from "../../hub-data"

import { TOOLS_BASH } from "../shared-spec-fragments"
const spec: HubSubcommandSpec = {
  label: "edit",
  description: "Interactively edit a skill's description, triggers, or content",
  reminder: "Edit skill metadata or content interactively.",
  inline: true,

  detailedDescription: `Edits an existing skill interactively. Finds the skill by name (searching user and project scopes), displays current values, and allows changing:

- Description
- Triggers
- Content (workflow, steps, heuristics)
- Name (rename, which also renames the directory)

Writes changes back to the skill file. Use to refine skills after creation or when their purpose evolves.`,

  tools: TOOLS_BASH,
  relatedSkills: [],
}

export default spec