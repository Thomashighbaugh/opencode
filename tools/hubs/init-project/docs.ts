import { HubSubcommandSpec } from "../../hub-data"

const spec: HubSubcommandSpec = {
  label: "docs",
  description: "Generate hierarchical AGENTS.md documentation across the codebase",
  reminder: "Generate hierarchical AGENTS.md documentation.",
  skill: "deepinit",
  phases: "4",

  detailedDescription: `Generates hierarchical AGENTS.md documentation across the codebase using the deepinit skill. Scans each meaningful directory and writes an AGENTS.md with:

- What the directory/module does
- Key files and their purposes
- Patterns and conventions
- Dependencies
- Testing approach

Parent AGENTS.md files summarize; child files detail. An agent reading any AGENTS.md gets context for that directory.

Use to create AI-navigable documentation. Especially valuable before large refactoring or for onboarding new agents to a brownfield codebase.`,

  tools: ["loadSkill", "bash"],
  relatedSkills: [],
}

export default spec