import { HubSubcommandSpec } from "../../hub-data"

const spec: HubSubcommandSpec = {
  label: "edit",
  description: "Edit an existing skill interactively — find by name, display current values, change description/triggers/content/rename, write back",
  reminder: "Edit skill metadata or content interactively.",
  inline: true,

  detailedDescription: `Edits an existing skill interactively. Finds the skill by name (searching user and project scopes), displays current values, and allows changing:

- Description
- Triggers
- Content (workflow, steps, heuristics)
- Name (rename, which also renames the directory)

Writes changes back to the skill file. Use to refine skills after creation or when their purpose evolves.`,

  tools: ["bash"],
  relatedSkills: [],
}

export default spec