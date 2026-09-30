import { HubSubcommandSpec } from "../../hub-data"

import { TOOLS_BASH } from "../shared-spec-fragments"
const spec: HubSubcommandSpec = {
  label: "search",
  description: "Search skills by name, description, or content across all scopes",
  reminder: "Search skills by name, triggers, or content.",
  inline: true,

  detailedDescription: `Searches skills by content, triggers, name, or description. Case-insensitive matching across all scopes (built-in, user, project). Results are ranked by relevance.

Use to find a skill when you know roughly what it does but not its exact name.`,

  tools: TOOLS_BASH,
  relatedSkills: [],
}

export default spec