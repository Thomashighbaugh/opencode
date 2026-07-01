import { HubSubcommandSpec } from "../../hub-data"

const spec: HubSubcommandSpec = {
  label: "setup",
  description: "Interactive setup wizard — create skill directories, scan inventory, offer actions (add, list, scan conversation, import, done)",
  reminder: "Set up skill directories and inventory.",
  inline: true,

  detailedDescription: `Interactive setup wizard for skill directories. Steps:

1. Create skill directories if they don't exist (user + project scope).
2. Scan existing inventory in both scopes.
3. Offer actions: add a new skill, list existing, scan the current conversation for skill opportunities, import a skill from a file/URL, or done.

Use when first setting up skills for a project or user account.`,

  tools: ["bash"],
  relatedSkills: ["learner"],
}

export default spec