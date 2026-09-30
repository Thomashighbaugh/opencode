import { HubSubcommandSpec } from "../../hub-data"

import { TOOLS_LOADSKILL_BASH } from "../shared-spec-fragments"
const spec: HubSubcommandSpec = {
  label: "find-tools",
  description: "Find and vet TypeScript tools for this stack from registries",
  reminder: "Search registries for relevant project tools.",
  skill: "find-tools",

  detailedDescription: `Discovers TypeScript tools relevant to the project. Searches registries (GitHub, npm) and the local template catalog for automation tools matching the project's needs.

Installed tools go to .opencode/tools/ (project scope — never user/global scope) and are auto-discovered by OpenCode.

Use during setup/refresh or standalone when you want project-specific automation tools (e.g. a deploy tool, a migration tool).`,

  tools: TOOLS_LOADSKILL_BASH,
  relatedSkills: ["find-skills", "find-agents"],
}

export default spec