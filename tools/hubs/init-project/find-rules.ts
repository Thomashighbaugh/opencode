import { HubSubcommandSpec } from "../../hub-data"

const spec: HubSubcommandSpec = {
  label: "find-rules",
  description: "Discover OpenCode rules relevant to the current project by searching registries (GitHub, skills.sh) and local template catalog — finds project-specific conventions and guidelines. Used by setup/refresh to find per-repo rules",
  reminder: "Search registries for relevant project rules.",
  skill: "find-rules",

  detailedDescription: `Discovers OpenCode rules relevant to the project. Searches registries (GitHub, skills.sh) and the local template catalog for convention and guideline rules matching the project's stack and practices.

Installed rules go to .opencode/rules/ (project scope) and are loaded as agent instructions.

Use during setup/refresh or standalone when you want project-specific coding conventions enforced as rules.`,

  tools: ["loadSkill", "bash"],
  relatedSkills: ["find-skills", "find-agents", "find-tools"],
}

export default spec