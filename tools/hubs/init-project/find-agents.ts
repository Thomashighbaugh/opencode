import { HubSubcommandSpec } from "../../hub-data"

const spec: HubSubcommandSpec = {
  label: "find-agents",
  description: "Discover agents relevant to the current project by searching across agent registries and GitHub — finds specialized subagents for detected tech stack. Used by setup/refresh to find per-repo agents",
  reminder: "Search registries for relevant project agents.",
  skill: "find-agents",

  detailedDescription: `Discovers agents relevant to the current project. Searches agent registries and GitHub for specialized subagents matching the detected tech stack.

Same pattern as /init-project find-skills but for agents: search, security-scan, recommend, install. Installed agents go to .opencode/agents/ (project scope) or agents/ (user scope).

Use during setup/refresh or standalone when you need specialized agents for the project's stack.`,

  tools: ["loadSkill", "bash"],
  relatedSkills: ["find-skills", "find-tools"],
}

export default spec