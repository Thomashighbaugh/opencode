import { HubSubcommandSpec } from "../../hub-data"

const spec: HubSubcommandSpec = {
  label: "find-tools",
  description: "Discover TypeScript tools relevant to the current project by searching registries (GitHub, npm) and local template catalog — finds project-specific automation tools. Used by setup/refresh to find per-repo tools",
  reminder: "Search registries for relevant project tools.",
  skill: "find-tools",

  detailedDescription: `Discovers TypeScript tools relevant to the project. Searches registries (GitHub, npm) and the local template catalog for automation tools matching the project's needs.

Installed tools go to .opencode/tools/ (project scope) or tools/ (user scope) and are auto-discovered by OpenCode.

Use during setup/refresh or standalone when you want project-specific automation tools (e.g. a deploy tool, a migration tool).`,

  tools: ["loadSkill", "bash"],
  relatedSkills: ["find-skills", "find-agents"],
}

export default spec