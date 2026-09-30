import { HubSubcommandSpec } from "../../hub-data"

import { TOOLS_LOADSKILL_BASH } from "../shared-spec-fragments"
const spec: HubSubcommandSpec = {
  label: "find-rules",
  description: "Find and vet rules for this stack from registries and templates",
  reminder: "Search registries for relevant project rules.",
  skill: "find-rules",

  detailedDescription: `Discovers OpenCode rules relevant to the project. Searches registries (GitHub, skills.sh) and the local template catalog for convention and guideline rules matching the project's stack and practices.

Installed rules go to .opencode/rules/ (project scope) and are loaded as agent instructions.

Use during setup/refresh or standalone when you want project-specific coding conventions enforced as rules.`,

  tools: TOOLS_LOADSKILL_BASH,
  relatedSkills: ["find-skills", "find-agents", "find-tools"],
}

export default spec