import { HubSubcommandSpec } from "../../hub-data"

const spec: HubSubcommandSpec = {
  label: "remove",
  description: "Remove a skill by name — searches user and project scopes, confirms before deleting, warns if not found",
  reminder: "Delete a skill after confirmation.",
  inline: true,

  detailedDescription: `Removes a skill by name. Searches both user and project scopes, shows what will be deleted, and asks for confirmation before removing. Warns if the skill isn't found in either scope.

Non-destructive by default — requires explicit confirmation. Use to clean up skills that are no longer needed.`,

  tools: ["bash"],
  relatedSkills: [],
}

export default spec