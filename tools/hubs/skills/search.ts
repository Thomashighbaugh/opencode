import { HubSubcommandSpec } from "../../hub-data"

const spec: HubSubcommandSpec = {
  label: "search",
  description: "Search skills by content, triggers, name, or description — case-insensitive matching across all scopes, ranked by relevance",
  reminder: "Search skills by name, triggers, or content.",
  inline: true,

  detailedDescription: `Searches skills by content, triggers, name, or description. Case-insensitive matching across all scopes (built-in, user, project). Results are ranked by relevance.

Use to find a skill when you know roughly what it does but not its exact name.`,

  tools: ["bash"],
  relatedSkills: [],
}

export default spec