import { HubSubcommandSpec } from "../../hub-data"

import { TOOLS_LOADSKILL_BASH } from "../shared-spec-fragments"
const spec: HubSubcommandSpec = {
  label: "find-agents",
  description: "Discover agents relevant to the current project by searching across agent registries and GitHub — finds specialized subagents for detected tech stack. Used by setup/refresh to find per-repo agents",
  reminder: "Search registries for relevant project agents.",
  skill: "find-agents",

  detailedDescription: `Discovers skill packages related to agent creation and configuration. Searches agent registries and GitHub for specialized agent instructions.

Note: The skills.sh ecosystem catalogs SKILL.md knowledge packages, not standalone agent .md definition files. Found packages provide instructions and workflows for:
- Creating custom agent definitions (agent .md files with frontmatter)
- Configuring agent tools, permissions, and models
- Agent lifecycle and best practices

Results are installed as skills, not agent files. To create actual agent .md files, use the \`opencode-agent-creator\` skill or the \`provision\` skill for project-scoped agents.

Use during setup/refresh or standalone.`,

  tools: TOOLS_LOADSKILL_BASH,
  relatedSkills: ["find-skills", "find-tools", "custom-agent-definitions", "creating-opencode-agents"],
}

export default spec