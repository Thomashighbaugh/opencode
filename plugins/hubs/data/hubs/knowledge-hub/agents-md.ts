import { HubSubcommandSpec } from "../../hub-data"

import { TOOLS_LOADSKILL_BASH } from "../shared-spec-fragments"
const spec: HubSubcommandSpec = {
  label: "agents-md",
  description: "Update root AGENTS.md and write one per directory explaining what is there",
  reminder: "Recursively writes AGENTS.md for the project root and every meaningful subdirectory.",
  skill: "deepinit",

  detailedDescription: `Updates the project's root AGENTS.md and recursively ensures every meaningful directory has its own AGENTS.md file that explains what lives there and why — the same role a README plays for a directory, but for the agent's navigation of the codebase.

Process:
1. Scan the project root for meaningful directories (source, config, tests, scripts, tools, skills, agents, rules, plugins, etc.).
2. Write or update the root AGENTS.md to describe the project as a whole and list top-level directories.
3. For each meaningful subdirectory, write an AGENTS.md that documents:
   - What the directory/module does
   - Key files and their purposes
   - Patterns and conventions used there
   - Dependencies and relationships
   - Testing approach (if applicable)
4. Parent AGENTS.md files summarize; child AGENTS.md files detail. An agent reading any AGENTS.md gets context for that directory without needing to read the code.

Each directory AGENTS.md serves the same purpose as a README in that location: it explains what is there and why, so anyone (human or agent) entering the directory understands its role in the project.

Use when the codebase has grown enough that navigating it requires documentation at every level, or when onboarding new agents to a brownfield codebase.`,

  tools: TOOLS_LOADSKILL_BASH,
  rules: ["context-strategy", "file-operations"],
  relatedSkills: ["deepinit", "readme-updater"],
}

export default spec
